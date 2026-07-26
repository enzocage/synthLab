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
    width: { enabled: false, amount: 1.2 },
  };
}
