// 1.024 importierte DX7-Werksvoices als Preset-Objekte. Quelle:
// src/data/derived/dx7-voices.json (aus research/vendor/amy/amy/default-dx7-patches.bin,
// generiert mit bwhitman/learnfm, vertrieben über shorepine/amy, MIT). Rollen
// werden aus dem Original-Werksnamen abgeleitet (klassische DX7-ROM1A/1B-
// Namenskonventionen: "BRASS", "STRINGS", "E.PIANO", "BASS" usw.), Makros aus
// den echten Operator-Registern zurückgerechnet - siehe junoPresets.ts für
// dasselbe Muster.
import type { Preset, Role } from "./schema";
import { defaultFxChainSettings } from "../audio/fx/types";
import dx7Bank from "../data/derived/dx7-voices.json";

interface Dx7BankOp {
  rates: [number, number, number, number];
  levels: [number, number, number, number];
  ratioTuning: boolean;
  freqCoarse: number;
  freqFine: number;
  freqDetune: number;
  opAmp: number;
}

interface Dx7BankVoice {
  index: number;
  name: string;
  algorithm: number;
  feedback: number;
  ops: Dx7BankOp[]; // op6..op1, siehe import-dx7.mjs
}

const bank = dx7Bank as unknown as { _meta: { sourceRepo: string; sourceFile: string; license: string }; voices: Dx7BankVoice[] };

const NAME_ROLE_HINTS: [RegExp, Role][] = [
  [/bass/i, "bass"],
  [/(brass|horn|trumpet|sax)/i, "synth"],
  [/(string|orchestr|violin|cello)/i, "pad"],
  [/(organ|choir|pad|voice|vox|pipes)/i, "pad"],
  [/(bell|chime|glass|marimba|vibe|steel)/i, "bell"],
  [/(pluck|harp|guitar|clav|banjo|koto)/i, "pluck"],
  [/(piano|e\.?piano|clavi)/i, "melody"],
  [/(lead|solo|flute|reed|sax)/i, "melody"],
  [/(drum|tom|snare|perc|log|wood)/i, "rhythm"],
  [/(fx|sweep|noise|wind|space|fx)/i, "fx"],
  [/(pad|space|air|wave)/i, "texture"],
];

function deriveRole(name: string): Role {
  for (const [re, role] of NAME_ROLE_HINTS) {
    if (re.test(name)) return role;
  }
  return "synth";
}

function opBrightness(op: Dx7BankOp): number {
  return Math.min(1, Math.max(0, op.opAmp / 99));
}

function deriveMacros(voice: Dx7BankVoice) {
  // ops[0]=Op6 (haeufig Modulator, bestimmt Helligkeit), ops[5]=Op1 (haeufig
  // Haupt-Carrier, bestimmt Koerper/Lautstaerke) - siehe dx7.worklet.ts.
  const modOp = voice.ops[0];
  const carrierOp = voice.ops[5];
  const avgRelease = voice.ops.reduce((s, o) => s + o.rates[3], 0) / voice.ops.length;
  return {
    brightness: opBrightness(modOp),
    motion: Math.min(1, Math.max(0, voice.feedback / 7)),
    density: Math.min(1, Math.max(0, voice.algorithm / 31)),
    space: Math.min(1, Math.max(0, 1 - avgRelease / 99)),
    drive: Math.min(1, Math.max(0, voice.feedback / 7)),
    detune: 0.15,
    body: opBrightness(carrierOp),
    air: Math.min(1, Math.max(0, (voice.ops[1]?.opAmp ?? 0) / 99)),
  };
}

function toPresetParams(voice: Dx7BankVoice): Record<string, number | string | boolean> {
  const params: Record<string, number | string | boolean> = {
    algorithm: voice.algorithm,
    feedback: voice.feedback,
  };
  // voice.ops ist op6..op1 (Index 0..5); engine-Params sind opN* für N=1..6.
  voice.ops.forEach((op, i) => {
    const opNum = 6 - i;
    const g = `op${opNum}`;
    params[`${g}Rate1`] = op.rates[0];
    params[`${g}Rate2`] = op.rates[1];
    params[`${g}Rate3`] = op.rates[2];
    params[`${g}Rate4`] = op.rates[3];
    params[`${g}Level1`] = op.levels[0];
    params[`${g}Level2`] = op.levels[1];
    params[`${g}Level3`] = op.levels[2];
    params[`${g}Level4`] = op.levels[3];
    params[`${g}RatioMode`] = op.ratioTuning;
    params[`${g}Coarse`] = op.freqCoarse;
    params[`${g}Fine`] = op.freqFine;
    params[`${g}Detune`] = op.freqDetune;
    params[`${g}OutputLevel`] = op.opAmp;
  });
  return params;
}

function buildDx7Presets(): Preset[] {
  return bank.voices.map((voice) => {
    const name = voice.name || `DX7 Voice #${voice.index}`;
    const role = deriveRole(name);
    return {
      id: `dx7__werksvoice_${voice.index}`,
      name: `${name} (DX7)`,
      engine: "dx7",
      archetype: "dx7_werksvoice",
      seed: voice.index,
      variant: 0,
      roles: [role],
      tags: ["dx7", "fm", "yamaha", role],
      params: toPresetParams(voice),
      macros: deriveMacros(voice),
      fx: defaultFxChainSettings(),
      provenance: {
        source: "amy-dx7",
        license: bank._meta.license,
        derivedFrom: name,
        upstreamRepo: bank._meta.sourceRepo,
        upstreamFile: bank._meta.sourceFile,
      },
      rating: 0,
      favorite: false,
      notes: `Original-DX7-Werksvoice "${name}", importiert über AMY (MIT).`,
      createdAt: 1753800000000 + voice.index,
    };
  });
}

export const DX7_PRESETS: Preset[] = buildDx7Presets();
