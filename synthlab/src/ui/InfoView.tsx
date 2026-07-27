import { useEffect, useState } from "react";
import { useUiStore } from "../store/uiStore";
import type { LegalModalType } from "./legal/LegalModals";

interface InfoViewProps {
  onOpenLegalModal?: (type: LegalModalType) => void;
}

export function InfoView({ onOpenLegalModal }: InfoViewProps) {
  const statusMessage = useUiStore((state) => state.statusMessage);
  const selection = useUiStore((state) => state.selection);
  const [contextHelp, setContextHelp] = useState("");

  useEffect(() => {
    const describe = (target: EventTarget | null) => {
      const element = (target as HTMLElement | null)?.closest<HTMLElement>("[data-info],button,input,select");
      if (!element) return;
      setContextHelp(
        element.dataset.info
        ?? element.getAttribute("aria-label")
        ?? element.getAttribute("title")
        ?? element.textContent?.trim()
        ?? ""
      );
    };
    const showPointerHelp = (event: PointerEvent) => describe(event.target);
    const showFocusHelp = (event: FocusEvent) => describe(event.target);
    const clear = () => setContextHelp("");
    window.addEventListener("pointerover", showPointerHelp);
    window.addEventListener("focusin", showFocusHelp);
    window.addEventListener("pointerout", clear);
    return () => {
      window.removeEventListener("pointerover", showPointerHelp);
      window.removeEventListener("focusin", showFocusHelp);
      window.removeEventListener("pointerout", clear);
    };
  }, []);

  const selectionLabel = selection.kind === "none" ? "Keine Auswahl" : `${selection.kind} ausgewählt`;
  return (
    <footer className="info-view" aria-live="polite">
      <span className="info-view__context">{contextHelp || "Bedienelement fokussieren, um Hilfe anzuzeigen"}</span>
      <span className="info-view__selection">{selectionLabel}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", overflow: "hidden" }}>
        <span className="info-view__status">{statusMessage}</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <nav aria-label="Rechtliche Hinweise" style={{ display: "flex", gap: "6px", fontSize: "10px", flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => onOpenLegalModal?.("impressum")}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: "inherit" }}
          >
            Impressum
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => onOpenLegalModal?.("privacy")}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: "inherit" }}
          >
            Datenschutz
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => onOpenLegalModal?.("terms")}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: "inherit" }}
          >
            AGB
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => onOpenLegalModal?.("trademarks")}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: "inherit" }}
          >
            Marken
          </button>
        </nav>
      </div>
    </footer>
  );
}
