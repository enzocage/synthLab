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

import { SID_PRESETS } from "./sidPresets";
import { FM_PRESETS } from "./fmPresets";
import { JUNO106_PRESETS } from "./junoPresets";
import { WT_AKWF_PRESETS } from "./wtAkwfPresets";
import { OPL3_PRESETS } from "./opl3Presets";
import { DX7_PRESETS } from "./dx7Presets";

const VARIANTS_PER_COMBO = 3; // variant 0 = Kernpreset (kein Jitter), 1..N = Seed-Variation

let bankCache: Preset[] | null = null;
let bankIndex: Map<string, Preset> | null = null;

function jitterMacros(base: MacroValues, spread: number, rng: () => number): MacroValues {
  const out = { ...base };
  for (const key of Object.keys(out) as (keyof MacroValues)[]) {
    const delta = randRange(rng, -spread, spread) * 0.85;
    out[key] = Math.min(1, Math.max(0, out[key] + delta));
  }
  return out;
}

function buildFxForArchetype(): ReturnType<typeof defaultFxChainSettings> {
  return defaultFxChainSettings();
}

function presetName(engineName: string, archetypeName: string, variant: number): string {
  return variant === 0 ? `${archetypeName} (${engineName})` : `${archetypeName} (${engineName}) v${variant}`;
}

export function generateFullBank(): Preset[] {
  if (bankCache) return bankCache;

  const presets: Preset[] = [];

  for (const engine of ENGINES) {
    if (engine.id === "sid-chip" || engine.id === "wt-akwf" || engine.id === "opl3" || engine.id === "dx7" || engine.id.startsWith("fm-") && engine.id !== "fm6") continue; // Exclude SID, AKWF-Wavetable, OPL3, DX7 (eigene kuratierte Bank) & custom FM engines from auto-archetype generation
    for (const archetype of ARCHETYPES) {
      for (let variant = 0; variant < VARIANTS_PER_COMBO; variant++) {
        const seed = variant; // Kernseed = 0..N-1, deterministisch pro Variante
        const rng = createRng(engine.id, archetype.id, seed, variant);
        const macros = variant === 0 ? archetype.macros : jitterMacros(archetype.macros, archetype.spread, rng);
        const params = applyMacros(engine, macros);
        const fx = buildFxForArchetype();

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

  presets.push(...SID_PRESETS);
  presets.push(...FM_PRESETS);
  presets.push(...JUNO106_PRESETS);
  presets.push(...WT_AKWF_PRESETS);
  presets.push(...OPL3_PRESETS);
  presets.push(...DX7_PRESETS);

  const index = new Map<string, Preset>();
  for (const preset of presets) {
    if (index.has(preset.id)) throw new Error(`Doppelte Preset-ID: ${preset.id}`);
    index.set(preset.id, preset);
  }

  bankCache = presets;
  bankIndex = index;
  return presets;
}

/** Rekonstruiert ein einzelnes Preset exakt aus seinen Koordinaten (Determinismus-Garantie). */
export function generatePresetById(id: string): Preset | null {
  generateFullBank();
  return bankIndex?.get(id) ?? null;
}
