# SynthLab – Plan zur drastischen Verbesserung von UI und UX

## 1. Zielbild

SynthLab soll sich von einer dichten technischen Bedienoberfläche zu einem klaren, schnellen und verlässlichen Musikinstrument entwickeln. Vorbild ist die Arbeitslogik von Ableton Live:

- klare Trennung zwischen globaler Steuerung, Tracks, Clips und Devices,
- dauerhaft erkennbare Auswahl und Hierarchie,
- hohe Informationsdichte ohne visuelles Chaos,
- direkte Manipulation mit wenigen Dialogen,
- konsistente Bedienung per Maus, Tastatur und MIDI,
- progressive Offenlegung statt gleichzeitiger Darstellung aller Parameter,
- eine Oberfläche, die beim Musizieren möglichst wenig Aufmerksamkeit beansprucht.

Das Ziel ist keine pixelgenaue Kopie von Ableton Live. SynthLab soll dessen bewährte Prinzipien übernehmen und daraus eine eigenständige, auf Preset-Audition, Sounddesign und generative Ambient-Musik zugeschnittene Produktsprache entwickeln.

## 2. Ausgangslage

Die aktuelle Oberfläche zeigt fast alle Funktionsbereiche gleichzeitig:

- globaler Transport,
- vier Tracks,
- Preset-Browser,
- Makros,
- SID-Spezialparameter,
- vollständiges FX-Rack,
- Variation Grid,
- Bewertung und Notizen,
- Arpeggiator,
- Bildschirmklaviatur.

Das macht viele Funktionen auffindbar, erzeugt aber erhebliche UX-Probleme:

- Es gibt keine klare primäre Arbeitsfläche.
- Track-, Preset- und Device-Auswahl wirken wie parallele Kontexte.
- Die Beziehung zwischen ausgewähltem Track, geladenem Preset und hörbarem Audio ist nicht eindeutig.
- Die Oberfläche ist stark vertikal und horizontal verschachtelt.
- Wichtige und seltene Aktionen besitzen fast dasselbe visuelle Gewicht.
- Der Bildschirm wird bereits auf großen Displays vollständig ausgefüllt.
- Kleine Displays und Touch-Eingabe sind praktisch nicht berücksichtigt.
- Viele Zustände werden nur durch Farbe oder sehr kleine Symbole kommuniziert.
- Klickbare Zeilen sind semantisch keine interaktiven Elemente.
- Das globale Shortcut-System kann die normale Formularbedienung stören.
- Metering und Statusanzeigen konkurrieren mit zentralen Transportfunktionen.
- Der Preset-Browser ist eine lange Liste, obwohl Presetvergleich und Kuratierung zu den wichtigsten Produktaufgaben gehören.
- Der untere Bildschirmbereich ist dauerhaft durch Arp und Klaviatur belegt, auch wenn diese nicht benötigt werden.

## 3. Produktprinzipien

### 3.1 Musik vor Konfiguration

Die Oberfläche muss zuerst das Hören, Spielen, Vergleichen und Arrangieren unterstützen. Technische Einstellungen erscheinen erst dann, wenn der Nutzer den entsprechenden Kontext öffnet.

### 3.2 Ein sichtbarer Fokus

Zu jedem Zeitpunkt muss klar sein:

1. Welcher Track ist ausgewählt?
2. Welcher Clip oder welches Device wird bearbeitet?
3. Welches Preset ist geladen?
4. Welche Aktion würde die nächste Eingabe auslösen?

### 3.3 Eine Aktion, eine erkennbare Folge

Wenn ein Preset geladen, ein Track stummgeschaltet oder eine Variation übernommen wird, müssen Klang, UI und Projektzustand gemeinsam reagieren. Optimistische Zwischenzustände ohne sichtbare Bestätigung sind zu vermeiden.

### 3.4 Progressive Offenlegung

Die häufigsten Parameter bleiben sichtbar. Detailparameter, erweiterte Engine-Funktionen und seltene Einstellungen werden in aufklappbaren Sektionen oder einem Detailbereich dargestellt.

### 3.5 Konstante räumliche Logik

- Globales bleibt oben.
- Quellen und Suche bleiben links.
- Tracks und Clips bleiben in der Mitte.
- Detailbearbeitung bleibt unten.
- Status und Hilfetext bleiben am unteren Rand.

Diese Bereiche dürfen ihre grundlegende Bedeutung nicht abhängig vom Preset ändern.

### 3.6 Tastatur als gleichwertiger Bedienweg

Jeder Kernworkflow muss ohne Maus möglich sein. Shortcuts dürfen Fokus, Texteingabe und Betriebssystembefehle nicht beeinträchtigen.

### 3.7 Ruhige visuelle Sprache

Die UI soll dicht, präzise und neutral sein. Farbe dient Zuständen und Orientierung, nicht Dekoration.

## 4. Neue Informationsarchitektur

Die Anwendung erhält fünf stabile Hauptbereiche.

### 4.1 Top Bar – globale Steuerung

Enthält ausschließlich globale Funktionen:

- Play/Stop,
- Record,
- Tempo,
- Taktart,
- Metronom,
- Loop,
- globaler MIDI-/Audio-Status,
- CPU-/Voice-Indikator,
- Master-Meter,
- Undo/Redo,
- Speichern/Export,
- Panic.

Die Top Bar bleibt dauerhaft sichtbar und überschreitet auf Desktop nicht ungefähr 44 Pixel Höhe.

### 4.2 Browser – Quellen und Sammlungen

Die linke Seitenleiste wird zu einem echten hierarchischen Browser:

- Presets,
- Engines,
- Rollen,
- Tags,
- Favoriten,
- unbewertete Presets,
- eigene Sammlungen,
- zuletzt verwendet,
- gespeicherte Projekte,
- optional Samples und MIDI-Clips.

Der Browser besteht aus zwei Ebenen:

1. schmale Kategorie-/Navigationsspalte,
2. Inhaltsliste mit Suche, Sortierung und Filtern.

Er kann eingeklappt oder in der Breite verändert werden.

### 4.3 Main Workspace – Session und Arrangement

Der zentrale Bereich erhält zwei Modi:

- **Session View:** Tracks als Spalten, Clip-Slots als Zeilen; optimiert für Experimentieren, Audition und Live-Performance.
- **Arrangement View:** horizontale Zeitachse; optimiert für strukturiertes Komponieren und Bearbeiten längerer Abläufe.

Für den ersten Umbau wird die Session View priorisiert. Die Arrangement View kann zunächst als deaktivierter oder späterer Modus vorgesehen werden.

### 4.4 Detail View – Clip oder Device

Der untere Bereich zeigt abhängig von der Auswahl:

- **Device View:** Instrument, acht Makros, Engine-Parameter, FX-Kette, Arpeggiator.
- **Clip View:** Pianoroll, Noten, Loop-Länge, Quantisierung, Velocity und Clip-Eigenschaften.
- **Preset Compare View:** A/B, Variationen, Bewertung, Tags und Notizen.

Die Detail View ist ein- und ausklappbar und besitzt eine anpassbare Höhe.

### 4.5 Status Bar – Kontext und Hilfe

Eine flache Statuszeile zeigt:

- Beschreibung des Elements unter Maus oder Fokus,
- aktuellen Shortcut,
- Validierungs- und Speicherstatus,
- Audio-/MIDI-Warnungen,
- kurze Rückmeldungen wie „Preset Track 2 zugewiesen“.

Dadurch werden zahlreiche Tooltips und modale Hinweise überflüssig.

## 5. Ziel-Layout

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Top Bar: Transport | Tempo | Loop | MIDI | CPU/Voices | Master | Save/Panic │
├───────────────┬──────────────────────────────────────────────────────────────┤
│ Browser       │ Session View / Arrangement View                              │
│               │                                                              │
│ Kategorien    │ Track 1     Track 2     Track 3     Track 4      Master      │
│ Suche         │ ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐               │
│ Filter        │ │ Clip 1 │  │ Clip 1 │  │        │  │ Clip 1 │               │
│               │ ├────────┤  ├────────┤  ├────────┤  ├────────┤               │
│ Presetliste   │ │ Clip 2 │  │        │  │ Clip 2 │  │        │               │
│               │ ├────────┤  ├────────┤  ├────────┤  ├────────┤               │
│               │ │  +     │  │  +     │  │  +     │  │  +     │               │
│               │ └────────┘  └────────┘  └────────┘  └────────┘               │
├───────────────┴──────────────────────────────────────────────────────────────┤
│ Detail View: [Device] [Clip] [Compare]                                      │
│ Instrument → Makros → Engine-Panel → Drive → Filter → Delay → Reverb        │
├──────────────────────────────────────────────────────────────────────────────┤
│ Status: Beschreibung | Shortcut | Autosave | Audio/MIDI                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 6. Session View

### 6.1 Track Header

Jeder Track-Header enthält:

- Tracknummer und editierbaren Namen,
- zugewiesenes Instrument/Preset,
- Trackfarbe,
- Arm,
- Solo,
- Mute,
- Eingangsmonitoring,
- kompaktes Pegelmeter,
- Lautstärke,
- Pan,
- optional Send A/B.

Der ausgewählte Track erhält eine klare Kontur und eine leichte Flächenänderung. Mute, Solo und Arm verwenden zusätzlich Symbol und Text/Tooltip; Farbe allein genügt nicht.

### 6.2 Clip Slots

Clip-Slots besitzen klar unterscheidbare Zustände:

- leer,
- enthält Clip,
- ausgewählt,
- vorbereitet,
- spielt,
- nimmt auf,
- stoppt am Quantisierungszeitpunkt,
- fehlerhaft oder ohne Instrument.

Ein leerer Slot zeigt erst beim Hover oder Fokus eine dezente Hinzufügen-/Aufnahmeaktion. Dadurch bleibt die Fläche ruhig.

### 6.3 Scene-Spalte

Links oder rechts neben den Tracks entsteht eine Scene-Spalte:

- ganze Zeile starten,
- Scene benennen,
- Stop All Clips,
- spätere Speicherung von Tempo oder Variationen pro Scene.

Für Ambient-Workflows können Scenes beispielsweise „Intro“, „Bloom“, „Texture“, „Break“ und „Outro“ repräsentieren.

### 6.4 Drag-and-drop

Unterstützte Aktionen:

- Preset aus Browser auf Track-Header: Instrument zuweisen.
- Preset auf leeren Trackbereich: neuen Track erzeugen.
- MIDI-Clip auf Slot: Clip zuweisen.
- Clip zwischen Slots verschieben oder mit Modifikatortaste kopieren.
- Device innerhalb der Device Chain neu anordnen.
- Variation auf A/B-Slot oder Preset-Sammlung ziehen.

Jede Drop-Zone muss während des Drags deutlich, aber nicht flächendeckend markiert werden.

## 7. Browser und Preset-Audition

### 7.1 Browserstruktur

Die Presetliste erhält folgende Spalten oder kompakte Metadaten:

- Name,
- Engine,
- Hauptrolle,
- Bewertung,
- Favorit,
- Tags,
- zuletzt gehört,
- geändert/Original.

Auf schmalen Breiten werden nur Name, Engine-Kürzel und Bewertung gezeigt.

### 7.2 Suche und Filter

- Suche wird debounced.
- Filter erscheinen als entfernbare Chips.
- Anzahl der Ergebnisse ist sofort sichtbar.
- Sortierung nach Name, Engine, Bewertung, Nutzung oder Zufall.
- „Nur unbewertet“ und „Nur Favoriten“ sind Schnellfilter.
- Filterzustand kann als Sammlung gespeichert werden.
- Ein „Filter zurücksetzen“-Befehl ist immer erreichbar.

### 7.3 Audition-Modus

Ein dedizierter Audition-Modus macht Presetvergleich zum schnellen Kernworkflow:

1. Zieltrack auswählen.
2. Preset im Browser fokussieren.
3. Automatische oder manuelle Testphrase hören.
4. Mit Pfeiltasten/J/K wechseln.
5. Mit 1–5 bewerten.
6. Mit F favorisieren.
7. Mit A/B Vergleichsslot setzen.
8. Mit Enter übernehmen.

Der Browser unterscheidet:

- **Preview:** temporärer Klang, Projekt wird nicht verändert.
- **Load/Commit:** Preset wird dem Track dauerhaft zugewiesen.

Diese Trennung verhindert versehentliche Projektänderungen beim Durchhören.

### 7.4 Preview Feedback

Während des Vorhörens werden sichtbar:

- Preview-Symbol,
- Zieltrack,
- Name und Engine,
- Phrase/Profil,
- verbleibender oder laufender Zustand,
- Option „Übernehmen“.

Ein Wechsel auf das nächste Preset beendet oder crossfadet die vorherige Preview zuverlässig.

### 7.5 Virtualisierung

Die Presetliste darf unabhängig von der Bankgröße nur sichtbare Zeilen rendern. Ziel:

- flüssiges Scrollen bei mindestens 10.000 Presets,
- keine Neuberechnung der gesamten Liste durch Meter-Updates,
- stabile Fokusposition beim Filtern und Sortieren.

## 8. Device View

### 8.1 Device Chain

Instrument und Effekte werden horizontal als Geräte dargestellt:

```text
[Instrument] → [Drive] → [Filter] → [Ensemble] → [Delay] → [Reverb] → [Width]
```

Jedes Device besitzt:

- Aktiv/Bypass,
- Namen,
- maximal vier bis acht zentrale Parameter,
- visuelle Aktivitätsanzeige,
- Auf-/Zuklappen,
- Kontextmenü,
- Entfernen oder Zurücksetzen,
- optional Hot-Swap über Browser.

Nur das ausgewählte Device zeigt alle Detailparameter. Nicht ausgewählte Devices bleiben kompakt.

### 8.2 Instrument Device

Der Instrumentbereich enthält:

- Engine-Name und Preset,
- acht einheitliche Makros,
- Polyphonie/Voice-Anzeige,
- Engine-spezifischen Detailbereich,
- Preset speichern,
- Randomize/Variation,
- Reset,
- Hot-Swap.

Die acht Makros bleiben für alle Engines an derselben Stelle. Engine-spezifische Parameter werden darunter oder in einem erweiterten Panel gruppiert:

- Oscillator,
- Filter,
- Envelope,
- Modulation,
- Performance,
- Advanced.

### 8.3 Parameterbedienung

Alle Regler unterstützen:

- Drag vertikal oder horizontal,
- Shift für Feineinstellung,
- Doppelklick für Standardwert,
- direkte Zahleneingabe,
- Pfeiltasten,
- konsistente Einheiten,
- sichtbaren Wertebereich,
- Undo-fähige Änderungen,
- Automation-/MIDI-Learn-Markierung als spätere Erweiterung.

Native Range-Slider können zunächst verwendet werden, benötigen aber eine konsistente zugängliche Darstellung und einheitliches Verhalten.

### 8.4 FX-Devices

Die derzeitigen aufklappbaren FX-Karten werden in kompakte Devices überführt. Pro Device werden zunächst die klanglich wichtigsten Parameter gezeigt:

- Drive: Amount.
- Filter: Type, Cutoff, Resonance.
- Ensemble: Amount, Rate, Depth.
- Delay: Time, Feedback, Mix, Tone.
- Reverb: Size, Decay/Damping, Mix, Width.
- Width: Amount.

Erweiterte Parameter erscheinen über einen „Advanced“-Bereich.

### 8.5 Signalfluss

Die Reihenfolge ist visuell und interaktiv erkennbar. Bypassed Devices erscheinen gedimmt, bleiben aber lesbar. Drag-and-drop zur Neuordnung wird erst angeboten, wenn auch der Audio-Layer dynamische Reihenfolgen sicher unterstützt.

## 9. Clip View

### 9.1 Pianoroll

Die Bildschirmklaviatur wird von einer permanenten unteren Leiste zu einem Bestandteil der Clip View.

Die Pianoroll enthält:

- horizontale Zeitachse,
- vertikale Tonhöhe,
- Loop-Bereich,
- Notenblöcke,
- Velocity-Lane,
- Raster und Quantisierung,
- Zoom,
- Auswahl und Mehrfachauswahl,
- Duplicate, Delete, Transpose und Legato.

### 9.2 Clip-Eigenschaften

- Name,
- Farbe,
- Loop an/aus,
- Länge in Takten,
- Start/Ende,
- Launch Quantization,
- Gain/Velocity,
- Follow Action als spätere Erweiterung.

### 9.3 Aufnahmefluss

1. Track armen.
2. Leeren Slot auswählen.
3. Globale oder Slot-Aufnahme starten.
4. Count-in anzeigen.
5. Aufnahme klar rot markieren.
6. Stop quantisiert ausführen.
7. Clip automatisch benennen.
8. Neue Aufnahme sofort in der Clip View öffnen.

Der aktuelle lokale `recordingTrackId`-Zustand wird durch kanonischen Projekt-/Transportzustand ersetzt.

## 10. Preset Compare View

Variation, A/B, Bewertung und Notizen werden aus dem allgemeinen Hauptbereich in eine spezialisierte Vergleichsansicht verschoben.

### 10.1 A/B

- Zwei klar beschriftete Slots mit Presetname und Änderungsstatus.
- Ein Klick oder Shortcut wechselt atomar zwischen A und B.
- Pegelkompensation optional aktivierbar.
- Gleiche Testphrase und gleiche Startposition.
- Blindvergleich als spätere Option.
- „A übernehmen“, „B übernehmen“ und „Differenz verwerfen“.

### 10.2 Variationen

Das Variation Grid zeigt pro Karte:

- Variationsnummer,
- Abweichungsstärke,
- wichtigste geänderte Parameter,
- Play/Preview,
- Favorit,
- Übernehmen,
- erneute Mutation.

Ein X/Y-Pad kann später zwei Makrodimensionen visuell explorierbar machen.

### 10.3 Bewertung und Notizen

- Fünf klar bedienbare Bewertungsstufen.
- Favorit als eigenständiger Zustand.
- Verwerfen mit Undo-Möglichkeit.
- Tags editierbar und filterbar.
- Notizen autospeichern.
- Bewertung, Favorit und Notizen dürfen beim Presetwechsel nicht verloren gehen.

## 11. Transport und globale Rückmeldung

### 11.1 Transport

Die Top Bar unterscheidet klar:

- gestoppt,
- spielend,
- aufnahmebereit,
- aufnehmend,
- Count-in,
- AudioContext pausiert,
- Audiofehler.

Play und Record müssen visuell stärker sein als sekundäre Funktionen.

### 11.2 Tempo

- Direkte Zahleneingabe.
- Drag zum Ändern.
- Tap Tempo.
- Min-/Max-Grenzen.
- Optional Tempo-Automation oder Scene-Tempo später.

### 11.3 Metering

- Master-Meter mit Peak-Hold und Clip-Indikator.
- Track-Meter in reduzierter Form.
- dB-Skala statt ausschließlich linearer Rohwerte.
- Meter-Rendering isoliert vom restlichen React-Baum.
- Zielwert 30 FPS; bei unsichtbarer Anwendung deutlich reduzieren oder pausieren.

### 11.4 Meldungen

Nicht blockierende Toasts oder Statusmeldungen für:

- Projekt gespeichert,
- Preset übernommen,
- Track gelöscht und per Undo wiederherstellbar,
- MIDI verbunden/getrennt,
- AudioContext unterbrochen,
- Import fehlgeschlagen,
- Clip aufgenommen.

Fehler mit Handlungsbedarf bleiben sichtbar, bis sie behoben oder bestätigt wurden.

## 12. Visuelles Designsystem

### 12.1 Farbstrategie

Grundflächen:

- `canvas`: nahezu schwarz, aber nicht vollständig schwarz,
- `surface-1`: primäre Panels,
- `surface-2`: erhöhte Controls und Devices,
- `surface-3`: aktive oder fokussierte Flächen,
- `border-subtle`: strukturelle Trennlinien,
- `text-primary`, `text-secondary`, `text-muted`.

Semantische Farben:

- Blau: Auswahl und primäre Aktion.
- Grün: aktiv spielend oder erfolgreich.
- Rot: Aufnahme, Clipping und destruktive Aktion.
- Gelb: Solo, Warnung oder temporärer Zustand.
- Violett/Türkis: optionale Trackfarben oder Modulationszustände.

Trackfarben dürfen Akzente setzen, aber niemals die vollständige Lesbarkeit bestimmen.

### 12.2 Design Tokens

Alle Werte werden zentral als CSS Custom Properties definiert:

```css
:root {
  --color-canvas: #0e1013;
  --color-surface-1: #15181d;
  --color-surface-2: #1c2026;
  --color-surface-3: #252b33;
  --color-border: #303640;
  --color-text: #e6e9ee;
  --color-text-muted: #929aa6;
  --color-accent: #56a3ff;
  --color-playing: #55c878;
  --color-recording: #ef5350;
  --color-warning: #e0b84f;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --radius-sm: 3px;
  --radius-md: 5px;
  --control-height-sm: 24px;
  --control-height-md: 30px;
  --topbar-height: 44px;
  --statusbar-height: 24px;
}
```

Die konkreten Farben werden mit Kontrasttests validiert und können während der Designphase angepasst werden.

### 12.3 Typografie

- UI-Schrift: neutrale, gut lesbare Sans-Serif.
- Messwerte und Zeitangaben: tabellarische Ziffern oder Monospace.
- Kleine Textgrößen nicht unter 11–12 CSS-Pixel.
- Drei primäre Hierarchiestufen statt vieler leicht unterschiedlicher Größen.
- Keine Großbuchstaben für längere Texte.

### 12.4 Abstände und Dichte

Es werden zwei Dichtemodi vorgesehen:

- **Comfortable:** größere Targets, geeignet für Einsteiger und Touch.
- **Compact:** hohe Informationsdichte für Desktop-Power-User.

Die Informationsarchitektur bleibt in beiden Modi identisch.

### 12.5 Icons

- Einheitlicher Icon-Satz.
- Text oder zugänglicher Name für nicht universell erkennbare Icons.
- Keine Mischung aus Emoji, Unicode-Zeichen und SVG-Icons.
- Play, Stop, Record, Mute, Solo, Arm, Browser, Device und Clip erhalten konsistente Symbole.

### 12.6 Animation

Animation dient nur der Zustandsvermittlung:

- Panel auf/zu: 120–180 ms.
- Auswahl-/Hoverwechsel: 80–120 ms.
- Clip-Start: quantisierte Zustandsänderung, keine dekorative Animation.
- Meter: kontinuierlich, aber unabhängig vom React-Hauptbaum.

`prefers-reduced-motion` wird respektiert.

## 13. Interaktionsmodell

### 13.1 Auswahlmodell

SynthLab benötigt eine zentrale Selection:

```ts
type Selection =
  | { kind: "track"; trackId: string }
  | { kind: "clip"; trackId: string; clipId: string }
  | { kind: "device"; trackId: string; deviceId: string }
  | { kind: "preset"; presetId: string; preview: boolean }
  | { kind: "variation"; presetId: string; variationId: string };
```

Die Detail View leitet ihren Inhalt ausschließlich aus dieser Selection ab.

### 13.2 Einfach-, Doppel- und Kontextklick

- Einfachklick: auswählen.
- Doppelklick: primäre Aktion, beispielsweise Preset laden oder Clip starten.
- Rechtsklick/Context Menu: sekundäre Aktionen.
- Drag: verschieben oder zuweisen.

Das Verhalten muss überall gleich bleiben.

### 13.3 Shortcuts

Globale Basis:

- `Space`: Play/Stop.
- `Shift + Space`: ab aktueller Position starten.
- `F9` oder konfigurierbar: Record.
- `Esc`: aktuelle Interaktion abbrechen; mehrfach Esc führt zu Panic nur nach klarer Definition.
- `Ctrl/Cmd + Z`: Undo.
- `Ctrl/Cmd + Shift + Z`: Redo.
- `Ctrl/Cmd + S`: Speichern.
- `Tab`: Device/Clip Detail wechseln, nicht globale Formulare stören.
- Pfeile: lokale Navigation abhängig vom Fokus.
- `Enter`: fokussiertes Element aktivieren.
- `Delete`: Auswahl löschen, mit Undo.

Audition:

- `J/K` oder Pfeile: vorheriges/nächstes Preset.
- `1–5`: bewerten, wenn Audition-Kontext aktiv ist.
- `F`: Favorit, wenn Audition-Kontext aktiv ist.
- `A`, `B`: Vergleichsslot setzen.
- `C`: A/B wechseln.
- `M`: Variationen erzeugen.

Musikalische Computertastatur:

- eigener aktivierbarer Keyboard-Modus,
- visuell erkennbare Aktivierung,
- keine Überschneidung mit Text- und Navigationsshortcuts.

### 13.4 Fokusregeln

- Kein automatisches `blur()`.
- Shortcuts werden nicht ausgeführt, wenn ein editierbares Control aktiv ist, außer ausdrücklich dafür vorgesehen.
- Fokus bleibt nach Aktionen sinnvoll erhalten.
- Beim Öffnen eines Panels wandert Fokus nur dann hinein, wenn es sich um einen Dialog handelt.
- Nach Löschen wird das nächste logische Element fokussiert.

## 14. Accessibility

Zielstandard: WCAG 2.2 AA für alle Kernworkflows.

### 14.1 Semantik

- Presetliste als Listbox oder semantische Liste.
- Tracks und Clip-Slots als echte Buttons/Grid-Elemente.
- Toggle-Zustände über `aria-pressed`.
- Expandierbare Devices über `aria-expanded`.
- Meter mit zugänglichem Textwert, ohne Screenreader mit 30 Updates pro Sekunde zu überlasten.
- Formularelemente mit sichtbarem Label.

### 14.2 Tastatur

- Logische Tab-Reihenfolge.
- Roving Tabindex für große Grids.
- Pfeilnavigation innerhalb von Presetliste, Clip-Grid und Device Chain.
- Fokusindikator mit ausreichendem Kontrast.
- Keine Keyboard Traps.

### 14.3 Screenreader-Rückmeldung

Eine höfliche Live-Region meldet wichtige Zustandsänderungen:

- „Preset X auf Track 2 geladen.“
- „Clip 1 spielt.“
- „Aufnahme gestartet.“
- „Track stummgeschaltet.“
- „Bewertung 4 von 5.“

Kontinuierliche Meterdaten werden nicht über Live-Regionen ausgegeben.

### 14.4 Kontrast und Farbe

- Textkontrast mindestens 4,5:1.
- Große UI-Elemente mindestens 3:1.
- Auswahl, Aufnahme, Mute und Solo immer zusätzlich durch Form, Icon oder Text erkennbar.
- Farbschwäche-Simulation in der visuellen QA.

### 14.5 Touch

- Primäre Touch-Targets mindestens ungefähr 44 × 44 Pixel im Comfortable-Modus.
- Keine ausschließlich auf Hover basierenden Aktionen.
- Slider mit direkter Zahleneingabe ergänzen.

## 15. Responsive Strategie

### 15.1 Large Desktop ab ungefähr 1440 px

- Browser sichtbar.
- Session/Arrangement vollständig.
- Detail View über volle Breite.
- Track-Mixer und mehrere Devices gleichzeitig sichtbar.

### 15.2 Standard Desktop 1024–1439 px

- Browser schmaler oder einklappbar.
- Weniger gleichzeitig sichtbare Tracks.
- Horizontales Scrollen im Trackbereich.
- Detail View zeigt ausgewähltes Device statt komplette Kette.

### 15.3 Tablet 768–1023 px

- Browser als Overlay/Drawer.
- Top Bar auf Kernaktionen reduziert.
- Session View horizontal scrollbar.
- Detail View als unteres Sheet.
- Comfortable-Dichte als Standard.

### 15.4 Mobile unter 768 px

Kein Versuch, die komplette Desktop-DAW zu verkleinern. Stattdessen fokussierte Modi:

- Play/Performance,
- Preset Browser,
- Track Mixer,
- Device Edit,
- Clip Edit.

Zwischen diesen Modi wird über eine untere Navigation gewechselt.

## 16. UX-Workflows

### 16.1 Preset finden und zuweisen

1. Track auswählen.
2. Browser öffnen.
3. Suche oder Kategorie wählen.
4. Preset fokussieren und vorhören.
5. Varianten vergleichen oder bewerten.
6. Mit Enter/Doppelklick übernehmen.
7. Statusmeldung bestätigt die Zuweisung.

Ziel: maximal zwei Interaktionen nach dem Finden des Presets.

### 16.2 Sound bearbeiten

1. Track oder Instrument-Device auswählen.
2. Device View öffnet acht Makros.
3. Makro direkt ändern.
4. Optional Engine-Details öffnen.
5. Änderung wird hörbar, gespeichert und ist undo-fähig.

Ziel: Kein Preset-Hot-Swap bei normalen Live-Parametern.

### 16.3 FX hinzufügen oder bearbeiten

1. Device Chain öffnen.
2. FX-Device auswählen.
3. Wichtigste Parameter sofort bearbeiten.
4. Bypass für echten A/B-Vergleich.
5. Advanced nur bei Bedarf öffnen.

### 16.4 Clip aufnehmen

1. Track armen.
2. Leeren Clip-Slot auswählen.
3. Record starten.
4. Einspielen per MIDI, Arp oder Bildschirmtastatur.
5. Quantisiert stoppen.
6. Clip wird selektiert und in der Clip View geöffnet.

### 16.5 Variation vergleichen

1. Preset Compare öffnen.
2. Mutationsstärke wählen.
3. Variationen generieren.
4. Mit J/K oder Grid navigieren.
5. Kandidat nach B legen.
6. A/B vergleichen.
7. Kandidat übernehmen oder verwerfen.

## 17. Komponentenarchitektur

Empfohlene neue Struktur:

```text
src/
  app/
    AppShell.tsx
    WorkspaceLayout.tsx
    routes-or-modes.ts
  components/
    primitives/
      Button.tsx
      IconButton.tsx
      Toggle.tsx
      Slider.tsx
      NumberField.tsx
      Select.tsx
      Tooltip.tsx
      ContextMenu.tsx
      SplitPane.tsx
      VirtualList.tsx
    transport/
      TopBar.tsx
      TransportControls.tsx
      MasterMeter.tsx
      SystemStatus.tsx
    browser/
      BrowserPanel.tsx
      BrowserCategories.tsx
      PresetSearch.tsx
      PresetFilters.tsx
      PresetList.tsx
      PresetPreview.tsx
    session/
      SessionView.tsx
      TrackColumn.tsx
      TrackHeader.tsx
      ClipSlot.tsx
      SceneRow.tsx
      MasterColumn.tsx
    detail/
      DetailView.tsx
      DetailTabs.tsx
      DeviceView.tsx
      ClipView.tsx
      CompareView.tsx
    devices/
      DeviceChain.tsx
      DeviceShell.tsx
      InstrumentDevice.tsx
      MacroControls.tsx
      EnginePanel.tsx
      FxDevice.tsx
    feedback/
      StatusBar.tsx
      ToastRegion.tsx
      ErrorPanel.tsx
  design-system/
    tokens.css
    base.css
    themes.css
    density.css
```

Bestehende Komponenten werden schrittweise migriert, nicht gleichzeitig vollständig ersetzt.

## 18. Zustandsaufteilung für die UI

### Projektzustand

- Tracks,
- Clips,
- Devices,
- Presets und Edits,
- Mixer,
- Transportdaten,
- Bewertungen,
- Sammlungen.

### Laufzeitzustand

- spielt/nimmt auf,
- aktive Clips,
- AudioContext,
- MIDI-Verbindungen,
- Voice Count,
- Meter.

### UI-Zustand

- Selection,
- geöffnete Panels,
- Browserbreite,
- Detailhöhe,
- aktiver Workspace-Modus,
- Dichtemodus,
- modale Dialoge,
- Drag-Zustand.

### Flüchtiger Preview-Zustand

- vorgehörtes Preset,
- Preview-Zieltrack,
- A/B-Kandidat,
- temporäre Variation.

Diese Zustände dürfen nicht in einem einzigen Store vermischt werden.

## 19. Performanceanforderungen

- Meter-Updates dürfen keine Presetliste oder Device Chain neu rendern.
- Presetliste virtualisieren.
- Store-Selektoren möglichst klein und stabil halten.
- Keine `JSON.stringify`-Abhängigkeiten in React-Effects.
- Keine neue globale Event-Listener-Registrierung pro Render.
- Suche und komplexe Filter debouncen oder memoisiert ableiten.
- Drag-and-drop darf keine komplette Workspace-Neuberechnung auslösen.
- SVG-Icons als Sprite oder kleine Komponenten bündeln.
- Detailpanels bei Bedarf laden.

Zielwerte:

- Interaktion bis sichtbare Reaktion unter 100 ms.
- Presetwechsel bis erste hörbare Reaktion unter 150 ms, sofern Audio-Engine bereit.
- Scrollen mit 60 FPS auf unterstützten Desktopgeräten.
- Metering mit 30 FPS ohne Re-Render des Workspace.
- Keine Layout Shifts beim Öffnen von Devices.
- Initiales JavaScript langfristig unter 150 kB gzip oder funktional sinnvoll aufgeteilt.

## 20. Fehlerprävention

- Track-Löschen mit Undo statt blockierendem Bestätigungsdialog.
- Projektwechsel bei ungespeicherten Änderungen sichtbar absichern.
- Preview und dauerhafte Preset-Zuweisung klar unterscheiden.
- Aufnahme darf nicht unbemerkt auf einem anderen Track laufen.
- Clipping deutlich, aber nicht dauerhaft alarmistisch darstellen.
- Ungültige Presets nicht laden; verständlichen Grund anzeigen.
- MIDI-Verlust während gehaltener Noten löst Note-off/Panic für den betroffenen Eingang aus.
- Leere Filterergebnisse bieten direkte Rücksetzung.
- Alle asynchronen Aktionen haben Loading-, Success- und Error-Zustand.

## 21. Einführungsstrategie

Die neue UI sollte nicht als einmaliger Komplettumbau umgesetzt werden. Empfohlen wird eine vertikale Migration mit funktionsfähigen Zwischenständen.

### Phase UI-0 – Designfundament

Aufwand: 2–3 Tage.

- Design Tokens einführen.
- Reset/Base Styles konsolidieren.
- Primitive Controls für Button, Toggle, Slider, NumberField und Tooltip bauen.
- Icon-System festlegen.
- Fokus-, Hover-, Active-, Disabled- und Error-Zustände definieren.
- Story-/Demo-Seite oder isolierte Komponentenansicht anlegen.

Definition of Done:

- Keine neuen hart codierten Farben in Feature-Komponenten.
- Alle Primitives sind mit Tastatur bedienbar.
- Compact und Comfortable Density funktionieren.

### Phase UI-1 – App Shell und Layout

Aufwand: 3–5 Tage.

- Neue Top Bar.
- Browser, Main Workspace, Detail View und Status Bar als Split-Panes.
- Größen und eingeklappte Zustände speichern.
- Alte Komponenten zunächst in den neuen Bereichen einbetten.
- Responsive Grundstruktur einführen.

Definition of Done:

- Die fünf Hauptbereiche sind räumlich stabil.
- Browser und Detail View lassen sich ein-/ausklappen.
- Kein Inhalt wird bei 1024 × 768 unzugänglich.

### Phase UI-2 – Browser und Audition

Aufwand: 4–6 Tage.

- Hierarchischen Browser bauen.
- Presetliste virtualisieren.
- Suche, Filterchips und Sortierung.
- Preview versus Commit trennen.
- Audition-Shortcuts kontextsensitiv implementieren.
- Bewertung und Favorit direkt in den Audition-Fluss integrieren.

Definition of Done:

- 10.000 Presets bleiben flüssig bedienbar.
- Presets können vorgehört werden, ohne den Trackzustand dauerhaft zu ändern.
- Bewertung per Tastatur überspringt keinen Kandidaten.

### Phase UI-3 – Session View

Aufwand: 1 Woche.

- Track-Spalten und Clip-Slots.
- Auswahl-, Playback-, Recording-, Mute-, Solo- und Arm-Zustände.
- Scene-Spalte.
- Preset-Drop auf Track.
- Clip-Drop zwischen Slots.
- Track-Meter und Mixer-Basics.

Definition of Done:

- Mehrere Tracks und Clips sind visuell und akustisch konsistent.
- Der Nutzer erkennt jederzeit aktive, ausgewählte und aufnehmende Clips.
- Trackoperationen funktionieren vollständig per Tastatur.

### Phase UI-4 – Device View

Aufwand: 1 Woche.

- Device Chain.
- Instrument Device mit acht Makros.
- Engine-spezifische Parametergruppen.
- Kompakte FX-Devices.
- Bypass und Reset.
- Zahleneingabe, Feineinstellung und Standardwert-Wiederherstellung.

Definition of Done:

- Normaler Sounddesign-Workflow benötigt keine permanent geöffneten Großpanels.
- Live-Parameteränderungen sind flüssig und undo-fähig.
- Alle Devices folgen demselben Interaktionsvertrag.

### Phase UI-5 – Clip und Compare View

Aufwand: 1–2 Wochen.

- Clip View und einfache Pianoroll.
- Loop- und Quantisierungssteuerung.
- Aufnahmefluss.
- A/B-Vergleich.
- Variation Grid.
- Bewertung, Tags und Notizen.

Definition of Done:

- Aufnahme bis Clip-Bearbeitung ist ein geschlossener Workflow.
- A/B wechselt atomar zwischen vollständigen Klangzuständen.
- Variationen können ohne versteckte Projektmutation geprüft werden.

### Phase UI-6 – Accessibility und Responsive QA

Aufwand: 4–6 Tage.

- Semantikaudit.
- Vollständige Tastaturprüfung.
- Screenreaderprüfung.
- Kontrast- und Farbschwächeprüfung.
- Touch- und Tabletprüfung.
- Reduced Motion.
- Zoom bis mindestens 200 Prozent.

Definition of Done:

- Kernworkflows erfüllen WCAG 2.2 AA.
- Kein Fokusverlust oder Keyboard Trap.
- Mobile Darstellung verwendet fokussierte Modi statt gequetschtem Desktoplayout.

### Phase UI-7 – Polishing und Usability-Test

Aufwand: 3–5 Tage plus Tests.

- Animationen und Übergänge.
- Statusmeldungen.
- Kontextmenüs.
- Empty States.
- Shortcut-Overlay.
- Onboarding für erste Audioaktivierung, MIDI und Preset-Audition.
- Usability-Tests mit mindestens fünf Nutzern unterschiedlicher Erfahrung.

## 22. Testplan

### Komponenten

- alle Zustände jedes Primitive Controls,
- Track Header,
- Clip Slot,
- Device Shell,
- Preset Row,
- Browserfilter,
- Transport.

### Interaktion

- Keyboardnavigation in Listen und Grids,
- Fokus nach Hinzufügen/Löschen,
- Drag-and-drop,
- Preview/Commit,
- Undo/Redo,
- Panelgrößen,
- responsive Moduswechsel.

### Visuell

- Screenshot-Regression für wichtige Viewportgrößen,
- Compact/Comfortable,
- alle Track- und Clip-Zustände,
- helle oder alternative Themes nur, falls später unterstützt.

### Accessibility

- automatisierte Axe-Prüfung,
- manuelle Tastaturprüfung,
- Screenreader-Smoketest,
- 200-Prozent-Zoom,
- Reduced Motion,
- High Contrast.

### Performance

- 10.000 Presets,
- 32 Tracks mit Clip-Slots als Stresstest,
- 20 sichtbare Devices,
- laufendes Metering,
- schnelles Wechseln von Auswahl und Workspace.

## 23. UX-Metriken

Die Verbesserung wird nicht nur visuell bewertet.

Messbare Ziele:

- Preset finden und dauerhaft zuweisen: unter 20 Sekunden für bekannte Kriterien.
- Nächstes Preset vorhören: eine Tasteneingabe.
- Preset bewerten und weitergehen: eine Tasteneingabe.
- Track muten/solo/armen: eine erkennbare Aktion ohne Kontextwechsel.
- Device-Parameter erreichen: höchstens zwei Interaktionen.
- Neuer Clip vom Aufnahmebeginn bis zur Bearbeitung: ohne manuelle Suche.
- Kein Datenverlust bei Reload.
- Fehlerrate im Kernworkflow unter 2 Prozent in Usability-Tests.
- Mindestens 80 Prozent der Testnutzer erkennen Auswahl, Playback und Recording ohne Erklärung.

## 24. Konkrete Eingriffsflächen

Voraussichtlich ersetzen oder stark verändern:

- `synthlab/src/App.tsx`
- `synthlab/src/App.css`
- `synthlab/src/index.css`
- `synthlab/src/ui/TransportBar.tsx`
- `synthlab/src/ui/TrackList.tsx`
- `synthlab/src/ui/PresetBrowser.tsx`
- `synthlab/src/ui/MacroPanel.tsx`
- `synthlab/src/ui/FxRack.tsx`
- `synthlab/src/ui/ArpPanel.tsx`
- `synthlab/src/ui/PianoKeyboard.tsx`
- `synthlab/src/ui/VariationGrid.tsx`
- `synthlab/src/ui/RatingPanel.tsx`
- `synthlab/src/ui/useKeyboardShortcuts.ts`

Neue Bereiche:

- App Shell und Split-Pane Layout,
- Session View,
- Detail View,
- Device Chain,
- Clip View/Pianoroll,
- Compare View,
- Status- und Toast-System,
- Design-System-Primitives,
- virtuelle Presetliste,
- zentrale Selection,
- Drag-and-drop-Interaktionen.

Nicht als reine UI-Aufgabe lösbar:

- konsistenter Track-/Audiozustand,
- Preview gegenüber dauerhafter Presetzuweisung,
- Undo/Redo,
- Persistenz,
- dynamische Device-Reihenfolge,
- Clip- und Transport-Synchronisierung,
- performante Meterdaten.

Diese Punkte müssen gemeinsam mit der Anwendungs- und Audioarchitektur aus `plan2.md` umgesetzt werden.

## 25. Risiken

### Risiko: Zu frühe visuelle Detailarbeit

Gegenmaßnahme: Zuerst Layout, Auswahlmodell und Workflows stabilisieren; Farben und Animationen danach polieren.

### Risiko: Ableton-Funktionen ohne passende Produktlogik kopieren

Gegenmaßnahme: Jedes Element muss einen konkreten SynthLab-Workflow unterstützen. Nicht benötigte DAW-Funktionen werden nicht übernommen.

### Risiko: Komplettumbau ohne lieferbare Zwischenstände

Gegenmaßnahme: Vertikale Phasen mit funktionsfähiger Anwendung nach jedem Schritt.

### Risiko: Oberfläche wird trotz Redesign wieder überladen

Gegenmaßnahme: Detail View zeigt immer nur den ausgewählten Kontext. Erweiterte Parameter bleiben eingeklappt.

### Risiko: Custom Controls verschlechtern Accessibility

Gegenmaßnahme: Native Elemente bevorzugen oder WAI-ARIA-Patterns vollständig umsetzen und testen.

### Risiko: UI verspricht Funktionen, die der Audio-Layer nicht zuverlässig erfüllt

Gegenmaßnahme: Für jede sichtbare Aktion existiert ein getesteter Command und ein definierter Audiozustand.

## 26. Definition of Done für das gesamte UI/UX-Redesign

Das Redesign ist abgeschlossen, wenn:

- Top Bar, Browser, Workspace, Detail View und Status Bar stabil umgesetzt sind.
- Session View Tracks und Clips konsistent darstellt und steuert.
- Preset Preview und dauerhafte Zuweisung klar getrennt sind.
- Device Chain Instrument und FX verständlich abbildet.
- Bewertung, A/B und Variationen einen geschlossenen Vergleichsworkflow bilden.
- Die Presetliste mit mindestens 10.000 Einträgen flüssig bleibt.
- Metering keine großflächigen React-Re-Renders erzeugt.
- Kernworkflows vollständig per Tastatur möglich sind.
- WCAG 2.2 AA für Kernfunktionen erreicht ist.
- Desktop, Tablet und fokussierte Mobile-Modi funktionieren.
- Jede destruktive Aktion entweder bestätigt oder per Undo wiederherstellbar ist.
- UI-, Projekt- und Audiozustand nie sichtbar auseinanderlaufen.
- Usability-Tests eine deutliche Verbesserung gegenüber der aktuellen Oberfläche zeigen.

## 27. Priorisierte Kurzfassung

Die höchste Wirkung entsteht in dieser Reihenfolge:

1. Stabile Informationsarchitektur mit Top Bar, Browser, Session und Detail View.
2. Eindeutiges Auswahlmodell und konsistenter Track-/Audiozustand.
3. Virtueller Preset-Browser mit Preview/Commit und schnellem Audition-Workflow.
4. Ableton-inspirierte Session View mit Tracks, Clips und Scenes.
5. Kompakte Device Chain statt gleichzeitig sichtbarer Parameterflächen.
6. Spezialisierte Clip- und Compare-Ansichten.
7. Design Tokens, Accessibility, Responsive-Verhalten und Performancepolitur.

Der entscheidende Fortschritt ist nicht eine dunklere Farbe oder ein Ableton-ähnlicher Rahmen. Die drastische Verbesserung entsteht durch eine klare räumliche Hierarchie, kontextsensitive Detailbearbeitung, verlässliche Zustände und extrem kurze Wege zwischen Hören, Entscheiden und Musizieren.
