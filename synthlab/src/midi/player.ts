// Sample-genauer Lookahead-Scheduler fuer Phrasen (PLAN.md Phase 6). Gehaltene
// Noten (role=drone, event.hold=true) werden einmalig getriggert und klingen
// kontinuierlich, statt bei jeder Schleifenwiederholung neu anzusetzen.
// Phrasenwechsel ist nahtlos moeglich, ohne den Transport zu stoppen.
import type { VoiceManager } from "../audio/core/VoiceManager";
import type { NoteSequence, NoteEvent } from "./phrases";

const LOOKAHEAD_S = 0.15;
const TICK_MS = 25;

interface ScheduledHold {
  note: number;
  event: NoteEvent;
}

export class PhrasePlayer {
  private ctx: BaseAudioContext;
  private getVoiceManager: () => VoiceManager | null;
  private bpm = 60;
  private phrase: NoteSequence | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private loopStartTime = 0;
  private nextEventIdx = 0;
  private cycleEvents: NoteEvent[] = [];
  private holds: ScheduledHold[] = [];
  private running = false;

  constructor(ctx: BaseAudioContext, getVoiceManager: () => VoiceManager | null, bpm = 60) {
    this.ctx = ctx;
    this.getVoiceManager = getVoiceManager;
    this.bpm = bpm;
  }

  private secondsPerBeat(): number {
    return 60 / this.bpm;
  }

  setBpm(bpm: number): void {
    this.bpm = Math.max(10, bpm);
  }

  /** Wechselt die Phrase nahtlos: alte Held-Noten (Drone) klingen aus, neue startet sofort. */
  setPhrase(phrase: NoteSequence): void {
    this.releaseHolds();
    this.phrase = phrase;
    this.cycleEvents = phrase.events.filter((e) => !e.hold);
    this.nextEventIdx = 0;
    this.loopStartTime = this.ctx.currentTime;
    if (this.running) {
      this.triggerHolds(phrase);
    }
  }

  private triggerHolds(phrase: NoteSequence): void {
    if (this.holds.length > 0) return; // Prevent double trigger
    const vm = this.getVoiceManager();
    if (!vm) return;
    const now = this.ctx.currentTime;
    for (const event of phrase.events) {
      if (!event.hold) continue;
      vm.noteOn(event.note, event.velocity, now + event.startBeat * this.secondsPerBeat());
      this.holds.push({ note: event.note, event });
    }
  }

  private releaseHolds(): void {
    const vm = this.getVoiceManager();
    if (vm) {
      const now = this.ctx.currentTime;
      for (const h of this.holds) vm.noteOff(h.note, now);
    }
    this.holds = [];
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    if (this.phrase) {
      this.loopStartTime = this.ctx.currentTime;
      this.triggerHolds(this.phrase);
    }
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  stop(): void {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.releaseHolds();
    const vm = this.getVoiceManager();
    if (vm) {
      const now = this.ctx.currentTime;
      // Alle noch klingenden, per Loop getriggerten Noten sanft beenden.
      for (const e of this.cycleEvents) vm.noteOff(e.note, now);
    }
  }

  private tick(): void {
    if (!this.phrase || this.cycleEvents.length === 0) return;
    const vm = this.getVoiceManager();
    if (!vm) return;

    const spb = this.secondsPerBeat();
    const loopLenSeconds = this.phrase.lengthBeats * spb;
    const now = this.ctx.currentTime;

    while (true) {
      if (this.nextEventIdx >= this.cycleEvents.length) {
        this.nextEventIdx = 0;
        this.loopStartTime += loopLenSeconds;
        continue;
      }
      const event = this.cycleEvents[this.nextEventIdx];
      const eventTime = this.loopStartTime + event.startBeat * spb;
      if (eventTime > now + LOOKAHEAD_S) break;

      vm.noteOn(event.note, event.velocity, eventTime);
      vm.noteOff(event.note, eventTime + event.durationBeats * spb);
      this.nextEventIdx++;
    }
  }

  dispose(): void {
    this.stop();
  }
}
