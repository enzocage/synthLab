// 175 importierte DMXOPL-Instrumente (128 General-MIDI-Programme + 47
// Perkussion) als Preset-Objekte. Quelle: src/data/derived/opl3-instruments.json
// (aus research/vendor/dmxopl/GENMIDI.op2, MIT). Nur Voice 0 wird verwendet
// (siehe opl3.ts). Rollen werden aus der GM-Programmgruppe abgeleitet, Makros
// aus den echten Registerwerten zurückgerechnet.
import type { Preset, Role } from "./schema";
import { defaultFxChainSettings } from "../audio/fx/types";
import opl3Bank from "../data/derived/opl3-instruments.json";

interface OplOp {
  tremolo: boolean;
  vibrato: boolean;
  sustainMode: boolean;
  ksr: boolean;
  multiplier: number;
  attackRate: number;
  decayRate: number;
  sustainLevel: number;
  releaseRate: number;
  waveform: number;
  keyScaleLevel: number;
  outputLevel: number;
}

interface OplVoice {
  modulator: OplOp;
  carrier: OplOp;
  feedback: number;
  connection: "fm" | "additive";
  baseNoteOffset: number;
}

interface OplInstrument {
  index: number;
  kind: "melodic" | "percussion";
  gmProgramOrNote: number;
  fixedPitch: boolean;
  twoVoice: boolean;
  fineTuning: number;
  fixedNote: number;
  voices: [OplVoice, OplVoice];
  name: string;
}

const bank = opl3Bank as unknown as { _meta: { sourceRepo: string; sourceFile: string; license: string }; instruments: OplInstrument[] };

// General-MIDI-Programmgruppen (0-basiert) -> Rolle. Grobe, aber sinnvolle
// Einteilung nach der GM1-Spezifikation (Piano/Chromatic Percussion/Organ/...).
function roleFromGmProgram(program: number): Role {
  if (program < 8) return "melody"; // Piano
  if (program < 16) return "bell"; // Chromatic Percussion
  if (program < 24) return "chord"; // Organ
  if (program < 32) return "pluck"; // Guitar
  if (program < 40) return "bass"; // Bass
  if (program < 48) return "chord"; // Strings
  if (program < 56) return "pad"; // Ensemble
  if (program < 64) return "melody"; // Brass
  if (program < 72) return "melody"; // Reed
  if (program < 80) return "melody"; // Pipe
  if (program < 88) return "synth"; // Synth Lead
  if (program < 96) return "pad"; // Synth Pad
  if (program < 104) return "texture"; // Synth FX
  if (program < 112) return "texture"; // Ethnic
  if (program < 120) return "rhythm"; // Percussive
  return "fx"; // Sound Effects
}

function deriveMacros(voice: OplVoice) {
  const { modulator: m, carrier: c } = voice;
  const brightness = Math.min(1, Math.max(0, 1 - m.outputLevel / 63));
  const drive = Math.min(1, Math.max(0, voice.feedback / 7));
  const space = Math.min(1, Math.max(0, 1 - c.releaseRate / 15));
  const body = Math.min(1, Math.max(0, 1 - c.outputLevel / 63));
  const motion = Math.min(1, Math.max(0, (m.vibrato ? 0.5 : 0) + (m.tremolo ? 0.3 : 0) + voice.feedback / 14));
  return {
    brightness,
    motion,
    density: Math.min(1, Math.max(0, c.multiplier / 15)),
    space,
    drive,
    detune: 0.1,
    body,
    air: Math.min(1, Math.max(0, m.waveform / 7)),
  };
}

function toPresetParams(voice: OplVoice): Record<string, number | string | boolean> {
  return {
    modMultiplier: voice.modulator.multiplier,
    modAttackRate: voice.modulator.attackRate,
    modDecayRate: voice.modulator.decayRate,
    modSustainLevel: voice.modulator.sustainLevel,
    modReleaseRate: voice.modulator.releaseRate,
    modOutputLevel: voice.modulator.outputLevel,
    modWaveform: voice.modulator.waveform,
    modSustainMode: voice.modulator.sustainMode,
    carMultiplier: voice.carrier.multiplier,
    carAttackRate: voice.carrier.attackRate,
    carDecayRate: voice.carrier.decayRate,
    carSustainLevel: voice.carrier.sustainLevel,
    carReleaseRate: voice.carrier.releaseRate,
    carOutputLevel: voice.carrier.outputLevel,
    carWaveform: voice.carrier.waveform,
    carSustainMode: voice.carrier.sustainMode,
    feedback: voice.feedback,
    connection: voice.connection,
    noteOffsetSemitones: Math.max(-24, Math.min(24, voice.baseNoteOffset)),
  };
}

function buildOpl3Presets(): Preset[] {
  return bank.instruments.map((instr) => {
    const voice = instr.voices[0];
    const role: Role = instr.kind === "percussion" ? "rhythm" : roleFromGmProgram(instr.gmProgramOrNote);
    const name = instr.name || `OPL Instrument #${instr.index}`;
    return {
      id: `opl3__${instr.kind}_${instr.index}`,
      name: `${name} (OPL3)`,
      engine: "opl3",
      archetype: "opl3_genmidi",
      seed: instr.index,
      variant: 0,
      roles: [role],
      tags: ["opl3", "fm", "genmidi", instr.kind, role],
      params: toPresetParams(voice),
      macros: deriveMacros(voice),
      fx: defaultFxChainSettings(),
      provenance: {
        source: "dmxopl-genmidi",
        license: bank._meta.license,
        derivedFrom: name,
        upstreamRepo: bank._meta.sourceRepo,
        upstreamFile: bank._meta.sourceFile,
      },
      rating: 0,
      favorite: false,
      notes: `Original-GENMIDI-Instrument "${name}" (${instr.kind}), importiert aus DMXOPL (MIT).`,
      createdAt: 1753700000000 + instr.index,
    };
  });
}

export const OPL3_PRESETS: Preset[] = buildOpl3Presets();
