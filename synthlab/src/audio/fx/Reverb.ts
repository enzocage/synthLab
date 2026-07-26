// Reverb-Stufe: klassisches Freeverb-Design (Jezar al., public-domain-Algorithmus,
// Referenz auch in research/vendor/stk/src/FreeVerb.h dokumentiert) - 8 parallele
// gedaempfte Kammfilter + 4 serielle Allpaesse pro Kanal, stereo-versetzte
// Delay-Tunings. Neu implementiert mit echten Ein-Pol-Daempfungsfiltern statt
// BiquadFilterNode (siehe dsp/onepole.ts) - dadurch beweisbar stabil, kein
// "kaputt klingender" Hall durch instabile Feedback-Schleifen mehr.
import type { ReverbSettings } from "./types";
import { CombFilter } from "./dsp/comb";
import { AllpassFilter } from "./dsp/allpass";

// Freeverb-Standardtunings in Samples bei 44100Hz (Jezar's Originalwerte).
const COMB_TUNINGS = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
const ALLPASS_TUNINGS = [556, 441, 341, 225];
const STEREO_SPREAD = 23;
const ALLPASS_GAIN = 0.5;

function scaleToSampleRate(samples: number, sampleRate: number): number {
  return Math.max(1, Math.round((samples * sampleRate) / 44100));
}

class Channel {
  readonly input: GainNode;
  readonly output: GainNode;
  private combs: CombFilter[];
  private allpasses: AllpassFilter[];

  constructor(ctx: BaseAudioContext, spreadSamples: number, feedback: number, damping: number) {
    this.input = ctx.createGain();
    const combSum = ctx.createGain();
    combSum.gain.value = 1 / Math.sqrt(COMB_TUNINGS.length);

    this.combs = COMB_TUNINGS.map((t) => {
      const comb = new CombFilter(ctx, scaleToSampleRate(t + spreadSamples, ctx.sampleRate), feedback, damping);
      this.input.connect(comb.input);
      comb.output.connect(combSum);
      return comb;
    });

    let chain: GainNode = combSum;
    this.allpasses = ALLPASS_TUNINGS.map((t) => {
      const ap = new AllpassFilter(ctx, scaleToSampleRate(t + spreadSamples, ctx.sampleRate), ALLPASS_GAIN);
      chain.connect(ap.input);
      chain = ap.output;
      return ap;
    });

    this.output = chain;
  }

  setFeedback(feedback: number): void {
    for (const c of this.combs) c.setFeedback(feedback);
  }

  setDamping(damping: number): void {
    for (const c of this.combs) c.setDamping(damping);
  }

  dispose(): void {
    for (const c of this.combs) c.dispose();
    for (const a of this.allpasses) a.dispose();
    this.input.disconnect();
  }
}

const MAX_FEEDBACK = 0.97; // ambient-rules.json: feedback_delay_stability

export class Reverb {
  readonly input: GainNode;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private preDelay: DelayNode;
  private inputHighpass: BiquadFilterNode;
  private outputLowpassL: BiquadFilterNode;
  private outputLowpassR: BiquadFilterNode;
  private left: Channel;
  private right: Channel;
  private widthCrossL: GainNode;
  private widthCrossR: GainNode;
  private widthDirectL: GainNode;
  private widthDirectR: GainNode;
  private lastSettings: ReverbSettings;

  constructor(ctx: BaseAudioContext, settings: ReverbSettings) {
    this.ctx = ctx;
    this.lastSettings = settings;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    this.input.connect(this.dryGain).connect(this.output);

    this.inputHighpass = ctx.createBiquadFilter();
    this.inputHighpass.type = "highpass";

    this.preDelay = ctx.createDelay(0.3);

    this.input.connect(this.inputHighpass).connect(this.preDelay);

    const feedback = roomSizeToFeedback(settings.roomSize);
    this.left = new Channel(ctx, 0, feedback, settings.damping);
    this.right = new Channel(ctx, STEREO_SPREAD, feedback, settings.damping);
    this.preDelay.connect(this.left.input);
    this.preDelay.connect(this.right.input);

    this.outputLowpassL = ctx.createBiquadFilter();
    this.outputLowpassL.type = "lowpass";
    this.outputLowpassR = ctx.createBiquadFilter();
    this.outputLowpassR.type = "lowpass";
    this.left.output.connect(this.outputLowpassL);
    this.right.output.connect(this.outputLowpassR);

    // Stereo-Width-Matrix (Freeverb-Original): wet1 = width/2+0.5 (direkt),
    // wet2 = (1-width)/2 (Kreuzeinspeisung vom jeweils anderen Kanal).
    this.widthDirectL = ctx.createGain();
    this.widthCrossL = ctx.createGain();
    this.widthDirectR = ctx.createGain();
    this.widthCrossR = ctx.createGain();

    const merger = ctx.createChannelMerger(2);
    this.outputLowpassL.connect(this.widthDirectL).connect(merger, 0, 0);
    this.outputLowpassR.connect(this.widthCrossR).connect(merger, 0, 0);
    this.outputLowpassR.connect(this.widthDirectR).connect(merger, 0, 1);
    this.outputLowpassL.connect(this.widthCrossL).connect(merger, 0, 1);

    merger.connect(this.wetGain).connect(this.output);

    this.apply(settings);
  }

  start(_time: number): void {
    // Freeverb-Kammfilter brauchen keinen Oszillator-Start; Methode bleibt fuer
    // ein einheitliches FxChain-Interface (siehe TapeDelay/Ensemble.start()) erhalten.
  }

  update(settings: ReverbSettings): void {
    this.apply(settings);
  }

  setFreeze(freeze: boolean): void {
    this.apply({ ...this.lastSettings, freeze });
  }

  private apply(settings: ReverbSettings): void {
    this.lastSettings = settings;
    const now = this.ctx.currentTime;

    this.dryGain.gain.value = 1;
    this.wetGain.gain.setTargetAtTime(settings.mix, now, 0.02);

    this.preDelay.delayTime.setTargetAtTime(settings.preDelayMs / 1000, now, 0.02);
    this.inputHighpass.frequency.setTargetAtTime(settings.inputLowCutHz, now, 0.02);
    this.outputLowpassL.frequency.setTargetAtTime(settings.outputHighCutHz, now, 0.02);
    this.outputLowpassR.frequency.setTargetAtTime(settings.outputHighCutHz, now, 0.02);

    const feedback = settings.freeze ? MAX_FEEDBACK : roomSizeToFeedback(settings.roomSize);
    const damping = settings.freeze ? 0 : settings.damping;
    this.left.setFeedback(feedback);
    this.right.setFeedback(feedback);
    this.left.setDamping(damping);
    this.right.setDamping(damping);

    const width = Math.min(1, Math.max(0, settings.width));
    this.widthDirectL.gain.setTargetAtTime(width / 2 + 0.5, now, 0.02);
    this.widthDirectR.gain.setTargetAtTime(width / 2 + 0.5, now, 0.02);
    this.widthCrossL.gain.setTargetAtTime((1 - width) / 2, now, 0.02);
    this.widthCrossR.gain.setTargetAtTime((1 - width) / 2, now, 0.02);
  }

  dispose(): void {
    this.left.dispose();
    this.right.dispose();
    for (const n of [
      this.input, this.output, this.dryGain, this.wetGain, this.preDelay,
      this.inputHighpass, this.outputLowpassL, this.outputLowpassR,
      this.widthDirectL, this.widthDirectR, this.widthCrossL, this.widthCrossR,
    ]) {
      n.disconnect();
    }
  }
}

function roomSizeToFeedback(roomSize: number): number {
  // Freeverb-Originalformel (feedback = roomsize*scaleroom+offsetroom), auf
  // unseren Sicherheitsbereich [0, MAX_FEEDBACK] abgebildet.
  const raw = roomSize * 0.28 + 0.7;
  return Math.min(MAX_FEEDBACK, Math.max(0, raw));
}
