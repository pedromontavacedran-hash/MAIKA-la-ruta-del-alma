import type { ItemCarrito, Producto } from "../../types";

export type CatalogoCuatroListas = {
  velas: Producto[];
  inciensos: Producto[];
  figuras: Producto[];
  kits: Producto[];
  joyas: Producto[];
};

function restarPorId(items: { id: number; cantidad: number }[]) {
  return items.reduce(
    (acc, it) => {
      acc[it.id] = (acc[it.id] ?? 0) + it.cantidad;
      return acc;
    },
    {} as Record<number, number>
  );
}

/**
 * Resta del catálogo las cantidades del carrito.
 * Un solo mapa id→cantidad para todo el carrito (los ids son únicos en todo el catálogo,
 * los asigna el backend con `maxId + 1` global): no asumir rangos de id por categoría,
 * un producto nuevo de cualquier categoría puede recibir cualquier id. Sin localStorage ni React.
 */
export function restarStockCatalogoDesdeCarrito(
  cart: ItemCarrito[],
  velas: Producto[],
  inciensos: Producto[],
  figuras: Producto[],
  kits: Producto[],
  joyas: Producto[]
): CatalogoCuatroListas {
  const restar = restarPorId(
    cart.map((it) => ({ id: Number(it.id), cantidad: Math.max(0, Number(it.cantidad) || 0) }))
  );

  const aplicar = (lista: Producto[]) =>
    lista.map((p) => {
      const q = restar[p.id];
      if (q == null || q <= 0) return p;
      return { ...p, stock: Math.max(0, Number(p.stock) - q) };
    });

  return {
    velas: aplicar(velas),
    inciensos: aplicar(inciensos),
    figuras: aplicar(figuras),
    kits: aplicar(kits),
    joyas: aplicar(joyas)
  };
}
