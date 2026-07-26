// Synchronisiert research/derived/*.json nach synthlab/src/data/derived/,
// weil TS/Vite Imports ausserhalb des Projekt-rootDir nicht zuverlaessig sind.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "research", "derived");
const DEST = path.join(ROOT, "synthlab", "src", "data", "derived");

fs.mkdirSync(DEST, { recursive: true });
for (const file of fs.readdirSync(SRC)) {
  if (!file.endsWith(".json")) continue;
  fs.copyFileSync(path.join(SRC, file), path.join(DEST, file));
  console.log(`synced ${file}`);
}
