// FX-Kette als Geraeteband im Ableton-Live-Stil: jedes Modul ist ein Karte mit
// Power-Schalter (enabled) und einem aufklappbaren Parameter-Panel. Reihenfolge
// entspricht dem festen Signalpfad (audio/fx/FxChain.ts).
import { useState } from "react";
import type { CloudSeedSettings, FxChainSettings } from "../audio/fx/types";
import cloudSeedBank from "../data/derived/cloudseed-programs.json";

const CLOUDSEED_PROGRAMS = cloudSeedBank.programs as { id: string; name: string; settings: Omit<CloudSeedSettings, "enabled"> }[];

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

      <Device title="CloudSeed" enabled={fx.cloudSeed.enabled} onToggle={() => onChange({ cloudSeed: { ...fx.cloudSeed, enabled: !fx.cloudSeed.enabled } })}>
        <label className="fx-select">
          <span>Factory-Programm</span>
          <select
            defaultValue=""
            onChange={(e) => {
              const program = CLOUDSEED_PROGRAMS.find((p) => p.id === e.target.value);
              if (program) onChange({ cloudSeed: { ...program.settings, enabled: true } });
            }}
          >
            <option value="" disabled>
              Programm wählen…
            </option>
            {CLOUDSEED_PROGRAMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <Slider label="Pre-Delay" value={fx.cloudSeed.preDelay} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, preDelay: v } })} />
        <Slider label="High-Pass" value={fx.cloudSeed.highPass} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, highPass: v } })} />
        <Slider label="Low-Pass" value={fx.cloudSeed.lowPass} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, lowPass: v } })} />
        <Slider label="Tap Count" value={fx.cloudSeed.tapCount} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, tapCount: v } })} />
        <Slider label="Tap Length" value={fx.cloudSeed.tapLength} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, tapLength: v } })} />
        <Slider label="Tap Decay" value={fx.cloudSeed.tapDecay} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, tapDecay: v } })} />
        <Slider label="Diffusion Delay" value={fx.cloudSeed.diffusionDelay} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, diffusionDelay: v } })} />
        <Slider label="Diffusion Feedback" value={fx.cloudSeed.diffusionFeedback} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, diffusionFeedback: v } })} />
        <Slider label="Line Count" value={fx.cloudSeed.lineCount} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, lineCount: v } })} />
        <Slider label="Line Delay" value={fx.cloudSeed.lineDelay} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, lineDelay: v } })} />
        <Slider label="Line Decay (T60)" value={fx.cloudSeed.lineDecay} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, lineDecay: v } })} />
        <Slider label="Late Diffusion Delay" value={fx.cloudSeed.lateDiffusionDelay} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, lateDiffusionDelay: v } })} />
        <Slider label="Late Diffusion Feedback" value={fx.cloudSeed.lateDiffusionFeedback} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, lateDiffusionFeedback: v } })} />
        <Slider label="Mod Amount" value={fx.cloudSeed.lineModAmount} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, lineModAmount: v } })} />
        <Slider label="Mod Rate" value={fx.cloudSeed.lineModRate} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, lineModRate: v } })} />
        <Slider label="Low Shelf Gain" value={fx.cloudSeed.postLowShelfGain} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, postLowShelfGain: v } })} />
        <Slider label="Low Shelf Freq" value={fx.cloudSeed.postLowShelfFrequency} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, postLowShelfFrequency: v } })} />
        <Slider label="High Shelf Gain" value={fx.cloudSeed.postHighShelfGain} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, postHighShelfGain: v } })} />
        <Slider label="High Shelf Freq" value={fx.cloudSeed.postHighShelfFrequency} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, postHighShelfFrequency: v } })} />
        <Slider label="Cutoff" value={fx.cloudSeed.postCutoffFrequency} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, postCutoffFrequency: v } })} />
        <Slider label="Cross-Seed" value={fx.cloudSeed.crossSeed} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, crossSeed: v } })} />
        <Slider label="Dry Out" value={fx.cloudSeed.dryOut} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, dryOut: v } })} />
        <Slider label="Early Out" value={fx.cloudSeed.earlyOut} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, earlyOut: v } })} />
        <Slider label="Main Out" value={fx.cloudSeed.mainOut} min={0} max={1} step={0.01} onChange={(v) => onChange({ cloudSeed: { ...fx.cloudSeed, mainOut: v } })} />
      </Device>

      <Device title="Width" enabled={fx.width.enabled} onToggle={() => onChange({ width: { ...fx.width, enabled: !fx.width.enabled } })}>
        <Slider label="Amount" value={fx.width.amount} min={0} max={2} step={0.05} onChange={(v) => onChange({ width: { ...fx.width, amount: v } })} />
      </Device>
    </div>
  );
}
