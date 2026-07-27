import React from "react";
import type { Clip } from "../store/tracksStore";

interface Props {
  clip: Clip;
  isPlaying?: boolean;
}

export const MidiPreviewCanvas: React.FC<Props> = ({ clip, isPlaying }) => {
  const events = clip.events || [];
  if (events.length === 0) {
    return (
      <div style={{ fontSize: 9, color: "#666", fontStyle: "italic", textAlign: "center", width: "100%" }}>
        (Keine Noten)
      </div>
    );
  }

  // Calculate min and max pitch to scale Y axis nicely
  let minNote = 127;
  let maxNote = 0;
  for (const ev of events) {
    if (ev.note < minNote) minNote = ev.note;
    if (ev.note > maxNote) maxNote = ev.note;
  }
  if (maxNote === minNote) {
    minNote = Math.max(0, minNote - 6);
    maxNote = Math.min(127, maxNote + 6);
  }
  const noteRange = Math.max(1, maxNote - minNote);
  const totalBeats = Math.max(1, clip.lengthBeats || 4);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 20,
        background: "#121110",
        borderRadius: 3,
        border: "1px solid #282624",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <svg width="100%" height="100%" style={{ display: "block" }}>
        {events.map((ev, i) => {
          const leftPct = (ev.startBeat / totalBeats) * 100;
          const widthPct = Math.max(1.5, (ev.durationBeats / totalBeats) * 100);
          const topPct = 100 - ((ev.note - minNote) / noteRange) * 80 - 15; // 15-95% padding

          return (
            <rect
              key={i}
              x={`${leftPct}%`}
              y={`${Math.max(5, Math.min(85, topPct))}%`}
              width={`${widthPct}%`}
              height="3"
              rx="1"
              fill={isPlaying ? "var(--color-playing, #4ad97a)" : "var(--color-accent, #fbad60)"}
              opacity={0.85}
            />
          );
        })}
      </svg>
    </div>
  );
};
