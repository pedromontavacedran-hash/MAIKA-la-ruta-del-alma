import type { CatalogoCuatroListas } from "../core/restarStockCatalogo";
import type { ItemCarrito } from "../../types";
import { idSeguro } from "../../utils/precio";
import { resolverStockLinea, stockMapDesdeCuatroListas } from "./stockDesdeCatalogo";

/**
 * Elimina líneas sin stock o fuera de catálogo; recorta cantidad si hay stock pero es menor que la pedida.
 * No se ejecuta en bucle: pensado para llamarse al entrar en carrito o al sincronizar antes del checkout.
 *
 * @param catRespaldo Catálogo local inmediatamente antes de aplicar `cat` (opcional).
 */
export function limpiarYRecortarCarritoConCatalogo(
  cart: ItemCarrito[],
  cat: CatalogoCuatroListas,
  catRespaldo?: CatalogoCuatroListas | null
): {
  siguienteCarrito: ItemCarrito[];
  lineasEliminadas: number;
  huboRecorteCantidad: boolean;
} {
  const stockApi = stockMapDesdeCuatroListas(cat);
  const stockRespaldo = catRespaldo != null ? stockMapDesdeCuatroListas(catRespaldo) : null;

  const siguiente: ItemCarrito[] = [];
  let lineasEliminadas = 0;
  let huboRecorteCantidad = false;

  for (const it of cart) {
    const id = idSeguro(it.id) ?? Number(it.id);
    if (!Number.isFinite(id)) {
      lineasEliminadas += 1;
      continue;
    }
    const qty = Math.max(0, Math.floor(Number(it.cantidad) || 0));
    if (qty <= 0) continue;

    const stock = resolverStockLinea(id, stockApi, stockRespaldo);
    if (stock === undefined) {
      lineasEliminadas += 1;
      continue;
    }
    if (stock <= 0) {
      lineasEliminadas += 1;
      continue;
    }
    if (qty > stock) {
      huboRecorteCantidad = true;
      siguiente.push({ ...it, id, cantidad: stock });
    } else {
      siguiente.push({ ...it, id, cantidad: qty });
    }
  }

  return { siguienteCarrito: siguiente, lineasEliminadas, huboRecorteCantidad };
}

export const MSJ_PRODUCTO_ELIMINADO_SIN_STOCK =
  "Este producto ya no está disponible y ha sido eliminado de tu carrito.";

export const MSJ_PRODUCTOS_ELIMINADOS_SIN_STOCK =
  "Algunos productos ya no están disponibles y han sido eliminados de tu carrito.";

export const MSJ_RECORTE_CANTIDAD_STOCK = "Hemos ajustado tu carrito al stock disponible ahora mismo.";
