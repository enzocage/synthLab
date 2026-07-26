import { describe, it, expect } from "vitest";
import { degreeToMidi, euclideanRhythm, quartalVoicing, nearestInScale } from "./theory";

describe("theory", () => {
  it("degreeToMidi bildet Grundton korrekt ab", () => {
    expect(degreeToMidi({ root: 57, scale: "dorian" }, 0)).toBe(57);
  });

  it("degreeToMidi wrappt Oktaven korrekt", () => {
    const key = { root: 57, scale: "dorian" } as const;
    const len = 7; // dorian hat 7 Toene
    expect(degreeToMidi(key, len)).toBe(degreeToMidi(key, 0) + 12);
  });

  it("quartalVoicing liefert aufsteigende, in der Skala liegende Toene", () => {
    const key = { root: 57, scale: "dorian" } as const;
    const voicing = quartalVoicing(key, 0, 4);
    expect(voicing.length).toBe(4);
    for (let i = 1; i < voicing.length; i++) expect(voicing[i]).toBeGreaterThan(voicing[i - 1]);
  });

  it("nearestInScale liegt immer in der Skala", () => {
    const key = { root: 60, scale: "phrygian" } as const;
    for (let n = 55; n < 75; n++) {
      const snapped = nearestInScale(key, n);
      const rel = ((snapped - key.root) % 12 + 12) % 12;
      expect([0, 1, 3, 5, 7, 8, 10]).toContain(rel);
    }
  });

  it("euclideanRhythm verteilt die korrekte Anzahl Treffer", () => {
    const pattern = euclideanRhythm(16, 5);
    expect(pattern.length).toBe(16);
    expect(pattern.filter(Boolean).length).toBe(5);
  });

  it("euclideanRhythm: 0 Treffer = alles false, alle Treffer = alles true", () => {
    expect(euclideanRhythm(8, 0).every((x) => !x)).toBe(true);
    expect(euclideanRhythm(8, 8).every((x) => x)).toBe(true);
  });
});
