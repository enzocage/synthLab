import { PHRASE_ROLES } from "../midi/phrases";
import type { Role } from "../presets/schema";
import { MeterDisplay } from "./MeterDisplay";

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
  return (
    <div className="transport-bar">
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
      <button className="transport-bar__panic" onClick={onPanic}>Panic</button>
    </div>
  );
}
