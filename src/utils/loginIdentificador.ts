/**
 * Limpieza del correo/tfno antes de POST /auth/login.
 * Alineado con `backend/app.js` (NFKC, sin ZWSP). Mejora autocompletado (p. ej. Edge en Windows).
 */
export function normalizarIdentificadorLoginCliente(raw: string): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}
