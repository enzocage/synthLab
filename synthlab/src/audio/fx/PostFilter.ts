// Post-Filter-Stufe: günstiger Biquad-Filter in der FX-Kette (research/derived/filter-models.json#biquad_lowpass).
import type { PostFilterSettings } from "./types";

export class PostFilter {
  readonly input: GainNode;
  readonly output: GainNode;
  private filter: BiquadFilterNode;
  private bypassGain: GainNode;
  private wetGain: GainNode;

  constructor(ctx: BaseAudioContext, settings: PostFilterSettings) {
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.filter = ctx.createBiquadFilter();
    this.bypassGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    this.input.connect(this.filter);
    this.filter.connect(this.wetGain).connect(this.output);
    this.input.connect(this.bypassGain).connect(this.output);

    this.apply(settings);
  }

  update(settings: PostFilterSettings): void {
    this.apply(settings);
  }

  private apply(settings: PostFilterSettings): void {
    const off = settings.type === "off";
    this.filter.type = off ? "allpass" : (settings.type as BiquadFilterType);
    this.filter.frequency.value = settings.cutoffHz;
    this.filter.Q.value = settings.q;
    this.wetGain.gain.value = off ? 0 : 1;
    this.bypassGain.gain.value = off ? 1 : 0;
  }

  dispose(): void {
    this.input.disconnect();
    this.filter.disconnect();
    this.bypassGain.disconnect();
    this.wetGain.disconnect();
    this.output.disconnect();
  }
}
