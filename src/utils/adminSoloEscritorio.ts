import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

/** Misma franja que otros ajustes “solo móvil” en la app. */
const MQ_ANCHO_MOVIL_ADMIN = "(max-width: 768px)";

/**
 * Panel admin solo en navegador de escritorio (ancho > 768px).
 * En app nativa (Capacitor) y en viewport estrecho no se ofrece admin en UI ni rutas.
 */
export function esAdminPermitidoEnEsteCliente(): boolean {
  if (typeof window === "undefined") return true;
  if (Capacitor.isNativePlatform()) return false;
  return !window.matchMedia(MQ_ANCHO_MOVIL_ADMIN).matches;
}

export function useEsAdminPermitidoEnEsteCliente(): boolean {
  const [ok, setOk] = useState(esAdminPermitidoEnEsteCliente);
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setOk(false);
      return;
    }
    const mq = window.matchMedia(MQ_ANCHO_MOVIL_ADMIN);
    const fn = () => setOk(!mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return ok;
}
