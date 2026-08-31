import { describe, expect, it } from "vitest";
import type { ItemCarrito } from "../types";
import { aplicarNormYStockCarrito, resolverCarritoTrasObtenerRemoto } from "./carritoMergeLogic";

function item(id: number, cantidad: number, precio = 10): ItemCarrito {
  return {
    id,
    nombre: `Producto ${id}`,
    precio,
    cantidad,
    stock: 100,
    categoria: "velas",
    descripcion: "",
    imagen: ""
  };
}

const normPassthrough = (i: ItemCarrito): ItemCarrito => ({
  ...i,
  id: Number(i.id),
  cantidad: Math.max(0, Math.floor(Number(i.cantidad) || 0)),
  precio: Number(i.precio) || 0
});

const precioFijo = (i: ItemCarrito) => i.precio;

function stockFn(desde: Record<number, number>, fallback = 99) {
  return (id: number) => Math.max(0, desde[id] ?? fallback);
}

describe("aplicarNormYStockCarrito", () => {
  it("recorta cantidad al stock", () => {
    const getStock = stockFn({ 1: 2 });
    const out = aplicarNormYStockCarrito([item(1, 5, 8)], normPassthrough, precioFijo, getStock);
    expect(out).toHaveLength(1);
    expect(out[0].cantidad).toBe(2);
    expect(out[0].precio).toBe(8);
  });

  it("elimina líneas sin stock", () => {
    const getStock = stockFn({ 1: 0 });
    const out = aplicarNormYStockCarrito([item(1, 3)], normPassthrough, precioFijo, getStock);
    expect(out).toHaveLength(0);
  });
});

describe("resolverCarritoTrasObtenerRemoto", () => {
  const getStock = stockFn({});

  it("authDirty: siempre gana el carrito local", () => {
    const local = [item(1, 1)];
    const remoto = [item(1, 99), item(2, 3)];
    const r = resolverCarritoTrasObtenerRemoto({
      authDirty: true,
      guestPending: true,
      localSeguro: local,
      remotoNorm: remoto,
      normalizarItemCarrito: normPassthrough,
      precioItemCarrito: precioFijo,
      getStockProducto: getStock
    });
    expect(r).toEqual(local);
  });

  it("guestPending + local con líneas: solo local (no mezcla líneas solo-servidor)", () => {
    const local = [item(10, 1), item(11, 1)];
    const remoto = [item(10, 4), item(11, 1), item(99, 5)];
    const r = resolverCarritoTrasObtenerRemoto({
      authDirty: false,
      guestPending: true,
      localSeguro: local,
      remotoNorm: remoto,
      normalizarItemCarrito: normPassthrough,
      precioItemCarrito: precioFijo,
      getStockProducto: getStockFnDesdeItems(remoto, local)
    });
    expect(r.map((x) => x.id).sort((a, b) => a - b)).toEqual([10, 11]);
    expect(r.find((x) => x.id === 10)!.cantidad).toBe(1);
    expect(r.find((x) => x.id === 99)).toBeUndefined();
  });

  it("guestPending + local vacío: usa remoto", () => {
    const remoto = [item(5, 2)];
    const r = resolverCarritoTrasObtenerRemoto({
      authDirty: false,
      guestPending: true,
      localSeguro: [],
      remotoNorm: remoto,
      normalizarItemCarrito: normPassthrough,
      precioItemCarrito: precioFijo,
      getStockProducto: getStock
    });
    expect(r).toEqual(remoto);
  });

  it("sin guestPending + remoto no vacío: gana servidor (evita sumar local+remoto en cada recarga)", () => {
    const local = [item(1, 1), item(2, 1)];
    const remoto = [item(1, 4), item(2, 4)];
    const r = resolverCarritoTrasObtenerRemoto({
      authDirty: false,
      guestPending: false,
      localSeguro: local,
      remotoNorm: remoto,
      normalizarItemCarrito: normPassthrough,
      precioItemCarrito: precioFijo,
      getStockProducto: getStock
    });
    expect(r).toEqual(remoto);
  });

  it("sin guestPending + remoto vacío: conserva local", () => {
    const local = [item(3, 2)];
    const r = resolverCarritoTrasObtenerRemoto({
      authDirty: false,
      guestPending: false,
      localSeguro: local,
      remotoNorm: [],
      normalizarItemCarrito: normPassthrough,
      precioItemCarrito: precioFijo,
      getStockProducto: getStock
    });
    expect(r).toEqual(local);
  });
});

/** Stock mínimo coherente con ids que aparecen en local o remoto (evita 0 por defecto en tests). */
function getStockFnDesdeItems(...grupos: ItemCarrito[][]) {
  const m = new Map<number, number>();
  for (const g of grupos) {
    for (const it of g) {
      const id = Number(it.id);
      const s = Math.max(0, Number(it.stock) || 0, Number(m.get(id)) || 0);
      m.set(id, s || 99);
    }
  }
  return (id: number) => m.get(Number(id)) ?? 99;
}
