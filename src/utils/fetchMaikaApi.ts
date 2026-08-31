import { esErrorDeConexion } from "./esErrorDeConexion";

export const API_FETCH_TIMEOUT_MS = 22_000;

export const MENSAJE_API_TIMEOUT = `Sin respuesta del servidor tras ${Math.round(API_FETCH_TIMEOUT_MS / 1000)} s. ¿Está el backend en marcha (p. ej. puerto 3001) y es correcta la URL en public/maika-api.json o VITE_API_URL?`;

/** Cuando el navegador solo dice «Failed to fetch» / ERR_CONNECTION_REFUSED por TCP rechazado. */
export const MENSAJE_API_SIN_CONEXION =
  "No hay conexión con el servidor (rechazo de conexión o la API no responde). Comprueba que el backend esté en marcha y que la URL sea la correcta (maika-api.json o VITE_API_URL).";

function isAbortError(e: unknown): boolean {
  return (
    (e instanceof DOMException && e.name === "AbortError") ||
    (typeof e === "object" &&
      e !== null &&
      "name" in e &&
      String((e as { name?: string }).name) === "AbortError")
  );
}

/**
 * `fetch` hacia el backend con timeout, `credentials: include` y mensajes claros si no hay red / rechazo TCP.
 */
export async function fetchMaikaApi(input: string, init?: RequestInit): Promise<Response> {
  if (typeof window === "undefined") {
    return fetch(input, init);
  }
  const controller = new AbortController();
  const tid = window.setTimeout(() => controller.abort(), API_FETCH_TIMEOUT_MS);
  try {
    return await fetch(input, { credentials: "include", ...init, signal: controller.signal });
  } catch (e) {
    if (isAbortError(e)) {
      throw new Error(MENSAJE_API_TIMEOUT);
    }
    if (esErrorDeConexion(e)) {
      throw new Error(MENSAJE_API_SIN_CONEXION);
    }
    throw e;
  } finally {
    window.clearTimeout(tid);
  }
}
