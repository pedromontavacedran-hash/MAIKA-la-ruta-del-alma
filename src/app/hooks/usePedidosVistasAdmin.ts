import { useMemo } from "react";
import type { Pedido } from "../../types";

const ordenarPorFechaDesc = (a: Pedido, b: Pedido) =>
  new Date(b.fecha).getTime() - new Date(a.fecha).getTime();

/** Listas de pedidos por estado y ordenadas para la vista admin / seguimiento. */
export function usePedidosVistasAdmin(pedidos: Pedido[]) {
  const pedidosPendientes = useMemo(
    () => pedidos.filter((p) => (p.estado ?? "pendiente") === "pendiente"),
    [pedidos]
  );
  const pedidosEnviados = useMemo(
    () => pedidos.filter((p) => (p.estado ?? "pendiente") === "enviado"),
    [pedidos]
  );
  const pedidosEntregados = useMemo(
    () => pedidos.filter((p) => (p.estado ?? "pendiente") === "entregado"),
    [pedidos]
  );

  const pedidosPendientesOrdenados = useMemo(
    () => [...pedidosPendientes].sort(ordenarPorFechaDesc),
    [pedidosPendientes]
  );
  const pedidosEnviadosOrdenados = useMemo(
    () => [...pedidosEnviados].sort(ordenarPorFechaDesc),
    [pedidosEnviados]
  );
  const pedidosEntregadosOrdenados = useMemo(
    () => [...pedidosEntregados].sort(ordenarPorFechaDesc),
    [pedidosEntregados]
  );

  return {
    pedidosPendientes,
    pedidosEnviados,
    pedidosEntregados,
    pedidosPendientesOrdenados,
    pedidosEnviadosOrdenados,
    pedidosEntregadosOrdenados
  };
}
