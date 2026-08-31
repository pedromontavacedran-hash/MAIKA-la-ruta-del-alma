import type { CuponAplicado } from "../types";
import { THEME } from "../config";

export default function ResumenPago({
  total,
  envioPreview,
  cuponAplicado,
  totalAPagar,
  checkout = false
}: {
  total: number;
  envioPreview: number;
  cuponAplicado: CuponAplicado | null;
  totalAPagar: number;
  /** Estilo compacto y bordes suaves en el modal de checkout. */
  checkout?: boolean;
}) {
  const descuento =
    cuponAplicado == null
      ? 0
      : cuponAplicado.tipo === "porcentaje"
        ? (total * cuponAplicado.valor) / 100
        : envioPreview;
  const textoDescuento =
    cuponAplicado == null
      ? ""
      : cuponAplicado.tipo === "porcentaje"
        ? `Descuento (${cuponAplicado.valor}%):`
        : "Descuento (envío gratis):";
  const fila = (key: string, label: React.ReactNode, valor: React.ReactNode, destacar = false) => (
    <div
      key={key}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        padding: destacar ? (checkout ? "6px 0" : "10px 0") : checkout ? "3px 0" : "5px 0",
        borderBottom: destacar
          ? checkout
            ? "1px solid rgba(212, 175, 55, 0.35)"
            : `2px solid ${THEME.goldMain}`
          : "1px solid rgba(255,255,255,0.08)",
        marginBottom: destacar ? 0 : checkout ? 0 : 4
      }}
    >
      <span
        style={{
          color: destacar
            ? checkout
              ? "rgba(255,255,255,0.92)"
              : "rgba(255,255,255,0.88)"
            : checkout
              ? "rgba(255,255,255,0.7)"
              : "rgba(255,255,255,0.88)",
          opacity: checkout ? 1 : destacar ? 1 : 0.92,
          fontSize: checkout ? 14 : undefined
        }}
      >
        {label}
      </span>
      <span
        className={checkout && destacar ? "checkout-total-precio" : undefined}
        style={
          checkout && destacar
            ? {}
            : {
                color: destacar ? THEME.goldMain : checkout ? "#fff" : "rgba(255,255,255,0.92)",
                fontWeight: destacar ? "bold" : "normal",
                fontSize: destacar ? 18 : checkout ? 14 : 14
              }
        }
      >
        {valor}
      </span>
    </div>
  );
  return (
    <>
      {!checkout && (
        <p style={{ marginBottom: 12 }}>
          <strong>Resumen:</strong>
        </p>
      )}
      {!checkout && fila("subtotal", "Subtotal", `${Number(total).toFixed(2)} €`)}
      {fila("envio", "Envío", `${Number(envioPreview).toFixed(2)} €`)}
      {cuponAplicado != null && (
        <>
          {fila("cupon", "🎟️ Cupón", cuponAplicado.codigo)}
          {fila("descuento", textoDescuento, `-${Number(descuento).toFixed(2)} €`)}
        </>
      )}
      {fila("total", checkout ? "Total" : "TOTAL", `${Number(totalAPagar).toFixed(2)} €`, true)}
    </>
  );
}
