import { create } from "zustand";

export type TransportStatus = "stopped" | "starting" | "playing" | "recording" | "error";
export type LaunchQuantization = "none" | "1/32" | "1/16" | "1/8" | "1/4" | "1/2" | "1-bar" | "2-bars" | "4-bars";

export interface LoopRange {
  startBeat: number;
  endBeat: number;
}

interface RuntimeState {
  transportStatus: TransportStatus;
  absoluteBeat: number;
  bar: number;
  beatInBar: number;
  tempo: number;
  timeSignature: [number, number];
  loop: LoopRange | null;
  launchQuantization: LaunchQuantization;
  transportError: string | null;
  lastAudioTime: number | null;

  markTransportStarting(): void;
  markTransportPlaying(audioTime: number): void;
  markTransportStopped(): void;
  markTransportError(message: string): void;
  updateTransportPosition(audioTime: number): void;
  setTempo(tempo: number): void;
  setLaunchQuantization(value: LaunchQuantization): void;
  setLoop(loop: LoopRange | null): void;
}

const clampTempo = (tempo: number) => Math.max(20, Math.min(999, Math.round(tempo * 100) / 100));

export const useRuntimeStore = create<RuntimeState>((set) => ({
  transportStatus: "stopped",
  absoluteBeat: 0,
  bar: 1,
  beatInBar: 1,
  tempo: 66,
  timeSignature: [4, 4],
  loop: null,
  launchQuantization: "1-bar",
  transportError: null,
  lastAudioTime: null,

  markTransportStarting() {
    set({ transportStatus: "starting", transportError: null });
  },

  markTransportPlaying(audioTime) {
    set({ transportStatus: "playing", transportError: null, lastAudioTime: audioTime });
  },

  markTransportStopped() {
    set({ transportStatus: "stopped", lastAudioTime: null });
  },

  markTransportError(message) {
    set({ transportStatus: "error", transportError: message, lastAudioTime: null });
  },

  updateTransportPosition(audioTime) {
    set((state) => {
      if (state.transportStatus !== "playing" && state.transportStatus !== "recording") return state;
      if (state.lastAudioTime === null) return { lastAudioTime: audioTime };
      const deltaBeats = Math.max(0, audioTime - state.lastAudioTime) * state.tempo / 60;
      const absoluteBeat = state.absoluteBeat + deltaBeats;
      const beatsPerBar = state.timeSignature[0];
      return {
        absoluteBeat,
        bar: Math.floor(absoluteBeat / beatsPerBar) + 1,
        beatInBar: (absoluteBeat % beatsPerBar) + 1,
        lastAudioTime: audioTime,
      };
    });
  },

  setTempo(tempo) {
    set({ tempo: clampTempo(tempo) });
  },

  setLaunchQuantization(launchQuantization) {
    set({ launchQuantization });
  },

  setLoop(loop) {
    set({ loop });
  },
}));

