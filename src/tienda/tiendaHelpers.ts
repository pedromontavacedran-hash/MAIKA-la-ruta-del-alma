import type { CSSProperties } from "react";
import type { Producto } from "../App";
import type { Pedido } from "../types";

export type CategoriaEntrada = { id: string; nombre: string; imagen?: string };

export const TIENDA_THUMB_WRAP: CSSProperties = {
  marginBottom: 12,
  width: "100%",
  aspectRatio: "1 / 1",
  maxHeight: 110,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const TIENDA_THUMB_IMG: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderRadius: 10,
  border: "1px solid rgba(212,175,55,0.5)",
};

export const TIENDA_CATEG_THUMB_WRAP: CSSProperties = {
  marginBottom: 12,
  width: "100%",
  aspectRatio: "1 / 1",
  maxHeight: 148,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

/** Item mínimo del carrito para calcular disponibles = stock - en carrito */
export type ItemCarritoRef = { id: number; cantidad: number };

export function getProductosForCategoria(
  cat: string,
  velas: Producto[],
  inciensos: Producto[],
  figuras: Producto[],
  kits: Producto[] = [],
  joyas: Producto[] = []
): Producto[] {
  const v = Array.isArray(velas) ? velas : [];
  const i = Array.isArray(inciensos) ? inciensos : [];
  const f = Array.isArray(figuras) ? figuras : [];
  const k = Array.isArray(kits) ? kits : [];
  const j = Array.isArray(joyas) ? joyas : [];
  const c = cat.toLowerCase();
  if (c === "velas") return v;
  if (c === "inciensos") return i;
  if (c === "figuras") return f;
  if (c === "kits") return k;
  if (c === "joyas") return j;
  return [];
}

export function getEmoji(cat: string): string {
  const c = cat.toLowerCase();
  if (c === "velas") return "🕯️";
  if (c === "inciensos") return "🌿";
  if (c === "figuras") return "🪷";
  if (c === "kits") return "📦";
  if (c === "joyas") return "✨";
  return "📦";
}

/** Precio de venta con descuento aplicado (igual que en Inventario y useCatalogo). */
export function precioConDescuento(p: Producto): number {
  const base = Number(p.precio) || 0;
  const d = p.descuentoPorcentaje != null ? Math.min(100, Math.max(0, Number(p.descuentoPorcentaje))) : 0;
  if (d <= 0) return base;
  return Math.round(base * (1 - d / 100) * 100) / 100;
}

/** Estado compartido por las tarjetas de producto (catalogo, busqueda, mas vendidos). */
export type EstadoTarjeta = {
  enCarrito: number;
  disponibles: number;
  stockCatalogo: number;
  limiteCarrito: boolean;
  prodKey: string;
  recienAnadido: boolean;
};

export function calcularEstadoTarjeta(
  prod: Producto,
  cantidadEnCarrito: (id: number) => number,
  anadirCarritoOkKey: string | null
): EstadoTarjeta {
  const enCarrito = cantidadEnCarrito(Number(prod.id));
  const disponibles = Math.max(0, Number(prod.stock) - enCarrito);
  const stockCatalogo = Math.max(0, Math.floor(Number(prod.stock)) || 0);
  const limiteCarrito = disponibles === 0 && stockCatalogo > 0;
  const prodKey = `${prod.categoria}-${prod.id}`;
  const recienAnadido = anadirCarritoOkKey === prodKey;
  return { enCarrito, disponibles, stockCatalogo, limiteCarrito, prodKey, recienAnadido };
}

/** Convierte el nombre del producto en nombre de archivo: "Vela Blanca" → "vela-blanca.jpg" */
export function nombreProductoToImagen(nombre: string): string {
  const slug = nombre
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return slug ? `/${slug}.jpg` : "";
}

export const categoriasPorDefecto: CategoriaEntrada[] = [
  { id: "velas", nombre: "velas" },
  { id: "inciensos", nombre: "inciensos" },
  { id: "figuras", nombre: "figuras" },
  { id: "kits", nombre: "kits" },
  { id: "joyas", nombre: "joyería del alma" }
];

export type ImagenLightbox = { src: string; alt: string };

/** Imagen del producto: data:/http/ruta explícita, o derivada del nombre, o convención `/categoria-id.jpg`. */
export function getProductImageSrc(prod: Producto): string {
  return prod.imagen && (prod.imagen.startsWith("data:") || prod.imagen.startsWith("http") || prod.imagen.startsWith("/"))
    ? prod.imagen
    : prod.imagen
      ? `/${prod.imagen.replace(/^\//, "")}`
      : nombreProductoToImagen(prod.nombre) || `/${prod.categoria}-${prod.id}.jpg`;
}

/** Top 3 productos más vendidos según pedidos reales. Sin pedidos → los 3 primeros del catálogo. */
export function calcularMasVendidos(
  pedidos: Pedido[],
  catalogo: Producto[]
): { producto: Producto; cantidad: number }[] {
  const acumulado = new Map<number, number>();
  for (const pedido of pedidos) {
    for (const item of pedido.items ?? []) {
      const id = Number(item.id);
      if (!Number.isFinite(id) || id <= 0) continue;
      const cantidad = Number(item.cantidad) || 0;
      if (cantidad <= 0) continue;
      acumulado.set(id, (acumulado.get(id) ?? 0) + cantidad);
    }
  }
  const porId = new Map(catalogo.map((p) => [Number(p.id), p]));
  const top = [...acumulado.entries()]
    .map(([id, cantidad]) => ({ producto: porId.get(id), cantidad }))
    .filter((x): x is { producto: Producto; cantidad: number } => x.producto != null)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 3);
  if (top.length === 0) {
    return catalogo.slice(0, 3).map((p) => ({ producto: p, cantidad: 0 }));
  }
  return top;
}

/** Pares [etiqueta, valor] no vacíos de la ficha técnica del producto (detalle genérico). */
export function construirFichaTecnica(pd: Producto): [string, string][] {
  return [
    ["Marca", pd.marca],
    ["Aroma", pd.aroma],
    ["Formato", pd.formato],
    ["Peso", pd.peso],
    ["Contenido", pd.cantidadContenido],
    ["Tipo", pd.tipoProducto],
    ["Origen", pd.origen],
    ["Fabricante", pd.fabricante],
    ["Referencia", pd.referencia],
    ["EAN", pd.ean],
    ["Dimensiones", pd.dimensiones],
    ["Duración aprox.", pd.duracionAproximada],
    ["Composición", pd.ingredientes]
  ].filter((par): par is [string, string] => typeof par[1] === "string" && par[1].trim().length > 0) as [string, string][];
}

/** Animación "vuela al carrito" (burbuja + pulso en el icono). Sin estado React. */
export function animarProductoAlCarrito(origen: HTMLElement | null): void {
  const carrito = document.querySelector<HTMLElement>("[data-maika-cart-icon]");
  if (!origen || !carrito || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const origenRect = origen.getBoundingClientRect();
  const carritoRect = carrito.getBoundingClientRect();
  const burbuja = document.createElement("div");

  burbuja.className = "maika-fly-to-cart";
  burbuja.textContent = "Añadido";
  burbuja.style.left = `${origenRect.left + origenRect.width / 2 - 42}px`;
  burbuja.style.top = `${origenRect.top + origenRect.height / 2 - 18}px`;
  document.body.appendChild(burbuja);

  requestAnimationFrame(() => {
    burbuja.style.transform = `translate(${carritoRect.left + carritoRect.width / 2 - origenRect.left - origenRect.width / 2}px, ${carritoRect.top + carritoRect.height / 2 - origenRect.top - origenRect.height / 2}px) scale(0.35)`;
    burbuja.style.opacity = "0.2";
  });

  window.setTimeout(() => {
    carrito.classList.remove("maika-cart-pulse");
    void carrito.offsetWidth;
    carrito.classList.add("maika-cart-pulse");
  }, 820);
  window.setTimeout(() => burbuja.remove(), 1020);
  window.setTimeout(() => carrito.classList.remove("maika-cart-pulse"), 1220);
}
