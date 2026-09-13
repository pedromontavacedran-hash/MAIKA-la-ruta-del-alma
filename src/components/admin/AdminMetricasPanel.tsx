import { type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import type { Pedido } from "../../types";

type Props = {
  bgColor: string;
  goldColor: string;
  ventasTotales: number;
  pedidosTotales: number;
  usuariosTotales: number;
  stockBajo: number;
  unidadesVendidas: number;
  valorInventario: number;
  unidadesEnStock: number;
  topProductos: Array<{ nombre: string; cantidad: number; ventas: number }>;
  pedidos: Pedido[];
  pedidosPendientes: Pedido[];
  pedidosEnviados: Pedido[];
  pedidosEntregados: Pedido[];
  umbralStockBajo: number;
  setUmbralStockBajo: (v: number) => void;
  umbralKey: string;
  mostrarNotificacion: (m: string, t: "normal" | "exito" | "error") => void;
  notaPedidoEnvio: string;
  setNotaPedidoEnvio: (v: string) => void;
  notaKey: string;
  notaDefault: string;
};

export default function AdminMetricasPanel({
  bgColor,
  goldColor,
  ventasTotales,
  pedidosTotales,
  usuariosTotales,
  stockBajo,
  unidadesVendidas,
  valorInventario,
  unidadesEnStock,
  topProductos,
  pedidos,
  pedidosPendientes,
  pedidosEnviados,
  pedidosEntregados
}: Props) {
  const navigate = useNavigate();
  const pedidosOtrosCount = pedidos.filter((p) => {
    const e = String(p.estado ?? "pendiente");
    return e !== "pendiente" && e !== "enviado" && e !== "entregado";
  }).length;

  const rootStyle: CSSProperties = {
    ["--admin-gold" as string & keyof CSSProperties]: goldColor,
    ["--admin-bg" as string & keyof CSSProperties]: bgColor,
    color: "white",
    fontSize: 20
  };

  return (
    <div className="admin-metricas-root" style={rootStyle}>
      <div className="admin-metricas-header">
        <div className="admin-metricas-title">📊 MÉTRICAS BÁSICAS</div>
        <button
          type="button"
          className="btn-admin-limpio admin-btn admin-btn--ghost admin-btn--inline admin-metricas-btn-config"
          onClick={() => void navigate("/admin/configuracion-metricas")}
        >
          ⚙ Configurar
        </button>
      </div>
      <div className="admin-metricas-subtitle">
        Desglose: {pedidosPendientes.length} pendientes · {pedidosEnviados.length} en curso (enviados) ·{" "}
        {pedidosEntregados.length} entregados
        {pedidosOtrosCount > 0 ? ` · ${pedidosOtrosCount} otros estados` : ""}.
      </div>

      <div className="admin-metrics-grid">
        <div className="metric-card">
          <div className="metric-label">💶 Ventas semana</div>
          <div className="metric-value">{ventasTotales.toFixed(2)} €</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">📦 Pedidos (total)</div>
          <div className="metric-hint">Excluye cancelados/rechazados</div>
          <div className="metric-value">{pedidosTotales}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">👥 Usuarios totales</div>
          <div className="metric-value">{usuariosTotales}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">⚠️ Stock bajo</div>
          <div className="metric-value">{stockBajo}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">🏷️ Unidades vendidas</div>
          <div className="metric-hint">Total histórico (no cancelados)</div>
          <div className="metric-value">{unidadesVendidas}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">📦 Unidades en stock</div>
          <div className="metric-value">{unidadesEnStock}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">💰 Valor inventario</div>
          <div className="metric-hint">Stock × precio venta</div>
          <div className="metric-value">{valorInventario.toFixed(2)} €</div>
        </div>
      </div>

      {topProductos.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="admin-metricas-title" style={{ fontSize: 16, marginBottom: 8 }}>🔥 Top productos (por unidades)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {topProductos.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8, fontSize: 14 }}>
                <span style={{ color: "white" }}>
                  <span style={{ color: goldColor, fontWeight: "bold", marginRight: 8 }}>{i + 1}.</span>
                  {p.nombre}
                </span>
                <span style={{ color: "rgba(255,255,255,0.7)" }}>
                  {p.cantidad} uds · {p.ventas.toFixed(2)} €
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

