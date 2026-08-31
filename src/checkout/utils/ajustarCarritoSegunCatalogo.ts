import type { CatalogoCuatroListas } from "../core/restarStockCatalogo";
import type { ItemCarrito } from "../../types";
import { idSeguro } from "../../utils/precio";

/**
 * Alinea cantidades del carrito con el stock real del catálogo (p. ej. tras GET /productos).
 * Si el stock es 0, **no** se quita la línea: el usuario sigue viendo el artículo (con aviso en carrito/tienda)
 * y decide él; cerrar checkout no debe dejar el carrito vacío por culpa de la sync.
 * Solo se **recorta** cantidad cuando hay stock pero es menor que la pedida.
 */
export function ajustarCarritoSegunCatalogo(
  cart: ItemCarrito[],
  cat: CatalogoCuatroListas
): { siguienteCarrito: ItemCarrito[]; aviso: string | null } {
  const todos = [...cat.velas, ...cat.inciensos, ...cat.figuras, ...cat.kits, ...cat.joyas];
  const stockPorId = new Map<number, number>();
  for (const p of todos) {
    stockPorId.set(p.id, Math.max(0, Number(p.stock) || 0));
  }

  const siguiente: ItemCarrito[] = [];
  let huboRecorte = false;

  for (const it of cart) {
    const id = idSeguro(it.id) ?? Number(it.id);
    if (!Number.isFinite(id)) continue;
    const qty = Math.max(0, Math.floor(Number(it.cantidad) || 0));
    if (qty <= 0) continue;

    const stock = stockPorId.get(id);
    if (stock === undefined) {
      siguiente.push({ ...it, id });
      continue;
    }
    if (stock <= 0) {
      siguiente.push({ ...it, id, cantidad: qty });
      continue;
    }
    if (qty > stock) {
      huboRecorte = true;
      siguiente.push({ ...it, id, cantidad: stock });
    } else {
      siguiente.push({ ...it, id, cantidad: qty });
    }
  }

  const aviso = huboRecorte ? "Hemos ajustado tu carrito al stock disponible ahora mismo." : null;

  return { siguienteCarrito: siguiente, aviso };
}
