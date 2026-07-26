// Preset-Datenmodell (PLAN.md Phase 5), Zod-validiert. Engine-agnostisch: jedes
// Preset referenziert nur eine engine-id + params-Record, das UI/Generator
// generisch über die Engine-Registry auflösen.
import { z } from "zod";
import { MACRO_IDS } from "../audio/core/types";

export const RoleSchema = z.enum([
  "drone",
  "pad",
  "bass",
  "melody",
  "arp",
  "rhythm",
  "pluck",
  "bell",
  "fx",
  "chord",
  "synth",
  "texture",
  "stress",
]);
export type Role = z.infer<typeof RoleSchema>;
export const ROLES: Role[] = RoleSchema.options;

export const MacroValuesSchema = z.object(
  Object.fromEntries(MACRO_IDS.map((id) => [id, z.number().min(0).max(1)])) as Record<
    (typeof MACRO_IDS)[number],
    z.ZodNumber
  >
);

const FxNumberRange = z.number();
export const FxChainSettingsSchema = z.object({
  drive: z.object({ amount: FxNumberRange }),
  postFilter: z.object({
    type: z.enum(["lowpass", "highpass", "bandpass", "off"]),
    cutoffHz: FxNumberRange,
    q: FxNumberRange,
  }),
  ensemble: z.object({ amount: FxNumberRange, rateHz: FxNumberRange, depthMs: FxNumberRange }),
  delay: z.object({
    mode: z.enum(["tape", "pingpong", "off"]),
    timeSeconds: FxNumberRange,
    feedback: FxNumberRange,
    mix: FxNumberRange,
    tone: FxNumberRange,
    wowFlutterDepth: FxNumberRange,
  }),
  reverb: z.object({
    roomSize: FxNumberRange,
    damping: FxNumberRange,
    preDelayMs: FxNumberRange,
    mix: FxNumberRange,
    width: FxNumberRange,
    inputLowCutHz: FxNumberRange,
    outputHighCutHz: FxNumberRange,
    freeze: z.boolean(),
  }),
  width: z.object({ amount: FxNumberRange }),
});

export const ProvenanceSchema = z.object({
  source: z.string(),
  license: z.string(),
  derivedFrom: z.string().optional(),
});

export const AudioMetricsSchema = z
  .object({
    peakDb: z.number(),
    rms: z.number(),
    crest: z.number(),
    spectralCentroidHz: z.number(),
    spectralSpreadHz: z.number(),
    spectralFlatness: z.number(),
    spectralRolloffHz: z.number(),
    stereoCorrelation: z.number(),
    dcOffset: z.number(),
    clickCount: z.number(),
    silenceRatio: z.number(),
    centroidDriftHz: z.number(),
    tags: z.array(z.string()),
    brokenReason: z.string().nullable(),
  })
  .partial();
export type AudioMetrics = z.infer<typeof AudioMetricsSchema>;

export const PresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  engine: z.string(),
  archetype: z.string(),
  seed: z.number().int(),
  variant: z.number().int().default(0),
  roles: z.array(RoleSchema).min(1),
  tags: z.array(z.string()).default([]),
  params: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])),
  macros: MacroValuesSchema,
  fx: FxChainSettingsSchema,
  provenance: ProvenanceSchema,
  metrics: AudioMetricsSchema.optional(),
  rating: z.number().int().min(0).max(5).default(0),
  favorite: z.boolean().default(false),
  notes: z.string().default(""),
  createdAt: z.number().default(0),
});
export type Preset = z.infer<typeof PresetSchema>;

export const PresetBankSchema = z.object({
  version: z.literal(1),
  presets: z.array(PresetSchema),
});
export type PresetBank = z.infer<typeof PresetBankSchema>;

export function validatePreset(data: unknown): Preset {
  return PresetSchema.parse(data);
}
