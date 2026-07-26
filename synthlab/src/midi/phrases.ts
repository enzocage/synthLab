// Generative Rollen-Phrasen (PLAN.md Phase 6). Jede Phrase ist eine deterministische
// Liste von Notenereignissen in Beats, seeded ueber presets/rng.ts. Techniken sind
// an isobar-Pattern-Familien angelehnt (research/derived/pattern-families.json:
// euclidean, brownian, coin_toss, ping_pong, quartale Voicings aus theory.ts).
import type { Role } from "../presets/schema";
import { createRng, randChoice, randRange } from "../presets/rng";
import { degreeToMidi, euclideanRhythm, quartalVoicing, type KeyContext } from "./theory";

export interface NoteEvent {
  startBeat: number;
  durationBeats: number;
  note: number;
  velocity: number;
  /** Drone/Pad: haelt die Note ueber das Phrasenende hinaus (Latch), bis explizit released. */
  hold?: boolean;
}

/** Gemeinsame Form fuer alles, was der Lookahead-Player (midi/player.ts) abspielen
 *  kann: generative Phrasen UND aufgenommene Track-Clips (store/tracksStore.ts). */
export interface NoteSequence {
  lengthBeats: number;
  events: NoteEvent[];
}

export interface Phrase extends NoteSequence {
  role: Role;
}

interface PhraseOptions {
  key: KeyContext;
  seed: number;
  lengthBars?: number;
  beatsPerBar?: number;
}

function makeRng(role: Role, seed: number) {
  return createRng("phrase", role, seed);
}

function drone(opts: PhraseOptions): Phrase {
  const beatsPerBar = opts.beatsPerBar ?? 4;
  const lengthBars = opts.lengthBars ?? 8;
  const lengthBeats = lengthBars * beatsPerBar;
  const rng = makeRng("drone", opts.seed);
  const degrees = rng() < 0.5 ? [0] : [0, 4]; // Grundton oder Grundton+Quinte (Quartstufe 4 in Skalendegrees)
  const events: NoteEvent[] = degrees.map((d, i) => ({
    startBeat: i * 0.05,
    durationBeats: lengthBeats,
    note: degreeToMidi(opts.key, d),
    velocity: 0.55 + randRange(rng, -0.05, 0.05),
    hold: true,
  }));
  return { role: "drone", lengthBeats, events };
}

function pad(opts: PhraseOptions): Phrase {
  const beatsPerBar = opts.beatsPerBar ?? 4;
  const lengthBars = opts.lengthBars ?? 8;
  const lengthBeats = lengthBars * beatsPerBar;
  const rng = makeRng("pad", opts.seed);
  const chordChangeBars = randChoice(rng, [4, 8]);
  const events: NoteEvent[] = [];
  for (let bar = 0; bar < lengthBars; bar += chordChangeBars) {
    const startDegree = randChoice(rng, [0, 1, 2, 3, 4]);
    const voicing = quartalVoicing(opts.key, startDegree, 3);
    const duration = Math.min(chordChangeBars, lengthBars - bar) * beatsPerBar;
    for (const note of voicing) {
      events.push({ startBeat: bar * beatsPerBar, durationBeats: duration * 0.95, note, velocity: 0.5 + randRange(rng, -0.05, 0.05) });
    }
  }
  return { role: "pad", lengthBeats, events };
}

function bass(opts: PhraseOptions): Phrase {
  const beatsPerBar = opts.beatsPerBar ?? 4;
  const lengthBars = opts.lengthBars ?? 8;
  const lengthBeats = lengthBars * beatsPerBar;
  const rng = makeRng("bass", opts.seed);
  const events: NoteEvent[] = [];
  for (let bar = 0; bar < lengthBars; bar++) {
    const octaveJump = rng() < 0.15 ? 7 : 0; // gelegentliche Oktave (Skalenstufe +7 in Terzskala ~= Oktave je nach Skala)
    events.push({
      startBeat: bar * beatsPerBar,
      durationBeats: beatsPerBar * 0.9,
      note: degreeToMidi(opts.key, octaveJump) - 12,
      velocity: 0.6 + randRange(rng, -0.05, 0.05),
    });
  }
  return { role: "bass", lengthBeats, events };
}

function melody(opts: PhraseOptions): Phrase {
  const beatsPerBar = opts.beatsPerBar ?? 4;
  const lengthBars = opts.lengthBars ?? 8;
  const lengthBeats = lengthBars * beatsPerBar;
  const rng = makeRng("melody", opts.seed);
  const events: NoteEvent[] = [];
  let degree = 0;
  const steps = lengthBars * 4; // 16tel-Raster als Dichte-Basis, tatsaechliche Noten sind sparsam
  const density = 0.35; // ambient-rules.json: silence_as_event, maxDensity 0.85
  for (let s = 0; s < steps; s++) {
    if (rng() > density) continue;
    degree += Math.round(randRange(rng, -2, 2));
    events.push({
      startBeat: s * (beatsPerBar / 4),
      durationBeats: randRange(rng, 0.5, 2),
      note: degreeToMidi(opts.key, degree),
      velocity: 0.45 + randRange(rng, -0.1, 0.1),
    });
  }
  return { role: "melody", lengthBeats, events };
}

function arp(opts: PhraseOptions): Phrase {
  const beatsPerBar = opts.beatsPerBar ?? 4;
  const lengthBars = opts.lengthBars ?? 4;
  const lengthBeats = lengthBars * beatsPerBar;
  const rng = makeRng("arp", opts.seed);
  const pattern = [0, 2, 4, 7, 4, 2];
  const stepBeats = 0.25;
  const totalSteps = Math.floor(lengthBeats / stepBeats);
  const events: NoteEvent[] = [];
  let dir = 1;
  let idx = 0;
  for (let s = 0; s < totalSteps; s++) {
    events.push({
      startBeat: s * stepBeats,
      durationBeats: stepBeats * 0.85,
      note: degreeToMidi(opts.key, pattern[idx % pattern.length]),
      velocity: 0.4 + randRange(rng, -0.05, 0.05),
    });
    idx += dir;
    if (idx >= pattern.length - 1 || idx <= 0) dir *= -1; // Ping-Pong
  }
  return { role: "arp", lengthBeats, events };
}

function rhythm(opts: PhraseOptions): Phrase {
  const beatsPerBar = opts.beatsPerBar ?? 4;
  const lengthBars = opts.lengthBars ?? 4;
  const lengthBeats = lengthBars * beatsPerBar;
  const rng = makeRng("rhythm", opts.seed);
  const steps = lengthBars * 8;
  const hits = randChoice(rng, [3, 5, 7]);
  const euclid = euclideanRhythm(steps, hits);
  const stepBeats = lengthBeats / steps;
  const events: NoteEvent[] = [];
  euclid.forEach((on, i) => {
    if (!on) return;
    events.push({ startBeat: i * stepBeats, durationBeats: stepBeats * 0.8, note: 45, velocity: 0.5 + randRange(rng, -0.1, 0.1) });
  });
  return { role: "rhythm", lengthBeats, events };
}

function pluck(opts: PhraseOptions): Phrase {
  const beatsPerBar = opts.beatsPerBar ?? 4;
  const lengthBars = opts.lengthBars ?? 8;
  const lengthBeats = lengthBars * beatsPerBar;
  const rng = makeRng("pluck", opts.seed);
  const events: NoteEvent[] = [];
  const steps = lengthBars * 4;
  for (let s = 0; s < steps; s++) {
    if (rng() > 0.2) continue;
    events.push({
      startBeat: s * (beatsPerBar / 4),
      durationBeats: 0.3,
      note: degreeToMidi(opts.key, Math.floor(randRange(rng, 0, 5))),
      velocity: 0.5 + randRange(rng, -0.1, 0.1),
    });
  }
  return { role: "pluck", lengthBeats, events };
}

function bell(opts: PhraseOptions): Phrase {
  const beatsPerBar = opts.beatsPerBar ?? 4;
  const lengthBars = opts.lengthBars ?? 16;
  const lengthBeats = lengthBars * beatsPerBar;
  const rng = makeRng("bell", opts.seed);
  const events: NoteEvent[] = [];
  const steps = lengthBars * 2;
  for (let s = 0; s < steps; s++) {
    if (rng() > 0.12) continue;
    events.push({
      startBeat: s * (beatsPerBar / 2),
      durationBeats: beatsPerBar * 3, // langer Ausklang
      note: degreeToMidi(opts.key, Math.floor(randRange(rng, 3, 9))),
      velocity: 0.45 + randRange(rng, -0.1, 0.1),
    });
  }
  return { role: "bell", lengthBeats, events };
}

function fx(opts: PhraseOptions): Phrase {
  const beatsPerBar = opts.beatsPerBar ?? 4;
  const lengthBars = opts.lengthBars ?? 8;
  const lengthBeats = lengthBars * beatsPerBar;
  const rng = makeRng("fx", opts.seed);
  return {
    role: "fx",
    lengthBeats,
    events: [{ startBeat: lengthBeats * 0.25, durationBeats: 4, note: degreeToMidi(opts.key, 0), velocity: 0.6 + randRange(rng, -0.05, 0.05) }],
  };
}

function chord(opts: PhraseOptions): Phrase {
  const beatsPerBar = opts.beatsPerBar ?? 4;
  const lengthBars = opts.lengthBars ?? 8;
  const lengthBeats = lengthBars * beatsPerBar;
  const rng = makeRng("chord", opts.seed);
  const changeBars = 4;
  const events: NoteEvent[] = [];
  let lastVoicing: number[] | null = null;
  for (let bar = 0; bar < lengthBars; bar += changeBars) {
    // sanftes Voice Leading: naechste Voicing-Startstufe nur um 0-1 verschoben
    const startDegree = lastVoicing ? Math.round(randRange(rng, -1, 1)) : 0;
    const voicing = quartalVoicing(opts.key, startDegree, 4);
    lastVoicing = voicing;
    const duration = Math.min(changeBars, lengthBars - bar) * beatsPerBar;
    for (const note of voicing) {
      events.push({ startBeat: bar * beatsPerBar, durationBeats: duration * 0.97, note, velocity: 0.45 + randRange(rng, -0.05, 0.05) });
    }
  }
  return { role: "chord", lengthBeats, events };
}

function stress(opts: PhraseOptions): Phrase {
  const beatsPerBar = opts.beatsPerBar ?? 4;
  const lengthBars = opts.lengthBars ?? 4;
  const lengthBeats = lengthBars * beatsPerBar;
  const rng = makeRng("stress", opts.seed);
  const events: NoteEvent[] = [];
  const stepBeats = 0.125; // 32tel: schnelle Repetition
  const totalSteps = Math.floor(lengthBeats / stepBeats);
  for (let s = 0; s < totalSteps; s++) {
    // Extremlagen + hohe Polyphonie: mehrere gleichzeitige Noten in weiten Registern
    const voices = 1 + Math.floor(randRange(rng, 0, 4));
    for (let v = 0; v < voices; v++) {
      events.push({
        startBeat: s * stepBeats,
        durationBeats: stepBeats * 0.9,
        note: degreeToMidi(opts.key, Math.floor(randRange(rng, -14, 21))),
        velocity: 0.5 + randRange(rng, -0.2, 0.3),
      });
    }
  }
  return { role: "stress", lengthBeats, events };
}

const GENERATORS: Partial<Record<Role, (opts: PhraseOptions) => Phrase>> = {
  drone, pad, bass, melody, arp, rhythm, pluck, bell, fx, chord, stress,
};

export function generatePhrase(role: Role, opts: PhraseOptions): Phrase {
  const gen = GENERATORS[role];
  if (!gen) return pad(opts); // Fallback fuer Rollen ohne eigenen Phrasentyp (synth, texture)
  return gen(opts);
}

export const PHRASE_ROLES: Role[] = ["drone", "pad", "bass", "melody", "arp", "rhythm", "pluck", "bell", "fx", "chord", "stress"];
