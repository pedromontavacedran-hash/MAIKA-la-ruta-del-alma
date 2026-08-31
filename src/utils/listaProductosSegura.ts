import type { Producto } from "../types";

const CATEGORIAS = new Set<Producto["categoria"]>(["velas", "inciensos", "figuras", "kits", "joyas"]);

function categoriaNormalizada(v: unknown): Producto["categoria"] | null {
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  if (s === "velas" || s === "inciensos" || s === "figuras" || s === "kits" || s === "joyas") return s;
  return null;
}

/**
 * Garantiza un array de `Producto` válidos para el catálogo (nunca null/undefined en elementos).
 * Omite ítems sin categoría reconocida o campos mínimos inválidos.
 */
export function listaProductosSegura(raw: unknown): Producto[] {
  if (!Array.isArray(raw)) return [];
  const out: Producto[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Partial<Producto> & Record<string, unknown>;
    const cat = categoriaNormalizada(o.categoria);
    if (!cat || !CATEGORIAS.has(cat)) continue;
    const id = Number(o.id);
    if (!Number.isFinite(id) || id <= 0) continue;
    const nombre = typeof o.nombre === "string" ? o.nombre.trim() : "";
    if (!nombre) continue;
    const precio = Number(o.precio);
    if (!Number.isFinite(precio)) continue;
    const stock = Math.max(0, Math.floor(Number(o.stock) || 0));
    const descripcion = typeof o.descripcion === "string" ? o.descripcion : String(o.descripcion ?? "");
    const imagen = typeof o.imagen === "string" ? o.imagen : String(o.imagen ?? "");
    const base: Producto = {
      id,
      nombre,
      precio,
      stock,
      imagen,
      categoria: cat,
      descripcion
    };
    if (typeof o.descuentoPorcentaje === "number" && Number.isFinite(o.descuentoPorcentaje)) {
      base.descuentoPorcentaje = o.descuentoPorcentaje;
    }
    if (typeof o.precioCosteIvaIncluido === "number" && Number.isFinite(o.precioCosteIvaIncluido)) {
      base.precioCosteIvaIncluido = o.precioCosteIvaIncluido;
    }
    if (typeof o.nombreTamano === "number") base.nombreTamano = o.nombreTamano;
    if (typeof o.nombreColor === "string") base.nombreColor = o.nombreColor;
    if (o.nombreEstilo === "normal" || o.nombreEstilo === "italic" || o.nombreEstilo === "bold") {
      base.nombreEstilo = o.nombreEstilo;
    }
    if (typeof o.intencion === "string") base.intencion = o.intencion as Producto["intencion"];
    if (typeof o.paraQueSirve === "string") base.paraQueSirve = o.paraQueSirve;
    if (typeof o.comoUsar === "string") base.comoUsar = o.comoUsar;
    if (typeof o.subcategoriaId === "string" && o.subcategoriaId.trim()) {
      base.subcategoriaId = o.subcategoriaId.trim();
    }
    if (o.generoJoya === "hombre" || o.generoJoya === "mujer" || o.generoJoya === "unisex") {
      base.generoJoya = o.generoJoya;
    }
    if (o.acabadoJoya === "oro" || o.acabadoJoya === "acero") {
      base.acabadoJoya = o.acabadoJoya;
    }
    out.push(base);
  }
  return out;
}
