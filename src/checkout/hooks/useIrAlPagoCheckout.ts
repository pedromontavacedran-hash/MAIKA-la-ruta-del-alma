import { useEffect, useLayoutEffect, type MutableRefObject, type RefObject } from "react";
import type { Usuario } from "../../types";

type Notificar = (m: string, t: "normal" | "exito" | "error") => void;

/**
 * Asigna la lógica del botón “Ir al pago” (validación + paso) y los listeners de puntero / pulso del teléfono.
 * Antes vivía inline en App.tsx.
 */
export function useIrAlPagoCheckout(p: {
  irAlPagoEjecutarRef: MutableRefObject<() => void>;
  accesoRapidoCheckoutAbierto: boolean;
  datosObligatoriosCompletos: boolean;
  primerCampoFaltanteCheckout: string | null;
  mostrarNotificacion: Notificar;
  usuario: Usuario | null;
  inputCalleCheckoutRef: RefObject<HTMLInputElement | null>;
  inputTelefonoCheckoutRef: RefObject<HTMLInputElement | null>;
  setAvisoTelefonoCheckout: (v: { encontrado: boolean; texto: string } | null) => void;
  setPasoFinalizarCompra: (paso: "datos" | "confirmarDireccion" | "pago") => void;
  telefonoCheckoutEsValido: boolean;
  setTelefonoCheckoutValidPulse: (v: boolean) => void;
  telefonoCheckoutValidoPrevRef: MutableRefObject<boolean>;
  irAlPagoPointerIdRef: MutableRefObject<number | null>;
  botonIrAlPagoRef: RefObject<HTMLButtonElement | null>;
  formPedidoAbierto: boolean;
  pasoFinalizarCompra: "datos" | "confirmarDireccion" | "pago";
  /** Tras pointerup/cancel del mismo pointer que pulsó «Ir al pago» (libera bloqueo UI del botón). */
  onIrAlPagoTrackedPointerEnd?: () => void;
}) {
  const {
    irAlPagoEjecutarRef,
    accesoRapidoCheckoutAbierto,
    datosObligatoriosCompletos,
    primerCampoFaltanteCheckout,
    mostrarNotificacion,
    usuario,
    inputCalleCheckoutRef,
    inputTelefonoCheckoutRef,
    setAvisoTelefonoCheckout,
    setPasoFinalizarCompra,
    telefonoCheckoutEsValido,
    setTelefonoCheckoutValidPulse,
    telefonoCheckoutValidoPrevRef,
    irAlPagoPointerIdRef,
    botonIrAlPagoRef,
    formPedidoAbierto,
    pasoFinalizarCompra,
    onIrAlPagoTrackedPointerEnd
  } = p;

  useLayoutEffect(() => {
    irAlPagoEjecutarRef.current = () => {
      if (accesoRapidoCheckoutAbierto) return;
      if (!datosObligatoriosCompletos) {
        const faltante = primerCampoFaltanteCheckout;
        if ((faltante || "").toLowerCase().includes("teléfono")) {
          mostrarNotificacion("Revisa el teléfono (9 dígitos, empieza por 6 o 7)", "normal");
          if (usuario) inputCalleCheckoutRef.current?.focus();
          else inputTelefonoCheckoutRef.current?.focus();
          return;
        }
        mostrarNotificacion(`Revisa: ${faltante || "datos obligatorios"}`, "normal");
        if (usuario && (faltante || "").toLowerCase().includes("nombre")) inputCalleCheckoutRef.current?.focus();
        return;
      }
      setAvisoTelefonoCheckout(null);
      setPasoFinalizarCompra("confirmarDireccion");
    };
  }, [
    irAlPagoEjecutarRef,
    accesoRapidoCheckoutAbierto,
    datosObligatoriosCompletos,
    primerCampoFaltanteCheckout,
    mostrarNotificacion,
    usuario,
    inputCalleCheckoutRef,
    inputTelefonoCheckoutRef,
    setAvisoTelefonoCheckout,
    setPasoFinalizarCompra
  ]);

  useEffect(() => {
    if (telefonoCheckoutEsValido && !telefonoCheckoutValidoPrevRef.current) {
      setTelefonoCheckoutValidPulse(true);
      const t = setTimeout(() => setTelefonoCheckoutValidPulse(false), 220);
      telefonoCheckoutValidoPrevRef.current = true;
      return () => clearTimeout(t);
    }
    if (!telefonoCheckoutEsValido) {
      telefonoCheckoutValidoPrevRef.current = false;
      setTelefonoCheckoutValidPulse(false);
    }
    return;
  }, [telefonoCheckoutEsValido]);

  useEffect(() => {
    const cancelar = (e: PointerEvent) => {
      if (irAlPagoPointerIdRef.current !== e.pointerId) return;
      irAlPagoPointerIdRef.current = null;
      onIrAlPagoTrackedPointerEnd?.();
    };
    window.addEventListener("pointercancel", cancelar, true);
    return () => window.removeEventListener("pointercancel", cancelar, true);
  }, [irAlPagoPointerIdRef, onIrAlPagoTrackedPointerEnd]);

  useEffect(() => {
    const up = (e: PointerEvent) => {
      if (irAlPagoPointerIdRef.current !== e.pointerId) return;
      irAlPagoPointerIdRef.current = null;
      const btn = botonIrAlPagoRef.current;
      const fin = () => onIrAlPagoTrackedPointerEnd?.();
      if (!btn || !formPedidoAbierto || pasoFinalizarCompra !== "datos" || accesoRapidoCheckoutAbierto) {
        fin();
        return;
      }
      const { clientX: x, clientY: y } = e;
      const r = btn.getBoundingClientRect();
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) {
        fin();
        return;
      }
      const top = document.elementFromPoint(x, y);
      if (!top || !btn.contains(top)) {
        fin();
        return;
      }
      irAlPagoEjecutarRef.current();
      fin();
    };
    window.addEventListener("pointerup", up, true);
    return () => window.removeEventListener("pointerup", up, true);
  }, [
    formPedidoAbierto,
    pasoFinalizarCompra,
    accesoRapidoCheckoutAbierto,
    botonIrAlPagoRef,
    irAlPagoPointerIdRef,
    irAlPagoEjecutarRef,
    onIrAlPagoTrackedPointerEnd
  ]);

  useEffect(() => {
    if (!formPedidoAbierto) irAlPagoPointerIdRef.current = null;
  }, [formPedidoAbierto, irAlPagoPointerIdRef]);
}
