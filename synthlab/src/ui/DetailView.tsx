import React from "react";
import { useUiStore, type DetailTab } from "../store/uiStore";
import { DeviceChain } from "./DeviceChain";
import { ClipView } from "./ClipView";
import { CompareView } from "./CompareView";
import type { Preset } from "../presets/schema";

interface Props {
  preset: Preset;
  onLiveEdit(paramId: string, value: number | string | boolean): void;
  onFxChange(fx: any): void;
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
  arpSettings: any;
  onArpChange(patch: any): void;
}

export const DetailView: React.FC<Props> = (props) => {
  const activeTab = useUiStore((s) => s.activeDetailTab);
  const setActiveTab = useUiStore((s) => s.setActiveDetailTab);
  const detailOpen = useUiStore((s) => s.detailOpen);

  if (!detailOpen) return null;

  return (
    <div
      style={{
        height: "var(--height-detail, 260px)",
        background: "var(--color-surface-1, #13161c)",
        borderTop: "1px solid var(--color-border, #303744)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Detail Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: "4px 8px",
          background: "var(--color-surface-2, #1a1e26)",
          borderBottom: "1px solid var(--color-border-subtle, #232832)",
        }}
      >
        {(["device", "clip", "compare"] as DetailTab[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                fontSize: 11,
                padding: "3px 12px",
                borderRadius: 4,
                background: isActive ? "var(--color-accent, #4a90d9)" : "transparent",
                color: isActive ? "#000" : "var(--color-text-secondary, #a0a8b6)",
                border: "none",
                fontWeight: isActive ? "bold" : "normal",
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              {tab === "device" ? "Device Chain" : tab === "clip" ? "Clip & Perform" : "Compare & Rating"}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {activeTab === "device" && (
          <DeviceChain preset={props.preset} onLiveEdit={props.onLiveEdit} onFxChange={props.onFxChange} />
        )}
        {activeTab === "clip" && (
          <ClipView arpSettings={props.arpSettings} onArpChange={props.onArpChange} />
        )}
        {activeTab === "compare" && (
          <CompareView
            preset={props.preset}
            ratings={props.ratings}
            favorites={props.favorites}
            notes={props.notes}
            onRate={props.onRate}
            onToggleFavorite={props.onToggleFavorite}
            onNotesChange={props.onNotesChange}
            onDiscard={props.onDiscard}
            variationGrid={props.variationGrid}
            handlePlayVariant={props.handlePlayVariant}
            handleAcceptVariant={props.handleAcceptVariant}
          />
        )}
      </div>
    </div>
  );
};
