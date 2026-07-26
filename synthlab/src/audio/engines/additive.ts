// 4. additive: Partialbank aus Sinusoszillatoren mit spektraler Hüllkurve,
// Inharmonizität und langsamem Partial-Drift. Rollen: drone, pad, fx.
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { AdsrGain } from "./shared/envelope";
import { midiToHz } from "./shared/util";

const MAX_PARTIALS = 24;

const params: ParamSpec[] = [
  { id: "partialCount", label: "Partiale", kind: "int", min: 2, max: MAX_PARTIALS, default: 12, group: "spectrum" },
  { id: "inharmonicity", label: "Inharmonizität", kind: "float", min: 0, max: 0.3, default: 0.02, group: "spectrum", mutationWeight: 0.7 },
  { id: "spectralTilt", label: "Spektral-Neigung", kind: "float", min: -1, max: 1, default: -0.4, group: "spectrum", mutationWeight: 0.8 },
  { id: "partialDrift", label: "Partial-Drift", kind: "float", min: 0, max: 20, default: 3, unit: "ct", group: "spectrum", mutationWeight: 0.6 },
  { id: "driftRateHz", label: "Drift-Rate", kind: "float", min: 0.01, max: 2, default: 0.15, unit: "Hz", group: "spectrum" },
  { id: "attack", label: "Attack", kind: "float", min: 0.1, max: 15, default: 3, curve: "log", unit: "s", group: "env" },
  { id: "release", label: "Release", kind: "float", min: 0.3, max: 25, default: 8, curve: "log", unit: "s", group: "env" },
  { id: "sustain", label: "Sustain", kind: "float", min: 0, max: 1, default: 0.85, group: "env" },
];

class AdditiveVoice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private oscs: OscillatorNode[] = [];
  private lfos: OscillatorNode[] = [];
  private ampEnv: AdsrGain;
  private releaseSeconds: number;

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    const freq = midiToHz(note);
    const count = Math.round(Number(values.partialCount));
    const inharm = Number(values.inharmonicity);
    const tilt = Number(values.spectralTilt);
    const driftCents = Number(values.partialDrift);
    const driftRate = Number(values.driftRateHz);
    this.releaseSeconds = Number(values.release);

    this.ampEnv = new AdsrGain(this.ctx, {
      attack: Number(values.attack),
      decay: 0.01,
      sustain: Number(values.sustain),
      release: this.releaseSeconds,
    });
    this.output = this.ampEnv.node;

    const mix = this.ctx.createGain();
    mix.gain.value = 1 / Math.sqrt(count);
    mix.connect(this.ampEnv.node);

    for (let h = 1; h <= count; h++) {
      const inharmFactor = 1 + inharm * h * h * 0.01;
      const partialFreq = freq * h * inharmFactor;
      if (partialFreq > 18000) continue;

      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = partialFreq;

      const gain = this.ctx.createGain();
      // Spektrale Neigung: tilt<0 = obertonarm (schnell abfallend), tilt>0 = obertonreich
      const rolloff = 1 - tilt; // 0..2
      gain.gain.value = 1 / Math.pow(h, 0.5 + rolloff);

      // Jeder Partial driftet leicht unabhängig (organische Bewegung statt statischer Fläche).
      const lfo = this.ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = driftRate * (0.6 + Math.random() * 0.8);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = driftCents * (0.3 + Math.random() * 0.7);
      lfo.connect(lfoGain).connect(osc.detune);

      osc.connect(gain).connect(mix);
      this.oscs.push(osc);
      this.lfos.push(lfo);
    }
  }

  trigger(velocity: number, time: number): void {
    for (const o of this.oscs) o.start(time);
    for (const l of this.lfos) l.start(time);
    this.ampEnv.trigger(velocity, time);
  }

  release(time: number): void {
    this.ampEnv.release(time);
    const stopAt = time + this.releaseSeconds + 0.05;
    for (const o of [...this.oscs, ...this.lfos]) { try { o.stop(stopAt); } catch { /* noop */ } }
  }

  stop(time: number, fadeSeconds = 0.02): void {
    this.ampEnv.stop(time, fadeSeconds);
    for (const o of [...this.oscs, ...this.lfos]) { try { o.stop(time + fadeSeconds + 0.01); } catch { /* noop */ } }
  }

  setParam(): void {
    // Spektralstruktur ist pro Voice gebaut; Live-Parameteränderung wirkt auf die nächste Note.
  }

  isFinished(time: number): boolean {
    return this.ampEnv.isFinished(time);
  }

  dispose(): void {
    for (const o of [...this.oscs, ...this.lfos]) { try { o.disconnect(); } catch { /* noop */ } }
    this.ampEnv.node.disconnect();
  }
}

export const additiveEngine: Engine = {
  id: "additive",
  name: "Additive",
  params,
  defaultMacroMap: {
    brightness: [{ paramId: "spectralTilt", atZero: -1, atOne: 1 }],
    density: [{ paramId: "partialCount", atZero: 3, atOne: 24 }],
    motion: [{ paramId: "driftRateHz", atZero: 0.02, atOne: 1.5 }],
    detune: [{ paramId: "partialDrift", atZero: 0, atOne: 18 }, { paramId: "inharmonicity", atZero: 0, atOne: 0.25 }],
    space: [{ paramId: "release", atZero: 0.5, atOne: 22 }],
  },
  createVoice(globals, values, note) {
    return new AdditiveVoice(globals, note, values);
  },
};

export function additiveDefaults(): ParamValues {
  return defaultParamValues(params);
}
