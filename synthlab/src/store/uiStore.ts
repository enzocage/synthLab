// Dedicated UI State & Selection Store for SynthLab (Plan 3 §13.1 & §18)
import { create } from "zustand";
import { DEFAULT_OCTAVE_BASE_NOTE, MIN_OCTAVE_BASE_NOTE, MAX_OCTAVE_BASE_NOTE } from "../midi/computerKeyboardMap";

export type DetailTab = "device" | "clip" | "compare" | "params";

export type Selection =
  | { kind: "none" }
  | { kind: "track"; trackIds: string[]; anchorId: string }
  | { kind: "scene"; sceneIds: string[]; anchorId: string }
  | { kind: "clip"; clipIds: string[]; anchorId: string }
  | { kind: "time"; startBeat: number; endBeat: number; trackIds: string[] }
  | { kind: "device"; trackId: string; slotIds: string[]; anchorId: string }
  | { kind: "parameter"; trackId: string; slotId: string; paramId: string }
  | { kind: "browser"; itemIds: string[]; anchorId: string };

export type MainView = "session" | "arrangement";
export type FocusZone = "control-bar" | "browser-sidebar" | "browser-filter" | "browser-results" | "main-view" | "detail-view" | "info-view";

const savedDetailHeight = typeof window !== "undefined" ? Number(window.localStorage.getItem("synthlab.detailHeight")) : NaN;
const initialDetailHeight = Number.isFinite(savedDetailHeight) ? Math.max(240, Math.min(720, savedDetailHeight)) : 380;
const savedMainView = typeof window !== "undefined" ? window.localStorage.getItem("synthlab.mainView") : null;
const initialMainView: MainView = savedMainView === "arrangement" ? "arrangement" : "session";
const readStoredBoolean = (key: string, fallback: boolean) => {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  return value === null ? fallback : value === "true";
};

interface UiState {
  selection: Selection;
  activeMainView: MainView;
  focusZone: FocusZone;
  activeDetailTab: DetailTab;
  browserOpen: boolean;
  detailOpen: boolean;
  detailHeight: number;
  statusMessage: string;
  helpOpen: boolean;
  synthGalleryOpen: boolean;
  computerKeyboardEnabled: boolean;
  octaveBaseNote: number;

  setSelection(selection: Selection): void;
  clearSelection(): void;
  setActiveMainView(view: MainView): void;
  setFocusZone(zone: FocusZone): void;
  setActiveDetailTab(tab: DetailTab): void;
  toggleBrowser(): void;
  toggleDetail(): void;
  setDetailHeight(height: number): void;
  setStatusMessage(msg: string): void;
  toggleHelp(): void;
  setHelpOpen(open: boolean): void;
  toggleSynthGallery(): void;
  setSynthGalleryOpen(open: boolean): void;
  toggleComputerKeyboard(): void;
  shiftOctave(delta: number): void;
}

export const useUiStore = create<UiState>((set) => ({
  selection: { kind: "none" },
  activeMainView: initialMainView,
  focusZone: "main-view",
  activeDetailTab: "device",
  browserOpen: readStoredBoolean("synthlab.browserOpen", true),
  detailOpen: readStoredBoolean("synthlab.detailOpen", true),
  detailHeight: initialDetailHeight,
  statusMessage: "Bereit · SynthLab Ableton-Style Workstation",
  helpOpen: false,
  synthGalleryOpen: false,
  computerKeyboardEnabled: false,
  octaveBaseNote: DEFAULT_OCTAVE_BASE_NOTE,

  setSelection(selection) {
    set({ selection });
  },

  clearSelection() {
    set({ selection: { kind: "none" } });
  },

  setActiveMainView(activeMainView) {
    if (typeof window !== "undefined") window.localStorage.setItem("synthlab.mainView", activeMainView);
    set({ activeMainView });
  },

  setFocusZone(focusZone) {
    set({ focusZone });
  },

  setActiveDetailTab(tab) {
    set({ activeDetailTab: tab, detailOpen: true });
  },

  toggleBrowser() {
    set((s) => {
      const browserOpen = !s.browserOpen;
      if (typeof window !== "undefined") window.localStorage.setItem("synthlab.browserOpen", String(browserOpen));
      return { browserOpen };
    });
  },

  toggleDetail() {
    set((s) => {
      const detailOpen = !s.detailOpen;
      if (typeof window !== "undefined") window.localStorage.setItem("synthlab.detailOpen", String(detailOpen));
      return { detailOpen };
    });
  },

  setDetailHeight(height) {
    const nextHeight = Math.max(240, Math.min(720, Math.round(height)));
    if (typeof window !== "undefined") window.localStorage.setItem("synthlab.detailHeight", String(nextHeight));
    set({ detailHeight: nextHeight });
  },

  setStatusMessage(statusMessage) {
    set({ statusMessage });
  },

  toggleHelp() {
    set((s) => ({ helpOpen: !s.helpOpen }));
  },

  setHelpOpen(open) {
    set({ helpOpen: open });
  },

  toggleSynthGallery() {
    set((s) => ({ synthGalleryOpen: !s.synthGalleryOpen }));
  },

  setSynthGalleryOpen(open) {
    set({ synthGalleryOpen: open });
  },

  toggleComputerKeyboard() {
    set((s) => ({ computerKeyboardEnabled: !s.computerKeyboardEnabled }));
  },

  shiftOctave(delta) {
    set((s) => ({
      octaveBaseNote: Math.max(MIN_OCTAVE_BASE_NOTE, Math.min(MAX_OCTAVE_BASE_NOTE, s.octaveBaseNote + delta * 12)),
    }));
  },
}));
