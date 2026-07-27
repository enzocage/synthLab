import { useEffect, useState } from "react";
import { useUiStore } from "../store/uiStore";

export function InfoView() {
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
      <span className="info-view__status">{statusMessage}</span>
    </footer>
  );
}
