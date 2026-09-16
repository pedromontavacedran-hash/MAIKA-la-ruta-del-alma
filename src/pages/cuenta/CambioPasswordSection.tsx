import type { CSSProperties } from "react";
import RequisitosPasswordHint from "../../components/RequisitosPasswordHint";
import { THEME } from "../../config";

export interface CambioPasswordSectionProps {
  mustChangePassword: boolean;
  abierto: boolean;
  onToggle: () => void;
  passwordActual: string;
  setPasswordActual: (v: string) => void;
  passwordNueva: string;
  setPasswordNueva: (v: string) => void;
  passwordConfirmar: string;
  setPasswordConfirmar: (v: string) => void;
  showActual: boolean;
  setShowActual: (v: boolean) => void;
  showNueva: boolean;
  setShowNueva: (v: boolean) => void;
  showConfirmar: boolean;
  setShowConfirmar: (v: boolean) => void;
  cargando: boolean;
  onGuardar: () => void;
  cuentaBotonAuth: CSSProperties;
  cuentaInputWithEyeStyle: CSSProperties;
  cuentaCtaPrincipalStyle: CSSProperties;
}

const passwordWrapperStyle: CSSProperties = { position: "relative", marginBottom: 12 };
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
  color: THEME.goldMain
};

/** Bloque inline de «Cambiar contraseña» dentro de Mi Cuenta (caso normal, no temporal). */
export default function CambioPasswordSection(p: CambioPasswordSectionProps) {
  return (
    <div style={{ marginTop: 12, marginBottom: 14 }}>
      <button
        type="button"
        onClick={p.onToggle}
        style={{
          ...p.cuentaBotonAuth,
          padding: "10px 12px",
          fontSize: 13,
          background: "rgba(255,255,255,0.04)",
          color: THEME.goldMain,
          border: "1px solid rgba(212, 175, 55, 0.45)"
        }}
      >
        {p.mustChangePassword
          ? "Debes cambiar tu contraseña"
          : p.abierto
            ? "Cancelar cambio de contraseña"
            : "Cambiar contraseña"}
      </button>
      {p.abierto ? (
        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          {p.mustChangePassword ? (
            <p style={{ margin: 0, color: "#ffd98a", fontSize: 12, lineHeight: 1.35 }}>
              Has entrado con una contraseña temporal. Cámbiala ahora por una que solo sepas tú.
            </p>
          ) : null}
          <div style={{ ...passwordWrapperStyle, marginBottom: 0 }}>
            <input
              type={p.showActual ? "text" : "password"}
              placeholder="Contraseña actual"
              value={p.passwordActual}
              onChange={(e) => p.setPasswordActual(e.target.value)}
              style={{ ...p.cuentaInputWithEyeStyle, marginBottom: 0 }}
              autoComplete="current-password"
              name="cuenta-password-actual"
            />
            <button
              type="button"
              onClick={() => p.setShowActual(!p.showActual)}
              style={eyeBtnStyle}
              title={p.showActual ? "Ocultar contraseña" : "Ver contraseña"}
              aria-label={p.showActual ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {p.showActual ? "🙈" : "👁"}
            </button>
          </div>
          <div style={{ ...passwordWrapperStyle, marginBottom: 0 }}>
            <input
              type={p.showNueva ? "text" : "password"}
              placeholder="Nueva contraseña"
              value={p.passwordNueva}
              onChange={(e) => p.setPasswordNueva(e.target.value)}
              style={{ ...p.cuentaInputWithEyeStyle, marginBottom: 0 }}
              autoComplete="new-password"
              name="cuenta-password-nueva"
            />
            <button
              type="button"
              onClick={() => p.setShowNueva(!p.showNueva)}
              style={eyeBtnStyle}
              title={p.showNueva ? "Ocultar contraseña" : "Ver contraseña"}
              aria-label={p.showNueva ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {p.showNueva ? "🙈" : "👁"}
            </button>
          </div>
          <div style={{ ...passwordWrapperStyle, marginBottom: 0 }}>
            <input
              type={p.showConfirmar ? "text" : "password"}
              placeholder="Confirmar nueva contraseña"
              value={p.passwordConfirmar}
              onChange={(e) => p.setPasswordConfirmar(e.target.value)}
              style={{ ...p.cuentaInputWithEyeStyle, marginBottom: 0 }}
              autoComplete="new-password"
              name="cuenta-password-confirmar"
            />
            <button
              type="button"
              onClick={() => p.setShowConfirmar(!p.showConfirmar)}
              style={eyeBtnStyle}
              title={p.showConfirmar ? "Ocultar contraseña" : "Ver contraseña"}
              aria-label={p.showConfirmar ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {p.showConfirmar ? "🙈" : "👁"}
            </button>
          </div>
          <RequisitosPasswordHint password={p.passwordNueva} compact />
          <button
            type="button"
            disabled={p.cargando}
            onClick={p.onGuardar}
            className="checkout-boton-finalizar"
            style={{
              ...p.cuentaCtaPrincipalStyle,
              padding: "10px 12px",
              opacity: p.cargando ? 0.85 : 1,
              cursor: p.cargando ? "wait" : "pointer"
            }}
          >
            {p.cargando ? "Guardando..." : "Guardar nueva contraseña"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
