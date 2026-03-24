import type { ConsentimientoCookies } from "../types";

export function construirConsentimientoCookies(
  consentimientoBase: Omit<ConsentimientoCookies, "necesarias" | "fechaActualizacion" | "version">,
  version: number
): ConsentimientoCookies {
  return {
    necesarias: true,
    preferencias: !!consentimientoBase.preferencias,
    analiticas: !!consentimientoBase.analiticas,
    marketing: !!consentimientoBase.marketing,
    fechaActualizacion: new Date().toISOString(),
    version
  };
}

export function guardarConsentimientoCookiesEnStorage(key: string, consentimiento: ConsentimientoCookies) {
  localStorage.setItem(key, JSON.stringify(consentimiento));
}

export function cargarConsentimientoCookiesDesdeStorage(
  key: string,
  version: number
): ConsentimientoCookies | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parseado = JSON.parse(raw) as ConsentimientoCookies;
    if (parseado?.version === version) {
      return {
        necesarias: true,
        preferencias: !!parseado.preferencias,
        analiticas: !!parseado.analiticas,
        marketing: !!parseado.marketing,
        fechaActualizacion: parseado.fechaActualizacion || "",
        version
      };
    }
    localStorage.removeItem(key);
    return null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}
