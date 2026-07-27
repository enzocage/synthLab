// Ambient-Deklarationen für den AudioWorkletGlobalScope. TypeScripts DOM-Lib
// kennt AudioWorkletNode (Hauptthread-Seite), aber nicht die Globals, die
// innerhalb eines Worklet-Moduls selbst zur Verfügung stehen (das läuft in
// einem eigenen Realm ohne Window/DOM). Nur die hier tatsächlich genutzten
// Deklarationen, keine vollständige Nachbildung der Spec.
declare const sampleRate: number;
declare const currentTime: number;

declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor(options?: AudioWorkletNodeOptions);
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean;
}

declare function registerProcessor(
  name: string,
  processorCtor: new (options?: AudioWorkletNodeOptions) => AudioWorkletProcessor
): void;
