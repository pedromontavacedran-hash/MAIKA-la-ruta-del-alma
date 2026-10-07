import { useState, useCallback } from "react";
import type { ConsentimientoCookies } from "../../types";
import {
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_VERSION
} from "../../config";
import {
  construirConsentimientoCookies,
  guardarConsentimientoCookiesEnStorage
} from "../../utils/cookiesConsent";
import { notificarExito } from "../../utils/ui/notificaciones";
import { useNotificacion } from "../../hooks/useNotificacion";

export function useMaikaChrome() {
  const { notificacion, setNotificacion, mostrarNotificacion } = useNotificacion();

  const [mostrarAvisoCookies, setMostrarAvisoCookies] = useState(false);
  const [consentimientoCookies, setConsentimientoCookies] = useState<ConsentimientoCookies>({
    necesarias: true,
    fechaActualizacion: "",
    version: COOKIE_CONSENT_VERSION
  });

  const aceptarCookies = useCallback(() => {
    const consentimientoFinal = construirConsentimientoCookies(COOKIE_CONSENT_VERSION);
    guardarConsentimientoCookiesEnStorage(COOKIE_CONSENT_KEY, consentimientoFinal);
    setConsentimientoCookies(consentimientoFinal);
    setMostrarAvisoCookies(false);
    notificarExito(mostrarNotificacion, "✅ Solo se usan cookies técnicas necesarias");
  }, [mostrarNotificacion]);

  const cerrarNotificacion = useCallback(() => {
    setNotificacion(null);
  }, [setNotificacion]);

  return {
    notificacion,
    setNotificacion,
    mostrarNotificacion,
    mostrarAvisoCookies,
    setMostrarAvisoCookies,
    consentimientoCookies,
    setConsentimientoCookies,
    aceptarCookies,
    cerrarNotificacion
  };
}
