import type { FxModuleId, FxParamValue } from "./types";
import { Drive } from "./Drive";
import { PostFilter } from "./PostFilter";
import { Ensemble } from "./Ensemble";
import { TapeDelay } from "./TapeDelay";
import { Reverb } from "./Reverb";
import { CloudSeed } from "./CloudSeed";
import { Width } from "./Width";
import { WorkletFx, createFxWorkletNode } from "../worklets/WorkletFx";
import { Phaser } from "./Phaser";

export type FxModuleCategory = "dynamics" | "modulation" | "time" | "space" | "utility" | "texture" | "resonance" | "saturation" | "filter" | "lofi";

/** Gemeinsame Laufzeit-Schnittstelle aller FX-Module (plan10 §5.1) - exakt die
 * Form, die die 7 Bestandsmodule (Drive/PostFilter/Ensemble/TapeDelay/Reverb/
 * CloudSeed/Width) bereits jeweils für sich implementieren. `FxChain.ts`
 * kennt nur noch diese Schnittstelle, keine konkreten Klassen mehr. */
export interface FxNode {
  readonly input: AudioNode;
  readonly output: AudioNode;
  update(settings: Record<string, FxParamValue>): void;
  start?(time: number): void;
  setFreeze?(freeze: boolean): void;
  dispose(): void;
}

export type FxFactory = (ctx: BaseAudioContext, settings: Record<string, FxParamValue>) => FxNode;

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
  id: FxModuleId | string;
  title: string;
  category: FxModuleCategory;
  /** Stable position used when converting legacy presets to a V2 rack. */
  defaultOrder: number;
  /** Legacy key is intentionally explicit so future IDs can diverge safely. */
  legacyKey: FxModuleId | string;
  params: readonly FxParamSpec[];
  /** Baut die Laufzeit-Instanz dieses Moduls (plan10 §5.1). Fehlt für ein
   * Modul dieses Feld, wird der Slot beim Verkabeln der FxChain übersprungen
   * (z.B. Module, die erst als Metadaten aber noch nicht als Audio existieren). */
  create?: FxFactory;
}

const n = (id: string, label: string, defaultValue: number, min: number, max: number, unit?: string, curve: FxCurve = "linear"): FxParamSpec => ({ id, label, kind: "number", defaultValue, min, max, step: (max - min) / 100, unit, curve });
const e = (id: string, label: string, defaultValue: string, options: readonly string[]): FxParamSpec => ({ id, label, kind: "enum", defaultValue, options });
const b = (id: string, label: string, defaultValue = false): FxParamSpec => ({ id, label, kind: "boolean", defaultValue });

// Jede Factory reicht {enabled, ...params} unveraendert an den bestehenden
// Modul-Konstruktor durch - exakt dieselbe Form, die legacyFxFromRack() schon
// heute pro Slot zusammenbaut (siehe types.ts).
const asAny = (settings: Record<string, FxParamValue>) => settings as never;

/** Central metadata registry for the rack UI, preset browser and audio graph. */
export const FX_MODULES: readonly FxModuleDefinition[] = [
  { id: "drive", title: "Drive", category: "dynamics", defaultOrder: 10, legacyKey: "drive", params: [b("enabled", "Power"), n("amount", "Amount", 0.2, 0, 1), n("mix", "Mix", 1, 0, 1)], create: (ctx, s) => new Drive(ctx, asAny(s)) as unknown as FxNode },
  { id: "postFilter", title: "Filter", category: "utility", defaultOrder: 20, legacyKey: "postFilter", params: [b("enabled", "Power"), e("type", "Type", "lowpass", ["lowpass", "highpass", "bandpass"]), n("cutoffHz", "Cutoff", 12000, 20, 20000, "Hz", "logarithmic"), n("q", "Q", 0.7, 0.1, 10)], create: (ctx, s) => new PostFilter(ctx, asAny(s)) as unknown as FxNode },
  { id: "ensemble", title: "Ensemble", category: "modulation", defaultOrder: 30, legacyKey: "ensemble", params: [b("enabled", "Power"), n("amount", "Amount", 0.3, 0, 1), n("rateHz", "Rate", 0.3, 0.05, 5, "Hz", "logarithmic"), n("depthMs", "Depth", 4, 0, 20, "ms")], create: (ctx, s) => new Ensemble(ctx, asAny(s)) as unknown as FxNode },
  { id: "delay", title: "Delay", category: "time", defaultOrder: 40, legacyKey: "delay", params: [b("enabled", "Power"), e("mode", "Mode", "pingpong", ["tape", "pingpong"]), n("timeSeconds", "Time", 0.5, 0.05, 2, "s"), n("feedback", "Feedback", 0.3, 0, 0.95), n("mix", "Mix", 0.25, 0, 1), n("tone", "Tone", 0.5, 0, 1), n("wowFlutterDepth", "Wow/Flutter", 0.1, 0, 1)], create: (ctx, s) => new TapeDelay(ctx, asAny(s)) as unknown as FxNode },
  { id: "reverb", title: "Reverb", category: "space", defaultOrder: 50, legacyKey: "reverb", params: [b("enabled", "Power"), n("roomSize", "Room", 0.5, 0, 1), n("damping", "Damping", 0.5, 0, 1), n("preDelayMs", "Pre-delay", 0, 0, 250, "ms"), n("mix", "Mix", 0.3, 0, 1), n("width", "Width", 1, 0, 1), n("inputLowCutHz", "Low Cut", 80, 20, 2000, "Hz", "logarithmic"), n("outputHighCutHz", "High Cut", 10000, 1000, 18000, "Hz", "logarithmic"), b("freeze", "Freeze")], create: (ctx, s) => new Reverb(ctx, asAny(s)) as unknown as FxNode },
  { id: "cloudSeed", title: "CloudSeed", category: "space", defaultOrder: 60, legacyKey: "cloudSeed", params: [b("enabled", "Power"), n("preDelay", "Pre-delay", 0, 0, 1), n("highPass", "High-pass", 0, 0, 1), n("lowPass", "Low-pass", 0.8, 0, 1), n("tapCount", "Tap count", 0.4, 0, 1), n("tapLength", "Tap length", 0.3, 0, 1), n("tapDecay", "Tap decay", 0.8, 0, 1), n("diffusionDelay", "Diffusion delay", 0.4, 0, 1), n("diffusionFeedback", "Diffusion feedback", 0.6, 0, 1), n("lineCount", "Line count", 0.7, 0, 1), n("lineDelay", "Line delay", 0.4, 0, 1), n("lineDecay", "Line decay", 0.5, 0, 1), n("lateDiffusionDelay", "Late delay", 0.4, 0, 1), n("lateDiffusionFeedback", "Late feedback", 0.5, 0, 1), n("lineModAmount", "Mod amount", 0.3, 0, 1), n("lineModRate", "Mod rate", 0.3, 0, 1), n("postCutoffFrequency", "Cutoff", 0.8, 0, 1), n("crossSeed", "Cross-seed", 0.5, 0, 1), n("dryOut", "Dry", 1, 0, 1), n("earlyOut", "Early", 0.7, 0, 1), n("mainOut", "Main", 0.7, 0, 1)], create: (ctx, s) => new CloudSeed(ctx, asAny(s)) as unknown as FxNode },
  { id: "width", title: "Width", category: "utility", defaultOrder: 70, legacyKey: "width", params: [b("enabled", "Power"), n("amount", "Width", 1.2, 0, 2)], create: (ctx, s) => new Width(ctx, asAny(s)) as unknown as FxNode },

  // --- plan10: neue Worklet-Module (extras, siehe types.ts) -----------------
  {
    id: "plate", title: "Plate", category: "space", defaultOrder: 55, legacyKey: "plate",
    params: [
      b("enabled", "Power"),
      n("preDelay", "Pre-Delay", 0, 0, 1),
      n("bandwidth", "Bandwidth", 0.85, 0, 1),
      n("inputDiffusion1", "In-Diffusion 1", 0.75, 0, 1),
      n("inputDiffusion2", "In-Diffusion 2", 0.625, 0, 1),
      n("decay", "Decay", 0.75, 0, 1),
      n("decayDiffusion1", "Decay-Diffusion", 0.7, 0, 1),
      n("damping", "Damping", 0.5, 0, 1),
      n("mix", "Mix", 0.35, 0, 1),
    ],
    create: (ctx, s) => new WorkletFx(createFxWorkletNode(ctx, "plate-processor", s)),
  },
  {
    id: "galactic", title: "Galactic", category: "space", defaultOrder: 65, legacyKey: "galactic",
    params: [
      b("enabled", "Power"),
      n("replace", "Replace", 0.5, 0, 1),
      n("brightness", "Brightness", 0.5, 0, 1),
      n("detune", "Detune", 0.2, 0, 1),
      n("bigness", "Bigness", 0.5, 0, 1),
      n("mix", "Mix", 1, 0, 1),
    ],
    create: (ctx, s) => new WorkletFx(createFxWorkletNode(ctx, "galactic-processor", s)),
  },
  {
    id: "phaser", title: "Phaser/Flanger", category: "modulation", defaultOrder: 35, legacyKey: "phaser",
    params: [
      b("enabled", "Power"),
      e("mode", "Mode", "phaser", ["phaser", "flanger"]),
      n("rateHz", "Rate", 0.3, 0.02, 8, "Hz", "logarithmic"),
      n("depth", "Depth", 0.6, 0, 1),
      n("feedback", "Feedback", 0.4, 0, 0.95),
      { id: "stages", label: "Stages", kind: "number", defaultValue: 4, min: 4, max: 8, step: 2 },
      n("mix", "Mix", 0.5, 0, 1),
    ],
    create: (ctx, s) => new Phaser(ctx, asAny(s)) as unknown as FxNode,
  },
  {
    id: "lofi", title: "Lo-Fi", category: "lofi", defaultOrder: 25, legacyKey: "lofi",
    params: [
      b("enabled", "Power"),
      n("downsample", "Downsample", 0, 0, 1),
      n("bitcrush", "Bitcrush", 0, 0, 1),
      n("mix", "Mix", 1, 0, 1),
    ],
    create: (ctx, s) => new WorkletFx(createFxWorkletNode(ctx, "lofi-processor", s)),
  },
  {
    id: "ladder", title: "Ladder Filter", category: "filter", defaultOrder: 15, legacyKey: "ladder",
    params: [
      b("enabled", "Power"),
      n("cutoffHz", "Cutoff", 2000, 20, 20000, "Hz", "logarithmic"),
      n("resonance", "Resonance", 0.3, 0, 1),
      n("drive", "Drive", 0.2, 0, 1),
      n("mix", "Mix", 1, 0, 1),
    ],
    create: (ctx, s) => new WorkletFx(createFxWorkletNode(ctx, "ladder-processor", s)),
  },
];

const FX_MODULE_BY_ID = new Map(FX_MODULES.map((module) => [module.id, module]));

export function getFxModuleDefinition(id: string): FxModuleDefinition | undefined {
  return FX_MODULE_BY_ID.get(id as FxModuleId);
}

export function getFxFactory(id: string): FxFactory | undefined {
  return FX_MODULE_BY_ID.get(id as FxModuleId)?.create;
}
