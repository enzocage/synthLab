#!/usr/bin/env bash
# Klont alle in den Analyse-Dokumenten genannten Repositories als Referenzmaterial.
# Grosse Repos werden partiell geklont (blob:none + sparse checkout), damit nur die
# fuer die Synth-/Preset-Extraktion relevanten Pfade auf die Platte kommen.
#
# WICHTIG: vendor/ ist reines Lesematerial. Es wird KEIN Code aus GPL-Projekten in
# synthlab/ kopiert. Siehe research/LICENSES.md.

set -u
ROOT="$(cd "$(dirname "$0")" && pwd)"
VENDOR="$ROOT/vendor"
mkdir -p "$VENDOR"
LOG="$ROOT/clone.log"
: > "$LOG"

log() { echo "[$(date +%H:%M:%S)] $*" | tee -a "$LOG"; }

# full <name> <url>   -> flacher Clone mit allen Dateien (kleine/mittlere Repos)
full() {
  local name="$1" url="$2"
  if [ -d "$VENDOR/$name/.git" ]; then log "SKIP  $name (bereits vorhanden)"; return; fi
  log "FULL  $name"
  git clone --depth 1 --quiet "$url" "$VENDOR/$name" >>"$LOG" 2>&1 \
    && log "  ok  $name" || log "  FAIL $name"
}

# sparse <name> <url> <pfad...> -> partieller Clone, nur genannte Pfade
sparse() {
  local name="$1" url="$2"; shift 2
  if [ -d "$VENDOR/$name/.git" ]; then log "SKIP  $name (bereits vorhanden)"; return; fi
  log "SPRS  $name  [$*]"
  git clone --depth 1 --filter=blob:none --sparse --quiet "$url" "$VENDOR/$name" >>"$LOG" 2>&1 || { log "  FAIL $name"; return; }
  ( cd "$VENDOR/$name" && git sparse-checkout set --no-cone "$@" >>"$LOG" 2>&1 ) \
    && log "  ok  $name" || log "  FAIL sparse $name"
}

log "=== Vendor-Clone Start ==="

# --- Klein/mittel: komplett (permissive Lizenzen, direkte Referenz) -------------
full tonejs        https://github.com/Tonejs/Tone.js.git
full amy           https://github.com/shorepine/amy.git
full daisysp       https://github.com/electro-smith/DaisySP.git
full stk           https://github.com/thestk/stk.git
full fundsp        https://github.com/SamiPerttu/fundsp.git
full isobar        https://github.com/ideoforms/isobar.git
full musiclang     https://github.com/MusicLang/musiclang.git
full supriya       https://github.com/supriya-project/supriya.git
full sk-engines    https://github.com/shakfu/sk-engines.git

# --- Gross: nur relevante Pfade ------------------------------------------------
sparse surge       https://github.com/surge-synthesizer/surge.git \
                   'src/common/dsp' 'src/common/*.h' 'src/common/*.cpp' 'doc' 'resources/data/configuration.xml'
sparse vital       https://github.com/mtytel/vital.git \
                   'src/synthesis' 'src/common'
sparse supercollider https://github.com/supercollider/supercollider.git \
                   'SCClassLibrary/Common/Audio' 'SCClassLibrary/Common/Collections' 'HelpSource/Classes' 'server/plugins'
sparse csound      https://github.com/csound/csound.git \
                   'Opcodes' 'OOps' 'Engine/*.c'
sparse faustlibs   https://github.com/grame-cncm/faustlibraries.git \
                   '*.lib'
sparse pyo         https://github.com/belangeo/pyo.git \
                   'pyolib' 'src/objects'
sparse chuck       https://github.com/ccrma/chuck.git \
                   'src/core/ugen_*.cpp' 'src/core/ugen_*.h' 'examples'
sparse sonicpi     https://github.com/sonic-pi-net/sonic-pi.git \
                   'etc/synthdefs/designs' 'app/server/ruby/lib/sonicpi/synths'
sparse fluidsynth  https://github.com/FluidSynth/fluidsynth.git \
                   'src/synth' 'src/rvoice'

# --- plan5: Synth-Engines & FX-Module (permissive Lizenzen) --------------------
sparse eurorack    https://github.com/pichenettes/eurorack.git \
                   'plaits/dsp' 'rings/dsp' 'warps/dsp' 'clouds/dsp' 'elements/dsp'
full moogladders   https://github.com/ddiakopoulos/MoogLadders.git
sparse soundpipe   https://github.com/PaulBatchelor/Soundpipe.git \
                   'modules' 'lib' 'h'
# CloudSeed: der Default-Branch "master" enthaelt nur Doku-Dateien, der eigentliche
# Quellcode + Factory-Programme liegen auf dem Branch "legacy-v1".
sparse-branch() {
  local name="$1" url="$2" branch="$3"; shift 3
  if [ -d "$VENDOR/$name/.git" ]; then log "SKIP  $name (bereits vorhanden)"; return; fi
  log "SPRS  $name@$branch  [$*]"
  git clone --depth 1 --branch "$branch" --filter=blob:none --sparse --quiet "$url" "$VENDOR/$name" >>"$LOG" 2>&1 || { log "  FAIL $name"; return; }
  ( cd "$VENDOR/$name" && git sparse-checkout set --no-cone "$@" >>"$LOG" 2>&1 ) \
    && log "  ok  $name" || log "  FAIL sparse $name"
}
sparse-branch cloudseed https://github.com/ValdemarOrn/CloudSeed.git legacy-v1 \
                   'CloudSeed.Native' 'Factory Programs' 'license.txt' 'readme.md'
# airwindows als Vollklon enthaelt 518 Plugins (mehrere hundert MB) - nur die
# fuer galactic/tape tatsaechlich benoetigten Plugin-Ordner sparse klonen.
sparse airwindows  https://github.com/airwindows/airwindows.git \
                   'plugins/LinuxVST/src/Galactic' 'plugins/LinuxVST/src/Galactic2' \
                   'plugins/LinuxVST/src/Galactic3' 'plugins/LinuxVST/src/ToTape5' \
                   'plugins/LinuxVST/src/ToTape6' 'plugins/LinuxVST/src/IronOxide5' \
                   'plugins/LinuxVST/src/IronOxideClassic' 'LICENSE'
# AKWF-FREE als Vollklon ist >1.7GB (WAV/PNG-Vorschauen in jeder Sammlung) und
# bricht per Timeout ab - nur AKWF-js (die fuer die eigene DFT-Extraktion
# benoetigten JSON-Wellenformdaten) sparse klonen, ~45MB.
sparse akwf        https://github.com/KristofferKarlAxelEkstrand/AKWF-FREE.git \
                   'AKWF-js' 'README.md' 'LICENSE.md'
full dmxopl        https://github.com/sneakernets/DMXOPL.git
full signalsmith-stretch https://github.com/Signalsmith-Audio/signalsmith-stretch.git
full dattorro-verb https://github.com/el-visio/dattorro-verb.git

# --- plan10: 10 weitere FX-Module (permissive Lizenzen) -----------------------
sparse eurorack    https://github.com/pichenettes/eurorack.git \
                   'clouds/dsp' 'rings/dsp' 'stmlib/dsp' 'stmlib/utils'
full moogladders   https://github.com/ddiakopoulos/MoogLadders.git
full paulstretch_python https://github.com/paulnasca/paulstretch_python.git
# Soundpipe: nur bitcrush.c (+ fold.c-Abhaengigkeit) ist unbedenklich MIT ohne
# Csound/FAUST-Fremdherkunft - siehe research/LICENSES.md "plan10" fuer die
# ausgeschlossenen GPL/LGPL-Module (zitarev/revsc/talkbox).
sparse soundpipe   https://github.com/PaulBatchelor/Soundpipe.git \
                   'modules/bitcrush.c' 'modules/fold.c' 'h/soundpipe.h' 'LICENSE'

log "=== Vendor-Clone Ende ==="
du -sh "$VENDOR"/* 2>/dev/null | tee -a "$LOG"
