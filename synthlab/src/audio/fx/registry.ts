import type { FxModuleId, FxParamValue } from "./types";

export type FxModuleCategory = "dynamics" | "modulation" | "time" | "space" | "utility";

export type FxParamKind = "number" | "enum" | "boolean";
export type FxCurve = "linear" | "logarithmic" | "stepped";

export interface FxParamSpec {
  id: string;
  label: string;
  kind: FxParamKind;
  defaultValue: FxParamValue;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  curve?: FxCurve;
  options?: readonly string[];
}

export interface FxModuleDefinition {
  id: FxModuleId;
  title: string;
  category: FxModuleCategory;
  /** Stable position used when converting legacy presets to a V2 rack. */
  defaultOrder: number;
  /** Legacy key is intentionally explicit so future IDs can diverge safely. */
  legacyKey: FxModuleId;
  params: readonly FxParamSpec[];
}

const n = (id: string, label: string, defaultValue: number, min: number, max: number, unit?: string, curve: FxCurve = "linear"): FxParamSpec => ({ id, label, kind: "number", defaultValue, min, max, step: (max - min) / 100, unit, curve });
const e = (id: string, label: string, defaultValue: string, options: readonly string[]): FxParamSpec => ({ id, label, kind: "enum", defaultValue, options });
const b = (id: string, label: string, defaultValue = false): FxParamSpec => ({ id, label, kind: "boolean", defaultValue });

/** Central metadata registry for the rack UI, preset browser and audio graph. */
export const FX_MODULES: readonly FxModuleDefinition[] = [
  { id: "drive", title: "Drive", category: "dynamics", defaultOrder: 10, legacyKey: "drive", params: [b("enabled", "Power"), n("amount", "Amount", 0.2, 0, 1), n("mix", "Mix", 1, 0, 1)] },
  { id: "postFilter", title: "Filter", category: "utility", defaultOrder: 20, legacyKey: "postFilter", params: [b("enabled", "Power"), e("type", "Type", "lowpass", ["lowpass", "highpass", "bandpass"]), n("cutoffHz", "Cutoff", 12000, 20, 20000, "Hz", "logarithmic"), n("q", "Q", 0.7, 0.1, 10)] },
  { id: "ensemble", title: "Ensemble", category: "modulation", defaultOrder: 30, legacyKey: "ensemble", params: [b("enabled", "Power"), n("amount", "Amount", 0.3, 0, 1), n("rateHz", "Rate", 0.3, 0.05, 5, "Hz", "logarithmic"), n("depthMs", "Depth", 4, 0, 20, "ms")] },
  { id: "delay", title: "Delay", category: "time", defaultOrder: 40, legacyKey: "delay", params: [b("enabled", "Power"), e("mode", "Mode", "pingpong", ["tape", "pingpong"]), n("timeSeconds", "Time", 0.5, 0.05, 2, "s"), n("feedback", "Feedback", 0.3, 0, 0.95), n("mix", "Mix", 0.25, 0, 1), n("tone", "Tone", 0.5, 0, 1), n("wowFlutterDepth", "Wow/Flutter", 0.1, 0, 1)] },
  { id: "reverb", title: "Reverb", category: "space", defaultOrder: 50, legacyKey: "reverb", params: [b("enabled", "Power"), n("roomSize", "Room", 0.5, 0, 1), n("damping", "Damping", 0.5, 0, 1), n("preDelayMs", "Pre-delay", 0, 0, 250, "ms"), n("mix", "Mix", 0.3, 0, 1), n("width", "Width", 1, 0, 1), n("inputLowCutHz", "Low Cut", 80, 20, 2000, "Hz", "logarithmic"), n("outputHighCutHz", "High Cut", 10000, 1000, 18000, "Hz", "logarithmic"), b("freeze", "Freeze")] },
  { id: "cloudSeed", title: "CloudSeed", category: "space", defaultOrder: 60, legacyKey: "cloudSeed", params: [b("enabled", "Power"), n("preDelay", "Pre-delay", 0, 0, 1), n("highPass", "High-pass", 0, 0, 1), n("lowPass", "Low-pass", 0.8, 0, 1), n("tapCount", "Tap count", 0.4, 0, 1), n("tapLength", "Tap length", 0.3, 0, 1), n("tapDecay", "Tap decay", 0.8, 0, 1), n("diffusionDelay", "Diffusion delay", 0.4, 0, 1), n("diffusionFeedback", "Diffusion feedback", 0.6, 0, 1), n("lineCount", "Line count", 0.7, 0, 1), n("lineDelay", "Line delay", 0.4, 0, 1), n("lineDecay", "Line decay", 0.5, 0, 1), n("lateDiffusionDelay", "Late delay", 0.4, 0, 1), n("lateDiffusionFeedback", "Late feedback", 0.5, 0, 1), n("lineModAmount", "Mod amount", 0.3, 0, 1), n("lineModRate", "Mod rate", 0.3, 0, 1), n("postCutoffFrequency", "Cutoff", 0.8, 0, 1), n("crossSeed", "Cross-seed", 0.5, 0, 1), n("dryOut", "Dry", 1, 0, 1), n("earlyOut", "Early", 0.7, 0, 1), n("mainOut", "Main", 0.7, 0, 1)] },
  { id: "width", title: "Width", category: "utility", defaultOrder: 70, legacyKey: "width", params: [b("enabled", "Power"), n("amount", "Width", 1.2, 0, 2)] },
];

const FX_MODULE_BY_ID = new Map(FX_MODULES.map((module) => [module.id, module]));

export function getFxModuleDefinition(id: string): FxModuleDefinition | undefined {
  return FX_MODULE_BY_ID.get(id as FxModuleId);
}
