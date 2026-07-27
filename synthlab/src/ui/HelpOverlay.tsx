// Hilfe-Overlay: vollständige, ausführliche App-Dokumentation & Tastaturübersicht.
// Schließbar über ×-Button, Klick auf Backdrop, oder Escape.
import { useEffect } from "react";
import { useUiStore } from "../store/uiStore";
import { ENGINES } from "../audio/engines/registry";
import { useSessionStore } from "../store/sessionStore";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3
        style={{
          fontSize: 13,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--color-accent, #fbad60)",
          marginBottom: 10,
          paddingBottom: 4,
          borderBottom: "1px solid rgba(251, 173, 96, 0.2)",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function ShortcutRow({ keys, desc }: { keys: string; desc: string }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "4px 0", fontSize: 12, alignItems: "center" }}>
      <span
        style={{
          minWidth: 160,
          flexShrink: 0,
          fontFamily: "monospace",
          fontWeight: 600,
          color: "#fff",
          background: "#242220",
          border: "1px solid #3e3b38",
          borderRadius: 4,
          padding: "2px 8px",
          height: "fit-content",
        }}
      >
        {keys}
      </span>
      <span style={{ color: "#c8c6c4", lineHeight: 1.4 }}>{desc}</span>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div
      style={{
        background: "#191817",
        border: "1px solid #2d2b28",
        borderRadius: 6,
        padding: "10px 12px",
        marginBottom: 8,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 12.5, color: "#fff", marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

export function HelpOverlay() {
  const helpOpen = useUiStore((s) => s.helpOpen);
  const setHelpOpen = useUiStore((s) => s.setHelpOpen);
  const bankLength = useSessionStore((s) => s.bank.length);

  useEffect(() => {
    if (!helpOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setHelpOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [helpOpen, setHelpOpen]);

  if (!helpOpen) return null;

  return (
    <div
      onClick={() => setHelpOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-surface-1, #181715)",
          border: "1px solid var(--color-border, #383633)",
          borderRadius: 10,
          width: "min(980px, 100%)",
          maxHeight: "min(90vh, 100%)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 24px",
            background: "#211f1c",
            borderBottom: "1px solid #33312f",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <strong style={{ fontSize: 16, color: "var(--color-accent, #fbad60)" }}>
              SynthLab – Handbuch &amp; Dokumentation
            </strong>
            <span style={{ fontSize: 11, background: "#333", color: "#aaa", padding: "2px 8px", borderRadius: 4 }}>
              Ableton-Style Workstation
            </span>
          </div>
          <button
            onClick={() => setHelpOpen(false)}
            style={{
              fontSize: 18,
              lineHeight: 1,
              padding: "4px 10px",
              background: "#2a2825",
              border: "1px solid #444",
              color: "#fff",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div style={{ overflowY: "auto", padding: "20px 24px", minHeight: 0 }}>
          {/* Section 1: Overview */}
          <Section title="1. Übersicht & Architektur">
            <p style={{ fontSize: 12.5, color: "#c4c9d1", lineHeight: 1.6, margin: "0 0 12px" }}>
              <strong>SynthLab</strong> ist ein professionelles, browserbasiertes Synthesizer-Labor und Performance-Workstation (React 19, TypeScript, Web Audio API / AudioWorklets) mit <strong>{ENGINES.length} spezialisierten Synthesizer-Engines</strong> und <strong>{bankLength.toLocaleString("de-DE")} kuratierten Presets</strong>.
            </p>
            <p style={{ fontSize: 12.5, color: "#c4c9d1", lineHeight: 1.6, margin: 0 }}>
              Die Plattform vereint klassische subtraktive Synthese (VA Poly), 6-Operator-FM (DX7 mit 1.024 Original-ROM-Voices), 2-Operator-FM nach Yamaha OPL3 (175 DOS-Ära-Instrumente), Roland Juno-106 DCO (128 Werkspatches), AKWF-Wavetable-Synthese, C64-SID-Chip-Emulation sowie Granular-, Modal- und Karplus-Strong-Synthese.
            </p>
          </Section>

          {/* Section 2: Top Transport Bar */}
          <Section title="2. Die Obere Steuerleiste (Transport Bar)">
            <FeatureCard
              title="Projekt & Rückgängig (Undo / Redo)"
              desc="Mit den Undo- (Strg+Z) und Redo-Buttons werden Parameter-Änderungen oder Preset-Wechsel schrittweise zurückgenommen. Der orange Punkt indiziert ungespeicherte Projektänderungen."
            />
            <FeatureCard
              title="Wiedergabe & MIDI-Aufnahme (Play & Rec)"
              desc="Der Play-Button (Leertaste) startet die Audio-Vorschau. Der rote Rec-Button startet die Echtzeit-MIDI-Aufnahme auf der aktuell ausgewählten Spur. Noten von der Computer-Tastatur oder USB-MIDI-Keyboards werden direkt in den aktivierten Clip-Slot aufgenommen."
            />
            <FeatureCard
              title="Tempo & Transportposition"
              desc="Zeigt Takte, Schläge und Sechzehntel (z.B. 1.1.1). Das globale Master-Tempo ist stufenlos von 20 bis 200 BPM einstellbar (Standard: 120 BPM)."
            />
            <FeatureCard
              title="Live Computer-Tastatur (🎹)"
              desc="Aktiviert die Computer-Tastatur als vollwertiges MIDI-Keyboard (Reihe A–L für weiße Tasten, W–P für schwarze Tasten). Ist standardmäßig beim Start aktiv."
            />
            <FeatureCard
              title="Panic (🚨 Emergency Stop)"
              desc="Stoppt sofort alle klingenden Noten und Audio-Voice-Generatoren aller Spuren bei Hängern."
            />
          </Section>

          {/* Section 3: Preset Browser */}
          <Section title="3. Preset-Browser (Links)">
            <FeatureCard
              title="Suchfeld & Synthesizer-Filter"
              desc="Über das Suchfeld kann nach Preset-Namen oder Tags gefiltert werden. Das Dropdown-Menü 'all synthesizers' erlaubt die gezielte Eingrenzung auf eine der 23 Synthesizer-Engines."
            />
            <FeatureCard
              title="Rollen-Filter & Kuratierung"
              desc="Filtert Presets nach musikalischen Rollen (Bass, Lead, Pad, Pluck, Rhythm, Bell, FX, Chord). Die Option 'nur unbewertet' hilft beim schnellen Durchhören und Bewerten neuer Sounds."
            />
          </Section>

          {/* Section 4: Session View & Multitrack Recording */}
          <Section title="4. Session View Matrix & Clip Recording (Mitte)">
            <FeatureCard
              title="Mehrspur-Spuren (Tracks 1 .. 4+)"
              desc="Jede Spur hält ein eigenes Synthesizer-Instrument und bis zu 4 Clip-Slots. Spuren können stummgeschaltet (Mute), scharfgeschaltet (Arm) oder über '+' neu hinzugefügt werden."
            />
            <FeatureCard
              title="Clip-Slots & Noten-Vorschau (MidiPreviewCanvas)"
              desc="Aufgenommene Clips zeigen den Namen, die Taktlänge sowie eine Miniatur-Grafik aller enthaltenen MIDI-Noten (Pitch vs. Zeit) in neon-amber/grün. Klick auf ▶ startet die Clip-Schleife, Klick auf ■ stoppt sie."
            />
            <FeatureCard
              title="Clip-Aufnahme auf Spuren"
              desc="Ist eine Spur 'Arm' geschaltet, zeigt jeder leere Slot einen roten Record-Button (● Slot N). Ein Klick startet die Aufzeichnung, ein weiterer Klick schließt den Clip ab und startet nahtlos die Wiedergabe."
            />
          </Section>

          {/* Section 5: Detail View */}
          <Section title="5. Kontextueller Detail-Bereich & Tabs (Unten)">
            <FeatureCard
              title="Verstellbare Trennleisten (Resizer Splitters)"
              desc="Die Randleisten zwischen Browser, Session View und Detail View lassen sich mit der Maus frei ziehen (Cursor wechselt zu col-resize bzw. row-resize), um die Fenstergrößen anzupassen."
            />
            <FeatureCard
              title="Tab 1: Device Chain & Ableton-FX-Rack"
              desc="Enthält die 8 Haupt-Makroregler des gewählten Presets sowie das Ableton-Style FX-Rack mit modularen Effekten: Drive, Vibrato, Post-Filter, Ensemble (Chorus), Tape Delay, Reverb (mit Freeze), CloudSeed (Ambient Diffusor) und Stereo Width."
            />
            <FeatureCard
              title="Tab 2: Parameter Inspector & Custom Preset Saver"
              desc="Zeigt 100% aller steuerbaren Engine-Parameter an. Der Button '🎲 Mutieren' führt eine intelligente, subtile Mutation (5–15% organisches Driften) aus. Über '💾 Als neues Preset speichern' wird der Sound in IndexedDB gesichert."
            />
            <FeatureCard
              title="Tab 3: Clip & Piano Roll Editor"
              desc="Bietet einen interaktiven Ableton Piano Roll Editor zum Einzeichnen und Bearbeiten von Noten, Tonhöhen und Anschlagsstärken sowie den Arpeggiator."
            />
            <FeatureCard
              title="Tab 4: Compare & Rating"
              desc="Ermöglicht A/B-Vergleiche zwischen zwei Soundzuständen sowie das Bewerten mit 1–5 Sternen und Verfassen eigener Notizen."
            />
          </Section>

          {/* Section 6: Keyboard Shortcuts */}
          <Section title="6. Tastatur-Tabelle & Shortcuts">
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-accent, #fbad60)" }}>
                🎹 Computer-Tastatur als MIDI-Keyboard:
              </div>
              <ShortcutRow keys="A S D F G H J K L ;" desc="Weiße Tasten (C, D, E, F, G, A, B, C, D, E)" />
              <ShortcutRow keys="W E · T Y U · O P" desc="Schwarze Tasten (C#, D# · F#, G#, A# · C#, D#)" />
              <ShortcutRow keys="Z / X" desc="Oktave tiefer / höher schalten" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-accent, #fbad60)" }}>
                ▶️ Transport & Navigation:
              </div>
              <ShortcutRow keys="Leertaste" desc="Wiedergabe starten / stoppen" />
              <ShortcutRow keys="J / ↓" desc="Nächstes Preset laden (Shift: +10)" />
              <ShortcutRow keys="K / ↑" desc="Vorheriges Preset laden (Shift: -10)" />
              <ShortcutRow keys="." desc="Zufälliges unbewertetes Preset anspringen" />
              <ShortcutRow keys="P" desc="Panic: Alle Noten & Stimmen sofort stummschalten" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-accent, #fbad60)" }}>
                ⭐ Bewertung & Variationen:
              </div>
              <ShortcutRow keys="1 – 5" desc="Preset mit 1 bis 5 Sternen bewerten" />
              <ShortcutRow keys="0" desc="Preset verwerfen" />
              <ShortcutRow keys="F" desc="Als Favorit umschalten" />
              <ShortcutRow keys="M" desc="Organische Mutation auf Preset anwenden" />
              <ShortcutRow keys="A / B" desc="Aktuelles Preset in Vergleichs-Slot A/B ablegen" />
              <ShortcutRow keys="C" desc="Zwischen Vergleichs-Slot A und B umschalten" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-accent, #fbad60)" }}>
                🛠️ System & Fenster:
              </div>
              <ShortcutRow keys="Strg / Cmd + Z" desc="Rückgängig (Undo)" />
              <ShortcutRow keys="Strg / Cmd + Y" desc="Wiederholen (Redo)" />
              <ShortcutRow keys="? / F1" desc="Dieses Handbuch öffnen / schließen" />
              <ShortcutRow keys="Esc" desc="Handbuch / Modale Fenster schließen" />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
