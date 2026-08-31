/**
 * Vista previa del fondo estrellado desde admin: iframe con la home en modo «solo cielo».
 * Misma lógica que en producción (`FondoEstrellado` + localStorage); sin barra ni hero.
 */

export const FONDO_ESTRELLAS_PREVIEW_EMBED_PARAM = "maikaEmbedSoloFondo";
export const FONDO_ESTRELLAS_PREVIEW_EMBED_VALUE = "1";

export function esVistaFondoEstrellasSoloEmbebida(search: string): boolean {
  return new URLSearchParams(search).get(FONDO_ESTRELLAS_PREVIEW_EMBED_PARAM) === FONDO_ESTRELLAS_PREVIEW_EMBED_VALUE;
}

/** URL absoluta del inicio solo con el cielo (misma origen; lee fondo/estrellas ya guardados en el navegador). */
export function urlAbsolutaPrevisualizacionFondoEstrellas(): string {
  if (typeof window === "undefined") return "/";
  const u = new URL("/", window.location.origin);
  u.searchParams.set(FONDO_ESTRELLAS_PREVIEW_EMBED_PARAM, FONDO_ESTRELLAS_PREVIEW_EMBED_VALUE);
  return u.toString();
}
