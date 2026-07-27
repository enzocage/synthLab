import React, { useState } from "react";
import type { Preset } from "../presets/schema";
import type { ParamSpec } from "../audio/core/types";
import { getEngine } from "../audio/engines/registry";
import { SynthPreviewBox } from "./SynthPreviewBox";
import { PresetSaveModal } from "./PresetSaveModal";
import type { Role } from "../presets/schema";

interface Props {
  preset: Preset;
  onLiveEdit(paramId: string, value: number | string | boolean): void;
  onSaveAsCustomPreset(name: string, role: Role, tags: string[], author?: string, notes?: string): void;
  onMutate?(): void;
  onResetDefaults?(): void;
}

export const SynthParameterInspector: React.FC<Props> = ({
  preset,
  onLiveEdit,
  onSaveAsCustomPreset,
  onMutate,
  onResetDefaults,
}) => {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  let parameters: ParamSpec[] = [];
  let engineName = preset.engine.toUpperCase();

  try {
    const engine = getEngine(preset.engine);
    parameters = engine.params;
    engineName = engine.name;
  } catch {
    /* fallback if engine not found */
  }

  // Group parameters by group field or default to "general"
  const groups: Record<string, ParamSpec[]> = {};
  for (const param of parameters) {
    const groupName = param.group || "Allgemein";
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(param);
  }

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--color-surface-1, #181715)",
        color: "#e0e0e0",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Header Bar with Top-Right Synth Preview & Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 14px",
          background: "var(--color-surface-2, #211f1c)",
          borderBottom: "1px solid var(--color-border, #383633)",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-accent, #fbad60)" }}>
              {engineName}
            </span>
            <span style={{ fontSize: 10, background: "#333", color: "#aaa", padding: "1px 6px", borderRadius: 4 }}>
              {preset.engine}
            </span>
          </div>
          <span style={{ fontSize: 11, color: "#888" }}>
            Preset: <strong style={{ color: "#fff" }}>{preset.name}</strong> · {parameters.length} Parameter
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          {onMutate && (
            <button
              onClick={onMutate}
              style={{
                fontSize: 11,
                padding: "5px 10px",
                borderRadius: 5,
                background: "#2e2c29",
                border: "1px solid #444",
                color: "#ddd",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
              title="Parameter leicht mutieren"
            >
              🎲 Mutieren
            </button>
          )}

          {onResetDefaults && (
            <button
              onClick={onResetDefaults}
              style={{
                fontSize: 11,
                padding: "5px 10px",
                borderRadius: 5,
                background: "#2e2c29",
                border: "1px solid #444",
                color: "#ddd",
                cursor: "pointer",
              }}
              title="Zurücksetzen auf Preset-Standardwerte"
            >
              ↺ Reset
            </button>
          )}

          <button
            onClick={() => setIsSaveModalOpen(true)}
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "5px 12px",
              borderRadius: 5,
              background: "var(--color-accent, #fbad60)",
              border: "none",
              color: "#000",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            💾 Als neues Preset speichern
          </button>

          {/* Top-Right Maximizable Preview Box */}
          <SynthPreviewBox engineId={preset.engine} />
        </div>
      </div>

      {/* Parameter Controls Panel */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {Object.entries(groups).map(([groupName, groupParams]) => {
          const isCollapsed = collapsedGroups[groupName];
          return (
            <div
              key={groupName}
              style={{
                background: "#1e1d1b",
                border: "1px solid #2e2c29",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {/* Group Title Bar */}
              <div
                onClick={() => toggleGroup(groupName)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  background: "#262422",
                  borderBottom: isCollapsed ? "none" : "1px solid #2e2c29",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--color-accent, #fbad60)" }}>
                  {groupName} ({groupParams.length})
                </span>
                <span style={{ fontSize: 10, color: "#888" }}>{isCollapsed ? "▲ Maximize" : "▼ Collapse"}</span>
              </div>

              {/* Group Items Grid */}
              {!isCollapsed && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: 12,
                    padding: 12,
                  }}
                >
                  {groupParams.map((param) => {
                    const value = preset.params[param.id] ?? (param as any).default;
                    return (
                      <div
                        key={param.id}
                        style={{
                          background: "#161514",
                          border: "1px solid #292725",
                          borderRadius: 6,
                          padding: "8px 10px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                          <span style={{ color: "#ccc", fontWeight: 500 }}>{param.label}</span>
                          <span style={{ color: "var(--color-accent, #fbad60)", fontFamily: "monospace", fontSize: 10 }}>
                            {formatParamReadout(param, value)}
                          </span>
                        </div>

                        {/* Render Input by Kind */}
                        {param.kind === "float" && (
                          <input
                            type="range"
                            min={param.min}
                            max={param.max}
                            step={(param.max - param.min) / 200}
                            value={Number(value)}
                            onChange={(e) => onLiveEdit(param.id, Number(e.target.value))}
                            style={{ accentColor: "var(--color-accent, #fbad60)", width: "100%", cursor: "pointer" }}
                          />
                        )}

                        {param.kind === "int" && (
                          <input
                            type="range"
                            min={param.min}
                            max={param.max}
                            step={1}
                            value={Number(value)}
                            onChange={(e) => onLiveEdit(param.id, Math.round(Number(e.target.value)))}
                            style={{ accentColor: "var(--color-accent, #fbad60)", width: "100%", cursor: "pointer" }}
                          />
                        )}

                        {param.kind === "enum" && (
                          <select
                            value={String(value)}
                            onChange={(e) => onLiveEdit(param.id, e.target.value)}
                            style={{
                              background: "#22201e",
                              border: "1px solid #3d3a36",
                              color: "#fff",
                              borderRadius: 4,
                              padding: "4px 6px",
                              fontSize: 11,
                            }}
                          >
                            {param.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}

                        {param.kind === "bool" && (
                          <button
                            onClick={() => onLiveEdit(param.id, !Boolean(value))}
                            style={{
                              background: value ? "var(--color-accent, #fbad60)" : "#22201e",
                              color: value ? "#000" : "#aaa",
                              border: "1px solid #3d3a36",
                              borderRadius: 4,
                              padding: "4px 8px",
                              fontSize: 10,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {value ? "AN (ON)" : "AUS (OFF)"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Preset Save Modal */}
      <PresetSaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={onSaveAsCustomPreset}
        currentEngine={preset.engine}
        defaultName={`${preset.name} (Custom)`}
      />
    </div>
  );
};

function formatParamReadout(param: ParamSpec, val: any): string {
  if (param.kind === "float") {
    const num = Number(val);
    const formatted = num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num < 1 && num > 0 ? num.toFixed(3) : num.toFixed(2);
    return `${formatted}${param.unit ? ` ${param.unit}` : ""}`;
  }
  if (param.kind === "int") return String(val);
  if (param.kind === "bool") return val ? "ON" : "OFF";
  return String(val);
}
