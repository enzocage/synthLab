// Extrahiert eine kuratierte Auswahl echter Single-Cycle-Wellenformen aus AKWF-FREE
// (Adventure Kid Waveforms, CC0-1.0) und wandelt sie per DFT in kompakte
// PeriodicWave-Fourier-Koeffizienten (real[]/imag[] je Harmonische) um - das ist
// die native WebAudio-Repräsentation für `OscillatorNode.setPeriodicWave()` und
// rund 6x kompakter als die 600-Sample-Rohdaten pro Welle.
//
// Quelle: research/vendor/akwf/AKWF-js/*.json (CC0-1.0, Kristoffer Ekstrand /
// "Adventure Kid"), siehe research/LICENSES.md.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const VENDOR = path.join(ROOT, "vendor");
const OUT = path.join(ROOT, "derived");
const SOURCE_DIR = "vendor/akwf/AKWF-js";

const HARMONICS = 48;
const STRIDE = 16; // jede 16. Welle uebernehmen -> ~260 von 4162, ueber alle Quelldateien verteilt

const dir = path.join(VENDOR, "akwf", "AKWF-js");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

/** Einfache DFT (kein FFT noetig: N=600, H=48 -> ~29k Multiplikationen pro Welle, trivial). */
function dftCoeffs(samples, harmonics) {
  const n = samples.length;
  const real = new Array(harmonics + 1).fill(0);
  const imag = new Array(harmonics + 1).fill(0);
  for (let k = 1; k <= harmonics; k++) {
    let re = 0;
    let im = 0;
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * k * i) / n;
      re += samples[i] * Math.cos(angle);
      im += samples[i] * Math.sin(angle);
    }
    real[k] = Math.round(((2 / n) * re) * 10000) / 10000;
    imag[k] = Math.round((-(2 / n) * im) * 10000) / 10000;
  }
  return { real, imag };
}

const allNames = [];
for (const file of files) {
  const bank = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  for (const name of Object.keys(bank)) allNames.push({ name, file });
}

const curated = allNames.filter((_, i) => i % STRIDE === 0);

const waves = curated.map(({ name, file }) => {
  const bank = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  const samples = bank[name];
  const { real, imag } = dftCoeffs(samples, HARMONICS);
  return { id: name, sourceFile: `${SOURCE_DIR}/${file}`, real, imag };
});

const result = {
  _meta: {
    sourceRepo: "https://github.com/KristofferKarlAxelEkstrand/AKWF-FREE",
    sourceDir: SOURCE_DIR,
    license: "CC0-1.0",
    attribution: "Kristoffer Ekstrand (Adventure Kid)",
    extractedAt: "2026-07-27",
    count: waves.length,
    totalUpstream: allNames.length,
    harmonics: HARMONICS,
    note:
      `Kuratierte Auswahl (jede ${STRIDE}. Welle von ${allNames.length} Original-Wellenformen) ` +
      "als PeriodicWave-Fourier-Koeffizienten (real/imag je Harmonische, DFT aus den " +
      "600-Sample-Original-Zyklen). Verwendung: OscillatorNode.setPeriodicWave(ctx.createPeriodicWave(real, imag)).",
  },
  waves,
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "akwf-waves.json"), JSON.stringify(result));
console.log(`akwf-waves.json: ${waves.length} kuratierte Wellenformen (von ${allNames.length}, ${HARMONICS} Harmonische)`);
