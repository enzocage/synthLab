import { describe, it, expect } from "vitest";
import { SID_PRESETS } from "./sidPresets";

describe("SID Lab 300 Presets Bank", () => {
  it("contains exactly 300 presets", () => {
    expect(SID_PRESETS.length).toBe(300);
  });

  it("contains exactly 60 presets per technique lens", () => {
    const counts: Record<string, number> = {};
    for (const p of SID_PRESETS) {
      const lensTag = p.tags.find((t) => t.includes("-era") || t === "sid lab");
      if (lensTag) {
        counts[lensTag] = (counts[lensTag] || 0) + 1;
      }
    }
    expect(Object.keys(counts).length).toBe(5);
    for (const lens of Object.keys(counts)) {
      expect(counts[lens]).toBe(60);
    }
  });

  it("has valid unique IDs and valid SID parameters", () => {
    const ids = new Set<string>();
    for (const p of SID_PRESETS) {
      expect(ids.has(p.id)).toBe(false);
      ids.add(p.id);

      expect(p.engine).toBe("sid-chip");
      expect(p.params.waveform).toBeDefined();
      expect(p.params.attack).toBeGreaterThan(0);
      expect(p.params.release).toBeGreaterThan(0);
    }
  });
});
