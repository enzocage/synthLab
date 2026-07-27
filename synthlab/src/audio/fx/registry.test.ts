import { describe, expect, it } from "vitest";
import { FX_MODULES, getFxModuleDefinition } from "./registry";

describe("FX module registry", () => {
  it("contains unique stable IDs and legacy keys", () => {
    expect(new Set(FX_MODULES.map((module) => module.id)).size).toBe(FX_MODULES.length);
    expect(new Set(FX_MODULES.map((module) => module.legacyKey)).size).toBe(FX_MODULES.length);
  });

  it("resolves known modules and rejects unknown modules", () => {
    expect(getFxModuleDefinition("delay")?.title).toBe("Delay");
    expect(getFxModuleDefinition("futureModule")).toBeUndefined();
  });
});
