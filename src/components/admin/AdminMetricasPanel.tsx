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
          <div className="metric-hint">Todos los pedidos registrados</div>
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
      </div>
    </div>
  );
}

