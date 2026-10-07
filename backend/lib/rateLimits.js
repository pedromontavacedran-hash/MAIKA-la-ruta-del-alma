import rateLimit from "express-rate-limit";
import { normalizarTelefono } from "./validacion.js";
import { limitesPruebaDesactivados } from "./env.js";

/**
 * Tras desbloquear un usuario desde admin, sus intentos anteriores no deben contar:
 * marcamos su email/teléfono durante 30 min y los limiters saltan el conteo para esos
 * identificadores (el límite sigue activo para el resto de IPs/identificadores).
 */
const DESBLOQUEO_GRACIA_MS = 30 * 60 * 1000;
const desbloqueosRecientes = new Map(); // identificador normalizado -> timestamp fin de gracia

export function marcarDesbloqueoReciente(...identificadores) {
  const hasta = Date.now() + DESBLOQUEO_GRACIA_MS;
  for (const id of identificadores) {
    const k = String(id || "").trim().toLowerCase();
    if (k) desbloqueosRecientes.set(k, hasta);
  }
}

function recienDesbloqueado(req) {
  const now = Date.now();
  const emailRaw = String(req.body?.email || "").trim().toLowerCase();
  const telRaw = String(req.body?.telefono || "").trim();
  // En /auth/login el campo `email` puede llevar teléfono; en forgot-password puede ir en `telefono`.
  const candidatos = [emailRaw, normalizarTelefono(emailRaw), normalizarTelefono(telRaw)];
  for (const k of candidatos) {
    if (!k) continue;
    const exp = desbloqueosRecientes.get(k);
    if (exp && exp > now) return true;
    if (exp && exp <= now) desbloqueosRecientes.delete(k);
  }
  return false;
}

export const adminLoginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiados intentos de acceso admin. Espera unos minutos y vuelve a intentarlo."
  }
});

export const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Datos inválidos"
  }
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: recienDesbloqueado,
  message: {
    error: "Demasiados intentos de recuperación. Espera unos minutos o escríbenos por WhatsApp."
  }
});

export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: recienDesbloqueado,
  message: {
    error: "Datos inválidos"
  }
});

export const openResetLinkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

export const testEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiadas pruebas de email. Espera unos minutos y vuelve a intentarlo."
  }
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: recienDesbloqueado,
  message: {
    error: "Demasiados intentos, prueba más tarde"
  }
});

/**
 * Alta normal (sin `activarCuentaTecnica`): sin esto, peticiones ilimitadas fuerzan un `bcrypt.hash`
 * por intento (caro a propósito) y permiten automatizar la enumeración de emails vía "Usuario ya existe".
 */
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiados intentos, prueba más tarde"
  }
});

export const checkoutSessionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiadas solicitudes de checkout. Espera unos minutos y vuelve a intentarlo."
  }
});

export const estadoTelefonoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiadas consultas. Espera unos minutos y vuelve a intentarlo."
  }
});

/**
 * `/sueno/imagen` y `/sueno/interpretar` llaman a la API de OpenAI (coste real) sin requerir sesión —
 * es una función pública de la tienda. Sin límite, cualquiera podía agotar el saldo de OpenAI a base
 * de peticiones. DALL-E cuesta más por llamada que un texto corto, de ahí el límite más bajo en imagen.
 */
export const suenoInterpretarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => limitesPruebaDesactivados(),
  message: {
    ok: false,
    error: "Demasiadas interpretaciones seguidas. Espera unos minutos y vuelve a intentarlo."
  }
});

export const suenoImagenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 6,
  standardHeaders: true,
  legacyHeaders: false,
  /* OJO: con el modo pruebas activo cada imagen llama a DALL-E (coste real por llamada). */
  skip: () => limitesPruebaDesactivados(),
  message: {
    ok: false,
    error: "Demasiadas imágenes seguidas. Espera unos minutos y vuelve a intentarlo."
  }
});

/** «Explora y pregunta» de Rutas del Alma llama a la IA de texto (coste real) sin sesión — igual que /sueno/interpretar. */
export const rutasDelAlmaChatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => limitesPruebaDesactivados(),
  message: {
    ok: false,
    error: "Demasiadas preguntas seguidas. Espera unos minutos y vuelve a intentarlo."
  }
});

/** Segunda capa de límite en /auth/register (activarCuentaTecnica): por IP, además del límite por teléfono. */
export const registroActivarTecnicaLimiterIp = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiados intentos. Espera unos minutos y vuelve a intentarlo."
  }
});

/** Solicitud/reenvío del código de verificación de registro: frena spam de emails salientes. */
export const registroCodigoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => limitesPruebaDesactivados(),
  message: {
    error: "Demasiadas solicitudes de código. Espera unos minutos y vuelve a intentarlo."
  }
});

/** Intento de verificación del código de registro: frena fuerza bruta por IP (además del tope por email). */
export const registroVerificarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => limitesPruebaDesactivados(),
  message: {
    error: "Demasiados intentos de verificación. Espera unos minutos y vuelve a intentarlo."
  }
});

/** Solicitud/reenvío del código de «acceso rápido» (checkout): frena spam de emails salientes. */
export const accesoRapidoCodigoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => limitesPruebaDesactivados(),
  message: {
    error: "Demasiadas solicitudes de código. Espera unos minutos y vuelve a intentarlo."
  }
});

/** Intento de verificación del código de «acceso rápido»: frena fuerza bruta por IP. */
export const accesoRapidoVerificarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => limitesPruebaDesactivados(),
  message: {
    error: "Demasiados intentos de verificación. Espera unos minutos y vuelve a intentarlo."
  }
});

/**
 * Analítica propia: generoso (cada cambio de sección dispara un evento) pero frena abuso.
 * La IP solo vive en memoria del limiter; `lib/analytics.js` nunca la persiste.
 */
export const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => limitesPruebaDesactivados(),
  message: {
    ok: false,
    error: "Demasiados eventos. Espera unos minutos."
  }
});

/** POST /sugerencias exige sesión; el límite sigue frenando spam desde cuentas autenticadas. */
export const sugerenciaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => limitesPruebaDesactivados(),
  message: {
    error: "Demasiadas sugerencias seguidas. Espera unos minutos y vuelve a intentarlo."
  }
});
