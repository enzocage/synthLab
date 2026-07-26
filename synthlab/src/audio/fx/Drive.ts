// Drive/Saturation-Stufe der FX-Kette. WaveShaper mit tanh-Kurve (shared/util.ts).
import { saturationCurve } from "../engines/shared/util";
import type { DriveSettings } from "./types";

export class Drive {
  readonly input: GainNode;
  readonly output: GainNode;
  private shaper: WaveShaperNode;
  private makeupGain: GainNode;

  constructor(ctx: BaseAudioContext, settings: DriveSettings) {
    this.input = ctx.createGain();
    this.shaper = ctx.createWaveShaper();
    this.shaper.oversample = "2x";
    this.shaper.curve = saturationCurve(settings.amount);
    this.makeupGain = ctx.createGain();
    this.makeupGain.gain.value = 1 / (1 + settings.amount * 0.3); // leichte Kompensation der wahrgenommenen Lautheit
    this.output = ctx.createGain();

    this.input.connect(this.shaper).connect(this.makeupGain).connect(this.output);
  }

  update(settings: DriveSettings): void {
    this.shaper.curve = saturationCurve(settings.amount);
    this.makeupGain.gain.value = 1 / (1 + settings.amount * 0.3);
  }

  dispose(): void {
    this.input.disconnect();
    this.shaper.disconnect();
    this.makeupGain.disconnect();
    this.output.disconnect();
  }
}
