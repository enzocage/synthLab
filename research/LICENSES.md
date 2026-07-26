# Licences & Attributions for SID Lab (synthlab)

This document tracks all external reference repositories analyzed and adapted for the `sid-chip` ("SID Lab") engine in `synthlab`.

## Primary Technical Reference

### [`stevi84/sid-player`](https://github.com/stevi84/sid-player)
- **License:** MIT
- **Usage:** Architecture reference for Web Audio AudioWorklet SID voice structures, pitch conversion, and ADSR timing models.
- **Attribution:** Original work by stevi84.

## Secondary Permissive References

### [`igorski/VSTSID`](https://github.com/igorski/VSTSID)
- **License:** MIT
- **Usage:** Reference implementation for PWM modulation, ADSR timing curves, Portamento logic, tempo arpeggiator & ring modulation algorithms.
- **Attribution:** Copyright (c) Igorski.

### [`devinvenable/c64SIDkit`](https://github.com/devinvenable/c64SIDkit)
- **License:** MIT
- **Usage:** Reference for SID ADSR timing classes, register parameter mappings, frequency sweeps, vibrato and portable chip sound design techniques.
- **Attribution:** Copyright (c) Devin Venable.

### [`JC-000/c64-sid-instruments`](https://github.com/JC-000/c64-sid-instruments)
- **License:** CC BY 4.0
- **Usage:** Schema reference for 6581/8580 filter curve characteristics.

---

## Copyright & Provenance Notice

All 300 presets provided with SID Lab (`sid-chip`) are original synthesised sound designs.
- No original SID files (`.sid`), extracted instrument tables, binary ROMs, or composer samples from commercial C64 games or HVSC are included in this project.
- Named era collections (e.g. `Hubbard-era`, `Galway-era`, `Daglish-era`, `Gray-era`) refer strictly to documented synthesiser technique studies and sound design styles of the 1980s 8-bit chip era.
