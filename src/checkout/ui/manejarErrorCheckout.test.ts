import { describe, expect, it } from "vitest";
import { mensajeErrorCheckoutParaUsuario } from "./manejarErrorCheckout";

describe("mensajeErrorCheckoutParaUsuario", () => {
  it("rechazo stock: mensaje claro sin tecnicismos", () => {
    const r = mensajeErrorCheckoutParaUsuario({
      tipo: "error",
      origen: "rechazo_servidor",
      mensaje: 'Stock insuficiente para «Vela Blanca» (disponible 0, pedido 1)'
    });
    expect(r).toContain("última unidad");
    expect(r).toContain("ya no está disponible");
    expect(r).not.toMatch(/disponible\s+\d/i);
  });

  it("rechazo no stock: genérico amable", () => {
    const r = mensajeErrorCheckoutParaUsuario({
      tipo: "error",
      origen: "rechazo_servidor",
      mensaje: "Cupón inválido o expirado"
    });
    expect(r).toContain("No pudimos registrar");
    expect(r).not.toContain("Cupón");
  });

  it("rechazo producto no en catálogo: no mezcla con «última unidad»", () => {
    const r = mensajeErrorCheckoutParaUsuario({
      tipo: "error",
      origen: "rechazo_servidor",
      mensaje: "Producto 5 no encontrado en catálogo"
    });
    expect(r).toContain("desfase");
    expect(r).toContain("Pagar y enviar");
    expect(r).not.toContain("última unidad");
  });

  it("error sin origen: conserva o fallback", () => {
    expect(
      mensajeErrorCheckoutParaUsuario({ tipo: "error", mensaje: "Falta el teléfono" })
    ).toBe("Falta el teléfono");
  });
});
