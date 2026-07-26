import { useRef, useState } from "react";
import { AudioEngine } from "./audio/core/AudioEngine";
import { PresetLoader } from "./audio/core/PresetLoader";
import { Meters } from "./audio/core/Meters";
import { ENGINES } from "./audio/engines/registry";
import { defaultParamValues } from "./audio/core/types";
import { FxChain } from "./audio/fx/FxChain";
import { defaultFxChainSettings } from "./audio/fx/types";
import type { FxChainSettings } from "./audio/fx/types";
import "./App.css";

// Phase-3/4-Smoke-Test: 13 Engines mit Default-Parametern durch eine gemeinsame
// FX-Kette (Drive->Filter->Ensemble->Delay->Reverb->Width). Die vollwertige
// Testsuite-UI (Makros, Variationsraster, Tastatur-Workflow) folgt in Phase 7.
function App() {
  const loaderRef = useRef<PresetLoader | null>(null);
  const metersRef = useRef<Meters | null>(null);
  const fxRef = useRef<FxChain | null>(null);
  const heldNoteRef = useRef<number | null>(null);
  const [engineIdx, setEngineIdx] = useState(0);
  const [voices, setVoices] = useState(0);
  const [meter, setMeter] = useState({ peakL: 0, peakR: 0, rms: 0, correlation: 1 });
  const [fx, setFx] = useState<FxChainSettings>(defaultFxChainSettings());
  const [freeze, setFreeze] = useState(false);

  const engine = ENGINES[engineIdx];

  async function ensureAudio() {
    await AudioEngine.resume();
    if (!loaderRef.current) {
      const ctx = AudioEngine.ctx;
      const chain = new FxChain(ctx, fx);
      chain.output.connect(AudioEngine.masterInput);
      chain.start(ctx.currentTime);
      fxRef.current = chain;

      loaderRef.current = new PresetLoader(ctx, chain.input);
      metersRef.current = new Meters(ctx, AudioEngine.masterOut);
      const tick = () => {
        if (metersRef.current) setMeter(metersRef.current.read());
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  async function loadEngine(idx: number) {
    await ensureAudio();
    stopHeldNote();
    setEngineIdx(idx);
    const params = defaultParamValues(ENGINES[idx].params);
    const vm = loaderRef.current!.load(ENGINES[idx], params, 8);
    setVoices(vm.voiceCount);
  }

  function stopHeldNote() {
    const vm = loaderRef.current?.activeVoiceManager;
    if (vm && heldNoteRef.current !== null) {
      vm.noteOff(heldNoteRef.current, AudioEngine.currentTime);
      heldNoteRef.current = null;
    }
  }

  async function noteDown() {
    await ensureAudio();
    if (!loaderRef.current?.activeVoiceManager) await loadEngine(engineIdx);
    const vm = loaderRef.current!.activeVoiceManager!;
    const now = AudioEngine.currentTime;
    const note = 57; // A3 - guenstig fuer bass/drone-Rollen
    vm.noteOn(note, 0.8, now);
    heldNoteRef.current = note;
    setVoices(vm.voiceCount);
  }

  function noteUp() {
    stopHeldNote();
  }

  function panic() {
    loaderRef.current?.activeVoiceManager?.panic(AudioEngine.currentTime);
    heldNoteRef.current = null;
    AudioEngine.panic();
    setVoices(0);
  }

  function updateFx(patch: Partial<FxChainSettings>) {
    const next = { ...fx, ...patch };
    setFx(next);
    fxRef.current?.update(next);
  }

  function toggleFreeze() {
    const next = !freeze;
    setFreeze(next);
    fxRef.current?.setFreeze(next);
  }

  return (
    <section id="center" style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>
      <h1>SynthLab — Engine + FX-Smoke-Test (Phase 3/4)</h1>
      <p>
        Alle 13 Engines mit Default-Parametern durch eine gemeinsame FX-Kette. <code>Note
        halten</code> gedrückt lassen, FX-Regler live verändern.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {ENGINES.map((e, i) => (
          <button key={e.id} onClick={() => loadEngine(i)} style={{ fontWeight: i === engineIdx ? 700 : 400 }}>
            {i + 1}. {e.name}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button onMouseDown={noteDown} onMouseUp={noteUp} onMouseLeave={noteUp}>
          Note halten
        </button>
        <button onClick={panic}>Panic</button>
      </div>

      <fieldset style={{ marginBottom: 16 }}>
        <legend>FX-Kette</legend>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 13 }}>
          <label>
            Drive {fx.drive.amount.toFixed(2)}
            <input type="range" min={0} max={1} step={0.01} value={fx.drive.amount}
              onChange={(e) => updateFx({ drive: { amount: Number(e.target.value) } })} />
          </label>
          <label>
            Ensemble {fx.ensemble.amount.toFixed(2)}
            <input type="range" min={0} max={1} step={0.01} value={fx.ensemble.amount}
              onChange={(e) => updateFx({ ensemble: { ...fx.ensemble, amount: Number(e.target.value) } })} />
          </label>
          <label>
            Delay-Mix {fx.delay.mix.toFixed(2)}
            <input type="range" min={0} max={1} step={0.01} value={fx.delay.mix}
              onChange={(e) => updateFx({ delay: { ...fx.delay, mode: "pingpong", mix: Number(e.target.value) } })} />
          </label>
          <label>
            Reverb-Mix {fx.reverb.mix.toFixed(2)}
            <input type="range" min={0} max={1} step={0.01} value={fx.reverb.mix}
              onChange={(e) => updateFx({ reverb: { ...fx.reverb, mix: Number(e.target.value) } })} />
          </label>
          <label>
            Reverb-Decay {fx.reverb.decaySeconds.toFixed(1)}s
            <input type="range" min={1} max={30} step={0.5} value={fx.reverb.decaySeconds}
              onChange={(e) => updateFx({ reverb: { ...fx.reverb, decaySeconds: Number(e.target.value) } })} />
          </label>
          <label>
            Width {fx.width.amount.toFixed(2)}
            <input type="range" min={0} max={2} step={0.05} value={fx.width.amount}
              onChange={(e) => updateFx({ width: { amount: Number(e.target.value) } })} />
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={() => updateFx({ reverb: { ...fx.reverb, mode: fx.reverb.mode === "shimmer" ? "fdn" : "shimmer" } })}>
            Shimmer: {fx.reverb.mode === "shimmer" ? "an" : "aus"}
          </button>
          <button onClick={toggleFreeze}>Freeze: {freeze ? "an" : "aus"}</button>
        </div>
      </fieldset>

      <div style={{ fontFamily: "monospace", fontSize: 14, lineHeight: 1.8 }}>
        <div>aktive Engine: {engine.name} ({engine.id})</div>
        <div>aktive Voices: {voices}</div>
        <div>Peak L/R: {meter.peakL.toFixed(3)} / {meter.peakR.toFixed(3)}</div>
        <div>RMS: {meter.rms.toFixed(3)}</div>
        <div>Korrelation: {meter.correlation.toFixed(3)}</div>
      </div>
    </section>
  );
}

export default App;
