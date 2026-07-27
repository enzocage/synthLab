import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCommandStore } from "./commandStore";

describe("command history", () => {
  beforeEach(() => useCommandStore.getState().clearHistory());

  it("executes, undoes and redoes a command", () => {
    const execute = vi.fn();
    const undo = vi.fn();
    useCommandStore.getState().execute({ id: "tempo", label: "Tempo ändern", execute, undo });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(useCommandStore.getState().dirty).toBe(true);

    useCommandStore.getState().undo();
    expect(undo).toHaveBeenCalledTimes(1);
    expect(useCommandStore.getState().redoStack).toHaveLength(1);

    useCommandStore.getState().redo();
    expect(execute).toHaveBeenCalledTimes(2);
    expect(useCommandStore.getState().undoStack).toHaveLength(1);
  });

  it("clears redo history after a new command", () => {
    const command = { id: "one", label: "One", execute: vi.fn(), undo: vi.fn() };
    useCommandStore.getState().execute(command);
    useCommandStore.getState().undo();
    useCommandStore.getState().execute({ ...command, id: "two" });
    expect(useCommandStore.getState().redoStack).toHaveLength(0);
  });
});

