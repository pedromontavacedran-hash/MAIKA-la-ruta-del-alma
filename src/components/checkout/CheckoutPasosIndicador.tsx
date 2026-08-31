type Props = {
  /** 1 = datos / revisión; 2 = Bizum + envío WhatsApp */
  pasoActivo: 1 | 2;
  goldColor: string;
};

export default function CheckoutPasosIndicador({ pasoActivo, goldColor }: Props) {
  const base = (n: 1 | 2) => ({
    flex: 1,
    textAlign: "center" as const,
    padding: "6px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.02em",
    lineHeight: 1.25,
    transition: "background 0.2s, color 0.2s, border-color 0.2s, opacity 0.2s",
    border: "1px solid",
    borderColor: pasoActivo === n ? goldColor : "rgba(212, 175, 55, 0.16)",
    background: pasoActivo === n ? "rgba(212, 175, 55, 0.1)" : "rgba(255,255,255,0.02)",
    color:
      pasoActivo === n ? "rgba(245, 230, 200, 0.95)" : "rgba(255,255,255,0.38)"
  });

  return (
    <div
      role="navigation"
      aria-label="Pasos del pedido"
      style={{
        marginBottom: 10,
        paddingBottom: 8,
        borderBottom: "1px solid rgba(212, 175, 55, 0.12)"
      }}
    >
      <div
        style={{
          textAlign: "center",
          fontSize: 11,
          opacity: 0.6,
          marginBottom: 6,
          color: "rgba(245, 230, 200, 0.85)",
          letterSpacing: "0.03em"
        }}
      >
        Paso {pasoActivo} de 2
      </div>
      <div style={{ display: "flex", alignItems: "stretch", gap: 6 }}>
        <div style={base(1)}>Tus datos</div>
        <div style={base(2)}>WhatsApp</div>
      </div>
    </div>
  );
}
