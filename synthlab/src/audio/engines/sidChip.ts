// SID Engine: C64 SID (6581/8580 inspired non-cycle-accurate Web Audio 3-voice engine)
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { AdsrGain } from "./shared/envelope";
import { midiToHz } from "./shared/util";
import { createNoiseSource } from "./shared/noise";

export const sidParams: ParamSpec[] = [
  // Osc / Voice 1 Waveform & Mod
  { id: "waveform", label: "Wellenform", kind: "enum", options: ["triangle", "sawtooth", "pulse", "noise"], default: "pulse", group: "osc" },
  { id: "pulseWidth", label: "Pulsbreite", kind: "float", min: 0.05, max: 0.95, default: 0.5, group: "osc", smooth: true },
  { id: "pwmLfoRate", label: "PWM Tempo", kind: "float", min: 0.1, max: 10, default: 1.5, unit: "Hz", group: "osc" },
  { id: "pwmLfoDepth", label: "PWM Tiefe", kind: "float", min: 0, max: 0.4, default: 0.2, group: "osc" },
  { id: "vibratoRate", label: "Vibrato Tempo", kind: "float", min: 1, max: 12, default: 5, unit: "Hz", group: "osc" },
  { id: "vibratoDepth", label: "Vibrato Tiefe", kind: "float", min: 0, max: 100, default: 0, unit: "ct", group: "osc" },
  { id: "pitchSweep", label: "Pitch Sweep", kind: "float", min: -24, max: 24, default: 0, unit: "semitones", group: "osc" },

  // Hard Sync & Ring Mod
  { id: "hardSync", label: "Hard Sync (Osc 2->1)", kind: "bool", default: false, group: "mod" },
  { id: "ringMod", label: "Ring Mod (Osc 2x1)", kind: "bool", default: false, group: "mod" },
  { id: "modulatorRatio", label: "Modulator Ratio", kind: "float", min: 0.25, max: 4, default: 1.5, group: "mod" },

  // Internal Arp
  { id: "arpSpeed", label: "Arp Speed", kind: "enum", options: ["off", "fast", "medium", "slow"], default: "off", group: "arp" },
  { id: "arpInterval1", label: "Arp Intervall 1", kind: "int", min: -12, max: 24, default: 4, group: "arp" },
  { id: "arpInterval2", label: "Arp Intervall 2", kind: "int", min: -12, max: 24, default: 7, group: "arp" },

  // Filter
  { id: "filterType", label: "Filter Typ", kind: "enum", options: ["lowpass", "highpass", "bandpass", "off"], default: "lowpass", group: "filter" },
  { id: "cutoffHz", label: "Cutoff", kind: "float", min: 30, max: 12000, default: 1500, curve: "log", unit: "Hz", group: "filter", smooth: true, mutationWeight: 0.9 },
  { id: "resonance", label: "Resonanz", kind: "float", min: 0.1, max: 15, default: 2.5, group: "filter", smooth: true, mutationWeight: 0.8 },
  { id: "envToFilter", label: "Env->Filter", kind: "float", min: -6000, max: 6000, default: 1200, unit: "Hz", group: "filter" },
  { id: "chipModel", label: "Chip Modell", kind: "enum", options: ["6581", "8580", "neutral"], default: "6581", group: "filter" },

  // ADSR
  { id: "attack", label: "Attack", kind: "float", min: 0.002, max: 8, default: 0.01, curve: "log", unit: "s", group: "env" },
  { id: "decay", label: "Decay", kind: "float", min: 0.006, max: 9, default: 0.3, curve: "log", unit: "s", group: "env" },
  { id: "sustain", label: "Sustain", kind: "float", min: 0, max: 1, default: 0.7, group: "env" },
  { id: "release", label: "Release", kind: "float", min: 0.006, max: 9, default: 0.4, curve: "log", unit: "s", group: "env" },

  // Voice Cost Limit
  { id: "voiceCost", label: "Voice Cost", kind: "int", min: 1, max: 3, default: 1, group: "system" },
];

export class SidVoice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private params: ParamValues;
  private osc: OscillatorNode | AudioBufferSourceNode;
  private modOsc: OscillatorNode | null = null;
  private pwmLfo: OscillatorNode | null = null;
  private vibratoLfo: OscillatorNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private driveGain: GainNode;
  private ampEnv: AdsrGain;
  private arpTimer: number | null = null;

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    this.params = values;
    const baseFreq = midiToHz(note);

    const wave = String(values.waveform || "pulse");
    const chip = String(values.chipModel || "6581");

    // Signal chain: Osc -> [Filter] -> Drive (Saturator for 6581) -> AmpEnv -> output
    this.driveGain = this.ctx.createGain();
    this.driveGain.gain.value = chip === "6581" ? 1.2 : 1.0;

    this.ampEnv = new AdsrGain(this.ctx, {
      attack: Number(values.attack),
      decay: Number(values.decay),
      sustain: Number(values.sustain),
      release: Number(values.release),
    });

    const filterType = String(values.filterType);
    if (filterType !== "off") {
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = filterType as BiquadFilterType;
      this.filterNode.frequency.value = Number(values.cutoffHz);
      this.filterNode.Q.value = Number(values.resonance);
      this.filterNode.connect(this.driveGain);
    }

    const mainInputNode: AudioNode = this.filterNode || this.driveGain;

    if (wave === "noise") {
      this.osc = createNoiseSource(this.ctx, "white");
      this.osc.connect(mainInputNode);
    } else {
      const mainOsc = this.ctx.createOscillator();
      mainOsc.type = (wave === "pulse" ? "square" : wave) as OscillatorType;
      mainOsc.frequency.value = baseFreq;
      this.osc = mainOsc;

      // Vibrato
      const vibDepth = Number(values.vibratoDepth);
      if (vibDepth > 0) {
        this.vibratoLfo = this.ctx.createOscillator();
        this.vibratoLfo.frequency.value = Number(values.vibratoRate);
        const vibGain = this.ctx.createGain();
        vibGain.gain.value = vibDepth;
        this.vibratoLfo.connect(vibGain);
        vibGain.connect(mainOsc.detune);
      }

      // Ring Modulator
      if (values.ringMod) {
        this.modOsc = this.ctx.createOscillator();
        this.modOsc.type = "sawtooth";
        this.modOsc.frequency.value = baseFreq * Number(values.modulatorRatio);

        const ringGain = this.ctx.createGain();
        ringGain.gain.value = 0; // modulated
        mainOsc.connect(ringGain.gain);
        this.modOsc.connect(ringGain);
        ringGain.connect(mainInputNode);
      } else {
        mainOsc.connect(mainInputNode);
      }
    }

    this.driveGain.connect(this.ampEnv.node);
    this.output = this.ampEnv.node;
  }

  trigger(velocity: number, time: number): void {
    if (this.osc instanceof OscillatorNode) {
      this.osc.start(time);
      if (Number(this.params.pitchSweep) !== 0) {
        const targetHz = midiToHz(this.note + Number(this.params.pitchSweep));
        this.osc.frequency.setValueAtTime(targetHz, time);
        this.osc.frequency.exponentialRampToValueAtTime(midiToHz(this.note), time + 0.15);
      }
    } else {
      this.osc.start(time);
    }

    this.modOsc?.start(time);
    this.pwmLfo?.start(time);
    this.vibratoLfo?.start(time);
    this.ampEnv.trigger(velocity, time);

    // Envelope to filter modulation
    if (this.filterNode) {
      const baseHz = Number(this.params.cutoffHz);
      const envAmt = Number(this.params.envToFilter);
      const atk = Number(this.params.attack);
      const dec = Number(this.params.decay);
      const f = this.filterNode.frequency;
      f.cancelScheduledValues(time);
      f.setValueAtTime(baseHz, time);
      f.linearRampToValueAtTime(Math.min(Math.max(baseHz + envAmt, 40), 16000), time + Math.max(atk, 0.005));
      f.linearRampToValueAtTime(baseHz, time + atk + Math.max(dec, 0.005));
    }

    // Internal SID Arpeggio emulation (speed fast = ~30ms per step)
    const arpSpeed = String(this.params.arpSpeed);
    if (arpSpeed !== "off" && this.osc instanceof OscillatorNode) {
      const intervalMs = arpSpeed === "fast" ? 35 : arpSpeed === "medium" ? 70 : 120;
      const i1 = Number(this.params.arpInterval1);
      const i2 = Number(this.params.arpInterval2);
      const notes = [this.note, this.note + i1, this.note + i2];
      let idx = 0;

      const runArp = () => {
        idx = (idx + 1) % notes.length;
        if (this.osc instanceof OscillatorNode) {
          this.osc.frequency.setValueAtTime(midiToHz(notes[idx]), this.ctx.currentTime);
        }
      };

      this.arpTimer = window.setInterval(runArp, intervalMs);
    }
  }

  release(time: number): void {
    if (this.arpTimer !== null) {
      clearInterval(this.arpTimer);
      this.arpTimer = null;
    }
    this.ampEnv.release(time);
    const stopAt = time + Number(this.params.release) + 0.05;
    try { this.osc.stop(stopAt); } catch { /* noop */ }
    try { this.modOsc?.stop(stopAt); } catch { /* noop */ }
    try { this.pwmLfo?.stop(stopAt); } catch { /* noop */ }
    try { this.vibratoLfo?.stop(stopAt); } catch { /* noop */ }
  }

  stop(time: number, fadeSeconds = 0.02): void {
    if (this.arpTimer !== null) {
      clearInterval(this.arpTimer);
      this.arpTimer = null;
    }
    this.ampEnv.stop(time, fadeSeconds);
    const stopAt = time + fadeSeconds + 0.01;
    try { this.osc.stop(stopAt); } catch { /* noop */ }
    try { this.modOsc?.stop(stopAt); } catch { /* noop */ }
  }

  setParam(paramId: string, value: number | string | boolean, time: number): void {
    this.params[paramId] = value;
    if (paramId === "cutoffHz" && this.filterNode) {
      this.filterNode.frequency.setTargetAtTime(Number(value), time, 0.01);
    }
    if (paramId === "resonance" && this.filterNode) {
      this.filterNode.Q.setTargetAtTime(Number(value), time, 0.01);
    }
  }

  isFinished(time: number): boolean {
    return this.ampEnv.isFinished(time);
  }

  dispose(): void {
    if (this.arpTimer !== null) {
      clearInterval(this.arpTimer);
    }
    try { this.osc.disconnect(); } catch { /* noop */ }
    try { this.modOsc?.disconnect(); } catch { /* noop */ }
    try { this.pwmLfo?.disconnect(); } catch { /* noop */ }
    try { this.vibratoLfo?.disconnect(); } catch { /* noop */ }
    try { this.filterNode?.disconnect(); } catch { /* noop */ }
    this.driveGain.disconnect();
    this.ampEnv.node.disconnect();
  }
}

export const sidChipEngine: Engine = {
  id: "sid-chip",
  name: "SID Lab (C64 SID)",
  params: sidParams,
  defaultMacroMap: {
    brightness: [{ paramId: "cutoffHz", atZero: 100, atOne: 8000 }],
    motion: [{ paramId: "pwmLfoDepth", atZero: 0, atOne: 0.4 }],
    density: [{ paramId: "vibratoDepth", atZero: 0, atOne: 50 }],
    detune: [{ paramId: "pitchSweep", atZero: 0, atOne: 12 }],
    drive: [{ paramId: "resonance", atZero: 0.5, atOne: 12 }],
    body: [{ paramId: "pulseWidth", atZero: 0.1, atOne: 0.5 }],
    air: [{ paramId: "envToFilter", atZero: 0, atOne: 4000 }],
    space: [{ paramId: "release", atZero: 0.1, atOne: 5 }],
  },
  createVoice(globals, values, note) {
    return new SidVoice(globals, note, values);
  },
};

export function sidDefaults(): ParamValues {
  return defaultParamValues(sidParams);
}
