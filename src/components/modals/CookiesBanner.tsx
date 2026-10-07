import type { Pagina } from "../../types";

type Props = {
  visible: boolean;
  pagina: Pagina;
  bgColor: string;
  goldColor: string;
  onAbrirPoliticaCookies: () => void;
  onAceptar: () => void;
};

export default function CookiesBanner({
  visible,
  pagina,
  bgColor,
  goldColor,
  onAbrirPoliticaCookies,
  onAceptar
}: Props) {
  if (
    !visible ||
    (pagina !== "inicio" &&
      pagina !== "tienda" &&
      pagina !== "servicios" &&
      pagina !== "horoscopos" &&
      pagina !== "ritualDelMes" &&
      pagina !== "testimonios" &&
      pagina !== "envios" &&
      pagina !== "contacto" &&
      pagina !== "sobreMaika" &&
      pagina !== "legal" &&
      pagina !== "legalTerminos" &&
      pagina !== "legalPrivacidad" &&
      pagina !== "legalCookies" &&
      pagina !== "legalAviso" &&
      pagina !== "carrito")
  ) {
    return null;
  }

  return (
    <div
      className="cookie-banner"
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        right: 20,
        border: `2px solid ${goldColor}`,
        borderRadius: 15,
        padding: "15px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 12,
        background: bgColor
      }}
    >
      <div style={{ color: "white", fontSize: 14, lineHeight: 1.45 }}>
        🍪 Esta web utiliza únicamente cookies técnicas necesarias para su funcionamiento
        (sesión y seguridad). No usamos cookies de analítica, publicidad ni seguimiento.{" "}
        <button
          type="button"
          onClick={onAbrirPoliticaCookies}
          style={{
            color: goldColor,
            textDecoration: "underline",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            fontSize: "inherit"
          }}
        >
          Política de Cookies
        </button>
        {" "}Si has borrado los datos del sitio, es normal que vuelva a aparecer este aviso.
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button
          onClick={onAceptar}
          style={{
            background: goldColor,
            color: "#1b1745",
            border: "none",
            padding: "8px 16px",
            borderRadius: 20,
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
