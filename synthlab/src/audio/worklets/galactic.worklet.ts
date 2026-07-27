/**
 * Adapted from airwindows/airwindows (https://github.com/airwindows/airwindows)
 * Copyright (c) 2018 Chris Johnson
 * License: MIT License
 */
// Galactic Ambient-Reverb, portiert aus research/vendor/airwindows/plugins/
// LinuxVST/src/Galactic/GalacticProc.cpp (MIT, airwindows/airwindows, siehe
// research/LICENSES.md). 12-stufiges Verzögerungsnetzwerk: vibrato-moduliertes
// Prädelay -> Ein-Pol-Tiefpass -> drei kaskadierte 4-fach-Householder-
// Mischstufen (I/J/K/L -> A/B/C/D -> E/F/G/H) mit Cross-Feedback von Stufe 3
// zurück in Stufe 1 -> zweiter Ein-Pol-Tiefpass -> Dry/Wet.
//
// Bewusst vereinfacht gegenüber dem Original: die dortige 2x/3x/4x-
// Oversampling-Kaskade für sehr hohe Samplerates (176/192kHz) entfällt - bei
// den im Browser üblichen 44.1/48kHz durchläuft das Original ohnehin den
// cycleEnd=1-Pfad (verarbeitet jedes Sample direkt), das bildet dieser Port
// nach. Das 32-Bit-Dithering am Ausgang entfällt ebenfalls (irrelevant bei
// durchgehender Float32-Verarbeitung).
import { equalPowerMix, SmoothedParam } from "./fxProcessorBase";

const DELAY_M = 256;

class GalacticReverb {
  private rateScale = 1;

  // Prädelay mit Vibrato
  private aML = new Float64Array(DELAY_M + 1);
  private aMR = new Float64Array(DELAY_M + 1);
  private countM = 0;
  private vibM = 3;
  private oldfpd = 0.4294967295;
  private fpdL = 1;
  private fpdR = 1;

  // Erste Tiefpassstufe
  private iirAL = 0;
  private iirAR = 0;
  private iirBL = 0;
  private iirBR = 0;

  // 12 Verzögerungsleitungen, auf Maximalgröße vorallokiert (size-Parameter
  // bis 1.87 * Basislänge, siehe delaySize()), tatsächliche Länge separat
  // nachgeführt (identisch zum Original: fester Puffer, variable Grenze).
  private static readonly BASE = { I: 3407, J: 1823, K: 859, L: 331, A: 4801, B: 2909, C: 1153, D: 461, E: 7607, F: 4217, G: 2269, H: 1597 };
  private static readonly MAX_SIZE_MULT = 1.87 + 0.1;

  private lines: Record<string, Float64Array> = {};
  private counts: Record<string, number> = {};
  private delayLen: Record<string, number> = {};

  private feedbackAL = 0; private feedbackBL = 0; private feedbackCL = 0; private feedbackDL = 0;
  private feedbackAR = 0; private feedbackBR = 0; private feedbackCR = 0; private feedbackDR = 0;

  private lastRefL = new Float64Array(7);
  private lastRefR = new Float64Array(7);

  regen = 0.09375;
  attenuate = 1.0;
  lowpass = 0.5;
  drift = 0;
  size = 1.87;
  wet = 1;

  constructor(sampleRate: number) {
    // Original ist auf 44100Hz kalibriert (die dortige Oversampling-Kaskade
    // haelt die Verzoegerungszeiten bei hoeheren Raten konstant, siehe
    // Dateikopf) - da dieser Port diese Kaskade wegvereinfacht, werden die
    // Basislaengen stattdessen direkt proportional zur tatsaechlichen
    // Samplerate skaliert, damit der Klangcharakter (Raumgroesse/Tonhoehe der
    // Verzoegerungen) bei 48kHz nicht spuerbar von 44.1kHz abweicht.
    this.rateScale = sampleRate / 44100;
    for (const key of Object.keys(GalacticReverb.BASE) as (keyof typeof GalacticReverb.BASE)[]) {
      const maxLen = Math.ceil(GalacticReverb.BASE[key] * GalacticReverb.MAX_SIZE_MULT * this.rateScale) + 4;
      this.lines[key + "L"] = new Float64Array(maxLen);
      this.lines[key + "R"] = new Float64Array(maxLen);
      this.counts[key] = 0;
      this.delayLen[key] = Math.round(GalacticReverb.BASE[key] * this.rateScale);
    }
  }

  updateSize(size: number): void {
    this.size = size;
    for (const key of Object.keys(GalacticReverb.BASE) as (keyof typeof GalacticReverb.BASE)[]) {
      this.delayLen[key] = Math.max(1, Math.round(GalacticReverb.BASE[key] * size * this.rateScale));
    }
  }

  // Schreibt an der aktuellen Position, erhöht (mit Wrap bei delayLen) und
  // liest von der neuen Position - der Lesezeiger läuft dem Schreibzeiger
  // dadurch exakt einen vollen Pufferdurchlauf hinterher (klassisches
  // Airwindows-Ringpuffermuster, 1:1 aus dem Original übernommen).
  private step(key: string, inL: number, inR: number): [number, number] {
    const len = this.delayLen[key];
    const bufL = this.lines[key + "L"];
    const bufR = this.lines[key + "R"];
    let c = this.counts[key];
    bufL[c] = inL;
    bufR[c] = inR;
    c++;
    if (c > len) c = 0;
    this.counts[key] = c;
    return [bufL[c], bufR[c]];
  }

  process(inputSampleL: number, inputSampleR: number): [number, number] {
    if (Math.abs(inputSampleL) < 1.18e-23) inputSampleL = this.fpdL * 1.18e-17;
    if (Math.abs(inputSampleR) < 1.18e-23) inputSampleR = this.fpdR * 1.18e-17;
    const drySampleL = inputSampleL;
    const drySampleR = inputSampleR;

    this.vibM += this.oldfpd * this.drift;
    if (this.vibM > Math.PI * 2) {
      this.vibM = 0;
      this.oldfpd = 0.4294967295 + this.fpdL * 0.0000000000618;
    }

    this.aML[this.countM] = inputSampleL * this.attenuate;
    this.aMR[this.countM] = inputSampleR * this.attenuate;
    this.countM++;
    if (this.countM < 0 || this.countM > DELAY_M) this.countM = 0;

    const offsetML = (Math.sin(this.vibM) + 1) * 127;
    const offsetMR = (Math.sin(this.vibM + Math.PI / 2) + 1) * 127;
    const workingML = this.countM + offsetML;
    const workingMR = this.countM + offsetMR;
    const flML = Math.floor(offsetML);
    const flMR = Math.floor(offsetMR);
    let interpolML = this.aML[Math.floor(workingML) - (workingML > DELAY_M ? DELAY_M + 1 : 0)] * (1 - (offsetML - flML));
    interpolML += this.aML[Math.floor(workingML) + 1 - (workingML + 1 > DELAY_M ? DELAY_M + 1 : 0)] * (offsetML - flML);
    let interpolMR = this.aMR[Math.floor(workingMR) - (workingMR > DELAY_M ? DELAY_M + 1 : 0)] * (1 - (offsetMR - flMR));
    interpolMR += this.aMR[Math.floor(workingMR) + 1 - (workingMR + 1 > DELAY_M ? DELAY_M + 1 : 0)] * (offsetMR - flMR);
    inputSampleL = interpolML;
    inputSampleR = interpolMR;

    this.iirAL = this.iirAL * (1 - this.lowpass) + inputSampleL * this.lowpass;
    inputSampleL = this.iirAL;
    this.iirAR = this.iirAR * (1 - this.lowpass) + inputSampleR * this.lowpass;
    inputSampleR = this.iirAR;

    const [outIL, outIR] = this.step("I", inputSampleL + this.feedbackAR * this.regen, inputSampleR + this.feedbackAL * this.regen);
    const [outJL, outJR] = this.step("J", inputSampleL + this.feedbackBR * this.regen, inputSampleR + this.feedbackBL * this.regen);
    const [outKL, outKR] = this.step("K", inputSampleL + this.feedbackCR * this.regen, inputSampleR + this.feedbackCL * this.regen);
    const [outLL, outLR] = this.step("L", inputSampleL + this.feedbackDR * this.regen, inputSampleR + this.feedbackDL * this.regen);

    const [outAL, outAR] = this.step("A", outIL - (outJL + outKL + outLL), outIR - (outJR + outKR + outLR));
    const [outBL, outBR] = this.step("B", outJL - (outIL + outKL + outLL), outJR - (outIR + outKR + outLR));
    const [outCL, outCR] = this.step("C", outKL - (outIL + outJL + outLL), outKR - (outIR + outJR + outLR));
    const [outDL, outDR] = this.step("D", outLL - (outIL + outJL + outKL), outLR - (outIR + outJR + outKR));

    const [outEL, outER] = this.step("E", outAL - (outBL + outCL + outDL), outAR - (outBR + outCR + outDR));
    const [outFL, outFR] = this.step("F", outBL - (outAL + outCL + outDL), outBR - (outAR + outCR + outDR));
    const [outGL, outGR] = this.step("G", outCL - (outAL + outBL + outDL), outCR - (outAR + outBR + outDR));
    const [outHL, outHR] = this.step("H", outDL - (outAL + outBL + outCL), outDR - (outAR + outBR + outCR));

    this.feedbackAL = outEL - (outFL + outGL + outHL);
    this.feedbackBL = outFL - (outEL + outGL + outHL);
    this.feedbackCL = outGL - (outEL + outFL + outHL);
    this.feedbackDL = outHL - (outEL + outFL + outGL);
    this.feedbackAR = outER - (outFR + outGR + outHR);
    this.feedbackBR = outFR - (outER + outGR + outHR);
    this.feedbackCR = outGR - (outER + outFR + outHR);
    this.feedbackDR = outHR - (outER + outFR + outGR);

    inputSampleL = (outEL + outFL + outGL + outHL) / 8;
    inputSampleR = (outER + outFR + outGR + outHR) / 8;

    // cycleEnd=1-Pfad des Originals: kein Downsampling/Referenz-Interpolation nötig.
    this.lastRefL[0] = inputSampleL;
    this.lastRefR[0] = inputSampleR;

    this.iirBL = this.iirBL * (1 - this.lowpass) + inputSampleL * this.lowpass;
    inputSampleL = this.iirBL;
    this.iirBR = this.iirBR * (1 - this.lowpass) + inputSampleR * this.lowpass;
    inputSampleR = this.iirBR;

    if (this.wet < 1) {
      inputSampleL = inputSampleL * this.wet + drySampleL * (1 - this.wet);
      inputSampleR = inputSampleR * this.wet + drySampleR * (1 - this.wet);
    }

    this.fpdL ^= this.fpdL << 13; this.fpdL ^= this.fpdL >>> 17; this.fpdL ^= this.fpdL << 5; this.fpdL >>>= 0;
    this.fpdR ^= this.fpdR << 13; this.fpdR ^= this.fpdR >>> 17; this.fpdR ^= this.fpdR << 5; this.fpdR >>>= 0;

    return [inputSampleL, inputSampleR];
  }
}

interface GalacticSettings {
  enabled: boolean;
  replace: number; // 0..1 -> Feedback-Regeneration (mehr = längerer Nachhall)
  brightness: number; // 0..1
  detune: number; // 0..1 -> Vibrato-Drift
  bigness: number; // 0..1 -> Netzwerkgröße/Raumgröße
  mix: number; // 0..1
}

const DEFAULTS: GalacticSettings = { enabled: false, replace: 0.5, brightness: 0.5, detune: 0.2, bigness: 0.5, mix: 1 };

class GalacticProcessor extends AudioWorkletProcessor {
  private reverb: GalacticReverb;
  private settings: GalacticSettings;
  private enabledSmooth: SmoothedParam;
  private overallScale: number;

  constructor(options?: AudioWorkletNodeOptions) {
    super();
    const init = { ...DEFAULTS, ...((options?.processorOptions?.settings as Partial<GalacticSettings>) ?? {}) };
    this.settings = init;
    this.reverb = new GalacticReverb(sampleRate);
    this.overallScale = sampleRate / 44100;
    this.enabledSmooth = new SmoothedParam(init.enabled ? 1 : 0, 20, sampleRate);
    this.applySettings();

    this.port.onmessage = (e: MessageEvent) => {
      const msg = e.data as { type: string; settings?: Partial<GalacticSettings> };
      if (msg.type === "params" && msg.settings) {
        this.settings = { ...this.settings, ...msg.settings };
        this.enabledSmooth.setTarget(this.settings.enabled ? 1 : 0);
        this.applySettings();
      }
    };
  }

  private applySettings(): void {
    const s = this.settings;
    const regen = 0.0625 + (1 - s.replace) * 0.0625;
    this.reverb.regen = regen;
    this.reverb.attenuate = (1 - regen / 0.125) * 1.333;
    this.reverb.lowpass = Math.pow(1.00001 - (1 - s.brightness), 2) / Math.sqrt(this.overallScale);
    this.reverb.drift = Math.pow(s.detune, 3) * 0.001;
    this.reverb.updateSize(s.bigness * 1.77 + 0.1);
    this.reverb.wet = 1 - Math.pow(1 - s.mix, 3);
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const input = inputs[0];
    const output = outputs[0];
    const inL = input[0];
    const inR = input[1] ?? input[0];
    const outL = output[0];
    const outR = output[1] ?? output[0];

    for (let n = 0; n < outL.length; n++) {
      const enabledAmt = this.enabledSmooth.tick();
      const dryL = inL[n] ?? 0;
      const dryR = inR[n] ?? 0;
      const [wetL, wetR] = this.reverb.process(dryL, dryR);
      const { dry, wet } = equalPowerMix(enabledAmt);
      outL[n] = dryL * dry + wetL * wet;
      outR[n] = dryR * dry + wetR * wet;
    }
    return true;
  }
}

registerProcessor("galactic-processor", GalacticProcessor);
