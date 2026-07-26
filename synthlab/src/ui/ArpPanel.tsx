import type { ArpSettings, ArpPattern } from "../midi/arpeggiator";

interface Props {
  settings: ArpSettings;
  onChange(patch: Partial<ArpSettings>): void;
}

const PATTERNS: ArpPattern[] = ["up", "down", "updown", "random", "asPlayed"];
const RATE_LABELS: Array<{ value: number; label: string }> = [
  { value: 0.5, label: "1/2" },
  { value: 1, label: "1/4" },
  { value: 1.5, label: "1/4T" },
  { value: 2, label: "1/8" },
  { value: 3, label: "1/8T" },
  { value: 4, label: "1/16" },
  { value: 8, label: "1/32" },
];

export function ArpPanel({ settings, onChange }: Props) {
  return (
    <div className={`arp-panel${settings.enabled ? " arp-panel--on" : ""}`}>
      <div className="arp-panel__header">
        <button className="fx-device__power" onClick={() => onChange({ enabled: !settings.enabled })}>
          {settings.enabled ? "●" : "○"}
        </button>
        <span className="arp-panel__title">Arp</span>
        <label className="arp-panel__latch">
          <input type="checkbox" checked={settings.latch} onChange={(e) => onChange({ latch: e.target.checked })} />
          Latch
        </label>
      </div>
      <div className="arp-panel__controls">
        <label>
          Pattern
          <select value={settings.pattern} onChange={(e) => onChange({ pattern: e.target.value as ArpPattern })}>
            {PATTERNS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label>
          Rate
          <select value={settings.rateDivision} onChange={(e) => onChange({ rateDivision: Number(e.target.value) })}>
            {RATE_LABELS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </label>
        <label>
          Oktaven
          <input type="range" min={1} max={4} step={1} value={settings.octaves} onChange={(e) => onChange({ octaves: Number(e.target.value) })} />
          <span>{settings.octaves}</span>
        </label>
        <label>
          Gate
          <input type="range" min={0.1} max={1} step={0.05} value={settings.gate} onChange={(e) => onChange({ gate: Number(e.target.value) })} />
          <span>{settings.gate.toFixed(2)}</span>
        </label>
      </div>
    </div>
  );
}
