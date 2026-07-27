# plan5 – Erstklassige Synth-Engines & FX-Module aus Open-Source-Quellen

**Status:** Planung. Keine Umsetzung. Alle Angaben zu Repositories, Lizenzen und
Datenmengen wurden am 2026-07-27 gegen die GitHub-API bzw. gegen die bereits
lokal vorhandenen Klone unter `research/vendor/` verifiziert.

---

## 1. Ziel

SynthLab besitzt aktuell 19 Engines, 1.681 Presets und eine **feste** FX-Kette aus
6 Modulen. Die Schwäche ist nicht die Anzahl, sondern die Herkunft: der Großteil
der Presets ist prozedural erzeugt (`generate.ts`, `fmPresets.ts` – Modulo-
Arithmetik auf Parameterwerten), nicht aus echtem Klangdesign abgeleitet. Auch die
FX-Kette ist ein festverdrahteter Sechser-Strang ohne Reihenfolgeänderung.

plan5 adressiert genau das:

1. **Synth-Engines** aus den stärksten permissiv lizenzierten Open-Source-Projekten
   nachbauen (Mutable Instruments, AMY, STK, DaisySP, Soundpipe).
2. **FX-Module** als frei sortierbares Rack (Ableton-Device-Prinzip) mit
   erstklassigen Algorithmen (CloudSeed, Dattorro, MI Clouds/Rings/Warps,
   Airwindows, Soundpipe).
3. **Presets aus echten Datenquellen** statt generiert: 128 Juno-106-Werkspatches,
   1.024 DX7-Voices, 175 OPL3-GENMIDI-Instrumente, ~4.300 AKWF-Wellenformen,
   9 CloudSeed-Factory-Programme – alle als reale Parameterdaten aus GitHub-Repos.

Zielgröße nach Umsetzung: **27 Engines**, **~22 FX-Module in freier Reihenfolge**,
**~3.500 Presets**, davon **~1.700 aus importierten Originaldaten**.

---

## 2. Rechercheergebnis

### 2.1 Synthese-Referenzen (alle permissiv)

| Repo | ★ | Lizenz | Was wir daraus nehmen | Status |
|---|---|---|---|---|
| [`pichenettes/eurorack`](https://github.com/pichenettes/eurorack) | 3.131 | MIT (Header pro Datei, Émilie Gillet) | **Plaits** (16 Syntheseengines), **Rings** (Modal/Sympathetic), **Warps**, **Clouds**, **Elements** | neu klonen |
| [`shorepine/amy`](https://github.com/shorepine/amy) | 669 | MIT | **Juno-106-Emulation** (`amy/juno.py`) inkl. 128 Werkspatches, **DX7-Konverter** (`amy/fm.py`), 1.024-Voice-Bank | ✅ `research/vendor/amy` |
| [`thestk/stk`](https://github.com/thestk/stk) | 1.223 | MIT-Text (Cook/Scavone) | Physical Modeling: `Clarinet`, `Flute`, `Bowed`, `BandedWG`, `ModalBar`, `Mandolin`, `Brass` | ✅ `research/vendor/stk` |
| [`electro-smith/DaisySP`](https://github.com/electro-smith/DaisySP) | 1.199 | MIT (`LICENSE` bestätigt) | Exoten-Oszillatoren: `vosim`, `formantosc`, `zoscillator`, `harmonic_osc`, `variableshapeosc`, `grainlet`, `particle` | ✅ `research/vendor/daisysp` |
| [`PaulBatchelor/Soundpipe`](https://github.com/PaulBatchelor/Soundpipe) | 64 | MIT | ~120 DSP-Module; hier v.a. Filter (`wpkorg35`, `diode`, `moogladder`) und FX (s.u.) | neu klonen |
| [`ddiakopoulos/MoogLadders`](https://github.com/ddiakopoulos/MoogLadders) | 390 | Unlicense | 8 verschiedene Ladder-Filter-Modelle (Huovilainen, Stilson, Simplified, Improved, …) | neu klonen |
| [`sneakernets/DMXOPL`](https://github.com/sneakernets/DMXOPL) | 72 | MIT | OPL3/YMF262 2-Op-Instrumentenbank (GENMIDI: 128 melodisch + 47 Perkussion) | neu klonen |

**Bewusst als reine Referenz (nicht kopieren):** `surge-synthesizer/surge` (GPL-3.0,
3.943★), `mtytel/vital` (GPL-3.0), `mtytel/helm` (GPL-3.0), `pendragon-andyh/junox`
(GPL-3.0), `TheWaveWarden/odin2`. Diese Linie führt `preset_sources.md` bereits
korrekt – sie wird nicht aufgeweicht.

### 2.2 FX-Referenzen

| Repo | ★ | Lizenz | Modul(e) | Warum |
|---|---|---|---|---|
| [`ValdemarOrn/CloudSeed`](https://github.com/ValdemarOrn/CloudSeed) | 484 | MIT | Diffusions-Reverb (Multitap-Diffuser + 8 modulierte Allpass-Ketten) | der Referenz-Hall für Ambient-Endlosfahnen; Header-only C++ (`CloudSeed.Native/*.h`, Branch `legacy-v1`), sehr gut portierbar; **9 Factory-Programme als JSON** |
| [`el-visio/dattorro-verb`](https://github.com/el-visio/dattorro-verb) | 61 | MIT | Dattorro-Plattenhall (Figure-of-8-Tank) | kompakter, charaktervoller Plate-Algorithmus; ~200 Zeilen |
| [`pichenettes/eurorack`](https://github.com/pichenettes/eurorack) | 3.131 | MIT | **Clouds** (Granular / Stretch / Looping-Delay / Spectral), **Rings** (Resonator als FX), **Warps** (Ringmod / Crossfold / Vocoder) | die stärksten Textur-Prozessoren im Open-Source-Bereich |
| [`airwindows/airwindows`](https://github.com/airwindows/airwindows) | 1.194 | MIT | `Galactic` (Ambient-Reverb), `ToTape`/`IronOxide` (Band), `Density` (Sättigung), `Console`, `Ensemble` | ~400 Plugins, sehr kompakter Code, keine externen Abhängigkeiten |
| [`PaulBatchelor/Soundpipe`](https://github.com/PaulBatchelor/Soundpipe) | 64 | MIT | `zitarev`, `revsc`, `bigverb`, `paulstretch`, `talkbox`, `vocoder`, `bitcrush` | breites, sauber dokumentiertes FX-Arsenal |
| [`Signalsmith-Audio/signalsmith-stretch`](https://github.com/Signalsmith-Audio/signalsmith-stretch) | 528 | MIT | Pitch-/Time-Shifter | Grundlage für Shimmer-Reverb und Freeze-Stretch |
| [`electro-smith/DaisySP`](https://github.com/electro-smith/DaisySP) | 1.199 | MIT | `chorus`, `flanger`, `phaser`, `autowah`, `tremolo`, `decimator`, `overdrive`, `wavefolder`, `pitchshifter`, `compressor` | fertige, kleine, gut getestete Bausteine |
| [`thestk/stk`](https://github.com/thestk/stk) | 1.223 | MIT-Text | `JCRev`, `NRev`, `PitShift`, `LentPitShift`, `Echo` | klassische CCRMA-Halltopologien |

**Achtung Lizenzfalle:** DaisySPs `ReverbSc` liegt im separaten Verzeichnis
`DaisySP-LGPL` (Csound-Herkunft, LGPL) – **nicht** übernehmen. Ebenso
`grame-cncm/faustlibraries` (`reverbs.lib` mit `jpverb`/`greyhole`): dort gilt
Lizenz pro Datei, überwiegend LGPL/STK-4.3 – bleibt reines Lesematerial.
`jatinchowdhury18/AnalogTapeModel` (1.396★) ist GPL-3.0 → nur Referenz, das
Bandmodell kommt stattdessen von Airwindows (MIT).

### 2.3 Preset-Datenquellen (echte Daten, keine Erfindung)

| Quelle | Menge | Format | Lizenz |
|---|---|---|---|
| `amy/amy/juno.py` → `_PATCHES` | **128** Juno-106-Werkspatches (A11–B88) mit Namen + 18-Byte-SysEx | Python-Literal, direkt parsebar | MIT (AMY) |
| `amy/amy/default-dx7-patches.bin` | **1.024** DX7-Voices à 156 Byte (entpacktes DX7-Voice-Format) – verifiziert: 159.744 / 156 = 1.024 | Binär | MIT (AMY); erzeugt mit `dx7db` aus [`bwhitman/learnfm`](https://github.com/bwhitman/learnfm) |
| `amy/amy/fm.py` | Konvertierungslogik DX7→Parameter (`coarse_fine_ratio`, `eg_to_bp`, `lfo_speed_to_hz`, Keyboard-Scaling) | Python | MIT |
| `sneakernets/DMXOPL` | **175** OPL3-Instrumente (GENMIDI-Lump: 128 melodisch + 47 Perkussion), je 2 Operatoren mit Mult/KSL/TL/AR/DR/SL/RR/WS/FB/Connection | Binär/`.op2` | MIT |
| [`KristofferKarlAxelEkstrand/AKWF-FREE`](https://github.com/KristofferKarlAxelEkstrand/AKWF-FREE) | **~4.300** Single-Cycle-Wellenformen in 65 Sammlungen; Verzeichnis `AKWF-js` liefert sie bereits als JS-Arrays mit 256 Float-Werten | JS / WAV / C | **CC0-1.0** |
| `CloudSeed/Factory Programs/*.json` (Branch `legacy-v1`) | **9** Hall-Programme (Hyperplane, Rubi-Ka Fields, Through the Looking Glass, …) mit vollständigen Parametersätzen | JSON | MIT |
| `amy/src/patches.h` | 391 fertige AMY-Wire-Patches (125 Juno + 128 DX7 + 7 Drumkits) – nützlich als Kreuzprüfung der eigenen Konvertierung | C-String-Tabelle | MIT |

**Was es realistisch nicht gibt:** offene, kuratierte **FX-Preset-Bänke**. Außer
CloudSeeds 9 Programmen liefern die FX-Repos keine Presetdaten (Airwindows-Plugins
sind bewusst presetlos). FX-Rack-Presets müssen daher aus den dokumentierten
Beispielkonfigurationen der jeweiligen Repos plus eigenem Design entstehen – das
wird in der Provenance ehrlich als `synthlab-design` markiert und **nicht** als
Import ausgegeben.

---

## 3. Lizenz- und Provenance-Leitplanken

1. **Nur permissiv portieren.** MIT / BSD / Apache-2.0 / CC0 / Unlicense. Kein
   GPL-Code in `synthlab/`. `research/vendor/` bleibt reines Lesematerial.
2. **Pro portiertem Modul ein Herkunftskopf** in der Quelldatei: Originalrepo,
   Autor, Lizenz, welche Datei als Vorlage diente, was bewusst abweicht.
3. **`research/LICENSES.md` erweitern** um alle neuen Quellen mit Copyright-Zeile.
4. **Preset-Schema:** `provenance` bekommt zwei Pflichtfelder mehr –
   `upstreamRepo` und `upstreamFile` –, damit jedes importierte Preset auf seine
   Quelle zeigt. Generierte Presets tragen weiterhin `source: "synthlab-*"`.

### 3.1 Offener Entscheidungspunkt: Werkspatches

`preset_sources.md` legt heute fest: *„keine fremden Factory-Bänke in das
Repository kopiert"*. Die Juno-106- und DX7-Bänke sind genau das – Roland- bzw.
Yamaha-Werksklänge, wenn auch als reine Zahlenparameter und von AMY unter MIT
weitergegeben. Vor der Umsetzung ist zu entscheiden:

- **Variante A (empfohlen): übernehmen mit voller Attribution.** Es handelt sich
  um Parameterzahlen, nicht um Audio; AMY (MIT, aktiv gepflegt) und `learnfm`
  verbreiten sie seit Jahren. Provenance nennt AMY + Originalname des Patches.
  Bestätigt echten Sound-Design-Ursprung – exakt das Anliegen dieses Plans.
- **Variante B (konservativ): Parameter importieren, Werksnamen ersetzen.** Klingt
  identisch, verliert aber die Auffindbarkeit („A11 Brass Set 1") und damit einen
  großen Teil des Nutzens.
- **Variante C: nur zur Build-Zeit konvertieren.** Bringt nichts – das Ergebnis
  landet ohnehin im Repo.

`preset_sources.md` ist entsprechend der Entscheidung anzupassen; ohne Anpassung
widerspräche Phase 5 der dort dokumentierten Projektlinie.

---

## 4. Neue Synth-Engines

Alle Engines implementieren das bestehende `Engine`-Interface aus
[types.ts](synthlab/src/audio/core/types.ts) und werden in
[registry.ts](synthlab/src/audio/engines/registry.ts) registriert – UI, Makro-
System und Preset-Generator bleiben unverändert generisch.

| # | ID | Name | Vorlage | Umsetzung | Presets |
|---|---|---|---|---|---|
| E1 | `juno106` | Juno-106 VA | `amy/juno.py` | WebAudio-Nodes | 128 importiert + 128 Varianten |
| E2 | `dx7` | DX7 6-Op (echt) | `amy/fm.py` + Bank | AudioWorklet | 1.024 importiert (512 kuratiert sichtbar) |
| E3 | `plaits` | Plaits Macro-Osc | MI `plaits/dsp/engine/` | AudioWorklet | 8 Modelle × 24 = 192 |
| E4 | `rings` | Rings Resonator | MI `rings/dsp/` | AudioWorklet | 3 Modi × 24 = 72 |
| E5 | `stk-acoustic` | STK Physical Models | STK `Clarinet/Flute/Bowed/BandedWG/ModalBar` | AudioWorklet | 5 × 20 = 100 |
| E6 | `wt-akwf` | AKWF Wavetable | AKWF-FREE `AKWF-js` | WebAudio `PeriodicWave` | 400 (echte Wellenformen) |
| E7 | `daisy-osc` | DaisySP Exoten | DaisySP `Synthesis/`, `Noise/` | AudioWorklet | 5 Modelle × 20 = 100 |
| E8 | `opl3` | OPL3 2-Op FM | DMXOPL GENMIDI | AudioWorklet | 175 importiert |

### E1 – `juno106` (höchste Priorität, geringstes Risiko)

Der Juno-106 ist mit reinen WebAudio-Nodes exakt nachbaubar und liefert sofort
128 echte Presets.

Signalweg: DCO (Saw + Pulse mit PWM + Sub-Osc + Rauschen) → HPF (4 Stufen, wie
Original) → LPF 24 dB mit Resonanz und Env/LFO-Modulation → VCA (ADSR oder Gate)
→ Chorus I/II/I+II.

18 SysEx-Bytes des Originals mappen 1:1 auf Parameter; die Umrechnungskurven
liefert `amy/juno.py` bereits fertig und aus Hörbeispielen regressiert:
`to_filter_freq` = `13 · 2^(0.0938·v)`, `to_resonance` = `0.7 · 2^(4·v)`,
`to_attack_time`, `to_decay_time` = `80 · 2^(0.085·v) − 80`, `to_release_time`,
`to_lfo_freq` = `0.6 · 2^(0.04·v) − 0.1`, `to_lfo_delay`.

Parameter (ParamSpec): `dcoSaw`, `dcoPulse`, `dcoSub`, `dcoNoise`, `pwmDepth`,
`pwmMode`, `dcoRange`, `hpfMode` (0–3), `cutoffHz`, `resonance`, `envToFilter`,
`lfoToFilter`, `lfoRateHz`, `lfoDelay`, `lfoToPitch`, `attack`, `decay`,
`sustain`, `release`, `vcaMode` (env/gate), `chorusMode` (off/I/II/I+II).

Chorus I/II: zwei modulierte Delays (~5 ms / 0.5 Hz bzw. ~5 ms / 0.83 Hz,
gegenphasig gepannt) – die Werte stehen als Kommentar in `juno.py` und stecken in
den AMY-Wire-Patches (`k1,,0.5,0.5` bzw. `k1,,0.83,0.5`).

### E2 – `dx7` (höchster Preset-Ertrag)

Ersetzt die heutige Attrappe `fm-dx7` (deren „Presets" sind Modulo-Arithmetik in
`fmPresets.ts`) durch eine echte DX7-Implementierung:

- 6 Operatoren, **32 Algorithmen** (Routing-Matrix aus `fm.py`)
- Pro Operator: 4-stufige Rate/Level-EG, Coarse/Fine/Detune-Ratio oder Fixed-Hz,
  Output-Level (nichtlineare DX7-Kurve, `dx7level_to_linear`), Keyboard-Level-
  Scaling (Break-Point, L/R-Depth, L/R-Curve), Rate-Scaling, Velocity-Sensitivity
- Global: Feedback, Pitch-EG, LFO (6 Wellenformen, Speed/Delay/PMD/AMD/Sync)

Wegen 6 Operatoren × Polyphonie ist das ein **AudioWorklet** (nicht 6 `OscillatorNode`
pro Stimme). Der Import liest `default-dx7-patches.bin` blockweise à 156 Byte und
schreibt eine kompakte Bank nach `src/data/derived/dx7-voices.json`.
Kreuzprüfung: die 128 DX7-Patches in `amy/src/patches.h` müssen nach eigener
Konvertierung dieselben Ratio-/EG-Werte ergeben (Unit-Test).

### E3 – `plaits`

Portiert werden die 8 in Web Audio sinnvoll umsetzbaren Modelle (die
LUT-/ROM-lastigen Sprach- und Drum-Modelle entfallen zunächst):
`virtual_analog`, `waveshaping`, `fm`, `grain`, `additive`, `wavetable`, `chord`,
`swarm`. Einheitliches Plaits-Bedienmodell: `harmonics`, `timbre`, `morph`,
`model`, plus interner LPG (Low-Pass-Gate) mit `decay`/`colour` – das ist genau
die Stärke von Plaits und passt perfekt auf das 8-Makro-System von SynthLab.

### E4 – `rings`

Drei Resonatormodi: `modal` (64 Partials), `sympathetic strings`, `string+`.
Parameter: `structure`, `brightness`, `damping`, `position`, `polyphony`.
Anregung wahlweise intern (Impuls/Rauschen) oder – als FX-Variante F4 – vom
Trackeingang.

### E5 – `stk-acoustic`

Fünf STK-Instrumente in einem Worklet, per Enum umschaltbar: `Clarinet`
(Reed-Table + Delay), `Flute` (Jet-Table), `Bowed` (Bow-Table + BiQuad-Body),
`BandedWG` (Banded Waveguide: Glas/Metall/Stab), `ModalBar` (4 Moden mit
Materialpresets: Marimba, Vibraphon, Agogo, Wood1, Reso, Wood2, Beats, 2-Fix,
Klingel). Die Materialtabellen stehen als Konstanten in `stk/src/ModalBar.cpp` –
das sind reale, publizierte Modaldaten und damit ebenfalls „nicht erfunden".

### E6 – `wt-akwf`

Wavetable-Engine über echte Single-Cycle-Wellenformen. AKWF liefert unter
`AKWF-js` bereits 256-Wert-Float-Arrays → direkt in `createPeriodicWave` per FFT
oder als `AudioBufferSourceNode` mit Loop.

**Bundle-Grenze beachten:** ~4.300 Wellen × 256 Floats sind roh mehrere MB. Daher:
- 256 kuratierte Wellen (je 4 aus 65 Sammlungen) als Int16 → ca. 130 KB, im Bundle;
- der Rest nachladbar aus `public/wavetables/` per `fetch` on demand.
Presets referenzieren Wellenformen über stabile IDs (`AKWF_0042_0007`).

### E7 – `daisy-osc`

Fünf Oszillatormodelle aus DaisySP in einem Worklet: `VOSIM` (Formantimpulse),
`FormantOsc` (Vokale), `ZOscillator` (Casio-CZ-artige Phasenverzerrung, deutlich
präziser als das heutige `phasedist`), `HarmonicOscillator` (16 Teiltöne mit
Drawbar-Steuerung), `VariableShapeOsc` (Wellenform-/Pulsbreiten-Morph).

### E8 – `opl3`

2-Operator-FM nach YMF262 mit den 175 DMXOPL-Instrumenten als Preset-Bank.
Charakteristisch: 8 Wellenformen (Sinus, halb, absolut, gepulst, …), 4-Bit-
Multiplikator, KSL/KSR, Feedback nur auf Operator 1, AM/FM-Connection.

---

## 5. Neuer FX-Rack

### 5.1 Architekturwechsel: fest → dynamisch

Heute ist [FxChain.ts](synthlab/src/audio/fx/FxChain.ts) ein hart verdrahteter
Sechser-Strang und [types.ts](synthlab/src/audio/fx/types.ts) ein Objekt mit sechs
benannten Feldern. Für 22 Module und freie Reihenfolge wird das zu:

```ts
// audio/fx/types.ts (neu)
export interface FxSlot {
  id: string;            // stabile Slot-ID
  type: string;          // FX_REGISTRY-Key, z.B. "cloudseed"
  enabled: boolean;
  params: Record<string, number | string | boolean>;
}
export interface FxRackState { version: 2; slots: FxSlot[] }
```

Analog zur Engine-Registry entsteht `audio/fx/registry.ts`:

```ts
export interface FxModuleSpec {
  id: string; name: string; category: FxCategory;
  params: ParamSpec[];                       // gleiche ParamSpec wie Engines
  create(ctx: BaseAudioContext, params: ParamValues): FxNode;
}
```

Damit wird `FxRack.tsx` genau wie `MacroPanel` generisch aus `ParamSpec[]`
gerendert – jedes neue Modul erscheint ohne UI-Änderung. `FxChain` wird zum
Slot-Container mit `reorder()`, `insert()`, `remove()` und klickfreiem Umbau
(kurze Fades beim Neuverdrahten).

### 5.2 Modulkatalog (22)

**Reverb (6)**

| ID | Vorlage | Kernparameter |
|---|---|---|
| `cloudseed` | CloudSeed (MIT) | preDelay, taps, tapLength, tapDecay, diffusion, lateStages, lateDelay, lateDiffusion, lineDecay, lineModAmount/Rate, postDiffusion, lowCut, highCut, crossSeed, dryOut/earlyOut/mainOut |
| `plate` | Dattorro (MIT) | preDelay, bandwidth, inputDiffusion1/2, decay, decayDiffusion1/2, damping, excursion, wet |
| `galactic` | Airwindows `Galactic` (MIT) | replace, brightness, detune, bigness, dry/wet |
| `jcrev` / `nrev` | STK (MIT) | t60, mix |
| `zitarev` | Soundpipe `zitarev` (MIT) | inDelay, crossover, rt60Low, rt60Mid, hfDamping, eq1/eq2, mix |
| `shimmer` | signalsmith-stretch + `plate` | shiftSemitones, feedback, tone, mix |

**Delay (3)** – `tape` (bestehend, bleibt), `pingpong` (bestehend), `granularDelay`
(Clouds Looping-Delay-Modus).

**Textur (4)**

| ID | Vorlage | Beschreibung |
|---|---|---|
| `clouds` | MI Clouds (MIT) | Granular-Prozessor: position, size, pitch, density, texture, blend (feedback/reverb/pan/spread), freeze; 4 Modi (Granular / Stretch / Looping Delay / Spectral) |
| `paulstretch` | Soundpipe `paulstretch` (MIT) | extremes Time-Stretching, Windowsize/Stretch |
| `resonator` | MI Rings als FX (MIT) | Eingangssignal regt Modal-/Saitenmodell an |
| `warps` | MI Warps (MIT) | Crossfade / Crossfold / Ringmod / Diode / Bitcrush / Vocoder auf zwei Eingängen |

**Sättigung & Farbe (4)** – `drive` (bestehend), `tape` (Airwindows `ToTape`/
`IronOxide`), `density` (Airwindows `Density`), `bitcrush` (Soundpipe `bitcrush` +
DaisySP `decimator`).

**Filter (2)** – `postFilter` (bestehend, erweitert um `MoogLadders`-Modelle:
Huovilainen / Stilson / Simplified / Improved / Krajeski / Microtracker / Musicdsp /
Oberheim, Unlicense) und `formantFilter` (Soundpipe `talkbox`/`vocoder`).

**Modulation (3)** – `ensemble` (bestehend), `phaser` (DaisySP), `flanger` (DaisySP).

**Dynamik & Raum (3)** – `compressor` (DaisySP), `autowah` (DaisySP), `width`
(bestehend).

### 5.3 FX-Rack-Presets

- **9 CloudSeed-Werksprogramme** werden 1:1 importiert (`Factory Programs/*.json`,
  MIT) – die einzigen echten FX-Presets aus einer Open-Source-Quelle.
- **~40 Rack-Presets** (mehrere Slots kombiniert, z.B. „Ambient Cathedral" =
  `density` → `clouds(stretch)` → `cloudseed` → `width`) entstehen als eigenes
  Design und werden in der Provenance ehrlich als `synthlab-design` gekennzeichnet.

---

## 6. Import-Pipeline

Das Projekt besitzt mit `research/extract/*.mjs` → `src/data/derived/*.json`
bereits das passende Muster (`fm-algorithms.mjs`, `modal-materials.mjs`,
`sync-derived.mjs`). Es wird fortgeführt:

| Skript | liest | schreibt | Menge |
|---|---|---|---|
| `research/extract/import-juno106.mjs` | `vendor/amy/amy/juno.py` | `src/data/derived/juno106-patches.json` | 128 |
| `research/extract/import-dx7.mjs` | `vendor/amy/amy/default-dx7-patches.bin` | `src/data/derived/dx7-voices.json` | 1.024 |
| `research/extract/import-opl3.mjs` | `vendor/dmxopl/GENMIDI.op2` | `src/data/derived/opl3-instruments.json` | 175 |
| `research/extract/import-akwf.mjs` | `vendor/akwf/AKWF-js/**` | `src/data/derived/akwf-index.json` + `public/wavetables/*.bin` | 256 inline / ~4.300 lazy |
| `research/extract/import-cloudseed.mjs` | `vendor/cloudseed/Factory Programs/*.json` | `src/data/derived/cloudseed-programs.json` | 9 |
| `research/extract/import-stk-materials.mjs` | `vendor/stk/src/ModalBar.cpp`, `BandedWG.cpp` | `src/data/derived/stk-materials.json` | ~15 |

Regeln:

- Jede Ausgabedatei trägt einen `_meta`-Block mit `sourceRepo`, `sourceFile`,
  `sourceCommit`, `license`, `extractedAt`, `count`.
- Skripte sind **idempotent und deterministisch**: erneuter Lauf ⇒ byte-identische
  Ausgabe (Test prüft SHA-256).
- Die JSON-Bänke werden committet, damit der Build ohne `research/vendor/` läuft.
- `research/clone-repos.sh` wird um `eurorack`, `soundpipe`, `cloudseed`,
  `airwindows`, `akwf`, `dmxopl`, `moogladders`, `signalsmith-stretch` erweitert
  (sparse, nur benötigte Pfade).

### 6.1 Preset-Erzeugung aus den Bänken

`src/presets/` bekommt pro Bank einen Adapter (`junoPresets.ts`, `dx7Presets.ts`,
`opl3Presets.ts`, `akwfPresets.ts`), der Bankeinträge in `Preset`-Objekte
übersetzt: Rolle aus Instrumentenname ableiten (Bass/Pad/Lead/Bell/…), Tags aus
Bank + Kategorie, Makros durch **Rückrechnung** aus den Parametern (nicht
zufällig): z.B. `brightness` aus normalisiertem Cutoff, `space` aus Release.
`generate.ts` hängt sie – wie heute `SID_PRESETS`/`FM_PRESETS` – an die Bank an.

---

## 7. Weitere Architekturänderungen

### 7.1 AudioWorklet-Fundament (Voraussetzung für E2–E5, E7, E8, F1–F4)

Neu: `src/audio/worklets/` mit

- `registry.ts` – lazy `audioWorklet.addModule()` pro Modul-URL, ein Promise-Cache,
  damit ein Modul nie doppelt registriert wird;
- `WorkletVoice.ts` – Adapter, der einen `AudioWorkletNode` hinter das bestehende
  `Voice`-Interface legt (`trigger`/`release`/`stop`/`setParam`/`isFinished`);
- pro DSP ein `*.worklet.ts`, in Vite über `new URL("./x.worklet.ts", import.meta.url)`
  eingebunden.

Wichtig: `isFinished()` kann im Worklet nicht synchron beantwortet werden →
Voice meldet Release-Ende per `port.postMessage`, der Adapter cached den Zustand.
Fallback: wenn `audioWorklet` fehlt (alte Browser), wird die Engine in der Registry
als `unavailable` markiert und im Browser ausgegraut statt zu crashen.

### 7.2 Preset-Schema v2 + Migration

- `PresetSchema` wird um `schemaVersion: 2`, `fxRack: FxRackStateSchema` und
  `provenance.upstreamRepo/upstreamFile` erweitert.
- `fx` (v1) bleibt optional lesbar; eine `migrateFxV1toV2()` erzeugt aus den sechs
  Feldern die entsprechende Slot-Liste in der bisherigen Reihenfolge.
- **Dexie:** `db.version(2)` mit Upgrade-Funktion, die `edits.fx` durch
  `edits.fxRack` ersetzt (`database.ts` Zeile 33). Ohne diese Migration verlieren
  Nutzer ihre gespeicherten FX-Edits.

### 7.3 Performance & Speicher

- Presetbank wächst von 1.681 auf ~3.500. `generateFullBank()` läuft heute bei
  jedem `generatePresetById()` komplett durch (siehe
  [generate.ts:81](synthlab/src/presets/generate.ts:81)) – das wird bei doppelter
  Bankgröße spürbar. → einmalig memoisieren + `Map<string, Preset>`-Index.
- Preset-Browser ist bereits windowed (plan2) – Bankgröße unkritisch.
- Worklet-Kosten: bei 4 Tracks × 8 Stimmen × DX7 (6 Ops) ist mit spürbarer Last zu
  rechnen. Gegenmaßnahmen: Stimmenzahl pro Engine deklarierbar
  (`Engine.maxVoices`), Voice-Stealing bleibt aktiv, Audit über
  `AudioContext.baseLatency` + Under-run-Zähler im StatusBar.

### 7.4 UI

- `FxRack.tsx` wird generisch (aus `ParamSpec[]`), plus Slot-Verwaltung:
  Hinzufügen (kategorisiertes Menü), Entfernen, Drag-Reorder, Bypass.
- `DeviceChain.tsx` bekommt die Rack-Leiste horizontal scrollbar (Ableton-Optik),
  statt einer 340 px breiten festen Box.
- Preset-Browser: neue Facetten „Herkunft" (Import/Design) und „Bank"
  (Juno-106 / DX7 / OPL3 / AKWF / SID / …).

---

## 8. Phasenplan

| Phase | Inhalt | Abhängigkeit | Abnahmekriterium |
|---|---|---|---|
| **P0** | `clone-repos.sh` erweitern, 8 neue Repos sparse klonen, `research/LICENSES.md` + `preset_sources.md` fortschreiben, Entscheidung zu §3.1 einholen | – | Alle Repos lokal, jede Quelle mit Lizenz dokumentiert |
| **P1** | AudioWorklet-Fundament (`worklets/registry.ts`, `WorkletVoice.ts`), Testton-Worklet als Durchstich | – | Testton-Engine läuft über Worklet, `vitest` mit OfflineAudioContext grün |
| **P2** | FX-Registry + `FxRackState` + Schema v2 + Dexie-Migration + generisches `FxRack.tsx` | – | Alle 6 Bestandsmodule laufen als Slots, alte Presets migrieren verlustfrei, Reihenfolge änderbar |
| **P3** | Import-Pipeline: alle 6 Extraktoren + `_meta` + Determinismus-Tests | P0 | 128 + 1.024 + 175 + 9 Datensätze in `src/data/derived/`, Hash-Test grün |
| **P4** | **E1 `juno106`** + 128 importierte Presets | P3 | Presets klingen plausibel gegen die AMY-Wire-Referenz, Chorus I/II hörbar |
| **P5** | **E2 `dx7`** (Worklet, 32 Algorithmen) + 1.024 Voices | P1, P3 | Konverter-Unit-Test gegen `patches.h`; „E.PIANO 1"/„BRASS 1" identifizierbar |
| **P6** | FX-Welle 1: `cloudseed` (+9 Programme), `plate`, `galactic`, `shimmer`, `moogladder`-Modelle im PostFilter | P1, P2, P3 | Kein Feedback-Aufschaukeln bei Extremwerten; Freeze stabil > 60 s |
| **P7** | **E6 `wt-akwf`** + 400 Presets, **E8 `opl3`** + 175 Presets | P3 | Bundle-Zuwachs < 200 KB gzip; Lazy-Load der Restwellen funktioniert |
| **P8** | **E3 `plaits`**, **E4 `rings`** | P1 | 8 bzw. 3 Modelle umschaltbar, Makros sinnvoll belegt |
| **P9** | **E5 `stk-acoustic`**, **E7 `daisy-osc`** | P1 | 5 + 5 Modelle spielbar, keine Instabilität bei extremen Anregungen |
| **P10** | FX-Welle 2: `clouds`, `warps`, `resonator`, `paulstretch`, `tape`, `density`, `bitcrush`, `phaser`, `flanger`, `compressor`, `autowah`, `formantFilter` | P2 | 22 Module in der Registry, alle mit ParamSpec + Default |
| **P11** | ~40 FX-Rack-Presets, Browser-Facetten, README/Doku, Gesamt-Regressionslauf | alle | `npm run build` + `npx vitest run` grün, README auf 27 Engines / ~3.500 Presets aktualisiert |

Empfohlene Reihenfolge bei begrenzter Zeit: **P0 → P1 → P2 → P3 → P4 → P5 → P6**.
Danach ist der größte Nutzen realisiert (echte Presets, echter Ambient-Hall,
freies Rack); P7–P10 sind additive Erweiterungen ohne Umbau.

---

## 9. Tests

- **Import-Determinismus:** jeder Extraktor zweimal ausführen ⇒ identischer
  SHA-256 (`research/extract/*.test.mjs`).
- **DX7-Konverter:** 10 Stichproben-Voices gegen die entsprechenden Einträge in
  `amy/src/patches.h` prüfen (Ratio, EG-Rates, Algorithmus).
- **Juno-Kurven:** `to_filter_freq`/`to_resonance`/`to_*_time` gegen die in
  `juno.py` dokumentierten Messpunkte (A14 Flute: A=23 ⇒ ~200 ms usw.).
- **Preset-Schema:** alle ~3.500 Presets müssen `PresetSchema.parse()` bestehen
  (bestehender Test erweitern).
- **FX-Migration:** v1-Preset → v2-Rack → gerenderte Audio-Metriken bleiben
  innerhalb Toleranz (Offline-Render, Vergleich `peakDb`/`spectralCentroidHz`).
- **Stabilität:** Offline-Render 30 s pro FX-Modul bei Maximalparametern; Abbruch
  bei NaN, DC-Offset > 0.01 oder Peak > 0 dBFS.
- **Bundle-Budget:** Build-Test schlägt fehl, wenn das JS-Bundle 1,2 MB gzip
  überschreitet.

---

## 10. Risiken

| Risiko | Wirkung | Gegenmaßnahme |
|---|---|---|
| Werkspatch-Frage (§3.1) ungeklärt | P3–P5 blockiert oder nachträglich umzubauen | vor P3 entscheiden; Variante B ist mit einem Skriptlauf nachrüstbar |
| Portierungsaufwand MI/STK unterschätzt (Fixed-Point-Code, LUTs) | P8/P9 verzögern | Fixed-Point → Float umschreiben statt 1:1 portieren; LUT-abhängige Modelle (Speech, Drums) bewusst weglassen |
| Worklet-Last bei 4 Tracks × DX7 | Aussetzer | `Engine.maxVoices`, Under-run-Zähler, notfalls Track-weise Engine-Limits |
| Bundle-Wachstum durch AKWF/DX7-Bänke | Ladezeit | Int16-Kodierung, Lazy-Load über `public/`, harte Budget-Prüfung im Test |
| Schema-v2-Migration verliert Nutzerdaten | Datenverlust | Dexie-Upgrade mit Backup-Tabelle `edits_v1`, erst nach erfolgreichem Lauf löschen |
| `learnfm` hat keine eigene Lizenzdatei | Rechtsunsicherheit bei der DX7-Bank | Bezug ausschließlich über AMY (MIT) dokumentieren, `bwhitman/learnfm` als Ursprung nennen |
| CloudSeed-Quelle liegt nicht im Default-Branch | Klon greift ins Leere | `research/clone-repos.sh` explizit auf Branch `legacy-v1` klonen |

---

## 11. Quellenübersicht

Synthese: [pichenettes/eurorack](https://github.com/pichenettes/eurorack) ·
[shorepine/amy](https://github.com/shorepine/amy) ·
[thestk/stk](https://github.com/thestk/stk) ·
[electro-smith/DaisySP](https://github.com/electro-smith/DaisySP) ·
[PaulBatchelor/Soundpipe](https://github.com/PaulBatchelor/Soundpipe) ·
[ddiakopoulos/MoogLadders](https://github.com/ddiakopoulos/MoogLadders) ·
[bwhitman/learnfm](https://github.com/bwhitman/learnfm)

Effekte: [ValdemarOrn/CloudSeed](https://github.com/ValdemarOrn/CloudSeed) ·
[el-visio/dattorro-verb](https://github.com/el-visio/dattorro-verb) ·
[airwindows/airwindows](https://github.com/airwindows/airwindows) ·
[Signalsmith-Audio/signalsmith-stretch](https://github.com/Signalsmith-Audio/signalsmith-stretch)

Presetdaten: [KristofferKarlAxelEkstrand/AKWF-FREE](https://github.com/KristofferKarlAxelEkstrand/AKWF-FREE) ·
[sneakernets/DMXOPL](https://github.com/sneakernets/DMXOPL)

Nur als Referenz (GPL, nicht portiert): [surge-synthesizer/surge](https://github.com/surge-synthesizer/surge) ·
[mtytel/vital](https://github.com/mtytel/vital) ·
[pendragon-andyh/junox](https://github.com/pendragon-andyh/junox) ·
[jatinchowdhury18/AnalogTapeModel](https://github.com/jatinchowdhury18/AnalogTapeModel) ·
[grame-cncm/faustlibraries](https://github.com/grame-cncm/faustlibraries)
