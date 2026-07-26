// Gemeinsame Typen für alle Synth-Engines. Jede Engine deklariert ihr eigenes
// Parameterschema (ParamSpec[]) -> UI und Preset-Generator bleiben generisch
// und müssen bei einer neuen Engine nicht angefasst werden (siehe PLAN.md Phase 3).

export type ParamKind = "float" | "int" | "enum" | "bool";

export interface ParamSpecBase {
  id: string;
  label: string;
  kind: ParamKind;
  group?: string; // UI-Gruppierung, z.B. "osc" | "filter" | "env" | "mod"
  /** Steuert, wie stark mutate() diesen Parameter streut. */
  mutationWeight?: number; // 0..1, default 0.5
}

export interface FloatParamSpec extends ParamSpecBase {
  kind: "float";
  min: number;
  max: number;
  default: number;
  /** "lin" | "log" für UI-Kurve und Zufallsverteilung bei der Preset-Generierung. */
  curve?: "lin" | "log";
  unit?: string;
  /** Wenn true, wird jede Änderung zur Laufzeit über eine Rampe geführt (ambient-rules.json: param_smoothing_required). */
  smooth?: boolean;
}

export interface IntParamSpec extends ParamSpecBase {
  kind: "int";
  min: number;
  max: number;
  default: number;
}

export interface EnumParamSpec extends ParamSpecBase {
  kind: "enum";
  options: string[];
  default: string;
}

export interface BoolParamSpec extends ParamSpecBase {
  kind: "bool";
  default: boolean;
}

export type ParamSpec = FloatParamSpec | IntParamSpec | EnumParamSpec | BoolParamSpec;

export type ParamValue = number | string | boolean;
export type ParamValues = Record<string, ParamValue>;

/** Die 8 einheitlichen Makro-Achsen, identisch über alle Engines (PLAN.md Phase 5). */
export const MACRO_IDS = [
  "brightness",
  "motion",
  "density",
  "space",
  "drive",
  "detune",
  "body",
  "air",
] as const;
export type MacroId = (typeof MACRO_IDS)[number];
export type MacroValues = Record<MacroId, number>; // 0..1

export interface MacroTarget {
  paramId: string;
  /** Wert bei macro=0 und macro=1; Kurve dazwischen linear im Parameterraum. */
  atZero: number;
  atOne: number;
}

export type MacroMap = Partial<Record<MacroId, MacroTarget[]>>;

export interface NoteEvent {
  note: number; // MIDI note number
  velocity: number; // 0..1
  time?: number; // AudioContext-Zeit; undefined = sofort
}

/** Eine Voice ist eine laufende Instanz einer Engine für eine Note. */
export interface Voice {
  readonly note: number;
  readonly output: AudioNode;
  /** Startet die Voice (Attack-Phase). */
  trigger(velocity: number, time: number): void;
  /** Leitet Note-Off/Release ein. */
  release(time: number): void;
  /** Sofortiges, hartes Stoppen (Panic/Voice-Stealing) mit kurzem Fade zur Klickvermeidung. */
  stop(time: number, fadeSeconds?: number): void;
  /** Wendet einen Parameterwert an (gesmoothed, falls im Schema markiert). */
  setParam(paramId: string, value: ParamValue, time: number): void;
  /** true, wenn die Voice ihre Release-Phase vollständig durchlaufen hat und entsorgt werden kann. */
  isFinished(time: number): boolean;
  dispose(): void;
}

export interface EngineGlobals {
  audioContext: BaseAudioContext;
}

/** Gemeinsames Interface aller 13 Synth-Engines (PLAN.md Phase 3). */
export interface Engine {
  readonly id: string;
  readonly name: string;
  readonly params: ParamSpec[];
  readonly defaultMacroMap: MacroMap;
  createVoice(globals: EngineGlobals, params: ParamValues, note: number): Voice;
}

export function defaultParamValues(params: ParamSpec[]): ParamValues {
  const values: ParamValues = {};
  for (const p of params) values[p.id] = p.default;
  return values;
}
