import { describe, expect, it } from "vitest";
import { ajustarCarritoSegunCatalogo } from "./ajustarCarritoSegunCatalogo";
import type { CatalogoCuatroListas } from "../core/restarStockCatalogo";
import type { ItemCarrito, Producto } from "../../types";

const vela = (stock: number): Producto => ({
  id: 1,
  nombre: "Vela blanca",
  categoria: "velas",
  precio: 10,
  stock,
  descripcion: "",
  imagen: ""
});

const catBase = (stockVela: number): CatalogoCuatroListas => ({
  velas: [vela(stockVela)],
  inciensos: [],
  figuras: [],
  kits: [],
  joyas: []
});

describe("ajustarCarritoSegunCatalogo", () => {
  it("conserva la línea si stock es 0 (no vacía el carrito)", () => {
    const linea: ItemCarrito = { ...vela(99), cantidad: 1 };
    const r = ajustarCarritoSegunCatalogo([linea], catBase(0));
    expect(r.siguienteCarrito).toEqual([linea]);
    expect(r.aviso).toBeNull();
  });

  it("recorta cantidad al stock disponible", () => {
    const cart: ItemCarrito[] = [{ ...vela(99), cantidad: 3 }];
    const r = ajustarCarritoSegunCatalogo(cart, catBase(1));
    expect(r.siguienteCarrito).toEqual([{ ...cart[0], cantidad: 1 }]);
    expect(r.aviso).toBeTruthy();
  });
});
