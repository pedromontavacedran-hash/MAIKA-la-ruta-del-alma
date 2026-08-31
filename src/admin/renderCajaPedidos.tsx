import type { ReactNode } from "react";
import type { ItemCarrito, Pedido } from "../types";
import { normalizarTelefonoES9 } from "../utils/telefono";
import { textoDireccionVistaAdmin } from "../utils/pedidos/direccionPedidoVista";

/** Inyectado en `<Layout pulseStyle={…}>` para la animación de la caja de pendientes en seguimiento. */
export const PULSE_CAJA_PEDIDOS_ADMIN_STYLE = `
    @keyframes pulseCaja {
      0% { box-shadow: 0 0 0 0 #22d3ee; border-color: #22d3ee; }
      50% { box-shadow: 0 0 25px 8px #22d3ee; border-color: #ffffff; }
      100% { box-shadow: 0 0 0 0 #22d3ee; border-color: #22d3ee; }
    }
  `;

export type BuildRenderCajaPedidosDeps = {
  themeBg: string;
  themeGold: string;
  busquedaPedido: string;
  pedidos: Pedido[];
  pedidoAbierto: number | null;
  setPedidoAbierto: (v: number | null) => void;
  accesoAdmin: boolean;
  cambiarEstadoPedido: (numeroPedido: string, nuevoEstado: Pedido["estado"]) => void | Promise<void>;
  onAbrirFacturaPedido: (p: Pedido | null) => void;
};

/**
 * Misma firma que `AppContextValue["renderCajaPedidos"]`: la usa `SeguimientoPage` vía contexto.
 */
export function buildRenderCajaPedidos(d: BuildRenderCajaPedidosDeps) {
  const {
    themeBg,
    themeGold,
    busquedaPedido,
    pedidos,
    pedidoAbierto,
    setPedidoAbierto,
    accesoAdmin,
    cambiarEstadoPedido,
    onAbrirFacturaPedido
  } = d;

  return function renderCajaPedidos(
    titulo: string,
    pedidosList: Pedido[],
    color: string,
    icono: string,
    abierto: boolean,
    setAbierto: (value: boolean) => void,
    animar: boolean = false
  ): ReactNode {
    const q = busquedaPedido.trim().toLowerCase();
    const qTel = normalizarTelefonoES9(busquedaPedido);
    const filtroTelefonoExacto = /^[67]\d{8}$/.test(qTel);
    const pedidosFiltrados = pedidosList.filter((p) =>
      q === ""
        ? true
        : filtroTelefonoExacto
          ? normalizarTelefonoES9(p.cliente?.telefono || "") === qTel
          : String(p.numero).toLowerCase().includes(q) ||
            p.cliente?.nombreApellidos?.toLowerCase().includes(q) ||
            (p.cliente?.telefono || "").toLowerCase().includes(q)
    );
    const debeAnimar = animar && pedidosFiltrados.length > 0;

    return (
      <div
        style={{
          marginBottom: 20,
          border: `2px solid ${color}`,
          borderRadius: 15,
          overflow: "hidden",
          background: themeBg,
          boxShadow: abierto ? `0 0 20px ${color}` : "none",
          transition: "all 0.3s ease",
          animation: debeAnimar ? "pulseCaja 1.4s ease-in-out infinite" : "none"
        }}
      >
        <div
          onClick={() => setAbierto(!abierto)}
          style={{
            padding: "15px 20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: themeBg
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            <span style={{ fontSize: "1.8rem" }}>{icono}</span>
            <h3 style={{ margin: 0, color: color }}>{titulo}</h3>
          </div>
          <span style={{ color: color, fontSize: "1.5rem" }}>{abierto ? "▼" : "▶"}</span>
        </div>

        {abierto && (
          <div style={{ padding: "20px", maxHeight: "500px", overflowY: "auto" }}>
            {pedidosFiltrados.length === 0 ? (
              <p style={{ color: "white", opacity: 0.7, textAlign: "center" }}>
                {q ? "No hay pedidos para esta búsqueda" : "No hay pedidos"}
              </p>
            ) : (
              pedidosFiltrados.map((p) => {
                const indexEnOriginal = pedidos.findIndex((original) => original.numero === p.numero);
                const dirConfirmadaLista = textoDireccionVistaAdmin(p);
                return (
                  <div
                    key={p.numero}
                    onClick={() => setPedidoAbierto(pedidoAbierto === indexEnOriginal ? null : indexEnOriginal)}
                    style={{
                      background: themeBg,
                      border: `1px solid ${themeGold}`,
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 10,
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong style={{ color: themeGold }}>{p.numero}</strong>
                      <span style={{ color: "white", fontSize: "0.8rem" }}>{p.fecha}</span>
                    </div>
                    <div style={{ color: "white" }}>{p.cliente?.nombreApellidos}</div>
                    {accesoAdmin && dirConfirmadaLista ? (
                      <div
                        style={{
                          color: "rgba(255,255,255,0.88)",
                          fontSize: 12,
                          marginTop: 6,
                          lineHeight: 1.35,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical" as const,
                          overflow: "hidden"
                        }}
                        title={dirConfirmadaLista}
                      >
                        📍 {dirConfirmadaLista}
                      </div>
                    ) : null}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                      <span style={{ color: themeGold }}>{p.total?.toFixed(2)} €</span>
                      <span
                        style={{
                          color:
                            p.estado === "pendiente" ? "#22d3ee" : p.estado === "enviado" ? "#e67e22" : "#2ecc71",
                          background:
                            p.estado === "pendiente"
                              ? "rgba(34,211,238,0.15)"
                              : p.estado === "enviado"
                                ? "rgba(230,126,34,0.15)"
                                : "rgba(46,204,113,0.15)",
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 14
                        }}
                      >
                        {p.estado === "pendiente" ? "🛒 " : p.estado === "enviado" ? "🚚 " : "✅ "}
                        {p.estado}
                      </span>
                    </div>

                    {accesoAdmin && (
                      <select
                        value={p.estado}
                        onChange={(e) => {
                          e.stopPropagation();
                          void cambiarEstadoPedido(p.numero, e.target.value as Pedido["estado"]);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          marginTop: 8,
                          padding: 8,
                          borderRadius: 8,
                          width: "100%",
                          background: themeBg,
                          color: themeGold,
                          border: `1px solid ${themeGold}`,
                          cursor: "pointer"
                        }}
                      >
                        <option value="pendiente">🛒 Pendiente</option>
                        <option value="enviado">🚚 Enviado</option>
                        <option value="entregado">✅ Entregado</option>
                      </select>
                    )}

                    {pedidoAbierto === indexEnOriginal && (
                      <div style={{ marginTop: 10, borderTop: `1px solid ${themeGold}`, paddingTop: 10 }}>
                        <strong style={{ color: themeGold }}>📦 Productos:</strong>
                        {p.items?.map((it: ItemCarrito, idx: number) => (
                          <div key={`${p.numero}-item-${idx}`} style={{ color: "white", marginLeft: 10 }}>
                            • {it.nombre} x{it.cantidad} = {(it.precio * it.cantidad).toFixed(2)} €
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAbrirFacturaPedido(p);
                      }}
                      style={{
                        marginTop: 8,
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: `1px solid ${themeGold}`,
                        background: "rgba(201,162,74,0.15)",
                        color: themeGold,
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: 13
                      }}
                    >
                      📄 Ver factura / pedido completo
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  };
}
