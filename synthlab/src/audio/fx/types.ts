// FX-Ketten-Konfiguration: eine schlanke, feste Kette pro Preset (PLAN.md Phase 4).
// Feste Reihenfolge = Presets bleiben untereinander schnell vergleichbar:
// Drive -> Post-Filter -> Ensemble -> Delay -> Reverb -> Width -> Master.
//
// Default ist bewusst komplett neutral/aus (Nutzer-Feedback: die FX-Kette hat
// mit aktiven Defaults fast alle Presets verfaerbt). Presets klingen also erst
// nach der reinen Engine, FX werden gezielt zugeschaltet statt aufoktroyiert.

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

/**
 * Klassisches Freeverb-Design (Jezar/Schroeder: 8 parallele gedaempfte Kammfilter
 * + 4 serielle Allpaesse pro Kanal), neu implementiert mit echten Ein-Pol-Filtern
 * statt BiquadFilterNode im Feedback-Pfad (siehe audio/fx/dsp/onepole.ts) - damit
 * ist die Schleife beweisbar stabil statt nur empirisch "meist okay".
 * 8 zentrale Parameter, wie bei jedem ernstzunehmenden Reverb-Plugin:
 */
export interface ReverbSettings {
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
    drive: { amount: 0 },
    postFilter: { type: "off", cutoffHz: 12000, q: 0.7 },
    ensemble: { amount: 0, rateHz: 0.3, depthMs: 4 },
    delay: { mode: "off", timeSeconds: 0.5, feedback: 0, mix: 0, tone: 0.5, wowFlutterDepth: 0 },
    reverb: {
      roomSize: 0.5,
      damping: 0.5,
      preDelayMs: 0,
      mix: 0,
      width: 1,
      inputLowCutHz: 20,
      outputHighCutHz: 18000,
      freeze: false,
    },
    width: { amount: 1 },
  };
}
