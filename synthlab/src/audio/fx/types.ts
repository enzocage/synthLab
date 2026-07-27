// FX-Ketten-Konfiguration: eine Sequenz einzeln an/abschaltbarer Module, wie ein
// Ableton-Live-Geraeteband (PLAN.md Phase 4 + Nutzererweiterung "Ableton-Style").
// Feste Reihenfolge = Presets bleiben untereinander schnell vergleichbar:
// Drive -> Post-Filter -> Ensemble -> Delay -> Reverb -> Width -> Master.
//
// Jedes Modul hat ein `enabled`-Feld: bei false wird das Modul komplett
// bypassed (reines Dry-Signal), unabhaengig von seinen sonstigen Parametern -
// exakt wie der Power-Schalter eines Ableton-Devices.
//
// Default ist bewusst komplett neutral/aus (Nutzer-Feedback: die FX-Kette hat
// mit aktiven Defaults fast alle Presets verfaerbt). Presets klingen also erst
// nach der reinen Engine, FX werden gezielt zugeschaltet statt aufoktroyiert.

export interface DriveSettings {
  enabled: boolean;
  amount: number; // 0..1
}

export interface PostFilterSettings {
  enabled: boolean;
  type: "lowpass" | "highpass" | "bandpass";
  cutoffHz: number;
  q: number;
}

export interface EnsembleSettings {
  enabled: boolean;
  amount: number; // 0..1, Chorus/Ensemble-Mix
  rateHz: number;
  depthMs: number;
}

export type DelayMode = "tape" | "pingpong";
export interface DelaySettings {
  enabled: boolean;
  mode: DelayMode;
  timeSeconds: number;
  feedback: number; // 0..0.95, hart geklemmt
  mix: number; // 0..1
  tone: number; // 0..1, Tiefpass im Feedback-Pfad
  wowFlutterDepth: number; // 0..1, Tape-Wow/Flutter
}

/**
 * Klassisches Freeverb-Design (Jezar/Schroeder: 8 parallele gedaempfte Kammfilter
 * + 4 serielle Allpaesse pro Kanal), neu implementiert mit echten Ein-Pol-Filtern
 * statt BiquadFilterNode im Feedback-Pfad (siehe audio/fx/dsp/onepole.ts) - damit
 * ist die Schleife beweisbar stabil statt nur empirisch "meist okay".
 * 8 zentrale Parameter, wie bei jedem ernstzunehmenden Reverb-Plugin:
 */
export interface ReverbSettings {
  enabled: boolean;
  roomSize: number; // 0..1: Kammfilter-Feedback (Nachhalldauer)
  damping: number; // 0..1: HF-Absorption im Nachhall (dunkler = hoeher)
  preDelayMs: number; // 0..250: Zeit vor dem ersten Reflexionseinsatz
  mix: number; // 0..1: Dry/Wet
  width: number; // 0..1: Stereobreite des Halls
  inputLowCutHz: number; // 20..2000: Hochpass vor dem Hall (verhindert Mulm)
  outputHighCutHz: number; // 1000..18000: Tiefpass nach dem Hall (verhindert Schaerfe)
  freeze: boolean; // Kammfilter-Feedback -> ~1.0, unendliches Sustain
}

export interface WidthSettings {
  enabled: boolean;
  amount: number; // 0..2 (1 = unveraendert, >1 = breiter)
}

/**
 * CloudSeed-artiges Diffusions-Reverb (plan5, Architekturreferenz:
 * ValdemarOrn/CloudSeed, MIT, siehe research/LICENSES.md). Eigenständige
 * Neuimplementierung: Multitap-Diffusor (frühe Reflexionen) -> modulierte
 * Allpass-Diffusor-Kette -> parallele gedämpfte, modulierte Verzögerungsleitungen
 * mit Cross-Seed-Kopplung zwischen den Kanälen -> Post-EQ (Low-/High-Shelf +
 * Cutoff) -> Dry/Early/Main-Ausgangsmischung. Alle Parameter sind bewusst
 * 0..1-normalisiert (identisch zur Original-Preset-JSON-Struktur von CloudSeed),
 * damit die 9 importierten Factory-Programme ohne Umrechnung übernommen werden
 * können (siehe research/extract/import-cloudseed.mjs).
 */
export interface CloudSeedSettings {
  enabled: boolean;
  preDelay: number; // 0..1 -> 0..100ms
  highPass: number; // 0..1 -> 20..2000Hz
  lowPass: number; // 0..1 -> 1000..18000Hz
  tapCount: number; // 0..1 -> 1..8 Taps (int)
  tapLength: number; // 0..1 -> 5..100ms
  tapDecay: number; // 0..1
  diffusionDelay: number; // 0..1 -> 5..50ms
  diffusionFeedback: number; // 0..1 -> 0.3..0.9
  lineCount: number; // 0..1 -> 4..12 Lines (int)
  lineDelay: number; // 0..1 -> 20..150ms
  lineDecay: number; // 0..1 -> 0.3..15s (T60)
  lateDiffusionDelay: number; // 0..1 -> 5..40ms
  lateDiffusionFeedback: number; // 0..1 -> 0.3..0.9
  lineModAmount: number; // 0..1 -> 0..3ms
  lineModRate: number; // 0..1 -> 0.05..1.5Hz
  postLowShelfGain: number; // 0..1 -> -12..+6dB
  postLowShelfFrequency: number; // 0..1 -> 100..1000Hz
  postHighShelfGain: number; // 0..1 -> -12..+6dB
  postHighShelfFrequency: number; // 0..1 -> 2000..12000Hz
  postCutoffFrequency: number; // 0..1 -> 2000..18000Hz
  crossSeed: number; // 0..1 -> 0..0.35 Stereo-Cross-Feed
  dryOut: number; // 0..1
  earlyOut: number; // 0..1
  mainOut: number; // 0..1
}

export interface FxChainSettings {
  drive: DriveSettings;
  postFilter: PostFilterSettings;
  ensemble: EnsembleSettings;
  delay: DelaySettings;
  reverb: ReverbSettings;
  cloudSeed: CloudSeedSettings;
  width: WidthSettings;
}

export type FxModuleId = keyof FxChainSettings;
export type FxParamValue = number | string | boolean;

/** Versioniertes, frei sortierbares Rackformat für die plan5-V2-Migration. */
export interface FxSlot {
  id: string;
  type: FxModuleId | string;
  enabled: boolean;
  params: Record<string, FxParamValue>;
}

export interface FxRackState {
  version: 2;
  slots: FxSlot[];
}

const LEGACY_FX_ORDER: FxModuleId[] = ["drive", "postFilter", "ensemble", "delay", "reverb", "cloudSeed", "width"];

/** Erzeugt aus dem bisherigen benannten V1-Objekt ein stabiles Slot-Rack. */
export function fxRackFromLegacy(settings: FxChainSettings): FxRackState {
  return {
    version: 2,
    slots: LEGACY_FX_ORDER.map((type, index) => {
      const module = settings[type];
      const { enabled, ...params } = module;
      return { id: `${type}-${index + 1}`, type, enabled, params };
    }),
  };
}

/** Projiziert bekannte V2-Slots zurück auf das laufende V1-Audioformat. */
export function legacyFxFromRack(rack: FxRackState, fallback: FxChainSettings): FxChainSettings {
  const next = structuredClone(fallback);
  for (const slot of rack.slots) {
    if (!LEGACY_FX_ORDER.includes(slot.type as FxModuleId)) continue;
    const type = slot.type as FxModuleId;
    next[type] = { ...next[type], ...slot.params, enabled: slot.enabled } as never;
  }
  return next;
}

export function defaultFxChainSettings(): FxChainSettings {
  return {
    drive: { enabled: false, amount: 0.2 },
    postFilter: { enabled: false, type: "lowpass", cutoffHz: 12000, q: 0.7 },
    ensemble: { enabled: false, amount: 0.3, rateHz: 0.3, depthMs: 4 },
    delay: { enabled: false, mode: "pingpong", timeSeconds: 0.5, feedback: 0.3, mix: 0.25, tone: 0.5, wowFlutterDepth: 0.1 },
    reverb: {
      enabled: false,
      roomSize: 0.5,
      damping: 0.5,
      preDelayMs: 0,
      mix: 0.3,
      width: 1,
      inputLowCutHz: 80,
      outputHighCutHz: 10000,
      freeze: false,
    },
    cloudSeed: {
      enabled: false,
      preDelay: 0,
      highPass: 0,
      lowPass: 0.8,
      tapCount: 0.4,
      tapLength: 0.3,
      tapDecay: 0.8,
      diffusionDelay: 0.4,
      diffusionFeedback: 0.6,
      lineCount: 0.7,
      lineDelay: 0.4,
      lineDecay: 0.5,
      lateDiffusionDelay: 0.4,
      lateDiffusionFeedback: 0.5,
      lineModAmount: 0.3,
      lineModRate: 0.3,
      postLowShelfGain: 0.5,
      postLowShelfFrequency: 0.3,
      postHighShelfGain: 0.5,
      postHighShelfFrequency: 0.6,
      postCutoffFrequency: 0.8,
      crossSeed: 0.5,
      dryOut: 1,
      earlyOut: 0.7,
      mainOut: 0.7,
    },
    width: { enabled: false, amount: 1.2 },
  };
}
