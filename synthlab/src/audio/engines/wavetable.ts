// 2. wavetable: Wavetable-Morph über interpolierte Harmonische (PeriodicWave),
// periodisch neu berechnet für langsames "evolving pad"-Driften.
// Rollen: pad, synth, fx. Siehe research/derived/synthesis-methods.json#wavetable.
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { AdsrGain } from "./shared/envelope";
import { midiToHz } from "./shared/util";

const N_HARM = 16;

// 4 feste Frames als Harmonic-Amplitude-Arrays (Index 0 = Grundton).
function frame(fn: (h: number) => number): Float64Array {
  const a = new Float64Array(N_HARM);
  for (let h = 1; h < N_HARM; h++) a[h] = fn(h);
  return a;
}
const FRAMES = [
  frame((h) => 1 / h), // saw-artig, hell
  frame((h) => (h % 2 === 1 ? 1 / h : 0)), // hohl, quadratisch
  frame((h) => Math.exp(-h / 4)), // glockig/glasartig
  frame((h) => (h === 1 ? 1 : h === 2 ? 0.4 : h === 5 ? 0.3 : 0.05 / h)), // formantartig
];

function interpolateFrames(position: number): { real: Float32Array<ArrayBuffer>; imag: Float32Array<ArrayBuffer> } {
  const p = Math.max(0, Math.min(0.999, position)) * (FRAMES.length - 1);
  const i0 = Math.floor(p);
  const i1 = Math.min(i0 + 1, FRAMES.length - 1);
  const t = p - i0;
  const real = new Float32Array(new ArrayBuffer(N_HARM * 4));
  const imag = new Float32Array(new ArrayBuffer(N_HARM * 4));
  for (let h = 0; h < N_HARM; h++) {
    real[h] = FRAMES[i0][h] * (1 - t) + FRAMES[i1][h] * t;
  }
  return { real, imag };
}

const params: ParamSpec[] = [
  { id: "tablePosition", label: "Tabellenposition", kind: "float", min: 0, max: 1, default: 0.2, group: "osc", mutationWeight: 0.9 },
  { id: "morphRate", label: "Morph-Rate", kind: "float", min: 0, max: 0.3, default: 0.02, unit: "1/s", group: "osc", mutationWeight: 0.7 },
  { id: "morphDepth", label: "Morph-Tiefe", kind: "float", min: 0, max: 1, default: 0.4, group: "osc" },
  { id: "detuneCents", label: "Detune", kind: "float", min: -50, max: 50, default: 6, unit: "ct", group: "osc" },
  { id: "voices", label: "Stimmen", kind: "int", min: 1, max: 4, default: 2, group: "osc" },
  { id: "cutoffHz", label: "Cutoff", kind: "float", min: 100, max: 16000, default: 4000, curve: "log", unit: "Hz", group: "filter", smooth: true },
  { id: "attack", label: "Attack", kind: "float", min: 0.01, max: 10, default: 2, curve: "log", unit: "s", group: "env" },
  { id: "release", label: "Release", kind: "float", min: 0.1, max: 25, default: 6, curve: "log", unit: "s", group: "env" },
  { id: "sustain", label: "Sustain", kind: "float", min: 0, max: 1, default: 0.8, group: "env" },
];

class WavetableVoice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private oscs: OscillatorNode[] = [];
  private filter: BiquadFilterNode;
  private ampEnv: AdsrGain;
  private morphTimer: ReturnType<typeof setInterval> | null = null;
  private phase = 0;
  private position: number;
  private morphRate: number;
  private morphDepth: number;
  private releaseSeconds: number;
  private disposed = false;

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    const freq = midiToHz(note);
    const voices = Math.round(Number(values.voices));
    const detune = Number(values.detuneCents);
    this.position = Number(values.tablePosition);
    this.morphRate = Number(values.morphRate);
    this.morphDepth = Number(values.morphDepth);
    this.releaseSeconds = Number(values.release);

    const mix = this.ctx.createGain();
    mix.gain.value = voices > 1 ? 1 / Math.sqrt(voices) : 1;

    const wave = this.ctx.createPeriodicWave(...toPeriodicWaveArgs(interpolateFrames(this.position)));
    for (let i = 0; i < voices; i++) {
      const osc = this.ctx.createOscillator();
      osc.setPeriodicWave(wave);
      osc.frequency.value = freq;
      const t = voices === 1 ? 0 : i / (voices - 1) - 0.5;
      osc.detune.value = t * detune;
      osc.connect(mix);
      this.oscs.push(osc);
    }

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = Number(values.cutoffHz);
    mix.connect(this.filter);

    this.ampEnv = new AdsrGain(this.ctx, {
      attack: Number(values.attack),
      decay: 0.01,
      sustain: Number(values.sustain),
      release: Number(values.release),
    });
    this.filter.connect(this.ampEnv.node);
    this.output = this.ampEnv.node;
  }

  private startMorphDrift() {
    if (this.morphRate <= 0) return;
    this.morphTimer = setInterval(() => {
      if (this.disposed) return;
      this.phase += this.morphRate * 0.15;
      const drift = (Math.sin(this.phase) * 0.5 + 0.5) * this.morphDepth;
      const pos = Math.max(0, Math.min(1, this.position + drift - this.morphDepth / 2));
      const wave = this.ctx.createPeriodicWave(...toPeriodicWaveArgs(interpolateFrames(pos)));
      for (const osc of this.oscs) osc.setPeriodicWave(wave);
    }, 150);
  }

  trigger(velocity: number, time: number): void {
    for (const osc of this.oscs) osc.start(time);
    this.ampEnv.trigger(velocity, time);
    this.startMorphDrift();
  }

  release(time: number): void {
    this.ampEnv.release(time);
    const stopAt = time + this.releaseSeconds + 0.05;
    for (const osc of this.oscs) { try { osc.stop(stopAt); } catch { /* noop */ } }
  }

  stop(time: number, fadeSeconds = 0.02): void {
    this.ampEnv.stop(time, fadeSeconds);
    for (const osc of this.oscs) { try { osc.stop(time + fadeSeconds + 0.01); } catch { /* noop */ } }
  }

  setParam(paramId: string, value: number | string | boolean): void {
    if (paramId === "cutoffHz") this.filter.frequency.setTargetAtTime(Number(value), this.ctx.currentTime, 0.01);
    if (paramId === "tablePosition") this.position = Number(value);
    if (paramId === "morphRate") this.morphRate = Number(value);
    if (paramId === "morphDepth") this.morphDepth = Number(value);
  }

  isFinished(time: number): boolean {
    return this.ampEnv.isFinished(time);
  }

  dispose(): void {
    this.disposed = true;
    if (this.morphTimer) clearInterval(this.morphTimer);
    for (const osc of this.oscs) { try { osc.disconnect(); } catch { /* noop */ } }
    this.filter.disconnect();
    this.ampEnv.node.disconnect();
  }
}

function toPeriodicWaveArgs(spec: { real: Float32Array<ArrayBuffer>; imag: Float32Array<ArrayBuffer> }): [Float32Array<ArrayBuffer>, Float32Array<ArrayBuffer>] {
  return [spec.real, spec.imag];
}

export const wavetableEngine: Engine = {
  id: "wavetable",
  name: "Wavetable",
  params,
  defaultMacroMap: {
    brightness: [{ paramId: "cutoffHz", atZero: 300, atOne: 12000 }],
    motion: [{ paramId: "morphRate", atZero: 0, atOne: 0.25 }],
    density: [{ paramId: "voices", atZero: 1, atOne: 4 }],
    detune: [{ paramId: "detuneCents", atZero: 0, atOne: 40 }],
    space: [{ paramId: "release", atZero: 0.5, atOne: 20 }],
    air: [{ paramId: "tablePosition", atZero: 0, atOne: 0.9 }],
  },
  createVoice(globals, values, note) {
    return new WavetableVoice(globals, note, values);
  },
};

export function wavetableDefaults(): ParamValues {
  return defaultParamValues(params);
}
