export type CommandId =
  | "transport.toggle"
  | "preset.next"
  | "preset.previous"
  | "preset.nextUnrated"
  | "preset.discard"
  | "preset.favorite"
  | "phrase.cycle"
  | "variation.generate"
  | "variation.accept"
  | "ab.storeA"
  | "ab.storeB"
  | "ab.toggle"
  | "reference.toggle"
  | "collection.save"
  | "note.hold"
  | "audio.panic"
  | "help.toggle"
  | "history.undo"
  | `preset.rate${1 | 2 | 3 | 4 | 5}`
  | `variation.play${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7}`;

export interface CommandDefinition {
  id: CommandId;
  label: string;
  key: string;
  primaryModifier?: boolean;
}

const VARIANT_KEYS = ["q", "w", "e", "r", "t", "z", "u", "i"] as const;

export const COMMANDS: CommandDefinition[] = [
  { id: "transport.toggle", label: "Play/Stop", key: " " },
  { id: "preset.next", label: "Nächstes Preset", key: "j" },
  { id: "preset.previous", label: "Vorheriges Preset", key: "k" },
  { id: "preset.nextUnrated", label: "Zufälliges unbewertetes Preset", key: "." },
  { id: "preset.discard", label: "Preset verwerfen", key: "0" },
  { id: "preset.favorite", label: "Favorit umschalten", key: "f" },
  { id: "phrase.cycle", label: "Phrase wechseln", key: "tab" },
  { id: "variation.generate", label: "Variationen erzeugen", key: "m" },
  { id: "variation.accept", label: "Variation übernehmen", key: "enter" },
  { id: "ab.storeA", label: "A-Slot speichern", key: "a" },
  { id: "ab.storeB", label: "B-Slot speichern", key: "b" },
  { id: "ab.toggle", label: "A/B wechseln", key: "c" },
  { id: "reference.toggle", label: "Referenz-Drone umschalten", key: "g" },
  { id: "collection.save", label: "In Collection speichern", key: "s" },
  { id: "note.hold", label: "Referenznote halten", key: "h" },
  { id: "audio.panic", label: "Alle Stimmen stoppen", key: "p" },
  { id: "help.toggle", label: "Hilfe öffnen", key: "?" },
  { id: "history.undo", label: "Rückgängig", key: "z", primaryModifier: true },
  ...([1, 2, 3, 4, 5] as const).map((rating) => ({
    id: `preset.rate${rating}` as const,
    label: `Preset mit ${rating} bewerten`,
    key: String(rating),
  })),
  ...VARIANT_KEYS.map((key, index) => ({
    id: `variation.play${index as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7}` as const,
    label: `Variation ${index + 1} spielen`,
    key,
  })),
];

export function resolveCommand(key: string, primaryModifier: boolean): CommandId | null {
  const normalizedKey = key.toLowerCase();
  return COMMANDS.find(
    (command) => command.key === normalizedKey && Boolean(command.primaryModifier) === primaryModifier
  )?.id ?? null;
}

