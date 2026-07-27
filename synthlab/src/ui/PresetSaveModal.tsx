import React, { useState } from "react";
import type { Role } from "../presets/schema";

interface Props {
  isOpen: boolean;
  onClose(): void;
  onSave(name: string, role: Role, tags: string[], author: string, notes: string): void;
  currentEngine: string;
  defaultName?: string;
}

const ROLES: { id: Role; label: string }[] = [
  { id: "bass", label: "Bass" },
  { id: "melody", label: "Melody / Lead" },
  { id: "pad", label: "Pad" },
  { id: "pluck", label: "Pluck" },
  { id: "arp", label: "Arp" },
  { id: "drone", label: "Drone" },
  { id: "fx", label: "FX" },
  { id: "rhythm", label: "Rhythm / Percussion" },
  { id: "bell", label: "Bell" },
  { id: "synth", label: "Synth" },
];

export const PresetSaveModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  currentEngine,
  defaultName = "",
}) => {
  const [name, setName] = useState(defaultName || `Custom ${currentEngine.toUpperCase()} Sound`);
  const [role, setRole] = useState<Role>("pad");
  const [tagsInput, setTagsInput] = useState("custom, user");
  const [author, setAuthor] = useState("enzo cage");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    onSave(name.trim(), role, tags, author.trim(), notes.trim());
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#e0e0e0",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#1b1a18",
          border: "1px solid #383633",
          borderRadius: 12,
          width: "90%",
          maxWidth: 500,
          padding: 24,
          boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, borderBottom: "1px solid #2e2c29", paddingBottom: 12 }}>
          <h3 style={{ margin: 0, color: "var(--color-accent, #fbad60)", fontSize: 16, fontWeight: 700 }}>
            💾 Preset als neues Custom-Preset speichern
          </h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#aaa", fontSize: 20, cursor: "pointer" }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 4 }}>
              PRESET NAME *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                background: "#242220",
                border: "1px solid #3d3a36",
                color: "#fff",
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 4 }}>
                KATEGORIE / ROLLE
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  background: "#242220",
                  border: "1px solid #3d3a36",
                  color: "#fff",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 4 }}>
                AUTOR
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  background: "#242220",
                  border: "1px solid #3d3a36",
                  color: "#fff",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 4 }}>
              TAGS (kommagetrennt)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="z.B. analog, warm, custom"
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                background: "#242220",
                border: "1px solid #3d3a36",
                color: "#fff",
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 4 }}>
              NOTIZEN / SOUND DESIGN ANMERKUNGEN
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optionale Notizen zu diesem Preset..."
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                background: "#242220",
                border: "1px solid #3d3a36",
                color: "#fff",
                fontSize: 12,
                fontFamily: "inherit",
                boxSizing: "border-box",
                resize: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                background: "transparent",
                border: "1px solid #444",
                color: "#ccc",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 20px",
                borderRadius: 6,
                background: "var(--color-accent, #fbad60)",
                border: "none",
                color: "#000",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Speichern (IndexedDB)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
