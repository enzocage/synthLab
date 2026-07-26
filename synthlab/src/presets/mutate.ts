// mutate(preset, amount, seed): erzeugt eine Variante mit gewichteter Streuung
// (klangprägende Parameter staerker, kosmetische schwaecher) - PLAN.md Phase 5,
// Basis fuer das Variationsraster in Phase 7.
import { getEngine } from "../audio/engines/registry";
import { createRng, randRange } from "./rng";
import type { Preset } from "./schema";
import type { ParamValue } from "../audio/core/types";

export function mutate(preset: Preset, amount: number, seed: number): Preset {
  const engine = getEngine(preset.engine);
  const rng = createRng(preset.engine, preset.archetype, seed, 1000 + seed);
  const newParams: Record<string, ParamValue> = { ...preset.params };

  for (const spec of engine.params) {
    const weight = spec.mutationWeight ?? 0.5;
    const strength = amount * weight;
    if (strength <= 0) continue;

    if (spec.kind === "float" || spec.kind === "int") {
      const range = spec.max - spec.min;
      const current = Number(newParams[spec.id] ?? spec.default);
      const delta = randRange(rng, -1, 1) * strength * range * 0.35;
      let next = current + delta;
      next = Math.min(spec.max, Math.max(spec.min, next));
      newParams[spec.id] = spec.kind === "int" ? Math.round(next) : next;
    } else if (spec.kind === "bool") {
      if (rng() < strength * 0.3) newParams[spec.id] = !newParams[spec.id];
    } else if (spec.kind === "enum") {
      if (rng() < strength * 0.5) {
        const idx = Math.floor(rng() * spec.options.length);
        newParams[spec.id] = spec.options[idx];
      }
    }
  }

  const id = `${preset.id}__mut${seed}`;
  return {
    ...preset,
    id,
    name: `${preset.name} (mut ${seed})`,
    params: newParams,
    provenance: { ...preset.provenance, derivedFrom: preset.id },
    rating: 0,
    favorite: false,
    notes: "",
  };
}

/** Erzeugt N Mutationsvarianten für das Variationsraster (Phase 7: Taste M). */
export function mutateN(preset: Preset, amount: number, count: number, baseSeed: number): Preset[] {
  return Array.from({ length: count }, (_, i) => mutate(preset, amount, baseSeed + i));
}
