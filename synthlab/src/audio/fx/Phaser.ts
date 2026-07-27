// Phaser & Flanger (plan10 §6.9) - einziges der 10 neuen Module ohne Worklet:
// eine LFO-modulierte Allpass-Kette (Phaser, BiquadFilterNode type="allpass")
// und ein sehr kurzes moduliertes Delay mit Feedback (Flanger, DelayNode) sind
// mit reinen WebAudio-Bordmitteln direkt und stabil abbildbar, analog zum
// vorhandenen Ensemble.ts (Chorus). Architekturreferenz: DaisySP
// `Source/Effects/phaser.h` und `flanger.h` (MIT, siehe research/LICENSES.md).
//
// Beide Signalpfade (Phaser-Allpasskette und Flanger-Delay) laufen immer
// mitgebaut; der `mode`-Switch blendet nur die jeweils aktive Wet-Summe ein -
// vermeidet Graph-Neuverkabelung bei Moduswechsel (wie die anderen Module).
import type { FxParamValue } from "./types";

const MAX_STAGES = 8;
const STAGE_TAPS = [4, 6, 8];

export type PhaserFlangerMode = "phaser" | "flanger";
export interface PhaserSettings {
  enabled: boolean;
  mode: PhaserFlangerMode;
  rateHz: number;
  depth: number; // 0..1
  feedback: number; // 0..0.95
  stages: number; // 4 | 6 | 8, nur Phaser
  mix: number; // 0..1
}

export class Phaser {
  readonly input: GainNode;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private dryGain: GainNode;
  private lfo: OscillatorNode;
  private started = false;

  // Phaser-Pfad
  private allpassStages: BiquadFilterNode[] = [];
  private allpassLfoGains: GainNode[] = [];
  private phaserFeedbackGain: GainNode;
  private phaserTapGains: GainNode[] = []; // je STAGE_TAPS ein Abgriff
  private phaserWetGain: GainNode;

  // Flanger-Pfad
  private flangerDelay: DelayNode;
  private flangerLfoGain: GainNode;
  private flangerFeedbackGain: GainNode;
  private flangerWetGain: GainNode;

  constructor(ctx: BaseAudioContext, settings: PhaserSettings) {
    this.ctx = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.input.connect(this.dryGain).connect(this.output);

    this.lfo = ctx.createOscillator();
    this.lfo.type = "sine";

    // --- Phaser: 8 kaskadierte Allpass-Stufen, LFO-moduliert ---
    let prev: AudioNode = this.input;
    for (let i = 0; i < MAX_STAGES; i++) {
      const ap = ctx.createBiquadFilter();
      ap.type = "allpass";
      ap.frequency.value = 800;
      ap.Q.value = 0.5;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0;
      this.lfo.connect(lfoGain).connect(ap.frequency);
      prev.connect(ap);
      prev = ap;
      this.allpassStages.push(ap);
      this.allpassLfoGains.push(lfoGain);
    }
    this.phaserFeedbackGain = ctx.createGain();
    this.phaserFeedbackGain.gain.value = 0;
    this.allpassStages[MAX_STAGES - 1].connect(this.phaserFeedbackGain).connect(this.allpassStages[0]);

    this.phaserWetGain = ctx.createGain();
    for (const tap of STAGE_TAPS) {
      const tapGain = ctx.createGain();
      tapGain.gain.value = 0;
      this.allpassStages[tap - 1].connect(tapGain).connect(this.phaserWetGain);
      this.phaserTapGains.push(tapGain);
    }
    this.phaserWetGain.connect(this.output);

    // --- Flanger: kurzes moduliertes Delay mit Feedback ---
    this.flangerDelay = ctx.createDelay(0.03);
    this.flangerDelay.delayTime.value = 0.003;
    this.flangerLfoGain = ctx.createGain();
    this.flangerLfoGain.gain.value = 0;
    this.lfo.connect(this.flangerLfoGain).connect(this.flangerDelay.delayTime);
    this.flangerFeedbackGain = ctx.createGain();
    this.flangerFeedbackGain.gain.value = 0;
    this.input.connect(this.flangerDelay);
    this.flangerDelay.connect(this.flangerFeedbackGain).connect(this.flangerDelay);
    this.flangerWetGain = ctx.createGain();
    this.flangerDelay.connect(this.flangerWetGain).connect(this.output);

    this.apply(settings);
  }

  start(time: number): void {
    if (this.started) return;
    this.started = true;
    this.lfo.start(time);
  }

  update(settings: Record<string, FxParamValue>): void {
    this.apply(settings as unknown as PhaserSettings);
  }

  private apply(settings: PhaserSettings): void {
    const now = this.ctx.currentTime;
    const isPhaser = settings.mode === "phaser";
    this.lfo.frequency.setTargetAtTime(Math.max(0.02, settings.rateHz), now, 0.02);

    const enabled = settings.enabled;
    const mix = settings.mix;
    this.dryGain.gain.setTargetAtTime(enabled ? 1 - mix * 0.5 : 1, now, 0.02);

    // Phaser
    const phaserDepthHz = settings.depth * 1800;
    for (const g of this.allpassLfoGains) g.gain.setTargetAtTime(isPhaser && enabled ? phaserDepthHz : 0, now, 0.02);
    this.phaserFeedbackGain.gain.setTargetAtTime(isPhaser && enabled ? Math.min(0.95, settings.feedback) : 0, now, 0.02);
    const activeTapIdx = STAGE_TAPS.indexOf(Math.round(settings.stages));
    this.phaserTapGains.forEach((g, i) => {
      const active = isPhaser && enabled && (activeTapIdx === -1 ? i === STAGE_TAPS.length - 1 : i === activeTapIdx);
      g.gain.setTargetAtTime(active ? 1 : 0, now, 0.02);
    });
    this.phaserWetGain.gain.setTargetAtTime(isPhaser && enabled ? mix : 0, now, 0.02);

    // Flanger
    this.flangerLfoGain.gain.setTargetAtTime(!isPhaser && enabled ? settings.depth * 0.0025 : 0, now, 0.02);
    this.flangerFeedbackGain.gain.setTargetAtTime(!isPhaser && enabled ? Math.min(0.95, settings.feedback) : 0, now, 0.02);
    this.flangerWetGain.gain.setTargetAtTime(!isPhaser && enabled ? mix : 0, now, 0.02);
  }

  dispose(): void {
    try { this.lfo.stop(); } catch { /* noop */ }
    this.lfo.disconnect();
    for (const n of [
      this.input, this.output, this.dryGain,
      ...this.allpassStages, ...this.allpassLfoGains, this.phaserFeedbackGain, ...this.phaserTapGains, this.phaserWetGain,
      this.flangerDelay, this.flangerLfoGain, this.flangerFeedbackGain, this.flangerWetGain,
    ]) {
      try { n.disconnect(); } catch { /* noop */ }
    }
  }
}
