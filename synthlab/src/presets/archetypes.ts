// Generische Klangarchetypen im 8-Makro-Raum (Brightness/Motion/Density/Space/
// Drive/Detune/Body/Air), engine-unabhängig. Jeder Archetyp wird über die
// defaultMacroMap jeder Engine auf deren tatsächliche Parameter abgebildet
// (PLAN.md Phase 5: "Dadurch fühlt sich jedes Preset gleich an"). Namen und
// Charakter sind an das Vokabular aus 'Musikmaschine .md' §3/§4 angelehnt.
import type { MacroValues } from "../audio/core/types";
import type { Role } from "./schema";

export interface Archetype {
  id: string;
  name: string;
  roles: Role[];
  tags: string[];
  macros: MacroValues;
  /** 0..1: wie stark Seed-Variation die Makrowerte um diesen Archetyp streut. */
  spread: number;
}

const m = (brightness: number, motion: number, density: number, space: number, drive: number, detune: number, body: number, air: number): MacroValues => ({
  brightness, motion, density, space, drive, detune, body, air,
});

export const ARCHETYPES: Archetype[] = [
  { id: "glass_bell", name: "Glass Bell", roles: ["bell", "fx"], tags: ["bright", "sparse"], macros: m(0.85, 0.1, 0.3, 0.75, 0.1, 0.1, 0.2, 0.7), spread: 0.25 },
  { id: "tape_drone", name: "Tape Drone", roles: ["drone", "pad"], tags: ["warm", "evolving"], macros: m(0.3, 0.25, 0.5, 0.85, 0.35, 0.45, 0.65, 0.3), spread: 0.3 },
  { id: "breath_field", name: "Breath Field", roles: ["texture", "fx"], tags: ["airy", "static"], macros: m(0.4, 0.35, 0.6, 0.7, 0.05, 0.2, 0.2, 0.85), spread: 0.3 },
  { id: "sub_pulse", name: "Sub Pulse", roles: ["bass", "drone"], tags: ["dark", "narrow"], macros: m(0.15, 0.1, 0.3, 0.3, 0.4, 0.05, 0.9, 0.05), spread: 0.2 },
  { id: "metallic_rain", name: "Metallic Rain", roles: ["texture", "fx", "rhythm"], tags: ["bright", "dense"], macros: m(0.8, 0.6, 0.75, 0.6, 0.2, 0.3, 0.15, 0.55), spread: 0.35 },
  { id: "submerged_choir", name: "Submerged Choir", roles: ["pad", "drone"], tags: ["dark", "wide"], macros: m(0.35, 0.2, 0.55, 0.9, 0.15, 0.35, 0.55, 0.4), spread: 0.25 },
  { id: "harmonic_dust", name: "Harmonic Dust", roles: ["texture", "fx"], tags: ["sparse", "evolving"], macros: m(0.6, 0.3, 0.2, 0.8, 0.1, 0.25, 0.25, 0.6), spread: 0.35 },
  { id: "unstable_pad", name: "Unstable Pad", roles: ["pad"], tags: ["evolving", "rough"], macros: m(0.5, 0.5, 0.55, 0.7, 0.4, 0.5, 0.5, 0.4), spread: 0.4 },
  { id: "deep_space", name: "Deep Space", roles: ["drone", "pad"], tags: ["dark", "wide", "static"], macros: m(0.2, 0.08, 0.4, 0.95, 0.1, 0.15, 0.75, 0.35), spread: 0.2 },
  { id: "crystal_pad", name: "Crystal Pad", roles: ["pad", "synth"], tags: ["bright", "wide"], macros: m(0.75, 0.2, 0.5, 0.75, 0.1, 0.2, 0.3, 0.65), spread: 0.25 },
  { id: "warm_analog", name: "Warm Analog", roles: ["pad", "synth", "bass"], tags: ["warm", "narrow"], macros: m(0.45, 0.15, 0.4, 0.4, 0.3, 0.15, 0.7, 0.2), spread: 0.2 },
  { id: "shimmer_veil", name: "Shimmer Veil", roles: ["pad", "fx"], tags: ["bright", "wide", "evolving"], macros: m(0.7, 0.3, 0.45, 0.9, 0.15, 0.3, 0.35, 0.75), spread: 0.3 },
  { id: "ritual_drone", name: "Ritual Drone", roles: ["drone"], tags: ["dark", "static", "rough"], macros: m(0.25, 0.05, 0.35, 0.6, 0.5, 0.4, 0.8, 0.15), spread: 0.2 },
  { id: "night_insects", name: "Night Insects", roles: ["texture", "rhythm"], tags: ["dense", "sparse"], macros: m(0.65, 0.7, 0.7, 0.5, 0.1, 0.35, 0.15, 0.5), spread: 0.4 },
  { id: "frozen_lake", name: "Frozen Lake", roles: ["pad", "drone"], tags: ["static", "wide", "cold"], macros: m(0.55, 0.05, 0.3, 0.85, 0.05, 0.1, 0.5, 0.5), spread: 0.15 },
  { id: "distant_bells", name: "Distant Bells", roles: ["bell", "melody"], tags: ["sparse", "wide"], macros: m(0.7, 0.15, 0.15, 0.85, 0.05, 0.15, 0.3, 0.6), spread: 0.3 },
  { id: "gravel_bass", name: "Gravel Bass", roles: ["bass"], tags: ["dark", "rough", "narrow"], macros: m(0.2, 0.1, 0.3, 0.2, 0.65, 0.1, 0.9, 0.05), spread: 0.25 },
  { id: "arp_glitter", name: "Arp Glitter", roles: ["arp", "melody"], tags: ["bright", "dense"], macros: m(0.75, 0.55, 0.6, 0.55, 0.15, 0.2, 0.2, 0.6), spread: 0.35 },
  { id: "slow_bloom", name: "Slow Bloom", roles: ["pad", "drone"], tags: ["evolving", "static"], macros: m(0.5, 0.12, 0.45, 0.8, 0.2, 0.3, 0.55, 0.45), spread: 0.3 },
  { id: "broken_radio", name: "Broken Radio", roles: ["fx", "texture"], tags: ["rough", "narrow"], macros: m(0.55, 0.4, 0.5, 0.3, 0.6, 0.25, 0.4, 0.2), spread: 0.4 },
  { id: "moss_pad", name: "Moss Pad", roles: ["pad"], tags: ["dark", "warm", "static"], macros: m(0.3, 0.15, 0.4, 0.6, 0.2, 0.25, 0.65, 0.35), spread: 0.2 },
  { id: "solar_wind", name: "Solar Wind", roles: ["texture", "drone"], tags: ["airy", "evolving", "wide"], macros: m(0.5, 0.45, 0.55, 0.9, 0.1, 0.4, 0.3, 0.8), spread: 0.35 },
  { id: "tide_pool", name: "Tide Pool", roles: ["pad", "texture"], tags: ["warm", "evolving"], macros: m(0.4, 0.3, 0.5, 0.75, 0.15, 0.25, 0.6, 0.5), spread: 0.3 },
  { id: "iron_bell", name: "Iron Bell", roles: ["bell"], tags: ["dark", "rough"], macros: m(0.4, 0.05, 0.2, 0.55, 0.5, 0.15, 0.6, 0.2), spread: 0.2 },
  { id: "pale_light", name: "Pale Light", roles: ["pad", "synth"], tags: ["bright", "static", "wide"], macros: m(0.65, 0.1, 0.4, 0.8, 0.1, 0.2, 0.35, 0.55), spread: 0.2 },
  { id: "sparse_pluck", name: "Sparse Pluck", roles: ["pluck", "melody"], tags: ["sparse", "narrow"], macros: m(0.6, 0.2, 0.15, 0.5, 0.15, 0.1, 0.4, 0.35), spread: 0.3 },
  { id: "sunken_chord", name: "Sunken Chord", roles: ["chord", "pad"], tags: ["dark", "wide", "evolving"], macros: m(0.35, 0.2, 0.45, 0.85, 0.2, 0.3, 0.6, 0.4), spread: 0.25 },
  { id: "static_field", name: "Static Field", roles: ["texture", "fx"], tags: ["static", "rough", "narrow"], macros: m(0.5, 0.02, 0.65, 0.4, 0.55, 0.2, 0.4, 0.3), spread: 0.15 },
  { id: "hollow_pulse", name: "Hollow Pulse", roles: ["rhythm", "bass"], tags: ["dark", "sparse"], macros: m(0.3, 0.3, 0.35, 0.35, 0.35, 0.1, 0.7, 0.1), spread: 0.3 },
];

export function getArchetype(id: string): Archetype {
  const a = ARCHETYPES.find((x) => x.id === id);
  if (!a) throw new Error(`Unbekannter Archetyp: ${id}`);
  return a;
}
