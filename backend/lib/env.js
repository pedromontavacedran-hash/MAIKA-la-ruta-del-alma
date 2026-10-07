import "dotenv/config";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

export const PORT = Number(process.env.PORT || 3001);
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const __filename = fileURLToPath(import.meta.url);
/** Raíz de `backend/` (este archivo vive en `backend/lib/`). */
export const BACKEND_DIR = path.dirname(path.dirname(__filename));

// Raíz del repo (maika/.env) y opcional backend/.env; la segunda solo rellena claves que no existan.
dotenv.config({ path: path.join(BACKEND_DIR, "..", ".env") });
dotenv.config({ path: path.join(BACKEND_DIR, ".env") });
if (process.env.MAIKA_USER_DATA) {
  dotenv.config({
    path: path.join(process.env.MAIKA_USER_DATA, ".env"),
    override: true
  });
}

process.on("uncaughtException", (err) => {
   
  console.error("[maika-backend] uncaughtException", err);
});
process.on("unhandledRejection", (reason, promise) => {
   
  console.error("[maika-backend] unhandledRejection", reason, promise);
});

if (!String(process.env.OPENAI_API_KEY || "").trim()) {
   
  console.error(
    "[maika-backend] OPENAI_API_KEY no definida: interpretación por IA desactivada hasta configurar la clave (.env o userData)."
  );
}

if (process.env.MAIKA_QUIET !== "1") {
  // Longitud de la clave (0 = vacía o .env no encontrado).
  console.log("[maika-backend] API KEY length:", (process.env.OPENAI_API_KEY || "").length);
}

/**
 * Modo pruebas (solo desarrollo local): `MAIKA_PRUEBAS_SIN_LIMITES=1` desactiva los límites
 * diarios de horóscopo/sueños y los rate-limits de sugerencias, interpretación e imagen de sueño.
 * Se lee en cada llamada (no en import) para que tests puedan activarlo/desactivarlo en caliente.
 * Blindaje: con `NODE_ENV=production` el flag se ignora siempre — los límites antiabuso no pueden
 * quedar desactivados en producción por un `.env` heredado o una variable de entorno olvidada.
 */
export function limitesPruebaDesactivados() {
  if (String(process.env.MAIKA_PRUEBAS_SIN_LIMITES || "").trim() !== "1") return false;
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[maika-backend] MAIKA_PRUEBAS_SIN_LIMITES=1 ignorado en producción: límites antiabuso ACTIVOS"
    );
    return false;
  }
  return true;
}

if (limitesPruebaDesactivados() && process.env.MAIKA_QUIET !== "1") {
  console.log("[maika-backend] MODO PRUEBAS: límites diarios y rate-limits de experiencias DESACTIVADOS");
}

export const dataDir = process.env.MAIKA_USER_DATA
  ? path.join(process.env.MAIKA_USER_DATA, "maika-backend-data")
  : path.join(BACKEND_DIR, "data");

export const pedidosFile = path.join(dataDir, "pedidos.json");
/** Mapa `Idempotency-Key` → pedido devuelto la primera vez (persistente; sobrevive reinicio del servidor). */
export const idempotenciaPedidosFile = path.join(dataDir, "idempotenciaPedidos.json");
/** Mapa `Idempotency-Key` → respuesta de PATCH /me (persistente; evita re-aplicar reintentos). */
export const idempotenciaPerfilFile = path.join(dataDir, "idempotenciaPerfil.json");
export const carritosFile = path.join(dataDir, "carritos.json");
export const usuariosFile = path.join(dataDir, "usuarios.json");
export const productosFile = path.join(dataDir, "productos.json");
export const categoriasFile = path.join(dataDir, "categorias.json");
export const subcategoriasFile = path.join(dataDir, "subcategorias.json");
/** Buzón de "Sugerir una mejora" del menú: escritura solo autenticada; lectura solo admin. */
export const sugerenciasFile = path.join(dataDir, "sugerencias.json");
/** `public/tienda/<categoria>/[<subcategoria>/]` — fotos reales de producto, servidas por Vite en dev y bundleadas en build. */
export const publicTiendaDir = path.join(BACKEND_DIR, "..", "public", "tienda");
/** `jti` de tokens premium con lectura profunda ya generada (permite chat con el mismo JWT hasta que caduque). */
export const premiumSeguimientoOkFile = path.join(dataDir, "premium_jti_seguimiento_ok.json");
export const premiumJtiLegacyUsedFile = path.join(dataDir, "premium_unlock_jtis.json");
/** Mapa identificador → timestamp de la última interpretación gratuita (límite 1 sueño / 24 h). */
export const suenoUsoGratuitoFile = path.join(dataDir, "sueno_uso_gratuito.json");
/** Mapa `usr:<id>` → { fecha, signo } de la lectura de horóscopo del día (límite 1 / día natural ES). */
export const horoscopoUsoDiarioFile = path.join(dataDir, "horoscopo_uso_diario.json");
/** Estadística propia y agregada por día (`lib/analytics.js`): sin IPs, sin ids de persona, sin contenido. */
export const analyticsFile = path.join(dataDir, "analytics.json");

export const CATEGORIAS_PRODUCTO = ["velas", "inciensos", "figuras", "kits", "joyas"];
export const IS_PRODUCTION = process.env.NODE_ENV === "production";

function requireEnvSecretInProduction(name) {
  const value = String(process.env[name] || "").trim();
  if (IS_PRODUCTION && !value) {
    throw new Error(`[maika-backend] Falta ${name}. Configura este secreto antes de arrancar en producción.`);
  }
  return value;
}

/** Secreto desde .env; en dev opcionalmente efímero (sin literales en código). */
function resolveSecret(name, { ephemeralDev = false } = {}) {
  const value = requireEnvSecretInProduction(name);
  if (value) return value;
  if (ephemeralDev) {
    const ephemeral = crypto.randomBytes(32).toString("hex");
     
    console.warn(
      `[maika-backend] ${name} no definida en .env; secreto temporal de desarrollo (solo esta sesión).`
    );
    return ephemeral;
  }
  throw new Error(
    `[maika-backend] Falta ${name}. Copia .env.example a .env y define ${name}.`
  );
}

export const JWT_SECRET = resolveSecret("JWT_SECRET", { ephemeralDev: true });
/** Duración del JWT de sesión de cliente (`login` / `PATCH /auth/password`). Ej.: `1d`, `12h`, `7d`. */
export const JWT_CLIENT_EXPIRES_IN = String(process.env.JWT_CLIENT_EXPIRES_IN || "1d").trim() || "1d";
/** Firma de tokens de desbloqueo premium (lectura profunda). En producción define `MAIKA_PREMIUM_JWT_SECRET` aparte de `JWT_SECRET`. */
export const PREMIUM_JWT_SECRET = requireEnvSecretInProduction("MAIKA_PREMIUM_JWT_SECRET") || (IS_PRODUCTION ? JWT_SECRET : resolveSecret("JWT_SECRET", { ephemeralDev: true }));
/** Clave del panel: solo vive en backend. En producción es obligatoria. */
export const ADMIN_PANEL_PASSWORD = resolveSecret("MAIKA_ADMIN_PANEL_PASSWORD");
/** Coste bcrypt para nuevos hashes (4–12). Menor = login más rápido; en producción suele usarse 10–12. */
export const BCRYPT_ROUNDS = Number.isFinite(Number(process.env.BCRYPT_ROUNDS))
  ? Math.min(12, Math.max(4, Number(process.env.BCRYPT_ROUNDS)))
  : 10;
/** Hash dummy: `bcrypt.compare` en login siempre corre contra un hash real (mitiga fugas por tiempo). */
export const LOGIN_TIMING_DUMMY_HASH = bcrypt.hashSync("__maika_login_timing_dummy__", BCRYPT_ROUNDS);

export const IDEMPOTENCIA_TTL_MS = 1000 * 60 * 60 * 48;
export const IDEMPOTENCIA_PRUNE_INTERVAL_MS = 1000 * 60 * 5;
export const IDEMPOTENCIA_MAX_KEYS = 5000;
export const IDEMPOTENCIA_INFLIGHT_TTL_MS = 30_000;
export const PASSWORD_TEMPORAL_TTL_MS = 10 * 60 * 1000;
/** Longitud máxima de contraseña (evita payloads absurdos en bcrypt). */
export const PASSWORD_MAX_LEN = 128;

export const ADMIN_COOKIE_NAME = "admin_token";
export const ADMIN_COOKIE_MAX_AGE_MS = 30 * 60 * 1000;
export const SESSION_COOKIE_NAME = "maika_session";

function jwtExpiresInMs(expiresIn) {
  const m = String(expiresIn || "1d").match(/^(\d+)([dhms])$/);
  if (!m) return 86400000;
  const n = Number(m[1]);
  const unit = m[2];
  if (unit === "d") return n * 86400000;
  if (unit === "h") return n * 3600000;
  if (unit === "m") return n * 60000;
  if (unit === "s") return n * 1000;
  return 86400000;
}

export const CLIENT_SESSION_MAX_AGE_MS = jwtExpiresInMs(JWT_CLIENT_EXPIRES_IN);

if (process.env.DEBUG_OPENAI_KEY === "1" && process.env.MAIKA_QUIET !== "1") {
  const k = String(process.env.OPENAI_API_KEY || "").trim();
  console.log(
    "[maika] OPENAI_API_KEY:",
    k ? `configurada (${k.slice(0, 7)}…${k.slice(-4)})` : "no configurada (revisa .env en la raíz o backend/)"
  );
}
