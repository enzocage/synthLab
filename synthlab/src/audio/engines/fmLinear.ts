// FM Engine 5: Linear Harmonic Precision FM
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { AdsrGain } from "./shared/envelope";
import { midiToHz } from "./shared/util";

export const fmLinearParams: ParamSpec[] = [
  { id: "harmonicity", label: "Harmonicity Ratio", kind: "float", min: 0.5, max: 16, default: 2, group: "fm" },
  { id: "modIndex", label: "Modulation Index", kind: "float", min: 0, max: 12, default: 3, group: "fm" },
  { id: "attack", label: "Attack", kind: "float", min: 0.005, max: 6, default: 0.1, curve: "log", unit: "s", group: "env" },
  { id: "decay", label: "Decay", kind: "float", min: 0.05, max: 8, default: 1.5, curve: "log", unit: "s", group: "env" },
  { id: "sustain", label: "Sustain", kind: "float", min: 0, max: 1, default: 0.8, group: "env" },
  { id: "release", label: "Release", kind: "float", min: 0.05, max: 10, default: 2.5, curve: "log", unit: "s", group: "env" },
];

export class FmLinearVoice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private carrier: OscillatorNode;
  private modulator: OscillatorNode;
  private modGain: GainNode;
  private ampEnv: AdsrGain;

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    const baseHz = midiToHz(note);
    const harm = Number(values.harmonicity || 2);
    const modIdx = Number(values.modIndex || 3);

    this.carrier = this.ctx.createOscillator();
    this.carrier.type = "sine";
    this.carrier.frequency.value = baseHz;

    this.modulator = this.ctx.createOscillator();
    this.modulator.type = "sine";
    this.modulator.frequency.value = baseHz * harm;

    this.modGain = this.ctx.createGain();
    this.modGain.gain.value = baseHz * modIdx;

    this.modulator.connect(this.modGain);
    this.modGain.connect(this.carrier.frequency);

    this.ampEnv = new AdsrGain(this.ctx, {
      attack: Number(values.attack),
      decay: Number(values.decay),
      sustain: Number(values.sustain),
      release: Number(values.release),
    });

    this.carrier.connect(this.ampEnv.node);
    this.output = this.ampEnv.node;
  }

  trigger(velocity: number, time: number): void {
    this.carrier.start(time);
    this.modulator.start(time);
    this.ampEnv.trigger(velocity, time);
  }

  release(time: number): void {
    this.ampEnv.release(time);
    const stopAt = time + Number(this.ampEnv.node.gain.value) + 0.1;
    try { this.carrier.stop(stopAt); } catch { /* noop */ }
    try { this.modulator.stop(stopAt); } catch { /* noop */ }
  }

  stop(time: number, fadeSeconds = 0.02): void {
    this.ampEnv.stop(time, fadeSeconds);
    const stopAt = time + fadeSeconds + 0.01;
    try { this.carrier.stop(stopAt); } catch { /* noop */ }
    try { this.modulator.stop(stopAt); } catch { /* noop */ }
  }

  setParam(_paramId: string, _value: number | string | boolean, _time: number): void {}

  isFinished(time: number): boolean {
    return this.ampEnv.isFinished(time);
  }

  dispose(): void {
    try { this.carrier.disconnect(); } catch { /* noop */ }
    try { this.modulator.disconnect(); } catch { /* noop */ }
    this.modGain.disconnect();
    this.ampEnv.node.disconnect();
  }
}

export const fmLinearEngine: Engine = {
  id: "fm-linear",
  name: "FM Linear (Tone.js Linear Precision)",
  params: fmLinearParams,
  defaultMacroMap: {
    brightness: [{ paramId: "modIndex", atZero: 0, atOne: 10 }],
    motion: [{ paramId: "harmonicity", atZero: 0.5, atOne: 12 }],
    space: [{ paramId: "release", atZero: 0.1, atOne: 8 }],
  },
  createVoice(globals, values, note) {
    return new FmLinearVoice(globals, note, values);
  },
};

export function fmLinearDefaults(): ParamValues {
  return defaultParamValues(fmLinearParams);
}
