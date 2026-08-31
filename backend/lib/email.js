import nodemailer from "nodemailer";
import { IS_PRODUCTION } from "./env.js";
import { esEmailVerificable } from "./validacion.js";

let smtpTransporter = null;

export function smtpConfigCompleta() {
  return Boolean(
    String(process.env.SMTP_HOST || "").trim() &&
    String(process.env.SMTP_USER || "").trim() &&
    String(process.env.SMTP_PASS || "").trim()
  );
}

export function getSmtpTransporter() {
  if (!smtpConfigCompleta()) return null;
  if (smtpTransporter) return smtpTransporter;
  const port = Number(process.env.SMTP_PORT || 587);
  const allowInvalidTls = String(process.env.SMTP_ALLOW_INVALID_TLS || "").trim() === "true";
  smtpTransporter = nodemailer.createTransport({
    host: String(process.env.SMTP_HOST || "").trim(),
    port: Number.isFinite(port) ? port : 587,
    secure: String(process.env.SMTP_SECURE || "").trim() === "true" || port === 465,
    auth: {
      user: String(process.env.SMTP_USER || "").trim(),
      pass: String(process.env.SMTP_PASS || "").trim().replace(/^["']|["']$/g, "")
    },
    ...(allowInvalidTls ? { tls: { rejectUnauthorized: false } } : {})
  });
  return smtpTransporter;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Si `process.env.WHATSAPP_URL` es una URL http(s) válida, se usa en correos de ayuda. */
export function leerWhatsappUrlParaEmail() {
  const raw = String(process.env.WHATSAPP_URL || "").trim();
  if (!raw) return "";
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return "";
    return u.href;
  } catch {
    return "";
  }
}

export async function enviarEmailResetPassword(to, resetLink, { clickHref } = {}) {
  const transporter = getSmtpTransporter();
  if (!transporter) return false;
  const toEmail = String(to || "").trim().toLowerCase();
  if (!esEmailVerificable(toEmail)) return false;
  const fromUser = String(process.env.SMTP_USER || "").trim();
  const hrefEnEmail = String(clickHref || resetLink).trim() || resetLink;
  const safeLink = escapeHtml(hrefEnEmail);
  const waUrl = leerWhatsappUrlParaEmail();
  const waHtml = waUrl
    ? `<p style="font-size:13px;color:#555;">Si tienes cualquier problema con el enlace, escríbenos por <a href="${escapeHtml(waUrl)}" style="color:#bfa15a;">WhatsApp</a>.</p>`
    : "";
  const waText = waUrl
    ? ["", "Si tienes cualquier problema con el enlace, contáctanos por WhatsApp:", waUrl, ""].join("\n")
    : "";
  await transporter.sendMail({
    from: `"MAIKA" <${fromUser}>`,
    to: toEmail,
    subject: "Restablecer contraseña",
    text: [
      "MAIKA - Recuperación de contraseña",
      "",
      "Has solicitado restablecer tu contraseña.",
      "",
      `Abre este enlace: ${hrefEnEmail}`,
      "",
      "En desarrollo: al pulsar el enlace se abrirá Google Chrome. Si queda una pestaña en blanco del correo (p. ej. Brave), ciérrala con la X.",
      "",
      "Este enlace caduca en 15 minutos.",
      waText,
      "Si no fuiste tú, ignora este mensaje."
    ].join("\n"),
    html: `
      <h2>MAIKA - Recuperación de contraseña</h2>
      <p>Has solicitado restablecer tu contraseña.</p>
      <p>Este enlace caduca en 15 minutos.</p>
      <p><a href="${safeLink}" style="color:#bfa15a;">Restablecer contraseña</a></p>
      <p style="font-size:13px;color:#555;">En desarrollo, al pulsar el enlace se abrirá <strong>Google Chrome</strong> con la página de restablecimiento. Si el programa de correo deja una pestaña en blanco, ciérrala y continúa en Chrome.</p>
      ${waHtml}
      <p>Si no fuiste tú, ignora este mensaje.</p>
    `
  });
  return true;
}

export async function verificarSmtpAlArrancar() {
  if (process.env.NODE_ENV === "production") return;
  if (!smtpConfigCompleta()) {
    // eslint-disable-next-line no-console
    console.warn("[maika-backend] SMTP no configurado (SMTP_HOST/USER/PASS en .env). Los correos de recuperación no se enviarán.");
    return;
  }
  try {
    await getSmtpTransporter()?.verify();
    // eslint-disable-next-line no-console
    console.log("[maika-backend] SMTP verificado OK.");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      "[maika-backend] SMTP configurado pero NO funciona (revisa contraseña de aplicación Gmail):",
      err?.message || err
    );
  }
}
