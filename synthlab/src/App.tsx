import { useRef, useState } from "react";
import { AudioEngine } from "./audio/core/AudioEngine";
import { PresetLoader } from "./audio/core/PresetLoader";
import { Meters } from "./audio/core/Meters";
import { testToneEngine, testToneDefaults } from "./audio/engines/testTone";
import "./App.css";

// Phase-2-Smoke-Test: verifiziert den Audio-Core (klickfreier Preset-Hot-Swap,
// Voice-Manager, Meter) manuell im Browser. Die 13 echten Engines und die
// Testsuite-UI folgen in Phase 3/7.
function App() {
  const loaderRef = useRef<PresetLoader | null>(null);
  const metersRef = useRef<Meters | null>(null);
  const [voices, setVoices] = useState(0);
  const [meter, setMeter] = useState({ peakL: 0, peakR: 0, rms: 0, correlation: 1 });
  const [presetFreq, setPresetFreq] = useState(220);

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

  async function loadPreset(freq: number) {
    await ensureAudio();
    const params = { ...testToneDefaults(), freq };
    const vm = loaderRef.current!.load(testToneEngine, params, 8);
    setPresetFreq(freq);
    setVoices(vm.voiceCount);
  }

  async function playNote() {
    await ensureAudio();
    if (!loaderRef.current?.activeVoiceManager) await loadPreset(presetFreq);
    const vm = loaderRef.current!.activeVoiceManager!;
    const now = AudioEngine.currentTime;
    const note = 69;
    vm.noteOn(note, 0.7, now);
    setVoices(vm.voiceCount);
    setTimeout(() => vm.noteOff(note, AudioEngine.currentTime), 1200);
  }

  return (
    <section id="center" style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
      <h1>SynthLab — Audio-Core Smoke-Test (Phase 2)</h1>
      <p>
        Verifiziert klickfreien Preset-Hot-Swap: <code>Ton spielen</code> halten, dann
        zwischen den Presets wechseln und hören, ob der Übergang nahtlos ist.
      </p>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button onClick={playNote}>Ton spielen (1.2s)</button>
        <button onClick={() => loadPreset(220)}>Preset A (220Hz)</button>
        <button onClick={() => loadPreset(330)}>Preset B (330Hz)</button>
        <button onClick={() => loadPreset(110)}>Preset C (110Hz)</button>
        <button onClick={() => AudioEngine.panic()}>Panic</button>
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 14, lineHeight: 1.8 }}>
        <div>aktives Preset: {presetFreq} Hz</div>
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
