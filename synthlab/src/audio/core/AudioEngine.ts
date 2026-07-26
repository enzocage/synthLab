// Singleton-Audiokern. Lazy resume() bei erster Nutzergeste, Master-Kette mit
// sanftem Limiter, Panic-Funktion. Siehe PLAN.md Phase 2.
import { linearRamp } from "./ParamSmoother";

class AudioEngineImpl {
  private _ctx: AudioContext | null = null;
  private _masterGain: GainNode | null = null;
  private _limiter: DynamicsCompressorNode | null = null;
  private _masterOut: GainNode | null = null;

  get ctx(): AudioContext {
    if (!this._ctx) {
      this._ctx = new AudioContext({ latencyHint: "interactive" });
      this.buildMasterChain(this._ctx);
    }
    return this._ctx;
  }

  get masterInput(): GainNode {
    // Presets/FX-Ketten hängen sich hier ein.
    void this.ctx; // stellt sicher, dass Kontext + Kette existieren
    return this._masterGain!;
  }

  get masterOut(): GainNode {
    void this.ctx;
    return this._masterOut!;
  }

  private buildMasterChain(ctx: AudioContext) {
    this._masterGain = ctx.createGain();
    this._masterGain.gain.value = 0.8;

    // Sanfter Limiter statt Mastering-Verfärbung: hoher Threshold, schnelle Ratio.
    this._limiter = ctx.createDynamicsCompressor();
    this._limiter.threshold.value = -1;
    this._limiter.knee.value = 6;
    this._limiter.ratio.value = 20;
    this._limiter.attack.value = 0.002;
    this._limiter.release.value = 0.15;

    this._masterOut = ctx.createGain();
    this._masterOut.gain.value = 1.0;

    this._masterGain.connect(this._limiter);
    this._limiter.connect(this._masterOut);
    this._masterOut.connect(ctx.destination);
  }

  /** Muss aus einem Nutzergesten-Handler (Klick/Tastendruck) aufgerufen werden. */
  async resume(): Promise<void> {
    if (this.ctx.state !== "running") {
      await this.ctx.resume();
    }
  }

  /** Panic: reißt alle Stimmen sofort ab, aber mit einem 15ms-Fade auf dem Master, kein harter Klick. */
  panic(): void {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const current = this._masterGain!.gain.value;
    linearRamp(this._masterGain!.gain, current, 0, now, 0.015);
    linearRamp(this._masterGain!.gain, 0, 0.8, now + 0.02, 0.05);
  }

  get currentTime(): number {
    return this.ctx.currentTime;
  }
}

export const AudioEngine = new AudioEngineImpl();
