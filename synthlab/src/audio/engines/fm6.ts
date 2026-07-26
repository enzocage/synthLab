// 3. fm6: 6-Operator-FM mit Feedback. Algorithmen sind eine kompakte, spielbare
// Auswahl inspiriert von den 32 DX7/AMY-Routings in research/derived/fm-algorithms.json
// (Stack, parallele Träger, Feedback-Loop) — keine 1:1-Kopie der Bus-Semantik,
// sondern eigene Umsetzung mit nativen Web-Audio-Knoten (Oscillator.frequency
// als FM-Eingang, Feedback über einen minimalen DelayNode).
// Rollen: bell, bass, synth, fx.
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { AdsrGain, type AdsrTimes } from "./shared/envelope";
import { midiToHz } from "./shared/util";

interface OpDef {
  carrier: boolean;
  modulates: number | null; // Index des Operators, den dieser moduliert (null = keiner/nur Carrier-Ausgabe)
  feedback: boolean;
}

// 8 handkuratierte Algorithmen (op1..op6), stilistisch an DX7/AMY-Vielfalt angelehnt.
const ALGORITHMS: OpDef[][] = [
  // 0: einfache Stack-Kette 6->5->4->3->2->1(Carrier) - klassischer Glocken-Klang
  [
    { carrier: true, modulates: null, feedback: false },
    { carrier: false, modulates: 0, feedback: false },
    { carrier: false, modulates: 1, feedback: false },
    { carrier: false, modulates: 2, feedback: false },
    { carrier: false, modulates: 3, feedback: false },
    { carrier: false, modulates: 4, feedback: true },
  ],
  // 1: zwei parallele 3-Op-Stacks (zwei Carrier) - breiterer, komplexerer Klang
  [
    { carrier: true, modulates: null, feedback: false },
    { carrier: false, modulates: 0, feedback: false },
    { carrier: false, modulates: 1, feedback: false },
    { carrier: true, modulates: null, feedback: false },
    { carrier: false, modulates: 3, feedback: false },
    { carrier: false, modulates: 4, feedback: true },
  ],
  // 2: ein Carrier mit 5 parallelen Modulatoren (additiv-FM-Hybrid)
  [
    { carrier: true, modulates: null, feedback: false },
    { carrier: false, modulates: 0, feedback: false },
    { carrier: false, modulates: 0, feedback: false },
    { carrier: false, modulates: 0, feedback: false },
    { carrier: false, modulates: 0, feedback: false },
    { carrier: false, modulates: 0, feedback: true },
  ],
  // 3: drei Carrier, je ein Modulator (additiv, kaum FM) - fast additiv
  [
    { carrier: true, modulates: null, feedback: false },
    { carrier: false, modulates: 0, feedback: false },
    { carrier: true, modulates: null, feedback: false },
    { carrier: false, modulates: 2, feedback: false },
    { carrier: true, modulates: null, feedback: false },
    { carrier: false, modulates: 4, feedback: true },
  ],
  // 4: tiefe Kette mit Feedback am Ende der Kette (rau, metallisch)
  [
    { carrier: true, modulates: null, feedback: false },
    { carrier: false, modulates: 0, feedback: false },
    { carrier: false, modulates: 1, feedback: true },
    { carrier: true, modulates: null, feedback: false },
    { carrier: false, modulates: 3, feedback: false },
    { carrier: false, modulates: 4, feedback: false },
  ],
  // 5: 2-Op-Paare x3, alle Carrier (additive Klangfarbe, ideal für Drones)
  [
    { carrier: true, modulates: null, feedback: false },
    { carrier: false, modulates: 0, feedback: false },
    { carrier: true, modulates: null, feedback: false },
    { carrier: false, modulates: 2, feedback: false },
    { carrier: true, modulates: null, feedback: false },
    { carrier: false, modulates: 4, feedback: false },
  ],
  // 6: ein Carrier, tiefe Kette komplett mit Feedback am Fuß (sehr rau)
  [
    { carrier: true, modulates: null, feedback: false },
    { carrier: false, modulates: 0, feedback: false },
    { carrier: false, modulates: 1, feedback: false },
    { carrier: false, modulates: 2, feedback: false },
    { carrier: false, modulates: 3, feedback: false },
    { carrier: false, modulates: 4, feedback: false },
  ],
  // 7: Selbstmodulierender Carrier (op1 feedback direkt) + Stack darüber
  [
    { carrier: true, modulates: null, feedback: true },
    { carrier: false, modulates: 0, feedback: false },
    { carrier: false, modulates: 1, feedback: false },
    { carrier: false, modulates: 2, feedback: false },
    { carrier: false, modulates: 3, feedback: false },
    { carrier: false, modulates: 4, feedback: false },
  ],
];

const OP_COUNT = 6;
function opParam(i: number, field: string) { return `op${i + 1}${field}`; }

const params: ParamSpec[] = [
  { id: "algorithm", label: "Algorithmus", kind: "int", min: 0, max: ALGORITHMS.length - 1, default: 0, group: "algo" },
  { id: "feedbackAmount", label: "Feedback", kind: "float", min: 0, max: 1, default: 0.15, group: "algo", mutationWeight: 0.9 },
  ...Array.from({ length: OP_COUNT }, (_, i) => [
    { id: opParam(i, "Ratio"), label: `Op${i + 1} Ratio`, kind: "float", min: 0.25, max: 16, default: [1, 2, 3.01, 1, 5, 7][i] ?? 1, curve: "log", group: "op", mutationWeight: 0.7 } as ParamSpec,
    { id: opParam(i, "Level"), label: `Op${i + 1} Level`, kind: "float", min: 0, max: 1, default: i === 0 ? 0.8 : 0.4, group: "op", mutationWeight: 0.8 } as ParamSpec,
    { id: opParam(i, "Attack"), label: `Op${i + 1} Attack`, kind: "float", min: 0.001, max: 6, default: 0.01, curve: "log", unit: "s", group: "opEnv" } as ParamSpec,
    { id: opParam(i, "Decay"), label: `Op${i + 1} Decay`, kind: "float", min: 0.01, max: 8, default: 1.5, curve: "log", unit: "s", group: "opEnv" } as ParamSpec,
    { id: opParam(i, "Sustain"), label: `Op${i + 1} Sustain`, kind: "float", min: 0, max: 1, default: 0.5, group: "opEnv" } as ParamSpec,
    { id: opParam(i, "Release"), label: `Op${i + 1} Release`, kind: "float", min: 0.05, max: 20, default: 2, curve: "log", unit: "s", group: "opEnv" } as ParamSpec,
  ]).flat(),
];

interface OperatorNodes {
  osc: OscillatorNode;
  indexGain: GainNode; // FM-Modulationstiefe -> Ziel-Frequency
  levelEnv: AdsrGain; // steuert indexGain bzw. Carrier-Output-Pegel
  feedbackDelay: DelayNode | null;
  feedbackGain: GainNode | null;
}

class Fm6Voice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private ops: OperatorNodes[] = [];
  private algo: OpDef[];
  private releaseSeconds: number[] = [];

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    const freq = midiToHz(note);
    const algoIdx = Math.round(Number(values.algorithm));
    this.algo = ALGORITHMS[Math.max(0, Math.min(ALGORITHMS.length - 1, algoIdx))];

    this.output = this.ctx.createGain();
    this.output.gain.value = 1;

    for (let i = 0; i < OP_COUNT; i++) {
      const ratio = Number(values[opParam(i, "Ratio")]);
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * ratio;

      const times: AdsrTimes = {
        attack: Number(values[opParam(i, "Attack")]),
        decay: Number(values[opParam(i, "Decay")]),
        sustain: Number(values[opParam(i, "Sustain")]),
        release: Number(values[opParam(i, "Release")]),
      };
      this.releaseSeconds[i] = times.release;
      const levelEnv = new AdsrGain(this.ctx, times);

      const indexGain = this.ctx.createGain();
      const baseLevel = Number(values[opParam(i, "Level")]);
      indexGain.gain.value = this.algo[i].carrier ? 1 : baseLevel * freq * ratio * 4; // FM-Index skaliert mit Trägerfrequenz

      let feedbackDelay: DelayNode | null = null;
      let feedbackGain: GainNode | null = null;
      if (this.algo[i].feedback) {
        feedbackDelay = this.ctx.createDelay(0.01);
        feedbackDelay.delayTime.value = 0.0015;
        feedbackGain = this.ctx.createGain();
        feedbackGain.gain.value = Number(values.feedbackAmount) * freq * ratio * 2;
        osc.connect(feedbackDelay).connect(feedbackGain).connect(osc.frequency);
      }

      osc.connect(levelEnv.node);
      levelEnv.node.connect(indexGain);

      this.ops.push({ osc, indexGain, levelEnv, feedbackDelay, feedbackGain });
    }

    // Verbindungen gemäß Algorithmus herstellen: Modulator -> Ziel-Frequenz, Carrier -> Output.
    for (let i = 0; i < OP_COUNT; i++) {
      const def = this.algo[i];
      if (def.carrier) {
        this.ops[i].indexGain.connect(this.output);
      } else if (def.modulates !== null) {
        this.ops[i].indexGain.connect(this.ops[def.modulates].osc.frequency);
      }
    }
  }

  trigger(velocity: number, time: number): void {
    for (const op of this.ops) {
      op.osc.start(time);
      op.levelEnv.trigger(velocity, time);
    }
  }

  release(time: number): void {
    for (let i = 0; i < this.ops.length; i++) {
      this.ops[i].levelEnv.release(time);
      const stopAt = time + this.releaseSeconds[i] + 0.05;
      try { this.ops[i].osc.stop(stopAt); } catch { /* noop */ }
    }
  }

  stop(time: number, fadeSeconds = 0.02): void {
    for (const op of this.ops) {
      op.levelEnv.stop(time, fadeSeconds);
      try { op.osc.stop(time + fadeSeconds + 0.01); } catch { /* noop */ }
    }
  }

  setParam(paramId: string, value: number | string | boolean, time: number): void {
    const m = /^op(\d)(Ratio|Level)$/.exec(paramId);
    if (m) {
      const idx = Number(m[1]) - 1;
      const op = this.ops[idx];
      if (!op) return;
      if (m[2] === "Ratio") {
        const freq = midiToHz(this.note);
        op.osc.frequency.setTargetAtTime(freq * Number(value), time, 0.01);
      }
    }
  }

  isFinished(time: number): boolean {
    return this.ops.every((op) => op.levelEnv.isFinished(time));
  }

  dispose(): void {
    for (const op of this.ops) {
      try { op.osc.disconnect(); } catch { /* noop */ }
      op.indexGain.disconnect();
      op.levelEnv.node.disconnect();
      op.feedbackDelay?.disconnect();
      op.feedbackGain?.disconnect();
    }
    this.output.disconnect();
  }
}

export const fm6Engine: Engine = {
  id: "fm6",
  name: "FM6 (6-Operator)",
  params,
  defaultMacroMap: {
    brightness: [{ paramId: "op2Level", atZero: 0.05, atOne: 0.9 }, { paramId: "op3Level", atZero: 0.05, atOne: 0.7 }],
    drive: [{ paramId: "feedbackAmount", atZero: 0, atOne: 0.8 }],
    motion: [{ paramId: "op1Decay", atZero: 6, atOne: 0.3 }],
    space: [{ paramId: "op1Release", atZero: 0.3, atOne: 15 }],
    detune: [{ paramId: "op2Ratio", atZero: 1.98, atOne: 2.08 }],
  },
  createVoice(globals, values, note) {
    return new Fm6Voice(globals, note, values);
  },
};

export function fm6Defaults(): ParamValues {
  return defaultParamValues(params);
}

export const FM6_ALGORITHM_COUNT = ALGORITHMS.length;
