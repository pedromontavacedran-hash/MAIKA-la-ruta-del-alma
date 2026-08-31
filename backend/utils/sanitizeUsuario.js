/**
 * Identidad fija: quita `nombre` del payload (capa extra).
 * Preferir `pickUsuarioEditable` en endpoints nuevos (lista blanca).
 */
export function sanitizeUsuarioUpdate(data) {
  const copy = { ...(typeof data === "object" && data !== null ? data : {}) };
  delete copy.nombre;
  return copy;
}
