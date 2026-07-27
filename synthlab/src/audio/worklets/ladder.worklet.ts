/**
 * Adapted from ddiakopoulos/MoogLadders (https://github.com/ddiakopoulos/MoogLadders)
 * Author: Dimitri Diakopoulos (Model by Aaron Krajeski)
 * License: Unlicense / Public Domain
 */
// Moog-Ladder-Filter, portiert aus research/vendor/moogladders/src/
// KrajeskiModel.h (Unlicense/Public Domain, ddiakopoulos/MoogLadders, siehe
// research/LICENSES.md). plan10 nannte urspruenglich 8 Modelle aus dem Repo;
// hier bewusst auf ein einziges, stabiles Modell reduziert (Aaron Krajeskis
// "compromise poles at z=-0.3"-Variante) statt aller acht - dieses Modell
// braucht kein Oversampling fuer Stabilitaet (anders als z.B. Huovilainen)
// und ist bei Audiorate-Cutoff/Resonanz-Updates direkt einsetzbar.
//
// 1:1 aus KrajeskiMoog::Process()/SetCutoff()/SetResonance() uebertragen; pro
// Stereo-Kanal eine eigene Instanz (das Original ist mono).
import { equalPowerMix, SmoothedParam } from "./fxProcessorBase";

const MOOG_PI = Math.PI;

function fclamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

class KrajeskiMoog {
  private state = new Float64Array(5);
  private delay = new Float64Array(5);
  private wc = 0;
  private g = 0;
  private gRes = 0;
  private readonly gComp = 1;
  private readonly drive = 1;
  private resonance = 0.1;

  private sampleRate: number;

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
    this.setCutoff(1000);
    this.setResonance(0.1);
  }

  setCutoff(cutoff: number): void {
    this.wc = (2 * MOOG_PI * cutoff) / this.sampleRate;
    const wc = this.wc;
    this.g = 0.9892 * wc - 0.4342 * wc ** 2 + 0.1381 * wc ** 3 - 0.0202 * wc ** 4;
    this.setResonance(this.resonance);
  }

  setResonance(r: number): void {
    this.resonance = r;
    const wc = this.wc;
    this.gRes = r * (1.0029 + 0.0526 * wc - 0.926 * wc ** 2 + 0.0218 * wc ** 3);
  }

  process(input: number): number {
    const s = this.state;
    const d = this.delay;
    s[0] = Math.tanh(this.drive * (input - 4 * this.gRes * (s[4] - this.gComp * input)));
    for (let i = 0; i < 4; i++) {
      s[i + 1] = fclamp(this.g * ((0.3 / 1.3) * s[i] + (1 / 1.3) * d[i] - s[i + 1]) + s[i + 1], -1e30, 1e30);
      d[i] = s[i];
    }
    return s[4];
  }
}

interface LadderSettings {
  enabled: boolean;
  cutoffHz: number;
  resonance: number; // 0..1
  drive: number; // 0..1 -> Eingangs-Boost vor dem Filter
  mix: number;
}

const DEFAULTS: LadderSettings = {
  enabled: false,
  cutoffHz: 2000,
  resonance: 0.3,
  drive: 0.2,
  mix: 1,
};

class LadderProcessor extends AudioWorkletProcessor {
  private settings: LadderSettings;
  private filterL: KrajeskiMoog;
  private filterR: KrajeskiMoog;
  private enabledSmooth: SmoothedParam;

  constructor(options?: AudioWorkletNodeOptions) {
    super();
    const init = { ...DEFAULTS, ...((options?.processorOptions?.settings as Partial<LadderSettings>) ?? {}) };
    this.settings = init;
    this.filterL = new KrajeskiMoog(sampleRate);
    this.filterR = new KrajeskiMoog(sampleRate);
    this.applySettings();
    this.enabledSmooth = new SmoothedParam(init.enabled ? 1 : 0, 20, sampleRate);

    this.port.onmessage = (e: MessageEvent) => {
      const msg = e.data as { type: string; settings?: Partial<LadderSettings> };
      if (msg.type === "params" && msg.settings) {
        this.settings = { ...this.settings, ...msg.settings };
        this.enabledSmooth.setTarget(this.settings.enabled ? 1 : 0);
        this.applySettings();
      }
    };
  }

  private applySettings(): void {
    const s = this.settings;
    const cutoff = Math.max(20, Math.min(sampleRate * 0.45, s.cutoffHz));
    this.filterL.setCutoff(cutoff);
    this.filterR.setCutoff(cutoff);
    this.filterL.setResonance(Math.min(1, s.resonance) * 4.2);
    this.filterR.setResonance(Math.min(1, s.resonance) * 4.2);
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const input = inputs[0];
    const output = outputs[0];
    const inL = input[0];
    const inR = input[1] ?? input[0];
    const outL = output[0];
    const outR = output[1] ?? output[0];
    const mix = this.settings.mix;
    const driveGain = 1 + this.settings.drive * 4;

    for (let n = 0; n < outL.length; n++) {
      const enabledAmt = this.enabledSmooth.tick();
      const dryL = inL[n] ?? 0;
      const dryR = inR[n] ?? 0;
      const wetL = this.filterL.process(dryL * driveGain) / driveGain;
      const wetR = this.filterR.process(dryR * driveGain) / driveGain;
      const { dry, wet } = equalPowerMix(mix * enabledAmt);
      outL[n] = dryL * dry + wetL * wet;
      outR[n] = dryR * dry + wetR * wet;
    }
    return true;
  }
}

registerProcessor("ladder-processor", LadderProcessor);
