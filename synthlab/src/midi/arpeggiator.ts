// Konfigurierbares Arpeggiator-Modul: haelt gedrueckte Noten (Tastatur, Web-MIDI-
// Hardware) und spielt sie nach Pattern/Rate/Oktavbereich/Gate ab, statt sie
// direkt an den VoiceManager weiterzureichen. Sample-genauer Lookahead-Scheduler,
// analog zu midi/player.ts.
import type { VoiceManager } from "../audio/core/VoiceManager";

export type ArpPattern = "up" | "down" | "updown" | "random" | "asPlayed";

export interface ArpSettings {
  enabled: boolean;
  pattern: ArpPattern;
  rateDivision: number; // Notendivision relativ zu einer Viertelnote: 1=1/4, 2=1/8, 4=1/16, 8=1/32
  octaves: number; // 1..4: wie viele Oktaven ueber den gehaltenen Noten mitlaufen
  gate: number; // 0..1: Anteil der Schrittdauer, den eine Note klingt
  latch: boolean; // Noten bleiben nach Loslassen gehalten, bis neue gespielt werden
}

export function defaultArpSettings(): ArpSettings {
  return { enabled: false, pattern: "up", rateDivision: 2, octaves: 1, gate: 0.7, latch: false };
}

const LOOKAHEAD_S = 0.15;
const TICK_MS = 25;

export class Arpeggiator {
  private ctx: BaseAudioContext;
  private getVoiceManager: () => VoiceManager | null;
  private settings: ArpSettings = defaultArpSettings();
  private bpm = 66;
  private heldOrder: number[] = []; // Reihenfolge des Anschlags, fuer "asPlayed"
  private held = new Set<number>();
  private physicallyDown = new Set<number>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextStepTime = 0;
  private stepIndex = 0;
  private activeNote: { note: number; offTime: number } | null = null;

  constructor(ctx: BaseAudioContext, getVoiceManager: () => VoiceManager | null) {
    this.ctx = ctx;
    this.getVoiceManager = getVoiceManager;
  }

  setSettings(settings: ArpSettings): void {
    const wasEnabled = this.settings.enabled;
    this.settings = settings;
    if (settings.enabled && !wasEnabled) this.startScheduler();
    if (!settings.enabled && wasEnabled) this.stopScheduler();
  }

  getSettings(): ArpSettings {
    return this.settings;
  }

  setBpm(bpm: number): void {
    this.bpm = bpm;
  }

  get isEnabled(): boolean {
    return this.settings.enabled;
  }

  /** Tastatur/MIDI ruft dies statt direkt vm.noteOn(), wenn der Arp aktiv ist. */
  noteOn(note: number): void {
    // Latch: waren zuvor alle Tasten losgelassen, ersetzt die naechste neue
    // Note den alten gehaltenen Akkord, statt ihn nur zu ergaenzen.
    if (this.settings.latch && this.physicallyDown.size === 0) {
      this.held.clear();
      this.heldOrder = [];
    }
    this.physicallyDown.add(note);
    if (!this.held.has(note)) {
      this.held.add(note);
      this.heldOrder.push(note);
    }
  }

  noteOff(note: number): void {
    this.physicallyDown.delete(note);
    if (this.settings.latch) return; // Latch: Noten bleiben bis zum naechsten neuen Akkord gehalten
    this.held.delete(note);
    this.heldOrder = this.heldOrder.filter((n) => n !== note);
  }

  private buildSequence(): number[] {
    const base = [...this.heldOrder].sort((a, b) => a - b);
    if (base.length === 0) return [];

    const withOctaves: number[] = [];
    for (let o = 0; o < Math.max(1, this.settings.octaves); o++) {
      for (const n of base) withOctaves.push(n + o * 12);
    }

    switch (this.settings.pattern) {
      case "up":
        return withOctaves;
      case "down":
        return [...withOctaves].reverse();
      case "updown": {
        const down = [...withOctaves].reverse().slice(1, -1);
        return [...withOctaves, ...down];
      }
      case "asPlayed": {
        const seq: number[] = [];
        for (let o = 0; o < Math.max(1, this.settings.octaves); o++) {
          for (const n of this.heldOrder) seq.push(n + o * 12);
        }
        return seq;
      }
      case "random":
        return withOctaves; // Reihenfolge wird pro Schritt zufaellig gewaehlt (siehe tick())
      default:
        return withOctaves;
    }
  }

  private startScheduler(): void {
    this.nextStepTime = this.ctx.currentTime;
    this.stepIndex = 0;
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  private stopScheduler(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.releaseActive(this.ctx.currentTime);
    this.held.clear();
    this.heldOrder = [];
  }

  private releaseActive(time: number): void {
    const vm = this.getVoiceManager();
    if (vm && this.activeNote) vm.noteOff(this.activeNote.note, time);
    this.activeNote = null;
  }

  private stepSeconds(): number {
    // rateDivision=1 -> Viertelnote, 2 -> Achtel, 4 -> Sechzehntel, 8 -> 32tel
    return (60 / this.bpm) / this.settings.rateDivision;
  }

  private tick(): void {
    const vm = this.getVoiceManager();
    if (!vm || !this.settings.enabled) return;
    const now = this.ctx.currentTime;
    const step = this.stepSeconds();

    while (this.nextStepTime < now + LOOKAHEAD_S) {
      const seq = this.buildSequence();
      if (seq.length > 0) {
        const note =
          this.settings.pattern === "random"
            ? seq[Math.floor(Math.random() * seq.length)]
            : seq[this.stepIndex % seq.length];

        if (this.activeNote) vm.noteOff(this.activeNote.note, this.nextStepTime);
        vm.noteOn(note, 0.75, this.nextStepTime);
        const offTime = this.nextStepTime + step * Math.max(0.05, this.settings.gate);
        vm.noteOff(note, offTime);
        this.activeNote = { note, offTime };
        this.stepIndex++;
      } else if (this.activeNote) {
        vm.noteOff(this.activeNote.note, this.nextStepTime);
        this.activeNote = null;
      }
      this.nextStepTime += step;
    }
  }

  dispose(): void {
    this.stopScheduler();
  }
}
