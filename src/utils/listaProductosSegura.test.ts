import { describe, expect, it } from "vitest";
import { listaProductosSegura } from "./listaProductosSegura";

describe("listaProductosSegura", () => {
  it("filtra productos con activo === false", () => {
    const raw = [
      { id: 1, nombre: "Vela Blanca", precio: 10, stock: 5, categoria: "velas", descripcion: "", imagen: "", activo: true },
      { id: 2, nombre: "Vela Roja", precio: 10, stock: 5, categoria: "velas", descripcion: "", imagen: "", activo: false },
      { id: 3, nombre: "Vela Verde", precio: 10, stock: 5, categoria: "velas", descripcion: "", imagen: "" }
    ];
    const result = listaProductosSegura(raw);
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.id)).toEqual([1, 3]);
  });

  it("preserva activo === true en productos validos", () => {
    const raw = [
      { id: 1, nombre: "Vela Blanca", precio: 10, stock: 5, categoria: "velas", descripcion: "", imagen: "", activo: true }
    ];
    const result = listaProductosSegura(raw);
    expect(result[0].activo).toBe(true);
  });

  it("admite productos sin campo activo (undefined)", () => {
    const raw = [
      { id: 1, nombre: "Vela Blanca", precio: 10, stock: 5, categoria: "velas", descripcion: "", imagen: "" }
    ];
    const result = listaProductosSegura(raw);
    expect(result).toHaveLength(1);
    expect(result[0].activo).toBeUndefined();
  });

  it("filtra productos sin categoria valida", () => {
    const raw = [
      { id: 1, nombre: "X", precio: 10, stock: 5, categoria: "invalida", descripcion: "", imagen: "" },
      { id: 2, nombre: "Y", precio: 10, stock: 5, categoria: "velas", descripcion: "", imagen: "" }
    ];
    const result = listaProductosSegura(raw);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it("devuelve array vacio para entrada no array", () => {
    expect(listaProductosSegura(null)).toEqual([]);
    expect(listaProductosSegura(undefined)).toEqual([]);
    expect(listaProductosSegura({})).toEqual([]);
  });
});
