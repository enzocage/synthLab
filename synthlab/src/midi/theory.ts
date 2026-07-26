// Musiktheorie-Bausteine für den Phrasengenerator (PLAN.md Phase 6): Modi,
// Pentatonik, quartale Voicings, Just Intonation. Kompositionswissen aus
// research/derived/ambient-rules.json §compositionRules (modale Harmonik,
// offene Quart-/Quintschichtungen statt Terzstapel).

export type ScaleName = "dorian" | "aeolian" | "lydian" | "phrygian" | "majorPentatonic" | "minorPentatonic" | "wholeTone";

export const SCALES: Record<ScaleName, number[]> = {
  dorian: [0, 2, 3, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  majorPentatonic: [0, 2, 4, 7, 9],
  minorPentatonic: [0, 3, 5, 7, 10],
  wholeTone: [0, 2, 4, 6, 8, 10],
};

/** Reine Frequenzverhaeltnisse (Just Intonation) statt 12-TET, fuer Drones/Pads. */
export const JUST_INTONATION_RATIOS: Record<string, number> = {
  unison: 1,
  minorThird: 6 / 5,
  majorThird: 5 / 4,
  fourth: 4 / 3,
  fifth: 3 / 2,
  minorSixth: 8 / 5,
  majorSixth: 5 / 3,
  minorSeventh: 7 / 4, // harmonische Septime
  octave: 2,
};

export interface KeyContext {
  root: number; // MIDI-Grundton (z.B. 57 = A3)
  scale: ScaleName;
}

/** Bildet eine Skalenstufe (kann > Skalenlaenge sein, wraps mit Oktavverschiebung) auf einen MIDI-Ton ab. */
export function degreeToMidi(key: KeyContext, degree: number): number {
  const scale = SCALES[key.scale];
  const len = scale.length;
  const octave = Math.floor(degree / len);
  const idx = ((degree % len) + len) % len;
  return key.root + octave * 12 + scale[idx];
}

/** Naechster erlaubter Ton in der Skala zu einem gegebenen MIDI-Ton (fuer Snap-to-Scale). */
export function nearestInScale(key: KeyContext, midiNote: number): number {
  const scale = SCALES[key.scale];
  const relative = ((midiNote - key.root) % 12 + 12) % 12;
  let best = scale[0];
  let bestDist = 12;
  for (const s of scale) {
    const dist = Math.min(Math.abs(s - relative), 12 - Math.abs(s - relative));
    if (dist < bestDist) { bestDist = dist; best = s; }
  }
  const octaveBase = midiNote - relative;
  return octaveBase + best;
}

/**
 * Quartale Voicing: stapelt `count` Skalenstufen im Quart-Abstand (Stufenindex +3)
 * statt Terzen (research/derived/ambient-rules.json: open_voicings).
 */
export function quartalVoicing(key: KeyContext, startDegree: number, count: number): number[] {
  const notes: number[] = [];
  for (let i = 0; i < count; i++) {
    notes.push(degreeToMidi(key, startDegree + i * 3));
  }
  return notes;
}

/** Euklidischer Rhythmus: verteilt `hits` Ereignisse moeglichst gleichmaessig ueber `steps` Schritte. */
export function euclideanRhythm(steps: number, hits: number, rotation = 0): boolean[] {
  if (hits <= 0) return new Array(steps).fill(false);
  if (hits >= steps) return new Array(steps).fill(true);

  const pattern: boolean[] = [];
  let bucket = 0;
  for (let i = 0; i < steps; i++) {
    bucket += hits;
    if (bucket >= steps) {
      bucket -= steps;
      pattern.push(true);
    } else {
      pattern.push(false);
    }
  }
  if (rotation === 0) return pattern;
  const r = ((rotation % steps) + steps) % steps;
  return [...pattern.slice(r), ...pattern.slice(0, r)];
}
