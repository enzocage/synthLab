export function midiToHz(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

/** Wavefolder-Transferkurve (sinusförmiges Falten) für WaveShaperNode. */
export function wavefolderCurve(amount: number, samples = 1024): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(new ArrayBuffer(samples * 4));
  const k = 1 + amount * 8;
  for (let i = 0; i < samples; i++) {
    const x = (i / (samples - 1)) * 2 - 1;
    curve[i] = Math.sin(x * k * Math.PI);
  }
  return curve;
}

/** Weiche Sättigungskurve (tanh-artig) für Drive/Saturation-Stufen. */
export function saturationCurve(amount: number, samples = 1024): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(new ArrayBuffer(samples * 4));
  const k = 1 + amount * 20;
  for (let i = 0; i < samples; i++) {
    const x = (i / (samples - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * k) / Math.tanh(k);
  }
  return curve;
}

/** Phase-Distortion-Transferkurve: verzerrt die Lesegeschwindigkeit eines Sinus-Oszillators. */
export function phaseDistortionCurve(amount: number, samples = 1024): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(new ArrayBuffer(samples * 4));
  for (let i = 0; i < samples; i++) {
    const x = i / (samples - 1); // 0..1
    // Bias die Phase Richtung x=amount (klassisches CZ-"resonant"-Pärchen, vereinfacht)
    const biased = Math.pow(x, 1 + amount * 4);
    curve[i] = Math.sin(biased * Math.PI * 2 - Math.PI);
  }
  return curve;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
