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
  /** Unidades vendidas totales (suma de cantidades de items de pedidos no cancelados/rechazados). */
  unidadesVendidas: number;
  /** Valor del inventario actual (stock × precio de venta con descuento). */
  valorInventario: number;
  /** Unidades totales en stock. */
  unidadesEnStock: number;
  /** Top 3 productos más vendidos por unidades. */
  topProductos: Array<{ nombre: string; cantidad: number; ventas: number }>;
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

    const pedidosValidos = pedidos.filter((p) => {
      const e = String(p.estado ?? "pendiente").toLowerCase();
      return e !== "cancelado" && e !== "rechazado";
    });

    const unidadesVendidas = pedidosValidos.reduce((sum, p) => {
      return sum + (p.items ?? []).reduce((s, it) => s + (Number(it.cantidad) || 0), 0);
    }, 0);

    const valorInventario = catalogoProductos.reduce((sum, p) => {
      const stock = Math.max(0, Number(p.stock) || 0);
      const base = precioSeguro(p.precio);
      const desc = p.descuentoPorcentaje != null ? Math.min(100, Math.max(0, Number(p.descuentoPorcentaje))) : 0;
      const precioFinal = desc > 0 ? Math.round(base * (1 - desc / 100) * 100) / 100 : base;
      return sum + precioFinal * stock;
    }, 0);

    const unidadesEnStock = catalogoProductos.reduce((sum, p) => sum + (Math.max(0, Number(p.stock) || 0)), 0);

    return {
      ventasTotales: metricasAdmin.ventasSemana,
      pedidosTotales: pedidosValidos.length,
      usuariosTotales: metricasUsuarios.total,
      stockBajo: metricasAdmin.alertasStockBajo.length,
      unidadesVendidas,
      valorInventario,
      unidadesEnStock,
      topProductos: metricasAdmin.topProductos
    };
  }, [pedidos, cart, velas, inciensos, figuras, kits, joyas, umbralStockBajo, listaUsuarios]);
}
