// 6. modal: Resonatorbank (Glas/Metall/Holz/Stein) angeregt durch einen kurzen
// Impuls, Materialien aus research/derived/modal-materials.json (STK ModalBar-
// Frequenzverhältnisse + Dämpfungsradien). Rollen: bell, texture, fx.
import type { Engine, EngineGlobals, ParamSpec, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { midiToHz } from "./shared/util";
import modalMaterialsData from "../../data/derived/modal-materials.json";

interface ModalMode { ratio: number | null; fixedHz: number | null; radius: number; gain: number }
interface ModalMaterial { id: string; name: string; modes: ModalMode[] }
const MATERIALS = (modalMaterialsData.materials as ModalMaterial[]);

function materialIndex(id: string): number {
  const i = MATERIALS.findIndex((m) => m.id === id);
  return i >= 0 ? i : 0;
}

const params: ParamSpec[] = [
  { id: "material", label: "Material", kind: "enum", options: MATERIALS.map((m) => m.id), default: MATERIALS[0].id, group: "modal" },
  { id: "damping", label: "Dämpfung", kind: "float", min: 0.3, max: 3, default: 1, group: "modal", mutationWeight: 0.8 },
  { id: "brightness", label: "Helligkeit", kind: "float", min: 0.3, max: 2, default: 1, group: "modal", mutationWeight: 0.6 },
  { id: "strikeHardness", label: "Anschlagshärte", kind: "float", min: 0, max: 1, default: 0.5, group: "excitation" },
  { id: "bowedAmount", label: "Streich-Anteil", kind: "float", min: 0, max: 1, default: 0, group: "excitation" },
];

class ModalVoice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private filters: BiquadFilterNode[] = [];
  private bowSource: AudioBufferSourceNode | null = null;
  private bowGain: GainNode | null = null;
  private finishAt = Infinity;
  private maxT60 = 2;

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    const freq = midiToHz(note);
    const material = MATERIALS[materialIndex(String(values.material))];
    const dampingMul = Number(values.damping);
    const brightness = Number(values.brightness);

    this.output = this.ctx.createGain();
    this.output.gain.value = 1;

    for (const mode of material.modes) {
      const modeFreq = mode.fixedHz !== null ? mode.fixedHz : freq * (mode.ratio ?? 1) * brightness;
      if (modeFreq <= 20 || modeFreq > 18000) continue;

      // STK-Radius (pro Sample) -> T60 (Sekunden bis -60dB): r^(t60*sampleRate) = 0.001
      // => t60 = -3 / (sampleRate * log10(r)). Danach -> Q ueber die Bandbreite bei -60dB.
      const r = Math.min(0.99999, Math.max(0.001, mode.radius));
      const t60 = Math.min(20, -3 / (this.ctx.sampleRate * Math.log10(r)) / dampingMul);
      this.maxT60 = Math.max(this.maxT60, t60);
      // Q auf 120 gedeckelt: hoehere Werte erzeugen bei Impuls-Anregung eine
      // hoerbare Gruppenverzoegerung (~Q/(pi*f)) vor dem eigentlichen Einschwingen,
      // was fuer einen Anschlag zu traege wirkt. Die Nachklingzeit wird stattdessen
      // primaer ueber t60 (oben) gesteuert, nicht ueber unbegrenzte Q-Werte.
      const q = Math.max(0.7, Math.min(120, (Math.PI * modeFreq * t60) / 3));

      const filt = this.ctx.createBiquadFilter();
      filt.type = "bandpass";
      filt.frequency.value = modeFreq;
      filt.Q.value = q;

      // Gain kompensiert, dass ein hoher Q (schmale Bandbreite) bei impulsartiger
      // Anregung nur wenig Energie einfaengt (sqrt(q)-Naeherung, empirisch justiert).
      const gain = this.ctx.createGain();
      gain.gain.value = mode.gain * 150 * Math.sqrt(q);

      filt.connect(gain).connect(this.output);
      this.filters.push(filt);
    }
  }

  trigger(velocity: number, time: number): void {
    // Kurzer Rauschstoss statt reinem 1-Sample-Impuls: ein einzelner Sample-Impuls
    // traegt bei schmalbandigen (hoher Q) Resonatoren kaum Energie in die Passbaender
    // ein und bleibt praktisch unhoerbar. Ein paar Millisekunden Rauschen geben jedem
    // Modus genug Anregungsenergie, unabhaengig von seiner Bandbreite.
    const burstMs = 4;
    const burstLen = Math.max(4, Math.round((burstMs / 1000) * this.ctx.sampleRate));
    const impulse = this.ctx.createBuffer(1, burstLen, this.ctx.sampleRate);
    const data = impulse.getChannelData(0);
    for (let i = 0; i < burstLen; i++) {
      data[i] = velocity * (Math.random() * 2 - 1) * (1 - i / burstLen);
    }

    const src = this.ctx.createBufferSource();
    src.buffer = impulse;
    for (const filt of this.filters) src.connect(filt);
    src.start(time);
    this.finishAt = time + this.maxT60 + 0.2;
  }

  release(time: number): void {
    // Modal-Klänge klingen physikalisch nach; Release verkürzt nicht künstlich.
    this.finishAt = Math.min(this.finishAt, time + this.maxT60 * 0.5 + 0.1);
  }

  stop(time: number, fadeSeconds = 0.02): void {
    this.output.gain.setTargetAtTime(0, time, fadeSeconds / 3);
    this.finishAt = time + fadeSeconds + 0.05;
  }

  setParam(): void {
    // Materialstruktur ist pro Voice fest verdrahtet; Änderungen wirken auf die nächste Note.
  }

  isFinished(time: number): boolean {
    return time >= this.finishAt;
  }

  dispose(): void {
    for (const f of this.filters) { try { f.disconnect(); } catch { /* noop */ } }
    this.bowSource?.disconnect();
    this.bowGain?.disconnect();
    this.output.disconnect();
  }
}

export const modalEngine: Engine = {
  id: "modal",
  name: "Modal (Resonatorbank)",
  params,
  defaultMacroMap: {
    brightness: [{ paramId: "brightness", atZero: 0.5, atOne: 1.8 }],
    space: [{ paramId: "damping", atZero: 2.5, atOne: 0.4 }],
    drive: [{ paramId: "strikeHardness", atZero: 0.1, atOne: 1 }],
  },
  createVoice(globals, values, note) {
    return new ModalVoice(globals, note, values);
  },
};

export function modalDefaults(): ParamValues {
  return defaultParamValues(params);
}
