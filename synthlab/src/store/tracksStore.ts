// Mehrspur-Arrangement im Ableton-Stil: Tracks halten ein Instrument (Preset)
// und Clips (aufgenommene MIDI-Notendaten). Reiner UI-/Datenstate; die Audio-
// Graphen leben in audio/TrackAudio.ts (ein eigener PresetLoader+FxChain je Track).
import { create } from "zustand";
import type { NoteEvent } from "../midi/phrases";
import { AudioController } from "../audio/AudioController";

export interface Clip {
  id: string;
  name: string;
  events: NoteEvent[];
  lengthBeats: number;
}

export interface Track {
  id: string;
  name: string;
  presetId: string | null;
  clips: Clip[];
  activeClipId: string | null;
  muted: boolean;
  armed: boolean;
}

function makeId(prefix: string): string {
  return `${prefix}_${Math.floor(Math.random() * 1e9).toString(36)}`;
}

function makeTrack(name: string): Track {
  return { id: makeId("track"), name, presetId: null, clips: [], activeClipId: null, muted: false, armed: false };
}

interface TracksState {
  tracks: Track[];
  selectedTrackId: string;

  selectedTrack(): Track | undefined;

  addTrack(): void;
  removeTrack(id: string): void;
  selectTrack(id: string): void;
  renameTrack(id: string, name: string): void;
  setTrackPreset(id: string, presetId: string): void;
  toggleMute(id: string): void;
  toggleArm(id: string): void;

  addClip(trackId: string, clip: Clip): void;
  removeClip(trackId: string, clipId: string): void;
  setActiveClip(trackId: string, clipId: string | null): void;
}

export const useTracksStore = create<TracksState>((set, get) => ({
  tracks: [makeTrack("Track 1"), makeTrack("Track 2"), makeTrack("Track 3"), makeTrack("Track 4")],
  selectedTrackId: "",

  selectedTrack() {
    const { tracks, selectedTrackId } = get();
    return tracks.find((t) => t.id === selectedTrackId) ?? tracks[0];
  },

  addTrack() {
    set((s) => ({ tracks: [...s.tracks, makeTrack(`Track ${s.tracks.length + 1}`)] }));
  },

  removeTrack(id) {
    AudioController.removeTrackAudio(id);
    set((s) => {
      const tracks = s.tracks.filter((t) => t.id !== id);
      const selectedTrackId = s.selectedTrackId === id ? (tracks[0]?.id ?? "") : s.selectedTrackId;
      return { tracks, selectedTrackId };
    });
  },

  selectTrack(id) {
    set({ selectedTrackId: id });
  },

  renameTrack(id, name) {
    set((s) => ({ tracks: s.tracks.map((t) => (t.id === id ? { ...t, name } : t)) }));
  },

  setTrackPreset(id, presetId) {
    set((s) => ({ tracks: s.tracks.map((t) => (t.id === id ? { ...t, presetId } : t)) }));
  },

  toggleMute(id) {
    set((s) => {
      const nextTracks = s.tracks.map((t) => {
        if (t.id === id) {
          const nextMuted = !t.muted;
          AudioController.setTrackMuted(id, nextMuted);
          return { ...t, muted: nextMuted };
        }
        return t;
      });
      return { tracks: nextTracks };
    });
  },

  toggleArm(id) {
    set((s) => ({ tracks: s.tracks.map((t) => (t.id === id ? { ...t, armed: !t.armed } : { ...t, armed: false })) }));
  },

  addClip(trackId, clip) {
    set((s) => ({
      tracks: s.tracks.map((t) => (t.id === trackId ? { ...t, clips: [...t.clips, clip], activeClipId: clip.id } : t)),
    }));
  },

  removeClip(trackId, clipId) {
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === trackId
          ? { ...t, clips: t.clips.filter((c) => c.id !== clipId), activeClipId: t.activeClipId === clipId ? null : t.activeClipId }
          : t
      ),
    }));
  },

  setActiveClip(trackId, clipId) {
    set((s) => ({ tracks: s.tracks.map((t) => (t.id === trackId ? { ...t, activeClipId: clipId } : t)) }));
  },
}));

useTracksStore.setState((s) => ({ selectedTrackId: s.tracks[0].id }));

export function newClipId(): string {
  return makeId("clip");
}
