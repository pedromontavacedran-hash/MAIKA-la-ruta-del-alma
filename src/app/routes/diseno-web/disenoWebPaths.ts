/** Base de rutas anidadas «Hero diseño web» (misma instancia de panel, sin remontar). */
export const ADMIN_DISENO_WEB_PREFIX = "/admin/diseno-web";

/** Primer segmento tras el prefijo (p. ej. `barra`, `imagen`); vacío = índice / ajustes. */
export function primerSegmentoDisenoWeb(pathname: string): string {
  if (!pathname.startsWith(ADMIN_DISENO_WEB_PREFIX)) return "";
  const rest = pathname.slice(ADMIN_DISENO_WEB_PREFIX.length).replace(/^\//, "");
  return rest.split("/").filter(Boolean)[0] ?? "";
}
