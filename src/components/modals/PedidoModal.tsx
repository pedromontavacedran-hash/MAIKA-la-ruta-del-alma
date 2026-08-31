import type { ItemCarrito, Pedido } from "../../types";
import { textoDireccionVistaAdmin } from "../../utils/pedidos/direccionPedidoVista";
import ModalBase from "../ModalBase";

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
  return (
    <ModalBase
      abierto={!!pedido}
      onClose={onClose}
      zIndex={10035}
      maxWidth="520px"
      styleCard={{
        background: bgColor,
        border: `3px solid ${goldColor}`,
        borderRadius: 20,
        padding: 24,
        width: "100%",
        maxHeight: "85vh",
        overflowY: "auto",
        color: "#fff"
      }}
    >
      {pedido ? (
        <>
        <h2 style={{ color: goldColor, margin: "0 0 16px", paddingRight: 28 }}>📄 Factura / Pedido {pedido.numero}</h2>

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

        {(() => {
          const dirLinea = textoDireccionVistaAdmin(pedido);
          return (
            <>
              {dirLinea ? (
                <div
                  style={{
                    background: bgColor,
                    padding: 12,
                    borderRadius: 10,
                    marginBottom: 12,
                    border: `1px solid ${goldColor}`
                  }}
                >
                  <p style={{ color: goldColor, margin: "0 0 6px", fontWeight: "bold" }}>Dirección de envío</p>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45 }}>{dirLinea}</p>
                </div>
              ) : null}

              <div style={{ background: bgColor, padding: 12, borderRadius: 10, marginBottom: 12, border: `1px solid ${goldColor}` }}>
                <p style={{ color: goldColor, margin: "0 0 6px", fontWeight: "bold" }}>Cliente</p>
                <p style={{ margin: "0 0 2px" }}>{pedido.cliente?.nombreApellidos}</p>
                {pedido.cliente?.email && <p style={{ margin: "0 0 2px" }}>{pedido.cliente.email}</p>}
                {pedido.cliente?.telefono && <p style={{ margin: "0 0 2px" }}>{pedido.cliente.telefono}</p>}
              </div>
            </>
          );
        })()}

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
        </>
      ) : null}
    </ModalBase>
  );
}
