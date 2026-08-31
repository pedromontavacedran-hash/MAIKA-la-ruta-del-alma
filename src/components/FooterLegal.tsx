import { Link } from "react-router-dom";
import { PATH_BY_PAGINA } from "@/app/routing/routeMaps";

export default function FooterLegal() {
  const linkStyle = { color: "var(--gold-main)", margin: "0 8px", background: "none", border: "none", cursor: "pointer", fontSize: "inherit", padding: 0, textDecoration: "underline" };
  return (
    <footer
      data-maika="footer-main"
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
      <Link to={PATH_BY_PAGINA.legalAviso} style={linkStyle}>
        Aviso Legal
      </Link>
      ·
      <Link to={PATH_BY_PAGINA.legalCookies} style={linkStyle}>
        Política de Cookies
      </Link>
      ·
      <Link to={PATH_BY_PAGINA.legalPrivacidad} style={linkStyle}>
        Política de Privacidad
      </Link>
      ·
      <Link to={PATH_BY_PAGINA.legalTerminos} style={linkStyle}>
        Términos y Condiciones
      </Link>
    </footer>
  );
}
