import type { VibratoSettings } from "./types";

export class Vibrato {
  readonly input: GainNode;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private delayNode: DelayNode;
  private lfo: OscillatorNode;
  private lfoGain: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private isEnabled = false;

  constructor(ctx: BaseAudioContext, settings: VibratoSettings) {
    this.ctx = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    // 50ms buffer max for vibrato pitch modulation
    this.delayNode = ctx.createDelay(0.05);
    this.delayNode.delayTime.value = 0.015; // 15ms base delay center

    this.lfo = ctx.createOscillator();
    this.lfo.type = "sine";
    this.lfo.frequency.value = settings.rateHz || 5;

    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 0;

    // Connect LFO to delayTime
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.delayNode.delayTime);

    // Audio routing
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);

    this.input.connect(this.delayNode);
    this.delayNode.connect(this.wetGain);
    this.wetGain.connect(this.output);

    this.lfo.start();
    this.update(settings);
  }

  update(settings: Record<string, any>): void {
    this.isEnabled = Boolean(settings.enabled);
    const rate = Math.max(0.1, Math.min(20, Number(settings.rateHz ?? 5)));
    const depthCents = Math.max(0, Math.min(100, Number(settings.depthCents ?? 15)));

    this.lfo.frequency.setTargetAtTime(rate, this.ctx.currentTime, 0.02);

    // Convert depth in cents to delay time amplitude in seconds
    // cents ~ A * (2 * PI * rate) * (1200 / ln(2))
    const omega = 2 * Math.PI * rate;
    const depthSec = (depthCents * Math.LN2) / (1200 * omega);
    const clampedDepthSec = Math.max(0, Math.min(0.01, depthSec));

    if (this.isEnabled) {
      this.dryGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
      this.wetGain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.02);
      this.lfoGain.gain.setTargetAtTime(clampedDepthSec, this.ctx.currentTime, 0.02);
    } else {
      this.dryGain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.02);
      this.wetGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
      this.lfoGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
    }
  }

  start(_time?: number): void {
    /* LFO already running */
  }

  dispose(): void {
    try { this.lfo.stop(); } catch { /* noop */ }
    try { this.lfo.disconnect(); } catch { /* noop */ }
    try { this.input.disconnect(); } catch { /* noop */ }
    try { this.output.disconnect(); } catch { /* noop */ }
  }
}
