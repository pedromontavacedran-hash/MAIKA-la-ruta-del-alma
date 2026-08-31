import type { ItemCarrito, Producto } from "../../types";
import { logCheckoutWarn } from "../../utils/loggerCheckout";
import { restarStockCatalogoDesdeCarrito, type CatalogoCuatroListas } from "../core/restarStockCatalogo";
import { persistirCatalogoCuatroListasLocal } from "./persistirCatalogoLocal";

/**
 * Calcula catálogo con stock restado y lo persiste en las claves de catálogo Maika.
 */
export function actualizarStockCatalogoYPersistir(
  cart: ItemCarrito[],
  velas: Producto[],
  inciensos: Producto[],
  figuras: Producto[],
  kits: Producto[],
  joyas: Producto[]
): CatalogoCuatroListas {
  const actualizado = restarStockCatalogoDesdeCarrito(cart, velas, inciensos, figuras, kits, joyas);
  try {
    persistirCatalogoCuatroListasLocal(actualizado);
  } catch (e) {
    logCheckoutWarn("actualizarStockCatalogo", e);
  }
  return actualizado;
}
