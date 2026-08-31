/** Bloque de confianza solo en el checkout (paso datos), encima del CTA principal. */
export default function CheckoutConfianzaWhatsApp() {
  const items = [
    "Confirmas tu pedido por WhatsApp",
    "Revisión antes de pagar",
    "Atención personalizada"
  ];
  return (
    <ul
      style={{
        margin: "0 0 12px",
        padding: "10px 12px 10px 28px",
        listStyle: "none",
        background: "rgba(37, 211, 102, 0.08)",
        border: "1px solid rgba(37, 211, 102, 0.22)",
        borderRadius: 10,
        fontSize: 13,
        lineHeight: 1.5,
        color: "rgba(245, 240, 230, 0.95)"
      }}
    >
      {items.map((t) => (
        <li key={t} style={{ position: "relative", marginBottom: 6 }}>
          <span
            style={{
              position: "absolute",
              left: -18,
              top: 0,
              color: "#25D366",
              fontWeight: 700
            }}
          >
            ✔
          </span>
          {t}
        </li>
      ))}
    </ul>
  );
}
