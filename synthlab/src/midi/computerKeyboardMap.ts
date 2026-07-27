// Ableton-Live-Style "Computer-Tastatur als MIDI-Keyboard": die untere
// Buchstabenreihe (A S D F G H J K L ;) sind weiße Tasten, die Reihe darüber
// (W E _ T Y U _ O P) sind schwarze Tasten, versetzt über den Lücken zwischen
// E/F und H/J platziert. Z und X verschieben die aktuell gemappte Oktave
// runter/hoch - exakt das Standardschema aus Ableton Lives "Computer-MIDI-
// Tastatur"-Funktion (siehe Ableton-Live-Handbuch, Abschnitt "Verwenden der
// Computertastatur als MIDI-Controller").
export interface KeyNoteMapping {
  key: string; // e.key (lowercase)
  semitoneOffset: number; // relativ zur Basisnote der aktuellen Oktave (C)
  isBlack: boolean;
}

export const KEY_NOTE_MAP: KeyNoteMapping[] = [
  { key: "a", semitoneOffset: 0, isBlack: false }, // C
  { key: "w", semitoneOffset: 1, isBlack: true }, // C#
  { key: "s", semitoneOffset: 2, isBlack: false }, // D
  { key: "e", semitoneOffset: 3, isBlack: true }, // D#
  { key: "d", semitoneOffset: 4, isBlack: false }, // E
  { key: "f", semitoneOffset: 5, isBlack: false }, // F
  { key: "t", semitoneOffset: 6, isBlack: true }, // F#
  { key: "g", semitoneOffset: 7, isBlack: false }, // G
  { key: "y", semitoneOffset: 8, isBlack: true }, // G#
  { key: "h", semitoneOffset: 9, isBlack: false }, // A
  { key: "u", semitoneOffset: 10, isBlack: true }, // A#
  { key: "j", semitoneOffset: 11, isBlack: false }, // B
  { key: "k", semitoneOffset: 12, isBlack: false }, // C (nächste Oktave)
  { key: "o", semitoneOffset: 13, isBlack: true }, // C#
  { key: "l", semitoneOffset: 14, isBlack: false }, // D
  { key: "p", semitoneOffset: 15, isBlack: true }, // D#
  { key: ";", semitoneOffset: 16, isBlack: false }, // E
];

export const KEY_NOTE_LOOKUP: Map<string, number> = new Map(KEY_NOTE_MAP.map((m) => [m.key, m.semitoneOffset]));

export const OCTAVE_DOWN_KEY = "z";
export const OCTAVE_UP_KEY = "x";

export const DEFAULT_OCTAVE_BASE_NOTE = 48; // C3 - musikalisch sinnvolle Grundoktave für Ambient-Pads/Bässe
export const MIN_OCTAVE_BASE_NOTE = 12; // C0
export const MAX_OCTAVE_BASE_NOTE = 96; // C7

/** Alle Tasten, die im Computer-Keyboard-Piano-Modus belegt sind (für Konfliktprüfung mit anderen Shortcuts). */
export const PIANO_MODE_KEYS: ReadonlySet<string> = new Set([
  ...KEY_NOTE_MAP.map((m) => m.key),
  OCTAVE_DOWN_KEY,
  OCTAVE_UP_KEY,
]);
