// Wendet die 8 einheitlichen Makros (Brightness/Motion/Density/Space/Drive/
// Detune/Body/Air) über die defaultMacroMap einer Engine auf deren tatsächliche
// Parameter an. Identisches Verhalten über alle 13 Engines hinweg (PLAN.md Phase 5).
import type { Engine, MacroValues, ParamValues } from "../audio/core/types";
import { MACRO_IDS, defaultParamValues } from "../audio/core/types";

function paramRange(engine: Engine, paramId: string): { min: number; max: number } | null {
  const spec = engine.params.find((p) => p.id === paramId);
  if (!spec || spec.kind === "enum" || spec.kind === "bool") return null;
  return { min: spec.min, max: spec.max };
}

export function applyMacros(engine: Engine, macros: MacroValues, base?: ParamValues): ParamValues {
  const params = { ...defaultParamValues(engine.params), ...(base ?? {}) };

  for (const macroId of MACRO_IDS) {
    const targets = engine.defaultMacroMap[macroId];
    if (!targets) continue;
    const value = macros[macroId];

    for (const target of targets) {
      const range = paramRange(engine, target.paramId);
      let interpolated = target.atZero + (target.atOne - target.atZero) * value;
      if (range) interpolated = Math.min(range.max, Math.max(range.min, interpolated));
      params[target.paramId] = interpolated;
    }
  }

  return params;
}
