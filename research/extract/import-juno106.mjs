// Extrahiert die 128 Roland-Juno-106-Werkspatches (Bänke A/B) aus AMYs
// Juno-106-Emulation und dekodiert sie exakt nach der in `juno.py` implementierten
// SysEx-Feldreihenfolge (FIELDS/BITS1/BITS2 inkl. der "krummen" Chorus-/HPF-Bit-
// Zuordnung). Ergebnis sind normalisierte 0..1-Parameter, keine erfundenen Werte.
//
// Quelle: research/vendor/amy/amy/juno.py (MIT, Brian Whitman & Daniel P. W. Ellis)
// Siehe plan5.md §3.1 (Variante A) und research/LICENSES.md für die
// Provenance-Entscheidung, Werkspatches trotz preset_sources.md-Grundregel mit
// voller Attribution zu übernehmen.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const VENDOR = path.join(ROOT, "vendor");
const OUT = path.join(ROOT, "derived");

const SOURCE_FILE = "vendor/amy/amy/juno.py";
const src = fs.readFileSync(path.join(VENDOR, "amy/amy/juno.py"), "utf8");

// Felder in exakter SysEx-Byte-Reihenfolge (juno.py: JunoPatch.FIELDS).
const FIELDS = [
  "lfoRate", "lfoDelayTime", "dcoLfo", "dcoPwm", "dcoNoise",
  "vcfFreq", "vcfRes", "vcfEnv", "vcfLfo", "vcfKbd", "vcaLevel",
  "envA", "envD", "envS", "envR", "dcoSub",
];
// Byte 16 (Bits 0..4): Boolean-Flags in dieser Reihenfolge.
const BITS1 = ["stop16", "stop8", "stop4", "pulse", "saw"];
// Byte 17 (Bits 0..2): weitere Boolean-Flags.
const BITS2 = ["pwmManual", "vcfNeg", "vcaGate"];

// Manuelle Pegel-Korrekturen für Presets, die Nutzer als zu laut meldeten
// (juno.py: _PATCH_GAIN_MODS). Index = 0-basierte Patch-Nummer.
const gainModsBlock = src.match(/_PATCH_GAIN_MODS = \{([\s\S]*?)\n\}/)[1];
const GAIN_MODS = Object.fromEntries(
  [...gainModsBlock.matchAll(/(\d+):\s*([\d.]+),/g)].map((m) => [Number(m[1]), Number(m[2])])
);

// _PATCHES = [["A11 Brass Set 1", [20, 49, 0, ...]], ...] -- ein einzeiliges Python-Literal.
const patchesLine = src.match(/^_PATCHES = (\[\[.*\]\])$/m);
if (!patchesLine) throw new Error("_PATCHES-Array nicht in juno.py gefunden");
// Python- und JSON-Arraysyntax sind hier identisch (nur Strings + Zahlen + Listen).
const rawPatches = JSON.parse(patchesLine[1]);
if (rawPatches.length !== 128) throw new Error(`Erwartet 128 Patches, gefunden ${rawPatches.length}`);

function decodeSysex(bytes) {
  if (bytes.length !== 18) throw new Error(`SysEx muss 18 Byte lang sein, war ${bytes.length}`);
  const params = {};
  FIELDS.forEach((field, i) => {
    params[field] = bytes[i] / 127;
  });
  const flags = {};
  BITS1.forEach((field, i) => {
    flags[field] = (bytes[16] & (1 << i)) > 0;
  });
  // Chorus: Bit 5+6 von Byte 16, Mapping laut juno.py [2,0,1,0][byte>>5] -> off/I/II (2=off).
  const chorusRaw = [2, 0, 1, 0][bytes[16] >> 5] ?? 2;
  const chorusMode = chorusRaw === 2 ? "off" : chorusRaw === 0 ? "I" : "II";
  BITS2.forEach((field, i) => {
    flags[field] = (bytes[17] & (1 << i)) > 0;
  });
  // HPF: Bits 3+4 von Byte 17, invertierte Reihenfolge [3,2,1,0][byte>>3] -> 0..3.
  const hpfMode = [3, 2, 1, 0][bytes[17] >> 3] ?? 0;
  return { params, flags, chorusMode, hpfMode };
}

const patches = rawPatches.map(([name, bytes], patchNumber) => {
  const decoded = decodeSysex(bytes);
  if (patchNumber in GAIN_MODS) {
    decoded.params.vcaLevel *= GAIN_MODS[patchNumber];
  }
  const bank = name[0]; // "A" oder "B"
  const group = name.slice(1, 2); // "1".."8"
  const slot = name.slice(2, 3); // "1".."8"
  return {
    patchNumber,
    name,
    bank,
    group: `${bank}${group}`,
    slot,
    sysex: bytes,
    ...decoded,
  };
});

const result = {
  _meta: {
    sourceRepo: "https://github.com/shorepine/amy",
    sourceFile: SOURCE_FILE,
    license: "MIT",
    attribution: "Brian Whitman & Daniel P. W. Ellis (AMY project)",
    extractedAt: "2026-07-27",
    count: patches.length,
    note:
      "128 Roland-Juno-106-Werkspatches (Bänke A/B), aus 18-Byte-SysEx-Werten dekodiert. " +
      "Parameter sind 0..1-normalisiert (raw/127). chorusMode: off|I|II. hpfMode: 0..3 " +
      "(0=aus, steigend = mehr Bassabsenkung, siehe juno.py `to_filter_freq`-Kommentare). " +
      "Siehe plan5.md §3.1 und research/LICENSES.md für die Provenance-Entscheidung.",
  },
  patches,
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "juno106-patches.json"), JSON.stringify(result, null, 2));
console.log(`juno106-patches.json: ${patches.length} Werkspatches (Bänke A/B)`);
