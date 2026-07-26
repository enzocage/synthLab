# Synchronisierte Kopien von `research/derived/`

Diese JSON-Dateien sind 1:1-Kopien aus `research/derived/` (siehe
`research/extract/*.mjs` für die Erzeugung und `research/LICENSES.md` für die
Herkunft). Sie liegen zusätzlich hier, weil TypeScript/Vite Imports außerhalb
des Projekt-`rootDir` (`synthlab/`) nicht zuverlässig unterstützen.

**Nicht von Hand editieren.** Bei Änderungen an `research/derived/*.json` mit
`node research/sync-derived.mjs` neu synchronisieren.
