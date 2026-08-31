import type { CatalogoCuatroListas } from "../core/restarStockCatalogo";

/** Mapa id → stock (≥0) a partir de las cuatro listas del catálogo. */
export function stockMapDesdeCuatroListas(cat: CatalogoCuatroListas): Map<number, number> {
  const todos = [...cat.velas, ...cat.inciensos, ...cat.figuras, ...cat.kits, ...cat.joyas];
  const m = new Map<number, number>();
  for (const p of todos) {
    m.set(p.id, Math.max(0, Number(p.stock) || 0));
  }
  return m;
}

/**
 * Stock efectivo por id: prioriza el snapshot de la API (`stockApi`).
 * Si el id no viene ahí (lista incompleta o desfase), usa `stockRespaldo` (catálogo local previo a la sync).
 */
export function resolverStockLinea(
  id: number,
  stockApi: Map<number, number>,
  stockRespaldo: Map<number, number> | null
): number | undefined {
  if (stockApi.has(id)) return stockApi.get(id);
  if (stockRespaldo?.has(id)) return stockRespaldo.get(id);
  return undefined;
}
