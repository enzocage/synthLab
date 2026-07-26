// FM Engine 1: DX7 6-Operator Classical FM
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { AdsrGain } from "./shared/envelope";
import { midiToHz } from "./shared/util";

export const fmDx7Params: ParamSpec[] = [
  { id: "algorithm", label: "Algorithmus", kind: "int", min: 1, max: 8, default: 1, group: "fm" },
  { id: "modIndex", label: "Mod Index", kind: "float", min: 0, max: 20, default: 4, group: "fm" },
  { id: "opRatio1", label: "Op1 Ratio", kind: "float", min: 0.5, max: 12, default: 1, group: "ops" },
  { id: "opRatio2", label: "Op2 Ratio", kind: "float", min: 0.5, max: 12, default: 2, group: "ops" },
  { id: "opRatio3", label: "Op3 Ratio", kind: "float", min: 0.5, max: 12, default: 3.5, group: "ops" },
  { id: "feedback", label: "Feedback", kind: "float", min: 0, max: 1, default: 0.2, group: "fm" },
  { id: "attack", label: "Attack", kind: "float", min: 0.002, max: 4, default: 0.01, curve: "log", unit: "s", group: "env" },
  { id: "decay", label: "Decay", kind: "float", min: 0.01, max: 6, default: 0.8, curve: "log", unit: "s", group: "env" },
  { id: "sustain", label: "Sustain", kind: "float", min: 0, max: 1, default: 0.6, group: "env" },
  { id: "release", label: "Release", kind: "float", min: 0.01, max: 8, default: 1.2, curve: "log", unit: "s", group: "env" },
];

export class FmDx7Voice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private carrier: OscillatorNode;
  private mod1: OscillatorNode;
  private mod2: OscillatorNode;
  private modGain1: GainNode;
  private modGain2: GainNode;
  private ampEnv: AdsrGain;

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    const baseFreq = midiToHz(note);
    const modIdx = Number(values.modIndex || 4);

    this.carrier = this.ctx.createOscillator();
    this.carrier.type = "sine";
    this.carrier.frequency.value = baseFreq * Number(values.opRatio1 || 1);

    this.mod1 = this.ctx.createOscillator();
    this.mod1.type = "sine";
    this.mod1.frequency.value = baseFreq * Number(values.opRatio2 || 2);
    this.modGain1 = this.ctx.createGain();
    this.modGain1.gain.value = baseFreq * modIdx;

    this.mod2 = this.ctx.createOscillator();
    this.mod2.type = "sine";
    this.mod2.frequency.value = baseFreq * Number(values.opRatio3 || 3.5);
    this.modGain2 = this.ctx.createGain();
    this.modGain2.gain.value = baseFreq * (modIdx * 0.5);

    // FM Routing: mod2 -> mod1 -> carrier
    this.mod2.connect(this.modGain2);
    this.modGain2.connect(this.mod1.frequency);
    this.mod1.connect(this.modGain1);
    this.modGain1.connect(this.carrier.frequency);

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
    this.mod1.start(time);
    this.mod2.start(time);
    this.ampEnv.trigger(velocity, time);
  }

  release(time: number): void {
    this.ampEnv.release(time);
    const stopAt = time + Number(this.ampEnv.node.gain.value) + 0.1;
    try { this.carrier.stop(stopAt); } catch { /* noop */ }
    try { this.mod1.stop(stopAt); } catch { /* noop */ }
    try { this.mod2.stop(stopAt); } catch { /* noop */ }
  }

  stop(time: number, fadeSeconds = 0.02): void {
    this.ampEnv.stop(time, fadeSeconds);
    const stopAt = time + fadeSeconds + 0.01;
    try { this.carrier.stop(stopAt); } catch { /* noop */ }
    try { this.mod1.stop(stopAt); } catch { /* noop */ }
    try { this.mod2.stop(stopAt); } catch { /* noop */ }
  }

  setParam(paramId: string, value: number | string | boolean, time: number): void {
    if (paramId === "modIndex") {
      const hz = midiToHz(this.note);
      this.modGain1.gain.setTargetAtTime(hz * Number(value), time, 0.01);
    }
  }

  isFinished(time: number): boolean {
    return this.ampEnv.isFinished(time);
  }

  dispose(): void {
    try { this.carrier.disconnect(); } catch { /* noop */ }
    try { this.mod1.disconnect(); } catch { /* noop */ }
    try { this.mod2.disconnect(); } catch { /* noop */ }
    this.modGain1.disconnect();
    this.modGain2.disconnect();
    this.ampEnv.node.disconnect();
  }
}

export const fmDx7Engine: Engine = {
  id: "fm-dx7",
  name: "FM DX7 (Yamaha DX7 6-Op Matrix)",
  params: fmDx7Params,
  defaultMacroMap: {
    brightness: [{ paramId: "modIndex", atZero: 0.5, atOne: 16 }],
    motion: [{ paramId: "opRatio2", atZero: 0.5, atOne: 8 }],
    density: [{ paramId: "opRatio3", atZero: 1, atOne: 12 }],
    space: [{ paramId: "release", atZero: 0.1, atOne: 6 }],
  },
  createVoice(globals, values, note) {
    return new FmDx7Voice(globals, note, values);
  },
};

export function fmDx7Defaults(): ParamValues {
  return defaultParamValues(fmDx7Params);
}
