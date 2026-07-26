// Polyphonie-Verwaltung: Voice-Stealing (ältester Voice zuerst), Note-Off mit
// Release-Tail ohne Klick, automatisches Aufräumen beendeter Voices.
//
// WICHTIG: stop()/release() schalten eine Voice nur stumm (Gain-Fade); die
// zugrunde liegenden AudioNodes bleiben bis zum expliziten dispose() im Graphen
// verbunden und aktiv. Bei Engines mit internen Feedback-Loops (z.B. string.ts)
// liefe ein nur stummgeschalteter, aber nie disposeter Voice-Graph unbegrenzt
// weiter im Hintergrund. Jede Stop-Variante hier plant deshalb den echten
// dispose() zeitgenau ein, statt sich auf den naechsten noteOn() zu verlassen.
// Siehe PLAN.md Phase 2.
import type { Engine, EngineGlobals, ParamValues, ParamValue, Voice } from "./types";

const STEAL_FADE_S = 0.02;
const POLL_MS = 80;

interface ActiveVoice {
  voice: Voice;
  note: number;
  startedAt: number;
  releasing: boolean;
  disposed: boolean;
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

  /** Pollt bis die Voice ihre Release-Phase durchlaufen hat, dann garantiert dispose(). */
  private scheduleDispose(av: ActiveVoice): void {
    const poll = () => {
      if (av.disposed) return;
      const now = this.globals.audioContext.currentTime;
      if (av.voice.isFinished(now)) {
        av.disposed = true;
        av.voice.dispose();
        this.active = this.active.filter((a) => a !== av);
      } else {
        setTimeout(poll, POLL_MS);
      }
    };
    setTimeout(poll, POLL_MS);
  }

  private sweepFinished(time: number) {
    this.active = this.active.filter((av) => {
      if (av.disposed) return false;
      if (av.releasing && av.voice.isFinished(time)) {
        av.disposed = true;
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
      oldest.releasing = true;
      this.scheduleDispose(oldest);
      this.active = this.active.filter((av) => av !== oldest);
    }

    const voice = this.engine.createVoice(this.globals, this.params, note);
    voice.output.connect(this.output);
    voice.trigger(velocity, time);
    this.active.push({ voice, note, startedAt: time, releasing: false, disposed: false });
  }

  noteOff(note: number, time: number): void {
    for (const av of this.active) {
      if (av.note === note && !av.releasing) {
        av.voice.release(time);
        av.releasing = true;
        this.scheduleDispose(av);
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
    for (const av of this.active) {
      av.voice.stop(time, STEAL_FADE_S);
      av.releasing = true;
      this.scheduleDispose(av);
    }
    this.active = [];
  }

  get voiceCount(): number {
    return this.active.length;
  }

  dispose(): void {
    for (const av of this.active) {
      av.disposed = true;
      av.voice.dispose();
    }
    this.active = [];
  }
}
