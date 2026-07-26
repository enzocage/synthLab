// 250 Curated FM Presets (50 Presets per FM engine: fm-dx7, fm-4op, fm-morph, fm-feedback, fm-linear)
import type { Preset, Role } from "./schema";
import { defaultFxChainSettings } from "../audio/fx/types";

const ROLES: Role[] = ["bass", "melody", "pad", "bell", "chord", "synth", "texture", "rhythm", "fx", "drone"];

const FM_ENGINES = [
  { id: "fm-dx7", name: "FM DX7" },
  { id: "fm-4op", name: "FM 4-Op Arcade" },
  { id: "fm-morph", name: "FM Morph" },
  { id: "fm-feedback", name: "FM Feedback Chaos" },
  { id: "fm-linear", name: "FM Linear Precision" },
] as const;

function generate250FmPresets(): Preset[] {
  const presets: Preset[] = [];
  let counter = 0;

  for (const eng of FM_ENGINES) {
    for (let i = 1; i <= 50; i++) {
      counter++;
      const id = `${eng.id}__preset_${i}`;
      const role = ROLES[(i - 1) % ROLES.length];

      // Custom parameters per engine type
      let params: Record<string, number | string | boolean> = {};

      if (eng.id === "fm-dx7") {
        params = {
          algorithm: (i % 8) + 1,
          modIndex: 0.5 + (i * 0.3) % 15,
          opRatio1: 1 + (i % 3) * 0.5,
          opRatio2: 1 + (i % 5),
          opRatio3: 1 + (i % 7) * 0.5,
          feedback: (i * 0.02) % 0.8,
          attack: 0.005 + (i * 0.01) % 0.8,
          decay: 0.2 + (i * 0.08) % 3,
          sustain: 0.2 + (i * 0.05) % 0.8,
          release: 0.2 + (i * 0.1) % 4,
        };
      } else if (eng.id === "fm-4op") {
        params = {
          mult1: 0.5 + (i % 4),
          mult2: 1 + (i % 6),
          feedback: 1 + (i * 0.2) % 8,
          fmAmt: 1 + (i * 0.25) % 12,
          grit: (i * 0.02) % 0.9,
          attack: 0.001 + (i * 0.005) % 0.2,
          decay: 0.1 + (i * 0.05) % 2,
          sustain: (i * 0.02) % 0.9,
          release: 0.1 + (i * 0.05) % 2.5,
        };
      } else if (eng.id === "fm-morph") {
        params = {
          morphRate: 0.2 + (i * 0.15) % 6,
          morphDepth: 0.1 + (i * 0.018) % 0.85,
          carrierShape: i % 3 === 0 ? "sawtooth" : i % 2 === 0 ? "triangle" : "sine",
          attack: 0.05 + (i * 0.08) % 3,
          decay: 0.5 + (i * 0.1) % 4,
          sustain: 0.4 + (i * 0.01) % 0.5,
          release: 0.5 + (i * 0.15) % 6,
        };
      } else if (eng.id === "fm-feedback") {
        params = {
          feedback: 1 + (i * 0.35) % 18,
          ratio: 0.5 + (i * 0.1) % 4.5,
          attack: 0.001 + (i * 0.01) % 0.5,
          decay: 0.1 + (i * 0.05) % 2,
          sustain: (i * 0.02) % 0.8,
          release: 0.1 + (i * 0.08) % 4,
        };
      } else {
        // fm-linear
        params = {
          harmonicity: 0.5 + (i * 0.25) % 12,
          modIndex: 0.2 + (i * 0.2) % 10,
          attack: 0.01 + (i * 0.05) % 2,
          decay: 0.2 + (i * 0.1) % 4,
          sustain: 0.3 + (i * 0.01) % 0.6,
          release: 0.2 + (i * 0.15) % 5,
        };
      }

      presets.push({
        id,
        name: `${eng.name} ${role.toUpperCase()} #${i}`,
        engine: eng.id,
        archetype: "fm_synthesis",
        seed: counter,
        variant: 0,
        roles: [role],
        tags: ["fm", eng.id, role],
        params,
        macros: {
          brightness: Math.min(1.0, Math.max(0.0, (i * 0.02) % 0.9)),
          motion: Math.min(1.0, Math.max(0.0, (i * 0.015) % 0.8)),
          density: 0.5,
          space: Math.min(1.0, Math.max(0.0, (i * 0.018) % 0.85)),
          drive: 0.2,
          detune: 0,
          body: 0.5,
          air: 0.4,
        },
        fx: defaultFxChainSettings(),
        provenance: {
          source: "synthlab-fm-presets",
          license: "MIT",
          derivedFrom: `${eng.name} synthesis preset`,
        },
        rating: 0,
        favorite: false,
        notes: `Eigenständiger ${eng.name} Sound-Entwurf.`,
        createdAt: 1722050000000 + counter,
      });
    }
  }

  return presets;
}

export const FM_PRESETS: Preset[] = generate250FmPresets();
