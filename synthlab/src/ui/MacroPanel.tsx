import { useState, useEffect } from "react";
import { MACRO_IDS, type MacroValues } from "../audio/core/types";
import { getEngine } from "../audio/engines/registry";
import { AudioController } from "../audio/AudioController";
import type { Preset } from "../presets/schema";

const MACRO_LABELS: Record<(typeof MACRO_IDS)[number], string> = {
  brightness: "Brightness",
  motion: "Motion",
  density: "Density",
  space: "Space",
  drive: "Drive",
  detune: "Detune",
  body: "Body",
  air: "Air",
};

interface Props {
  preset: Preset;
  onLiveEdit(paramId: string, value: number | string | boolean): void;
}

export function MacroPanel({ preset, onLiveEdit }: Props) {
  const [macros, setMacros] = useState<MacroValues>(preset.macros);

  useEffect(() => {
    setMacros(preset.macros);
  }, [preset.id, preset.macros]);

  function handleChange(macroId: keyof MacroValues, value: number) {
    const next = { ...macros, [macroId]: value };
    setMacros(next);
    const engine = getEngine(preset.engine);
    const targets = engine.defaultMacroMap[macroId];
    if (!targets) return;
    for (const target of targets) {
      const interpolated = target.atZero + (target.atOne - target.atZero) * value;
      AudioController.setLiveParam(target.paramId, interpolated);
      onLiveEdit(target.paramId, interpolated);
    }
  }

  return (
    <div className="macro-panel">
      {MACRO_IDS.map((id) => (
        <label key={id} className="macro-panel__slider">
          <span>{MACRO_LABELS[id]}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={macros[id]}
            onChange={(e) => handleChange(id, Number(e.target.value))}
          />
          <span className="macro-panel__value">{macros[id].toFixed(2)}</span>
        </label>
      ))}
    </div>
  );
}
