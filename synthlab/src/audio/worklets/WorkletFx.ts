// Adapter, der einen dauerhaft laufenden Stereo-AudioWorkletNode hinter das
// `FxNode`-Interface (audio/fx/registry.ts) legt (plan10 §5.3). Anders als
// WorkletVoice.ts (eine Note = ein Leben, `isFinished()`) modelliert dieser
// Adapter ein FX-Gerät: läuft dauerhaft, 2 Eingänge, 2 Ausgänge, Parameter
// jederzeit änderbar, kein Lebensende außer explizitem dispose().
import type { FxNode } from "../fx/registry";
import type { FxParamValue } from "../fx/types";

export class WorkletFx implements FxNode {
  readonly input: AudioWorkletNode;
  readonly output: AudioWorkletNode;
  private node: AudioWorkletNode;

  constructor(node: AudioWorkletNode) {
    this.node = node;
    this.input = node;
    this.output = node;
  }

  update(settings: Record<string, FxParamValue>): void {
    this.node.port.postMessage({ type: "params", settings });
  }

  start(time: number): void {
    this.node.port.postMessage({ type: "start", time });
  }

  setFreeze(freeze: boolean): void {
    this.node.port.postMessage({ type: "freeze", freeze });
  }

  dispose(): void {
    this.node.port.onmessage = null;
    try { this.node.disconnect(); } catch { /* noop */ }
  }
}

/** Baut einen Stereo-FX-AudioWorkletNode mit einheitlichen In/Out-Kanaleinstellungen. */
export function createFxWorkletNode(ctx: BaseAudioContext, processorName: string, initialSettings: Record<string, FxParamValue>): AudioWorkletNode {
  return new AudioWorkletNode(ctx, processorName, {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCount: 2,
    channelCountMode: "explicit",
    channelInterpretation: "speakers",
    outputChannelCount: [2],
    processorOptions: { settings: initialSettings },
  });
}
