import { describe, expect, it } from "vitest";
import type { ItemCarrito } from "../../types";
import { calcularTotales } from "./calcularTotales";

function item(id: number, precio: number, cantidad: number): ItemCarrito {
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

describe("calcularTotales", () => {
  it("subtotal = precio × cantidad", () => {
    const { subtotal } = calcularTotales({ items: [item(1, 10, 3)] });
    expect(subtotal).toBe(30);
  });

  it("envio gratis cuando subtotal >= 50 (fallback sin calcularEnvioFn)", () => {
    const { envio } = calcularTotales({ items: [item(1, 50, 1)] });
    expect(envio).toBe(0);
  });

  it("envio = 4.9 cuando subtotal < 50 (fallback unificado)", () => {
    const { envio } = calcularTotales({ items: [item(1, 30, 1)] });
    expect(envio).toBe(4.9);
  });

  it("envio = 4.9 cuando subtotal === 49.99 (justo por debajo)", () => {
    const { envio } = calcularTotales({ items: [item(1, 49.99, 1)] });
    expect(envio).toBe(4.9);
  });

  it("envio gratis cuando subtotal === 50 (umbral exacto)", () => {
    const { envio } = calcularTotales({ items: [item(1, 50, 1)] });
    expect(envio).toBe(0);
  });

  it("total = subtotal + envio - descuento", () => {
    const { total } = calcularTotales({ items: [item(1, 30, 1)], descuento: 5 });
    expect(total).toBe(30 + 4.9 - 5);
  });

  it("total nunca es negativo", () => {
    const { total } = calcularTotales({ items: [item(1, 10, 1)], descuento: 100 });
    expect(total).toBe(0);
  });

  it("usa calcularEnvioFn cuando se proporciona", () => {
    const calcularEnvioFn = (_provincia: string, subtotal: number) => (subtotal >= 50 ? 0 : 4.9);
    const { envio } = calcularTotales({ items: [item(1, 30, 1)], calcularEnvioFn });
    expect(envio).toBe(4.9);
  });

  it("carrito vacio → subtotal 0, envio 4.9, total 4.9", () => {
    const { subtotal, envio, total } = calcularTotales({ items: [] });
    expect(subtotal).toBe(0);
    expect(envio).toBe(4.9);
    expect(total).toBe(4.9);
  });
});
