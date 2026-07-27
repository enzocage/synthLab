# Plan 12 – Top-Right Parameter Inspector, Maximierbare Synth-Vorschau & Custom Preset-Speicherung

**Projekt:** SynthLab / Ambient Musikmaschine (`ambient2`)  
**Ziel:** Implementierung einer vollwertigen, dynamischen Parameter-Inspektionsleiste oben rechts für jeden Synthesizer inkl. maximierbarem Vorschaubild (Lightbox), Live-Variationsreglern für alle Engine-spezifischen Parameter und der Möglichkeit, modifizierte Sounds als neue eigene Presets dauerhaft in IndexedDB abzuspeichern.  
**Datum:** 27. Juli 2026  
**Status:** Ausführlicher Architektur- & Umsetzungsplan  

---

## 1. Übersicht & Zielsetzung

Mit **Plan 12** wird die Bedienoberfläche von SynthLab um ein zentrales Steuerelement erweitert:
1. **Top-Right Parameter Inspector (`SynthParameterInspector.tsx`)**:
   - Zeigt für jede der **23 Synthesizer-Engines** automatisch deren vollständiges Parameterschema (`ParamSpec[]`) an.
   - Sortiert die Regler in übersichtliche Funktionsgruppen (*Oscillators, Filter, Envelopes, Modulation, Engine-Specials*).
   - Erlaubt die stufenlose Live-Modulation aller Parameter mit numerischer Wertanzeige und Einheit (Hz, s, %, dB).
2. **Maximierbare Synth-Vorschau im Eck (`SynthPreviewBox.tsx`)**:
   - Platziert im oberen rechten Eck ein kompaktes Vorschaubild des ausgewählten Synthesizers (aus `gfx/1.png` bis `gfx/22.png` via `getSynthPicture(engineId)`).
   - Bei Klick / Hover öffnet sich ein hochauflösendes **Lightbox-Modal**, das das komplette Synthesizer-Render, historische/technische Hintergrundinfos, Synthese-Paradigma und Datenquellen anzeigt.
3. **Preset-Variation & Speichern als neues Preset (`PresetSaveModal.tsx`)**:
   - Erkennt automatisch Änderungen an Parametern im Vergleich zum Ursprungspreset (*"Dirty State"*).
   - Bietet einen prominenten Button **"Als neues Preset speichern"**.
   - Öffnet ein Eingabefenster für Preset-Name, Autor, Kategorie (Bass, Lead, Pad, Arp, Drone, FX), Tags und Notizen.
   - Speichert das Preset dauerhaft in **IndexedDB (`dexie`)**, so dass es in allen Browser-Sitzungen erhalten bleibt und im `PresetBrowser` filterbar ist.

---

## 2. Komponenten- & Architekturdesign

```
+-----------------------------------------------------------------------------------+
|  SYNTHLAB HEADER & PERFORMANCE BAR                                                |
+--------------------------------------------------+--------------------------------+
| MAIN WORKSPACE / CLIP / SEQUENCER                | TOP-RIGHT INSPECTOR PANEL      |
|                                                  | +----------------------------+ |
|                                                  | | PREVIEW CORNER   [ [MAX] ] | |
|                                                  | | (gfx/1.png..22.png)        | |
|                                                  | +----------------------------+ |
|                                                  | | ENGINE PARAMETERS          | |
|                                                  | | Osc Freq: [====|===] 440Hz | |
|                                                  | | Cutoff:   [======|=] 2.4k | |
|                                                  | | Resonance:[==|-----] 0.35  | |
|                                                  | | Attack:   [=|------] 0.02s | |
|                                                  | +----------------------------+ |
|                                                  | | [ Reset ]  [ SAVE NEW... ] | |
+--------------------------------------------------+--------------------------------+
```

---

## 3. Detaillierte Modul-Spezifikation

### Component A: `SynthPreviewBox.tsx` (Vorschaubild im Eck mit Lightbox)
- **Position:** Oben rechts im Parameter-Header.
- **Features:**
  - Standardgröße: ca. 120×68px (16:9), mit elegantem Abrundungs-Border (`borderRadius: 6px`) und subtle Rim Light Hover Effect.
  - Badge mit der `engineId` und dem visuellen Typen-Tag (z.B. `"VA-POLY"`, `"DX7-6OP"`, `"SID-CHIP"`).
  - Maximier-Button (`[ ↗ ]` / Maximize Icon): Öffnet `SynthLightboxModal.tsx`.
  - Lightbox: Visualisiert das Render in 1920×1080 Full-Screen, inkl. Technischer Datenblatt-Informationen aus `synthpics.md` / `ATTRIBUTION.md`.

### Component B: `SynthParameterInspector.tsx` (Parameter-Inspektor)
- **Dynamisches Rendering:**
  - Greift auf `getEngine(preset.engine).parameters` zu (`ParamSpec[]`).
  - Unterstützt alle 4 Parameter-Typen:
    1. **`float`**: Slider mit Min/Max, linearer oder logarithmischer Kurven-Anpassung, Live-Smoothing (`smooth: true`), Einheiten-Readout (`Hz`, `s`, `%`, `dB`).
    2. **`int`**: Stufenloser Integer-Regler / Stepper.
    3. **`enum`**: Styling-optimierter Dropdown-Selector.
    4. **`bool`**: Toggle-Switch Button.
- **Gruppierung & Tabs:**
  - Automatische Aufteilung in collapsible Gruppen: `OSCILLATORS`, `FILTER & RESONANCE`, `ENVELOPES (ADSR)`, `MODULATION & FX`.
- **Quick-Actions:**
  - **Randomize / Mutate**: Streut Parameter anhand ihres `mutationWeight`.
  - **Reset to Preset**: Stellt die Ursprungswerte des Presets wieder her.

### Component C: `PresetSaveModal.tsx` & IndexedDB Integration
- **State Management (`usePresetStore`)**:
  - `saveCustomPreset(preset: Preset): Promise<void>`
  - Nutzt `db.customPresets.put(newPreset)` aus `synthlab/src/db/db.ts`.
- **Preset Data Structure**:
  ```ts
  interface Preset {
    id: string; // z.B. "custom-user-1722100000000"
    name: string;
    engine: string;
    category: PresetCategory;
    tags: string[];
    author: string;
    params: ParamValues;
    fx: FxChainConfig;
    isCustom?: boolean;
    createdAt?: number;
  }
  ```
- **Modal Dialog UI**:
  - Eingabefeld für Preset-Name.
  - Dropdown für Kategorie (`Bass`, `Lead`, `Pad`, `Pluck`, `Arp`, `Drone`, `FX`, `Percussion`).
  - Tag-Input (kommagetrennt).
  - Ersteller-Name (Standard: `"User"` oder anpassbar).
  - Speicher-Button mit visueller Erfolgs-Bestätigung (Toast Notifications).

---

## 4. Proposed File Changes

### [NEW] `synthlab/src/ui/SynthPreviewBox.tsx`
Kompakte Vorschau-Box für das Synthesizer-Render mit Maximier-Funktion und Lightbox.

### [NEW] `synthlab/src/ui/SynthParameterInspector.tsx`
Generisches Inspektor-Panel für alle Parameter der ausgewählten Engine mit Live-Adjustment-Control-Elements.

### [NEW] `synthlab/src/ui/PresetSaveModal.tsx`
Dialogfenster zum Eingeben von Metadaten und Speichern von benutzerdefinierten Presets.

### [MODIFY] `synthlab/src/db/db.ts`
Erweiterung der Dexie-Datenbank um die Table `customPresets` für dauerhafte Benutzer-Presets.

### [MODIFY] `synthlab/src/store/presetStore.ts`
Erweiterung des Stores um Aktionen für Custom Presets (`addCustomPreset`, `deleteCustomPreset`, `exportPresets`).

### [MODIFY] `synthlab/src/App.tsx` & `synthlab/src/ui/DetailView.tsx`
Integration des `SynthParameterInspector` und der `SynthPreviewBox` im oberen rechten UI-Bereich von SynthLab.

---

## 5. Verifikationsplan

### Automatierte Tests
- `vitest run`: Ausführung aller bestehenden und neuen Unit-Tests für `PresetStore` und `customPresets` DB-Speicherung.
- Parameter-Schema-Check: Verifizierung, dass jede der 23 Engines in `ENGINES` valide `ParamSpec[]` liefert.

### Manuelle Verifikation
1. **Engine-Wechsel**: Auswählen verschiedener Presets aller 23 Synthesizer-Engines und Prüfen, ob Bild und Parameter oben rechts korrekt aktualisiert werden.
2. **Lightbox-Test**: Klick auf das Vorschaubild im Eck -> Prüfen, ob das Bild im Vollbild-Modal korrekt maximiert dargestellt wird.
3. **Live-Modulation**: Anpassen von Reglern -> Hörbare und visuelle Parameter-Änderung in Echtzeit prüfen.
4. **Preset Speichern**: Ändern von Parametern -> Klick auf "Als neues Preset speichern" -> Eingabe im Modal -> Prüfen, ob das neue Preset sofort im Browser erscheint und nach Seiten-Reload in IndexedDB erhalten bleibt.

---
*Plan 12 für SynthLab workspace.*
