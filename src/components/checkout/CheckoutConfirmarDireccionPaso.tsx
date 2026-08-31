import type { Cliente } from "../../types";
import { checkoutPrimaryButtonStyle } from "../../styles/inputStyle";
import { construirDireccionCompleta } from "../../utils/direccion";

type Props = {
  datosCliente: Cliente;
  goldColor: string;
  normalizarTelefonoBizum: (telefono: string) => string;
  onVolver: () => void;
  onContinuarPago: () => void;
};

export default function CheckoutConfirmarDireccionPaso({
  datosCliente,
  goldColor,
  normalizarTelefonoBizum,
  onVolver,
  onContinuarPago
}: Props) {
  return (
    <div key="paso-confirmar-direccion" style={{ width: "100%", overflow: "visible", color: "#fff", fontSize: 15 }}>
      <h2 style={{ color: "rgba(245,230,200,0.95)", marginBottom: 8, textTransform: "uppercase", fontSize: 16, fontWeight: 700 }}>Revisa tu entrega</h2>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(255,255,255,0.68)", lineHeight: 1.45 }}>
        Comprueba dirección y teléfono. El siguiente paso es Bizum y el envío por WhatsApp.
      </p>
      <p style={{ margin: "0 0 14px", fontSize: 12, color: "rgba(245,230,200,0.78)", lineHeight: 1.45 }}>
        Asegúrate de que todo es correcto antes de continuar.
      </p>
      <div style={{ background: "rgba(212, 175, 55, 0.05)", padding: "14px 16px", borderRadius: 12, marginBottom: 16, border: "1px solid rgba(212, 175, 55, 0.2)", textTransform: "uppercase" }}>
        <div style={{ fontSize: 16, color: "rgba(255,255,255,0.92)", lineHeight: 1.7 }}>
          <div style={{ marginBottom: 6 }}>
            <strong>{`${(datosCliente.nombre || "").trim()} ${(datosCliente.apellidos || "").trim()}`.trim() || datosCliente.nombreApellidos || "—"}</strong>
          </div>
          <div style={{ marginBottom: 6 }}>
            {construirDireccionCompleta({
              calle: datosCliente.calle,
              numero: datosCliente.numero,
              bloque: datosCliente.bloque,
              escalera: datosCliente.escalera,
              piso: datosCliente.piso,
              puerta: datosCliente.puerta
            }) || "—"}
          </div>
          <div style={{ marginBottom: 6 }}>{(`${(datosCliente.cp || "").trim()} ${(datosCliente.poblacion || "").trim()}`.trim()) || "—"}</div>
          <div style={{ marginBottom: (datosCliente.notas || "").trim() ? 6 : 0 }}>{([(datosCliente.provincia || "").trim(), (datosCliente.pais || "").trim()].filter(Boolean).join(" – ")) || "—"}</div>
          {(datosCliente.notas || "").trim() && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(201,162,74,0.3)", fontSize: 14, color: "rgba(255,255,255,0.85)" }}>
              <strong>Notas:</strong> {datosCliente.notas?.trim()}
            </div>
          )}
        </div>
      </div>
      <div style={{ background: "rgba(212, 175, 55, 0.05)", padding: "14px 16px", borderRadius: 12, marginBottom: 20, border: "1px solid rgba(212, 175, 55, 0.2)", textTransform: "uppercase" }}>
        <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "rgba(245, 230, 200, 0.95)", letterSpacing: "0.04em" }}>Teléfono de contacto y pago</p>
        <div style={{ fontSize: 18, color: goldColor, fontWeight: "bold", marginBottom: 8 }}>
          +34 {normalizarTelefonoBizum(datosCliente.telefono || "") || "—"}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.5 }}>
          Este número se utilizará para el contacto y para el pago por Bizum.
        </p>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 15 }}>
        <button type="button" onClick={onVolver} style={{ flex: 1, minWidth: 120, padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(212, 175, 55, 0.35)", background: "transparent", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
          ← volver
        </button>
        <button
          type="button"
          onClick={onContinuarPago}
          style={{ flex: 1, minWidth: 120, padding: "12px 14px", borderRadius: 10, cursor: "pointer", fontSize: 14, ...checkoutPrimaryButtonStyle }}
        >
          Continuar al pago →
        </button>
      </div>
    </div>
  );
}
