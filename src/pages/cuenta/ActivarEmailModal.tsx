import type { CSSProperties } from "react";
import ModalBase from "../../components/ModalBase";
import { THEME } from "../../config";
import { checkoutInputStyle } from "../../styles/inputStyle";
import { normalizarCodigoUltimoPedidoInput } from "../../utils/accesoRapidoVerificacion";

export interface ActivarEmailModalProps {
  codigoPedidoActivacion: string;
  setCodigoPedidoActivacion: (v: string) => void;
  errorActivacionEmail: string;
  setErrorActivacionEmail: (v: string) => void;
  intentosActivacionEmail: number;
  activacionEmailOk: boolean;
  setActivacionEmailOk: (v: boolean) => void;
  onVerificar: () => void;
  onClose: () => void;
  cuentaBotonAuth: CSSProperties;
  cuentaCtaPrincipalStyle: CSSProperties;
}

/** Modal «Activar cuenta»: pide el código del último pedido para vincular un email. */
export default function ActivarEmailModal(p: ActivarEmailModalProps) {
  const bloqueado = p.activacionEmailOk || p.intentosActivacionEmail >= 3;
  const cerrar = () => {
    p.setCodigoPedidoActivacion("");
    p.setErrorActivacionEmail("");
    p.setActivacionEmailOk(false);
    p.onClose();
  };

  return (
    <ModalBase
      abierto
      onClose={cerrar}
      zIndex={12000}
      maxWidth="440px"
      classNameCard="cuenta-maika-card modal-card"
      styleCard={{
        border: "1px solid rgba(212, 175, 55, 0.35)",
        borderRadius: 16,
        padding: "26px 22px 18px",
        width: "90%",
        textAlign: "center",
        boxSizing: "border-box"
      }}
    >
      <div style={{ fontSize: 38, marginBottom: 6 }}>🔐</div>
      <h3 style={{ color: THEME.goldMain, marginBottom: 8 }}>Activar cuenta</h3>
      <p style={{ color: "rgba(255,255,255,0.84)", fontSize: 13, lineHeight: 1.45, marginBottom: 12 }}>
        Introduce el código de tu último pedido para vincular un email a tus pedidos.
      </p>
      <input
        value={p.codigoPedidoActivacion}
        disabled={bloqueado}
        onChange={(e) => {
          p.setCodigoPedidoActivacion(normalizarCodigoUltimoPedidoInput(e.target.value));
          if (p.errorActivacionEmail) p.setErrorActivacionEmail("");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") p.onVerificar();
        }}
        placeholder="Código del último pedido"
        style={{ ...checkoutInputStyle, marginBottom: 10, boxSizing: "border-box", textTransform: "uppercase", opacity: bloqueado ? 0.72 : 1 }}
        autoComplete="off"
      />
      <button
        type="button"
        className="checkout-boton-finalizar"
        disabled={bloqueado}
        onClick={p.onVerificar}
        style={{ ...p.cuentaCtaPrincipalStyle, width: "100%", opacity: bloqueado ? 0.72 : 1, cursor: bloqueado ? "not-allowed" : "pointer" }}
      >
        {p.activacionEmailOk ? "Verificación correcta ✓" : "Verificar y continuar"}
      </button>
      {p.activacionEmailOk ? (
        <p style={{ color: "#9be7bd", margin: "10px 0 0", fontSize: 12 }}>Abriendo activación de cuenta...</p>
      ) : null}
      {p.errorActivacionEmail ? (
        <p style={{ color: "#ffb3b3", margin: "10px 0 0", fontSize: 12 }}>{p.errorActivacionEmail}</p>
      ) : null}
      <button
        type="button"
        onClick={cerrar}
        style={{ ...p.cuentaBotonAuth, marginTop: 12, background: "transparent", color: THEME.goldMain, border: "1px solid rgba(212, 175, 55, 0.45)" }}
      >
        Cancelar
      </button>
    </ModalBase>
  );
}
