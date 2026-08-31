/** Payload mínimo del JWT en cliente (sin verificar firma; el backend valida). */
export type JwtPayloadBasico = {
  exp?: number;
  id?: string | number;
  email?: string;
};

export function parseJwtPayload(token: string): JwtPayloadBasico | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    return JSON.parse(decoded) as JwtPayloadBasico;
  } catch {
    return null;
  }
}

/** True si el token tiene `exp` y ya caducó (margen opcional en segundos). Sin `exp` → no se considera expirado aquí. */
export function isJwtExpired(token: string, skewSeconds = 30): boolean {
  const p = parseJwtPayload(token);
  if (p?.exp == null || !Number.isFinite(p.exp)) return false;
  return Date.now() / 1000 >= p.exp - skewSeconds;
}
