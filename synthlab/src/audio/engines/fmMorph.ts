// FM Engine 3: Morphing / Dynamic Phase FM
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { AdsrGain } from "./shared/envelope";
import { midiToHz } from "./shared/util";

export const fmMorphParams: ParamSpec[] = [
  { id: "morphRate", label: "Morph Tempo", kind: "float", min: 0.1, max: 10, default: 1, unit: "Hz", group: "lfo" },
  { id: "morphDepth", label: "Morph Tiefe", kind: "float", min: 0, max: 1, default: 0.5, group: "lfo" },
  { id: "carrierShape", label: "Carrier Form", kind: "enum", options: ["sine", "triangle", "sawtooth"], default: "sine", group: "osc" },
  { id: "attack", label: "Attack", kind: "float", min: 0.01, max: 8, default: 0.4, curve: "log", unit: "s", group: "env" },
  { id: "decay", label: "Decay", kind: "float", min: 0.05, max: 8, default: 2.0, curve: "log", unit: "s", group: "env" },
  { id: "sustain", label: "Sustain", kind: "float", min: 0, max: 1, default: 0.7, group: "env" },
  { id: "release", label: "Release", kind: "float", min: 0.05, max: 10, default: 3.0, curve: "log", unit: "s", group: "env" },
];

export class FmMorphVoice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private carrier: OscillatorNode;
  private mod: OscillatorNode;
  private lfo: OscillatorNode;
  private modGain: GainNode;
  private ampEnv: AdsrGain;

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    const baseHz = midiToHz(note);

    this.carrier = this.ctx.createOscillator();
    this.carrier.type = (values.carrierShape as OscillatorType) || "sine";
    this.carrier.frequency.value = baseHz;

    this.mod = this.ctx.createOscillator();
    this.mod.type = "sine";
    this.mod.frequency.value = baseHz * 1.5;

    this.modGain = this.ctx.createGain();
    this.modGain.gain.value = baseHz * 2;

    this.lfo = this.ctx.createOscillator();
    this.lfo.frequency.value = Number(values.morphRate || 1);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = baseHz * Number(values.morphDepth || 0.5) * 3;

    this.lfo.connect(lfoGain);
    lfoGain.connect(this.modGain.gain);

    this.mod.connect(this.modGain);
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
    this.mod.start(time);
    this.lfo.start(time);
    this.ampEnv.trigger(velocity, time);
  }

  release(time: number): void {
    this.ampEnv.release(time);
    const stopAt = time + Number(this.ampEnv.node.gain.value) + 0.1;
    try { this.carrier.stop(stopAt); } catch { /* noop */ }
    try { this.mod.stop(stopAt); } catch { /* noop */ }
    try { this.lfo.stop(stopAt); } catch { /* noop */ }
  }

  stop(time: number, fadeSeconds = 0.02): void {
    this.ampEnv.stop(time, fadeSeconds);
    const stopAt = time + fadeSeconds + 0.01;
    try { this.carrier.stop(stopAt); } catch { /* noop */ }
    try { this.mod.stop(stopAt); } catch { /* noop */ }
    try { this.lfo.stop(stopAt); } catch { /* noop */ }
  }

  setParam(_paramId: string, _value: number | string | boolean, _time: number): void {}

  isFinished(time: number): boolean {
    return this.ampEnv.isFinished(time);
  }

  dispose(): void {
    try { this.carrier.disconnect(); } catch { /* noop */ }
    try { this.mod.disconnect(); } catch { /* noop */ }
    try { this.lfo.disconnect(); } catch { /* noop */ }
    this.modGain.disconnect();
    this.ampEnv.node.disconnect();
  }
}

export const fmMorphEngine: Engine = {
  id: "fm-morph",
  name: "FM Morph (Ameobea Web-Synth Phase Morph)",
  params: fmMorphParams,
  defaultMacroMap: {
    brightness: [{ paramId: "morphDepth", atZero: 0.1, atOne: 1 }],
    motion: [{ paramId: "morphRate", atZero: 0.1, atOne: 8 }],
    space: [{ paramId: "release", atZero: 0.2, atOne: 8 }],
  },
  createVoice(globals, values, note) {
    return new FmMorphVoice(globals, note, values);
  },
};

export function fmMorphDefaults(): ParamValues {
  return defaultParamValues(fmMorphParams);
}
