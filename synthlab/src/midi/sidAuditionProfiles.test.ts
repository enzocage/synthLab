import { describe, it, expect } from "vitest";
import { SID_AUDITION_PROFILES } from "./sidAuditionProfiles";

describe("SID Audition Profiles", () => {
  it("defines all 12 specified audition profiles", () => {
    const keys = Object.keys(SID_AUDITION_PROFILES);
    expect(keys.length).toBe(12);
    expect(keys).toContain("BASS_LOCK");
    expect(keys).toContain("SYNC_RING_PAIR");
    expect(keys).toContain("RANGE_VELOCITY");
  });

  it("ensures each profile has valid events and non-zero duration", () => {
    for (const key of Object.keys(SID_AUDITION_PROFILES)) {
      const p = SID_AUDITION_PROFILES[key as keyof typeof SID_AUDITION_PROFILES];
      expect(p.durationSeconds).toBeGreaterThan(0);
      expect(p.sequence.events.length).toBeGreaterThan(0);
    }
  });
});
