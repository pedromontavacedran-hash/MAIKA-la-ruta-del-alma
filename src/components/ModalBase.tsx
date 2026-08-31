import { useRef, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import BotonCerrar from "./BotonCerrar";

export type ModalBaseProps = {
  abierto: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Ancho máximo de la tarjeta (p. ej. "520px", "580px", "min(1500px,98vw)") */
  maxWidth?: string;
  zIndex?: number;
  classNameOverlay?: string;
  classNameCard?: string;
  styleCard?: CSSProperties;
  styleOverlay?: CSSProperties;
  /** Por defecto cierra al pulsar el fondo */
  cerrarAlPulsarFondo?: boolean;
  /** Si es false (p. ej. admin tipo página), no se muestra la cruz */
  mostrarCruz?: boolean;
  ariaLabelledBy?: string;
};

/**
 * Modal reutilizable: overlay + tarjeta + cierre unificado.
 * Checkout, login, confirmaciones y avisos deben usar este componente.
 */
export default function ModalBase({
  abierto,
  onClose,
  children,
  maxWidth = "520px",
  zIndex,
  classNameOverlay = "",
  classNameCard = "",
  styleCard,
  styleOverlay,
  cerrarAlPulsarFondo = true,
  mostrarCruz = true,
  ariaLabelledBy
}: ModalBaseProps) {
  const pointerInicioEnFondoRef = useRef(false);

  if (!abierto) return null;

  const overlayCls = ["modal-overlay", classNameOverlay].filter(Boolean).join(" ");
  const cardCls = ["modal-card", classNameCard].filter(Boolean).join(" ");

  const cerrar = () => {
    onClose();
  };

  const onOverlayPointer = (e: MouseEvent<HTMLDivElement>) => {
    const clickEnFondo = e.target === e.currentTarget;
    if (clickEnFondo && pointerInicioEnFondoRef.current && cerrarAlPulsarFondo) {
      cerrar();
    }
    pointerInicioEnFondoRef.current = false;
  };

  const onOverlayPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    pointerInicioEnFondoRef.current = e.target === e.currentTarget;
  };

  return (
    <div
      className={overlayCls}
      style={{ zIndex, ...styleOverlay }}
      onPointerDown={onOverlayPointerDown}
      onClick={onOverlayPointer}
      role="presentation"
    >
      <div
        className={cardCls}
        style={{ maxWidth, ...styleCard }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        {...(ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : {})}
      >
        {mostrarCruz ? (
          <BotonCerrar
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              cerrar();
            }}
            ariaLabel="Cerrar"
            title="Cerrar"
          />
        ) : null}
        {children}
      </div>
    </div>
  );
}
