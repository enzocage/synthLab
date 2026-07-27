// Importiert die 9 CloudSeed-Factory-Programme und übersetzt sie in das reduzierte
// Parameter-Set der eigenen CloudSeed-Neuimplementierung (synthlab/src/audio/fx/CloudSeed.ts).
// Die Original-JSON-Werte sind bereits 0..1-normalisiert (identische Skala), daher
// ist die Übersetzung eine reine Feld-Umbenennung/-Auswahl, keine Umrechnung -
// bis auf `crossSeed`, `lineModAmount`/`lineModRate`, die aus mehreren
// Original-Feldern gemittelt werden, weil das eigene Modell weniger Freiheitsgrade hat.
//
// Quelle: research/vendor/cloudseed/Factory Programs/*.json (MIT, Branch legacy-v1,
// ValdemarOrn/CloudSeed), siehe research/LICENSES.md.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const VENDOR = path.join(ROOT, "vendor");
const OUT = path.join(ROOT, "derived");
const SOURCE_DIR = "vendor/cloudseed/Factory Programs";

const dir = path.join(VENDOR, "cloudseed", "Factory Programs");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

function avg(...vals) {
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function convert(raw) {
  return {
    enabled: true,
    preDelay: raw.PreDelay,
    highPass: raw.HiPassEnabled >= 0.5 ? raw.HighPass : 0,
    lowPass: raw.LowPassEnabled >= 0.5 ? raw.LowPass : 1,
    tapCount: raw.TapCount,
    tapLength: raw.TapLength,
    tapDecay: raw.TapDecay,
    diffusionDelay: raw.DiffusionEnabled >= 0.5 ? raw.DiffusionDelay : 0.3,
    diffusionFeedback: raw.DiffusionFeedback,
    lineCount: raw.LineCount,
    lineDelay: raw.LineDelay,
    lineDecay: raw.LineDecay,
    lateDiffusionDelay: raw.LateDiffusionEnabled >= 0.5 ? raw.LateDiffusionDelay : 0.3,
    lateDiffusionFeedback: raw.LateDiffusionFeedback,
    lineModAmount: avg(raw.LineModAmount, raw.EarlyDiffusionModAmount),
    lineModRate: avg(raw.LineModRate, raw.EarlyDiffusionModRate),
    postLowShelfGain: raw.LowShelfEnabled >= 0.5 ? raw.PostLowShelfGain : 0.5,
    postLowShelfFrequency: raw.PostLowShelfFrequency,
    postHighShelfGain: raw.HighShelfEnabled >= 0.5 ? raw.PostHighShelfGain : 0.5,
    postHighShelfFrequency: raw.PostHighShelfFrequency,
    postCutoffFrequency: raw.CutoffEnabled >= 0.5 ? raw.PostCutoffFrequency : 1,
    crossSeed: raw.CrossSeed,
    dryOut: raw.DryOut,
    earlyOut: raw.EarlyOut,
    mainOut: raw.MainOut,
  };
}

function parseLenientJson(text) {
  // "The 90s Are Back.json" enthält unquotete Property-Namen (kein valides JSON,
  // vermutlich aus einer aelteren .NET-Serializer-Version) - Schluessel vor dem
  // Parsen in valides JSON umwandeln.
  const fixed = text.replace(/(^|[{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":');
  return JSON.parse(fixed);
}

const programs = files.map((file) => {
  const raw = parseLenientJson(fs.readFileSync(path.join(dir, file), "utf8"));
  const name = file.replace(/\.json$/, "");
  return {
    id: `cloudseed__${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`,
    name,
    settings: convert(raw),
  };
});

const result = {
  _meta: {
    sourceRepo: "https://github.com/ValdemarOrn/CloudSeed",
    sourceFile: SOURCE_DIR,
    sourceBranch: "legacy-v1",
    license: "MIT",
    attribution: "Valdemar Erlingsson",
    extractedAt: "2026-07-27",
    count: programs.length,
    note:
      "9 CloudSeed-Factory-Hallprogramme, übersetzt auf das reduzierte Parameter-Set " +
      "der eigenen CloudSeed-Neuimplementierung (audio/fx/CloudSeed.ts). Werte bereits " +
      "0..1-normalisiert wie im Original. Siehe plan5.md §5.2.",
  },
  programs,
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "cloudseed-programs.json"), JSON.stringify(result, null, 2));
console.log(`cloudseed-programs.json: ${programs.length} Factory-Programme (${programs.map((p) => p.name).join(", ")})`);
