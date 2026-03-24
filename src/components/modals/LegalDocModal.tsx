type LegalDocId = "aviso-legal" | "politica-cookies" | "politica-privacidad" | "terminos-condiciones";

type Props = {
  legalDoc: LegalDocId | null;
};

export default function LegalDocModal({ legalDoc }: Props) {
  if (!legalDoc) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "#1b1745",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      <iframe
        title={legalDoc}
        src={`/${legalDoc}.html`}
        style={{
          flex: 1,
          width: "100%",
          height: "100%",
          border: "none"
        }}
      />
    </div>
  );
}
