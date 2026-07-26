# SynthLab – Next-Gen Web Audio Synthesizer Suite

![SynthLab Screenshot](../gfx/Screenshot.jpg)

**SynthLab** ist eine hochmoderne, browserbasierte Synthesizer- und Performance-Plattform, entwickelt mit **React, TypeScript, Vite und Web Audio API**. Sie bietet 19 spezialisierte Synthesizer-Engines und eine kuratierte Bibliothek von **1.681 Presets** mit Mehrspur-Arrangement, interaktivem Audition-System und einem Echtzeit-FX-Rack.

---

## 🌟 Hauptmerkmale & Highlights

- **19 Synthesizer-Engines**: Von klassischer subtraktiver Synthese bis zu 6-Op FM, C64-SID Chip-Simulation, Additiv, Wavetable, Granular und Physikalischem Modeling.
- **1.681 Kuratierte Presets**: Sämtliche Presets sind Zod-schema-validiert und bieten umfassende Klangfarben für Bass, Lead, Pad, Arp, Pluck, Bell, Rhythm, Drone und FX.
- **C64 SID Lab Engine (`sid-chip`)**: Eigene Web-Audio C64-SID-Simulation mit 3-Stimmen-Kostenmodell, Hard-Sync, Ring-Modulation, PWM-Sweeps und 300 originären SID-Technik-Presets.
- **5 Spezialisierte FM-Engines**: Nachbildung bekannter Open-Source & Hardware FM-Architekturen (Yamaha DX7 6-Op, Sega Genesis YM2612 4-Op, Ameobea Dynamic Morph, Foydel Chaos Feedback & Tone.js Linear Precision).
- **12 Audition Test-Profile**: Vorhörphrasen für schnelles A/B-Testing (`BASS_LOCK`, `BASS_DRONE`, `ARP_HELD`, `MELODY_LEGATO`, `SYNC_RING_PAIR`, `RANGE_VELOCITY` uvm.).
- **Live-Performance & MIDI**: Ansteuerung über Hardware-MIDI-Keyboards, Bildschirm-Tastatur oder integrierte Phrasen-Sequenzen.
- **Ableton-Style FX-Rack**: Modular zuschaltbare Effekte (Drive, Post-Filter, Ensemble Chorus, Tape/PingPong Delay, Freeze Reverb & Stereo Width).
- **Dichtes, adaptives Responsive-UI**: Perfekt optimiert für den Viewport (`100vh`) mit separaten Scrollbalken für unkomplizierte Navigation.

---

## 🎹 Synthesizer-Engines & Herkunft

| Engine-ID | Name in der UI | Herkunft / Technische Referenz |
|---|---|---|
| `sid-chip` | **SID Lab (C64 SID)** | MOS Technology 6581/8580 Commodore 64 Sound Interface Device |
| `fm-dx7` | **FM DX7 (Yamaha DX7 6-Op Matrix)** | Yamaha DX7 Hardware & `ms3000/DX7-WebAudio` / `Tone.js` |
| `fm-4op` | **FM 4-Op (Sega Genesis YM2612 / TX81Z)** | Sega Genesis YM2612 Arcade FM & `g200kg/webaudio-tinysynth` |
| `fm-morph` | **FM Morph (Ameobea Web-Synth Phase Morph)** | `Ameobea/web-synth` dynamic phase morphing |
| `fm-feedback` | **FM Feedback (Foydel High-Chaos Dual FM)** | `ThomasFoydel/fmsynth` cross-feedback loops |
| `fm-linear` | **FM Linear (Tone.js Linear Precision)** | `ToneJS/Tone.js` (`Tone.FMSynth`) |
| `va-poly` | **VA Poly (Moog / Roland Subtractive)** | Klassische Virtual Analog subtraktive Synthese mit Ladder-Filter |
| `wavetable` | **Wavetable** | Dynamische Wavetable-Synthese mit Sweep |
| `fm6` | **FM6 Matrix** | 6-Operator Frequenzmodulation |
| `additive` | **Additive** | Obertonton-Synthese mit Partials |
| `granular` | **Granular** | Grain-Cloud Synthese |
| `modal` | **Modal** | Physikalische Resonanz-Synthese |
| `string` | **Karplus-Strong String** | Karplus-Strong Plucked String Modeling |
| `noisefield` | **Noisefield** | Gefilterte Rauschfeld-Synthese |
| `drone` | **Drone Engine** | Multi-Oszillator Low-Frequency Drone Generator |
| `wavefold` | **Wavefolder** | Wavefolding / West-Coast Shaper Synthese |
| `phasedist` | **Phase Distortion** | Casio CZ-Style Phasenverzerrung |
| `perc` | **Percussion** | Analoge & FM Schlagzeug-Synthese |
| `subbass` | **Sub Bass** | Tiefenfrequenz-Subbass Generator |

---

## 🛠️ Installation & Lokale Ausführung

### Voraussetzungen
- Node.js (Version 18 oder neuer)
- npm oder yarn

### Installation
```bash
# In das synthlab Verzeichnis wechseln
cd synthlab

# Abhängigkeiten installieren
npm install
```

### Entwicklungs-Server starten
```bash
npm run dev
```
Der Entwicklungs-Server startet standardmäßig unter `http://localhost:5173`.

### Tests ausführen
```bash
npx vitest run
```

### TypeScript Typecheck & Production Build
```bash
npm run build
```

---

## ⌨️ Tastatur-Kurzbefehle

- **Leertaste**: Wiedergabe / Stopp der Phrasen-Vorschau
- **Pfeil hoch / runter**: Nächstes / Vorheriges Preset laden
- **1 – 5**: Schnelles Bewerten des aktuellen Presets (1 bis 5 Sterne)
- **F**: Preset als Favorit markieren / abwählen
- **A / B**: A/B-Vergleichs-Slots belegen & umschalten
- **M**: Jitter-Mutation für das aktuelle Preset auslösen
- **Esc / Panic**: Alle aktiven Noten & Oszillatoren sofort stoppen

---

## 📜 Lizenz & Urheberrecht

- **Codebase & Presets**: MIT-Lizenz (Eigenständige Entwürfe & Open-Source Adapters).
- **Herstellernamen & Marken**: Yamaha DX7, Commodore 64, MOS 6581/8580, Sega Genesis YM2612 und Roland sind eingetragene Warenzeichen ihrer jeweiligen Eigentümer und dienen hier ausschließlich der technischen Herkunfts- und Stilbeschreibung.
