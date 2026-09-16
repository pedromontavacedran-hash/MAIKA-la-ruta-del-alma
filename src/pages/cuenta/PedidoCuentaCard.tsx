import { THEME } from "../../config";
import { textoFechaPedido } from "../../utils/fechaPedido";
import { checkoutPrimaryButtonStyleNoShadow } from "../../styles/inputStyle";
import type { MaikaPedidoLS } from "../../utils/cuentaPageHelpers";

export function estadoTextoPedido(estado?: MaikaPedidoLS["estado"]) {
  if (estado === "enviado") return "🚚 Enviado";
  if (estado === "entregado") return "✅ Entregado";
  return "🛒 Pendiente";
}

export interface PedidoCuentaCardProps {
  pedido: MaikaPedidoLS;
  onVerDetalles: (p: MaikaPedidoLS) => void;
  onRepetirPedido: (p: MaikaPedidoLS) => void;
}

/** Tarjeta de pedido en «Mis Pedidos»: fecha, estado, total y acciones. */
export default function PedidoCuentaCard({ pedido: p, onVerDetalles, onRepetirPedido }: PedidoCuentaCardProps) {
  const resumenProductos = (p.productos || []).reduce((sum, pr) => sum + (Number(pr.cantidad) || 0), 0);
  return (
    <div className="cuenta-maika-pedido-card" style={{ padding: 15, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <strong style={{ color: THEME.goldMain }}>
          {textoFechaPedido(p.fecha, false)}
        </strong>
        <span style={{ color: "white", fontSize: 12 }}>{estadoTextoPedido(p.estado)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ color: "white" }}>Total: {Number(p.total || 0).toFixed(2)} €</span>
        <span style={{ color: "white" }}>{resumenProductos} productos</span>
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
        <button
          onClick={() => onVerDetalles(p)}
          style={{ flex: 1, minWidth: 0, padding: "12px 10px", background: "transparent", color: "rgba(255,255,255,0.92)", border: "1px solid rgba(212, 175, 55, 0.45)", borderRadius: 10, cursor: "pointer", fontWeight: 600 }}
        >
          Ver detalles
        </button>
        <button
          type="button"
          className="checkout-boton-finalizar"
          onClick={() => onRepetirPedido(p)}
          style={{
            flex: 1,
            minWidth: 0,
            padding: "12px 10px",
            borderRadius: 10,
            cursor: "pointer",
            ...checkoutPrimaryButtonStyleNoShadow
          }}
        >
          Repetir pedido
        </button>
      </div>
    </div>
  );
}
