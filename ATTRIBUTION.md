# Third-Party Notices & Open Source Attribution

SynthLab / Ambient Musikmaschine incorporates code, mathematical models, sound tables, and digital signal processing (DSP) algorithms from third-party open-source projects. We gratefully acknowledge the authors and maintainers of these projects.

---

## 1. Adapted DSP Algorithms & Worklets

### DX7 AudioWorklet & Math
- **File(s):** `synthlab/src/audio/worklets/dx7.worklet.ts`, `dx7Math.ts`
- **Upstream Project:** [`shorepine/amy`](https://github.com/shorepine/amy)
- **License:** MIT License
- **Original Copyright:** Copyright (c) 2022 Brian Whitman and Daniel P. W. Ellis
- **Attribution Note:** Algorithm routing structure originally attributed to MSFA (*Music Synthesizer for Android*).

### Juno-106 Synthesizer Engine
- **File(s):** `synthlab/src/presets/junoPresets.ts`, `synthlab/src/data/derived/juno106-patches.json`
- **Upstream Project:** [`shorepine/amy`](https://github.com/shorepine/amy)
- **License:** MIT License
- **Original Copyright:** Copyright (c) 2022 Brian Whitman and Daniel P. W. Ellis
- **Reference Note:** Parameter regression curves cited from [`pendragon-andyh/junox`](https://github.com/pendragon-andyh/junox) (GPL-3.0 comparison reference only; no GPL code copied).

### CloudSeed Diffuser Reverb
- **File(s):** `synthlab/src/audio/worklets/WorkletFx.ts`, `synthlab/src/data/derived/cloudseed-programs.json`
- **Upstream Project:** [`ValdemarOrn/CloudSeed`](https://github.com/ValdemarOrn/CloudSeed)
- **License:** MIT License
- **Original Copyright:** Copyright (c) 2018 Valdemar Erlingsson

### Airwindows Galactic & Tape Reverb
- **File(s):** `synthlab/src/audio/worklets/galactic.worklet.ts`, `tape.worklet.ts`
- **Upstream Project:** [`airwindows/airwindows`](https://github.com/airwindows/airwindows)
- **License:** MIT License
- **Original Copyright:** Copyright (c) 2018 Chris Johnson

### Dattorro Plate Reverb
- **File(s):** `synthlab/src/audio/worklets/plate.worklet.ts`
- **Upstream Project:** [`el-visio/dattorro-verb`](https://github.com/el-visio/dattorro-verb)
- **License:** MIT License
- **Original Copyright:** Copyright (c) 2022 Pauli Pölkki (Algorithm design by Jon Dattorro, 1997)

### Mutable Instruments Clouds & Resonator
- **File(s):** `synthlab/src/audio/worklets/clouds.worklet.ts`, `resonator.worklet.ts`
- **Upstream Project:** [`pichenettes/eurorack`](https://github.com/pichenettes/eurorack)
- **License:** MIT License
- **Original Copyright:** Copyright Émilie Gillet

### Signalsmith Stretch Shimmer
- **File(s):** `synthlab/src/audio/worklets/shimmer.worklet.ts`
- **Upstream Project:** [`Signalsmith-Audio/signalsmith-stretch`](https://github.com/Signalsmith-Audio/signalsmith-stretch)
- **License:** MIT License
- **Original Copyright:** Copyright (c) 2022 Geraint Luff / Signalsmith Audio Ltd.

### Moog Ladder Filter Collection
- **File(s):** `synthlab/src/audio/worklets/ladder.worklet.ts`
- **Upstream Project:** [`ddiakopoulos/MoogLadders`](https://github.com/ddiakopoulos/MoogLadders)
- **License:** Unlicense / Public Domain
- **Original Author:** Dimitri Diakopoulos

### DaisySP Lo-Fi & Phaser
- **File(s):** `synthlab/src/audio/worklets/lofi.worklet.ts`, `synthlab/src/audio/fx/Phaser.ts`
- **Upstream Project:** [`electro-smith/DaisySP`](https://github.com/electro-smith/DaisySP)
- **License:** MIT License
- **Original Copyright:** Copyright (c) Electrosmith Corp

### Paulstretch
- **File(s):** `synthlab/src/audio/worklets/paulstretch.worklet.ts`, `dsp/fft.ts`
- **Upstream Project:** [`paulnasca/paulstretch_python`](https://github.com/paulnasca/paulstretch_python)
- **License:** Public Domain
- **Original Author:** Nasca Octavian Paul

---

## 2. Presets & Sound Tables

### AKWF Single-Cycle Waveforms
- **Source:** [`KristofferKarlAxelEkstrand/AKWF-FREE`](https://github.com/KristofferKarlAxelEkstrand/AKWF-FREE)
- **License:** Creative Commons Zero v1.0 Universal (CC0 1.0 Public Domain Dedication)
- **Author:** Kristoffer Ekstrand ("Adventure Kid")

### OPL3 DMX GENMIDI Bank
- **Source:** [`sneakernets/DMXOPL`](https://github.com/sneakernets/DMXOPL)
- **License:** MIT License
- **Original Format Creator:** Digital eXpress Music / id Software
