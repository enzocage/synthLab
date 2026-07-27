# Synth- und Presetquellen

Die Preset-Schicht verwendet eigene, deterministisch erzeugte Parameterdaten.
Damit werden keine fremden Factory-Bänke in das Repository kopiert. Jede
Preset-ID ist reproduzierbar und enthält `source` und `license` für spätere
Importe.

## Geprüfte Referenzen

- [Surge XT Repository](https://github.com/surge-synthesizer/surge): freie
  Open-Source-Synthese unter GPL-3.0; Architektur und offene Preset-/Patch-
  Konzepte dienen als Referenz.
- [Surge XT Manual](https://surge-synthesizer.github.io/manual-xt/index.html):
  beschreibt Wavetable-, FM-, Filter-, Modulations- und Preset-Konzepte.
- [Dexed Repository](https://github.com/asb2m10/dexed): GPL-3.0 und ein
  praktisches FM-/DX7-Parameter-Modell; wird als kompatible Quelle für eine
  spätere `.syx`-/DX7-Importbrücke geführt.
- [Vital](https://vital.audio/): Factory-Inhalte werden nicht kopiert. Die
  [Lizenzdiskussion](https://forum.vital.audio/t/sound-design-question/14601)
  zeigt, dass unveränderte Inhalte nicht als eigene Presetbank weitergegeben
  werden sollten.

## Implementierte Bank

`au.presets.catalog` enthält 30 renderbare Synth-Profile, die auf vorhandene
interne Generatoren abgebildet werden, sowie 36 eigene Klangarchetypen pro
Profil: insgesamt 1080 eindeutige Presets. Die Auswahl ist seed-stabil,
rollenbewusst und liefert Parameter plus Makros an die Vorschlags-Engine.

## Ausnahme: importierte Werkspatches (plan5)

Die obige Regel ("keine fremden Factory-Bänke kopiert") gilt weiterhin für alle
prozedural erzeugten Bänke (`generate.ts`, `fmPresets.ts`, `sidPresets.ts`). Mit
plan5 kommt eine bewusste, dokumentierte Ausnahme hinzu:

- Die **Juno-106-Engine** (`juno106`) importiert die **128 Roland-Juno-106-
  Werkspatches** (Bänke A/B) aus [`shorepine/amy`](https://github.com/shorepine/amy)
  (MIT). Es handelt sich um reine Parameterzahlen (18-Byte-SysEx-Werte), nicht um
  Audio, ROM-Dumps oder Notenmaterial; AMY verbreitet sie seit Jahren unter MIT.
  Jedes importierte Preset trägt `provenance.source: "amy-juno106"`,
  `provenance.upstreamRepo` und den Original-Werksnamen (z.B. "A14 Flutes") in
  `provenance.derivedFrom`. Details und Begründung: `research/LICENSES.md` und
  `plan5.md` §3.1 (Variante A).
- Die **AKWF-Wavetable-Engine** (`wt-akwf`) importiert **261 echte Single-Cycle-
  Wellenformen** aus [`KristofferKarlAxelEkstrand/AKWF-FREE`](https://github.com/KristofferKarlAxelEkstrand/AKWF-FREE)
  (CC0-1.0) als PeriodicWave-Fourier-Koeffizienten. `provenance.source: "akwf-free"`.
- Die **OPL3-Engine** (`opl3`) importiert **175 echte DOS-Ära-Instrumente** (128
  General-MIDI-Programme + 47 Perkussion) aus der klassischen DMX-GENMIDI-Bank
  ([`sneakernets/DMXOPL`](https://github.com/sneakernets/DMXOPL), MIT).
  `provenance.source: "dmxopl-genmidi"`.
- Perspektivisch (siehe `plan5.md`) sollen auf dieselbe Weise 1.024 DX7-Voices
  hinzukommen — ebenfalls mit vollständiger Attribution statt eigener Erfindung.
