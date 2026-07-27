/**
 * Adapted from electro-smith/DaisySP (https://github.com/electro-smith/DaisySP)
 * Copyright (c) Electrosmith Corp
 * License: MIT License
 */
// Lo-Fi (Bitcrush + Sample-Rate-Reduction), portiert aus
// research/vendor/daisysp/Source/Effects/decimator.cpp (MIT, electro-smith/
// DaisySP, siehe research/LICENSES.md). Soundpipe wurde bewusst NICHT als
// Quelle verwendet - dessen bitcrush.c ruft intern fold.c auf, das laut
// eigenem Dateikopf aus dem LGPL-lizenzierten Csound-Opcode "fold" extrahiert
// wurde (siehe research/LICENSES.md, Korrekturvermerk).
//
// 1:1 aus Decimator::Process() uebertragen: Sample-and-Hold-Downsampling
// (Zaehler gegen einen aus dem Downsample-Faktor quadrierten Schwellwert)
// gefolgt von Ganzzahl-Bit-Shift-Quantisierung.
import { equalPowerMix, SmoothedParam } from "./fxProcessorBase";

class Decimator {
  private state = new Float64Array(2); // [0]=downsampled, [1]=inc
  private downsampleFactor = 1;
  private bitsToCrush = 0;

  constructor() {
    this.setDownsampleFactor(0);
    this.setBitcrushFactor(0);
  }

  setDownsampleFactor(amount: number): void {
    this.downsampleFactor = 1 + amount * 13;
  }

  setBitcrushFactor(amount: number): void {
    this.bitsToCrush = Math.floor(amount * 16);
  }

  process(input: number): number {
    const s = this.state;
    const threshold = Math.floor(this.downsampleFactor * this.downsampleFactor * 96);
    s[1] += 1;
    if (s[1] > threshold) {
      s[1] = 0;
      s[0] = input;
    }

    let temp = (s[0] * 65536) | 0;
    temp >>= this.bitsToCrush;
    temp <<= this.bitsToCrush;
    return temp / 65536;
  }
}

interface LofiSettings {
  enabled: boolean;
  downsample: number; // 0..1
  bitcrush: number; // 0..1
  mix: number;
}

const DEFAULTS: LofiSettings = {
  enabled: false,
  downsample: 0,
  bitcrush: 0,
  mix: 1,
};

class LofiProcessor extends AudioWorkletProcessor {
  private settings: LofiSettings;
  private decL: Decimator;
  private decR: Decimator;
  private enabledSmooth: SmoothedParam;

  constructor(options?: AudioWorkletNodeOptions) {
    super();
    const init = { ...DEFAULTS, ...((options?.processorOptions?.settings as Partial<LofiSettings>) ?? {}) };
    this.settings = init;
    this.decL = new Decimator();
    this.decR = new Decimator();
    this.applySettings();
    this.enabledSmooth = new SmoothedParam(init.enabled ? 1 : 0, 20, sampleRate);

    this.port.onmessage = (e: MessageEvent) => {
      const msg = e.data as { type: string; settings?: Partial<LofiSettings> };
      if (msg.type === "params" && msg.settings) {
        this.settings = { ...this.settings, ...msg.settings };
        this.enabledSmooth.setTarget(this.settings.enabled ? 1 : 0);
        this.applySettings();
      }
    };
  }

  private applySettings(): void {
    const s = this.settings;
    this.decL.setDownsampleFactor(s.downsample);
    this.decR.setDownsampleFactor(s.downsample);
    this.decL.setBitcrushFactor(s.bitcrush);
    this.decR.setBitcrushFactor(s.bitcrush);
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const input = inputs[0];
    const output = outputs[0];
    const inL = input[0];
    const inR = input[1] ?? input[0];
    const outL = output[0];
    const outR = output[1] ?? output[0];
    const mix = this.settings.mix;

    for (let n = 0; n < outL.length; n++) {
      const enabledAmt = this.enabledSmooth.tick();
      const dryL = inL[n] ?? 0;
      const dryR = inR[n] ?? 0;
      const wetL = this.decL.process(dryL);
      const wetR = this.decR.process(dryR);
      const { dry, wet } = equalPowerMix(mix * enabledAmt);
      outL[n] = dryL * dry + wetL * wet;
      outR[n] = dryR * dry + wetR * wet;
    }
    return true;
  }
}

registerProcessor("lofi-processor", LofiProcessor);
