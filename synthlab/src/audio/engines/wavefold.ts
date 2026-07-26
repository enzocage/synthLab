// 10. wavefolding: West-Coast-Komplexoszillator — Sinus durch eine Wavefolder-
// Kurve (WaveShaperNode), Timbre/Fold-Achse, FM-Beimischung. Rollen: synth, bass, fx.
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { AdsrGain } from "./shared/envelope";
import { midiToHz, wavefolderCurve } from "./shared/util";

const params: ParamSpec[] = [
  { id: "foldAmount", label: "Fold-Menge", kind: "float", min: 0, max: 1, default: 0.3, group: "fold", mutationWeight: 0.9 },
  { id: "timbre", label: "Timbre", kind: "float", min: 0, max: 1, default: 0.4, group: "fold", mutationWeight: 0.7 },
  { id: "fmAmount", label: "FM-Beimischung", kind: "float", min: 0, max: 1, default: 0.1, group: "fold" },
  { id: "cutoffHz", label: "Post-Filter", kind: "float", min: 200, max: 14000, default: 6000, curve: "log", unit: "Hz", group: "filter", smooth: true },
  { id: "attack", label: "Attack", kind: "float", min: 0.005, max: 4, default: 0.05, curve: "log", unit: "s", group: "env" },
  { id: "decay", label: "Decay", kind: "float", min: 0.02, max: 6, default: 0.8, curve: "log", unit: "s", group: "env" },
  { id: "sustain", label: "Sustain", kind: "float", min: 0, max: 1, default: 0.6, group: "env" },
  { id: "release", label: "Release", kind: "float", min: 0.05, max: 15, default: 2, curve: "log", unit: "s", group: "env" },
];

class WavefoldVoice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private osc: OscillatorNode;
  private timbreOsc: OscillatorNode;
  private fmOsc: OscillatorNode;
  private shaper: WaveShaperNode;
  private postFilter: BiquadFilterNode;
  private ampEnv: AdsrGain;
  private releaseSeconds: number;

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    const freq = midiToHz(note);
    this.releaseSeconds = Number(values.release);

    this.osc = this.ctx.createOscillator();
    this.osc.type = "sine";
    this.osc.frequency.value = freq;

    // Timbre: zweiter Oszillator (leicht verstimmt) moduliert die Grundwelle additiv vor dem Folder,
    // simuliert die klassische "Timbre"-Achse eines West-Coast-Oszillators.
    this.timbreOsc = this.ctx.createOscillator();
    this.timbreOsc.type = "triangle";
    this.timbreOsc.frequency.value = freq * 2;
    const timbreGain = this.ctx.createGain();
    timbreGain.gain.value = Number(values.timbre) * 0.8;

    const preFold = this.ctx.createGain();
    preFold.gain.value = 1;

    this.osc.connect(preFold);
    this.timbreOsc.connect(timbreGain).connect(preFold);

    this.shaper = this.ctx.createWaveShaper();
    this.shaper.curve = wavefolderCurve(Number(values.foldAmount));
    this.shaper.oversample = "4x";
    preFold.connect(this.shaper);

    // Optionale FM-Beimischung: ein Sub-Oszillator moduliert die Grundfrequenz audio-rate.
    this.fmOsc = this.ctx.createOscillator();
    this.fmOsc.type = "sine";
    this.fmOsc.frequency.value = freq * 1.5;
    const fmGain = this.ctx.createGain();
    fmGain.gain.value = Number(values.fmAmount) * freq * 2;
    this.fmOsc.connect(fmGain).connect(this.osc.frequency);

    this.postFilter = this.ctx.createBiquadFilter();
    this.postFilter.type = "lowpass";
    this.postFilter.frequency.value = Number(values.cutoffHz);
    this.shaper.connect(this.postFilter);

    this.ampEnv = new AdsrGain(this.ctx, {
      attack: Number(values.attack),
      decay: Number(values.decay),
      sustain: Number(values.sustain),
      release: this.releaseSeconds,
    });
    this.postFilter.connect(this.ampEnv.node);
    this.output = this.ampEnv.node;
  }

  trigger(velocity: number, time: number): void {
    this.osc.start(time);
    this.timbreOsc.start(time);
    this.fmOsc.start(time);
    this.ampEnv.trigger(velocity, time);
  }

  release(time: number): void {
    this.ampEnv.release(time);
    const stopAt = time + this.releaseSeconds + 0.05;
    for (const o of [this.osc, this.timbreOsc, this.fmOsc]) { try { o.stop(stopAt); } catch { /* noop */ } }
  }

  stop(time: number, fadeSeconds = 0.02): void {
    this.ampEnv.stop(time, fadeSeconds);
    for (const o of [this.osc, this.timbreOsc, this.fmOsc]) { try { o.stop(time + fadeSeconds + 0.01); } catch { /* noop */ } }
  }

  setParam(paramId: string, value: number | string | boolean, time: number): void {
    if (paramId === "foldAmount") this.shaper.curve = wavefolderCurve(Number(value));
    if (paramId === "cutoffHz") this.postFilter.frequency.setTargetAtTime(Number(value), time, 0.01);
  }

  isFinished(time: number): boolean {
    return this.ampEnv.isFinished(time);
  }

  dispose(): void {
    for (const o of [this.osc, this.timbreOsc, this.fmOsc]) { try { o.disconnect(); } catch { /* noop */ } }
    this.shaper.disconnect();
    this.postFilter.disconnect();
    this.ampEnv.node.disconnect();
  }
}

export const wavefoldEngine: Engine = {
  id: "wavefold",
  name: "Wavefold",
  params,
  defaultMacroMap: {
    brightness: [{ paramId: "foldAmount", atZero: 0, atOne: 0.9 }],
    drive: [{ paramId: "fmAmount", atZero: 0, atOne: 0.8 }],
    body: [{ paramId: "timbre", atZero: 0, atOne: 1 }],
    space: [{ paramId: "release", atZero: 0.1, atOne: 10 }],
  },
  createVoice(globals, values, note) {
    return new WavefoldVoice(globals, note, values);
  },
};

export function wavefoldDefaults(): ParamValues {
  return defaultParamValues(params);
}
