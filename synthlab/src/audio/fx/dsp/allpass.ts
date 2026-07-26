// Schroeder-Allpassfilter (Freeverb-Baustein) fuer Diffusion. Eine einzelne
// Delay-Line mit zwei Abgriffen: v[n] = x[n] + g*v[n-D], y[n] = -g*v[n] + v[n-D].
// Allpaesse haben per Definition |H(w)| = 1 bei jeder Frequenz - unabhaengig
// von der Implementierung unbedingt stabil fuer |g| < 1.
export class AllpassFilter {
  readonly input: GainNode; // = v[n]-Akkumulator, externe Quellen verbinden hierher
  readonly output: GainNode; // = y[n]

  constructor(ctx: BaseAudioContext, delaySamples: number, g = 0.5) {
    this.input = ctx.createGain();
    const delay = ctx.createDelay(1);
    delay.delayTime.value = delaySamples / ctx.sampleRate;
    const feedbackGain = ctx.createGain();
    feedbackGain.gain.value = g;

    this.input.connect(delay);
    delay.connect(feedbackGain).connect(this.input);

    this.output = ctx.createGain();
    const negGain = ctx.createGain();
    negGain.gain.value = -g;
    this.input.connect(negGain).connect(this.output);
    delay.connect(this.output);
  }

  dispose(): void {
    this.input.disconnect();
    this.output.disconnect();
  }
}
