import { describe, it, expect } from "vitest";
import { generateFullBank } from "./generate";
import { mutate, mutateN } from "./mutate";
import { PresetSchema } from "./schema";
import { getEngine } from "../audio/engines/registry";

describe("mutate", () => {
  it("bleibt innerhalb der Parametergrenzen der Engine", () => {
    const bank = generateFullBank();
    const preset = bank[42];
    const engine = getEngine(preset.engine);
    const mutated = mutate(preset, 1, 7);
    for (const spec of engine.params) {
      if (spec.kind === "float" || spec.kind === "int") {
        const v = Number(mutated.params[spec.id]);
        expect(v).toBeGreaterThanOrEqual(spec.min);
        expect(v).toBeLessThanOrEqual(spec.max);
      }
    }
    expect(() => PresetSchema.parse(mutated)).not.toThrow();
  });

  it("ist deterministisch fuer denselben seed", () => {
    const bank = generateFullBank();
    const preset = bank[10];
    const a = mutate(preset, 0.5, 3);
    const b = mutate(preset, 0.5, 3);
    expect(a.params).toEqual(b.params);
  });

  it("liefert unterschiedliche Varianten fuer unterschiedliche seeds", () => {
    const bank = generateFullBank();
    const preset = bank[5];
    const variants = mutateN(preset, 0.6, 8, 0);
    const serialized = variants.map((v) => JSON.stringify(v.params));
    expect(new Set(serialized).size).toBeGreaterThan(1);
  });

  it("amount=0 aendert Parameter nicht", () => {
    const bank = generateFullBank();
    const preset = bank[0];
    const mutated = mutate(preset, 0, 1);
    expect(mutated.params).toEqual(preset.params);
  });
});
