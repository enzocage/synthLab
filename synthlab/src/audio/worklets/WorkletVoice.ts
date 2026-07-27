// Adapter, der einen AudioWorkletNode hinter das bestehende `Voice`-Interface
// legt (siehe audio/core/types.ts). Ein Worklet kann `isFinished()` nicht
// synchron beantworten (die eigentliche Hüllkurve läuft im Audio-Rendering-
// Thread) - der Prozessor postet stattdessen eine 'finished'-Message, sobald
// seine Release-Phase durchlaufen ist; dieser Adapter cached den Zustand lokal.
import type { Voice } from "../core/types";

export interface WorkletVoiceMessage {
  type: "noteOn" | "noteOff" | "stop" | "setParam";
  velocity?: number;
  time?: number;
  fadeSeconds?: number;
  paramId?: string;
  value?: number | string | boolean;
}

export class WorkletVoice implements Voice {
  readonly note: number;
  readonly output: AudioNode;
  private node: AudioWorkletNode;
  private finished = false;

  constructor(note: number, node: AudioWorkletNode) {
    this.note = note;
    this.node = node;
    this.output = node;
    node.port.onmessage = (e: MessageEvent) => {
      if (e.data?.type === "finished") this.finished = true;
    };
  }

  trigger(velocity: number, time: number): void {
    this.node.port.postMessage({ type: "noteOn", velocity, time } satisfies WorkletVoiceMessage);
  }

  release(time: number): void {
    this.node.port.postMessage({ type: "noteOff", time } satisfies WorkletVoiceMessage);
  }

  stop(time: number, fadeSeconds = 0.02): void {
    this.node.port.postMessage({ type: "stop", time, fadeSeconds } satisfies WorkletVoiceMessage);
    // Sicherheitsnetz: falls die 'finished'-Message aus irgendeinem Grund nicht
    // ankommt (z.B. Worklet-Fehler), spätestens nach dem Fade als beendet gelten.
    setTimeout(() => { this.finished = true; }, Math.max(1, fadeSeconds * 1000) + 50);
  }

  setParam(paramId: string, value: number | string | boolean, time: number): void {
    this.node.port.postMessage({ type: "setParam", paramId, value, time } satisfies WorkletVoiceMessage);
  }

  isFinished(_time: number): boolean {
    return this.finished;
  }

  dispose(): void {
    this.node.port.onmessage = null;
    try { this.node.disconnect(); } catch { /* noop */ }
  }
}
