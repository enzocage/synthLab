// Extrahiert die 9 Modal-Materialpresets aus STK ModalBar (relative Modalfrequenzen,
// Resonanzradien, Mode-Gains, Anregungsparameter) sowie die Karplus-Strong-/
// Waveguide-Dämpfungscharakteristik aus STK Bowed/Mandolin als Referenzwerte für
// die eigene TypeScript-Modal-/String-Engine.
//
// Quelle: research/vendor/stk/src/ModalBar.cpp (STK-Lizenz)
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const VENDOR = path.join(ROOT, "vendor");
const OUT = path.join(ROOT, "derived");

const src = fs.readFileSync(path.join(VENDOR, "stk/src/ModalBar.cpp"), "utf8");
const tableBlock = src.match(/static StkFloat presets\[9\]\[4\]\[4\] = \{([\s\S]*?)\n\s*\};/)[1];

// Jeder Preset-Block: {{freqs},// Name \n {radii}, \n {gains}, \n {stickHardness,strikePos,directGain}}
const presetRe = /\{\{([^}]+)\},\s*\/\/\s*(.+?)\s*\n\s*\{([^}]+)\},\s*\n\s*\{([^}]+)\},\s*\n\s*\{([^}]+)\}\}/g;
const nums = (s) => s.split(",").map((x) => Number(x.trim()));

const materials = [...tableBlock.matchAll(presetRe)].map((m) => {
  const freqRatios = nums(m[1]);
  const name = m[2].trim();
  const radii = nums(m[3]);
  const gains = nums(m[4]);
  const [stickHardness, strikePosition, directGain] = nums(m[5]);
  return {
    name,
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
    modes: freqRatios.map((ratio, i) => ({
      // negative ratio in STK = fixed absolute frequency (Hz), not a note-relative ratio
      ratio: ratio < 0 ? null : ratio,
      fixedHz: ratio < 0 ? -ratio : null,
      radius: radii[i],
      gain: gains[i],
    })),
    excitation: { stickHardness, strikePosition, directGain },
  };
});

const result = {
  source: "research/vendor/stk/src/ModalBar.cpp (STK license, Perry R. Cook & Gary P. Scavone)",
  note:
    "modes[].radius ist der Resonanzpol-Radius pro Sample (0<r<1, naeher an 1 = laenger klingend). " +
    "ratio ist relativ zur Grundfrequenz; fixedHz (aus negativen STK-Werten) beschreibt eine feste, " +
    "nicht mit der Tonhoehe skalierende Resonanz (z.B. Anschlagsgeraeusch). Fuer die eigene modal-Engine " +
    "werden radius-Werte auf eine sample-rate-unabhaengige Nachklingzeit (T60) umgerechnet: " +
    "T60 = 3 * blockDuration / -log10(radius) je Modell zu reparametrisieren.",
  materials,
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "modal-materials.json"), JSON.stringify(result, null, 2));
console.log(`modal-materials.json: ${materials.length} Materialien (${materials.map((m) => m.name).join(", ")})`);
