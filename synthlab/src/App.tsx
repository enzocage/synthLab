import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { AudioController } from "./audio/AudioController";
import type { MeterReading } from "./audio/core/Meters";
import { useSessionStore } from "./store/sessionStore";
import { PresetBrowser } from "./ui/PresetBrowser";
import { MacroPanel } from "./ui/MacroPanel";
import { TransportBar } from "./ui/TransportBar";
import { VariationGrid } from "./ui/VariationGrid";
import { RatingPanel } from "./ui/RatingPanel";
import { useKeyboardShortcuts } from "./ui/useKeyboardShortcuts";
import { PHRASE_ROLES } from "./midi/phrases";
import type { Role } from "./presets/schema";
import "./App.css";

const MUTATE_AMOUNT = 0.35;
const MANUAL_NOTE = 57; // A3

function App() {
  const [audioReady, setAudioReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [phraseRole, setPhraseRoleState] = useState<Role>("pad");
  const [tempo, setTempoState] = useState(66);
  const [meter, setMeter] = useState<MeterReading>({ peakL: 0, peakR: 0, rms: 0, correlation: 1 });
  const [voiceCount, setVoiceCount] = useState(0);
  const lastVariantIdx = useRef<number | null>(null);

  const bank = useSessionStore((s) => s.bank);
  const currentIndex = useSessionStore((s) => s.currentIndex);
  const preset = bank[currentIndex];
  const editsForPreset = useSessionStore((s) => s.editedParams[preset?.id ?? ""]);
  const effectivePreset = useMemo(() => {
    if (!preset) return preset;
    if (!editsForPreset) return preset;
    return { ...preset, params: { ...preset.params, ...editsForPreset } };
  }, [preset, editsForPreset]);
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
  const generateVariations = useSessionStore((s) => s.generateVariations);
  const clearVariations = useSessionStore((s) => s.clearVariations);
  const setAbSlot = useSessionStore((s) => s.setAbSlot);
  const setActiveSlot = useSessionStore((s) => s.setActiveSlot);
  const abSlots = useSessionStore((s) => s.abSlots);
  const activeSlot = useSessionStore((s) => s.activeSlot);

  useEffect(() => {
    const unsub = AudioController.onMeter((m) => {
      setMeter(m);
      setVoiceCount(AudioController.activeVoiceCount);
    });
    return unsub;
  }, []);

  // Preset laden, sobald Audio bereit ist ODER sich der aktuelle Index/Edits aendern.
  useEffect(() => {
    if (!audioReady) return;
    AudioController.loadPreset(effectivePreset);
    lastVariantIdx.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioReady, effectivePreset.id, JSON.stringify(effectivePreset.params), JSON.stringify(effectivePreset.fx)]);

  const startAudio = useCallback(async () => {
    await AudioController.resume();
    AudioController.setPhraseRole(phraseRole);
    AudioController.setTempo(tempo);
    setAudioReady(true);
    // Web-MIDI-Verbindung blockiert den Start nicht: requestMIDIAccess() kann auf
    // eine Berechtigungsabfrage warten oder in manchen Umgebungen nie aufloesen.
    AudioController.connectHardwareMidi().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playToggle = useCallback(() => {
    if (playing) {
      AudioController.stopTransport();
      setPlaying(false);
    } else {
      AudioController.play();
      setPlaying(true);
    }
  }, [playing]);

  const cyclePhrase = useCallback(() => {
    const idx = PHRASE_ROLES.indexOf(phraseRole);
    const next = PHRASE_ROLES[(idx + 1) % PHRASE_ROLES.length];
    setPhraseRoleState(next);
    AudioController.setPhraseRole(next);
  }, [phraseRole]);

  const onPhraseRoleChange = useCallback((role: Role) => {
    setPhraseRoleState(role);
    AudioController.setPhraseRole(role);
  }, []);

  const onTempoChange = useCallback((bpm: number) => {
    setTempoState(bpm);
    AudioController.setTempo(bpm);
  }, []);

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
    },
    [variationGrid, preset, setEditedParam, clearVariations]
  );

  useKeyboardShortcuts({
    playToggle,
    nextPreset: (big) => stepFiltered(big ? 10 : 1),
    prevPreset: (big) => stepFiltered(big ? -10 : -1),
    nextUnrated: jumpToRandomUnrated,
    rate: (n) => {
      rate(preset.id, n);
      stepFiltered(1);
    },
    discard: () => {
      discard(preset.id);
      stepFiltered(1);
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
    saveToCollection: () => toggleFavorite(preset.id), // Sammlungen folgen in Phase 9; vorlaeufig als Favorit markiert
    undo: () => {},
    holdNoteDown: () => AudioController.noteOn(MANUAL_NOTE),
    holdNoteUp: () => AudioController.noteOff(MANUAL_NOTE),
    panic: () => AudioController.panic(),
  });

  if (!preset) return null;

  if (!audioReady) {
    return (
      <div className="start-overlay">
        <h1>SynthLab</h1>
        <p>1131 Presets über 13 Engines. Schnell durchhören, bewerten, mutieren.</p>
        <button onClick={startAudio}>Audio starten</button>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <TransportBar
        playing={playing}
        onPlayToggle={playToggle}
        phraseRole={phraseRole}
        onPhraseRoleChange={onPhraseRoleChange}
        tempo={tempo}
        onTempoChange={onTempoChange}
        onPanic={() => AudioController.panic()}
        meter={meter}
        voiceCount={voiceCount}
      />
      <div className="app-columns">
        <PresetBrowser />
        <div className="app-column app-column--center">
          <h2 className="preset-title">{preset.name}</h2>
          <MacroPanel preset={effectivePreset} onLiveEdit={(paramId, value) => setEditedParam(preset.id, paramId, value)} />
          <VariationGrid variants={variationGrid} onPlay={handlePlayVariant} onAccept={handleAcceptVariant} />
          <div className="ab-indicator">
            Slot: <b>{activeSlot}</b> · A: {abSlots.A?.name ?? "–"} · B: {abSlots.B?.name ?? "–"}
          </div>
        </div>
        <div className="app-column app-column--right">
          <RatingPanel
            rating={ratings[preset.id] ?? 0}
            favorite={!!favorites[preset.id]}
            notes={notes[preset.id] ?? ""}
            tags={preset.tags}
            roles={preset.roles}
            onRate={(n) => rate(preset.id, n)}
            onToggleFavorite={() => toggleFavorite(preset.id)}
            onNotesChange={(n) => setNote(preset.id, n)}
            onDiscard={() => {
              discard(preset.id);
              stepFiltered(1);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
