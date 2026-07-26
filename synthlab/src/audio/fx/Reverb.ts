// Reverb-Stufe: N-Kanal-Feedback-Delay-Netzwerk (Delayzeiten aus
// research/derived/reverb-topologies.json, fundsp-Herkunft) + Diffusions-
// Allpaesse + optionaler Shimmer-Tap (Pitch-Shift im Feedback) + Freeze.
// Feedback-Gain immer hart geklemmt (ambient-rules.json: feedback_delay_stability).
import type { ReverbSettings } from "./types";
import reverbData from "../../data/derived/reverb-topologies.json";

const ALL_DELAYS = reverbData.fdn32.delaysSeconds as number[];
const BASE_ROOM = reverbData.fdn32.baseRoomSizeMeters as number;
// Aus Performance-Gruenden 10 von 32 Delaylines nutzen (gute Dichte, moderate CPU-Last).
const CHANNEL_COUNT = 10;
const CHANNEL_DELAYS = ALL_DELAYS.filter((_, i) => i % 3 === 0).slice(0, CHANNEL_COUNT);
// Sicherheitsmarge wie in string.ts empirisch ermittelt: BiquadFilterNode-Lowpass
// kann im Feedback-Pfad einen Passband-Peak von ~1.2x zeigen, unabhaengig von Q.
// Bei 10 parallelen, teils gekoppelten Kanaelen zusaetzlich konservativer gerechnet.
const FILTER_PEAK_SAFETY_MARGIN = 1.25;
const MAX_LOOP_GAIN = 0.94;
const MAX_FEEDBACK = MAX_LOOP_GAIN / FILTER_PEAK_SAFETY_MARGIN; // ~0.752
const FREEZE_FEEDBACK = 0.985 / FILTER_PEAK_SAFETY_MARGIN; // ~0.788, dennoch sehr lange Nachklingzeit

interface Channel {
  delay: DelayNode;
  damping: BiquadFilterNode;
  feedback: GainNode;
  pan: StereoPannerNode;
  baseDelaySeconds: number;
}

/** Einfacher Pitch-Shifter via zwei gegenphasig rampenden Delay-Lines (Sawtooth-Delay-Trick). */
class SimplePitchShifter {
  readonly input: GainNode;
  readonly output: GainNode;
  private delayA: DelayNode;
  private delayB: DelayNode;
  private gainA: GainNode;
  private gainB: GainNode;
  private lfo: OscillatorNode;
  private started = false;

  constructor(ctx: BaseAudioContext, semitones: number) {
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.delayA = ctx.createDelay(0.3);
    this.delayB = ctx.createDelay(0.3);
    this.gainA = ctx.createGain();
    this.gainB = ctx.createGain();

    const windowMs = 90;
    const rate = 1000 / windowMs; // Hz, Sawtooth-Wiederholrate
    this.lfo = ctx.createOscillator();
    this.lfo.type = "sawtooth";
    this.lfo.frequency.value = rate;

    const ratio = Math.pow(2, semitones / 12);
    const depth = (windowMs / 1000) * (1 - 1 / ratio);

    const toDelayA = ctx.createGain();
    toDelayA.gain.value = depth;
    const toDelayB = ctx.createGain();
    toDelayB.gain.value = -depth;
    const offset = ctx.createConstantSource();
    offset.offset.value = depth / 2;

    this.lfo.connect(toDelayA);
    this.lfo.connect(toDelayB);
    toDelayA.connect(this.delayA.delayTime);
    toDelayB.connect(this.delayB.delayTime);
    offset.connect(this.delayA.delayTime);
    offset.connect(this.delayB.delayTime);
    offset.start();

    // Amplitudenfenster gegenphasig (Crossfade), damit der Delay-Reset unhoerbar bleibt.
    const winLfo = ctx.createOscillator();
    winLfo.type = "triangle";
    winLfo.frequency.value = rate;
    const winGainA = ctx.createGain();
    winGainA.gain.value = 0.5;
    const winOffsetA = ctx.createConstantSource();
    winOffsetA.offset.value = 0.5;
    winLfo.connect(winGainA);
    winGainA.connect(this.gainA.gain);
    winOffsetA.connect(this.gainA.gain);
    winOffsetA.start();

    const invert = ctx.createGain();
    invert.gain.value = -1;
    winLfo.connect(invert).connect(this.gainB.gain);
    winOffsetA.connect(this.gainB.gain);

    this.input.connect(this.delayA).connect(this.gainA).connect(this.output);
    this.input.connect(this.delayB).connect(this.gainB).connect(this.output);

    (this as unknown as { _extraOscs: OscillatorNode[] })._extraOscs = [winLfo];
    (this as unknown as { _extraSources: ConstantSourceNode[] })._extraSources = [offset, winOffsetA];
  }

  start(time: number): void {
    if (this.started) return;
    this.started = true;
    this.lfo.start(time);
    for (const o of (this as unknown as { _extraOscs: OscillatorNode[] })._extraOscs) o.start(time);
  }

  dispose(): void {
    try { this.lfo.stop(); } catch { /* noop */ }
    for (const o of (this as unknown as { _extraOscs: OscillatorNode[] })._extraOscs) { try { o.stop(); } catch { /* noop */ } }
    for (const s of (this as unknown as { _extraSources: ConstantSourceNode[] })._extraSources) { try { s.stop(); } catch { /* noop */ } }
    this.input.disconnect();
    this.output.disconnect();
    this.delayA.disconnect();
    this.delayB.disconnect();
    this.gainA.disconnect();
    this.gainB.disconnect();
  }
}

export class Reverb {
  readonly input: GainNode;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private channels: Channel[] = [];
  private allpassL: BiquadFilterNode;
  private allpassR: BiquadFilterNode;
  private shimmer: SimplePitchShifter;
  private shimmerGain: GainNode;
  private shimmerFeedbackGain: GainNode;
  private started = false;
  private lastSettings: ReverbSettings;

  constructor(ctx: BaseAudioContext, settings: ReverbSettings) {
    this.ctx = ctx;
    this.lastSettings = settings;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    this.allpassL = ctx.createBiquadFilter();
    this.allpassL.type = "allpass";
    this.allpassL.frequency.value = 800;
    this.allpassR = ctx.createBiquadFilter();
    this.allpassR.type = "allpass";
    this.allpassR.frequency.value = 1100;

    const sumL = ctx.createGain();
    const sumR = ctx.createGain();
    sumL.gain.value = 1 / Math.sqrt(CHANNEL_COUNT);
    sumR.gain.value = 1 / Math.sqrt(CHANNEL_COUNT);

    this.shimmer = new SimplePitchShifter(ctx, settings.shimmerAmountSemitones);
    this.shimmerGain = ctx.createGain();
    this.shimmerGain.gain.value = 0;
    this.shimmerFeedbackGain = ctx.createGain();
    this.shimmerFeedbackGain.gain.value = 0;

    this.input.connect(this.dryGain).connect(this.output);

    for (let i = 0; i < CHANNEL_DELAYS.length; i++) {
      const delay = ctx.createDelay(2);
      delay.delayTime.value = CHANNEL_DELAYS[i];
      const damping = ctx.createBiquadFilter();
      damping.type = "lowpass";
      damping.frequency.value = 6000;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.85;
      const pan = ctx.createStereoPanner();
      pan.pan.value = (i / (CHANNEL_DELAYS.length - 1)) * 2 - 1;

      this.input.connect(delay);
      delay.connect(damping);
      damping.connect(feedback);
      feedback.connect(delay);

      damping.connect(pan);
      pan.connect(sumL);
      pan.connect(sumR);

      this.channels.push({ delay, damping, feedback, pan, baseDelaySeconds: CHANNEL_DELAYS[i] });
    }

    sumL.connect(this.allpassL);
    sumR.connect(this.allpassR);
    this.allpassL.connect(this.wetGain);
    this.allpassR.connect(this.wetGain);
    this.wetGain.connect(this.output);

    // Shimmer als eigenstaendige, vom FDN entkoppelte Schleife: speist sich aus
    // der bereits gemischten Wet-Summe und faengt sich selbst wieder ein
    // (eigener, unabhaengig begrenzter Feedback-Pfad statt Injektion in alle
    // 10 Delay-Lines - deutlich einfacher stabil zu halten).
    this.allpassL.connect(this.shimmer.input);
    this.allpassR.connect(this.shimmer.input);
    this.shimmer.output.connect(this.shimmerGain);
    this.shimmerGain.connect(this.output);
    this.shimmerGain.connect(this.shimmerFeedbackGain);
    this.shimmerFeedbackGain.connect(this.shimmer.input);

    this.apply(settings);
  }

  start(time: number): void {
    if (this.started) return;
    this.started = true;
    this.shimmer.start(time);
  }

  update(settings: ReverbSettings): void {
    this.apply(settings);
  }

  /** Friert unabhaengig von der uebrigen FX-Kette ein/aus (Freeze-Taste in Phase 7). */
  setFreeze(freeze: boolean): void {
    this.apply({ ...this.lastSettings, freeze });
  }

  private apply(settings: ReverbSettings): void {
    this.lastSettings = settings;
    const off = settings.mode === "off";
    this.wetGain.gain.setTargetAtTime(off ? 0 : settings.mix, this.ctx.currentTime, 0.02);
    this.dryGain.gain.value = 1;

    const roomScale = settings.roomSizeMeters / BASE_ROOM;
    const targetFeedback = off
      ? 0
      : settings.freeze
        ? FREEZE_FEEDBACK
        : Math.min(MAX_FEEDBACK, Math.pow(10, (-3 * (CHANNEL_DELAYS[0] * roomScale)) / Math.max(0.1, settings.decaySeconds)));
    const dampingHz = 1000 + (1 - settings.damping) * 8000;

    for (const ch of this.channels) {
      ch.delay.delayTime.setTargetAtTime(ch.baseDelaySeconds * roomScale, this.ctx.currentTime, 0.05);
      ch.feedback.gain.setTargetAtTime(targetFeedback, this.ctx.currentTime, 0.05);
      ch.damping.frequency.setTargetAtTime(dampingHz, this.ctx.currentTime, 0.05);
    }

    // Shimmer: eigener, unabhaengig begrenzter Feedback-Pfad (siehe Konstruktor).
    // MAX_SHIMMER_FEEDBACK deutlich unter 1 gehalten, weil der Pitch-Shifter selbst
    // durch sein Fenster-Crossfading nicht als exakt unity-gain garantiert werden kann.
    const shimmerActive = settings.mode === "shimmer" && !off;
    const MAX_SHIMMER_FEEDBACK = 0.55;
    this.shimmerGain.gain.setTargetAtTime(shimmerActive ? 0.5 : 0, this.ctx.currentTime, 0.05);
    this.shimmerFeedbackGain.gain.setTargetAtTime(shimmerActive ? MAX_SHIMMER_FEEDBACK : 0, this.ctx.currentTime, 0.05);
    this.dryGain.gain.setTargetAtTime(settings.freeze ? 0 : 1, this.ctx.currentTime, 0.05);
  }

  dispose(): void {
    this.shimmer.dispose();
    for (const ch of this.channels) {
      ch.delay.disconnect();
      ch.damping.disconnect();
      ch.feedback.disconnect();
      ch.pan.disconnect();
    }
    for (const n of [this.input, this.output, this.dryGain, this.wetGain, this.allpassL, this.allpassR, this.shimmerGain, this.shimmerFeedbackGain]) {
      n.disconnect();
    }
  }
}
