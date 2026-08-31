import { useState, type CSSProperties } from "react";

type EmailUi = {
  intentosRestantes: number;
  bloqueado: boolean;
  ayudaInline: string | null;
};

type Props = {
  telefono: string;
  cuentaSinEmail: boolean;
  cuentaConActividadSinEmail: boolean;
  cuentaSinPassword: boolean;
  emailRegistrado: string;
  loginPassword: string;
  email: string;
  emailUi: EmailUi;
  enviando: boolean;
  textoCuentaAtrasBloqueoEmail: string;
  mensajeEmailNoCoincide: string;
  inputStyle: CSSProperties;
  goldColor: string;
  enmascararEmail: (email: string) => string;
  onLoginPasswordChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onResetAyudaInline: () => void;
  onContinuarInvitado: () => void;
  onActivarORegistro: () => void;
  onEntrar: () => void;
  onOlvidePassword: () => void;
  onEnviarCodigo: () => void;
};

export default function AccesoRapidoInicioPaso(props: Props) {
  const [mostrarLoginPassword, setMostrarLoginPassword] = useState(false);
  const {
    telefono,
    cuentaSinEmail,
    cuentaConActividadSinEmail,
    cuentaSinPassword,
    emailRegistrado,
    loginPassword,
    email,
    emailUi,
    enviando,
    textoCuentaAtrasBloqueoEmail,
    mensajeEmailNoCoincide,
    inputStyle,
    goldColor,
    enmascararEmail,
    onLoginPasswordChange,
    onEmailChange,
    onResetAyudaInline,
    onContinuarInvitado,
    onActivarORegistro,
    onEntrar,
    onOlvidePassword,
    onEnviarCodigo
  } = props;
  const emailRegistradoEnmascaradoAcceso = enmascararEmail(emailRegistrado).replace("@", "**@");

  return (
    <>
      <input
        type="text"
        readOnly
        value={telefono}
        placeholder="Teléfono"
        onPointerDown={(e) => e.preventDefault()}
        style={{ ...inputStyle, opacity: 0.9, userSelect: "none", WebkitUserSelect: "none" }}
      />
      {telefono.length > 0 ? (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: /^[67]\d{8}$/.test(telefono)
              ? "rgba(126, 205, 143, 0.95)"
              : telefono.replace(/\D/g, "").length > 0 && !/^[67]/.test(telefono.replace(/\D/g, ""))
                ? "rgba(201,162,74,0.9)"
                : "rgba(255,255,255,0.62)",
            textShadow: /^[67]\d{8}$/.test(telefono) ? "0 0 6px rgba(126,205,143,0.22)" : "none"
          }}
        >
          {/^[67]\d{8}$/.test(telefono)
            ? "✔ Teléfono listo"
            : telefono.replace(/\D/g, "").length > 0 && !/^[67]/.test(telefono.replace(/\D/g, ""))
              ? "Debe empezar por 6 o 7"
              : `${telefono.replace(/\D/g, "").slice(0, 9).length} / 9 dígitos`}
        </div>
      ) : null}
      {cuentaSinEmail ? (
        <div style={{ marginTop: 12 }}>
          <p style={{ color: "white", margin: 0, fontWeight: 800, marginBottom: 10 }}>
            {cuentaConActividadSinEmail ? "Este número ya tiene actividad. Activa tu cuenta." : "Este número necesita completar el registro"}
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onContinuarInvitado}
              style={{ flex: 1, padding: "12px 10px", borderRadius: 10, border: `2px solid ${goldColor}`, background: "transparent", color: goldColor, cursor: "pointer", fontWeight: "bold" }}
            >
              Continuar como invitado
            </button>
            <button
              type="button"
              onClick={onActivarORegistro}
              style={{ flex: 1, padding: "12px 10px", borderRadius: 10, border: "none", background: goldColor, color: "#1b1745", cursor: "pointer", fontWeight: "bold" }}
            >
              {cuentaConActividadSinEmail ? "Activar cuenta" : "Completar registro"}
            </button>
          </div>
        </div>
      ) : !cuentaSinPassword ? (
        <div style={{ marginTop: 12 }}>
          <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.92)", fontSize: 13, lineHeight: 1.45 }}>Inicia sesión para continuar</p>
          <input
            type="text"
            value={emailRegistradoEnmascaradoAcceso}
            readOnly
            style={{ ...inputStyle, marginTop: 0, opacity: 0.8 }}
            aria-label="Correo enmascarado"
          />
          <div style={{ position: "relative", marginTop: 8 }}>
            <input
              type={mostrarLoginPassword ? "text" : "password"}
              value={loginPassword}
              onChange={(e) => onLoginPasswordChange(e.target.value)}
              placeholder="Contraseña"
              style={{ ...inputStyle, marginTop: 0, marginBottom: 0, paddingRight: 44 }}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setMostrarLoginPassword((v) => !v)}
              title={mostrarLoginPassword ? "Ocultar contraseña" : "Ver contraseña"}
              aria-label={mostrarLoginPassword ? "Ocultar contraseña" : "Ver contraseña"}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: 19,
                padding: 2,
                color: goldColor
              }}
            >
              {mostrarLoginPassword ? "🙈" : "👁"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={onEntrar}
              style={{ flex: 1, padding: "10px 10px", borderRadius: 10, border: "none", background: goldColor, color: "#1b1745", cursor: "pointer", fontWeight: "bold" }}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={onOlvidePassword}
              style={{ flex: 1, padding: "10px 10px", borderRadius: 10, border: `2px solid ${goldColor}`, background: "transparent", color: goldColor, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>
      ) : null}

      {!cuentaSinEmail && cuentaSinPassword && (
        <>
          <p style={{ margin: "12px 0 8px", color: "rgba(255,255,255,0.92)", fontSize: 13, lineHeight: 1.45 }}>Completa la activación de tu cuenta</p>
          {emailRegistrado ? (
            <p style={{ margin: "12px 0 8px", color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.45 }}>
              📧 Email asociado: <strong style={{ color: goldColor }}>{enmascararEmail(emailRegistrado)}</strong>
            </p>
          ) : null}
          <input
            type="email"
            name="maika-acceso-confirm-email"
            value={email}
            onChange={(e) => {
              onEmailChange(e.target.value);
              onResetAyudaInline();
            }}
            readOnly={false}
            placeholder={emailRegistrado ? "Introduce tu email para confirmar" : "Correo electrónico de confirmación"}
            disabled={emailUi.bloqueado}
            style={{ ...inputStyle, marginTop: emailRegistrado ? 0 : 12, opacity: emailUi.bloqueado ? 0.65 : 1 }}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-lpignore="true"
            data-1p-ignore="true"
          />
          <div style={{ margin: "8px 0 0" }}>
            {emailUi.bloqueado ? (
              <div style={{ lineHeight: 1.5 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "rgba(255, 190, 185, 0.98)", letterSpacing: "0.01em" }}>
                  Has superado los intentos permitidos.
                </p>
                <p style={{ margin: "10px 0 0", fontSize: 12, fontWeight: 400, color: "rgba(255, 200, 200, 0.58)", lineHeight: 1.5 }}>
                  Por seguridad, podrás volver a intentarlo en 5 minutos.
                </p>
                <div style={{ margin: "12px 0 0", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>Disponible en:</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "0.06em", color: goldColor, padding: "5px 12px", borderRadius: 9, background: "rgba(201, 162, 74, 0.2)", border: "1px solid rgba(201, 162, 74, 0.45)", boxShadow: "0 0 12px rgba(201, 162, 74, 0.16)", lineHeight: 1.25 }}>
                    {textoCuentaAtrasBloqueoEmail}
                  </span>
                </div>
              </div>
            ) : emailUi.ayudaInline === mensajeEmailNoCoincide ? (
              <div style={{ margin: 0, padding: "10px 12px", borderRadius: 10, background: "rgba(201, 162, 74, 0.07)", border: "1px solid rgba(201, 162, 74, 0.22)" }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: "rgba(220, 190, 120, 0.96)", lineHeight: 1.45, fontWeight: 600 }}>
                  {mensajeEmailNoCoincide}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(191, 174, 122, 0.78)", lineHeight: 1.45, fontWeight: 400 }}>
                  {emailUi.intentosRestantes === 1 ? "Último intento disponible" : `Intentos restantes: ${emailUi.intentosRestantes}`}
                </p>
              </div>
            ) : emailUi.ayudaInline ? (
              <p style={{ margin: 0, fontSize: 12, color: "rgba(201,162,74,0.95)", lineHeight: 1.45 }}>{emailUi.ayudaInline}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onEnviarCodigo}
            disabled={enviando || emailUi.bloqueado}
            style={{
              width: "100%",
              marginTop: emailUi.bloqueado ? 16 : 0,
              padding: 12,
              borderRadius: 10,
              border: "none",
              background: goldColor,
              color: "#1b1745",
              fontWeight: "bold",
              cursor: enviando || emailUi.bloqueado ? "not-allowed" : "pointer",
              opacity: enviando || emailUi.bloqueado ? 0.85 : 1
            }}
          >
            {enviando ? "Enviando..." : emailUi.bloqueado ? "Intentar más tarde" : "Enviar código y continuar"}
          </button>
        </>
      )}
    </>
  );
}

