import React from "react";

export type LegalModalType = "none" | "impressum" | "privacy" | "terms" | "trademarks";

interface LegalModalsProps {
  activeModal: LegalModalType;
  onClose: () => void;
}

export const LegalModals: React.FC<LegalModalsProps> = ({ activeModal, onClose }) => {
  if (activeModal === "none") return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        color: "#e0e0e0",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#16161e",
          border: "1px solid #2e2e3e",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "750px",
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "28px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.7)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #2e2e3e", paddingBottom: "14px", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#61dafb", fontWeight: 600 }}>
            {activeModal === "impressum" && "Impressum / Legal Notice"}
            {activeModal === "privacy" && "Datenschutzerklärung / Privacy Policy"}
            {activeModal === "terms" && "Nutzungsbedingungen / Terms of Service"}
            {activeModal === "trademarks" && "Marken & Copyright Disclaimers"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Schließen"
            style={{
              background: "transparent",
              border: "none",
              color: "#aaa",
              fontSize: "1.6rem",
              cursor: "pointer",
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        <div style={{ fontSize: "0.92rem", lineHeight: "1.65", color: "#cccccc" }}>
          {activeModal === "impressum" && <ImpressumContent />}
          {activeModal === "privacy" && <PrivacyContent />}
          {activeModal === "terms" && <TermsContent />}
          {activeModal === "trademarks" && <TrademarksContent />}
        </div>

        <div style={{ marginTop: "24px", paddingTop: "14px", borderTop: "1px solid #2e2e3e", textAlign: "right" }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: "#2e2e3e",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "8px 18px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 500
            }}
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

const ImpressumContent: React.FC = () => (
  <div>
    <h3 style={{ color: "#fff", marginTop: 0 }}>Anbieterkennzeichnung gem. § 5 DDG / § 18 MStV</h3>
    <p><strong>Betreiber der Website:</strong> [Ihr Vollständiger Name / Your Full Legal Name]</p>
    <p><strong>Anschrift:</strong><br />[Musterstraße 123]<br />[12345 Musterstadt]<br />[Deutschland / Germany]</p>
    <p><strong>Kontakt:</strong><br />E-Mail: [ihre.email@example.com]<br />Telefon: [Optional / +49 123 456789]</p>
    <p><strong>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:</strong><br />[Ihr Name, Anschrift wie oben]</p>
    <p style={{ fontSize: "0.85rem", color: "#888", marginTop: "16px" }}>
      <em>Hinweis: Für den öffentlichen Live-Betrieb ersetzen Sie die Platzhalter in Klammern bitte durch Ihre korrekten Kontaktdaten gemäß § 5 DDG (Digitale-Dienste-Gesetz).</em>
    </p>
  </div>
);

const PrivacyContent: React.FC = () => (
  <div>
    <h3 style={{ color: "#fff", marginTop: 0 }}>Datenschutzerklärung (DSGVO / GDPR)</h3>

    <h4 style={{ color: "#61dafb", marginBottom: "4px" }}>1. Datenschutz auf einen Blick</h4>
    <p>Diese Web-App verarbeitet Audiodaten und Synthesizer-Einstellungen zu 100% lokal im Browser des Nutzers. Es werden keine Audiosignale oder Eingabedaten an externe Server übermittelt.</p>

    <h4 style={{ color: "#61dafb", marginBottom: "4px" }}>2. Lokale Speicherung (IndexedDB & LocalStorage)</h4>
    <p>Zur Speicherung eigener Presets, Favoriten, Bewertungen und UI-Einstellungen nutzt die App IndexedDB (`dexie`) und LocalStorage im Browser des Nutzers. Die Speicherung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO zur Bereitstellung der technischen App-Funktionalität.</p>

    <h4 style={{ color: "#61dafb", marginBottom: "4px" }}>3. Server-Log-Dateien</h4>
    <p>Beim Aufruf der Web-App erhebt der Webhosting-Anbieter (z. B. Cloudflare Pages / Vercel / GitHub Pages) automatisch Informationen in Server-Log-Dateien (IP-Adresse, Browser-Typ, Uhrzeit des Zugriffs). Dies erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO zur IT-Sicherheit und DDoS-Abwehr.</p>

    <h4 style={{ color: "#61dafb", marginBottom: "4px" }}>4. Keine Analyse-Tools oder Tracking-Cookies</h4>
    <p>SynthLab verwendet keine Drittanbieter-Analyse-Tools (wie Google Analytics), keine Marketing-Pixel und keine Tracking-Cookies.</p>

    <h4 style={{ color: "#61dafb", marginBottom: "4px" }}>5. Rechte der betroffenen Person</h4>
    <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer personenbezogenen Daten sowie das Recht auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde.</p>
  </div>
);

const TermsContent: React.FC = () => (
  <div>
    <h3 style={{ color: "#fff", marginTop: 0 }}>Nutzungsbedingungen & Rechte an Audiosignalen</h3>

    <h4 style={{ color: "#61dafb", marginBottom: "4px" }}>1. Rechte an generierten Audiodaten</h4>
    <p>Nutzer erhalten das <strong>100% uneingeschränkte Eigentum und Urheberrecht</strong> an allen Audiodaten, Musikstücken, Samples und Presets, die mit SynthLab erzeugt oder exportiert werden. Dies umfasst sowohl die kommerzielle als auch die nicht-kommerzielle Nutzung ohne Lizenzgebühren oder Tantiemen.</p>

    <h4 style={{ color: "#ff6b6b", marginBottom: "4px" }}>2. Haftungsausschluss & Gehörschutz-Warnung (Audio Safety Warning)</h4>
    <p style={{ backgroundColor: "#2d1b1b", borderLeft: "4px solid #ff6b6b", padding: "10px", borderRadius: "4px" }}>
      ⚠️ <strong>WICHTIGER GEHÖRSCHUTZ-HINWEIS:</strong> Synthesizer und Audionetzwerke mit Feedbackschleifen, Resonanzfiltern und dynamischen Frequenzmodulationen können im Einzelfall plötzliche Lautstärkespitzen oder hochfrequente Oszillationen erzeugen. Nutzen Sie Kopfhörer und Lautsprecher stets mit angemessener Lautstärke.
    </p>
    <p>Die Software wird "AS IS" (wie besehen) bereitgestellt. Der Betreiber übernimmt keine Haftung für Hörschäden, Lautsprecherschäden oder Datenverluste, die aus der Nutzung der Software resultieren.</p>
  </div>
);

const TrademarksContent: React.FC = () => (
  <div>
    <h3 style={{ color: "#fff", marginTop: 0 }}>Markenhinweise & Copyright Disclaimers</h3>
    <p>Alle in dieser Software erwähnten Marken, Produktnamen und Firmennamen (darunter <em>Yamaha, DX7, Roland, Juno-106, Commodore, C64, MOS 6581/8580, Sega Genesis, YM2612, Moog, Ableton, Casio</em>) sind eingetragene Warenzeichen ihrer jeweiligen Eigentümer.</p>
    <p>Ihre Nennung dient ausschließlich der historischen, technischen Beschreibung und Modellierung von Syntheseverfahren (Nominative Fair Use). SynthLab / Ambient Musikmaschine ist ein unabhängiges Open-Source-Projekt und steht in keiner geschäftlichen Verbindung zu diesen Markeninhabern, wird von diesen nicht unterstützt, gesponsert oder autorisiert.</p>
  </div>
);
