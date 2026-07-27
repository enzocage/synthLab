// DX7-Umrechnungsformeln, portiert aus research/vendor/amy/amy/fm.py (MIT,
// Brian Whitman & Daniel P. W. Ellis, AMY-Projekt). Diese Formeln sind
// empirisch gegen echte DX7-Hardware/TX802-Messungen gefittet (siehe
// Kommentare in fm.py) - keine Neuerfindung. Wird sowohl vom dx7-Worklet als
// auch (nur die reinen Zahlenfunktionen) potenziell von Tests importiert.

/** DX7-Level (0..99) -> lineare Amplitude. Jede Stufe ≈ 1dB, verdoppelt sich alle 8 Stufen. */
export function dx7LevelToLinear(level: number): number {
  return Math.pow(2, (level - 99) / 8);
}

/** Frequenzverhältnis-Modus (ratiotuning=true): Operator-Frequenz = Grundfrequenz * ratio. */
export function coarseFineRatio(coarse: number, fine: number, detune = 7): number {
  let c = coarse & 31;
  if (c === 0) c = 0.5;
  return c * (1 + (fine + (detune - 7) / 8) / 100);
}

/** Fixed-Hz-Modus (ratiotuning=false): Operator-Frequenz ist tonhöhenunabhängig. */
export function coarseFineFixedHz(coarse: number, fine: number, detune = 7): number {
  const c = coarse & 3;
  return Math.pow(10, c + (fine + (detune - 7) / 8) / 100);
}

/** DX7-Feedback-Byte (0..7) -> Modulationstiefen-Skalar. */
export function feedbackToScale(feedback: number): number {
  return 0.00125 * Math.pow(2, feedback);
}

// --- Envelope-Generator (4-stufiges Rate/Level-EG, "log-linear" Modell) -------
// Portiert aus fm.py `calc_loglin_eg_breakpoints`: Attack-Segmente (Ziel-Level >
// aktueller Level) folgen einer Exponentialkurve L(t) = 109 - 75*exp(-t/t_const)
// mit t_const = 0.008 * 2^((65-rate)/6). Decay/Release-Segmente sind linear im
// Level-Raum mit Geschwindigkeit 0.5 + 0.5*2^(rate/6) Level-Einheiten/Sekunde.
const MIN_LEVEL = 34;
const ATTACK_RANGE = 75;

function levelToAttackTime(level: number, tConst: number): number {
  const clamped = Math.max(MIN_LEVEL, level);
  return -tConst * Math.log((MIN_LEVEL + ATTACK_RANGE - clamped) / ATTACK_RANGE);
}

export interface EgSegment {
  /** true = Exponential-Attack-Kurve, false = linearer Decay/Release. */
  isAttack: boolean;
  startLevel: number;
  targetLevel: number;
  durationS: number;
  /** Nur für Attack-Segmente: t-Offset, damit levelToAttackTime(startLevel) korrekt anschließt. */
  tConst: number;
  t0: number;
}

/** Berechnet Dauer + Kurvenform für einen einzelnen EG-Übergang startLevel -> targetLevel bei gegebener Rate (0..99). */
export function computeEgSegment(rate: number, startLevel: number, targetLevel: number, isReleaseSegment: boolean): EgSegment {
  if (targetLevel > startLevel) {
    const tConst = 0.008 * Math.pow(2, (65 - rate) / 6);
    const effectiveStart = Math.max(startLevel, MIN_LEVEL);
    const t0 = levelToAttackTime(effectiveStart, tConst);
    const t1 = levelToAttackTime(targetLevel, tConst);
    return { isAttack: true, startLevel, targetLevel, durationS: Math.max(0, t1 - t0), tConst, t0 };
  }
  const direction = targetLevel >= startLevel ? 1 : -1;
  const levelChangePerSec = direction * (0.5 + 0.5 * Math.pow(2, rate / 6));
  let levelDifference = targetLevel - startLevel;
  if (isReleaseSegment && levelDifference === 0) levelDifference = direction * 60; // Sustain=0/Release=0-Sonderfall aus fm.py
  const durationS = Math.abs(levelDifference / levelChangePerSec);
  return { isAttack: false, startLevel, targetLevel, durationS, tConst: 0, t0: 0 };
}

/** Wertet ein EG-Segment zur (segmentlokalen) Zeit t (Sekunden) aus, liefert Level 0..99. */
export function evalEgSegment(seg: EgSegment, t: number): number {
  const clampedT = Math.max(0, Math.min(seg.durationS, t));
  if (seg.durationS <= 0) return seg.targetLevel;
  if (seg.isAttack) {
    return MIN_LEVEL + ATTACK_RANGE * (1 - Math.exp(-(seg.t0 + clampedT) / seg.tConst));
  }
  const frac = clampedT / seg.durationS;
  return seg.startLevel + (seg.targetLevel - seg.startLevel) * frac;
}

/** Piecewise-lineare Näherung an gemessene TX802-LFO-Geschwindigkeitswerte. */
export function lfoSpeedToHz(byte: number): number {
  if (byte === 0) return 0.064;
  if (byte <= 64) return byte / 6.0;
  if (byte <= 85) return byte - (64.0 * 5.0) / 6.0;
  return 31.67 + (byte - 85.0) * 1.33;
}
