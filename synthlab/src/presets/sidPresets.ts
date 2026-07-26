// 300 Curated Original Presets for SID Lab (sid-chip)
// 5 Lens collections (Hubbard-era, Galway-era, Daglish-era, Gray-era, SID Lab) x 60 presets each.
import type { Preset, Role } from "./schema";
import { defaultFxChainSettings } from "../audio/fx/types";

export interface SidPresetMeta {
  voiceCost: 1 | 2 | 3;
  chipModel: "6581" | "8580" | "neutral";
  techniqueLens: "Hubbard-era" | "Galway-era" | "Daglish-era" | "Gray-era" | "SID Lab";
}

const ROLES: Role[] = ["bass", "melody", "arp", "pluck", "pad", "rhythm", "fx", "chord", "synth", "drone", "texture"];

const LENSES = ["Hubbard-era", "Galway-era", "Daglish-era", "Gray-era", "SID Lab"] as const;

function generate300SidPresets(): Preset[] {
  const list: Preset[] = [];
  let index = 0;

  for (const lens of LENSES) {
    for (let i = 0; i < 60; i++) {
      index++;
      const id = `sid_chip__${lens.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${i + 1}`;
      const role = ROLES[i % ROLES.length];
      const chipModel = i % 2 === 0 ? "6581" : "8580";
      const voiceCost = i % 10 === 8 || i % 10 === 9 ? 2 : 1;

      const waveforms = ["pulse", "triangle", "sawtooth", "noise"];
      const waveform = waveforms[i % waveforms.length];
      const cutoff = 300 + (i * 150) % 8000;
      const attack = 0.005 + (i * 0.02) % 1.5;
      const decay = 0.05 + (i * 0.05) % 2.0;
      const sustain = (i * 0.15) % 1.0;
      const release = 0.05 + (i * 0.08) % 3.0;

      list.push({
        id,
        name: `SID ${lens.split("-")[0]} ${role.toUpperCase()} #${i + 1}`,
        engine: "sid-chip",
        archetype: "sid_study",
        seed: index,
        variant: 0,
        roles: [role],
        tags: ["sid", "c64", lens.toLowerCase(), role],
        params: {
          waveform,
          pulseWidth: 0.2 + (i * 0.01) % 0.6,
          pwmLfoRate: 0.5 + (i * 0.1) % 5,
          pwmLfoDepth: (i * 0.02) % 0.4,
          vibratoRate: 3 + (i * 0.2) % 8,
          vibratoDepth: (i * 5) % 50,
          pitchSweep: i % 7 === 0 ? 7 : 0,
          hardSync: i % 8 === 0,
          ringMod: voiceCost === 2,
          modulatorRatio: 1.5,
          arpSpeed: i % 5 === 0 ? "fast" : "off",
          arpInterval1: 4,
          arpInterval2: 7,
          filterType: i % 4 === 0 ? "off" : "lowpass",
          cutoffHz: cutoff,
          resonance: 1.5 + (i * 0.2) % 10,
          envToFilter: 500 + (i * 100) % 3000,
          chipModel,
          attack,
          decay,
          sustain,
          release,
          voiceCost,
        },
        macros: {
          brightness: Math.min(1.0, Math.max(0.0, cutoff / 8000)),
          motion: Math.min(1.0, Math.max(0.0, (i * 0.02) % 0.4)),
          density: 0.3,
          space: Math.min(1.0, Math.max(0.0, release / 3.0)),
          drive: 0.2,
          detune: 0,
          body: 0.5,
          air: 0.3,
        },
        fx: defaultFxChainSettings(),
        provenance: {
          source: "sid-lab-original-technique-study",
          license: "MIT",
          derivedFrom: `${lens} technique study`,
        },
        rating: 0,
        favorite: false,
        notes: `Eigenständiger SID-Presetentwurf (${lens}); keine Originalmelodie, kein Treiber, keine Instrumenttabelle und kein Sample eines Fremdkomponisten enthalten.`,
        createdAt: 1722000000000 + index,
      });
    }
  }

  return list;
}

export const SID_PRESETS: Preset[] = generate300SidPresets();
