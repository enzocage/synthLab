// Song-Projekt-Serializer: Speichert & Laedt den kompletten Projektstand (Tracks, Instrumente, Presets, Parameter, FX, Clips & MIDI-Noten) als .json
import { useTracksStore, type Track, type Clip } from "./tracksStore";
import { useRuntimeStore } from "./runtimeStore";
import { useSessionStore } from "./sessionStore";
import { useUiStore } from "./uiStore";
import { AudioController } from "../audio/AudioController";
import type { Preset } from "../presets/schema";

export interface SynthLabProjectFile {
  version: "1.0";
  name: string;
  savedAt: string;
  tempo: number;
  tracks: {
    id: string;
    name: string;
    presetId: string | null;
    preset?: Preset | null;
    muted: boolean;
    armed: boolean;
    activeClipId: string | null;
    clips: Clip[];
  }[];
}

export function saveSongProjectJson(songName = "Mein_SynthLab_Song"): void {
  const tracks = useTracksStore.getState().tracks;
  const tempo = useRuntimeStore.getState().tempo;
  const bank = useSessionStore.getState().bank;

  const projectData: SynthLabProjectFile = {
    version: "1.0",
    name: songName,
    savedAt: new Date().toISOString(),
    tempo,
    tracks: tracks.map((t) => {
      // Find track's current loaded preset details
      let currentPreset: Preset | null = null;
      if (t.presetId) {
        currentPreset = bank.find((p) => p.id === t.presetId) ?? null;
      }
      if (!currentPreset) {
        currentPreset = AudioController.getTrackPreset(t.id);
      }

      return {
        id: t.id,
        name: t.name,
        presetId: t.presetId,
        preset: currentPreset,
        muted: t.muted,
        armed: t.armed,
        activeClipId: t.activeClipId,
        clips: t.clips,
      };
    }),
  };

  const jsonString = JSON.stringify(projectData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const safeFilename = songName.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeFilename}.synthlab.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  useUiStore.getState().setStatusMessage(`💾 Song-Projekt "${songName}" erfolgreich als .json heruntergeladen`);
}

export async function loadSongProjectJson(file: File): Promise<void> {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as SynthLabProjectFile;

    if (!data.version || !Array.isArray(data.tracks)) {
      throw new Error("Ungültiges SynthLab Project Format");
    }

    // 1. Set Master Tempo
    if (data.tempo) {
      useRuntimeStore.getState().setTempo(data.tempo);
      AudioController.setTempo(data.tempo);
    }

    // 2. Reconstruct Tracks & Load Audio
    const reconstructedTracks: Track[] = [];

    for (const trackData of data.tracks) {
      const newTrack: Track = {
        id: trackData.id,
        name: trackData.name,
        presetId: trackData.presetId,
        clips: trackData.clips || [],
        activeClipId: trackData.activeClipId,
        muted: trackData.muted ?? false,
        armed: trackData.armed ?? false,
      };
      reconstructedTracks.push(newTrack);

      // Load preset into audio controller for this track
      if (trackData.preset) {
        AudioController.loadPresetOnTrack(newTrack.id, trackData.preset);
      }

      AudioController.setTrackMuted(newTrack.id, newTrack.muted);

      // If active clip exists, launch playback on track
      if (newTrack.activeClipId) {
        const activeClip = newTrack.clips.find((c) => c.id === newTrack.activeClipId);
        if (activeClip) {
          AudioController.playClipOnTrack(newTrack.id, activeClip);
        }
      }
    }

    // Update Zustand Store
    const firstTrackId = reconstructedTracks[0]?.id ?? "";
    useTracksStore.setState({
      tracks: reconstructedTracks,
      selectedTrackId: firstTrackId,
      recordingSlot: null,
    });

    if (firstTrackId) {
      useUiStore.getState().setSelection({ kind: "track", trackIds: [firstTrackId], anchorId: firstTrackId });
    }

    const songName = data.name || file.name.replace(/\.json$/i, "");
    useUiStore.getState().setStatusMessage(`📂 Song-Projekt "${songName}" (${reconstructedTracks.length} Spuren) erfolgreich geladen`);
  } catch (err: any) {
    alert(`Fehler beim Laden der Song-Projektdatei: ${err.message || String(err)}`);
  }
}
