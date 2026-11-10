import { Link } from "react-router-dom";
import { CHECKOUT_CONFIG } from "@/config/checkoutConfig";
import { PATH_BY_PAGINA } from "@/app/routing/routeMaps";
import { MOSTRAR_CATALOGO_PROXIMAMENTE } from "@/config/lanzamiento";
import { THEME } from "../config";

const URL_WHATSAPP = `https://wa.me/${CHECKOUT_CONFIG.whatsappNumber}?text=${encodeURIComponent(
  "Hola Maika, ¿cuándo abre la tienda?"
)}`;

/**
 * Respuesta pública de `/tienda`, `/carrito` y `/seguimiento` mientras
 * `TIENDA_PUBLICA` es `false`. La tienda sigue existiendo íntegra en el código.
 * `conCatalogo` (solo `/tienda`): muestra además los productos reales en modo
 * informativo «Próximamente», sin precio ni acciones de compra.
 */
export default function TiendaProximamentePage({ conCatalogo = false }: { conCatalogo?: boolean }) {
  return (
    <div className="inicio-page" style={{ textAlign: "center", color: "inherit" }}>
      <div
        className="inicio-bloques-texto"
        style={{ maxWidth: conCatalogo ? 980 : 560, marginLeft: "auto", marginRight: "auto", paddingTop: 24 }}
      >
        <h2
          className="inicio-seccion-titulo"
          style={{
            fontSize: "clamp(22px, 3.5vw, 28px)",
            marginBottom: 28,
            color: THEME.goldMain,
            fontWeight: "bold",
            scrollMarginTop: 140
          }}
        >
          La tienda abrirá próximamente
        </h2>
        <p className="card inicio-card-texto" style={{ marginBottom: 34 }}>
          Estamos preparando con mimo el espacio de productos MAIKA. Mientras tanto puedes
          descubrir nuestros servicios y contenidos, o escribirnos si buscas algo concreto.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
          <a
            href={URL_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "14px 28px",
              background: THEME.goldGradient,
              color: THEME.bg,
              fontSize: 16,
              fontWeight: "bold",
              textAlign: "center",
              borderRadius: 20,
              textDecoration: "none",
              border: `1px solid ${THEME.goldMain}`,
              cursor: "pointer"
            }}
          >
            Escríbenos por WhatsApp
          </a>
          <Link
            to={PATH_BY_PAGINA.servicios}
            style={{ color: THEME.goldMain, fontSize: 14, textDecoration: "underline" }}
          >
            Descubrir servicios MAIKA
          </Link>
        </div>
        {conCatalogo && MOSTRAR_CATALOGO_PROXIMAMENTE ? (
          <div style={{ padding: 24, color: THEME.goldMain }}>
            Catálogo temporalmente deshabilitado para diagnóstico
          </div>
        ) : null}
      </div>
    </div>
  );
}
