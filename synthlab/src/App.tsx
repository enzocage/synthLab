import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { AudioController } from "./audio/AudioController";
import { useSessionStore } from "./store/sessionStore";
import { useTracksStore } from "./store/tracksStore";
import { useUiStore } from "./store/uiStore";
import { getEngine } from "./audio/engines/registry";
import { PresetBrowser } from "./ui/PresetBrowser";
import { TransportBar } from "./ui/TransportBar";
import { SessionView } from "./ui/SessionView";
import { DetailView } from "./ui/DetailView";
import { StatusBar } from "./ui/StatusBar";
import { HelpOverlay } from "./ui/HelpOverlay";
import { SynthGallery } from "./ui/SynthGallery";
import { useKeyboardShortcuts } from "./ui/useKeyboardShortcuts";
import { PHRASE_ROLES } from "./midi/phrases";
import { defaultArpSettings, type ArpSettings } from "./midi/arpeggiator";
import type { Role } from "./presets/schema";
import type { FxChainSettings } from "./audio/fx/types";
import "./design-system/tokens.css";
import "./App.css";

const MUTATE_AMOUNT = 0.35;
const MANUAL_NOTE = 57; // A3

function App() {
  const [audioReady, setAudioReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [phraseRole, setPhraseRoleState] = useState<Role>("pad");
  const [tempo, setTempoState] = useState(66);
  const [arpSettings, setArpSettingsState] = useState<ArpSettings>(defaultArpSettings());
  const lastVariantIdx = useRef<number | null>(null);

  const browserOpen = useUiStore((s) => s.browserOpen);
  const statusMessage = useUiStore((s) => s.statusMessage);
  const setStatusMessage = useUiStore((s) => s.setStatusMessage);

  const bank = useSessionStore((s) => s.bank);
  const currentIndex = useSessionStore((s) => s.currentIndex);
  const preset = bank[currentIndex];
  const editsForPreset = useSessionStore((s) => s.editedParams[preset?.id ?? ""]);
  const editedFxForPreset = useSessionStore((s) => s.editedFx[preset?.id ?? ""]);
  const effectivePreset = useMemo(() => {
    if (!preset) return preset;
    if (!editsForPreset && !editedFxForPreset) return preset;
    return {
      ...preset,
      params: editsForPreset ? { ...preset.params, ...editsForPreset } : preset.params,
      // Absicherung gegen aeltere, in IndexedDB gespeicherte FX-Edits, die noch
      // kein cloudSeed-Feld kennen (vor plan5) - Backfill mit dem Default statt
      // eines Laufzeitfehlers beim naechsten FxChain.update().
      fx: editedFxForPreset ? { ...preset.fx, ...editedFxForPreset } : preset.fx,
    };
  }, [preset, editsForPreset, editedFxForPreset]);

  const ratings = useSessionStore((s) => s.ratings);
  const favorites = useSessionStore((s) => s.favorites);
  const notes = useSessionStore((s) => s.notes);
  const variationGrid = useSessionStore((s) => s.variationGrid);

  const stepFiltered = useSessionStore((s) => s.stepFiltered);
  const jumpToRandomUnrated = useSessionStore((s) => s.jumpToRandomUnrated);
  const rate = useSessionStore((s) => s.rate);
  const toggleFavorite = useSessionStore((s) => s.toggleFavorite);
  const discard = useSessionStore((s) => s.discard);
  const setNote = useSessionStore((s) => s.setNote);
  const setEditedParam = useSessionStore((s) => s.setEditedParam);
  const setEditedFx = useSessionStore((s) => s.setEditedFx);
  const generateVariations = useSessionStore((s) => s.generateVariations);
  const clearVariations = useSessionStore((s) => s.clearVariations);
  const setAbSlot = useSessionStore((s) => s.setAbSlot);
  const setActiveSlot = useSessionStore((s) => s.setActiveSlot);
  const abSlots = useSessionStore((s) => s.abSlots);
  const activeSlot = useSessionStore((s) => s.activeSlot);

  const selectedTrackId = useTracksStore((s) => s.selectedTrackId);
  const setTrackPreset = useTracksStore((s) => s.setTrackPreset);
  const tracks = useTracksStore((s) => s.tracks);
  const selectedTrack = tracks.find((t) => t.id === selectedTrackId);

  const getPresetById = useCallback((id: string) => bank.find((p) => p.id === id) ?? null, [bank]);

  useEffect(() => {
    if (!audioReady || !selectedTrackId || !effectivePreset) return;
    AudioController.loadPreset(effectivePreset);
    setTrackPreset(selectedTrackId, effectivePreset.id);
    lastVariantIdx.current = null;
    setStatusMessage(`Preset "${effectivePreset.name}" geladen auf ${selectedTrack?.name ?? "Track"}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioReady, selectedTrackId, effectivePreset?.id, JSON.stringify(effectivePreset?.params), JSON.stringify(effectivePreset?.fx)]);

  const enterApp = useCallback(() => {
    AudioController.setSelectedTrack(useTracksStore.getState().selectedTrackId);
    AudioController.setPhraseRole(phraseRole);
    AudioController.setTempo(tempo);
    AudioController.setArpSettings(arpSettings);
    setAudioReady(true);
    setStatusMessage("3.356 Presets geladen · Audio startet mit der ersten Eingabe");
    void AudioController.resume()
      .then(() => setStatusMessage("Audio bereit · 3.356 Presets geladen"))
      .catch(() => setStatusMessage("Audio wartet auf die erste Tastatur- oder Mausaktion"));
    AudioController.connectHardwareMidi().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (audioReady) return;
    const timer = window.setTimeout(enterApp, 1000);
    return () => window.clearTimeout(timer);
  }, [audioReady, enterApp]);

  const playToggle = useCallback(() => {
    if (playing) {
      AudioController.stopTransport();
      setPlaying(false);
      setStatusMessage("Wiedergabe gestoppt");
    } else {
      void AudioController.resume().then(() => {
        AudioController.play();
        setPlaying(true);
        setStatusMessage("Wiedergabe läuft");
      });
    }
  }, [playing, setStatusMessage]);

  const cyclePhrase = useCallback(() => {
    const idx = PHRASE_ROLES.indexOf(phraseRole);
    const next = PHRASE_ROLES[(idx + 1) % PHRASE_ROLES.length];
    setPhraseRoleState(next);
    AudioController.setPhraseRole(next);
    setStatusMessage(`Phrase-Rolle gewechselt: ${next}`);
  }, [phraseRole, setStatusMessage]);

  const onPhraseRoleChange = useCallback(
    (role: Role) => {
      setPhraseRoleState(role);
      AudioController.setPhraseRole(role);
      setStatusMessage(`Phrase-Rolle: ${role}`);
    },
    [setStatusMessage]
  );

  const onTempoChange = useCallback(
    (bpm: number) => {
      setTempoState(bpm);
      AudioController.setTempo(bpm);
      setStatusMessage(`Tempo: ${bpm} BPM`);
    },
    [setStatusMessage]
  );

  const onArpChange = useCallback(
    (patch: Partial<ArpSettings>) => {
      const next = { ...arpSettings, ...patch };
      setArpSettingsState(next);
      AudioController.setArpSettings(next);
    },
    [arpSettings]
  );

  const onFxChange = useCallback(
    (patch: Partial<FxChainSettings>) => {
      if (!preset) return;
      const next = { ...effectivePreset.fx, ...patch } as FxChainSettings;
      setEditedFx(preset.id, next);
      AudioController.updateFx(next);
    },
    [preset, effectivePreset?.fx, setEditedFx]
  );

  const handlePlayVariant = useCallback(
    (idx: number) => {
      const variant = variationGrid[idx];
      if (!variant) return;
      lastVariantIdx.current = idx;
      AudioController.loadPreset(variant);
    },
    [variationGrid]
  );

  const handleAcceptVariant = useCallback(
    (idx: number) => {
      const variant = variationGrid[idx];
      if (!variant || !preset) return;
      for (const [paramId, value] of Object.entries(variant.params)) {
        setEditedParam(preset.id, paramId, value);
      }
      clearVariations();
      setStatusMessage(`Variation #${idx + 1} übernommen`);
    },
    [variationGrid, preset, setEditedParam, clearVariations, setStatusMessage]
  );

  const computerKeyboardEnabled = useUiStore((s) => s.computerKeyboardEnabled);
  const octaveBaseNote = useUiStore((s) => s.octaveBaseNote);
  const shiftOctave = useUiStore((s) => s.shiftOctave);
  const toggleHelp = useUiStore((s) => s.toggleHelp);

  useKeyboardShortcuts({
    playToggle,
    nextPreset: (big) => stepFiltered(big ? 10 : 1),
    prevPreset: (big) => stepFiltered(big ? -10 : -1),
    nextUnrated: jumpToRandomUnrated,
    rate: (n) => {
      rate(preset.id, n);
      stepFiltered(1);
      setStatusMessage(`Preset bewertet mit ${n} Sternen`);
    },
    discard: () => {
      discard(preset.id);
      stepFiltered(1);
      setStatusMessage("Preset verworfen");
    },
    favorite: () => toggleFavorite(preset.id),
    cyclePhrase,
    mutate: () => generateVariations(MUTATE_AMOUNT),
    playVariant: handlePlayVariant,
    acceptVariant: () => {
      if (lastVariantIdx.current !== null) handleAcceptVariant(lastVariantIdx.current);
    },
    setSlot: (slot) => {
      if (slot === "toggle") {
        const next = activeSlot === "A" ? "B" : "A";
        setActiveSlot(next);
        const target = abSlots[next];
        if (target) AudioController.loadPreset(target);
      } else {
        setAbSlot(slot, effectivePreset);
        setActiveSlot(slot);
      }
    },
    toggleReferenceDrone: () => AudioController.toggleReferenceDrone(),
    saveToCollection: () => toggleFavorite(preset.id),
    undo: () => {},
    holdNoteDown: () => {
      void AudioController.resume().then(() => AudioController.noteOn(MANUAL_NOTE));
    },
    holdNoteUp: () => {
      void AudioController.resume().then(() => AudioController.noteOff(MANUAL_NOTE));
    },
    panic: () => {
      AudioController.panic();
      setStatusMessage("Panic: Alle Stimmen gestoppt");
    },
    toggleHelp,
    pianoMode: {
      enabled: computerKeyboardEnabled,
      octaveBaseNote,
      onNoteOn: (note) => {
        void AudioController.resume().then(() => AudioController.noteOn(note));
      },
      onNoteOff: (note) => {
        void AudioController.resume().then(() => AudioController.noteOff(note));
      },
      onOctaveShift: (delta) => {
        shiftOctave(delta);
        setStatusMessage(`Oktave ${delta > 0 ? "hoch" : "runter"} verschoben`);
      },
    },
  });

  const initPersistence = useSessionStore((s) => s.initPersistence);

  useEffect(() => {
    initPersistence();
  }, [initPersistence]);

  if (!preset) return null;

  if (!audioReady) {
    return (
      <div className="start-overlay">
        <h1>SynthLab</h1>
        <p>3.356 Presets über 23 Synthesizer-Engines, Mehrspur-Arrangement, Arp und Live-Tastatur.</p>
        <div className="start-overlay__progress" aria-hidden="true"><span /></div>
        <div className="start-overlay__status" role="status">Workstation wird geladen …</div>
      </div>
    );
  }

  const selectedEngineName = getEngine(effectivePreset.engine).name;

  return (
    <div className="app-shell">
      {/* Top Bar (42px) */}
      <TransportBar
        playing={playing}
        onPlayToggle={playToggle}
        phraseRole={phraseRole}
        onPhraseRoleChange={onPhraseRoleChange}
        tempo={tempo}
        onTempoChange={onTempoChange}
        onPanic={() => AudioController.panic()}
      />

      {/* Main Workspace (Session View & Browser Split) */}
      <div className="app-columns" style={{ flex: 1, overflow: "hidden" }}>
        {browserOpen && (
          <div style={{ width: "var(--width-browser, 280px)", height: "100%", borderRight: "1px solid var(--color-border-subtle)" }}>
            <PresetBrowser />
          </div>
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          {/* Header Bar */}
          <div className="instrument-header" style={{ margin: 8, flexShrink: 0 }}>
            <span className="instrument-header__track">{selectedTrack?.name ?? "–"}</span>
            <span className="instrument-header__engine">{selectedEngineName}</span>
            <span className="instrument-header__sep">·</span>
            <span className="instrument-header__preset">{preset.name}</span>
          </div>

          {/* Ableton-Style Session View Matrix */}
          <SessionView getPresetById={getPresetById} />
        </div>
      </div>

      {/* Contextual Detail View (Device Chain / Clip / Compare) */}
      <DetailView
        preset={effectivePreset}
        onLiveEdit={(paramId, value) => setEditedParam(preset.id, paramId, value)}
        onFxChange={onFxChange}
        ratings={ratings}
        favorites={favorites}
        notes={notes}
        onRate={(n) => rate(preset.id, n)}
        onToggleFavorite={() => toggleFavorite(preset.id)}
        onNotesChange={(n) => setNote(preset.id, n)}
        onDiscard={() => {
          discard(preset.id);
          stepFiltered(1);
        }}
        variationGrid={variationGrid}
        handlePlayVariant={handlePlayVariant}
        handleAcceptVariant={handleAcceptVariant}
        arpSettings={arpSettings}
        onArpChange={onArpChange}
      />

      {/* Status Bar Footer (24px) */}
      <StatusBar text={statusMessage} />
      <HelpOverlay />
      <SynthGallery />
    </div>
  );
}

export default App;
