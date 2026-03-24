import type { ItemCarrito, Pedido, Producto } from "../types";

type TendenciaTopProducto = {
  nombre: string;
  actual: number;
  anterior: number;
  variacion: number;
  tendencia: "nuevo" | "sube" | "baja" | "igual";
};

export type MetricasAdmin = {
  ventasHoy: number;
  ventasSemana: number;
  topProductos: Array<{ nombre: string; cantidad: number; ventas: number }>;
  tendenciaTopProductos: TendenciaTopProducto[];
  alertasStockBajo: Array<{ id: number; nombre: string; stock: number; categoria: string }>;
  carritoItemsPendientes: number;
  carritoImportePendiente: number;
};

export function calcularMetricasAdmin(params: {
  pedidos: Pedido[];
  cart: ItemCarrito[];
  catalogoProductos: Producto[];
  umbralStockBajo: number;
  parseFechaPedido: (fecha: string) => Date | null;
  precioSeguro: (precio: unknown) => number;
}): MetricasAdmin {
  const { pedidos, cart, catalogoProductos, umbralStockBajo, parseFechaPedido, precioSeguro } = params;

  const ahora = new Date();
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const inicioSemana = new Date(inicioHoy);
  inicioSemana.setDate(inicioSemana.getDate() - 6);
  const inicioSemanaAnterior = new Date(inicioSemana);
  inicioSemanaAnterior.setDate(inicioSemanaAnterior.getDate() - 7);

  let ventasHoy = 0;
  let ventasSemana = 0;

  const acumuladoProductos = new Map<string, { cantidad: number; ventas: number }>();
  const ventasSemanaActual = new Map<string, number>();
  const ventasSemanaAnterior = new Map<string, number>();

  pedidos.forEach((pedido) => {
    const totalPedido = Number.isFinite(Number(pedido.total)) ? Number(pedido.total) : 0;
    const fechaPedido = parseFechaPedido(pedido.fecha);

    if (fechaPedido && fechaPedido >= inicioHoy) ventasHoy += totalPedido;
    if (fechaPedido && fechaPedido >= inicioSemana) ventasSemana += totalPedido;

    pedido.items?.forEach((item) => {
      const nombre = (item.nombre || "Producto sin nombre").trim();
      const cantidad = Number.isFinite(Number(item.cantidad)) ? Number(item.cantidad) : 0;
      const precio = precioSeguro(item.precio);
      const actual = acumuladoProductos.get(nombre) ?? { cantidad: 0, ventas: 0 };

      acumuladoProductos.set(nombre, {
        cantidad: actual.cantidad + cantidad,
        ventas: actual.ventas + precio * cantidad
      });

      if (fechaPedido && fechaPedido >= inicioSemana) {
        ventasSemanaActual.set(nombre, (ventasSemanaActual.get(nombre) ?? 0) + cantidad);
      } else if (fechaPedido && fechaPedido >= inicioSemanaAnterior && fechaPedido < inicioSemana) {
        ventasSemanaAnterior.set(nombre, (ventasSemanaAnterior.get(nombre) ?? 0) + cantidad);
      }
    });
  });

  const topProductos = [...acumuladoProductos.entries()]
    .map(([nombre, data]) => ({ nombre, ...data }))
    .sort((a, b) => b.cantidad - a.cantidad || b.ventas - a.ventas)
    .slice(0, 3);

  const tendenciaTopProductos: TendenciaTopProducto[] = [...ventasSemanaActual.entries()]
    .map(([nombre, cantidadActual]) => {
      const cantidadAnterior = ventasSemanaAnterior.get(nombre) ?? 0;
      const variacion = cantidadActual - cantidadAnterior;
      const tendencia: TendenciaTopProducto["tendencia"] =
        cantidadAnterior === 0 ? "nuevo" : variacion > 0 ? "sube" : variacion < 0 ? "baja" : "igual";
      return {
        nombre,
        actual: cantidadActual,
        anterior: cantidadAnterior,
        variacion,
        tendencia
      };
    })
    .sort((a, b) => b.actual - a.actual)
    .slice(0, 5);

  const alertasStockBajo = catalogoProductos
    .filter((producto) => Number(producto.stock) <= umbralStockBajo)
    .map((producto) => ({
      id: producto.id,
      nombre: producto.nombre,
      stock: Number(producto.stock),
      categoria: producto.categoria
    }))
    .sort((a, b) => a.stock - b.stock || a.nombre.localeCompare(b.nombre));

  const carritoItemsPendientes = cart.reduce((sum, item) => {
    const cantidad = Number.isFinite(Number(item.cantidad)) ? Number(item.cantidad) : 0;
    return sum + cantidad;
  }, 0);

  const carritoImportePendiente = cart.reduce((sum, item) => {
    const cantidad = Number.isFinite(Number(item.cantidad)) ? Number(item.cantidad) : 0;
    return sum + precioSeguro(item.precio) * cantidad;
  }, 0);

  return {
    ventasHoy,
    ventasSemana,
    topProductos,
    tendenciaTopProductos,
    alertasStockBajo,
    carritoItemsPendientes,
    carritoImportePendiente
  };
}
