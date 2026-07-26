// Optionale Web-MIDI-Hardware-Eingabe, parallel zur laufenden generativen
// Phrase (PLAN.md Phase 6, User-Entscheidung: "generativ + Web-MIDI-Hardware").
import type { VoiceManager } from "../audio/core/VoiceManager";

export interface HardwareInputHandle {
  disconnect(): void;
}

type GetVoiceManager = () => VoiceManager | null;

export function isWebMidiSupported(): boolean {
  return typeof navigator !== "undefined" && "requestMIDIAccess" in navigator;
}

/** Verbindet alle vorhandenen MIDI-Eingaenge mit dem aktiven VoiceManager. Gibt ein Handle zum Trennen zurueck. */
export async function connectHardwareInput(
  ctx: BaseAudioContext,
  getVoiceManager: GetVoiceManager
): Promise<HardwareInputHandle> {
  if (!isWebMidiSupported()) {
    return { disconnect() {} };
  }

  const access = await navigator.requestMIDIAccess();
  const listeners: Array<{ input: MIDIInput; handler: (e: MIDIMessageEvent) => void }> = [];

  const onMessage = (e: MIDIMessageEvent) => {
    const data = e.data;
    if (!data || data.length < 2) return;
    const [statusByte, note, velocity = 0] = data;
    const status = statusByte & 0xf0;
    const vm = getVoiceManager();
    if (!vm) return;
    const now = ctx.currentTime;

    if (status === 0x90 && velocity > 0) {
      vm.noteOn(note, velocity / 127, now);
    } else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
      vm.noteOff(note, now);
    }
  };

  for (const input of access.inputs.values()) {
    input.addEventListener("midimessage", onMessage as EventListener);
    listeners.push({ input, handler: onMessage });
  }

  return {
    disconnect() {
      for (const { input, handler } of listeners) {
        input.removeEventListener("midimessage", handler as EventListener);
      }
    },
  };
}
