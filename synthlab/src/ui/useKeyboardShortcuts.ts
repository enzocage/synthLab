// Tastatur-Workflow der Testsuite (PLAN.md Phase 7) - der eigentliche Kern des
// Produkts: Preset-Wechsel und Bewertung ohne Maus. Erweitert um einen
// Ableton-Style Computer-Tastatur-als-MIDI-Keyboard-Modus (siehe
// midi/computerKeyboardMap.ts): solange dieser Modus aktiv ist, spielen die
// Klaviatur-Tasten Noten statt ihrer sonstigen Funktion (genau wie in Ableton
// Live, wo die "Computer-MIDI-Tastatur" die normalen Tastenkürzel während der
// Aktivierung ebenfalls überlagert).
import { useEffect, useRef } from "react";
import { KEY_NOTE_LOOKUP, PIANO_MODE_KEYS, OCTAVE_DOWN_KEY, OCTAVE_UP_KEY } from "../midi/computerKeyboardMap";
import { resolveCommand } from "./commands/commandRegistry";

export interface PianoModeConfig {
  enabled: boolean;
  octaveBaseNote: number;
  onNoteOn(note: number): void;
  onNoteOff(note: number): void;
  onOctaveShift(delta: number): void;
}

export interface KeyboardHandlers {
  playToggle(): void;
  nextPreset(big: boolean): void;
  prevPreset(big: boolean): void;
  nextUnrated(): void;
  rate(n: number): void;
  discard(): void;
  favorite(): void;
  cyclePhrase(): void;
  mutate(): void;
  playVariant(idx: number): void;
  acceptVariant(): void;
  setSlot(slot: "A" | "B" | "toggle"): void;
  toggleReferenceDrone(): void;
  saveToCollection(): void;
  undo(): void;
  holdNoteDown(): void;
  holdNoteUp(): void;
  panic(): void;
  toggleHelp(): void;
  pianoMode: PianoModeConfig;
}

export function useKeyboardShortcuts(handlers: KeyboardHandlers): void {
  // Store the absolute note per physical key so octave changes while a key is
  // held still release the note that was actually started.
  const heldPianoKeys = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    function isTypingTarget(el: EventTarget | null): boolean {
      const tag = (el as HTMLElement | null)?.tagName?.toLowerCase();
      return tag === "input" || tag === "textarea" || (el as HTMLElement | null)?.isContentEditable === true;
    }

    function onKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();

      // Computer-Tastatur-Piano-Modus hat Vorrang vor allen sonstigen Shortcuts
      // fuer die von ihm belegten Tasten (siehe Dateikopf-Kommentar).
      if (handlers.pianoMode.enabled && PIANO_MODE_KEYS.has(key)) {
        // This branch intentionally runs even when an input, select or button
        // owns focus. The keyboard instrument must remain playable at all times.
        e.preventDefault();
        if (heldPianoKeys.current.has(key)) return; // OS-Tastenwiederholung ignorieren
        if (key === OCTAVE_DOWN_KEY) { handlers.pianoMode.onOctaveShift(-1); return; }
        if (key === OCTAVE_UP_KEY) { handlers.pianoMode.onOctaveShift(1); return; }
        const offset = KEY_NOTE_LOOKUP.get(key);
        if (offset !== undefined) {
          const note = handlers.pianoMode.octaveBaseNote + offset;
          heldPianoKeys.current.set(key, note);
          handlers.pianoMode.onNoteOn(note);
        }
        return;
      }

      if (isTypingTarget(e.target)) return;

      const normalizedKey = key === "arrowdown" ? "j" : key === "arrowup" ? "k" : key;
      const command = resolveCommand(normalizedKey, e.ctrlKey || e.metaKey);
      if (!command) return;

      // Fokus auf Formularelementen (z.B. die Filter-<select>s) darf die globalen
      // Shortcuts nicht zusaetzlich mit nativem Browser-Verhalten (Typeahead,
      // Leertaste-klickt-Button, Pfeiltasten aendern Auswahl) ueberlagern.
      const el = e.target as HTMLElement | null;
      if (el && el !== document.body && typeof el.blur === "function") el.blur();
      e.preventDefault();

      if (command === "history.undo") handlers.undo();
      else if (command === "transport.toggle") handlers.playToggle();
      else if (command === "preset.next") handlers.nextPreset(e.shiftKey);
      else if (command === "preset.previous") handlers.prevPreset(e.shiftKey);
      else if (command === "preset.nextUnrated") handlers.nextUnrated();
      else if (command.startsWith("preset.rate")) handlers.rate(Number(command.at(-1)));
      else if (command === "preset.discard") handlers.discard();
      else if (command === "preset.favorite") handlers.favorite();
      else if (command === "phrase.cycle") handlers.cyclePhrase();
      else if (command === "variation.generate") handlers.mutate();
      else if (command.startsWith("variation.play")) handlers.playVariant(Number(command.at(-1)));
      else if (command === "variation.accept") handlers.acceptVariant();
      else if (command === "ab.storeA") handlers.setSlot("A");
      else if (command === "ab.storeB") handlers.setSlot("B");
      else if (command === "ab.toggle") handlers.setSlot("toggle");
      else if (command === "reference.toggle") handlers.toggleReferenceDrone();
      else if (command === "collection.save") handlers.saveToCollection();
      else if (command === "note.hold") handlers.holdNoteDown();
      else if (command === "audio.panic") handlers.panic();
      else if (command === "help.toggle") handlers.toggleHelp();
    }

    function onKeyUp(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if (handlers.pianoMode.enabled && PIANO_MODE_KEYS.has(key)) {
        e.preventDefault();
        const note = heldPianoKeys.current.get(key);
        heldPianoKeys.current.delete(key);
        if (note !== undefined) handlers.pianoMode.onNoteOff(note);
        return;
      }
      if (isTypingTarget(e.target)) return;
      if (key === "h") handlers.holdNoteUp();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handlers]);
}
