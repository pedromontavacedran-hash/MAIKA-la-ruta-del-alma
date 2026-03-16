import { useApp } from "../context/AppContext";

export default function FooterLegal() {
  const { openLegal } = useApp();
  const linkStyle = { color: "#C9A24A", margin: "0 8px", background: "none", border: "none", cursor: "pointer", fontSize: "inherit", padding: 0, textDecoration: "underline" };
  return (
    <footer
      style={{
        display: "block",
        marginTop: 48,
        marginBottom: 24,
        paddingBottom: 16,
        textAlign: "center",
        color: "white",
        opacity: 0.95,
        fontSize: 13,
        width: "100%",
        maxWidth: "95%"
      }}
    >
      <button type="button" style={linkStyle} onClick={() => openLegal("aviso-legal")}>
        Aviso Legal
      </button>
      ·
      <button type="button" style={linkStyle} onClick={() => openLegal("politica-cookies")}>
        Política de Cookies
      </button>
      ·
      <button type="button" style={linkStyle} onClick={() => openLegal("politica-privacidad")}>
        Política de Privacidad
      </button>
      ·
      <button type="button" style={linkStyle} onClick={() => openLegal("terminos-condiciones")}>
        Términos y Condiciones
      </button>
    </footer>
  );
}

