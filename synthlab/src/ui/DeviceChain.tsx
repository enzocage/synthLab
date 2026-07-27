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

/** Horizontales Ableton-artiges Geräteband; alle FX-Parameter bleiben sichtbar. */
export const DeviceChain: React.FC<Props> = ({ preset, onLiveEdit, onFxChange }) => (
  <div className="device-chain">
    <div className="device-chain__toolbar">
      <span className="device-chain__label">DEVICE CHAIN</span>
      <span className="device-chain__signal">Instrument -&gt; FX -&gt; Output</span>
      <span className="device-chain__hint">Alle Parameter sichtbar · horizontal scrollen</span>
    </div>
    <div className="device-chain__canvas">
      <div className="instrument-device">
        <div className="instrument-device__header">
          <span className="instrument-device__kind">INSTRUMENT</span>
          <span className="instrument-device__name">{preset.name}</span>
          <span className="instrument-device__engine">{preset.engine}</span>
        </div>
        <MacroPanel preset={preset} onLiveEdit={onLiveEdit} />
        {preset.engine === "sid-chip" && <SidControlPanel params={preset.params} onChange={onLiveEdit} />}
      </div>
      <div className="device-chain__arrow" aria-hidden="true">-&gt;</div>
      <div className="fx-device-group"><FxRack fx={preset.fx} onChange={onFxChange} /></div>
      <div className="device-chain__arrow" aria-hidden="true">-&gt;</div>
      <div className="output-device">
        <span className="output-device__kind">OUTPUT</span>
        <span className="output-device__meter" aria-label="Output meter"><span /></span>
        <span className="output-device__value">-inf dB</span>
      </div>
    </div>
  </div>
);
