# Lizenz- und Herkunftsnachweis — `research/vendor/`

Diese Tabelle dokumentiert jedes geklonte Referenz-Repository, seine Lizenz und
wie es in diesem Projekt verwendet wird. Politik (unverändert aus
`preset_sources.md`): **kein fremder Code und keine fremden Presets werden in
`synthlab/` kopiert.** `research/vendor/` ist ausschließlich Lesematerial für
Menschen und für die Extraktionsskripte in `research/extract/`, deren Ausgabe
(`research/derived/*.json`) numerische/strukturelle Ableitungen mit Quellenangabe
enthält — keinen Fremdcode.

| Repo | Lizenz | Sparse? | Verwendung hier |
| --- | --- | --- | --- |
| `tonejs` (Tone.js) | MIT | nein (voll) | **direkte Laufzeit-Abhängigkeit** von `synthlab/` (Transport, Scheduling, Basis-FX-Nodes) |
| `amy` (shorepine/amy) | MIT | nein (voll) | Referenz für DX7/AMY-FM-Operatorgraphen → `derived/fm-algorithms.json` (Zahlen extrahiert, kein C-Code übernommen) |
| `daisysp` (electro-smith) | MIT | nein (voll) | Referenz für Filter-/Oszillator-/Modal-/Effekt-Modellnamen und Parameterbereiche → `derived/filter-models.json`; TS-Neuimplementierung in Phase 3 |
| `stk` (Synthesis ToolKit) | MIT-artig (STK-Lizenz, s. `stk/LICENSE`) | nein (voll) | Modal-Materialtabellen (ModalBar) → `derived/modal-materials.json`; FM-Instrumentenprofile (TubeBell, Rhodey, Wurley, HevyMetl, BeeThree, FMVoices, PercFlut) → `derived/fm-algorithms.json`; **FreeVerb-Referenz** (`stk/src/FreeVerb.cpp`, Jezar at Dreampoint's Algorithmus, gemeinfrei/public domain, von Gregory Burlet nach STK portiert) → `synthlab/src/audio/fx/Reverb.ts` + `dsp/{onepole,comb,allpass}.ts`: Topologie (8 gedaempfte Kammfilter parallel + 4 Schroeder-Allpaesse seriell) und die klassischen Jezar-Delay-Tunings (reine Zahlenkonstanten) uebernommen, komplette Neuimplementierung mit Web-Audio-Primitiven (DelayNode/GainNode statt C++), kein Quellcode kopiert. |
| `fundsp` | MIT / Apache-2.0 (dual) | nein (voll) | 32-Kanal-FDN-Reverb-Delayzeiten unverändert übernommen (Zahlenkonstanten, Apache-2.0-kompatibel) → `derived/reverb-topologies.json`; Filtermodell-Katalog → `derived/filter-models.json` |
| `isobar` | MIT | nein (voll) | Pattern-Familien-Katalog (Klassennamen + paraphrasierte Kurzbeschreibung) → `derived/pattern-families.json`; TS-Neuimplementierung in Phase 6 |
| `musiclang` | BSD-2-Clause | nein (voll) | Referenz für modale Grammatik/Voicing-Konzepte (Phase 6 `theory.ts`); keine Code-Übernahme |
| `supriya` | MIT | nein (voll) | Zielformat-Referenz für den späteren SuperCollider-Export (Phase 11), nicht Teil dieser Ausbaustufe |
| `sk-engines` (shakfu) | MIT | nein (voll) | Konzeptreferenz Softcut/qdelay (Tape-Loop, Varispeed) für spätere Erweiterung |
| `surge` (Surge XT) | **GPL-3.0** | ja (`src/common/dsp`, Header, `doc`) | **nur Lesematerial.** Parametertaxonomie/Filtermodell-Namen als Inspirationsquelle für `synthesis-methods.json`. Kein Code, kein Preset aus Surge in `synthlab/`. |
| `vital` | **GPL-3.0**, kommerzielle Sonderlizenz möglich | ja (`src/synthesis`, `src/common`) | **nur Lesematerial.** Wavetable-/Spektral-Warp-Konzepte als Namensgeber, keine Codeübernahme. Factory-Presets werden nicht verwendet (vgl. `preset_sources.md`). |
| `supercollider` | **GPL-3.0** | ja (Class Library, Help, Server-Plugins) | **nur Lesematerial.** UGen-Katalog als Verfahrens-Landkarte (Granular/Spektral/Additiv-Begriffe). |
| `csound` | LGPL-2.1+ | ja (`Opcodes`, `OOps`, `Engine/*.c`) | **nur Lesematerial.** Opcode-Katalog als Verfahrens-Landkarte, keine Codeübernahme. |
| `faustlibs` (faustlibraries) | LGPL-2.1+ mit Ausnahmen für generierten Code | ja (`*.lib`) | **nur Lesematerial.** DSP-Bausteinkatalog als Namensgeber für Engine-Parameter. |
| `pyo` | LGPL-3.0+ | ja (`pyolib`, `src/objects`) | **nur Lesematerial.** Konzeptreferenz für Effektnamen/-parameter. |
| `chuck` | MIT **oder** GPL-2.0+ (dual, wählbar) | ja (`src/core/ugen_*`, `examples`) | **nur Lesematerial.** UGen-Namen als Referenz. |
| `sonicpi` | GPL-3.0-artig (Sonic Pi Lizenz, siehe Upstream) | ja (`etc/synthdefs/designs`, Ruby-Synth-Definitionen) | **nur Lesematerial.** Synth-Namensgebung/-Rollen als Inspiration. |
| `fluidsynth` | LGPL-2.1+ | ja (`src/synth`, `src/rvoice`) | **nur Lesematerial.** SoundFont-Synthesekonzepte, keine Codeübernahme. |

## Grundsatz für `synthlab/`

- Jede Engine in Phase 3 ist eine **eigenständige TypeScript-Neuimplementierung**
  des jeweiligen *Verfahrens* (Subtraktiv, FM, Granular, Modal, …), nicht eine
  Portierung von Quellcode aus obiger Tabelle.
- Numerische Konstanten aus MIT/Apache/BSD-Quellen (STK-Modaltabellen,
  AMY-FM-Algorithmen, FunDSP-FDN-Delayzeiten) dürfen unverändert übernommen
  werden — das sind Zahlen, keine urheberrechtlich geschützte Implementierung —
  und tragen in `derived/*.json` ein `source`-Feld.
- Aus den GPL/LGPL-Projekten (Surge, Vital, SuperCollider, Csound, Faust-Libs,
  pyo, ChucK-GPL-Variante, Sonic Pi, FluidSynth) wird **ausschließlich
  Fachvokabular und Verfahrenswissen** übernommen, niemals Code oder Zahlenreihen
  aus deren Quelldateien.
- Faktorybänke (Vital, Surge, Sonic Pi) werden nicht kopiert oder verpackt —
  identisch zur bereits geltenden Politik aus `preset_sources.md`.
