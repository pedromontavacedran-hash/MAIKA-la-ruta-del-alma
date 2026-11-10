import { Router } from "express";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  JWT_SECRET,
  IS_PRODUCTION,
  ADMIN_PANEL_PASSWORD,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_MAX_AGE_MS,
  ADMIN_COOKIE_REMEMBER_MAX_AGE_MS,
  PASSWORD_MAX_LEN,
  PASSWORD_TEMPORAL_TTL_MS,
  BCRYPT_ROUNDS,
  LOGIN_TIMING_DUMMY_HASH,
  FRONTEND_URL
} from "../lib/env.js";
import {
  normalizarTelefono,
  normalizarEmailParaBusquedaLogin,
  tieneEmailRealMaika,
  esEmailVerificable,
  emailCheckoutAutomaticoServidor
} from "../lib/validacion.js";
import { readUsuarios, updateUsuarios, readPedidos } from "../lib/storage.js";
import {
  signClientSessionJwt,
  setClientSessionCookie,
  clearClientSessionCookie,
  clientSessionTokenDesdeCookie,
  adminTokenDesdeCookie,
  authMiddleware,
  requireAdmin,
  getAdminTokenVersion,
  revocarSesionesAdmin,
  tokenAdminEsVigente,
  delayRespuestaFallida,
  generateResetToken,
  hashResetToken,
  timingSafeEqualStrings,
  activacionTecnicaBloqueadaMsRestantes,
  registrarIntentoActivacionTecnicaFallido,
  limpiarIntentosActivacionTecnica
} from "../lib/auth.js";
import {
  esOrigenFrontendPermitido,
  resolveFrontendBaseUrlFromRequest,
  buildResetPasswordPageUrl,
  buildResetEmailClickHref
} from "../lib/origins.js";
import { getSmtpTransporter, enviarEmailResetPassword, enviarEmailCodigoRegistro, enviarEmailCodigoAccesoRapido } from "../lib/email.js";
import { pickUsuarioPerfilServidor } from "../utils/pickUsuarioPerfilServidor.js";
import {
  adminLoginRateLimit,
  checkoutSessionLimiter,
  loginLimiter,
  estadoTelefonoLimiter,
  openResetLinkLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  passwordLimiter,
  registroActivarTecnicaLimiterIp,
  registerLimiter,
  registroCodigoLimiter,
  registroVerificarLimiter,
  accesoRapidoCodigoLimiter,
  accesoRapidoVerificarLimiter,
  testEmailLimiter
} from "../lib/rateLimits.js";

export const authRouter = Router();

/* ── Verificación de email en el registro (server-side) ────────────────────
 * El código lo genera el servidor con crypto.randomInt y solo se guarda su
 * hash SHA-256 en memoria: nunca viaja por URL, logs ni respuestas de la API.
 * Tras verificarlo se emite un JWT corto (`scope: "registro"`) que
 * POST /auth/register exige a todo alta que no sea de administrador.
 */
const REGISTRO_CODIGO_TTL_MS = 10 * 60 * 1000;
const REGISTRO_CODIGO_MAX_INTENTOS = 5;
const REGISTRO_CODIGO_MAX_ENVIOS = 3;
const REGISTRO_CODIGO_ENVIO_VENTANA_MS = 15 * 60 * 1000;
const REGISTRO_VERIFICACION_TOKEN_TTL = "15m";
/** email normalizado -> { hash, expiraEn, intentos, envios, primerEnvioEn } */
const registroVerificaciones = new Map();

function hashCodigoRegistro(codigo) {
  return crypto.createHash("sha256").update(String(codigo)).digest("hex");
}

function limpiarRegistroVerificaciones() {
  const ahora = Date.now();
  for (const [email, v] of registroVerificaciones) {
    if (!v || v.expiraEn <= ahora) registroVerificaciones.delete(email);
  }
}

/** `true` si la petición lleva una cookie de admin válida (alta desde gestión: sin verificación ni aceptación). */
function esAdminAutenticado(req) {
  try {
    const token = adminTokenDesdeCookie(req);
    if (!token) return false;
    const decoded = jwt.verify(token, JWT_SECRET);
    return (decoded?.role === "admin" || decoded?.panelAdmin === true) && tokenAdminEsVigente(decoded);
  } catch {
    return false;
  }
}

/** Solicita/reenvía el código de verificación. Nunca devuelve el código. */
authRouter.post("/auth/registro/solicitar-codigo", registroCodigoLimiter, async (req, res) => {
  const emailNorm = String(req.body?.email || "").trim().toLowerCase();
  if (!esEmailVerificable(emailNorm)) {
    res.status(400).json({ error: "Indica un correo electrónico válido" });
    return;
  }
  if (req.body?.declaraMayorEdad !== true) {
    res.status(400).json({ error: "Debes declarar que eres mayor de 18 años" });
    return;
  }
  limpiarRegistroVerificaciones();
  const prev = registroVerificaciones.get(emailNorm);
  const ventanaActiva = prev && Date.now() - prev.primerEnvioEn < REGISTRO_CODIGO_ENVIO_VENTANA_MS;
  if (ventanaActiva && prev.envios >= REGISTRO_CODIGO_MAX_ENVIOS) {
    res.status(429).json({ error: "Has solicitado demasiados códigos. Espera unos minutos." });
    return;
  }
  const codigo = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  registroVerificaciones.set(emailNorm, {
    hash: hashCodigoRegistro(codigo),
    expiraEn: Date.now() + REGISTRO_CODIGO_TTL_MS,
    intentos: 0,
    envios: ventanaActiva ? prev.envios + 1 : 1,
    primerEnvioEn: ventanaActiva ? prev.primerEnvioEn : Date.now()
  });
  if (process.env.NODE_ENV === "test") {
    // Solo tests: el código queda accesible para el harness, nunca en la respuesta.
    (globalThis.__MAIKA_TEST_REGISTRO_CODIGOS__ ||= {})[emailNorm] = codigo;
  }
  let enviado = false;
  try {
    enviado = await enviarEmailCodigoRegistro(emailNorm, codigo);
  } catch {
    enviado = false;
  }
  if (!enviado && !IS_PRODUCTION && process.env.NODE_ENV !== "test" && process.env.MAIKA_QUIET !== "1") {
    console.warn("[maika-backend] SMTP no configurado: no se pudo enviar el código de registro.");
  }
  res.json({ ok: true, emailEnviado: enviado });
});

/** Valida el código (un solo uso, caducidad 10 min, máx. 5 intentos) y emite el token de verificación. */
authRouter.post("/auth/registro/verificar", registroVerificarLimiter, (req, res) => {
  const emailNorm = String(req.body?.email || "").trim().toLowerCase();
  const codigo = String(req.body?.codigo || "").trim();
  if (!esEmailVerificable(emailNorm) || !/^\d{6}$/.test(codigo)) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  limpiarRegistroVerificaciones();
  const entrada = registroVerificaciones.get(emailNorm);
  if (!entrada) {
    res.status(400).json({ error: "codigo_invalido" });
    return;
  }
  if (entrada.expiraEn <= Date.now()) {
    registroVerificaciones.delete(emailNorm);
    res.status(400).json({ error: "codigo_caducado" });
    return;
  }
  entrada.intentos += 1;
  if (entrada.intentos > REGISTRO_CODIGO_MAX_INTENTOS) {
    registroVerificaciones.delete(emailNorm);
    res.status(429).json({ error: "demasiados_intentos" });
    return;
  }
  if (!timingSafeEqualStrings(entrada.hash, hashCodigoRegistro(codigo))) {
    res.status(400).json({
      error: "codigo_invalido",
      restantes: Math.max(0, REGISTRO_CODIGO_MAX_INTENTOS - entrada.intentos)
    });
    return;
  }
  registroVerificaciones.delete(emailNorm);
  const verificacionToken = jwt.sign(
    { email: emailNorm, scope: "registro" },
    JWT_SECRET,
    { expiresIn: REGISTRO_VERIFICACION_TOKEN_TTL }
  );
  res.json({ ok: true, verificacionToken });
});

/* ── Código de «acceso rápido» en checkout (server-side) ───────────────────
 * Mismo patrón que el registro: código generado con crypto.randomInt, solo
 * se guarda su hash SHA-256 en memoria, caduca en 10 min, máx. 5 intentos,
 * un solo uso. Nunca viaja por URL, logs ni respuestas de la API.
 */
const ACCESO_CODIGO_TTL_MS = 10 * 60 * 1000;
const ACCESO_CODIGO_MAX_INTENTOS = 5;
const ACCESO_CODIGO_MAX_ENVIOS = 3;
const ACCESO_CODIGO_ENVIO_VENTANA_MS = 15 * 60 * 1000;
/** teléfono normalizado -> { hash, expiraEn, intentos, envios, primerEnvioEn } */
const accesoRapidoVerificaciones = new Map();

function limpiarAccesoRapidoVerificaciones() {
  const ahora = Date.now();
  for (const [tel, v] of accesoRapidoVerificaciones) {
    if (!v || v.expiraEn <= ahora) accesoRapidoVerificaciones.delete(tel);
  }
}

/** Envía el código al email YA registrado de la cuenta (el email introducido debe coincidir). */
authRouter.post("/auth/acceso-rapido/solicitar-codigo", accesoRapidoCodigoLimiter, async (req, res) => {
  const tel9 = normalizarTelefono(req.body?.telefono || "");
  if (!/^[67]\d{8}$/.test(tel9)) {
    res.status(400).json({ error: "Teléfono no válido" });
    return;
  }
  const emailIntroducido = String(req.body?.email || "").trim().toLowerCase();
  const usuarios = await readUsuarios();
  const user = usuarios.find((u) => normalizarTelefono(String(u?.telefono || "")) === tel9);
  if (!user || !tieneEmailRealMaika(user.email)) {
    res.status(400).json({ error: "Este número debe completar registro antes de usar acceso rápido" });
    return;
  }
  const emailCuenta = String(user.email || "").trim().toLowerCase();
  if (emailIntroducido !== emailCuenta) {
    res.status(400).json({ error: "El correo no coincide con este teléfono." });
    return;
  }
  limpiarAccesoRapidoVerificaciones();
  const prev = accesoRapidoVerificaciones.get(tel9);
  const ventanaActiva = prev && Date.now() - prev.primerEnvioEn < ACCESO_CODIGO_ENVIO_VENTANA_MS;
  if (ventanaActiva && prev.envios >= ACCESO_CODIGO_MAX_ENVIOS) {
    res.status(429).json({ error: "Has solicitado demasiados códigos. Espera unos minutos." });
    return;
  }
  const codigo = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  accesoRapidoVerificaciones.set(tel9, {
    hash: hashCodigoRegistro(codigo),
    expiraEn: Date.now() + ACCESO_CODIGO_TTL_MS,
    intentos: 0,
    envios: ventanaActiva ? prev.envios + 1 : 1,
    primerEnvioEn: ventanaActiva ? prev.primerEnvioEn : Date.now()
  });
  if (process.env.NODE_ENV === "test") {
    // Solo tests: el código queda accesible para el harness, nunca en la respuesta.
    (globalThis.__MAIKA_TEST_ACCESO_CODIGOS__ ||= {})[tel9] = codigo;
  }
  let enviado = false;
  try {
    enviado = await enviarEmailCodigoAccesoRapido(emailCuenta, codigo);
  } catch {
    enviado = false;
  }
  if (!enviado && !IS_PRODUCTION && process.env.NODE_ENV !== "test" && process.env.MAIKA_QUIET !== "1") {
    console.warn("[maika-backend] SMTP no configurado: no se pudo enviar el código de acceso rápido.");
  }
  res.json({ ok: true, emailEnviado: enviado });
});

/** Valida el código de acceso rápido (un solo uso, caducidad 10 min, máx. 5 intentos). */
authRouter.post("/auth/acceso-rapido/verificar", accesoRapidoVerificarLimiter, (req, res) => {
  const tel9 = normalizarTelefono(req.body?.telefono || "");
  const codigo = String(req.body?.codigo || "").trim();
  if (!/^[67]\d{8}$/.test(tel9) || !/^\d{6}$/.test(codigo)) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  limpiarAccesoRapidoVerificaciones();
  const entrada = accesoRapidoVerificaciones.get(tel9);
  if (!entrada) {
    res.status(400).json({ error: "codigo_invalido" });
    return;
  }
  if (entrada.expiraEn <= Date.now()) {
    accesoRapidoVerificaciones.delete(tel9);
    res.status(400).json({ error: "codigo_caducado" });
    return;
  }
  entrada.intentos += 1;
  if (entrada.intentos > ACCESO_CODIGO_MAX_INTENTOS) {
    accesoRapidoVerificaciones.delete(tel9);
    res.status(429).json({ error: "demasiados_intentos" });
    return;
  }
  if (!timingSafeEqualStrings(entrada.hash, hashCodigoRegistro(codigo))) {
    res.status(400).json({
      error: "codigo_invalido",
      restantes: Math.max(0, ACCESO_CODIGO_MAX_INTENTOS - entrada.intentos)
    });
    return;
  }
  accesoRapidoVerificaciones.delete(tel9);
  res.json({ ok: true });
});

authRouter.post("/test-email", testEmailLimiter, async (_req, res) => {
  if (IS_PRODUCTION && process.env.MAIKA_ENABLE_TEST_EMAIL !== "1") {
    res.status(404).json({ error: "No encontrado" });
    return;
  }

  const transporter = getSmtpTransporter();
  if (!transporter) {
    res.status(503).json({
      error: "SMTP no configurado",
      required: ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"]
    });
    return;
  }

  const fromUser = String(process.env.SMTP_USER || "").trim();
  const to = String(process.env.SMTP_TEST_TO || fromUser).trim().toLowerCase();
  if (!esEmailVerificable(to)) {
    res.status(400).json({ error: "SMTP_TEST_TO no es un email válido" });
    return;
  }

  try {
    await transporter.sendMail({
      from: `"MAIKA" <${fromUser}>`,
      to,
      subject: "Prueba MAIKA",
      text: "Email funcionando correctamente desde el backend MAIKA.",
      html: `
        <h2>MAIKA</h2>
        <p>Email funcionando correctamente desde el backend MAIKA.</p>
      `
    });
    res.json({ ok: true, to });
  } catch (error) {
     
    console.error("[maika-backend] Error enviando email de prueba:", error);
    res.status(500).json({ error: "Error enviando email" });
  }
});

/** Crea cookie httpOnly de admin tras validar la clave del panel. */
authRouter.post("/auth/admin-panel-token", adminLoginRateLimit, (req, res) => {
  const password = String(req.body?.password ?? "");
  if (!timingSafeEqualStrings(password, ADMIN_PANEL_PASSWORD)) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  const remember = req.body?.remember === true;
  const maxAgeMs = remember
    ? ADMIN_COOKIE_REMEMBER_MAX_AGE_MS
    : ADMIN_COOKIE_MAX_AGE_MS;
  const token = jwt.sign(
    {
      id: 0,
      email: "panel@maika.local",
      role: "admin",
      panelAdmin: true,
      adminTokenVersion: getAdminTokenVersion()
    },
    JWT_SECRET,
    { expiresIn: Math.floor(maxAgeMs / 1000) }
  );
  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: IS_PRODUCTION,
    maxAge: maxAgeMs,
    path: "/"
  });
  res.json({ ok: true });
});

authRouter.post("/auth/admin/logout", requireAdmin, (_req, res) => {
  revocarSesionesAdmin();
  res.clearCookie(ADMIN_COOKIE_NAME, {
    sameSite: "strict",
    secure: IS_PRODUCTION,
    path: "/"
  });
  res.json({ ok: true });
});

authRouter.get("/auth/admin/session", (req, res) => {
  const token = adminTokenDesdeCookie(req);
  if (!token) {
    res.json({ ok: true, authorized: false });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (
      (decoded?.role !== "admin" && decoded?.panelAdmin !== true) ||
      !tokenAdminEsVigente(decoded)
    ) {
      res.clearCookie(ADMIN_COOKIE_NAME, { sameSite: "strict", secure: IS_PRODUCTION, path: "/" });
      res.json({ ok: true, authorized: false });
      return;
    }
    res.json({ ok: true, authorized: true });
  } catch {
    res.clearCookie(ADMIN_COOKIE_NAME, { sameSite: "strict", secure: IS_PRODUCTION, path: "/" });
    res.json({ ok: true, authorized: false });
  }
});

authRouter.get("/auth/admin/me", requireAdmin, (_req, res) => {
  res.json({ ok: true, user: { role: "admin" } });
});

/**
 * Sesión de checkout como invitado: el frontend ya no calcula ni envía una contraseña derivada del teléfono
 * (antes `Ck!${tel9}xMaikaCheckout`, público en el bundle). El servidor decide y controla la cuenta/sesión.
 * Devuelve `scope: "checkout"` (ver `authMiddlewareCheckoutOk`): sirve para completar el pedido (perfil/carrito/pedido),
 * nunca para leer perfil completo, histórico de pedidos ni nada fuera de las rutas de checkout.
 */
authRouter.post("/auth/checkout-session", checkoutSessionLimiter, async (req, res) => {
  const tel9 = normalizarTelefono(req.body?.telefono || "");
  if (!/^[67]\d{8}$/.test(tel9)) {
    res.status(400).json({ error: "Teléfono no válido" });
    return;
  }
  const user = await updateUsuarios((usuarios) => {
    const idx = usuarios.findIndex((u) => normalizarTelefono(String(u?.telefono || "")) === tel9);
    if (idx === -1) {
      const nuevo = {
        id: Date.now(),
        email: emailCheckoutAutomaticoServidor(tel9),
        telefono: tel9,
        nombre: "",
        password: "",
        verificado: true,
        mustChangePassword: false,
        passwordTemporal: false,
        passwordTemporalExpiresAt: null,
        tokenVersion: 0
      };
      usuarios.push(nuevo);
      return nuevo;
    }
    const existente = usuarios[idx];
    // Teléfono ya asociado a una cuenta con email real o contraseña propia: el checkout como invitado no la sustituye.
    if (tieneEmailRealMaika(existente.email) || String(existente.password || "").trim()) {
      return null;
    }
    return existente;
  });
  if (!user) {
    res.status(409).json({ error: "Esta cuenta requiere iniciar sesión" });
    return;
  }
  const token = signClientSessionJwt(user, { scope: "checkout" });
  setClientSessionCookie(res, token);
  res.json({ ok: true });
});

/** Solo activa el rate limit por IP cuando el intento es de activación de cuenta técnica (alta normal no se toca). */
function limiteActivacionTecnicaIpSiAplica(req, res, next) {
  if (req.body?.activarCuentaTecnica === true) {
    registroActivarTecnicaLimiterIp(req, res, next);
    return;
  }
  next();
}

authRouter.post("/auth/register", registerLimiter, limiteActivacionTecnicaIpSiAplica, async (req, res) => {
  const { email, password, telefono, nombre } = req.body ?? {};
  const emailNorm = String(email || "").trim().toLowerCase();
  const passwordStr = String(password ?? "").trim();
  const telNorm = normalizarTelefono(telefono || "");
  const activarCuentaTecnica = req.body?.activarCuentaTecnica === true;
  const passwordTemporalRegistro = req.body?.passwordTemporal === true;
  if (
    !emailNorm ||
    !passwordStr ||
    passwordStr.length < 8 ||
    passwordStr.length > PASSWORD_MAX_LEN
  ) {
    res.status(400).json({ error: "Datos incompletos" });
    return;
  }
  /* Alta pública: exige aceptación legal y email verificado (token de /auth/registro/verificar).
     El alta desde gestión lleva cookie admin válida y no necesita ninguna de las dos. */
  const altaPorAdmin = esAdminAutenticado(req);
  if (!altaPorAdmin) {
    if (req.body?.aceptacionTerminos !== true || req.body?.aceptacionPrivacidad !== true) {
      res.status(400).json({ error: "Debes aceptar los Términos y la Política de Privacidad" });
      return;
    }
    if (req.body?.declaraMayorEdad !== true) {
      res.status(400).json({ error: "Debes declarar que eres mayor de 18 años" });
      return;
    }
    try {
      const decoded = jwt.verify(String(req.body?.verificacionToken || ""), JWT_SECRET);
      if (decoded?.scope !== "registro" || String(decoded?.email || "") !== emailNorm) {
        throw new Error("scope/email");
      }
    } catch {
      res.status(400).json({ error: "Verifica tu correo electrónico antes de crear la cuenta" });
      return;
    }
  }
  /** Registro de consentimiento (solo alta pública; el alta admin no implica aceptación del usuario). */
  const aceptacionRegistro = altaPorAdmin
    ? {}
    : {
        aceptacionTerminos: true,
        aceptacionPrivacidad: true,
        aceptacionFecha: new Date().toISOString(),
        aceptacionVersion: "v1",
        declaraMayorEdad: true,
        declaraMayorEdadFecha: new Date().toISOString()
      };
  const { status, body } = await updateUsuarios(async (usuarios) => {
    if (usuarios.find((u) => String(u?.email || "").trim().toLowerCase() === emailNorm)) {
      return { status: 400, body: { error: "Usuario ya existe" } };
    }
    const idxTelefonoExistente = telNorm
      ? usuarios.findIndex((u) => normalizarTelefono(String(u?.telefono || "")) === telNorm)
      : -1;
    if (idxTelefonoExistente !== -1) {
      const existente = usuarios[idxTelefonoExistente] ?? {};
      if (!activarCuentaTecnica || tieneEmailRealMaika(existente.email)) {
        return { status: 400, body: { error: "Teléfono ya existe" } };
      }
      // Activación de cuenta técnica: el código de último pedido se valida aquí contra pedidos.json,
      // nunca confiando en la comprobación (solo UX) que ya hace el frontend contra su localStorage.
      if (activacionTecnicaBloqueadaMsRestantes(telNorm) > 0) {
        return {
          status: 429,
          body: {
            error: "Demasiados intentos. Por seguridad, contacta con nosotros por WhatsApp para regenerar tu acceso.",
            code: "ACTIVACION_BLOQUEADA"
          }
        };
      }
      const codigoRecibido = String(req.body?.codigoUltimoPedido || "").trim();
      const usuarioIdExistente = `user_${existente.id}`;
      const pedidosExistente = await readPedidos();
      const ultimoPedidoExistente = pedidosExistente.find(
        (p) => String(p?.usuarioId || "") === usuarioIdExistente
      );
      const codigoEsperado = String(ultimoPedidoExistente?.numero || "").trim();
      const codigoValido =
        !!codigoEsperado &&
        !!codigoRecibido &&
        codigoEsperado.toLowerCase() === codigoRecibido.toLowerCase();
      if (!codigoValido) {
        registrarIntentoActivacionTecnicaFallido(telNorm);
        if (activacionTecnicaBloqueadaMsRestantes(telNorm) > 0) {
          return {
            status: 429,
            body: {
              error: "Demasiados intentos. Por seguridad, contacta con nosotros por WhatsApp para regenerar tu acceso.",
              code: "ACTIVACION_BLOQUEADA"
            }
          };
        }
        // Respuesta genérica: no revela si el teléfono existe ni si el código estuvo cerca.
        return { status: 400, body: { error: "Teléfono ya existe" } };
      }
      limpiarIntentosActivacionTecnica(telNorm);
      const hash = await bcrypt.hash(passwordStr, BCRYPT_ROUNDS);
      const perfilExtra = pickUsuarioPerfilServidor(req.body ?? {});
      const actualizado = {
        ...existente,
        ...perfilExtra,
        ...aceptacionRegistro,
        email: emailNorm,
        telefono: String(telefono || existente.telefono || "").trim(),
        nombre: String(nombre || existente.nombre || "").trim(),
        password: hash,
        verificado: true,
        mustChangePassword: !!passwordTemporalRegistro,
        passwordTemporal: !!passwordTemporalRegistro,
        passwordTemporalExpiresAt: passwordTemporalRegistro ? Date.now() + PASSWORD_TEMPORAL_TTL_MS : null,
        tokenVersion: (Number(existente.tokenVersion) || 0) + 1
      };
      usuarios[idxTelefonoExistente] = actualizado;
      return {
        status: 200,
        body: {
          ok: true,
          user: {
            id: actualizado.id,
            email: actualizado.email,
            telefono: actualizado.telefono,
            nombre: actualizado.nombre,
            hasPassword: !!String(actualizado.password || "").trim()
          }
        }
      };
    }
    const hash = await bcrypt.hash(passwordStr, BCRYPT_ROUNDS);
    const perfilExtra = pickUsuarioPerfilServidor(req.body ?? {});
    const nuevo = {
      id: Date.now(),
      email: emailNorm,
      telefono: String(telefono || "").trim(),
      nombre: String(nombre || "").trim(),
      ...perfilExtra,
      ...aceptacionRegistro,
      password: hash,
      verificado: true,
      mustChangePassword: !!passwordTemporalRegistro,
      passwordTemporal: !!passwordTemporalRegistro,
      passwordTemporalExpiresAt: passwordTemporalRegistro ? Date.now() + PASSWORD_TEMPORAL_TTL_MS : null,
      tokenVersion: 0
    };
    usuarios.push(nuevo);
    return {
      status: 200,
      body: {
        ok: true,
        user: {
          id: nuevo.id,
          email: nuevo.email,
          telefono: nuevo.telefono,
          nombre: nuevo.nombre,
          hasPassword: !!String(nuevo.password || "").trim()
        }
      }
    };
  });
  res.status(status).json(body);
});

authRouter.post("/auth/estado-telefono", estadoTelefonoLimiter, async (req, res) => {
  const telNorm = normalizarTelefono(req.body?.telefono || "");
  if (!/^[67]\d{8}$/.test(telNorm)) {
    res.status(400).json({ error: "Teléfono no válido" });
    return;
  }

  const usuarios = await readUsuarios();
  const user = usuarios.find((u) => normalizarTelefono(String(u?.telefono || "")) === telNorm);
  if (!user) {
    res.json({ existe: false });
    return;
  }

  // Esta ruta se consulta sin autenticación: nunca entregar el email completo evita que un teléfono pueda
  // usarse para averiguar datos personales. Los flujos de acceso usan el teléfono como identificador y el
  // backend resuelve el email internamente si necesita enviar una recuperación.
  res.json({
    existe: true,
    hasEmail: tieneEmailRealMaika(user.email),
    hasPassword: !!String(user.password || "").trim()
  });
});

authRouter.post("/auth/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body ?? {};
  const identificadorRaw = String(email || "").trim().toLowerCase();
  const passwordStr = String(password ?? "");
  if (!identificadorRaw || !passwordStr.trim() || passwordStr.length > PASSWORD_MAX_LEN) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const identificador = identificadorRaw.normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g, "");
  const identEmailNorm = identificador.includes("@")
    ? normalizarEmailParaBusquedaLogin(identificador)
    : "";
  const telNorm = normalizarTelefono(identificador);
  const usuarios = await readUsuarios();
  const user = usuarios.find((u) => {
    const emailU = String(u?.email || "").trim().toLowerCase();
    const telU = normalizarTelefono(String(u?.telefono || ""));
    if (identificador.includes("@")) {
      return normalizarEmailParaBusquedaLogin(emailU) === identEmailNorm;
    }
    if (telNorm) return telU === telNorm || normalizarEmailParaBusquedaLogin(emailU) === normalizarEmailParaBusquedaLogin(identificador);
    return normalizarEmailParaBusquedaLogin(emailU) === normalizarEmailParaBusquedaLogin(identificador);
  });
  const hashCompare =
    user && String(user.password || "").trim() ? String(user.password) : LOGIN_TIMING_DUMMY_HASH;
  const valid = await bcrypt.compare(passwordStr, hashCompare);
  if (!user || !valid) {
    res.status(401).json({ error: "Credenciales incorrectas" });
    return;
  }
  if (user.bloqueado) {
    res.status(403).json({ error: "Tu cuenta está bloqueada. Contacta con MAIKA por WhatsApp para más información." });
    return;
  }
  if (user.passwordTemporal && Number(user.passwordTemporalExpiresAt || 0) <= Date.now()) {
    res.status(401).json({ error: "Contraseña temporal caducada" });
    return;
  }
  const token = signClientSessionJwt(user);
  setClientSessionCookie(res, token);
  const body = {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      telefono: user.telefono || "",
      nombre: user.nombre || "",
      direccion: user.direccion || "",
      mustChangePassword: !!user.mustChangePassword,
      hasPassword: !!String(user.password || "").trim()
    }
  };
  if (process.env.NODE_ENV === "test") {
    body.token = token;
  }
  res.json(body);
});

authRouter.post("/auth/logout", (_req, res) => {
  clearClientSessionCookie(res);
  res.json({ ok: true });
});

/** Comprueba cookie de sesión sin 401 en consola (útil al hidratar la SPA). */
authRouter.get("/auth/session", (req, res) => {
  const token = clientSessionTokenDesdeCookie(req);
  if (!token) {
    res.json({ ok: true, authenticated: false });
    return;
  }
  try {
    jwt.verify(token, JWT_SECRET);
    res.json({ ok: true, authenticated: true });
  } catch {
    clearClientSessionCookie(res);
    res.json({ ok: true, authenticated: false });
  }
});

authRouter.get("/auth/refresh", authMiddleware, async (req, res) => {
  const userId = String(req.user?.id ?? "").trim();
  const usuarios = await readUsuarios();
  const user = usuarios.find((u) => String(u?.id) === userId);
  if (!user) {
    clearClientSessionCookie(res);
    res.status(401).json({ error: "Token inválido" });
    return;
  }
  const token = signClientSessionJwt(user);
  setClientSessionCookie(res, token);
  res.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      telefono: user.telefono || "",
      nombre: user.nombre || ""
    }
  });
});

authRouter.get("/auth/open-reset", openResetLinkLimiter, async (req, res) => {
  try {
    const token = String(req.query.token || "").trim();
    const frontRaw = String(req.query.front || "").trim();
    if (!token || token.length < 16) {
      res.status(400).type("html").send("<p>Enlace inválido.</p>");
      return;
    }
    const frontBase = frontRaw && esOrigenFrontendPermitido(frontRaw)
      ? frontRaw.replace(/\/+$/, "")
      : String(FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
    const tokenHash = hashResetToken(token);
    const now = Date.now();
    const usuarios = await readUsuarios();
    const valido = usuarios.some((u) => {
      const expiresAt = Number(u?.resetPasswordExpiresAt || 0);
      return String(u?.resetPasswordTokenHash || "") === tokenHash && expiresAt > now;
    });
    if (!valido) {
      res.status(400).type("html").send("<p>Enlace caducado o inválido. Solicita uno nuevo desde Mi cuenta.</p>");
      return;
    }
    const destino = buildResetPasswordPageUrl(frontBase, token);
    res.redirect(destino);
  } catch {
    res.status(500).type("html").send("<p>Error al abrir el enlace.</p>");
  }
});

authRouter.post("/auth/forgot-password", forgotPasswordLimiter, async (req, res) => {
  const response = { message: "Si existe una cuenta, enviaremos instrucciones" };
  try {
    const emailNorm = normalizarEmailParaBusquedaLogin(String(req.body?.email || ""));
    const telNorm = normalizarTelefono(req.body?.telefono || "");
    if (!emailNorm && !/^[67]\d{8}$/.test(telNorm)) {
      res.json(response);
      return;
    }

    const activado = await updateUsuarios((usuarios) => {
      const idx = usuarios.findIndex(
        (u) => emailNorm
          ? normalizarEmailParaBusquedaLogin(String(u?.email || "")) === emailNorm
          : normalizarTelefono(String(u?.telefono || "")) === telNorm
      );
      if (idx === -1) return null;
      if (usuarios[idx].bloqueado) return { bloqueado: true };
      const token = generateResetToken();
      usuarios[idx] = {
        ...usuarios[idx],
        resetPasswordTokenHash: hashResetToken(token),
        resetPasswordExpiresAt: Date.now() + 15 * 60 * 1000
      };
      return { token, email: usuarios[idx].email };
    });
    if (!activado) {
      response.cuentaNoExiste = true;
      response.message = "No hay ninguna cuenta registrada con ese e-mail.";
      res.json(response);
      return;
    }
    if (activado.bloqueado) {
      response.cuentaBloqueada = true;
      response.message = "Tu cuenta está bloqueada. Contacta con MAIKA por WhatsApp para más información.";
      res.json(response);
      return;
    }
    const { token } = activado;
    if (process.env.NODE_ENV === "test") {
      globalThis.__MAIKA_TEST_LAST_RESET_TOKEN__ = token;
    }

    const baseUrl = resolveFrontendBaseUrlFromRequest(req);
    const resetLink = buildResetPasswordPageUrl(baseUrl, token);
    const emailClickHref = buildResetEmailClickHref(baseUrl, token);
    if (!IS_PRODUCTION && process.env.NODE_ENV !== "test") {
       
      console.log("[maika-backend] RESET LINK:", resetLink);
    }

    let enviado = false;
    try {
      enviado = await enviarEmailResetPassword(String(activado.email || emailNorm), resetLink, {
        clickHref: emailClickHref
      });
      if (!enviado && !IS_PRODUCTION && process.env.MAIKA_QUIET !== "1") {
         
        console.warn("[maika-backend] SMTP no configurado: enlace disponible solo en consola de desarrollo.");
      }
    } catch (err) {
      if (!IS_PRODUCTION && process.env.MAIKA_QUIET !== "1") {
         
        console.error("[maika-backend] No se pudo enviar email de recuperación:", err?.message || err);
      }
    }

    if (!enviado && !IS_PRODUCTION && process.env.NODE_ENV !== "test") {
      response.devResetLink = resetLink;
      response.devEmailFallo = true;
      const frontFromBody = String(req.body?.frontendOrigin || "").trim();
      if (frontFromBody && esOrigenFrontendPermitido(frontFromBody)) {
        response.sameBrowserResetLink = resetLink;
      }
    }

    res.json(response);
  } catch {
    res.json(response);
  }
});

authRouter.post("/auth/reset-password", resetPasswordLimiter, async (req, res) => {
  try {
    const token = String(req.body?.token || "").trim();
    const newPassword = String(req.body?.newPassword || "");
    if (!token || newPassword.length < 8 || newPassword.length > PASSWORD_MAX_LEN) {
      await delayRespuestaFallida();
      res.status(400).json({ error: "Datos inválidos" });
      return;
    }

    const tokenHash = hashResetToken(token);
    const ok = await updateUsuarios(async (usuarios) => {
      const now = Date.now();
      const idx = usuarios.findIndex((u) => {
        const expiresAt = Number(u?.resetPasswordExpiresAt || 0);
        return String(u?.resetPasswordTokenHash || "") === tokenHash && expiresAt > now;
      });
      if (idx === -1) return false;
      usuarios[idx] = {
        ...usuarios[idx],
        password: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
        resetPasswordTokenHash: null,
        resetPasswordExpiresAt: null,
        mustChangePassword: false,
        passwordTemporal: false,
        passwordTemporalExpiresAt: null,
        tokenVersion: (Number(usuarios[idx]?.tokenVersion) || 0) + 1
      };
      return true;
    });

    if (!ok) {
      await delayRespuestaFallida();
      res.status(400).json({ error: "Datos inválidos" });
      return;
    }
    res.json({ message: "Contraseña actualizada" });
  } catch {
    res.status(500).json({ error: "Error" });
  }
});

authRouter.patch("/auth/password", authMiddleware, passwordLimiter, async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");
    if (
      !currentPassword ||
      newPassword.length < 8 ||
      newPassword.length > PASSWORD_MAX_LEN ||
      currentPassword.length > PASSWORD_MAX_LEN
    ) {
      await delayRespuestaFallida();
      res.status(400).json({ error: "Datos inválidos" });
      return;
    }

    const userId = String(req.user?.id ?? "").trim();
    if (!userId) {
      await delayRespuestaFallida();
      res.status(401).json({ error: "Datos inválidos" });
      return;
    }

    const resultado = await updateUsuarios(async (usuarios) => {
      const i = usuarios.findIndex((u) => String(u?.id) === userId);
      if (i === -1) return { status: 401 };
      const userPrev = usuarios[i];
      const valid = await bcrypt.compare(currentPassword, String(userPrev?.password || ""));
      if (!valid) return { status: 400 };
      const tokenVersionNext = (Number(userPrev?.tokenVersion) || 0) + 1;
      usuarios[i] = {
        ...userPrev,
        password: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
        mustChangePassword: false,
        passwordTemporal: false,
        passwordTemporalExpiresAt: null,
        tokenVersion: tokenVersionNext
      };
      return { status: 200, usuario: usuarios[i] };
    });
    if (resultado.status !== 200) {
      await delayRespuestaFallida();
      res.status(resultado.status).json({ error: "Datos inválidos" });
      return;
    }
    // Firmar con el usuario YA actualizado (tokenVersion+1): si se firma con el previo (tokenVersion viejo),
    // authMiddleware invalida la propia cookie recién emitida en la siguiente petición.
    const token = signClientSessionJwt(resultado.usuario);
    setClientSessionCookie(res, token);
    const body = { ok: true };
    if (process.env.NODE_ENV === "test") {
      body.token = token;
    }
    res.json(body);
  } catch {
    res.status(500).json({ error: "Error" });
  }
});
