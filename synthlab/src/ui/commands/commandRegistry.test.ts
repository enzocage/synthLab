import { describe, expect, it } from "vitest";
import { COMMANDS, resolveCommand } from "./commandRegistry";

describe("command registry", () => {
  it("keeps command ids unique", () => {
    expect(new Set(COMMANDS.map((command) => command.id)).size).toBe(COMMANDS.length);
  });

  it("resolves normal and primary-modifier shortcuts separately", () => {
    expect(resolveCommand(" ", false)).toBe("transport.toggle");
    expect(resolveCommand("z", true)).toBe("history.undo");
    expect(resolveCommand("z", false)).toBe("variation.play5");
  });
});

