import { PHRASE_ROLES } from "../midi/phrases";
import type { Role } from "../presets/schema";
import { MeterDisplay } from "./MeterDisplay";
import { useUiStore } from "../store/uiStore";
import { useRuntimeStore } from "../store/runtimeStore";

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
  const transportStatus = useRuntimeStore((s) => s.transportStatus);
  const tempo = useRuntimeStore((s) => s.tempo);
  const bar = useRuntimeStore((s) => s.bar);
  const beatInBar = useRuntimeStore((s) => s.beatInBar);
  const isTransportActive = transportStatus === "playing" || transportStatus === "recording" || transportStatus === "starting";
  const octaveNumber = Math.floor(octaveBaseNote / 12) - 1;

  return (
    <div className="transport-bar">
      <button onClick={toggleBrowser} style={{ background: browserOpen ? "#2c4a6b" : undefined }}>
        📁 Browser
      </button>
      <button
        onClick={onPlayToggle}
        className={isTransportActive ? "transport-bar__play transport-bar__play--active" : "transport-bar__play"}
        aria-pressed={isTransportActive}
        title={transportStatus === "error" ? "Transportfehler – erneut versuchen" : "Play/Stop (Leertaste)"}
      >
        {transportStatus === "starting" ? "… Start" : isTransportActive ? "■ Stop" : "▶ Play"}
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
          style={{ width: 56 }}
        />
      </label>
      <button
        onClick={toggleComputerKeyboard}
        title="Computertastatur als MIDI-Keyboard (Ableton-Style: A S D F G H J K L = weiße Tasten, W E T Y U O P = schwarze Tasten, Z/X = Oktave)"
        style={{ background: computerKeyboardEnabled ? "#2c4a6b" : undefined }}
      >
        🎹 Keyboard{computerKeyboardEnabled ? ` (Oktave ${octaveNumber})` : ""}
      </button>
      <MeterDisplay />
      <button onClick={toggleDetail} style={{ background: detailOpen ? "#2c4a6b" : undefined }}>
        🎛️ Detail
      </button>
      <button onClick={toggleHelp} title="Hilfe: Tastaturbelegung & App-Beschreibung (Taste ?)">
        ❓ Hilfe
      </button>
      <button onClick={toggleSynthGallery} title="Bilder und Vorbilder aller Synth-Engines anzeigen">
        Synth Pics
      </button>
      <button className="transport-bar__panic" onClick={onPanic}>Panic</button>
    </div>
  );
}
