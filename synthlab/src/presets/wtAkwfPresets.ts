// 261 Presets aus den kuratierten AKWF-Wellenformen: ein Preset pro importierter
// Wellenform, mit Rolle/Makros aus dem tatsächlichen Fourier-Spektrum abgeleitet
// (spektraler Schwerpunkt = Helligkeit, Energieanteil hoher/tiefer Harmonischer)
// statt zufällig vergeben. Quelle: src/data/derived/akwf-waves.json (CC0-1.0,
// siehe research/LICENSES.md und junoPresets.ts für dasselbe Muster).
import type { Preset, Role } from "./schema";
import { defaultFxChainSettings } from "../audio/fx/types";
import { defaultParamValues } from "../audio/core/types";
import { wtAkwfEngine, AKWF_WAVE_IDS } from "../audio/engines/wtAkwf";
import akwfBank from "../data/derived/akwf-waves.json";

interface AkwfWave {
  id: string;
  sourceFile: string;
  real: number[];
  imag: number[];
}

const WAVES = (akwfBank as unknown as { waves: AkwfWave[] }).waves;

function spectralStats(wave: AkwfWave) {
  let totalEnergy = 0;
  let weightedHarmonic = 0;
  let lowEnergy = 0; // Harmonische 1-4
  let highEnergy = 0; // Harmonische > 24
  for (let h = 1; h < wave.real.length; h++) {
    const mag = Math.hypot(wave.real[h], wave.imag[h]);
    totalEnergy += mag;
    weightedHarmonic += mag * h;
    if (h <= 4) lowEnergy += mag;
    if (h > 24) highEnergy += mag;
  }
  const centroid = totalEnergy > 0 ? weightedHarmonic / totalEnergy : 1;
  const lowRatio = totalEnergy > 0 ? lowEnergy / totalEnergy : 1;
  const highRatio = totalEnergy > 0 ? highEnergy / totalEnergy : 0;
  return { centroid, lowRatio, highRatio };
}

function deriveRole(centroid: number): Role {
  if (centroid < 3) return "bass";
  if (centroid < 8) return "pad";
  if (centroid < 16) return "synth";
  return "texture";
}

function buildWtAkwfPresets(): Preset[] {
  const engineDefaults = defaultParamValues(wtAkwfEngine.params);
  return WAVES.map((wave, i) => {
    const index = AKWF_WAVE_IDS.indexOf(wave.id);
    const stats = spectralStats(wave);
    const role = deriveRole(stats.centroid);
    const brightness = Math.min(1, Math.max(0, stats.centroid / 24));

    return {
      id: `wt-akwf__${wave.id.toLowerCase()}`,
      name: `${wave.id} (AKWF Wavetable)`,
      engine: "wt-akwf",
      archetype: "akwf_curated_wave",
      seed: i,
      variant: 0,
      roles: [role],
      tags: ["akwf", "adventure-kid", "wavetable", role],
      params: {
        ...engineDefaults,
        waveIndex: index,
        scanRange: 4 + (i % 12),
        scanPosition: 0,
        cutoffHz: 1500 + brightness * 10000,
      },
      macros: {
        brightness,
        motion: 0.15,
        density: Math.min(1, Math.max(0, 1 - stats.lowRatio)),
        space: 0.4,
        drive: 0.2,
        detune: 0.15,
        body: Math.min(1, Math.max(0, stats.lowRatio)),
        air: Math.min(1, Math.max(0, stats.highRatio * 3)),
      },
      fx: defaultFxChainSettings(),
      provenance: {
        source: "akwf-free",
        license: "CC0-1.0",
        derivedFrom: wave.id,
        upstreamRepo: "https://github.com/KristofferKarlAxelEkstrand/AKWF-FREE",
        upstreamFile: wave.sourceFile,
      },
      rating: 0,
      favorite: false,
      notes: `Original-Wellenform "${wave.id}" aus Adventure Kid Waveforms (CC0), importiert als PeriodicWave.`,
      createdAt: 1753600000000 + i,
    };
  });
}

export const WT_AKWF_PRESETS: Preset[] = buildWtAkwfPresets();
