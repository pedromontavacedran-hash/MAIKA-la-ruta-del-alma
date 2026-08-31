/**
 * Distingue fallos de transporte (sin API, timeout, CORS/red) de errores HTTP/lógicos del backend.
 */

function isAbortError(e: unknown): boolean {
  return (
    (e instanceof DOMException && e.name === "AbortError") ||
    (typeof e === "object" &&
      e !== null &&
      "name" in e &&
      String((e as { name?: string }).name) === "AbortError")
  );
}

export function esErrorDeConexion(e: unknown): boolean {
  if (e == null) return false;
  if (isAbortError(e)) return true;
  const msg = e instanceof Error ? e.message : String(e);
  const lower = msg.toLowerCase();
  if (msg.includes("Red: no hubo respuesta del servidor")) return true;
  if (msg.includes("Sin respuesta del servidor tras")) return true;
  if (lower.includes("failed to fetch")) return true;
  if (lower.includes("networkerror")) return true;
  if (lower.includes("load failed")) return true;
  /** Chrome / Edge (DevTools, extensiones): rechazo TCP al API parado. */
  if (lower.includes("err_connection_refused")) return true;
  if (lower.includes("connection refused")) return true;
  if (lower.includes("net::err_")) return true;
  if (lower.includes("econnrefused")) return true;
  if (lower.includes("enotfound")) return true;
  if (lower.includes("etimedout")) return true;
  if (e instanceof TypeError && (lower.includes("fetch") || lower.includes("network"))) return true;
  /** Tras `fetchMaikaApi`: mismo fallo, mensaje ya humanizado. */
  if (lower.includes("no hay conexión con el servidor")) return true;
  return false;
}
