// Mehrspur-Arrangement im Ableton-Stil: Tracks halten ein Instrument (Preset)
// und Clips (aufgenommene MIDI-Notendaten). Reiner UI-/Datenstate; die Audio-
// Graphen leben in audio/TrackAudio.ts (ein eigener PresetLoader+FxChain je Track).
import { create } from "zustand";
import type { NoteEvent } from "../midi/phrases";
import { AudioController } from "../audio/AudioController";
import { useUiStore } from "./uiStore";

export interface Clip {
  id: string;
  name: string;
  slotIdx?: number;
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
  recordingSlot: { trackId: string; slotIdx: number } | null;

  selectedTrack(): Track | undefined;

  addTrack(): void;
  removeTrack(id: string): void;
  selectTrack(id: string): void;
  renameTrack(id: string, name: string): void;
  setTrackPreset(id: string, presetId: string): void;
  toggleMute(id: string): void;
  toggleArm(id: string): void;

  startRecording(trackId: string, slotIdx: number): void;
  stopRecording(trackId: string): void;

  addClip(trackId: string, clip: Clip): void;
  removeClip(trackId: string, clipId: string): void;
  setActiveClip(trackId: string, clipId: string | null): void;
  updateClipNotes(trackId: string, clipId: string, events: NoteEvent[]): void;
}

export const useTracksStore = create<TracksState>((set, get) => ({
  tracks: [makeTrack("Track 1"), makeTrack("Track 2"), makeTrack("Track 3"), makeTrack("Track 4")],
  selectedTrackId: "",
  recordingSlot: null,

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
      if (selectedTrackId) {
        useUiStore.getState().setSelection({ kind: "track", trackIds: [selectedTrackId], anchorId: selectedTrackId });
      } else {
        useUiStore.getState().clearSelection();
      }
      return { tracks, selectedTrackId };
    });
  },

  selectTrack(id) {
    set({ selectedTrackId: id });
    useUiStore.getState().setSelection({ kind: "track", trackIds: [id], anchorId: id });
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

  startRecording(trackId, slotIdx) {
    AudioController.startRecording(trackId);
    set({ recordingSlot: { trackId, slotIdx } });
  },

  stopRecording(trackId) {
    const { recordingSlot } = get();
    const clip = AudioController.stopRecording();
    set({ recordingSlot: null });

    if (recordingSlot && recordingSlot.trackId === trackId) {
      const slotIdx = recordingSlot.slotIdx;
      const finalClip: Clip = clip ?? {
        id: makeId("clip"),
        name: `Clip ${slotIdx}`,
        slotIdx,
        events: [],
        lengthBeats: 4,
      };
      finalClip.slotIdx = slotIdx;
      if (!finalClip.name) finalClip.name = `Clip ${slotIdx}`;

      get().addClip(trackId, finalClip);
      AudioController.playClipOnTrack(trackId, finalClip);
    }
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

  updateClipNotes(trackId, clipId, events) {
    set((s) => {
      const nextTracks = s.tracks.map((t) => {
        if (t.id !== trackId) return t;
        const nextClips = t.clips.map((c) => {
          if (c.id !== clipId) return c;
          const updated = { ...c, events };
          if (t.activeClipId === clipId) {
            AudioController.playClipOnTrack(trackId, updated);
          }
          return updated;
        });
        return { ...t, clips: nextClips };
      });
      return { tracks: nextTracks };
    });
  },
}));

useTracksStore.setState((s) => {
  const selectedTrackId = s.tracks[0].id;
  useUiStore.getState().setSelection({ kind: "track", trackIds: [selectedTrackId], anchorId: selectedTrackId });
  return { selectedTrackId };
});

export function newClipId(): string {
  return makeId("clip");
}
