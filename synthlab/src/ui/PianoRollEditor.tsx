// Ableton Live-Style Interactive Piano Roll Editor & Note-by-Note Inspector
import React, { useState } from "react";
import { useTracksStore, type Clip } from "../store/tracksStore";
import type { NoteEvent } from "../midi/phrases";
import { AudioController } from "../audio/AudioController";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function midiToName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[midi % 12];
  return `${name}${octave}`;
}

function isBlackKey(midi: number): boolean {
  const noteInOctave = midi % 12;
  return [1, 3, 6, 8, 10].includes(noteInOctave);
}

export const PianoRollEditor: React.FC = () => {
  const selectedTrack = useTracksStore((s) => s.selectedTrack());
  const updateClipNotes = useTracksStore((s) => s.updateClipNotes);
  const addClip = useTracksStore((s) => s.addClip);

  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null);

  if (!selectedTrack) {
    return (
      <div style={{ padding: 16, color: "#888", fontSize: 12 }}>
        Keine Spur ausgewählt. Bitte wähle eine Spur in der Session View.
      </div>
    );
  }

  const clips = selectedTrack.clips;
  const activeClip = clips.find((c) => c.id === selectedTrack.activeClipId) ?? clips[0];

  // If track has no clips, offer a button to create one
  if (!activeClip) {
    return (
      <div style={{ padding: 20, textAlign: "center", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#aaa" }}>
          Spur "{selectedTrack.name}" enthält aktuell noch keinen MIDI-Clip.
        </span>
        <button
          type="button"
          onClick={() => {
            const newClip: Clip = {
              id: `clip_${Date.now()}`,
              name: "Clip 1",
              slotIdx: 1,
              events: [
                { note: 60, startBeat: 0, durationBeats: 1, velocity: 0.8 },
                { note: 64, startBeat: 1, durationBeats: 1, velocity: 0.8 },
                { note: 67, startBeat: 2, durationBeats: 1, velocity: 0.8 },
                { note: 72, startBeat: 3, durationBeats: 1, velocity: 0.8 },
              ],
              lengthBeats: 4,
            };
            addClip(selectedTrack.id, newClip);
          }}
          style={{
            background: "var(--color-accent, #fbad60)",
            color: "#000",
            border: "none",
            borderRadius: 5,
            padding: "8px 16px",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          + Neuen MIDI-Clip erstellen
        </button>
      </div>
    );
  }

  const events = activeClip.events;
  const maxBeat = Math.max(activeClip.lengthBeats || 4, ...events.map((e) => e.startBeat + e.durationBeats));
  const totalBeats = Math.ceil(maxBeat / 4) * 4;

  // Key range C2 (36) to C6 (84)
  const minMidi = 36;
  const maxMidi = 84;
  const midiRange: number[] = [];
  for (let m = maxMidi; m >= minMidi; m--) midiRange.push(m);

  // Note-by-Note Editing Actions
  const handleAddNote = (pitch = 60, beatOffset = 0) => {
    const newNote: NoteEvent = {
      note: pitch,
      startBeat: beatOffset,
      durationBeats: 0.5,
      velocity: 0.8,
    };
    const updated = [...events, newNote];
    updateClipNotes(selectedTrack.id, activeClip.id, updated);
    setSelectedNoteIndex(updated.length - 1);
  };

  const handleDeleteSelected = () => {
    if (selectedNoteIndex === null) return;
    const updated = events.filter((_, idx) => idx !== selectedNoteIndex);
    updateClipNotes(selectedTrack.id, activeClip.id, updated);
    setSelectedNoteIndex(null);
  };

  const handleQuantize = () => {
    const updated = events.map((e) => ({
      ...e,
      startBeat: Math.round(e.startBeat * 4) / 4,
      durationBeats: Math.max(0.25, Math.round(e.durationBeats * 4) / 4),
    }));
    updateClipNotes(selectedTrack.id, activeClip.id, updated);
  };

  const handleTransposeOctave = (deltaOctaves: number) => {
    const updated = events.map((e) => ({
      ...e,
      note: Math.max(21, Math.min(108, e.note + deltaOctaves * 12)),
    }));
    updateClipNotes(selectedTrack.id, activeClip.id, updated);
  };

  const updateSelectedNote = (patch: Partial<NoteEvent>) => {
    if (selectedNoteIndex === null || !events[selectedNoteIndex]) return;
    const updated = events.map((e, idx) => (idx === selectedNoteIndex ? { ...e, ...patch } : e));
    updateClipNotes(selectedTrack.id, activeClip.id, updated);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%", overflow: "hidden", fontSize: 11 }}>
      {/* Top Header & Ableton Action Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#1e1d1b",
          border: "1px solid #33312f",
          borderRadius: 6,
          padding: "6px 12px",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700, color: "var(--color-accent, #fbad60)" }}>🎹 PIANO ROLL EDITOR</span>
          <span style={{ color: "#aaa" }}>
            Clip: <strong style={{ color: "#fff" }}>{activeClip.name}</strong> ({events.length} Noten · {totalBeats / 4} Takte)
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            onClick={handleQuantize}
            style={{ background: "#2a2826", border: "1px solid #444", color: "#ddd", borderRadius: 4, padding: "3px 8px", cursor: "pointer", fontSize: 10 }}
            title="Alle Noten-Startzeiten auf 1/16 Raster quantisieren"
          >
            ⚡ Quantisieren (1/16)
          </button>
          <button
            type="button"
            onClick={() => handleTransposeOctave(1)}
            style={{ background: "#2a2826", border: "1px solid #444", color: "#ddd", borderRadius: 4, padding: "3px 8px", cursor: "pointer", fontSize: 10 }}
            title="Alle Noten 1 Oktave höher (+12 Semitones)"
          >
            ▲ +1 Oktave
          </button>
          <button
            type="button"
            onClick={() => handleTransposeOctave(-1)}
            style={{ background: "#2a2826", border: "1px solid #444", color: "#ddd", borderRadius: 4, padding: "3px 8px", cursor: "pointer", fontSize: 10 }}
            title="Alle Noten 1 Oktave tiefer (-12 Semitones)"
          >
            ▼ -1 Oktave
          </button>
          <button
            type="button"
            onClick={() => handleAddNote(60, 0)}
            style={{ background: "var(--color-accent, #fbad60)", border: "none", color: "#000", fontWeight: 700, borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: 10 }}
          >
            + Note hinzufügen
          </button>
        </div>
      </div>

      {/* Main Piano Roll Container (Keys + Timeline Grid) */}
      <div
        style={{
          flex: 1,
          display: "flex",
          border: "1px solid #33312f",
          borderRadius: 6,
          background: "#141312",
          overflow: "auto",
          position: "relative",
          minHeight: 0,
        }}
      >
        {/* Left Vertical Piano Keys Ruler */}
        <div style={{ width: 55, flexShrink: 0, borderRight: "1px solid #33312f", background: "#1c1b1a", userSelect: "none" }}>
          <div style={{ height: 22, borderBottom: "1px solid #33312f", background: "#242220" }} />
          {midiRange.map((midi) => {
            const black = isBlackKey(midi);
            return (
              <div
                key={midi}
                onClick={() => {
                  AudioController.noteOn(midi, 0.8);
                  setTimeout(() => AudioController.noteOff(midi), 250);
                }}
                style={{
                  height: 18,
                  lineHeight: "18px",
                  fontSize: 9,
                  fontWeight: black ? 400 : 700,
                  color: black ? "#888" : "#ddd",
                  background: black ? "#22201e" : "#32302e",
                  borderBottom: "1px solid #282624",
                  paddingLeft: 4,
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
                title={`Klick zum Anspielen: ${midiToName(midi)} (${midi})`}
              >
                {midi % 12 === 0 ? midiToName(midi) : black ? "" : midiToName(midi)}
              </div>
            );
          })}
        </div>

        {/* Right Grid Area (Beat Timeline + Note Blocks) */}
        <div style={{ flex: 1, minWidth: totalBeats * 40, position: "relative" }}>
          {/* Top Beat Timeline Header */}
          <div style={{ height: 22, borderBottom: "1px solid #33312f", background: "#242220", display: "flex", alignItems: "center" }}>
            {Array.from({ length: totalBeats }).map((_, b) => (
              <div
                key={b}
                style={{
                  width: 40,
                  flexShrink: 0,
                  fontSize: 9,
                  fontFamily: "monospace",
                  color: b % 4 === 0 ? "#fbad60" : "#666",
                  borderLeft: b % 4 === 0 ? "1px solid #555" : "1px dashed #2a2826",
                  paddingLeft: 3,
                }}
              >
                {b % 4 === 0 ? `${Math.floor(b / 4) + 1}.1` : `.${(b % 4) + 1}`}
              </div>
            ))}
          </div>

          {/* Grid Rows for each pitch */}
          <div style={{ position: "relative" }}>
            {midiRange.map((midi) => {
              const black = isBlackKey(midi);
              return (
                <div
                  key={midi}
                  style={{
                    height: 18,
                    background: black ? "#171615" : "#1b1a19",
                    borderBottom: "1px solid #232220",
                    position: "relative",
                  }}
                  onDoubleClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const beatOffset = Math.floor((clickX / 40) * 4) / 4;
                    handleAddNote(midi, beatOffset);
                  }}
                />
              );
            })}

            {/* Note Rectangles Overlay */}
            {events.map((event, idx) => {
              const isSelected = selectedNoteIndex === idx;
              const rowIndex = maxMidi - event.note;
              if (rowIndex < 0 || rowIndex >= midiRange.length) return null;

              const topPx = 22 + rowIndex * 18 + 1;
              const leftPx = event.startBeat * 40;
              const widthPx = Math.max(12, event.durationBeats * 40 - 2);

              return (
                <div
                  key={`${event.note}_${event.startBeat}_${idx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNoteIndex(idx);
                    AudioController.noteOn(event.note, event.velocity);
                    setTimeout(() => AudioController.noteOff(event.note), 200);
                  }}
                  style={{
                    position: "absolute",
                    top: topPx,
                    left: leftPx,
                    width: widthPx,
                    height: 16,
                    background: isSelected ? "#4ad97a" : "var(--color-accent, #fbad60)",
                    border: isSelected ? "1px solid #fff" : "1px solid #b87b35",
                    borderRadius: 3,
                    boxShadow: isSelected ? "0 0 8px rgba(74, 217, 122, 0.6)" : "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 4,
                    fontSize: 8.5,
                    fontWeight: 700,
                    color: "#000",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    zIndex: isSelected ? 10 : 2,
                    userSelect: "none",
                  }}
                  title={`${midiToName(event.note)} · Start: ${event.startBeat} Beats · Dauer: ${event.durationBeats} Beats · Anschlag: ${Math.round(event.velocity * 100)}%`}
                >
                  {midiToName(event.note)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Note Inspector Footer */}
      {selectedNoteIndex !== null && events[selectedNoteIndex] && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#1c1b19",
            border: "1px solid #4ad97a",
            borderRadius: 6,
            padding: "6px 12px",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontWeight: 700, color: "#4ad97a" }}>
              EDIT NOTE: {midiToName(events[selectedNoteIndex].note)} ({events[selectedNoteIndex].note})
            </span>

            {/* Pitch Selector */}
            <label style={{ display: "flex", alignItems: "center", gap: 4, color: "#aaa" }}>
              Tonhöhe:
              <select
                value={events[selectedNoteIndex].note}
                onChange={(e) => updateSelectedNote({ note: Number(e.target.value) })}
                style={{ background: "#252321", border: "1px solid #444", color: "#fff", borderRadius: 3, padding: "2px 4px", fontSize: 10 }}
              >
                {midiRange.map((m) => (
                  <option key={m} value={m}>
                    {midiToName(m)} ({m})
                  </option>
                ))}
              </select>
            </label>

            {/* Start Beat Input */}
            <label style={{ display: "flex", alignItems: "center", gap: 4, color: "#aaa" }}>
              Start (Beat):
              <input
                type="number"
                step={0.25}
                min={0}
                max={64}
                value={events[selectedNoteIndex].startBeat}
                onChange={(e) => updateSelectedNote({ startBeat: Math.max(0, Number(e.target.value)) })}
                style={{ background: "#252321", border: "1px solid #444", color: "#fff", borderRadius: 3, padding: "2px 4px", width: 55, fontSize: 10 }}
              />
            </label>

            {/* Duration Input */}
            <label style={{ display: "flex", alignItems: "center", gap: 4, color: "#aaa" }}>
              Dauer (Beats):
              <input
                type="number"
                step={0.25}
                min={0.125}
                max={16}
                value={events[selectedNoteIndex].durationBeats}
                onChange={(e) => updateSelectedNote({ durationBeats: Math.max(0.125, Number(e.target.value)) })}
                style={{ background: "#252321", border: "1px solid #444", color: "#fff", borderRadius: 3, padding: "2px 4px", width: 55, fontSize: 10 }}
              />
            </label>

            {/* Velocity Slider */}
            <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#aaa" }}>
              Anschlag (Velocity):
              <span style={{ color: "#fff", fontFamily: "monospace", width: 35 }}>
                {Math.round(events[selectedNoteIndex].velocity * 100)}%
              </span>
              <input
                type="range"
                min={0.05}
                max={1.0}
                step={0.05}
                value={events[selectedNoteIndex].velocity}
                onChange={(e) => updateSelectedNote({ velocity: Number(e.target.value) })}
                style={{ accentColor: "#4ad97a", width: 80, height: 14, cursor: "pointer" }}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleDeleteSelected}
            style={{ background: "#c0392b", border: "none", color: "#fff", fontWeight: 700, borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 10 }}
          >
            ❌ Note löschen
          </button>
        </div>
      )}
    </div>
  );
};
