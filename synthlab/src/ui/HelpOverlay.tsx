// Hilfe-Overlay: vollständige Tastaturübersicht + detaillierte App-Beschreibung.
// Schließbar über ×-Button, Klick auf Backdrop, oder Escape.
import { useEffect } from "react";
import { useUiStore } from "../store/uiStore";
import { ENGINES } from "../audio/engines/registry";
import { useSessionStore } from "../store/sessionStore";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-accent, #4a90d9)", marginBottom: 8 }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function ShortcutRow({ keys, desc }: { keys: string; desc: string }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "3px 0", fontSize: 12 }}>
      <span style={{ minWidth: 150, flexShrink: 0, fontFamily: "monospace", color: "#e4e6ea", background: "#1a1d22", border: "1px solid #2c2f36", borderRadius: 3, padding: "1px 6px", height: "fit-content" }}>
        {keys}
      </span>
      <span style={{ color: "#b0b6bf" }}>{desc}</span>
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
        background: "rgba(0,0,0,0.65)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-surface-1, #13161c)",
          border: "1px solid var(--color-border, #303744)",
          borderRadius: 8,
          width: "min(920px, 100%)",
          maxHeight: "min(88vh, 100%)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #2c2f36", flexShrink: 0 }}>
          <strong style={{ fontSize: 15 }}>SynthLab – Hilfe & Tastaturbelegung</strong>
          <button onClick={() => setHelpOpen(false)} style={{ fontSize: 16, lineHeight: 1, padding: "4px 10px" }}>×</button>
        </div>

        <div style={{ overflowY: "auto", padding: "16px 20px", minHeight: 0 }}>
          <Section title="Über SynthLab">
            <p style={{ fontSize: 12.5, color: "#c4c9d1", lineHeight: 1.6, margin: 0 }}>
              SynthLab ist eine browserbasierte Synthesizer- und Performance-Plattform (React, TypeScript,
              Web Audio API) mit {ENGINES.length} spezialisierten Synthesizer-Engines und {bankLength.toLocaleString("de-DE")} kuratierten
              Presets. Die Engines reichen von klassischer subtraktiver Synthese (VA Poly) über 6-Operator-FM
              (DX7, mit 1.024 echten Yamaha-Werksvoices), 2-Operator-FM nach Yamaha OPL3 (175 DOS-Ära-Instrumente),
              eine Juno-106-artige DCO-Engine (128 Roland-Werkspatches), echte Wavetable-Synthese über AKWF-
              Single-Cycle-Wellenformen, eine C64-SID-Chip-Simulation bis zu Granular-, Modal-, Karplus-Strong-
              und Wavefolding-Synthese. Viele Presets sind aus echten Original-Hardware-/Software-Datenquellen
              importiert statt künstlich generiert (siehe README.md / preset_sources.md für die vollständige
              Herkunftsdokumentation).
            </p>
            <p style={{ fontSize: 12.5, color: "#c4c9d1", lineHeight: 1.6, margin: "8px 0 0" }}>
              Die Oberfläche folgt dem Ableton-Live-Arbeitsmodell: eine <strong>Session View</strong> mit
              Mehrspur-Arrangement und Clip-Slots in der Mitte, ein durchsuchbarer <strong>Preset-Browser</strong> links,
              und ein kontextabhängiger <strong>Detail-Bereich</strong> unten mit Device Chain (Makros + FX-Rack +
              vollständigem Parameter-Editor), Clip &amp; Perform (Arpeggiator + Klaviatur) und Compare &amp; Rating
              (A/B-Vergleich, Bewertung, Variationen).
            </p>
          </Section>

          <Section title="Computer-Tastatur als MIDI-Keyboard (Ableton-Style)">
            <p style={{ fontSize: 12, color: "#8a919c", margin: "0 0 8px" }}>
              Mit dem 🎹-Button in der Transportleiste (oder durch Klick) aktivierbar. Solange aktiv, spielen
              die unten gezeigten Tasten Noten statt ihrer sonstigen Funktion - genau wie Ableton Lives
              "Computer-MIDI-Tastatur".
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, fontFamily: "monospace", fontSize: 12 }}>
              <div>Schwarze Tasten:  W E &nbsp;&nbsp; T Y U &nbsp;&nbsp; O P</div>
              <div>Weiße Tasten:&nbsp; A S D F G H J K L ;</div>
            </div>
            <div style={{ marginTop: 8 }}>
              <ShortcutRow keys="A S D F G H J K L ;" desc="Weiße Tasten (C D E F G A B C D E, aktuelle Oktave + Anfang der nächsten)" />
              <ShortcutRow keys="W E · T Y U · O P" desc="Schwarze Tasten (C# D# · F# G# A# · C# D#)" />
              <ShortcutRow keys="Z / X" desc="Oktave runter / hoch" />
            </div>
          </Section>

          <Section title="Transport & Navigation">
            <ShortcutRow keys="Leertaste" desc="Wiedergabe der Phrase starten/stoppen" />
            <ShortcutRow keys="J / ↓" desc="Nächstes Preset (mit Shift: 10 weiter)" />
            <ShortcutRow keys="K / ↑" desc="Vorheriges Preset (mit Shift: 10 zurück)" />
            <ShortcutRow keys="." desc="Zufälliges unbewertetes Preset" />
            <ShortcutRow keys="Tab" desc="Phrasen-Rolle wechseln" />
            <ShortcutRow keys="P" desc="Panic: alle Stimmen sofort stoppen" />
          </Section>

          <Section title="Bewertung & Kuratierung">
            <ShortcutRow keys="1 – 5" desc="Preset mit 1 bis 5 Sternen bewerten (springt danach weiter)" />
            <ShortcutRow keys="0" desc="Preset verwerfen" />
            <ShortcutRow keys="F" desc="Als Favorit markieren/abwählen" />
            <ShortcutRow keys="S" desc="Preset favorisieren (schnelles Merken)" />
          </Section>

          <Section title="Variationen & Vergleich">
            <ShortcutRow keys="M" desc="Jitter-Variationen des aktuellen Presets erzeugen" />
            <ShortcutRow keys="Q W E R T Z U I" desc="Variation 1–8 anspielen" />
            <ShortcutRow keys="Enter" desc="Zuletzt angespielte Variation übernehmen" />
            <ShortcutRow keys="A / B" desc="Aktuelles Preset in Vergleichs-Slot A/B legen" />
            <ShortcutRow keys="C" desc="Zwischen Slot A und B umschalten" />
          </Section>

          <Section title="Sonstiges">
            <ShortcutRow keys="G" desc="Referenz-Drone gegenhören (leiser Kontext-Ton)" />
            <ShortcutRow keys="H (halten)" desc="Manuelle Testnote halten" />
            <ShortcutRow keys="Strg/Cmd + Z" desc="Rückgängig" />
            <ShortcutRow keys="?" desc="Diese Hilfe öffnen/schließen" />
            <ShortcutRow keys="Esc" desc="Diese Hilfe schließen" />
          </Section>

          <Section title="Parameter-Editor & eigene Presets">
            <p style={{ fontSize: 12.5, color: "#c4c9d1", lineHeight: 1.6, margin: 0 }}>
              Im Detail-Bereich unter "Device Chain" öffnet der Button <strong>🎛️ Alle Parameter</strong> eine
              vollständige, nach Gruppen sortierte Übersicht sämtlicher Engine-Parameter (nicht nur der 8
              Makro-Regler). Änderungen sind sofort hörbar. Über <strong>Als neues Preset speichern</strong> lässt
              sich der aktuelle Klang unter einem eigenen Namen dauerhaft (im Browser, IndexedDB) als neues
              Preset ablegen - es erscheint danach im Preset-Browser wie jedes andere.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
