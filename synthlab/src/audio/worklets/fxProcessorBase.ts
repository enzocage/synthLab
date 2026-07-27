// Gemeinsame, kleine Bausteine für alle FX-AudioWorkletProcessor (plan10 §5.3):
// pro-Parameter-Glättung (kein Zippern bei Reglerbewegung) und ein
// gleichlautstarker Bypass-Crossfade (kein Klick beim Ein-/Ausschalten).
// Bewusst als Funktionen/kleine Klasse statt einer starren Basisklasse - jeder
// FX-Prozessor hat eine grundverschiedene DSP-Struktur (Delay-Netzwerk,
// Feedback-Schleife, ...) und profitiert nicht von erzwungener Vererbung.

/** Ein-Pol-Glättung eines einzelnen Parameterwerts (vermeidet Knacken bei
 * abrupten Parametersprüngen aus postMessage-Updates). */
export class SmoothedParam {
  private current: number;
  private target: number;
  private readonly coeff: number;

  constructor(initial: number, smoothingMs: number, sampleRate: number) {
    this.current = initial;
    this.target = initial;
    this.coeff = Math.exp(-1 / ((smoothingMs / 1000) * sampleRate));
  }

  setTarget(v: number): void {
    this.target = v;
  }

  /** Muss genau einmal pro Sample aufgerufen werden. */
  tick(): number {
    this.current = this.target + (this.current - this.target) * this.coeff;
    return this.current;
  }

  get value(): number {
    return this.current;
  }
}

/** Gleichlautstarker (equal-power) Dry/Wet-Mix für einen Enabled-Zustand
 * 0..1 (selbst schon geglättet über SmoothedParam) - vermeidet den
 * Lautstärkeeinbruch einer linearen Überblendung in der Mitte. */
export function equalPowerMix(wetAmount: number): { dry: number; wet: number } {
  const clamped = Math.max(0, Math.min(1, wetAmount));
  const angle = clamped * Math.PI * 0.5;
  return { dry: Math.cos(angle), wet: Math.sin(angle) };
}

/** Denormal-Schutz: extrem kleine Fließkommawerte in Feedback-Schleifen können
 * auf manchen CPUs zu drastischen Performance-Einbrüchen führen. */
export function flushDenormal(x: number): number {
  return Math.abs(x) < 1e-15 ? 0 : x;
}
