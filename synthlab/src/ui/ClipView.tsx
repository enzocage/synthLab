import React from "react";
import { ArpPanel } from "./ArpPanel";
import { PianoKeyboard } from "./PianoKeyboard";
import { AudioController } from "../audio/AudioController";

interface Props {
  arpSettings: any;
  onArpChange(patch: any): void;
}

export const ClipView: React.FC<Props> = ({ arpSettings, onArpChange }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, height: "100%", overflowY: "auto", padding: 8 }}>
      <div style={{ background: "var(--color-surface-2, #1a1e26)", border: "1px solid var(--color-border, #303744)", borderRadius: 6, padding: 10 }}>
        <div style={{ fontWeight: "bold", fontSize: 13, color: "var(--color-accent, #4a90d9)", marginBottom: 8 }}>
          ARPEGGIATOR & LIVE PERFORMANCE
        </div>
        <ArpPanel settings={arpSettings} onChange={onArpChange} />
      </div>

      <div style={{ background: "var(--color-surface-2, #1a1e26)", border: "1px solid var(--color-border, #303744)", borderRadius: 6, padding: 6 }}>
        <PianoKeyboard onNoteOn={(n) => AudioController.noteOn(n)} onNoteOff={(n) => AudioController.noteOff(n)} />
      </div>
    </div>
  );
};
