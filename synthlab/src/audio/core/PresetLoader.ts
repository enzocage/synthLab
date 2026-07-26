// Hot-Swap von Presets ohne hörbare Lücke oder Klick: der neue Voice-Graph wird
// im Hintergrund aufgebaut und per Crossfade (15-40ms) eingeblendet, der alte
// Graph erst nach Abschluss des Fades entsorgt. Das ist die technische
// Voraussetzung für "< 3s pro Preset" aus PLAN.md Phase 2/7.
import type { Engine, EngineGlobals, ParamValues } from "./types";
import { VoiceManager } from "./VoiceManager";
import { linearRamp } from "./ParamSmoother";

const CROSSFADE_S = 0.025;
const DISPOSE_DELAY_MS = (CROSSFADE_S + 0.01) * 1000;

interface LoadedGraph {
  engine: Engine;
  voiceManager: VoiceManager;
  gain: GainNode;
}

export class PresetLoader {
  private ctx: BaseAudioContext;
  private destination: AudioNode;
  private current: LoadedGraph | null = null;
  private globals: EngineGlobals;

  constructor(ctx: BaseAudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;
    this.globals = { audioContext: ctx };
  }

  /** Baut den neuen Engine-Graphen auf und blendet ihn klickfrei ein; der alte klingt aus. */
  load(engine: Engine, params: ParamValues, maxVoices = 8): VoiceManager {
    const now = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.destination);

    const voiceManager = new VoiceManager(engine, this.globals, params, gain, maxVoices);
    linearRamp(gain.gain, 0, 1, now, CROSSFADE_S);

    const previous = this.current;
    this.current = { engine, voiceManager, gain };

    if (previous) {
      linearRamp(previous.gain.gain, 1, 0, now, CROSSFADE_S);
      const prevVm = previous.voiceManager;
      const prevGain = previous.gain;
      setTimeout(() => {
        prevVm.dispose();
        prevGain.disconnect();
      }, DISPOSE_DELAY_MS);
    }

    return voiceManager;
  }

  get activeVoiceManager(): VoiceManager | null {
    return this.current?.voiceManager ?? null;
  }

  get activeEngine(): Engine | null {
    return this.current?.engine ?? null;
  }

  dispose(): void {
    this.current?.voiceManager.dispose();
    this.current?.gain.disconnect();
    this.current = null;
  }
}
