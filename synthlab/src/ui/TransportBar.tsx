import { PHRASE_ROLES } from "../midi/phrases";
import type { Role } from "../presets/schema";
import { MeterDisplay } from "./MeterDisplay";
import { useUiStore } from "../store/uiStore";

interface Props {
  playing: boolean;
  onPlayToggle(): void;
  phraseRole: Role;
  onPhraseRoleChange(role: Role): void;
  tempo: number;
  onTempoChange(bpm: number): void;
  onPanic(): void;
}

export function TransportBar({ playing, onPlayToggle, phraseRole, onPhraseRoleChange, tempo, onTempoChange, onPanic }: Props) {
  const toggleBrowser = useUiStore((s) => s.toggleBrowser);
  const toggleDetail = useUiStore((s) => s.toggleDetail);
  const browserOpen = useUiStore((s) => s.browserOpen);
  const detailOpen = useUiStore((s) => s.detailOpen);

  return (
    <div className="transport-bar">
      <button onClick={toggleBrowser} style={{ background: browserOpen ? "#2c4a6b" : undefined }}>
        📁 Browser
      </button>
      <button onClick={onPlayToggle}>{playing ? "■ Stop" : "▶ Play"}</button>
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
      <MeterDisplay />
      <button onClick={toggleDetail} style={{ background: detailOpen ? "#2c4a6b" : undefined }}>
        🎛️ Detail
      </button>
      <button className="transport-bar__panic" onClick={onPanic}>Panic</button>
    </div>
  );
}
