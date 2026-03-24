import type { ConsentimientoCookies, Pagina } from "../../types";

type Props = {
  visible: boolean;
  pagina: Pagina;
  bgColor: string;
  goldColor: string;
  mostrarConfigCookies: boolean;
  consentimientoCookies: ConsentimientoCookies;
  onAbrirPoliticaCookies: () => void;
  onRechazarOpcionales: () => void;
  onToggleConfig: () => void;
  onAceptarTodas: () => void;
  onCerrarConfig: () => void;
  onGuardarPreferencias: () => void;
  onUpdatePreferencias: (checked: boolean) => void;
  onUpdateAnaliticas: (checked: boolean) => void;
  onUpdateMarketing: (checked: boolean) => void;
};

export default function CookiesBanner({
  visible,
  pagina,
  bgColor,
  goldColor,
  mostrarConfigCookies,
  consentimientoCookies,
  onAbrirPoliticaCookies,
  onRechazarOpcionales,
  onToggleConfig,
  onAceptarTodas,
  onCerrarConfig,
  onGuardarPreferencias,
  onUpdatePreferencias,
  onUpdateAnaliticas,
  onUpdateMarketing
}: Props) {
  if (!visible || (pagina !== "inicio" && pagina !== "tienda" && pagina !== "carrito")) return null;

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
        🍪 Usamos cookies necesarias para el funcionamiento de la tienda y, con tu permiso,
        cookies de preferencias, analítica y marketing.{" "}
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
          onClick={onRechazarOpcionales}
          style={{
            background: "transparent",
            color: goldColor,
            border: `1px solid ${goldColor}`,
            padding: "8px 14px",
            borderRadius: 20,
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Rechazar opcionales
        </button>

        <button
          onClick={onToggleConfig}
          style={{
            background: "transparent",
            color: "white",
            border: "1px solid white",
            padding: "8px 14px",
            borderRadius: 20,
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Configurar cookies
        </button>

        <button
          onClick={onAceptarTodas}
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
          Aceptar todas
        </button>
      </div>

      {mostrarConfigCookies && (
        <div
          style={{
            border: "1px solid rgba(201,162,74,0.5)",
            borderRadius: 12,
            padding: 12,
            background: bgColor,
            color: "white"
          }}
        >
          <p style={{ margin: "0 0 10px", color: goldColor, fontWeight: "bold" }}>
            Preferencias de cookies
          </p>

          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span>Necesarias (siempre activas)</span>
            <input type="checkbox" checked disabled />
          </label>

          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span>Preferencias</span>
            <input
              type="checkbox"
              checked={consentimientoCookies.preferencias}
              onChange={(e) => onUpdatePreferencias(e.target.checked)}
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span>Analítica</span>
            <input
              type="checkbox"
              checked={consentimientoCookies.analiticas}
              onChange={(e) => onUpdateAnaliticas(e.target.checked)}
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span>Marketing</span>
            <input
              type="checkbox"
              checked={consentimientoCookies.marketing}
              onChange={(e) => onUpdateMarketing(e.target.checked)}
            />
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              onClick={onCerrarConfig}
              style={{
                background: "transparent",
                color: goldColor,
                border: `1px solid ${goldColor}`,
                padding: "6px 12px",
                borderRadius: 8,
                cursor: "pointer"
              }}
            >
              Cancelar
            </button>
            <button
              onClick={onGuardarPreferencias}
              style={{
                background: goldColor,
                color: "#1b1745",
                border: "none",
                padding: "6px 12px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Guardar preferencias
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
