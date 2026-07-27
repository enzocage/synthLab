# plan7 – Device Chain und vollständiges FX-Rack

**Stand:** 2026-07-27  
**Grundlage:** aktueller Repository-Zustand nach `plan6.md` und den Commits
`64d4537`, `3a9e191` und `6b31a20`.  
**Ziel:** Die Device-Chain wird zu einem platzoptimierten, horizontalen
Geräteband nach dem Bedienprinzip von Ableton Live. Jeder Effekt ist ein
eigenständiges Modul. Alle vorhandenen und in `plan6.md` noch geforderten
FX-Module werden angezeigt und implementiert. Sämtliche Parameter eines Moduls
sind direkt sichtbar; Aufklappen, versteckte Advanced-Bereiche und modale
Parameterdialoge entfallen.

---

## 1. Verifizierter Ist-Zustand

### 1.1 UI

- `DetailView.tsx` begrenzt den unteren Detailbereich auf
  `--height-detail: 260px`.
- `DeviceChain.tsx` teilt die Fläche in zwei Spalten:
  - Instrument mit flexibler Breite,
  - FX-Bereich mit fest verdrahteten `340px`.
- `FxRack.tsx` zeigt die FX untereinander.
- Jeder Effekt besitzt einen lokalen `open`-State.
- Parameter werden erst nach Klick auf den Gerätenamen sichtbar.
- CloudSeed besitzt über 20 Parameter und ist im aufgeklappten Zustand sehr
  hoch; dadurch entsteht viel vertikales Scrollen.
- Die Device-Chain verwendet überwiegend Inline-Styles und kann nicht zentral
  über Layoutklassen oder Breakpoints gesteuert werden.
- Die UI arbeitet weiterhin mit `FxChainSettings` statt primär mit
  `FxRackState`.

### 1.2 Daten und Persistenz

Bereits vorhanden:

- `FxSlot` und `FxRackState` mit `version: 2`.
- verlustfreie Projektion zwischen bisherigem `FxChainSettings` und V2-Slots.
- Zod-Schema für `fxRack`.
- additive Dexie-V2-Migration.
- paralleles Speichern des alten `fx`-Objekts und des neuen `fxRack`.

Noch offen:

- `schemaVersion: 2` als verbindliche Presetversion.
- vollständige Validierung der Parameter je Modultyp.
- Recovery-Snapshot vor einer endgültigen Migration.
- transaktionaler Migrationstest.
- Session Store und App arbeiten noch nicht nativ mit `FxRackState`.

### 1.3 FX-Registry und Audiograph

Die Registry enthält derzeit nur Metadaten für sieben Module:

1. Drive
2. Filter
3. Ensemble
4. Delay
5. Reverb
6. CloudSeed
7. Width

Sie enthält noch keine Parameterdefinitionen, Defaultwerte, Factory,
Verfügbarkeit, Herkunft oder Suchbegriffe.

`FxChain.ts` ist weiterhin fest verdrahtet:

`Drive → Filter → Ensemble → Delay → Reverb → CloudSeed → Width`

Insert, Remove, Reorder, Replace und klickfreie Graphwechsel fehlen.

### 1.4 Qualitätsstand

- Build und Lint sind grün.
- 36 Tests sind grün.
- Das Initialbundle ist mit ungefähr 1,65 MB minifiziert weiterhin deutlich
  zu groß und benötigt Lazy Loading beziehungsweise Code-Splitting.

---

## 2. Verbindliche UX-Entscheidung

Die Device-Chain wird als durchgehendes horizontales Geräteband umgesetzt.
Instrument und FX stehen im tatsächlichen Signalfluss von links nach rechts.

```text
┌──────────────────────────────── resizable Detail Area ────────────────────────────────┐
│ Device Chain │ Clip & Perform │ Compare & Rating                       CPU  18%  4.2ms │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [Instrument + Macros] [Drive] [Filter] [Ensemble] [Tape Delay] [Ping Pong] [Reverb] → │
│                         horizontaler, scrollbarerer Geräte-Canvas                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ◀──────────── Minimap / Scrollposition / aktive Module / All bypass ────────────────▶ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Verbindliche Regeln

- Alle Module des Racks sind gleichzeitig als Karten sichtbar.
- Alle Parameter jeder Karte sind direkt gerendert.
- Es gibt keine Carets, Collapse-Zustände oder „Advanced“-Dialoge.
- Der horizontale Signalfluss ist wichtiger als das Vermeiden horizontalen
  Scrollens.
- Vertikales Scrollen innerhalb einzelner Module wird vermieden.
- Module mit vielen Parametern werden breiter, nicht höher oder versteckt.
- Ein Modul besitzt immer:
  - Power/Bypass,
  - Namen,
  - Kategorie- beziehungsweise Herkunftsfarbe,
  - Drag-Handle,
  - Wet/Dry, sofern fachlich sinnvoll,
  - alle Parameter,
  - Reset,
  - Replace,
  - Remove,
  - Pegelanzeige vor/nach dem Modul,
  - Fehler- oder Verfügbarkeitsstatus.
- Deaktivierte Module bleiben vollständig sichtbar und bedienbar, werden aber
  visuell gedimmt.
- Änderungen sind sofort hörbar, undo-fähig und werden persistiert.
- Die Instrumentkarte bleibt der erste, nicht löschbare Slot.
- Der Master-/Output-Bereich bleibt der letzte, nicht verschiebbare Slot.

---

## 3. Platzkonzept

### 3.1 Größen

- Detailbereich standardmäßig von `260px` auf `380px` erhöhen.
- Vertikal per Drag zwischen `240px` und `70vh` skalierbar.
- Höhe in `uiStore` und `localStorage` speichern.
- Geräteband nutzt die gesamte Fensterbreite.
- Linke Instrumentkarte:
  - Standardbreite `320px`,
  - minimale Breite `260px`,
  - für enginespezifische Panels bis `480px`.
- Kleine FX-Karte: `176–208px`.
- Mittlere FX-Karte: `224–280px`.
- Große FX-Karte: `320–440px`.
- CloudSeed, Clouds, Warps und Formant/Vocoder erhalten große Karten.
- Kartenhöhe entspricht der nutzbaren Device-Chain-Höhe.

### 3.2 Scrollen und Navigation

- Horizontaler Scrollcontainer mit Trackpad-, Shift-Wheel- und
  Middle-Mouse-Unterstützung.
- `scroll-snap-type: x proximity` für saubere Kartenpositionen.
- Sticky Instrumentkarte nur optional; standardmäßig bleibt sie Teil des
  Signalflusses.
- Kompakte Minimap unter dem Rack:
  - ein Segment pro Modul,
  - aktive Module farbig,
  - deaktivierte Module grau,
  - aktueller Viewport markiert,
  - Klick springt zum Modul.
- Tastatur:
  - `Tab` durch Parameter,
  - Pfeiltasten ändern Werte,
  - `Shift` für Feinschritte,
  - `Alt` für Grobschritte,
  - `Delete` entfernt ausgewähltes Modul nach Undo-fähiger Aktion,
  - `Ctrl/Cmd+D` dupliziert,
  - `Ctrl/Cmd+←/→` verschiebt,
  - `0` schaltet Bypass,
  - `Home/End` springt zu Instrument beziehungsweise Output.

### 3.3 Parameterdarstellung

- Regler werden aus `ParamSpec[]` generiert.
- Kontinuierliche Werte:
  - kompakter vertikaler Slider oder kleiner Drehregler,
  - Label oben,
  - formatierter Wert direkt darunter,
  - direkte Texteingabe per Doppelklick.
- Enum:
  - segmentierter Schalter bis vier Werte,
  - darüber ein kompaktes Select.
- Boolean:
  - beleuchteter Toggle.
- große Auswahlmengen:
  - durchsuchbares Select innerhalb der Karte.
- Zeitwerte zeigen musikalische und absolute Einheit, wenn Tempo-Sync möglich
  ist.
- Frequenzwerte verwenden logarithmische Kennlinie.
- Alle Controls erhalten `aria-label`, sichtbaren Fokus und sinnvolle
  `aria-valuetext`-Ausgaben.
- Kein Parameter darf nur über Tooltip erreichbar sein.

### 3.4 Informationsdichte

- Parametergruppen werden durch dünne Separatoren und Gruppenlabels gegliedert,
  aber nicht ein- und ausgeklappt.
- Karten verwenden ein internes CSS-Grid:
  - klein: zwei Spalten,
  - mittel: drei Spalten,
  - groß: vier bis sechs Spalten.
- CloudSeed wird beispielsweise in Early, Diffusion, Late, Modulation, Tone
  und Output gruppiert; alle Gruppen bleiben gleichzeitig sichtbar.
- Labels dürfen gekürzt werden, der vollständige Name bleibt über
  `aria-label` und Tooltip verfügbar.
- Werte werden einheitlich formatiert: Hz/kHz, ms/s, dB, %, Ratio, Samples,
  Notenwerte.

---

## 4. Verbindlicher vollständiger FX-Katalog

Der Zielkatalog umfasst 24 eigenständige Module. Damit werden alle bestehenden
Effekte und alle offenen FX-Anforderungen aus `plan6.md` abgedeckt. Modi, die
denselben Algorithmuskern und dieselbe Bedienlogik teilen, bleiben innerhalb
eines Moduls. Eigenständige Effekte wie Tape Delay und Ping Pong Delay werden
getrennt.

| Nr. | Registry-ID | Modul | Kategorie | Status | Direkt sichtbare Parameter |
|---:|---|---|---|---|---|
| 1 | `drive` | Drive | Color | vorhanden, Registry-Ausbau | Amount, Output, Mix |
| 2 | `post-filter` | Filter | Filter | vorhanden, stark erweitern | Model, Type, Cutoff, Resonance, Drive, Keytrack, Mix |
| 3 | `ensemble` | Ensemble | Modulation | vorhanden | Amount, Rate, Depth, Stereo, Mix |
| 4 | `tape-delay` | Tape Delay | Delay | aus bestehendem Delay trennen | Time/Sync, Feedback, Tone, Wow, Flutter, Saturation, Mix |
| 5 | `pingpong-delay` | Ping Pong Delay | Delay | aus bestehendem Delay trennen | Time/Sync, Feedback, Spread, Filter, Ducking, Mix |
| 6 | `algorithmic-reverb` | Algorithmic Reverb | Reverb | bestehendes Reverb eindeutig benennen | Size, Damping, Pre-delay, Width, Low Cut, High Cut, Freeze, Mix |
| 7 | `cloudseed` | CloudSeed | Reverb | vorhanden, abschließen | alle 24 vorhandenen Parameter, gruppiert und gleichzeitig sichtbar |
| 8 | `stereo-width` | Width | Utility | vorhanden | Width, Mono Bass, Balance, Output |
| 9 | `plate` | Dattorro Plate | Reverb | neu | Decay, Pre-delay, Diffusion, Damping, Mod Rate, Mod Depth, Low Cut, High Cut, Mix |
| 10 | `galactic` | Galactic | Reverb | neu | Replace, Brightness, Detune, Size, Mix, Output |
| 11 | `shimmer` | Shimmer | Reverb/Pitch | neu | Pitch, Feedback, Decay, Diffusion, Tone, Width, Freeze, Mix |
| 12 | `granular-delay` | Granular Delay | Delay/Texture | neu | Grain Size, Density, Position, Spray, Pitch, Feedback, Reverse, Mix |
| 13 | `clouds` | Clouds | Texture | neu | Mode, Position, Size, Density, Texture, Pitch, Stereo, Feedback, Reverb, Mix |
| 14 | `paulstretch` | PaulStretch | Texture | neu | Stretch, Window, Smear, Tonality, Pitch, Freeze, Mix |
| 15 | `resonator` | Resonator | Resonance | neu | Model, Structure, Brightness, Damping, Position, Polyphony, Exciter, Mix |
| 16 | `warps` | Warps | Modulation | neu | Mode, Algorithm, Timbre, Carrier, Oscillator, Drive, Level, Mix |
| 17 | `tape` | Tape | Color | neu | Drive, Bias, Hiss, Flutter, Head Bump, High Loss, Output, Mix |
| 18 | `density` | Density | Color | neu | Density, Highpass, Output, Mix |
| 19 | `bitcrush` | Bitcrush/Decimator | Lo-Fi | neu | Bit Depth, Sample Rate, Jitter, Dither, Filter, Mix |
| 20 | `phaser` | Phaser | Modulation | neu | Stages, Rate/Sync, Depth, Feedback, Center, Stereo Phase, Mix |
| 21 | `flanger` | Flanger | Modulation | neu | Delay, Rate/Sync, Depth, Feedback, Stereo Phase, Through-zero, Mix |
| 22 | `compressor` | Compressor | Dynamics | neu | Threshold, Ratio, Attack, Release, Knee, Makeup, Auto, Sidechain HPF, Mix |
| 23 | `autowah` | Auto Wah | Filter | neu | Sensitivity, Attack, Release, Range, Resonance, Direction, Drive, Mix |
| 24 | `formant-vocoder` | Formant/Vocoder | Spectral | neu | Mode, Vowel A, Vowel B, Morph, Bands, Carrier, Unvoiced, Formant Shift, Q, Mix |

### 4.1 Filtermodelle

`post-filter` erhält zusätzlich zu den Standardtypen die in `plan6.md`
geforderten MoogLadders-Modelle:

- Huovilainen
- Stilson
- Simplified
- Improved
- Krajeski
- Microtracker
- MusicDSP
- Oberheim

Die Modelle bleiben Modi eines Filtermoduls, weil sie dieselbe Rolle im
Signalfluss und weitgehend dieselben Parameter besitzen. Pegel und
Resonanzverhalten werden normalisiert, damit ein Modellwechsel vergleichbar
bleibt.

### 4.2 Warps-Modi

`warps` enthält:

- Crossfade
- Crossfold
- Ring Mod
- Diode
- Bitcrush
- Vocoder

Der eigenständige `bitcrush` bleibt dennoch bestehen, da er einen erweiterten
Decimator mit Sample-Rate-, Jitter-, Dither- und Filterkontrolle darstellt.

### 4.3 Clouds-Modi

`clouds` enthält:

- Granular
- Stretch
- Looping Delay
- Spectral

`granular-delay` und `paulstretch` bleiben eigenständige Module, weil sie
direkter bedienbare Spezialisten mit eigenen Parametern und geringerem
Overhead sind.

---

## 5. Registry als einzige Quelle der Wahrheit

`synthlab/src/audio/fx/registry.ts` wird von einer einfachen Metadatenliste zu
einer vollständigen Modulregistry ausgebaut.

```ts
interface FxModuleSpec {
  id: string;
  version: number;
  title: string;
  shortTitle: string;
  category: FxModuleCategory;
  description: string;
  tags: string[];
  size: "small" | "medium" | "large";
  params: ParamSpec[];
  defaults: Record<string, FxParamValue>;
  create(ctx: BaseAudioContext, params: FxParams): FxModule;
  migrate?(params: unknown, fromVersion: number): FxParams;
  availability(): FxAvailability;
  provenance: FxProvenance;
}
```

### Anforderungen

- eindeutige Modul-ID und Modulversion,
- typsichere Defaultparameter,
- Zod-Schema aus `ParamSpec[]` ableitbar,
- Wertebereich und Default jedes Parameters validiert,
- Anzeigeformat und Einheit,
- lineare, logarithmische oder gestufte Kennlinie,
- Automation-Smoothing pro Parameter,
- Modulgröße für das UI,
- Factory für den Audiograph,
- optionale Lazy-Import-Funktion für große DSP-Module,
- Herkunft, Lizenz, Upstream-Datei und Commit,
- Feature Detection und verständlicher Fehlergrund,
- Suchbegriffe und Kategorie,
- keine modulspezifische Verzweigung in `FxRack.tsx`.

### Gemeinsamer Modulvertrag

```ts
interface FxModule {
  readonly input: AudioNode;
  readonly output: AudioNode;
  start?(time: number): void;
  updateParam(id: string, value: FxParamValue, time: number): void;
  update(params: FxParams, time: number): void;
  setBypass(enabled: boolean, time: number): void;
  dispose(): void;
}
```

Alle Module müssen denselben Vertrag erfüllen. Timer, Oszillatoren, Worklets
und AudioNodes werden in `dispose()` vollständig beendet.

---

## 6. Nativer V2-Zustand

### 6.1 Presets

- `PresetSchema` erhält `schemaVersion: 2`.
- `fxRack` wird für V2 verpflichtend.
- `fx` bleibt ausschließlich im V1-Reader.
- Generierte und importierte Presets werden einmalig auf V2 umgestellt.
- Unbekannte Module bleiben als lesbare, deaktivierte Platzhalter erhalten.
- Jeder Slot besitzt:
  - stabile UUID,
  - Modultyp,
  - Modulversion,
  - Bypass,
  - Parameter,
  - optionalen nutzerdefinierten Namen.

### 6.2 Session Store

- `editedFx` wird durch `editedFxRacks` ersetzt.
- Aktionen:
  - `insertFxSlot`
  - `removeFxSlot`
  - `duplicateFxSlot`
  - `moveFxSlot`
  - `replaceFxSlot`
  - `setFxSlotBypass`
  - `setFxParam`
  - `resetFxSlot`
  - `resetFxRack`
- Jede Aktion erhält Undo/Redo.
- Parameterbewegungen werden zu einer Undo-Aktion zusammengefasst.
- Persistenz wird gedrosselt, der Audiograph jedoch live aktualisiert.

### 6.3 Dexie

- Vor finaler V2-Migration Recovery-Snapshot der `edits`-Tabelle erzeugen.
- Upgrade transaktional ausführen.
- Jeden Datensatz vor Commit gegen das V2-Schema validieren.
- Fehlerhafte Datensätze im Snapshot behalten und verständlich protokollieren.
- Wiederholte Migration darf keine neuen IDs oder andere Reihenfolgen erzeugen.
- Nach nachgewiesener Stabilität das parallele Schreiben des V1-Feldes
  entfernen; V1 lesen bleibt erhalten.

---

## 7. Dynamischer Audiograph

`FxChain` wird durch einen Rack-Host ersetzt, der Slots aus `FxRackState`
instanziiert.

### Öffentliche Operationen

- `load(rack)`
- `insert(slot, index)`
- `remove(slotId)`
- `move(slotId, targetIndex)`
- `replace(slotId, moduleType)`
- `setBypass(slotId, bypass)`
- `updateParam(slotId, paramId, value, time)`
- `dispose()`

### Klickfreie Umbauten

- Eingang wird für Graphwechsel auf alten und neuen Graph verteilt.
- Alter und neuer Graph werden mit `10–30ms` Equal-Power-Crossfade überblendet.
- Erst danach wird der alte Graph getrennt und entsorgt.
- Mehrere schnelle Reorders werden koalesziert.
- Parameteränderungen bauen den Graph nicht neu, sofern der Modulvertrag dies
  nicht ausdrücklich verlangt.
- Bypass verwendet einen geglätteten Dry/Wet-Crossfade.
- Insert/Remove/Replace dürfen weder Pegelsprung noch DC-Klick erzeugen.

### Ressourcen

- DSP-schwere Module werden erst beim ersten Gebrauch dynamisch importiert.
- Deaktivierte Module können im UI vorhanden sein, ohne Worklets oder große
  Tabellen zu laden.
- Worklet-Module werden pro `AudioContext` nur einmal registriert.
- Rack-Host besitzt Diagnosezähler für Nodes, Worklets, aktive Timer und
  Graphgeneration.

---

## 8. Komponentenumbau

### 8.1 Neue Struktur

```text
ui/device-chain/
  DeviceChain.tsx
  DeviceChainToolbar.tsx
  DeviceCanvas.tsx
  DeviceCard.tsx
  InstrumentDevice.tsx
  FxDevice.tsx
  FxParameterGrid.tsx
  FxParameterControl.tsx
  RackMinimap.tsx
  DeviceChainResizeHandle.tsx
  UnknownFxDevice.tsx
  fxDeviceFormatters.ts
```

### 8.2 `DeviceChain.tsx`

- Keine Inline-Styles mehr.
- Verantwortet nur Layout, Store-Anbindung und Signalfluss.
- Instrument, FX-Slots und Output werden aus Daten gerendert.
- Auswahl eines Moduls wird im `uiStore` gespeichert.
- Scrollposition bleibt bei Tabwechsel und Presetvergleich erhalten.

### 8.3 `FxRack.tsx`

- Wird zu einem generischen Renderer für `FxRackState`.
- Entfernt:
  - lokalen `open`-State,
  - Carets,
  - hart codierte Drive-/Filter-/CloudSeed-Blöcke,
  - `any`-Callbacks.
- Verwendet ausschließlich Registry und `ParamSpec[]`.
- `React.memo` pro Karte.
- Nur das während eines Drags bewegte Modul und tatsächlich geänderte Controls
  sollen neu rendern.

### 8.4 Drag and Drop

- Vorrangig Pointer Events und native React-Logik verwenden.
- Keine neue große Dependency nur für Reorder.
- Drag startet ausschließlich am Handle.
- Ein klarer Insert-Indikator zeigt die Zielposition.
- Auto-Scroll nahe dem linken/rechten Rand.
- Tastaturalternative ist vollständig funktionsgleich.
- Drag-Abbruch stellt die ursprüngliche Reihenfolge wieder her.

### 8.5 Toolbar

Die Device-Chain erhält eine kompakte Toolbar:

- Add Module
- Rack Preset
- Undo / Redo
- All Bypass
- Reset Rack
- CPU
- Latenz
- aktive Module / Gesamtmodule
- Zoom beziehungsweise Dichte: Compact / Standard

Die Toolbar bleibt sticky und verbraucht höchstens `32px` Höhe.

---

## 9. Umsetzung der fehlenden DSP-Module

### Phase F1 – Architektur und Bestandsmodule

- Registry vollständig machen.
- V2-Zustand durch Store, Presets und AudioController führen.
- Bestehende sieben Module an den gemeinsamen Vertrag anpassen.
- bisheriges Delay in Tape Delay und Ping Pong Delay trennen.
- Reverb zu `algorithmic-reverb` umbenennen und migrieren.
- bestehende Parameter ergänzen, ohne alte Presets klanglich zu verändern.
- neues horizontales UI zunächst mit diesen acht Zielkarten ausliefern:
  Drive, Filter, Ensemble, Tape Delay, Ping Pong Delay, Algorithmic Reverb,
  CloudSeed, Width.

### Phase F2 – Reverb, Pitch und Filter

- Dattorro Plate.
- Galactic.
- Shimmer.
- acht MoogLadders-Modelle.
- gemeinsame Stabilitätsbegrenzung für Feedbackpfade.
- Pegelkompensation und identische Bypass-Lautheit.

### Phase F3 – Modulation, Farbe und Dynamik

- Tape.
- Density.
- Bitcrush/Decimator.
- Phaser.
- Flanger.
- Compressor.
- Auto Wah.

### Phase F4 – Textur und spektrale Module

- Granular Delay.
- Clouds.
- PaulStretch.
- Resonator.
- Warps.
- Formant/Vocoder.

Diese Phase nutzt AudioWorklets und Lazy Loading, damit der Main Thread und das
Initialbundle nicht durch große DSP-Kerne belastet werden.

### Quellen und Lizenzen

Vor jeder Portierung:

- Upstream-Repository lokal auf definiertem Commit,
- Lizenz geprüft,
- verwendete Dateien notiert,
- Portierungsart dokumentiert,
- algorithmische Abweichungen festgehalten,
- Herkunftskopf in jeder DSP-Datei,
- Eintrag in `research/LICENSES.md`.

Fehlende Vendor-Quellen aus `plan6.md`:

- `eurorack`
- `moogladders`
- `soundpipe`
- `airwindows`
- `signalsmith-stretch`
- `dattorro-verb`

---

## 10. Rack-Presets

Nach Fertigstellung des Katalogs entstehen mindestens 40 Rack-Presets.

Kategorien:

- Ambient
- Drone
- Shimmer
- Tape
- Texture
- Lo-Fi
- Spatial
- Experimental
- Vocal
- Dynamics

Anforderungen:

- mehrere Slots und Reihenfolge werden gespeichert,
- keine zufälligen Slot-IDs bei erneutem Import,
- fehlende Module erscheinen als deaktivierte Platzhalter,
- Modulversionen werden migriert,
- Rack-Preset kann auf aktuelles Instrument angewendet werden,
- Replace und Merge sind getrennte Aktionen,
- Vorschau zeigt enthaltene Module und geschätzte CPU-Klasse,
- Provenance `synthlab-design`.

---

## 11. Responsive Verhalten

### Desktop ab 1200px

- vollständiger horizontaler Geräte-Canvas,
- Standarddichte,
- Minimap und Pegelanzeigen sichtbar.

### Kleine Desktopfenster 800–1199px

- Compact-Dichte,
- schmalere Karten,
- Toolbar-Aktionen teilweise als Icon,
- weiterhin alle Parameter sichtbar,
- stärkeres horizontales Scrollen.

### Unter 800px

- Device-Chain bleibt horizontal, damit der Signalfluss erhalten bleibt.
- Karten werden nicht zu vertikalen Akkordeons umgebaut.
- Minimap ersetzt breite Textnavigation.
- Detailbereich kann bis `70vh` aufgezogen werden.

---

## 12. Performancebudgets

- Parameterbewegung bis hörbare Änderung: Ziel unter `20ms`.
- UI-Interaktion: Ziel 60 FPS bei 24 sichtbaren Karten-Metadaten.
- Graph-Reorder: Crossfade abgeschlossen unter `50ms`.
- Keine Long Tasks über `50ms` beim Öffnen der Device-Chain.
- Initialbundle: Ziel unter `500kB` gzip.
- Jedes schwere FX-Modul als eigener Lazy Chunk.
- Deaktivierte, nie verwendete Module laden keinen DSP-Code.
- Keine vollständige Neuerzeugung aller Karten bei einem einzelnen
  Parameterupdate.
- 100 aufeinanderfolgende Presetwechsel ohne wachsende Node-, Timer- oder
  Worklet-Zahl.
- CPU-Klassen in der Registry: Low, Medium, High.
- Bei Überlastung wird gewarnt, nicht automatisch der Sound verändert.

---

## 13. Tests

### 13.1 Registry

- exakt 24 eindeutige IDs,
- eindeutige Legacy-Aliase,
- valide Defaults,
- alle Parameterwerte innerhalb der Spezifikation,
- jedes Modul besitzt Factory, Kategorie, Größe und Provenance,
- Lazy Module können geladen werden,
- unbekannte IDs führen nicht zum Crash.

### 13.2 Migration

- V1-Kette migriert verlustfrei und in identischer Reihenfolge.
- bestehendes kombiniertes Delay wird deterministisch in Tape oder Ping Pong
  überführt.
- altes Reverb wird zu `algorithmic-reverb`.
- wiederholte Migration ist idempotent.
- Dexie-Upgrade ist transaktional.
- Recovery-Snapshot enthält den unveränderten Originaldatensatz.
- unbekannte Module und Parameter bleiben erhalten.

### 13.3 UI

- alle Parameter jedes Moduls sind ohne zusätzlichen Klick im DOM.
- kein Caret und kein Collapse-Button mehr.
- 24 Module können gerendert werden.
- horizontaler Scroll und Minimap bleiben synchron.
- Reorder per Pointer und Tastatur.
- Add, Remove, Replace, Duplicate und Reset.
- Undo/Redo.
- Bypass bleibt bei Reorder erhalten.
- Fokus bleibt nach Parameteränderung stabil.
- alle Controls besitzen zugängliche Namen.
- Compact- und Standarddichte.
- visuelle Regression bei 800px, 1280px, 1920px und 4K.

### 13.4 Audiograph

- Insert, Remove, Reorder, Replace und Bypass.
- Crossfade ohne Sprung größer als definiertes dB-/Sample-Limit.
- keine NaN- oder Infinity-Samples.
- Freeze mindestens 60 Sekunden stabil.
- Feedback-Maximalwerte bleiben begrenzt.
- Dispose hinterlässt keine Nodes, Timer oder Worklets.
- identischer Bypass-Pegel innerhalb definierter Toleranz.
- OfflineAudioContext-Render für jedes Modul bei Default- und Extremwerten.

### 13.5 Integration

- Preset laden und alle Karten anzeigen.
- FX ändern, App neu laden und identischen Rackzustand wiederherstellen.
- V1-Edit laden und als V2 speichern.
- Rack-Preset Replace und Merge.
- fehlendes Worklet zeigt verständlichen Status.
- Panic und AudioContext-Neustart.

---

## 14. Dokumentation

Zu aktualisieren:

- `README.md`
- `preset_sources.md`
- `research/LICENSES.md`
- Architekturübersicht für Registry, Rack-Host und Migration
- Modulreferenz mit allen 24 Effekten und Parametern
- Bedienhilfe und Tastenkürzel
- Performance- und Browseranforderungen

Jedes Modul dokumentiert:

- Zweck und Klangcharakter,
- Signalfluss,
- Parameter,
- CPU-Klasse,
- Herkunft und Lizenz,
- bekannte Abweichungen,
- Einschränkungen,
- Versionshistorie.

---

## 15. Empfohlene Commit- und Push-Grenzen

1. `Refactor device chain to horizontal full-parameter layout`
2. `Complete FX registry and parameter specifications`
3. `Move session and presets to native FX rack v2`
4. `Add dynamic click-free FX graph host`
5. `Split legacy delay and migrate existing racks`
6. `Add plate galactic shimmer and ladder filters`
7. `Add tape density modulation and dynamics effects`
8. `Add granular spectral and resonator effects`
9. `Add rack presets lazy loading and performance diagnostics`
10. `Complete FX rack tests documentation and migration cleanup`

Nach jedem Commit:

- `npm run build`
- `npm run lint`
- `npm test`
- kurzer Browser-Smoke-Test der betroffenen Interaktion
- Push nur bei grünem Stand

---

## 16. Abnahmekriterien

Plan7 ist vollständig umgesetzt, wenn:

- die Device-Chain die gesamte verfügbare Breite nutzt;
- die Höhe veränderbar und gespeichert ist;
- Instrument, alle FX-Slots und Output als horizontaler Signalfluss erscheinen;
- alle Parameter jedes Moduls sofort sichtbar sind;
- es keine aufklappbaren FX-Karten mehr gibt;
- alle 24 definierten FX-Module implementiert und in der Registry vorhanden
  sind;
- jedes Modul eigenständig hinzugefügt, entfernt, ersetzt, dupliziert,
  verschoben und gebypasst werden kann;
- UI und Audiograph nativ `FxRackState` V2 verwenden;
- V1-Presets und V1-Edits verlustfrei migrieren;
- Graphumbauten keine hörbaren Klicks erzeugen;
- unbekannte oder nicht verfügbare Module die App nicht zum Absturz bringen;
- schwere DSP-Module lazy geladen werden;
- alle Registry-, Migrations-, UI-, DSP- und Integrationstests grün sind;
- Build und Lint grün sind;
- alle Quellen und Lizenzen dokumentiert sind;
- der reale Funktionsumfang mit README und Modulreferenz übereinstimmt.

---

## 17. Nicht Teil dieses Plans

Dieser Plan konzentriert sich auf Device Chain, FX-Rack und sämtliche noch
fehlenden FX-Module aus `plan6.md`. Die ebenfalls offenen Synth-Engines
`plaits`, `rings`, `stk-acoustic` und `daisy-osc`, die DX7-/OPL3-/AKWF-
Vertiefungen sowie der STK-Presetimport bleiben eigenständige Restarbeiten aus
`plan6.md`. Der für das Resonator-FX benötigte Rings-Kern darf vorgezogen
werden, ersetzt aber nicht die spätere vollständige Rings-Synth-Engine.

