// FX-Kette als Geraeteband im Ableton-Live-Stil: jedes Modul ist ein Karte mit
// Power-Schalter (enabled) und einem aufklappbaren Parameter-Panel. Reihenfolge
// entspricht dem festen Signalpfad (audio/fx/FxChain.ts).
import { useState } from "react";
import type { FxChainSettings } from "../audio/fx/types";

interface Props {
  fx: FxChainSettings;
  onChange(patch: Partial<FxChainSettings>): void;
}

function Device({
  title,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  enabled: boolean;
  onToggle(): void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`fx-device${enabled ? " fx-device--on" : ""}`}>
      <div className="fx-device__header">
        <button className="fx-device__power" onClick={onToggle} title="An/Aus">
          {enabled ? "●" : "○"}
        </button>
        <button className="fx-device__title" onClick={() => setOpen((o) => !o)}>
          {title}
        </button>
        <span className="fx-device__caret">{open ? "▾" : "▸"}</span>
      </div>
      {open && <div className="fx-device__body">{children}</div>}
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, unit }: { label: string; value: number; min: number; max: number; step: number; onChange(v: number): void; unit?: string }) {
  return (
    <label className="fx-slider">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="fx-slider__value">{value.toFixed(step < 1 ? 2 : 0)}{unit ?? ""}</span>
    </label>
  );
}

export function FxRack({ fx, onChange }: Props) {
  return (
    <div className="fx-rack">
      <Device title="Drive" enabled={fx.drive.enabled} onToggle={() => onChange({ drive: { ...fx.drive, enabled: !fx.drive.enabled } })}>
        <Slider label="Amount" value={fx.drive.amount} min={0} max={1} step={0.01} onChange={(v) => onChange({ drive: { ...fx.drive, amount: v } })} />
      </Device>

      <Device title="Filter" enabled={fx.postFilter.enabled} onToggle={() => onChange({ postFilter: { ...fx.postFilter, enabled: !fx.postFilter.enabled } })}>
        <label className="fx-select">
          <span>Typ</span>
          <select value={fx.postFilter.type} onChange={(e) => onChange({ postFilter: { ...fx.postFilter, type: e.target.value as typeof fx.postFilter.type } })}>
            <option value="lowpass">lowpass</option>
            <option value="highpass">highpass</option>
            <option value="bandpass">bandpass</option>
          </select>
        </label>
        <Slider label="Cutoff" value={fx.postFilter.cutoffHz} min={100} max={16000} step={10} onChange={(v) => onChange({ postFilter: { ...fx.postFilter, cutoffHz: v } })} unit="Hz" />
        <Slider label="Q" value={fx.postFilter.q} min={0.1} max={10} step={0.1} onChange={(v) => onChange({ postFilter: { ...fx.postFilter, q: v } })} />
      </Device>

      <Device title="Ensemble" enabled={fx.ensemble.enabled} onToggle={() => onChange({ ensemble: { ...fx.ensemble, enabled: !fx.ensemble.enabled } })}>
        <Slider label="Amount" value={fx.ensemble.amount} min={0} max={1} step={0.01} onChange={(v) => onChange({ ensemble: { ...fx.ensemble, amount: v } })} />
        <Slider label="Rate" value={fx.ensemble.rateHz} min={0.05} max={5} step={0.01} onChange={(v) => onChange({ ensemble: { ...fx.ensemble, rateHz: v } })} unit="Hz" />
        <Slider label="Depth" value={fx.ensemble.depthMs} min={0} max={20} step={0.5} onChange={(v) => onChange({ ensemble: { ...fx.ensemble, depthMs: v } })} unit="ms" />
      </Device>

      <Device title="Delay" enabled={fx.delay.enabled} onToggle={() => onChange({ delay: { ...fx.delay, enabled: !fx.delay.enabled } })}>
        <label className="fx-select">
          <span>Modus</span>
          <select value={fx.delay.mode} onChange={(e) => onChange({ delay: { ...fx.delay, mode: e.target.value as typeof fx.delay.mode } })}>
            <option value="tape">tape</option>
            <option value="pingpong">pingpong</option>
          </select>
        </label>
        <Slider label="Time" value={fx.delay.timeSeconds} min={0.05} max={2} step={0.01} onChange={(v) => onChange({ delay: { ...fx.delay, timeSeconds: v } })} unit="s" />
        <Slider label="Feedback" value={fx.delay.feedback} min={0} max={0.95} step={0.01} onChange={(v) => onChange({ delay: { ...fx.delay, feedback: v } })} />
        <Slider label="Mix" value={fx.delay.mix} min={0} max={1} step={0.01} onChange={(v) => onChange({ delay: { ...fx.delay, mix: v } })} />
        <Slider label="Tone" value={fx.delay.tone} min={0} max={1} step={0.01} onChange={(v) => onChange({ delay: { ...fx.delay, tone: v } })} />
        <Slider label="Wow/Flutter" value={fx.delay.wowFlutterDepth} min={0} max={1} step={0.01} onChange={(v) => onChange({ delay: { ...fx.delay, wowFlutterDepth: v } })} />
      </Device>

      <Device title="Reverb" enabled={fx.reverb.enabled} onToggle={() => onChange({ reverb: { ...fx.reverb, enabled: !fx.reverb.enabled } })}>
        <Slider label="Room Size" value={fx.reverb.roomSize} min={0} max={1} step={0.01} onChange={(v) => onChange({ reverb: { ...fx.reverb, roomSize: v } })} />
        <Slider label="Damping" value={fx.reverb.damping} min={0} max={1} step={0.01} onChange={(v) => onChange({ reverb: { ...fx.reverb, damping: v } })} />
        <Slider label="Pre-Delay" value={fx.reverb.preDelayMs} min={0} max={250} step={1} onChange={(v) => onChange({ reverb: { ...fx.reverb, preDelayMs: v } })} unit="ms" />
        <Slider label="Mix" value={fx.reverb.mix} min={0} max={1} step={0.01} onChange={(v) => onChange({ reverb: { ...fx.reverb, mix: v } })} />
        <Slider label="Width" value={fx.reverb.width} min={0} max={1} step={0.01} onChange={(v) => onChange({ reverb: { ...fx.reverb, width: v } })} />
        <Slider label="Low Cut" value={fx.reverb.inputLowCutHz} min={20} max={2000} step={10} onChange={(v) => onChange({ reverb: { ...fx.reverb, inputLowCutHz: v } })} unit="Hz" />
        <Slider label="High Cut" value={fx.reverb.outputHighCutHz} min={1000} max={18000} step={100} onChange={(v) => onChange({ reverb: { ...fx.reverb, outputHighCutHz: v } })} unit="Hz" />
        <label className="fx-checkbox">
          <input type="checkbox" checked={fx.reverb.freeze} onChange={(e) => onChange({ reverb: { ...fx.reverb, freeze: e.target.checked } })} />
          Freeze
        </label>
      </Device>

      <Device title="Width" enabled={fx.width.enabled} onToggle={() => onChange({ width: { ...fx.width, enabled: !fx.width.enabled } })}>
        <Slider label="Amount" value={fx.width.amount} min={0} max={2} step={0.05} onChange={(v) => onChange({ width: { ...fx.width, amount: v } })} />
      </Device>
    </div>
  );
}
