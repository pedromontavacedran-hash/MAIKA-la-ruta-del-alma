import { useState, useRef, useEffect, type CSSProperties } from "react";
import RequisitosPasswordHint from "../../components/RequisitosPasswordHint";
import { THEME } from "../../config";
import { CHECKOUT_CONFIG } from "../../config/checkoutConfig";
import { checkoutInputStyle } from "../../styles/inputStyle";
import { solicitarRecuperacionPasswordApi } from "../../services/apiAuth";
import { notificarError, notificarExito } from "../../utils/ui/notificaciones";
import {
  emailValidoLogin,
  passwordSeguraBasica
} from "../../utils/cuentaPageHelpers";

export interface RecuperarPasswordViewProps {
  /** Callback al cerrar el flujo (setModoRecuperar(false) en el padre). */
  onClose: () => void;
  /** Notifica al padre del enlace para abrir en el mismo navegador. */
  onEnlaceCambiado: (enlace: string | null) => void;
  /** Tras éxito: vuelve a login con el email rellenado. */
  onExitoVolverALogin: (email: string) => void;
  mostrarNotificacion: (mensaje: string, tipo: "normal" | "exito" | "error") => void;
  enviarCodigoEmail: (email: string, nombre: string, codigo: string) => Promise<boolean>;
  cuentaInputWithEyeStyle: CSSProperties;
  passwordWrapperStyle: CSSProperties;
  eyeBtnStyle: CSSProperties;
  cuentaBotonAuth: CSSProperties;
  cuentaCtaPrincipalStyle: CSSProperties;
}

const URL_WHATSAPP_AYUDA = `https://wa.me/${CHECKOUT_CONFIG.whatsappNumber}?text=${encodeURIComponent(
  "Hola MAIKA, no recuerdo el e-mail de mi cuenta y no puedo recuperar la contraseña."
)}`;

/** Flujo «Recuperar contraseña»: paso 1 (email → enlace seguro) y paso 2 (código + nueva password). */
export default function RecuperarPasswordView(p: RecuperarPasswordViewProps) {
  const [pasoRecuperar, setPasoRecuperar] = useState(1);
  const [emailRecuperar, setEmailRecuperar] = useState("");
  const [codigoRecuperar, setCodigoRecuperar] = useState("");
  const [codigoIngresadoRecuperar, setCodigoIngresadoRecuperar] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [showNuevaPassword, setShowNuevaPassword] = useState(false);
  const [cuentaAtrasRecuperar, setCuentaAtrasRecuperar] = useState(0);
  const [recuperarEnlaceEnviando, setRecuperarEnlaceEnviando] = useState(false);
  const [cuentaNoExisteError, setCuentaNoExisteError] = useState(false);

  useEffect(() => {
    if (cuentaAtrasRecuperar <= 0) return;
    const t = window.setTimeout(() => {
      setCuentaAtrasRecuperar((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(t);
  }, [cuentaAtrasRecuperar]);

  const emailRecuperarRef = useRef<HTMLInputElement>(null);
  const botonRecuperarRef = useRef<HTMLButtonElement>(null);
  const codigoRecuperarRef = useRef<HTMLInputElement>(null);
  const nuevaPasswordRecuperarRef = useRef<HTMLInputElement>(null);
  const botonActualizarPasswordRef = useRef<HTMLButtonElement>(null);

  const volverALogin = (email: string) => {
    p.onExitoVolverALogin(email);
    p.onClose();
  };

  return (
    <>
      {pasoRecuperar === 1 && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const emailNorm = (emailRecuperar || "").trim().toLowerCase();
            if (!emailValidoLogin(emailNorm)) { notificarError(p.mostrarNotificacion, "❌ Introduce un e-mail válido"); return; }
            setRecuperarEnlaceEnviando(true);
            try {
              const res = await solicitarRecuperacionPasswordApi(emailNorm);
              setEmailRecuperar(emailNorm);
              setCodigoRecuperar("");
              setCodigoIngresadoRecuperar("");
              setNuevaPassword("");
              setCuentaAtrasRecuperar(0);
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
      )}
      {pasoRecuperar === 2 && (
        <>
          <h3 style={{ color: THEME.goldMain, textAlign: "center", marginBottom: 20 }}>Cambiar contraseña</h3>
          <p style={{ color: "white", textAlign: "center", marginBottom: 8 }}>Introduce el código y tu nueva contraseña</p>
          <p style={{ color: "rgba(255,255,255,0.8)", textAlign: "center", marginBottom: 16, fontSize: 13 }}>
            Código válido durante {cuentaAtrasRecuperar}s
          </p>
          {cuentaAtrasRecuperar <= 0 && (
            <p style={{ color: "#ffb3b3", textAlign: "center", marginTop: -8, marginBottom: 14, fontSize: 13 }}>
              El código ha expirado. Solicita uno nuevo.
            </p>
          )}
          <input
            ref={codigoRecuperarRef}
            type="text"
            placeholder="Código de verificación"
            value={codigoIngresadoRecuperar}
            onChange={(e) => setCodigoIngresadoRecuperar(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              nuevaPasswordRecuperarRef.current?.focus();
            }}
            style={checkoutInputStyle}
            autoComplete="off"
            name="codigo-recuperacion"
          />
          <div style={p.passwordWrapperStyle}>
            <input
              ref={nuevaPasswordRecuperarRef}
              type={showNuevaPassword ? "text" : "password"}
              placeholder="Nueva Contraseña"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                botonActualizarPasswordRef.current?.click();
              }}
              style={p.cuentaInputWithEyeStyle}
              autoComplete="new-password"
              name="nueva-password"
            />
            <button type="button" onClick={() => setShowNuevaPassword((v) => !v)} style={p.eyeBtnStyle} title={showNuevaPassword ? "Ocultar contraseña" : "Ver contraseña"} aria-label={showNuevaPassword ? "Ocultar contraseña" : "Ver contraseña"}>{showNuevaPassword ? "🙈" : "👁"}</button>
          </div>
          <RequisitosPasswordHint password={nuevaPassword} />
          <button
            ref={botonActualizarPasswordRef}
            onClick={async () => {
              if (!codigoIngresadoRecuperar || !nuevaPassword) { notificarError(p.mostrarNotificacion, "❌ Completa todos los campos"); return; }
              if (cuentaAtrasRecuperar <= 0) { notificarError(p.mostrarNotificacion, "❌ Código expirado. Reenvía uno nuevo"); return; }
              if (!passwordSeguraBasica(nuevaPassword)) {
                notificarError(p.mostrarNotificacion, "❌ La contraseña debe tener mínimo 8 caracteres, con letras y números");
                return;
              }
              if (codigoIngresadoRecuperar !== codigoRecuperar) { notificarError(p.mostrarNotificacion, "❌ Código incorrecto"); return; }
              const emailNorm = (emailRecuperar || "").trim().toLowerCase();
              if (!emailValidoLogin(emailNorm)) {
                notificarError(p.mostrarNotificacion, "❌ E-mail no válido");
                return;
              }
              try {
                await solicitarRecuperacionPasswordApi(emailNorm);
                notificarExito(
                  p.mostrarNotificacion,
                  "✅ Te hemos enviado un enlace seguro para crear tu contraseña. Revisa tu correo."
                );
                setPasoRecuperar(1);
                setCuentaAtrasRecuperar(0);
                setCodigoIngresadoRecuperar("");
                setNuevaPassword("");
                volverALogin(emailNorm);
              } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                if (/\(404\)/.test(msg)) {
                  notificarError(
                    p.mostrarNotificacion,
                    "❌ No hay cuenta con ese correo en el servidor. Regístrate primero."
                  );
                  return;
                }
                notificarError(p.mostrarNotificacion, `❌ ${msg}`);
              }
            }}
            className="checkout-boton-finalizar"
            style={{ ...p.cuentaCtaPrincipalStyle, marginTop: 10 }}
          >Cambiar contraseña</button>
          <button
            type="button"
            disabled={cuentaAtrasRecuperar > 0}
            onClick={async () => {
              const emailNorm = (emailRecuperar || "").trim().toLowerCase();
              if (!emailValidoLogin(emailNorm)) { notificarError(p.mostrarNotificacion, "❌ E-mail no válido"); return; }
              const codigo = Math.floor(100000 + Math.random() * 900000).toString();
              setCodigoRecuperar(codigo);
              setCodigoIngresadoRecuperar("");
              setCuentaAtrasRecuperar(90);
              const enviado = await p.enviarCodigoEmail(emailNorm, emailNorm.split("@")[0] || "Usuario", codigo);
              if (enviado) notificarExito(p.mostrarNotificacion, `✅ Nuevo código enviado a ${emailNorm}`);
              else notificarError(p.mostrarNotificacion, "❌ Error al reenviar el código");
            }}
            style={{ ...p.cuentaBotonAuth, background: cuentaAtrasRecuperar > 0 ? "#666" : "rgba(255,255,255,0.04)", color: THEME.goldMain, border: "1px solid rgba(212, 175, 55, 0.45)", cursor: cuentaAtrasRecuperar > 0 ? "not-allowed" : "pointer", marginTop: 10 }}
          >
            {cuentaAtrasRecuperar > 0 ? `Reenviar código en ${cuentaAtrasRecuperar}s` : "Reenviar código"}
          </button>
          <button type="button" onClick={() => { setPasoRecuperar(1); setEmailRecuperar(""); setCuentaAtrasRecuperar(0); }} style={{ ...p.cuentaBotonAuth, background: "transparent", color: THEME.goldMain, border: "1px solid rgba(212, 175, 55, 0.45)", marginTop: 10 }}>← Volver</button>
        </>
      )}
    </>
  );
}
