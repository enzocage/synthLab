import React, { useState } from "react";
import { ArpPanel } from "./ArpPanel";
import { PianoKeyboard } from "./PianoKeyboard";
import { PianoRollEditor } from "./PianoRollEditor";
import { AudioController } from "../audio/AudioController";

interface Props {
  arpSettings: any;
  onArpChange(patch: any): void;
}

export const ClipView: React.FC<Props> = ({ arpSettings, onArpChange }) => {
  const [subTab, setSubTab] = useState<"pianoroll" | "arp" | "keyboard">("pianoroll");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", padding: 10, boxSizing: "border-box", gap: 10 }}>
      {/* Clip & Perform Sub-Tab Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setSubTab("pianoroll")}
          style={{
            background: subTab === "pianoroll" ? "var(--color-accent, #fbad60)" : "#22201e",
            color: subTab === "pianoroll" ? "#000" : "#ccc",
            border: "none",
            borderRadius: 4,
            padding: "5px 12px",
            fontWeight: 700,
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          🎹 Piano Roll Editor
        </button>

        <button
          type="button"
          onClick={() => setSubTab("arp")}
          style={{
            background: subTab === "arp" ? "var(--color-accent, #fbad60)" : "#22201e",
            color: subTab === "arp" ? "#000" : "#ccc",
            border: "none",
            borderRadius: 4,
            padding: "5px 12px",
            fontWeight: 700,
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          🔂 Arpeggiator
        </button>

        <button
          type="button"
          onClick={() => setSubTab("keyboard")}
          style={{
            background: subTab === "keyboard" ? "var(--color-accent, #fbad60)" : "#22201e",
            color: subTab === "keyboard" ? "#000" : "#ccc",
            border: "none",
            borderRadius: 4,
            padding: "5px 12px",
            fontWeight: 700,
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          🎹 Live-Klaviatur
        </button>
      </div>

      {/* Main Active Sub-Tab View */}
      <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
        {subTab === "pianoroll" && <PianoRollEditor />}

        {subTab === "arp" && (
          <div style={{ background: "var(--color-surface-2, #21201f)", border: "1px solid var(--color-border, #3c3a38)", borderRadius: 6, padding: 12, height: "100%", overflowY: "auto" }}>
            <div style={{ fontWeight: "bold", fontSize: 13, color: "var(--color-accent, #fbad60)", marginBottom: 10 }}>
              ARPEGGIATOR & PATTERN ENGINE
            </div>
            <ArpPanel settings={arpSettings} onChange={onArpChange} />
          </div>
        )}

        {subTab === "keyboard" && (
          <div style={{ background: "var(--color-surface-2, #21201f)", border: "1px solid var(--color-border, #3c3a38)", borderRadius: 6, padding: 10, height: "100%", overflowY: "auto" }}>
            <PianoKeyboard onNoteOn={(n) => AudioController.noteOn(n)} onNoteOff={(n) => AudioController.noteOff(n)} />
          </div>
        )}
      </div>
    </div>
  );
};
