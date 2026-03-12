export default function FooterLegal() {
  return (
    <footer
      style={{
        position: "fixed",
        bottom: 10,
        left: "50%",
        transform: "translateX(-50%)",
        textAlign: "center",
        color: "white",
        opacity: 0.95,
        fontSize: 13,
        zIndex: 9000,
        width: "max-content",
        maxWidth: "95%"
      }}
    >
      <a href="/politica-cookies.html" target="_blank" rel="noreferrer" style={{ color: "gold", margin: "0 8px" }}>
        Política de Cookies
      </a>
      ·
      <a href="/politica-privacidad.html" target="_blank" rel="noreferrer" style={{ color: "gold", margin: "0 8px" }}>
        Política de Privacidad
      </a>
      ·
      <a href="/terminos-condiciones.html" target="_blank" rel="noreferrer" style={{ color: "gold", margin: "0 8px" }}>
        Términos y Condiciones
      </a>
    </footer>
  );
}

