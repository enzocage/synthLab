import React from "react";
import { useTracksStore } from "../store/tracksStore";
import { useSessionStore } from "../store/sessionStore";
import { AudioController } from "../audio/AudioController";
import { MidiPreviewCanvas } from "./MidiPreviewCanvas";

interface Props {
  getPresetById(id: string): any;
}

export const SessionView: React.FC<Props> = ({ getPresetById }) => {
  const tracks = useTracksStore((s) => s.tracks);
  const selectedTrackId = useTracksStore((s) => s.selectedTrackId);
  const selectTrack = useTracksStore((s) => s.selectTrack);
  const toggleMute = useTracksStore((s) => s.toggleMute);
  const toggleArm = useTracksStore((s) => s.toggleArm);
  const addTrack = useTracksStore((s) => s.addTrack);
  const removeTrack = useTracksStore((s) => s.removeTrack);

  const recordingSlot = useTracksStore((s) => s.recordingSlot);
  const startRecording = useTracksStore((s) => s.startRecording);
  const stopRecording = useTracksStore((s) => s.stopRecording);
  const setActiveClip = useTracksStore((s) => s.setActiveClip);

  const currentPreset = useSessionStore((s) => s.currentPreset());

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        overflowX: "auto",
        background: "var(--color-surface-1, #181817)",
        padding: 10,
        gap: 10,
        alignItems: "stretch",
      }}
    >
      {tracks.map((track) => {
        const isSelected = track.id === selectedTrackId;
        const preset = track.presetId ? getPresetById(track.presetId) : isSelected ? currentPreset : null;

        return (
          <div
            key={track.id}
            onClick={() => selectTrack(track.id)}
            style={{
              width: 210,
              minWidth: 210,
              display: "flex",
              flexDirection: "column",
              background: isSelected ? "var(--color-surface-3, #242a36)" : "var(--color-surface-2, #21201f)",
              border: isSelected ? "2px solid var(--color-accent, #fbad60)" : "1px solid var(--color-border-subtle, #2c2b29)",
              borderRadius: 6,
              overflow: "hidden",
              cursor: "pointer",
              boxShadow: isSelected ? "0 0 12px rgba(251, 173, 96, 0.15)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            {/* Track Header */}
            <div
              style={{
                padding: "8px 12px",
                background: isSelected ? "rgba(251, 173, 96, 0.12)" : "rgba(0,0,0,0.3)",
                borderBottom: "1px solid var(--color-border-subtle, #2c2b29)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: isSelected ? "#fff" : "#ddd" }}>{track.name}</span>
                {tracks.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTrack(track.id);
                    }}
                    style={{ background: "none", border: "none", color: "#888", padding: "0 4px", fontSize: 14, cursor: "pointer" }}
                    title="Spur entfernen"
                  >
                    ×
                  </button>
                )}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--color-accent, #fbad60)",
                  marginTop: 3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={preset ? preset.name : "Kein Instrument"}
              >
                {preset ? preset.name : "Kein Instrument"}
              </div>
            </div>

            {/* Clip Slots Grid */}
            <div style={{ flex: 1, padding: 8, display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" }}>
              {[1, 2, 3, 4].map((slotIdx) => {
                const clip = track.clips.find((c) => c.slotIdx === slotIdx) || track.clips[slotIdx - 1];
                const isSlotRecording = recordingSlot?.trackId === track.id && recordingSlot?.slotIdx === slotIdx;
                const isClipPlaying = track.activeClipId === clip?.id && !isSlotRecording;

                return (
                  <div
                    key={slotIdx}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectTrack(track.id);

                      if (isSlotRecording) {
                        // Stop recording and finish clip
                        stopRecording(track.id);
                      } else if (clip) {
                        // Play or stop clip
                        if (isClipPlaying) {
                          AudioController.stopClipOnTrack(track.id);
                          setActiveClip(track.id, null);
                        } else {
                          AudioController.playClipOnTrack(track.id, clip);
                          setActiveClip(track.id, clip.id);
                        }
                      } else {
                        // Empty slot clicked
                        if (track.armed) {
                          startRecording(track.id, slotIdx);
                        } else {
                          toggleArm(track.id);
                          startRecording(track.id, slotIdx);
                        }
                      }
                    }}
                    style={{
                      height: 52,
                      borderRadius: 5,
                      padding: "6px 8px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxSizing: "border-box",
                      background: isSlotRecording
                        ? "rgba(231, 76, 60, 0.3)"
                        : isClipPlaying
                        ? "rgba(74, 217, 122, 0.2)"
                        : clip
                        ? "rgba(217, 146, 74, 0.12)"
                        : track.armed
                        ? "rgba(231, 76, 60, 0.08)"
                        : "rgba(0,0,0,0.2)",
                      border: isSlotRecording
                        ? "1px solid #e74c3c"
                        : isClipPlaying
                        ? "1px solid var(--color-playing, #4ad97a)"
                        : clip
                        ? "1px solid var(--color-accent, #fbad60)"
                        : track.armed
                        ? "1px dashed rgba(231, 76, 60, 0.6)"
                        : "1px dashed var(--color-border-subtle, #2c2b29)",
                      cursor: "pointer",
                      transition: "all 0.1s ease",
                    }}
                  >
                    {/* Top Row: Clip Title & Play/Record Action Button */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
                      <span
                        style={{
                          fontWeight: isClipPlaying || isSlotRecording ? 700 : 500,
                          color: isSlotRecording
                            ? "#e74c3c"
                            : isClipPlaying
                            ? "#4ad97a"
                            : clip
                            ? "#eee"
                            : track.armed
                            ? "#e74c3c"
                            : "#666",
                        }}
                      >
                        {isSlotRecording
                          ? "● REC..."
                          : clip
                          ? clip.name
                          : track.armed
                          ? `● Slot ${slotIdx}`
                          : `Slot ${slotIdx}`}
                      </span>

                      <span style={{ fontSize: 10, fontFamily: "monospace" }}>
                        {isSlotRecording ? (
                          <span style={{ color: "#e74c3c", fontWeight: 700 }}>● REC</span>
                        ) : isClipPlaying ? (
                          <span style={{ color: "#4ad97a", fontWeight: 700 }}>■ STOP</span>
                        ) : clip ? (
                          <span style={{ color: "var(--color-accent, #fbad60)", fontWeight: 700 }}>▶ PLAY</span>
                        ) : track.armed ? (
                          <span style={{ color: "#e74c3c", fontWeight: 700 }}>● REC</span>
                        ) : (
                          <span style={{ color: "#555" }}>empty</span>
                        )}
                      </span>
                    </div>

                    {/* Middle: Live MIDI Notes Visual Preview or Status */}
                    {isSlotRecording ? (
                      <div style={{ fontSize: 10, color: "#e74c3c", fontStyle: "italic", textAlign: "center" }}>
                        MIDI Noten aufnehmen...
                      </div>
                    ) : clip ? (
                      <MidiPreviewCanvas clip={clip} isPlaying={isClipPlaying} />
                    ) : (
                      <div style={{ fontSize: 9, color: track.armed ? "rgba(231,76,60,0.7)" : "#444", textAlign: "center" }}>
                        {track.armed ? "Klick zum Aufnehmen" : "Klick zum Auswählen"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Track Control Buttons (Mute / Arm) */}
            <div
              style={{
                display: "flex",
                gap: 6,
                padding: 8,
                borderTop: "1px solid var(--color-border-subtle, #2c2b29)",
                background: "rgba(0,0,0,0.25)",
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute(track.id);
                }}
                style={{
                  flex: 1,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "5px 0",
                  borderRadius: 4,
                  background: track.muted ? "#d35400" : "#22201e",
                  borderColor: track.muted ? "#e67e22" : "#3d3a36",
                  color: track.muted ? "#fff" : "#aaa",
                  cursor: "pointer",
                }}
              >
                Mute
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleArm(track.id);
                }}
                style={{
                  flex: 1,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "5px 0",
                  borderRadius: 4,
                  background: track.armed ? "#c0392b" : "#22201e",
                  borderColor: track.armed ? "#e74c3c" : "#3d3a36",
                  color: track.armed ? "#fff" : "#aaa",
                  cursor: "pointer",
                  boxShadow: track.armed ? "0 0 8px rgba(231, 76, 60, 0.4)" : "none",
                }}
              >
                Arm
              </button>
            </div>
          </div>
        );
      })}

      {/* Add Track Button */}
      <button
        type="button"
        onClick={addTrack}
        style={{
          width: 54,
          minWidth: 54,
          borderRadius: 6,
          background: "rgba(0,0,0,0.15)",
          border: "1px dashed var(--color-border, #3c3a38)",
          color: "#777",
          fontSize: 22,
          fontWeight: 300,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
        }}
        title="Neue Spur hinzufügen"
      >
        +
      </button>
    </div>
  );
};
