// Drive/Saturation-Stufe der FX-Kette. WaveShaper mit tanh-Kurve (shared/util.ts).
// `enabled=false` bypassed das Modul komplett (Ableton-Device-Power-Schalter).
import { saturationCurve } from "../engines/shared/util";
import type { DriveSettings } from "./types";

export class Drive {
  readonly input: GainNode;
  readonly output: GainNode;
  private shaper: WaveShaperNode;
  private makeupGain: GainNode;
  private wetGain: GainNode;
  private dryGain: GainNode;

  constructor(ctx: BaseAudioContext, settings: DriveSettings) {
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.shaper = ctx.createWaveShaper();
    this.shaper.oversample = "2x";
    this.shaper.curve = saturationCurve(settings.amount);
    this.makeupGain = ctx.createGain();

    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    this.input.connect(this.dryGain).connect(this.output);
    this.input.connect(this.shaper).connect(this.makeupGain).connect(this.wetGain).connect(this.output);

    this.apply(settings);
  }

  update(settings: DriveSettings): void {
    this.shaper.curve = saturationCurve(settings.amount);
    this.apply(settings);
  }

  private apply(settings: DriveSettings): void {
    this.makeupGain.gain.value = 1 / (1 + settings.amount * 0.3);
    this.wetGain.gain.value = settings.enabled ? 1 : 0;
    this.dryGain.gain.value = settings.enabled ? 0 : 1;
  }

  dispose(): void {
    this.input.disconnect();
    this.shaper.disconnect();
    this.makeupGain.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
    this.output.disconnect();
  }
}
