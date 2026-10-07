import type { ConsentimientoCookies } from "../types";

export function construirConsentimientoCookies(version: number): ConsentimientoCookies {
  return {
    necesarias: true,
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
    if (parseado?.version === version && parseado?.necesarias === true) {
      return {
        necesarias: true,
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
