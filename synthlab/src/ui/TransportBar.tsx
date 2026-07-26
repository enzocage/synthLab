import { PHRASE_ROLES } from "../midi/phrases";
import type { Role } from "../presets/schema";
import type { MeterReading } from "../audio/core/Meters";

interface Props {
  playing: boolean;
  onPlayToggle(): void;
  phraseRole: Role;
  onPhraseRoleChange(role: Role): void;
  tempo: number;
  onTempoChange(bpm: number): void;
  onPanic(): void;
  meter: MeterReading;
  voiceCount: number;
}

export function TransportBar({ playing, onPlayToggle, phraseRole, onPhraseRoleChange, tempo, onTempoChange, onPanic, meter, voiceCount }: Props) {
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
      <span className="transport-bar__voices">Voices: {voiceCount}</span>
      <span className="transport-bar__meter">
        Peak {meter.peakL.toFixed(2)}/{meter.peakR.toFixed(2)} · RMS {meter.rms.toFixed(2)}
      </span>
      <button className="transport-bar__panic" onClick={onPanic}>Panic</button>
    </div>
  );
}
