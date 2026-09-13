import type { CSSProperties } from "react";
import ResumenPago from "../ResumenPago";
import type { CuponAplicado } from "../../types";
import { DATOS_PAGO_VACIOS } from "../../utils/pago";

type DatosPago = {
  bizumTelefono: string;
};

type CuponAplicadoLegacy = {
  codigo: string;
  descuento: number;
};

/** Evita `"tipo" in x` sobre primitivos (lanza TypeError y tumba React → pantalla negra). */
function cuponCheckoutParaResumen(
  cupon: CuponAplicado | CuponAplicadoLegacy | null | undefined
): CuponAplicado | null {
  if (cupon == null || typeof cupon !== "object" || Array.isArray(cupon)) return null;
  const c = cupon as Record<string, unknown>;
  if (c.tipo !== "porcentaje" && c.tipo !== "envio_gratis") return null;
  if (typeof c.codigo !== "string") return null;
  const valor = Number(c.valor);
  if (!Number.isFinite(valor)) return null;
  return { codigo: c.codigo, tipo: c.tipo, valor };
}

type Props = {
  datosPago: DatosPago;
  inputStyle: CSSProperties;
  total: number;
  envioPreview: number;
  cuponAplicado: CuponAplicado | CuponAplicadoLegacy | null;
  totalAPagar: number;
  procesandoPago: boolean;
  /** Error de servidor o excepción en checkout; visible bajo el resumen. */
  mensajeErrorCheckout?: string | null;
  /** Mismo criterio que en `Carrito`: solo rechazo 4xx (p. ej. stock). */
  bloquearFinalizarPorRechazoServidor?: boolean;
  onDatosPagoChange: (next: DatosPago) => void;
  onVolver: () => void;
  onPagar: () => void;
};

export default function CheckoutPagoPaso({
  datosPago,
  inputStyle,
  total,
  envioPreview,
  cuponAplicado,
  totalAPagar,
  procesandoPago,
  mensajeErrorCheckout = null,
  bloquearFinalizarPorRechazoServidor = false,
  onDatosPagoChange,
  onVolver,
  onPagar
}: Props) {
  const cuponResumen = cuponCheckoutParaResumen(cuponAplicado);
  const dp = datosPago ?? DATOS_PAGO_VACIOS;

  const finalizarDeshabilitado = procesandoPago || bloquearFinalizarPorRechazoServidor;

  return (
    <div
      key="paso-pago"
      translate="no"
      style={{ width: "100%", overflow: "visible", color: "#fff", fontSize: 15 }}
    >
      <h2 style={{ color: "rgba(245, 230, 200, 0.95)", marginBottom: 8, fontSize: 17, fontWeight: 700 }}>Confirma tu pedido</h2>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
        Revisa el pago y te llevaremos a WhatsApp para confirmarlo.
      </p>
      <div style={{ background: "rgba(212, 175, 55, 0.05)", padding: "12px 14px", borderRadius: 12, marginBottom: 14, border: "1px solid rgba(212, 175, 55, 0.2)" }}>
        <p style={{ marginTop: 0, marginBottom: 10, color: "rgba(245, 230, 200, 0.95)", fontSize: 14 }}>
          <strong>Pago:</strong> Bizum (confirmación por WhatsApp)
        </p>
        <label htmlFor="checkout-bizum-movil" style={{ display: "block", color: "rgba(255, 255, 255, 0.78)", fontSize: 13, marginBottom: 6 }}>
          Móvil donde recibirás el cobro Bizum (9 dígitos, empieza por 6 o 7)
        </label>
        <input
          id="checkout-bizum-movil"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          name="bizum-telefono"
          placeholder="Ej. 612345678"
          value={dp.bizumTelefono}
          onChange={(e) =>
            onDatosPagoChange({ ...dp, bizumTelefono: e.target.value.replace(/\D/g, "").slice(0, 11) })
          }
          style={{ ...inputStyle, marginBottom: 0, minHeight: 36, padding: "8px 10px", fontSize: 14, width: "100%", boxSizing: "border-box" }}
        />
      </div>

      <div className="checkout-resumen-box checkout-resumen-box--compact" style={{ marginBottom: 16 }}>
        <ResumenPago checkout total={total} envioPreview={envioPreview} cuponAplicado={cuponResumen} totalAPagar={totalAPagar} />
      </div>

      {mensajeErrorCheckout ? (
        <div
          role="alert"
          style={{
            marginBottom: 14,
            padding: "14px 16px",
            borderRadius: 12,
            border: "1px solid rgba(248, 113, 113, 0.5)",
            background: "linear-gradient(145deg, rgba(127, 29, 29, 0.42) 0%, rgba(69, 10, 10, 0.5) 100%)",
            color: "rgba(254, 242, 242, 0.98)",
            fontSize: 14,
            lineHeight: 1.55,
            fontWeight: 500,
            whiteSpace: "pre-line"
          }}
        >
          {mensajeErrorCheckout}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
        <button type="button" onClick={onVolver} style={{ flex: 1, minWidth: 120, padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(212, 175, 55, 0.35)", background: "transparent", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
          ← volver
        </button>
        <button
          type="button"
          onClick={onPagar}
          disabled={finalizarDeshabilitado}
          title={
            bloquearFinalizarPorRechazoServidor && !procesandoPago
              ? "Cierra el modal (X) para ir a la tienda; no puedes finalizar mientras haya este error."
              : undefined
          }
          style={{
            flex: 1.4,
            minWidth: 160,
            padding: "12px 14px",
            borderRadius: 12,
            border: "none",
            background:
              bloquearFinalizarPorRechazoServidor && !procesandoPago
                ? "#5a5a5a"
                : procesandoPago
                  ? "#8a8a8a"
                  : "linear-gradient(180deg, #2fe576 0%, #20bd5a 100%)",
            color: "#fff",
            fontWeight: 800,
            cursor: finalizarDeshabilitado ? "not-allowed" : "pointer",
            opacity: finalizarDeshabilitado ? 0.72 : 1,
            fontSize: 14,
            boxShadow: finalizarDeshabilitado ? "none" : "0 4px 20px rgba(37, 211, 102, 0.45)"
          }}
        >
          {procesandoPago
            ? "abriendo WhatsApp…"
            : bloquearFinalizarPorRechazoServidor
              ? "Volver a la tienda"
              : "Confirmar y enviar por WhatsApp"}
        </button>
      </div>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: 12,
          lineHeight: 1.45,
          textAlign: "center",
          color: "rgba(245, 230, 200, 0.88)",
          fontWeight: 600
        }}
      >
        Te llevaremos a WhatsApp para confirmar tu pedido con Maika.
      </p>
      <div style={{ marginTop: 10, fontSize: 11, lineHeight: 1.55, color: "rgba(255, 255, 255, 0.62)" }}>
        <div>Respuesta habitual en menos de 10 min por WhatsApp</div>
        <div>Confirmamos disponibilidad antes de cobrar</div>
        <div>Sin compromiso: puedes cancelar si no te encaja</div>
      </div>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: 12,
          lineHeight: 1.45,
          textAlign: "center",
          color: "rgba(245, 230, 200, 0.82)",
          fontWeight: 600
        }}
      >
        Atendemos pedidos hoy hasta las 20:00
      </p>
    </div>
  );
}
