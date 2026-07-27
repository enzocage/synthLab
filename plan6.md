# plan6 – Noch offene Arbeiten aus plan5

**Stand:** 2026-07-27  
**Grundlage:** Abgleich von `plan5.md` mit dem aktuellen Repository-Zustand.  
**Zweck:** Dieser Plan enthält ausschließlich noch offene oder nur teilweise
erfüllte Arbeiten aus `plan5.md`. Bereits abgeschlossene Teile werden nur zur
Abgrenzung knapp genannt.

---

## 1. Verifizierter Zwischenstand

Aus `plan5.md` sind bereits umgesetzt:

- 23 registrierte Synth-Engines statt ursprünglich 19.
- 3.356 Presets.
- 1.024 importierte DX7-Voices.
- 128 importierte Juno-106-Werkspatches.
- 175 importierte OPL3-Instrumente.
- 261 importierte AKWF-Wellenformen.
- 9 importierte CloudSeed-Programme.
- Engines `juno106`, `dx7`, `wt-akwf` und `opl3`.
- AudioWorklet-Grundbausteine `registry.ts` und `WorkletVoice.ts`.
- DX7-AudioWorklet.
- CloudSeed-artiges Diffusions-Reverb.
- Importskripte für Juno-106, DX7, OPL3, AKWF und CloudSeed.
- Provenance-Felder `upstreamRepo` und `upstreamFile` sind optional im
  Preset-Schema vorhanden und werden von den neuen Preset-Adaptern genutzt.
- `preset_sources.md`, `research/LICENSES.md` und die README wurden für die
  bisher umgesetzten Quellen erweitert.
- Die Entscheidung zu den Werkspatches wurde als Variante A umgesetzt:
  Originalnamen mit vollständiger Attribution.
- Die Presetliste ist bereits windowed.
- Die vorhandenen 30 Tests sind grün.

Noch nicht erreicht:

- Zielgröße von 27 Engines.
- Dynamisches, frei sortierbares FX-Rack.
- Zielkatalog von ungefähr 22 FX-Modulen.
- Vier weitere geplante Synth-Engines.
- Vollständige Importpipeline einschließlich STK-Materialien.
- Verbindliche Import-, DSP-, Migrations- und Stabilitätstests.
- Vollständige DX7-, OPL3- und AKWF-Zielausbaustufe.
- Alle Abnahmekriterien aus den Phasen P0 bis P11.

### Aktueller Validierungshinweis

`npm test` ist grün: 7 Testdateien, 30 Tests.

`npm run build` ist im aktuellen Arbeitsbaum nicht grün, weil in einer noch
nicht abgeschlossenen UI-Änderung `toggleComputerKeyboard` deklariert, aber nicht
verwendet wird (`synthlab/src/App.tsx`). Dieser Fehler gehört nicht zum fachlichen
Umfang von `plan5`, muss aber vor der nächsten belastbaren Gesamtvalidierung
behoben sein.

---

## 2. Offene Entscheidungen

### 2.1 Presetziel neu berechnen

`plan5.md` nennt ungefähr 3.500 Presets. Der aktuelle Stand liegt bereits bei
3.356 Presets, obwohl vier geplante Engines noch fehlen.

Vor der weiteren Umsetzung ist verbindlich zu entscheiden:

- Nehmen `plaits`, `rings`, `stk-acoustic` und `daisy-osc` zusätzlich an der
  generischen Archetyp-Matrix teil?
- Oder erhalten sie ausschließlich ihre in `plan5.md` genannten
  enginespezifischen Presets?

Ohne generische Archetypen würden die geplanten 464 neuen Presets den Bestand
auf ungefähr 3.820 erhöhen. Mit zusätzlicher Archetyp-Matrix steigt die Zahl
noch weiter. README, Tests und Bundlebudgets dürfen daher nicht weiter auf
„~3.500“ fest verdrahtet werden.

### 2.2 Umfang der Portierungen

Für Mutable Instruments, STK, DaisySP und die FX-Quellen ist pro Modul
festzulegen:

- algorithmisch eigenständige TypeScript-/Worklet-Neuimplementierung,
- engere Portierung mit Herkunftskopf,
- bewusst reduzierte erste Version,
- nicht übernommene Features und klangliche Abweichungen.

Die Entscheidung wird pro Modul in einer kurzen Designnotiz dokumentiert, bevor
DSP-Code entsteht.

### 2.3 Alt-Engine `fm-dx7`

Die neue Engine `dx7` ersetzt die alte `fm-dx7` technisch nicht. Offen ist, ob:

- `fm-dx7` als einfache kreative FM-Variante bestehen bleibt,
- sie in „FM Simple“ umbenannt wird,
- oder nach Presetmigration aus der sichtbaren Engine-Liste entfernt wird.

Die derzeitigen Namen sind für Nutzer leicht zu verwechseln.

---

## 3. Restphase R0 – Grüne Ausgangsbasis

**Priorität:** Blocker  
**Entspricht:** Voraussetzung für alle offenen Phasen

### Arbeiten

- Den aktuellen TypeScript-Build wieder grün herstellen, ohne fremde Änderungen
  zu verwerfen.
- `npm run build`, `npm test` und `npm run lint` als gemeinsame Baseline
  ausführen.
- Bundlegröße und gzip-Größe vor den weiteren DSP-Erweiterungen notieren.
- Aktuelle Engine-, Preset- und Importzahlen automatisiert aus dem Code
  ermitteln.
- Für die vier bereits neuen Engines je einen kurzen manuellen Smoke-Test
  dokumentieren:
  - Preset laden,
  - Note-on,
  - Note-off,
  - Presetwechsel,
  - Panic,
  - Dispose.

### Abnahme

- TypeScript-Build, Lint und alle vorhandenen Tests sind grün.
- Die Ausgangsgrößen sind dokumentiert.
- Keine laufenden Stimmen oder AudioNodes bleiben nach Panic/Dispose hängen.

---

## 4. Restphase R1 – Quellen und Importpipeline vervollständigen

**Priorität:** Sehr hoch  
**Entspricht:** plan5 P0 und P3

### 4.1 Fehlende lokale Quellen

`research/clone-repos.sh` ist bereits erweitert. Lokal fehlen derzeit jedoch
mehrere für die Restarbeiten benötigte Klone:

- `eurorack`
- `moogladders`
- `soundpipe`
- `airwindows`
- `signalsmith-stretch`
- `dattorro-verb`

Diese Quellen müssen mit den in `clone-repos.sh` festgelegten Branches und
Sparse-Pfaden geklont und geprüft werden.

### 4.2 Fehlender STK-Importer

Neu zu erstellen:

- `research/extract/import-stk-materials.mjs`
- Ausgabe `synthlab/src/data/derived/stk-materials.json`

Zu extrahieren:

- ModalBar-Materialien,
- BandedWG-Modi,
- relevante Tabellen für Clarinet, Flute und Bowed,
- Herkunft und Quellposition jeder Tabelle.

### 4.3 Metadaten vereinheitlichen

Die fünf vorhandenen Importer besitzen `_meta`, aber nicht alle in `plan5`
geforderten Felder. Ergänzt werden:

- `sourceRepo`
- `sourceFile` oder `sourceDir`
- `sourceCommit`
- `sourceBranch`, falls nicht Default
- `license`
- `attribution`
- `extractedAt`
- `count`
- `formatVersion`
- optional SHA-256 der Eingabedatei

`sourceCommit` darf nicht manuell geschätzt werden, sondern wird aus dem
jeweiligen Vendor-Klon gelesen oder als expliziter Skriptparameter übergeben.

### 4.4 Determinismus

Für jeden Importer entsteht ein Test:

1. Import in temporäres Ziel ausführen.
2. Ein zweites Mal ausführen.
3. SHA-256 beider Ausgaben vergleichen.
4. Anzahl und Pflichtfelder validieren.

Die feste Angabe `extractedAt: "2026-07-27"` ist durch eine reproduzierbare
Regel zu ersetzen oder bewusst aus dem Hashvergleich auszunehmen.

### 4.5 Erwartete Datenmengen

- Juno-106: 128
- DX7: 1.024
- OPL3: 175
- CloudSeed: 9
- AKWF inline: Zielauswahl verbindlich festlegen
- STK-Materialien: ungefähr 15

### Abnahme

- Alle benötigten Repositories sind lokal und lizenzseitig dokumentiert.
- Sechs Importer laufen idempotent.
- Jeder Importer besitzt einen grünen Determinismustest.
- Jede Ausgabedatei enthält den tatsächlichen Upstream-Commit.
- Der App-Build benötigt `research/vendor/` nicht.

---

## 5. Restphase R2 – AudioWorklet-Fundament härten

**Priorität:** Sehr hoch  
**Entspricht:** plan5 P1 und Abschnitt 7.1

Die Grundklassen sind vorhanden, die geplante belastbare Plattform ist noch
nicht vollständig.

### Arbeiten

- Testton-Worklet als minimalen End-to-End-Durchstich ergänzen.
- Worklet-Registrierung mit Erfolg, parallelen Aufrufen und Fehlerfall testen.
- `WorkletVoice` testen:
  - Trigger,
  - Release,
  - Stop,
  - Parameteränderung,
  - `finished`-Nachricht,
  - Dispose.
- Fehler beim `audioWorklet.addModule()` sichtbar und recoverbar behandeln.
- Feature Detection einführen:
  - Browser unterstützt AudioWorklet,
  - Worklet konnte geladen werden,
  - Engine ist verfügbar.
- Engine-Verfügbarkeit in der Registry modellieren.
- Nicht verfügbare Engines im Browser ausgrauen und begründen, statt beim
  Erzeugen der ersten Voice zu crashen.
- Promise-Cache nach fehlgeschlagenem Ladevorgang entweder gezielt leeren oder
  einen definierten Retry anbieten.
- Worklet-Nachrichten versionieren und zur Laufzeit validieren.
- Zeitplanung zwischen Main Thread und AudioWorklet eindeutig definieren.
- Worklet-Fehler, Port-Abbruch und ausbleibende `finished`-Nachrichten
  diagnostizierbar machen.

### Engine-Vertrag erweitern

Der bestehende `Engine`-Vertrag benötigt mindestens:

- `maxVoices`
- `availability`
- optional `prepare(ctx)`
- Kennzeichnung von Parametern als:
  - live änderbar,
  - wirkt auf nächste Note,
  - verlangt Voice-/Graph-Neuaufbau.

`PresetLoader` verwendet anschließend `engine.maxVoices`, statt pauschal acht
Stimmen zu setzen.

### Abnahme

- Testton läuft vollständig über AudioWorklet.
- Paralleles Laden registriert jedes Modul nur einmal.
- Fehlende AudioWorklet-Unterstützung führt nicht zum App-Absturz.
- DX7 besitzt ein realistisches Stimmenlimit.
- Worklet-Lifecycle und Fehlerfälle sind automatisiert getestet.

---

## 6. Restphase R3 – Dynamisches FX-Rack und Schema v2

**Priorität:** Sehr hoch  
**Entspricht:** plan5 P2 und Abschnitt 5.1

Dies ist der größte noch offene Architekturumbau. Die aktuelle Kette ist trotz
CloudSeed weiterhin fest verdrahtet:

`Drive → PostFilter → Ensemble → Delay → Reverb → CloudSeed → Width`

### 6.1 Datenmodell

Einführen:

```ts
interface FxSlot {
  id: string;
  type: string;
  enabled: boolean;
  params: Record<string, number | string | boolean>;
}

interface FxRackState {
  version: 2;
  slots: FxSlot[];
}
```

Anforderungen:

- stabile Slot-IDs,
- Zod-Schema,
- typsichere Defaultparameter je Modultyp,
- unbekannte Module sicher behandeln,
- Parameter pro Modul gegen `ParamSpec` validieren.

### 6.2 FX-Registry

Neu:

- `synthlab/src/audio/fx/registry.ts`
- gemeinsamer `FxModuleSpec`
- Kategorie, Name, Parameter, Defaults, Factory, Herkunft und Verfügbarkeit
- Registry-Test auf eindeutige IDs und gültige Defaults

### 6.3 Dynamischer Audio-Graph

`FxChain` wird zum Rack-Host mit:

- `insert`
- `remove`
- `reorder`
- `replace`
- `setBypass`
- `updateParam`
- `dispose`

Umbauten müssen mit kurzen Crossfades erfolgen. Alte Graphen werden erst nach
dem Fade vollständig getrennt und entsorgt.

### 6.4 Migration v1 → v2

- Bestehende sechs beziehungsweise sieben benannte FX-Felder in Slot-Reihenfolge
  übertragen.
- `cloudSeed` in der Migration berücksichtigen.
- Preset-Schema mit `schemaVersion: 2` und `fxRack`.
- Altes `fx`-Objekt weiterhin lesen können.
- Dexie `version(2)` mit Upgrade-Funktion.
- Vor Migration Backup-Tabelle oder Recovery-Snapshot anlegen.
- Upgrade erst als erfolgreich markieren, wenn jeder Datensatz validiert wurde.
- Migration wiederholbar und transaktional testen.

### 6.5 Generisches UI

`FxRack.tsx` und `DeviceChain.tsx` auf Registry und `ParamSpec[]` umstellen:

- Modul hinzufügen,
- Modul entfernen,
- Bypass,
- Drag-Reorder,
- Modul ersetzen,
- Defaults laden,
- Preset laden,
- unbekanntes Modul lesbar darstellen.

### Abnahme

- Alle Bestands-FX werden als Slots geladen.
- V1-Presets und gespeicherte V1-Edits migrieren verlustfrei.
- Reihenfolge kann während des Betriebs geändert werden.
- Graphumbau erzeugt keine hörbaren Klicks.
- Entfernte Module hinterlassen keine Nodes oder Timer.
- UI benötigt beim Hinzufügen eines neuen Registry-Moduls keine
  modulspezifische Komponente.

---

## 7. Restphase R4 – Bereits implementierte Engines abschließen

**Priorität:** Hoch  
**Entspricht:** plan5 P4, P5 und P7

### 7.1 Juno-106

Vorhanden:

- Engine,
- 128 importierte Werkspatches,
- DCO/Filter/Envelope/Chorus-Grundfunktion.

Offen:

- Umrechnungskurven gegen dokumentierte AMY-Messpunkte testen.
- Alle 128 Presets auf endliche und gültige Parameter prüfen.
- Chorus I, II und I+II fachlich und pegelmäßig verifizieren.
- HPF-Stufen und VCA Gate/Envelope gegen Referenzverhalten prüfen.
- Klären, ob die in `plan5` genannten 128 Varianten zusätzlich erzeugt werden
  oder die generische Archetyp-Matrix genügt.
- Engine-Lifecycle- und Dispose-Test ergänzen.

### 7.2 DX7

Vorhanden:

- AudioWorklet,
- sechs Operatoren,
- 32 Algorithmusroutings,
- grundlegende Operator-EGs,
- 1.024 importierte Voices.

Gegenüber `plan5` noch offen oder unvollständig:

- Keyboard Level Scaling mit Breakpoint, Depth und Curves.
- Rate Scaling.
- Velocity Sensitivity.
- Fixed-Frequency-Modus vollständig verifizieren.
- Pitch EG.
- LFO mit sechs Wellenformen.
- LFO Speed, Delay, PMD, AMD und Sync.
- Operator-AM-Sensitivity.
- vollständige Parameterübertragung aus den 156-Byte-Voices.
- Live-/Next-note-Verhalten für Parameter definieren.
- zehn Konverter-Stichproben gegen `amy/src/patches.h`.
- Referenztests für Algorithmus, Ratio, EG und Feedback.
- klangliche Smoke-Tests für bekannte Voices wie `E.PIANO 1` und `BRASS 1`.
- realistisches `maxVoices`.

Die Engine darf erst danach als vollständige DX7-Umsetzung bezeichnet werden.

### 7.3 AKWF

Vorhanden:

- 261 inline importierte Wellenformen,
- `wt-akwf`-Engine,
- 261 Presets.

Offen:

- Ziel aus `plan5` konsolidieren: 256 oder 400 inline Presets.
- Gesamten AKWF-Katalog indexieren.
- Restwellen als kompakte Binärdateien unter `public/wavetables/` bereitstellen.
- Lazy Loader mit Cache, Abbruch und Fehlerzustand implementieren.
- stabile IDs über Inline- und Lazy-Bestand garantieren.
- Ladezustand im UI anzeigen.
- Bundlezuwachs und Laufzeitspeicher messen.
- Alias- und Normalisierungsverhalten der Wellenformen testen.

### 7.4 OPL3

Vorhanden:

- 175 importierte GENMIDI-Instrumente,
- spielbare 2-Operator-Engine mit WebAudio-Nodes.

Gegenüber `plan5` offen:

- Portierung in ein AudioWorklet oder begründete Abweichung vom Plan
  dokumentieren.
- Acht OPL-Wellenformen korrekt umsetzen; derzeit existieren nur
  Approximationen.
- KSL/KSR vollständig klangwirksam machen.
- Tremolo und Vibrato umsetzen.
- Sustain-/Percussive-Modi verifizieren.
- Feedbackpfad näher am YMF262-Verhalten modellieren.
- Register-Import gegen mehrere bekannte GENMIDI-Instrumente testen.
- Polyphonie- und CPU-Budget festlegen.

### Abnahme

- Jede der vier Engines besitzt Contract-, Preset- und Smoke-Tests.
- Alle importierten Parameter werden entweder umgesetzt oder ausdrücklich als
  nicht unterstützt dokumentiert.
- Keine Engine wird in der README umfangreicher beschrieben, als sie tatsächlich
  implementiert ist.

---

## 8. Restphase R5 – Vier fehlende Synth-Engines

**Priorität:** Hoch  
**Entspricht:** plan5 P8 und P9

### 8.1 `plaits`

Umfang der ersten Version:

- `virtual_analog`
- `waveshaping`
- `fm`
- `grain`
- `additive`
- `wavetable`
- `chord`
- `swarm`

Parameter:

- model,
- harmonics,
- timbre,
- morph,
- LPG decay,
- LPG colour.

Arbeiten:

- benötigte MI-Quellen und LUTs lizenzkonform dokumentieren,
- Float-/Worklet-Architektur entwerfen,
- Modelle einzeln implementieren und testen,
- Parameterübergänge glätten,
- Makromap erstellen,
- 192 Presets oder neu beschlossene Zielzahl erzeugen.

### 8.2 `rings`

Modi:

- modal,
- sympathetic strings,
- string+.

Arbeiten:

- Worklet-Resonatorbank,
- interne Impuls-/Rauschanregung,
- structure, brightness, damping, position, polyphony,
- stabile Energiebegrenzung,
- Makromap,
- 72 Presets,
- Grundlage für spätere FX-Variante schaffen.

### 8.3 `stk-acoustic`

Modelle:

- Clarinet,
- Flute,
- Bowed,
- BandedWG,
- ModalBar.

Arbeiten:

- STK-Materialimport aus R1 verwenden,
- gemeinsame Worklet-Infrastruktur,
- modellabhängige ParamSpec-Gruppen,
- Materialauswahl,
- Blow-/Bow-/Strike-Erregung stabilisieren,
- extreme Parameter auf NaN und Aufschaukeln prüfen,
- 100 Presets.

### 8.4 `daisy-osc`

Modelle:

- VOSIM,
- FormantOsc,
- ZOscillator,
- HarmonicOscillator,
- VariableShapeOsc.

Arbeiten:

- Algorithmen als gemeinsames Worklet,
- modellabhängige Parameter,
- Anti-Aliasing-Strategie,
- Makromap,
- 100 Presets,
- Abgrenzung zur bestehenden `phasedist`-Engine.

### Abnahme

- Registry enthält 27 Engines.
- Alle vier neuen Engines sind bei fehlender Worklet-Unterstützung sicher
  deaktiviert.
- Jedes Modell ist umschaltbar und besitzt sinnvolle Defaults.
- Keine Instabilität bei Extremparametern.
- Presets bestehen Engine- und Preset-Schema.

---

## 9. Restphase R6 – FX-Welle 1

**Priorität:** Hoch  
**Entspricht:** plan5 P6

CloudSeed und seine neun Programme sind bereits vorhanden. Offen bleiben:

### Reverb und Pitch

- `plate` nach Dattorro.
- `galactic` nach Airwindows.
- `shimmer` auf Basis von Pitch-/Time-Shifting plus Plate.

### Filter

- MoogLadders-Modelle im PostFilter:
  - Huovilainen,
  - Stilson,
  - Simplified,
  - Improved,
  - Krajeski,
  - Microtracker,
  - MusicDSP,
  - Oberheim.

### CloudSeed-Abschluss

- Factory-Programme gegen importierte Parameter validieren.
- Freeze mindestens 60 Sekunden testen.
- Maximalparameter auf Feedbackstabilität prüfen.
- Dry/Early/Main-Pegel und Bypass vergleichen.
- Alle AudioParams mit korrekter `currentTime` statt Zeitwert `0` aktualisieren,
  sofern das aktuelle Modul dies noch nicht konsistent tut.
- Herkunftskopf und dokumentierte Abweichungen vervollständigen.

### Abnahme

- CloudSeed, Plate, Galactic und Shimmer sind Registry-Module.
- Kein Modul erzeugt bei Maximalparametern NaN oder ungebremstes Feedback.
- Freeze bleibt mindestens 60 Sekunden stabil.
- Moog-Modelle sind umschaltbar und pegelmäßig vergleichbar.

---

## 10. Restphase R7 – FX-Welle 2

**Priorität:** Mittel bis hoch  
**Entspricht:** plan5 P10

Noch zu implementieren:

### Delay und Textur

- Granular Delay aus dem Clouds-Ansatz.
- `clouds` mit Granular, Stretch, Looping Delay und Spectral.
- `paulstretch`.
- `resonator` auf Basis von Rings.
- `warps` mit Crossfade, Crossfold, Ringmod, Diode, Bitcrush und Vocoder.

### Sättigung und Farbe

- Airwindows Tape (`ToTape` oder `IronOxide`, Auswahl dokumentieren).
- Airwindows Density.
- Bitcrush/Decimator.

### Modulation

- Phaser.
- Flanger.

### Dynamik und Spezialfilter

- Compressor.
- Autowah.
- FormantFilter/Talkbox/Vocoder.

### Katalogbereinigung

- Bestehendes Delay in getrennte Registry-Module `tape-delay` und `pingpong`
  überführen oder den gemeinsamen Modultyp begründet beibehalten.
- Bestands-Reverb eindeutig benennen.
- Kategorien und Suchbegriffe vereinheitlichen.
- Doppelte oder zu ähnliche Module vermeiden.

### Abnahme

- Der verbindlich definierte Katalog enthält ungefähr 22 eigenständige
  Registry-Module.
- Jedes Modul besitzt:
  - eindeutige ID,
  - Kategorie,
  - ParamSpec,
  - gültige Defaults,
  - Herkunftskopf,
  - Bypass,
  - Dispose,
  - Stabilitätstest.
- Module können ohne UI-Sondercode in das Rack eingefügt werden.

---

## 11. Restphase R8 – Presets, Browser und Performance

**Priorität:** Mittel  
**Entspricht:** plan5 P11 und Abschnitt 7.3/7.4

### 11.1 FX-Rack-Presets

- Ungefähr 40 eigene Rack-Presets erstellen.
- Mehrere Slots, Reihenfolge und Parameter speichern.
- Provenance `synthlab-design`.
- Kategorien wie:
  - Ambient,
  - Drone,
  - Shimmer,
  - Tape,
  - Texture,
  - Lo-Fi,
  - Spatial,
  - Experimental.
- Rack-Presets gegen fehlende Module und Schemaänderungen migrationsfähig
  machen.

### 11.2 Browser-Facetten

Ergänzen:

- Herkunft: Import / SynthLab Design / Generator.
- Bank: Juno-106 / DX7 / OPL3 / AKWF / SID / FM / weitere.
- Engine-Verfügbarkeit.
- optional FX-Rack-Presets als eigene Browserkategorie.

### 11.3 Presetbank optimieren

`generatePresetById()` erzeugt weiterhin die gesamte Bank neu.

Umsetzen:

- einmalige, deterministische Bankerzeugung,
- `Map<string, Preset>`-Index,
- keine erneute Vollgenerierung pro ID-Suche,
- Entwicklungsprüfung auf doppelte IDs,
- klarer Reset nur für Tests.

### 11.4 Performance

- `Engine.maxVoices`.
- Worklet-/Engine-spezifische Voice-Limits.
- CPU-/Latenzdiagnostik über `AudioContext.baseLatency`.
- geeignete Unterlauf- oder Überlastungsindikatoren in der Statusleiste.
- Speicherprüfung bei wiederholtem Presetwechsel.
- Lazy Loading großer Datenbanken.
- Bundlebudget automatisieren.

### Abnahme

- Preset-ID-Zugriff ist O(1).
- Die Bank wird nicht mehrfach vollständig aufgebaut.
- Große Datenquellen werden nicht vollständig in das Initialbundle gezogen.
- Browser kann nach Herkunft und Bank filtern.
- Rack-Presets sind speicher-, import- und migrationsfähig.

---

## 12. Restphase R9 – Tests und Qualitätsnachweis

**Priorität:** Blocker für Abschluss  
**Entspricht:** plan5 Abschnitt 9

### Importtests

- Determinismus und SHA-256 für alle sechs Importer.
- Datenmengen und Pflichtmetadaten.
- Ungültige oder fehlende Eingabedatei.
- Upstream-Commit und Lizenzfelder.

### Engine-Tests

- gemeinsamer Contract-Test für alle 27 Engines,
- Trigger/Release/Stop/Dispose,
- Parametergrenzen,
- keine NaN-/Infinity-Werte,
- maximale Voice-Anzahl,
- Worklet-Verfügbarkeit.

### Spezifische Referenztests

- DX7: zehn Voices gegen AMY-Referenz.
- Juno: dokumentierte Umrechnungspunkte.
- OPL3: Registerdekodierung und Wellenformen.
- AKWF: DFT-/PeriodicWave-Rekonstruktion.
- STK: Materialtabellen und Stabilität.
- MI/Daisy: bekannte Default- oder Impulsantworten.

### FX-Tests

Für jedes Modul:

- 30-Sekunden-Offline-Render bei Defaultwerten,
- 30-Sekunden-Offline-Render bei Maximalwerten,
- Bypass-Vergleich,
- Dispose,
- kein NaN,
- DC-Offset höchstens 0,01,
- definierter Peak-/Headroom-Bereich,
- Feedback- und Freeze-Langzeittest für entsprechende Module.

### Migrationstests

- V1-Preset zu V2-Rack.
- V1-Dexie-Datenbank zu V2.
- Backup/Recovery bei absichtlich ungültigem Datensatz.
- Audio-Metriken vor und nach Migration innerhalb definierter Toleranz.

### Build- und Budgettests

- alle Presets bestehen `PresetSchema`.
- Registry-IDs eindeutig.
- FX-Defaults gültig.
- Production Build grün.
- Tests und Lint grün.
- Gesamtbundle unter dem verbindlich festgelegten Budget.
- AKWF- und DX7-Daten getrennt analysieren, damit große Datenmengen nicht
  unbemerkt das Initialbundle aufblasen.

### Abnahme

- Kein Modul oder keine Engine ohne Lifecycle- und Stabilitätstest.
- Alle Import-, Schema-, Migration- und Budgettests laufen in CI.
- Der vollständige Testlauf ist reproduzierbar.

---

## 13. Restphase R10 – Dokumentation und Abschluss

**Priorität:** Abschluss  
**Entspricht:** plan5 P11

### Arbeiten

- README erst nach endgültiger Registry aktualisieren.
- Tatsächliche Engine- und Presetzahlen automatisiert einsetzen oder testen.
- Alte Zahl „23 Engines / 3.356 Presets“ auf den finalen Stand bringen.
- Importiert, generiert und eigenes Sounddesign klar unterscheiden.
- Pro Modul Quelle, Autor, Lizenz, Ausgangsdatei und Abweichungen dokumentieren.
- `research/LICENSES.md` um alle tatsächlich verwendeten Quellen ergänzen.
- Nicht verwendete geklonte Quellen als reine Referenz markieren.
- Browser- und Nutzerhilfe für:
  - Engine-Verfügbarkeit,
  - Rack-Reihenfolge,
  - Bypass,
  - importierte Presetbanken,
  - Lazy-Wavetable-Laden.
- `plan5.md` als ursprünglichen Entwurf kennzeichnen.
- `plan6.md` als Restarbeitsplan verlinken.

### Abschlusskriterien

- 27 Engines oder eine dokumentiert reduzierte Zielzahl.
- Verbindlich definierter FX-Katalog mit ungefähr 22 Modulen.
- Dynamisches Rack mit Migration und freier Reihenfolge.
- Alle geplanten Importquellen verarbeitet.
- Keine übertriebenen Produkt- oder Kompatibilitätsbehauptungen.
- Build, Lint, Tests und Budgetprüfung grün.
- Lizenz- und Provenance-Nachweis vollständig.

---

## 14. Empfohlene Reihenfolge

1. **R0:** Grüne Ausgangsbasis.
2. **R1:** Quellen, STK-Importer und Determinismustests.
3. **R2:** AudioWorklet-Plattform härten.
4. **R3:** Dynamisches FX-Rack, Schema v2 und Dexie-Migration.
5. **R4:** Juno, DX7, AKWF und OPL3 fachlich abschließen.
6. **R6:** FX-Welle 1 einschließlich Plate, Galactic, Shimmer und Moog-Modelle.
7. **R5:** Plaits, Rings, STK Acoustic und Daisy Osc.
8. **R7:** Restliche FX-Module.
9. **R8:** Rack-Presets, Browser-Facetten und Performance.
10. **R9:** Vollständiger Qualitätsnachweis.
11. **R10:** Dokumentation und Abschluss.

R3 sollte vor der großen FX-Welle abgeschlossen werden. Andernfalls müssten alle
neuen Module zunächst in die alte feste Kette integriert und später erneut auf
die Registry-/Slot-Architektur migriert werden.

---

## 15. Kompakte Restarbeitsmatrix

| Bereich | Aktuell | Offen |
|---|---:|---:|
| Engines | 23 | 4 |
| Plan5-Importskripte | 5 | 1 plus Determinismustests |
| Importierte Datenbänke | 5 | STK-Materialbank und AKWF-Lazy-Katalog |
| AudioWorklet-Engines | DX7 | Plattformtests, Fallback, Limits, 4 neue Engines |
| FX-Architektur | feste Kette | Registry, Slots, Reorder, Migration |
| Neue Plan5-FX | CloudSeed | fast gesamter restlicher Katalog |
| FX-Rack-Presets | 9 CloudSeed-Programme | ungefähr 40 eigene Rack-Presets |
| Presetbank | 3.356 | Zielzahl neu festlegen |
| Browser-Facetten | Basisfilter | Herkunft und Bank |
| Importtests | keine | sechs Determinismus-/Metadatentests |
| DSP-Qualitätstests | keine plan5-spezifischen | Engines, FX, Worklets, Migration |
| Buildstatus | aktuell rot durch fremden UI-WIP | grüne Baseline herstellen |

Der größte verbleibende Nutzen liegt nicht in noch mehr Presets, sondern in drei
Fundamenten: einem sicheren dynamischen FX-Rack, einer getesteten
AudioWorklet-Plattform und einem belastbaren Qualitätsnachweis für importierte
Daten und DSP-Module.
