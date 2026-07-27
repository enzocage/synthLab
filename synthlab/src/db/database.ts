// Dexie IndexedDB Persistence Layer für SynthLab Session & User Data
import Dexie, { type EntityTable } from "dexie";
import { fxRackFromLegacy, type FxChainSettings, type FxRackState } from "../audio/fx/types";
import type { Role } from "../presets/schema";

export interface UserRating {
  presetId: string;
  rating: number;
}

export interface UserFavorite {
  presetId: string;
  favorite: boolean;
}

export interface UserNote {
  presetId: string;
  note: string;
}

export interface UserEdit {
  presetId: string;
  params: Record<string, number | string | boolean>;
  fx?: FxChainSettings;
  /** V2 slot representation; kept alongside V1 during the audio-graph migration. */
  fxRack?: FxRackState;
}

export interface CustomPresetRecord {
  id: string;
  name: string;
  engine: string;
  roles: Role[];
  tags: string[];
  params: Record<string, number | string | boolean>;
  fx?: FxChainSettings;
  author?: string;
  notes?: string;
  createdAt: number;
}

const db = new Dexie("SynthLabDatabase") as Dexie & {
  ratings: EntityTable<UserRating, "presetId">;
  favorites: EntityTable<UserFavorite, "presetId">;
  notes: EntityTable<UserNote, "presetId">;
  edits: EntityTable<UserEdit, "presetId">;
  customPresets: EntityTable<CustomPresetRecord, "id">;
};

db.version(1).stores({
  ratings: "presetId",
  favorites: "presetId",
  notes: "presetId",
  edits: "presetId",
});

// Additive migration: preserve the V1 object while materializing a lossless
// V2 rack for existing edits. Keeping both formats makes rollback safe.
db.version(2)
  .stores({
    ratings: "presetId",
    favorites: "presetId",
    notes: "presetId",
    edits: "presetId",
  })
  .upgrade(async (tx) => {
    await tx
      .table<UserEdit>("edits")
      .toCollection()
      .modify((edit) => {
        if (edit.fx && !edit.fxRack) edit.fxRack = fxRackFromLegacy(edit.fx);
      });
  });

// Version 3: Adds customPresets table for user-created custom patches
db.version(3).stores({
  ratings: "presetId",
  favorites: "presetId",
  notes: "presetId",
  edits: "presetId",
  customPresets: "id, engine",
});

export async function loadUserDataFromDb() {
  const ratingsArr = await db.ratings.toArray();
  const favoritesArr = await db.favorites.toArray();
  const notesArr = await db.notes.toArray();
  const editsArr = await db.edits.toArray();

  const ratings: Record<string, number> = {};
  for (const r of ratingsArr) ratings[r.presetId] = r.rating;

  const favorites: Record<string, boolean> = {};
  for (const f of favoritesArr) favorites[f.presetId] = f.favorite;

  const notes: Record<string, string> = {};
  for (const n of notesArr) notes[n.presetId] = n.note;

  const editedParams: Record<string, Record<string, number | string | boolean>> = {};
  const editedFx: Record<string, FxChainSettings> = {};
  const editedFxRack: Record<string, FxRackState> = {};
  for (const e of editsArr) {
    if (e.params) editedParams[e.presetId] = e.params;
    if (e.fx) editedFx[e.presetId] = e.fx;
    if (e.fxRack) editedFxRack[e.presetId] = e.fxRack;
  }

  return { ratings, favorites, notes, editedParams, editedFx, editedFxRack };
}

export async function saveRatingToDb(presetId: string, rating: number) {
  await db.ratings.put({ presetId, rating });
}

export async function saveFavoriteToDb(presetId: string, favorite: boolean) {
  await db.favorites.put({ presetId, favorite });
}

export async function saveNoteToDb(presetId: string, note: string) {
  await db.notes.put({ presetId, note });
}

export async function saveEditToDb(
  presetId: string,
  params: Record<string, number | string | boolean>,
  fx?: FxChainSettings,
  fxRack?: FxRackState,
) {
  await db.edits.put({ presetId, params, fx, fxRack: fxRack ?? (fx ? fxRackFromLegacy(fx) : undefined) });
}

export async function saveCustomPresetToDb(record: CustomPresetRecord) {
  await db.customPresets.put(record);
}

export async function deleteCustomPresetFromDb(id: string) {
  await db.customPresets.delete(id);
}

export async function loadCustomPresetsFromDb(): Promise<CustomPresetRecord[]> {
  try {
    return await db.customPresets.toArray();
  } catch {
    return [];
  }
}

export { db };
