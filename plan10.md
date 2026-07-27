# plan10 – 10 weitere erstklassige FX-Module aus Open-Source-Quellen

**Stand:** 2026-07-27
**Grundlage:** Repository-Zustand nach `plan5.md` (CloudSeed) und `plan7.md` (FX-Rack-Metadaten).
**Zweck:** Die FX-Kette wächst von 7 auf 17 Module. Jedes neue Modul stammt aus
einem konkret benannten, lizenzgeprüften GitHub-Repository.

Alle Angaben zu Repositories, Sternen, Lizenzen und Dateipfaden wurden am
2026-07-27 gegen die GitHub-API bzw. die Rohdateien der jeweiligen Repositories
verifiziert. Wo die Lizenzlage nicht dem entspricht, was das Repo auf oberster
Ebene angibt, steht das explizit in §4.

---

## 1. Ziel

SynthLab hat heute **7 FX-Module**: Drive, Post-Filter, Ensemble, Delay, Reverb
(Freeverb), CloudSeed, Width. Für eine Ambient-Maschine fehlen damit ganze
Kategorien: Granulare Texturbearbeitung, extremes Time-Stretching, Resonatoren,
Pitch-Shift/Shimmer, Bandsättigung, selbstoszillierende Filter und Lo-Fi.

plan10 ergänzt **10 Module**, bewusst über alle Kategorien verteilt statt
"noch drei Reverbs":

| Kategorie | vorhanden | neu (plan10) |
|---|---|---|
| Raum | Freeverb, CloudSeed | **Plate**, **Galactic**, **Shimmer** |
| Textur | – | **Clouds (Granular)**, **Paulstretch** |
| Resonanz | – | **Rings (Resonator)** |
| Sättigung | Drive | **Tape** |
| Filter | Post-Filter (Biquad) | **Ladder** (8 Modelle, Selbstoszillation) |
| Modulation | Ensemble (Chorus) | **Phaser & Flanger** |
| Lo-Fi | – | **Bitcrush / Decimate** |

Zielgröße nach Umsetzung: **17 FX-Module**, alle im frei sortierbaren V2-Rack.

---

## 2. Verifizierter Ist-Zustand

### 2.1 Was funktioniert

- `audio/fx/registry.ts`: `FX_MODULES` mit Metadaten (Kategorie, `defaultOrder`,
  `params: FxParamSpec[]`) für alle 7 Module. Die Rack-UI rendert generisch daraus.
- `audio/fx/types.ts`: V2-Format `FxRackState { version: 2, slots: FxSlot[] }`
  plus die Brücken `fxRackFromLegacy()` und `legacyFxFromRack()`.
- `audio/worklets/registry.ts`: `ensureWorkletLoaded(ctx, name, url)` mit
  Promise-Dedupe pro AudioContext.
- DSP-Bausteine: `dsp/allpass.ts`, `dsp/comb.ts`, `dsp/onepole.ts`,
  `dsp/modulatedAllpass.ts`.

### 2.2 Drei blockierende Befunde

Diese drei Punkte müssen **vor** dem ersten neuen Modul gelöst werden, sonst
skaliert jede Ergänzung falsch:

**(a) `FxChain.ts` ist weiterhin fest verdrahtet.**
Sieben benannte Member, sieben `connect()`-Aufrufe in fester Reihenfolge. Mit 17
Modulen wären das 17 Member und 17 Verdrahtungszeilen – und die
`FxSlot`-Reihenfolge aus dem V2-Rack bliebe weiterhin wirkungslos.

**(b) `legacyFxFromRack()` verwirft unbekannte Slots stillschweigend.**

```ts
if (!LEGACY_FX_ORDER.includes(slot.type as FxModuleId)) continue;
```

`LEGACY_FX_ORDER` enthält genau die 7 Altmodule. Ein neu ins Rack gelegtes
`plate`- oder `clouds`-Modul würde also in der Rack-UI erscheinen, beim
Projizieren auf den Audiopfad aber lautlos herausfallen – ein Fehler, der sich
als "Modul tut nichts" äußert und schwer zu finden ist.

**(c) `WorkletVoice.ts` passt nicht auf FX.**
Der vorhandene Adapter modelliert eine *Instrumentenstimme*
(`trigger`/`release`/`isFinished`, 0 Eingänge, 1 Mono-Ausgang, Lebensdauer =
eine Note). FX brauchen das Gegenteil: dauerhaft laufend, 2 Eingänge, 2
Ausgänge, Parameteränderungen zur Laufzeit, kein Lebensende. Dafür ist ein
zweiter, eigener Adapter nötig – kein Umbau des vorhandenen.

---

## 3. Die 10 Module

| # | Modul-ID | Titel | Kategorie | Quelle | Lizenz | ★ | Umsetzung |
|---|---|---|---|---|---|---|---|
| 1 | `plate` | Plate Reverb | space | [`el-visio/dattorro-verb`](https://github.com/el-visio/dattorro-verb) | MIT | 61 | Worklet |
| 2 | `galactic` | Galactic | space | [`airwindows/airwindows`](https://github.com/airwindows/airwindows) | MIT | 1.194 | Worklet |
| 3 | `clouds` | Granular Texture | texture | [`pichenettes/eurorack`](https://github.com/pichenettes/eurorack) | MIT¹ | 3.131 | Worklet |
| 4 | `paulstretch` | Extreme Stretch | texture | [`paulnasca/paulstretch_python`](https://github.com/paulnasca/paulstretch_python) | **Public Domain** | 538 | Worklet + FFT |
| 5 | `resonator` | Rings Resonator | resonance | [`pichenettes/eurorack`](https://github.com/pichenettes/eurorack) | MIT¹ | 3.131 | Worklet |
| 6 | `shimmer` | Shimmer Pitch-Reverb | space | [`Signalsmith-Audio/signalsmith-stretch`](https://github.com/Signalsmith-Audio/signalsmith-stretch) | MIT | 528 | Worklet |
| 7 | `tape` | Tape Saturation | saturation | [`airwindows/airwindows`](https://github.com/airwindows/airwindows) | MIT | 1.194 | Worklet |
| 8 | `ladder` | Ladder Filter | filter | [`ddiakopoulos/MoogLadders`](https://github.com/ddiakopoulos/MoogLadders) | Unlicense | 390 | Worklet |
| 9 | `phaser` | Phaser & Flanger | modulation | [`electro-smith/DaisySP`](https://github.com/electro-smith/DaisySP) | MIT | 1.199 | WebAudio-Nodes |
| 10 | `lofi` | Bitcrush / Decimate | lofi | [`PaulBatchelor/Soundpipe`](https://github.com/PaulBatchelor/Soundpipe) + DaisySP | MIT² | 64 / 1.199 | Worklet |

¹ Mutable Instruments führt keine `LICENSE`-Datei im Wurzelverzeichnis; die
MIT-Lizenz steht im Kopf **jeder** Quelldatei (Copyright Émilie Gillet) – wie
bereits in `research/LICENSES.md` für Plaits dokumentiert.
² Nur `modules/bitcrush.c` – siehe §4.2, nicht alle Soundpipe-Module sind
unbedenklich.

---

## 4. Lizenz-Leitplanken

Es gelten unverändert die Regeln aus `plan5.md` §3: nur permissiv portieren
(MIT/BSD/Apache-2.0/CC0/Unlicense/Public Domain), kein GPL-Code in `synthlab/`,
pro portiertem Modul ein Herkunftskopf in der Quelldatei, `research/LICENSES.md`
fortschreiben.

### 4.1 Bewusst ausgeschlossen

| Repo | ★ | Lizenz | Warum nicht |
|---|---|---|---|
| [`michaelwillis/dragonfly-reverb`](https://github.com/michaelwillis/dragonfly-reverb) | 1.125 | GPL-3.0 | GPL |
| [`jatinchowdhury18/AnalogTapeModel`](https://github.com/jatinchowdhury18/AnalogTapeModel) | 1.396 | GPL-3.0 | GPL – Bandmodell kommt stattdessen von Airwindows (MIT) |
| `grame-cncm/faustlibraries` | 249 | pro Datei, überw. LGPL/STK | Lizenz pro Datei, bleibt Lesematerial |
| `mda`-Plugins (u.a. `elk-audio/mda-vst3`) | 31 | GPL-3.0 | GPL – betrifft Soundpipes `talkbox.c`, siehe unten |

[`Dougal-s/Aether`](https://github.com/Dougal-s/Aether) (MIT, 208★) ist ein
LV2-Reverb "based on Cloudseed" und wäre lizenzrechtlich unbedenklich – bringt
aber gegenüber dem bereits vorhandenen `cloudSeed`-Modul zu wenig Neues und
entfällt deshalb aus inhaltlichen, nicht aus rechtlichen Gründen.

### 4.2 Wichtiger Befund: Soundpipe ist nicht durchgängig MIT-unbedenklich

Soundpipe steht auf Repo-Ebene unter MIT, die README sagt aber selbst:
*"High quality modules ported from Csound and FAUST"*. Die Dateiköpfe bestätigen
das. Konkret geprüft:

| Modul | Dateikopf sagt | Bewertung |
|---|---|---|
| `modules/zitarev.c` | FAUST-Port von zita-rev1, *"Original Author: Fons Adriaensen"* | ⚠ zita-rev1 ist upstream GPL – **nicht übernehmen** |
| `modules/revsc.c` | *"extracted from the Csound opcode reverbsc"*, Sean Costello / Istvan Varga | ⚠ Csound ist LGPL – **nicht übernehmen** |
| `modules/talkbox.c` | *"ported from the mdaTalkbox plugin by Paul Kellet"* | ⚠ mda heute GPL-3.0 – **nicht übernehmen** |
| `modules/bitcrush.c` | kein Upstream-Hinweis, reiner Soundpipe-Code | ✅ unbedenklich MIT – wird für Modul 10 verwendet |

Deshalb kommt aus Soundpipe **ausschließlich** `bitcrush.c`. Reverb-Bedarf wird
über Dattorro (MIT) und Airwindows (MIT) gedeckt, nicht über `revsc`/`zitarev`.

Dasselbe Muster wie schon bei DaisySP: dessen `ReverbSc` liegt im separaten
Verzeichnis `DaisySP-LGPL` und bleibt ebenfalls außen vor. Aus DaisySP werden
nur Dateien aus `Source/Effects/` verwendet (verifiziert vorhanden: `autowah.h`,
`chorus.h`, `decimator.h`, `flanger.h`, `overdrive.h`, `phaser.h`,
`pitchshifter.h`, `sampleratereducer.h`, `tremolo.h`, `wavefolder.h`).

### 4.3 Paulstretch: sauber gemeinfrei

Die GitHub-API meldet für `paulnasca/paulstretch_python` keine Lizenz, weil eine
`LICENSE`-Datei fehlt. Die Lizenz steht stattdessen im Klartext im README –
*"The Paulstretch algorithm is released under Public Domain"* – und zusätzlich im
Kopf jeder Quelldatei (*"this file is released under Public Domain"*). Damit ist
die Herkunft eindeutig und unbedenklich; das ist in `research/LICENSES.md` mit
genau dieser Begründung festzuhalten, damit später niemand über das leere
API-Lizenzfeld stolpert.

---

## 5. Architektur-Voraussetzungen

### 5.1 P1 – FxChain datengetrieben machen

`FxChain.ts` wird von sieben festen Membern auf eine Slot-Liste umgestellt:

```ts
// audio/fx/FxChain.ts (neu)
interface FxNode {
  readonly input: AudioNode;
  readonly output: AudioNode;
  update(params: Record<string, FxParamValue>, enabled: boolean): void;
  start?(time: number): void;
  setFreeze?(freeze: boolean): void;
  dispose(): void;
}

type FxFactory = (ctx: BaseAudioContext, params: ParamValues) => FxNode | Promise<FxNode>;
```

Die Registry in `audio/fx/registry.ts` bekommt pro Modul ein `create`-Feld, das
auf diese Factory zeigt. `FxChain` iteriert dann nur noch über
`rack.slots` und verkettet `output → input`. Reihenfolgeänderungen werden durch
Neuverdrahtung mit kurzem Crossfade (15–40 ms, wie `ParamSmoother` es vorgibt)
umgesetzt, nicht durch harten Umbau.

**Abnahme:** Alle 7 Bestandsmodule laufen unverändert über den neuen Pfad; ein
im Rack umsortiertes Modul ist hörbar an anderer Stelle der Kette.

### 5.2 P2 – `legacyFxFromRack()` reparieren

Die stille `continue`-Verwerfung (§2.2b) wird ersetzt: unbekannte, also neue
Slot-Typen wandern in ein zusätzliches Feld, statt zu verschwinden.

```ts
export interface FxChainSettings {
  /* … 7 Altmodule unverändert … */
  extras: Record<string, { enabled: boolean } & Record<string, FxParamValue>>;
}
```

Damit bleiben alte Presets (V1) und alte IndexedDB-Einträge gültig, ohne dass
die 10 neuen Module künstlich in das V1-Namensschema gepresst werden müssen.
Zusätzlich ein Test, der sicherstellt, dass **jedes** in `FX_MODULES`
registrierte Modul einen Roundtrip Rack → Settings → Rack unverändert übersteht
– genau der Fehler aus §2.2b wäre damit dauerhaft ausgeschlossen.

### 5.3 P3 – FX-Worklet-Adapter

Neu: `audio/worklets/WorkletFx.ts`, analog zu `WorkletVoice.ts`, aber für
dauerhaft laufende Stereo-Prozessoren:

```ts
export class WorkletFx implements FxNode {
  readonly input: AudioWorkletNode;   // 2 in
  readonly output: AudioWorkletNode;  // 2 out (identischer Node)
  update(params, enabled) { this.node.port.postMessage({ type: "params", params, enabled }); }
  dispose() { this.node.port.onmessage = null; this.node.disconnect(); }
}
```

Gemeinsame Basis für alle FX-Prozessoren: `audio/worklets/fxProcessorBase.ts`
mit Parameter-Glättung (kein Zippern bei Reglerbewegung), Bypass-Crossfade und
einem `denormal`-Schutz.

**Wichtig – Lazy Instantiation:** Bei 4 Tracks × 17 Modulen wären bis zu 68
Worklet-Nodes gleichzeitig aktiv. Ein `AudioWorkletNode` kostet auch im Bypass
CPU (`process()` läuft weiter). Deshalb: ein Worklet-Modul wird **erst beim
Einschalten instanziiert** und beim Ausschalten nach einem Ausklingfenster
(Reverb-Tails!) wieder entsorgt. Der Slot bleibt im Rack sichtbar, der Node
existiert nur solange `enabled`.

**Abnahme:** Ein Testton durch ein Pass-Through-FX-Worklet ist bit-identisch zum
Original (Offline-Render); 4 Tracks mit je 3 aktiven Worklet-FX erzeugen keine
Under-runs.

---

## 6. Die Module im Detail

### 6.1 `plate` – Plate Reverb (Dattorro)

**Quelle:** `el-visio/dattorro-verb` (MIT). Sehr kompakt (~200 Zeilen C), das
kanonische Jon-Dattorro-Design aus dem AES-Paper von 1997: Eingangs-Diffusor
(4 Allpässe) → Figure-of-8-Tank aus zwei gekoppelten Hälften mit je
modulierten Allpässen, Delay und Dämpfungsfilter.

Klanglich klar unterscheidbar von den vorhandenen Reverbs: Freeverb ist
kammfilterbasiert (körnig, "Box"), CloudSeed ist ein Diffusionsnetzwerk
(riesig, wolkig), Dattorro ist eine *Platte* – dicht, metallisch schimmernd,
mittlere Räume.

**Parameter:** `preDelay`, `bandwidth`, `inputDiffusion1`, `inputDiffusion2`,
`decay`, `decayDiffusion1`, `decayDiffusion2`, `damping`, `excursion`, `mix`.

**Umsetzung:** Portierung nach `audio/worklets/plate.worklet.ts`. Die
Allpass-/Delay-Struktur ist sample-genau nachzubilden, weil die Kopplung der
Tank-Hälften über Kreuz läuft – mit WebAudio-Nodes nicht sauber abbildbar.

### 6.2 `galactic` – Ambient-Reverb (Airwindows)

**Quelle:** `airwindows/airwindows`, `plugins/LinuxVST/src/Galactic*` (MIT).
Verifiziert vorhanden: `Galactic`, `Galactic2`, `Galactic3`, `GalacticVibe`.
Referenz für die Umsetzung ist `Galactic` (die ursprüngliche Fassung, am
kompaktesten).

Galactic ist unter Ambient-Produzenten der Standard für "unendlicher Raum": ein
Feedback-Netzwerk mit leichtem **Detune** im Hallweg, wodurch der Nachhall
langsam auseinanderdriftet statt statisch stehenzubleiben. Genau der Effekt,
den ein reines Diffusionsnetzwerk nicht liefert.

**Parameter:** `replace` (Regeneration), `brightness`, `detune`, `bigness`, `mix`.

**Umsetzung:** `audio/worklets/galactic.worklet.ts`. Airwindows-Code ist
bewusst abhängigkeitsfrei und arbeitet auf `double`-Ebene – gut portierbar,
aber die im Original übliche Dithering-/Noise-Shaping-Stufe am Ausgang entfällt
(irrelevant bei Float32-Verarbeitung im Browser).

### 6.3 `clouds` – Granular Texture Processor

**Quelle:** `pichenettes/eurorack`, `clouds/dsp/` (MIT je Datei).
Verifiziert vorhanden: `granular_processor.cc/h`, `grain.h`, `audio_buffer.h`,
`window.h`, `pvoc/` (Phase-Vocoder), `wsola_sample_player.h`,
`looping_sample_player.h`, `correlator.cc/h`.

Clouds ist der mit Abstand meistgenutzte Textur-Prozessor der Modularwelt und
inhaltlich das größte Loch im aktuellen FX-Bestand: ein Ringpuffer wird
kontinuierlich beschrieben, aus dem Körner (Grains) mit eigener Position,
Länge, Tonhöhe und Hüllkurve gelesen und überlagert werden.

**Vier Modi** (im Original über die Puffer-Player umgeschaltet):
`granular`, `stretch` (WSOLA), `looping delay`, `spectral` (Phase-Vocoder).

**Parameter:** `position`, `size`, `pitch`, `density`, `texture`, `blend`
(interpoliert Dry/Wet, Stereospread, Feedback, Reverb), `freeze`, `mode`.

**Umsetzung:** `audio/worklets/clouds.worklet.ts`. Für Welle 1 nur `granular`
und `looping delay`; `stretch` (WSOLA braucht den Correlator) und `spectral`
(braucht FFT) folgen zusammen mit der FFT-Infrastruktur aus §6.4. Der Puffer
(mehrere Sekunden Stereo) lebt im Worklet, nicht im Hauptthread.

### 6.4 `paulstretch` – Extreme Time-Stretch

**Quelle:** `paulnasca/paulstretch_python` (**Public Domain**, siehe §4.3),
Referenzimplementierung `paulstretch_stereo.py`.

Der Algorithmus ist bewusst *kein* sauberer Time-Stretcher, sondern erzeugt bei
extremen Faktoren (8×–100×) den charakteristischen, eingefrorenen Klangteppich:
überlappende Fenster werden per FFT transformiert, die **Phasen komplett
randomisiert**, zurücktransformiert und überlappend addiert. Die
Phasen-Randomisierung ist genau der Grund, warum das Ergebnis flächig statt
verwaschen klingt.

**Parameter:** `stretchFactor` (1–50), `windowSizeSeconds` (0.05–1.0),
`mix`, `freeze`.

**Umsetzung:** `audio/worklets/paulstretch.worklet.ts`. Braucht eine
FFT – dafür neu `audio/worklets/dsp/fft.ts` (eigene Radix-2-Implementierung,
~80 Zeilen, keine Fremdabhängigkeit). Dieselbe FFT bedient später den
`spectral`-Modus von Clouds (§6.3) und ist deshalb bewusst als eigenständiges
Modul angelegt.

**Latenz-Hinweis:** Bei einer Fenstergröße von 0,25 s beträgt die algorithmische
Latenz eine halbe Fensterlänge. Für ein Flächen-Effektgerät akzeptabel, aber im
Modul-Tooltip zu benennen.

### 6.5 `resonator` – Rings Resonator

**Quelle:** `pichenettes/eurorack`, `rings/dsp/` (MIT je Datei).
Verifiziert vorhanden: `resonator.cc/h` (Modalresonator), `string.cc/h`
(Karplus-Strong-artige Saite), `part.cc/h`, `limiter.h`, `fx/`.

Anders als die vorhandene `modal`-Synth-Engine wird hier das **Eingangssignal**
als Anregung verwendet: alles, was durch das Modul läuft, regt einen
Resonatorverbund an. Perkussives Material wird tonal, Flächen bekommen eine
harmonische Struktur aufgeprägt.

**Drei Modi:** `modal` (64 Partiale), `sympathetic strings`, `string`.

**Parameter:** `structure` (Inharmonizität), `brightness`, `damping`,
`position` (Anregungspunkt), `polyphony` (1/2/4), `frequency`, `mix`.

**Umsetzung:** `audio/worklets/resonator.worklet.ts`. Der Original-Code ist
Fixed-Point-optimiert für einen Cortex-M4 – die Portierung rechnet durchgehend
in `float`, statt die Festkomma-Arithmetik nachzubilden (dieselbe Entscheidung
wie bei der DX7-Portierung in plan5).

### 6.6 `shimmer` – Pitch-Shift-Reverb

**Quelle:** `Signalsmith-Audio/signalsmith-stretch` (MIT, 528★). Eine sehr gut
dokumentierte, header-only Pitch-/Time-Bibliothek mit formanterhaltendem
Shifting.

Shimmer entsteht durch eine Rückkopplungsschleife, in der das Hallsignal bei
jedem Durchlauf um ein Intervall (meist +12 Halbtöne) nach oben transponiert
wird – der Klang "steigt" endlos auf. Das ist mit dem vorhandenen `reverb`- und
`cloudSeed`-Modul nicht nachbaubar, weil beiden der Pitch-Shifter fehlt.

**Signalweg:** Input → Pitch-Shifter (+N Halbtöne) → Reverb-Tank →
Feedback zurück in den Shifter → Mix.

**Parameter:** `shiftSemitones` (−24…+24), `feedback` (0…0,9 hart geklemmt),
`size`, `tone`, `mix`.

**Umsetzung:** `audio/worklets/shimmer.worklet.ts`. Der Shifter läuft
blockweise; die Feedback-Schleife muss **nach** dem Shifter hart begrenzt
werden (`limiter`), sonst schaukelt sich die Schleife bei hohem Feedback auf –
das ist der wahrscheinlichste Fehlerfall dieses Moduls und braucht einen
eigenen Stabilitätstest (§8).

### 6.7 `tape` – Bandsättigung

**Quelle:** `airwindows/airwindows` (MIT). Verifiziert vorhanden:
`ToTape5`…`ToTape9`, `IronOxide5`, `IronOxideClassic`, `IronOxideClassic2`.
Referenz: `ToTape6` (Sättigung + Head-Bump + Flutter) und `IronOxide5`
(Bandgeschwindigkeit/Sättigungscharakter).

Deckt ab, was das vorhandene `drive`-Modul (reiner Waveshaper) nicht kann:
frequenzabhängige Sättigung, den Tiefen-"Head Bump", Höhenverlust bei
zunehmendem Pegel und langsames Wow/Flutter.

**Parameter:** `saturation`, `headBump`, `tapeSpeed`, `flutter`, `highCut`, `mix`.

**Umsetzung:** `audio/worklets/tape.worklet.ts`.

**Abgrenzung:** Bewusst Airwindows statt des bekannteren
`jatinchowdhury18/AnalogTapeModel` – letzteres ist GPL-3.0 (§4.1).

### 6.8 `ladder` – Ladder-Filter mit Selbstoszillation

**Quelle:** `ddiakopoulos/MoogLadders` (Unlicense, 390★) – eine Sammlung von
acht unabhängigen C++-Implementierungen des klassischen 4-Pol-Moog-Ladder-
Filters (u.a. Huovilainen, Stilson, Simplified, Improved, Krajeski,
Microtracker, Musicdsp, Oberheim).

Das vorhandene `postFilter` ist ein `BiquadFilterNode` – sauber, aber ohne
Charakter und ohne echte Selbstoszillation. Ein Ladder-Filter mit nichtlinearem
Feedback liefert genau die musikalisch nutzbare Resonanz, die für
Ambient-Sweeps und resonante Drones gebraucht wird.

**Parameter:** `model` (Enum, 8 Modelle), `cutoffHz`, `resonance` (bis in die
Selbstoszillation), `drive`, `mix`.

**Umsetzung:** `audio/worklets/ladder.worklet.ts`. Die Modelle unterscheiden
sich hörbar in Sättigungsverhalten und Resonanzcharakter – das Enum ist der
eigentliche Wert dieses Moduls, nicht nur "noch ein Tiefpass".

Die Unlicense ist eine Public-Domain-Widmung; Attribution ist rechtlich nicht
gefordert, wird aber wie bei allen anderen Quellen trotzdem gesetzt.

### 6.9 `phaser` – Phaser & Flanger

**Quelle:** `electro-smith/DaisySP`, `Source/Effects/phaser.h` und
`Source/Effects/flanger.h` (MIT, verifiziert vorhanden).

Das vorhandene `ensemble` ist ein reiner Chorus (drei modulierte Delays). Ein
Phaser (Allpass-Kette mit moduliertem Pol) und ein Flanger (sehr kurzes
Delay mit Feedback) sind klanglich etwas grundlegend anderes.

**Parameter:** `mode` (`phaser` | `flanger`), `rateHz`, `depth`, `feedback`,
`stages` (4/6/8, nur Phaser), `mix`.

**Umsetzung:** Als **einziges der zehn Module ohne Worklet** – ein
Allpass-Ketten-Phaser und ein modulierter Delay-Flanger lassen sich mit
`BiquadFilterNode(type: "allpass")`, `DelayNode` und `OscillatorNode` direkt
und stabil im WebAudio-Graphen bauen (`audio/fx/Phaser.ts`), analog zum
vorhandenen `Ensemble.ts`. Spart 4 Worklet-Instanzen pro Track.

### 6.10 `lofi` – Bitcrush / Decimate

**Quelle:** `PaulBatchelor/Soundpipe`, `modules/bitcrush.c` (MIT, ohne
Upstream-Fremdcode – siehe §4.2) plus `electro-smith/DaisySP`,
`Source/Effects/decimator.h` und `sampleratereducer.h` (MIT).

Zwei getrennte Degradationsachsen in einem Modul: **Bit-Tiefe** (Quantisierung,
körniges Rauschen) und **Sample-Rate** (Sample-and-Hold, Aliasing-Artefakte).
Für Ambient vor allem als subtile Alterung interessant, nicht nur als
Zerstörungswerkzeug – deshalb müssen beide Regler bis in den unhörbar-subtilen
Bereich hinunter auflösen.

**Parameter:** `bitDepth` (1–16), `sampleRateReduction` (1–64), `antiAlias`
(bool), `mix`.

**Umsetzung:** `audio/worklets/lofi.worklet.ts` – Sample-and-Hold ist
zustandsbehaftet und pro Sample zu rechnen, mit einem `WaveShaperNode` nicht
korrekt abbildbar.

---

## 7. Phasenplan

| Phase | Inhalt | Abhängig von | Abnahmekriterium |
|---|---|---|---|
| **P0** | Repos klonen (`eurorack`, `airwindows`, `soundpipe`, `moogladders`, `signalsmith-stretch`, `dattorro-verb`, `paulstretch_python`), `research/LICENSES.md` um alle 7 Quellen inkl. der Soundpipe-Befunde (§4.2) und der Paulstretch-Begründung (§4.3) erweitern | – | Alle Quellen lokal, jede mit Lizenz + Begründung dokumentiert |
| **P1** | `FxChain` datengetrieben (§5.1) | – | 7 Bestandsmodule laufen unverändert; Umsortieren im Rack ist hörbar |
| **P2** | `legacyFxFromRack()` reparieren + `extras`-Feld + Roundtrip-Test (§5.2) | P1 | Jedes `FX_MODULES`-Modul übersteht Rack→Settings→Rack unverändert |
| **P3** | `WorkletFx`-Adapter + `fxProcessorBase` + Lazy Instantiation (§5.3) | P1 | Pass-Through-Worklet bit-identisch; 4×3 aktive FX ohne Under-runs |
| **P4** | **`plate`**, **`galactic`** | P3 | Kein Aufschaukeln bei Extremwerten; 60 s Dauerbetrieb stabil |
| **P5** | **`phaser`**, **`lofi`**, **`ladder`** | P1/P3 | Selbstoszillation des Ladder erreichbar und beherrschbar |
| **P6** | FFT (`dsp/fft.ts`) + **`paulstretch`** | P3 | Stretch-Faktor 20× erzeugt stabile Fläche, kein Knacken an Fenstergrenzen |
| **P7** | **`clouds`** (Modi `granular` + `looping delay`) | P3, P6 | Freeze hält > 60 s ohne Drift; Grain-Dichte bis Maximum ohne Aussetzer |
| **P8** | **`resonator`**, **`shimmer`**, **`tape`** | P3 | Shimmer-Feedback bei 0,9 begrenzt statt divergent |
| **P9** | Clouds-Modi `stretch` + `spectral`; Rack-Presets; README/Doku | alle | `npm run build` + `npx vitest run` grün, 17 Module im Rack |

Empfohlene Reihenfolge bei begrenzter Zeit: **P0 → P1 → P2 → P3 → P4 → P5**.
Danach stehen fünf neue Module und ein tragfähiges Fundament; P6–P9 sind
additiv.

---

## 8. Tests

- **Rack-Roundtrip:** jedes registrierte Modul überlebt Rack → Settings → Rack
  identisch (fängt §2.2b dauerhaft ab).
- **Stabilität pro Modul:** 30 s Offline-Render bei Maximalparametern; Abbruch
  bei NaN, DC-Offset > 0,01 oder Peak > 0 dBFS. Besonders relevant für
  `shimmer` (Feedback-Schleife über den Pitch-Shifter), `ladder`
  (Selbstoszillation) und `plate`/`galactic` (Reverb-Feedback).
- **Bypass-Neutralität:** jedes Modul mit `enabled: false` liefert bit-identisch
  das Eingangssignal.
- **Lazy Instantiation:** Ein- und Ausschalten eines Worklet-Moduls erzeugt
  keinen Klick; nach dem Ausschalten existiert der Node nachweislich nicht mehr.
- **Preset-Schema:** alle Presets validieren weiterhin gegen `PresetSchema`.
- **Bundle-Budget:** Build schlägt fehl, wenn das JS-Bundle 400 KB gzip
  überschreitet (aktuell ~305 KB; die Worklets werden als eigene Chunks
  ausgeliefert und zählen nicht in den Hauptchunk).

---

## 9. Risiken

| Risiko | Wirkung | Gegenmaßnahme |
|---|---|---|
| 17 Module × 4 Tracks überlasten die Audio-Engine | Aussetzer | Lazy Instantiation (§5.3); Under-run-Zähler im StatusBar; notfalls Modul-Limit pro Track |
| Fixed-Point-Portierung von Clouds/Rings unterschätzt | P7/P8 verzögern | Nach `float` umschreiben statt 1:1 portieren; LUT-abhängige Teile weglassen |
| Shimmer-Feedback divergiert | lautes Aufschaukeln | Harter Limiter in der Schleife, Feedback bei 0,9 geklemmt, eigener Stabilitätstest |
| Paulstretch-Latenz irritiert beim Spielen | wirkt "kaputt" | Latenz im Modul-Tooltip benennen; Modul als Flächen-, nicht Performance-Effekt einordnen |
| Versehentliche Übernahme von `revsc`/`zitarev`/`talkbox` | GPL/LGPL im MIT-Projekt | §4.2 explizit in `research/LICENSES.md`; nur `bitcrush.c` aus Soundpipe klonen (sparse checkout) |
| FxChain-Umbau bricht bestehende Presets | Datenverlust | P1 vor allen neuen Modulen, mit unverändertem Verhalten der 7 Altmodule als Abnahmekriterium |

---

## 10. Quellenübersicht

**Neu zu klonen:**
[el-visio/dattorro-verb](https://github.com/el-visio/dattorro-verb) (MIT) ·
[airwindows/airwindows](https://github.com/airwindows/airwindows) (MIT) ·
[pichenettes/eurorack](https://github.com/pichenettes/eurorack) (MIT je Datei) ·
[paulnasca/paulstretch_python](https://github.com/paulnasca/paulstretch_python) (Public Domain) ·
[Signalsmith-Audio/signalsmith-stretch](https://github.com/Signalsmith-Audio/signalsmith-stretch) (MIT) ·
[ddiakopoulos/MoogLadders](https://github.com/ddiakopoulos/MoogLadders) (Unlicense) ·
[PaulBatchelor/Soundpipe](https://github.com/PaulBatchelor/Soundpipe) (MIT, **nur** `modules/bitcrush.c`)

**Bereits lokal vorhanden:**
[electro-smith/DaisySP](https://github.com/electro-smith/DaisySP) (MIT, nur `Source/Effects/`)

**Geprüft und ausgeschlossen:**
[michaelwillis/dragonfly-reverb](https://github.com/michaelwillis/dragonfly-reverb) (GPL-3.0) ·
[jatinchowdhury18/AnalogTapeModel](https://github.com/jatinchowdhury18/AnalogTapeModel) (GPL-3.0) ·
[elk-audio/mda-vst3](https://github.com/elk-audio/mda-vst3) (GPL-3.0) ·
[Dougal-s/Aether](https://github.com/Dougal-s/Aether) (MIT, aber inhaltlich redundant zu `cloudSeed`)
