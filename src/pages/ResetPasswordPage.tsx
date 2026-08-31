import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { THEME } from "../config";
import { CHECKOUT_CONFIG } from "../config/checkoutConfig";
import { checkoutInputStyle, checkoutPrimaryButtonStyleNoShadow } from "../styles/inputStyle";
import { resetPasswordApi, sesionClienteLimpiarTrasRestablecerPassword } from "../services/apiAuth";
import { broadcastMaikaTabMessage } from "../utils/maikaTabsBroadcast";
import "./reset-password-maika.css";

const URL_WHATSAPP_AYUDA_RESET = `https://wa.me/${CHECKOUT_CONFIG.whatsappNumber}?text=${encodeURIComponent(
  "Hola MAIKA, necesito ayuda con el restablecimiento de contraseña."
)}`;

function passwordSeguraBasica(password: string): boolean {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(String(password || ""));
}

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"normal" | "error" | "ok">("normal");
  const [copiaFeedback, setCopiaFeedback] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    setToken(params.get("token") || "");
  }, [params]);

  useEffect(() => {
    if (!token.trim()) return;
    broadcastMaikaTabMessage({ type: "reset-password-tab-opened", ts: Date.now() });
  }, [token]);

  /** Misma idea que /cuenta: sin barra de scroll visible (sigue el desplazamiento con rueda/táctil). */
  useEffect(() => {
    document.documentElement.classList.add("cuenta-maika-sin-scrollbar");
    document.body.classList.add("cuenta-maika-sin-scrollbar");
    return () => {
      document.documentElement.classList.remove("cuenta-maika-sin-scrollbar");
      document.body.classList.remove("cuenta-maika-sin-scrollbar");
    };
  }, []);

  const submit = async () => {
    setMessage("");
    setMessageKind("normal");
    if (!token) {
      setMessageKind("error");
      setMessage("Enlace inválido o incompleto.");
      return;
    }
    if (!passwordSeguraBasica(newPassword)) {
      setMessageKind("error");
      setMessage("La contraseña debe tener mínimo 8 caracteres, con letras y números.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessageKind("error");
      setMessage("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      await resetPasswordApi(token, newPassword);
      sesionClienteLimpiarTrasRestablecerPassword();
      setMessageKind("ok");
      setMessage(
        "Contraseña actualizada. Esta pestaña solo se puede cerrar sola en algunos casos; si sigue abierta, pasarás a Mi cuenta en un momento."
      );
      /** Solo las pestañas abiertas con script suelen poder cerrarse; si no, el segundo timeout hace de respaldo. */
      window.setTimeout(() => {
        window.close();
      }, 400);
      window.setTimeout(() => {
        navigate("/cuenta?restablecido=1", { replace: true });
      }, 1600);
    } catch (e) {
      setMessageKind("error");
      setMessage(e instanceof Error ? e.message : "No se pudo actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  const copiarEnlaceRecuperacion = () => {
    const url = window.location.href;
    void (async () => {
      try {
        await navigator.clipboard.writeText(url);
        setCopiaFeedback({
          kind: "ok",
          text: "Enlace copiado. Pégalo en la barra de direcciones de la pestaña donde ya tienes MAIKA abierta."
        });
        window.setTimeout(() => setCopiaFeedback(null), 4500);
      } catch {
        setCopiaFeedback({
          kind: "error",
          text: "No se pudo copiar. Abre la barra de direcciones, selecciona todo y copia (Ctrl+L, Ctrl+C)."
        });
      }
    })();
  };

  const cardStyle: CSSProperties = {
    width: "100%",
    maxWidth: 430,
    margin: "0 auto",
    padding: "24px 20px",
    borderRadius: 18,
    border: "1px solid rgba(212,175,55,0.22)",
    background: "linear-gradient(180deg, rgba(19,14,32,0.92), rgba(9,8,18,0.94))",
    boxShadow: "0 18px 45px rgba(0,0,0,0.38)",
    boxSizing: "border-box",
    color: "#fff"
  };

  const passwordWrapStyle: CSSProperties = {
    position: "relative",
    marginBottom: 10
  };

  const eyeButtonStyle: CSSProperties = {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    cursor: loading ? "not-allowed" : "pointer",
    fontSize: 19,
    padding: 2,
    color: THEME.goldMain,
    opacity: loading ? 0.55 : 1
  };

  return (
    <section className="reset-password-maika-page maika-page-content maika-page-content--narrow" style={cardStyle}>
      <h2 className="maika-page-title" style={{ color: THEME.goldMain, textAlign: "center", marginBottom: 8 }}>
        Restablecer contraseña
      </h2>
      <p style={{ color: "rgba(255,255,255,0.78)", textAlign: "center", marginTop: 0, marginBottom: 18, fontSize: 13 }}>
        Escribe una nueva contraseña para tu cuenta MAIKA.
      </p>
      {token ? (
        <p style={{ color: "rgba(255,255,255,0.62)", textAlign: "center", marginTop: -12, marginBottom: 16, fontSize: 12, lineHeight: 1.45 }}>
          Si el correo abrió esta página en una pestaña nueva y tenías MAIKA abierta en otra, puedes cerrar la que ya no uses cuando termines.
        </p>
      ) : null}
      {token ? (
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            disabled={loading}
            onClick={copiarEnlaceRecuperacion}
            className="reset-password-copiar-btn"
          >
            Copiar enlace de recuperación
          </button>
          {copiaFeedback ? (
            <div
              role="status"
              className={`reset-password-copia-feedback${
                copiaFeedback.kind === "ok" ? " reset-password-copia-feedback--ok" : " reset-password-copia-feedback--error"
              }`}
            >
              {copiaFeedback.text}
            </div>
          ) : null}
        </div>
      ) : null}
      <div style={passwordWrapStyle}>
        <input
          type={showNewPassword ? "text" : "password"}
          placeholder="Nueva contraseña"
          value={newPassword}
          disabled={loading}
          onChange={(e) => setNewPassword(e.target.value)}
          style={{ ...checkoutInputStyle, marginBottom: 0, paddingRight: 44, boxSizing: "border-box", opacity: loading ? 0.85 : 1 }}
          autoComplete="new-password"
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => setShowNewPassword((v) => !v)}
          title={showNewPassword ? "Ocultar contraseña" : "Ver contraseña"}
          aria-label={showNewPassword ? "Ocultar contraseña" : "Ver contraseña"}
          style={eyeButtonStyle}
        >
          {showNewPassword ? "🙈" : "👁"}
        </button>
      </div>
      <div style={{ ...passwordWrapStyle, marginBottom: 12 }}>
        <input
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          disabled={loading}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          style={{ ...checkoutInputStyle, marginBottom: 0, paddingRight: 44, boxSizing: "border-box", opacity: loading ? 0.85 : 1 }}
          autoComplete="new-password"
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => setShowConfirmPassword((v) => !v)}
          title={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
          aria-label={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
          style={eyeButtonStyle}
        >
          {showConfirmPassword ? "🙈" : "👁"}
        </button>
      </div>
      <button
        type="button"
        className="checkout-boton-finalizar"
        disabled={loading}
        onClick={() => void submit()}
        style={{
          ...checkoutPrimaryButtonStyleNoShadow,
          width: "100%",
          borderRadius: 10,
          padding: "12px 14px",
          fontWeight: 700,
          cursor: loading ? "wait" : "pointer",
          opacity: loading ? 0.88 : 1
        }}
      >
        {loading ? "Guardando..." : "Guardar contraseña"}
      </button>
      {message ? (
        <div
          className={`reset-password-submit-msg${
            messageKind === "ok"
              ? " reset-password-submit-msg--ok"
              : messageKind === "error"
                ? " reset-password-submit-msg--error"
                : " reset-password-submit-msg--normal"
          }`}
        >
          {message}
        </div>
      ) : null}
      <a
        href={URL_WHATSAPP_AYUDA_RESET}
        target="_blank"
        rel="noopener noreferrer"
        className="reset-password-wa"
      >
        ¿Problemas? Escríbenos por WhatsApp
      </a>
    </section>
  );
}
