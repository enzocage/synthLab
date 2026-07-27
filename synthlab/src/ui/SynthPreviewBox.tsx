import React, { useState } from "react";
import { getSynthPicture } from "./SynthGallery";
import { getEngine } from "../audio/engines/registry";

interface Props {
  engineId: string;
  className?: string;
}

export const SynthPreviewBox: React.FC<Props> = ({ engineId, className }) => {
  const [isMaximized, setIsMaximized] = useState(false);

  const picture = getSynthPicture(engineId);
  let engineName = engineId.toUpperCase();
  let paramCount = 0;

  try {
    const engine = getEngine(engineId);
    engineName = engine.name;
    paramCount = engine.params.length;
  } catch {
    /* fallback */
  }

  return (
    <>
      {/* Corner Preview Box */}
      <div
        className={className}
        style={{
          position: "relative",
          width: 140,
          height: 80,
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid var(--color-border, #383633)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          cursor: "pointer",
          background: "#11100e",
          flexShrink: 0,
          transition: "transform 0.15s ease, border-color 0.15s ease",
        }}
        onClick={() => setIsMaximized(true)}
        title="Klick zum Vergrößern (Vollbild-Lightbox)"
      >
        <img
          src={picture}
          alt={engineName}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "4px 6px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#000",
                background: "var(--color-accent, #fbad60)",
                padding: "1px 5px",
                borderRadius: 3,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {engineId}
            </span>
            <span
              style={{
                fontSize: 10,
                color: "#fff",
                background: "rgba(0,0,0,0.6)",
                borderRadius: "50%",
                width: 16,
                height: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              ⤢
            </span>
          </div>
          <div style={{ fontSize: 10, color: "#fff", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {engineName}
          </div>
        </div>
      </div>

      {/* Maximized Lightbox Modal */}
      {isMaximized && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            backdropFilter: "blur(10px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
          onClick={() => setIsMaximized(false)}
        >
          <div
            style={{
              position: "relative",
              maxWidth: 1000,
              width: "100%",
              backgroundColor: "#181715",
              border: "1px solid var(--color-border, #383633)",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 20px",
                borderBottom: "1px solid #2e2c29",
                background: "#1f1d1b",
              }}
            >
              <div>
                <h3 style={{ margin: 0, color: "var(--color-accent, #fbad60)", fontSize: 18, fontWeight: 700 }}>
                  {engineName} ({engineId})
                </h3>
                <span style={{ fontSize: 12, color: "#888" }}>
                  Hardware & Synth Design Render · {paramCount} Synthesizer-Parameter
                </span>
              </div>
              <button
                onClick={() => setIsMaximized(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#aaa",
                  fontSize: 24,
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* High-Res Image Display */}
            <div style={{ position: "relative", width: "100%", maxHeight: "65vh", backgroundColor: "#080808", textAlign: "center" }}>
              <img
                src={picture}
                alt={engineName}
                style={{
                  maxWidth: "100%",
                  maxHeight: "65vh",
                  objectFit: "contain",
                  display: "inline-block",
                }}
              />
            </div>

            {/* Footer / Specs Bar */}
            <div style={{ padding: "16px 20px", background: "#181715", borderTop: "1px solid #2e2c29", fontSize: 13, color: "#bbb" }}>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                <div>
                  <strong style={{ color: "#fff" }}>Engine-ID:</strong> <code>{engineId}</code>
                </div>
                <div>
                  <strong style={{ color: "#fff" }}>Parameter-Anzahl:</strong> {paramCount} Controls
                </div>
                <div>
                  <strong style={{ color: "#fff" }}>Urheber & Credit:</strong> SynthLab / enzo cage
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
