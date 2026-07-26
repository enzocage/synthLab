import { useRef, useState } from "react";
import { AudioEngine } from "./audio/core/AudioEngine";
import { PresetLoader } from "./audio/core/PresetLoader";
import { Meters } from "./audio/core/Meters";
import { ENGINES } from "./audio/engines/registry";
import { defaultParamValues } from "./audio/core/types";
import "./App.css";

// Phase-3-Smoke-Test: laesst jede der 13 Engines mit ihren Default-Parametern
// anspielen, um Verkabelung/Klick-/NaN-Freiheit manuell zu verifizieren. Die
// vollwertige Testsuite-UI (Makros, Variationsraster, Tastatur-Workflow) folgt
// in Phase 7.
function App() {
  const loaderRef = useRef<PresetLoader | null>(null);
  const metersRef = useRef<Meters | null>(null);
  const heldNoteRef = useRef<number | null>(null);
  const [engineIdx, setEngineIdx] = useState(0);
  const [voices, setVoices] = useState(0);
  const [meter, setMeter] = useState({ peakL: 0, peakR: 0, rms: 0, correlation: 1 });

  const engine = ENGINES[engineIdx];

  async function ensureAudio() {
    await AudioEngine.resume();
    if (!loaderRef.current) {
      loaderRef.current = new PresetLoader(AudioEngine.ctx, AudioEngine.masterInput);
      metersRef.current = new Meters(AudioEngine.ctx, AudioEngine.masterOut);
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

  return (
    <section id="center" style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1>SynthLab — Engine-Smoke-Test (Phase 3)</h1>
      <p>
        Alle 13 Engines mit Default-Parametern. <code>Note halten</code> gedrückt lassen
        (Maustaste), zwischen Engines wechseln während die Note klingt.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {ENGINES.map((e, i) => (
          <button
            key={e.id}
            onClick={() => loadEngine(i)}
            style={{ fontWeight: i === engineIdx ? 700 : 400 }}
          >
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
      <div style={{ fontFamily: "monospace", fontSize: 14, lineHeight: 1.8 }}>
        <div>aktive Engine: {engine.name} ({engine.id})</div>
        <div>Parameter: {engine.params.length}</div>
        <div>aktive Voices: {voices}</div>
        <div>
          Peak L/R: {meter.peakL.toFixed(3)} / {meter.peakR.toFixed(3)}
        </div>
        <div>RMS: {meter.rms.toFixed(3)}</div>
        <div>Korrelation: {meter.correlation.toFixed(3)}</div>
      </div>
    </section>
  );
}

export default App;
