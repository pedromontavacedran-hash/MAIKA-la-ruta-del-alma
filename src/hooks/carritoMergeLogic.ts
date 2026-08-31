import type { ItemCarrito } from "../types";
import { idSeguro } from "../utils/precio";

/**
 * Normaliza cantidades al stock disponible y precio de catálogo (misma idea que en `useCarrito`).
 */
export function aplicarNormYStockCarrito(
  items: ItemCarrito[],
  normalizarItemCarrito: (i: ItemCarrito) => ItemCarrito,
  precioItemCarrito: (i: ItemCarrito) => number,
  getStockProducto: (id: number) => number
): ItemCarrito[] {
  return items
    .map((raw) => {
      const item = normalizarItemCarrito(raw);
      const id = idSeguro(item.id);
      const stock = Math.max(0, getStockProducto(id));
      const qty = Math.min(Math.max(0, Number(item.cantidad) || 0), stock);
      if (qty <= 0) return null;
      return normalizarItemCarrito({
        ...item,
        id,
        cantidad: qty,
        precio: precioItemCarrito({ ...item, id, cantidad: qty })
      });
    })
    .filter((x): x is ItemCarrito => x != null);
}

export type ResolverCarritoTrasRemotoParams = {
  authDirty: boolean;
  guestPending: boolean;
  localSeguro: ItemCarrito[];
  remotoNorm: ItemCarrito[];
  normalizarItemCarrito: (i: ItemCarrito) => ItemCarrito;
  precioItemCarrito: (i: ItemCarrito) => number;
  getStockProducto: (id: number) => number;
};

/**
 * Decisión de qué carrito mostrar tras `obtenerCarritoApi`, antes de persistir.
 * Mantener en sync con el efecto de carga en `useCarrito`.
 */
export function resolverCarritoTrasObtenerRemoto(p: ResolverCarritoTrasRemotoParams): ItemCarrito[] {
  const {
    authDirty,
    guestPending,
    localSeguro,
    remotoNorm,
    normalizarItemCarrito,
    precioItemCarrito,
    getStockProducto
  } = p;
  if (authDirty) {
    return localSeguro;
  }
  if (guestPending) {
    return localSeguro.length > 0
      ? aplicarNormYStockCarrito(
          localSeguro,
          normalizarItemCarrito,
          precioItemCarrito,
          getStockProducto
        )
      : remotoNorm;
  }
  if (remotoNorm.length > 0) {
    return remotoNorm;
  }
  return localSeguro;
}
