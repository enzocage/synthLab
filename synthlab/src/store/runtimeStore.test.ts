import { beforeEach, describe, expect, it } from "vitest";
import { useRuntimeStore } from "./runtimeStore";

describe("runtime transport store", () => {
  beforeEach(() => {
    useRuntimeStore.setState({
      transportStatus: "stopped",
      absoluteBeat: 0,
      bar: 1,
      beatInBar: 1,
      tempo: 60,
      timeSignature: [4, 4],
      lastAudioTime: null,
      transportError: null,
    });
  });

  it("derives bar and beat from audio time while playing", () => {
    const state = useRuntimeStore.getState();
    state.markTransportPlaying(10);
    useRuntimeStore.getState().updateTransportPosition(15.5);
    const next = useRuntimeStore.getState();
    expect(next.absoluteBeat).toBe(5.5);
    expect(next.bar).toBe(2);
    expect(next.beatInBar).toBe(2.5);
  });

  it("does not advance while stopped", () => {
    useRuntimeStore.getState().updateTransportPosition(20);
    expect(useRuntimeStore.getState().absoluteBeat).toBe(0);
  });

  it("clamps tempo to the supported range", () => {
    useRuntimeStore.getState().setTempo(5000);
    expect(useRuntimeStore.getState().tempo).toBe(999);
    useRuntimeStore.getState().setTempo(1);
    expect(useRuntimeStore.getState().tempo).toBe(20);
  });
});

