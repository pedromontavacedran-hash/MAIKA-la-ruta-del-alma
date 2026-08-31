/** Bloqueo temporal tras agotar intentos de confirmación de email (acceso rápido), por teléfono 9 dígitos. */
const MAIKA_BLOQUEO_EMAIL_KEY_PREFIX = "maika_bloqueo_acceso_email_";
const ACCESO_RAPIDO_EMAIL_BLOQUEO_MS = 5 * 60 * 1000;
const MAIKA_BLOQUEO_SEGURIDAD_KEY_PREFIX = "maika_bloqueo_acceso_seguridad_";
const ACCESO_RAPIDO_SEGURIDAD_BLOQUEO_MS = 5 * 60 * 1000;

function bloqueoEmailAccesoRapidoKey(tel9: string) {
  return `${MAIKA_BLOQUEO_EMAIL_KEY_PREFIX}${tel9}`;
}

export function leerBloqueoEmailAccesoRapidoActivo(tel9: string): boolean {
  if (!tel9) return false;
  const raw = localStorage.getItem(bloqueoEmailAccesoRapidoKey(tel9));
  if (!raw) return false;
  const t = Number(raw);
  if (!Number.isFinite(t)) {
    localStorage.removeItem(bloqueoEmailAccesoRapidoKey(tel9));
    return false;
  }
  if (Date.now() - t > ACCESO_RAPIDO_EMAIL_BLOQUEO_MS) {
    localStorage.removeItem(bloqueoEmailAccesoRapidoKey(tel9));
    return false;
  }
  return true;
}

export function guardarBloqueoEmailAccesoRapido(tel9: string) {
  if (!tel9) return;
  localStorage.setItem(bloqueoEmailAccesoRapidoKey(tel9), String(Date.now()));
}

export function limpiarBloqueoEmailAccesoRapido(tel9: string) {
  if (!tel9) return;
  localStorage.removeItem(bloqueoEmailAccesoRapidoKey(tel9));
}

/** Milisegundos hasta fin del bloqueo; 0 si ya expiró o no hay bloqueo (y limpia localStorage si aplica). */
export function msRestantesBloqueoEmailAccesoRapido(tel9: string): number {
  if (!tel9) return 0;
  const raw = localStorage.getItem(bloqueoEmailAccesoRapidoKey(tel9));
  if (!raw) return 0;
  const t = Number(raw);
  if (!Number.isFinite(t)) {
    localStorage.removeItem(bloqueoEmailAccesoRapidoKey(tel9));
    return 0;
  }
  const fin = t + ACCESO_RAPIDO_EMAIL_BLOQUEO_MS;
  const rest = fin - Date.now();
  if (rest <= 0) {
    localStorage.removeItem(bloqueoEmailAccesoRapidoKey(tel9));
    return 0;
  }
  return rest;
}

export function formatearCuentaAtrasMmSs(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function bloqueoSeguridadAccesoRapidoKey(tel9: string) {
  return `${MAIKA_BLOQUEO_SEGURIDAD_KEY_PREFIX}${tel9}`;
}

export function msRestantesBloqueoSeguridadAccesoRapido(tel9: string): number {
  if (!tel9) return 0;
  const raw = localStorage.getItem(bloqueoSeguridadAccesoRapidoKey(tel9));
  if (!raw) return 0;
  const t = Number(raw);
  if (!Number.isFinite(t)) {
    localStorage.removeItem(bloqueoSeguridadAccesoRapidoKey(tel9));
    return 0;
  }
  const fin = t + ACCESO_RAPIDO_SEGURIDAD_BLOQUEO_MS;
  const rest = fin - Date.now();
  if (rest <= 0) {
    localStorage.removeItem(bloqueoSeguridadAccesoRapidoKey(tel9));
    return 0;
  }
  return rest;
}

export function guardarBloqueoSeguridadAccesoRapido(tel9: string) {
  if (!tel9) return;
  localStorage.setItem(bloqueoSeguridadAccesoRapidoKey(tel9), String(Date.now()));
}
