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

## Copyright & Provenance Notice

All 300 presets provided with SID Lab (`sid-chip`) are original synthesised sound designs.
- No original SID files (`.sid`), extracted instrument tables, binary ROMs, or composer samples from commercial C64 games or HVSC are included in this project.
- Named era collections (e.g. `Hubbard-era`, `Galway-era`, `Daglish-era`, `Gray-era`) refer strictly to documented synthesiser technique studies and sound design styles of the 1980s 8-bit chip era.
