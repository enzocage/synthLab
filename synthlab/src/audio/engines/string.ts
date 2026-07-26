// 7. physical_string: Karplus-Strong über eine gefilterte Feedback-Delay-Line.
// Sehr lange decay + tiefpassgefiltertes Feedback = gedämpfte, nicht-perkussive
// Saiten-Drones statt Pluck-Sounds. Rollen: pluck, melody, texture.
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { midiToHz } from "./shared/util";
import { createNoiseSource } from "./shared/noise";

const params: ParamSpec[] = [
  { id: "decay", label: "Decay", kind: "float", min: 0.1, max: 25, default: 6, curve: "log", unit: "s", group: "string", mutationWeight: 0.9 },
  { id: "brightness", label: "Helligkeit", kind: "float", min: 500, max: 8000, default: 3000, curve: "log", unit: "Hz", group: "string", mutationWeight: 0.7 },
  { id: "pluckPosition", label: "Anschlagsposition", kind: "float", min: 0.02, max: 0.5, default: 0.15, group: "excitation" },
  { id: "inharmonicity", label: "Inharmonizität", kind: "float", min: 0, max: 0.02, default: 0.001, group: "string" },
];

class StringVoice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private delay: DelayNode;
  private feedbackGain: GainNode;
  private dampingFilter: BiquadFilterNode;
  private exciter: AudioBufferSourceNode;
  private decaySeconds: number;
  private finishAt = Infinity;

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    const freq = midiToHz(note) * (1 + Number(values.inharmonicity));
    this.decaySeconds = Number(values.decay);

    const delaySeconds = 1 / freq;
    this.delay = this.ctx.createDelay(1);
    this.delay.delayTime.value = delaySeconds;

    this.dampingFilter = this.ctx.createBiquadFilter();
    this.dampingFilter.type = "lowpass";
    this.dampingFilter.frequency.value = Number(values.brightness);
    // Q bewusst <= 0.7071 (Butterworth, kein Passband-Peaking): ein Filter mit
    // Resonanz-Peak > 0dB würde die Feedback-Schleife trotz feedbackGain<1
    // instabil machen (Loop-Gain = feedbackGain * Filterverstaerkung > 1 moeglich).
    this.dampingFilter.Q.value = 0.5;

    this.feedbackGain = this.ctx.createGain();
    // Feedback-Gain aus gewünschter T60 (-60dB Nachklingzeit) ableiten.
    // Empirisch gemessen (BiquadFilterNode.getFrequencyResponse): ein Lowpass in
    // dieser Position kann trotz niedriger Q einen Passband-Peak von bis zu ~1.2x
    // zeigen (Web-Audio-Implementierungsdetail, nicht die idealisierte
    // Analogfilter-Theorie). Ein reiner T60-Wert ohne Sicherheitsmarge kann daher
    // die Schleife trotz feedbackGain<1 instabil aufschaukeln lassen (ambient-
    // rules.json: feedback_delay_stability). Deshalb hier ein harter, von der
    // Filterantwort unabhaengiger Sicherheitsdeckel: loopGain <= 0.9 selbst beim
    // ungünstigsten gemessenen Peak (1.25x).
    const FILTER_PEAK_SAFETY_MARGIN = 1.25;
    const MAX_LOOP_GAIN = 0.9;
    const loopSeconds = delaySeconds;
    const rawFeedback = Math.pow(10, (-3 * loopSeconds) / this.decaySeconds);
    const safeCeiling = MAX_LOOP_GAIN / FILTER_PEAK_SAFETY_MARGIN;
    this.feedbackGain.gain.value = Math.min(safeCeiling, rawFeedback);

    this.output = this.ctx.createGain();
    this.output.gain.value = 1;

    this.delay.connect(this.dampingFilter);
    this.dampingFilter.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delay);
    this.dampingFilter.connect(this.output);

    // Anregung: kurzer gefilterter Rauschstoß entsprechend der Anschlagsposition.
    this.exciter = createNoiseSource(this.ctx, "white", 0.05);
    this.exciter.loop = false;
    const exciteFilter = this.ctx.createBiquadFilter();
    exciteFilter.type = "bandpass";
    exciteFilter.frequency.value = freq / Math.max(Number(values.pluckPosition), 0.02);
    exciteFilter.Q.value = 0.7;
    const exciteGain = this.ctx.createGain();
    exciteGain.gain.value = 0.35;
    this.exciter.connect(exciteFilter).connect(exciteGain).connect(this.delay);
  }

  trigger(velocity: number, time: number): void {
    this.exciter.start(time);
    this.exciter.stop(time + 0.06);
    this.output.gain.setValueAtTime(velocity, time);
    this.finishAt = time + this.decaySeconds + 0.3;
  }

  release(time: number): void {
    // Physikalisch klingende Saite: Release kappt nicht hart, sondern beschleunigt nur leicht die Dämpfung.
    const remaining = this.finishAt - time;
    if (remaining > 1) {
      this.dampingFilter.frequency.setTargetAtTime(this.dampingFilter.frequency.value * 0.6, time, 0.3);
    }
  }

  stop(time: number, fadeSeconds = 0.02): void {
    this.output.gain.setTargetAtTime(0, time, fadeSeconds / 3);
    this.finishAt = time + fadeSeconds + 0.05;
  }

  setParam(paramId: string, value: number | string | boolean, time: number): void {
    if (paramId === "brightness") this.dampingFilter.frequency.setTargetAtTime(Number(value), time, 0.02);
  }

  isFinished(time: number): boolean {
    return time >= this.finishAt;
  }

  dispose(): void {
    try { this.exciter.disconnect(); } catch { /* noop */ }
    this.delay.disconnect();
    this.dampingFilter.disconnect();
    this.feedbackGain.disconnect();
    this.output.disconnect();
  }
}

export const stringEngine: Engine = {
  id: "string",
  name: "String (Karplus-Strong)",
  params,
  defaultMacroMap: {
    space: [{ paramId: "decay", atZero: 0.3, atOne: 22 }],
    brightness: [{ paramId: "brightness", atZero: 400, atOne: 7000 }],
    detune: [{ paramId: "inharmonicity", atZero: 0, atOne: 0.018 }],
  },
  createVoice(globals, values, note) {
    return new StringVoice(globals, note, values);
  },
};

export function stringDefaults(): ParamValues {
  return defaultParamValues(params);
}
