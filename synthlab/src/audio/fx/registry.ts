import type { FxModuleId } from "./types";

export type FxModuleCategory = "dynamics" | "modulation" | "time" | "space" | "utility";

export interface FxModuleDefinition {
  id: FxModuleId;
  title: string;
  category: FxModuleCategory;
  /** Stable position used when converting legacy presets to a V2 rack. */
  defaultOrder: number;
  /** Legacy key is intentionally explicit so future IDs can diverge safely. */
  legacyKey: FxModuleId;
}

/** Central metadata registry for the rack UI, preset browser and audio graph. */
export const FX_MODULES: readonly FxModuleDefinition[] = [
  { id: "drive", title: "Drive", category: "dynamics", defaultOrder: 10, legacyKey: "drive" },
  { id: "postFilter", title: "Filter", category: "utility", defaultOrder: 20, legacyKey: "postFilter" },
  { id: "ensemble", title: "Ensemble", category: "modulation", defaultOrder: 30, legacyKey: "ensemble" },
  { id: "delay", title: "Delay", category: "time", defaultOrder: 40, legacyKey: "delay" },
  { id: "reverb", title: "Reverb", category: "space", defaultOrder: 50, legacyKey: "reverb" },
  { id: "cloudSeed", title: "CloudSeed", category: "space", defaultOrder: 60, legacyKey: "cloudSeed" },
  { id: "width", title: "Width", category: "utility", defaultOrder: 70, legacyKey: "width" },
];

const FX_MODULE_BY_ID = new Map(FX_MODULES.map((module) => [module.id, module]));

export function getFxModuleDefinition(id: string): FxModuleDefinition | undefined {
  return FX_MODULE_BY_ID.get(id as FxModuleId);
}

