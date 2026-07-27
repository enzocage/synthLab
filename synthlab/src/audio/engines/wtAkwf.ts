// 21. wt-akwf: Wavetable-Engine über echte Single-Cycle-Wellenformen aus
// Adventure Kid Waveforms (AKWF-FREE, CC0-1.0, siehe research/LICENSES.md).
// 261 kuratierte Original-Wellenformen (von 4162), als PeriodicWave-Fourier-
// Koeffizienten importiert (research/extract/import-akwf.mjs). Die Engine scannt
// zwischen zwei Wellenform-Indizes der Bank - klassische "Wavetable-Scan"-Technik,
// hier aber mit echten, aus Hardware-Zyklen gesampelten Wellenformen statt
// synthetischer Frames (Unterschied zur bestehenden `wavetable`-Engine).
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { AdsrGain } from "./shared/envelope";
import { midiToHz } from "./shared/util";
import akwfBank from "../../data/derived/akwf-waves.json";

interface AkwfWave {
  id: string;
  real: number[];
  imag: number[];
}

const WAVES = (akwfBank as unknown as { waves: AkwfWave[] }).waves;
const WAVE_COUNT = WAVES.length;

export const AKWF_WAVE_IDS = WAVES.map((w) => w.id);

function waveAt(index: number): AkwfWave {
  const i = ((Math.round(index) % WAVE_COUNT) + WAVE_COUNT) % WAVE_COUNT;
  return WAVES[i];
}

function blendedPeriodicWave(ctx: BaseAudioContext, indexA: number, indexB: number, t: number): PeriodicWave {
  const a = waveAt(indexA);
  const b = waveAt(indexB);
  const n = a.real.length;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    real[i] = a.real[i] * (1 - t) + b.real[i] * t;
    imag[i] = a.imag[i] * (1 - t) + b.imag[i] * t;
  }
  return ctx.createPeriodicWave(real, imag);
}

const params: ParamSpec[] = [
  { id: "waveIndex", label: "Wellenform", kind: "int", min: 0, max: WAVE_COUNT - 1, default: 0, group: "osc", mutationWeight: 0.9 },
  { id: "scanRange", label: "Scan-Reichweite", kind: "int", min: 1, max: 40, default: 8, group: "osc" },
  { id: "scanPosition", label: "Scan-Position", kind: "float", min: 0, max: 1, default: 0, group: "osc", mutationWeight: 0.7 },
  { id: "scanRateHz", label: "Scan-Rate", kind: "float", min: 0, max: 2, default: 0, unit: "Hz", group: "osc", mutationWeight: 0.6 },
  { id: "unisonVoices", label: "Unison", kind: "int", min: 1, max: 5, default: 2, group: "osc" },
  { id: "detuneCents", label: "Detune", kind: "float", min: 0, max: 40, default: 8, unit: "ct", group: "osc" },
  { id: "cutoffHz", label: "Cutoff", kind: "float", min: 100, max: 16000, default: 5000, curve: "log", unit: "Hz", group: "filter", smooth: true },
  { id: "resonance", label: "Resonanz", kind: "float", min: 0.1, max: 12, default: 1, group: "filter", smooth: true },
  { id: "attack", label: "Attack", kind: "float", min: 0.001, max: 8, default: 0.05, curve: "log", unit: "s", group: "env" },
  { id: "decay", label: "Decay", kind: "float", min: 0.01, max: 8, default: 1, curve: "log", unit: "s", group: "env" },
  { id: "sustain", label: "Sustain", kind: "float", min: 0, max: 1, default: 0.7, group: "env" },
  { id: "release", label: "Release", kind: "float", min: 0.05, max: 20, default: 2, curve: "log", unit: "s", group: "env" },
];

class WtAkwfVoice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private oscs: OscillatorNode[] = [];
  private filter: BiquadFilterNode;
  private ampEnv: AdsrGain;
  private scanTimer: ReturnType<typeof setInterval> | null = null;
  private phase = 0;
  private waveIndex: number;
  private scanRange: number;
  private scanPosition: number;
  private scanRateHz: number;
  private releaseSeconds: number;
  private disposed = false;

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    const freq = midiToHz(note);
    const voices = Math.round(Number(values.unisonVoices));
    const detune = Number(values.detuneCents);
    this.waveIndex = Number(values.waveIndex);
    this.scanRange = Number(values.scanRange);
    this.scanPosition = Number(values.scanPosition);
    this.scanRateHz = Number(values.scanRateHz);
    this.releaseSeconds = Number(values.release);

    const mix = this.ctx.createGain();
    mix.gain.value = voices > 1 ? 1 / Math.sqrt(voices) : 1;

    const wave = blendedPeriodicWave(this.ctx, this.waveIndex, this.waveIndex + this.scanRange, this.scanPosition);
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
    this.filter.Q.value = Number(values.resonance);
    mix.connect(this.filter);

    this.ampEnv = new AdsrGain(this.ctx, {
      attack: Number(values.attack),
      decay: Number(values.decay),
      sustain: Number(values.sustain),
      release: this.releaseSeconds,
    });
    this.filter.connect(this.ampEnv.node);
    this.output = this.ampEnv.node;
  }

  private startScanDrift(): void {
    if (this.scanRateHz <= 0) return;
    this.scanTimer = setInterval(() => {
      if (this.disposed) return;
      this.phase += this.scanRateHz * 0.15;
      const pos = (Math.sin(this.phase) * 0.5 + 0.5);
      const wave = blendedPeriodicWave(this.ctx, this.waveIndex, this.waveIndex + this.scanRange, pos);
      for (const osc of this.oscs) osc.setPeriodicWave(wave);
    }, 150);
  }

  trigger(velocity: number, time: number): void {
    for (const osc of this.oscs) osc.start(time);
    this.ampEnv.trigger(velocity, time);
    this.startScanDrift();
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
    if (paramId === "resonance") this.filter.Q.setTargetAtTime(Number(value), this.ctx.currentTime, 0.01);
    if (paramId === "scanPosition") this.scanPosition = Number(value);
    if (paramId === "scanRateHz") this.scanRateHz = Number(value);
  }

  isFinished(time: number): boolean {
    return this.ampEnv.isFinished(time);
  }

  dispose(): void {
    this.disposed = true;
    if (this.scanTimer) clearInterval(this.scanTimer);
    for (const osc of this.oscs) { try { osc.disconnect(); } catch { /* noop */ } }
    this.filter.disconnect();
    this.ampEnv.node.disconnect();
  }
}

export const wtAkwfEngine: Engine = {
  id: "wt-akwf",
  name: "AKWF Wavetable (Adventure Kid)",
  params,
  defaultMacroMap: {
    brightness: [{ paramId: "cutoffHz", atZero: 300, atOne: 14000 }],
    motion: [{ paramId: "scanRateHz", atZero: 0, atOne: 1.2 }],
    density: [{ paramId: "unisonVoices", atZero: 1, atOne: 5 }],
    detune: [{ paramId: "detuneCents", atZero: 0, atOne: 35 }],
    drive: [{ paramId: "resonance", atZero: 0.3, atOne: 8 }],
    space: [{ paramId: "release", atZero: 0.2, atOne: 15 }],
    air: [{ paramId: "scanPosition", atZero: 0, atOne: 1 }],
  },
  createVoice(globals, values, note) {
    return new WtAkwfVoice(globals, note, values);
  },
};

export function wtAkwfDefaults(): ParamValues {
  return defaultParamValues(params);
}
