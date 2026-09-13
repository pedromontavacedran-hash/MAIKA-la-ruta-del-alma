import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  JWT_SECRET,
  IS_PRODUCTION,
  ADMIN_PANEL_PASSWORD,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_MAX_AGE_MS,
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
import { getSmtpTransporter, enviarEmailResetPassword, escapeHtml } from "../lib/email.js";
import { openUrlInChrome } from "../utils/openChromeUrl.js";
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
  testEmailLimiter
} from "../lib/rateLimits.js";

export const authRouter = Router();

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
  const token = jwt.sign(
    { id: 0, email: "panel@maika.local", role: "admin", panelAdmin: true },
    JWT_SECRET,
    { expiresIn: Math.floor(ADMIN_COOKIE_MAX_AGE_MS / 1000) }
  );
  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PRODUCTION,
    maxAge: ADMIN_COOKIE_MAX_AGE_MS,
    path: "/"
  });
  res.json({ ok: true });
});

authRouter.post("/auth/admin/logout", (_req, res) => {
  res.clearCookie(ADMIN_COOKIE_NAME, {
    sameSite: "lax",
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
    if (decoded?.role !== "admin" && decoded?.panelAdmin !== true) {
      res.json({ ok: true, authorized: false });
      return;
    }
    res.json({ ok: true, authorized: true });
  } catch {
    res.clearCookie(ADMIN_COOKIE_NAME, { sameSite: "lax", secure: IS_PRODUCTION, path: "/" });
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

  // NOTA: el frontend reutiliza este email también como identificador de `/auth/login` (acceso rápido de
  // checkout) y para el envío de código por EmailJS cuando la cuenta no tiene contraseña; enmascararlo aquí
  // rompería ambos flujos (quedaría fuera del alcance de esta corrección tocar "login normal"). El rate limit
  // de arriba es la mitigación aplicada para esta ruta; ver informe de seguridad para el riesgo residual documentado.
  res.json({
    existe: true,
    email: String(user.email || "").trim().toLowerCase(),
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
    const chromeAbierto =
      !IS_PRODUCTION && process.env.NODE_ENV !== "test" ? openUrlInChrome(destino) : false;
    const safeDestino = escapeHtml(destino);
    if (chromeAbierto) {
      res.type("html").send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>MAIKA</title></head>
<body style="font-family:system-ui,sans-serif;max-width:520px;margin:48px auto;padding:0 20px;line-height:1.5;">
  <script>
  (function () {
    function cerrarPestanaCorreo() {
      try { window.open("", "_self"); } catch (e) {}
      try { window.close(); } catch (e) {}
    }
    cerrarPestanaCorreo();
    setTimeout(cerrarPestanaCorreo, 400);
    setTimeout(cerrarPestanaCorreo, 1000);
  })();
  </script>
  <h1 style="font-size:1.2rem;color:#8f6e28;">MAIKA</h1>
  <p>Hemos abierto la página para restablecer tu contraseña en <strong>Google Chrome</strong>. Si esta pestaña no se ha cerrado sola, puedes cerrarla.</p>
  <p><a href="${safeDestino}" style="color:#bfa15a;">Continuar en este navegador</a></p>
</body></html>`);
      return;
    }
    res.type("html").send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>MAIKA</title></head>
<body style="font-family:system-ui,sans-serif;max-width:520px;margin:48px auto;padding:0 20px;line-height:1.5;">
  <h1 style="font-size:1.2rem;color:#8f6e28;">MAIKA</h1>
  <p><a href="${safeDestino}" style="color:#bfa15a;">Continuar en este navegador</a></p>
</body></html>`);
  } catch {
    res.status(500).type("html").send("<p>Error al abrir el enlace.</p>");
  }
});

authRouter.post("/auth/forgot-password", forgotPasswordLimiter, async (req, res) => {
  const response = { message: "Si existe una cuenta, enviaremos instrucciones" };
  try {
    const emailNorm = normalizarEmailParaBusquedaLogin(String(req.body?.email || ""));
    if (!emailNorm) {
      res.json(response);
      return;
    }

    const activado = await updateUsuarios((usuarios) => {
      const idx = usuarios.findIndex(
        (u) => normalizarEmailParaBusquedaLogin(String(u?.email || "")) === emailNorm
      );
      if (idx === -1) return null;
      const token = generateResetToken();
      usuarios[idx] = {
        ...usuarios[idx],
        resetPasswordTokenHash: hashResetToken(token),
        resetPasswordExpiresAt: Date.now() + 15 * 60 * 1000
      };
      return { token, email: usuarios[idx].email };
    });
    if (!activado) {
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
