// Erzwingt ambient-rules.json "param_smoothing_required": jede hörbare
// Parameteränderung läuft über eine Rampe (15-40ms), nie über einen Sprung.

const MIN_RAMP_S = 0.015;
const MAX_RAMP_S = 0.04;

/** Rampt einen AudioParam klickfrei auf einen neuen Zielwert. */
export function smoothSetParam(
  audioParam: AudioParam,
  value: number,
  time: number,
  rampSeconds = MIN_RAMP_S
): void {
  const ramp = Math.min(Math.max(rampSeconds, MIN_RAMP_S), MAX_RAMP_S);
  audioParam.cancelScheduledValues(time);
  audioParam.setTargetAtTime(value, time, ramp / 3); // ~3x Zeitkonstante bis nahe am Ziel
}

/** Sofortiger, aber klickfreier Wertsprung für Nicht-AudioParam-Ziele (z.B. Custom-Node-Property),
 *  realisiert über ein Gain-Node-Pair oder manuelles Sample-Interpolieren im Aufrufer.
 *  Hier: liefert die Rampen-Zeitkonstante, die AudioWorklets für ihre interne Glättung übernehmen sollen. */
export function defaultSmoothingTimeConstant(): number {
  return MIN_RAMP_S / 3;
}

/** Klickfreier linearer Ramp (z.B. für Lautstärke-Crossfades beim Preset-Hot-Swap). */
export function linearRamp(
  audioParam: AudioParam,
  from: number,
  to: number,
  time: number,
  durationSeconds: number
): void {
  audioParam.cancelScheduledValues(time);
  audioParam.setValueAtTime(from, time);
  audioParam.linearRampToValueAtTime(to, time + durationSeconds);
}

/** Klickfreier exponentieller Ramp (nie exakt 0 ansteuern -> minimale Bodenschwelle). */
export function expRamp(
  audioParam: AudioParam,
  from: number,
  to: number,
  time: number,
  durationSeconds: number
): void {
  const floor = 0.0001;
  audioParam.cancelScheduledValues(time);
  audioParam.setValueAtTime(Math.max(from, floor), time);
  audioParam.exponentialRampToValueAtTime(Math.max(to, floor), time + durationSeconds);
}

export const CROSSFADE_MIN_S = 0.015;
export const CROSSFADE_MAX_S = 0.04;
