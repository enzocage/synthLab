// Echtzeit-Meter für die UI: Peak, RMS, Stereo-Korrelation. 30fps-taugliches
// Polling über AnalyserNode (Phase 2). Die tiefergehende Offline-Analyse
// (Spectral Centroid, Crest, Klick-Erkennung etc.) folgt in Phase 8.

export interface MeterReading {
  peakL: number;
  peakR: number;
  rms: number;
  correlation: number;
}

export class Meters {
  private analyserL: AnalyserNode;
  private analyserR: AnalyserNode;
  private splitter: ChannelSplitterNode;
  private bufL: Float32Array<ArrayBuffer>;
  private bufR: Float32Array<ArrayBuffer>;

  constructor(ctx: BaseAudioContext, source: AudioNode, fftSize = 1024) {
    this.splitter = ctx.createChannelSplitter(2);
    source.connect(this.splitter);

    this.analyserL = ctx.createAnalyser();
    this.analyserL.fftSize = fftSize;
    this.analyserR = ctx.createAnalyser();
    this.analyserR.fftSize = fftSize;

    this.splitter.connect(this.analyserL, 0);
    this.splitter.connect(this.analyserR, 1);

    this.bufL = new Float32Array(new ArrayBuffer(this.analyserL.fftSize * 4));
    this.bufR = new Float32Array(new ArrayBuffer(this.analyserR.fftSize * 4));
  }

  read(): MeterReading {
    this.analyserL.getFloatTimeDomainData(this.bufL);
    this.analyserR.getFloatTimeDomainData(this.bufR);

    let peakL = 0;
    let peakR = 0;
    let sumSq = 0;
    let sumLR = 0;
    let sumL2 = 0;
    let sumR2 = 0;

    const n = this.bufL.length;
    for (let i = 0; i < n; i++) {
      const l = this.bufL[i];
      const r = this.bufR[i];
      peakL = Math.max(peakL, Math.abs(l));
      peakR = Math.max(peakR, Math.abs(r));
      sumSq += (l * l + r * r) / 2;
      sumLR += l * r;
      sumL2 += l * l;
      sumR2 += r * r;
    }

    const rms = Math.sqrt(sumSq / n);
    const denom = Math.sqrt(sumL2 * sumR2);
    const correlation = denom > 1e-9 ? sumLR / denom : 1;

    return { peakL, peakR, rms, correlation };
  }

  dispose(): void {
    this.splitter.disconnect();
    this.analyserL.disconnect();
    this.analyserR.disconnect();
  }
}
