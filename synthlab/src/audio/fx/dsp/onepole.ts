// Echtes Ein-Pol-Tiefpassfilter (Exponential Moving Average) aus DelayNode +
// GainNode statt BiquadFilterNode. y[n] = (1-c)*x[n] + c*y[n-1] hat beweisbar
// Verstaerkung <= 1 bei jeder Frequenz (Maximum exakt 1 bei DC) - im Gegensatz
// zu BiquadFilterNode, das in dieser Web-Audio-Implementierung empirisch einen
// Passband-Peak von ~1.15-1.2x zeigt (siehe string.ts/Reverb.ts-Historie).
// Genau dieses Filter verwendet das klassische Freeverb im Kammfilter-Feedback.
export class OnePoleLowpass {
  readonly input: GainNode; // externe Quellen verbinden hierher (Feedforward-Pfad)
  readonly output: GainNode; // externe Ziele lesen von hier (Akkumulator = y[n])
  private feedforward: GainNode;
  private feedbackGain: GainNode;

  constructor(ctx: BaseAudioContext, coeff: number) {
    this.output = ctx.createGain();
    this.output.gain.value = 1;

    this.feedforward = ctx.createGain();
    this.input = this.feedforward;

    const feedbackDelay = ctx.createDelay(1);
    feedbackDelay.delayTime.value = 1 / ctx.sampleRate;
    this.feedbackGain = ctx.createGain();

    this.feedforward.connect(this.output);
    this.output.connect(feedbackDelay).connect(this.feedbackGain).connect(this.output);

    this.setCoeff(coeff);
  }

  setCoeff(coeff: number): void {
    const c = Math.min(0.995, Math.max(0, coeff));
    this.feedforward.gain.value = 1 - c;
    this.feedbackGain.gain.value = c;
  }

  dispose(): void {
    this.feedforward.disconnect();
    this.feedbackGain.disconnect();
    this.output.disconnect();
  }
}
