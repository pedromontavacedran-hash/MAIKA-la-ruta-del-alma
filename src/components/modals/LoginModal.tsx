import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import ModalBase from "../ModalBase";
import type { Usuario } from "../../types";
import { checkoutInputStyle, checkoutPrimaryButtonStyleNoShadow } from "../../styles/inputStyle";
import { emailValidoLoginCuenta, loginEmailPasswordFlow } from "../../utils/loginEmailPasswordFlow";
import { passwordSeguraBasica } from "../../utils/accesoRapidoUtils";
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
  enviarCodigoEmail: (email: string, nombre: string, codigo: string) => Promise<boolean>;
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
  iniciarSesionConToken,
  enviarCodigoEmail
}: Props) {
  void enviarCodigoEmail;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [pasoRecuperar, setPasoRecuperar] = useState<1 | 2>(1);
  const [emailRecuperar, setEmailRecuperar] = useState("");
  const [codigoRecuperar, setCodigoRecuperar] = useState("");
  const [codigoIngresadoRecuperar, setCodigoIngresadoRecuperar] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [cuentaAtrasRecuperar, setCuentaAtrasRecuperar] = useState(0);
  const [recuperando, setRecuperando] = useState(false);
  /** Evita que Chrome rellene antes del primer foco (truco habitual). */
  const [camposBloqueadosAutofill, setCamposBloqueadosAutofill] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showNuevaPassword, setShowNuevaPassword] = useState(false);
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

  const tituloSeccion = !modoRecuperar
    ? "Iniciar sesión"
    : pasoRecuperar === 1
      ? "Recuperar contraseña"
      : "Cambiar contraseña";
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

  useEffect(() => {
    if (cuentaAtrasRecuperar <= 0) return;
    const id = window.setTimeout(() => {
      setCuentaAtrasRecuperar((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(id);
  }, [cuentaAtrasRecuperar]);

  const abrirRecuperar = () => {
    const emailNorm = (email || "").trim().toLowerCase();
    setModoRecuperar(true);
    setPasoRecuperar(1);
    setEmailRecuperar(emailNorm);
    setCodigoRecuperar("");
    setCodigoIngresadoRecuperar("");
    setNuevaPassword("");
    setCuentaAtrasRecuperar(0);
    setShowNuevaPassword(false);
  };

  const volverLogin = () => {
    setModoRecuperar(false);
    setPasoRecuperar(1);
    setCodigoRecuperar("");
    setCodigoIngresadoRecuperar("");
    setNuevaPassword("");
    setCuentaAtrasRecuperar(0);
    setRecuperando(false);
    setShowNuevaPassword(false);
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
      setCodigoRecuperar("");
      setCodigoIngresadoRecuperar("");
      setNuevaPassword("");
      setCuentaAtrasRecuperar(0);
      setModoRecuperar(false);
      setPasoRecuperar(1);
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

  const actualizarPasswordRecuperacion = async () => {
    if (!codigoIngresadoRecuperar || !nuevaPassword) {
      notificarError(mostrarNotificacion, "❌ Completa todos los campos");
      return;
    }
    if (cuentaAtrasRecuperar <= 0) {
      notificarError(mostrarNotificacion, "❌ Código expirado. Solicita uno nuevo");
      return;
    }
    if (!passwordSeguraBasica(nuevaPassword)) {
      notificarError(mostrarNotificacion, "❌ La contraseña debe tener mínimo 8 caracteres, con letras y números");
      return;
    }
    if (codigoIngresadoRecuperar !== codigoRecuperar) {
      notificarError(mostrarNotificacion, "❌ Código incorrecto");
      return;
    }
    const emailNorm = (emailRecuperar || "").trim().toLowerCase();
    if (!emailValidoLoginCuenta(emailNorm)) {
      notificarError(mostrarNotificacion, "❌ E-mail no válido");
      return;
    }
    setRecuperando(true);
    try {
      await solicitarRecuperacionPasswordApi(emailNorm);
      setEmail(emailNorm);
      setPassword("");
      notificarExito(mostrarNotificacion, "✅ Te hemos enviado un enlace seguro para crear tu contraseña.");
      volverLogin();
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      notificarError(mostrarNotificacion, `❌ ${m}`);
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
          marginBottom: modoRecuperar && pasoRecuperar === 1 ? 20 : 12,
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
      ) : pasoRecuperar === 1 ? (
        <form
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            void enviarCodigoRecuperacion();
          }}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <p style={{ color: "white", textAlign: "center", marginTop: 0, marginBottom: 20, fontSize: 14, lineHeight: 1.45 }}>
            Introduce el e-mail de tu cuenta
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
            {recuperando ? "Enviando…" : "Enviar código"}
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
      ) : (
        <form
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            void actualizarPasswordRecuperacion();
          }}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <p style={{ color: "white", textAlign: "center", marginTop: 0, marginBottom: 8, fontSize: 14, lineHeight: 1.45 }}>
            Introduce el código y tu nueva contraseña
          </p>
          <p style={{ margin: "0 0 16px", textAlign: "center", color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
            Código válido durante {cuentaAtrasRecuperar}s
          </p>
          {cuentaAtrasRecuperar <= 0 ? (
            <p style={{ color: "#ffb3b3", textAlign: "center", marginTop: -8, marginBottom: 14, fontSize: 13 }}>
              El código ha expirado. Solicita uno nuevo.
            </p>
          ) : null}
          <input
            type="text"
            placeholder="Código de verificación"
            value={codigoIngresadoRecuperar}
            disabled={recuperando}
            onChange={(e) => setCodigoIngresadoRecuperar(e.target.value.trim())}
            style={{ ...campoStyle, opacity: recuperando ? 0.85 : 1 }}
            autoComplete="off"
          />
          <div style={passwordWrapperStyle}>
            <input
              type={showNuevaPassword ? "text" : "password"}
              placeholder="Nueva Contraseña"
              value={nuevaPassword}
              disabled={recuperando}
              onChange={(e) => setNuevaPassword(e.target.value)}
              style={{ ...inputConOjoStyle, opacity: recuperando ? 0.85 : 1 }}
              autoComplete="new-password"
            />
            <button
              type="button"
              disabled={recuperando}
              onClick={() => setShowNuevaPassword((v) => !v)}
              style={{
                ...eyeBtnStyle,
                opacity: recuperando ? 0.5 : 1,
                cursor: recuperando ? "not-allowed" : "pointer"
              }}
              title={showNuevaPassword ? "Ocultar contraseña" : "Ver contraseña"}
              aria-label={showNuevaPassword ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {showNuevaPassword ? "🙈" : "👁"}
            </button>
          </div>
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
            {recuperando ? "Actualizando…" : "Cambiar contraseña"}
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
