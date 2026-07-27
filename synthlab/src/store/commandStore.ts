import { create } from "zustand";

export interface UndoableCommand {
  id: string;
  label: string;
  execute(): void;
  undo(): void;
}

interface CommandState {
  undoStack: UndoableCommand[];
  redoStack: UndoableCommand[];
  dirty: boolean;
  execute(command: UndoableCommand): void;
  undo(): void;
  redo(): void;
  clearHistory(): void;
  markSaved(): void;
}

const HISTORY_LIMIT = 100;

export const useCommandStore = create<CommandState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  dirty: false,

  execute(command) {
    command.execute();
    set((state) => ({
      undoStack: [...state.undoStack, command].slice(-HISTORY_LIMIT),
      redoStack: [],
      dirty: true,
    }));
  },

  undo() {
    const command = get().undoStack.at(-1);
    if (!command) return;
    command.undo();
    set((state) => ({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, command],
      dirty: true,
    }));
  },

  redo() {
    const command = get().redoStack.at(-1);
    if (!command) return;
    command.execute();
    set((state) => ({
      undoStack: [...state.undoStack, command],
      redoStack: state.redoStack.slice(0, -1),
      dirty: true,
    }));
  },

  clearHistory() {
    set({ undoStack: [], redoStack: [], dirty: false });
  },

  markSaved() {
    set({ dirty: false });
  },
}));

