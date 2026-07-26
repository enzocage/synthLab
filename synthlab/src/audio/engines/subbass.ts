// 13. sub_synthesis: Sub-Oszillator + Sättigung, Mono-Fold unterhalb ~120Hz
// (ambient-rules.json: depth_without_mud, Produktionswissen Mono-Kompatibilität).
// Rolle: bass (Fundament-Drone).
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { AdsrGain } from "./shared/envelope";
import { midiToHz, saturationCurve } from "./shared/util";

const params: ParamSpec[] = [
  { id: "subWaveform", label: "Sub-Wellenform", kind: "enum", options: ["sine", "triangle"], default: "sine", group: "osc" },
  { id: "subLevel", label: "Sub-Pegel", kind: "float", min: 0, max: 1, default: 0.9, group: "osc" },
  { id: "fundamentalLevel", label: "Grundton-Pegel", kind: "float", min: 0, max: 1, default: 0.5, group: "osc" },
  { id: "saturation", label: "Sättigung", kind: "float", min: 0, max: 1, default: 0.25, group: "drive", mutationWeight: 0.8 },
  { id: "monoFreqHz", label: "Mono-Fold unter", kind: "float", min: 60, max: 200, default: 120, unit: "Hz", group: "master" },
  { id: "attack", label: "Attack", kind: "float", min: 0.02, max: 6, default: 0.3, curve: "log", unit: "s", group: "env" },
  { id: "release", label: "Release", kind: "float", min: 0.1, max: 15, default: 3, curve: "log", unit: "s", group: "env" },
  { id: "sustain", label: "Sustain", kind: "float", min: 0, max: 1, default: 0.85, group: "env" },
];

class SubbassVoice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private sub: OscillatorNode;
  private fundamental: OscillatorNode;
  private shaper: WaveShaperNode;
  private monoFilter: BiquadFilterNode;
  private ampEnv: AdsrGain;
  private releaseSeconds: number;

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    const freq = midiToHz(note);
    this.releaseSeconds = Number(values.release);

    this.sub = this.ctx.createOscillator();
    this.sub.type = values.subWaveform as OscillatorType;
    this.sub.frequency.value = freq / 2;
    const subGain = this.ctx.createGain();
    subGain.gain.value = Number(values.subLevel);

    this.fundamental = this.ctx.createOscillator();
    this.fundamental.type = "sine";
    this.fundamental.frequency.value = freq;
    const fundGain = this.ctx.createGain();
    fundGain.gain.value = Number(values.fundamentalLevel);

    const mix = this.ctx.createGain();
    this.sub.connect(subGain).connect(mix);
    this.fundamental.connect(fundGain).connect(mix);

    this.shaper = this.ctx.createWaveShaper();
    this.shaper.curve = saturationCurve(Number(values.saturation));
    mix.connect(this.shaper);

    // Mono-Fold: unterhalb monoFreqHz auf 0 Panorama zentrieren (hier: einfacher Lowpass
    // als Bass-Signalpfad, da die Voice ohnehin mono ist; die eigentliche Stereo-Mono-Summe
    // erfolgt in der Master-FX-Kette aus Phase 4 anhand dieser Grenzfrequenz).
    this.monoFilter = this.ctx.createBiquadFilter();
    this.monoFilter.type = "allpass"; // Platzhalter-Node, Grenzfrequenz wird von der Masterkette gelesen
    this.monoFilter.frequency.value = Number(values.monoFreqHz);
    this.shaper.connect(this.monoFilter);

    this.ampEnv = new AdsrGain(this.ctx, {
      attack: Number(values.attack),
      decay: 0.01,
      sustain: Number(values.sustain),
      release: this.releaseSeconds,
    });
    this.monoFilter.connect(this.ampEnv.node);
    this.output = this.ampEnv.node;
  }

  trigger(velocity: number, time: number): void {
    this.sub.start(time);
    this.fundamental.start(time);
    this.ampEnv.trigger(velocity, time);
  }

  release(time: number): void {
    this.ampEnv.release(time);
    const stopAt = time + this.releaseSeconds + 0.05;
    try { this.sub.stop(stopAt); this.fundamental.stop(stopAt); } catch { /* noop */ }
  }

  stop(time: number, fadeSeconds = 0.02): void {
    this.ampEnv.stop(time, fadeSeconds);
    try { this.sub.stop(time + fadeSeconds + 0.01); this.fundamental.stop(time + fadeSeconds + 0.01); } catch { /* noop */ }
  }

  setParam(paramId: string, value: number | string | boolean): void {
    if (paramId === "saturation") this.shaper.curve = saturationCurve(Number(value));
  }

  isFinished(time: number): boolean {
    return this.ampEnv.isFinished(time);
  }

  dispose(): void {
    try { this.sub.disconnect(); this.fundamental.disconnect(); } catch { /* noop */ }
    this.shaper.disconnect();
    this.monoFilter.disconnect();
    this.ampEnv.node.disconnect();
  }
}

export const subbassEngine: Engine = {
  id: "subbass",
  name: "Sub Bass",
  params,
  defaultMacroMap: {
    body: [{ paramId: "subLevel", atZero: 0.2, atOne: 1 }],
    drive: [{ paramId: "saturation", atZero: 0, atOne: 0.8 }],
    brightness: [{ paramId: "fundamentalLevel", atZero: 0, atOne: 0.9 }],
    space: [{ paramId: "release", atZero: 0.2, atOne: 12 }],
  },
  createVoice(globals, values, note) {
    return new SubbassVoice(globals, note, values);
  },
};

export function subbassDefaults(): ParamValues {
  return defaultParamValues(params);
}
