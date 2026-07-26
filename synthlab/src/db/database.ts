// Dexie IndexedDB Persistence Layer für SynthLab Session & User Data
import Dexie, { type EntityTable } from "dexie";
import type { FxChainSettings } from "../audio/fx/types";

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
}

const db = new Dexie("SynthLabDatabase") as Dexie & {
  ratings: EntityTable<UserRating, "presetId">;
  favorites: EntityTable<UserFavorite, "presetId">;
  notes: EntityTable<UserNote, "presetId">;
  edits: EntityTable<UserEdit, "presetId">;
};

db.version(1).stores({
  ratings: "presetId",
  favorites: "presetId",
  notes: "presetId",
  edits: "presetId",
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
  for (const e of editsArr) {
    if (e.params) editedParams[e.presetId] = e.params;
    if (e.fx) editedFx[e.presetId] = e.fx;
  }

  return { ratings, favorites, notes, editedParams, editedFx };
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

export async function saveEditToDb(presetId: string, params: Record<string, number | string | boolean>, fx?: FxChainSettings) {
  await db.edits.put({ presetId, params, fx });
}

export { db };
