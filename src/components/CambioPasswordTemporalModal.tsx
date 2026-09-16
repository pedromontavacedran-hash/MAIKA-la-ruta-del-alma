import { useState, type CSSProperties } from "react";
import ModalBase from "./ModalBase";
import RequisitosPasswordHint from "./RequisitosPasswordHint";
import { THEME } from "../config";
import { checkoutInputStyle, checkoutPrimaryButtonStyleNoShadow } from "../styles/inputStyle";
import { cambiarPasswordAutenticadoApi } from "../services/apiAuth";
import { passwordSeguraBasica } from "../utils/accesoRapidoUtils";
import { notificarError, notificarExito } from "../utils/ui/notificaciones";

export interface CambioPasswordTemporalModalProps {
  abierto: boolean;
  onClose: () => void;
  onExito: () => void;
  mostrarNotificacion: (mensaje: string, tipo?: "normal" | "exito" | "error") => void;
}

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

/** Si el texto pegado es el mensaje completo de WhatsApp, extrae solo la contraseña. */
function extraerPasswordDeMensaje(texto: string): string {
  const m = /contraseña\s+temporal\s*:\s*(\S+)/i.exec(texto);
  return m ? m[1] : texto;
}

function CampoPassword({
  placeholder,
  value,
  onChange,
  visible,
  onToggleVisible,
  autoComplete,
  name,
  extraerTemporal
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  autoComplete: string;
  name: string;
  /** Si true, al pegar el mensaje completo de WhatsApp extrae solo la contraseña. */
  extraerTemporal?: boolean;
}) {
  return (
    <div style={{ position: "relative", marginBottom: 10 }}>
      <input
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => {
          if (!extraerTemporal) return;
          const texto = e.clipboardData.getData("text");
          const extraida = extraerPasswordDeMensaje(texto);
          if (extraida !== texto) {
            e.preventDefault();
            onChange(extraida);
          }
        }}
        style={{ ...checkoutInputStyle, paddingRight: 44, marginBottom: 0 }}
        autoComplete={autoComplete}
        name={name}
      />
      <button
        type="button"
        onClick={onToggleVisible}
        style={eyeBtnStyle}
        title={visible ? "Ocultar contraseña" : "Ver contraseña"}
        aria-label={visible ? "Ocultar contraseña" : "Ver contraseña"}
      >
        {visible ? "🙈" : "👁"}
      </button>
    </div>
  );
}

/**
 * Pantalla dedicada y explícita para cuando el cliente entra con una contraseña
 * temporal (acceso WhatsApp): obliga a cambiarla antes de seguir usando la cuenta.
 */
export default function CambioPasswordTemporalModal({
  abierto,
  onClose,
  onExito,
  mostrarNotificacion
}: CambioPasswordTemporalModalProps) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [cargando, setCargando] = useState(false);

  const limpiar = () => {
    setActual("");
    setNueva("");
    setConfirmar("");
    setShowActual(false);
    setShowNueva(false);
    setShowConfirmar(false);
  };

  const guardar = async () => {
    if (!actual || !nueva || !confirmar) {
      notificarError(mostrarNotificacion, "Completa la contraseña actual y la nueva.");
      return;
    }
    if (nueva !== confirmar) {
      notificarError(mostrarNotificacion, "Las contraseñas nuevas no coinciden.");
      return;
    }
    if (!passwordSeguraBasica(nueva)) {
      notificarError(mostrarNotificacion, "La nueva contraseña debe tener mínimo 8 caracteres, con letras y números.");
      return;
    }
    setCargando(true);
    try {
      await cambiarPasswordAutenticadoApi({ currentPassword: actual, newPassword: nueva });
      limpiar();
      notificarExito(mostrarNotificacion, "Contraseña actualizada correctamente.");
      onExito();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      notificarError(mostrarNotificacion, msg || "No se pudo cambiar la contraseña.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <ModalBase
      abierto={abierto}
      onClose={onClose}
      zIndex={12000}
      maxWidth="560px"
      cerrarAlPulsarFondo={false}
      styleCard={{
        background: THEME.bg,
        border: `3px solid ${THEME.goldMain}`,
        borderRadius: 20,
        padding: 0,
        width: "96%",
        maxHeight: "96vh",
        overflowY: "auto",
        boxShadow: "0 24px 80px rgba(0,0,0,0.85)"
      }}
    >
      {/* Cabecera explícita */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.08))",
          borderBottom: `2px solid ${THEME.goldMain}`,
          padding: "22px 24px",
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          textAlign: "center"
        }}
      >
        <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 6 }}>🔑</div>
        <h2 style={{ color: THEME.goldMain, margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: 0.5 }}>
          CAMBIA TU CONTRASEÑA
        </h2>
        <p style={{ color: "rgba(255,255,255,0.75)", margin: "6px 0 0", fontSize: 12, letterSpacing: 0.3 }}>
          Has entrado con una contraseña temporal
        </p>
      </div>

      {/* Cuerpo */}
      <div style={{ padding: "20px 24px" }}>
        <div
          role="alert"
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: `1px solid rgba(255,180,80,0.4)`,
            background: "rgba(255,180,80,0.08)",
            color: "#ffcc80",
            fontSize: 12.5,
            lineHeight: 1.55,
            marginBottom: 18
          }}
        >
          ⚠️ Esta contraseña es <strong>temporal y caduca</strong>. Para proteger tu cuenta,
          cámbiala ahora por una que <strong>solo sepas tú</strong>.
        </div>

        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
          Contraseña temporal recibida
        </p>
        <CampoPassword
          placeholder="Contraseña actual"
          value={actual}
          onChange={setActual}
          visible={showActual}
          onToggleVisible={() => setShowActual((v) => !v)}
          autoComplete="current-password"
          name="temporal-password-actual"
          extraerTemporal
        />
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: "-4px 0 4px", lineHeight: 1.4 }}>
          Puedes pegar el mensaje completo de WhatsApp: se extraerá solo la contraseña.
        </p>

        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, margin: "14px 0 10px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
          Tu nueva contraseña
        </p>
        <CampoPassword
          placeholder="Nueva contraseña"
          value={nueva}
          onChange={setNueva}
          visible={showNueva}
          onToggleVisible={() => setShowNueva((v) => !v)}
          autoComplete="new-password"
          name="temporal-password-nueva"
        />
        <CampoPassword
          placeholder="Confirmar nueva contraseña"
          value={confirmar}
          onChange={setConfirmar}
          visible={showConfirmar}
          onToggleVisible={() => setShowConfirmar((v) => !v)}
          autoComplete="new-password"
          name="temporal-password-confirmar"
        />
        <RequisitosPasswordHint password={nueva} />
      </div>

      {/* Botón grande */}
      <div style={{ padding: "0 24px 22px" }}>
        <button
          type="button"
          disabled={cargando}
          onClick={() => void guardar()}
          className="checkout-boton-finalizar"
          style={{
            ...checkoutPrimaryButtonStyleNoShadow,
            width: "100%",
            padding: "14px 16px",
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: 0.3,
            cursor: cargando ? "wait" : "pointer",
            opacity: cargando ? 0.85 : 1,
            boxSizing: "border-box"
          }}
        >
          {cargando ? "Guardando…" : "✓ Guardar nueva contraseña"}
        </button>
      </div>
    </ModalBase>
  );
}
