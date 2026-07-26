import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Arpeggiator, defaultArpSettings } from "./arpeggiator";

class FakeCtx {
  get currentTime() {
    return Date.now() / 1000;
  }
}

class FakeVoiceManager {
  calls: Array<{ type: "on" | "off"; note: number; time: number }> = [];
  noteOn(note: number, _v: number, time: number) {
    this.calls.push({ type: "on", note, time });
  }
  noteOff(note: number, time: number) {
    this.calls.push({ type: "off", note, time });
  }
}

describe("Arpeggiator", () => {
  let ctx: FakeCtx;
  let vm: FakeVoiceManager;
  let arp: Arpeggiator;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    ctx = new FakeCtx();
    vm = new FakeVoiceManager();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    arp = new Arpeggiator(ctx as any, () => vm as any);
    arp.setBpm(120);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("spielt keine Noten, solange keine Taste gehalten wird", () => {
    arp.setSettings({ ...defaultArpSettings(), enabled: true });
    vi.advanceTimersByTime(500);
    expect(vm.calls.length).toBe(0);
  });

  it("triggert Noten, sobald eine Taste gehalten wird", () => {
    arp.setSettings({ ...defaultArpSettings(), enabled: true, rateDivision: 4 });
    arp.noteOn(60);
    vi.advanceTimersByTime(1000);
    expect(vm.calls.some((c) => c.type === "on" && c.note === 60)).toBe(true);
  });

  it("up-Pattern mit 2 Oktaven deckt Grundnoten + eine Oktave hoeher ab", () => {
    arp.setSettings({ ...defaultArpSettings(), enabled: true, pattern: "up", octaves: 2, rateDivision: 8 });
    arp.noteOn(60);
    arp.noteOn(64);
    vi.advanceTimersByTime(2000);
    const notesPlayed = new Set(vm.calls.filter((c) => c.type === "on").map((c) => c.note));
    expect(notesPlayed.has(60)).toBe(true);
    expect(notesPlayed.has(64)).toBe(true);
    expect(notesPlayed.has(72)).toBe(true); // 60+12
    expect(notesPlayed.has(76)).toBe(true); // 64+12
  });

  it("latch haelt Noten nach Loslassen, bis eine komplett neue Note gespielt wird", () => {
    arp.setSettings({ ...defaultArpSettings(), enabled: true, latch: true, rateDivision: 8 });
    arp.noteOn(60);
    arp.noteOff(60);
    vi.advanceTimersByTime(500);
    const notesAfterRelease = new Set(vm.calls.filter((c) => c.type === "on").map((c) => c.note));
    expect(notesAfterRelease.has(60)).toBe(true);

    vm.calls = [];
    arp.noteOn(67);
    arp.noteOff(67);
    vi.advanceTimersByTime(500);
    const notesAfterNewChord = new Set(vm.calls.filter((c) => c.type === "on").map((c) => c.note));
    expect(notesAfterNewChord.has(67)).toBe(true);
    expect(notesAfterNewChord.has(60)).toBe(false);
  });

  it("stoppt und raeumt auf, wenn enabled auf false gesetzt wird", () => {
    arp.setSettings({ ...defaultArpSettings(), enabled: true, rateDivision: 4 });
    arp.noteOn(60);
    vi.advanceTimersByTime(300);
    arp.setSettings({ ...defaultArpSettings(), enabled: false });
    const callsAfterStop = vm.calls.length;
    vi.advanceTimersByTime(1000);
    expect(vm.calls.length).toBe(callsAfterStop);
  });
});
