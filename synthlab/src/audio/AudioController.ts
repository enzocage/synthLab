// Track-Manager: verkabelt Audio-Core, N unabhaengige Track-Audiographen
// (audio/TrackAudio.ts), Arpeggiator und Phrase-Player zu einem imperativen
// Controller, den die React-UI anspricht. Bewusst außerhalb von React-State
// gehalten - Audio-Graphen sind mutable/imperativ, React-State ist es nicht.
//
// Jede Spur hat ihre eigene FX-Kette + PresetLoader (TrackAudio), alle Spuren
// mischen in AudioEngine.masterInput. Tastatur/Arp/Hardware-MIDI zielen immer
// auf die aktuell ausgewaehlte Spur (setSelectedTrack).
import { AudioEngine } from "./core/AudioEngine";
import { ensureDx7WorkletLoaded } from "./engines/dx7";
import { ensureAllFxWorkletsLoaded } from "./worklets/fxWorkletRegistry";
import { Meters, type MeterReading } from "./core/Meters";
import { TrackAudio } from "./TrackAudio";
import { generatePhrase, type Phrase } from "../midi/phrases";
import { PhrasePlayer } from "../midi/player";
import { connectHardwareInput, type HardwareInputHandle } from "../midi/hardwareInput";
import { Arpeggiator, defaultArpSettings, type ArpSettings } from "../midi/arpeggiator";
import type { KeyContext } from "../midi/theory";
import type { Role } from "../presets/schema";
import type { Preset } from "../presets/schema";
import type { Clip } from "../store/tracksStore";
import { newClipId } from "../store/tracksStore";

const REFERENCE_DRONE_NOTE = 45; // A2, leiser Kontext-Drone fuer "gegen etwas hoeren" (Taste G)
const BEATS_PER_BAR = 4;

interface RecordingState {
  trackId: string;
  startTime: number;
  events: { note: number; startBeat: number; durationBeats: number; velocity: number }[];
  open: Map<number, { startBeat: number; velocity: number }>;
}

class AudioControllerImpl {
  private tracks = new Map<string, TrackAudio>();
  private selectedTrackId: string | null = null;
  private meters: Meters | null = null;
  private phrasePlayer: PhrasePlayer | null = null;
  private arp: Arpeggiator | null = null;
  private hardwareHandle: HardwareInputHandle | null = null;
  private refDroneOn = false;
  private tempo = 66;
  private phraseRole: Role = "pad";
  private key: KeyContext = { root: 57, scale: "dorian" };
  private phraseSeed = 1;
  private meterListeners = new Set<(m: MeterReading) => void>();
  private rafId: number | null = null;
  private recording: RecordingState | null = null;
  private graphReady = false;

  private ensureGraph(): void {
    if (this.graphReady) return;
    this.graphReady = true;
    const ctx = AudioEngine.ctx;
    this.meters = new Meters(ctx, AudioEngine.masterOut);
    this.phrasePlayer = new PhrasePlayer(ctx, () => this.selectedTrackAudio()?.voiceManager ?? null, this.tempo);
    this.arp = new Arpeggiator(ctx, () => this.selectedTrackAudio()?.voiceManager ?? null);
    this.arp.setBpm(this.tempo);

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
    await ensureAllFxWorkletsLoaded(AudioEngine.ctx);
    this.ensureGraph();
  }

  private ensureTrackAudio(trackId: string): TrackAudio {
    let t = this.tracks.get(trackId);
    if (!t) {
      t = new TrackAudio(AudioEngine.ctx, AudioEngine.masterInput);
      t.setBpm(this.tempo);
      this.tracks.set(trackId, t);
    }
    return t;
  }

  private selectedTrackAudio(): TrackAudio | null {
    if (!this.selectedTrackId) return null;
    return this.tracks.get(this.selectedTrackId) ?? null;
  }

  setSelectedTrack(trackId: string): void {
    this.selectedTrackId = trackId;
    if (this.graphReady) this.ensureTrackAudio(trackId);
  }

  onMeter(cb: (m: MeterReading) => void): () => void {
    this.meterListeners.add(cb);
    return () => this.meterListeners.delete(cb);
  }

  /** Laedt ein Preset klickfrei (Crossfade) auf die aktuell ausgewaehlte Spur. */
  async loadPreset(preset: Preset): Promise<void> {
    await this.resume();
    if (preset.engine === "dx7") await ensureDx7WorkletLoaded(AudioEngine.ctx);
    if (!this.selectedTrackId) return;
    this.ensureTrackAudio(this.selectedTrackId).loadPreset(preset);
    this.restartPhrase();
  }

  loadPresetOnTrack(trackId: string, preset: Preset): void {
    this.ensureTrackAudio(trackId).loadPreset(preset);
  }

  getTrackPreset(trackId: string): Preset | null {
    return this.tracks.get(trackId)?.preset ?? null;
  }

  setTrackMuted(trackId: string, muted: boolean): void {
    this.ensureTrackAudio(trackId).setMuted(muted);
  }

  removeTrackAudio(trackId: string): void {
    const t = this.tracks.get(trackId);
    if (t) {
      t.dispose();
      this.tracks.delete(trackId);
    }
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
    this.arp?.setBpm(bpm);
    for (const t of this.tracks.values()) t.setBpm(bpm);
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

  // --- Arpeggiator --------------------------------------------------------

  setArpSettings(settings: ArpSettings): void {
    this.arp?.setSettings(settings);
  }

  getArpSettings(): ArpSettings {
    return this.arp?.getSettings() ?? defaultArpSettings();
  }

  // --- Notenrouting (Tastatur, Hardware-MIDI) -----------------------------
  // Route durch den Arp, falls aktiv; sonst direkt auf die ausgewaehlte Spur.
  // Wird zusaetzlich in eine laufende Aufnahme geschrieben.

  noteOn(note: number, velocity = 0.8): void {
    const track = this.selectedTrackAudio();
    if (this.arp?.isEnabled) this.arp.noteOn(note);
    else track?.noteOn(note, velocity);
    this.recordNoteOn(note, velocity);
  }

  noteOff(note: number): void {
    const track = this.selectedTrackAudio();
    if (this.arp?.isEnabled) this.arp.noteOff(note);
    else track?.noteOff(note);
    this.recordNoteOff(note);
  }

  /** Live-Parameteraenderung auf der aktuell klingenden Voice (Makro-/Reglerdrag), ohne Preset-Reload. */
  setLiveParam(paramId: string, value: number | string | boolean, trackId?: string): void {
    const now = AudioEngine.currentTime;
    const track = trackId ? this.tracks.get(trackId) : this.selectedTrackAudio();
    if (track) {
      if (track.preset) {
        track.preset.params[paramId] = value as any;
      }
      track.voiceManager?.setParam(paramId, value, now);
    }
  }

  updateFx(fx: Preset["fx"]): void {
    if (!this.selectedTrackId) return;
    this.ensureTrackAudio(this.selectedTrackId).updateFx(fx);
  }

  /** Kontext-Hoeren (Taste G): spielt das Preset gegen einen leisen Referenz-Drone. */
  async toggleReferenceDrone(): Promise<void> {
    await this.resume();
    const track = this.selectedTrackAudio();
    if (!track) return;
    if (this.refDroneOn) {
      track.noteOff(REFERENCE_DRONE_NOTE);
      this.refDroneOn = false;
    } else {
      track.noteOn(REFERENCE_DRONE_NOTE, 0.25);
      this.refDroneOn = true;
    }
  }

  async connectHardwareMidi(): Promise<boolean> {
    if (this.hardwareHandle) return true;
    this.hardwareHandle = await connectHardwareInput({
      noteOn: (note: number, velocity: number) => this.noteOn(note, velocity),
      noteOff: (note: number) => this.noteOff(note),
    });
    return true;
  }

  // --- Recording -----------------------------------------------------------

  startRecording(trackId: string): void {
    this.recording = { trackId, startTime: AudioEngine.currentTime, events: [], open: new Map() };
  }

  isRecording(): boolean {
    return this.recording !== null;
  }

  private beatsSince(time: number): number {
    return (time - (this.recording?.startTime ?? time)) / (60 / this.tempo);
  }

  private recordNoteOn(note: number, velocity: number): void {
    if (!this.recording) return;
    const startBeat = this.beatsSince(AudioEngine.currentTime);
    this.recording.open.set(note, { startBeat, velocity });
  }

  private recordNoteOff(note: number): void {
    if (!this.recording) return;
    const open = this.recording.open.get(note);
    if (!open) return;
    const endBeat = this.beatsSince(AudioEngine.currentTime);
    this.recording.events.push({
      note,
      startBeat: open.startBeat,
      durationBeats: Math.max(0.05, endBeat - open.startBeat),
      velocity: open.velocity,
    });
    this.recording.open.delete(note);
  }

  /** Beendet die Aufnahme und liefert den entstandenen Clip (oder null bei leerer Aufnahme). */
  stopRecording(): Clip | null {
    const rec = this.recording;
    if (!rec) return null;
    const nowBeat = this.beatsSince(AudioEngine.currentTime);
    for (const [note, open] of rec.open) {
      rec.events.push({ note, startBeat: open.startBeat, durationBeats: Math.max(0.05, nowBeat - open.startBeat), velocity: open.velocity });
    }
    this.recording = null;
    if (rec.events.length === 0) return null;

    const lengthBeats = Math.max(BEATS_PER_BAR, Math.ceil(nowBeat / BEATS_PER_BAR) * BEATS_PER_BAR);
    return {
      id: newClipId(),
      name: `Take ${new Date().toLocaleTimeString()}`,
      events: rec.events,
      lengthBeats,
    };
  }

  playClipOnTrack(trackId: string, clip: Clip): void {
    this.ensureTrackAudio(trackId).playClip(clip);
  }

  stopClipOnTrack(trackId: string): void {
    this.tracks.get(trackId)?.stopClip();
  }

  panic(): void {
    for (const t of this.tracks.values()) t.panic();
    this.phrasePlayer?.stop();
    this.arp?.setSettings({ ...(this.arp?.getSettings() ?? defaultArpSettings()), enabled: false });
    AudioEngine.panic();
    this.refDroneOn = false;
    this.recording = null;
  }

  get activeVoiceCount(): number {
    return this.selectedTrackAudio()?.voiceManager?.voiceCount ?? 0;
  }

  get currentTime(): number {
    return AudioEngine.currentTime;
  }

  dispose(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.phrasePlayer?.dispose();
    this.arp?.dispose();
    this.hardwareHandle?.disconnect();
    for (const t of this.tracks.values()) t.dispose();
    this.tracks.clear();
    this.meters?.dispose();
  }
}

export const AudioController = new AudioControllerImpl();
