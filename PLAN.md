# SynthLab — Multi-Synthesizer + Preset-Testsuite für Ambient

**Ziel:** Eine Web-Anwendung, mit der du hunderte bis tausende Synthesizer-Presets in
Sekunden akustisch durchhörst, parametrisch anpasst, bewertest und die guten in
Sammlungen sicherst — als Ausgangsmaterial für die spätere Ambient-Kompositions-
maschine.

**Kernmetrik des Projekts:** *Zeit von "Preset sehen" bis "Preset beurteilt"*.
Zielwert < 3 Sekunden pro Preset, ohne Maus, ohne Ladepause, ohne Klick-Artefakte.

---

## 0. Grundentscheidungen

| Frage | Entscheidung | Begründung |
| --- | --- | --- |
| Laufzeit | Browser, Web Audio API | Sofortiger Klang, kein Server, kein SuperCollider-Setup. `Musikmaschine.md` bewertet Tone.js explizit als „beste Weblösung" für genau diesen interaktiven Fall. |
| Substrat | Tone.js 15 (MIT) + rohe Web-Audio-Knoten + AudioWorklet | Transport, Scheduling und Standard-FX geschenkt; eigene Engines dort, wo Tone.js nichts hat (Wavetable-Morph, Granular, Modal, Additiv, FDN-Reverb). |
| App-Stack | Vite + React 19 + TypeScript, 100 % clientseitig | Kein Backend, kein Deploy, HMR beim Sounddesign. |
| Speicherung | IndexedDB + JSON-Export/Import | Offline, verlustfrei, versionierbar, direkt weiterverwendbar. |
| Verzeichnis | neues `synthlab/` ✔ *(bestätigt)* | `ambient-lab/` (unangetasteter Cloudflare-vinext-Starter) bleibt unberührt. |
| Engine-Umfang | alle 13 Engines in Runde 1 ✔ *(bestätigt)* | Maximale Preset-Vielfalt von Anfang an; längere Bauzeit bewusst in Kauf genommen. |
| MIDI-Eingang | generative Phrasen **+ Web-MIDI-Hardware** ✔ *(bestätigt)* | Kein Datei-Import in Runde 1; Hardware-Keyboard spielt parallel zur laufenden Phrase. |
| Fremdcode | `research/vendor/` = **nur Lesematerial** | Kein GPL-Code (Surge, Vital, SuperCollider, Sonic Pi) wandert in `synthlab/`. Engines werden aus den *Verfahren* neu in TypeScript implementiert. Siehe `research/LICENSES.md`. |
| Presets | deterministisch generiert aus `(engine, archetype, seed)` | Keine fremden Factory-Bänke kopieren (Politik aus `preset_sources.md` bleibt gültig), trotzdem 1000+ Presets, jedes exakt reproduzierbar. |

**Nicht-Ziel dieser Ausbaustufe:** das fertige Album-Rendering. Das Preset-Format
wird aber bewusst engine-agnostisch gehalten, damit Phase 11 einen SuperCollider-/
Supriya-Renderer daranhängen kann.

---

## Phase 0 — Repo-Ernte  *(läuft)*

Shallow-Clone aller in den Analysedokumenten genannten Projekte nach
`research/vendor/`. Große Repos partiell (`--filter=blob:none --sparse`).

| Repo | Lizenz | Wofür wir es lesen |
| --- | --- | --- |
| Tone.js | MIT | direkte Abhängigkeit; Transport, FX-Topologien |
| AMY | Apache-2.0 | Juno-Emulation, DX7-FM-Operatorgraphen, additive Partial-Rezepte, Breakpoint-Hüllkurven |
| DaisySP | MIT | Oszillator-, Filter-, Percussion-, String-, Modal-Modelle inkl. Parameterbereichen |
| STK | MIT-artig | Physical Modeling: Bläser, Saiten, Modal Bar, Tube Bell, Reverb-Modelle |
| FunDSP | MIT/Apache-2.0 | Filtertopologien, Rausch-Familien, 32-Kanal-FDN-Reverb |
| isobar | MIT | Pattern-Familien für den MIDI-Phrasengenerator (Euklidisch, Markov, L-System, Brownian) |
| MusicLang | BSD-2 | modale Grammatik, Voicings, Stufenharmonik |
| Supriya | MIT | Zielformat für den späteren SC-Export |
| sk-engines | — | Softcut/qdelay: Tape-Loop- und Varispeed-Konzepte |
| Surge XT | GPL-3.0 | **nur Referenz**: Parametertaxonomie, Filtermodelle, Modulationsmatrix |
| Vital | GPL-3.0 | **nur Referenz**: Wavetable-/Spektral-Warping-Konzepte |
| SuperCollider | GPL-3.0 | **nur Referenz**: UGen-Katalog, Granular-/Spektral-Verfahren |
| Csound | LGPL-2.1+ | **nur Referenz**: Opcode-Katalog als Verfahrens-Landkarte |
| faustlibraries | LGPL + Ausnahmen | **nur Referenz**: DSP-Bausteinkatalog |
| pyo, ChucK, Sonic Pi, FluidSynth | div. | **nur Referenz**: Synth-Designs, UGen-Listen, Effektketten |

**Ergebnis:** `research/vendor/`, `research/clone.log`, `research/LICENSES.md`.

---

## Phase 1 — Wissens-Extraktion

Aus `vendor/` wird maschinenlesbares Wissen destilliert nach `research/derived/`.
Skripte in `research/extract/` (Node), Ausgabe als JSON, jedes Feld mit Herkunft.

1. `synthesis-methods.json` — Verfahrenslandkarte (Subtraktiv, Wavetable, FM, Additiv,
   Granular, Modal, Waveguide, Wavefolding, Phase Distortion, Spektral, Karplus-Strong,
   Perkussiv) mit je: typische Parameter, sinnvolle Wertebereiche, Ambient-Eignung.
2. `fm-algorithms.json` — DX7-/AMY-Operatorgraphen (32 klassische Algorithmen) als
   Adjazenzlisten für die 6-Op-FM-Engine.
3. `modal-materials.json` — Modalfrequenz-Verhältnisse und Dämpfungen für Glas, Metall,
   Holz, Stein, Membran (abgeleitet aus STK-/DaisySP-Modellen).
4. `filter-models.json` — Filtertopologien mit Cutoff-/Resonanz-Kennlinien.
5. `reverb-topologies.json` — FDN-, Allpass-Ketten- und Schimmer-Konfigurationen.
6. `pattern-families.json` — Pattern-Typen aus isobar für den Phrasengenerator.
7. `ambient-rules.json` — die Kompositions-, Klangdesign- und Produktionsregeln aus
   `Musikmaschine.md` §2 als ausführbare Constraints (Modulationsraten, erlaubte
   Dichten, Headroom, Stereo-Korrelation, Smoothing-Pflichten).

**Akzeptanz:** jedes Derivat validiert gegen ein Zod-Schema; keine Datei enthält
kopierten Fremdcode, nur numerische/strukturelle Ableitungen mit `source`-Feld.

---

## Phase 2 — App-Skeleton + Audio-Core

`synthlab/` scaffolden (Vite/React/TS/Tone.js/zustand).

Audio-Core (`src/audio/core/`):
- `AudioEngine` — Singleton, lazy `resume()` bei erster Nutzergeste, fixe Blockgröße,
  Master-Kette, Panic-Funktion.
- `VoiceManager` — Polyphonie, Voice-Stealing (ältester/leisester), Portamento,
  Note-Off-Release-Tails ohne Klick.
- `ParamSmoother` — alle Parameteränderungen laufen über
  `setTargetAtTime`/Rampen; kein einziger Sprung im Audiothread (Regel aus
  `Musikmaschine.md`: "Welche Parameteränderungen benötigen Smoothing").
- `PresetLoader` — Hot-Swap: neuer Preset-Graph wird im Hintergrund aufgebaut,
  crossfade in 15–40 ms, alter Graph nach Release entsorgt. **Das ist die
  Voraussetzung für < 3 s pro Preset.**
- `Meters` — Peak/RMS/Korrelation via AnalyserNode, 30 fps in die UI.

**Akzeptanz:** Preset-Wechsel während laufender Wiedergabe ist hörbar nahtlos;
kein Klick, keine Lücke, CPU stabil.

---

## Phase 3 — Synth-Engines

Gemeinsames Interface: `Engine { id, params: ParamSpec[], createVoice(), globals }`.
Jede Engine deklariert ihr Parameterschema selbst → UI und Preset-Generator sind
generisch und müssen pro Engine nicht angefasst werden.

| # | Engine | Verfahren | Primäre Rollen |
| --- | --- | --- | --- |
| 1 | `va-poly` | Subtraktiv, 2 Osc + Sub + Noise, Unison, Ladder/SVF | pad, synth, bass |
| 2 | `wavetable` | Wavetable-Morph über `PeriodicWave`-Interpolation + Spektral-Warp | pad, synth, fx |
| 3 | `fm6` | 6-Operator-FM, 32 Algorithmen, Feedback | bell, bass, synth, fx |
| 4 | `additive` | Partialbank mit spektraler Hüllkurve, Inharmonizität, Drift | drone, pad, fx |
| 5 | `granular` | Granularwolke aus intern gerendertem Buffer, Position/Größe/Streuung | texture, fx, pad |
| 6 | `modal` | Resonatorbank (Glas/Metall/Holz), gestrichen/geschlagen | bell, texture, fx |
| 7 | `string` | Karplus-Strong / Waveguide, steife Saite, lange Dämpfung | pluck, melody, texture |
| 8 | `noisefield` | gefiltertes Rauschen, Bandresonatoren, Atem-/Nebelflächen | texture, fx, pad |
| 9 | `drone` | Multi-Detune-Stack mit Analog-Drift, Schwebungssteuerung | drone, pad |
| 10 | `wavefold` | West-Coast-Komplexoszillator, Wavefolding, Timbre/Fold-Achse | synth, bass, fx |
| 11 | `phasedist` | Phase Distortion + Hard Sync | synth, arp, fx |
| 12 | `perc` | Analog-/Synth-Percussion, Drip, Modal-Perkussion | rhythm |
| 13 | `subbass` | Sub/Bass mit Sättigung, Sub-Oktave, Mono-Fold | bass |

**Akzeptanz pro Engine:** spielt sauber über 5 Oktaven, kein Aliasing bis C7,
kein Klick bei Note-On/Off, keine NaN-Zustände bei Extremwerten, Parameter-Sweeps
über den vollen Bereich bleiben stabil.

---

## Phase 4 — FX & Master

Pro Preset eine schlanke, feste Kette (Reihenfolge fix = schneller vergleichbar):

`Drive → Filter-Post → Chorus/Ensemble → Delay (Tape/PingPong) → Reverb (FDN/Schimmer) → Width → Master`

Plus: Ambient-Spezialisten aus den Dokumenten — Freeze/Infinite-Reverb,
Pitch-Shift-im-Feedback (Shimmer), Tape-Wow/Flutter, Spectral Blur.
Master: sanfter Limiter, korrekter Headroom, Meter, kein Klang-schönfärbendes
Mastering (die Bewertung soll ehrlich sein).

---

## Phase 5 — Preset-Modell, Generatoren, Bank

**Schema** (`presets/schema.ts`, Zod-validiert):

```ts
Preset = {
  id, name, engine, archetype, seed,
  roles: Role[], tags: string[],
  params: Record<string, number|string>,
  macros: Macro[8],            // je: Name + Ziel-Parameter mit Range/Kurve
  fx: FxChainSettings,
  meta: { brightness, motion, density, space, weight, roughness },
  provenance: { source, license, derivedFrom },
  metrics?: AudioMetrics,      // aus Phase 8
  rating?: 1..5, notes?: string
}
```

**Drei Erzeugungsstufen:**
1. **Handgebaute Kernpresets** — ca. 12 pro Engine, musikalisch gesetzt.
2. **Archetyp-Matrix** — pro Engine 20–40 Klangarchetypen (`glass_bell`,
   `tape_drone`, `breath_field`, `sub_pulse`, `metallic_rain`, `submerged_choir`,
   `harmonic_dust`, `unstable_pad` …) mit *eingeschränkten*, musikalisch sinnvollen
   Wertebereichen statt freier Zufallsstreuung.
3. **Seed-Variation** — deterministischer Jitter innerhalb der Archetyp-Grenzen.

**Zielgröße:** > 1000 Presets, jedes aus `(engine, archetype, seed)` exakt
rekonstruierbar; die Bank liegt als JSON vor und wird beim Start lazy geladen.

**Makros:** immer dieselben 8 Achsen über alle Engines hinweg —
`Brightness · Motion · Density · Space · Drive · Detune · Body · Air`.
Dadurch fühlt sich *jedes* Preset gleich an und du kannst blind schrauben.

**Mutation** (`presets/mutate.ts`): `mutate(preset, amount, seed)` erzeugt
Varianten mit gewichteter Streuung (klangprägende Parameter stärker, kosmetische
schwächer) — Basis für das Variationsraster.

---

## Phase 6 — MIDI-Testphrasen

`src/midi/` — Phrasen werden generativ erzeugt, nicht als Dateien geladen, damit
sie sich sofort an Tonart, Tempo und Rolle anpassen.

- `theory.ts` — Skalen/Modi (dorisch, äolisch, lydisch, phrygisch, Pentatonik,
  Just Intonation), quartale/quintale Voicings, offene Lagen, Pedaltöne.
- Rollen-Phrasen, je 4–16 Takte, seeded, mit Humanize:

| Rolle | Phrase |
| --- | --- |
| `drone` | ein bis zwei gehaltene Töne, Minutenskala, Schwebung |
| `pad` | langsame quartale Voicings, sehr lange Attack/Release |
| `bass` | Grundtonbewegung, lange Werte, gelegentliche Oktave |
| `melody` | sparsame modale Linie mit Pausen (Poisson-Dichte) |
| `arp` | Arpeggio mit euklidischer Verteilung, Ping-Pong, Skalenbindung |
| `rhythm` | euklidische Pulse, Notenmapping auf Perkussionsmodelle |
| `pluck` | seltene, probabilistische Einzelanschläge |
| `bell` | einzelne Anschläge mit sehr langem Ausklang |
| `fx` | Einzelereignis: Riser, Sweep, Impact, Rückwärts-Swell |
| `chord` | wenige langsame Akkordwechsel, minimales Voice Leading |
| `stress` | Testphrase: Extremlagen, schnelle Repetition, Polyphonie-Maximum |

- `player.ts` — sample-genaues Scheduling über Tone.Transport, nahtloses Looping,
  Latch/Hold-Modus für Drones, sofortiges Umschalten der Phrase ohne Stopp.
- **Web MIDI** — optionaler Hardware-Eingang parallel zur Phrase.

---

## Phase 7 — Die Testsuite-Oberfläche

**Layout** (drei Spalten, dunkles Ambient-Design, ohne Scrollen bedienbar):

```
┌ Kontextleiste: Tonart · Modus · Tempo · Phrase · Master · Panic ─────────────┐
├───────────────┬─────────────────────────────────┬──────────────────────────┤
│ Preset-Browser│ Preset-Kopf + Rollen-Badges     │ Spektrum / Scope / Meter │
│ (virtualisiert│ ──────────────────────────────  │ ──────────────────────── │
│  Suche,       │ 8 Makro-Regler (immer gleich)   │ Bewertung 1–5 + Tags     │
│  Filterchips, │ XY-Morph-Pad (4 Ecken)          │ Notizfeld                │
│  Rating,      │ ──────────────────────────────  │ ──────────────────────── │
│  „nur         │ Parametergruppen (aufklappbar)  │ Variationsraster 2×4     │
│  unbewertete")│ FX-Kette                        │ A/B-Vergleich            │
├───────────────┴─────────────────────────────────┴──────────────────────────┤
└ Transport: Play · Loop · Latch · Phrase · Tempo · MIDI-In · CPU ────────────┘
```

**Tastatur-Workflow — das eigentliche Produkt:**

| Taste | Wirkung |
| --- | --- |
| `Space` | Start / Stop |
| `J` / `K` bzw. `↓` / `↑` | nächstes / vorheriges Preset, **spielt sofort** |
| `Shift+J/K` | 10 Presets springen |
| `.` | nächstes zufälliges **unbewertetes** Preset |
| `1`–`5` | bewerten (und optional automatisch weiterspringen) |
| `0` | verwerfen / ausblenden |
| `F` | favorisieren |
| `Tab` | Rollen-Phrase durchschalten |
| `M` | mutieren → 8 Varianten ins Raster |
| `Q W E R T Z U I` | Variante 1–8 anhören |
| `Enter` | Variante übernehmen |
| `A` / `B` / `C` | A-Slot / B-Slot / A-B umschalten |
| `G` | Preset gegen einen Referenz-Drone im Kontext hören |
| `S` | in Sammlung speichern |
| `Ctrl+Z` | Parameteränderung zurücknehmen |
| `H` | Note halten (Drone-Modus) |
| `P` | Panic |

**Beschleuniger:**
- Auswahl = sofortige Wiedergabe (kein zweiter Klick), Preset-Vorbereitung der
  benachbarten Einträge im Voraus.
- **Kontext-Hören** (`G`): das Preset läuft gegen einen leisen Referenz-Drone —
  ambient-tauglich ist ein Sound erst im Verbund, nicht solo.
- Variationsraster als evolutionäre Schleife: hören → beste Variante übernehmen →
  erneut mutieren. Damit findest du in ~30 s ein brauchbares Preset.
- Alle Regler sind fein/grob (Shift/Alt) und per Doppelklick auf Default.

---

## Phase 8 — Analyse & Auto-Tagging („Kritiker")

Jedes Preset wird einmalig offline gerendert (`OfflineAudioContext`, 4 s, verkürzte
Phrase) und vermessen — im Hintergrund, in einem Worker, batchweise.

**Metriken:** Peak, True-Peak-Näherung, RMS/LUFS-Näherung, Crest-Faktor,
Spectral Centroid / Spread / Flatness / Rolloff, Stereo-Korrelation, DC-Offset,
Klick-Erkennung (Sample-Delta), Stille-Anteil, harmonisch/geräuschhaft-Verhältnis,
zeitliche Entwicklung (Centroid-Drift = „passiert überhaupt etwas?").

**Nutzen:**
- Defekte Presets (Clipping, Stille, DC, Klicks) werden automatisch markiert und
  aus der Hörschleife genommen — du hörst nur Kandidaten.
- Auto-Tags: `dark/bright`, `static/evolving`, `narrow/wide`, `clean/rough`,
  `sparse/dense` → sofort filter- und sortierbar.
- Sortierung „ähnlich zu diesem Preset" über Feature-Distanz — gezieltes Erkunden
  statt blindes Durchhören.
- Die Regeln aus `Musikmaschine.md` §5 (Bewertungsagent) sind hier schon
  implementiert und später für das Album-Rendering wiederverwendbar.

---

## Phase 9 — Persistenz, Sammlungen, Export

- **IndexedDB**: Bewertungen, Notizen, editierte Presets, Sammlungen, Sitzungsverlauf.
- **Sammlungen** („Album-Palette"): benannte Preset-Gruppen mit Rollenzuordnung —
  genau das Format, mit dem später komponiert wird.
- **Export**
  - `bank.json` — vollständige Preset-Bank inkl. Bewertungen und Metriken
  - `collection-<name>.json` — kuratierte Auswahl
  - `.wav` — Offline-Render des aktuellen Presets mit der Phrase (Referenz-Audio)
  - `.mid` — die Testphrase als MIDI
- **Import**: Bänke zusammenführen (Konfliktlösung über `id` + `seed`).
- **Autosave** nach jeder Bewertung; kein Datenverlust bei Reload.

---

## Phase 10 — Qualitätsdurchlauf

- Vitest für: Preset-Schema, deterministische Generierung (gleicher Seed = gleiches
  Preset), Theorie/Skalen, Mutationsgrenzen, Analyse-Metriken gegen synthetische
  Testsignale.
- Offline-Render-Smoketest über **alle** Presets: keine NaN, kein Clipping > 0 dBFS,
  keine Stille, keine Klicks. Bericht als Tabelle.
- Latenz-/CPU-Messung: Preset-Wechsel unter Last, Polyphonie-Grenzen.
- `synthlab/README.md`: Bedienung, Tastaturkarte, Engine-Referenz, Formatdoku.
- `research/LICENSES.md`: Herkunft und Lizenz jeder Referenz, Nachweis der
  Trennung zwischen Lesematerial und ausgeliefertem Code.

---

## Phase 11 — Brücke zur Kompositionsmaschine *(danach)*

Nicht Teil dieser Ausbaustufe, aber vorbereitet:
- `exportSupriya(collection)` → Python-Skript mit SynthDefs und Patterns.
- Rollen + Metriken der kuratierten Sammlung sind bereits das Vokabular der
  Ambient-DSL aus `Musikmaschine.md` §3 (`layer_role`, `synthesis_recipe`,
  `spectral_brightness`, `event_density`, `motion_speed`, `seed` …).
- Damit wird aus der bewerteten Preset-Palette direkt der Klangvorrat für
  Album-Tracks.

---

## Reihenfolge & Abhängigkeiten

```
Phase 0 (läuft) ─┐
                 ├─→ Phase 1 ─→ Phase 3 ─┐
Phase 2 ─────────┘                       ├─→ Phase 5 ─┐
                          Phase 4 ───────┘            ├─→ Phase 7 ─→ Phase 10
                          Phase 6 ─────────────────────┘   ▲
                          Phase 8 ───────────────────────────┘
                                                   Phase 9 ─┘
```

Nach **Phase 7** ist das System zum ersten Mal in vollem Umfang benutzbar.
Phase 2, 3 und 6 werden bewusst vorgezogen, damit du früh Klang hörst.
