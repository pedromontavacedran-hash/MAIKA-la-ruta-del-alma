import type { ReactNode } from "react";

type Props = {
  bgColor: string;
  goldColor: string;
  onCerrar: () => void;
  /** Línea “Última sesión | Ahora” en la misma fila que el botón (inicio a la izquierda). */
  sessionMeta?: ReactNode;
  /** Modo plano: evita doble tarjeta (marco exterior + bloque interior). */
  flatInnerFrame?: boolean;
  children: ReactNode;
};

/** Contenido del dashboard admin: página real, sin cruz tipo modal. */
export default function AdminPanelShell({ bgColor, goldColor, onCerrar, sessionMeta, flatInnerFrame = false, children }: Props) {
  return (
    <div className="admin-dashboard-bloque" style={{ color: "rgba(255,255,255,0.92)" }}>
      <div className={`admin-page-nav${sessionMeta != null ? " admin-page-nav--session-row" : ""}`}>
        <button type="button" className="admin-boton-volver admin-btn admin-btn--gold admin-btn--inline" onClick={onCerrar}>
          ← Salir al inicio
        </button>
        {sessionMeta != null ? <div className="admin-session-meta">{sessionMeta}</div> : null}
      </div>
      <div
        className={`admin-dashboard-inner${flatInnerFrame ? " admin-dashboard-inner--flat" : ""}`}
        style={{
          background: bgColor,
          border: `1px solid color-mix(in srgb, ${goldColor} 35%, transparent)`,
          borderRadius: 16,
          padding: "20px 22px",
          boxShadow: "0 2px 20px rgba(0,0,0,0.2)"
        }}
      >
        {children}
      </div>
    </div>
  );
}
