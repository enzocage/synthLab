// Optionale Web-MIDI-Hardware-Eingabe, parallel zur laufenden generativen
// Phrase (PLAN.md Phase 6, User-Entscheidung: "generativ + Web-MIDI-Hardware").
// Routet ueber den vom Aufrufer uebergebenen Handler statt direkt auf einen
// VoiceManager, damit Hardware-Noten (wie Tastatur-Klicks) durch Arp/Recorder
// laufen koennen (AudioController.noteOn/noteOff).
export interface HardwareInputHandle {
  disconnect(): void;
}

export interface NoteHandler {
  noteOn(note: number, velocity: number): void;
  noteOff(note: number): void;
}

export function isWebMidiSupported(): boolean {
  return typeof navigator !== "undefined" && "requestMIDIAccess" in navigator;
}

/** Verbindet alle vorhandenen MIDI-Eingaenge mit dem uebergebenen Note-Handler. */
export async function connectHardwareInput(handler: NoteHandler): Promise<HardwareInputHandle> {
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

    if (status === 0x90 && velocity > 0) {
      handler.noteOn(note, velocity / 127);
    } else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
      handler.noteOff(note);
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
