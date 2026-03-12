export default function FooterLegal() {
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
      <a href="/aviso-legal.html" target="_blank" rel="noreferrer" style={{ color: "#C9A24A", margin: "0 8px" }}>
        Aviso Legal
      </a>
      ·
      <a href="/politica-cookies.html" target="_blank" rel="noreferrer" style={{ color: "#C9A24A", margin: "0 8px" }}>
        Política de Cookies
      </a>
      ·
      <a href="/politica-privacidad.html" target="_blank" rel="noreferrer" style={{ color: "#C9A24A", margin: "0 8px" }}>
        Política de Privacidad
      </a>
      ·
      <a href="/terminos-condiciones.html" target="_blank" rel="noreferrer" style={{ color: "#C9A24A", margin: "0 8px" }}>
        Términos y Condiciones
      </a>
    </footer>
  );
}

