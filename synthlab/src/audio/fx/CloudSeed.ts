// CloudSeed-artiges Diffusions-Reverb: Multitap (frühe Reflexionen) -> modulierter
// Allpass-Diffusor -> 8 parallele gedämpfte, modulierte Verzögerungsleitungen mit
// Cross-Seed-Kopplung zwischen den Kanälen -> später Allpass-Diffusor -> Post-EQ
// (Low-/High-Shelf + Cutoff) -> Dry/Early/Main-Mischung.
//
// Architekturreferenz: ValdemarOrn/CloudSeed (MIT), siehe research/LICENSES.md
// und research/vendor/cloudseed/CloudSeed.Native/ReverbChannel.h. Eigenständige
// Neuimplementierung mit den in SynthLab vorhandenen DSP-Bausteinen (OnePoleLowpass,
// ModulatedAllpass) statt einer 1:1-Portierung des C++-Codes - siehe plan5.md §5.2.
import type { CloudSeedSettings } from "./types";
import { OnePoleLowpass } from "./dsp/onepole";
import { ModulatedAllpass } from "./dsp/modulatedAllpass";

const LINE_COUNT_MAX = 12;
const TAP_COUNT_MAX = 8;
const MAX_LINE_FEEDBACK = 0.985; // Sicherheitsdeckel zusätzlich zur T60-Formel

function preDelayMs(v: number) { return v * 100; }
function highPassHz(v: number) { return 20 * Math.pow(100, v); }
function lowPassHz(v: number) { return 1000 * Math.pow(18, v); }
function tapCountInt(v: number) { return 1 + Math.round(v * (TAP_COUNT_MAX - 1)); }
function tapLengthMs(v: number) { return 5 + v * 95; }
function diffusionDelayMs(v: number) { return 5 + v * 45; }
function diffusionFeedback(v: number) { return 0.3 + v * 0.6; }
function lineCountInt(v: number) { return 4 + Math.round(v * (LINE_COUNT_MAX - 4)); }
function lineDelayMs(v: number) { return 20 + v * 130; }
function lineDecayS(v: number) { return 0.3 + v * 14.7; }
function lateDiffusionDelayMs(v: number) { return 5 + v * 35; }
function lateDiffusionFeedback(v: number) { return 0.3 + v * 0.6; }
function lineModAmountMs(v: number) { return v * 3; }
function lineModRateHz(v: number) { return 0.05 + v * 1.45; }
function shelfGainDb(v: number) { return -12 + v * 18; }
function lowShelfHz(v: number) { return 100 + v * 900; }
function highShelfHz(v: number) { return 2000 + v * 10000; }
function cutoffHz(v: number) { return 2000 + v * 16000; }
function crossSeedAmount(v: number) { return v * 0.35; }
function dbToGain(db: number) { return Math.pow(10, db / 20); }

interface Line {
  delay: DelayNode;
  damping: OnePoleLowpass;
  feedbackGain: GainNode;
  lfoGain: GainNode;
}

class Channel {
  readonly input: GainNode;
  readonly lateSum: GainNode; // Summe aller Lines, VOR Cross-Seed-Rückkopplung entnehmbar
  readonly crossFeedIn: GainNode; // externe Quelle (anderer Kanal) speist hier in die Lines ein
  readonly output: GainNode; // nach spätem Diffusor
  private lines: Line[] = [];
  private lateDiffuser1: ModulatedAllpass;
  private lateDiffuser2: ModulatedAllpass;

  constructor(ctx: BaseAudioContext, spreadSamples: number, sharedLfos: OscillatorNode[]) {
    this.input = ctx.createGain();
    this.crossFeedIn = ctx.createGain();
    this.lateSum = ctx.createGain();
    this.lateSum.gain.value = 1;

    for (let i = 0; i < LINE_COUNT_MAX; i++) {
      const delay = ctx.createDelay(1);
      const damping = new OnePoleLowpass(ctx, 0.3);
      const feedbackGain = ctx.createGain();
      feedbackGain.gain.value = 0;

      this.input.connect(delay);
      this.crossFeedIn.connect(delay);
      delay.connect(damping.input);
      damping.output.connect(feedbackGain).connect(delay);
      damping.output.connect(this.lateSum);

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0;
      sharedLfos[i % sharedLfos.length].connect(lfoGain).connect(delay.delayTime);

      this.lines.push({ delay, damping, feedbackGain, lfoGain });
    }

    this.lateDiffuser1 = new ModulatedAllpass(ctx, Math.round(0.01 * ctx.sampleRate), 0.5, ctx.sampleRate);
    this.lateDiffuser2 = new ModulatedAllpass(ctx, Math.round(0.017 * ctx.sampleRate), 0.5, ctx.sampleRate);
    this.lateSum.connect(this.lateDiffuser1.input);
    this.lateDiffuser1.output.connect(this.lateDiffuser2.input);

    this.output = ctx.createGain();
    this.lateDiffuser2.output.connect(this.output);

    void spreadSamples;
  }

  apply(settings: CloudSeedSettings, sampleRate: number, spreadSamples: number): void {
    const activeCount = lineCountInt(settings.lineCount);
    const baseDelayMs = lineDelayMs(settings.lineDelay);
    const decayS = lineDecayS(settings.lineDecay);
    const modAmountS = lineModAmountMs(settings.lineModAmount) / 1000;

    for (let i = 0; i < LINE_COUNT_MAX; i++) {
      const line = this.lines[i];
      if (i >= activeCount) {
        line.feedbackGain.gain.setTargetAtTime(0, 0, 0.05);
        line.lfoGain.gain.setTargetAtTime(0, 0, 0.05);
        continue;
      }
      // Golden-Ratio-Streuung statt echtem Zufall: deterministisch, aber ohne
      // hörbare periodische Häufung zwischen den Lines (siehe presets/rng.ts-Stil).
      const spread = ((i * 0.61803398875) % 1) * 0.5 + 0.75; // 0.75..1.25
      const delaySamples = Math.max(8, Math.round(((baseDelayMs * spread) / 1000 + spreadSamples / sampleRate) * sampleRate));
      line.delay.delayTime.setTargetAtTime(delaySamples / sampleRate, 0, 0.05);

      const decaySamples = decayS * sampleRate;
      const gainAfter1Iteration = dbToGain((delaySamples / decaySamples) * -60);
      line.feedbackGain.gain.setTargetAtTime(Math.min(MAX_LINE_FEEDBACK, gainAfter1Iteration), 0, 0.05);
      line.damping.setCoeff(0.15 + (1 - settings.lineDecay) * 0.5);
      line.lfoGain.gain.setTargetAtTime(modAmountS * (0.7 + spread * 0.3), 0, 0.05);
    }

    const lateDelayMs1 = lateDiffusionDelayMs(settings.lateDiffusionDelay);
    this.lateDiffuser1.setFeedback(lateDiffusionFeedback(settings.lateDiffusionFeedback));
    this.lateDiffuser1.setDelayMs(lateDelayMs1);
    this.lateDiffuser2.setFeedback(lateDiffusionFeedback(settings.lateDiffusionFeedback) * 0.9);
    this.lateDiffuser2.setDelayMs(lateDelayMs1 * 1.37);
  }

  freeze(active: boolean, time: number): void {
    if (!active) return;
    for (const line of this.lines) {
      line.feedbackGain.gain.setTargetAtTime(0.999, time, 0.05);
    }
  }

  dispose(): void {
    for (const line of this.lines) {
      line.delay.disconnect();
      line.damping.dispose();
      line.feedbackGain.disconnect();
      line.lfoGain.disconnect();
    }
    this.lateDiffuser1.dispose();
    this.lateDiffuser2.dispose();
    this.input.disconnect();
    this.crossFeedIn.disconnect();
    this.lateSum.disconnect();
    this.output.disconnect();
  }
}

export class CloudSeed {
  readonly input: GainNode;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private dryGain: GainNode;
  private earlyGain: GainNode;
  private mainGain: GainNode;

  private inputHighpass: BiquadFilterNode;
  private inputLowpass: BiquadFilterNode;
  private preDelay: DelayNode;

  private multitapTaps: { delay: DelayNode; gain: GainNode }[] = [];
  private multitapOut: GainNode;

  private earlyDiffuser1: ModulatedAllpass;
  private earlyDiffuser2: ModulatedAllpass;
  private earlyDiffuser3: ModulatedAllpass;
  private earlyDiffuser4: ModulatedAllpass;

  private lineLfos: OscillatorNode[] = [];
  private earlyLfo: OscillatorNode;
  private earlyLfoGains: GainNode[] = [];

  private left: Channel;
  private right: Channel;

  private crossSeedGainLtoR: GainNode;
  private crossSeedGainRtoL: GainNode;

  private lowShelf: BiquadFilterNode;
  private highShelf: BiquadFilterNode;
  private cutoff: BiquadFilterNode;
  private lowShelfR: BiquadFilterNode;
  private highShelfR: BiquadFilterNode;
  private cutoffR: BiquadFilterNode;
  private merger: ChannelMergerNode;

  private started = false;
  private lastSettings: CloudSeedSettings;

  constructor(ctx: BaseAudioContext, settings: CloudSeedSettings) {
    this.ctx = ctx;
    this.lastSettings = settings;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.earlyGain = ctx.createGain();
    this.mainGain = ctx.createGain();

    this.input.connect(this.dryGain).connect(this.output);

    this.inputHighpass = ctx.createBiquadFilter();
    this.inputHighpass.type = "highpass";
    this.inputLowpass = ctx.createBiquadFilter();
    this.inputLowpass.type = "lowpass";
    this.input.connect(this.inputHighpass).connect(this.inputLowpass);

    this.preDelay = ctx.createDelay(0.3);
    this.inputLowpass.connect(this.preDelay);

    this.multitapOut = ctx.createGain();
    this.multitapOut.gain.value = 1 / Math.sqrt(TAP_COUNT_MAX);
    for (let i = 0; i < TAP_COUNT_MAX; i++) {
      const delay = ctx.createDelay(0.2);
      const gain = ctx.createGain();
      gain.gain.value = 0;
      this.preDelay.connect(delay).connect(gain).connect(this.multitapOut);
      this.multitapTaps.push({ delay, gain });
    }

    this.earlyLfo = ctx.createOscillator();
    this.earlyLfo.type = "sine";
    this.earlyLfo.frequency.value = 0.2;

    const mkEarly = (delayMs: number, g: number) => {
      const ap = new ModulatedAllpass(ctx, Math.round((delayMs / 1000) * ctx.sampleRate), g, ctx.sampleRate);
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0;
      this.earlyLfo.connect(lfoGain).connect(ap.modInput);
      return { ap, lfoGain };
    };
    const e1 = mkEarly(11, 0.6);
    const e2 = mkEarly(17, 0.6);
    const e3 = mkEarly(23, 0.6);
    const e4 = mkEarly(31, 0.6);
    this.earlyDiffuser1 = e1.ap;
    this.earlyDiffuser2 = e2.ap;
    this.earlyDiffuser3 = e3.ap;
    this.earlyDiffuser4 = e4.ap;
    this.earlyLfoGains = [e1.lfoGain, e2.lfoGain, e3.lfoGain, e4.lfoGain];
    this.multitapOut.connect(this.earlyDiffuser1.input);
    this.earlyDiffuser1.output.connect(this.earlyDiffuser2.input);
    this.earlyDiffuser2.output.connect(this.earlyDiffuser3.input);
    this.earlyDiffuser3.output.connect(this.earlyDiffuser4.input);
    this.earlyDiffuser4.output.connect(this.earlyGain).connect(this.output);

    const LFO_GROUP_COUNT = 4;
    for (let i = 0; i < LFO_GROUP_COUNT; i++) {
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.3 * (0.8 + i * 0.15);
      this.lineLfos.push(lfo);
    }

    const stereoSpread = Math.round(0.001 * ctx.sampleRate);
    this.left = new Channel(ctx, 0, this.lineLfos);
    this.right = new Channel(ctx, stereoSpread, this.lineLfos);
    this.earlyDiffuser4.output.connect(this.left.input);
    this.earlyDiffuser4.output.connect(this.right.input);

    this.crossSeedGainLtoR = ctx.createGain();
    this.crossSeedGainLtoR.gain.value = 0;
    this.crossSeedGainRtoL = ctx.createGain();
    this.crossSeedGainRtoL.gain.value = 0;
    this.left.lateSum.connect(this.crossSeedGainLtoR).connect(this.right.crossFeedIn);
    this.right.lateSum.connect(this.crossSeedGainRtoL).connect(this.left.crossFeedIn);

    this.lowShelf = ctx.createBiquadFilter();
    this.lowShelf.type = "lowshelf";
    this.highShelf = ctx.createBiquadFilter();
    this.highShelf.type = "highshelf";
    this.cutoff = ctx.createBiquadFilter();
    this.cutoff.type = "lowpass";
    this.lowShelfR = ctx.createBiquadFilter();
    this.lowShelfR.type = "lowshelf";
    this.highShelfR = ctx.createBiquadFilter();
    this.highShelfR.type = "highshelf";
    this.cutoffR = ctx.createBiquadFilter();
    this.cutoffR.type = "lowpass";

    // Zwei parallele Post-EQ-Ketten (L/R), über ChannelMerger wieder zu Stereo
    // zusammengeführt - erhält die Stereobreite der Cross-Seed-gekoppelten Lines.
    this.merger = ctx.createChannelMerger(2);
    this.left.output.connect(this.lowShelf).connect(this.highShelf).connect(this.cutoff).connect(this.merger, 0, 0);
    this.right.output.connect(this.lowShelfR).connect(this.highShelfR).connect(this.cutoffR).connect(this.merger, 0, 1);
    this.merger.connect(this.mainGain).connect(this.output);

    this.apply(settings);
  }

  start(time: number): void {
    if (this.started) return;
    this.started = true;
    this.earlyLfo.start(time);
    for (const lfo of this.lineLfos) lfo.start(time);
  }

  update(settings: CloudSeedSettings): void {
    this.apply(settings);
  }

  private apply(settings: CloudSeedSettings): void {
    this.lastSettings = settings;
    const now = this.ctx.currentTime;
    const sr = this.ctx.sampleRate;

    this.dryGain.gain.setTargetAtTime(settings.enabled ? settings.dryOut : 1, now, 0.02);
    this.earlyGain.gain.setTargetAtTime(settings.enabled ? settings.earlyOut : 0, now, 0.02);
    this.mainGain.gain.setTargetAtTime(settings.enabled ? settings.mainOut : 0, now, 0.02);

    if (!settings.enabled) return;

    this.inputHighpass.frequency.setTargetAtTime(highPassHz(settings.highPass), now, 0.02);
    this.inputLowpass.frequency.setTargetAtTime(lowPassHz(settings.lowPass), now, 0.02);
    this.preDelay.delayTime.setTargetAtTime(preDelayMs(settings.preDelay) / 1000, now, 0.02);

    const activeTaps = tapCountInt(settings.tapCount);
    const spreadMs = tapLengthMs(settings.tapLength);
    for (let i = 0; i < TAP_COUNT_MAX; i++) {
      const tap = this.multitapTaps[i];
      if (i >= activeTaps) {
        tap.gain.gain.setTargetAtTime(0, now, 0.02);
        continue;
      }
      const tapMs = ((i + 1) / activeTaps) * spreadMs;
      tap.delay.delayTime.setTargetAtTime(tapMs / 1000, now, 0.02);
      tap.gain.gain.setTargetAtTime(Math.pow(settings.tapDecay, i), now, 0.02);
    }

    const earlyDelayMs = diffusionDelayMs(settings.diffusionDelay);
    const earlyFeedback = diffusionFeedback(settings.diffusionFeedback);
    // Feste relative Stufenverhältnisse (1 / 1.55 / 2.1 / 2.8) um Kammfilter-
    // Überlagerung zwischen den 4 Diffusor-Stufen zu vermeiden.
    const stageRatios = [1, 1.55, 2.1, 2.8];
    for (const [i, ap] of [this.earlyDiffuser1, this.earlyDiffuser2, this.earlyDiffuser3, this.earlyDiffuser4].entries()) {
      ap.setFeedback(earlyFeedback);
      ap.setDelayMs(earlyDelayMs * stageRatios[i]);
    }
    const earlyModS = (lineModAmountMs(settings.lineModAmount) / 1000) * 0.5;
    for (const g of this.earlyLfoGains) g.gain.setTargetAtTime(earlyModS, now, 0.05);
    this.earlyLfo.frequency.setTargetAtTime(lineModRateHz(settings.lineModRate) * 0.6, now, 0.05);
    const lineRateHz = lineModRateHz(settings.lineModRate);
    for (const [i, lfo] of this.lineLfos.entries()) {
      lfo.frequency.setTargetAtTime(lineRateHz * (0.8 + i * 0.15), now, 0.05);
    }

    this.left.apply(settings, sr, 0);
    this.right.apply(settings, sr, Math.round(0.001 * sr));

    const cross = crossSeedAmount(settings.crossSeed);
    this.crossSeedGainLtoR.gain.setTargetAtTime(cross, now, 0.05);
    this.crossSeedGainRtoL.gain.setTargetAtTime(cross, now, 0.05);

    for (const [shelfLow, shelfHigh, cut] of [
      [this.lowShelf, this.highShelf, this.cutoff],
      [this.lowShelfR, this.highShelfR, this.cutoffR],
    ] as const) {
      shelfLow.gain.setTargetAtTime(shelfGainDb(settings.postLowShelfGain), now, 0.02);
      shelfLow.frequency.setTargetAtTime(lowShelfHz(settings.postLowShelfFrequency), now, 0.02);
      shelfHigh.gain.setTargetAtTime(shelfGainDb(settings.postHighShelfGain), now, 0.02);
      shelfHigh.frequency.setTargetAtTime(highShelfHz(settings.postHighShelfFrequency), now, 0.02);
      cut.frequency.setTargetAtTime(cutoffHz(settings.postCutoffFrequency), now, 0.02);
    }
  }

  setFreeze(freeze: boolean): void {
    // Freeze: Line-Feedback auf nahezu 1 -> praktisch unendliches Sustain, wie
    // beim bestehenden Reverb.ts/TapeDelay.ts-Freeze.
    if (freeze) {
      const now = this.ctx.currentTime;
      this.left.freeze(true, now);
      this.right.freeze(true, now);
    } else {
      this.apply(this.lastSettings);
    }
  }

  dispose(): void {
    this.left.dispose();
    this.right.dispose();
    for (const t of this.multitapTaps) {
      t.delay.disconnect();
      t.gain.disconnect();
    }
    this.earlyDiffuser1.dispose();
    this.earlyDiffuser2.dispose();
    this.earlyDiffuser3.dispose();
    this.earlyDiffuser4.dispose();
    try { this.earlyLfo.stop(); } catch { /* noop */ }
    this.earlyLfo.disconnect();
    for (const lfo of this.lineLfos) {
      try { lfo.stop(); } catch { /* noop */ }
      lfo.disconnect();
    }
    for (const n of [
      this.input, this.output, this.dryGain, this.earlyGain, this.mainGain,
      this.inputHighpass, this.inputLowpass, this.preDelay, this.multitapOut,
      this.crossSeedGainLtoR, this.crossSeedGainRtoL,
      this.lowShelf, this.highShelf, this.cutoff,
      this.lowShelfR, this.highShelfR, this.cutoffR, this.merger,
    ]) {
      n.disconnect();
    }
  }
}
