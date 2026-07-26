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

log "=== Vendor-Clone Ende ==="
du -sh "$VENDOR"/* 2>/dev/null | tee -a "$LOG"
