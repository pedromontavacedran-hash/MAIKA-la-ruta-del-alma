import {
  CATALOGO_VELAS_KEY,
  CATALOGO_INCIENSOS_KEY,
  CATALOGO_FIGURAS_KEY,
  CATALOGO_KITS_KEY,
  CATALOGO_JOYAS_KEY
} from "../../config";
import type { CatalogoCuatroListas } from "../core/restarStockCatalogo";

export function persistirCatalogoCuatroListasLocal(catalogo: CatalogoCuatroListas): void {
  localStorage.setItem(CATALOGO_VELAS_KEY, JSON.stringify(catalogo.velas));
  localStorage.setItem(CATALOGO_INCIENSOS_KEY, JSON.stringify(catalogo.inciensos));
  localStorage.setItem(CATALOGO_FIGURAS_KEY, JSON.stringify(catalogo.figuras));
  localStorage.setItem(CATALOGO_KITS_KEY, JSON.stringify(catalogo.kits));
  localStorage.setItem(CATALOGO_JOYAS_KEY, JSON.stringify(catalogo.joyas));
}
