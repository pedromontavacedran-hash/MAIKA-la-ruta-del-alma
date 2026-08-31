import { normalizarTelefonoES9 } from "./telefono";

const SESSION_KEY = "maika_activacion_id_ok";

/**
 * Tras validar el código del último pedido en acceso rápido (activar cuenta): guarda teléfono + código.
 * Esa validación es solo UX (contra el historial en `localStorage` de este navegador); la seguridad real
 * la aplica el backend, que vuelve a comprobar el código contra `pedidos.json` en `POST /auth/register`.
 */
export function marcarActivacionIdentidadVerificada(telefonoRaw: string, codigo?: string): void {
  try {
    const tel9 = normalizarTelefonoES9(telefonoRaw || "");
    if (!tel9) return;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ tel9, codigo: String(codigo || "").trim() }));
  } catch {
    /* noop */
  }
}

export function limpiarActivacionIdentidadVerificada(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
}

function leerActivacionIdentidadEnSession(): { tel9: string; codigo: string } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    // Compatibilidad con el formato antiguo (solo el teléfono como string plano).
    if (!raw.trim().startsWith("{")) return { tel9: raw, codigo: "" };
    const parsed = JSON.parse(raw) as { tel9?: string; codigo?: string };
    return { tel9: String(parsed?.tel9 || ""), codigo: String(parsed?.codigo || "") };
  } catch {
    return null;
  }
}

/** Coherente con el teléfono fijado en el flujo «activar cuenta» desde checkout. */
export function esActivacionIdentidadVerificadaEnSession(telefonoForzadoRaw: string): boolean {
  const tel9 = normalizarTelefonoES9(telefonoForzadoRaw || "");
  if (!tel9) return false;
  const entry = leerActivacionIdentidadEnSession();
  return !!entry && entry.tel9 === tel9;
}

/** Código de último pedido verificado en esta sesión para el teléfono forzado (lo exige el backend al activar). */
export function obtenerCodigoActivacionVerificadaEnSession(telefonoForzadoRaw: string): string {
  if (!esActivacionIdentidadVerificadaEnSession(telefonoForzadoRaw)) return "";
  return leerActivacionIdentidadEnSession()?.codigo || "";
}
