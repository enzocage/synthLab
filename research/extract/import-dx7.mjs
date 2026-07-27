// Parst die 1024 DX7-Werksvoices aus AMYs `default-dx7-patches.bin` (156 Byte
// pro Voice, generiert mit `dx7db` aus bwhitman/learnfm, vertrieben über
// shorepine/amy unter MIT). Byte-Layout 1:1 aus research/vendor/amy/amy/fm.py
// (`DX7Patch.from_bytestream`) portiert - klassisches "unpacked" DX7-
// Voice-Format (6 Operatoren + globale Parameter + 10-Byte-Name).
//
// Quelle: research/vendor/amy/amy/default-dx7-patches.bin (MIT), siehe
// research/LICENSES.md.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const VENDOR = path.join(ROOT, "vendor");
const OUT = path.join(ROOT, "derived");
const SOURCE_FILE = "vendor/amy/amy/default-dx7-patches.bin";

const VOICE_SIZE = 156;
const VOICE_COUNT = 1024;

const buf = fs.readFileSync(path.join(VENDOR, "amy", "amy", "default-dx7-patches.bin"));
if (buf.length !== VOICE_SIZE * VOICE_COUNT) {
  throw new Error(`Unerwartete Dateigröße: ${buf.length}, erwartet ${VOICE_SIZE * VOICE_COUNT}`);
}

function parseVoice(bytes) {
  let i = 0;
  const next = () => bytes[i++];
  const nextN = (n) => Array.from({ length: n }, () => next());

  const ops = [];
  // Beginnt bei Operator 6, absteigend bis 1 (exakte Reihenfolge aus fm.py).
  for (let opnum = 6; opnum >= 1; opnum--) {
    const rates = nextN(4);
    const levels = nextN(4);
    const breakpoint = next();
    const bpDepths = nextN(2);
    const bpCurves = nextN(2);
    const kbdRateScaling = next();
    const ampModSens = next();
    const keyVelSens = next();
    const opAmp = next();
    const ratioTuning = next() !== 1; // Byte==1 -> Fixed-Hz-Modus, sonst Ratio-Modus
    const freqCoarse = next();
    const freqFine = next();
    const freqDetune = next();
    ops.push({
      opnum, rates, levels, breakpoint, bpDepths, bpCurves,
      kbdRateScaling, ampModSens, keyVelSens, opAmp, ratioTuning,
      freqCoarse, freqFine, freqDetune,
    });
  }

  const pitchRates = nextN(4);
  const pitchLevels = nextN(4);
  const algorithm = next(); // 0..31 (DX7-Anzeige zeigt 1..32)
  const feedback = next();
  const oscSync = next();
  const lfoSpeed = next();
  const lfoDelay = next();
  const lfoPitchModDepth = next();
  const lfoAmpModDepth = next();
  const lfoSync = next();
  const lfoWaveform = next();
  const pitchModSens = next();
  const transpose = next();
  const nameBytes = nextN(10);
  const name = nameBytes.map((b) => String.fromCharCode(b)).join("").trim();

  return {
    ops, pitchRates, pitchLevels, algorithm, feedback, oscSync, lfoSpeed, lfoDelay,
    lfoPitchModDepth, lfoAmpModDepth, lfoSync, lfoWaveform, pitchModSens, transpose,
    name, bytesConsumed: i,
  };
}

// fm.py `from_bytestream` liest pro Voice bewusst nur 155 der 156 Byte (ein
// Byte bleibt ungenutzt/reserviert, wie im Original - AMY slice't ebenfalls
// strikt in 156-Byte-Schritten und ignoriert den Rest stillschweigend). Jede
// Voice startet trotzdem exakt bei v*156, das 156. Byte wird pro Voice einfach
// übersprungen statt einen Parsing-Fehler auszulösen.
const EXPECTED_CONSUMED = 155;

// Nur die von synthlab/src/audio/engines/dx7.ts tatsächlich ausgewerteten
// Felder werden in die Bank übernommen (Breakpoint/Curves/KBD-Rate-Scaling/
// AmpModSens/KeyVelSens sind importiert-aber-nicht-implementiert, siehe
// dx7.worklet.ts Dateikopf) - reduziert die JSON-Größe um >60%, ohne
// Informationsverlust für den aktuellen Funktionsumfang.
function trimOp(op) {
  return {
    rates: op.rates,
    levels: op.levels,
    ratioTuning: op.ratioTuning,
    freqCoarse: op.freqCoarse,
    freqFine: op.freqFine,
    freqDetune: op.freqDetune,
    opAmp: op.opAmp,
  };
}

const voices = [];
for (let v = 0; v < VOICE_COUNT; v++) {
  const chunk = buf.subarray(v * VOICE_SIZE, (v + 1) * VOICE_SIZE);
  const parsed = parseVoice(chunk);
  if (parsed.bytesConsumed !== EXPECTED_CONSUMED) {
    throw new Error(`Voice ${v}: ${parsed.bytesConsumed} Bytes gelesen, erwartet ${EXPECTED_CONSUMED} (Byte-Layout-Fehler)`);
  }
  voices.push({
    index: v,
    name: parsed.name,
    algorithm: parsed.algorithm,
    feedback: parsed.feedback,
    ops: parsed.ops.map(trimOp),
  });
}

const result = {
  _meta: {
    sourceRepo: "https://github.com/shorepine/amy",
    sourceFile: SOURCE_FILE,
    generatedWith: "bwhitman/learnfm (dx7db)",
    license: "MIT",
    extractedAt: "2026-07-27",
    count: voices.length,
    note:
      "1024 DX7-Werksvoices im klassischen 'unpacked' 156-Byte-Format. Rate/Level " +
      "0..99 pro EG-Stufe, Coarse/Fine/Detune für Operator-Frequenz, algorithm 0..31 " +
      "(entspricht DX7-Anzeige Algorithmus 1..32), feedback 0..7. Siehe " +
      "audio/worklets/dx7Math.ts und dx7.worklet.ts für die Umrechnung.",
  },
  voices,
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "dx7-voices.json"), JSON.stringify(result));
console.log(`dx7-voices.json: ${voices.length} Werksvoices`);
console.log("Stichprobe Namen:", voices.slice(0, 8).map((v) => v.name));
