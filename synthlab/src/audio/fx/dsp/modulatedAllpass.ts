// Modulierter Schroeder-Allpass: wie dsp/allpass.ts, aber die Delay-Zeit wird von
// einem externen LFO-Signal (additiv auf delayTime) angeregt - Grundbaustein der
// "Diffusion Stages" in CloudSeed (ValdemarOrn/CloudSeed, MIT, siehe
// research/LICENSES.md). Eigenständige Neuimplementierung mit WebAudio-DelayNode
// statt 1:1-Portierung des C++-Rings (research/vendor/cloudseed/CloudSeed.Native/ModulatedAllpass.h).
export class ModulatedAllpass {
  readonly input: GainNode;
  readonly output: GainNode;
  readonly modInput: GainNode; // LFO-Signal hier anschließen, um delayTime zu modulieren
  private ctx: BaseAudioContext;
  private delay: DelayNode;
  private feedbackGain: GainNode;
  private negGain: GainNode;

  constructor(ctx: BaseAudioContext, delaySamples: number, g: number, sampleRate: number) {
    this.ctx = ctx;
    this.input = ctx.createGain();
    const delay = ctx.createDelay(1);
    this.delay = delay;
    delay.delayTime.value = delaySamples / sampleRate;

    this.modInput = ctx.createGain();
    this.modInput.gain.value = 1 / sampleRate;
    this.modInput.connect(delay.delayTime);

    this.feedbackGain = ctx.createGain();
    this.feedbackGain.gain.value = g;
    this.input.connect(delay);
    delay.connect(this.feedbackGain).connect(this.input);

    this.output = ctx.createGain();
    this.negGain = ctx.createGain();
    this.negGain.gain.value = -g;
    this.input.connect(this.negGain).connect(this.output);
    delay.connect(this.output);
  }

  setFeedback(g: number): void {
    const clamped = Math.min(0.97, Math.max(-0.97, g));
    const now = this.ctx.currentTime;
    this.feedbackGain.gain.setTargetAtTime(clamped, now, 0.02);
    this.negGain.gain.setTargetAtTime(-clamped, now, 0.02);
  }

  setDelayMs(ms: number): void {
    this.delay.delayTime.setTargetAtTime(Math.max(0.0005, ms / 1000), this.ctx.currentTime, 0.02);
  }

  dispose(): void {
    this.input.disconnect();
    this.output.disconnect();
    this.modInput.disconnect();
    this.feedbackGain.disconnect();
    this.negGain.disconnect();
  }
}
