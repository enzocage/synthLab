# Legal & Compliance Audit: Public Open-Source Repository & Web Application

**Project:** SynthLab / Ambient Musikmaschine (`ambient2`)  
**Target:** Conversion to a fully legal public Open-Source Repository & Public Live Web Application  
**Date:** July 27, 2026  
**Status:** Comprehensive Audit & Action Plan  

---

## Executive Summary

This document provides an exhaustive legal audit and actionable roadmap to transform the **SynthLab / Ambient Musikmaschine** codebase (`ambient2`) into:
1. A **legally compliant public open-source repository** on GitHub/GitLab.
2. A **legally compliant public live web application** accessible to end-users worldwide (with specific adherence to EU / German digital media and data protection laws: DSGVO / GDPR, § 5 DDG / Digital Services Act).

### Key Audit Findings

| Category | Risk Level | Current State | Required Action |
|---|---|---|---|
| **Repository License** | ⚠️ High | No top-level `LICENSE` file | Add official `LICENSE` file (MIT recommended). |
| **Attribution & Provenance** | 🟡 Medium | `research/LICENSES.md` exists internally, but no public `ATTRIBUTION.md` | Create user-facing `ATTRIBUTION.md` listing all 3rd-party code, DSP algorithms, and original authors. |
| **Trademark Usage** | 🟡 Medium | Direct references to Yamaha, Roland, Commodore, Sega, Moog, Ableton in UI and README | Add mandatory **Trademark & Brand Disclaimer** in README and Web UI footer (Nominative Fair Use). |
| **Preset & Data Copyright** | 🟡 Medium | 1,024 DX7 voices, 128 Juno-106 patches, 175 OPL3 patches imported from `amy`/`DMXOPL` | Provide explicit data provenance notice and user rights clarification. (AKWF waveforms are CC0-1.0; SID presets are original). |
| **DSP Code Licensing** | 🟢 Low / Resolved | Worklets adapted from MIT/Public Domain sources; LGPL code (`Soundpipe/fold.c`) was audited and excluded | Maintain clear code headers for adapted worklets (`amy`, `CloudSeed`, `airwindows`, `dattorro-verb`, `eurorack`, `Signalsmith`). |
| **Impressum (Legal Notice)** | 🔴 Critical (Live App) | Missing in web UI | Add mandatory **Impressum / Provider Identification** (§ 5 DDG / DSA) for live web app deployment. |
| **Datenschutz (Privacy Policy)** | 🔴 Critical (Live App) | Missing in web UI | Add **Privacy Policy (DSGVO/GDPR)** covering local storage (IndexedDB), server logs, and user identity headers. |
| **Terms of Service & Audio Safety** | 🔴 Critical (Live App) | Missing in web UI | Add **Terms of Service** including audio output commercial rights, hearing safety warnings, and warranty disclaimers. |
| **Git Hygiene & Security** | 🟡 Medium | `research/vendor/` ignored via `.gitignore`, `ambient-lab/` ignored via `.gitignore` | Ensure `research/vendor/` and `.env` files are not pushed to public remote repository. |

---

## Part 1: Open-Source Repository Legal Compliance (GitHub / GitLab)

### 1. Root Repository Licensing

- **Current Status:** The `README.md` states MIT License for codebase & presets, but **no top-level `LICENSE` file exists** in the root workspace directory.
- **Requirement:** A public repository without a `LICENSE` file defaults to "All Rights Reserved", creating legal ambiguity for potential contributors and open-source users.
- **Action Required:**
  1. Create a top-level `LICENSE` file in the root directory containing the standard **MIT License** text (or Apache 2.0 / AGPL 3.0 if preferred).
  2. Update `synthlab/package.json` and `ambient-lab/package.json` to change `"private": true` (if publishing packages) or set `"license": "MIT"`.

---

### 2. DSP Code & Algorithm Provenance (Clean-Room Audit)

The repository incorporates adapted digital signal processing (DSP) algorithms from several third-party open-source projects. The audit results for each component are detailed below:

#### A. Adapted Open-Source Code (MIT / Permissive Licenses)

1. **DX7 AudioWorklet & Math** (`synthlab/src/audio/worklets/dx7.worklet.ts`, `dx7Math.ts`)
   - **Source:** [`shorepine/amy`](https://github.com/shorepine/amy) (MIT License, © Brian Whitman & Daniel P. W. Ellis).
   - **Original Attribution Note:** `amy` credits the algorithm routing structure to MSFA (*Music Synthesizer for Android*).
   - **Status:** **Compliant.** MIT permits adaptation.
   - **Requirement:** Retain copyright attribution header in `dx7.worklet.ts` and document in `ATTRIBUTION.md`.

2. **Juno-106 VA Engine & Parametric Regressions** (`synthlab/src/audio/components/`)
   - **Source:** [`shorepine/amy`](https://github.com/shorepine/amy) (MIT License). Code comments reference [`pendragon-andyh/junox`](https://github.com/pendragon-andyh/junox) (GPL-3.0) solely as a mathematical comparison reference (no GPL code copied).
   - **Status:** **Compliant.** No GPL code contamination.

3. **CloudSeed Diffuser Reverb** (`synthlab/src/audio/worklets/`)
   - **Source:** [`ValdemarOrn/CloudSeed`](https://github.com/ValdemarOrn/CloudSeed) (MIT License, © Valdemar Erlingsson).
   - **Status:** **Compliant.** Re-implemented using internal DSP primitives (`allpass.ts`, `onepole.ts`). 9 factory programs imported directly.

4. **Airwindows Reverb & Tape** (`galactic.worklet.ts`, `tape.worklet.ts`)
   - **Source:** [`airwindows/airwindows`](https://github.com/airwindows/airwindows) (MIT License, © Chris Johnson).
   - **Status:** **Compliant.**

5. **Dattorro Plate Reverb** (`plate.worklet.ts`)
   - **Source:** [`el-visio/dattorro-verb`](https://github.com/el-visio/dattorro-verb) (MIT License, © Pauli Pölkki / Jon Dattorro 1997 paper).
   - **Status:** **Compliant.**

6. **Mutable Instruments DSP** (`clouds.worklet.ts`, `resonator.worklet.ts`)
   - **Source:** [`pichenettes/eurorack`](https://github.com/pichenettes/eurorack) (MIT License, © Émilie Gillet).
   - **Status:** **Compliant.** Converted from ARM Cortex-M4 fixed-point to Web Audio float32.

7. **Signalsmith Stretch Shimmer** (`shimmer.worklet.ts`)
   - **Source:** [`Signalsmith-Audio/signalsmith-stretch`](https://github.com/Signalsmith-Audio/signalsmith-stretch) (MIT License, © Geraint Luff / Signalsmith Audio Ltd.).
   - **Status:** **Compliant.**

8. **Moog Ladder Filters** (`ladder.worklet.ts`)
   - **Source:** [`ddiakopoulos/MoogLadders`](https://github.com/ddiakopoulos/MoogLadders) (Unlicense / Public Domain, © Dimitri Diakopoulos).
   - **Status:** **Compliant.**

9. **DaisySP Lo-Fi & Phaser** (`lofi.worklet.ts`, `Phaser.ts`)
   - **Source:** [`electro-smith/DaisySP`](https://github.com/electro-smith/DaisySP) (MIT License, © Electrosmith Corp).
   - **Status:** **Compliant.** Explicitly excluded LGPL modules (such as `ReverbSc`).

#### B. Public Domain Algorithms

1. **Paulstretch** (`paulstretch.worklet.ts`, `dsp/fft.ts`)
   - **Source:** [`paulnasca/paulstretch_python`](https://github.com/paulnasca/paulstretch_python) (Public Domain, © Nasca Octavian Paul).
   - **Status:** **Compliant.**

#### C. Viral License Exclusions (GPL / LGPL Safety Audit)

- **Soundpipe Audit:** During development of the `lofi` worklet, `Soundpipe/modules/bitcrush.c` (MIT header) was inspected. Deep dependency analysis revealed it calls `fold.c`, which contains code extracted from Csound's `fold` opcode (LGPL-2.1).
- **Corrective Action Taken:** Soundpipe code was **completely excluded** from compilation. The `lofi` worklet was implemented exclusively via DaisySP (MIT).
- **GPL Reference Check:** Repositories like `dragonfly-reverb` (GPL-3.0), `AnalogTapeModel` (GPL-3.0), and `chocolate-doom` (GPL-2.0, used only as binary file format specification reference) were cited for conceptual architecture only. **No GPL source code was copied.**

---

### 3. Presets & Sound Data Copyright Audit

The application packages **3,356 presets** across 23 synth engines:

1. **AKWF Single-Cycle Wavetables (261 waveforms):**
   - **Source:** [`KristofferKarlAxelEkstrand/AKWF-FREE`](https://github.com/KristofferKarlAxelEkstrand/AKWF-FREE) (CC0-1.0 Public Domain Dedication).
   - **Legal Status:** **100% Free & Unrestricted.**

2. **C64 SID Lab Presets (300 presets):**
   - **Source:** Original procedural sound designs by the author.
   - **Legal Status:** **100% Proprietary / Author Owned (Released under MIT).** No `.sid` ROM dumps or commercial game audio samples included.

3. **Yamaha DX7 Werksvoices (1,024 presets) & Roland Juno-106 Werkspatches (128 patches):**
   - **Source:** Imported via [`shorepine/amy`](https://github.com/shorepine/amy) (MIT).
   - **Legal Analysis:** These datasets consist of 156-byte / 18-byte parameter numbers (synthesizer register values), not recorded digital audio files. Under international copyright law (including US & EU standards), raw numerical parameter sets and mathematical synthesis coefficients generally lack copyrightability unless original artistic execution in sound recording is claimed. AMY has distributed them under MIT for years.
   - **Recommendation:** Document exact provenance in `ATTRIBUTION.md` and include a clear disclaimer stating that preset names (e.g. "BRASS 1", "E.PIANO 1") refer to historical factory parameters for educational and synthesis modeling purposes.

4. **OPL3 DMX GENMIDI Bank (175 instruments):**
   - **Source:** [`sneakernets/DMXOPL`](https://github.com/sneakernets/DMXOPL) (MIT License).
   - **Legal Analysis:** Registered parameter sets for DOS-era 2-Operator FM sound synthesis. Covered under MIT license from `DMXOPL`.

---

### 4. Trademark & Brand Name Protection

The project references hardware synthesizers, microchips, and corporate brand names:
- **Yamaha** (DX7, YMF262, OPL3)
- **Roland** (Juno-106)
- **Commodore / MOS Technology** (C64, SID, 6581/8580)
- **Sega** (Genesis, YM2612)
- **Moog** (Ladder Filter)
- **Ableton** (Ableton-Style FX Rack)
- **Casio** (CZ Phase Distortion)

#### Legal Rules for Trademarks:
Trademarks protect brand identity and source origin, not underlying technology or math. Mentioning trademarked product names in open-source software is permitted under **Nominative Fair Use** (US Trademark Law) and **Beschreibende Benutzung (§ 23 MarkenG / EU Directive 2015/2436)** provided that:
1. The use is strictly descriptive to identify sound synthesis compatibility or historical style.
2. There is no implication of endorsement, affiliation, sponsorship, or authorization by the trademark owners.
3. The brand logo is **not** used as the primary application logo.

#### Action Required:
Add the following **Trademark Disclaimer** prominently in `README.md` and the web application footer:

> **Trademark Notice & Disclaimer:**  
> *All product names, trademarks, registered trademarks, and brand names mentioned in this project (including Yamaha, DX7, Roland, Juno-106, Commodore, C64, MOS 6581/8580, Sega Genesis, YM2612, Moog, Ableton, Casio) are the property of their respective owners. Their use in this project is strictly for historical, technical identification, and sound synthesis modeling purposes only. SynthLab / Ambient Musikmaschine is an independent open-source project and is NOT affiliated with, authorized, endorsed, or sponsored by any of these trademark holders.*

---

### 5. Repository Sanitation & Git Hygiene

Before publishing the git repository to GitHub/GitLab:

1. **Verify `.gitignore` Enforcement:**
   - Ensure `research/vendor/` remains in `.gitignore`. `research/vendor/` contains cloned third-party repositories for research purposes. Distributing external git repos inside your repo could introduce mixed-license conflicts.
   - Verify `ambient-lab/` status: If `ambient-lab` is intended as a separate sub-project or microservice, either initialize it as a clean git submodule or remove `ambient-lab/` from `.gitignore` if it should be tracked.
2. **Secrets & Credentials Audit:**
   - Confirm no `.env`, `.env.local`, API keys, OAuth client secrets, or private tokens exist in any committed file or git commit history. (An automated grep check confirmed **0 hardcoded secrets** in the current workspace).

---

## Part 2: Live Public Web Application Compliance (Production Web App)

When running the application on a public web domain (e.g. `https://synthlab.app` or Cloudflare / Vercel hosting), statutory requirements for digital web applications must be satisfied.

---

### 1. Impressum / Provider Identification (Mandatory in EU / Germany)

Under **§ 5 DDG (Digitale-Dienste-Gesetz)**, **§ 18 MStV**, and the **EU Digital Services Act (DSA)**, any publicly accessible web service operated by a provider residing in Germany/EU must display an easily accessible, directly reachable Provider Identification (*Impressum*).

#### Required Contents for an Individual/Developer:
- **Full Legal Name** (Vor- und Nachname des Betreibers).
- **Physical Address** (Ladefähige Anschrift: Straße, Hausnummer, PLZ, Ort, Land; No P.O. Box).
- **Fast Contact Details** (E-Mail-Adresse und Telefonnummer oder schnelles Kontaktformular).
- **Responsible for Content** (Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV).

#### Implementation Requirement:
Create a dedicated `/impressum` route or an easily accessible modal dialog in the web UI, linked in the persistent application footer.

---

### 2. Privacy Policy (Datenschutzerklärung - DSGVO / GDPR / CCPA)

Under the **EU General Data Protection Regulation (GDPR / DSGVO)**, a Privacy Policy is mandatory for any public web application.

#### Web Application Data Processing Profile:
- **Client-Side Synthesis:** SynthLab runs 100% locally in the browser via Web Audio API & WebAssembly/Worklets. No user audio signals or MIDI data are transmitted to external servers.
- **Client-Side Storage:** User settings, custom presets, ratings (1–5 stars), A/B slots, and favorites are stored locally in the user's browser using IndexedDB (`dexie`) and `localStorage`.
- **Server Web Hosting Logs:** Standard HTTP server logs (IP address, user agent, timestamp) collected automatically by the hosting provider (e.g. Cloudflare Pages, Vercel, GitHub Pages).
- **Identity Headers (ambient-lab):** `ambient-lab` supports Optional ChatGPT Authentication headers (`oai-authenticated-user-email`).

#### Privacy Policy Mandatory Declarations:
1. **Controller Identification:** Name & contact email of the data controller.
2. **Local Storage Disclosure (Art. 6(1)(f) DSGVO):** Transparent explanation that IndexedDB / LocalStorage are used strictly for local operational functionality (saving user synth presets and UI state) without tracking or cross-site profiling.
3. **Web Server Logging (Art. 6(1)(f) DSGVO):** Purpose and retention period of server log files for infrastructure security and DDoS defense.
4. **User Rights (Art. 15–21 DSGVO):** Information on user rights regarding data access, deletion, rectification, and right to lodge a complaint with a supervisory authority.
5. **No Third-Party Analytics / Tracking:** Clear declaration if no tracking cookies, Google Analytics, or marketing pixels are used. (If analytics are added later, an ePrivacy/DSGVO consent banner is required).

---

### 3. Terms of Service & Audio Rights

To protect both the operator and the end-users, public Terms of Service (Nutzungsbedingungen) must define:

#### A. User Rights over Created Audio & Presets
- **Commercial & Non-Commercial License Grant:** Users retain **100% full ownership and copyright** of any music, audio recordings, sound effects, or custom patch settings created or exported using the web application. Users may freely use, publish, sell, or license audio generated with SynthLab without royalty obligations to the project maintainer.

#### B. Disclaimer of Warranties & Health Warning (Web Audio Safety)
- **Audio Output Safety Warning:** Synthesizer applications with feedback loops, resonance filters, dynamic FM mutation, and audio worklets can produce sudden volume spikes, high-frequency oscillations, or severe feedback loops due to DSP edge cases or user parameter manipulation.
- **Liability Limitation:** The web application is provided **"AS IS"**, without warranty of any kind. The maintainer explicitly disclaims liability for any hearing damage, equipment/speaker damage, or data loss resulting from the use of the web application.

---

## Part 3: Actionable Implementation Plan & Checklist

To execute all legal transformations efficiently, follow the prioritized step-by-step checklist below.

### Phase 1: Repository Legal Setup (High Priority)

- [ ] **Step 1.1: Create Root `LICENSE` File**
  - Location: `/LICENSE`
  - Action: Add official MIT License text with current year (2026) and Copyright holder name.

- [ ] **Step 1.2: Create Root `ATTRIBUTION.md` File**
  - Location: `/ATTRIBUTION.md`
  - Action: Document all third-party DSP code derivations (`amy`, `CloudSeed`, `airwindows`, `dattorro-verb`, `eurorack`, `Signalsmith`, `MoogLadders`, `DaisySP`, `paulstretch`), dataset sources (`AKWF`, `DMXOPL`), and open-source licenses.

- [ ] **Step 1.3: Update `README.md`**
  - Location: `/README.md` and `/synthlab/README.md`
  - Action: Insert the **Trademark & Brand Disclaimer** section and point to `LICENSE` and `ATTRIBUTION.md`.

- [ ] **Step 1.4: Add Code Header Notices**
  - Action: Verify that all adapted audio worklet files (`dx7.worklet.ts`, `galactic.worklet.ts`, `plate.worklet.ts`, `clouds.worklet.ts`, `resonator.worklet.ts`, `shimmer.worklet.ts`, `ladder.worklet.ts`, `lofi.worklet.ts`, `paulstretch.worklet.ts`) contain top-file comments citing the original author and license.

- [ ] **Step 1.5: Audit Git Configuration**
  - Action: Verify `.gitignore` excludes `research/vendor/` and any local `.env` files. Ensure no vendor source trees are accidentally pushed.

---

### Phase 2: Live Web Application Legal Infrastructure (High Priority for Deployment)

- [ ] **Step 2.1: Add Legal Modal / Footer Links in Web UI**
  - Location: `synthlab/src/ui/Footer.tsx` (or primary UI layout)
  - Action: Add persistent footer links for **Impressum**, **Datenschutz (Privacy Policy)**, **Terms of Service**, and **Trademark Notice**.

- [ ] **Step 2.2: Implement Impressum Component/Page**
  - Location: `synthlab/src/ui/legal/ImpressumModal.tsx` (or `/impressum` route)
  - Action: Display operator legal name, physical address, email address, and § 18 MStV responsibility.

- [ ] **Step 2.3: Implement Privacy Policy (Datenschutzerklärung)**
  - Location: `synthlab/src/ui/legal/PrivacyModal.tsx` (or `/privacy` route)
  - Action: Document local storage usage (IndexedDB), server logs, absence of tracking cookies, and GDPR rights.

- [ ] **Step 2.4: Implement Terms of Service & Health Warning**
  - Location: `synthlab/src/ui/legal/TermsModal.tsx` (or `/terms` route)
  - Action: State user 100% audio output ownership, warranty disclaimers (AS-IS), and Web Audio hearing protection warning.

---

## Conclusion & Legal Readiness Verification

By executing the actions outlined in this document:
1. The **GitHub repository** will meet all standard open-source legal requirements, preventing copyright infringement claims and ensuring clean provenance for external contributors.
2. The **live web application** will achieve full regulatory compliance under EU / German laws (§ 5 DDG, DSGVO / GDPR, DSA), protecting the application operator from administrative fines, warning letters (*Abmahnungen*), or user liability disputes.

*Report compiled and validated for `ambient2` workspace.*
