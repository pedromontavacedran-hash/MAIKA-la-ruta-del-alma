/**
 * Lista blanca + validación mínima: solo campos permitidos, normalizados.
 * Cualquier otro campo (nombre, rol, emailVerificado, etc.) se ignora.
 */
export function pickUsuarioEditable(data) {
  const src = typeof data === "object" && data !== null ? data : {};
  const out = {};

  if (typeof src.direccion === "string") {
    const v = src.direccion.trim();
    if (v.length >= 5 && v.length <= 120) out.direccion = v;
  }

  if (typeof src.telefono === "string") {
    const v = src.telefono.trim();
    if (/^[0-9+\s-]{6,20}$/.test(v)) out.telefono = v;
  }

  if (typeof src.email === "string") {
    const v = src.email.trim().toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) out.email = v;
  }

  if (typeof src.password === "string") {
    if (src.password.length >= 6) out.password = src.password;
  }

  return out;
}
