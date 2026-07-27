// 20. juno106: Roland-Juno-106-artige DCO-Synthese (Saw+Pulse/PWM+Sub+Noise) mit
// 4-poligem 24dB-Tiefpass, gemeinsamem AHDSR-Envelope-Generator (VCA und/oder VCF
// je nach ENV/GATE-Modus), Vibrato/PWM-LFO und Onboard-Ensemble-Chorus (I/II).
//
// Parameter-Namen und -Skalen sind bewusst 1:1 identisch zu den in
// research/extract/import-juno106.mjs extrahierten Werkspatch-Feldern (0..1-
// normalisierte Original-Reglerwerte) - dadurch lassen sich die 128 importierten
// Juno-106-Presets ohne jede Umrechnung direkt als engine-params verwenden.
// Umrechnungskurven (to_filter_freq/to_resonance/to_*_time/to_lfo_*) sind aus
// research/vendor/amy/amy/juno.py portiert (MIT, siehe research/LICENSES.md).
// HPF-Eckfrequenzen und Keyboard-Tracking-Formel sind eine eigene, an
// dokumentiertem Juno-106-Hardwareverhalten orientierte Vereinfachung (siehe
// Kommentare unten) statt einer 1:1-Portierung von AMYs internem EQ-Workaround.
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { AdsrGain } from "./shared/envelope";
import { midiToHz } from "./shared/util";
import { createNoiseSource } from "./shared/noise";

const params: ParamSpec[] = [
  // --- LFO (gemeinsam für Vibrato, PWM-Modulation und Filter-Modulation) ---
  { id: "lfoRate", label: "LFO Rate", kind: "float", min: 0, max: 1, default: 0.35, group: "lfo", mutationWeight: 0.6 },
  { id: "lfoDelayTime", label: "LFO Delay", kind: "float", min: 0, max: 1, default: 0, group: "lfo" },
  // --- DCO ---
  { id: "stop16", label: "Range 16'", kind: "bool", default: false, group: "osc" },
  { id: "stop8", label: "Range 8'", kind: "bool", default: true, group: "osc" },
  { id: "stop4", label: "Range 4'", kind: "bool", default: false, group: "osc" },
  { id: "pulse", label: "Pulse An", kind: "bool", default: true, group: "osc" },
  { id: "saw", label: "Saw An", kind: "bool", default: false, group: "osc" },
  { id: "dcoPwm", label: "PWM", kind: "float", min: 0, max: 1, default: 0.3, group: "osc", mutationWeight: 0.7 },
  { id: "pwmManual", label: "PWM Manuell", kind: "bool", default: false, group: "osc" },
  { id: "dcoSub", label: "Sub Pegel", kind: "float", min: 0, max: 1, default: 0.2, group: "osc" },
  { id: "dcoNoise", label: "Noise Pegel", kind: "float", min: 0, max: 1, default: 0, group: "osc" },
  { id: "dcoLfo", label: "LFO->DCO (Vibrato)", kind: "float", min: 0, max: 1, default: 0, group: "osc", mutationWeight: 0.5 },
  // --- VCF (24dB Tiefpass, 2x kaskadierte Biquads) ---
  { id: "vcfFreq", label: "Cutoff", kind: "float", min: 0, max: 1, default: 0.6, curve: "log", group: "filter", smooth: true, mutationWeight: 0.9 },
  { id: "vcfRes", label: "Resonanz", kind: "float", min: 0, max: 1, default: 0.2, group: "filter", smooth: true, mutationWeight: 0.8 },
  { id: "vcfEnv", label: "Env->Filter", kind: "float", min: 0, max: 1, default: 0.3, group: "filter" },
  { id: "vcfNeg", label: "Env Invertiert", kind: "bool", default: false, group: "filter" },
  { id: "vcfLfo", label: "LFO->Filter", kind: "float", min: 0, max: 1, default: 0, group: "filter" },
  { id: "vcfKbd", label: "Keyboard Tracking", kind: "float", min: 0, max: 1, default: 0.5, group: "filter" },
  { id: "hpfMode", label: "HPF", kind: "int", min: 0, max: 3, default: 0, group: "filter" },
  // --- Envelope (ein gemeinsamer AHDSR-Generator für VCA und/oder VCF) ---
  { id: "envA", label: "Attack", kind: "float", min: 0, max: 1, default: 0.05, group: "env" },
  { id: "envD", label: "Decay", kind: "float", min: 0, max: 1, default: 0.3, group: "env" },
  { id: "envS", label: "Sustain", kind: "float", min: 0, max: 1, default: 0.6, group: "env" },
  { id: "envR", label: "Release", kind: "float", min: 0, max: 1, default: 0.25, group: "env" },
  { id: "vcaLevel", label: "VCA Pegel", kind: "float", min: 0, max: 1, default: 0.8, group: "env" },
  { id: "vcaGate", label: "VCA Gate-Modus", kind: "bool", default: false, group: "env" },
  // --- Chorus (Onboard-Ensemble, Teil des Presets - kein FX-Rack-Modul) ---
  { id: "chorusMode", label: "Chorus", kind: "enum", options: ["off", "I", "II"], default: "off", group: "chorus" },
];

// --- Umrechnungskurven, portiert aus research/vendor/amy/amy/juno.py -----------
// v ist der 0..1-normalisierte Reglerwert (== raw/127 aus dem Original-SysEx).
function toAttackTimeS(v: number): number {
  return (6 + 8 * v * 127) / 1000;
}
function toDecayTimeS(v: number): number {
  return (80 * Math.pow(2, 0.085 * v * 127) - 80) / 1000;
}
function toReleaseTimeS(v: number): number {
  return (70 * Math.pow(2, 0.066 * v * 127) - 70) / 1000;
}
function toFilterFreqHz(v: number): number {
  return 13 * Math.pow(2, 0.0938 * v * 127);
}
function toResonanceQ(v: number): number {
  return 0.7 * Math.pow(2, 4 * v);
}
function toLfoFreqHz(v: number): number {
  return Math.max(0.02, 0.6 * Math.pow(2, 0.04 * v * 127) - 0.1);
}
function toLfoDelayS(v: number): number {
  return Math.max(0, 18 * Math.pow(2, 0.066 * v * 127) - 13) / 1000;
}

// 4-Positionen-HPF: eigene, an dokumentiertem Juno-106-Hardwareverhalten
// orientierte Eckfrequenz-Tabelle (0 = aus/Bypass).
const HPF_HZ = [20, 80, 200, 600];

const MIN_CUTOFF = 30;
const MAX_CUTOFF = 16000;

class Juno106Voice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private params: ParamValues;

  private pulseSaw: OscillatorNode;
  private pulseDelay: DelayNode;
  private pulseInv: GainNode;
  private pulseSum: GainNode;
  private pulseLevel: GainNode;
  private pulseDutyLfoGain: GainNode;

  private sawOsc: OscillatorNode;
  private sawLevel: GainNode;

  private subOsc: OscillatorNode;
  private subLevel: GainNode;

  private noise: AudioBufferSourceNode | null = null;
  private noiseLevel: GainNode;

  private lfo: OscillatorNode;
  private lfoDelayEnv: AdsrGain; // Fade-In-Rampe (0->1 über lfoDelayTime), kein echtes ADSR
  private vibratoGain: GainNode;

  private hpf: BiquadFilterNode | null;
  private filter1: BiquadFilterNode;
  private filter2: BiquadFilterNode;
  private filterEnvAmount: GainNode;
  private filterEnv: AdsrGain;
  private filterEnvConst: ConstantSourceNode;

  private ampEnv: AdsrGain;

  private chorusOut: GainNode;
  private chorusDelayL: DelayNode | null = null;
  private chorusDelayR: DelayNode | null = null;
  private chorusLfo: OscillatorNode | null = null;

  private baseFreqHz: number;
  private oscillators: OscillatorNode[] = [];
  private releaseSeconds: number;

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    this.params = values;

    const range = values.stop16 ? 0.5 : values.stop4 ? 2 : 1;
    this.baseFreqHz = midiToHz(note) * range;

    // --- Pulse (mit PWM via Zwei-Saw-Differenz-Technik) ---
    this.pulseSaw = this.ctx.createOscillator();
    this.pulseSaw.type = "sawtooth";
    this.pulseSaw.frequency.value = this.baseFreqHz;

    this.pulseDelay = this.ctx.createDelay(0.05);
    const pwm = Number(values.dcoPwm);
    const pwmManual = Boolean(values.pwmManual);
    const baseDutyOffset = pwmManual ? 0.5 * pwm : 0;
    const lfoDutyDepth = pwmManual ? 0 : 0.5 * pwm;
    this.pulseDelay.delayTime.value = (0.5 + baseDutyOffset) / this.baseFreqHz;

    this.pulseInv = this.ctx.createGain();
    this.pulseInv.gain.value = -1;
    this.pulseSum = this.ctx.createGain();
    this.pulseSum.gain.value = 0.9;
    this.pulseSaw.connect(this.pulseSum);
    this.pulseSaw.connect(this.pulseDelay).connect(this.pulseInv).connect(this.pulseSum);

    this.pulseDutyLfoGain = this.ctx.createGain();
    this.pulseDutyLfoGain.gain.value = lfoDutyDepth / this.baseFreqHz;

    this.pulseLevel = this.ctx.createGain();
    this.pulseLevel.gain.value = values.pulse ? 1 : 0;
    this.pulseSum.connect(this.pulseLevel);

    // --- Saw ---
    this.sawOsc = this.ctx.createOscillator();
    this.sawOsc.type = "sawtooth";
    this.sawOsc.frequency.value = this.baseFreqHz;
    this.sawLevel = this.ctx.createGain();
    this.sawLevel.gain.value = values.saw ? 1 : 0;
    this.sawOsc.connect(this.sawLevel);

    // --- Sub (eine Oktave unter DCO, Rechteck) ---
    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = "square";
    this.subOsc.frequency.value = this.baseFreqHz / 2;
    this.subLevel = this.ctx.createGain();
    this.subLevel.gain.value = Number(values.dcoSub);
    this.subOsc.connect(this.subLevel);

    // --- Noise ---
    this.noiseLevel = this.ctx.createGain();
    this.noiseLevel.gain.value = Number(values.dcoNoise);
    if (Number(values.dcoNoise) > 0) {
      this.noise = createNoiseSource(this.ctx, "white");
      this.noise.connect(this.noiseLevel);
    }

    // --- HPF (Eingangsstufe, vor VCF) ---
    const hpfHz = HPF_HZ[Math.max(0, Math.min(3, Math.round(Number(values.hpfMode))))];
    if (hpfHz > 20) {
      this.hpf = this.ctx.createBiquadFilter();
      this.hpf.type = "highpass";
      this.hpf.frequency.value = hpfHz;
      this.pulseLevel.connect(this.hpf);
      this.sawLevel.connect(this.hpf);
      this.subLevel.connect(this.hpf);
      this.noiseLevel.connect(this.hpf);
    } else {
      this.hpf = null;
    }

    // --- VCF: 24dB/oct = 2x kaskadierte 12dB-Biquads ---
    this.filter1 = this.ctx.createBiquadFilter();
    this.filter1.type = "lowpass";
    this.filter2 = this.ctx.createBiquadFilter();
    this.filter2.type = "lowpass";
    const kbdTrack = Number(values.vcfKbd) * (note - 69) / 12;
    const baseCutoff = Math.min(MAX_CUTOFF, Math.max(MIN_CUTOFF, toFilterFreqHz(Number(values.vcfFreq)) * Math.pow(2, kbdTrack)));
    this.filter1.frequency.value = baseCutoff;
    this.filter2.frequency.value = baseCutoff;
    const q = toResonanceQ(Number(values.vcfRes));
    this.filter1.Q.value = Math.min(q, 10);
    this.filter2.Q.value = Math.min(q, 10) * 0.5 + 0.3;

    if (this.hpf) {
      this.hpf.connect(this.filter1);
    } else {
      this.pulseLevel.connect(this.filter1);
      this.sawLevel.connect(this.filter1);
      this.subLevel.connect(this.filter1);
      this.noiseLevel.connect(this.filter1);
    }
    this.filter1.connect(this.filter2);

    // --- Filter-Envelope (audio-rate Signal via ConstantSource+AdsrGain, additiv
    //     auf filter.frequency summiert - so kann gleichzeitig der LFO moduliert
    //     werden, ohne dass sich beide Modulationsquellen gegenseitig überschreiben). ---
    const attackS = toAttackTimeS(Number(values.envA));
    const decayS = toDecayTimeS(Number(values.envD));
    const sustainLvl = Number(values.envS);
    this.releaseSeconds = toReleaseTimeS(Number(values.envR));

    this.filterEnv = new AdsrGain(this.ctx, { attack: attackS, decay: decayS, sustain: sustainLvl, release: this.releaseSeconds });
    this.filterEnvConst = this.ctx.createConstantSource();
    this.filterEnvConst.offset.value = 1;
    this.filterEnvConst.connect(this.filterEnv.node);

    const envPolarity = values.vcfNeg ? -1 : 1;
    const filterEnvRangeHz = 6000; // eigene, musikalisch sinnvolle Sweep-Reichweite statt AMYs internem Koeffizienten
    this.filterEnvAmount = this.ctx.createGain();
    this.filterEnvAmount.gain.value = envPolarity * Number(values.vcfEnv) * filterEnvRangeHz;
    this.filterEnv.node.connect(this.filterEnvAmount);
    this.filterEnvAmount.connect(this.filter1.frequency);
    this.filterEnvAmount.connect(this.filter2.frequency);

    // --- LFO (Dreieck, gemeinsam für Vibrato/PWM/Filter) ---
    this.lfo = this.ctx.createOscillator();
    this.lfo.type = "triangle";
    this.lfo.frequency.value = toLfoFreqHz(Number(values.lfoRate));

    // Delay-Fade-In: LFO-Ausgang läuft zunächst durch eine "Hüllkurve" (0->1 Rampe
    // über lfoDelayTime, danach konstant 1), bevor er an Vibrato/PWM/Filter verteilt
    // wird - genau das bildet den LFO-DELAY-Regler nach.
    this.lfoDelayEnv = new AdsrGain(this.ctx, { attack: toLfoDelayS(Number(values.lfoDelayTime)) + 0.001, decay: 0.001, sustain: 1, release: 0.05 });
    this.lfo.connect(this.lfoDelayEnv.node);

    this.lfoDelayEnv.node.connect(this.pulseDutyLfoGain);
    this.pulseDutyLfoGain.connect(this.pulseDelay.delayTime);

    this.vibratoGain = this.ctx.createGain();
    this.vibratoGain.gain.value = Number(values.dcoLfo) * 40; // bis zu +-40 Cent Vibrato-Tiefe
    this.lfoDelayEnv.node.connect(this.vibratoGain);
    this.vibratoGain.connect(this.pulseSaw.detune);
    this.vibratoGain.connect(this.sawOsc.detune);
    this.vibratoGain.connect(this.subOsc.detune);

    const lfoFilterGain = this.ctx.createGain();
    lfoFilterGain.gain.value = Number(values.vcfLfo) * 2400; // Sweep-Reichweite LFO->Filter
    this.lfoDelayEnv.node.connect(lfoFilterGain);
    lfoFilterGain.connect(this.filter1.frequency);
    lfoFilterGain.connect(this.filter2.frequency);

    // --- VCA (ENV-Modus: folgt der gemeinsamen Hüllkurve. GATE-Modus: schneller
    //     Ein/Aus-Schalter, die echte Hüllkurve moduliert dann exklusiv den Filter). ---
    const vcaGate = Boolean(values.vcaGate);
    this.ampEnv = vcaGate
      ? new AdsrGain(this.ctx, { attack: 0.003, decay: 0.001, sustain: 1, release: 0.02 })
      : new AdsrGain(this.ctx, { attack: attackS, decay: decayS, sustain: sustainLvl, release: this.releaseSeconds });

    const vcaLevelGain = this.ctx.createGain();
    vcaLevelGain.gain.value = Number(values.vcaLevel);
    this.filter2.connect(vcaLevelGain);
    vcaLevelGain.connect(this.ampEnv.node);

    // --- Onboard-Chorus (I/II), sonst trockener Durchlauf ---
    this.chorusOut = this.ctx.createGain();
    const chorusMode = String(values.chorusMode);
    if (chorusMode === "off") {
      this.ampEnv.node.connect(this.chorusOut);
    } else {
      const rateHz = chorusMode === "I" ? 0.513 : 0.83;
      const depthS = chorusMode === "I" ? 0.0025 : 0.004;
      const merger = this.ctx.createChannelMerger(2);

      this.chorusDelayL = this.ctx.createDelay(0.05);
      this.chorusDelayL.delayTime.value = 0.005;
      this.chorusDelayR = this.ctx.createDelay(0.05);
      this.chorusDelayR.delayTime.value = 0.0065;

      this.chorusLfo = this.ctx.createOscillator();
      this.chorusLfo.type = "sine";
      this.chorusLfo.frequency.value = rateHz;
      const lfoGainL = this.ctx.createGain();
      lfoGainL.gain.value = depthS;
      const lfoGainR = this.ctx.createGain();
      lfoGainR.gain.value = -depthS;
      this.chorusLfo.connect(lfoGainL).connect(this.chorusDelayL.delayTime);
      this.chorusLfo.connect(lfoGainR).connect(this.chorusDelayR.delayTime);

      const dryGain = this.ctx.createGain();
      dryGain.gain.value = 0.6;
      this.ampEnv.node.connect(dryGain);
      dryGain.connect(merger, 0, 0);
      dryGain.connect(merger, 0, 1);
      this.ampEnv.node.connect(this.chorusDelayL).connect(merger, 0, 0);
      this.ampEnv.node.connect(this.chorusDelayR).connect(merger, 0, 1);
      merger.connect(this.chorusOut);
    }

    this.output = this.chorusOut;
    this.oscillators = [this.pulseSaw, this.sawOsc, this.subOsc, this.lfo];
  }

  trigger(velocity: number, time: number): void {
    for (const o of this.oscillators) o.start(time);
    this.noise?.start(time);
    this.filterEnvConst.start(time);
    this.chorusLfo?.start(time);

    this.ampEnv.trigger(velocity, time);
    this.filterEnv.trigger(1, time);
    this.lfoDelayEnv.trigger(1, time);
  }

  release(time: number): void {
    this.ampEnv.release(time);
    this.filterEnv.release(time);
    const stopAt = time + this.releaseSeconds + 0.1;
    for (const o of this.oscillators) { try { o.stop(stopAt); } catch { /* noop */ } }
    try { this.noise?.stop(stopAt); } catch { /* noop */ }
    try { this.filterEnvConst.stop(stopAt); } catch { /* noop */ }
    try { this.chorusLfo?.stop(stopAt); } catch { /* noop */ }
  }

  stop(time: number, fadeSeconds = 0.02): void {
    this.ampEnv.stop(time, fadeSeconds);
    const stopAt = time + fadeSeconds + 0.05;
    for (const o of this.oscillators) { try { o.stop(stopAt); } catch { /* noop */ } }
    try { this.noise?.stop(stopAt); } catch { /* noop */ }
    try { this.filterEnvConst.stop(stopAt); } catch { /* noop */ }
    try { this.chorusLfo?.stop(stopAt); } catch { /* noop */ }
  }

  setParam(paramId: string, value: number | string | boolean, time: number): void {
    this.params[paramId] = value;
    if (paramId === "vcfFreq") {
      const kbdTrack = Number(this.params.vcfKbd) * (this.note - 69) / 12;
      const hz = Math.min(MAX_CUTOFF, Math.max(MIN_CUTOFF, toFilterFreqHz(Number(value)) * Math.pow(2, kbdTrack)));
      this.filter1.frequency.setTargetAtTime(hz, time, 0.01);
      this.filter2.frequency.setTargetAtTime(hz, time, 0.01);
    }
    if (paramId === "vcfRes") {
      const q = toResonanceQ(Number(value));
      this.filter1.Q.setTargetAtTime(Math.min(q, 10), time, 0.01);
      this.filter2.Q.setTargetAtTime(Math.min(q, 10) * 0.5 + 0.3, time, 0.01);
    }
    if (paramId === "lfoRate") this.lfo.frequency.setTargetAtTime(toLfoFreqHz(Number(value)), time, 0.02);
    if (paramId === "dcoNoise") this.noiseLevel.gain.setTargetAtTime(Number(value), time, 0.02);
    if (paramId === "dcoSub") this.subLevel.gain.setTargetAtTime(Number(value), time, 0.02);
  }

  isFinished(time: number): boolean {
    return this.ampEnv.isFinished(time);
  }

  dispose(): void {
    for (const o of this.oscillators) { try { o.disconnect(); } catch { /* noop */ } }
    try { this.noise?.disconnect(); } catch { /* noop */ }
    for (const n of [
      this.pulseDelay, this.pulseInv, this.pulseSum, this.pulseLevel, this.pulseDutyLfoGain,
      this.sawLevel, this.subLevel, this.noiseLevel, this.filter1, this.filter2,
      this.filterEnvAmount, this.filterEnv.node, this.ampEnv.node, this.chorusOut,
      this.vibratoGain, this.lfoDelayEnv.node,
    ]) {
      try { n.disconnect(); } catch { /* noop */ }
    }
    try { this.hpf?.disconnect(); } catch { /* noop */ }
    try { this.filterEnvConst.disconnect(); } catch { /* noop */ }
    try { this.chorusDelayL?.disconnect(); } catch { /* noop */ }
    try { this.chorusDelayR?.disconnect(); } catch { /* noop */ }
    try { this.chorusLfo?.disconnect(); } catch { /* noop */ }
  }
}

export const juno106Engine: Engine = {
  id: "juno106",
  name: "Juno-106 (Roland VA)",
  params,
  defaultMacroMap: {
    brightness: [{ paramId: "vcfFreq", atZero: 0.15, atOne: 1 }],
    motion: [
      { paramId: "lfoRate", atZero: 0.1, atOne: 0.7 },
      { paramId: "vcfLfo", atZero: 0, atOne: 0.6 },
    ],
    density: [{ paramId: "dcoPwm", atZero: 0.1, atOne: 0.9 }],
    space: [{ paramId: "envR", atZero: 0.15, atOne: 0.9 }],
    drive: [{ paramId: "vcfRes", atZero: 0.1, atOne: 0.85 }],
    detune: [{ paramId: "dcoLfo", atZero: 0, atOne: 0.8 }],
    body: [{ paramId: "dcoSub", atZero: 0, atOne: 0.8 }],
    air: [{ paramId: "dcoNoise", atZero: 0, atOne: 0.4 }],
  },
  createVoice(globals, values, note) {
    return new Juno106Voice(globals, note, values);
  },
};

export function juno106Defaults(): ParamValues {
  return defaultParamValues(params);
}
