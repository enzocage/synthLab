// Deterministischer PRNG (Mulberry32) + Seed-Hashing, damit jedes Preset aus
// (engine, archetype, seed) exakt reproduzierbar ist (PLAN.md Phase 5).

export function hashStringToSeed(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Erzeugt einen Zufallsgenerator aus (engine, archetype, seed, variant) - überall im Projekt gleich verwendet. */
export function createRng(engine: string, archetype: string, seed: number, variant = 0): () => number {
  const composite = hashStringToSeed(`${engine}:${archetype}:${seed}:${variant}`);
  return mulberry32(composite);
}

/** Gleichverteilt in [min, max]. */
export function randRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

/** Log-verteilt in [min, max] (für Frequenzen/Zeiten sinnvoller als linear). */
export function randLogRange(rng: () => number, min: number, max: number): number {
  const logMin = Math.log(Math.max(min, 1e-6));
  const logMax = Math.log(Math.max(max, 1e-6));
  return Math.exp(logMin + rng() * (logMax - logMin));
}

export function randChoice<T>(rng: () => number, options: T[]): T {
  return options[Math.floor(rng() * options.length) % options.length];
}
