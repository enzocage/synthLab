import React from "react";
import type { ParamValues } from "../audio/core/types";

interface SidControlPanelProps {
  params: ParamValues;
  onChange: (paramId: string, value: number | string | boolean) => void;
}

export const SidControlPanel: React.FC<SidControlPanelProps> = ({ params, onChange }) => {
  return (
    <div style={{ background: "#1a1c23", border: "1px solid #333842", borderRadius: 8, padding: 12, marginTop: 12 }}>
      <div style={{ fontWeight: "bold", fontSize: 13, color: "#4fa3d1", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
        <span>SID LAB PARAMETER EDITOR</span>
        <span style={{ fontSize: 11, color: "#888" }}>SID-style / non-cycle-accurate</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, fontSize: 11 }}>
        {/* Waveform */}
        <div>
          <label style={{ display: "block", color: "#aaa" }}>Wellenform</label>
          <select
            value={String(params.waveform || "pulse")}
            onChange={(e) => onChange("waveform", e.target.value)}
            style={{ width: "100%", background: "#22252e", color: "#fff", border: "1px solid #444", borderRadius: 4, padding: "2px 4px" }}
          >
            <option value="pulse">Pulse</option>
            <option value="triangle">Triangle</option>
            <option value="sawtooth">Sawtooth</option>
            <option value="noise">Noise</option>
          </select>
        </div>

        {/* Chip Model */}
        <div>
          <label style={{ display: "block", color: "#aaa" }}>Chip Modell</label>
          <select
            value={String(params.chipModel || "6581")}
            onChange={(e) => onChange("chipModel", e.target.value)}
            style={{ width: "100%", background: "#22252e", color: "#fff", border: "1px solid #444", borderRadius: 4, padding: "2px 4px" }}
          >
            <option value="6581">6581 (Warm/Dist)</option>
            <option value="8580">8580 (Clean)</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>

        {/* Filter Type */}
        <div>
          <label style={{ display: "block", color: "#aaa" }}>Filter Typ</label>
          <select
            value={String(params.filterType || "lowpass")}
            onChange={(e) => onChange("filterType", e.target.value)}
            style={{ width: "100%", background: "#22252e", color: "#fff", border: "1px solid #444", borderRadius: 4, padding: "2px 4px" }}
          >
            <option value="lowpass">Lowpass</option>
            <option value="highpass">Highpass</option>
            <option value="bandpass">Bandpass</option>
            <option value="off">Off</option>
          </select>
        </div>

        {/* Pulse Width Slider */}
        <div>
          <label style={{ display: "block", color: "#aaa" }}>Pulse Width ({Math.round(Number(params.pulseWidth || 0.5) * 100)}%)</label>
          <input
            type="range"
            min={0.05}
            max={0.95}
            step={0.01}
            value={Number(params.pulseWidth || 0.5)}
            onChange={(e) => onChange("pulseWidth", parseFloat(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        {/* Cutoff Slider */}
        <div>
          <label style={{ display: "block", color: "#aaa" }}>Cutoff ({Math.round(Number(params.cutoffHz || 1500))} Hz)</label>
          <input
            type="range"
            min={40}
            max={12000}
            step={10}
            value={Number(params.cutoffHz || 1500)}
            onChange={(e) => onChange("cutoffHz", parseFloat(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        {/* Resonance Slider */}
        <div>
          <label style={{ display: "block", color: "#aaa" }}>Resonanz ({Number(params.resonance || 1.5).toFixed(1)})</label>
          <input
            type="range"
            min={0.1}
            max={15}
            step={0.1}
            value={Number(params.resonance || 1.5)}
            onChange={(e) => onChange("resonance", parseFloat(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        {/* Hard Sync */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
          <input
            type="checkbox"
            id="hardSyncCheck"
            checked={Boolean(params.hardSync)}
            onChange={(e) => onChange("hardSync", e.target.checked)}
          />
          <label htmlFor="hardSyncCheck" style={{ color: "#aaa" }}>Hard Sync</label>
        </div>

        {/* Ring Mod */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
          <input
            type="checkbox"
            id="ringModCheck"
            checked={Boolean(params.ringMod)}
            onChange={(e) => onChange("ringMod", e.target.checked)}
          />
          <label htmlFor="ringModCheck" style={{ color: "#aaa" }}>Ring Mod (Cost 2)</label>
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: 10, color: "#666", borderTop: "1px solid #2a2d36", paddingTop: 4 }}>
        Eigenständiger SID-Presetentwurf; keine Originalmelodie, kein Treiber, keine Instrumenttabelle und kein Sample eines Komponisten enthalten.
      </div>
    </div>
  );
};
