import { describe, expect, it } from "vitest";
import type { CatalogoCuatroListas } from "../core/restarStockCatalogo";
import type { ItemCarrito } from "../../types";
import { limpiarYRecortarCarritoConCatalogo } from "./limpiarYRecortarCarritoConCatalogo";

function catConVela(stock: number): CatalogoCuatroListas {
  const vela = {
    id: 1,
    nombre: "Vela",
    precio: 10,
    stock,
    imagen: "",
    categoria: "velas" as const,
    descripcion: ""
  };
  return { velas: [vela], inciensos: [], figuras: [], kits: [], joyas: [] };
}

function linea(id: number, cantidad: number): ItemCarrito {
  return {
    id,
    nombre: "x",
    precio: 10,
    stock: 99,
    imagen: "",
    categoria: "velas",
    descripcion: "",
    cantidad
  };
}

describe("limpiarYRecortarCarritoConCatalogo", () => {
  it("elimina línea con stock 0", () => {
    const r = limpiarYRecortarCarritoConCatalogo([linea(1, 2)], catConVela(0));
    expect(r.siguienteCarrito).toHaveLength(0);
    expect(r.lineasEliminadas).toBe(1);
    expect(r.huboRecorteCantidad).toBe(false);
  });

  it("elimina línea si el id no está en catálogo", () => {
    const r = limpiarYRecortarCarritoConCatalogo([linea(999, 1)], catConVela(5));
    expect(r.siguienteCarrito).toHaveLength(0);
    expect(r.lineasEliminadas).toBe(1);
  });

  it("si el snapshot API no trae el id pero el respaldo local sí, conserva la línea (última unidad / desfase GET)", () => {
    const vacio: CatalogoCuatroListas = { velas: [], inciensos: [], figuras: [], kits: [], joyas: [] };
    const r = limpiarYRecortarCarritoConCatalogo([linea(1, 1)], vacio, catConVela(1));
    expect(r.siguienteCarrito).toEqual([expect.objectContaining({ id: 1, cantidad: 1 })]);
    expect(r.lineasEliminadas).toBe(0);
  });

  it("prioriza stock 0 del API aunque el respaldo muestre stock positivo", () => {
    const api = catConVela(0);
    const respaldo = catConVela(5);
    const r = limpiarYRecortarCarritoConCatalogo([linea(1, 1)], api, respaldo);
    expect(r.siguienteCarrito).toHaveLength(0);
    expect(r.lineasEliminadas).toBe(1);
  });

  it("recorta cantidad si hay stock parcial", () => {
    const r = limpiarYRecortarCarritoConCatalogo([linea(1, 5)], catConVela(2));
    expect(r.siguienteCarrito).toEqual([expect.objectContaining({ id: 1, cantidad: 2 })]);
    expect(r.lineasEliminadas).toBe(0);
    expect(r.huboRecorteCantidad).toBe(true);
  });
});
