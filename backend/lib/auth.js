import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import {
  JWT_SECRET,
  JWT_CLIENT_EXPIRES_IN,
  CLIENT_SESSION_MAX_AGE_MS,
  IS_PRODUCTION,
  SESSION_COOKIE_NAME,
  ADMIN_COOKIE_NAME
} from "./env.js";
import { readUsuarios } from "./storage.js";

/**
 * `scope: "checkout"` marca una sesión de alcance reducido (creada sin credenciales reales, solo con el
 * teléfono, para poder completar un checkout como invitado). `authMiddleware` la rechaza salvo que la ruta
 * la admita explícitamente vía `permitirScopeCheckout`. Sin `scope` (o `scope: "full"`) es una sesión normal.
 */
export function signClientSessionJwt(user, { scope } = {}) {
  const payload = { id: user.id, email: user.email, tokenVersion: Number(user.tokenVersion) || 0 };
  if (scope === "checkout") payload.scope = "checkout";
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_CLIENT_EXPIRES_IN });
}

export function setClientSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PRODUCTION,
    maxAge: CLIENT_SESSION_MAX_AGE_MS,
    path: "/"
  });
}

export function clearClientSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    sameSite: "lax",
    secure: IS_PRODUCTION,
    path: "/"
  });
}

export function parseCookies(req) {
  const header = String(req.headers.cookie || "");
  const out = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    if (!key) continue;
    const value = part.slice(idx + 1).trim();
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
  }
  return out;
}

export function clientSessionTokenDesdeCookie(req) {
  return String(parseCookies(req)[SESSION_COOKIE_NAME] || "").trim();
}

export function adminTokenDesdeCookie(req) {
  return String(parseCookies(req)[ADMIN_COOKIE_NAME] || "").trim();
}

/**
 * `permitirScopeCheckout`: si es `false` (por defecto), un JWT con `scope: "checkout"` (emitido por
 * `POST /auth/checkout-session`, sin credenciales reales) se rechaza con 403 — esa sesión solo sirve
 * para las rutas del propio checkout (`authMiddlewareCheckoutOk`), nunca para leer perfil/pedidos/admin.
 */
async function authMiddlewareInterno(req, res, next, { permitirScopeCheckout }) {
  let token = clientSessionTokenDesdeCookie(req);
  if (!token) {
    const auth = req.headers.authorization;
    if (auth) token = String(auth).split(" ")[1];
  }
  if (!token) {
    res.status(401).json({ error: "No token" });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = String(decoded?.id ?? "").trim();
    if (!userId) {
      res.status(401).json({ error: "Token inválido" });
      return;
    }
    if (decoded?.scope === "checkout" && !permitirScopeCheckout) {
      res.status(403).json({ error: "Esta sesión no tiene permiso para esta operación" });
      return;
    }
    const usuarios = await readUsuarios();
    const user = usuarios.find((u) => String(u?.id) === userId);
    if (!user) {
      res.status(401).json({ error: "Token inválido" });
      return;
    }
    const tokenVersionUsuario = Number.isFinite(Number(user.tokenVersion))
      ? Math.max(0, Math.floor(Number(user.tokenVersion)))
      : 0;
    const tokenVersionJwt = Number.isFinite(Number(decoded?.tokenVersion))
      ? Math.max(0, Math.floor(Number(decoded.tokenVersion)))
      : 0;
    if (tokenVersionUsuario !== tokenVersionJwt) {
      res.status(401).json({ error: "Token inválido" });
      return;
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}

export async function authMiddleware(req, res, next) {
  return authMiddlewareInterno(req, res, next, { permitirScopeCheckout: false });
}

/** Igual que `authMiddleware`, pero admite además sesiones de checkout (`scope: "checkout"`). Usar solo en las rutas imprescindibles para completar un pedido. */
export async function authMiddlewareCheckoutOk(req, res, next) {
  return authMiddlewareInterno(req, res, next, { permitirScopeCheckout: true });
}

export function requireAdmin(req, res, next) {
  const token = adminTokenDesdeCookie(req);
  if (!token) {
    res.status(403).json({ error: "Requiere sesión de administrador" });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded?.role !== "admin" && decoded?.panelAdmin !== true) {
      res.status(403).json({ error: "Requiere permisos de administrador" });
      return;
    }
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ error: "Sesión admin inválida" });
  }
}

/** Alias semántico: mismas rutas (`/usuarios`, `/admin/productos`) usan la misma sesión admin. */
export const usuariosAccessMiddleware = requireAdmin;

export function delayRespuestaFallida(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

/** Compara dos secretos en tiempo constante (hash previo: evita filtrar la longitud real). */
export function timingSafeEqualStrings(a, b) {
  const bufA = crypto.createHash("sha256").update(String(a ?? "")).digest();
  const bufB = crypto.createHash("sha256").update(String(b ?? "")).digest();
  return crypto.timingSafeEqual(bufA, bufB);
}

export function hashResetToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

/**
 * Bloqueo por teléfono (no solo IP) al activar una cuenta técnica con código de último pedido incorrecto.
 * En memoria: coherente con el resto de protecciones de este endpoint, no persiste entre reinicios del servidor.
 */
const ACTIVACION_TECNICA_MAX_INTENTOS = 3;
const ACTIVACION_TECNICA_BLOQUEO_MS = 15 * 60 * 1000;
const _activacionTecnicaIntentos = new Map();

export function activacionTecnicaBloqueadaMsRestantes(tel9) {
  const entry = _activacionTecnicaIntentos.get(tel9);
  if (!entry) return 0;
  const restante = entry.bloqueadoHasta - Date.now();
  return restante > 0 ? restante : 0;
}

export function registrarIntentoActivacionTecnicaFallido(tel9) {
  const entry = _activacionTecnicaIntentos.get(tel9) || { count: 0, bloqueadoHasta: 0 };
  entry.count += 1;
  if (entry.count >= ACTIVACION_TECNICA_MAX_INTENTOS) {
    entry.bloqueadoHasta = Date.now() + ACTIVACION_TECNICA_BLOQUEO_MS;
  }
  _activacionTecnicaIntentos.set(tel9, entry);
}

export function limpiarIntentosActivacionTecnica(tel9) {
  _activacionTecnicaIntentos.delete(tel9);
}
