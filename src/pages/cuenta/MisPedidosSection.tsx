import { THEME } from "../../config";
import { textoFechaPedido } from "../../utils/fechaPedido";
import type { MaikaPedidoLS } from "../../utils/cuentaPageHelpers";
import PedidoCuentaCard from "./PedidoCuentaCard";
import OrdenMesDropdown, { type OrdenMes } from "./OrdenMesDropdown";

export interface PedidosGrupoMes {
  key: string;
  titulo: string;
  pedidos: MaikaPedidoLS[];
}

export interface MisPedidosSectionProps {
  claveUsuario: string;
  maikaPedidosUsuario: MaikaPedidoLS[];
  ultimosPedidosCuenta: MaikaPedidoLS[];
  pedidosHistoricoPorMes: PedidosGrupoMes[];
  ordenPedidosPorMes: Record<string, OrdenMes>;
  setOrdenPedidosPorMes: (fn: (prev: Record<string, OrdenMes>) => Record<string, OrdenMes>) => void;
  dropdownOrdenMesAbierto: string | null;
  setDropdownOrdenMesAbierto: (v: string | null) => void;
  onVerDetalles: (p: MaikaPedidoLS) => void;
  onRepetirPedido: (p: MaikaPedidoLS) => void;
}

/** Sección «📦 Mis Pedidos»: resumen, últimos 3 y grupos por mes con orden. */
export default function MisPedidosSection(p: MisPedidosSectionProps) {
  return (
    <>
      <h3 style={{ color: THEME.goldMain, marginBottom: 15 }}>📦 Mis Pedidos</h3>
      {!p.claveUsuario && (
        <p className="cuenta-maika-hint" style={{ color: "#ffb3b3", textAlign: "center", padding: 12, fontSize: 13, marginBottom: 12 }}>
          Tu cuenta no tiene un teléfono móvil válido (9 dígitos, 6 o 7). Los pedidos se asocian al teléfono; revisa tus datos o contacta si falta.
        </p>
      )}
      {p.maikaPedidosUsuario.length === 0 ? (
        <p className="cuenta-maika-hint" style={{ color: "rgba(255,255,255,0.92)", textAlign: "center", padding: 20 }}>No tienes pedidos aún</p>
      ) : (
        <>
          <div
            className="cuenta-maika-hint"
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 14px",
              marginBottom: 14,
              color: "rgba(255,255,255,0.92)",
              fontSize: 13,
              lineHeight: 1.35
            }}
          >
            <span>Pedidos totales: <strong>{p.maikaPedidosUsuario.length}</strong></span>
            <span>Último pedido: <strong>{textoFechaPedido(p.maikaPedidosUsuario[0]?.fecha || "", false)}</strong></span>
          </div>

          <h4 style={{ color: THEME.goldMain, margin: "0 0 10px", fontSize: 15 }}>Últimos 3 pedidos</h4>
          {p.ultimosPedidosCuenta.map((pedido) => (
            <PedidoCuentaCard
              key={pedido.idPedido}
              pedido={pedido}
              onVerDetalles={p.onVerDetalles}
              onRepetirPedido={p.onRepetirPedido}
            />
          ))}

          {p.pedidosHistoricoPorMes.length > 0 ? (
            <div style={{ marginTop: 18 }}>
              <h4 style={{ color: THEME.goldMain, margin: "0 0 10px", fontSize: 15 }}>Ver pedidos por meses</h4>
              {p.pedidosHistoricoPorMes.map((grupo, idx) => (
                <details
                  key={grupo.key}
                  open={idx === 0}
                  className="cuenta-maika-hint"
                  style={{
                    padding: "10px 12px",
                    marginBottom: 10,
                    color: "rgba(255,255,255,0.92)"
                  }}
                >
                  <summary
                    style={{
                      cursor: "pointer",
                      color: THEME.goldMain,
                      fontWeight: 800,
                      fontSize: 14
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "calc(100% - 18px)", verticalAlign: "middle" }}>
                      <span>
                        {grupo.titulo} · {grupo.pedidos.length} {grupo.pedidos.length === 1 ? "pedido" : "pedidos"}
                      </span>
                      <OrdenMesDropdown
                        titulo={grupo.titulo}
                        ordenActual={p.ordenPedidosPorMes[grupo.key] ?? "desc"}
                        abierto={p.dropdownOrdenMesAbierto === grupo.key}
                        onToggle={() => p.setDropdownOrdenMesAbierto(p.dropdownOrdenMesAbierto === grupo.key ? null : grupo.key)}
                        onSelect={(orden) => {
                          p.setOrdenPedidosPorMes((prev) => ({ ...prev, [grupo.key]: orden }));
                          p.setDropdownOrdenMesAbierto(null);
                        }}
                      />
                    </span>
                  </summary>
                  <div style={{ marginTop: 12 }}>
                    {grupo.pedidos.map((pedido) => (
                      <PedidoCuentaCard
                        key={pedido.idPedido}
                        pedido={pedido}
                        onVerDetalles={p.onVerDetalles}
                        onRepetirPedido={p.onRepetirPedido}
                      />
                    ))}
                  </div>
                </details>
              ))}
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
