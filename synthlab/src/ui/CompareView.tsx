import React from "react";
import type { Preset } from "../presets/schema";
import { RatingPanel } from "./RatingPanel";
import { VariationGrid } from "./VariationGrid";
import { useSessionStore } from "../store/sessionStore";

interface Props {
  preset: Preset;
  ratings: Record<string, number>;
  favorites: Record<string, boolean>;
  notes: Record<string, string>;
  onRate(n: number): void;
  onToggleFavorite(): void;
  onNotesChange(n: string): void;
  onDiscard(): void;
  variationGrid: Preset[];
  handlePlayVariant(idx: number): void;
  handleAcceptVariant(idx: number): void;
}

export const CompareView: React.FC<Props> = ({
  preset,
  ratings,
  favorites,
  notes,
  onRate,
  onToggleFavorite,
  onNotesChange,
  onDiscard,
  variationGrid,
  handlePlayVariant,
  handleAcceptVariant,
}) => {
  const abSlots = useSessionStore((s) => s.abSlots);
  const activeSlot = useSessionStore((s) => s.activeSlot);

  return (
    <div style={{ display: "flex", gap: 12, height: "100%", overflowY: "auto", padding: 8 }}>
      {/* A/B Compare Box */}
      <div style={{ width: 220, background: "var(--color-surface-2, #21201f)", border: "1px solid var(--color-border, #3c3a38)", borderRadius: 6, padding: 10 }}>
        <div style={{ fontWeight: "bold", fontSize: 13, color: "var(--color-accent, #d9924a)", marginBottom: 8 }}>
          A/B PRESET COMPARE
        </div>
        <div style={{ fontSize: 12, color: "#ccc", marginBottom: 6 }}>
          Aktiv: <b style={{ color: "#4ad97a" }}>Slot {activeSlot}</b>
        </div>
        <div style={{ fontSize: 11, color: "#aaa", display: "flex", flexDirection: "column", gap: 4 }}>
          <div>Slot A: {abSlots.A ? abSlots.A.name : "–"}</div>
          <div>Slot B: {abSlots.B ? abSlots.B.name : "–"}</div>
        </div>
      </div>

      {/* Variation Grid Box */}
      <div style={{ flex: 1, background: "var(--color-surface-2, #21201f)", border: "1px solid var(--color-border, #3c3a38)", borderRadius: 6, padding: 10 }}>
        <div style={{ fontWeight: "bold", fontSize: 13, color: "var(--color-accent, #d9924a)", marginBottom: 8 }}>
          MUTATION & VARIATION GRID
        </div>
        <VariationGrid variants={variationGrid} onPlay={handlePlayVariant} onAccept={handleAcceptVariant} />
      </div>

      {/* Rating & Notes Box */}
      <div style={{ width: 240, background: "var(--color-surface-2, #21201f)", border: "1px solid var(--color-border, #3c3a38)", borderRadius: 6, padding: 10 }}>
        <RatingPanel
          rating={ratings[preset.id] ?? 0}
          favorite={!!favorites[preset.id]}
          notes={notes[preset.id] ?? ""}
          tags={preset.tags}
          roles={preset.roles}
          onRate={onRate}
          onToggleFavorite={onToggleFavorite}
          onNotesChange={onNotesChange}
          onDiscard={onDiscard}
        />
      </div>
    </div>
  );
};
