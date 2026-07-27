# plan8 – Ableton-artiges UX/UI-Gesamtsystem für SynthLab

**Stand:** 2026-07-27  
**Ziel:** SynthLab soll sich in Navigation, Informationsdichte, räumlicher
Logik, Tastaturbedienung und musikalischem Arbeitsfluss so unmittelbar und
verlässlich wie Ableton Live anfühlen, ohne dessen Markengestaltung oder
Oberfläche pixelgenau zu kopieren.

Dieser Plan ergänzt `plan3.md` und `plan7.md`:

- `plan3.md` bleibt die allgemeine UI/UX-Grundlage.
- `plan7.md` bleibt der technische Masterplan für Device Chain und FX-Rack.
- `plan8.md` definiert das übergreifende Bedienmodell der gesamten App.

---

## 1. Referenzprinzipien

Die folgenden Ableton-Live-Prinzipien werden auf SynthLab übertragen:

1. **Zwei komplementäre Hauptansichten**
   - Session für spontanes Starten, Variieren und Performen.
   - Arrangement für lineares Komponieren und Verfeinern.
2. **Konstante räumliche Logik**
   - globale Steuerung oben,
   - Quellen und Suche links,
   - musikalischer Arbeitsbereich in der Mitte,
   - kontextbezogene Details unten,
   - Status und Erklärung am Rand.
3. **Auswahl bestimmt den Kontext**
   - der ausgewählte Track, Clip, Slot oder das ausgewählte Device bestimmt den
     Inhalt der Detailansicht.
4. **Direkte Manipulation**
   - Inhalte werden gezogen, kopiert, dupliziert, verschoben und ersetzt.
5. **Musikalische Aktionen bleiben quantisiert und vorhersehbar**
   - Clip-Launch, Szenen, Aufnahme und Stop folgen klar sichtbaren
     Quantisierungsregeln.
6. **Die App bleibt während des Editierens spielbar**
   - Transport, MIDI-Keyboard und Hardware-MIDI funktionieren unabhängig vom
     aktuell fokussierten UI-Element.
7. **Hohe Dichte, geringe visuelle Lautstärke**
   - viele Informationen sind gleichzeitig verfügbar, aber Farbe wird primär
     für Zustand und Bedeutung eingesetzt.
8. **Tastatur und Maus sind gleichwertig**
   - alle Kernabläufe funktionieren ohne Maus.
9. **Kontextuelle Hilfe statt permanenter Erklärung**
   - die Oberfläche erklärt das aktuell fokussierte Element in einer Info View.
10. **Gefahrlose Exploration**
    - Undo/Redo, Vorschau, Hot-Swap, A/B, Capture und nicht-destruktive
      Bearbeitung fördern Experimentieren.

Aktuelle offizielle Referenzen:

- Session View:
  https://www.ableton.com/en/live-manual/12/session-view/
- Arrangement View:
  https://www.ableton.com/en/live-manual/12/arrangement-view/
- Browser:
  https://www.ableton.com/en/live-manual/12/working-with-the-browser/
- Instrumente und Effekte:
  https://www.ableton.com/en/live-manual/12/working-with-instruments-and-effects/
- Keyboard Shortcuts:
  https://www.ableton.com/en/manual/live-keyboard-shortcuts/
- MIDI- und Key-Mapping:
  https://www.ableton.com/en/live-manual/12/midi-and-key-remote-control/
- Accessibility und Keyboard Navigation:
  https://www.ableton.com/en/live-manual/12/accessibility-and-keyboard-navigation/

---

## 2. Verifizierter Ausgangszustand

### Bereits vorhanden

- globale Transportleiste,
- Preset-Browser,
- Engine-, Rollen-, Favoriten- und Bewertungsfilter,
- virtualisierte Presetliste,
- Slider zur Navigation durch alle gefilterten Presets,
- Mehrspur-Sessionansicht mit vier Clip-Slots pro Spur,
- Track-Auswahl, Mute, Arm und Clip-Launch,
- kontextueller unterer Bereich mit:
  - Device Chain,
  - Clip & Perform,
  - Compare & Rating,
- horizontale Device Chain,
- dauerhaft sichtbare Parameter der vorhandenen FX,
- größenverstellbarer Detailbereich,
- Computer-Keyboard als global spielbares MIDI-Keyboard,
- Hardware-MIDI-Anbindung,
- Statusleiste,
- Hilfe-Overlay,
- zentrale Design Tokens,
- Zustandstrennung über Zustand Stores.

### Wesentliche Lücken

- keine Arrangement View,
- keine globale musikalische Zeitleiste,
- keine Szenenspalte und kein Scene Launch,
- kein globales Launch-Quantization-Modell,
- Transportzustand ist lokaler React-State statt kanonischer Audiozustand,
- kein Back-to-Arrangement-Konzept,
- Browser ist eine flache Filterliste ohne:
  - Kategorien,
  - Collections,
  - Browser-Historie,
  - gespeicherte Suchen,
  - Tag-Facetten,
  - Vorschau,
  - Hot-Swap,
- Auswahlmodell ist noch nicht durchgängig,
- viele Komponenten verwenden Inline-Styles,
- kein konsistentes Kontextmenü,
- kein echtes Undo/Redo,
- keine Automation oder Modulation,
- keine Key-/MIDI-Map-Modi,
- keine Mixeransicht,
- kein Follow- und Overview-System,
- Statusleiste erklärt nicht das Element unter Maus oder Fokus,
- Clip View ist noch kein vollständiger MIDI-Editor,
- keine Mehrfachauswahl,
- keine Drag-and-drop-Workflows zwischen Browser, Tracks, Clips und Devices,
- keine Command Palette,
- kein Projekt-/Set-Lifecycle mit Dirty-State, Save und Recovery,
- keine umfassende Accessibility- und visuelle Regressionstest-Suite.

---

## 3. Zielarchitektur der Oberfläche

```text
┌──────────────────────────── Global Control Bar ─────────────────────────────┐
│ Set · Undo/Redo │ Tempo · Meter · Quantize │ Transport │ CPU/MIDI │ Mapping │
├───────────────┬─────────────────────────────────────────────────────────────┤
│ Browser       │ Session View  ⇄  Arrangement View                          │
│               │                                                             │
│ Collections   │ Tracks / Clips / Scenes / Timeline / Mixer                  │
│ Categories    │                                                             │
│ Filters       │                                                             │
│ Results       │                                                             │
│ Preview       │                                                             │
├───────────────┴─────────────────────────────────────────────────────────────┤
│ Clip View  ⇄  Device View                                      Detail Resize │
├─────────────────────────────────────────────────────────────────────────────┤
│ Info View / Selection Path / Status / Errors / CPU / Latency / MIDI Activity │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Grundregeln

- Die fünf Hauptzonen behalten ihre Position.
- Panels sind ein-/ausblendbar und größenverstellbar.
- Größen und Sichtbarkeit werden gespeichert.
- Ansichtswechsel stoppen niemals Audio.
- Auswahl, Fokus und Wiedergabezustand sind getrennte Konzepte.
- Aktive Wiedergabe wird grün dargestellt.
- Aufnahme wird rot dargestellt.
- Solo wird gelb dargestellt.
- Warnungen werden orange dargestellt.
- Auswahl verwendet eine neutrale Akzentfarbe.
- Trackfarben identifizieren Inhalte, nicht globale Zustände.

---

## 4. Global Control Bar

Die aktuelle `TransportBar.tsx` wird in eine strukturierte Control Bar
umgebaut.

### 4.1 Linker Bereich: Projekt

- Projektname.
- Dirty-Indikator.
- Save.
- Save As.
- Undo.
- Redo.
- Undo-Historie als Dropdown.
- Browser ein-/ausblenden.
- Session/Arrangement-Umschalter.

### 4.2 Musikalischer Kontext

- Tempo:
  - direkte Eingabe,
  - Drag auf Zahlenwert,
  - Tap Tempo,
  - Nudge langsamer/schneller.
- Taktart.
- Global Launch Quantization:
  - None,
  - 1/32,
  - 1/16,
  - 1/8,
  - 1/4,
  - 1/2,
  - 1 Bar,
  - 2 Bars,
  - 4 Bars.
- Metronom.
- Count-in.
- feste oder adaptive Grid-Auflösung.

### 4.3 Transport

- Previous Locator.
- Play.
- Stop.
- Arrangement Record.
- Session Record.
- Loop.
- Punch In.
- Punch Out.
- Follow.
- aktuelle Position in Bars.Beats.Sixteenths.

Der Play-Button erhält einen kanonischen Zustand aus dem AudioController:

```ts
interface TransportState {
  status: "stopped" | "starting" | "playing" | "recording" | "error";
  beat: number;
  bar: number;
  tempo: number;
  loop: LoopRange | null;
  launchQuantization: Quantization;
}
```

Die UI setzt `playing` nicht mehr optimistisch als lokalen Boolean. Sie
abonniert den echten Transportzustand. Fehler beim Starten werden sichtbar und
setzen den Button korrekt zurück.

### 4.4 Rechter Bereich

- Computer MIDI Keyboard.
- aktuelle Oktave und Velocity.
- MIDI-In-Aktivität.
- MIDI-Out-Aktivität.
- Audio Engine Status.
- CPU-/DSP-Last.
- Dropout-Indikator.
- Audio-Latenz.
- Key Map Mode.
- MIDI Map Mode.
- Panic.

### 4.5 Bedienung

- Leertaste: Play/Stop.
- Shift+Leertaste: Fortsetzen ab Stopposition.
- `0`: Auswahl deaktivieren; nicht mehr global „Preset verwerfen“.
- F9: Aufnahme.
- M: Computer MIDI Keyboard.
- Z/X: Keyboard-Oktave.
- C/V: Keyboard-Velocity.
- Alle Shortcuts werden in einer zentralen Command Registry definiert.

---

## 5. Session View

Die Session View wird von einer Kartenansicht zu einem echten Clip-Raster.

### 5.1 Raster

- Spalten sind Tracks.
- Zeilen sind Szenen.
- feste Track-Header oben.
- feste Mixer-/Statusbereiche unten.
- feste Szenenspalte rechts.
- beliebig viele Slots statt fest vier.
- horizontale und vertikale Virtualisierung.
- Track- und Szenengrößen sind anpassbar.
- „Optimize Width“ und „Optimize Height“ passen Inhalte in den Viewport ein.

### 5.2 Clip-Slots

Jeder Slot besitzt klare Zustände:

- empty,
- stopped,
- queued,
- playing,
- recording,
- overdubbing,
- disabled,
- error.

Darstellung:

- Launch-Dreieck links.
- Clipname.
- Fortschrittsanzeige.
- Loop-Indikator.
- Länge.
- Clipfarbe.
- Stop-Button im leeren unteren Bereich der Spur.

Interaktion:

- Einfachklick: auswählen.
- Klick auf Launch: starten.
- Enter: ausgewählten Clip starten.
- Pfeiltasten: Auswahl bewegen.
- Shift+Pfeile: Auswahl erweitern.
- Doppelclick: Clip View öffnen.
- `0`: Clip deaktivieren.
- Delete: Clip entfernen.
- Ctrl/Cmd+D: duplizieren.
- Ctrl/Cmd+C/V/X: kopieren, einfügen, ausschneiden.
- Drag: verschieben.
- Ctrl/Cmd+Drag: kopieren.
- Alt/Option+Drag: alternative Duplikation nach Plattformkonvention.

### 5.3 Szenen

- Szenenname.
- Launch-Button.
- optionale Tempoangabe.
- optionale Taktart.
- optionale Follow Action.
- Scene Stop.
- Add Scene.
- Duplicate Scene.
- Capture and Insert Scene.

Scene Launch startet alle belegten Slots einer Zeile quantisiert. Die aktuell
laufende Szene ist eindeutig sichtbar.

### 5.4 Clip Launch

Pro Clip:

- Launch Mode:
  - Trigger,
  - Gate,
  - Toggle,
  - Repeat.
- Quantization:
  - Global oder Override.
- Legato.
- Follow Action.
- Follow Time.
- Chance.

Queued Clips zeigen den Zeitpunkt bis zum Start. Der Nutzer sieht dadurch
immer, ob ein Klick angenommen wurde.

### 5.5 Session Capture

- Session Record schreibt Clip-Launches, Device-Änderungen, Mixerbewegungen und
  Tempoänderungen in die Arrangement View.
- Capture MIDI stellt zuletzt gespieltes, noch nicht aufgenommenes MIDI als Clip
  wieder her.
- Capture Scene erzeugt aus aktuell laufenden Clips eine neue Szene.

---

## 6. Arrangement View

### 6.1 Grundstruktur

- lineare Timeline in Bars.Beats.Sixteenths,
- Tracks vertikal,
- Clip-Lanes horizontal,
- Overview/Minimap über der Timeline,
- Playhead,
- Loop Brace,
- Locators,
- Time Selection,
- Grid,
- Track-Header links,
- optionaler Mixer rechts oder unter den Track-Headern.

### 6.2 Navigation

- Mausrad: vertikal scrollen.
- Shift+Mausrad: horizontal scrollen.
- Ctrl/Cmd+Mausrad: um Mausposition zoomen.
- Alt/Option+Mausrad: Trackhöhe.
- `+`/`-`: Zoom.
- Z: Auswahl vollständig zoomen.
- X: vorherige Zoomstufe.
- H: Trackhöhen optimieren.
- W: Breite optimieren.
- Follow folgt dem Playhead und pausiert bei manueller Navigation.
- Doppelklick auf Overview zeigt das gesamte Arrangement.

### 6.3 Clip-Editing

- Drag zum Verschieben.
- Ziehen an Kanten zum Trimmen.
- Loop-Griff.
- Fade-Griffe für Audio.
- Slip Editing.
- Split.
- Consolidate.
- Duplicate Time.
- Insert Silence.
- Reverse.
- Quantize.
- Nudge.

### 6.4 Session/Arrangement-Beziehung

- Session-Clip und Arrangement-Clip derselben Spur sind gegenseitig exklusiv.
- Startet ein Session-Clip, zeigt die Spur „Session Override“.
- Ein globaler „Back to Arrangement“-Button erscheint.
- Der Zustand wird pro Spur kenntlich gemacht.
- Ansichtswechsel verändert nur die UI, nicht die Wiedergabe.

---

## 7. Browser

Der Browser wird zum zentralen Ort für Presets, Engines, FX, Rack-Presets,
Clips, Collections und Nutzerdaten.

### 7.1 Drei Bereiche

1. **Sidebar**
   - Collections,
   - Library,
   - Engines,
   - Instruments,
   - Audio Effects,
   - Rack Presets,
   - Clips,
   - User Presets,
   - Imports.
2. **Filter View**
   - dynamische Facetten und Tags.
3. **Content View**
   - virtualisierte Ergebnisse.

### 7.2 Suche

- sofortige Suche.
- Name, Tag, Engine, Rolle, Herkunft, Bank, Notiz und Modulinhalt.
- Token-Syntax:
  - `engine:dx7`
  - `role:pad`
  - `tag:warm`
  - `rating:>=4`
  - `is:favorite`
  - `source:import`
  - `fx:cloudseed`
- Suchvorschläge.
- zuletzt verwendete Suchen.
- gespeicherte Suchen.
- Suchverlauf mit Vor/Zurück.
- Escape leert erst Suche, dann schließt Browser.

### 7.3 Filtergruppen

- Type.
- Engine.
- Role.
- Character.
- Articulation.
- Source.
- Bank.
- Rating.
- Favorite.
- CPU Class.
- Availability.
- FX Modules.

Mehrere Werte innerhalb einer Gruppe sind OR-verknüpft. Unterschiedliche
Gruppen sind AND-verknüpft. Aktive Filter erscheinen als entfernbare Chips.
Trefferzahlen werden vor Auswahl angezeigt.

### 7.4 Rollen

Alle Rollen erhalten verständliche Anzeigenamen, Icons, Beschreibung und
Trefferzahl:

- Drone,
- Pad,
- Bass,
- Melody,
- Arp,
- Rhythm,
- Pluck,
- Bell,
- FX,
- Chord,
- Synth,
- Texture,
- Stress.

Die technische ID bleibt englisch und stabil. Die UI kann lokalisiert werden.

### 7.5 Collections

- sieben frei benennbare Farb-Collections.
- mehrere Collections pro Element.
- Zuweisung über 1–7.
- `0` entfernt Collection-Zuweisungen.
- Mehrfachauswahl unterstützt Batch-Zuweisung.
- Farben erscheinen als kleine Quadrate, nicht als vollflächiger Hintergrund.

### 7.6 Preview und Audition

- Headphone-Button.
- Auto Preview.
- Lautstärke.
- Mono/Stereo.
- Preview über ausgewählten Track oder separaten Preview-Bus.
- Preset-Audition mit aktuell gewählter Phrase.
- Pfeiltasten wechseln Ergebnis.
- Enter lädt.
- Escape kehrt zum vorherigen Sound zurück.
- Vorschau verändert das Projekt nicht.

### 7.7 Hot-Swap

- Q aktiviert Hot-Swap für ausgewähltes Instrument, FX-Modul oder Rack.
- Browser filtert automatisch auf kompatible Inhalte.
- Pfeiltasten auditionieren Alternativen.
- Enter übernimmt.
- Escape stellt Ausgangszustand wieder her.
- Browser zeigt den Zielpfad, etwa:
  `Track 2 > Device Chain > Reverb`.

### 7.8 Similarity und Zufall

- „Ähnliche Presets“ anhand Audio-Metriken, Engine, Tags und Makros.
- Next/Previous Similar.
- Save as Similarity Reference.
- kontrollierter Randomize-Befehl mit Seed.
- Suchergebnis kann nach Similarity, Rating, Name, Neuheit oder CPU sortiert
  werden.

---

## 8. Auswahl- und Fokusmodell

### 8.1 Kanonische Auswahl

```ts
type Selection =
  | { kind: "track"; trackIds: string[]; anchorId: string }
  | { kind: "scene"; sceneIds: string[]; anchorId: string }
  | { kind: "clip"; clipIds: string[]; anchorId: string }
  | { kind: "time"; startBeat: number; endBeat: number; trackIds: string[] }
  | { kind: "device"; trackId: string; slotIds: string[]; anchorId: string }
  | { kind: "parameter"; trackId: string; slotId: string; paramId: string }
  | { kind: "browser"; itemIds: string[]; anchorId: string };
```

### 8.2 Regeln

- Einfachklick setzt Auswahl.
- Ctrl/Cmd+Klick toggelt Element.
- Shift+Klick erweitert Bereich.
- Klick in leere Fläche leert Auswahl der Zone.
- Fokus ist sichtbar, aber nicht mit Auswahl identisch.
- Wiedergabe ist nicht mit Auswahl identisch.
- Detail View folgt Auswahl.
- Auswahl bleibt bei View-Wechsel erhalten, sofern das Objekt existiert.
- Delete, Duplicate, Copy und Context Menu arbeiten immer auf der kanonischen
  Auswahl.

### 8.3 Fokusbereiche

- Control Bar.
- Browser Sidebar.
- Browser Filter.
- Browser Results.
- Session/Arrangement.
- Detail View.
- Info View.

Ein Command kann Fokus gezielt in jeden Bereich bewegen. Fokuswechsel darf
keine Note stoppen und keine Auswahl ungewollt ändern.

---

## 9. Detail View

### 9.1 Clip/Device-Dualität

- Shift+Tab beziehungsweise F12 wechselt zwischen Clip und Device.
- Doppelklick auf Clip öffnet Clip View.
- Doppelklick auf Device öffnet Device View.
- Beide können optional gleichzeitig sichtbar sein.
- Höhen bleiben pro Modus gespeichert.

### 9.2 Device View

Die Umsetzung folgt `plan7.md`:

- horizontale Chain,
- Instrument links,
- FX-Slots,
- Output rechts,
- alle Parameter sichtbar,
- Drag-Reorder,
- Insert,
- Remove,
- Replace,
- Duplicate,
- Bypass,
- Rack-Presets,
- Minimap,
- Undo/Redo.

Zusätzliche Ableton-artige Muster:

- Device Activator links oben.
- Device-Titelbereich als Drag Handle.
- Save Preset.
- Hot-Swap.
- Device Fold nur als kompakter Chain-Modus; die Parameteransicht selbst bleibt
  gemäß Nutzeranforderung vollständig sichtbar.
- Parameter mit Automation zeigen farbigen Punkt.
- Parameter mit Modulation zeigen separaten Modulationsring.
- veränderter Wert zeigt „Back to Default“ im Kontextmenü.
- Parameter kann auf Macro, MIDI oder Key gemappt werden.

### 9.3 Clip View

Der aktuelle Arpeggiator-/Keyboard-Bereich wird ein vollständiger MIDI-Clip-
Editor:

- Pianoroll.
- Loop Brace.
- Start-/Endmarker.
- Velocity Lane.
- Probability Lane.
- Chance.
- Mute Notes.
- Fold.
- Scale Mode.
- Quantize.
- Legato.
- Duplicate Loop.
- Reverse.
- Humanize.
- Note Preview.
- Multi-Note Editing.

Arpeggiator und Performance Keyboard werden eigene Devices beziehungsweise
Panels und ersetzen nicht den Clip-Editor.

---

## 10. Mixer

### Pro Track

- Volume.
- Pan.
- Mute.
- Solo.
- Arm.
- Monitor:
  - In,
  - Auto,
  - Off.
- Input Routing.
- Output Routing.
- Sends.
- Peak Meter.
- Clipping.
- Track Delay.
- Crossfader Assignment.

### Master

- Master Volume.
- Cue Volume.
- Main Meter.
- Tempo Follower Status.
- Stop All Clips.
- Global Solo Clear.
- Global Arm Clear.

### UX

- Mixer kann in Session und Arrangement eingeblendet werden.
- Controls lassen sich je Ansicht konfigurieren.
- Doppelklick setzt Standardwert.
- Shift erlaubt Feineinstellung.
- Direkte Zahleneingabe.
- Peakwerte bleiben kurz stehen.
- Klick auf Clip-Indikator löscht Peak.

---

## 11. Automation und Modulation

### 11.1 Automation

- Automation Mode.
- Parameter-Picker.
- Breakpoints.
- Draw Mode.
- Kurvensegmente.
- Copy/Paste.
- Lock Envelopes.
- Re-enable Automation.
- Automation Arm.
- Session Automation Recording.

### 11.2 Modulation

- Clip-Modulation relativ zum automatisierten Wert.
- separate visuelle Darstellung.
- Modulationsbereich je Parameter.
- LFO-/Envelope-/Random-Modulatoren.
- mehrere Ziele pro Modulator.

### 11.3 Parameterfeedback

Jeder automatisierbare Parameter zeigt:

- aktuellen Wert,
- Basiswert,
- Automation,
- Modulation,
- Mapping,
- Override-Zustand.

---

## 12. Key Map und MIDI Map

### 12.1 Mapping Mode

- Ctrl/Cmd+K: Key Map.
- Ctrl/Cmd+M: MIDI Map.
- mappbare Controls werden farbig hervorgehoben.
- Klick auf Control und anschließende Taste/MIDI-Bewegung erstellt Mapping.
- Escape beendet ohne Änderung.

### 12.2 Mapping Browser

Pro Mapping:

- Quelle.
- Zielpfad.
- Parameter.
- Minimum.
- Maximum.
- Invert.
- Mode:
  - Absolute,
  - Relative,
  - Toggle,
  - Momentary.
- Delete.

### 12.3 Instant Mapping

- ausgewähltes Device bietet automatisch acht wichtigste Parameter.
- Macro Controls besitzen stabile Mapping-Reihenfolge.
- Hardwarecontroller können Track- und Device-Bänke wechseln.

---

## 13. Command System und Tastatur

Alle Befehle werden zentral registriert:

```ts
interface Command {
  id: string;
  label: string;
  category: string;
  shortcuts: Shortcut[];
  enabled(ctx: CommandContext): boolean;
  execute(ctx: CommandContext): void;
}
```

### Vorteile

- keine verstreuten Keydown-Switches,
- Konflikte werden erkannt,
- Hilfe generiert sich aus Registry,
- Command Palette verwendet dieselben Befehle,
- Menüs zeigen Shortcuts automatisch,
- Plattformunterschiede sind zentral.

### Command Palette

- Ctrl/Cmd+K oder eigener konfliktfreier Shortcut.
- Suche nach jeder Aktion.
- Anzeige von Shortcut und Kontext.
- zuletzt verwendete Befehle.
- Aktionen auf Auswahl.
- Navigation zu Ansichten.

### Keyboard-Grundsätze

- Computer MIDI Keyboard hat Priorität für Notentasten.
- normale Einbuchstabenbefehle bleiben mit Shift erreichbar.
- Note-on/off funktioniert unabhängig vom Fokus.
- Escape folgt einer klaren Hierarchie:
  1. Drag abbrechen,
  2. Popup schließen,
  3. Hot-Swap abbrechen,
  4. Suche leeren,
  5. Auswahl reduzieren.
- Tab wechselt Session/Arrangement, wenn Fokusnavigation deaktiviert ist.
- Shift+Tab wechselt Clip/Device.
- optionaler Accessibility-Modus verwendet Tab zur Fokusnavigation.

---

## 14. Undo, Redo und gefahrlose Exploration

### 14.1 Command History

Undo-fähig:

- Parameteränderung.
- Preset laden.
- Clip erstellen/löschen/verschieben.
- Track erstellen/löschen.
- Device einfügen/löschen/verschieben.
- Rack ändern.
- Mixeränderung.
- Automation.
- Mapping.
- Bewertung und Collection-Zuweisung.

Kontinuierliche Reglerbewegungen werden zu einer Aktion zusammengefasst.

### 14.2 Recovery

- Auto-Save.
- Crash-Recovery.
- letzter stabiler Audiozustand.
- Recovery-Snapshot vor Datenmigration.
- Dirty-State.
- Restore-Banner nach unerwartetem Ende.

### 14.3 Capture

- Capture MIDI.
- Capture Scene.
- Capture Variation.
- „Revert to loaded preset“.
- A/B Snapshot.
- Compare History.

---

## 15. Kontextmenüs

Rechtsklick beziehungsweise Shift+F10 zeigt nur passende Aktionen.

### Track

- Rename.
- Duplicate.
- Delete.
- Freeze.
- Flatten.
- Group.
- Color.
- Save Default.

### Clip

- Launch.
- Stop.
- Duplicate.
- Delete.
- Rename.
- Color.
- Quantize.
- Consolidate.
- Convert.

### Device

- Bypass.
- Reset.
- Duplicate.
- Delete.
- Group to Rack.
- Save Preset.
- Hot-Swap.
- Map.
- Show Automation.

### Parameter

- Set Value.
- Reset to Default.
- Copy Value.
- Paste Value.
- Map to Macro.
- MIDI Map.
- Key Map.
- Show Automation.
- Delete Automation.

---

## 16. Info View, Status und Feedback

### 16.1 Info View

Die unterste Leiste erklärt das Element unter Maus oder Tastaturfokus:

- Name.
- kurze Funktion.
- Wertebereich.
- aktueller Wert.
- Shortcut.
- mögliche Modifier.
- Fehler oder Einschränkung.

Sie ersetzt viele permanente Labels und reduziert visuelle Unruhe.

### 16.2 Breadcrumb

Beispiel:

`Track 2 > Device Chain > CloudSeed > Diffusion Feedback`

Der Pfad ist klickbar und zeigt Auswahlkontext.

### 16.3 Toasts

- kurz,
- nicht modal,
- stapelbar,
- mit Undo-Aktion,
- nach Wichtigkeit gefärbt.

### 16.4 Fehler

- Fehler erscheinen am Ort der Ursache.
- Audiofehler zeigen Recovery-Aktion.
- fehlende Worklets erklären Ursache.
- nicht verfügbare Engine bleibt sichtbar, aber deaktiviert.
- Panic bestätigt Anzahl gestoppter Stimmen.

---

## 17. Visuelles Designsystem

### 17.1 Farbdisziplin

- neutrale graue Oberflächen.
- geringe Kontrastabstände zwischen Ebenen.
- Akzentfarbe für Auswahl.
- Grün ausschließlich für Wiedergabe/Signal.
- Rot für Aufnahme/Clipping/destruktive Bestätigung.
- Gelb für Solo.
- Orange für Warnung.
- Trackfarben sparsam auf Header, Clip und kleine Indikatoren.

### 17.2 Dichte

Drei Modi:

- Compact.
- Standard.
- Touch.

Änderbar global und pro kritischem Panel. Keine Information verschwindet
ersatzlos; sie wird lediglich anders angeordnet.

### 17.3 Typografie

- UI: systemnahe Sans.
- Zeit, Tempo, Pegel, Parameterwerte: tabellarische Ziffern.
- klare Hierarchie aus 10, 11, 12, 13 und 15 px.
- keine unnötigen Großbuchstaben für Fließlabels.

### 17.4 Icons

- konsistentes SVG-Set.
- keine Emoji als produktive Icons.
- Icons besitzen sichtbaren Tooltip und zugänglichen Namen.
- Zustand ist nie ausschließlich durch Iconform erkennbar.

### 17.5 Motion

- 80–150 ms für Hover und Panelzustände.
- keine Animation des Playheads.
- Graphwechsel nach `plan7.md` mit Audio-Crossfade, nicht nur UI-Animation.
- `prefers-reduced-motion` wird respektiert.

---

## 18. Panel- und Fensterverwaltung

- Browser ein-/ausblenden.
- Filter View ein-/ausblenden.
- Detail View ein-/ausblenden.
- Clip und Device gleichzeitig anzeigen.
- Mixer ein-/ausblenden.
- Overview ein-/ausblenden.
- Info View ein-/ausblenden.
- Panels über Splitter skalieren.
- Doppelklick auf Splitter setzt Standardgröße.
- Größen werden gespeichert.
- „Focus Mode“ maximiert aktuelles Panel.
- zweites Browserfenster als spätere Desktop-/PWA-Option.

---

## 19. Accessibility

- vollständige semantische Rollen.
- sichtbarer Fokus.
- logische Fokusreihenfolge.
- Skip Links zwischen Hauptzonen.
- Screenreader-Namen für Clips, Slots, Tracks und Devices.
- Live Regions für:
  - Clip queued,
  - Clip playing,
  - Aufnahme,
  - Preset geladen,
  - Fehler.
- Parameterwerte mit `aria-valuetext`.
- kein Drag-only-Workflow.
- alle Reorder-Aktionen per Tastatur.
- Mindestkontrast WCAG AA.
- High-Contrast-Theme.
- farbenblindheitsfreundliche Zustände.
- Zoom bis 200 Prozent.
- Touch-Ziele im Touch-Modus mindestens 40 px.
- Betriebssystem-Einstellungen für Reduced Motion.

---

## 20. Responsive Strategie

### Ab 1600 px

- Browser, Filter View, Session/Arrangement, Mixer und Detail gleichzeitig.
- Device Chain mit Standarddichte.

### 1200–1599 px

- Browser-Filter einklappbar.
- Mixer optional.
- Device Chain horizontal scrollbar.

### 900–1199 px

- Browser als Overlay oder schmaler Modus.
- Compact-Dichte.
- Mixer als umschaltbares Panel.
- Session Trackbreite reduziert.

### Unter 900 px

- Fokus auf Performance und Preset-Audition.
- ein Hauptpanel gleichzeitig.
- feste View Switcher.
- keine inhaltlich unvollständige Miniatur-DAW vortäuschen.

---

## 21. Zustandsarchitektur

### Project Store

- Tracks.
- Scenes.
- Clips.
- Arrangement.
- Devices.
- Mixer.
- Automation.
- Mappings.
- Project Metadata.

### Runtime Store

- Transport.
- queued/playing clips.
- recording.
- meters.
- MIDI activity.
- CPU.
- latency.
- engine availability.

### UI Store

- active main view.
- visible panels.
- panel sizes.
- focus zone.
- selection.
- browser history.
- open popovers.
- density.
- follow.
- zoom.

### Command History Store

- undo stack.
- redo stack.
- transactions.
- merge policy.
- dirty state.

Persistenter Projektzustand und flüchtiger Laufzeitzustand werden strikt
getrennt.

---

## 22. Komponentenstruktur

```text
ui/
  shell/
    AppShell.tsx
    ControlBar.tsx
    PanelLayout.tsx
    Splitter.tsx
    InfoView.tsx
    StatusCenter.tsx
  browser/
    Browser.tsx
    BrowserSidebar.tsx
    BrowserHistory.tsx
    BrowserSearch.tsx
    BrowserFilterView.tsx
    BrowserResults.tsx
    BrowserPreview.tsx
    CollectionLabels.tsx
  session/
    SessionView.tsx
    SessionGrid.tsx
    TrackHeader.tsx
    ClipSlot.tsx
    SceneColumn.tsx
    SessionMixer.tsx
  arrangement/
    ArrangementView.tsx
    ArrangementOverview.tsx
    TimelineRuler.tsx
    TrackLane.tsx
    ArrangementClip.tsx
    AutomationLane.tsx
  detail/
    DetailView.tsx
    ClipView.tsx
    DeviceView.tsx
  mixer/
    Mixer.tsx
    ChannelStrip.tsx
    Meter.tsx
  mapping/
    MappingModeOverlay.tsx
    MappingBrowser.tsx
  commands/
    CommandPalette.tsx
    ContextMenu.tsx
```

Inline-Styles werden schrittweise durch Komponentenklassen und Tokens ersetzt.

---

## 23. Performancebudgets

- App-Shell Interaktion: 60 FPS.
- sichtbare Reaktion auf Eingabe: unter 50 ms.
- Audio-Parameter bis hörbare Änderung: unter 20 ms.
- Session Grid mit 100 Tracks × 100 Scenes bleibt navigierbar.
- Arrangement mit 10.000 Clips bleibt scrollbar.
- Browser mit 10.000 Einträgen bleibt virtualisiert.
- kein kompletter App-Render bei Meterupdates.
- Meterupdates über getrennten Store oder Animation Frame.
- schwere Editoren werden lazy geladen.
- Initialbundle unter 500 kB gzip.
- Browser-, Arrangement- und Device-Chunks getrennt.
- AudioWorklets nie durch React-Render blockiert.

---

## 24. Teststrategie

### Unit

- Commands.
- Selection Reducer.
- Browser Query Parser.
- Filterlogik.
- Quantization.
- Clip Launch State Machine.
- Transport State Machine.
- Undo Transactions.
- Panel Persistence.

### Komponenten

- Control Bar.
- Clip Slot.
- Scene Row.
- Browser Filter.
- Preview.
- Hot-Swap.
- Detail Switcher.
- Mapping Mode.
- Info View.

### Integration

- Browser-Preset auf Track ziehen.
- FX auf Device Chain ziehen.
- Clip starten und quantisiert wechseln.
- Szene starten.
- Session in Arrangement aufnehmen.
- Back to Arrangement.
- Parameter automatisieren.
- Undo/Redo über mehrere Bereiche.
- Hot-Swap übernehmen und abbrechen.
- MIDI Mapping erstellen.
- Computer Keyboard bei jedem Fokuszustand spielen.

### End-to-End

1. Projekt öffnen.
2. Preset suchen.
3. Vorhören.
4. Auf Track laden.
5. Clip aufnehmen.
6. Szene duplizieren.
7. Session performen.
8. Performance in Arrangement aufnehmen.
9. Automation editieren.
10. Projekt speichern und neu laden.

### Accessibility

- axe.
- Tastatur-only.
- Screenreader-Smoke-Test.
- 200-Prozent-Zoom.
- High Contrast.
- Reduced Motion.
- Touch Mode.

### Visuell

- 900, 1200, 1440, 1920 und 4K.
- Compact, Standard und Touch.
- Session, Arrangement, Browser, Device, Clip und Mapping.
- alle Zustände von Clip, Track und Transport.

---

## 25. UX-Metriken

- Zeit von App-Start bis erster Ton.
- Zeit von Suchbeginn bis Preset geladen.
- Klicks für:
  - Clip starten,
  - Szene starten,
  - FX ersetzen,
  - Automation anzeigen,
  - Mapping erstellen.
- Undo-Erfolgsrate.
- Preset-Audition-Abbruchrate.
- Fehlstarts beim Clip Launch.
- Fokusverlust beim Keyboardspiel.
- Anzahl versteckter notwendiger Funktionen.
- Frame Time bei Session und Arrangement.
- subjektive Bewertung:
  - schnell,
  - vorhersehbar,
  - musikalisch,
  - nicht überladen.

---

## 26. Umsetzungsphasen

### UI8-0 – State und Commands

- kanonischer Transport Store.
- zentrale Selection.
- Command Registry.
- echtes Undo/Redo.
- Panel Persistence.
- Tests für State Machines.

### UI8-1 – App Shell und Control Bar

- Control Bar neu strukturieren.
- Session/Arrangement-Schalter.
- kanonischer Transport.
- CPU, MIDI, Latenz.
- Info View.
- Emoji durch SVG ersetzen.

### UI8-2 – Browser

- Sidebar.
- Collections.
- Filter View.
- Query-Syntax.
- History.
- Saved Searches.
- Preview.
- Hot-Swap.
- Similarity.

### UI8-3 – Session View

- echtes Raster.
- beliebige Szenen.
- Szenenspalte.
- Launch Quantization.
- Clip State Machine.
- Mehrfachauswahl.
- Drag-and-drop.
- Session Record.

### UI8-4 – Arrangement View

- Timeline.
- Overview.
- Track Lanes.
- Clip Editing.
- Zoom/Follow.
- Locators.
- Session Override.
- Back to Arrangement.

### UI8-5 – Detail und Mixer

- Clip/Device-Dualität.
- MIDI Editor.
- Mixer.
- vollständige Device Chain aus `plan7.md`.
- Context Menus.

### UI8-6 – Automation und Mapping

- Automation Lanes.
- Modulation.
- Key Map.
- MIDI Map.
- Mapping Browser.

### UI8-7 – Accessibility und Polishing

- Keyboard Navigation.
- Screenreader.
- High Contrast.
- Dichte-Modi.
- Responsive.
- Visual Regression.
- Performancebudgets.

---

## 27. Empfohlene Commit-Grenzen

1. `Add canonical transport selection and command stores`
2. `Rebuild global control bar and info view`
3. `Add browser sidebar collections and filter facets`
4. `Add browser preview history and hot swap`
5. `Rebuild session view as virtualized clip grid`
6. `Add scenes launch quantization and session capture`
7. `Add arrangement timeline overview and track lanes`
8. `Add arrangement clip editing and back to arrangement`
9. `Add mixer and contextual clip device views`
10. `Add automation modulation and mapping modes`
11. `Complete keyboard accessibility and responsive modes`
12. `Complete UX tests performance budgets and documentation`

Nach jedem Commit:

- Build.
- Lint.
- Unit Tests.
- relevante Integrationstests.
- visueller Browser-Smoke-Test.
- Push nur bei grünem Stand.

---

## 28. Priorität

### P0 – Fundament

- Transportzustand.
- Selection.
- Commands.
- Undo/Redo.
- Panel Layout.

### P1 – Größter unmittelbarer UX-Gewinn

- Control Bar.
- Browser.
- Info View.
- Session Grid.
- Szenen.
- Quantization.

### P2 – DAW-Workflow

- Arrangement.
- Mixer.
- vollständiger Clip Editor.
- Session Capture.

### P3 – Power User

- Automation.
- Mapping.
- Hot-Swap.
- Similarity.
- Command Palette.

### P4 – Reife

- Accessibility.
- Responsive.
- Performance.
- Recovery.
- Dokumentation.

---

## 29. Definition of Done

Plan8 ist abgeschlossen, wenn:

- Session und Arrangement echte komplementäre Ansichten sind;
- Audio beim Ansichtswechsel unverändert weiterläuft;
- der Transportzustand direkt aus der Audio Engine stammt;
- Clip- und Szenenstarts quantisiert, sichtbar queued und vorhersehbar sind;
- Session-Performances in das Arrangement aufgenommen werden können;
- Session Override und Back to Arrangement funktionieren;
- der Browser Collections, Facetten, History, Saved Searches, Preview und
  Hot-Swap besitzt;
- Auswahl, Fokus und Wiedergabe appweit konsistent getrennt sind;
- alle Kernaktionen Undo/Redo unterstützen;
- Clip und Device View kontextuell der Auswahl folgen;
- die Device Chain `plan7.md` erfüllt;
- ein vollständiger MIDI-Clip-Editor vorhanden ist;
- Mixer, Automation und Modulation funktionieren;
- Key- und MIDI-Mapping vorhanden sind;
- die Info View jedes fokussierte Bedienelement erklärt;
- Computer- und Hardware-MIDI unabhängig vom UI-Fokus spielen;
- alle Kernworkflows ausschließlich per Tastatur bedienbar sind;
- die App bei 200-Prozent-Zoom und mit Screenreader nutzbar ist;
- die definierten Performancebudgets eingehalten werden;
- Build, Lint, Unit-, Integration-, End-to-End-, Accessibility- und visuelle
  Regressionstests grün sind;
- die Oberfläche funktional an Ableton Lives Arbeitsfluss erinnert, aber eine
  eigenständige SynthLab-Identität behält.

---

## 30. Abgrenzung

Dieser Plan übernimmt Abletons bewährte Interaktionsprinzipien, nicht dessen
geschützte Assets, Icons, Texte oder exaktes visuelles Erscheinungsbild.
SynthLab behält:

- eigene Farbwerte,
- eigenes Iconset,
- eigene Typografie,
- eigene Komponenten,
- eigene Engine- und Presetlogik,
- eigene Produktidentität.

Die Priorität liegt auf dem Gefühl von Direktheit, musikalischer
Vorhersehbarkeit, räumlicher Konsistenz und schneller Tastaturbedienung.
