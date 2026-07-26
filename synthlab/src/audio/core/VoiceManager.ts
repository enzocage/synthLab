// Polyphonie-Verwaltung: Voice-Stealing (ältester Voice zuerst), Note-Off mit
// Release-Tail ohne Klick, automatisches Aufräumen beendeter Voices.
// Siehe PLAN.md Phase 2.
import type { Engine, EngineGlobals, ParamValues, ParamValue, Voice } from "./types";

const STEAL_FADE_S = 0.02;

interface ActiveVoice {
  voice: Voice;
  note: number;
  startedAt: number;
  releasing: boolean;
}

export class VoiceManager {
  private active: ActiveVoice[] = [];
  private engine: Engine;
  private globals: EngineGlobals;
  private params: ParamValues;
  private output: AudioNode;
  private maxVoices: number;

  constructor(engine: Engine, globals: EngineGlobals, params: ParamValues, output: AudioNode, maxVoices = 8) {
    this.engine = engine;
    this.globals = globals;
    this.params = params;
    this.output = output;
    this.maxVoices = maxVoices;
  }

  private sweepFinished(time: number) {
    this.active = this.active.filter((av) => {
      if (av.releasing && av.voice.isFinished(time)) {
        av.voice.dispose();
        return false;
      }
      return true;
    });
  }

  noteOn(note: number, velocity: number, time: number): void {
    this.sweepFinished(time);

    if (this.active.length >= this.maxVoices) {
      // Voice-Stealing: älteste zuerst, mit kurzem Fade statt hartem Abbruch.
      const oldest = this.active.reduce((a, b) => (a.startedAt <= b.startedAt ? a : b));
      oldest.voice.stop(time, STEAL_FADE_S);
      this.active = this.active.filter((av) => av !== oldest);
    }

    const voice = this.engine.createVoice(this.globals, this.params, note);
    voice.output.connect(this.output);
    voice.trigger(velocity, time);
    this.active.push({ voice, note, startedAt: time, releasing: false });
  }

  noteOff(note: number, time: number): void {
    for (const av of this.active) {
      if (av.note === note && !av.releasing) {
        av.voice.release(time);
        av.releasing = true;
      }
    }
  }

  /** Für Drone/Latch-Modus: hält alle aktuell klingenden Noten unendlich (kein Auto-Release). */
  holdAll(): void {
    // No-op Marker-Methode; Aufrufer verzichtet einfach auf noteOff, solange gehalten wird.
  }

  setParam(paramId: string, value: ParamValue, time: number): void {
    this.params[paramId] = value;
    for (const av of this.active) av.voice.setParam(paramId, value, time);
  }

  panic(time: number): void {
    for (const av of this.active) av.voice.stop(time, STEAL_FADE_S);
    this.active = [];
  }

  get voiceCount(): number {
    return this.active.length;
  }

  dispose(): void {
    for (const av of this.active) av.voice.dispose();
    this.active = [];
  }
}
