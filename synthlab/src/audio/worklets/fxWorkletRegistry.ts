// Lädt alle FX-AudioWorklet-Module einmalig vorab (plan10 §5.3). Anders als
// beim DX7-Instrumenten-Worklet (nur bei Preset-Auswahl geladen) reicht es
// nicht, ein FX-Worklet erst beim Einschalten zu laden: `FxChain.update()`
// baut den Graphen bei Slot-Änderungen synchron neu auf
// (`new AudioWorkletNode(...)` wirft sofort, falls der Prozessorname auf
// diesem AudioContext noch nicht registriert ist). Da es nur eine Handvoll
// FX-Worklets gibt, ist ein einmaliges Vorladen aller Module beim
// `AudioController.resume()` einfacher und robuster als ein Lazy-Load pro
// Modul-Umschalter - registrierter Code kostet keine Laufzeit, solange keine
// Node-Instanz existiert.
import { ensureWorkletLoaded } from "./registry";

const FX_WORKLET_MODULES: { name: string; url: URL }[] = [
  { name: "plate-processor", url: new URL("./plate.worklet.ts", import.meta.url) },
  { name: "galactic-processor", url: new URL("./galactic.worklet.ts", import.meta.url) },
  { name: "ladder-processor", url: new URL("./ladder.worklet.ts", import.meta.url) },
  { name: "lofi-processor", url: new URL("./lofi.worklet.ts", import.meta.url) },
];

export async function ensureAllFxWorkletsLoaded(ctx: BaseAudioContext): Promise<void> {
  await Promise.all(FX_WORKLET_MODULES.map((m) => ensureWorkletLoaded(ctx, m.name, m.url)));
}
