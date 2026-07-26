// Extrahiert die 33 DX7-artigen FM-Operator-Graphen aus amy/src/algorithms.c
// (AMY selbst zitiert diese Struktur von MSFA/DX7) und die klassischen
// FM-Instrumentenprofile (Ratios/Gains/ADSR) aus STK (TubeBell, Rhodey, Wurley,
// HevyMetl, BeeThree, FMVoices, PercFlut). Reine Zahlen-Extraktion, kein
// Fremdcode wird übernommen.
//
// Quelle Algorithmen: research/vendor/amy/src/algorithms.c (MIT)
// Quelle Instrumentenprofile: research/vendor/stk/src/{TubeBell,Rhodey,Wurley,
//   HevyMetl,BeeThree,FMVoices,PercFlut}.cpp (STK-Lizenz, MIT-artig)
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const VENDOR = path.join(ROOT, "vendor");
const OUT = path.join(ROOT, "derived");

// --- 1. AMY/DX7 FM-Algorithmen -------------------------------------------
const algoSrc = fs.readFileSync(path.join(VENDOR, "amy/src/algorithms.c"), "utf8");
const algoBlock = algoSrc.match(/const struct FmAlgorithm algorithms\[33\] = \{([\s\S]*?)\n\};/)[1];
const algoLines = [...algoBlock.matchAll(/\{\s*\{([^}]+)\}\s*\}\s*,?\s*\/\/\s*(\d+)/g)];

function decodeOpFlags(byte) {
  const OUT_BUS_ONE = 1 << 0, OUT_BUS_TWO = 1 << 1, OUT_BUS_ADD = 1 << 2;
  const IN_BUS_ONE = 1 << 4, IN_BUS_TWO = 1 << 5, FB_IN = 1 << 6, FB_OUT = 1 << 7;
  const b = byte;
  let output = null;
  if (b & OUT_BUS_ADD) output = "add"; // add to running op / bus one
  else if (b & OUT_BUS_TWO) output = "bus_two";
  else if (b & OUT_BUS_ONE) output = "bus_one";
  let input = null;
  if (b & IN_BUS_TWO) input = "bus_two";
  else if (b & IN_BUS_ONE) input = "bus_one";
  return {
    input,
    output,
    feedbackIn: !!(b & FB_IN),
    feedbackOut: !!(b & FB_OUT),
  };
}

const algorithms = algoLines.map((m) => {
  const bytes = m[1].split(",").map((s) => parseInt(s.trim(), 16));
  const index = Number(m[2]);
  // Bytes are listed op6..op1 in the source comment; store as op1..op6 (DX7 convention).
  const opsHiToLo = bytes.map(decodeOpFlags);
  const ops = [...opsHiToLo].reverse().map((op, i) => ({ op: i + 1, ...op }));
  const carriers = ops.filter((o) => o.output === "bus_one" || o.output === "add").map((o) => o.op);
  const hasFeedback = ops.some((o) => o.feedbackIn || o.feedbackOut);
  return { index, ops, carriers, hasFeedback };
});

// --- 2. STK FM-Instrumentenprofile ----------------------------------------
// fmGains_[i] = 0.933033^(99-i)  (siehe stk/src/FM.cpp Konstruktor-Schleife)
const fmGain = (i) => Math.pow(0.933033, 99 - i);
// fmSusLevels_[i] = 0.707101^(15-i) (gleiche Datei, zweite Schleife)
const fmSus = (i) => Math.pow(0.707101, 15 - i);

function parseStkInstrument(file) {
  const src = fs.readFileSync(path.join(VENDOR, "stk/src", `${file}.cpp`), "utf8");
  const ctor = src.split(/^\w[\w:~ ]*::\1?/m)[0]; // best-effort; fallback: whole file head
  const head = src.slice(0, src.indexOf("noteOn") > -1 ? src.indexOf("noteOn") : 4000);

  const ratios = [...head.matchAll(/setRatio\(\s*(\d+)\s*,\s*([-\d.]+)(?:\s*\*\s*([-\d.]+))?\s*\)/g)]
    .reduce((acc, m) => {
      const idx = Number(m[1]);
      const val = Number(m[2]) * (m[3] ? Number(m[3]) : 1);
      acc[idx] = val;
      return acc;
    }, {});

  const gainIdx = [...head.matchAll(/gains_\[(\d+)\]\s*=\s*fmGains_\[(\d+)\]/g)]
    .reduce((acc, m) => { acc[Number(m[1])] = Number(m[2]); return acc; }, {});

  const adsr = [...head.matchAll(/adsr_\[(\d+)\]->setAllTimes\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*(fmSusLevels_\[\d+\]|[-\d.]+)\s*,\s*([-\d.]+)\s*\)/g)]
    .reduce((acc, m) => {
      const idx = Number(m[1]);
      const susMatch = m[4].match(/fmSusLevels_\[(\d+)\]/);
      const sustain = susMatch ? fmSus(Number(susMatch[1])) : Number(m[4]);
      acc[idx] = { attack: Number(m[2]), decay: Number(m[3]), sustain, release: Number(m[5]) };
      return acc;
    }, {});

  const numOps = Math.max(
    Object.keys(ratios).length,
    Object.keys(gainIdx).length,
    Object.keys(adsr).length,
    4
  );

  const operators = Array.from({ length: numOps }, (_, i) => ({
    op: i + 1,
    ratio: ratios[i] ?? 1,
    gain: gainIdx[i] !== undefined ? Number(fmGain(gainIdx[i]).toFixed(4)) : 1,
    envelope: adsr[i]
      ? {
          attack: adsr[i].attack,
          decay: adsr[i].decay,
          sustain: Number(adsr[i].sustain.toFixed(4)),
          release: adsr[i].release,
        }
      : null,
  }));

  return { operators };
}

const stkInstruments = {
  tube_bell: parseStkInstrument("TubeBell"),
  rhodey: parseStkInstrument("Rhodey"),
  wurley: parseStkInstrument("Wurley"),
  hard_bell: parseStkInstrument("HevyMetl"),
  bee_three: parseStkInstrument("BeeThree"),
  fm_voices: parseStkInstrument("FMVoices"),
  perc_flute: parseStkInstrument("PercFlut"),
};

const result = {
  source: {
    algorithms: "research/vendor/amy/src/algorithms.c (MIT, Brian Whitman & Daniel P. W. Ellis; op-table lineage: MSFA/DX7)",
    instrumentProfiles: "research/vendor/stk/src/{TubeBell,Rhodey,Wurley,HevyMetl,BeeThree,FMVoices,PercFlut,FM}.cpp (STK license)",
  },
  note: "ops sind 1-indiziert (DX7-Konvention op1..op6). carriers = Operatoren, die auf den Hauptbus ausgeben. Instrument-envelopes in Sekunden (attack/decay/release) + normalisiertem sustain-level.",
  algorithms,
  instrumentProfiles: stkInstruments,
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "fm-algorithms.json"), JSON.stringify(result, null, 2));
console.log(`fm-algorithms.json: ${algorithms.length} Algorithmen, ${Object.keys(stkInstruments).length} Instrumentenprofile`);
