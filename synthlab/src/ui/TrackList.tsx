// Mehrspur-Ansicht im Ableton-Stil: eine Zeile pro Track mit Instrument-Anzeige,
// Mute/Arm/Record und Clip-Lane. Klick auf eine Zeile waehlt den Track aus -
// PresetBrowser/MacroPanel/FxRack editieren dann dessen Instrument.
import { useState } from "react";
import { useTracksStore } from "../store/tracksStore";
import { getEngine } from "../audio/engines/registry";
import { AudioController } from "../audio/AudioController";
import type { Preset } from "../presets/schema";

interface Props {
  getPresetById(id: string): Preset | null;
}

export function TrackList({ getPresetById }: Props) {
  const tracks = useTracksStore((s) => s.tracks);
  const selectedTrackId = useTracksStore((s) => s.selectedTrackId);
  const selectTrack = useTracksStore((s) => s.selectTrack);
  const renameTrack = useTracksStore((s) => s.renameTrack);
  const toggleMute = useTracksStore((s) => s.toggleMute);
  const toggleArm = useTracksStore((s) => s.toggleArm);
  const addTrack = useTracksStore((s) => s.addTrack);
  const removeTrack = useTracksStore((s) => s.removeTrack);
  const setActiveClip = useTracksStore((s) => s.setActiveClip);
  const addClip = useTracksStore((s) => s.addClip);
  const [recordingTrackId, setRecordingTrackId] = useState<string | null>(null);
  const [playingClipTrackId, setPlayingClipTrackId] = useState<string | null>(null);

  async function onRowClick(trackId: string) {
    selectTrack(trackId);
    AudioController.setSelectedTrack(trackId);
    await AudioController.resume();
  }

  async function toggleRecord(trackId: string) {
    await AudioController.resume();
    AudioController.setSelectedTrack(trackId);
    selectTrack(trackId);
    if (recordingTrackId === trackId) {
      const clip = AudioController.stopRecording();
      setRecordingTrackId(null);
      if (clip) addClip(trackId, clip);
    } else {
      if (recordingTrackId) AudioController.stopRecording();
      AudioController.startRecording(trackId);
      setRecordingTrackId(trackId);
    }
  }

  function toggleClipPlayback(trackId: string, clip: Parameters<typeof AudioController.playClipOnTrack>[1]) {
    if (playingClipTrackId === trackId) {
      AudioController.stopClipOnTrack(trackId);
      setPlayingClipTrackId(null);
    } else {
      AudioController.playClipOnTrack(trackId, clip);
      setPlayingClipTrackId(trackId);
    }
  }

  return (
    <div className="track-list">
      {tracks.map((track) => {
        const preset = track.presetId ? getPresetById(track.presetId) : null;
        const engineName = preset ? getEngine(preset.engine).name : "–";
        const isSelected = track.id === selectedTrackId;
        return (
          <div key={track.id} className={`track-row${isSelected ? " track-row--selected" : ""}`} onClick={() => onRowClick(track.id)}>
            <input
              className="track-row__name"
              value={track.name}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => renameTrack(track.id, e.target.value)}
            />
            <div className="track-row__instrument">
              <span className="track-row__engine">{engineName}</span>
              <span className="track-row__preset">{preset?.name ?? "kein Preset"}</span>
            </div>
            <div className="track-row__buttons" onClick={(e) => e.stopPropagation()}>
              <button className={track.muted ? "track-btn track-btn--active" : "track-btn"} onClick={() => toggleMute(track.id)} title="Mute">
                M
              </button>
              <button className={track.armed ? "track-btn track-btn--active" : "track-btn"} onClick={() => toggleArm(track.id)} title="Arm">
                A
              </button>
              <button
                className={recordingTrackId === track.id ? "track-btn track-btn--rec" : "track-btn"}
                onClick={() => toggleRecord(track.id)}
                title="Aufnahme starten/stoppen"
              >
                ● Rec
              </button>
              <button onClick={() => removeTrack(track.id)} title="Spur entfernen">
                ✕
              </button>
            </div>
            <div className="track-row__clips" onClick={(e) => e.stopPropagation()}>
              {track.clips.length === 0 && <span className="track-row__no-clips">keine Clips</span>}
              {track.clips.map((clip) => (
                <button
                  key={clip.id}
                  className={`clip-chip${track.activeClipId === clip.id ? " clip-chip--active" : ""}`}
                  onClick={() => {
                    setActiveClip(track.id, clip.id);
                    toggleClipPlayback(track.id, clip);
                  }}
                >
                  {playingClipTrackId === track.id && track.activeClipId === clip.id ? "■" : "▶"} {clip.name} ({clip.events.length})
                </button>
              ))}
            </div>
          </div>
        );
      })}
      <button className="track-list__add" onClick={addTrack}>
        + Spur
      </button>
    </div>
  );
}
