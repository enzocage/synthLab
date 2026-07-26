// 12 Originäre Audition-Profile für SID Lab (plan1.md §7.1)
import type { NoteSequence } from "./phrases";

export type SidAuditionProfileId =
  | "BASS_LOCK"
  | "BASS_DRONE"
  | "ARP_HELD"
  | "ARP_EXTERNAL"
  | "MELODY_STACC"
  | "MELODY_LEGATO"
  | "CHORD_ALLOC"
  | "DRONE_EVOLVE"
  | "RHYTHM_GRID"
  | "FX_ONESHOT"
  | "SYNC_RING_PAIR"
  | "RANGE_VELOCITY";

export interface SidAuditionProfile {
  id: SidAuditionProfileId;
  name: string;
  durationSeconds: number;
  sequence: NoteSequence;
}

export const SID_AUDITION_PROFILES: Record<SidAuditionProfileId, SidAuditionProfile> = {
  BASS_LOCK: {
    id: "BASS_LOCK",
    name: "Bass Lock (2 Takte @ 88 BPM)",
    durationSeconds: 5.4,
    sequence: {
      lengthBeats: 8,
      events: [
        { startBeat: 0, durationBeats: 0.8, note: 36, velocity: 0.8 }, // C1
        { startBeat: 1.5, durationBeats: 0.8, note: 43, velocity: 0.75 }, // G1
        { startBeat: 3.0, durationBeats: 0.8, note: 46, velocity: 0.75 }, // Bb1
        { startBeat: 4.5, durationBeats: 1.5, note: 48, velocity: 0.85 }, // C2
      ],
    },
  },
  BASS_DRONE: {
    id: "BASS_DRONE",
    name: "Bass Drone (8s C1, G1)",
    durationSeconds: 8.0,
    sequence: {
      lengthBeats: 12,
      events: [
        { startBeat: 0, durationBeats: 6, note: 36, velocity: 0.7, hold: true },
        { startBeat: 6, durationBeats: 6, note: 43, velocity: 0.7, hold: true },
      ],
    },
  },
  ARP_HELD: {
    id: "ARP_HELD",
    name: "Arp Held (Gehaltenes C3)",
    durationSeconds: 4.0,
    sequence: {
      lengthBeats: 6,
      events: [{ startBeat: 0, durationBeats: 6, note: 60, velocity: 0.8, hold: true }],
    },
  },
  ARP_EXTERNAL: {
    id: "ARP_EXTERNAL",
    name: "Arp External (Cm add9 16th @ 96 BPM)",
    durationSeconds: 5.0,
    sequence: {
      lengthBeats: 8,
      events: [
        { startBeat: 0.0, durationBeats: 0.2, note: 60, velocity: 0.8 },
        { startBeat: 0.25, durationBeats: 0.2, note: 63, velocity: 0.75 },
        { startBeat: 0.5, durationBeats: 0.2, note: 67, velocity: 0.75 },
        { startBeat: 0.75, durationBeats: 0.2, note: 62, velocity: 0.75 },
        { startBeat: 1.0, durationBeats: 0.2, note: 72, velocity: 0.8 },
      ],
    },
  },
  MELODY_STACC: {
    id: "MELODY_STACC",
    name: "Melody Staccato (4-taktig originär)",
    durationSeconds: 6.0,
    sequence: {
      lengthBeats: 8,
      events: [
        { startBeat: 0, durationBeats: 0.4, note: 72, velocity: 0.9 },
        { startBeat: 1, durationBeats: 0.4, note: 75, velocity: 0.6 },
        { startBeat: 2, durationBeats: 0.4, note: 74, velocity: 0.8 },
        { startBeat: 3, durationBeats: 0.8, note: 79, velocity: 0.85 },
      ],
    },
  },
  MELODY_LEGATO: {
    id: "MELODY_LEGATO",
    name: "Melody Legato (Glide/Pitchbend)",
    durationSeconds: 5.0,
    sequence: {
      lengthBeats: 8,
      events: [
        { startBeat: 0, durationBeats: 2.2, note: 60, velocity: 0.8 },
        { startBeat: 2.0, durationBeats: 2.2, note: 62, velocity: 0.8 },
        { startBeat: 4.0, durationBeats: 2.2, note: 67, velocity: 0.85 },
      ],
    },
  },
  CHORD_ALLOC: {
    id: "CHORD_ALLOC",
    name: "Chord Alloc (Cm add9 -> Abmaj7)",
    durationSeconds: 8.0,
    sequence: {
      lengthBeats: 8,
      events: [
        { startBeat: 0, durationBeats: 3.8, note: 60, velocity: 0.7 },
        { startBeat: 0, durationBeats: 3.8, note: 63, velocity: 0.7 },
        { startBeat: 0, durationBeats: 3.8, note: 67, velocity: 0.7 },
        { startBeat: 4, durationBeats: 3.8, note: 56, velocity: 0.7 },
        { startBeat: 4, durationBeats: 3.8, note: 60, velocity: 0.7 },
        { startBeat: 4, durationBeats: 3.8, note: 63, velocity: 0.7 },
      ],
    },
  },
  DRONE_EVOLVE: {
    id: "DRONE_EVOLVE",
    name: "Drone Evolve (12s C2 Mod-Fahrt)",
    durationSeconds: 12.0,
    sequence: {
      lengthBeats: 16,
      events: [{ startBeat: 0, durationBeats: 16, note: 48, velocity: 0.75, hold: true }],
    },
  },
  RHYTHM_GRID: {
    id: "RHYTHM_GRID",
    name: "Rhythm Grid (Kick, Snare, HiHat)",
    durationSeconds: 4.8,
    sequence: {
      lengthBeats: 8,
      events: [
        { startBeat: 0, durationBeats: 0.3, note: 36, velocity: 0.9 }, // Kick
        { startBeat: 1, durationBeats: 0.3, note: 42, velocity: 0.6 }, // HiHat
        { startBeat: 2, durationBeats: 0.3, note: 38, velocity: 0.85 }, // Snare
        { startBeat: 3, durationBeats: 0.3, note: 42, velocity: 0.6 },
      ],
    },
  },
  FX_ONESHOT: {
    id: "FX_ONESHOT",
    name: "FX Oneshot (C2/C3/C4/C5 3 Velocity)",
    durationSeconds: 4.0,
    sequence: {
      lengthBeats: 8,
      events: [
        { startBeat: 0, durationBeats: 0.5, note: 48, velocity: 0.3 },
        { startBeat: 1.5, durationBeats: 0.5, note: 60, velocity: 0.6 },
        { startBeat: 3.0, durationBeats: 0.5, note: 72, velocity: 0.9 },
      ],
    },
  },
  SYNC_RING_PAIR: {
    id: "SYNC_RING_PAIR",
    name: "Sync Ring Pair (Monophon C2-G2-C3)",
    durationSeconds: 6.0,
    sequence: {
      lengthBeats: 8,
      events: [
        { startBeat: 0, durationBeats: 1.8, note: 48, velocity: 0.8 },
        { startBeat: 2.0, durationBeats: 1.8, note: 55, velocity: 0.8 },
        { startBeat: 4.0, durationBeats: 1.8, note: 60, velocity: 0.8 },
      ],
    },
  },
  RANGE_VELOCITY: {
    id: "RANGE_VELOCITY",
    name: "Range Velocity Test (C1/C3/C5 vel 40/80/120)",
    durationSeconds: 5.0,
    sequence: {
      lengthBeats: 8,
      events: [
        { startBeat: 0, durationBeats: 1, note: 36, velocity: 0.3 },
        { startBeat: 2, durationBeats: 1, note: 60, velocity: 0.6 },
        { startBeat: 4, durationBeats: 1, note: 84, velocity: 0.95 },
      ],
    },
  },
};
