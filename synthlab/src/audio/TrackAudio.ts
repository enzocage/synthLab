// Ein eigenstaendiger Audio-Graph pro Spur: PresetLoader (klickfreier Preset-
// Hot-Swap) + eigene FX-Kette + Clip-Player, gemischt in einen Track-Gain vor
// dem gemeinsamen Master. Ermoeglicht, dass mehrere Spuren gleichzeitig und
// unabhaengig voneinander Klaenge/Clips abspielen (Ableton-Stil).
import { PresetLoader } from "./core/PresetLoader";
import type { VoiceManager } from "./core/VoiceManager";
import { FxChain } from "./fx/FxChain";
import { defaultFxChainSettings } from "./fx/types";
import { getEngine } from "./engines/registry";
import type { FxChainSettings } from "./fx/types";
import { PhrasePlayer } from "../midi/player";
import type { NoteSequence } from "../midi/phrases";
import type { Preset } from "../presets/schema";

export class TrackAudio {
  readonly trackGain: GainNode;
  private ctx: BaseAudioContext;
  private fxChain: FxChain;
  private loader: PresetLoader;
  private clipPlayer: PhrasePlayer;
  private currentPreset: Preset | null = null;

  constructor(ctx: BaseAudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.trackGain = ctx.createGain();
    this.trackGain.connect(destination);

    this.fxChain = new FxChain(ctx, defaultFxChainSettings());
    this.fxChain.output.connect(this.trackGain);
    this.fxChain.start(ctx.currentTime);

    this.loader = new PresetLoader(ctx, this.fxChain.input);
    this.clipPlayer = new PhrasePlayer(ctx, () => this.loader.activeVoiceManager, 66);
  }

  loadPreset(preset: Preset): void {
    this.currentPreset = preset;
    const engine = getEngine(preset.engine);
    this.loader.load(engine, preset.params, 8);
    this.fxChain.update(preset.fx);
  }

  get preset(): Preset | null {
    return this.currentPreset;
  }

  updateFx(fx: FxChainSettings): void {
    this.fxChain.update(fx);
    if (this.currentPreset) this.currentPreset = { ...this.currentPreset, fx };
  }

  get voiceManager(): VoiceManager | null {
    return this.loader.activeVoiceManager;
  }

  setMuted(muted: boolean): void {
    this.trackGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.02);
  }

  setBpm(bpm: number): void {
    this.clipPlayer.setBpm(bpm);
  }

  playClip(sequence: NoteSequence): void {
    this.clipPlayer.setPhrase(sequence);
    this.clipPlayer.start();
  }

  stopClip(): void {
    this.clipPlayer.stop();
  }

  noteOn(note: number, velocity = 0.8): void {
    this.loader.activeVoiceManager?.noteOn(note, velocity, this.ctx.currentTime);
  }

  noteOff(note: number): void {
    this.loader.activeVoiceManager?.noteOff(note, this.ctx.currentTime);
  }

  panic(): void {
    this.loader.activeVoiceManager?.panic(this.ctx.currentTime);
  }

  dispose(): void {
    this.clipPlayer.dispose();
    this.loader.dispose();
    this.fxChain.dispose();
    this.trackGain.disconnect();
  }
}
