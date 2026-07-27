import React from "react";
import { useTracksStore } from "../store/tracksStore";
import { useSessionStore } from "../store/sessionStore";
import { AudioController } from "../audio/AudioController";

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

  const currentPreset = useSessionStore((s) => s.currentPreset());

  return (
    <div style={{ display: "flex", flex: 1, overflowX: "auto", background: "var(--color-surface-1, #181817)", padding: 8, gap: 8 }}>
      {tracks.map((track) => {
        const isSelected = track.id === selectedTrackId;
        const preset = track.presetId ? getPresetById(track.presetId) : isSelected ? currentPreset : null;

        return (
          <div
            key={track.id}
            onClick={() => selectTrack(track.id)}
            style={{
              width: 180,
              minWidth: 180,
              display: "flex",
              flexDirection: "column",
              background: isSelected ? "var(--color-surface-3, #242a36)" : "var(--color-surface-2, #21201f)",
              border: isSelected ? "2px solid var(--color-accent, #d9924a)" : "1px solid var(--color-border-subtle, #2c2b29)",
              borderRadius: 6,
              overflow: "hidden",
              cursor: "pointer",
            }}
          >
            {/* Track Header */}
            <div style={{ padding: "8px 10px", background: "rgba(0,0,0,0.2)", borderBottom: "1px solid var(--color-border-subtle)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "bold", fontSize: 13, color: "var(--color-text-primary)" }}>{track.name}</span>
                {tracks.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTrack(track.id);
                    }}
                    style={{ background: "none", border: "none", color: "#888", padding: 2 }}
                  >
                    ×
                  </button>
                )}
              </div>
              <div style={{ fontSize: 11, color: "var(--color-accent)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {preset ? preset.name : "Kein Instrument"}
              </div>
            </div>

            {/* Clip Slots Grid */}
            <div style={{ flex: 1, padding: 6, display: "flex", flexDirection: "column", gap: 4 }}>
              {[1, 2, 3, 4].map((slotIdx) => {
                const clip = track.clips[slotIdx - 1];
                const isClipPlaying = track.activeClipId === clip?.id;

                return (
                  <div
                    key={slotIdx}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (clip) {
                        if (isClipPlaying) {
                          AudioController.stopClipOnTrack(track.id);
                          useTracksStore.getState().setActiveClip(track.id, null);
                        } else {
                          AudioController.playClipOnTrack(track.id, clip);
                          useTracksStore.getState().setActiveClip(track.id, clip.id);
                        }
                      }
                    }}
                    style={{
                      height: 36,
                      borderRadius: 4,
                      background: isClipPlaying
                        ? "rgba(74, 217, 122, 0.25)"
                        : clip
                        ? "rgba(217, 146, 74, 0.15)"
                        : "rgba(0,0,0,0.15)",
                      border: isClipPlaying
                        ? "1px solid var(--color-playing, #4ad97a)"
                        : clip
                        ? "1px solid var(--color-accent, #d9924a)"
                        : "1px dashed var(--color-border-subtle, #2c2b29)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0 8px",
                      fontSize: 11,
                      color: isClipPlaying ? "#4ad97a" : clip ? "#ebeae9" : "#555",
                    }}
                  >
                    <span>{clip ? clip.name : `Slot ${slotIdx}`}</span>
                    {clip && <span>{isClipPlaying ? "■" : "▶"}</span>}
                  </div>
                );
              })}
            </div>

            {/* Track Control Buttons (Mute / Arm) */}
            <div style={{ display: "flex", gap: 4, padding: 6, borderTop: "1px solid var(--color-border-subtle)", background: "rgba(0,0,0,0.15)" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute(track.id);
                }}
                style={{
                  flex: 1,
                  fontSize: 11,
                  padding: "4px 0",
                  background: track.muted ? "rgba(230, 126, 34, 0.3)" : "#1f1e1d",
                  borderColor: track.muted ? "#e67e22" : "#33312f",
                  color: track.muted ? "#e67e22" : "#aaa",
                }}
              >
                Mute
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleArm(track.id);
                }}
                style={{
                  flex: 1,
                  fontSize: 11,
                  padding: "4px 0",
                  background: track.armed ? "rgba(231, 76, 60, 0.3)" : "#1f1e1d",
                  borderColor: track.armed ? "#e74c3c" : "#33312f",
                  color: track.armed ? "#e74c3c" : "#aaa",
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
        onClick={addTrack}
        style={{
          width: 60,
          minWidth: 60,
          height: "100%",
          borderRadius: 6,
          background: "transparent",
          border: "1px dashed var(--color-border)",
          color: "#888",
          fontSize: 20,
          cursor: "pointer",
        }}
      >
        +
      </button>
    </div>
  );
};
