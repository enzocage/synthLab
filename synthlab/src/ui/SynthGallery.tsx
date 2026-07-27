import { useEffect, useState } from "react";
import { ENGINES } from "../audio/engines/registry";
import { useUiStore } from "../store/uiStore";

interface ImageReference {
  image: string;
  subject: string;
  relation: "Originalgerät" | "Nahes Referenzgerät";
  sourceUrl: string;
  credit: string;
  license: string;
  position?: string;
}

const JUNO: ImageReference = {
  image: "/synth-images/juno106.jpg",
  subject: "Roland Juno-106",
  relation: "Nahes Referenzgerät",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Roland-Juno-106.jpg",
  credit: "Iainf / Wikimedia Commons",
  license: "Public Domain",
};

const DX7: ImageReference = {
  image: "/synth-images/dx7.jpg",
  subject: "Yamaha DX7",
  relation: "Nahes Referenzgerät",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Yamaha_DX7.jpg",
  credit: "Leo-setä / Wikimedia Commons",
  license: "CC BY 2.0",
};

const REFERENCES: Record<string, ImageReference> = {
  "va-poly": { ...JUNO, subject: "Roland Juno-106 als subtraktive Hardware-Referenz" },
  wavetable: { ...DX7, subject: "Digitaler Yamaha-Synth als nahe Digital-Synth-Referenz" },
  fm6: { ...DX7, subject: "Yamaha DX7 als 6-Operator-FM-Referenz" },
  additive: { ...DX7, subject: "Digitaler Yamaha-Synth als Referenz für additive Digital-Synthese" },
  granular: { ...DX7, subject: "Digitaler Hardware-Synth als nahe Referenz für Granular-Synthese" },
  modal: { ...JUNO, subject: "Keyboard-Synth als Referenz für spielbare Resonator-Synthese" },
  string: { ...JUNO, subject: "Polyphoner Keyboard-Synth als Referenz für Physical Modeling" },
  noisefield: { ...JUNO, subject: "Analoger Poly-Synth als Referenz für gefilterte Noise-Flächen" },
  drone: { ...JUNO, subject: "Analoger Poly-Synth als Referenz für Detune-Stacks und Drones" },
  wavefold: { ...JUNO, subject: "Analoger Synth als nahe Referenz für Wavefolding-Klänge" },
  phasedist: { ...DX7, subject: "Digitaler 1980er-Synth als nahe Referenz für Phase Distortion" },
  perc: { ...JUNO, subject: "Analoger Synth als Referenz für synthetische Percussion" },
  subbass: { ...JUNO, subject: "Analoger Synth als Referenz für Sub-Bass-Synthese" },
  "sid-chip": { ...DX7, subject: "Digitales 1980er-Instrument als nahe Referenz für C64-SID-Synthese" },
  "fm-dx7": { ...DX7, relation: "Originalgerät", subject: "Yamaha DX7" },
  "fm-4op": { ...DX7, subject: "Yamaha-FM-Synth als nahe 4-Operator-Referenz" },
  "fm-morph": { ...DX7, subject: "Yamaha DX7 als Hardware-Referenz für morphende FM" },
  "fm-feedback": { ...DX7, subject: "Yamaha DX7 als Hardware-Referenz für Feedback-FM" },
  "fm-linear": { ...DX7, subject: "Yamaha DX7 als Hardware-Referenz für lineare FM" },
  juno106: { ...JUNO, relation: "Originalgerät", subject: "Roland Juno-106" },
  "wt-akwf": { ...DX7, subject: "Digitaler Hardware-Synth als nahe Wavetable-Referenz" },
  opl3: { ...DX7, subject: "Yamaha DX7 als nahe Yamaha-FM-Hardware-Referenz" },
  dx7: { ...DX7, relation: "Originalgerät", subject: "Yamaha DX7" },
};

export function SynthGallery() {
  const open = useUiStore((state) => state.synthGalleryOpen);
  const setOpen = useUiStore((state) => state.setSynthGalleryOpen);
  const [fullscreenImage, setFullscreenImage] = useState<ImageReference | null>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (fullscreenImage) setFullscreenImage(null);
      else setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [fullscreenImage, open, setOpen]);

  useEffect(() => {
    if (!open) setFullscreenImage(null);
  }, [open]);

  if (!open) return null;

  return (
    <div className="synth-gallery-backdrop" onClick={() => setOpen(false)}>
      <section
        className="synth-gallery"
        role="dialog"
        aria-modal="true"
        aria-labelledby="synth-gallery-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="synth-gallery__header">
          <div>
            <h2 id="synth-gallery-title">Synth Pictures</h2>
            <p>
              Alle {ENGINES.length} Engines mit dem Originalgerät oder einem möglichst nahen Hardware-Vorbild.
            </p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Synth-Bilder schließen">×</button>
        </header>
        <div className="synth-gallery__notice">
          Abstrakte Software-Engines besitzen kein identisches Hardwaregerät. Solche Karten sind ausdrücklich als
          „Nahes Referenzgerät“ gekennzeichnet.
        </div>
        <div className="synth-gallery__grid">
          {ENGINES.map((engine) => {
            const reference = REFERENCES[engine.id] ?? JUNO;
            return (
              <article className="synth-picture-card" key={engine.id}>
                <button
                  type="button"
                  className="synth-picture-card__image-button"
                  onClick={() => setFullscreenImage(reference)}
                  aria-label={`${engine.name}: Synth-Bild im Vollbild öffnen`}
                >
                  <img src={reference.image} alt={`${reference.subject} – Referenzbild für ${engine.name}`} loading="lazy" />
                </button>
                <div className="synth-picture-card__body">
                  <span className={`synth-picture-card__relation${reference.relation === "Originalgerät" ? " synth-picture-card__relation--exact" : ""}`}>
                    {reference.relation}
                  </span>
                  <h3>{engine.name}</h3>
                  <p>{reference.subject}</p>
                  <a href={reference.sourceUrl} target="_blank" rel="noreferrer">
                    {reference.credit} · {reference.license}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
        {fullscreenImage && (
          <div
            className="synth-picture-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`${fullscreenImage.subject} Vollbild`}
            onClick={() => setFullscreenImage(null)}
          >
            <button
              type="button"
              className="synth-picture-lightbox__close"
              onClick={() => setFullscreenImage(null)}
              aria-label="Vollbild schließen"
            >
              ×
            </button>
            <img
              src={fullscreenImage.image}
              alt={fullscreenImage.subject}
              onClick={(event) => event.stopPropagation()}
            />
            <div className="synth-picture-lightbox__caption">{fullscreenImage.subject}</div>
          </div>
        )}
      </section>
    </div>
  );
}
