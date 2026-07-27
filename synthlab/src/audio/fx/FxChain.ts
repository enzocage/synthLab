// Feste FX-Kette pro Preset (PLAN.md Phase 4, erweitert um plan5 CloudSeed):
// Drive -> Post-Filter -> Ensemble -> Delay (Tape/PingPong) -> Reverb (FDN/Shimmer)
// -> CloudSeed (Diffusions-Reverb) -> Width.
import { Drive } from "./Drive";
import { PostFilter } from "./PostFilter";
import { Ensemble } from "./Ensemble";
import { TapeDelay } from "./TapeDelay";
import { Reverb } from "./Reverb";
import { CloudSeed } from "./CloudSeed";
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
  private cloudSeed: CloudSeed;
  private width: Width;

  constructor(ctx: BaseAudioContext, settings: FxChainSettings) {
    this.input = ctx.createGain();
    this.output = ctx.createGain();

    this.drive = new Drive(ctx, settings.drive);
    this.postFilter = new PostFilter(ctx, settings.postFilter);
    this.ensemble = new Ensemble(ctx, settings.ensemble);
    this.delay = new TapeDelay(ctx, settings.delay);
    this.reverb = new Reverb(ctx, settings.reverb);
    this.cloudSeed = new CloudSeed(ctx, settings.cloudSeed);
    this.width = new Width(ctx, settings.width);

    this.input
      .connect(this.drive.input);
    this.drive.output.connect(this.postFilter.input);
    this.postFilter.output.connect(this.ensemble.input);
    this.ensemble.output.connect(this.delay.input);
    this.delay.output.connect(this.reverb.input);
    this.reverb.output.connect(this.cloudSeed.input);
    this.cloudSeed.output.connect(this.width.input);
    this.width.output.connect(this.output);
  }

  /** Muss einmalig aufgerufen werden, um interne LFOs/Oszillatoren zu starten. */
  start(time: number): void {
    this.ensemble.start(time);
    this.delay.start(time);
    this.reverb.start(time);
    this.cloudSeed.start(time);
  }

  update(settings: FxChainSettings): void {
    this.drive.update(settings.drive);
    this.postFilter.update(settings.postFilter);
    this.ensemble.update(settings.ensemble);
    this.delay.update(settings.delay);
    this.reverb.update(settings.reverb);
    this.cloudSeed.update(settings.cloudSeed);
    this.width.update(settings.width);
  }

  setFreeze(freeze: boolean): void {
    this.delay.setFreeze(freeze);
    this.reverb.setFreeze(freeze);
    this.cloudSeed.setFreeze(freeze);
  }

  dispose(): void {
    this.drive.dispose();
    this.postFilter.dispose();
    this.ensemble.dispose();
    this.delay.dispose();
    this.reverb.dispose();
    this.cloudSeed.dispose();
    this.width.dispose();
    this.input.disconnect();
    this.output.disconnect();
  }
}
