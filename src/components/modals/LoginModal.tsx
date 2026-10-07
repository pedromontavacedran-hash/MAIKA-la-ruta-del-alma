import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import ModalBase from "../ModalBase";
import type { Usuario } from "../../types";
import { checkoutInputStyle, checkoutPrimaryButtonStyleNoShadow } from "../../styles/inputStyle";
import { emailValidoLoginCuenta, loginEmailPasswordFlow } from "../../utils/loginEmailPasswordFlow";
import { solicitarRecuperacionPasswordApi } from "../../services/apiAuth";
import { notificarError, notificarExito } from "../../utils/ui/notificaciones";
import { leerMaikaUsuarios } from "../../utils/maikaUsuarios";
import { normalizarTelefonoES9 } from "../../utils/telefono";

type Props = {
  onClose: () => void;
  bgColor: string;
  goldColor: string;
  inputStyle?: CSSProperties;
  mostrarNotificacion: (m: string, t: "normal" | "exito" | "error") => void;
  onLoginSuccess: (usuario: Usuario) => void;
  iniciarSesionConToken: (token: string, opts?: { mostrarBienvenida?: boolean }) => Promise<Usuario | null>;
};

/**
 * Solo se monta cuando está abierto (padre condicional): evita estado React persistente.
 * type="text" + autoComplete agresivo en password reduce autofill del navegador en checkout.
 */
export default function LoginModal({
  onClose,
  bgColor: _bgColor,
  goldColor,
  inputStyle = checkoutInputStyle,
  mostrarNotificacion,
  onLoginSuccess,
  iniciarSesionConToken
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [emailRecuperar, setEmailRecuperar] = useState("");
  const [recuperando, setRecuperando] = useState(false);
  /** Evita que Chrome rellene antes del primer foco (truco habitual). */
  const [camposBloqueadosAutofill, setCamposBloqueadosAutofill] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const desbloqueadoRef = useRef(false);

  /** Mismos criterios que `CuentaPage` (tarjeta azul + inputs). */
  const campoStyle: CSSProperties = { ...inputStyle, marginBottom: 12, boxSizing: "border-box" };
  const passwordWrapperStyle = { position: "relative" as const, marginBottom: 12 };
  const inputConOjoStyle: CSSProperties = { ...campoStyle, paddingRight: 44, marginBottom: 0 };
  const cuentaCtaPrincipalStyle: CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    fontSize: 15,
    borderRadius: 10,
    fontWeight: 600,
    cursor: "pointer",
    boxSizing: "border-box",
    ...checkoutPrimaryButtonStyleNoShadow
  };
  const cuentaBotonAuth: CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    fontSize: 15,
    borderRadius: 10,
    fontWeight: 600,
    cursor: "pointer",
    boxSizing: "border-box"
  };
  const eyeBtnStyle: CSSProperties = {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    padding: 4,
    color: goldColor
  };

  const tituloSeccion = modoRecuperar ? "Recuperar contraseña" : "Iniciar sesión";
  const mostrarAvisoAccesoTemporal = (() => {
    const ident = String(email || "").trim().toLowerCase();
    if (!ident) return false;
    const tel = normalizarTelefonoES9(ident);
    return leerMaikaUsuarios().some((u) => {
      if (!u.passwordTemporal) return false;
      const emailU = String(u.email || "").trim().toLowerCase();
      const telU = normalizarTelefonoES9(u.telefono || "");
      return (!!emailU && emailU === ident) || (!!tel && !!telU && tel === telU);
    });
  })();

  const desbloquearSiAutofill = () => {
    if (desbloqueadoRef.current) return;
    desbloqueadoRef.current = true;
    requestAnimationFrame(() => {
      setCamposBloqueadosAutofill(false);
    });
  };

  const abrirRecuperar = () => {
    const emailNorm = (email || "").trim().toLowerCase();
    setModoRecuperar(true);
    setEmailRecuperar(emailNorm);
  };

  const volverLogin = () => {
    setModoRecuperar(false);
    setRecuperando(false);
  };

  const submit = async () => {
    setCargando(true);
    try {
      const r = await loginEmailPasswordFlow(email, password);
      if (r.kind === "error") {
        notificarError(mostrarNotificacion, r.message);
        return;
      }
      if (r.kind === "ok") {
        const usuarioCompleto = await iniciarSesionConToken(r.token);
        if (usuarioCompleto) {
          onLoginSuccess(usuarioCompleto);
          notificarExito(mostrarNotificacion, `✅ Bienvenido ${usuarioCompleto.nombre}`);
        } else {
          onClose();
          notificarExito(mostrarNotificacion, "Sesión iniciada. Cargando tus datos guardados…");
        }
        return;
      }
    } finally {
      setCargando(false);
    }
  };

  const enviarCodigoRecuperacion = async () => {
    const emailNorm = (emailRecuperar || "").trim().toLowerCase();
    if (!emailValidoLoginCuenta(emailNorm)) {
      notificarError(mostrarNotificacion, "❌ Introduce un e-mail válido");
      return;
    }
    setRecuperando(true);
    try {
      mostrarNotificacion("📧 Preparando enlace seguro de recuperación...", "normal");
      await solicitarRecuperacionPasswordApi(emailNorm);
      setEmail(emailNorm);
      setModoRecuperar(false);
      notificarExito(
        mostrarNotificacion,
        "✅ Si existe una cuenta con ese email, enviaremos instrucciones para restablecerla."
      );
    } catch {
      notificarError(mostrarNotificacion, "❌ No se pudo solicitar la recuperación. Inténtalo más tarde.");
    } finally {
      setRecuperando(false);
    }
  };

  return (
    <ModalBase
      abierto
      onClose={onClose}
      zIndex={11050}
      maxWidth="480px"
      classNameOverlay="modal-overlay--flujo-checkout"
      classNameCard="cuenta-maika-card"
      styleCard={{
        padding: 20,
        width: "100%",
        boxSizing: "border-box",
        color: "#fff"
      }}
      ariaLabelledBy="login-modal-titulo"
    >
      <h2
        id="login-modal-titulo"
        style={{ textAlign: "center", color: goldColor, marginBottom: 14, marginTop: 4, fontSize: 18 }}
      >
        👤 Mi Cuenta
      </h2>
      <h3
        style={{
          color: goldColor,
          textAlign: "center",
          marginTop: 0,
          marginBottom: modoRecuperar ? 20 : 12,
          fontSize: 15,
          fontWeight: 600
        }}
      >
        {tituloSeccion}
      </h3>
      {!modoRecuperar ? (
        <form
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          style={{ display: "flex", flexDirection: "column", position: "relative" }}
        >
          <input
            type="text"
            name="maika-honeypot-user"
            autoComplete="username"
            tabIndex={-1}
            aria-hidden="true"
            style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }}
            readOnly
          />
          <input
            type="text"
            name="maika-honeypot-pass"
            autoComplete="current-password"
            tabIndex={-1}
            aria-hidden="true"
            style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }}
            readOnly
          />
          <input
            type="text"
            inputMode="email"
            name="maika_pedido_correo"
            id="maika-pedido-correo-login"
            placeholder="Correo electrónico"
            value={email}
            disabled={cargando}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={desbloquearSiAutofill}
            readOnly={camposBloqueadosAutofill && !cargando}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-lpignore="true"
            data-1p-ignore="true"
            data-form-type="other"
            style={{ ...campoStyle, opacity: cargando ? 0.85 : 1 }}
          />
          <div style={passwordWrapperStyle}>
            <input
              type={showPassword ? "text" : "password"}
              name="maika_pedido_clave"
              id="maika-pedido-clave-login"
              placeholder="Contraseña"
              value={password}
              disabled={cargando}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={desbloquearSiAutofill}
              readOnly={camposBloqueadosAutofill && !cargando}
              autoComplete="new-password"
              data-lpignore="true"
              data-1p-ignore="true"
              data-form-type="other"
              style={{ ...inputConOjoStyle, opacity: cargando ? 0.85 : 1 }}
            />
            <button
              type="button"
              disabled={cargando}
              onClick={() => setShowPassword((v) => !v)}
              style={{
                ...eyeBtnStyle,
                opacity: cargando ? 0.5 : 1,
                cursor: cargando ? "not-allowed" : "pointer"
              }}
              title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
          {mostrarAvisoAccesoTemporal ? (
            <p style={{ color: "rgba(255,255,255,0.62)", fontSize: 11, margin: "-4px 0 10px", lineHeight: 1.35 }}>
              Acceso temporal activo para esta cuenta: usa la contraseña recibida. Caduca a los 10 minutos y después deberás cambiarla en Mi Cuenta.
            </p>
          ) : null}
          <button
            type="submit"
            disabled={cargando}
            className="checkout-boton-finalizar"
            style={{
              ...cuentaCtaPrincipalStyle,
              cursor: cargando ? "wait" : "pointer",
              opacity: cargando ? 0.88 : 1,
              marginTop: 10,
              filter: cargando ? "brightness(0.92)" : undefined
            }}
          >
            {cargando ? "Entrando…" : "Iniciar Sesión"}
          </button>
          <div style={{ textAlign: "center", marginTop: 15 }}>
            <button
              type="button"
              onClick={abrirRecuperar}
              style={{
                background: "none",
                border: "none",
                color: goldColor,
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: 14
              }}
              aria-label="Recuperar contraseña"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </form>
      ) : (
        <form
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            void enviarCodigoRecuperacion();
          }}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <p style={{ color: "white", textAlign: "center", marginTop: 0, marginBottom: 20, fontSize: 14, lineHeight: 1.45 }}>
            Introduce el e-mail de tu cuenta y te enviaremos un enlace seguro.
          </p>
          <input
            type="email"
            placeholder="E-mail"
            value={emailRecuperar}
            disabled={recuperando}
            onChange={(e) => setEmailRecuperar(e.target.value)}
            style={{ ...campoStyle, opacity: recuperando ? 0.85 : 1 }}
            autoComplete="email"
          />
          <button
            type="submit"
            disabled={recuperando}
            className="checkout-boton-finalizar"
            style={{
              ...cuentaCtaPrincipalStyle,
              cursor: recuperando ? "wait" : "pointer",
              opacity: recuperando ? 0.88 : 1,
              marginTop: 10
            }}
          >
            {recuperando ? "Enviando…" : "Enviar enlace"}
          </button>
          <button
            type="button"
            onClick={volverLogin}
            style={{
              ...cuentaBotonAuth,
              background: "transparent",
              color: goldColor,
              border: "1px solid rgba(212, 175, 55, 0.45)",
              marginTop: 10
            }}
          >
            ← Cancelar
          </button>
        </form>
      )}
    </ModalBase>
  );
}
