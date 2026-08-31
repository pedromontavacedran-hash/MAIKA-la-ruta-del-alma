import { getApiBaseUrl } from "../config/apiBaseUrl";

/** Red móvil / LAN: un poco más de margen que el default de fetch en otros sitios. */
const PROBE_MS = 6500;

/** Disparar sync inmediato cuando el probe pasa de no responder a OK (evita esperar el intervalo largo). */
export const MAIKA_API_BECAME_REACHABLE_EVENT = "maika-api-became-reachable";

/**
 * Comprueba si el backend responde (ruta ligera `/health`).
 * Si falla red o timeout → false.
 */
export async function probeMaikaApiReachable(): Promise<boolean> {
  if (typeof window === "undefined") return true;
  const base = getApiBaseUrl().replace(/\/+$/, "");
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), PROBE_MS);
  try {
    const res = await fetch(`${base}/health?t=${Date.now()}`, {
      method: "GET",
      signal: ctrl.signal,
      cache: "no-store",
      mode: "cors"
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(t);
  }
}
