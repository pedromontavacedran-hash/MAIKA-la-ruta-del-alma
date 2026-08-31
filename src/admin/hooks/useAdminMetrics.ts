import { useMemo } from "react";
import type { ItemCarrito, Pedido, Producto, Usuario } from "../../types";
import { calcularMetricasAdmin } from "../../utils/adminMetrics";
import { calcularMetricasUsuariosAdmin } from "../../utils/adminUserMetrics";
import { parseFechaPedido } from "../../utils/fechaPedido";
import { precioSeguro } from "../../utils/precio";

export type UseAdminMetricsInput = {
  pedidos: Pedido[];
  cart: ItemCarrito[];
  velas: Producto[];
  inciensos: Producto[];
  figuras: Producto[];
  kits: Producto[];
  joyas: Producto[];
  umbralStockBajo: number;
  listaUsuarios: Usuario[];
};

export type AdminMetricsResumen = {
  /** Misma cifra que antes en «Ventas semana»: suma de pedidos en la ventana de 7 días. */
  ventasTotales: number;
  pedidosTotales: number;
  usuariosTotales: number;
  stockBajo: number;
};

export function useAdminMetrics(input: UseAdminMetricsInput): AdminMetricsResumen {
  const { pedidos, cart, velas, inciensos, figuras, kits, joyas, umbralStockBajo, listaUsuarios } = input;

  return useMemo(() => {
    const catalogoProductos = [...velas, ...inciensos, ...figuras, ...(kits ?? []), ...(joyas ?? [])];
    const metricasAdmin = calcularMetricasAdmin({
      pedidos,
      cart,
      catalogoProductos,
      umbralStockBajo,
      parseFechaPedido,
      precioSeguro
    });
    const metricasUsuarios = calcularMetricasUsuariosAdmin(listaUsuarios);

    return {
      ventasTotales: metricasAdmin.ventasSemana,
      pedidosTotales: pedidos.length,
      usuariosTotales: metricasUsuarios.total,
      stockBajo: metricasAdmin.alertasStockBajo.length
    };
  }, [pedidos, cart, velas, inciensos, figuras, kits, joyas, umbralStockBajo, listaUsuarios]);
}
