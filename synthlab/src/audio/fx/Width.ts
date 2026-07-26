// Stereo-Width: Mid-Side-Verarbeitung. amount=1 unveraendert, >1 breiter, <1 schmaler/mono.
import type { WidthSettings } from "./types";

export class Width {
  readonly input: GainNode;
  readonly output: GainNode;
  private splitter: ChannelSplitterNode;
  private merger: ChannelMergerNode;
  private midGain: GainNode;
  private sideGain: GainNode;
  private invert: GainNode;
  private sideToL: GainNode;
  private sideToR: GainNode;

  constructor(ctx: BaseAudioContext, settings: WidthSettings) {
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.splitter = ctx.createChannelSplitter(2);
    this.merger = ctx.createChannelMerger(2);

    const sum = ctx.createGain();
    sum.gain.value = 0.5;
    const diff = ctx.createGain();
    diff.gain.value = 0.5;
    this.invert = ctx.createGain();
    this.invert.gain.value = -1;

    this.midGain = ctx.createGain();
    this.sideGain = ctx.createGain();
    this.sideToL = ctx.createGain();
    this.sideToR = ctx.createGain();
    this.sideToR.gain.value = -1;

    this.input.connect(this.splitter);
    // mid = (L+R)/2
    this.splitter.connect(sum, 0);
    this.splitter.connect(sum, 1);
    sum.connect(this.midGain);
    // side = (L-R)/2
    this.splitter.connect(diff, 0);
    this.splitter.connect(this.invert, 1);
    this.invert.connect(diff);
    diff.connect(this.sideGain);

    // L = mid + side, R = mid - side
    this.midGain.connect(this.merger, 0, 0);
    this.midGain.connect(this.merger, 0, 1);
    this.sideGain.connect(this.sideToL).connect(this.merger, 0, 0);
    this.sideGain.connect(this.sideToR).connect(this.merger, 0, 1);

    this.merger.connect(this.output);
    this.apply(settings);
  }

  update(settings: WidthSettings): void {
    this.apply(settings);
  }

  private apply(settings: WidthSettings): void {
    // amount=1 ist mathematisch bereits eine Identitaetsabbildung (Mid/Side
    // rekonstruiert das Original exakt) - bei enabled=false reicht daher amount=1.
    this.sideGain.gain.value = settings.enabled ? settings.amount : 1;
  }

  dispose(): void {
    for (const n of [this.input, this.output, this.splitter, this.merger, this.midGain,
      this.sideGain, this.invert, this.sideToL, this.sideToR]) {
      n.disconnect();
    }
  }
}
