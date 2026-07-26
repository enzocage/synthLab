// FX-Ketten-Konfiguration: eine schlanke, feste Kette pro Preset (PLAN.md Phase 4).
// Feste Reihenfolge = Presets bleiben untereinander schnell vergleichbar:
// Drive -> Post-Filter -> Ensemble -> Delay -> Reverb -> Width -> Master.

export interface DriveSettings {
  amount: number; // 0..1
}

export interface PostFilterSettings {
  type: "lowpass" | "highpass" | "bandpass" | "off";
  cutoffHz: number;
  q: number;
}

export interface EnsembleSettings {
  amount: number; // 0..1, Chorus/Ensemble-Mix
  rateHz: number;
  depthMs: number;
}

export type DelayMode = "tape" | "pingpong" | "off";
export interface DelaySettings {
  mode: DelayMode;
  timeSeconds: number;
  feedback: number; // 0..0.95, hart geklemmt
  mix: number; // 0..1
  tone: number; // 0..1, Tiefpass im Feedback-Pfad
  wowFlutterDepth: number; // 0..1, Tape-Wow/Flutter
}

export type ReverbMode = "fdn" | "shimmer" | "off";
export interface ReverbSettings {
  mode: ReverbMode;
  roomSizeMeters: number; // 5..30
  decaySeconds: number; // 1..60
  damping: number; // 0..1
  mix: number; // 0..1
  shimmerAmountSemitones: number; // typ. 12 (Oktave) oder 7 (Quinte)
  freeze: boolean;
}

export interface WidthSettings {
  amount: number; // 0..2 (1 = unveraendert, >1 = breiter)
}

export interface FxChainSettings {
  drive: DriveSettings;
  postFilter: PostFilterSettings;
  ensemble: EnsembleSettings;
  delay: DelaySettings;
  reverb: ReverbSettings;
  width: WidthSettings;
}

export function defaultFxChainSettings(): FxChainSettings {
  return {
    drive: { amount: 0.1 },
    postFilter: { type: "off", cutoffHz: 12000, q: 0.7 },
    ensemble: { amount: 0.2, rateHz: 0.3, depthMs: 4 },
    delay: { mode: "off", timeSeconds: 0.5, feedback: 0.3, mix: 0.2, tone: 0.5, wowFlutterDepth: 0.1 },
    reverb: { mode: "fdn", roomSizeMeters: 14, decaySeconds: 6, damping: 0.4, mix: 0.3, shimmerAmountSemitones: 12, freeze: false },
    width: { amount: 1.1 },
  };
}
