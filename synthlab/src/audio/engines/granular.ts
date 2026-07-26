// 5. granular: Granularwolke aus einem intern synthetisierten Quellbuffer
// (mehrzyklige harmonische Welle + Rauschanteil). Grain-Fenster überlappen
// >=50% der Grain-Länge (ambient-rules.json: granular_click_free).
// Rollen: texture, fx, pad.
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { AdsrGain } from "./shared/envelope";
import { midiToHz } from "./shared/util";

const SOURCE_SECONDS = 2.5;

function buildSourceBuffer(ctx: BaseAudioContext, freq: number, noiseMix: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * SOURCE_SECONDS);
  const buf = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buf.getChannelData(0);
  const harmonics = [1, 2, 3, 4, 5, 6, 8];
  const weights = harmonics.map((h) => 1 / h);
  for (let i = 0; i < length; i++) {
    const t = i / ctx.sampleRate;
    let s = 0;
    for (let h = 0; h < harmonics.length; h++) {
      s += weights[h] * Math.sin(2 * Math.PI * freq * harmonics[h] * t + h);
    }
    s /= harmonics.length;
    const noise = Math.random() * 2 - 1;
    data[i] = s * (1 - noiseMix) + noise * noiseMix * 0.5;
  }
  return buf;
}

const params: ParamSpec[] = [
  { id: "grainSizeMs", label: "Grain-Größe", kind: "float", min: 20, max: 300, default: 90, unit: "ms", group: "grain", mutationWeight: 0.7 },
  { id: "density", label: "Dichte", kind: "float", min: 2, max: 60, default: 18, unit: "/s", group: "grain", mutationWeight: 0.6 },
  { id: "positionSpread", label: "Positions-Streuung", kind: "float", min: 0, max: 1, default: 0.5, group: "grain" },
  { id: "pitchJitterCents", label: "Pitch-Jitter", kind: "float", min: 0, max: 100, default: 15, unit: "ct", group: "grain" },
  { id: "noiseMix", label: "Rauschanteil", kind: "float", min: 0, max: 1, default: 0.25, group: "grain" },
  { id: "positionDriftHz", label: "Positions-Drift", kind: "float", min: 0, max: 0.5, default: 0.05, unit: "Hz", group: "grain" },
  { id: "attack", label: "Attack", kind: "float", min: 0.05, max: 8, default: 1, curve: "log", unit: "s", group: "env" },
  { id: "release", label: "Release", kind: "float", min: 0.1, max: 15, default: 3, curve: "log", unit: "s", group: "env" },
  { id: "sustain", label: "Sustain", kind: "float", min: 0, max: 1, default: 0.9, group: "env" },
];

class GranularVoice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private ampEnv: AdsrGain;
  private buffer: AudioBuffer;
  private grainSizeS: number;
  private density: number;
  private positionSpread: number;
  private pitchJitterCents: number;
  private positionDriftHz: number;
  private schedulerId: ReturnType<typeof setInterval> | null = null;
  private nextGrainTime = 0;
  private startTime = 0;
  private releaseSeconds: number;
  private stopped = false;
  private activeGrainSources: AudioBufferSourceNode[] = [];

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    const freq = midiToHz(note);
    this.buffer = buildSourceBuffer(this.ctx, freq, Number(values.noiseMix));
    this.grainSizeS = Number(values.grainSizeMs) / 1000;
    this.density = Number(values.density);
    this.positionSpread = Number(values.positionSpread);
    this.pitchJitterCents = Number(values.pitchJitterCents);
    this.positionDriftHz = Number(values.positionDriftHz);
    this.releaseSeconds = Number(values.release);

    this.ampEnv = new AdsrGain(this.ctx, {
      attack: Number(values.attack),
      decay: 0.01,
      sustain: Number(values.sustain),
      release: this.releaseSeconds,
    });
    this.output = this.ampEnv.node;
  }

  private scheduleGrain(when: number) {
    const overlapRatio = 0.5; // ambient-rules.json: granular_click_free, min 50% Fensterüberlappung
    const windowFade = this.grainSizeS * overlapRatio;

    const t = (when - this.startTime) * this.positionDriftHz;
    const center = (Math.sin(t * Math.PI * 2) * 0.5 + 0.5) * this.buffer.duration;
    const spreadRange = this.positionSpread * this.buffer.duration * 0.3;
    const offset = Math.max(
      0,
      Math.min(this.buffer.duration - this.grainSizeS - 0.01, center + (Math.random() * 2 - 1) * spreadRange)
    );

    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    src.detune.value = (Math.random() * 2 - 1) * this.pitchJitterCents;

    const win = this.ctx.createGain();
    win.gain.value = 0;
    win.gain.setValueAtTime(0, when);
    win.gain.linearRampToValueAtTime(1, when + windowFade);
    win.gain.linearRampToValueAtTime(0, when + this.grainSizeS);

    src.connect(win).connect(this.ampEnv.node);
    src.start(when, offset, this.grainSizeS + 0.02);
    src.stop(when + this.grainSizeS + 0.03);

    this.activeGrainSources.push(src);
    if (this.activeGrainSources.length > 128) this.activeGrainSources.shift();
    src.onended = () => { try { src.disconnect(); win.disconnect(); } catch { /* noop */ } };
  }

  private runScheduler() {
    const lookahead = 0.2;
    const interval = 30;
    this.schedulerId = setInterval(() => {
      if (this.stopped) return;
      const now = this.ctx.currentTime;
      const grainInterval = 1 / Math.max(this.density, 0.1);
      while (this.nextGrainTime < now + lookahead) {
        this.scheduleGrain(Math.max(this.nextGrainTime, now));
        this.nextGrainTime += grainInterval;
      }
    }, interval);
  }

  trigger(velocity: number, time: number): void {
    this.startTime = time;
    this.nextGrainTime = time;
    this.ampEnv.trigger(velocity, time);
    this.runScheduler();
  }

  release(time: number): void {
    this.ampEnv.release(time);
    setTimeout(() => this.stopScheduler(), (this.releaseSeconds + 0.2) * 1000);
  }

  private stopScheduler() {
    this.stopped = true;
    if (this.schedulerId) clearInterval(this.schedulerId);
  }

  stop(time: number, fadeSeconds = 0.02): void {
    this.ampEnv.stop(time, fadeSeconds);
    this.stopScheduler();
    for (const src of this.activeGrainSources) { try { src.stop(time + fadeSeconds); } catch { /* noop */ } }
  }

  setParam(paramId: string, value: number | string | boolean): void {
    if (paramId === "density") this.density = Number(value);
    if (paramId === "grainSizeMs") this.grainSizeS = Number(value) / 1000;
    if (paramId === "positionSpread") this.positionSpread = Number(value);
    if (paramId === "pitchJitterCents") this.pitchJitterCents = Number(value);
    if (paramId === "positionDriftHz") this.positionDriftHz = Number(value);
  }

  isFinished(time: number): boolean {
    return this.ampEnv.isFinished(time);
  }

  dispose(): void {
    this.stopScheduler();
    for (const src of this.activeGrainSources) { try { src.disconnect(); } catch { /* noop */ } }
    this.ampEnv.node.disconnect();
  }
}

export const granularEngine: Engine = {
  id: "granular",
  name: "Granular",
  params,
  defaultMacroMap: {
    density: [{ paramId: "density", atZero: 2, atOne: 50 }],
    motion: [{ paramId: "positionDriftHz", atZero: 0, atOne: 0.4 }],
    space: [{ paramId: "positionSpread", atZero: 0, atOne: 1 }],
    detune: [{ paramId: "pitchJitterCents", atZero: 0, atOne: 80 }],
    air: [{ paramId: "noiseMix", atZero: 0, atOne: 0.8 }],
    brightness: [{ paramId: "grainSizeMs", atZero: 250, atOne: 25 }],
  },
  createVoice(globals, values, note) {
    return new GranularVoice(globals, note, values);
  },
};

export function granularDefaults(): ParamValues {
  return defaultParamValues(params);
}
