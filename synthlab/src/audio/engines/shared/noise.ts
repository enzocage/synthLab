// Erzeugt gecachte Rausch-Buffer (weiß/rosa/braun) für Noise-Quellen und
// Anregungs-Impulse (Karplus-Strong, Modal-Anregung).
const cache = new Map<string, AudioBuffer>();

function key(ctx: BaseAudioContext, kind: string, seconds: number) {
  return `${kind}:${seconds}:${ctx.sampleRate}`;
}

export function whiteNoiseBuffer(ctx: BaseAudioContext, seconds = 2): AudioBuffer {
  const k = key(ctx, "white", seconds);
  const cached = cache.get(k);
  if (cached) return cached;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  cache.set(k, buf);
  return buf;
}

export function pinkNoiseBuffer(ctx: BaseAudioContext, seconds = 2): AudioBuffer {
  const k = key(ctx, "pink", seconds);
  const cached = cache.get(k);
  if (cached) return cached;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buf.getChannelData(0);
  // Paul Kellet's refined pink noise filter (Standardformeln, keine Fremdcode-Übernahme).
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const out = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    data[i] = out * 0.11;
  }
  cache.set(k, buf);
  return buf;
}

export function brownNoiseBuffer(ctx: BaseAudioContext, seconds = 2): AudioBuffer {
  const k = key(ctx, "brown", seconds);
  const cached = cache.get(k);
  if (cached) return cached;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  cache.set(k, buf);
  return buf;
}

export function noiseBuffer(ctx: BaseAudioContext, color: "white" | "pink" | "brown", seconds = 2) {
  if (color === "pink") return pinkNoiseBuffer(ctx, seconds);
  if (color === "brown") return brownNoiseBuffer(ctx, seconds);
  return whiteNoiseBuffer(ctx, seconds);
}

export function createNoiseSource(
  ctx: BaseAudioContext,
  color: "white" | "pink" | "brown" = "white",
  seconds = 2
): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, color, seconds);
  src.loop = true;
  return src;
}
