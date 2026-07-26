// Preset-Generator: drei Erzeugungsstufen (PLAN.md Phase 5).
//  1. Kernpreset  = Archetyp-Makros direkt angewendet, kein Jitter (variant 0)
//  2. Archetyp-Matrix = jeder Archetyp über jede passende Engine
//  3. Seed-Variation = deterministischer Jitter der Makros pro (engine, archetyp, seed)
import type { MacroValues } from "../audio/core/types";
import { ENGINES } from "../audio/engines/registry";
import { ARCHETYPES } from "./archetypes";
import { applyMacros } from "./macros";
import { createRng, randRange } from "./rng";
import { defaultFxChainSettings } from "../audio/fx/types";
import type { Preset } from "./schema";

const VARIANTS_PER_COMBO = 3; // variant 0 = Kernpreset (kein Jitter), 1..N = Seed-Variation

function jitterMacros(base: MacroValues, spread: number, rng: () => number): MacroValues {
  const out = { ...base };
  for (const key of Object.keys(out) as (keyof MacroValues)[]) {
    const delta = randRange(rng, -spread, spread) * 0.5;
    out[key] = Math.min(1, Math.max(0, out[key] + delta));
  }
  return out;
}

function buildFxForArchetype(macros: MacroValues, rng: () => number): ReturnType<typeof defaultFxChainSettings> {
  const fx = defaultFxChainSettings();
  fx.reverb.mix = Math.min(0.9, 0.15 + macros.space * 0.6 + randRange(rng, -0.05, 0.05));
  fx.reverb.decaySeconds = 2 + macros.space * 18;
  fx.reverb.mode = macros.air > 0.7 && macros.space > 0.6 ? "shimmer" : "fdn";
  fx.delay.mode = macros.motion > 0.4 ? "pingpong" : "off";
  fx.delay.mix = macros.motion * 0.3;
  fx.delay.feedback = 0.2 + macros.motion * 0.3;
  fx.ensemble.amount = macros.detune * 0.6 + randRange(rng, 0, 0.15);
  fx.drive.amount = macros.drive * 0.5;
  fx.width.amount = 0.9 + macros.space * 0.5;
  return fx;
}

function presetName(engineName: string, archetypeName: string, variant: number): string {
  return variant === 0 ? `${archetypeName} (${engineName})` : `${archetypeName} (${engineName}) v${variant}`;
}

export function generateFullBank(): Preset[] {
  const presets: Preset[] = [];

  for (const engine of ENGINES) {
    for (const archetype of ARCHETYPES) {
      for (let variant = 0; variant < VARIANTS_PER_COMBO; variant++) {
        const seed = variant; // Kernseed = 0..N-1, deterministisch pro Variante
        const rng = createRng(engine.id, archetype.id, seed, variant);
        const macros = variant === 0 ? archetype.macros : jitterMacros(archetype.macros, archetype.spread, rng);
        const params = applyMacros(engine, macros);
        const fx = buildFxForArchetype(macros, rng);

        const id = `${engine.id}__${archetype.id}__${seed}`;
        presets.push({
          id,
          name: presetName(engine.name, archetype.name, variant),
          engine: engine.id,
          archetype: archetype.id,
          seed,
          variant,
          roles: archetype.roles,
          tags: archetype.tags,
          params,
          macros,
          fx,
          provenance: {
            source: "synthlab-generator",
            license: "MIT (eigenes Projekt, keine Fremdpresets)",
            derivedFrom: archetype.id,
          },
          rating: 0,
          favorite: false,
          notes: "",
          createdAt: 0,
        });
      }
    }
  }

  return presets;
}

/** Rekonstruiert ein einzelnes Preset exakt aus seinen Koordinaten (Determinismus-Garantie). */
export function generatePresetById(id: string): Preset | null {
  const all = generateFullBank();
  return all.find((p) => p.id === id) ?? null;
}
