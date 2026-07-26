// FM Engine 2: 4-Op Retro Arcade FM (YM2612 / Lately Bass style)
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { AdsrGain } from "./shared/envelope";
import { midiToHz } from "./shared/util";

export const fm4OpParams: ParamSpec[] = [
  { id: "mult1", label: "Op1 Mult", kind: "float", min: 0.5, max: 8, default: 1, group: "ops" },
  { id: "mult2", label: "Op2 Mult", kind: "float", min: 0.5, max: 8, default: 2, group: "ops" },
  { id: "feedback", label: "Op1 Feedback", kind: "float", min: 0, max: 10, default: 2, group: "fm" },
  { id: "fmAmt", label: "FM Menge", kind: "float", min: 0, max: 15, default: 5, group: "fm" },
  { id: "grit", label: "Grit / Saturation", kind: "float", min: 0, max: 1, default: 0.3, group: "timbre" },
  { id: "attack", label: "Attack", kind: "float", min: 0.001, max: 2, default: 0.005, curve: "log", unit: "s", group: "env" },
  { id: "decay", label: "Decay", kind: "float", min: 0.01, max: 4, default: 0.4, curve: "log", unit: "s", group: "env" },
  { id: "sustain", label: "Sustain", kind: "float", min: 0, max: 1, default: 0.4, group: "env" },
  { id: "release", label: "Release", kind: "float", min: 0.01, max: 5, default: 0.3, curve: "log", unit: "s", group: "env" },
];

export class Fm4OpVoice implements Voice {
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
    const fmAmt = Number(values.fmAmt || 5);

    this.carrier = this.ctx.createOscillator();
    this.carrier.type = "sawtooth";
    this.carrier.frequency.value = baseHz * Number(values.mult1 || 1);

    this.modulator = this.ctx.createOscillator();
    this.modulator.type = "square";
    this.modulator.frequency.value = baseHz * Number(values.mult2 || 2);

    this.modGain = this.ctx.createGain();
    this.modGain.gain.value = baseHz * fmAmt;

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

  setParam(paramId: string, value: number | string | boolean, time: number): void {
    if (paramId === "fmAmt") {
      this.modGain.gain.setTargetAtTime(midiToHz(this.note) * Number(value), time, 0.01);
    }
  }

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

export const fm4OpEngine: Engine = {
  id: "fm-4op",
  name: "FM 4-Op (Sega Genesis YM2612 / TX81Z)",
  params: fm4OpParams,
  defaultMacroMap: {
    brightness: [{ paramId: "fmAmt", atZero: 0.5, atOne: 12 }],
    motion: [{ paramId: "mult2", atZero: 0.5, atOne: 6 }],
    drive: [{ paramId: "grit", atZero: 0, atOne: 1 }],
    space: [{ paramId: "release", atZero: 0.05, atOne: 3 }],
  },
  createVoice(globals, values, note) {
    return new Fm4OpVoice(globals, note, values);
  },
};

export function fm4OpDefaults(): ParamValues {
  return defaultParamValues(fm4OpParams);
}
