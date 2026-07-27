// 23. dx7: echte 6-Operator-FM nach Yamaha DX7-Architektur, als AudioWorklet
// (siehe audio/worklets/dx7.worklet.ts für die Algorithmus-/Envelope-Portierung
// aus AMY, MIT). Parameter sind bewusst 1:1 die echten DX7-Voice-Bytes (Rate/
// Level je EG-Stufe 0..99, Coarse/Fine/Detune, Output-Level, Algorithmus 0..31,
// Feedback 0..7) - dadurch lassen sich die 1.024 importierten DX7-Werksvoices
// ohne Umrechnung direkt als engine-params verwenden (siehe
// research/extract/import-dx7.mjs, dx7Presets.ts).
//
// Ersetzt NICHT die bisherige `fm-dx7`-Engine (generierte Modulo-Presets,
// bleibt als eigenständige, einfachere FM-Variante bestehen) - `dx7` ist die
// neue, auf echten Werksdaten basierende Engine.
import type { Engine, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { ensureWorkletLoaded } from "../worklets/registry";
import { WorkletVoice } from "../worklets/WorkletVoice";

const WORKLET_URL = new URL("../worklets/dx7.worklet.ts", import.meta.url);

const OP_NUMBERS = [1, 2, 3, 4, 5, 6];

function opParams(opNum: number): ParamSpec[] {
  const g = `op${opNum}`;
  return [
    { id: `${g}Rate1`, label: `Op${opNum} R1`, kind: "int", min: 0, max: 99, default: 99, group: g },
    { id: `${g}Rate2`, label: `Op${opNum} R2`, kind: "int", min: 0, max: 99, default: 50, group: g },
    { id: `${g}Rate3`, label: `Op${opNum} R3`, kind: "int", min: 0, max: 99, default: 35, group: g },
    { id: `${g}Rate4`, label: `Op${opNum} R4`, kind: "int", min: 0, max: 99, default: 50, group: g },
    { id: `${g}Level1`, label: `Op${opNum} L1`, kind: "int", min: 0, max: 99, default: 99, group: g },
    { id: `${g}Level2`, label: `Op${opNum} L2`, kind: "int", min: 0, max: 99, default: 90, group: g },
    { id: `${g}Level3`, label: `Op${opNum} L3`, kind: "int", min: 0, max: 99, default: 70, group: g },
    { id: `${g}Level4`, label: `Op${opNum} L4`, kind: "int", min: 0, max: 99, default: 0, group: g },
    { id: `${g}RatioMode`, label: `Op${opNum} Ratio-Modus`, kind: "bool", default: true, group: g },
    { id: `${g}Coarse`, label: `Op${opNum} Coarse`, kind: "int", min: 0, max: 31, default: opNum === 1 ? 1 : 1, group: g },
    { id: `${g}Fine`, label: `Op${opNum} Fine`, kind: "int", min: 0, max: 99, default: 0, group: g },
    { id: `${g}Detune`, label: `Op${opNum} Detune`, kind: "int", min: 0, max: 14, default: 7, group: g },
    { id: `${g}OutputLevel`, label: `Op${opNum} Level`, kind: "int", min: 0, max: 99, default: opNum === 1 ? 99 : 60, group: g, mutationWeight: 0.8 },
  ];
}

const params: ParamSpec[] = [
  { id: "algorithm", label: "Algorithmus", kind: "int", min: 0, max: 31, default: 0, group: "global", mutationWeight: 0.5 },
  { id: "feedback", label: "Feedback", kind: "int", min: 0, max: 7, default: 3, group: "global", mutationWeight: 0.7 },
  ...OP_NUMBERS.flatMap(opParams),
];

function readOp(values: ParamValues, opNum: number) {
  const g = `op${opNum}`;
  return {
    rates: [Number(values[`${g}Rate1`]), Number(values[`${g}Rate2`]), Number(values[`${g}Rate3`]), Number(values[`${g}Rate4`])] as [number, number, number, number],
    levels: [Number(values[`${g}Level1`]), Number(values[`${g}Level2`]), Number(values[`${g}Level3`]), Number(values[`${g}Level4`])] as [number, number, number, number],
    ratioMode: Boolean(values[`${g}RatioMode`]),
    coarse: Number(values[`${g}Coarse`]),
    fine: Number(values[`${g}Fine`]),
    detune: Number(values[`${g}Detune`]),
    outputLevel: Number(values[`${g}OutputLevel`]),
  };
}

class Dx7Voice implements Voice {
  readonly note: number;
  readonly output: AudioWorkletNode;
  private inner: WorkletVoice;

  constructor(ctx: BaseAudioContext, note: number, values: ParamValues) {
    this.note = note;
    // Op-Reihenfolge im processorOptions-Array muss Op6..Op1 sein (siehe
    // dx7.worklet.ts ALGORITHMS-Tabelle / import-dx7.mjs Byte-Reihenfolge).
    const ops = [6, 5, 4, 3, 2, 1].map((n) => readOp(values, n));
    this.output = new AudioWorkletNode(ctx, "dx7-processor", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: {
        ops,
        algorithm: Number(values.algorithm),
        feedback: Number(values.feedback),
        note,
      },
    });
    this.inner = new WorkletVoice(note, this.output);
  }

  trigger(velocity: number, time: number): void {
    this.inner.trigger(velocity, time);
  }

  release(time: number): void {
    this.inner.release(time);
  }

  stop(time: number, fadeSeconds = 0.02): void {
    this.inner.stop(time, fadeSeconds);
  }

  setParam(paramId: string, value: number | string | boolean, time: number): void {
    this.inner.setParam(paramId, value, time);
  }

  isFinished(time: number): boolean {
    return this.inner.isFinished(time);
  }

  dispose(): void {
    this.inner.dispose();
  }
}

export const dx7Engine: Engine = {
  id: "dx7",
  name: "DX7 (Yamaha 6-Op FM, echte Werksdaten)",
  maxVoices: 4,
  params,
  defaultMacroMap: {
    brightness: [{ paramId: "op2OutputLevel", atZero: 0, atOne: 99 }],
    drive: [{ paramId: "feedback", atZero: 0, atOne: 7 }],
    motion: [{ paramId: "op3OutputLevel", atZero: 0, atOne: 80 }],
    space: [{ paramId: "op1Rate4", atZero: 70, atOne: 10 }],
    body: [{ paramId: "op1OutputLevel", atZero: 40, atOne: 99 }],
  },
  createVoice(globals, values, note) {
    return new Dx7Voice(globals.audioContext, note, values);
  },
};

export function dx7Defaults(): ParamValues {
  return defaultParamValues(params);
}

/** Muss vor dem ersten createVoice()-Aufruf abgeschlossen sein (siehe AudioController/PresetLoader). */
export async function ensureDx7WorkletLoaded(ctx: BaseAudioContext): Promise<void> {
  await ensureWorkletLoaded(ctx, "dx7-processor", WORKLET_URL);
}
