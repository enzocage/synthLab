import { describe, expect, it } from "vitest";
import { FX_MODULES, getFxModuleDefinition } from "./registry";

describe("FX module registry", () => {
  it("contains unique stable IDs and legacy keys", () => {
    expect(new Set(FX_MODULES.map((module) => module.id)).size).toBe(FX_MODULES.length);
    expect(new Set(FX_MODULES.map((module) => module.legacyKey)).size).toBe(FX_MODULES.length);
    expect(FX_MODULES.every((module) => module.params.length > 0)).toBe(true);
    for (const module of FX_MODULES) {
      expect(new Set(module.params.map((param) => param.id)).size).toBe(module.params.length);
      for (const param of module.params) {
        if (param.kind === "number") {
          expect(param.min).toBeLessThanOrEqual(param.defaultValue as number);
          expect(param.defaultValue as number).toBeLessThanOrEqual(param.max as number);
        }
      }
    }
  });

  it("resolves known modules and rejects unknown modules", () => {
    expect(getFxModuleDefinition("delay")?.title).toBe("Delay");
    expect(getFxModuleDefinition("futureModule")).toBeUndefined();
  });
});
