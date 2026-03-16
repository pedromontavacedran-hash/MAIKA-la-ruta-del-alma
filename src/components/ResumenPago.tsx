import type { CuponAplicado } from "../types";

export default function ResumenPago({
  total,
  envioPreview,
  cuponAplicado,
  totalAPagar
}: {
  total: number;
  envioPreview: number;
  cuponAplicado: CuponAplicado | null;
  totalAPagar: number;
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
        padding: destacar ? "10px 0" : "6px 0",
        borderBottom: destacar ? "2px solid #C9A24A" : "1px solid rgba(201,162,74,0.2)",
        marginBottom: destacar ? 0 : 4
      }}
    >
      <span style={{ color: "white", opacity: destacar ? 1 : 0.9 }}>{label}</span>
      <span style={{ color: destacar ? "#C9A24A" : "white", fontWeight: destacar ? "bold" : "normal", fontSize: destacar ? 18 : 14 }}>
        {valor}
      </span>
    </div>
  );
  return (
    <>
      <p style={{ marginBottom: 12 }}><strong>Resumen:</strong></p>
      {fila("subtotal", "Subtotal", `${Number(total).toFixed(2)} €`)}
      {fila("envio", "Envío", `${Number(envioPreview).toFixed(2)} €`)}
      {cuponAplicado != null && (
        <>
          {fila("cupon", "🎟️ Cupón", cuponAplicado.codigo)}
          {fila("descuento", textoDescuento, `-${Number(descuento).toFixed(2)} €`)}
        </>
      )}
      {fila("total", "TOTAL", `${Number(totalAPagar).toFixed(2)} €`, true)}
    </>
  );
}
