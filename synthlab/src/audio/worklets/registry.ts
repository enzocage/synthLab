// Lazy AudioWorklet-Modul-Registrierung: `audioWorklet.addModule()` darf pro
// AudioContext nur einmal pro Modul-URL aufgerufen werden (ein zweiter Aufruf
// wirft nicht, ist aber unnötige Netzwerk-/Parse-Arbeit) - dieser Cache stellt
// sicher, dass jedes Worklet-Modul pro Context genau einmal geladen wird, auch
// wenn mehrere Engines/Voices gleichzeitig danach fragen (Promise-Dedupe).
const loaded = new WeakMap<BaseAudioContext, Map<string, Promise<void>>>();

export async function ensureWorkletLoaded(ctx: BaseAudioContext, name: string, url: URL): Promise<void> {
  let perCtx = loaded.get(ctx);
  if (!perCtx) {
    perCtx = new Map();
    loaded.set(ctx, perCtx);
  }
  let pending = perCtx.get(name);
  if (!pending) {
    pending = ctx.audioWorklet.addModule(url);
    perCtx.set(name, pending);
  }
  return pending;
}
