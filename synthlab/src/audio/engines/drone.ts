// 9. drone: Multi-Detune-Stack mit Analog-Drift (Random-Walk-Verstimmung) für
// kontrollierte Schwebungen; optional Just-Intonation-Verhältnisse statt 12-TET.
// Rollen: drone, pad.
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { AdsrGain } from "./shared/envelope";
import { midiToHz } from "./shared/util";

const JUST_RATIOS = [1, 9 / 8, 5 / 4, 4 / 3, 3 / 2, 5 / 3, 7 / 4, 2]; // reine Intervalle inkl. harm. Septime

const params: ParamSpec[] = [
  { id: "voiceCount", label: "Stimmen", kind: "int", min: 2, max: 8, default: 5, group: "stack" },
  { id: "wave", label: "Wellenform", kind: "enum", options: ["sawtooth", "triangle", "sine"], default: "triangle", group: "stack" },
  { id: "detuneCents", label: "Verstimmung", kind: "float", min: 0, max: 40, default: 8, unit: "ct", group: "stack", mutationWeight: 0.8 },
  { id: "justIntonation", label: "Just Intonation", kind: "bool", default: false, group: "stack" },
  { id: "driftRateHz", label: "Drift-Rate", kind: "float", min: 0.01, max: 0.5, default: 0.05, unit: "Hz", group: "drift", mutationWeight: 0.6 },
  { id: "driftDepthCents", label: "Drift-Tiefe", kind: "float", min: 0, max: 25, default: 6, unit: "ct", group: "drift", mutationWeight: 0.7 },
  { id: "cutoffHz", label: "Cutoff", kind: "float", min: 80, max: 8000, default: 1800, curve: "log", unit: "Hz", group: "filter", smooth: true },
  { id: "attack", label: "Attack", kind: "float", min: 0.2, max: 20, default: 5, curve: "log", unit: "s", group: "env" },
  { id: "release", label: "Release", kind: "float", min: 0.3, max: 30, default: 10, curve: "log", unit: "s", group: "env" },
  { id: "sustain", label: "Sustain", kind: "float", min: 0, max: 1, default: 0.95, group: "env" },
];

class DroneVoice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private oscs: OscillatorNode[] = [];
  private driftLfos: OscillatorNode[] = [];
  private filter: BiquadFilterNode;
  private ampEnv: AdsrGain;
  private releaseSeconds: number;

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    const freq = midiToHz(note);
    const count = Math.round(Number(values.voiceCount));
    const detune = Number(values.detuneCents);
    const useJust = Boolean(values.justIntonation);
    const driftRate = Number(values.driftRateHz);
    const driftDepth = Number(values.driftDepthCents);
    this.releaseSeconds = Number(values.release);

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = Number(values.cutoffHz);

    this.ampEnv = new AdsrGain(this.ctx, {
      attack: Number(values.attack),
      decay: 0.01,
      sustain: Number(values.sustain),
      release: this.releaseSeconds,
    });
    this.filter.connect(this.ampEnv.node);
    this.output = this.ampEnv.node;

    const mix = this.ctx.createGain();
    mix.gain.value = 1 / Math.sqrt(count);
    mix.connect(this.filter);

    for (let i = 0; i < count; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = values.wave as OscillatorType;
      const ratio = useJust ? JUST_RATIOS[i % JUST_RATIOS.length] * Math.pow(2, Math.floor(i / JUST_RATIOS.length)) : 1;
      osc.frequency.value = freq * ratio;
      const t = count === 1 ? 0 : i / (count - 1) - 0.5;
      osc.detune.value = t * detune;

      // Langsamer, unabhängiger Random-Walk pro Stimme (Analog-Drift statt statischer Fläche).
      const lfo = this.ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = driftRate * (0.5 + Math.random());
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = driftDepth * (0.4 + Math.random() * 0.6);
      lfo.connect(lfoGain).connect(osc.detune);

      osc.connect(mix);
      this.oscs.push(osc);
      this.driftLfos.push(lfo);
    }
  }

  trigger(velocity: number, time: number): void {
    for (const o of [...this.oscs, ...this.driftLfos]) o.start(time);
    this.ampEnv.trigger(velocity, time);
  }

  release(time: number): void {
    this.ampEnv.release(time);
    const stopAt = time + this.releaseSeconds + 0.05;
    for (const o of [...this.oscs, ...this.driftLfos]) { try { o.stop(stopAt); } catch { /* noop */ } }
  }

  stop(time: number, fadeSeconds = 0.02): void {
    this.ampEnv.stop(time, fadeSeconds);
    for (const o of [...this.oscs, ...this.driftLfos]) { try { o.stop(time + fadeSeconds + 0.01); } catch { /* noop */ } }
  }

  setParam(paramId: string, value: number | string | boolean, time: number): void {
    if (paramId === "cutoffHz") this.filter.frequency.setTargetAtTime(Number(value), time, 0.01);
  }

  isFinished(time: number): boolean {
    return this.ampEnv.isFinished(time);
  }

  dispose(): void {
    for (const o of [...this.oscs, ...this.driftLfos]) { try { o.disconnect(); } catch { /* noop */ } }
    this.filter.disconnect();
    this.ampEnv.node.disconnect();
  }
}

export const droneEngine: Engine = {
  id: "drone",
  name: "Drone (Detune-Stack)",
  params,
  defaultMacroMap: {
    detune: [{ paramId: "detuneCents", atZero: 0, atOne: 35 }],
    motion: [{ paramId: "driftRateHz", atZero: 0.01, atOne: 0.4 }],
    density: [{ paramId: "voiceCount", atZero: 2, atOne: 8 }],
    brightness: [{ paramId: "cutoffHz", atZero: 200, atOne: 7000 }],
    space: [{ paramId: "release", atZero: 1, atOne: 28 }],
  },
  createVoice(globals, values, note) {
    return new DroneVoice(globals, note, values);
  },
};

export function droneDefaults(): ParamValues {
  return defaultParamValues(params);
}
