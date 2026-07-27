// Dedicated UI State & Selection Store for SynthLab (Plan 3 §13.1 & §18)
import { create } from "zustand";

export type DetailTab = "device" | "clip" | "compare";

export type Selection =
  | { kind: "track"; trackId: string }
  | { kind: "clip"; trackId: string; clipId: string }
  | { kind: "device"; trackId: string; deviceId: string }
  | { kind: "preset"; presetId: string; preview: boolean }
  | { kind: "compare"; presetId: string };

interface UiState {
  selection: Selection;
  activeDetailTab: DetailTab;
  browserOpen: boolean;
  detailOpen: boolean;
  statusMessage: string;

  setSelection(selection: Selection): void;
  setActiveDetailTab(tab: DetailTab): void;
  toggleBrowser(): void;
  toggleDetail(): void;
  setStatusMessage(msg: string): void;
}

export const useUiStore = create<UiState>((set) => ({
  selection: { kind: "track", trackId: "" },
  activeDetailTab: "device",
  browserOpen: true,
  detailOpen: true,
  statusMessage: "Bereit · SynthLab Ableton-Style Workstation",

  setSelection(selection) {
    set({ selection });
  },

  setActiveDetailTab(tab) {
    set({ activeDetailTab: tab, detailOpen: true });
  },

  toggleBrowser() {
    set((s) => ({ browserOpen: !s.browserOpen }));
  },

  toggleDetail() {
    set((s) => ({ detailOpen: !s.detailOpen }));
  },

  setStatusMessage(statusMessage) {
    set({ statusMessage });
  },
}));
