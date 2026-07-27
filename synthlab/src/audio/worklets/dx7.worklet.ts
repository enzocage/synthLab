// Echte 6-Operator-FM nach Yamaha DX7-Architektur, als AudioWorkletProcessor
// (6 Sinus-Operatoren pro Stimme sind mit reinen OscillatorNode-Graphen nicht
// sauber realisierbar - siehe plan5.md P1/P5).
//
// Algorithmus-Routing-Tabelle (32 DX7-Algorithmen als Bus-Flags pro Operator)
// ist aus research/vendor/amy/amy/src/algorithms.c portiert (MIT, AMY-Projekt,
// dort mit Dank an "MSFA" - Music Synthesizer for Android - für die
// Operator-Struktur attributiert). Die Bus-Verarbeitungslogik (render_algo)
// wurde aus demselben, dort im Klartext vorliegenden C-Code 1:1 auf
// Sample-Ebene übertragen (Bus1/Bus2-Akkumulation, Scratch-Buffer bei
// gleichzeitigem Lesen/Schreiben von Bus1, Feedback-Selbstmodulation) - siehe
// research/LICENSES.md.
//
// Envelope-Generator- und Frequenz-Umrechnungsformeln aus dx7Math.ts (ebenfalls
// aus fm.py portiert, siehe dort).
//
// Bewusst NICHT nachgebildet (Scope-Reduktion): Keyboard-Rate-Scaling,
// Velocity-Sensitivity, Breakpoint/Curve-Modulation, Pitch-/Amp-LFO. Diese
// Parameter werden zwar importiert (siehe dx7Presets.ts), aber noch nicht
// ausgewertet - Folgearbeit.
import {
  dx7LevelToLinear,
  coarseFineRatio,
  coarseFineFixedHz,
  feedbackToScale,
  computeEgSegment,
  evalEgSegment,
  type EgSegment,
} from "./dx7Math";

const TWO_PI = Math.PI * 2;
const MOD_INDEX_SCALE = Math.PI * 2; // eigene, musikalisch kalibrierte Modulationstiefen-Konstante (siehe Dateikopf)

// Bus-Flags exakt wie in algorithms.c (AMY/MSFA).
const OUT_BUS_ONE = 1 << 0;
const OUT_BUS_TWO = 1 << 1;
const OUT_BUS_ADD = 1 << 2;
const IN_BUS_ONE = 1 << 4;
const IN_BUS_TWO = 1 << 5;
const FB_IN = 1 << 6;
const FB_OUT = 1 << 7;

// 32 DX7-Algorithmen (Index 0..31 = DX7-Algorithmus 1..32), je 6 Bytes für
// Operator 6..1 (Reihenfolge exakt wie beim Parsen der Preset-Bytes, siehe
// dx7Presets.ts/import-dx7.mjs). Portiert aus algorithms.c (Index 1..32 dort,
// Index 0 dort ist eine redundante Kopie von Index 1 und wird ausgelassen).
const ALGORITHMS: number[][] = [
  [0xc1, 0x11, 0x11, 0x14, 0x01, 0x14],
  [0x01, 0x11, 0x11, 0x14, 0xc1, 0x14],
  [0xc1, 0x11, 0x14, 0x01, 0x11, 0x14],
  [0x41, 0x11, 0x94, 0x01, 0x11, 0x14],
  [0xc1, 0x14, 0x01, 0x14, 0x01, 0x14],
  [0x41, 0x94, 0x01, 0x14, 0x01, 0x14],
  [0xc1, 0x11, 0x05, 0x14, 0x01, 0x14],
  [0x01, 0x11, 0xc5, 0x14, 0x01, 0x14],
  [0x01, 0x11, 0x05, 0x14, 0xc1, 0x14],
  [0x01, 0x05, 0x14, 0xc1, 0x11, 0x14],
  [0xc1, 0x05, 0x14, 0x01, 0x11, 0x14],
  [0x01, 0x05, 0x05, 0x14, 0xc1, 0x14],
  [0xc1, 0x05, 0x05, 0x14, 0x01, 0x14],
  [0xc1, 0x05, 0x11, 0x14, 0x01, 0x14],
  [0x01, 0x05, 0x11, 0x14, 0xc1, 0x14],
  [0xc1, 0x11, 0x02, 0x25, 0x05, 0x14],
  [0x01, 0x11, 0x02, 0x25, 0xc5, 0x14],
  [0x01, 0x11, 0x11, 0xc5, 0x05, 0x14],
  [0xc1, 0x14, 0x14, 0x01, 0x11, 0x14],
  [0x01, 0x05, 0x14, 0xc1, 0x14, 0x14],
  [0x01, 0x14, 0x14, 0xc1, 0x14, 0x14],
  [0xc1, 0x14, 0x14, 0x14, 0x01, 0x14],
  [0xc1, 0x14, 0x14, 0x01, 0x14, 0x04],
  [0xc1, 0x14, 0x14, 0x14, 0x04, 0x04],
  [0xc1, 0x14, 0x14, 0x04, 0x04, 0x04],
  [0xc1, 0x05, 0x14, 0x01, 0x14, 0x04],
  [0x01, 0x05, 0x14, 0xc1, 0x14, 0x04],
  [0x04, 0xc1, 0x11, 0x14, 0x01, 0x14],
  [0xc1, 0x14, 0x01, 0x14, 0x04, 0x04],
  [0x04, 0xc1, 0x11, 0x14, 0x04, 0x04],
  [0xc1, 0x14, 0x04, 0x04, 0x04, 0x04],
  [0xc4, 0x04, 0x04, 0x04, 0x04, 0x04],
];

interface OpParams {
  rates: [number, number, number, number];
  levels: [number, number, number, number];
  ratioMode: boolean;
  coarse: number;
  fine: number;
  detune: number;
  outputLevel: number;
}

interface OpState {
  phase: number;
  phaseIncrement: number;
  freqHz: number;
  outputLevelGain: number;
  feedbackSample: number;
  stageIndex: number; // 0,1,2 = Auto-Stufen, 3 = Release, 4 = ausgeklungen
  segment: EgSegment;
  segmentStartTime: number;
  levels: [number, number, number, number];
  rates: [number, number, number, number];
  releaseFinished: boolean;
}

function midiToHz(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function makeOpState(op: OpParams, baseFreqHz: number, sampleRate: number): OpState {
  const freqHz = op.ratioMode
    ? baseFreqHz * coarseFineRatio(op.coarse, op.fine, op.detune)
    : coarseFineFixedHz(op.coarse, op.fine, op.detune);
  const seg0 = computeEgSegment(op.rates[0], 0, op.levels[0], false);
  return {
    phase: 0,
    phaseIncrement: (freqHz * TWO_PI) / sampleRate,
    freqHz,
    outputLevelGain: 2 * dx7LevelToLinear(op.outputLevel),
    feedbackSample: 0,
    stageIndex: 0,
    segment: seg0,
    segmentStartTime: 0,
    levels: op.levels,
    rates: op.rates,
    releaseFinished: false,
  };
}

class Dx7Voice {
  ops: OpState[] = [];
  algoFlags: number[];
  feedbackScale: number;
  releasing = false;
  stopRequested = false;
  stopFadeSamples = 0;
  stopFadeElapsed = 0;
  masterGain = 1;
  finished = false;

  constructor(opParams: OpParams[], algorithm: number, feedback: number, note: number, sampleRate: number, velocity: number) {
    const baseFreq = midiToHz(note);
    this.algoFlags = ALGORITHMS[Math.max(0, Math.min(31, Math.round(algorithm)))];
    this.feedbackScale = feedbackToScale(feedback);
    this.masterGain = 0.3 * (0.4 + 0.6 * velocity);
    for (const op of opParams) {
      this.ops.push(makeOpState(op, baseFreq, sampleRate));
    }
  }

  release(now: number): void {
    if (this.releasing) return;
    this.releasing = true;
    for (const op of this.ops) {
      const currentLevel = evalEgSegment(op.segment, now - op.segmentStartTime);
      op.segment = computeEgSegment(op.rates[3], currentLevel, op.levels[3], true);
      op.segmentStartTime = now;
      op.stageIndex = 3;
    }
  }

  requestStop(now: number, fadeSeconds: number, sampleRate: number): void {
    this.stopRequested = true;
    this.stopFadeSamples = Math.max(1, Math.round(fadeSeconds * sampleRate));
    this.stopFadeElapsed = 0;
    void now;
  }

  private opEnvLevel(op: OpState, now: number): number {
    let elapsed = now - op.segmentStartTime;
    // Automatisches Fortschreiten durch Stufe 0->1->2, falls das aktuelle
    // Segment bereits vor dieser Sample-Zeit abgeschlossen war.
    while (op.stageIndex < 2 && elapsed >= op.segment.durationS) {
      op.segmentStartTime += op.segment.durationS;
      elapsed -= op.segment.durationS;
      op.stageIndex += 1;
      const from = op.segment.targetLevel;
      op.segment = computeEgSegment(op.rates[op.stageIndex], from, op.levels[op.stageIndex], false);
    }
    if (op.stageIndex === 3 && elapsed >= op.segment.durationS && !op.releaseFinished) {
      op.releaseFinished = true;
      if (this.ops.every((o) => o.releaseFinished)) this.finished = true;
    }
    return evalEgSegment(op.segment, elapsed);
  }

  renderSample(now: number, sampleRate: number): number {
    let bus1 = 0;
    let bus2 = 0;
    let outSample = 0;
    for (let i = 0; i < 6; i++) {
      const flags = this.algoFlags[i];
      const op = this.ops[i];
      op.phase += op.phaseIncrement;
      if (op.phase >= TWO_PI) op.phase -= TWO_PI;

      let modInput = 0;
      if (flags & IN_BUS_ONE) modInput += bus1;
      if (flags & IN_BUS_TWO) modInput += bus2;
      let feedbackInput = 0;
      if (flags & FB_IN) feedbackInput = op.feedbackSample * this.feedbackScale;

      const envLevel = this.opEnvLevel(op, now);
      const amplitude = op.outputLevelGain * dx7LevelToLinear(envLevel);
      const sample = Math.sin(op.phase + modInput * MOD_INDEX_SCALE + feedbackInput * MOD_INDEX_SCALE) * amplitude;

      if (flags & FB_OUT) op.feedbackSample = sample;

      const add = (flags & OUT_BUS_ADD) !== 0;
      if ((flags & IN_BUS_ONE) && (flags & OUT_BUS_ONE)) {
        bus1 = sample; // Scratch-Buffer-Fall: Ausgabe ersetzt Bus1 direkt (keine Akkumulation möglich, da Eingabe==Ausgabe)
      } else if (flags & OUT_BUS_ONE) {
        bus1 = add ? bus1 + sample : sample;
      } else if (flags & OUT_BUS_TWO) {
        bus2 = add ? bus2 + sample : sample;
      } else {
        outSample = add ? outSample + sample : sample;
      }
    }

    let gain = this.masterGain;
    if (this.stopRequested) {
      this.stopFadeElapsed += 1;
      gain *= Math.max(0, 1 - this.stopFadeElapsed / this.stopFadeSamples);
      if (this.stopFadeElapsed >= this.stopFadeSamples) this.finished = true;
    }
    void sampleRate;
    return outSample * gain;
  }
}

class Dx7Processor extends AudioWorkletProcessor {
  private voice: Dx7Voice | null = null;
  private pendingOps: OpParams[];
  private algorithm: number;
  private feedback: number;
  private note: number;

  constructor(options?: AudioWorkletNodeOptions) {
    super();
    const po = (options?.processorOptions ?? {}) as {
      ops: OpParams[];
      algorithm: number;
      feedback: number;
      note: number;
    };
    this.pendingOps = po.ops;
    this.algorithm = po.algorithm;
    this.feedback = po.feedback;
    this.note = po.note;

    this.port.onmessage = (e: MessageEvent) => {
      const msg = e.data as { type: string; velocity?: number; fadeSeconds?: number };
      if (msg.type === "noteOn") {
        this.voice = new Dx7Voice(this.pendingOps, this.algorithm, this.feedback, this.note, sampleRate, msg.velocity ?? 0.8);
      } else if (msg.type === "noteOff") {
        this.voice?.release(currentTime);
      } else if (msg.type === "stop") {
        this.voice?.requestStop(currentTime, msg.fadeSeconds ?? 0.02, sampleRate);
      }
    };
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const out = outputs[0][0];
    if (!this.voice) {
      out.fill(0);
      return true;
    }
    const v = this.voice;
    for (let n = 0; n < out.length; n++) {
      const t = currentTime + n / sampleRate;
      out[n] = v.renderSample(t, sampleRate);
    }
    if (v.finished) {
      this.port.postMessage({ type: "finished" });
      this.voice = null;
    }
    return true;
  }
}

registerProcessor("dx7-processor", Dx7Processor);
