import { CHECKOUT_CONFIG } from "../config/checkoutConfig";
import { THEME } from "../config";
import { MaikaAvatar } from "./MaikaAvatar";

const MENSAJE_DEFAULT =
  "Ahora mismo la tienda está cerrada. Volvemos muy pronto — si necesitas algo, escríbenos por WhatsApp.";

/**
 * Pantalla que ven los visitantes cuando la web está cerrada (interruptor del panel admin).
 * El admin sigue entrando por /admin con su clave para reabrir.
 */
export default function WebCerradaPage({ mensaje }: { mensaje?: string }) {
  const texto = (mensaje || "").trim() || MENSAJE_DEFAULT;
  const urlWhatsApp = `https://wa.me/${CHECKOUT_CONFIG.whatsappNumber}?text=${encodeURIComponent(
    "Hola Maika, he visto que la web está cerrada. ¿Cuándo volvéis?"
  )}`;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: THEME.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: 24,
        paddingTop: "10vh",
        boxSizing: "border-box",
        textAlign: "center"
      }}
    >
      <div style={{ alignSelf: "flex-start", marginLeft: "41%" }}>
        <MaikaAvatar size="lg" />
      </div>
      <h1
        style={{
          color: THEME.goldMain,
          fontSize: "1.9rem",
          margin: "52px 0 8px",
          letterSpacing: 0.5
        }}
      >
        MAIKA · Rutas del Alma
      </h1>
      <p
        style={{
          color: "rgba(255,255,255,0.85)",
          fontSize: 15,
          lineHeight: 1.6,
          maxWidth: 420,
          margin: "0 0 20px"
        }}
      >
        {texto}
      </p>
      <a
        href={urlWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          padding: "12px 26px",
          borderRadius: 12,
          border: `2px solid ${THEME.goldMain}`,
          color: THEME.goldMain,
          fontWeight: 700,
          fontSize: 14,
          textDecoration: "none"
        }}
      >
        💬 Escríbenos por WhatsApp
      </a>
      <a
        href="/admin"
        style={{
          position: "fixed",
          bottom: 14,
          right: 18,
          fontSize: 11,
          color: "rgba(255,255,255,0.28)",
          textDecoration: "none"
        }}
      >
        Acceso
      </a>
    </div>
  );
}
