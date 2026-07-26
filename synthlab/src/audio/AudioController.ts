// Verkabelt Audio-Core, FX-Kette und Phrase-Player zu einem einzigen imperativen
// Controller, den die React-UI (Phase 7) anspricht. Bewusst außerhalb von React-
// State gehalten - Audio-Graphen sind mutable/imperativ, React-State ist es nicht.
import { AudioEngine } from "./core/AudioEngine";
import { PresetLoader } from "./core/PresetLoader";
import { Meters, type MeterReading } from "./core/Meters";
import { FxChain } from "./fx/FxChain";
import { defaultFxChainSettings } from "./fx/types";
import { getEngine } from "./engines/registry";
import { generatePhrase, type Phrase } from "../midi/phrases";
import { PhrasePlayer } from "../midi/player";
import { connectHardwareInput, type HardwareInputHandle } from "../midi/hardwareInput";
import type { KeyContext } from "../midi/theory";
import type { Role } from "../presets/schema";
import type { Preset } from "../presets/schema";

const REFERENCE_DRONE_NOTE = 45; // A2, leiser Kontext-Drone fuer "gegen etwas hoeren" (Taste G)

class AudioControllerImpl {
  private loader: PresetLoader | null = null;
  private fxChain: FxChain | null = null;
  private meters: Meters | null = null;
  private phrasePlayer: PhrasePlayer | null = null;
  private hardwareHandle: HardwareInputHandle | null = null;
  private refDroneOn = false;
  private currentPreset: Preset | null = null;
  private tempo = 66;
  private phraseRole: Role = "pad";
  private key: KeyContext = { root: 57, scale: "dorian" };
  private phraseSeed = 1;
  private meterListeners = new Set<(m: MeterReading) => void>();
  private rafId: number | null = null;

  private ensureGraph(): void {
    if (this.loader) return;
    const ctx = AudioEngine.ctx;
    const chain = new FxChain(ctx, this.currentPreset?.fx ?? defaultFxChainSettings());
    chain.output.connect(AudioEngine.masterInput);
    chain.start(ctx.currentTime);
    this.fxChain = chain;
    this.loader = new PresetLoader(ctx, chain.input);
    this.meters = new Meters(ctx, AudioEngine.masterOut);
    this.phrasePlayer = new PhrasePlayer(ctx, () => this.loader?.activeVoiceManager ?? null, this.tempo);

    const tick = () => {
      if (this.meters) {
        const reading = this.meters.read();
        for (const l of this.meterListeners) l(reading);
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  async resume(): Promise<void> {
    await AudioEngine.resume();
    this.ensureGraph();
  }

  onMeter(cb: (m: MeterReading) => void): () => void {
    this.meterListeners.add(cb);
    return () => this.meterListeners.delete(cb);
  }

  /** Laedt ein Preset klickfrei (Crossfade) und bereitet die aktuelle Phrase darauf vor. */
  async loadPreset(preset: Preset): Promise<void> {
    await this.resume();
    this.currentPreset = preset;
    const engine = getEngine(preset.engine);
    this.loader!.load(engine, preset.params, 8);
    this.fxChain!.update(preset.fx);
    this.restartPhrase();
  }

  private buildPhrase(): Phrase {
    return generatePhrase(this.phraseRole, { key: this.key, seed: this.phraseSeed });
  }

  private restartPhrase(): void {
    if (!this.phrasePlayer) return;
    this.phrasePlayer.setPhrase(this.buildPhrase());
  }

  setPhraseRole(role: Role): void {
    this.phraseRole = role;
    this.restartPhrase();
  }

  getPhraseRole(): Role {
    return this.phraseRole;
  }

  setTempo(bpm: number): void {
    this.tempo = bpm;
    this.phrasePlayer?.setBpm(bpm);
  }

  getTempo(): number {
    return this.tempo;
  }

  play(): void {
    this.phrasePlayer?.start();
  }

  stopTransport(): void {
    this.phrasePlayer?.stop();
  }

  /** Einzelne manuelle Note (z.B. fuer punktuelles Antesten). */
  noteOn(note: number, velocity = 0.8): void {
    const vm = this.loader?.activeVoiceManager;
    if (vm) vm.noteOn(note, velocity, AudioEngine.currentTime);
  }

  noteOff(note: number): void {
    const vm = this.loader?.activeVoiceManager;
    if (vm) vm.noteOff(note, AudioEngine.currentTime);
  }

  /** Live-Parameteraenderung auf der aktuell klingenden Voice (Makro-/Reglerdrag), ohne Preset-Reload. */
  setLiveParam(paramId: string, value: number | string | boolean): void {
    const vm = this.loader?.activeVoiceManager;
    if (vm) vm.setParam(paramId, value, AudioEngine.currentTime);
  }

  updateFx(fx: Parameters<FxChain["update"]>[0]): void {
    this.fxChain?.update(fx);
  }

  /** Kontext-Hoeren (Taste G): spielt das Preset gegen einen leisen Referenz-Drone. */
  async toggleReferenceDrone(): Promise<void> {
    await this.resume();
    const vm = this.loader?.activeVoiceManager;
    if (!vm) return;
    if (this.refDroneOn) {
      vm.noteOff(REFERENCE_DRONE_NOTE, AudioEngine.currentTime);
      this.refDroneOn = false;
    } else {
      vm.noteOn(REFERENCE_DRONE_NOTE, 0.25, AudioEngine.currentTime);
      this.refDroneOn = true;
    }
  }

  async connectHardwareMidi(): Promise<boolean> {
    if (this.hardwareHandle) return true;
    this.hardwareHandle = await connectHardwareInput(AudioEngine.ctx, () => this.loader?.activeVoiceManager ?? null);
    return true;
  }

  panic(): void {
    this.loader?.activeVoiceManager?.panic(AudioEngine.currentTime);
    this.phrasePlayer?.stop();
    AudioEngine.panic();
    this.refDroneOn = false;
  }

  get activeVoiceCount(): number {
    return this.loader?.activeVoiceManager?.voiceCount ?? 0;
  }

  dispose(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.phrasePlayer?.dispose();
    this.hardwareHandle?.disconnect();
    this.loader?.dispose();
    this.fxChain?.dispose();
    this.meters?.dispose();
  }
}

export const AudioController = new AudioControllerImpl();
