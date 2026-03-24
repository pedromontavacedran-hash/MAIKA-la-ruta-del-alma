import type { ItemCarrito, Pedido } from "../../types";

type Props = {
  pedido: Pedido | null;
  onClose: () => void;
  bgColor: string;
  goldColor: string;
  notaPedidoEnvio: string;
};

export default function PedidoModal({
  pedido,
  onClose,
  bgColor,
  goldColor,
  notaPedidoEnvio
}: Props) {
  if (!pedido) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10001,
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: bgColor,
          border: `3px solid ${goldColor}`,
          borderRadius: 20,
          padding: 24,
          maxWidth: 520,
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          color: "#fff"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ color: goldColor, margin: 0 }}>📄 Factura / Pedido {pedido.numero}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: `2px solid ${goldColor}`,
              color: goldColor,
              borderRadius: 10,
              padding: "8px 14px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Cerrar
          </button>
        </div>

        <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.9)" }}><strong>Fecha:</strong> {pedido.fecha}</p>
        <p style={{ margin: "0 0 12px", color: "rgba(255,255,255,0.9)" }}>
          <strong>Estado:</strong>{" "}
          <span
            style={{
              color: pedido.estado === "pendiente" ? "#22d3ee" : pedido.estado === "enviado" ? "#e67e22" : "#2ecc71",
              fontWeight: "bold"
            }}
          >
            {pedido.estado === "pendiente" ? "Pendiente" : pedido.estado === "enviado" ? "Enviado" : "Entregado"}
          </span>
        </p>

        <div style={{ background: bgColor, padding: 12, borderRadius: 10, marginBottom: 12, border: `1px solid ${goldColor}` }}>
          <p style={{ color: goldColor, margin: "0 0 6px", fontWeight: "bold" }}>Cliente</p>
          <p style={{ margin: "0 0 2px" }}>{pedido.cliente?.nombreApellidos}</p>
          {pedido.cliente?.email && <p style={{ margin: "0 0 2px" }}>{pedido.cliente.email}</p>}
          {pedido.cliente?.telefono && <p style={{ margin: "0 0 2px" }}>{pedido.cliente.telefono}</p>}
          {(pedido.cliente?.direccion || pedido.cliente?.calle) && (
            <p style={{ margin: "4px 0 0" }}>
              {pedido.cliente.direccion || [pedido.cliente.calle, pedido.cliente.numero].filter(Boolean).join(" ")}
              {pedido.cliente.cp || pedido.cliente.poblacion ? ` — ${[pedido.cliente.cp, pedido.cliente.poblacion].filter(Boolean).join(" ")}` : ""}
              {pedido.cliente.provincia ? `, ${pedido.cliente.provincia}` : ""}
            </p>
          )}
        </div>

        <div style={{ background: bgColor, padding: 12, borderRadius: 10, marginBottom: 12, border: `1px solid ${goldColor}` }}>
          <p style={{ color: goldColor, margin: "0 0 8px", fontWeight: "bold" }}>Detalle</p>
          {pedido.items?.map((it: ItemCarrito, idx: number) => (
            <div key={`factura-${pedido.numero}-${idx}`} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>{it.nombre} x{it.cantidad}</span>
              <span>{(it.precio * it.cantidad).toFixed(2)} €</span>
            </div>
          ))}
        </div>

        <div style={{ background: bgColor, padding: 12, borderRadius: 10, border: `1px solid ${goldColor}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Subtotal</span><span>{pedido.subtotal?.toFixed(2)} €</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Envío</span><span>{pedido.envio?.toFixed(2)} €</span></div>
          {pedido.descuento != null && pedido.descuento > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Descuento</span><span>-{pedido.descuento.toFixed(2)} €</span></div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, color: goldColor, fontWeight: "bold", fontSize: 18 }}><span>TOTAL</span><span>{pedido.total?.toFixed(2)} €</span></div>
        </div>

        {pedido.pago && (
          <p style={{ marginTop: 12, fontSize: 14, opacity: 0.9 }}>
            Pago: {pedido.pago.metodo === "bizum" ? "Bizum" : "Tarjeta"} — {pedido.pago.estado}
            {pedido.pago.referencia ? ` (${pedido.pago.referencia})` : ""}
          </p>
        )}

        {notaPedidoEnvio.trim() !== "" && (
          <div style={{ marginTop: 14, padding: 12, background: "rgba(201,162,74,0.1)", borderRadius: 10, border: "1px solid rgba(201,162,74,0.4)" }}>
            <p style={{ color: goldColor, margin: "0 0 4px", fontWeight: "bold", fontSize: 14 }}>📝 Nota para el cliente / envío</p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.95)", fontSize: 14, whiteSpace: "pre-wrap" }}>{notaPedidoEnvio.trim()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
