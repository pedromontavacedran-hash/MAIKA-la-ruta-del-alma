/** Rutas amigables `/legal/*` → ficheros estáticos en `public/*.html`. */
export const LEGAL_SLUGS = ["terminos", "privacidad", "cookies", "aviso"] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export function esLegalSlug(s: string | undefined): s is LegalSlug {
  return s != null && (LEGAL_SLUGS as readonly string[]).includes(s);
}

export const LEGAL_META: Record<
  LegalSlug,
  { htmlBase: string; titulo: string; tituloCorto: string }
> = {
  terminos: { htmlBase: "terminos-condiciones", titulo: "Términos y Condiciones", tituloCorto: "Términos y condiciones" },
  privacidad: { htmlBase: "politica-privacidad", titulo: "Política de Privacidad", tituloCorto: "Política de privacidad" },
  cookies: { htmlBase: "politica-cookies", titulo: "Política de Cookies", tituloCorto: "Política de cookies" },
  aviso: { htmlBase: "aviso-legal", titulo: "Aviso Legal", tituloCorto: "Aviso legal" }
};
