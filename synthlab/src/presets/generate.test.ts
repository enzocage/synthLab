import { describe, it, expect } from "vitest";
import { generateFullBank } from "./generate";
import { PresetSchema } from "./schema";
import { ENGINES } from "../audio/engines/registry";
import { ARCHETYPES } from "./archetypes";

describe("generateFullBank", () => {
  it("erzeugt mehr als 1000 Presets", () => {
    const bank = generateFullBank();
    expect(bank.length).toBeGreaterThan(1000);
    expect(bank.length).toBe(ENGINES.length * ARCHETYPES.length * 3);
  });

  it("jedes Preset validiert gegen das Zod-Schema", () => {
    const bank = generateFullBank();
    for (const p of bank) {
      expect(() => PresetSchema.parse(p)).not.toThrow();
    }
  });

  it("ist deterministisch: zweimaliges Generieren liefert identische Presets", () => {
    const a = generateFullBank();
    const b = generateFullBank();
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i++) {
      expect(a[i]).toEqual(b[i]);
    }
  });

  it("hat eindeutige IDs", () => {
    const bank = generateFullBank();
    const ids = new Set(bank.map((p) => p.id));
    expect(ids.size).toBe(bank.length);
  });

  it("jedes Preset hat mindestens eine Rolle und gueltige FX-Settings", () => {
    const bank = generateFullBank();
    for (const p of bank) {
      expect(p.roles.length).toBeGreaterThan(0);
      expect(p.fx.reverb.mix).toBeGreaterThanOrEqual(0);
      expect(p.fx.reverb.mix).toBeLessThanOrEqual(1);
    }
  });
});
