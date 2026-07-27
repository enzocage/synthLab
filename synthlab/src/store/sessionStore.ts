// Zustand-Store fuer die Testsuite-UI (PLAN.md Phase 7). Haelt nur reaktiven
// UI-Zustand; die eigentliche Audio-Graph-Mutation passiert imperativ im
// AudioController.
import { create } from "zustand";
import { generateFullBank } from "../presets/generate";
import { mutateN } from "../presets/mutate";
import type { Preset, Role } from "../presets/schema";
import type { FxChainSettings } from "../audio/fx/types";

import { loadUserDataFromDb, saveRatingToDb, saveFavoriteToDb, saveNoteToDb, saveEditToDb, saveCustomPresetToDb, loadCustomPresetsFromDb, type CustomPresetRecord } from "../db/database";

export interface FilterState {
  search: string;
  role: Role | null;
  engine: string | null;
  onlyUnrated: boolean;
  onlyFavorites: boolean;
}

interface SessionState {
  bank: Preset[];
  currentIndex: number;
  filter: FilterState;
  ratings: Record<string, number>;
  favorites: Record<string, boolean>;
  discarded: Record<string, boolean>;
  notes: Record<string, string>;
  editedParams: Record<string, Record<string, number | string | boolean>>;
  editedFx: Record<string, FxChainSettings>;
  variationGrid: Preset[];
  abSlots: { A: Preset | null; B: Preset | null };
  activeSlot: "A" | "B";

  filteredIndices(): number[];
  currentPreset(): Preset | null;
  effectivePreset(preset: Preset): Preset;

  initPersistence(): Promise<void>;
  setFilter(patch: Partial<FilterState>): void;
  setIndexInFiltered(pos: number): void;
  stepFiltered(delta: number): void;
  jumpToRandomUnrated(): void;

  rate(presetId: string, rating: number): void;
  toggleFavorite(presetId: string): void;
  discard(presetId: string): void;
  setNote(presetId: string, note: string): void;
  setEditedParam(presetId: string, paramId: string, value: number | string | boolean): void;
  setEditedFx(presetId: string, fx: FxChainSettings): void;

  saveAsCustomPreset(name: string, role: Role, tags: string[], author?: string, notes?: string): Preset;

  generateVariations(amount: number): void;
  clearVariations(): void;

  setAbSlot(slot: "A" | "B", preset: Preset | null): void;
  setActiveSlot(slot: "A" | "B"): void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  bank: generateFullBank(),
  currentIndex: 0,
  filter: { search: "", role: null, engine: null, onlyUnrated: false, onlyFavorites: false },
  ratings: {},
  favorites: {},
  discarded: {},
  notes: {},
  editedParams: {},
  editedFx: {},
  variationGrid: [],
  abSlots: { A: null, B: null },
  activeSlot: "A",

  async initPersistence() {
    try {
      const data = await loadUserDataFromDb();
      const loadedCustoms = await loadCustomPresetsFromDb();
      const template = generateFullBank()[0];
      const customPresets: Preset[] = loadedCustoms.map((c) => ({
        ...(template ?? {}),
        id: c.id,
        name: c.name,
        engine: c.engine,
        roles: c.roles,
        tags: c.tags,
        params: c.params,
        fx: c.fx ?? (template?.fx ?? { drive: 0, tone: 0.5, ensemble: 0, delayTime: 0.3, delayFeedback: 0.3, delayMix: 0, reverbSize: 0.5, reverbMix: 0, stereoWidth: 1 }),
      }));

      set((s) => ({
        ratings: data.ratings,
        favorites: data.favorites,
        notes: data.notes,
        editedParams: data.editedParams,
        editedFx: data.editedFx,
        bank: customPresets.length > 0 ? [...customPresets, ...s.bank] : s.bank,
      }));
    } catch {
      /* noop */
    }
  },

  filteredIndices() {
    const { bank, filter, ratings, favorites, discarded } = get();
    const search = filter.search.trim().toLowerCase();
    const indices: number[] = [];
    bank.forEach((p, i) => {
      if (discarded[p.id]) return;
      if (filter.role && !p.roles.includes(filter.role)) return;
      if (filter.engine && p.engine !== filter.engine) return;
      if (filter.onlyUnrated && (ratings[p.id] ?? 0) > 0) return;
      if (filter.onlyFavorites && !favorites[p.id]) return;
      if (search && !p.name.toLowerCase().includes(search) && !p.tags.some((t) => t.includes(search))) return;
      indices.push(i);
    });
    return indices;
  },

  currentPreset() {
    const { bank, currentIndex } = get();
    return bank[currentIndex] ?? null;
  },

  effectivePreset(preset: Preset) {
    const edits = get().editedParams[preset.id];
    const fx = get().editedFx[preset.id];
    if (!edits && !fx) return preset;
    return { ...preset, params: edits ? { ...preset.params, ...edits } : preset.params, fx: fx ?? preset.fx };
  },

  setFilter(patch) {
    set((s) => ({ filter: { ...s.filter, ...patch } }));
  },

  setIndexInFiltered(pos) {
    const indices = get().filteredIndices();
    if (indices.length === 0) return;
    const clamped = Math.max(0, Math.min(indices.length - 1, pos));
    set({ currentIndex: indices[clamped], variationGrid: [] });
  },

  stepFiltered(delta) {
    const indices = get().filteredIndices();
    if (indices.length === 0) return;
    const currentPos = indices.indexOf(get().currentIndex);
    const validPos = currentPos < 0 ? 0 : currentPos;
    const nextPos = (validPos + delta + indices.length) % indices.length;
    set({ currentIndex: indices[nextPos], variationGrid: [] });
  },

  jumpToRandomUnrated() {
    const { bank, ratings, discarded } = get();
    const candidates = bank
      .map((_p, i) => i)
      .filter((i) => !discarded[bank[i].id] && (ratings[bank[i].id] ?? 0) === 0);
    if (candidates.length === 0) return;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    set({ currentIndex: pick, variationGrid: [] });
  },

  rate(presetId, rating) {
    set((s) => ({ ratings: { ...s.ratings, [presetId]: rating } }));
    saveRatingToDb(presetId, rating).catch(() => {});
  },

  toggleFavorite(presetId) {
    const nextFav = !get().favorites[presetId];
    set((s) => ({ favorites: { ...s.favorites, [presetId]: nextFav } }));
    saveFavoriteToDb(presetId, nextFav).catch(() => {});
  },

  discard(presetId) {
    set((s) => ({ discarded: { ...s.discarded, [presetId]: true } }));
  },

  setNote(presetId, note) {
    set((s) => ({ notes: { ...s.notes, [presetId]: note } }));
    saveNoteToDb(presetId, note).catch(() => {});
  },

  setEditedParam(presetId, paramId, value) {
    const newParams = { ...(get().editedParams[presetId] ?? {}), [paramId]: value };
    set((s) => ({
      editedParams: {
        ...s.editedParams,
        [presetId]: newParams,
      },
    }));
    saveEditToDb(presetId, newParams, get().editedFx[presetId]).catch(() => {});
  },

  setEditedFx(presetId, fx) {
    set((s) => ({ editedFx: { ...s.editedFx, [presetId]: fx } }));
    saveEditToDb(presetId, get().editedParams[presetId] ?? {}, fx).catch(() => {});
  },

  saveAsCustomPreset(name, role, tags, author, notes) {
    const current = get().currentPreset();
    if (!current) throw new Error("Kein Preset ausgewählt");
    const effective = get().effectivePreset(current);
    const id = `custom-${Date.now()}`;
    const newPreset: Preset = {
      ...effective,
      id,
      name,
      engine: effective.engine,
      roles: [role],
      tags: Array.from(new Set(["custom", ...tags])),
      params: { ...effective.params },
      fx: { ...effective.fx },
    };

    const record: CustomPresetRecord = {
      id,
      name,
      engine: effective.engine,
      roles: [role],
      tags: newPreset.tags,
      params: newPreset.params,
      fx: newPreset.fx,
      author,
      notes,
      createdAt: Date.now(),
    };

    set((s) => ({
      bank: [newPreset, ...s.bank],
      currentIndex: 0,
    }));

    saveCustomPresetToDb(record).catch(() => {});
    return newPreset;
  },

  generateVariations(amount) {
    const preset = get().currentPreset();
    if (!preset) return;
    const effective = get().effectivePreset(preset);
    const variants = mutateN(effective, amount, 8, Date.now() % 100000);
    set({ variationGrid: variants });
  },

  clearVariations() {
    set({ variationGrid: [] });
  },

  setAbSlot(slot, preset) {
    set((s) => ({ abSlots: { ...s.abSlots, [slot]: preset } }));
  },

  setActiveSlot(slot) {
    set({ activeSlot: slot });
  },
}));
