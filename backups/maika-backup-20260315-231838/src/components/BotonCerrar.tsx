/**
 * Botón de cierre (cruz) unificado: mismo icono, borde y estilo en toda la app.
 * Usado en Carrito, Tienda, Favoritos, Cuenta, Editar Productos, etc.
 */
import type { CSSProperties, MouseEvent } from "react";

const ICONO_CRUZ = (
  <svg width="2em" height="2em" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const estiloBotonCerrar: CSSProperties = {
  position: "absolute",
  right: 0,
  top: 0,
  width: 40,
  height: 40,
  minWidth: 40,
  minHeight: 40,
  background: "#0B0B0D",
  border: "2px solid #C9A24A",
  borderRadius: 8,
  cursor: "pointer",
  padding: 6,
  boxSizing: "border-box",
  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

interface BotonCerrarProps {
  onClick: (e?: MouseEvent<HTMLButtonElement>) => void;
  ariaLabel?: string;
  title?: string;
  /** Para overlays (ej. lightbox) se puede pasar top/right distintos */
  style?: CSSProperties;
}

export default function BotonCerrar({ onClick, ariaLabel = "Cerrar", title = "Cerrar", style }: BotonCerrarProps) {
  return (
    <button
      type="button"
      className="boton-cerrar-maika"
      onClick={(e) => onClick(e)}
      style={{ ...estiloBotonCerrar, ...style }}
      aria-label={ariaLabel}
      title={title}
    >
      {ICONO_CRUZ}
    </button>
  );
}
