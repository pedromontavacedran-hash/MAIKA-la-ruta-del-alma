import rateLimit from "express-rate-limit";

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
  message: {
    error: "Datos inválidos"
  }
});

export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
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
  message: {
    ok: false,
    error: "Demasiadas imágenes seguidas. Espera unos minutos y vuelve a intentarlo."
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
