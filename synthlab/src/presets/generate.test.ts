import { describe, it, expect } from "vitest";
import { generateFullBank } from "./generate";
import { PresetSchema } from "./schema";
import { ENGINES } from "../audio/engines/registry";
import { ARCHETYPES } from "./archetypes";

describe("generateFullBank", () => {
  it("erzeugt mehr als 1000 Presets (exakt 3356 Presets)", () => {
    const bank = generateFullBank();
    expect(bank.length).toBeGreaterThan(1000);
    // 9 Engines ausgeschlossen von der Archetyp-Matrix (sid-chip + wt-akwf +
    // opl3 + dx7 + 5x fm-*, siehe generate.ts). 300 SID- + 250 FM- + 128
    // Juno-106- + 261 AKWF- + 175 OPL3- + 1024 DX7-Presets kommen zusätzlich
    // als kuratierte/importierte Bänke hinzu (siehe sidPresets.ts,
    // fmPresets.ts, junoPresets.ts, wtAkwfPresets.ts, opl3Presets.ts, dx7Presets.ts).
    expect(bank.length).toBe((ENGINES.length - 9) * ARCHETYPES.length * 3 + 300 + 250 + 128 + 261 + 175 + 1024);
    expect(bank.length).toBe(3356);
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
