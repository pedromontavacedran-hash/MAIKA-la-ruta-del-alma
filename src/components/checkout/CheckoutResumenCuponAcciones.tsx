import type { CSSProperties, MutableRefObject, RefObject } from "react";
import type { CuponAplicado } from "../../types";
import { checkoutPrimaryButtonStyle } from "../../styles/inputStyle";
import ResumenPago from "../ResumenPago";
import CheckoutConfianzaWhatsApp from "./CheckoutConfianzaWhatsApp";

type Props = {
  modoDireccionCheckout: boolean;
  modoNuevaDireccionCheckout: boolean;
  /** Si false, no se muestra «guardar dirección» aquí (p. ej. cuenta: botones junto al formulario). Por defecto true. */
  mostrarGuardarDireccionEnFooter?: boolean;
  guardandoDireccionCheckout: boolean;
  accesoRapidoCheckoutAbierto: boolean;
  checkoutIrAlPagoGesturaActiva: boolean;
  onCheckoutIrAlPagoGesturaInicio: () => void;
  onCheckoutIrAlPagoGesturaFin: () => void;
  inputStyle: CSSProperties;
  goldColor: string;
  total: number;
  envioPreview: number;
  cuponAplicado: CuponAplicado | null;
  totalAPagarResumen: number;
  mostrarInputCuponCheckout: boolean;
  cuponError: string | null;
  cuponInput: string;
  botonIrAlPagoRef: RefObject<HTMLButtonElement | null>;
  irAlPagoPointerIdRef: MutableRefObject<number | null>;
  irAlPagoEjecutarRef: MutableRefObject<() => void>;
  onToggleMostrarInputCupon: (v: boolean) => void;
  onCuponInputChange: (value: string) => void;
  onLimpiarCuponError: () => void;
  onAplicarCupon: () => void;
  onQuitarCupon: () => void;
  onGuardarDireccion: () => void;
  /** Referencia del pedido (solo checkout tienda): encima del resumen, tipografía discreta. */
  numeroPedidoPreview?: string;
};

export default function CheckoutResumenCuponAcciones({
  modoDireccionCheckout,
  modoNuevaDireccionCheckout,
  mostrarGuardarDireccionEnFooter = true,
  guardandoDireccionCheckout,
  accesoRapidoCheckoutAbierto,
  checkoutIrAlPagoGesturaActiva,
  onCheckoutIrAlPagoGesturaInicio,
  onCheckoutIrAlPagoGesturaFin,
  total,
  envioPreview,
  cuponAplicado,
  totalAPagarResumen,
  mostrarInputCuponCheckout,
  cuponError,
  cuponInput,
  botonIrAlPagoRef,
  irAlPagoPointerIdRef,
  irAlPagoEjecutarRef,
  onToggleMostrarInputCupon,
  onCuponInputChange,
  onLimpiarCuponError,
  onAplicarCupon,
  onQuitarCupon,
  onGuardarDireccion,
  numeroPedidoPreview = ""
}: Props) {
  const bloqueoCtaIrAlPago = accesoRapidoCheckoutAbierto || checkoutIrAlPagoGesturaActiva;

  const soloAgregarCupon =
    !mostrarInputCuponCheckout && !cuponAplicado && !cuponError;

  return (
    <>
      {!modoDireccionCheckout && numeroPedidoPreview.trim() ? (
        <div
          style={{
            fontSize: 11,
            opacity: 0.6,
            marginBottom: 8,
            textAlign: "center",
            color: "rgba(245, 230, 200, 0.78)",
            letterSpacing: "0.02em"
          }}
        >
          Pedido: {numeroPedidoPreview.trim()}
        </div>
      ) : null}
      {!modoDireccionCheckout && (
        <div
          key={`resumen-${totalAPagarResumen}-${cuponAplicado?.codigo ?? ""}`}
          className="checkout-resumen-box checkout-resumen-box--compact"
          style={{ marginBottom: 12 }}
        >
          <ResumenPago checkout total={total} envioPreview={envioPreview} cuponAplicado={cuponAplicado} totalAPagar={totalAPagarResumen} />
        </div>
      )}

      {!modoDireccionCheckout && (
        <div style={{ marginTop: 10, marginBottom: 4 }}>
          {soloAgregarCupon ? (
            <button
              type="button"
              className="checkout-codigo-descuento"
              onClick={() => onToggleMostrarInputCupon(true)}
            >
              🎟️ ¿Tienes un código de descuento?
            </button>
          ) : (
            <>
              <div style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.5)", marginBottom: 4 }}>
                Código descuento
              </div>
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  maxWidth: 260,
                  width: "100%",
                  marginBottom: cuponAplicado || cuponError ? 10 : 0
                }}
              >
                <input
                  type="text"
                  name="maika-checkout-cupon"
                  placeholder="Código"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  value={cuponInput}
                  onChange={(e) => { onCuponInputChange(e.target.value); onLimpiarCuponError(); }}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onAplicarCupon())}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    marginBottom: 0,
                    background: "rgba(255, 255, 255, 0.05)",
                    border: cuponError ? "1px solid rgba(255, 120, 120, 0.45)" : "1px solid rgba(212, 175, 55, 0.2)",
                    borderRadius: 8,
                    padding: 8,
                    color: "#fff",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
                <button
                  type="button"
                  onClick={onAplicarCupon}
                  style={{
                    padding: "8px 10px",
                    background: "rgba(212, 175, 55, 0.15)",
                    color: "#d4af37",
                    border: "1px solid rgba(212, 175, 55, 0.25)",
                    borderRadius: 8,
                    fontSize: 13,
                    cursor: "pointer",
                    flexShrink: 0,
                    fontWeight: 500
                  }}
                >
                  aplicar
                </button>
              </div>

              {cuponAplicado && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                    marginTop: 8,
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: "rgba(212, 175, 55, 0.06)",
                    border: "1px solid rgba(212, 175, 55, 0.15)"
                  }}
                >
                  <span style={{ color: "rgba(245, 230, 200, 0.9)", fontWeight: 600, fontSize: 13 }}>
                    Cupón activo: {cuponAplicado?.codigo}
                  </span>
                  <button
                    type="button"
                    onClick={onQuitarCupon}
                    style={{
                      background: "transparent",
                      color: "rgba(255, 100, 100, 0.95)",
                      border: "1px solid rgba(255, 100, 100, 0.4)",
                      borderRadius: 8,
                      padding: "4px 10px",
                      cursor: "pointer",
                      fontSize: 12
                    }}
                  >
                    quitar
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div style={{ flexShrink: 0, paddingTop: 4, marginTop: 0, background: "transparent" }}>
        {modoDireccionCheckout ? (
          mostrarGuardarDireccionEnFooter && modoNuevaDireccionCheckout ? (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={onGuardarDireccion}
                disabled={guardandoDireccionCheckout}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 10,
                  cursor: guardandoDireccionCheckout ? "not-allowed" : "pointer",
                  opacity: guardandoDireccionCheckout ? 0.85 : 1,
                  ...(guardandoDireccionCheckout
                    ? { background: "#8a8a8a", color: "rgba(255,255,255,0.85)", border: "none", boxShadow: "none" }
                    : checkoutPrimaryButtonStyle)
                }}
              >
                {guardandoDireccionCheckout ? "guardando…" : "guardar dirección"}
              </button>
            </div>
          ) : null
        ) : (
          <>
            <CheckoutConfianzaWhatsApp />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                ref={botonIrAlPagoRef}
                onPointerDown={(e) => {
                  if (bloqueoCtaIrAlPago) return;
                  if (e.pointerType === "mouse" && e.button !== 0) return;
                  onCheckoutIrAlPagoGesturaInicio();
                  irAlPagoPointerIdRef.current = e.pointerId;
                }}
                onKeyDown={(e) => {
                  if (bloqueoCtaIrAlPago) return;
                  if (e.key !== "Enter" && e.key !== " ") return;
                  e.preventDefault();
                  onCheckoutIrAlPagoGesturaInicio();
                  irAlPagoEjecutarRef.current();
                  onCheckoutIrAlPagoGesturaFin();
                }}
                onMouseEnter={(e) => {
                  if (bloqueoCtaIrAlPago) return;
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
                disabled={bloqueoCtaIrAlPago}
                className="checkout-boton-finalizar checkout-boton-finalizar--whatsapp"
                style={{
                  width: "100%",
                  padding: "13px 14px",
                  borderRadius: 10,
                  cursor: bloqueoCtaIrAlPago ? "not-allowed" : "pointer",
                  border: "none",
                  fontWeight: 600,
                  fontSize: 15,
                  opacity: bloqueoCtaIrAlPago ? 0.85 : 1,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease, opacity 0.2s ease"
                }}
              >
                {checkoutIrAlPagoGesturaActiva ? "Continuando..." : "Revisar dirección de envío"}
              </button>
            </div>
            <p className="checkout-texto-ayuda" style={{ marginTop: 8, marginBottom: 0, textAlign: "center", width: "100%", maxWidth: "none" }}>
              Primero revisaremos la dirección y el teléfono de contacto.
            </p>
          </>
        )}
      </div>
    </>
  );
}
