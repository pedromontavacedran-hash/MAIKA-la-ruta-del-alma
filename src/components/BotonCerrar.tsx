/**
 * Botón de cierre (×): estilos globales `.boton-cerrar-modal` en App.css.
 * En modales reales: usar `ModalBase` (overlay `.modal-overlay` + `.modal-card`).
 * Fuera de ModalBase / páginas: padre `.maika-anchor` (`position: relative`).
 * `anclaje="viewport"` fija la cruz al viewport (p. ej. tienda a pantalla completa).
 */
import type { CSSProperties, MouseEvent } from "react";

interface BotonCerrarProps {
  onClick: (e?: MouseEvent<HTMLButtonElement>) => void;
  ariaLabel?: string;
  title?: string;
  disabled?: boolean;
  /** Misma apariencia; conserva clase para reglas del carrito (z-index / safe area). */
  variante?: "default" | "discreto";
  /** `viewport` fija la cruz a la izquierda bajo la barra; `viewport-dcha` a la derecha. */
  anclaje?: "modal" | "viewport" | "viewport-dcha";
  style?: CSSProperties;
}

export default function BotonCerrar({
  onClick,
  ariaLabel = "Cerrar",
  title = "Cerrar",
  disabled = false,
  variante = "default",
  anclaje = "modal",
  style
}: BotonCerrarProps) {
  const className = [
    "boton-cerrar-modal",
    variante === "discreto" ? "boton-cerrar-modal--discreto" : "",
    anclaje === "viewport" ? "boton-cerrar-modal--viewport" : "",
    anclaje === "viewport-dcha" ? "boton-cerrar-modal--viewport-dcha" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      onClick={(e) => onClick(e)}
      style={style}
      aria-label={ariaLabel}
      title={title}
    >
      ×
    </button>
  );
}
