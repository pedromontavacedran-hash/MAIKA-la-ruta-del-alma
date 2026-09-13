import { describe, expect, it } from "vitest";
import type { ItemCarrito, Pedido, Producto } from "../types";
import { calcularMetricasAdmin } from "./adminMetrics";

function producto(id: number, stock = 10, precio = 20): Producto {
  return {
    id,
    nombre: `Producto ${id}`,
    precio,
    stock,
    categoria: "velas",
    descripcion: "",
    imagen: ""
  };
}

function pedido(
  num: string,
  total: number,
  fecha: string,
  estado: string = "entregado",
  items: Array<{ id: number; nombre: string; precio: number; cantidad: number }> = []
): Pedido {
  return {
    numero: num,
    total,
    fecha,
    estado,
    items,
    cliente: { nombreApellidos: "Test", email: "test@test.com" }
  } as Pedido;
}

const parseFecha = (fecha: string) => new Date(fecha);
const precioSeguro = (p: unknown) => Number(p) || 0;

describe("calcularMetricasAdmin", () => {
  const baseParams = {
    cart: [] as ItemCarrito[],
    catalogoProductos: [] as Producto[],
    umbralStockBajo: 3,
    parseFechaPedido: parseFecha,
    precioSeguro
  };

  it("cuenta pedidos entregados en ventas", () => {
    const hoy = new Date().toISOString();
    const pedidos = [pedido("1", 50, hoy, "entregado")];
    const m = calcularMetricasAdmin({ ...baseParams, pedidos });
    expect(m.ventasHoy).toBe(50);
  });

  it("excluye pedidos cancelados de ventas", () => {
    const hoy = new Date().toISOString();
    const pedidos = [
      pedido("1", 50, hoy, "entregado"),
      pedido("2", 30, hoy, "cancelado")
    ];
    const m = calcularMetricasAdmin({ ...baseParams, pedidos });
    expect(m.ventasHoy).toBe(50);
  });

  it("excluye pedidos rechazados de ventas", () => {
    const hoy = new Date().toISOString();
    const pedidos = [
      pedido("1", 50, hoy, "entregado"),
      pedido("2", 30, hoy, "rechazado")
    ];
    const m = calcularMetricasAdmin({ ...baseParams, pedidos });
    expect(m.ventasHoy).toBe(50);
  });

  it("cuenta pedidos pendientes en ventas", () => {
    const hoy = new Date().toISOString();
    const pedidos = [pedido("1", 50, hoy, "pendiente")];
    const m = calcularMetricasAdmin({ ...baseParams, pedidos });
    expect(m.ventasHoy).toBe(50);
  });

  it("topProductos acumula cantidades por nombre", () => {
    const hoy = new Date().toISOString();
    const pedidos = [
      pedido("1", 60, hoy, "entregado", [
        { id: 1, nombre: "Vela Blanca", precio: 10, cantidad: 3 },
        { id: 2, nombre: "Vela Roja", precio: 10, cantidad: 2 }
      ]),
      pedido("2", 20, hoy, "entregado", [
        { id: 1, nombre: "Vela Blanca", precio: 10, cantidad: 1 }
      ])
    ];
    const m = calcularMetricasAdmin({ ...baseParams, pedidos });
    const velaBlanca = m.topProductos.find((p) => p.nombre === "Vela Blanca");
    expect(velaBlanca?.cantidad).toBe(4);
    expect(velaBlanca?.ventas).toBe(40);
  });

  it("alertasStockBajo filtra productos bajo umbral", () => {
    const catalogo = [producto(1, 2), producto(2, 5), producto(3, 0)];
    const m = calcularMetricasAdmin({ ...baseParams, pedidos: [], catalogoProductos: catalogo, umbralStockBajo: 3 });
    expect(m.alertasStockBajo).toHaveLength(2);
    expect(m.alertasStockBajo.map((a) => a.id).sort()).toEqual([1, 3]);
  });

  it("carritoItemsPendientes suma cantidades del carrito", () => {
    const cart: ItemCarrito[] = [
      { ...producto(1), cantidad: 3 },
      { ...producto(2), cantidad: 2 }
    ];
    const m = calcularMetricasAdmin({ ...baseParams, pedidos: [], cart });
    expect(m.carritoItemsPendientes).toBe(5);
  });
});
