import { PHRASE_ROLES } from "../midi/phrases";
import type { Role } from "../presets/schema";
import { MeterDisplay } from "./MeterDisplay";
import { useUiStore } from "../store/uiStore";
import { useRuntimeStore, type LaunchQuantization } from "../store/runtimeStore";
import { useCommandStore } from "../store/commandStore";
import { Icon } from "./Icon";

interface Props {
  onPlayToggle(): void;
  phraseRole: Role;
  onPhraseRoleChange(role: Role): void;
  onTempoChange(bpm: number): void;
  onPanic(): void;
}

export function TransportBar({ onPlayToggle, phraseRole, onPhraseRoleChange, onTempoChange, onPanic }: Props) {
  const toggleBrowser = useUiStore((s) => s.toggleBrowser);
  const toggleDetail = useUiStore((s) => s.toggleDetail);
  const browserOpen = useUiStore((s) => s.browserOpen);
  const detailOpen = useUiStore((s) => s.detailOpen);
  const computerKeyboardEnabled = useUiStore((s) => s.computerKeyboardEnabled);
  const toggleComputerKeyboard = useUiStore((s) => s.toggleComputerKeyboard);
  const octaveBaseNote = useUiStore((s) => s.octaveBaseNote);
  const toggleHelp = useUiStore((s) => s.toggleHelp);
  const toggleSynthGallery = useUiStore((s) => s.toggleSynthGallery);
  const activeMainView = useUiStore((s) => s.activeMainView);
  const setActiveMainView = useUiStore((s) => s.setActiveMainView);
  const transportStatus = useRuntimeStore((s) => s.transportStatus);
  const tempo = useRuntimeStore((s) => s.tempo);
  const bar = useRuntimeStore((s) => s.bar);
  const beatInBar = useRuntimeStore((s) => s.beatInBar);
  const launchQuantization = useRuntimeStore((s) => s.launchQuantization);
  const setLaunchQuantization = useRuntimeStore((s) => s.setLaunchQuantization);
  const undoCount = useCommandStore((s) => s.undoStack.length);
  const redoCount = useCommandStore((s) => s.redoStack.length);
  const dirty = useCommandStore((s) => s.dirty);
  const isTransportActive = transportStatus === "playing" || transportStatus === "recording" || transportStatus === "starting";
  const octaveNumber = Math.floor(octaveBaseNote / 12) - 1;

  return (
    <header className="transport-bar" aria-label="Globale Steuerleiste">
      <div className="transport-bar__group transport-bar__project">
        <strong>SynthLab</strong>
        <span className={dirty ? "transport-bar__dirty transport-bar__dirty--active" : "transport-bar__dirty"} aria-label={dirty ? "Projekt hat Änderungen" : "Projekt gespeichert"} />
        <button onClick={() => useCommandStore.getState().undo()} disabled={!undoCount} aria-label="Rückgängig" data-info="Letzte Projektänderung rückgängig machen (Strg+Z)"><Icon name="undo" /></button>
        <button onClick={() => useCommandStore.getState().redo()} disabled={!redoCount} aria-label="Wiederholen" data-info="Zuletzt rückgängig gemachte Änderung wiederholen"><Icon name="redo" /></button>
      </div>
      <div className="transport-bar__group">
        <button onClick={toggleBrowser} className={browserOpen ? "is-active" : ""} aria-label="Browser umschalten" data-info="Preset- und Gerätebrowser ein- oder ausblenden">
          <Icon name="browser" /> <span className="transport-label">Browser</span>
        </button>
        <div className="view-switcher" aria-label="Hauptansicht">
          <button onClick={() => setActiveMainView("session")} className={activeMainView === "session" ? "is-active" : ""} aria-label="Session View"><Icon name="session" /></button>
          <button onClick={() => setActiveMainView("arrangement")} className={activeMainView === "arrangement" ? "is-active" : ""} aria-label="Arrangement View"><Icon name="arrangement" /></button>
        </div>
      </div>
      <div className="transport-bar__group transport-bar__musical">
      <button
        onClick={onPlayToggle}
        className={isTransportActive ? "transport-bar__play transport-bar__play--active" : "transport-bar__play"}
        aria-pressed={isTransportActive}
        title={transportStatus === "error" ? "Transportfehler – erneut versuchen" : "Play/Stop (Leertaste)"}
      >
        <Icon name={isTransportActive ? "stop" : "play"} />
        <span className="transport-label">{transportStatus === "starting" ? "Start" : isTransportActive ? "Stop" : "Play"}</span>
      </button>
      <output className="transport-bar__position" aria-label="Transportposition">
        {bar}.{Math.floor(beatInBar)}.{Math.floor((beatInBar % 1) * 4) + 1}
      </output>
      <select value={phraseRole} onChange={(e) => onPhraseRoleChange(e.target.value as Role)}>
        {PHRASE_ROLES.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <label>
        Tempo
        <input
          type="number"
          min={20}
          max={200}
          value={tempo}
          onChange={(e) => onTempoChange(Number(e.target.value))}
        />
      </label>
      <label>
        Quantize
        <select value={launchQuantization} onChange={(event) => setLaunchQuantization(event.target.value as LaunchQuantization)}>
          <option value="none">None</option><option value="1/32">1/32</option><option value="1/16">1/16</option>
          <option value="1/8">1/8</option><option value="1/4">1/4</option><option value="1/2">1/2</option>
          <option value="1-bar">1 Bar</option><option value="2-bars">2 Bars</option><option value="4-bars">4 Bars</option>
        </select>
      </label>
      </div>
      <div className="transport-bar__group transport-bar__tools">
      <button
        onClick={toggleComputerKeyboard}
        title="Computertastatur als MIDI-Keyboard (Ableton-Style: A S D F G H J K L = weiße Tasten, W E T Y U O P = schwarze Tasten, Z/X = Oktave)"
        className={computerKeyboardEnabled ? "is-active" : ""}
      >
        <Icon name="keyboard" /> <span className="transport-label">Keyboard{computerKeyboardEnabled ? ` ${octaveNumber}` : ""}</span>
      </button>
      <MeterDisplay />
      <button onClick={toggleDetail} className={detailOpen ? "is-active" : ""}>
        <Icon name="detail" /> <span className="transport-label">Detail</span>
      </button>
      <button onClick={toggleHelp} title="Hilfe: Tastaturbelegung & App-Beschreibung (Taste ?)">
        <Icon name="help" /> <span className="transport-label">Hilfe</span>
      </button>
      <button onClick={toggleSynthGallery} title="Bilder und Vorbilder aller Synth-Engines anzeigen">
        <Icon name="image" /> <span className="transport-label">Synth Pics</span>
      </button>
      <button className="transport-bar__panic" onClick={onPanic}>Panic</button>
      </div>
    </header>
  );
}
