import { useEffect, useRef, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import BotonCerrar from "./BotonCerrar";

/* Pila de modales abiertos en orden de apertura: solo el superior responde a
   Escape y al focus trap (los flujos de checkout pueden apilar modales). */
const pilaModalesAbiertos: symbol[] = [];

const SELECTOR_ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  const idModalRef = useRef(Symbol("modal-base"));
  const cardRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  /* Modales no descartables (`cerrarAlPulsarFondo={false}`, p. ej. cambio de
     contraseña obligatorio) tampoco deben cerrarse con Escape. */
  const descartableRef = useRef(cerrarAlPulsarFondo);
  descartableRef.current = cerrarAlPulsarFondo;

  /* Escape (solo el modal superior de la pila), foco inicial, focus trap con
     Tab/Shift+Tab y restauración del foco al cerrar. */
  useEffect(() => {
    if (!abierto) return;
    const id = idModalRef.current;
    pilaModalesAbiertos.push(id);
    const focoPrevio = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const card = cardRef.current;
    const enfocables = () =>
      card
        ? Array.from(card.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLES)).filter(
            (el) => el.getClientRects().length > 0
          )
        : [];

    const inicial = enfocables()[0];
    if (inicial) inicial.focus();
    else card?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (pilaModalesAbiertos[pilaModalesAbiertos.length - 1] !== id) return;
      if (e.key === "Escape") {
        if (e.defaultPrevented || descartableRef.current === false) return;
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !card) return;
      const lista = enfocables();
      if (lista.length === 0) {
        e.preventDefault();
        card.focus();
        return;
      }
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      const activo = document.activeElement;
      if (e.shiftKey ? activo === primero || !card.contains(activo) : activo === ultimo || !card.contains(activo)) {
        e.preventDefault();
        (e.shiftKey ? ultimo : primero).focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      const idx = pilaModalesAbiertos.lastIndexOf(id);
      if (idx >= 0) pilaModalesAbiertos.splice(idx, 1);
      document.removeEventListener("keydown", onKeyDown);
      if (focoPrevio && document.contains(focoPrevio)) focoPrevio.focus();
    };
  }, [abierto]);

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
        ref={cardRef}
        className={cardCls}
        style={{ maxWidth, ...styleCard }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
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
