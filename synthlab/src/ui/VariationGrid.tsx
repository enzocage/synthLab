import type { Preset } from "../presets/schema";

const KEY_LABELS = ["Q", "W", "E", "R", "T", "Z", "U", "I"];

interface Props {
  variants: Preset[];
  onPlay(idx: number): void;
  onAccept(idx: number): void;
}

export function VariationGrid({ variants, onPlay, onAccept }: Props) {
  if (variants.length === 0) {
    return <div className="variation-grid variation-grid--empty">M drücken für 8 Mutationen</div>;
  }
  return (
    <div className="variation-grid">
      {variants.map((v, i) => (
        <div key={v.id} className="variation-grid__cell">
          <button onClick={() => onPlay(i)}>{KEY_LABELS[i]}</button>
          <button className="variation-grid__accept" onClick={() => onAccept(i)} title="Übernehmen (Enter)">
            ✓
          </button>
        </div>
      ))}
    </div>
  );
}
