import { useState, useRef, type CSSProperties } from "react";
import { THEME } from "../../config";
import { CHECKOUT_CONFIG } from "../../config/checkoutConfig";
import { checkoutInputStyle } from "../../styles/inputStyle";
import { solicitarRecuperacionPasswordApi } from "../../services/apiAuth";
import { notificarError, notificarExito } from "../../utils/ui/notificaciones";
import {
  emailValidoLogin
} from "../../utils/cuentaPageHelpers";

export interface RecuperarPasswordViewProps {
  /** Callback al cerrar el flujo (setModoRecuperar(false) en el padre). */
  onClose: () => void;
  /** Notifica al padre del enlace para abrir en el mismo navegador. */
  onEnlaceCambiado: (enlace: string | null) => void;
  /** Tras éxito: vuelve a login con el email rellenado. */
  onExitoVolverALogin: (email: string) => void;
  mostrarNotificacion: (mensaje: string, tipo: "normal" | "exito" | "error") => void;
  cuentaBotonAuth: CSSProperties;
  cuentaCtaPrincipalStyle: CSSProperties;
}

const URL_WHATSAPP_AYUDA = `https://wa.me/${CHECKOUT_CONFIG.whatsappNumber}?text=${encodeURIComponent(
  "Hola MAIKA, no recuerdo el e-mail de mi cuenta y no puedo recuperar la contraseña."
)}`;

/** Flujo «Recuperar contraseña»: el backend envía un enlace seguro por SMTP (un solo uso, 15 min). */
export default function RecuperarPasswordView(p: RecuperarPasswordViewProps) {
  const [emailRecuperar, setEmailRecuperar] = useState("");
  const [recuperarEnlaceEnviando, setRecuperarEnlaceEnviando] = useState(false);
  const [cuentaNoExisteError, setCuentaNoExisteError] = useState(false);

  const emailRecuperarRef = useRef<HTMLInputElement>(null);
  const botonRecuperarRef = useRef<HTMLButtonElement>(null);

  const volverALogin = (email: string) => {
    p.onExitoVolverALogin(email);
    p.onClose();
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const emailNorm = (emailRecuperar || "").trim().toLowerCase();
        if (!emailValidoLogin(emailNorm)) { notificarError(p.mostrarNotificacion, "❌ Introduce un e-mail válido"); return; }
        setRecuperarEnlaceEnviando(true);
        try {
          const res = await solicitarRecuperacionPasswordApi(emailNorm);
          setEmailRecuperar(emailNorm);
          if (res.cuentaBloqueada) {
            p.onEnlaceCambiado(null);
            setCuentaNoExisteError(true);
            notificarError(
              p.mostrarNotificacion,
              res.message || "Tu cuenta está bloqueada. Contacta con MAIKA por WhatsApp para más información."
            );
            return;
          }
          if (res.cuentaNoExiste) {
            p.onEnlaceCambiado(null);
            setCuentaNoExisteError(true);
            notificarError(
              p.mostrarNotificacion,
              "No hay ninguna cuenta registrada con ese e-mail. Si no recuerdas cuál usaste, escríbenos por WhatsApp."
            );
            return;
          }
          setCuentaNoExisteError(false);
          if (res.devEmailFallo && (res.sameBrowserResetLink || res.devResetLink)) {
            p.onEnlaceCambiado(res.sameBrowserResetLink || res.devResetLink || null);
            notificarExito(
              p.mostrarNotificacion,
              "⚠️ El correo no se envió. Usa el botón de abajo en este navegador."
            );
          } else {
            p.onEnlaceCambiado(null);
            notificarExito(
              p.mostrarNotificacion,
              "✅ Revisa el correo y pulsa el enlace: se abrirá Chrome. Permanece aquí en Mi cuenta."
            );
          }
          volverALogin(emailNorm);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (/Demasiados intentos/i.test(msg)) {
            setCuentaNoExisteError(true);
          }
          notificarError(p.mostrarNotificacion, msg);
        } finally {
          setRecuperarEnlaceEnviando(false);
        }
      }}
      autoComplete="off"
    >
      <h3 style={{ color: THEME.goldMain, textAlign: "center", marginBottom: 20 }}>Recuperar contraseña</h3>
      <p style={{ color: "white", textAlign: "center", marginBottom: 20 }}>Introduce el e-mail de tu cuenta y te enviaremos un enlace seguro.</p>
      <input
        ref={emailRecuperarRef}
        type="email"
        placeholder="E-mail"
        value={emailRecuperar}
        onChange={(e) => setEmailRecuperar(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          botonRecuperarRef.current?.click();
        }}
        style={checkoutInputStyle}
        autoComplete="email"
        name="email-recuperacion"
      />
      <button
        ref={botonRecuperarRef}
        type="submit"
        disabled={recuperarEnlaceEnviando}
        className="checkout-boton-finalizar"
        style={{
          ...p.cuentaCtaPrincipalStyle,
          marginTop: 10,
          opacity: recuperarEnlaceEnviando ? 0.88 : 1,
          cursor: recuperarEnlaceEnviando ? "wait" : "pointer"
        }}
      >{recuperarEnlaceEnviando ? "Enviando…" : "Enviar enlace seguro"}</button>
      {cuentaNoExisteError && (
        <a
          href={URL_WHATSAPP_AYUDA}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            textAlign: "center",
            marginTop: 10,
            color: "#25d366",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none"
          }}
        >
          📱 Escribir por WhatsApp
        </a>
      )}
      <button type="button" onClick={p.onClose} style={{ ...p.cuentaBotonAuth, background: "transparent", color: THEME.goldMain, border: "1px solid rgba(212, 175, 55, 0.45)", marginTop: 10 }}>← Cancelar</button>
    </form>
  );
}
