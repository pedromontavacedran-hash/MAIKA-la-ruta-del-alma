import type { CSSProperties } from "react";
import ModalBase from "../../components/ModalBase";
import { THEME } from "../../config";
import { textoFechaPedido } from "../../utils/fechaPedido";
import type { MaikaPedidoLS } from "../../utils/cuentaPageHelpers";

export interface PedidoDetalleModalProps {
  pedido: MaikaPedidoLS;
  onClose: () => void;
  cuentaBotonAuth: CSSProperties;
}

/** Modal «Detalles del pedido»: fecha, dirección, líneas y total. */
export default function PedidoDetalleModal({ pedido, onClose, cuentaBotonAuth }: PedidoDetalleModalProps) {
  return (
    <ModalBase
      abierto
      onClose={onClose}
      zIndex={12000}
      maxWidth="520px"
      classNameCard="cuenta-maika-card modal-card"
      styleCard={{
        border: "1px solid rgba(212, 175, 55, 0.3)",
        borderRadius: 16,
        padding: "28px 22px 18px",
        width: "90%",
        textAlign: "center",
        boxSizing: "border-box"
      }}
    >
        <div style={{ fontSize: 44, marginBottom: 6 }}>🧾</div>
        <h3 style={{ color: THEME.goldMain, marginBottom: 10 }}>
          Detalles del pedido ({String(pedido.idPedido ?? "").slice(-6)})
        </h3>
        <p style={{ color: "white", marginBottom: 10 }}>
          Fecha: {textoFechaPedido(pedido.fecha, true)}
        </p>
        <p style={{ color: "white", marginBottom: 10 }}>
          Dirección: {pedido.direccionCompleta || "—"}
        </p>
        <div style={{ color: "white", textAlign: "left", marginTop: 12 }}>
          {(pedido.productos || []).map((pr, idx) => (
            <div key={`${pr.idProducto}-${idx}`} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
              <span>{pr.nombre} x {pr.cantidad}</span>
              <span>{Number(pr.precio || 0).toFixed(2)} €</span>
            </div>
          ))}
        </div>
        <p className="checkout-total-precio" style={{ marginTop: 12 }}>
          Total: {Number(pedido.total || 0).toFixed(2)} €
        </p>
        {pedido.nota && (
          <p style={{ color: "white", marginTop: 10, opacity: 0.95 }}>
            Nota: {pedido.nota}
          </p>
        )}
        <button
          type="button"
          onClick={onClose}
          style={{ ...cuentaBotonAuth, marginTop: 16, background: "transparent", color: THEME.goldMain, border: "1px solid rgba(212, 175, 55, 0.45)" }}
        >
          Cerrar
        </button>
    </ModalBase>
  );
}
