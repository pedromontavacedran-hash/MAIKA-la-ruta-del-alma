import type { CampanaPackConfig, CampanaPackLinea, Producto } from "../types";
import { esOfertaEnVigencia, parseFechaLocalOferta } from "./oferta";

const CAMPANA_KEY = "campana_pack_maika_v1";
const LEGACY_OFERTA_KEY = "oferta_maika";
export const CAMPANA_PACK_EVENT = "maika:campana-pack-updated";

function toDatetimeLocalSlice(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${day}T${h}:${mi}`;
}

/** Plantilla por defecto (sin guardar aún): pack fijo tipo “limpieza energética”, sin líneas = resolución legacy en tienda. */
export function defaultCampanaPack(): CampanaPackConfig {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date();
  fin.setHours(23, 59, 0, 0);
  return {
    version: 1,
    tipo: "fijo",
    activo: true,
    nombre: "✨ Pack Limpieza Energética",
    subtitulo: "Vela + incienso para armonizar y renovar energía",
    imagenUrl: "",
    precio: 29.9,
    precioAnterior: 39.9,
    textoBotonTarjeta: "Descubrir el pack",
    descripcionLarga:
      "Un pack pensado para limpiar la energía del espacio y dejar entrar armonía. Incluye una vela y un incienso seleccionados del catálogo. Ideal para empezar o cerrar el día con intención.",
    lineas: [],
    textoEspiritual:
      "Enciende la vela con una intención clara, deja que el humo del incienso acompañe el momento. No hace falta prisa: el ritual es tuyo.",
    inicio: toDatetimeLocalSlice(inicio),
    fin: toDatetimeLocalSlice(fin),
    mostrarContador: true,
    mostrarAhorro: true
  };
}

function normalizeCampana(raw: Partial<CampanaPackConfig> & { version?: number }): CampanaPackConfig {
  const d = defaultCampanaPack();
  return {
    version: 1,
    tipo: raw.tipo === "dinamico" ? "dinamico" : "fijo",
    activo: typeof raw.activo === "boolean" ? raw.activo : d.activo,
    nombre: typeof raw.nombre === "string" && raw.nombre.trim() ? raw.nombre.trim() : d.nombre,
    subtitulo: typeof raw.subtitulo === "string" ? raw.subtitulo : d.subtitulo,
    imagenUrl: typeof raw.imagenUrl === "string" ? raw.imagenUrl : "",
    precio: typeof raw.precio === "number" && Number.isFinite(raw.precio) ? raw.precio : d.precio,
    precioAnterior:
      raw.precioAnterior === null || raw.precioAnterior === undefined
        ? d.precioAnterior
        : typeof raw.precioAnterior === "number" && Number.isFinite(raw.precioAnterior)
          ? raw.precioAnterior
          : null,
    textoBotonTarjeta:
      typeof raw.textoBotonTarjeta === "string" && raw.textoBotonTarjeta.trim()
        ? raw.textoBotonTarjeta.trim()
        : d.textoBotonTarjeta,
    descripcionLarga: typeof raw.descripcionLarga === "string" ? raw.descripcionLarga : d.descripcionLarga,
    lineas: Array.isArray(raw.lineas)
      ? raw.lineas
          .filter(
            (l): l is CampanaPackLinea =>
              l != null &&
              typeof (l as CampanaPackLinea).productoId === "number" &&
              typeof (l as CampanaPackLinea).cantidad === "number"
          )
          .map((l) => ({
            productoId: Math.max(1, Math.floor(l.productoId)),
            cantidad: Math.max(1, Math.floor(l.cantidad))
          }))
      : [],
    textoEspiritual: typeof raw.textoEspiritual === "string" ? raw.textoEspiritual : d.textoEspiritual,
    inicio: typeof raw.inicio === "string" ? raw.inicio : d.inicio,
    fin: typeof raw.fin === "string" ? raw.fin : d.fin,
    mostrarContador: typeof raw.mostrarContador === "boolean" ? raw.mostrarContador : d.mostrarContador,
    mostrarAhorro: typeof raw.mostrarAhorro === "boolean" ? raw.mostrarAhorro : d.mostrarAhorro
  };
}

function migrateLegacyOferta(): CampanaPackConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEGACY_OFERTA_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as { inicio?: string; fin?: string };
    if (typeof o.inicio !== "string" || typeof o.fin !== "string") return null;
    const base = defaultCampanaPack();
    base.inicio = o.inicio;
    base.fin = o.fin;
    window.localStorage.setItem(CAMPANA_KEY, JSON.stringify(base));
    window.localStorage.removeItem(LEGACY_OFERTA_KEY);
    return base;
  } catch {
    return null;
  }
}

/** Lee la campaña; si no hay datos, migra oferta antigua o devuelve plantilla por defecto (sin guardar). */
export function getCampanaPack(): CampanaPackConfig {
  if (typeof window === "undefined") return defaultCampanaPack();
  try {
    const raw = window.localStorage.getItem(CAMPANA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CampanaPackConfig>;
      return normalizeCampana(parsed);
    }
    const migrated = migrateLegacyOferta();
    if (migrated) return migrated;
  } catch {
    /* ignore */
  }
  return defaultCampanaPack();
}

export function setCampanaPack(c: CampanaPackConfig | null): void {
  if (typeof window === "undefined") return;
  if (c === null) {
    window.localStorage.removeItem(CAMPANA_KEY);
  } else {
    window.localStorage.setItem(CAMPANA_KEY, JSON.stringify(normalizeCampana(c)));
  }
  window.dispatchEvent(new CustomEvent(CAMPANA_PACK_EVENT));
}

export function subscribeCampanaPack(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === CAMPANA_KEY || event.key === LEGACY_OFERTA_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CAMPANA_PACK_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CAMPANA_PACK_EVENT, onChange);
  };
}

/** Fechas de campaña vigentes (vacías = siempre vigente si activo). */
export function campanaVentanaVigente(c: CampanaPackConfig): boolean {
  const ini = c.inicio?.trim();
  const fin = c.fin?.trim();
  if (!ini || !fin) return true;
  return esOfertaEnVigencia({ inicio: ini, fin });
}

/**
 * Si ya pasó la fecha de inicio (o no hay ventana definida), el pack se muestra en tienda aunque la oferta haya terminado:
 * imagen y precios del pack siguen visibles; contador y chapa «Oferta activa» usan `campanaVentanaVigente`.
 */
export function campanaPackMostrarseEnTienda(c: CampanaPackConfig): boolean {
  const ini = c.inicio?.trim();
  const fin = c.fin?.trim();
  if (!ini || !fin) return true;
  const inicioD = parseFechaLocalOferta(ini);
  if (Number.isNaN(inicioD.getTime())) return true;
  return Date.now() >= inicioD.getTime();
}

/** Pack visible en tienda: activo, tipo fijo, productos resolubles y (sin fechas o ya comenzó la campaña). */
export function campanaVisibleEnTienda(c: CampanaPackConfig, hayProductos: boolean): boolean {
  if (!c.activo || !hayProductos) return false;
  if (c.tipo === "dinamico") return false;
  return campanaPackMostrarseEnTienda(c);
}

function precioPackSumaLineas(lineas: Array<{ producto: Producto; cantidad: number }>): number {
  return lineas.reduce((acc, { producto, cantidad }) => acc + Number(producto.precio || 0) * cantidad, 0);
}

/**
 * Con oferta horaria vigente: `precio` (rebajado).
 * Fuera de oferta: **un solo** precio “de tienda” = `precioAnterior` del admin (precio sin campaña), si está definido;
 * si no, suma de precios de catálogo de las líneas (o `precio` si no hay líneas).
 */
export function campanaPrecioMostrado(
  c: CampanaPackConfig,
  ofertaHorariaVigente: boolean,
  lineasResueltas?: Array<{ producto: Producto; cantidad: number }> | null
): number {
  if (ofertaHorariaVigente) return c.precio;
  const ant = c.precioAnterior;
  if (ant != null && Number.isFinite(ant)) return ant;
  const suma =
    lineasResueltas && lineasResueltas.length > 0 ? precioPackSumaLineas(lineasResueltas) : 0;
  if (suma > 0) return Math.max(suma, c.precio);
  return c.precio;
}

/** Tachado y texto de ahorro solo mientras la ventana horaria de oferta está activa. */
export function campanaMostrarUiAhorro(c: CampanaPackConfig, ofertaHorariaVigente: boolean): boolean {
  if (!ofertaHorariaVigente) return false;
  const ant = c.precioAnterior;
  return Boolean(c.mostrarAhorro && ant != null && ant > c.precio);
}

/** Resuelve líneas del catálogo; si `lineas` vacío, primera vela + primer incienso (comportamiento legacy). */
export function resolverLineasPack(
  c: CampanaPackConfig,
  velas: Producto[],
  inciensos: Producto[],
  figuras: Producto[],
  kits: Producto[],
  joyas: Producto[]
): Array<{ producto: Producto; cantidad: number }> | null {
  const all = [...velas, ...inciensos, ...figuras, ...kits, ...joyas];
  const byId = new Map(all.map((p) => [p.id, p]));

  if (c.lineas.length > 0) {
    const out: Array<{ producto: Producto; cantidad: number }> = [];
    for (const line of c.lineas) {
      const p = byId.get(line.productoId);
      if (!p) return null;
      out.push({ producto: p, cantidad: line.cantidad });
    }
    return out.length > 0 ? out : null;
  }

  const vela = velas[0];
  const inc = inciensos[0];
  if (!vela || !inc) return null;
  return [
    { producto: vela, cantidad: 1 },
    { producto: inc, cantidad: 1 }
  ];
}

export function imagenPackParaTarjeta(c: CampanaPackConfig, lineasResueltas: Array<{ producto: Producto; cantidad: number }>): string {
  const img = c.imagenUrl?.trim();
  if (img) return img;
  const first = lineasResueltas[0]?.producto?.imagen;
  return first ?? "";
}

export function normalizarSrcImagenProducto(src: string): string {
  const clean = src.trim().replace(/\\/g, "/");
  if (!clean) return "";
  if (clean.startsWith("data:") || clean.startsWith("http")) return clean;
  const sinBarraInicial = clean.replace(/^\/+/, "");
  const sinPublic = sinBarraInicial.replace(/^public\//i, "");
  return `/${sinPublic}`;
}
