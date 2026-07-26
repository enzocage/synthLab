// 11. phase_distortion: Phasenverzerrter Sinus (WaveShaper auf einem linearen
// Phasor) + Hard Sync für CZ-artige Timbres. Rollen: synth, arp, fx.
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { AdsrGain } from "./shared/envelope";
import { midiToHz, phaseDistortionCurve } from "./shared/util";

const params: ParamSpec[] = [
  { id: "distortionAmount", label: "Verzerrung", kind: "float", min: 0, max: 1, default: 0.4, group: "pd", mutationWeight: 0.9 },
  { id: "syncRatio", label: "Sync-Verhältnis", kind: "float", min: 1, max: 4, default: 1, group: "pd", mutationWeight: 0.6 },
  { id: "envToDistortion", label: "Env->Verzerrung", kind: "float", min: 0, max: 1, default: 0.3, group: "pd" },
  { id: "cutoffHz", label: "Cutoff", kind: "float", min: 300, max: 14000, default: 8000, curve: "log", unit: "Hz", group: "filter", smooth: true },
  { id: "attack", label: "Attack", kind: "float", min: 0.005, max: 3, default: 0.02, curve: "log", unit: "s", group: "env" },
  { id: "decay", label: "Decay", kind: "float", min: 0.02, max: 5, default: 0.6, curve: "log", unit: "s", group: "env" },
  { id: "sustain", label: "Sustain", kind: "float", min: 0, max: 1, default: 0.5, group: "env" },
  { id: "release", label: "Release", kind: "float", min: 0.05, max: 12, default: 1.5, curve: "log", unit: "s", group: "env" },
];

class PhaseDistVoice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private phasor: OscillatorNode; // Sägezahn 0..1 (via WaveShaper-Remap) als linearer Phasenanstieg
  private syncOsc: OscillatorNode;
  private shaper: WaveShaperNode;
  private postFilter: BiquadFilterNode;
  private ampEnv: AdsrGain;
  private releaseSeconds: number;

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    const freq = midiToHz(note);
    this.releaseSeconds = Number(values.release);

    this.phasor = this.ctx.createOscillator();
    this.phasor.type = "sawtooth";
    this.phasor.frequency.value = freq;

    this.syncOsc = this.ctx.createOscillator();
    this.syncOsc.type = "sawtooth";
    this.syncOsc.frequency.value = freq * Number(values.syncRatio);
    const syncGain = this.ctx.createGain();
    syncGain.gain.value = 0.15;
    this.syncOsc.connect(syncGain).connect(this.phasor.frequency);

    this.shaper = this.ctx.createWaveShaper();
    this.shaper.curve = phaseDistortionCurve(Number(values.distortionAmount));
    this.shaper.oversample = "4x";
    this.phasor.connect(this.shaper);

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
    this.phasor.start(time);
    this.syncOsc.start(time);
    this.ampEnv.trigger(velocity, time);
  }

  release(time: number): void {
    this.ampEnv.release(time);
    const stopAt = time + this.releaseSeconds + 0.05;
    try { this.phasor.stop(stopAt); this.syncOsc.stop(stopAt); } catch { /* noop */ }
  }

  stop(time: number, fadeSeconds = 0.02): void {
    this.ampEnv.stop(time, fadeSeconds);
    try { this.phasor.stop(time + fadeSeconds + 0.01); this.syncOsc.stop(time + fadeSeconds + 0.01); } catch { /* noop */ }
  }

  setParam(paramId: string, value: number | string | boolean, time: number): void {
    if (paramId === "distortionAmount") this.shaper.curve = phaseDistortionCurve(Number(value));
    if (paramId === "cutoffHz") this.postFilter.frequency.setTargetAtTime(Number(value), time, 0.01);
  }

  isFinished(time: number): boolean {
    return this.ampEnv.isFinished(time);
  }

  dispose(): void {
    try { this.phasor.disconnect(); this.syncOsc.disconnect(); } catch { /* noop */ }
    this.shaper.disconnect();
    this.postFilter.disconnect();
    this.ampEnv.node.disconnect();
  }
}

export const phasedistEngine: Engine = {
  id: "phasedist",
  name: "Phase Distortion",
  params,
  defaultMacroMap: {
    brightness: [{ paramId: "distortionAmount", atZero: 0, atOne: 0.9 }],
    drive: [{ paramId: "syncRatio", atZero: 1, atOne: 3.5 }],
    space: [{ paramId: "release", atZero: 0.1, atOne: 9 }],
  },
  createVoice(globals, values, note) {
    return new PhaseDistVoice(globals, note, values);
  },
};

export function phasedistDefaults(): ParamValues {
  return defaultParamValues(params);
}
