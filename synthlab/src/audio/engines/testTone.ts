// Minimale Referenz-Engine NUR zur Verifikation des Audio-Cores (Phase 2).
// Die 13 echten Engines aus PLAN.md Phase 3 folgen als eigene Module.
import type { Engine, EngineGlobals, ParamValues, Voice } from "../core/types";
import { defaultParamValues } from "../core/types";
import { linearRamp } from "../core/ParamSmoother";

const params = [
  {
    id: "freq",
    label: "Frequenz",
    kind: "float" as const,
    min: 55,
    max: 1760,
    default: 220,
    curve: "log" as const,
    unit: "Hz",
    smooth: true,
  },
  {
    id: "release",
    label: "Release",
    kind: "float" as const,
    min: 0.05,
    max: 4,
    default: 0.6,
    curve: "log" as const,
    unit: "s",
  },
];

class TestVoice implements Voice {
  readonly note: number;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private osc: OscillatorNode;
  private env: GainNode;
  private releaseTime: number;
  private releaseSeconds: number;
  private stopped = false;

  constructor(globals: EngineGlobals, note: number, values: ParamValues) {
    this.ctx = globals.audioContext;
    this.note = note;
    const freq = Number(values.freq) * Math.pow(2, (note - 69) / 12);
    this.releaseSeconds = Number(values.release);

    this.osc = this.ctx.createOscillator();
    this.osc.type = "sine";
    this.osc.frequency.value = freq;

    this.env = this.ctx.createGain();
    this.env.gain.value = 0;

    this.osc.connect(this.env);
    this.output = this.env;
    this.osc.start();
    this.releaseTime = Infinity;
  }

  trigger(velocity: number, time: number): void {
    linearRamp(this.env.gain, 0, velocity, time, 0.01);
  }

  release(time: number): void {
    linearRamp(this.env.gain, this.env.gain.value, 0, time, this.releaseSeconds);
    this.releaseTime = time + this.releaseSeconds;
  }

  stop(time: number, fadeSeconds = 0.02): void {
    if (this.stopped) return;
    this.stopped = true;
    linearRamp(this.env.gain, this.env.gain.value, 0, time, fadeSeconds);
    this.releaseTime = time + fadeSeconds;
    this.osc.stop(time + fadeSeconds + 0.01);
  }

  setParam(paramId: string, value: number | string | boolean, time: number): void {
    if (paramId === "freq") {
      const freq = Number(value) * Math.pow(2, (this.note - 69) / 12);
      this.osc.frequency.setTargetAtTime(freq, time, 0.01);
    }
  }

  isFinished(time: number): boolean {
    return time >= this.releaseTime;
  }

  dispose(): void {
    try {
      this.osc.disconnect();
      this.env.disconnect();
    } catch {
      /* bereits getrennt */
    }
  }
}

export const testToneEngine: Engine = {
  id: "test-tone",
  name: "Test Tone (Phase-2-Referenz)",
  params,
  defaultMacroMap: {},
  createVoice(globals, values, note) {
    return new TestVoice(globals, note, values);
  },
};

export function testToneDefaults(): ParamValues {
  return defaultParamValues(params);
}
