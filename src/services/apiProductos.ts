import type { CatalogoCuatroListas } from "../checkout/core/restarStockCatalogo";
import { getApiBaseUrl } from "../config/apiBaseUrl";
import type { Producto } from "../types";
import { fetchMaikaApi } from "../utils/fetchMaikaApi";
import { listaProductosSegura } from "../utils/listaProductosSegura";

function particionarCuatroListas(list: Producto[]): CatalogoCuatroListas {
  const porCat = (c: Producto["categoria"]) =>
    list.filter((p) => p.categoria === c).sort((a, b) => a.id - b.id);
  return {
    velas: porCat("velas"),
    inciensos: porCat("inciensos"),
    figuras: porCat("figuras"),
    kits: porCat("kits"),
    joyas: porCat("joyas")
  };
}

/**
 * Catálogo en cuatro listas tras `GET /productos` (misma forma que el checkout).
 */
export async function fetchCatalogoCuatroListasDesdeApi(): Promise<CatalogoCuatroListas | null> {
  const list = await fetchProductosTienda();
  if (!list || list.length === 0) return null;
  return particionarCuatroListas(list);
}

/**
 * Catálogo público del backend (`GET /productos`).
 * Devuelve `null` si la red falla o la respuesta no es un array usable.
 */
export async function fetchProductosTienda(): Promise<Producto[] | null> {
  try {
    const res = await fetchMaikaApi(`${getApiBaseUrl()}/productos`, { cache: "no-store" });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const ok = listaProductosSegura(data);
    return ok.length > 0 ? ok : null;
  } catch {
    return null;
  }
}
