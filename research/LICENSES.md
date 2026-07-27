# Licences & Attributions for SID Lab (synthlab)

This document tracks all external reference repositories analyzed and adapted for the `sid-chip` ("SID Lab") engine in `synthlab`.

## Primary Technical Reference

### [`stevi84/sid-player`](https://github.com/stevi84/sid-player)
- **License:** MIT
- **Usage:** Architecture reference for Web Audio AudioWorklet SID voice structures, pitch conversion, and ADSR timing models.
- **Attribution:** Original work by stevi84.

## Secondary Permissive References

### [`igorski/VSTSID`](https://github.com/igorski/VSTSID)
- **License:** MIT
- **Usage:** Reference implementation for PWM modulation, ADSR timing curves, Portamento logic, tempo arpeggiator & ring modulation algorithms.
- **Attribution:** Copyright (c) Igorski.

### [`devinvenable/c64SIDkit`](https://github.com/devinvenable/c64SIDkit)
- **License:** MIT
- **Usage:** Reference for SID ADSR timing classes, register parameter mappings, frequency sweeps, vibrato and portable chip sound design techniques.
- **Attribution:** Copyright (c) Devin Venable.

### [`JC-000/c64-sid-instruments`](https://github.com/JC-000/c64-sid-instruments)
- **License:** CC BY 4.0
- **Usage:** Schema reference for 6581/8580 filter curve characteristics.

---

---

## plan5: Juno-106 Engine & Werkspatches

### [`shorepine/amy`](https://github.com/shorepine/amy)
- **License:** MIT (Copyright (c) 2022 Brian Whitman and Daniel PW Ellis)
- **Usage:** `amy/juno.py` liefert die vollständige Roland-Juno-106-Emulation
  (Umrechnungskurven `to_filter_freq`, `to_resonance`, `to_attack_time`,
  `to_decay_time`, `to_release_time`, `to_lfo_freq`, `to_lfo_delay`) sowie **128
  Werks-Patches** (Bänke A/B, `_PATCHES`-Tabelle) als 18-Byte-Parametersätze.
- **Provenance-Entscheidung (plan5 §3.1, Variante A):** Die Parameterdaten werden
  mit vollständiger Attribution übernommen (Werksname, AMY als Quelle). Es handelt
  sich um reine Zahlenwerte, keine Audiodaten, keine Binärdumps von Original-ROMs;
  AMY verbreitet sie seit Jahren unter MIT. `preset_sources.md` wurde entsprechend
  ergänzt.
- **Attribution:** Original work Brian Whitman & Daniel P. W. Ellis (AMY-Projekt).
  Filterkurven-Regression laut Quellcode-Kommentar zusätzlich referenziert auf
  [`pendragon-andyh/junox`](https://github.com/pendragon-andyh/junox) (GPL-3.0,
  nur als Vergleichsreferenz zitiert, kein Code übernommen) und ein Arturia-
  Demo-Video.

## plan5: FX-Module

### [`ValdemarOrn/CloudSeed`](https://github.com/ValdemarOrn/CloudSeed) (Branch `legacy-v1`)
- **License:** MIT (Copyright (c) 2018 Valdemar Erlingsson)
- **Usage:** Architekturreferenz für das `cloudseed`-Reverb-Modul: Multitap-
  Diffusor für frühe Reflexionen, modulierte Allpass-Diffusor-Kette, parallele
  gedämpfte Verzögerungsleitungen ("Lines") mit Cross-Seed-Kopplung zwischen den
  Kanälen (`CloudSeed.Native/ReverbChannel.h`, `MultitapDiffuser.h`,
  `AllpassDiffuser.h`, `DelayLine.h`). Neu implementiert mit den in SynthLab
  bereits vorhandenen DSP-Bausteinen (`dsp/allpass.ts`, `dsp/onepole.ts`) statt
  einer 1:1-Portierung des C++-Codes.
- **Presets:** 9 Factory-Programme (`Factory Programs/*.json`) direkt als reale
  Parametersätze übernommen (bereits 0..1-normalisiert, Parameter-Namen 1:1
  kompatibel zur eigenen Implementierung).
- **Attribution:** Original work Valdemar Erlingsson.

---

## plan5: AKWF-Wavetable-Engine

### [`KristofferKarlAxelEkstrand/AKWF-FREE`](https://github.com/KristofferKarlAxelEkstrand/AKWF-FREE)
- **License:** CC0-1.0 (Public Domain Dedication)
- **Usage:** 261 kuratierte Single-Cycle-Wellenformen (jede 16. von 4.162
  Original-Wellenformen aus `AKWF-js/*.json`), per DFT in kompakte PeriodicWave-
  Fourier-Koeffizienten (48 Harmonische) umgewandelt (siehe
  `research/extract/import-akwf.mjs`). Verwendet in der `wt-akwf`-Engine.
- **Attribution:** Kristoffer Ekstrand ("Adventure Kid").

## plan5: OPL3-Engine

### [`sneakernets/DMXOPL`](https://github.com/sneakernets/DMXOPL)
- **License:** MIT
- **Usage:** `GENMIDI.op2` (klassische DMX-GENMIDI-Instrumentenbank, Doom-Engine-
  Format) liefert 175 echte 2-Operator-FM-Instrumente (128 General-MIDI-
  Programme + 47 Perkussion) mit vollständigen OPL2/OPL3-Registerwerten
  (Multiplier, Attack/Decay/Sustain/Release, Output-Level, Waveform, Feedback,
  Connection). Siehe `research/extract/import-opl3.mjs`.
- **Byte-Layout-Referenz:** Das binäre GENMIDI-Format selbst ist nicht in DMXOPL
  dokumentiert; das exakte Byte-Layout (`genmidi_instr_t`/`genmidi_voice_t`/
  `genmidi_op_t`) wurde gegen
  [`chocolate-doom/chocolate-doom`](https://github.com/chocolate-doom/chocolate-doom)
  (`src/i_oplmusic.c`, GPL-2.0) verifiziert - **nur als Formatreferenz**, kein
  Code aus diesem Repository wurde übernommen (nur die öffentlich dokumentierte
  Struct-Definition, die den Aufbau eines offenen Binärformats beschreibt).
- **Attribution:** DMXOPL-Bank sneakernets (MIT). GENMIDI-Format ursprünglich id
  Software / Digital eXpress Music (DMX), verwendet in Doom, Heretic, Hexen u.a.

---

## plan5: DX7-Engine (AudioWorklet)

### [`shorepine/amy`](https://github.com/shorepine/amy)
- **License:** MIT (Copyright (c) 2022 Brian Whitman and Daniel PW Ellis)
- **Usage (Werksvoices):** `amy/default-dx7-patches.bin` liefert **1.024 echte
  DX7-Werksvoices** im klassischen 156-Byte-"unpacked"-Format, generiert mit
  `dx7db` aus [`bwhitman/learnfm`](https://github.com/bwhitman/learnfm). Byte-
  Layout 1:1 aus `amy/fm.py` (`DX7Patch.from_bytestream`) portiert - verifiziert
  durch erfolgreiches Dekodieren aller 1.024 klassischen ROM1A/1B-Namen
  ("BRASS 1", "E.PIANO 1", "STRINGS 1" usw.), siehe
  `research/extract/import-dx7.mjs`.
- **Usage (Envelope-/Frequenz-Formeln):** `amy/fm.py` liefert die empirisch
  gegen DX7-Hardware gefitteten Umrechnungsformeln (`dx7level_to_linear`,
  `coarse_fine_ratio`, `coarse_fine_fixed_hz`, `calc_loglin_eg_breakpoints`,
  Feedback-Skalierung) - portiert nach
  `synthlab/src/audio/worklets/dx7Math.ts`.
- **Usage (Algorithmus-Routing-Tabelle):** `amy/src/algorithms.c` enthält die
  32 DX7-Algorithmen als kompakte Bus-Routing-Flags (`FmAlgorithm`-Tabelle) samt
  der Render-Logik (Bus1/Bus2-Akkumulation, Feedback-Selbstmodulation,
  Scratch-Buffer bei gleichzeitigem Lesen/Schreiben von Bus1) - 1:1 nach
  `synthlab/src/audio/worklets/dx7.worklet.ts` portiert. AMY attribuiert diese
  Operator-Struktur im Quelltext selbst an "MSFA" (Music Synthesizer for
  Android, ein bekanntes Open-Source-DX7-Emulationsprojekt).
- **Attribution:** Brian Whitman & Daniel P. W. Ellis (AMY-Projekt); DX7-Voice-
  Bank via `bwhitman/learnfm`; Algorithmus-Struktur mit Dank an MSFA (laut
  AMY-Quelltextkommentar).

(`chocolate-doom/chocolate-doom` wurde bereits im OPL3-Abschnitt oben als reine
Formatreferenz für das GENMIDI-Binärformat dokumentiert - dieselbe Referenz
deckt auch keinen weiteren Code-Übernahmebedarf für DX7 ab.)

---

## plan10: 10 weitere FX-Module

### [`el-visio/dattorro-verb`](https://github.com/el-visio/dattorro-verb) → `plate`
- **License:** MIT (Copyright (c) 2022 Pauli Pölkki)
- **Usage:** Vollständige, kompakte C-Referenzimplementierung (`verb.c`,
  341 Zeilen) des klassischen Jon-Dattorro-Plattenhall-Designs (Pre-Delay →
  Vorfilter → 4-stufiger Eingangsdiffusor → zwei gekoppelte Tank-Hälften mit
  modulierten Allpässen, Damping-Tiefpass und Cross-Feedback). 1:1 nach
  `synthlab/src/audio/worklets/plate.worklet.ts` portiert, inkl. der
  Original-Verzögerungslängen ("Jon Dattorro's magic numbers").
- **Attribution:** Pauli Pölkki (el-visio), Algorithmus nach Jon Dattorro
  ("Effect Design Part 1", 1997, CCRMA Stanford).

### [`airwindows/airwindows`](https://github.com/airwindows/airwindows) → `galactic`, `tape`
- **License:** MIT (Copyright (c) 2018 Chris Johnson)
- **Usage (`galactic`):** `plugins/LinuxVST/src/Galactic/GalacticProc.cpp` -
  ein 12-stufiges Verzögerungsnetzwerk mit drei kaskadierten 4×4-Householder-
  Mischstufen, vibrato-moduliertem Prädelay und zwei Ein-Pol-Tiefpässen im
  Rückkopplungspfad. Portiert nach `synthlab/src/audio/worklets/galactic.worklet.ts`;
  das im Original enthaltene 32-Bit-Dithering am Ausgang entfällt (irrelevant
  bei durchgehender Float32-Verarbeitung im Browser).
- **Usage (`tape`):** `plugins/LinuxVST/src/ToTape6` (Sättigung + Head-Bump +
  Flutter) und `plugins/LinuxVST/src/IronOxide5` (Bandgeschwindigkeits-
  Sättigungscharakter) als Referenz für `synthlab/src/audio/worklets/tape.worklet.ts`.
- **Attribution:** Chris Johnson (airwindows).

### [`pichenettes/eurorack`](https://github.com/pichenettes/eurorack) → `clouds`, `resonator`
- **License:** MIT (Header pro Datei, Copyright Émilie Gillet, keine
  Root-`LICENSE`-Datei - wie bereits bei Plaits in plan5 dokumentiert)
- **Usage (`clouds`):** `clouds/dsp/` (`granular_processor.cc/h`, `grain.h`,
  `audio_buffer.h`, `window.h`, `wsola_sample_player.h`,
  `looping_sample_player.h`, `correlator.cc/h`, `pvoc/`) als Architekturreferenz
  für einen Granular-/Loop-/Stretch-Texturprozessor, portiert nach
  `synthlab/src/audio/worklets/clouds.worklet.ts`.
- **Usage (`resonator`):** `rings/dsp/` (`resonator.cc/h`, `string.cc/h`,
  `part.cc/h`) als Architekturreferenz für einen anregungsbasierten Modal-/
  Saiten-Resonator, portiert nach `synthlab/src/audio/worklets/resonator.worklet.ts`.
  Der Original-Code ist Fixed-Point-optimiert für Cortex-M4; die Portierung
  rechnet durchgehend in Float (dieselbe Entscheidung wie bei der DX7-Portierung).
- **Attribution:** Émilie Gillet (Mutable Instruments).

### [`Signalsmith-Audio/signalsmith-stretch`](https://github.com/Signalsmith-Audio/signalsmith-stretch) → `shimmer`
- **License:** MIT (Copyright (c) 2022 Geraint Luff / Signalsmith Audio Ltd.)
- **Usage:** Architekturreferenz für formanterhaltendes Pitch-Shifting in der
  Feedback-Schleife von `synthlab/src/audio/worklets/shimmer.worklet.ts`
  (Pitch-Shifter → Reverb-Tank → begrenztes Feedback zurück in den Shifter).
- **Attribution:** Geraint Luff (Signalsmith Audio).

### [`ddiakopoulos/MoogLadders`](https://github.com/ddiakopoulos/MoogLadders) → `ladder`
- **License:** Unlicense (Public-Domain-Widmung, Attribution rechtlich nicht
  gefordert, hier trotzdem gesetzt)
- **Usage:** Enthält acht unabhängige 4-Pol-Moog-Ladder-Filter-
  Implementierungen (u.a. Huovilainen, Stilson, Simplified, Improved,
  Krajeski, Microtracker, Musicdsp, Oberheim). Statt aller acht wird bewusst
  nur **ein** Modell portiert: `src/KrajeskiModel.h` (Aaron Krajeskis
  "compromise poles at z=-0.3"-Variante, im Quellcode selbst als "Unlicensed"
  bestätigt) für `synthlab/src/audio/worklets/ladder.worklet.ts` - dieses
  Modell ist bei Audiorate-Parameteränderungen stabil ohne Oversampling,
  anders als z.B. Huovilainen.
- **Attribution:** Dimitri Diakopoulos (Repo), Aaron Krajeski (Modell).

### [`electro-smith/DaisySP`](https://github.com/electro-smith/DaisySP) → `phaser` (Flanger-Modus), `lofi` (Bitcrush + Decimate)
- **License:** MIT (bereits in plan5 vendored, kein erneuter Klon nötig)
- **Usage:** `Source/Effects/phaser.h` und `Source/Effects/flanger.h` als
  Referenz für `synthlab/src/audio/fx/Phaser.ts` (reine WebAudio-Node-
  Implementierung, kein Worklet); `Source/Effects/decimator.cpp/h` als
  Referenz für **beide** Lo-Fi-Achsen (Sample-and-Hold-Downsampling +
  Bit-Shift-Quantisierung) in `synthlab/src/audio/worklets/lofi.worklet.ts`.
  Wie bei allen DaisySP-Übernahmen bleibt `DaisySP-LGPL/` (u.a. `ReverbSc`)
  explizit außen vor.
- **Attribution:** Electrosmith Corp.

### Korrigierter Befund zu Soundpipe - nicht als Quelle verwendet
Ursprünglich war geplant, `PaulBatchelor/Soundpipe`s `modules/bitcrush.c`
(MIT, kein Upstream-Hinweis im eigenen Dateikopf) für `lofi` zu verwenden.
Bei genauerer Prüfung stellte sich heraus, dass `bitcrush.c` zur Laufzeit
`modules/fold.c` für die Sample-and-Hold-Stufe aufruft - und **`fold.c`
selbst trägt einen Upstream-Hinweis** ("This code has been extracted from
the Csound opcode 'fold'", Csound ist LGPL-2.1) - exakt dasselbe Muster wie
bei `revsc.c`/`zitarev.c`/`talkbox.c`, nur eine Ebene tiefer in der
Abhängigkeitskette versteckt. `lofi` wird deshalb **ausschließlich** aus
DaisySP bezogen (siehe oben); aus Soundpipe wird kein Code übernommen. Das
lokale Sparse-Checkout von Soundpipe bleibt als reines Lesematerial
bestehen, wird aber nicht mehr referenziert.

### [`paulnasca/paulstretch_python`](https://github.com/paulnasca/paulstretch_python) → `paulstretch`
- **License:** Public Domain. Die GitHub-API meldet für dieses Repository kein
  maschinenlesbares Lizenzfeld (keine `LICENSE`-Datei im Root), die Freigabe
  steht aber unmissverständlich im README (*"The Paulstretch algorithm is
  released under Public Domain"*) und zusätzlich im Kopf jeder Python-Datei
  (*"this file is released under Public Domain"*) - hiermit als eindeutig
  gemeinfrei dokumentiert, damit das leere API-Lizenzfeld nicht fälschlich als
  Unklarheit gelesen wird.
- **Usage:** `paulstretch_stereo.py` als Algorithmusreferenz (FFT-Fenster →
  Phasen-Randomisierung → IFFT → Overlap-Add) für
  `synthlab/src/audio/worklets/paulstretch.worklet.ts` und die zugehörige
  `synthlab/src/audio/worklets/dsp/fft.ts`.
- **Attribution:** Nasca Octavian Paul (Targu Mures, Romania).

### Bewusst nicht übernommen (siehe `plan10.md` §4.1)
[`michaelwillis/dragonfly-reverb`](https://github.com/michaelwillis/dragonfly-reverb)
(GPL-3.0), [`jatinchowdhury18/AnalogTapeModel`](https://github.com/jatinchowdhury18/AnalogTapeModel)
(GPL-3.0), [`elk-audio/mda-vst3`](https://github.com/elk-audio/mda-vst3)
(GPL-3.0) - ausschließlich als Referenz zitiert, kein Code übernommen.

---

## Copyright & Provenance Notice

All 300 presets provided with SID Lab (`sid-chip`) are original synthesised sound designs.
- No original SID files (`.sid`), extracted instrument tables, binary ROMs, or composer samples from commercial C64 games or HVSC are included in this project.
- Named era collections (e.g. `Hubbard-era`, `Galway-era`, `Daglish-era`, `Gray-era`) refer strictly to documented synthesiser technique studies and sound design styles of the 1980s 8-bit chip era.
