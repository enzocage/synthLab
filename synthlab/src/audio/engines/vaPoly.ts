// 1. va-poly: Subtraktive Synthese, 2 Oszillatoren + Sub + Rauschen, Unison, SVF/Ladder-Filter.
// Rollen: pad, synth, bass. Siehe research/derived/synthesis-methods.json#subtractive.
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { AdsrGain } from "./shared/envelope";
import { createUnisonStack, startAll, stopAll, setFrequencyAll, type UnisonVoiceNodes } from "./shared/unison";
import { midiToHz } from "./shared/util";
import { createNoiseSource } from "./shared/noise";

const params: ParamSpec[] = [
  { id: "osc1Wave", label: "Osc1 Form", kind: "enum", options: ["sawtooth", "square", "triangle"], default: "sawtooth", group: "osc" },
  { id: "osc2Wave", label: "Osc2 Form", kind: "enum", options: ["sawtooth", "square", "triangle", "sine"], default: "square", group: "osc" },
  { id: "osc2Detune", label: "Osc2 Verstimmung", kind: "float", min: -1200, max: 1200, default: 7, unit: "ct", group: "osc" },
  { id: "osc2Level", label: "Osc2 Pegel", kind: "float", min: 0, max: 1, default: 0.6, group: "osc" },
  { id: "subLevel", label: "Sub Pegel", kind: "float", min: 0, max: 1, default: 0.3, group: "osc" },
  { id: "noiseLevel", label: "Noise Pegel", kind: "float", min: 0, max: 1, default: 0, group: "osc" },
  { id: "unisonVoices", label: "Unison", kind: "int", min: 1, max: 7, default: 3, group: "osc" },
  { id: "unisonDetune", label: "Unison Spread", kind: "float", min: 0, max: 50, default: 12, unit: "ct", group: "osc" },
  { id: "cutoffHz", label: "Cutoff", kind: "float", min: 40, max: 12000, default: 1200, curve: "log", unit: "Hz", group: "filter", smooth: true, mutationWeight: 0.9 },
  { id: "resonance", label: "Resonanz", kind: "float", min: 0.1, max: 18, default: 1.2, group: "filter", smooth: true, mutationWeight: 0.8 },
  { id: "envToFilter", label: "Env->Filter", kind: "float", min: 0, max: 8000, default: 1500, unit: "Hz", group: "filter" },
  { id: "attack", label: "Attack", kind: "float", min: 0.001, max: 8, default: 0.4, curve: "log", unit: "s", group: "env" },
  { id: "decay", label: "Decay", kind: "float", min: 0.01, max: 8, default: 1.2, curve: "log", unit: "s", group: "env" },
  { id: "sustain", label: "Sustain", kind: "float", min: 0, max: 1, default: 0.7, group: "env" },
  { id: "release", label: "Release", kind: "float", min: 0.05, max: 20, default: 3, curve: "log", unit: "s", group: "env" },
  { id: "filterAttack", label: "Filter Attack", kind: "float", min: 0.001, max: 8, default: 0.6, curve: "log", unit: "s", group: "filterEnv" },
  { id: "filterDecay", label: "Filter Decay", kind: "float", min: 0.01, max: 10, default: 2, curve: "log", unit: "s", group: "filterEnv" },
];

class VaPolyVoice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private osc1: UnisonVoiceNodes[];
  private osc1Out: GainNode;
  private osc2: UnisonVoiceNodes[];
  private osc2Out: GainNode;
  private sub: OscillatorNode;
  private subGain: GainNode;
  private noise: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode;
  private filter: BiquadFilterNode;
  private ampEnv: AdsrGain;
  private allOscs: UnisonVoiceNodes[];
  private params: ParamValues;

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    this.params = values;
    const freq = midiToHz(note);

    const voices = Math.round(Number(values.unisonVoices));
    const spread = Number(values.unisonDetune);

    const s1 = createUnisonStack(this.ctx, values.osc1Wave as OscillatorType, freq, voices, spread, 0.6);
    this.osc1 = s1.nodes;
    this.osc1Out = s1.output;

    const s2 = createUnisonStack(this.ctx, values.osc2Wave as OscillatorType, freq, voices, spread, 0.6);
    this.osc2 = s2.nodes;
    this.osc2Out = s2.output;
    for (const n of this.osc2) n.osc.detune.value += Number(values.osc2Detune);
    this.osc2Out.gain.value = Number(values.osc2Level);

    this.sub = this.ctx.createOscillator();
    this.sub.type = "sine";
    this.sub.frequency.value = freq / 2;
    this.subGain = this.ctx.createGain();
    this.subGain.gain.value = Number(values.subLevel);
    this.sub.connect(this.subGain);

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = Number(values.noiseLevel);
    if (Number(values.noiseLevel) > 0) {
      this.noise = createNoiseSource(this.ctx, "white");
      this.noise.connect(this.noiseGain);
    }

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = Number(values.cutoffHz);
    this.filter.Q.value = Number(values.resonance);

    this.osc1Out.connect(this.filter);
    this.osc2Out.connect(this.filter);
    this.subGain.connect(this.filter);
    this.noiseGain.connect(this.filter);

    this.ampEnv = new AdsrGain(this.ctx, {
      attack: Number(values.attack),
      decay: Number(values.decay),
      sustain: Number(values.sustain),
      release: Number(values.release),
    });
    this.filter.connect(this.ampEnv.node);
    this.output = this.ampEnv.node;

    this.allOscs = [...this.osc1, ...this.osc2];
  }

  trigger(velocity: number, time: number): void {
    startAll(this.allOscs, time);
    this.sub.start(time);
    this.noise?.start(time);
    this.ampEnv.trigger(velocity, time);

    const base = Number(this.params.cutoffHz);
    const amt = Number(this.params.envToFilter);
    const fAtk = Number(this.params.filterAttack);
    const fDec = Number(this.params.filterDecay);
    const f = this.filter.frequency;
    f.cancelScheduledValues(time);
    f.setValueAtTime(base, time);
    f.linearRampToValueAtTime(Math.min(base + amt, 18000), time + Math.max(fAtk, 0.002));
    f.linearRampToValueAtTime(base, time + fAtk + Math.max(fDec, 0.002));
  }

  release(time: number): void {
    this.ampEnv.release(time);
    const stopAt = time + Number(this.params.release) + 0.05;
    stopAll(this.allOscs, stopAt);
    try { this.sub.stop(stopAt); } catch { /* noop */ }
    try { this.noise?.stop(stopAt); } catch { /* noop */ }
  }

  stop(time: number, fadeSeconds = 0.02): void {
    this.ampEnv.stop(time, fadeSeconds);
    stopAll(this.allOscs, time + fadeSeconds + 0.01);
    try { this.sub.stop(time + fadeSeconds + 0.01); } catch { /* noop */ }
    try { this.noise?.stop(time + fadeSeconds + 0.01); } catch { /* noop */ }
  }

  setParam(paramId: string, value: number | string | boolean, time: number): void {
    this.params[paramId] = value;
    if (paramId === "cutoffHz") this.filter.frequency.setTargetAtTime(Number(value), time, 0.01);
    if (paramId === "resonance") this.filter.Q.setTargetAtTime(Number(value), time, 0.01);
    if (paramId === "osc2Level") this.osc2Out.gain.setTargetAtTime(Number(value), time, 0.01);
    if (paramId === "subLevel") this.subGain.gain.setTargetAtTime(Number(value), time, 0.01);
    if (paramId === "noiseLevel") this.noiseGain.gain.setTargetAtTime(Number(value), time, 0.01);
    if (paramId === "freq" || paramId === "detune") {
      setFrequencyAll(this.allOscs, midiToHz(this.note), time);
    }
  }

  isFinished(time: number): boolean {
    return this.ampEnv.isFinished(time);
  }

  dispose(): void {
    for (const n of this.allOscs) { try { n.osc.disconnect(); n.pan.disconnect(); } catch { /* noop */ } }
    try { this.sub.disconnect(); } catch { /* noop */ }
    try { this.noise?.disconnect(); } catch { /* noop */ }
    this.subGain.disconnect();
    this.noiseGain.disconnect();
    this.filter.disconnect();
    this.ampEnv.node.disconnect();
    this.osc1Out.disconnect();
    this.osc2Out.disconnect();
  }
}

export const vaPolyEngine: Engine = {
  id: "va-poly",
  name: "VA Poly (Moog / Roland Subtractive)",
  params,
  defaultMacroMap: {
    brightness: [{ paramId: "cutoffHz", atZero: 200, atOne: 9000 }],
    motion: [{ paramId: "filterDecay", atZero: 4, atOne: 0.2 }],
    density: [{ paramId: "unisonVoices", atZero: 1, atOne: 7 }],
    detune: [{ paramId: "unisonDetune", atZero: 0, atOne: 40 }],
    drive: [{ paramId: "resonance", atZero: 0.3, atOne: 10 }],
    body: [{ paramId: "subLevel", atZero: 0, atOne: 0.8 }],
    air: [{ paramId: "noiseLevel", atZero: 0, atOne: 0.4 }],
    space: [{ paramId: "release", atZero: 0.3, atOne: 12 }],
  },
  createVoice(globals, values, note) {
    return new VaPolyVoice(globals, note, values);
  },
};

export function vaPolyDefaults(): ParamValues {
  return defaultParamValues(params);
}
