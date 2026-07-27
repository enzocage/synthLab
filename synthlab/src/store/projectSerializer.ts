// Song-Projekt-Serializer: Speichert & Laedt den kompletten Projektstand (Tracks, Instrumente, Presets, Parameter, FX, Clips & MIDI-Noten) als .json
// Unterstuetzt direktes Speichern auf Festplatte ueber die File System Access API (showSaveFilePicker)
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

function buildProjectData(songName: string): SynthLabProjectFile {
  const tracks = useTracksStore.getState().tracks;
  const tempo = useRuntimeStore.getState().tempo;
  const bank = useSessionStore.getState().bank;

  return {
    version: "1.0",
    name: songName,
    savedAt: new Date().toISOString(),
    tempo,
    tracks: tracks.map((t) => {
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
}

/** Speichert das Projekt direkt auf der Festplatte ueber den nativen Windows/OS-Dateidialog */
export async function saveSongToHardDrive(songName = "Mein_SynthLab_Song"): Promise<void> {
  const projectData = buildProjectData(songName);
  const jsonString = JSON.stringify(projectData, null, 2);
  const safeFilename = songName.trim().replace(/[^a-zA-Z0-9_-]/g, "_");

  // Native Windows / OS Save File Picker (File System Access API)
  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: `${safeFilename}.synthlab.json`,
        types: [
          {
            description: "SynthLab Song-Projekt (*.synthlab.json)",
            accept: { "application/json": [".json", ".synthlab.json"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(jsonString);
      await writable.close();
      useUiStore.getState().setStatusMessage(`💾 Song-Projekt "${songName}" direkt auf Festplatte gespeichert!`);
      return;
    } catch (err: any) {
      if (err.name === "AbortError") return; // Vom Benutzer abgebrochen
    }
  }

  // Fallback Download, falls File System Access API nicht unterstuetzt wird
  saveSongProjectJson(songName);
}

/** Standard-Download der .json Datei */
export function saveSongProjectJson(songName = "Mein_SynthLab_Song"): void {
  const projectData = buildProjectData(songName);
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

  useUiStore.getState().setStatusMessage(`💾 Song-Projekt "${songName}" als .json heruntergeladen`);
}

export async function loadSongProjectJson(file: File): Promise<void> {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as SynthLabProjectFile;

    if (!data.version || !Array.isArray(data.tracks)) {
      throw new Error("Ungültiges SynthLab Project Format");
    }

    if (data.tempo) {
      useRuntimeStore.getState().setTempo(data.tempo);
      AudioController.setTempo(data.tempo);
    }

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

      if (trackData.preset) {
        AudioController.loadPresetOnTrack(newTrack.id, trackData.preset);
      }

      AudioController.setTrackMuted(newTrack.id, newTrack.muted);

      if (newTrack.activeClipId) {
        const activeClip = newTrack.clips.find((c) => c.id === newTrack.activeClipId);
        if (activeClip) {
          AudioController.playClipOnTrack(newTrack.id, activeClip);
        }
      }
    }

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
