# SID Synthesizer Research & Reference Sources

## Overview

For the implementation of `SID Lab` (`sid-chip`), the following MIT/permissive references were researched and documented in accordance with `plan1.md`:

1. `stevi84/sid-player` (MIT) - Oscillator algorithms & AudioWorklet structure.
2. `igorski/VSTSID` (MIT) - Pulse Width Modulation (PWM), ADSR timing table curves, ring modulation & portamento.
3. `devinvenable/c64SIDkit` (MIT) - ADSR rate tables (0..15), pitch sweeps, vibrato LFO.
4. `JC-000/c64-sid-instruments` (CC BY 4.0) - Non-linear 6581 filter saturation curves vs 8580 clean state.

## Non-included GPL / Proprietary Sources (Excluded from application codebase)
- `libsidplayfp` / `reSID` / `sidflow` (GPL)
- `jsSID` (Inconsistent license)
- `HVSC` music files (Copyright protected songs)
