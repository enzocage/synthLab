// Zentrale Registry aller 13 Synth-Engines (PLAN.md Phase 3). UI und
// Preset-Generator iterieren ausschließlich über diese Liste.
import type { Engine } from "../core/types";
import { vaPolyEngine } from "./vaPoly";
import { wavetableEngine } from "./wavetable";
import { fm6Engine } from "./fm6";
import { additiveEngine } from "./additive";
import { granularEngine } from "./granular";
import { modalEngine } from "./modal";
import { stringEngine } from "./string";
import { noisefieldEngine } from "./noisefield";
import { droneEngine } from "./drone";
import { wavefoldEngine } from "./wavefold";
import { phasedistEngine } from "./phasedist";
import { percEngine } from "./perc";
import { subbassEngine } from "./subbass";
import { sidChipEngine } from "./sidChip";
import { fmDx7Engine } from "./fmDx7";
import { fm4OpEngine } from "./fm4Op";
import { fmMorphEngine } from "./fmMorph";
import { fmFeedbackEngine } from "./fmFeedback";
import { fmLinearEngine } from "./fmLinear";

export const ENGINES: Engine[] = [
  vaPolyEngine,
  wavetableEngine,
  fm6Engine,
  additiveEngine,
  granularEngine,
  modalEngine,
  stringEngine,
  noisefieldEngine,
  droneEngine,
  wavefoldEngine,
  phasedistEngine,
  percEngine,
  subbassEngine,
  sidChipEngine,
  fmDx7Engine,
  fm4OpEngine,
  fmMorphEngine,
  fmFeedbackEngine,
  fmLinearEngine,
];

export const ENGINE_MAP: Record<string, Engine> = Object.fromEntries(ENGINES.map((e) => [e.id, e]));

export function getEngine(id: string): Engine {
  const engine = ENGINE_MAP[id];
  if (!engine) throw new Error(`Unbekannte Engine: ${id}`);
  return engine;
}
