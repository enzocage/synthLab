// Dedicated UI State & Selection Store for SynthLab (Plan 3 §13.1 & §18)
import { create } from "zustand";
import { DEFAULT_OCTAVE_BASE_NOTE, MIN_OCTAVE_BASE_NOTE, MAX_OCTAVE_BASE_NOTE } from "../midi/computerKeyboardMap";

export type DetailTab = "device" | "clip" | "compare" | "params";

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
  helpOpen: boolean;
  computerKeyboardEnabled: boolean;
  octaveBaseNote: number;

  setSelection(selection: Selection): void;
  setActiveDetailTab(tab: DetailTab): void;
  toggleBrowser(): void;
  toggleDetail(): void;
  setStatusMessage(msg: string): void;
  toggleHelp(): void;
  setHelpOpen(open: boolean): void;
  toggleComputerKeyboard(): void;
  shiftOctave(delta: number): void;
}

export const useUiStore = create<UiState>((set) => ({
  selection: { kind: "track", trackId: "" },
  activeDetailTab: "device",
  browserOpen: true,
  detailOpen: true,
  statusMessage: "Bereit · SynthLab Ableton-Style Workstation",
  helpOpen: false,
  computerKeyboardEnabled: false,
  octaveBaseNote: DEFAULT_OCTAVE_BASE_NOTE,

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

  toggleHelp() {
    set((s) => ({ helpOpen: !s.helpOpen }));
  },

  setHelpOpen(open) {
    set({ helpOpen: open });
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
