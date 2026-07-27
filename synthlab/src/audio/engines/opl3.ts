// 22. opl3: 2-Operator-FM nach Yamaha OPL2/OPL3 (YMF262), wie in unzähligen
// DOS-/Doom-Ära-Soundtracks. Parameter sind bewusst 1:1 die echten OPL-Register
// (Multiplier, Attack/Decay/Sustain/Release-Raten 0-15, Output-Level 0-63,
// Waveform 0-7, Feedback 0-7, Connection FM/additiv je Operator) - dadurch
// lassen sich die 175 importierten DMXOPL-Instrumente ohne Umrechnung direkt als
// engine-params verwenden (siehe research/extract/import-opl3.mjs, opl3Presets.ts).
//
// Nur Voice 0 der (max. 2, bei "twoVoice"-Flag) Original-OPL3-Stimmen wird
// nachgebildet - eine eigenständige Annäherung mit Standard-WebAudio-Nodes statt
// einer Registerebenen-genauen Chip-Emulation. Die 8 OPL-Wellenformen werden auf
// 5 mit WaveShaperNode/Oszillator-Bordmitteln erreichbare Formen abgebildet
// (sine/half-sine/abs-sine/square/saw) - siehe `oplWaveform()`.
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { AdsrGain } from "./shared/envelope";
import { midiToHz } from "./shared/util";

// Yamaha-OPL-Standardtabelle: Multiplier-Nibble (0..15) -> Frequenzverhältnis.
const MULT_TABLE = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 12, 12, 15, 15];

const params: ParamSpec[] = [
  // --- Modulator-Operator ---
  { id: "modMultiplier", label: "Mod Multiplier", kind: "int", min: 0, max: 15, default: 1, group: "mod" },
  { id: "modAttackRate", label: "Mod Attack", kind: "int", min: 0, max: 15, default: 12, group: "mod" },
  { id: "modDecayRate", label: "Mod Decay", kind: "int", min: 0, max: 15, default: 4, group: "mod" },
  { id: "modSustainLevel", label: "Mod Sustain", kind: "int", min: 0, max: 15, default: 4, group: "mod" },
  { id: "modReleaseRate", label: "Mod Release", kind: "int", min: 0, max: 15, default: 6, group: "mod" },
  { id: "modOutputLevel", label: "Mod Level", kind: "int", min: 0, max: 63, default: 20, group: "mod", mutationWeight: 0.8 },
  { id: "modWaveform", label: "Mod Waveform", kind: "int", min: 0, max: 7, default: 0, group: "mod" },
  { id: "modSustainMode", label: "Mod Sustain-Modus", kind: "bool", default: true, group: "mod" },
  // --- Carrier-Operator ---
  { id: "carMultiplier", label: "Car Multiplier", kind: "int", min: 0, max: 15, default: 1, group: "car" },
  { id: "carAttackRate", label: "Car Attack", kind: "int", min: 0, max: 15, default: 14, group: "car" },
  { id: "carDecayRate", label: "Car Decay", kind: "int", min: 0, max: 15, default: 4, group: "car" },
  { id: "carSustainLevel", label: "Car Sustain", kind: "int", min: 0, max: 15, default: 6, group: "car" },
  { id: "carReleaseRate", label: "Car Release", kind: "int", min: 0, max: 15, default: 6, group: "car" },
  { id: "carOutputLevel", label: "Car Level", kind: "int", min: 0, max: 63, default: 10, group: "car" },
  { id: "carWaveform", label: "Car Waveform", kind: "int", min: 0, max: 7, default: 0, group: "car" },
  { id: "carSustainMode", label: "Car Sustain-Modus", kind: "bool", default: true, group: "car" },
  // --- Global ---
  { id: "feedback", label: "Feedback", kind: "int", min: 0, max: 7, default: 3, group: "global", mutationWeight: 0.7 },
  { id: "connection", label: "Connection", kind: "enum", options: ["fm", "additive"], default: "fm", group: "global" },
  { id: "noteOffsetSemitones", label: "Note-Offset", kind: "int", min: -24, max: 24, default: 0, group: "global" },
];

function rateToSeconds(rate: number): number {
  // Rate 15 = schnellstmöglich (~8ms), Rate 0 = sehr langsam (~8s) - exponentielle
  // Näherung an die reale OPL-Hüllkurvengenerator-Charakteristik (kein 1:1-
  // Register-Timing, siehe Kommentar am Dateianfang).
  return 8 * Math.pow(2, -(rate / 15) * 10);
}

function outputLevelToGain(level: number): number {
  // OPL-Total-Level: 0..63 in 0.75dB-Schritten, 0 = lautestmöglich.
  return Math.pow(10, -(level * 0.75) / 20);
}

function sustainLevelToGain(level: number): number {
  // OPL-Sustain-Level: 0..15 in 3dB-Schritten Dämpfung, 0 = keine Dämpfung.
  return Math.pow(10, -(level * 3) / 20);
}

/** Erzeugt einen Oszillator, dessen Ausgabeform eine der 5 erreichbaren
 * Annäherungen an die 8 OPL-Wellenformen ist (siehe Dateikopf). */
function oplWaveform(ctx: BaseAudioContext, waveform: number): { osc: OscillatorNode; shaper: WaveShaperNode | null } {
  const osc = ctx.createOscillator();
  if (waveform === 6) {
    osc.type = "square";
    return { osc, shaper: null };
  }
  if (waveform === 7) {
    osc.type = "sawtooth";
    return { osc, shaper: null };
  }
  osc.type = "sine";
  if (waveform === 0) return { osc, shaper: null };
  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(1024);
  const halfRectified = waveform === 1 || waveform === 3 || waveform === 4;
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = halfRectified ? Math.max(x, 0) : Math.abs(x);
  }
  shaper.curve = curve;
  osc.connect(shaper);
  return { osc, shaper };
}

class Opl3Voice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private modOsc: OscillatorNode;
  private modOut: AudioNode;
  private modAmountGain: GainNode;
  private modEnv: AdsrGain;
  private modEnvConst: ConstantSourceNode;

  private carOsc: OscillatorNode;
  private carOut: AudioNode;
  private ampEnv: AdsrGain;

  private releaseSeconds: number;

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    const noteOffset = Number(values.noteOffsetSemitones);
    const baseFreq = midiToHz(note + noteOffset);

    const modMult = MULT_TABLE[Math.round(Number(values.modMultiplier))];
    const carMult = MULT_TABLE[Math.round(Number(values.carMultiplier))];

    const modWave = oplWaveform(this.ctx, Number(values.modWaveform));
    this.modOsc = modWave.osc;
    this.modOsc.frequency.value = baseFreq * modMult;
    this.modOut = modWave.shaper ?? this.modOsc;

    const carWave = oplWaveform(this.ctx, Number(values.carWaveform));
    this.carOsc = carWave.osc;
    this.carOsc.frequency.value = baseFreq * carMult;
    this.carOut = carWave.shaper ?? this.carOsc;

    // Modulator-Hüllkurve als audio-rate Signal (ConstantSource + AdsrGain, wie
    // in juno106.ts) - moduliert die FM-Tiefe über die Zeit, genau wie das reale
    // Modulator-EG in OPL-Patches ("hell im Attack, dumpfer im Sustain").
    const modAttackS = rateToSeconds(Number(values.modAttackRate));
    const modDecayS = rateToSeconds(Number(values.modDecayRate));
    const modSustain = sustainLevelToGain(Number(values.modSustainLevel));
    const modReleaseS = rateToSeconds(Number(values.modReleaseRate));
    this.modEnv = new AdsrGain(this.ctx, { attack: modAttackS, decay: modDecayS, sustain: modSustain, release: modReleaseS });
    this.modEnvConst = this.ctx.createConstantSource();
    this.modEnvConst.offset.value = 1;
    this.modEnvConst.connect(this.modEnv.node);

    const modLevelGain = outputLevelToGain(Number(values.modOutputLevel));
    const feedback = Number(values.feedback);
    const connection = String(values.connection);

    // Modulator-Ausgang läuft immer zuerst durch seine eigene Hüllkurve
    // (modEnv.node), dann - je nach Connection - entweder als FM-Tiefe in
    // carrier.frequency (klassisches 2-Op-FM) oder als eigenständiger,
    // additiv gemischter Klanganteil (Additive-Connection, wie am echten Chip).
    this.modAmountGain = this.ctx.createGain();
    this.modEnv.node.connect(this.modAmountGain);
    this.modOut.connect(this.modAmountGain);
    if (connection === "additive") {
      this.modAmountGain.gain.value = modLevelGain * 0.5;
    } else {
      const modDepthHz = baseFreq * (1.5 + feedback * 0.8) * modLevelGain * 6;
      this.modAmountGain.gain.value = modDepthHz;
      this.modAmountGain.connect(this.carOsc.frequency);
    }

    // Carrier-Hüllkurve = hörbare Amplitudenform der Stimme.
    const carAttackS = rateToSeconds(Number(values.carAttackRate));
    const carDecayS = rateToSeconds(Number(values.carDecayRate));
    const carSustain = sustainLevelToGain(Number(values.carSustainLevel));
    this.releaseSeconds = rateToSeconds(Number(values.carReleaseRate));
    this.ampEnv = new AdsrGain(this.ctx, { attack: carAttackS, decay: carDecayS, sustain: carSustain, release: this.releaseSeconds });

    const carLevelGain = this.ctx.createGain();
    carLevelGain.gain.value = outputLevelToGain(Number(values.carOutputLevel));
    this.carOut.connect(carLevelGain);
    carLevelGain.connect(this.ampEnv.node);

    if (connection === "additive") {
      this.modAmountGain.connect(this.ampEnv.node);
    }

    this.output = this.ampEnv.node;
  }

  trigger(velocity: number, time: number): void {
    this.modOsc.start(time);
    this.carOsc.start(time);
    this.modEnvConst.start(time);
    this.modEnv.trigger(1, time);
    this.ampEnv.trigger(velocity, time);
  }

  release(time: number): void {
    this.modEnv.release(time);
    this.ampEnv.release(time);
    const stopAt = time + this.releaseSeconds + 0.1;
    try { this.modOsc.stop(stopAt); } catch { /* noop */ }
    try { this.carOsc.stop(stopAt); } catch { /* noop */ }
    try { this.modEnvConst.stop(stopAt); } catch { /* noop */ }
  }

  stop(time: number, fadeSeconds = 0.02): void {
    this.ampEnv.stop(time, fadeSeconds);
    this.modEnv.stop(time, fadeSeconds);
    const stopAt = time + fadeSeconds + 0.05;
    try { this.modOsc.stop(stopAt); } catch { /* noop */ }
    try { this.carOsc.stop(stopAt); } catch { /* noop */ }
    try { this.modEnvConst.stop(stopAt); } catch { /* noop */ }
  }

  setParam(): void {
    // OPL-Register sind bewusst nur preset-seitig (nicht live) veränderbar -
    // ein Registerwechsel während des Klingens würde am echten Chip ebenfalls
    // einen Neuanschlag bedeuten.
  }

  isFinished(time: number): boolean {
    return this.ampEnv.isFinished(time);
  }

  dispose(): void {
    try { this.modOsc.disconnect(); } catch { /* noop */ }
    try { this.carOsc.disconnect(); } catch { /* noop */ }
    try { this.modEnvConst.disconnect(); } catch { /* noop */ }
    this.modEnv.node.disconnect();
    this.modAmountGain.disconnect();
    this.ampEnv.node.disconnect();
  }
}

export const opl3Engine: Engine = {
  id: "opl3",
  name: "OPL3 (Yamaha YMF262 2-Op FM)",
  params,
  defaultMacroMap: {
    brightness: [{ paramId: "modOutputLevel", atZero: 63, atOne: 0 }],
    motion: [{ paramId: "feedback", atZero: 0, atOne: 7 }],
    density: [{ paramId: "carMultiplier", atZero: 1, atOne: 8 }],
    space: [{ paramId: "carReleaseRate", atZero: 12, atOne: 2 }],
    drive: [{ paramId: "feedback", atZero: 1, atOne: 7 }],
    body: [{ paramId: "carOutputLevel", atZero: 40, atOne: 4 }],
  },
  createVoice(globals, values, note) {
    return new Opl3Voice(globals, note, values);
  },
};

export function opl3Defaults(): ParamValues {
  return defaultParamValues(params);
}
