import type { CSSProperties } from "react";
import { NavLink } from "react-router-dom";
import { THEME } from "../../../config";
import { ADMIN_DISENO_WEB_PREFIX } from "./disenoWebPaths";

const tabBtnStyle = (active: boolean): CSSProperties => ({
  flex: "1 1 auto",
  minWidth: "min(100%, 120px)",
  padding: "8px 12px",
  borderRadius: 10,
  border: active ? `2px solid ${THEME.goldMain}` : "1px solid rgba(201,162,74,0.45)",
  background: active ? "rgba(201,162,74,0.22)" : "rgba(0,0,0,0.38)",
  color: THEME.goldMain,
  fontSize: 12,
  fontWeight: active ? 800 : 600,
  cursor: "pointer",
  textDecoration: "none",
  textAlign: "center",
  boxSizing: "border-box",
  boxShadow: active ? "0 0 0 1px rgba(250,232,170,0.12)" : "none",
  lineHeight: 1.25
});

const LINKS = [
  { to: ADMIN_DISENO_WEB_PREFIX, end: true, label: "Ajustes", title: undefined as string | undefined },
  { to: `${ADMIN_DISENO_WEB_PREFIX}/barra`, end: false, label: "Barra superior", title: "Barra superior (ruta dedicada)" },
  { to: `${ADMIN_DISENO_WEB_PREFIX}/fondo`, end: false, label: "Fondo", title: "Fondo (ruta dedicada)" },
  { to: `${ADMIN_DISENO_WEB_PREFIX}/imagen`, end: false, label: "Imagen hero", title: "Imagen hero (ruta dedicada)" },
  { to: `${ADMIN_DISENO_WEB_PREFIX}/logo`, end: false, label: "Logo", title: "Logo hero (ruta dedicada)" },
  { to: `${ADMIN_DISENO_WEB_PREFIX}/boton`, end: false, label: "Botón", title: "Botón «Explorar tienda» (ruta dedicada)" },
  { to: `${ADMIN_DISENO_WEB_PREFIX}/espaciado`, end: false, label: "Espaciado", title: "Espaciado (ruta dedicada)" }
] as const;

/**
 * Pestañas con rutas reales bajo el mismo prefijo (sin `navigate` absolutos por segmento).
 * Las URLs son estables; el estado vive en el padre que no se desmonta al cambiar de pestaña.
 */
export default function DisenoWebTabNav() {
  return (
    <div
      role="tablist"
      aria-label="Apartados hero diseño web"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "stretch",
        justifyContent: "flex-start"
      }}
    >
      {LINKS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          title={tab.title}
          role="tab"
          className="btn-admin-limpio admin-btn admin-btn--inline"
          style={({ isActive }) => tabBtnStyle(isActive)}
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
