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
  const [mostrarConfigCookies, setMostrarConfigCookies] = useState(false);
  const [consentimientoCookies, setConsentimientoCookies] = useState<ConsentimientoCookies>({
    necesarias: true,
    preferencias: false,
    analiticas: false,
    marketing: false,
    fechaActualizacion: "",
    version: COOKIE_CONSENT_VERSION
  });

  const guardarConsentimientoCookies = useCallback(
    (consentimientoBase: Omit<ConsentimientoCookies, "necesarias" | "fechaActualizacion" | "version">) => {
      const consentimientoFinal = construirConsentimientoCookies(consentimientoBase, COOKIE_CONSENT_VERSION);
      guardarConsentimientoCookiesEnStorage(COOKIE_CONSENT_KEY, consentimientoFinal);
      setConsentimientoCookies(consentimientoFinal);
      setMostrarAvisoCookies(false);
      setMostrarConfigCookies(false);
    },
    []
  );

  const aceptarTodasCookies = useCallback(() => {
    guardarConsentimientoCookies({ preferencias: true, analiticas: true, marketing: true });
    notificarExito(mostrarNotificacion, "✅ Cookies aceptadas");
  }, [guardarConsentimientoCookies, mostrarNotificacion]);

  const rechazarCookiesOpcionales = useCallback(() => {
    guardarConsentimientoCookies({ preferencias: false, analiticas: false, marketing: false });
    mostrarNotificacion("✅ Solo cookies necesarias activas", "normal");
  }, [guardarConsentimientoCookies, mostrarNotificacion]);

  const aceptarCookies = useCallback(() => {
    aceptarTodasCookies();
  }, [aceptarTodasCookies]);

  const toggleMostrarConfigCookies = useCallback(() => {
    setMostrarConfigCookies((prev) => !prev);
  }, []);

  const cerrarConfigCookies = useCallback(() => {
    setMostrarConfigCookies(false);
  }, []);

  const cerrarNotificacion = useCallback(() => {
    setNotificacion(null);
  }, [setNotificacion]);

  const guardarPreferenciasCookiesPanel = useCallback(() => {
    guardarConsentimientoCookies({
      preferencias: consentimientoCookies.preferencias,
      analiticas: consentimientoCookies.analiticas,
      marketing: consentimientoCookies.marketing
    });
    notificarExito(mostrarNotificacion, "✅ Preferencias de cookies guardadas");
  }, [consentimientoCookies, guardarConsentimientoCookies, mostrarNotificacion]);

  const onUpdatePreferencias = useCallback((checked: boolean) => {
    setConsentimientoCookies((prev) => ({ ...prev, preferencias: checked }));
  }, []);

  const onUpdateAnaliticas = useCallback((checked: boolean) => {
    setConsentimientoCookies((prev) => ({ ...prev, analiticas: checked }));
  }, []);

  const onUpdateMarketing = useCallback((checked: boolean) => {
    setConsentimientoCookies((prev) => ({ ...prev, marketing: checked }));
  }, []);

  return {
    notificacion,
    setNotificacion,
    mostrarNotificacion,
    mostrarAvisoCookies,
    setMostrarAvisoCookies,
    mostrarConfigCookies,
    setMostrarConfigCookies,
    consentimientoCookies,
    setConsentimientoCookies,
    guardarConsentimientoCookies,
    aceptarTodasCookies,
    rechazarCookiesOpcionales,
    aceptarCookies,
    toggleMostrarConfigCookies,
    cerrarConfigCookies,
    cerrarNotificacion,
    guardarPreferenciasCookiesPanel,
    onUpdatePreferencias,
    onUpdateAnaliticas,
    onUpdateMarketing
  };
}
