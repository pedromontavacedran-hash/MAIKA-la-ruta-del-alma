import { getApiBaseUrl } from "../config/apiBaseUrl";
import { clearAdminAuthorization, isAdminAuthorized } from "../utils/adminAuth";
import { fetchMaikaApi } from "../utils/fetchMaikaApi";
import { normalizarIdentificadorLoginCliente } from "../utils/loginIdentificador";

function normalizeRawJwtString(raw: string): string | null {
  let s = String(raw).trim();
  if (s === "") return null;
  if (/^bearer\s+/i.test(s)) {
    s = s.replace(/^bearer\s+/i, "").trim();
  }
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    try {
      const parsed = JSON.parse(s) as unknown;
      if (typeof parsed === "string") s = parsed.trim();
    } catch {
      /* seguir con s */
    }
  }
  return s || null;
}

/** Sesión cliente vía cookie httpOnly (no JWT legible en JS). */
export const CLIENT_SESSION_COOKIE_MARKER = "__maika_cookie_session__";

/** Refuerzo tras login legacy con JWT en body (solo tests). */
let sessionJwtFallback: string | null = null;
export type AdminPanelLoginError = "rate_limit" | "invalid" | "network" | null;
let lastAdminPanelLoginError: AdminPanelLoginError = null;
let lastAdminPanelRateLimitResetAt: number | null = null;
/** Tras `GET /auth/admin/me` OK o login admin con cookie httpOnly. */
let adminBackendSessionOk: boolean | null = null;
let adminMeProbeInFlight: Promise<boolean> | null = null;
/** Tras 403/401 en sondeo admin, no repetir peticiones en esta pestaña hasta nuevo login. */
let adminBackendSessionRejected = false;

export function invalidateAdminBackendSessionCache(): void {
  adminBackendSessionOk = null;
  adminMeProbeInFlight = null;
}

export function resetAdminBackendSessionRejected(): void {
  adminBackendSessionRejected = false;
}

function clearAdminSessionLocalAndCache(): void {
  clearAdminAuthorization();
  invalidateAdminBackendSessionCache();
}

async function sondearCookieAdminBackend(): Promise<boolean> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/auth/admin/session`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  if (!res.ok) return false;
  const body = (await res.json()) as { authorized?: boolean };
  return body?.authorized === true;
}

export function getLastAdminPanelLoginError(): AdminPanelLoginError {
  return lastAdminPanelLoginError;
}

export function getLastAdminPanelRateLimitResetAt(): number | null {
  return lastAdminPanelRateLimitResetAt;
}

export function syncJwtSessionFromLogin(token: string): void {
  const t = normalizeRawJwtString(token);
  sessionJwtFallback = t;
}

export function clearJwtSessionMemory(): void {
  sessionJwtFallback = null;
}

/** Disparado tras limpiar almacenamiento (p. ej. restablecer contraseña) para sincronizar React (`useAuthMaika`). */
export const MAIKA_EVENTO_SESION_CLIENTE_LIMPIADA = "maika:sesion-cliente-limpiada";

/** Mismas claves que `getStoredJwtToken()` + snapshot de perfil en login. */
export function markClientSessionActive(): void {
  sessionJwtFallback = CLIENT_SESSION_COOKIE_MARKER;
}

export function hasClientSession(): boolean {
  return sessionJwtFallback === CLIENT_SESSION_COOKIE_MARKER || !!getStoredJwtToken();
}

export function buildOptionalAuthHeaders(): Record<string, string> {
  const token = getStoredJwtToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function probeClientSessionApi(): Promise<boolean> {
  try {
    const res = await fetchMaikaApi(`${getApiBaseUrl()}/auth/session`, { cache: "no-store" });
    if (!res.ok) {
      clearJwtSessionMemory();
      return false;
    }
    const body = (await res.json()) as { authenticated?: boolean };
    if (body?.authenticated) {
      markClientSessionActive();
      return true;
    }
    clearJwtSessionMemory();
    return false;
  } catch {
    clearJwtSessionMemory();
    return false;
  }
}

export async function refreshClientSessionApi(): Promise<boolean> {
  try {
    const res = await fetchMaikaApi(`${getApiBaseUrl()}/auth/refresh`, { cache: "no-store" });
    if (!res.ok) {
      clearJwtSessionMemory();
      return false;
    }
    markClientSessionActive();
    return true;
  } catch {
    clearJwtSessionMemory();
    return false;
  }
}

export async function logoutClientSessionApi(): Promise<void> {
  try {
    await fetchMaikaApi(`${getApiBaseUrl()}/auth/logout`, {
      method: "POST",
      headers: { Accept: "application/json" }
    });
  } catch {
    /* ignore */
  }
}

/** Snapshot de perfil en LS (solo UI; nunca JWT). */
export const MAIKA_AUTH_USER_SNAPSHOT_KEY = "maika_auth_user";

const LEGACY_JWT_LS_KEYS = ["token", "accessToken", "jwt", "authToken"] as const;

/** Elimina JWT legible en localStorage; la sesión cliente usa cookie httpOnly. */
export function purgarJwtLegacyEnLocalStorage(): void {
  if (typeof localStorage === "undefined") return;
  try {
    for (const k of LEGACY_JWT_LS_KEYS) {
      localStorage.removeItem(k);
    }
    localStorage.removeItem("usuarioActual");
  } catch {
    /* ignore */
  }
}

/** Caché de perfil para hidratar UI si `/me` tarda; no contiene credenciales. */
export function guardarSnapshotPerfilCliente(perfil: UsuarioPerfilCompletoApi): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      MAIKA_AUTH_USER_SNAPSHOT_KEY,
      JSON.stringify({
        id: perfil.id,
        email: perfil.email,
        nombre: perfil.nombre,
        telefono: perfil.telefono,
        direccion: perfil.direccion,
        calle: String(perfil.calle || ""),
        numero: String(perfil.numero || ""),
        bloque: String(perfil.bloque || ""),
        escalera: String(perfil.escalera || ""),
        piso: String(perfil.piso || ""),
        puerta: String(perfil.puerta || ""),
        cp: String(perfil.cp || ""),
        poblacion: String(perfil.poblacion || ""),
        provincia: String(perfil.provincia || ""),
        pais: String(perfil.pais || ""),
        direcciones: Array.isArray(perfil.direcciones) ? perfil.direcciones : [],
        direccionPredeterminadaId: String(perfil.direccionPredeterminadaId || ""),
        mustChangePassword: !!perfil.mustChangePassword
      })
    );
  } catch {
    /* ignore */
  }
}

export function limpiarClavesSesionEnLocalStorage(): void {
  if (typeof localStorage === "undefined") return;
  try {
    purgarJwtLegacyEnLocalStorage();
    localStorage.removeItem(MAIKA_AUTH_USER_SNAPSHOT_KEY);
  } catch {
    /* ignore */
  }
  clearJwtSessionMemory();
  void logoutClientSessionApi();
}

export function notificarSesionClienteLimpiada(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MAIKA_EVENTO_SESION_CLIENTE_LIMPIADA));
}

/**
 * Tras `POST /auth/reset-password` el servidor sube `tokenVersion`: cualquier JWT anterior queda inválido.
 * Sin limpiar el cliente, la hidratación y Mi cuenta pueden quedar incoherentes (p. ej. pantalla en negro).
 */
export function sesionClienteLimpiarTrasRestablecerPassword(): void {
  limpiarClavesSesionEnLocalStorage();
  notificarSesionClienteLimpiada();
}

/**
 * JWT en memoria (solo tests) o null si la sesión es cookie httpOnly.
 */
export function getStoredJwtToken(): string | null {
  if (sessionJwtFallback === CLIENT_SESSION_COOKIE_MARKER) return null;
  if (sessionJwtFallback) {
    return normalizeRawJwtString(sessionJwtFallback);
  }
  return null;
}

/** Compatibilidad: el JWT admin ya no es legible por JS; vive en cookie httpOnly. */
export function getAdminPanelUsuariosJwt(): string | null {
  return null;
}

export function getJwtTokenParaOperacionesUsuarios(): string | null {
  return adminBackendSessionOk === true && isAdminAuthorized() ? "admin_cookie" : null;
}

export function clearAdminUsuariosApiJwt(): void {
  invalidateAdminBackendSessionCache();
  void fetchMaikaApi(`${getApiBaseUrl()}/auth/admin/logout`, {
    method: "POST",
    headers: { Accept: "application/json" }
  }).catch(() => {});
}

/**
 * Devuelve si ya existe un JWT admin válido en esta pestaña.
 * La clave admin no vive en el bundle: solo se intercambia por token al entrar al panel.
 */
export async function ensureAdminUsuariosApiJwt(): Promise<boolean> {
  if (adminBackendSessionRejected && adminBackendSessionOk !== true) return false;
  if (adminBackendSessionOk === true) return true;
  if (adminBackendSessionOk === false && !isAdminAuthorized()) return false;
  if (adminMeProbeInFlight) return adminMeProbeInFlight;

  adminMeProbeInFlight = (async () => {
    try {
      const authorized = await sondearCookieAdminBackend();
      if (authorized) {
        adminBackendSessionOk = true;
        adminBackendSessionRejected = false;
        if (!isAdminAuthorized()) {
          const { setAdminAuthorization } = await import("../utils/adminAuth");
          setAdminAuthorization();
        }
        return true;
      }
      adminBackendSessionOk = false;
      if (isAdminAuthorized()) {
        const enRutaAdmin =
          typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
        if (enRutaAdmin) {
          adminBackendSessionRejected = true;
          clearAdminSessionLocalAndCache();
        }
      }
      return false;
    } catch {
      return false;
    } finally {
      adminMeProbeInFlight = null;
    }
  })();

  return adminMeProbeInFlight;
}

/**
 * Comprueba cookie admin httpOnly y alinea la marca local (`maika_admin_token`).
 * No borra sesión válida tras login; limpia solo marcas locales obsoletas.
 */
export async function reconciliarSesionAdminAlArrancar(): Promise<boolean> {
  return ensureAdminUsuariosApiJwt();
}

/** @deprecated Usar reconciliarSesionAdminAlArrancar */
export function purgarMarcaAdminLocalSinCookie(): void {
  void reconciliarSesionAdminAlArrancar();
}

/**
 * Intercambia la clave escrita por el admin por una cookie httpOnly de sesión admin.
 */
export async function ensureAdminPanelJwtInSession(
  password: string, remember = false
): Promise<boolean> {
  lastAdminPanelLoginError = null;
  lastAdminPanelRateLimitResetAt = null;
  resetAdminBackendSessionRejected();
  invalidateAdminBackendSessionCache();
  const passwordTrim = String(password || "").trim();
  if (!passwordTrim) {
    lastAdminPanelLoginError = "invalid";
    return false;
  }
  try {
    const res = await fetchMaikaApi(`${getApiBaseUrl()}/auth/admin-panel-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ password: passwordTrim, remember })
    });
    if (res.status === 429) {
      lastAdminPanelLoginError = "rate_limit";
      const resetHeader = Number(res.headers.get("RateLimit-Reset") || "");
      if (Number.isFinite(resetHeader) && resetHeader > 0) {
        lastAdminPanelRateLimitResetAt = resetHeader > 10_000_000_000 ? resetHeader : resetHeader * 1000;
      }
      return false;
    }
    if (!res.ok) {
      lastAdminPanelLoginError = "invalid";
      return false;
    }
    adminBackendSessionOk = true;
    resetAdminBackendSessionRejected();
    return res.ok;
  } catch {
    lastAdminPanelLoginError = "network";
    return false;
  }
}

export type AuthUser = {
  id: number | string;
  email: string;
  telefono?: string;
  nombre?: string;
  direccion?: string;
  mustChangePassword?: boolean;
  hasPassword?: boolean;
};

export type UsuarioPerfilApi = {
  id: number | string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
};

/** Perfil completo como en `usuarios.json` / maika (respuesta GET/PATCH). */
export type UsuarioPerfilCompletoApi = {
  id: number | string;
  email: string;
  telefono: string;
  nombre: string;
  dni: string;
  direccion: string;
  calle: string;
  numero: string;
  bloque: string;
  escalera: string;
  piso: string;
  puerta: string;
  cp: string;
  poblacion: string;
  provincia: string;
  pais: string;
  direccionPredeterminadaId: string;
  direcciones: import("../types").DireccionUsuario[];
  verificado: boolean;
  mustChangePassword?: boolean;
  hasPassword?: boolean;
  bloqueado?: boolean;
  bloqueadoMotivo?: string;
  bloqueadoEn?: string;
};

export type LoginApiResponse = {
  token?: string;
  ok?: boolean;
  user: AuthUser;
};

/** Respuesta HTTP del login (401/403 = credenciales; otros = servidor/ruta). */
export class LoginApiError extends Error {
  readonly status: number;
  readonly serverMessage: string;
  constructor(status: number, serverMessage = "") {
    super(serverMessage || `Login fallido (${status})`);
    this.name = "LoginApiError";
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

export async function loginApi(email: string, password: string): Promise<LoginApiResponse> {
  const ident = normalizarIdentificadorLoginCliente(String(email ?? ""));
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ident, password })
  });
  if (!res.ok) {
    let msg = "";
    try {
      const j = (await res.json()) as { error?: string };
      msg = typeof j?.error === "string" ? j.error : "";
    } catch { /* cuerpo no JSON */ }
    throw new LoginApiError(res.status, msg);
  }
  const body = (await res.json()) as LoginApiResponse;
  markClientSessionActive();
  if (body.token) syncJwtSessionFromLogin(body.token);
  return body;
}

/**
 * Sesión de checkout como invitado: el servidor crea/reutiliza la cuenta técnica asociada al teléfono y
 * entrega la cookie httpOnly directamente. Sustituye al login con contraseña determinística
 * (`Ck!${tel9}xMaikaCheckout`, eliminada por ser calculable por cualquiera desde el bundle).
 * Si el teléfono ya pertenece a una cuenta con email real/contraseña propia, responde 409 (requiere login real).
 */
export async function iniciarSesionCheckoutApi(telefono: string): Promise<{ ok: true }> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/auth/checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ telefono })
  });
  if (!res.ok) {
    let msg = `Sesión de checkout fallida (${res.status})`;
    try {
      const j = (await res.json()) as { error?: string };
      if (typeof j?.error === "string" && j.error.trim()) msg = j.error.trim();
    } catch {
      /* cuerpo no JSON */
    }
    throw new Error(msg);
  }
  markClientSessionActive();
  return (await res.json()) as { ok: true };
}

export type EstadoUsuarioTelefonoApi =
  | { existe: false }
  | { existe: true; hasEmail: boolean; hasPassword: boolean };

export async function obtenerEstadoUsuarioPorTelefonoApi(telefono: string): Promise<EstadoUsuarioTelefonoApi> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/auth/estado-telefono`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ telefono })
  });
  if (!res.ok) throw new Error(`Estado teléfono (${res.status})`);
  return (await res.json()) as EstadoUsuarioTelefonoApi;
}

export async function registerApi(data: {
  email: string;
  password: string;
  telefono?: string;
  nombre?: string;
  dni?: string;
  direccion?: string;
  calle?: string;
  numero?: string;
  bloque?: string;
  escalera?: string;
  piso?: string;
  puerta?: string;
  cp?: string;
  poblacion?: string;
  provincia?: string;
  pais?: string;
  /** El backend hace merge con `pickUsuarioPerfilServidor` (misma lógica que PATCH). */
  direcciones?: unknown;
  direccionPredeterminadaId?: string;
  /** Convierte una cuenta técnica existente por teléfono en cuenta real verificada por el flujo de activación. */
  activarCuentaTecnica?: boolean;
  /** Obligatorio junto a `activarCuentaTecnica`: el backend lo valida contra el último pedido real del teléfono. */
  codigoUltimoPedido?: string;
  passwordTemporal?: boolean;
  /** Alta pública: JWT emitido por POST /auth/registro/verificar tras validar el código de email. */
  verificacionToken?: string;
  /** Alta pública: aceptación expresa de Términos y Política de Privacidad. */
  aceptacionTerminos?: boolean;
  aceptacionPrivacidad?: boolean;
  /** Alta pública: declaración de mayoría de edad (sin fecha de nacimiento). */
  declaraMayorEdad?: boolean;
}): Promise<{ ok: true; user: AuthUser }> {
  const body: Record<string, unknown> = {
    email: data.email,
    password: data.password,
    nombre: String(data.nombre ?? ""),
    telefono: data.telefono != null && String(data.telefono).trim() !== "" ? String(data.telefono) : "",
    dni: String(data.dni ?? ""),
    direccion: String(data.direccion ?? ""),
    calle: String(data.calle ?? ""),
    numero: String(data.numero ?? ""),
    bloque: String(data.bloque ?? ""),
    escalera: String(data.escalera ?? ""),
    piso: String(data.piso ?? ""),
    puerta: String(data.puerta ?? ""),
    cp: String(data.cp ?? ""),
    poblacion: String(data.poblacion ?? ""),
    provincia: String(data.provincia ?? ""),
    pais: String(data.pais ?? "")
  };
  if (data.direccionPredeterminadaId != null && String(data.direccionPredeterminadaId).trim() !== "") {
    body.direccionPredeterminadaId = String(data.direccionPredeterminadaId).trim();
  }
  if (Array.isArray(data.direcciones) && data.direcciones.length > 0) {
    body.direcciones = data.direcciones;
  }
  if (data.activarCuentaTecnica === true) {
    body.activarCuentaTecnica = true;
    if (String(data.codigoUltimoPedido ?? "").trim()) {
      body.codigoUltimoPedido = String(data.codigoUltimoPedido).trim();
    }
  }
  if (data.passwordTemporal === true) {
    body.passwordTemporal = true;
  }
  if (String(data.verificacionToken ?? "").trim()) {
    body.verificacionToken = String(data.verificacionToken).trim();
  }
  if (data.aceptacionTerminos === true) body.aceptacionTerminos = true;
  if (data.aceptacionPrivacidad === true) body.aceptacionPrivacidad = true;
  if (data.declaraMayorEdad === true) body.declaraMayorEdad = true;
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    let msg = `Registro fallido (${res.status})`;
    try {
      const j = (await res.json()) as { error?: string };
      if (typeof j?.error === "string" && j.error.trim()) msg = j.error.trim();
    } catch {
      /* cuerpo no JSON */
    }
    throw new Error(msg);
  }
  return (await res.json()) as { ok: true; user: AuthUser };
}

/**
 * Registro paso 1→2: el backend genera el código, guarda solo su hash y lo envía por email (SMTP).
 * El código nunca viaja en la respuesta.
 */
export async function solicitarCodigoRegistroApi(email: string, declaraMayorEdad: boolean): Promise<{ ok: true; emailEnviado: boolean }> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/auth/registro/solicitar-codigo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: String(email || "").trim().toLowerCase(),
      declaraMayorEdad: declaraMayorEdad === true
    })
  });
  const j = (await res.json().catch(() => ({}))) as { ok?: boolean; emailEnviado?: boolean; error?: string };
  if (!res.ok) throw new Error(typeof j.error === "string" && j.error.trim() ? j.error.trim() : `Solicitud de código fallida (${res.status})`);
  return { ok: true, emailEnviado: j.emailEnviado === true };
}

/** Registro paso 2: valida el código en backend y devuelve el token de verificación para /auth/register. */
export async function verificarCodigoRegistroApi(email: string, codigo: string): Promise<{ ok: true; verificacionToken: string }> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/auth/registro/verificar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: String(email || "").trim().toLowerCase(), codigo: String(codigo || "").trim() })
  });
  const j = (await res.json().catch(() => ({}))) as { ok?: boolean; verificacionToken?: string; error?: string; restantes?: number };
  if (!res.ok || typeof j.verificacionToken !== "string" || !j.verificacionToken) {
    const err = new Error(
      typeof j.error === "string" && j.error.trim() ? j.error.trim() : `Verificación fallida (${res.status})`
    ) as Error & { restantes?: number };
    if (typeof j.restantes === "number") err.restantes = j.restantes;
    throw err;
  }
  return { ok: true, verificacionToken: j.verificacionToken };
}

/**
 * Acceso rápido en checkout paso 1: el backend comprueba teléfono+email, genera el código,
 * guarda solo su hash y lo envía por email (SMTP). El código nunca viaja en la respuesta.
 */
export async function solicitarCodigoAccesoRapidoApi(
  telefono: string,
  email: string
): Promise<{ ok: true; emailEnviado: boolean }> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/auth/acceso-rapido/solicitar-codigo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telefono: String(telefono || "").trim(),
      email: String(email || "").trim().toLowerCase()
    })
  });
  const j = (await res.json().catch(() => ({}))) as { ok?: boolean; emailEnviado?: boolean; error?: string };
  if (!res.ok) throw new Error(typeof j.error === "string" && j.error.trim() ? j.error.trim() : `Solicitud de código fallida (${res.status})`);
  return { ok: true, emailEnviado: j.emailEnviado === true };
}

/** Acceso rápido paso 2: valida el código en backend (un solo uso, caducidad y límite de intentos en servidor). */
export async function verificarCodigoAccesoRapidoApi(
  telefono: string,
  codigo: string
): Promise<{ ok: true }> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/auth/acceso-rapido/verificar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telefono: String(telefono || "").trim(),
      codigo: String(codigo || "").trim()
    })
  });
  const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; restantes?: number };
  if (!res.ok || j.ok !== true) {
    const err = new Error(
      typeof j.error === "string" && j.error.trim() ? j.error.trim() : `Verificación fallida (${res.status})`
    ) as Error & { restantes?: number };
    if (typeof j.restantes === "number") err.restantes = j.restantes;
    throw err;
  }
  return { ok: true };
}

export class PerfilApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Perfil no disponible (${status})`);
    this.name = "PerfilApiError";
    this.status = status;
  }
}

export function esErrorPerfilNoAutorizado(error: unknown): boolean {
  return error instanceof PerfilApiError && (error.status === 401 || error.status === 403);
}

export async function obtenerPerfilApi(token?: string): Promise<UsuarioPerfilCompletoApi> {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : buildOptionalAuthHeaders();
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/me`, { headers });
  if (!res.ok) throw new PerfilApiError(res.status);
  return (await res.json()) as UsuarioPerfilCompletoApi;
}

export async function cambiarPasswordAutenticadoApi(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: true; token?: string }> {
  if (!hasClientSession()) throw new Error("Tu sesión no es válida. Inicia sesión de nuevo.");

  const res = await fetchMaikaApi(`${getApiBaseUrl()}/auth/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...buildOptionalAuthHeaders() },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    let msg = res.status === 401 || res.status === 403
      ? "Tu sesión no es válida. Inicia sesión de nuevo."
      : `Cambio de contraseña fallido (${res.status})`;
    try {
      const j = (await res.json()) as { error?: string };
      if (typeof j?.error === "string" && j.error.trim() && res.status !== 401 && res.status !== 403) {
        msg = j.error.trim();
      }
    } catch {
      /* cuerpo no JSON */
    }
    throw new Error(msg);
  }
  const out = (await res.json()) as { ok: true; token?: string };
  markClientSessionActive();
  if (out.token) syncJwtSessionFromLogin(out.token);
  return out;
}

export async function solicitarRecuperacionPasswordApi(email: string, telefono?: string): Promise<{
  message: string;
  devResetLink?: string;
  devEmailFallo?: boolean;
  sameBrowserResetLink?: string;
  cuentaNoExiste?: boolean;
  cuentaBloqueada?: boolean;
}> {
  const emailNorm = normalizarIdentificadorLoginCliente(String(email ?? ""));
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      // El acceso rápido identifica la cuenta por teléfono; así no depende de un email antiguo guardado en el navegador.
      email: telefono ? "" : emailNorm,
      ...(telefono ? { telefono } : {}),
      ...(typeof window !== "undefined" ? { frontendOrigin: window.location.origin } : {})
    })
  });
  if (!res.ok) {
    let msg = `Solicitud de recuperación fallida (${res.status})`;
    try {
      const j = (await res.json()) as { error?: string };
      if (typeof j?.error === "string" && j.error.trim()) {
        msg = j.error.trim();
      }
    } catch {
      /* cuerpo no JSON */
    }
    throw new Error(msg);
  }
  return (await res.json()) as {
    message: string;
    devResetLink?: string;
    devEmailFallo?: boolean;
    sameBrowserResetLink?: string;
    cuentaNoExiste?: boolean;
    cuentaBloqueada?: boolean;
  };
}

export async function resetPasswordApi(token: string, newPassword: string): Promise<{ message: string }> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ token, newPassword })
  });
  if (!res.ok) {
    let msg = `Restablecimiento de contraseña fallido (${res.status})`;
    try {
      const j = (await res.json()) as { error?: string };
      if (typeof j?.error === "string" && j.error.trim()) msg = j.error.trim();
    } catch {
      /* cuerpo no JSON */
    }
    throw new Error(msg);
  }
  return (await res.json()) as { message: string };
}

export async function actualizarPerfilUsuarioApi(
  body: Record<string, unknown>,
  opts?: { idempotencyKey?: string }
): Promise<{ ok: true; usuario: UsuarioPerfilCompletoApi }> {
  if (!hasClientSession()) throw new Error("Sin sesión");
  const idempotencyKey = String(opts?.idempotencyKey || "").trim();
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...buildOptionalAuthHeaders(),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {})
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Actualización de perfil fallida (${res.status})`);
  return (await res.json()) as { ok: true; usuario: UsuarioPerfilCompletoApi };
}

export async function actualizarUsuarioPorIdApi(
  id: string | number,
  body: Record<string, unknown>
): Promise<{ ok: true; usuario: UsuarioPerfilCompletoApi }> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/usuarios/${encodeURIComponent(String(id))}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (res.status === 401 || res.status === 403) {
    clearAdminSessionLocalAndCache();
  }
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.text()).trim().slice(0, 240);
    } catch {
      /* ignorar */
    }
    throw new Error(
      detail ? `Actualización de usuario (${res.status}): ${detail}` : `Actualización de usuario (${res.status})`
    );
  }
  return (await res.json()) as { ok: true; usuario: UsuarioPerfilCompletoApi };
}

/**
 * Devolver acceso desde gestión: el servidor genera un enlace de restablecimiento
 * (token único, 15 min, un solo uso). El admin lo envía al cliente; nunca se transmite
 * una contraseña en claro. Requiere sesión admin (misma regla que GET /usuarios).
 */
export async function solicitarResetAccesoAdminApi(
  id: string | number
): Promise<{ ok: true; resetLink: string; expiresInMin: number }> {
  const res = await fetchMaikaApi(
    `${getApiBaseUrl()}/usuarios/${encodeURIComponent(String(id))}/reset-acceso`,
    { method: "POST", headers: { "Content-Type": "application/json" } }
  );
  if (res.status === 401 || res.status === 403) {
    clearAdminSessionLocalAndCache();
  }
  if (!res.ok) {
    throw new Error(`No se pudo generar el enlace de recuperación (${res.status})`);
  }
  return (await res.json()) as { ok: true; resetLink: string; expiresInMin: number };
}

/** Compat: solo envía `direccion` al perfil (el servidor acepta el cuerpo parcial). */
export async function actualizarDireccionApi(direccion: string): Promise<{ ok: true; usuario: UsuarioPerfilCompletoApi }> {
  return actualizarPerfilUsuarioApi({ direccion });
}

/** Listado del backend con el mismo modelo que maika (sin contraseña). */
export type UsuarioListItemApi = UsuarioPerfilCompletoApi;

export async function listarUsuariosApi(): Promise<UsuarioListItemApi[]> {
  const url = `${getApiBaseUrl()}/usuarios`;
  const headers: Record<string, string> = { Accept: "application/json" };
  console.log("[listarUsuariosApi] GET", url);
  const res = await fetchMaikaApi(url, {
    method: "GET",
    headers,
    cache: "no-store",
    mode: "cors"
  });
  if (res.status === 401 || res.status === 403) {
    clearAdminSessionLocalAndCache();
  }
  if (!res.ok) throw new Error(`Listado usuarios (${res.status})`);
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as UsuarioListItemApi[]) : [];
}

/** Borra el usuario en el servidor (usuarios.json). Requiere JWT (misma regla que GET /usuarios). */
export async function eliminarUsuarioBackendApi(
  _token: string,
  id: string | number
): Promise<{ ok: true } | { ok: false; status: number }> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/usuarios/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
    headers: { Accept: "application/json" }
  });
  if (res.status === 401 || res.status === 403) {
    clearAdminSessionLocalAndCache();
  }
  if (res.status === 404) return { ok: true };
  if (res.ok) return { ok: true };
  return { ok: false, status: res.status };
}

/** Bloquea o desbloquea un usuario en el servidor. Requiere JWT. */
export async function bloquearUsuarioBackendApi(
  id: string | number,
  bloquear: boolean,
  motivo?: string
): Promise<{ ok: true; bloqueado: boolean } | { ok: false; status: number }> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/usuarios/${encodeURIComponent(String(id))}/bloqueo`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ bloquear, motivo: motivo ?? "" })
  });
  if (res.status === 401 || res.status === 403) {
    clearAdminSessionLocalAndCache();
  }
  if (res.ok) {
    const j = (await res.json()) as { ok: true; bloqueado: boolean };
    return { ok: true, bloqueado: j.bloqueado };
  }
  return { ok: false, status: res.status };
}
