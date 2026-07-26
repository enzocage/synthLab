// 8-Oktaven-Klaviatur (MIDI 12..107, C0..B7). Maus-Klick/Drag spielt Noten auf
// dem ausgewaehlten Track (durch den Arp geroutet, falls aktiv).
import { useCallback, useRef, useState } from "react";

const START_NOTE = 24; // C1
const OCTAVE_COUNT = 8;
const END_NOTE = START_NOTE + OCTAVE_COUNT * 12; // exklusiv

const BLACK_KEY_OFFSETS = new Set([1, 3, 6, 8, 10]); // relative Halbtonlage in der Oktave

interface Props {
  onNoteOn(note: number): void;
  onNoteOff(note: number): void;
}

export function PianoKeyboard({ onNoteOn, onNoteOff }: Props) {
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const pointerDown = useRef(false);
  const lastNote = useRef<number | null>(null);

  const press = useCallback(
    (note: number) => {
      if (lastNote.current === note) return;
      if (lastNote.current !== null) {
        onNoteOff(lastNote.current);
        setActiveNotes((s) => {
          const next = new Set(s);
          next.delete(lastNote.current!);
          return next;
        });
      }
      lastNote.current = note;
      onNoteOn(note);
      setActiveNotes((s) => new Set(s).add(note));
    },
    [onNoteOn, onNoteOff]
  );

  const release = useCallback(() => {
    if (lastNote.current !== null) {
      onNoteOff(lastNote.current);
      setActiveNotes((s) => {
        const next = new Set(s);
        next.delete(lastNote.current!);
        return next;
      });
      lastNote.current = null;
    }
    pointerDown.current = false;
  }, [onNoteOff]);

  const notes = Array.from({ length: END_NOTE - START_NOTE }, (_, i) => START_NOTE + i);
  const whiteNotes = notes.filter((n) => !BLACK_KEY_OFFSETS.has(n % 12));
  const whiteWidth = 100 / whiteNotes.length;

  return (
    <div
      className="piano"
      onMouseLeave={release}
      onMouseUp={release}
    >
      {whiteNotes.map((n, i) => (
        <div
          key={n}
          className={`piano__white${activeNotes.has(n) ? " piano__key--active" : ""}${n % 12 === 0 ? " piano__white--c" : ""}`}
          style={{ left: `${i * whiteWidth}%`, width: `${whiteWidth}%` }}
          onMouseDown={() => { pointerDown.current = true; press(n); }}
          onMouseEnter={() => pointerDown.current && press(n)}
        >
          {n % 12 === 0 && <span className="piano__label">C{Math.floor(n / 12) - 1}</span>}
        </div>
      ))}
      {notes
        .filter((n) => BLACK_KEY_OFFSETS.has(n % 12))
        .map((n) => {
          const whiteIndexBefore = whiteNotes.filter((w) => w < n).length;
          const left = whiteIndexBefore * whiteWidth - whiteWidth * 0.3;
          return (
            <div
              key={n}
              className={`piano__black${activeNotes.has(n) ? " piano__key--active" : ""}`}
              style={{ left: `${left}%`, width: `${whiteWidth * 0.6}%` }}
              onMouseDown={(e) => { e.stopPropagation(); pointerDown.current = true; press(n); }}
              onMouseEnter={() => pointerDown.current && press(n)}
            />
          );
        })}
    </div>
  );
}
