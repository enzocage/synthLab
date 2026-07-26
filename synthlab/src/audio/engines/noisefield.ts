// 8. noisefield: gefiltertes Rauschen durch mehrere Bandpass-/Formant-Bänder,
// mit langsam wandernden Bandmitten für "atmende" Nebelflächen.
// Rollen: texture, fx, pad.
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { AdsrGain } from "./shared/envelope";
import { createNoiseSource } from "./shared/noise";
import { midiToHz } from "./shared/util";

const params: ParamSpec[] = [
  { id: "noiseColor", label: "Rauschfarbe", kind: "enum", options: ["white", "pink", "brown"], default: "pink", group: "source" },
  { id: "bandCount", label: "Bänder", kind: "int", min: 1, max: 6, default: 3, group: "bands" },
  { id: "bandSpread", label: "Band-Streuung", kind: "float", min: 0.2, max: 4, default: 1, group: "bands", mutationWeight: 0.7 },
  { id: "bandQ", label: "Band-Q", kind: "float", min: 1, max: 30, default: 6, group: "bands", mutationWeight: 0.7 },
  { id: "breathRateHz", label: "Atem-Rate", kind: "float", min: 0.02, max: 1, default: 0.1, unit: "Hz", group: "motion", mutationWeight: 0.6 },
  { id: "breathDepth", label: "Atem-Tiefe", kind: "float", min: 0, max: 1, default: 0.5, group: "motion" },
  { id: "attack", label: "Attack", kind: "float", min: 0.1, max: 12, default: 2.5, curve: "log", unit: "s", group: "env" },
  { id: "release", label: "Release", kind: "float", min: 0.2, max: 20, default: 6, curve: "log", unit: "s", group: "env" },
  { id: "sustain", label: "Sustain", kind: "float", min: 0, max: 1, default: 0.9, group: "env" },
];

class NoiseFieldVoice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private source: AudioBufferSourceNode;
  private bands: BiquadFilterNode[] = [];
  private lfos: OscillatorNode[] = [];
  private ampEnv: AdsrGain;
  private releaseSeconds: number;

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    const freq = midiToHz(note);
    const bandCount = Math.round(Number(values.bandCount));
    const spread = Number(values.bandSpread);
    const q = Number(values.bandQ);
    const breathRate = Number(values.breathRateHz);
    const breathDepth = Number(values.breathDepth);
    this.releaseSeconds = Number(values.release);

    this.source = createNoiseSource(this.ctx, values.noiseColor as "white" | "pink" | "brown");

    this.ampEnv = new AdsrGain(this.ctx, {
      attack: Number(values.attack),
      decay: 0.01,
      sustain: Number(values.sustain),
      release: this.releaseSeconds,
    });
    this.output = this.ampEnv.node;

    const mix = this.ctx.createGain();
    mix.gain.value = 1 / Math.sqrt(bandCount);
    mix.connect(this.ampEnv.node);

    for (let i = 0; i < bandCount; i++) {
      const centerBase = freq * Math.pow(2, i * spread * 0.8);
      const band = this.ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = Math.min(centerBase, 16000);
      band.Q.value = q;

      const lfo = this.ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = breathRate * (0.7 + Math.random() * 0.6);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 1200 * breathDepth; // in Cent: +-1 Oktave * Atem-Tiefe
      lfo.connect(lfoGain).connect(band.detune);

      this.source.connect(band).connect(mix);
      this.bands.push(band);
      this.lfos.push(lfo);
    }
  }

  trigger(velocity: number, time: number): void {
    this.source.start(time);
    for (const l of this.lfos) l.start(time);
    this.ampEnv.trigger(velocity, time);
  }

  release(time: number): void {
    this.ampEnv.release(time);
    const stopAt = time + this.releaseSeconds + 0.05;
    try { this.source.stop(stopAt); } catch { /* noop */ }
    for (const l of this.lfos) { try { l.stop(stopAt); } catch { /* noop */ } }
  }

  stop(time: number, fadeSeconds = 0.02): void {
    this.ampEnv.stop(time, fadeSeconds);
    const stopAt = time + fadeSeconds + 0.01;
    try { this.source.stop(stopAt); } catch { /* noop */ }
    for (const l of this.lfos) { try { l.stop(stopAt); } catch { /* noop */ } }
  }

  setParam(paramId: string, value: number | string | boolean, time: number): void {
    if (paramId === "bandQ") for (const b of this.bands) b.Q.setTargetAtTime(Number(value), time, 0.02);
  }

  isFinished(time: number): boolean {
    return this.ampEnv.isFinished(time);
  }

  dispose(): void {
    try { this.source.disconnect(); } catch { /* noop */ }
    for (const b of this.bands) b.disconnect();
    for (const l of this.lfos) { try { l.disconnect(); } catch { /* noop */ } }
    this.ampEnv.node.disconnect();
  }
}

export const noisefieldEngine: Engine = {
  id: "noisefield",
  name: "Noise Field",
  params,
  defaultMacroMap: {
    brightness: [{ paramId: "bandSpread", atZero: 0.3, atOne: 3 }],
    motion: [{ paramId: "breathRateHz", atZero: 0.02, atOne: 0.8 }],
    density: [{ paramId: "bandCount", atZero: 1, atOne: 6 }],
    space: [{ paramId: "release", atZero: 0.5, atOne: 18 }],
    air: [{ paramId: "breathDepth", atZero: 0, atOne: 1 }],
  },
  createVoice(globals, values, note) {
    return new NoiseFieldVoice(globals, note, values);
  },
};

export function noisefieldDefaults(): ParamValues {
  return defaultParamValues(params);
}
