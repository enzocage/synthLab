// FM Engine 4: High-Feedback Chaos Dual FM
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { AdsrGain } from "./shared/envelope";
import { midiToHz } from "./shared/util";

export const fmFeedbackParams: ParamSpec[] = [
  { id: "feedback", label: "Chaos Feedback", kind: "float", min: 0, max: 20, default: 8, group: "fm" },
  { id: "ratio", label: "Mod Ratio", kind: "float", min: 0.25, max: 7, default: 1.414, group: "fm" },
  { id: "attack", label: "Attack", kind: "float", min: 0.001, max: 2, default: 0.01, curve: "log", unit: "s", group: "env" },
  { id: "decay", label: "Decay", kind: "float", min: 0.01, max: 4, default: 0.6, curve: "log", unit: "s", group: "env" },
  { id: "sustain", label: "Sustain", kind: "float", min: 0, max: 1, default: 0.5, group: "env" },
  { id: "release", label: "Release", kind: "float", min: 0.01, max: 6, default: 0.8, curve: "log", unit: "s", group: "env" },
];

export class FmFeedbackVoice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private osc1: OscillatorNode;
  private osc2: OscillatorNode;
  private g1: GainNode;
  private g2: GainNode;
  private ampEnv: AdsrGain;

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    const baseHz = midiToHz(note);
    const fb = Number(values.feedback || 8);
    const ratio = Number(values.ratio || 1.414);

    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = "sawtooth";
    this.osc1.frequency.value = baseHz;

    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = "sine";
    this.osc2.frequency.value = baseHz * ratio;

    this.g1 = this.ctx.createGain();
    this.g1.gain.value = baseHz * fb;

    this.g2 = this.ctx.createGain();
    this.g2.gain.value = baseHz * (fb * 0.5);

    // Cross feedback: osc1 -> g1 -> osc2.freq & osc2 -> g2 -> osc1.freq
    this.osc1.connect(this.g1);
    this.g1.connect(this.osc2.frequency);

    this.osc2.connect(this.g2);
    this.g2.connect(this.osc1.frequency);

    this.ampEnv = new AdsrGain(this.ctx, {
      attack: Number(values.attack),
      decay: Number(values.decay),
      sustain: Number(values.sustain),
      release: Number(values.release),
    });

    this.osc1.connect(this.ampEnv.node);
    this.output = this.ampEnv.node;
  }

  trigger(velocity: number, time: number): void {
    this.osc1.start(time);
    this.osc2.start(time);
    this.ampEnv.trigger(velocity, time);
  }

  release(time: number): void {
    this.ampEnv.release(time);
    const stopAt = time + Number(this.ampEnv.node.gain.value) + 0.1;
    try { this.osc1.stop(stopAt); } catch { /* noop */ }
    try { this.osc2.stop(stopAt); } catch { /* noop */ }
  }

  stop(time: number, fadeSeconds = 0.02): void {
    this.ampEnv.stop(time, fadeSeconds);
    const stopAt = time + fadeSeconds + 0.01;
    try { this.osc1.stop(stopAt); } catch { /* noop */ }
    try { this.osc2.stop(stopAt); } catch { /* noop */ }
  }

  setParam(_paramId: string, _value: number | string | boolean, _time: number): void {}

  isFinished(time: number): boolean {
    return this.ampEnv.isFinished(time);
  }

  dispose(): void {
    try { this.osc1.disconnect(); } catch { /* noop */ }
    try { this.osc2.disconnect(); } catch { /* noop */ }
    this.g1.disconnect();
    this.g2.disconnect();
    this.ampEnv.node.disconnect();
  }
}

export const fmFeedbackEngine: Engine = {
  id: "fm-feedback",
  name: "FM Feedback (Foydel High-Chaos Dual FM)",
  params: fmFeedbackParams,
  defaultMacroMap: {
    brightness: [{ paramId: "feedback", atZero: 0, atOne: 18 }],
    motion: [{ paramId: "ratio", atZero: 0.5, atOne: 5 }],
    space: [{ paramId: "release", atZero: 0.1, atOne: 5 }],
  },
  createVoice(globals, values, note) {
    return new FmFeedbackVoice(globals, note, values);
  },
};

export function fmFeedbackDefaults(): ParamValues {
  return defaultParamValues(fmFeedbackParams);
}
