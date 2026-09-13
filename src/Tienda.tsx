import { useState, useEffect, useRef, useCallback } from "react";
import type { CSSProperties } from "react";
import type { Producto } from "./App";
import { INTENCIONES_OPCIONES } from "./types";
import type { SubcategoriaEntrada, Pedido } from "./types";
import BotonCerrar from "./components/BotonCerrar";
import { THEME } from "./config";

export type CategoriaEntrada = { id: string; nombre: string; imagen?: string };

const TIENDA_THUMB_WRAP: CSSProperties = {
  marginBottom: 12,
  width: "100%",
  aspectRatio: "1 / 1",
  maxHeight: 168,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const TIENDA_THUMB_IMG: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderRadius: 10,
  border: "1px solid rgba(212,175,55,0.5)",
};

const TIENDA_CATEG_THUMB_WRAP: CSSProperties = {
  marginBottom: 12,
  width: "100%",
  aspectRatio: "1 / 1",
  maxHeight: 148,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

/** Item mínimo del carrito para calcular disponibles = stock - en carrito */
type ItemCarritoRef = { id: number; cantidad: number };

/** Props: velas, inciensos, figuras y kits son la base real del catálogo (misma fuente que Inventario). */
interface Props {
  velas: Producto[];
  inciensos: Producto[];
  figuras: Producto[];
  kits?: Producto[];
  joyas?: Producto[];
  categoriasCatalogo?: CategoriaEntrada[];
  subcategoriasCatalogo?: SubcategoriaEntrada[];
  cart?: ItemCarritoRef[];
  agregarAlCarrito: (producto: Producto) => boolean;
  volver: () => void;
  /** Si se pasa, al montar se muestra esta categoría (ej. desde accesos rápidos en Inicio). */
  categoriaInicial?: string | null;
  /** Se llama una vez después de aplicar categoriaInicial para limpiar el estado en el padre. */
  onCategoriaInicialAplicada?: () => void;
  /** Término de búsqueda desde el menú principal; se muestran resultados filtrados. */
  busquedaInicial?: string;
  /** Limpiar el término de búsqueda en el padre. */
  onBusquedaInicialAplicada?: () => void;
  /** Mostrar u ocultar la cruz superior de esta vista. */
  mostrarBotonCerrar?: boolean;
  /** El padre (p. ej. TiendaView) oculta el bloque «Pack destacado» mientras el usuario está dentro de una categoría. */
  onVistaCategoriaInternaChange?: (abierta: boolean) => void;
  /** Menos padding superior cuando ya hay hero de pack encima (continuidad con «Lo más vendido»). */
  catalogoTrasPackHero?: boolean;
  /** Pedidos históricos para calcular «Los más vendidos» dinámicamente. */
  pedidos?: Pedido[];
}

function getProductosForCategoria(
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

function getEmoji(cat: string): string {
  const c = cat.toLowerCase();
  if (c === "velas") return "🕯️";
  if (c === "inciensos") return "🌿";
  if (c === "figuras") return "🪷";
  if (c === "kits") return "📦";
  if (c === "joyas") return "✨";
  return "📦";
}

/** Precio de venta con descuento aplicado (igual que en Inventario y useCatalogo). */
function precioConDescuento(p: Producto): number {
  const base = Number(p.precio) || 0;
  const d = p.descuentoPorcentaje != null ? Math.min(100, Math.max(0, Number(p.descuentoPorcentaje))) : 0;
  if (d <= 0) return base;
  return Math.round(base * (1 - d / 100) * 100) / 100;
}

/** Estado compartido por las tarjetas de producto (catalogo, busqueda, mas vendidos). */
type EstadoTarjeta = {
  enCarrito: number;
  disponibles: number;
  stockCatalogo: number;
  limiteCarrito: boolean;
  prodKey: string;
  recienAnadido: boolean;
};

function calcularEstadoTarjeta(
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
function nombreProductoToImagen(nombre: string): string {
  const slug = nombre
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return slug ? `/${slug}.jpg` : "";
}

const categoriasPorDefecto: CategoriaEntrada[] = [
  { id: "velas", nombre: "velas" },
  { id: "inciensos", nombre: "inciensos" },
  { id: "figuras", nombre: "figuras" },
  { id: "kits", nombre: "kits" },
  { id: "joyas", nombre: "joyería del alma" }
];

type ImagenLightbox = { src: string; alt: string };

function TiendaLightbox({ imagen, onClose }: { imagen: ImagenLightbox | null; onClose: () => void }) {
  if (!imagen) return null;
  return (
    <div
      className="tienda-lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Imagen ampliada"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.9)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        cursor: "pointer",
      }}
    >
      <BotonCerrar
        onClick={(e) => { e?.stopPropagation(); onClose(); }}
        ariaLabel="Cerrar"
        title="Cerrar"
      />
      <img
        src={imagen.src}
        alt={imagen.alt}
        decoding="async"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "100%", maxHeight: "85vh", objectFit: "contain", borderRadius: 12 }}
      />
      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem", marginTop: 12 }}>
        Clic fuera o tecla Escape para cerrar
      </p>
    </div>
  );
}

export default function Tienda({
  velas: velasIn,
  inciensos: inciensosIn,
  figuras: figurasIn,
  kits: kitsIn = [],
  joyas: joyasIn = [],
  categoriasCatalogo = categoriasPorDefecto,
  subcategoriasCatalogo = [],
  cart = [],
  agregarAlCarrito,
  volver,
  categoriaInicial,
  onCategoriaInicialAplicada,
  busquedaInicial,
  onBusquedaInicialAplicada,
  mostrarBotonCerrar = true,
  onVistaCategoriaInternaChange,
  catalogoTrasPackHero = false,
  pedidos = []
}: Props) {
  const velas = Array.isArray(velasIn) ? velasIn : [];
  const inciensos = Array.isArray(inciensosIn) ? inciensosIn : [];
  const figuras = Array.isArray(figurasIn) ? figurasIn : [];
  const kits = Array.isArray(kitsIn) ? kitsIn : [];
  const joyas = Array.isArray(joyasIn) ? joyasIn : [];
  const [mostrarCategoria, setMostrarCategoria] = useState<string | null>(null);
  /** `null` = aún no se ha elegido subcategoría; `"__todas__"` = "Ver todo <categoría>" (sin filtrar). */
  const [subcategoriaAbierta, setSubcategoriaAbierta] = useState<string | null>(null);
  const subcategoriasCategoriaActual = mostrarCategoria
    ? subcategoriasCatalogo.filter((s) => s.categoriaId === mostrarCategoria)
    : [];
  const [filtroIntencion, setFiltroIntencion] = useState<string>("");
  const terminoBusqueda = (busquedaInicial ?? "").trim();
  const todosProductos = [...velas, ...inciensos, ...figuras, ...kits, ...joyas];
  const productosBusqueda = terminoBusqueda
    ? todosProductos.filter((p) => {
        const texto = `${p.nombre} ${p.descripcion ?? ""}`.toLowerCase();
        return texto.includes(terminoBusqueda.toLowerCase());
      })
    : [];
  const fondoServicios = THEME.bg;
  const [lightboxImagen, setLightboxImagen] = useState<{ src: string; alt: string } | null>(null);
  const [anadirCarritoOkKey, setAnadirCarritoOkKey] = useState<string | null>(null);
  const anadirCarritoOkTimeoutRef = useRef<number | null>(null);

  /** Top 3 productos más vendidos según pedidos reales. Si no hay pedidos, fallback a los 3 primeros del catálogo. */
  const masVendidos = (() => {
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
    const catalogo = [...velas, ...inciensos, ...figuras, ...kits, ...joyas];
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
  })();

  const marcarAnadirCarritoOk = useCallback((producto: Producto) => {
    const key = `${producto.categoria}-${producto.id}`;
    if (anadirCarritoOkTimeoutRef.current != null) {
      window.clearTimeout(anadirCarritoOkTimeoutRef.current);
    }
    setAnadirCarritoOkKey(key);
    anadirCarritoOkTimeoutRef.current = window.setTimeout(() => {
      setAnadirCarritoOkKey((cur) => (cur === key ? null : cur));
      anadirCarritoOkTimeoutRef.current = null;
    }, 190);
  }, []);

  const animarProductoAlCarrito = useCallback((origen: HTMLElement | null) => {
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
  }, []);

  const intentarAnadirAlCarrito = useCallback(
    (producto: Producto, origen?: HTMLElement | null) => {
      const ok = agregarAlCarrito(producto);
      if (ok) {
        marcarAnadirCarritoOk(producto);
        animarProductoAlCarrito(origen ?? null);
      }
      return ok;
    },
    [agregarAlCarrito, animarProductoAlCarrito, marcarAnadirCarritoOk]
  );

  useEffect(
    () => () => {
      if (anadirCarritoOkTimeoutRef.current != null) window.clearTimeout(anadirCarritoOkTimeoutRef.current);
    },
    []
  );

  const getProductImageSrc = (prod: Producto): string =>
    prod.imagen && (prod.imagen.startsWith("data:") || prod.imagen.startsWith("http") || prod.imagen.startsWith("/"))
      ? prod.imagen
      : prod.imagen
        ? `/${prod.imagen.replace(/^\//, "")}`
        : nombreProductoToImagen(prod.nombre) || `/${prod.categoria}-${prod.id}.jpg`;

  const cerrarLightbox = () => setLightboxImagen(null);

  useEffect(() => {
    if (categoriaInicial) {
       
      setMostrarCategoria(categoriaInicial);
      setSubcategoriaAbierta(null);
      onCategoriaInicialAplicada?.();
    }
  }, [categoriaInicial, onCategoriaInicialAplicada]);

  useEffect(() => {
    onVistaCategoriaInternaChange?.(mostrarCategoria != null);
  }, [mostrarCategoria, onVistaCategoriaInternaChange]);

  useEffect(() => {
    return () => {
      onVistaCategoriaInternaChange?.(false);
    };
  }, [onVistaCategoriaInternaChange]);

  /** Cantidad de este producto en el carrito (para mostrar disponibles = stock - en carrito). */
  const cantidadEnCarrito = (idProducto: number) =>
    cart.find((it) => Number(it.id) === idProducto)?.cantidad ?? 0;

  useEffect(() => {
    if (!lightboxImagen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxImagen(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxImagen]);

  if (mostrarCategoria && subcategoriasCategoriaActual.length > 0 && !subcategoriaAbierta) {
    const productosCategoria = getProductosForCategoria(mostrarCategoria, velas, inciensos, figuras, kits, joyas);
    const entradaCat = categoriasCatalogo.find((c) => c.id === mostrarCategoria);
    const nombreCat = entradaCat?.nombre ?? mostrarCategoria;
    const tituloCat = getEmoji(mostrarCategoria) + " " + nombreCat.charAt(0).toUpperCase() + nombreCat.slice(1);
    return (
      <div className="tienda-vista tienda-vista--categoria-abierta tienda-page-layout maika-anchor" style={{ padding: 40 }}>
        <header className="tienda-vista__cabecera-categoria">
          <div className="tienda-vista__cabecera-placeholder" aria-hidden />
          <h2 className="tienda-vista__titulo-categoria" style={{ color: THEME.goldMain, fontSize: "2rem" }}>
            {tituloCat}
          </h2>
          <div className="tienda-vista__cabecera-categoria-cerrar">
            <BotonCerrar
              onClick={() => setMostrarCategoria(null)}
              ariaLabel="Volver a categorías"
              title="Volver a categorías"
            />
          </div>
        </header>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 24,
          }}
        >
          {mostrarCategoria !== "inciensos" && (
            <div
              onClick={() => setSubcategoriaAbierta("__todas__")}
              style={{
                cursor: "pointer",
                background: fondoServicios,
                borderRadius: 20,
                padding: 26,
                border: `2px dashed ${THEME.goldMain}`,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
            >
              <div style={{ fontSize: "1.8rem", marginBottom: 8 }} aria-hidden>🗂️</div>
              <h3 style={{ color: THEME.goldMain, margin: "0 0 6px", minHeight: "2.8em", lineHeight: "1.4em" }}>Ver toda {nombreCat}</h3>
              <p style={{ color: "white", margin: 0, marginTop: "auto" }}>{productosCategoria.length} productos</p>
            </div>
          )}
          {subcategoriasCategoriaActual.map((sub) => {
            const count = productosCategoria.filter((p) => p.subcategoriaId === sub.id).length;
            return (
              <div
                key={sub.id}
                onClick={() => setSubcategoriaAbierta(sub.id)}
                style={{
                  cursor: "pointer",
                  background: fondoServicios,
                  borderRadius: 20,
                  padding: 26,
                  border: `2px solid ${THEME.goldMain}`,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center"
                }}
              >
                <div style={{ fontSize: "1.8rem", marginBottom: 8 }} aria-hidden>✨</div>
                <h3 style={{ color: THEME.goldMain, margin: "0 0 6px", minHeight: "2.8em", lineHeight: "1.4em" }}>{sub.nombre}</h3>
                <p style={{ color: "white", margin: 0, marginTop: "auto" }}>{count} productos</p>
              </div>
            );
          })
}
        </div>
      </div>
    );
  }

  if (mostrarCategoria) {
    const productosCatBase = getProductosForCategoria(mostrarCategoria, velas, inciensos, figuras, kits, joyas);
    const filtrarPorSubcategoria = subcategoriaAbierta && subcategoriaAbierta !== "__todas__";
    const productosCat = filtrarPorSubcategoria
      ? productosCatBase.filter((p) => p.subcategoriaId === subcategoriaAbierta)
      : productosCatBase;
    const productos = filtroIntencion
      ? productosCat.filter((p) => p.intencion === filtroIntencion)
      : productosCat;
    const entrada = categoriasCatalogo.find((c) => c.id === mostrarCategoria);
    const subcategoriaEntrada = filtrarPorSubcategoria
      ? subcategoriasCatalogo.find((s) => s.id === subcategoriaAbierta)
      : undefined;
    const nombreDisplay = subcategoriaEntrada ? subcategoriaEntrada.nombre : entrada?.nombre ?? mostrarCategoria;
    const titulo = subcategoriaEntrada
      ? "✨ " + subcategoriaEntrada.nombre
      : getEmoji(mostrarCategoria) + " " + nombreDisplay.charAt(0).toUpperCase() + nombreDisplay.slice(1);
    const haySubcategoriasEnEstaCategoria = subcategoriasCategoriaActual.length > 0;

    return (
      <>
      <div className="tienda-vista tienda-vista--categoria-abierta tienda-page-layout maika-anchor" style={{ padding: 40 }}>
        <header className="tienda-vista__cabecera-categoria">
          <div className="tienda-vista__cabecera-placeholder" aria-hidden />
          <h2 className="tienda-vista__titulo-categoria" style={{ color: THEME.goldMain, fontSize: "2rem" }}>
            {titulo}
          </h2>
          <div className="tienda-vista__cabecera-categoria-cerrar">
            {/*
              Siempre visible: `mostrarBotonCerrar` solo afecta la cruz «volver al inicio» del listado principal
              (evita solaparse con el pack arriba); no debe ocultar el cierre de la categoría abierta.
            */}
            <BotonCerrar
              onClick={() => {
                if (haySubcategoriasEnEstaCategoria && subcategoriaAbierta) {
                  setSubcategoriaAbierta(null);
                  return;
                }
                setMostrarCategoria(null);
                setFiltroIntencion("");
              }}
              ariaLabel={haySubcategoriasEnEstaCategoria && subcategoriaAbierta ? "Volver a subcategorías" : "Volver a categorías"}
              title={haySubcategoriasEnEstaCategoria && subcategoriaAbierta ? "Volver a subcategorías" : "Volver a categorías"}
            />
          </div>
        </header>

        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ color: THEME.goldMain, fontSize: 14 }}>Filtrar por intención:</span>
          <select
            value={filtroIntencion}
            onChange={(e) => setFiltroIntencion(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: `2px solid ${THEME.goldMain}`,
              background: THEME.bg,
              color: "white",
              fontSize: 14,
              minWidth: 180
            }}
          >
            <option value="">Todas</option>
            {INTENCIONES_OPCIONES.filter((o) => o.value).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {filtroIntencion && (
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{productos.length} productos</span>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(236px, 300px))",
            justifyContent: "center",
            gap: 22,
          }}
        >
          {productos.map((prod) => {
            const { enCarrito, disponibles, stockCatalogo, limiteCarrito, prodKey, recienAnadido } = calcularEstadoTarjeta(prod, cantidadEnCarrito, anadirCarritoOkKey);
            return (
            <div
              key={prodKey}
              className="tienda-tarjeta-producto"
              style={{
                border: `2px solid ${THEME.goldMain}`,
                padding: 20,
                borderRadius: 15,
                textAlign: "center",
                background: fondoServicios,
                opacity: disponibles === 0 ? (limiteCarrito ? 0.88 : 0.6) : 1,
                position: "relative"
              }}
            >
              <div style={TIENDA_THUMB_WRAP}>
                <img
                  src={getProductImageSrc(prod)}
                  alt={prod.nombre}
                  width={400}
                  height={400}
                  loading="lazy"
                  decoding="async"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); setLightboxImagen({ src: getProductImageSrc(prod), alt: prod.nombre }); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLightboxImagen({ src: getProductImageSrc(prod), alt: prod.nombre }); } }}
                  style={{ ...TIENDA_THUMB_IMG, cursor: "pointer" }}
                  onError={(e) => { (e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%231b1745"/><text x="200" y="200" font-size="80" text-anchor="middle" dominant-baseline="central">📦</text></svg>')}`; }}
                />
              </div>
              {disponibles === 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    background: limiteCarrito ? THEME.goldMain : "#ff4444",
                    color: limiteCarrito ? "#1b1745" : "white",
                    padding: "5px 10px",
                    borderRadius: 15,
                    fontSize: limiteCarrito ? "0.62rem" : "0.7rem",
                    fontWeight: "bold",
                    maxWidth: "min(140px, calc(100% - 52px))",
                    lineHeight: 1.15,
                    textAlign: "center"
                  }}
                >
                  {limiteCarrito ? "No puedes añadir más" : "AGOTADO"}
                </div>
              )}

              {disponibles > 0 && disponibles <= 3 && (
                <div style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  background: THEME.goldMain,
                  color: "#1b1745",
                  padding: "4px 10px",
                  borderRadius: 15,
                  fontSize: "0.7rem",
                  fontWeight: "bold"
                }}>
                  ¡ÚLTIMAS {disponibles}!
                </div>
              )}

              <h3 style={{
                color: prod.nombreColor ?? "white",
                fontSize: prod.nombreTamano ? `${prod.nombreTamano}px` : undefined,
                fontStyle: prod.nombreEstilo === "italic" ? "italic" : undefined,
                fontWeight: prod.nombreEstilo === "bold" ? "bold" : undefined
              }}>
                {prod.nombre}
              </h3>
              <p className="tienda-precio-producto" style={{ color: THEME.goldMain }}>
                {prod.descuentoPorcentaje != null && prod.descuentoPorcentaje > 0 && (
                  <span style={{ textDecoration: "line-through", opacity: 0.8, marginRight: 8 }}>
                    {Number(prod.precio).toFixed(2)} €
                  </span>
                )}
                {precioConDescuento(prod).toFixed(2)} € <span style={{ fontSize: "0.75rem", opacity: 0.9 }}>(IVA incl.)</span>
                {prod.descuentoPorcentaje != null && prod.descuentoPorcentaje > 0 && (
                  <span style={{ fontSize: "0.75rem", color: "#4caf50", marginLeft: 6 }}>−{prod.descuentoPorcentaje}%</span>
                )}
              </p>

              {prod.paraQueSirve && (
                <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.9)", margin: "4px 0", fontStyle: "italic" }}>
                  ✦ {prod.paraQueSirve}
                </p>
              )}
              {prod.comoUsar && (
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)", margin: "2px 0 8px" }}>
                  {prod.comoUsar}
                </p>
              )}

              {(() => {
                /** Unidades que aún puedes añadir (coherente con insignia / botón). */
                const pocoDisponible = disponibles > 0 && disponibles <= 3;
                const todoEnCarrito = stockCatalogo > 0 && disponibles === 0 && enCarrito > 0;
                const sinStockReal = stockCatalogo === 0;
                const stockLineColor =
                  sinStockReal || pocoDisponible
                    ? "#ff5252"
                    : todoEnCarrito
                      ? "rgba(255,255,255,0.9)"
                      : "rgba(255,255,255,0.88)";
                return (
                  <p
                    style={{
                      fontSize: "0.85rem",
                      margin: "4px 0 6px",
                      color: stockLineColor,
                      fontWeight: pocoDisponible ? 600 : 400,
                      lineHeight: 1.35
                    }}
                  >
                    {todoEnCarrito ? (
                      <>
                        En almacén: {stockCatalogo} {stockCatalogo === 1 ? "unidad" : "unidades"} (no baja hasta que
                        confirmes el pago).
                      </>
                    ) : (
                      <>
                        Stock: {stockCatalogo} {stockCatalogo === 1 ? "unidad" : "unidades"}
                      </>
                    )}
                    {pocoDisponible && (
                      <span style={{ display: "block", marginTop: 3, fontSize: "0.8rem", fontWeight: "bold", color: "#ff8a80" }}>
                        ¡Quedan pocas!
                      </span>
                    )}
                    {enCarrito > 0 && (
                      <span
                        style={{
                          display: "block",
                          marginTop: 4,
                          fontSize: "0.78rem",
                          fontWeight: 500,
                          color: THEME.goldMain,
                          opacity: 0.95
                        }}
                      >
                        {todoEnCarrito
                          ? "Todo el stock está en tu carrito (no puedes añadir más)."
                          : `En carrito: ${enCarrito} · Puedes añadir ${disponibles} más.`}
                      </span>
                    )}
                  </p>
                );
              })()}

              <div style={{ marginBottom: 15, fontSize: "0.8rem", color: disponibles > 5 ? "#4caf50" : disponibles > 0 ? THEME.goldMain : limiteCarrito ? THEME.goldMain : "#ff4444" }}>
                {disponibles > 0 ? (
                  <>
                    <span>📦 {disponibles} disponibles</span>
                    <div style={{
                      width: "100%",
                      height: 4,
                      background: "rgba(255,255,255,0.2)",
                      borderRadius: 2,
                      marginTop: 5,
                      overflow: "hidden"
                    }}>
                      <div style={{
                        width: `${Math.min((disponibles / 20) * 100, 100)}%`,
                        height: "100%",
                        background: disponibles > 5 ? "#4caf50" : THEME.goldMain,
                        borderRadius: 2
                      }} />
                    </div>
                  </>
                ) : (
                  <span>{limiteCarrito ? "No puedes añadir más unidades" : "❌ Sin stock"}</span>
                )}
              </div>

       <button
  type="button"
  className={disponibles > 0 ? "btn-anadir-dorado" : undefined}
  onClick={(e) => {
    if (disponibles > 0) {
      intentarAnadirAlCarrito(prod, e.currentTarget.closest(".tienda-tarjeta-producto"));
    }
  }}
  disabled={disponibles === 0}
  style={{
    background: recienAnadido
      ? "linear-gradient(135deg, rgba(0, 200, 120, 0.95), rgba(0, 150, 95, 0.98))"
      : disponibles > 0
        ? "#1565c0"
        : "#666",
    border: `2px solid ${recienAnadido ? "rgba(0, 220, 140, 0.85)" : THEME.goldMain}`,
    padding: "10px 25px",
    borderRadius: 25,
    cursor: disponibles > 0 ? "pointer" : "not-allowed",
    fontWeight: "bold",
    color: disponibles > 0 ? (recienAnadido ? "#fff" : THEME.goldMain) : "#ccc",
    width: "100%",
    transition: "background 0.32s ease, border-color 0.32s ease, color 0.32s ease, transform 0.28s ease",
  }}
>
  {recienAnadido
    ? "Añadido ✓"
    : disponibles > 0
      ? "Añadir al carrito"
      : limiteCarrito
        ? "No puedes añadir más"
        : "Sin stock"}
</button>
            </div>
            );
          })}
        </div>
      </div>
      <TiendaLightbox imagen={lightboxImagen} onClose={cerrarLightbox} />
    </>
    );
  }

  return (
    <>
    <div
      className={`tienda-vista tienda-page-layout tienda-vista--catalogo maika-anchor${catalogoTrasPackHero ? " tienda-vista--catalogo-tras-pack" : ""}`}
    >
      {mostrarBotonCerrar && (
        <BotonCerrar
          onClick={volver}
          ariaLabel="Volver al inicio"
          title="Volver al inicio"
          anclaje="viewport"
        />
      )}

      {terminoBusqueda && (
        <div style={{ marginBottom: 44, background: fondoServicios, padding: "16px 12px", borderRadius: 22, border: `2px solid ${THEME.goldMain}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
            <h3 style={{ color: THEME.goldMain, fontSize: "1.08rem", margin: 0 }}>
              Resultados para &quot;{terminoBusqueda}&quot;
            </h3>
            {onBusquedaInicialAplicada && (
              <button
                type="button"
                onClick={onBusquedaInicialAplicada}
                style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${THEME.goldMain}`, background: "transparent", color: THEME.goldMain, cursor: "pointer", fontSize: 13 }}
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
          {productosBusqueda.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.8)", textAlign: "center", margin: 20 }}>No hay productos que coincidan con tu búsqueda.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(236px, 300px))", justifyContent: "center", gap: 22 }}>
              {productosBusqueda.map((prod) => {
                const { disponibles, limiteCarrito: limiteCarritoBusq, prodKey: prodKeyBusq, recienAnadido: recienAnadidoBusq } = calcularEstadoTarjeta(prod, cantidadEnCarrito, anadirCarritoOkKey);
                return (
                  <div
                    key={`busqueda-${prodKeyBusq}`}
                    className="tienda-tarjeta-producto"
                    style={{ border: `2px solid ${THEME.goldMain}`, padding: 20, borderRadius: 15, textAlign: "center", background: fondoServicios, opacity: disponibles === 0 ? (limiteCarritoBusq ? 0.88 : 0.6) : 1, position: "relative" }}
                  >
                    <div style={TIENDA_THUMB_WRAP}>
                      <img
                        src={getProductImageSrc(prod)}
                        alt={prod.nombre}
                        width={400}
                        height={400}
                        loading="lazy"
                        decoding="async"
                        style={TIENDA_THUMB_IMG}
                        onError={(e) => { (e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%231b1745"/><text x="200" y="200" font-size="80" text-anchor="middle" dominant-baseline="central">📦</text></svg>')}`; }}
                      />
                    </div>
                    <h3 style={{ color: prod.nombreColor ?? "white" }}>{prod.nombre}</h3>
                    <p className="tienda-precio-producto" style={{ color: THEME.goldMain }}>{precioConDescuento(prod).toFixed(2)} €</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        if (disponibles > 0) {
                          intentarAnadirAlCarrito(prod, e.currentTarget.closest(".tienda-tarjeta-producto"));
                        }
                      }}
                      disabled={disponibles === 0}
                      style={{
                        padding: "10px 25px",
                        borderRadius: 25,
                        border: `2px solid ${recienAnadidoBusq ? "rgba(0, 220, 140, 0.85)" : THEME.goldMain}`,
                        background: recienAnadidoBusq
                          ? "linear-gradient(135deg, rgba(0, 200, 120, 0.95), rgba(0, 150, 95, 0.98))"
                          : disponibles > 0
                            ? THEME.goldMain
                            : "#666",
                        color: disponibles > 0 ? (recienAnadidoBusq ? "#fff" : "#1b1745") : "#ccc",
                        cursor: disponibles > 0 ? "pointer" : "not-allowed",
                        fontWeight: "bold",
                        width: "100%",
                        transition: "background 0.32s ease, border-color 0.32s ease, color 0.32s ease, transform 0.28s ease",
                      }}
                    >
                      {recienAnadidoBusq
                        ? "Añadido ✓"
                        : disponibles > 0
                          ? "Añadir al carrito"
                          : limiteCarritoBusq
                            ? "No puedes añadir más"
                            : "Sin stock"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MÁS VENDIDOS */}
      {masVendidos.length > 0 && (
      <div className="tienda-mas-vendidos-bloque">
        <h3 className="tienda-mas-vendidos-bloque__titulo">
          <span className="tienda-mas-vendidos-bloque__titulo-ico" aria-hidden>🔥</span>
          LOS MÁS VENDIDOS
          <span className="tienda-mas-vendidos-bloque__titulo-ico" aria-hidden>✨</span>
        </h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
        }}>
          {masVendidos.map(({ producto: p, cantidad }) => {
            const emoji = getEmoji(p.categoria);
            const precio = precioConDescuento(p);
            const stock = Math.max(0, Math.floor(Number(p.stock)) || 0);
            const prodKey = `${p.categoria}-${p.id}`;
            const recienAnadido = anadirCarritoOkKey === prodKey;
            return (
          <div
            key={prodKey}
            className="tienda-tarjeta-producto"
            style={{
            background: fondoServicios,
            borderRadius: 16,
            padding: "10px",
            border: `2px solid ${THEME.goldMain}`,
            position: "relative",
          }}
          >
            {cantidad > 0 && (
            <div style={{
              position: "absolute",
              top: -8,
              right: -8,
              background: "#ff4444",
              color: "white",
              padding: "5px 10px",
              borderRadius: 20,
              fontWeight: "bold",
              fontSize: "0.82rem",
            }}>
              🔥 {cantidad} vendidos
            </div>
            )}
            <div style={{ fontSize: "1.7rem", textAlign: "center", marginBottom: 6 }}>{emoji}</div>
            <h4 style={{
              color: p.nombreColor ?? THEME.goldMain,
              textAlign: "center",
              fontSize: p.nombreTamano ? `${p.nombreTamano}px` : "1.06rem",
              fontWeight: "bold",
              lineHeight: 1.2,
              textShadow: "0 1px 2px rgba(0,0,0,0.45)",
              fontStyle: p.nombreEstilo === "italic" ? "italic" : undefined
            }}>
              {p.nombre}
            </h4>
            {p.paraQueSirve && (
            <p style={{ color: "rgba(255,255,255,0.96)", fontSize: "0.98rem", margin: "8px 0", lineHeight: 1.45 }}>
              ✦ {p.paraQueSirve}
            </p>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span className="tienda-precio-producto tienda-precio-producto--masvendidos" style={{ color: THEME.goldMain }}>{precio.toFixed(2)}€</span>
              <button
                type="button"
                className={`btn-mas-vendidos ${stock ? "btn-anadir-dorado" : ""}`}
                onClick={(e) => {
                  if (stock > 0) {
                    intentarAnadirAlCarrito(p, e.currentTarget.closest(".tienda-tarjeta-producto"));
                  }
                }}
                style={{
                  background: recienAnadido
                    ? "linear-gradient(135deg, rgba(0, 200, 120, 0.95), rgba(0, 150, 95, 0.98))"
                    : stock ? THEME.goldMain : "#666",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: 20,
                  cursor: stock ? "pointer" : "not-allowed",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  color: recienAnadido ? "#fff" : stock ? "#1b1745" : "#ccc",
                  transition: "background 0.32s ease, color 0.32s ease, transform 0.28s ease",
                }}
              >
                {recienAnadido ? "Añadido ✓" : stock ? "Añadir" : "Agotado"}
              </button>
            </div>
          </div>
            );
          })}
        </div>
      </div>
      )}

      {/* CATEGORÍAS (sincronizadas con Editar Categorías) */}
      <section className="tienda-categorias-seccion" aria-labelledby="tienda-categorias-titulo">
        <h2 id="tienda-categorias-titulo" className="tienda-categorias-seccion__titulo">
          Categorías
        </h2>
        <p className="tienda-categorias-seccion__sub">Explora por tipo de producto</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 30,
        }}
      >
        {categoriasCatalogo.map((categoria) => {
          const productosCat = getProductosForCategoria(categoria.id, velas, inciensos, figuras, kits, joyas);
          const nombreDisplay = categoria.nombre.charAt(0).toUpperCase() + categoria.nombre.slice(1);
          return (
            <div
              key={categoria.id}
              onClick={() => {
                setSubcategoriaAbierta(null);
                setMostrarCategoria(categoria.id);
              }}
              style={{
                cursor: "pointer",
                background: fondoServicios,
                borderRadius: 20,
                padding: 30,
                border: `2px solid ${THEME.goldMain}`,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
            >
              <div style={TIENDA_CATEG_THUMB_WRAP}>
                <img
                  src={categoria.imagen || `/${categoria.id}.jpg`}
                  alt={nombreDisplay}
                  width={400}
                  height={400}
                  loading="lazy"
                  decoding="async"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); setLightboxImagen({ src: categoria.imagen || `/${categoria.id}.jpg`, alt: nombreDisplay }); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLightboxImagen({ src: categoria.imagen || `/${categoria.id}.jpg`, alt: nombreDisplay }); } }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    borderRadius: 12,
                    border: "1px solid rgba(212,175,55,0.5)",
                    cursor: "pointer",
                  }}
                  onError={(e) => { (e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%231b1745"/><text x="200" y="200" font-size="80" text-anchor="middle" dominant-baseline="central">📦</text></svg>')}`; }}
                />
              </div>
              <h2 style={{ color: THEME.goldMain, margin: "0 0 6px", minHeight: "2.8em", lineHeight: "1.4em" }}>{getEmoji(categoria.id)} {nombreDisplay}</h2>
              <p style={{ color: "white", margin: 0, marginTop: "auto" }}>{productosCat.length} productos</p>
              <div
                style={{
                  background: THEME.goldMain,
                  color: "#1b1745",
                  padding: "8px 20px",
                  borderRadius: 20,
                  fontWeight: "bold",
                  display: "inline-block",
                  marginTop: 10
                }}
              >
                Ver todas →
              </div>
            </div>
          );
        })}
      </div>
      </section>
    </div>
    <TiendaLightbox imagen={lightboxImagen} onClose={cerrarLightbox} />
  </>
  );
}