import React from "react";
import type { Preset } from "../presets/schema";
import { MacroPanel } from "./MacroPanel";
import { FxRack } from "./FxRack";
import { SidControlPanel } from "./SidControlPanel";

interface Props {
  preset: Preset;
  onLiveEdit(paramId: string, value: number | string | boolean): void;
  onFxChange(fx: any): void;
}

export const DeviceChain: React.FC<Props> = ({ preset, onLiveEdit, onFxChange }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, height: "100%", overflowY: "auto", padding: 8 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Instrument Device Box */}
        <div style={{ flex: 1, background: "var(--color-surface-2, #1a1e26)", border: "1px solid var(--color-border, #303744)", borderRadius: 6, padding: 10 }}>
          <div style={{ fontWeight: "bold", fontSize: 13, color: "var(--color-accent, #4a90d9)", marginBottom: 8 }}>
            INSTRUMENT DEVICE: {preset.name} ({preset.engine})
          </div>
          <MacroPanel preset={preset} onLiveEdit={onLiveEdit} />
          {preset.engine === "sid-chip" && (
            <SidControlPanel params={preset.params} onChange={onLiveEdit} />
          )}
        </div>

        {/* FX Chain Devices Box */}
        <div style={{ width: 340, background: "var(--color-surface-2, #1a1e26)", border: "1px solid var(--color-border, #303744)", borderRadius: 6, padding: 10 }}>
          <div style={{ fontWeight: "bold", fontSize: 13, color: "var(--color-text-secondary, #a0a8b6)", marginBottom: 8 }}>
            FX RACK & DEVICES
          </div>
          <FxRack fx={preset.fx} onChange={onFxChange} />
        </div>
      </div>
    </div>
  );
};
