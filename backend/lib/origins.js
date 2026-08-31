import { FRONTEND_URL, IS_PRODUCTION, PORT } from "./env.js";

/** Misma idea que en el front (`apiBaseUrl`): API en LAN durante dev. */
export function esHostnameIPv4PrivadaLan(hostname) {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return false;
  const p = hostname.split(".").map((n) => Number(n));
  if (p.length !== 4 || p.some((n) => !Number.isFinite(n) || n > 255)) return false;
  const [a, b] = p;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

/**
 * En desarrollo, el móvil entra por `http://192.168.x.x:5173` pero `FRONTEND_URL` suele ser solo localhost →
 * sin esto, `fetch` al API falla por CORS y la barra muestra «Sin API» aunque `/health` abra bien en el navegador.
 */
export function esOrigenFrontendDevLanPermitido(origin) {
  if (!origin || typeof origin !== "string") return false;
  try {
    const u = new URL(origin);
    const port = u.port || (u.protocol === "https:" ? "443" : "80");
    const extra = String(process.env.MAIKA_DEV_VITE_PORT || "").trim();
    const portsOk = new Set(["5173", "4173", ...(extra ? [extra] : [])]);
    if (!portsOk.has(port)) return false;
    const h = u.hostname;
    if (h === "localhost" || h === "127.0.0.1") return true;
    return esHostnameIPv4PrivadaLan(h);
  } catch {
    return false;
  }
}

/** Origen permitido para enlaces en email / reset (prod: solo FRONTEND_URL; dev: LAN + localhost/127.0.0.1). */
export function esOrigenFrontendPermitido(origin) {
  const o = String(origin || "").trim().replace(/\/+$/, "");
  if (!o) return false;
  if (IS_PRODUCTION) {
    try {
      return new URL(o).origin === new URL(FRONTEND_URL).origin;
    } catch {
      return o === String(FRONTEND_URL || "").replace(/\/+$/, "");
    }
  }
  try {
    if (new URL(o).origin === new URL(FRONTEND_URL).origin) return true;
  } catch {
    if (o === String(FRONTEND_URL || "").replace(/\/+$/, "")) return true;
  }
  return esOrigenFrontendDevLanPermitido(o);
}

/**
 * Base del front para enlaces (p. ej. reset): mismo host que la pestaña del usuario
 * (`Origin` / `Referer` / `frontendOrigin`), no solo `FRONTEND_URL` fijo en `.env`.
 */
export function resolveFrontendBaseUrlFromRequest(req) {
  const candidates = [
    String(req.headers?.origin || "").trim(),
    String(req.body?.frontendOrigin || "").trim()
  ];
  try {
    const ref = String(req.headers?.referer || "").trim();
    if (ref) candidates.push(new URL(ref).origin);
  } catch {
    /* referer inválido */
  }
  for (const c of candidates) {
    if (c && esOrigenFrontendPermitido(c)) return c.replace(/\/+$/, "");
  }
  return String(FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
}

export function buildResetPasswordPageUrl(frontBase, token) {
  const base = String(frontBase || FRONTEND_URL).replace(/\/+$/, "");
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
}

function apiOriginMatchingFrontend(frontBase) {
  try {
    const u = new URL(frontBase);
    u.port = String(PORT);
    u.protocol = "http:";
    u.pathname = "";
    u.search = "";
    u.hash = "";
    return u.origin;
  } catch {
    return `http://127.0.0.1:${PORT}`;
  }
}

/** En dev: enlace al backend; al pulsar abre Chrome y evita ChromeHTML (desde el correo abre la Microsoft Store). */
export function buildResetEmailClickHref(frontBase, token) {
  const destino = buildResetPasswordPageUrl(frontBase, token);
  if (IS_PRODUCTION || process.env.NODE_ENV === "test") return destino;
  const apiOrigin = apiOriginMatchingFrontend(frontBase);
  return `${apiOrigin}/auth/open-reset?token=${encodeURIComponent(token)}&front=${encodeURIComponent(String(frontBase).replace(/\/+$/, ""))}`;
}

/** Orígenes CORS: `MAIKA_CORS_ORIGINS` (coma) o solo `FRONTEND_URL`. */
export function corsOriginConfig() {
  const raw = String(process.env.MAIKA_CORS_ORIGINS || "").trim();
  if (raw) {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return FRONTEND_URL;
    if (parts.length === 1) return parts[0];
    return parts;
  }
  if (IS_PRODUCTION) {
    return FRONTEND_URL;
  }
  const fijos = new Set([FRONTEND_URL].filter(Boolean));
  return (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (fijos.has(origin) || esOrigenFrontendDevLanPermitido(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  };
}
