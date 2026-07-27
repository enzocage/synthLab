// 128 importierte Roland-Juno-106-Werkspatches (Bänke A/B) als Preset-Objekte.
// Quelle: src/data/derived/juno106-patches.json (aus research/vendor/amy/amy/juno.py,
// MIT, siehe research/LICENSES.md). Parameter werden 1:1 unverändert übernommen -
// keine Neuerfindung, Rollen/Tags/Makros werden aus den echten Werten abgeleitet
// statt zufällig vergeben (plan5 §6.1).
import type { Preset, Role } from "./schema";
import { defaultFxChainSettings } from "../audio/fx/types";
import juno106Bank from "../data/derived/juno106-patches.json";

interface JunoBankPatch {
  patchNumber: number;
  name: string;
  bank: string;
  group: string;
  slot: string;
  sysex: number[];
  params: Record<string, number>;
  flags: Record<string, boolean>;
  chorusMode: "off" | "I" | "II";
  hpfMode: number;
}

const bank = juno106Bank as unknown as { _meta: { sourceRepo: string; sourceFile: string; license: string }; patches: JunoBankPatch[] };

// Grobe Rollen-Ableitung aus dem Original-Werksnamen (Roland-Beschriftung),
// mit Fallback über die Parameter (Cutoff/Release/Attack), falls kein Namens-Keyword passt.
const NAME_ROLE_HINTS: [RegExp, Role][] = [
  [/bass/i, "bass"],
  [/(brass|trumpet|horn|sax|reed|clarinet|oboe|bassoon)/i, "synth"],
  [/(string|violin|cello|orchestral|ensemble)/i, "pad"],
  [/(organ|choir|pad|sustainer|ethereal|caverns|blizzard)/i, "pad"],
  [/(bell|chime|glass|celeste)/i, "bell"],
  [/(pluck|clav|harpsichord|koto|guitar|banjo|lute|pizzicato)/i, "pluck"],
  [/(piano|rhodes|e\.\s?piano)/i, "melody"],
  [/(lead|solo)/i, "melody"],
  [/(drum|tom|snare|timpani|shaker|clap|percussion)/i, "rhythm"],
  [/(sweep|rise|fx|noise|storm|thunder|helicopter|froggy|wah)/i, "fx"],
  [/(funky|repeater|resonance)/i, "arp"],
];

function deriveRole(patch: JunoBankPatch): Role {
  for (const [re, role] of NAME_ROLE_HINTS) {
    if (re.test(patch.name)) return role;
  }
  if (patch.params.dcoSub > 0.5 && patch.params.vcfFreq < 0.35) return "bass";
  if (patch.params.envA > 0.4 && patch.params.envR > 0.4) return "pad";
  if (patch.params.envA < 0.1 && patch.params.envD < 0.3) return "pluck";
  return "synth";
}

function deriveTags(patch: JunoBankPatch): string[] {
  const tags = ["juno-106", "roland", "vintage", `bank-${patch.bank.toLowerCase()}`];
  if (patch.flags.pulse && patch.flags.saw) tags.push("dual-osc");
  if (patch.params.dcoSub > 0.4) tags.push("sub-heavy");
  if (patch.params.dcoNoise > 0.3) tags.push("noisy");
  if (patch.chorusMode !== "off") tags.push(`chorus-${patch.chorusMode.toLowerCase()}`);
  if (patch.params.vcfRes > 0.6) tags.push("resonant");
  return tags;
}

// Makros werden aus den echten Parametern zurückgerechnet (keine Zufallswerte) -
// dieselben Umrechnungskurven, die die Engine selbst verwendet (siehe juno106.ts),
// hier nur grob genug für die 0..1-Makro-Skala.
function deriveMacros(patch: JunoBankPatch) {
  const p = patch.params;
  return {
    brightness: clamp01(p.vcfFreq),
    motion: clamp01(Math.max(p.lfoRate * 0.6, p.vcfLfo)),
    density: clamp01(p.dcoPwm),
    space: clamp01(p.envR),
    drive: clamp01(p.vcfRes),
    detune: clamp01(p.dcoLfo),
    body: clamp01(p.dcoSub),
    air: clamp01(p.dcoNoise),
  };
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v ?? 0));
}

function toPresetParams(patch: JunoBankPatch): Record<string, number | string | boolean> {
  return {
    ...patch.params,
    stop16: patch.flags.stop16,
    stop8: patch.flags.stop8,
    stop4: patch.flags.stop4,
    pulse: patch.flags.pulse,
    saw: patch.flags.saw,
    pwmManual: patch.flags.pwmManual,
    vcfNeg: patch.flags.vcfNeg,
    vcaGate: patch.flags.vcaGate,
    hpfMode: patch.hpfMode,
    chorusMode: patch.chorusMode,
  };
}

function buildJunoPresets(): Preset[] {
  return bank.patches.map((patch) => {
    const role = deriveRole(patch);
    return {
      id: `juno106__werkspatch_${patch.patchNumber}`,
      name: `${patch.name} (Juno-106)`,
      engine: "juno106",
      archetype: "juno106_werkspatch",
      seed: patch.patchNumber,
      variant: 0,
      roles: [role],
      tags: deriveTags(patch),
      params: toPresetParams(patch),
      macros: deriveMacros(patch),
      fx: defaultFxChainSettings(),
      provenance: {
        source: "amy-juno106",
        license: bank._meta.license,
        derivedFrom: patch.name,
        upstreamRepo: bank._meta.sourceRepo,
        upstreamFile: bank._meta.sourceFile,
      },
      rating: 0,
      favorite: false,
      notes: `Original Roland Juno-106 Werkspatch "${patch.name}", importiert über AMY (MIT).`,
      createdAt: 1753500000000 + patch.patchNumber,
    };
  });
}

export const JUNO106_PRESETS: Preset[] = buildJunoPresets();
