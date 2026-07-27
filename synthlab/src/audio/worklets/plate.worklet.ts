/**
 * Adapted from el-visio/dattorro-verb (https://github.com/el-visio/dattorro-verb)
 * Copyright (c) 2022 Pauli Pölkki (Algorithm design by Jon Dattorro, 1997)
 * License: MIT License
 */
// Plate-Reverb nach Jon Dattorro ("Effect Design Part 1", 1997), portiert aus
// research/vendor/dattorro-verb/verb.c (MIT, el-visio/dattorro-verb, siehe
// research/LICENSES.md). Signalweg: Pre-Delay -> Vorfilter (Tiefpass) ->
// 4-stufiger Eingangsdiffusor (Allpässe) -> zwei gekoppelte Tank-Hälften mit
// je moduliertem Decay-Diffusor 1, Pre-Damping-Delay, Damping-Tiefpass,
// Decay-Diffusor 2 und Post-Damping-Delay, deren Ausgänge über Kreuz als
// Feedback in die jeweils andere Hälfte zurücklaufen.
//
// 1:1 aus dem 341-zeiligen C-Original übertragen (Delay-Längen, Verschaltung,
// Vibrato-Modulation der Decay-Diffusoren) - einzige Anpassung: alle
// Delay-Längen sind für 48kHz kalibriert ("Jon Dattorro's magic numbers") und
// werden hier proportional auf die tatsächliche AudioContext-Samplerate
// skaliert (wie bereits bei den Freeverb-Tunings in audio/fx/Reverb.ts).
import { equalPowerMix, SmoothedParam } from "./fxProcessorBase";

const TAP_MAIN = 0;
const TAP_OUT1 = 1;
const TAP_OUT2 = 2;
const TAP_OUT3 = 3;
const MAX_TAPS = 4;

class DelayBuffer {
  buffer: Float64Array;
  mask: number;
  readOffset = new Int32Array(MAX_TAPS);

  constructor(delaySamples: number) {
    let numBits = 0;
    let x = delaySamples;
    while (x > 0) { numBits++; x >>= 1; }
    const size = 1 << numBits;
    this.buffer = new Float64Array(size);
    this.mask = size - 1;
    this.setDelay(TAP_MAIN, delaySamples);
  }

  setDelay(tap: number, delay: number): void {
    this.readOffset[tap] = this.mask + 1 - delay;
  }

  process(t: number, input: number): number {
    this.buffer[t & this.mask] = input;
    return this.buffer[(t + this.readOffset[TAP_MAIN]) & this.mask];
  }

  write(t: number, input: number): void {
    this.buffer[t & this.mask] = input;
  }

  read(tap: number, t: number): number {
    return this.buffer[(t + this.readOffset[tap]) & this.mask];
  }
}

function allpassProcess(db: DelayBuffer, t: number, gain: number, input: number): number {
  const delayed = db.read(TAP_MAIN, t);
  const v = input + delayed * -gain;
  db.write(t, v);
  return delayed + v * gain;
}

class OnePoleState {
  out = 0;
  process(freq: number, input: number): number {
    this.out += (input - this.out) * freq;
    return this.out;
  }
}

function scaled(samplesAt48k: number, sampleRate: number): number {
  return Math.max(1, Math.round((samplesAt48k * sampleRate) / 48000));
}

class DattorroPlate {
  private t = 0;
  private preDelay: DelayBuffer;
  private preFilter = new OnePoleState();
  private inDiffusion: DelayBuffer[];
  private decayDiffusion1: DelayBuffer[];
  private preDampingDelay: DelayBuffer[];
  private damping: OnePoleState[] = [new OnePoleState(), new OnePoleState()];
  private decayDiffusion2: DelayBuffer[];
  private postDampingDelay: DelayBuffer[];

  preFilterAmount = 0.85;
  inputDiffusion1Amount = 0.75;
  inputDiffusion2Amount = 0.625;
  decayAmount = 0.75;
  decayDiffusion1Amount = 0.7;
  dampingAmount = 0.95;
  decayDiffusion2Amount = 0.5;

  constructor(sampleRate: number) {
    this.preDelay = new DelayBuffer(scaled(4800, sampleRate));

    this.inDiffusion = [
      new DelayBuffer(scaled(142, sampleRate)),
      new DelayBuffer(scaled(107, sampleRate)),
      new DelayBuffer(scaled(379, sampleRate)),
      new DelayBuffer(scaled(277, sampleRate)),
    ];

    this.decayDiffusion1 = [new DelayBuffer(scaled(672, sampleRate)), new DelayBuffer(scaled(908, sampleRate))];

    this.preDampingDelay = [new DelayBuffer(scaled(4453, sampleRate)), new DelayBuffer(scaled(4217, sampleRate))];
    this.preDampingDelay[0].setDelay(TAP_OUT1, scaled(353, sampleRate));
    this.preDampingDelay[0].setDelay(TAP_OUT2, scaled(3627, sampleRate));
    this.preDampingDelay[0].setDelay(TAP_OUT3, scaled(1990, sampleRate));
    this.preDampingDelay[1].setDelay(TAP_OUT1, scaled(266, sampleRate));
    this.preDampingDelay[1].setDelay(TAP_OUT2, scaled(2974, sampleRate));
    this.preDampingDelay[1].setDelay(TAP_OUT3, scaled(2111, sampleRate));

    this.decayDiffusion2 = [new DelayBuffer(scaled(1800, sampleRate)), new DelayBuffer(scaled(2656, sampleRate))];
    this.decayDiffusion2[0].setDelay(TAP_OUT1, scaled(187, sampleRate));
    this.decayDiffusion2[0].setDelay(TAP_OUT2, scaled(1228, sampleRate));
    this.decayDiffusion2[1].setDelay(TAP_OUT1, scaled(335, sampleRate));
    this.decayDiffusion2[1].setDelay(TAP_OUT2, scaled(1913, sampleRate));

    this.postDampingDelay = [new DelayBuffer(scaled(3720, sampleRate)), new DelayBuffer(scaled(3163, sampleRate))];
    this.postDampingDelay[0].setDelay(TAP_OUT1, scaled(1066, sampleRate));
    this.postDampingDelay[0].setDelay(TAP_OUT2, scaled(2673, sampleRate));
    this.postDampingDelay[1].setDelay(TAP_OUT1, scaled(121, sampleRate));
    this.postDampingDelay[1].setDelay(TAP_OUT2, scaled(1996, sampleRate));
  }

  setPreDelayMs(ms: number, sampleRate: number): void {
    this.preDelay.setDelay(TAP_MAIN, Math.max(0, Math.round((ms / 1000) * sampleRate)));
  }

  process(input: number): [number, number] {
    // Vibrato-Modulation der Decay-Diffusor-1-Delays (1:1 aus dem Original).
    if ((this.t & 0x07ff) === 0) {
      const dir = this.t < 1 << 15 ? -1 : 1;
      this.decayDiffusion1[0].readOffset[TAP_MAIN] += dir;
      this.decayDiffusion1[1].readOffset[TAP_MAIN] += dir;
    }

    let x = this.preDelay.process(this.t, input);
    x = this.preFilter.process(this.preFilterAmount, x);
    x = allpassProcess(this.inDiffusion[0], this.t, this.inputDiffusion1Amount, x);
    x = allpassProcess(this.inDiffusion[1], this.t, this.inputDiffusion1Amount, x);
    x = allpassProcess(this.inDiffusion[2], this.t, this.inputDiffusion2Amount, x);
    x = allpassProcess(this.inDiffusion[3], this.t, this.inputDiffusion2Amount, x);

    for (let i = 0; i < 2; i++) {
      let x1 = x + this.postDampingDelay[1 - i].read(TAP_MAIN, this.t) * this.decayAmount;
      x1 = allpassProcess(this.decayDiffusion1[i], this.t, -this.decayDiffusion1Amount, x1);
      x1 = this.preDampingDelay[i].process(this.t, x1);
      x1 = this.damping[i].process(this.dampingAmount, x1);
      x1 *= this.decayAmount;
      x1 = allpassProcess(this.decayDiffusion2[i], this.t, this.decayDiffusion2Amount, x1);
      this.postDampingDelay[i].write(this.t, x1);
    }

    this.t++;

    const left =
      this.preDampingDelay[1].read(TAP_OUT1, this.t) +
      this.preDampingDelay[1].read(TAP_OUT2, this.t) -
      this.decayDiffusion2[1].read(TAP_OUT2, this.t) +
      this.postDampingDelay[1].read(TAP_OUT2, this.t) -
      this.preDampingDelay[0].read(TAP_OUT3, this.t) -
      this.decayDiffusion2[0].read(TAP_OUT1, this.t) +
      this.postDampingDelay[0].read(TAP_OUT1, this.t);

    const right =
      this.preDampingDelay[0].read(TAP_OUT1, this.t) +
      this.preDampingDelay[0].read(TAP_OUT2, this.t) -
      this.decayDiffusion2[0].read(TAP_OUT2, this.t) +
      this.postDampingDelay[0].read(TAP_OUT2, this.t) -
      this.preDampingDelay[1].read(TAP_OUT3, this.t) -
      this.decayDiffusion2[1].read(TAP_OUT1, this.t) +
      this.postDampingDelay[1].read(TAP_OUT1, this.t);

    return [left, right];
  }
}

interface PlateSettings {
  enabled: boolean;
  preDelay: number; // 0..1 -> 0..100ms
  bandwidth: number; // 0..1 -> Vorfilter-Öffnung
  inputDiffusion1: number; // 0..1
  inputDiffusion2: number; // 0..1
  decay: number; // 0..1 -> Nachhalldauer
  decayDiffusion1: number; // 0..1
  damping: number; // 0..1 -> HF-Dämpfung im Nachhall
  mix: number; // 0..1
}

const DEFAULTS: PlateSettings = {
  enabled: false,
  preDelay: 0,
  bandwidth: 0.85,
  inputDiffusion1: 0.75,
  inputDiffusion2: 0.625,
  decay: 0.75,
  decayDiffusion1: 0.7,
  damping: 0.5,
  mix: 0.35,
};

class PlateProcessor extends AudioWorkletProcessor {
  private verb: DattorroPlate;
  private settings: PlateSettings;
  private enabledSmooth: SmoothedParam;

  constructor(options?: AudioWorkletNodeOptions) {
    super();
    const init = { ...DEFAULTS, ...((options?.processorOptions?.settings as Partial<PlateSettings>) ?? {}) };
    this.settings = init;
    this.verb = new DattorroPlate(sampleRate);
    this.applySettings();
    this.enabledSmooth = new SmoothedParam(init.enabled ? 1 : 0, 20, sampleRate);

    this.port.onmessage = (e: MessageEvent) => {
      const msg = e.data as { type: string; settings?: Partial<PlateSettings> };
      if (msg.type === "params" && msg.settings) {
        this.settings = { ...this.settings, ...msg.settings };
        this.enabledSmooth.setTarget(this.settings.enabled ? 1 : 0);
        this.applySettings();
      }
    };
  }

  private applySettings(): void {
    const s = this.settings;
    this.verb.setPreDelayMs(s.preDelay * 100, sampleRate);
    this.verb.preFilterAmount = 0.05 + s.bandwidth * 0.95;
    this.verb.inputDiffusion1Amount = s.inputDiffusion1;
    this.verb.inputDiffusion2Amount = s.inputDiffusion2;
    this.verb.decayAmount = Math.min(0.9999, s.decay);
    this.verb.decayDiffusion1Amount = s.decayDiffusion1;
    this.verb.dampingAmount = 1 - s.damping * 0.9;
    this.verb.decayDiffusion2Amount = Math.min(0.5, Math.max(0.25, s.decay + 0.15));
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
      // DSP läuft immer (auch bei enabled=false) - der Hall-Tank-Zustand darf
      // nicht einfrieren, sonst klingt ein Wiedereinschalten nach einer Pause
      // wie eine unvermittelt "eingefrorene" alte Fahne statt neu anzuklingen.
      const monoIn = (dryL + dryR) * 0.5;
      const [wetL, wetR] = this.verb.process(monoIn);
      const { dry, wet } = equalPowerMix(mix * enabledAmt);
      outL[n] = dryL * dry + wetL * wet * 0.6;
      outR[n] = dryR * dry + wetR * wet * 0.6;
    }
    return true;
  }
}

registerProcessor("plate-processor", PlateProcessor);
