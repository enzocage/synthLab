import React, { useState, useEffect, useRef } from "react";
import type { Preset } from "../presets/schema";
import type { ParamSpec } from "../audio/core/types";
import { getEngine } from "../audio/engines/registry";
import { AudioController } from "../audio/AudioController";
import { SynthPreviewBox } from "./SynthPreviewBox";
import { PresetSaveModal } from "./PresetSaveModal";
import type { Role } from "../presets/schema";

export interface ParamLfoConfig {
  enabled: boolean;
  shape: "sine" | "triangle" | "sawtooth" | "square" | "random";
  rateHz: number; // 0.05 .. 20.0 Hz
  depth: number;  // 0.0 .. 1.0 (0% .. 100%)
  minBound: number; // 0.0 .. 1.0 normalized low boundary
  maxBound: number; // 0.0 .. 1.0 normalized high boundary
}

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
  const [paramLfos, setParamLfos] = useState<Record<string, ParamLfoConfig>>({});
  const [openLfoDrawers, setOpenLfoDrawers] = useState<Record<string, boolean>>({});
  const [lfoLiveDisplay, setLfoLiveDisplay] = useState<Record<string, number>>({});

  const startTimeRef = useRef(performance.now() / 1000);
  const baseParamsRef = useRef<Record<string, any>>({});

  let parameters: ParamSpec[] = [];
  let engineName = preset.engine.toUpperCase();

  try {
    const engine = getEngine(preset.engine);
    parameters = engine.params;
    engineName = engine.name;
  } catch {
    /* fallback if engine not found */
  }

  // Capture static base parameter values when LFO is enabled
  useEffect(() => {
    for (const [paramId, lfo] of Object.entries(paramLfos)) {
      if (lfo.enabled && baseParamsRef.current[paramId] === undefined) {
        baseParamsRef.current[paramId] = preset.params[paramId];
      } else if (!lfo.enabled && baseParamsRef.current[paramId] !== undefined) {
        delete baseParamsRef.current[paramId];
        setLfoLiveDisplay((prev) => {
          const next = { ...prev };
          delete next[paramId];
          return next;
        });
      }
    }
  }, [paramLfos, preset.params]);

  // Persistent Real-Time LFO Oscillation Modulator Loop (60 FPS - Direct Audio Controller)
  useEffect(() => {
    let animId: number;

    const tick = () => {
      const now = performance.now() / 1000;
      const elapsed = now - startTimeRef.current;

      const newDisplays: Record<string, number> = {};
      let hasLfoUpdates = false;

      for (const [paramId, lfo] of Object.entries(paramLfos)) {
        if (!lfo || !lfo.enabled) continue;
        const paramSpec = parameters.find((p) => p.id === paramId);
        if (!paramSpec) continue;

        const phase = (elapsed * lfo.rateHz) % 1;
        let lfoVal = 0;
        if (lfo.shape === "sine") {
          lfoVal = Math.sin(2 * Math.PI * phase);
        } else if (lfo.shape === "triangle") {
          lfoVal = phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase;
        } else if (lfo.shape === "sawtooth") {
          lfoVal = 2 * phase - 1;
        } else if (lfo.shape === "square") {
          lfoVal = phase < 0.5 ? 1 : -1;
        } else if (lfo.shape === "random") {
          const step = Math.floor(elapsed * lfo.rateHz);
          const hash = Math.sin(step * 12.9898 + 78.233) * 43758.5453;
          const rand01 = hash - Math.floor(hash);
          lfoVal = rand01 * 2 - 1;
        }

        // Compute Range Definer Boundaries
        const pMin = (paramSpec as any).min ?? 0;
        const pMax = (paramSpec as any).max ?? 1;
        const pSpan = pMax - pMin;

        const minBoundNorm = lfo.minBound ?? 0.0;
        const maxBoundNorm = lfo.maxBound ?? 1.0;

        const effMin = pMin + minBoundNorm * pSpan;
        const effMax = pMin + maxBoundNorm * pSpan;
        const effSpan = effMax - effMin;

        const midPoint = effMin + effSpan / 2;
        const halfSpan = (effSpan / 2) * lfo.depth;

        let nextVal = midPoint + lfoVal * halfSpan;
        nextVal = Math.max(effMin, Math.min(effMax, nextVal));
        if (paramSpec.kind === "int") nextVal = Math.round(nextVal);

        // Direct real-time audio modulation without re-rendering React or reloading presets
        AudioController.setLiveParam(paramId, nextVal);

        newDisplays[paramId] = nextVal;
        hasLfoUpdates = true;
      }

      if (hasLfoUpdates) {
        setLfoLiveDisplay((prev) => ({ ...prev, ...newDisplays }));
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [paramLfos, parameters, preset.params]);

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

  const toggleLfoDrawer = (paramId: string) => {
    setOpenLfoDrawers((prev) => ({ ...prev, [paramId]: !prev[paramId] }));
  };

  const toggleLfoEnable = (paramId: string) => {
    setParamLfos((prev) => {
      const existing = prev[paramId] ?? { enabled: false, shape: "sine", rateHz: 2.0, depth: 1.0, minBound: 0.0, maxBound: 1.0 };
      return {
        ...prev,
        [paramId]: { ...existing, enabled: !existing.enabled },
      };
    });
  };

  const updateLfo = (paramId: string, patch: Partial<ParamLfoConfig>) => {
    setParamLfos((prev) => {
      const existing = prev[paramId] ?? { enabled: true, shape: "sine", rateHz: 2.0, depth: 1.0, minBound: 0.0, maxBound: 1.0 };
      return {
        ...prev,
        [paramId]: { ...existing, ...patch },
      };
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: "var(--color-surface-1, #181715)",
        color: "#e0e0e0",
        fontFamily: "system-ui, -apple-system, sans-serif",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Header Bar with Top-Right Synth Preview & Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 14px",
          background: "var(--color-surface-2, #211f1c)",
          borderBottom: "1px solid var(--color-border, #383633)",
          gap: 12,
          flexShrink: 0,
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
            Preset: <strong style={{ color: "#fff" }}>{preset.name}</strong> · {parameters.length} Parameter steuerbar
          </span>
        </div>

        {/* Action Buttons & Top-Right Preview Box */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          {onMutate && (
            <button
              onClick={onMutate}
              style={{
                fontSize: 11,
                padding: "6px 12px",
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
                padding: "6px 12px",
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
              padding: "6px 14px",
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
          gap: 16,
        }}
      >
        {Object.entries(groups).map(([groupName, groupParams]) => {
          const isCollapsed = collapsedGroups[groupName];
          return (
            <div
              key={groupName}
              style={{
                background: "#1d1c1a",
                border: "1px solid #2e2c29",
                borderRadius: 8,
                display: "flex",
                flexDirection: "column",
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
                  background: "#252321",
                  borderBottom: isCollapsed ? "none" : "1px solid #2e2c29",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--color-accent, #fbad60)" }}>
                  {groupName} ({groupParams.length})
                </span>
                <span style={{ fontSize: 10, color: "#888" }}>{isCollapsed ? "▲ Einblenden" : "▼ Ausblenden"}</span>
              </div>

              {/* Group Items Grid */}
              {!isCollapsed && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(215px, 1fr))",
                    gap: 10,
                    padding: 12,
                  }}
                >
                  {groupParams.map((param) => {
                    const lfoConfig = paramLfos[param.id] ?? { enabled: false, shape: "sine", rateHz: 2.0, depth: 0.3 };
                    const isLfoActive = lfoConfig.enabled;
                    const isDrawerOpen = Boolean(openLfoDrawers[param.id]);

                    const rawValue = preset.params[param.id];
                    const value = isLfoActive && lfoLiveDisplay[param.id] !== undefined
                      ? lfoLiveDisplay[param.id]
                      : (rawValue !== undefined ? rawValue : (param as any).default);

                    return (
                      <div
                        key={param.id}
                        style={{
                          background: "#141312",
                          border: isLfoActive ? "1px solid #4ad97a" : "1px solid #2c2a28",
                          borderRadius: 6,
                          padding: "8px 10px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          gap: 6,
                          minHeight: 62,
                          boxSizing: "border-box",
                          transition: "border-color 0.15s ease",
                        }}
                      >
                        {/* Parameter Header (Label, Oscillation Icon & Readout) */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, overflow: "hidden" }}>
                            {/* Oscillation Icon Button */}
                            <button
                              type="button"
                              onClick={() => toggleLfoDrawer(param.id)}
                              style={{
                                background: "none",
                                border: "none",
                                padding: "0 2px",
                                cursor: "pointer",
                                color: isLfoActive ? "#4ad97a" : "#666",
                                fontSize: 13,
                                fontWeight: 700,
                                lineHeight: 1,
                                transition: "color 0.15s ease",
                              }}
                              title={isLfoActive ? "Oszillator aktiv (Klick zum Konfigurieren)" : "Oszillator inaktiv (Klick zum Konfigurieren)"}
                            >
                              〰
                            </button>

                            <span style={{ color: "#ddd", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={param.label}>
                              {param.label}
                            </span>
                          </div>

                          <span style={{ color: isLfoActive ? "#4ad97a" : "var(--color-accent, #fbad60)", fontFamily: "monospace", fontSize: 10, fontWeight: 700, marginLeft: 6, flexShrink: 0 }}>
                            {formatParamReadout(param, value)}
                          </span>
                        </div>

                        {/* Render Input by Kind */}
                        <div style={{ display: "flex", alignItems: "center", width: "100%", minHeight: 26 }}>
                          {param.kind === "float" && (
                            <input
                              type="range"
                              min={param.min}
                              max={param.max}
                              step={(param.max - param.min) / 200}
                              value={Number(value)}
                              onChange={(e) => onLiveEdit(param.id, Number(e.target.value))}
                              style={{
                                accentColor: isLfoActive ? "#4ad97a" : "var(--color-accent, #fbad60)",
                                width: "100%",
                                height: 20,
                                cursor: "pointer",
                                margin: 0,
                              }}
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
                              style={{
                                accentColor: isLfoActive ? "#4ad97a" : "var(--color-accent, #fbad60)",
                                width: "100%",
                                height: 20,
                                cursor: "pointer",
                                margin: 0,
                              }}
                            />
                          )}

                          {param.kind === "enum" && (
                            <select
                              value={String(value)}
                              onChange={(e) => onLiveEdit(param.id, e.target.value)}
                              style={{
                                background: "#252321",
                                border: "1px solid #3e3b38",
                                color: "#fff",
                                borderRadius: 4,
                                padding: "3px 8px",
                                fontSize: 11,
                                width: "100%",
                                height: 26,
                                cursor: "pointer",
                                outline: "none",
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
                              type="button"
                              onClick={() => onLiveEdit(param.id, !Boolean(value))}
                              style={{
                                background: Boolean(value) ? "var(--color-accent, #fbad60)" : "#252321",
                                color: Boolean(value) ? "#000" : "#bbb",
                                border: Boolean(value) ? "1px solid var(--color-accent, #fbad60)" : "1px solid #3e3b38",
                                borderRadius: 4,
                                padding: "4px 10px",
                                fontSize: 10,
                                fontWeight: 700,
                                width: "100%",
                                height: 26,
                                cursor: "pointer",
                                textAlign: "center",
                                transition: "all 0.1s ease",
                              }}
                            >
                              {Boolean(value) ? "AN (ON)" : "AUS (OFF)"}
                            </button>
                          )}
                        </div>

                        {/* Inline Expandable LFO Oscillator Drawer */}
                        {isDrawerOpen && (
                          <div
                            style={{
                              marginTop: 6,
                              padding: "8px 10px",
                              background: "#1a1918",
                              border: isLfoActive ? "1px solid #4ad97a" : "1px solid #3e3b38",
                              borderRadius: 5,
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                              fontSize: 10,
                            }}
                          >
                            {/* Drawer Header: Power Toggle Button */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <button
                                type="button"
                                onClick={() => toggleLfoEnable(param.id)}
                                style={{
                                  background: isLfoActive ? "#4ad97a" : "#282624",
                                  color: isLfoActive ? "#000" : "#aaa",
                                  border: isLfoActive ? "1px solid #4ad97a" : "1px solid #444",
                                  borderRadius: 3,
                                  padding: "3px 8px",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                {isLfoActive ? "● OSZILLATOR AN" : "○ OSZILLATOR AUS"}
                              </button>

                              <span style={{ color: isLfoActive ? "#4ad97a" : "#888", fontWeight: 600 }}>
                                {isLfoActive ? "Dynamisch" : "Statisch"}
                              </span>
                            </div>

                            {/* LFO Waveform Shape */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                              <span style={{ color: "#aaa" }}>Wellenform:</span>
                              <select
                                value={lfoConfig.shape}
                                onChange={(e) => updateLfo(param.id, { shape: e.target.value as any })}
                                style={{
                                  background: "#252321",
                                  border: "1px solid #3e3b38",
                                  color: "#fff",
                                  borderRadius: 3,
                                  padding: "2px 6px",
                                  fontSize: 10,
                                  cursor: "pointer",
                                }}
                              >
                                <option value="sine">Sinus (Sin)</option>
                                <option value="triangle">Dreieck (Tri)</option>
                                <option value="sawtooth">Sägezahn (Saw)</option>
                                <option value="square">Rechteck (Sq)</option>
                                <option value="random">Zufall (Rnd)</option>
                              </select>
                            </div>

                            {/* LFO Rate / Frequency (Hz) */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", color: "#aaa" }}>
                                <span>Frequenz:</span>
                                <span style={{ color: isLfoActive ? "#4ad97a" : "#fff", fontFamily: "monospace" }}>
                                  {lfoConfig.rateHz.toFixed(2)} Hz
                                </span>
                              </div>
                              <input
                                type="range"
                                min={0.05}
                                max={20.0}
                                step={0.05}
                                value={lfoConfig.rateHz}
                                onChange={(e) => updateLfo(param.id, { rateHz: Number(e.target.value) })}
                                style={{ accentColor: "#4ad97a", width: "100%", height: 16, cursor: "pointer" }}
                              />
                            </div>

                            {/* LFO Depth / Range (%) */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", color: "#aaa" }}>
                                <span>Tiefe (Intensität):</span>
                                <span style={{ color: isLfoActive ? "#4ad97a" : "#fff", fontFamily: "monospace" }}>
                                  {Math.round(lfoConfig.depth * 100)}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={lfoConfig.depth}
                                onChange={(e) => updateLfo(param.id, { depth: Number(e.target.value) })}
                                style={{ accentColor: "#4ad97a", width: "100%", height: 16, cursor: "pointer" }}
                              />
                            </div>

                            {/* Range Definer (Bereichs-Begrenzer Min & Max) */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 2, paddingTop: 6, borderTop: "1px dashed #3a3835" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#ddd", fontWeight: 700, fontSize: 9 }}>
                                <span>Range Definer (Grenzen):</span>
                                <span style={{ color: isLfoActive ? "#4ad97a" : "#aaa", fontFamily: "monospace", fontSize: 9 }}>
                                  {formatParamReadout(param, ((param as any).min ?? 0) + (lfoConfig.minBound ?? 0) * (((param as any).max ?? 1) - ((param as any).min ?? 0)))}
                                  {" ➔ "}
                                  {formatParamReadout(param, ((param as any).min ?? 0) + (lfoConfig.maxBound ?? 1) * (((param as any).max ?? 1) - ((param as any).min ?? 0)))}
                                </span>
                              </div>

                              {/* Min Bound Slider */}
                              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", color: "#aaa", fontSize: 9 }}>
                                  <span>Untergrenze (Min):</span>
                                  <span style={{ fontFamily: "monospace" }}>{Math.round((lfoConfig.minBound ?? 0) * 100)}%</span>
                                </div>
                                <input
                                  type="range"
                                  min={0}
                                  max={lfoConfig.maxBound ?? 1}
                                  step={0.01}
                                  value={lfoConfig.minBound ?? 0}
                                  onChange={(e) => updateLfo(param.id, { minBound: Number(e.target.value) })}
                                  style={{ accentColor: "#4ad97a", width: "100%", height: 14, cursor: "pointer" }}
                                />
                              </div>

                              {/* Max Bound Slider */}
                              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", color: "#aaa", fontSize: 9 }}>
                                  <span>Obergrenze (Max):</span>
                                  <span style={{ fontFamily: "monospace" }}>{Math.round((lfoConfig.maxBound ?? 1) * 100)}%</span>
                                </div>
                                <input
                                  type="range"
                                  min={lfoConfig.minBound ?? 0}
                                  max={1}
                                  step={0.01}
                                  value={lfoConfig.maxBound ?? 1}
                                  onChange={(e) => updateLfo(param.id, { maxBound: Number(e.target.value) })}
                                  style={{ accentColor: "#4ad97a", width: "100%", height: 14, cursor: "pointer" }}
                                />
                              </div>
                            </div>
                          </div>
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
    const formatted = num >= 1000 ? `${(num / 1000).toFixed(1)}k` : Math.abs(num) < 1 && num !== 0 ? num.toFixed(3) : num.toFixed(2);
    return `${formatted}${param.unit ? ` ${param.unit}` : ""}`;
  }
  if (param.kind === "int") {
    const unit = (param as any).unit;
    return `${val}${unit ? ` ${unit}` : ""}`;
  }
  if (param.kind === "bool") return Boolean(val) ? "ON" : "OFF";
  return String(val);
}
