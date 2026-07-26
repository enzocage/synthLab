// Unison-Stack: N Oszillatoren mit symmetrischer Verstimmung + Stereo-Spread.
export interface UnisonVoiceNodes {
  osc: OscillatorNode;
  pan: StereoPannerNode;
  detuneCents: number;
}

export function createUnisonStack(
  ctx: BaseAudioContext,
  type: OscillatorType,
  frequency: number,
  voices: number,
  detuneCents: number,
  spread: number
): { nodes: UnisonVoiceNodes[]; output: GainNode } {
  const output = ctx.createGain();
  output.gain.value = voices > 1 ? 1 / Math.sqrt(voices) : 1;
  const nodes: UnisonVoiceNodes[] = [];

  for (let i = 0; i < voices; i++) {
    const t = voices === 1 ? 0 : i / (voices - 1) - 0.5; // -0.5..0.5
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    osc.detune.value = t * detuneCents;

    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.max(-1, Math.min(1, t * 2 * spread));

    osc.connect(pan).connect(output);
    nodes.push({ osc, pan, detuneCents: t * detuneCents });
  }

  return { nodes, output };
}

export function startAll(nodes: UnisonVoiceNodes[], time: number) {
  for (const n of nodes) n.osc.start(time);
}

export function stopAll(nodes: UnisonVoiceNodes[], time: number) {
  for (const n of nodes) {
    try {
      n.osc.stop(time);
    } catch {
      /* bereits gestoppt */
    }
  }
}

export function setFrequencyAll(nodes: UnisonVoiceNodes[], frequency: number, time: number) {
  for (const n of nodes) n.osc.frequency.setTargetAtTime(frequency, time, 0.01);
}
