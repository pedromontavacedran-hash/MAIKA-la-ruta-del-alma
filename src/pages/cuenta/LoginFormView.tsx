import { useState, useRef, type CSSProperties } from "react";
import type { AuthForm, Usuario } from "../../types";
import { checkoutInputStyle } from "../../styles/inputStyle";
import { THEME } from "../../config";
import { loginApi, LoginApiError } from "../../services/apiAuth";
import { notificarError, notificarExito } from "../../utils/ui/notificaciones";

export interface LoginFormViewProps {
  formAuth: AuthForm;
  setFormAuth: (fn: (prev: AuthForm) => AuthForm) => void;
  formAuthReset: AuthForm;
  iniciarSesionConToken: (token: string, opts?: { mostrarBienvenida?: boolean }) => Promise<Usuario | null>;
  precargarDatosClienteDesdeUsuario: (u: Usuario | null) => void;
  mostrarNotificacion: (mensaje: string, tipo: "normal" | "exito" | "error") => void;
  mostrarAvisoAccesoTemporalLogin: boolean;
  enlaceRecuperacionMismoNavegador: string | null;
  onEnlaceCerrar: () => void;
  onOlvidastePassword: () => void;
  onPostAuthReset: () => void;
  onMarcarReabrirCheckout: () => void;
  cuentaInputWithEyeStyle: CSSProperties;
  passwordWrapperStyle: CSSProperties;
  eyeBtnStyle: CSSProperties;
  cuentaCtaPrincipalStyle: CSSProperties;
}

/** Formulario de login + banner de enlace de recuperación en el mismo navegador. */
export default function LoginFormView(p: LoginFormViewProps) {
  const [loginCargando, setLoginCargando] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const emailLoginRef = useRef<HTMLInputElement>(null);
  const passwordLoginRef = useRef<HTMLInputElement>(null);
  const botonLoginRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      {p.enlaceRecuperacionMismoNavegador ? (
        <div
          role="region"
          aria-label="Enlace de recuperación en este navegador"
          style={{
            marginBottom: 16,
            padding: "14px 16px",
            borderRadius: 12,
            border: `1px solid ${THEME.goldMain}`,
            background: "rgba(11, 11, 13, 0.92)",
            textAlign: "center"
          }}
        >
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, lineHeight: 1.45, margin: "0 0 12px" }}>
            El correo no se pudo enviar. Abre el enlace en <strong>este navegador</strong>:
          </p>
          <a
            href={p.enlaceRecuperacionMismoNavegador}
            className="checkout-boton-finalizar"
            style={{
              ...p.cuentaCtaPrincipalStyle,
              display: "inline-block",
              textDecoration: "none",
              marginBottom: 10
            }}
          >
            Restablecer contraseña aquí
          </a>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(p.enlaceRecuperacionMismoNavegador!).then(
                  () => notificarExito(p.mostrarNotificacion, "Enlace copiado"),
                  () => notificarError(p.mostrarNotificacion, "No se pudo copiar")
                );
              }}
              style={{
                background: "transparent",
                border: `1px solid ${THEME.goldMain}`,
                color: THEME.goldMain,
                borderRadius: 8,
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: 13
              }}
            >
              Copiar enlace
            </button>
            <button
              type="button"
              onClick={p.onEnlaceCerrar}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.55)",
                cursor: "pointer",
                fontSize: 13,
                textDecoration: "underline"
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void (async () => {
            const identificadorNorm = (p.formAuth.email || "").trim().toLowerCase();
            if (!identificadorNorm || !p.formAuth.password) {
              notificarError(p.mostrarNotificacion, "❌ Introduce correo/teléfono y contraseña");
              return;
            }
            setLoginCargando(true);
            try {
              const auth = await loginApi(identificadorNorm, p.formAuth.password);
              p.onMarcarReabrirCheckout();
              const usuarioSesion = await p.iniciarSesionConToken(auth.token);
              if (usuarioSesion) {
                p.precargarDatosClienteDesdeUsuario(usuarioSesion);
                notificarExito(p.mostrarNotificacion, `✅ Bienvenido ${usuarioSesion.nombre}`);
              } else {
                notificarExito(p.mostrarNotificacion, "Sesión iniciada. Cargando tus datos guardados…");
              }
              p.onPostAuthReset();
              p.setFormAuth(() => ({ ...p.formAuthReset }));
            } catch (err) {
              if (err instanceof LoginApiError) {
                if (err.status === 403 && err.serverMessage) {
                  notificarError(p.mostrarNotificacion, `❌ ${err.serverMessage}`);
                } else if (err.status === 401 || err.status === 403) {
                  notificarError(p.mostrarNotificacion, "❌ Correo/teléfono o contraseña incorrectos.");
                } else if (err.status === 404) {
                  notificarError(
                    p.mostrarNotificacion,
                    "❌ No existe una cuenta con ese correo/teléfono en el servidor. Regístrate primero."
                  );
                } else {
                  notificarError(p.mostrarNotificacion, `❌ Error del servidor (${err.status}).`);
                }
                return;
              }
              const e2 = err instanceof Error ? err : new Error(String(err));
              const falloRed =
                e2 instanceof TypeError ||
                /failed to fetch|networkError|load failed|aborted|timeout/i.test(e2.message);
              if (falloRed) {
                notificarError(
                  p.mostrarNotificacion,
                  "❌ No se alcanza la API (:3001). Si solo tienes Vite, arranca también el servidor: «npm run dev:full» o en otra terminal «npm run backend:dev». En red Wi‑Fi, configura apiBaseUrl en public/maika-api.json."
                );
                return;
              }
              notificarError(p.mostrarNotificacion, `❌ ${e2.message}`);
            } finally {
              setLoginCargando(false);
            }
          })();
        }}
        autoComplete="off"
      >
        <input
          ref={emailLoginRef}
          type="text"
          placeholder="Correo o teléfono"
          value={p.formAuth.email}
          disabled={loginCargando}
          onChange={(e) => {
            const v = e.target.value;
            p.setFormAuth((prev) => ({ ...prev, email: v, confirmEmail: v }));
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            passwordLoginRef.current?.focus();
          }}
          style={{ ...checkoutInputStyle, opacity: loginCargando ? 0.85 : 1 }}
          autoComplete="off"
          name="login-email"
        />
        <div style={p.passwordWrapperStyle}>
          <input
            ref={passwordLoginRef}
            type={showPasswordLogin ? "text" : "password"}
            placeholder="Contraseña"
            className="cuenta-maika-input--con-ojo"
            value={p.formAuth.password}
            disabled={loginCargando}
            onChange={(e) => p.setFormAuth((prev) => ({ ...prev, password: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              botonLoginRef.current?.click();
            }}
            style={{ ...p.cuentaInputWithEyeStyle, opacity: loginCargando ? 0.85 : 1 }}
            autoComplete="new-password"
            name="login-password"
          />
          <button
            type="button"
            disabled={loginCargando}
            onClick={() => setShowPasswordLogin((v) => !v)}
            style={{ ...p.eyeBtnStyle, opacity: loginCargando ? 0.5 : 1, cursor: loginCargando ? "not-allowed" : "pointer" }}
            title={showPasswordLogin ? "Ocultar contraseña" : "Ver contraseña"}
            aria-label={showPasswordLogin ? "Ocultar contraseña" : "Ver contraseña"}
          >{showPasswordLogin ? "🙈" : "👁"}</button>
        </div>
        {p.mostrarAvisoAccesoTemporalLogin ? (
          <p style={{ color: "rgba(255,255,255,0.62)", fontSize: 11, margin: "-4px 0 10px", lineHeight: 1.35 }}>
            Acceso temporal activo para esta cuenta: usa la contraseña recibida. Caduca a los 10 minutos y después deberás cambiarla en Mi Cuenta.
          </p>
        ) : null}
        <button
          ref={botonLoginRef}
          type="submit"
          disabled={loginCargando}
          aria-busy={loginCargando}
          className="checkout-boton-finalizar"
          style={{
            ...p.cuentaCtaPrincipalStyle,
            cursor: loginCargando ? "wait" : "pointer",
            marginTop: 10,
            opacity: loginCargando ? 0.88 : 1,
            filter: loginCargando ? "brightness(0.92)" : undefined
          }}
        >{loginCargando ? "Entrando…" : "Iniciar Sesión"}</button>
        <div style={{ textAlign: "center", marginTop: 15 }}>
          <button type="button" onClick={p.onOlvidastePassword} className="cuenta-maika-btn-sec" style={{ background: "none", border: "none", color: THEME.goldMain, cursor: "pointer", textDecoration: "underline", fontSize: 14, padding: "6px 4px" }}>¿Olvidaste tu contraseña?</button>
        </div>
      </form>
    </>
  );
}
