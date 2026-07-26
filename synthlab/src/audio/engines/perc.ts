// 12. percussive_models: Analog-/Synth-Percussion (Kick/Snare/Hat-artig) plus
// Drip/Modal-Perkussion. In Ambient meist sehr weich/gefiltert. Rolle: rhythm.
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { createNoiseSource } from "./shared/noise";
import { midiToHz } from "./shared/util";

const params: ParamSpec[] = [
  { id: "tone", label: "Tonhöhe/Tonanteil", kind: "float", min: 0, max: 1, default: 0.5, group: "perc", mutationWeight: 0.7 },
  { id: "decay", label: "Decay", kind: "float", min: 0.02, max: 3, default: 0.35, curve: "log", unit: "s", group: "perc", mutationWeight: 0.8 },
  { id: "punch", label: "Punch (Pitch-Drop)", kind: "float", min: 0, max: 1, default: 0.5, group: "perc" },
  { id: "noiseMix", label: "Rauschanteil", kind: "float", min: 0, max: 1, default: 0.4, group: "perc" },
  { id: "softness", label: "Weichheit (Tiefpass)", kind: "float", min: 400, max: 12000, default: 4000, curve: "log", unit: "Hz", group: "filter", mutationWeight: 0.6 },
];

class PercVoice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private tone: OscillatorNode;
  private toneGain: GainNode;
  private noise: AudioBufferSourceNode;
  private noiseGain: GainNode;
  private noiseFilter: BiquadFilterNode;
  private softFilter: BiquadFilterNode;
  private decaySeconds: number;
  private punch: number;
  private finishAt = Infinity;

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    const baseFreq = midiToHz(note);
    this.decaySeconds = Number(values.decay);
    this.punch = Number(values.punch);
    const tone = Number(values.tone);

    this.tone = this.ctx.createOscillator();
    this.tone.type = "sine";
    this.tone.frequency.value = baseFreq * 0.5 + baseFreq * 0.5 * tone;

    this.toneGain = this.ctx.createGain();
    this.toneGain.gain.value = 1 - Number(values.noiseMix);
    this.tone.connect(this.toneGain);

    this.noise = createNoiseSource(this.ctx, "white", 1);
    this.noiseFilter = this.ctx.createBiquadFilter();
    this.noiseFilter.type = "highpass";
    this.noiseFilter.frequency.value = 800 + tone * 6000;
    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = Number(values.noiseMix);
    this.noise.connect(this.noiseFilter).connect(this.noiseGain);

    this.softFilter = this.ctx.createBiquadFilter();
    this.softFilter.type = "lowpass";
    this.softFilter.frequency.value = Number(values.softness);

    this.output = this.ctx.createGain();
    this.output.gain.value = 1;
    this.toneGain.connect(this.softFilter);
    this.noiseGain.connect(this.softFilter);
    this.softFilter.connect(this.output);
  }

  trigger(velocity: number, time: number): void {
    const g = this.output.gain;
    g.cancelScheduledValues(time);
    g.setValueAtTime(velocity, time);
    g.exponentialRampToValueAtTime(Math.max(velocity * 0.001, 0.0001), time + this.decaySeconds);

    // Punch: kurzer Pitch-Drop zu Beginn (klassischer Kick/Tom-Charakter).
    const f = this.tone.frequency;
    const dropMultiplier = 1 + this.punch * 3;
    f.setValueAtTime(f.value * dropMultiplier, time);
    f.exponentialRampToValueAtTime(f.value, time + this.decaySeconds * 0.3);

    this.tone.start(time);
    this.noise.start(time);
    this.finishAt = time + this.decaySeconds + 0.05;
  }

  release(): void {
    // Perkussion hat kein Sustain/Release im klassischen Sinn; Decay bestimmt die Länge.
  }

  stop(time: number, fadeSeconds = 0.02): void {
    this.output.gain.setTargetAtTime(0, time, fadeSeconds / 3);
    this.finishAt = time + fadeSeconds + 0.05;
  }

  setParam(): void {
    // Perkussionsklang ist pro Hit fest; Änderungen wirken auf den nächsten Trigger.
  }

  isFinished(time: number): boolean {
    return time >= this.finishAt;
  }

  dispose(): void {
    try { this.tone.disconnect(); this.noise.disconnect(); } catch { /* noop */ }
    this.toneGain.disconnect();
    this.noiseFilter.disconnect();
    this.noiseGain.disconnect();
    this.softFilter.disconnect();
    this.output.disconnect();
  }
}

export const percEngine: Engine = {
  id: "perc",
  name: "Percussion",
  params,
  defaultMacroMap: {
    brightness: [{ paramId: "softness", atZero: 500, atOne: 10000 }],
    density: [{ paramId: "noiseMix", atZero: 0, atOne: 1 }],
    drive: [{ paramId: "punch", atZero: 0, atOne: 1 }],
    space: [{ paramId: "decay", atZero: 0.05, atOne: 2.5 }],
  },
  createVoice(globals, values, note) {
    return new PercVoice(globals, note, values);
  },
};

export function percDefaults(): ParamValues {
  return defaultParamValues(params);
}
