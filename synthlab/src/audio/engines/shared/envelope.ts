// ADSR-Hüllkurve auf einem GainNode, klickfrei über lineare/exponentielle Rampen.
import { linearRamp } from "../../core/ParamSmoother";

export interface AdsrTimes {
  attack: number;
  decay: number;
  sustain: number; // 0..1
  release: number;
}

export class AdsrGain {
  readonly node: GainNode;
  private times: AdsrTimes;
  private releasedAt = Infinity;

  constructor(ctx: BaseAudioContext, times: AdsrTimes) {
    this.node = ctx.createGain();
    this.node.gain.value = 0;
    this.times = times;
  }

  setTimes(times: Partial<AdsrTimes>) {
    this.times = { ...this.times, ...times };
  }

  trigger(velocity: number, time: number) {
    const { attack, decay, sustain } = this.times;
    const g = this.node.gain;
    g.cancelScheduledValues(time);
    g.setValueAtTime(0, time);
    g.linearRampToValueAtTime(velocity, time + Math.max(attack, 0.002));
    g.linearRampToValueAtTime(velocity * sustain, time + attack + Math.max(decay, 0.002));
  }

  release(time: number) {
    const { release } = this.times;
    linearRamp(this.node.gain, this.node.gain.value, 0, time, Math.max(release, 0.01));
    this.releasedAt = time + Math.max(release, 0.01);
  }

  /** Sofortiges, aber klickfreies Stoppen (Voice-Stealing). */
  stop(time: number, fadeSeconds: number) {
    linearRamp(this.node.gain, this.node.gain.value, 0, time, fadeSeconds);
    this.releasedAt = time + fadeSeconds;
  }

  isFinished(time: number): boolean {
    return time >= this.releasedAt;
  }
}
