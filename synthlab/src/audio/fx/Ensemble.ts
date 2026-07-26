// Chorus/Ensemble: 3 modulierte Delay-Lines (klassische Chorus-Topologie).
import type { EnsembleSettings } from "./types";

const VOICE_COUNT = 3;
const BASE_DELAY_S = 0.018;

interface Voice { delay: DelayNode; lfo: OscillatorNode; lfoGain: GainNode; pan: StereoPannerNode }

export class Ensemble {
  readonly input: GainNode;
  readonly output: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private voices: Voice[] = [];
  private started = false;

  constructor(ctx: BaseAudioContext, settings: EnsembleSettings) {
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    this.input.connect(this.dryGain).connect(this.output);

    const wetMix = ctx.createGain();
    wetMix.gain.value = 1 / VOICE_COUNT;

    for (let i = 0; i < VOICE_COUNT; i++) {
      const delay = ctx.createDelay(0.05);
      delay.delayTime.value = BASE_DELAY_S * (0.8 + i * 0.2);

      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = settings.rateHz * (0.85 + i * 0.15);
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = settings.depthMs / 1000;

      const pan = ctx.createStereoPanner();
      pan.pan.value = i === 0 ? -0.6 : i === 1 ? 0.6 : 0;

      lfo.connect(lfoGain).connect(delay.delayTime);
      this.input.connect(delay).connect(pan).connect(wetMix);
      this.voices.push({ delay, lfo, lfoGain, pan });
    }

    wetMix.connect(this.wetGain).connect(this.output);
    this.apply(settings);
  }

  /** Muss einmalig gestartet werden (Modulations-LFOs), idealerweise beim ersten Preset-Load. */
  start(time: number): void {
    if (this.started) return;
    this.started = true;
    for (const v of this.voices) v.lfo.start(time);
  }

  update(settings: EnsembleSettings): void {
    this.apply(settings);
    for (let i = 0; i < this.voices.length; i++) {
      this.voices[i].lfo.frequency.setTargetAtTime(settings.rateHz * (0.85 + i * 0.15), 0, 0.05);
      this.voices[i].lfoGain.gain.setTargetAtTime(settings.depthMs / 1000, 0, 0.05);
    }
  }

  private apply(settings: EnsembleSettings): void {
    this.dryGain.gain.value = 1 - settings.amount * 0.5;
    this.wetGain.gain.value = settings.amount;
  }

  dispose(): void {
    for (const v of this.voices) {
      try { v.lfo.stop(); } catch { /* noop */ }
      v.lfo.disconnect();
      v.lfoGain.disconnect();
      v.delay.disconnect();
      v.pan.disconnect();
    }
    this.input.disconnect();
    this.dryGain.disconnect();
    this.wetGain.disconnect();
    this.output.disconnect();
  }
}
