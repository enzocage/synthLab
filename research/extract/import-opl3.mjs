// Parst die klassische DMX-GENMIDI-Instrumentenbank (Doom-Engine-Format,
// "#OPL_II#"-Header) und extrahiert alle 175 2-Operator-FM-Instrumente
// (128 melodisch + 47 Perkussion) mit ihren echten OPL2/OPL3-Registerwerten.
//
// Byte-Layout (verifiziert gegen chocolate-doom/src/i_oplmusic.c, GPL-2.0-Quelle
// nur als Formatreferenz zitiert, kein Code übernommen - siehe research/LICENSES.md):
//   Header: "#OPL_II#" (8 Byte)
//   175x genmidi_instr_t (36 Byte): flags(u16) finetune(u8) fixedNote(u8) voice[2](16 Byte je)
//     genmidi_voice_t (16 Byte): modulator(6) feedback(1) carrier(6) unused(1) baseNoteOffset(i16)
//       genmidi_op_t (6 Byte): tremoloVibSustainKsrMulti(1) attackDecay(1) sustainRelease(1) waveform(1) keyScaleLevel(1) outputLevel(1)
//   175x 32-Byte ASCII-Instrumentenname (nach allen Datenblöcken)
//
// Quelle: research/vendor/dmxopl/GENMIDI.op2 (MIT, sneakernets/DMXOPL), siehe
// research/LICENSES.md.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const VENDOR = path.join(ROOT, "vendor");
const OUT = path.join(ROOT, "derived");
const SOURCE_FILE = "vendor/dmxopl/GENMIDI.op2";

const MELODIC_COUNT = 128;
const PERCUSSION_COUNT = 47;
const TOTAL = MELODIC_COUNT + PERCUSSION_COUNT;
const INSTR_SIZE = 36;
const NAME_SIZE = 32;
const HEADER_SIZE = 8;

const buf = fs.readFileSync(path.join(VENDOR, "dmxopl", "GENMIDI.op2"));
if (buf.toString("ascii", 0, 8) !== "#OPL_II#") throw new Error("Unerwarteter GENMIDI-Header");

function parseOp(byteMisc, byteAd, byteSr, byteWave, byteScale, byteLevel) {
  return {
    tremolo: (byteMisc & 0x80) !== 0,
    vibrato: (byteMisc & 0x40) !== 0,
    sustainMode: (byteMisc & 0x20) !== 0, // true = sustained (organ-artig), false = perkussiv (schnell abklingend)
    ksr: (byteMisc & 0x10) !== 0,
    multiplier: byteMisc & 0x0f,
    attackRate: (byteAd >> 4) & 0x0f,
    decayRate: byteAd & 0x0f,
    sustainLevel: (byteSr >> 4) & 0x0f,
    releaseRate: byteSr & 0x0f,
    waveform: byteWave & 0x07,
    keyScaleLevel: (byteScale >> 6) & 0x03,
    outputLevel: byteLevel & 0x3f,
  };
}

function parseVoice(view, offset) {
  const modulator = parseOp(
    view.getUint8(offset + 0), view.getUint8(offset + 1), view.getUint8(offset + 2),
    view.getUint8(offset + 3), view.getUint8(offset + 4), view.getUint8(offset + 5)
  );
  const feedbackByte = view.getUint8(offset + 6);
  const carrier = parseOp(
    view.getUint8(offset + 7), view.getUint8(offset + 8), view.getUint8(offset + 9),
    view.getUint8(offset + 10), view.getUint8(offset + 11), view.getUint8(offset + 12)
  );
  // offset+13 = unused
  const baseNoteOffset = view.getInt16(offset + 14, true);
  return {
    modulator,
    carrier,
    feedback: (feedbackByte >> 1) & 0x07,
    connection: feedbackByte & 0x01 ? "additive" : "fm",
    baseNoteOffset,
  };
}

const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
const instruments = [];
for (let i = 0; i < TOTAL; i++) {
  const base = HEADER_SIZE + i * INSTR_SIZE;
  const flags = view.getUint16(base + 0, true);
  const fineTuning = view.getUint8(base + 2);
  const fixedNote = view.getUint8(base + 3);
  const voice0 = parseVoice(view, base + 4);
  const voice1 = parseVoice(view, base + 4 + 16);
  instruments.push({
    index: i,
    kind: i < MELODIC_COUNT ? "melodic" : "percussion",
    gmProgramOrNote: i < MELODIC_COUNT ? i : i - MELODIC_COUNT + 35, // GM-Percussion beginnt bei Note 35
    fixedPitch: (flags & 0x0001) !== 0,
    twoVoice: (flags & 0x0004) !== 0,
    fineTuning,
    fixedNote,
    voices: [voice0, voice1],
  });
}

const namesStart = HEADER_SIZE + TOTAL * INSTR_SIZE;
for (let i = 0; i < TOTAL; i++) {
  const nameBuf = buf.subarray(namesStart + i * NAME_SIZE, namesStart + (i + 1) * NAME_SIZE);
  const nul = nameBuf.indexOf(0);
  instruments[i].name = nameBuf.toString("ascii", 0, nul === -1 ? NAME_SIZE : nul).trim();
}

const result = {
  _meta: {
    sourceRepo: "https://github.com/sneakernets/DMXOPL",
    sourceFile: SOURCE_FILE,
    formatReference: "chocolate-doom/src/i_oplmusic.c (nur Byte-Layout-Referenz, GPL-2.0, kein Code übernommen)",
    license: "MIT",
    extractedAt: "2026-07-27",
    count: instruments.length,
    melodicCount: MELODIC_COUNT,
    percussionCount: PERCUSSION_COUNT,
    note:
      "175 echte OPL2/OPL3-2-Operator-FM-Instrumente (128 melodisch nach General-MIDI-Programmnummer, " +
      "47 Perkussion nach GM-Drum-Notennummer 35-81). Registerwerte 1:1 aus der Original-Bank dekodiert " +
      "(Multiplier/KSR/EG-Type/Tremolo/Vibrato, Attack/Decay/Sustain/Release-Raten 0-15, Output-Level 0-63, " +
      "Key-Scale-Level 0-3, Waveform 0-7, Feedback 0-7, Connection FM/additiv).",
  },
  instruments,
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "opl3-instruments.json"), JSON.stringify(result));
console.log(`opl3-instruments.json: ${instruments.length} Instrumente (${MELODIC_COUNT} melodisch + ${PERCUSSION_COUNT} Perkussion)`);
