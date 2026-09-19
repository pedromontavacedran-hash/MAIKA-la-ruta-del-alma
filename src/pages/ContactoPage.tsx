import { useEffect } from "react";
import { CHECKOUT_CONFIG } from "@/config/checkoutConfig";
import { THEME } from "../config";
import "./contacto.css";

const URL_WHATSAPP_CONTACTO = `https://wa.me/${CHECKOUT_CONFIG.whatsappNumber}?text=Hola%20Maika%2C%20quiero%20más%20información`;

export default function ContactoPage() {
  /* Marca la ruta en <html> para que contacto.css quite el scroll fantasma solo aquí. */
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("contacto-page");
    return () => {
      html.classList.remove("contacto-page");
    };
  }, []);

  return (
    <div className="inicio-page" style={{ textAlign: "center", color: "inherit" }}>
      <div className="inicio-bloques-texto" style={{ maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
        <h2
          id="pagina-contacto-titulo"
          className="inicio-seccion-titulo"
          style={{ fontSize: "clamp(22px, 3.5vw, 28px)", marginBottom: 16, color: THEME.goldMain, fontWeight: "bold", scrollMarginTop: 140 }}
        >
          Contacto
        </h2>
        <p className="card inicio-card-texto" style={{ marginBottom: 20 }}>
          Escríbenos por WhatsApp para consultas, pedidos o cualquier duda. Te responderemos lo antes posible.
        </p>
        <a
          href={URL_WHATSAPP_CONTACTO}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "14px 28px",
            background: THEME.goldGradient,
            color: THEME.bg,
            fontSize: 17,
            fontWeight: "bold",
            textAlign: "center",
            borderRadius: 20,
            textDecoration: "none",
            border: `1px solid ${THEME.goldMain}`,
            cursor: "pointer"
          }}
        >
          Abrir WhatsApp
        </a>
      </div>
    </div>
  );
}
