// Feste FX-Kette pro Preset (PLAN.md Phase 4):
// Drive -> Post-Filter -> Ensemble -> Delay (Tape/PingPong) -> Reverb (FDN/Shimmer) -> Width.
import { Drive } from "./Drive";
import { PostFilter } from "./PostFilter";
import { Ensemble } from "./Ensemble";
import { TapeDelay } from "./TapeDelay";
import { Reverb } from "./Reverb";
import { Width } from "./Width";
import type { FxChainSettings } from "./types";

export class FxChain {
  readonly input: GainNode;
  readonly output: GainNode;
  private drive: Drive;
  private postFilter: PostFilter;
  private ensemble: Ensemble;
  private delay: TapeDelay;
  private reverb: Reverb;
  private width: Width;

  constructor(ctx: BaseAudioContext, settings: FxChainSettings) {
    this.input = ctx.createGain();
    this.output = ctx.createGain();

    this.drive = new Drive(ctx, settings.drive);
    this.postFilter = new PostFilter(ctx, settings.postFilter);
    this.ensemble = new Ensemble(ctx, settings.ensemble);
    this.delay = new TapeDelay(ctx, settings.delay);
    this.reverb = new Reverb(ctx, settings.reverb);
    this.width = new Width(ctx, settings.width);

    this.input
      .connect(this.drive.input);
    this.drive.output.connect(this.postFilter.input);
    this.postFilter.output.connect(this.ensemble.input);
    this.ensemble.output.connect(this.delay.input);
    this.delay.output.connect(this.reverb.input);
    this.reverb.output.connect(this.width.input);
    this.width.output.connect(this.output);
  }

  /** Muss einmalig aufgerufen werden, um interne LFOs/Oszillatoren zu starten. */
  start(time: number): void {
    this.ensemble.start(time);
    this.delay.start(time);
    this.reverb.start(time);
  }

  update(settings: FxChainSettings): void {
    this.drive.update(settings.drive);
    this.postFilter.update(settings.postFilter);
    this.ensemble.update(settings.ensemble);
    this.delay.update(settings.delay);
    this.reverb.update(settings.reverb);
    this.width.update(settings.width);
  }

  setFreeze(freeze: boolean): void {
    this.delay.setFreeze(freeze);
    this.reverb.setFreeze(freeze);
  }

  dispose(): void {
    this.drive.dispose();
    this.postFilter.dispose();
    this.ensemble.dispose();
    this.delay.dispose();
    this.reverb.dispose();
    this.width.dispose();
    this.input.disconnect();
    this.output.disconnect();
  }
}
