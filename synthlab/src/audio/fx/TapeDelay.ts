// Delay-Stufe: Tape-Delay (mono, mit Wow/Flutter + Tiefpass im Feedback) oder
// Ping-Pong (stereo alternierend). Feedback hart geklemmt (ambient-rules.json:
// feedback_delay_stability).
import type { DelaySettings } from "./types";

const MAX_FEEDBACK = 0.92;

export class TapeDelay {
  readonly input: GainNode;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private delayL: DelayNode;
  private delayR: DelayNode;
  private feedbackGainL: GainNode;
  private feedbackGainR: GainNode;
  private toneFilterL: BiquadFilterNode;
  private toneFilterR: BiquadFilterNode;
  private wowLfo: OscillatorNode;
  private wowGain: GainNode;
  private splitter: ChannelSplitterNode;
  private merger: ChannelMergerNode;
  private started = false;
  private settings: DelaySettings;

  constructor(ctx: BaseAudioContext, settings: DelaySettings) {
    this.ctx = ctx;
    this.settings = settings;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    this.delayL = ctx.createDelay(2);
    this.delayR = ctx.createDelay(2);
    this.feedbackGainL = ctx.createGain();
    this.feedbackGainR = ctx.createGain();
    this.toneFilterL = ctx.createBiquadFilter();
    this.toneFilterR = ctx.createBiquadFilter();
    this.toneFilterL.type = "lowpass";
    this.toneFilterR.type = "lowpass";

    this.splitter = ctx.createChannelSplitter(2);
    this.merger = ctx.createChannelMerger(2);

    // Tape-Wow/Flutter: langsame Delay-Zeit-Modulation.
    this.wowLfo = ctx.createOscillator();
    this.wowLfo.type = "sine";
    this.wowLfo.frequency.value = 0.6;
    this.wowGain = ctx.createGain();
    this.wowLfo.connect(this.wowGain);
    this.wowGain.connect(this.delayL.delayTime);
    this.wowGain.connect(this.delayR.delayTime);

    this.input.connect(this.dryGain).connect(this.output);
    this.input.connect(this.splitter);

    // Mono-Tape-Pfad: L->delayL, Feedback zurück in delayL.
    this.splitter.connect(this.delayL, 0);
    this.splitter.connect(this.delayL, 1);
    this.delayL.connect(this.toneFilterL).connect(this.feedbackGainL).connect(this.delayL);
    this.toneFilterL.connect(this.merger, 0, 0);
    this.toneFilterL.connect(this.merger, 0, 1);

    // Ping-Pong-Pfad: rechter Kanal kreuzt in den linken Feedback-Weg und umgekehrt.
    this.splitter.connect(this.delayR, 1);
    this.delayR.connect(this.toneFilterR).connect(this.feedbackGainR).connect(this.delayR);
    this.feedbackGainR.connect(this.delayL); // Kreuzkopplung fuer Ping-Pong
    this.toneFilterR.connect(this.merger, 0, 1);

    this.merger.connect(this.wetGain).connect(this.output);

    this.apply(settings);
  }

  start(time: number): void {
    if (this.started) return;
    this.started = true;
    this.wowLfo.start(time);
  }

  update(settings: DelaySettings): void {
    this.settings = settings;
    this.apply(settings);
  }

  private apply(settings: DelaySettings): void {
    this.wetGain.gain.value = settings.enabled ? settings.mix : 0;
    this.dryGain.gain.value = 1;

    const clampedFeedback = Math.min(MAX_FEEDBACK, Math.max(0, settings.feedback));
    this.delayL.delayTime.setTargetAtTime(settings.timeSeconds, this.ctx.currentTime, 0.02);
    this.delayR.delayTime.setTargetAtTime(settings.timeSeconds, this.ctx.currentTime, 0.02);
    this.feedbackGainL.gain.setTargetAtTime(settings.enabled ? clampedFeedback : 0, this.ctx.currentTime, 0.02);
    this.feedbackGainR.gain.setTargetAtTime(settings.enabled && settings.mode === "pingpong" ? clampedFeedback : 0, this.ctx.currentTime, 0.02);

    const cutoff = 800 + settings.tone * 7000;
    this.toneFilterL.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.02);
    this.toneFilterR.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.02);

    this.wowGain.gain.setTargetAtTime(settings.wowFlutterDepth * 0.003, this.ctx.currentTime, 0.02);
  }

  /** Friert den aktuellen Delay-Inhalt ein (Feedback nahe 1, kein neuer Input mehr). */
  setFreeze(freeze: boolean): void {
    const target = freeze ? 0.999 : Math.min(MAX_FEEDBACK, this.settings.feedback);
    this.feedbackGainL.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
    this.dryGain.gain.setTargetAtTime(freeze ? 0 : 1, this.ctx.currentTime, 0.05);
  }

  dispose(): void {
    try { this.wowLfo.stop(); } catch { /* noop */ }
    for (const n of [this.input, this.output, this.dryGain, this.wetGain, this.delayL, this.delayR,
      this.feedbackGainL, this.feedbackGainR, this.toneFilterL, this.toneFilterR, this.wowLfo,
      this.wowGain, this.splitter, this.merger]) {
      try { n.disconnect(); } catch { /* noop */ }
    }
  }
}
