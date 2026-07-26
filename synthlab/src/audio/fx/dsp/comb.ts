// Gedaempftes Kammfilter (Freeverb-Baustein): Delay -> Ein-Pol-Tiefpass (Damping)
// -> Feedback-Gain (Room Size) zurueck in die Delay-Line. Stabil, solange
// feedback < 1 (Ein-Pol-Filter kann per Konstruktion keine Verstaerkung > 1
// einbringen, siehe onepole.ts).
import { OnePoleLowpass } from "./onepole";

export class CombFilter {
  readonly input: GainNode;
  readonly output: GainNode;
  private delay: DelayNode;
  private damping: OnePoleLowpass;
  private feedbackGain: GainNode;

  constructor(ctx: BaseAudioContext, delaySamples: number, feedback: number, dampingCoeff: number) {
    this.input = ctx.createGain();
    this.delay = ctx.createDelay(1);
    this.delay.delayTime.value = delaySamples / ctx.sampleRate;
    this.damping = new OnePoleLowpass(ctx, dampingCoeff);
    this.feedbackGain = ctx.createGain();
    this.feedbackGain.gain.value = feedback;

    this.input.connect(this.delay);
    this.delay.connect(this.damping.input);
    this.damping.output.connect(this.feedbackGain).connect(this.delay);

    this.output = this.damping.output;
  }

  setFeedback(feedback: number): void {
    this.feedbackGain.gain.value = Math.min(0.9999, Math.max(0, feedback));
  }

  setDamping(coeff: number): void {
    this.damping.setCoeff(coeff);
  }

  dispose(): void {
    this.input.disconnect();
    this.delay.disconnect();
    this.damping.dispose();
    this.feedbackGain.disconnect();
  }
}
