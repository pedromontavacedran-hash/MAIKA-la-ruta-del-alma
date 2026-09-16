import type { IntencionProducto } from "../../../types";

export type CategoriaCatalogoId = "velas" | "inciensos" | "figuras" | "kits" | "joyas";

type CamposProductoSanitizados = {
  nombreFinal: string;
  costeFinal: number;
  precioFinal: number;
  stockFinal: number;
  /** Descuento ya acotado a 0-100, o null si no se indicó. */
  dto: number | null;
};

export function sanitizarCamposProductoAdmin(input: {
  nombre: string;
  coste: number;
  precio: number;
  stock: number;
  descuentoPorcentaje?: number;
}): CamposProductoSanitizados {
  return {
    nombreFinal: String(input.nombre ?? "").trim() || "Sin nombre",
    costeFinal: Number.isFinite(input.coste) && input.coste >= 0 ? input.coste : 0,
    precioFinal: Number.isFinite(input.precio) && input.precio >= 0 ? input.precio : 0,
    stockFinal: Math.max(0, Math.floor(Number(input.stock)) || 0),
    dto:
      input.descuentoPorcentaje != null && Number.isFinite(input.descuentoPorcentaje)
        ? Math.min(100, Math.max(0, Number(input.descuentoPorcentaje)))
        : null
  };
}

/** PATCH /admin/productos/:id — campos de la edición (imagen solo se pisa si hay preview data:). */
export function construirPatchEdicionProducto(params: {
  categoria: CategoriaCatalogoId;
  nombre: string;
  coste: number;
  precio: number;
  stock: number;
  descuentoPorcentaje?: number;
  intencion?: IntencionProducto | "";
  paraQueSirve?: string;
  comoUsar?: string;
  descripcion: string;
  imagenPreview: string | null;
  imagenActual?: string;
  tamano: string;
  color: string;
  estilo: string;
  subcategoriaId: string;
}): Record<string, unknown> {
  const { nombreFinal, costeFinal, precioFinal, stockFinal, dto } = sanitizarCamposProductoAdmin(params);
  return {
    categoria: params.categoria,
    nombre: nombreFinal,
    precio: precioFinal,
    stock: stockFinal,
    imagen:
      params.imagenPreview && params.imagenPreview.startsWith("data:")
        ? params.imagenPreview
        : params.imagenActual ?? "",
    descripcion: params.descripcion.trim(),
    activo: true,
    precioCosteIvaIncluido: costeFinal,
    descuentoPorcentaje: dto !== null && dto > 0 ? dto : null,
    intencion: params.intencion && String(params.intencion).trim() ? params.intencion : null,
    paraQueSirve: String(params.paraQueSirve ?? "").trim() || null,
    comoUsar: String(params.comoUsar ?? "").trim() || null,
    nombreTamano: Number(params.tamano) || 22,
    nombreColor: params.color,
    nombreEstilo: params.estilo === "italic" || params.estilo === "bold" ? params.estilo : "normal",
    subcategoriaId: params.subcategoriaId || null
  };
}

/** POST /admin/productos — producto nuevo (sin imagen ni descripción al crear). */
export function construirBodyNuevoProducto(params: {
  categoria: CategoriaCatalogoId;
  nombre: string;
  coste: number;
  precio: number;
  stock: number;
  descuentoPorcentaje?: number;
  intencion?: IntencionProducto | "";
  paraQueSirve?: string;
  comoUsar?: string;
  subcategoriaId: string;
}): Record<string, unknown> {
  const { nombreFinal, costeFinal, precioFinal, stockFinal, dto } = sanitizarCamposProductoAdmin(params);
  const body: Record<string, unknown> = {
    categoria: params.categoria,
    nombre: nombreFinal,
    precio: precioFinal,
    stock: stockFinal,
    imagen: "",
    descripcion: "",
    activo: true,
    precioCosteIvaIncluido: costeFinal
  };
  if (params.subcategoriaId) body.subcategoriaId = params.subcategoriaId;
  if (dto != null && dto > 0) body.descuentoPorcentaje = dto;
  if (params.intencion) body.intencion = params.intencion;
  if (params.paraQueSirve?.trim()) body.paraQueSirve = params.paraQueSirve.trim();
  if (params.comoUsar?.trim()) body.comoUsar = params.comoUsar.trim();
  return body;
}
