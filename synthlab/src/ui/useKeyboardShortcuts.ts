// Tastatur-Workflow der Testsuite (PLAN.md Phase 7) - der eigentliche Kern des
// Produkts: Preset-Wechsel und Bewertung ohne Maus.
import { useEffect } from "react";

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
}

const VARIANT_KEYS = ["q", "w", "e", "r", "t", "z", "u", "i"];
// Alle Einzeltasten, die dieser Hook konsumiert - nur fuer diese wird das
// native Browserverhalten (Select-Typeahead, Leertaste klickt Button, ...)
// unterdrueckt; alles andere (F12, Strg+..., Browser-Shortcuts) bleibt unberuehrt.
const HANDLED_KEYS = new Set([
  " ", "j", "arrowdown", "k", "arrowup", ".", "0", "1", "2", "3", "4", "5",
  "f", "tab", "m", "enter", "a", "b", "c", "g", "s", "h", "p", ...VARIANT_KEYS,
]);

export function useKeyboardShortcuts(handlers: KeyboardHandlers): void {
  useEffect(() => {
    function isTypingTarget(el: EventTarget | null): boolean {
      const tag = (el as HTMLElement | null)?.tagName?.toLowerCase();
      return tag === "input" || tag === "textarea" || (el as HTMLElement | null)?.isContentEditable === true;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      const key = e.key.toLowerCase();
      const isUndo = key === "z" && (e.ctrlKey || e.metaKey);
      if (!HANDLED_KEYS.has(key) && !isUndo) return;

      // Fokus auf Formularelementen (z.B. die Filter-<select>s) darf die globalen
      // Shortcuts nicht zusaetzlich mit nativem Browser-Verhalten (Typeahead,
      // Leertaste-klickt-Button, Pfeiltasten aendern Auswahl) ueberlagern.
      const el = e.target as HTMLElement | null;
      if (el && el !== document.body && typeof el.blur === "function") el.blur();
      e.preventDefault();

      if (isUndo) { handlers.undo(); return; }
      if (key === " ") { handlers.playToggle(); return; }
      if (key === "j" || key === "arrowdown") { handlers.nextPreset(e.shiftKey); return; }
      if (key === "k" || key === "arrowup") { handlers.prevPreset(e.shiftKey); return; }
      if (key === ".") { handlers.nextUnrated(); return; }
      if (key >= "1" && key <= "5") { handlers.rate(Number(key)); return; }
      if (key === "0") { handlers.discard(); return; }
      if (key === "f") { handlers.favorite(); return; }
      if (key === "tab") { handlers.cyclePhrase(); return; }
      if (key === "m") { handlers.mutate(); return; }
      if (VARIANT_KEYS.includes(key)) { handlers.playVariant(VARIANT_KEYS.indexOf(key)); return; }
      if (key === "enter") { handlers.acceptVariant(); return; }
      if (key === "a") { handlers.setSlot("A"); return; }
      if (key === "b") { handlers.setSlot("B"); return; }
      if (key === "c") { handlers.setSlot("toggle"); return; }
      if (key === "g") { handlers.toggleReferenceDrone(); return; }
      if (key === "s") { handlers.saveToCollection(); return; }
      if (key === "h") { handlers.holdNoteDown(); return; }
      if (key === "p") { handlers.panic(); return; }
    }

    function onKeyUp(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (e.key.toLowerCase() === "h") handlers.holdNoteUp();
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
