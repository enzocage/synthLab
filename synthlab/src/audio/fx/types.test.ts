import { describe, expect, it } from "vitest";
import { defaultFxChainSettings, fxRackFromLegacy, legacyFxFromRack } from "./types";

describe("versioned FX rack compatibility", () => {
  it("maps every legacy module to an ordered V2 slot", () => {
    const rack = fxRackFromLegacy(defaultFxChainSettings());

    expect(rack.version).toBe(2);
    expect(rack.slots.map((slot) => slot.type)).toEqual([
      "drive",
      "postFilter",
      "ensemble",
      "delay",
      "reverb",
      "cloudSeed",
      "width",
    ]);
    expect(rack.slots.every((slot) => slot.id.length > 0)).toBe(true);
  });

  it("round-trips the legacy representation without loss", () => {
    const legacy = defaultFxChainSettings();
    const rack = fxRackFromLegacy(legacy);

    expect(legacyFxFromRack(rack, defaultFxChainSettings())).toEqual(legacy);
  });

  it("preserves unknown modules in `extras` instead of silently dropping them (plan10 §5.2)", () => {
    const fallback = defaultFxChainSettings();
    const rack = fxRackFromLegacy(fallback);
    rack.slots.push({ id: "future-1", type: "spectralFreeze", enabled: true, params: { amount: 0.8 } });

    const projected = legacyFxFromRack(rack, fallback);
    // Alle 7 benannten Legacy-Module bleiben unveraendert...
    expect(projected.drive).toEqual(fallback.drive);
    expect(projected.width).toEqual(fallback.width);
    // ...aber das unbekannte Modul landet in extras statt zu verschwinden.
    expect(projected.extras.spectralFreeze).toEqual({ enabled: true, amount: 0.8 });
  });

  it("round-trips a previously unknown module back into an ordered V2 slot", () => {
    const withExtra = defaultFxChainSettings();
    withExtra.extras.spectralFreeze = { enabled: true, amount: 0.8 };

    const rack = fxRackFromLegacy(withExtra);
    const extraSlot = rack.slots.find((slot) => slot.type === "spectralFreeze");
    expect(extraSlot).toEqual({ id: "spectralFreeze-1", type: "spectralFreeze", enabled: true, params: { amount: 0.8 } });
  });

  it("applies known slot edits while retaining untouched parameters", () => {
    const fallback = defaultFxChainSettings();
    const rack = fxRackFromLegacy(fallback);
    rack.slots[0] = { ...rack.slots[0], enabled: true, params: { amount: 0.9 } };

    const projected = legacyFxFromRack(rack, fallback);
    expect(projected.drive).toEqual({ enabled: true, amount: 0.9 });
    expect(projected.delay).toEqual(fallback.delay);
  });
});
