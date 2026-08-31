import type { CatalogoCuatroListas } from "../core/restarStockCatalogo";
import type { ItemCarrito } from "../../types";
import { idSeguro } from "../../utils/precio";
import { resolverStockLinea, stockMapDesdeCuatroListas } from "./stockDesdeCatalogo";

/** Mismo texto que devuelve `validarCarritoAntesCheckout` cuando no hay líneas comprables. */
export const MENSAJE_CARRITO_VACIO_PRE_CHECKOUT = "Tu carrito está vacío.";

/**
 * Comprueba si el carrito puede iniciar checkout con el catálogo ya sincronizado.
 * Tras `limpiarYRecortarCarritoConCatalogo` en carrito/finalizar, aquí solo debería fallar casos límite (p. ej. carrito vacío).
 *
 * @param catRespaldo Misma idea que en `limpiarYRecortarCarritoConCatalogo` (local previo a la sync).
 */
export function validarCarritoAntesCheckout(
  cart: ItemCarrito[],
  cat: CatalogoCuatroListas,
  catRespaldo?: CatalogoCuatroListas | null
): { readonly ok: true } | { readonly ok: false; readonly mensaje: string } {
  const stockApi = stockMapDesdeCuatroListas(cat);
  const stockRespaldo = catRespaldo != null ? stockMapDesdeCuatroListas(catRespaldo) : null;

  let hayLineaComprable = false;

  for (const it of cart) {
    const id = idSeguro(it.id) ?? Number(it.id);
    if (!Number.isFinite(id)) continue;
    const qty = Math.max(0, Math.floor(Number(it.cantidad) || 0));
    if (qty <= 0) continue;

    hayLineaComprable = true;
    const stock = resolverStockLinea(id, stockApi, stockRespaldo);
    if (stock === undefined) {
      return { ok: false as const, mensaje: "Un producto de tu carrito ya no está disponible." };
    }
    if (stock <= 0) {
      return { ok: false as const, mensaje: "Un producto de tu carrito ya no tiene stock." };
    }
    if (qty > stock) {
      return { ok: false as const, mensaje: "No hay stock suficiente para completar tu pedido." };
    }
  }

  if (!hayLineaComprable) {
    return { ok: false as const, mensaje: MENSAJE_CARRITO_VACIO_PRE_CHECKOUT };
  }

  return { ok: true as const };
}
