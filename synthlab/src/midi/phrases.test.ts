import { describe, it, expect } from "vitest";
import { generatePhrase, PHRASE_ROLES } from "./phrases";

const key = { root: 57, scale: "dorian" } as const;

describe("generatePhrase", () => {
  it("erzeugt fuer jede Rolle mindestens ein Ereignis", () => {
    for (const role of PHRASE_ROLES) {
      const phrase = generatePhrase(role, { key, seed: 1 });
      expect(phrase.events.length).toBeGreaterThan(0);
      expect(phrase.lengthBeats).toBeGreaterThan(0);
    }
  });

  it("ist deterministisch fuer denselben seed", () => {
    for (const role of PHRASE_ROLES) {
      const a = generatePhrase(role, { key, seed: 42 });
      const b = generatePhrase(role, { key, seed: 42 });
      expect(a).toEqual(b);
    }
  });

  it("liefert unterschiedliche Phrasen fuer unterschiedliche seeds (bei stochastischen Rollen)", () => {
    const a = generatePhrase("melody", { key, seed: 1 });
    const b = generatePhrase("melody", { key, seed: 2 });
    expect(a).not.toEqual(b);
  });

  it("alle Notenwerte sind endliche MIDI-Zahlen im sinnvollen Bereich", () => {
    for (const role of PHRASE_ROLES) {
      const phrase = generatePhrase(role, { key, seed: 7 });
      for (const e of phrase.events) {
        expect(Number.isFinite(e.note)).toBe(true);
        expect(e.note).toBeGreaterThan(-24);
        expect(e.note).toBeLessThan(150);
        expect(e.velocity).toBeGreaterThan(0);
        expect(e.velocity).toBeLessThanOrEqual(1);
        expect(e.durationBeats).toBeGreaterThan(0);
      }
    }
  });

  it("drone-Phrasen markieren ihre Ereignisse als hold", () => {
    const phrase = generatePhrase("drone", { key, seed: 3 });
    expect(phrase.events.every((e) => e.hold)).toBe(true);
  });
});
