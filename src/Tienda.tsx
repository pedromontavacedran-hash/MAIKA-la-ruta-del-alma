import { useState, useEffect, useRef, useCallback } from "react";
import type { Producto } from "./App";
import { INTENCIONES_OPCIONES } from "./types";
import type { SubcategoriaEntrada, Pedido } from "./types";
import BotonCerrar from "./components/BotonCerrar";
import { THEME } from "./config";
import {
  TIENDA_THUMB_WRAP,
  TIENDA_THUMB_IMG,
  TIENDA_CATEG_THUMB_WRAP,
  animarProductoAlCarrito as animarProductoAlCarritoDom,
  calcularMasVendidos,
  categoriasPorDefecto,
  calcularEstadoTarjeta,
  construirFichaTecnica,
  getEmoji,
  getProductosForCategoria,
  getProductImageSrc,
  precioConDescuento,
  type CategoriaEntrada,
  type ItemCarritoRef
} from "./tienda/tiendaHelpers";
import { TiendaLightbox } from "./tienda/TiendaLightbox";
import { DetalleIncienso } from "./tienda/DetalleIncienso";
import { DetalleProductoGenerico } from "./tienda/DetalleProductoGenerico";

export type { CategoriaEntrada };

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
  const [productoDetalle, setProductoDetalle] = useState<Producto | null>(null);
  const [anadirCarritoOkKey, setAnadirCarritoOkKey] = useState<string | null>(null);
  const anadirCarritoOkTimeoutRef = useRef<number | null>(null);

  /** Top 3 productos más vendidos según pedidos reales. Si no hay pedidos, fallback a los 3 primeros del catálogo. */
  const masVendidos = calcularMasVendidos(pedidos, todosProductos);

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

  const animarProductoAlCarrito = useCallback(
    (origen: HTMLElement | null) => animarProductoAlCarritoDom(origen),
    []
  );

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
    if (!lightboxImagen && !productoDetalle) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (lightboxImagen) setLightboxImagen(null);
      else setProductoDetalle(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxImagen, productoDetalle]);

  if (productoDetalle) {
    const { disponibles, limiteCarrito, recienAnadido } = calcularEstadoTarjeta(
      productoDetalle,
      cantidadEnCarrito,
      anadirCarritoOkKey
    );
    const categoriaDetalle = categoriasCatalogo.find((c) => c.id === productoDetalle.categoria);
    const subcategoriaDetalle = subcategoriasCatalogo.find((s) => s.id === productoDetalle.subcategoriaId);
    const pd = productoDetalle;
    const fichaTecnica = construirFichaTecnica(pd);

    // ===== Ficha profesional específica para INCIENSOS =====
    if (productoDetalle.categoria === "inciensos") {
      return (
        <DetalleIncienso
          producto={productoDetalle}
          categoriaDetalle={categoriaDetalle}
          subcategoriaDetalle={subcategoriaDetalle}
          disponibles={disponibles}
          limiteCarrito={limiteCarrito}
          recienAnadido={recienAnadido}
          imgSrc={getProductImageSrc(productoDetalle)}
          onVolver={() => setProductoDetalle(null)}
          onAbrirLightbox={(src, alt) => setLightboxImagen({ src, alt })}
          onAnadirAlCarrito={intentarAnadirAlCarrito}
          lightboxImagen={lightboxImagen}
          onCerrarLightbox={cerrarLightbox}
        />
      );
    }

    // ===== Ficha genérica para otras categorías (sin cambios) =====
    return (
      <DetalleProductoGenerico
        producto={productoDetalle}
        categoriaDetalle={categoriaDetalle}
        subcategoriaDetalle={subcategoriaDetalle}
        disponibles={disponibles}
        limiteCarrito={limiteCarrito}
        recienAnadido={recienAnadido}
        imgSrc={getProductImageSrc(productoDetalle)}
        fichaTecnica={fichaTecnica}
        onVolver={() => setProductoDetalle(null)}
        onAbrirLightbox={(src, alt) => setLightboxImagen({ src, alt })}
        onAnadirAlCarrito={intentarAnadirAlCarrito}
        lightboxImagen={lightboxImagen}
        onCerrarLightbox={cerrarLightbox}
      />
    );
  }

  if (mostrarCategoria && subcategoriasCategoriaActual.length > 0 && !subcategoriaAbierta) {
    const productosCategoria = getProductosForCategoria(mostrarCategoria, velas, inciensos, figuras, kits, joyas);
    const entradaCat = categoriasCatalogo.find((c) => c.id === mostrarCategoria);
    const nombreCat = entradaCat?.nombre ?? mostrarCategoria;
    const tituloCat = getEmoji(mostrarCategoria) + " " + nombreCat.charAt(0).toUpperCase() + nombreCat.slice(1);
    const subsRaiz = subcategoriasCategoriaActual.filter((s) => !s.padreSubcategoriaId);
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
          {subsRaiz.map((sub) => {
            const prodsEnSubarbol = productosCategoria.filter(
              (p) => p.subcategoriaId === sub.id || subcategoriasCategoriaActual.some((h) => h.padreSubcategoriaId === sub.id && h.id === p.subcategoriaId)
            );
            if (sub.imagen) {
              return (
                <div
                  key={sub.id}
                  onClick={() => setSubcategoriaAbierta(sub.id)}
                  style={{
                    cursor: "pointer",
                    background: fondoServicios,
                    borderRadius: 20,
                    overflow: "hidden",
                    border: `2px solid ${THEME.goldMain}`,
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch"
                  }}
                >
                  <img
                    src={sub.imagen}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }}
                  />
                  <div style={{ padding: "16px 20px 22px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1 }}>
                    <h3 style={{ color: THEME.goldMain, margin: 0, lineHeight: "1.4em" }}>{sub.nombre}</h3>
                  </div>
                </div>
              );
            }
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
                <p style={{ color: "white", margin: 0, marginTop: "auto" }}>{prodsEnSubarbol.length} productos</p>
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
    const esVerToda = subcategoriaAbierta === "__todas__";
    const matchPadreTodas = subcategoriaAbierta?.startsWith("__todas__:")
      ? subcategoriaAbierta.split(":")[1]
      : null;
    const filtrarPorSubcategoria = Boolean(subcategoriaAbierta) && !esVerToda;
    const productosCat = esVerToda
      ? productosCatBase
      : matchPadreTodas
        ? productosCatBase.filter(
            (p) => {
              const hijasIds = subcategoriasCategoriaActual
                .filter((s) => s.padreSubcategoriaId === matchPadreTodas)
                .map((s) => s.id);
              return p.subcategoriaId === matchPadreTodas || hijasIds.includes(p.subcategoriaId ?? "");
            }
          )
        : filtrarPorSubcategoria
          ? productosCatBase.filter((p) => p.subcategoriaId === subcategoriaAbierta)
          : productosCatBase;
    const permiteFiltroIntencion = mostrarCategoria !== "inciensos";
    const productos = permiteFiltroIntencion && filtroIntencion
      ? productosCat.filter((p) => p.intencion === filtroIntencion)
      : productosCat;
    const entrada = categoriasCatalogo.find((c) => c.id === mostrarCategoria);
    const subcategoriaActivaId = matchPadreTodas || subcategoriaAbierta || undefined;
    const subcategoriaEntrada = filtrarPorSubcategoria || matchPadreTodas
      ? subcategoriasCatalogo.find((s) => s.id === subcategoriaActivaId)
      : undefined;
    const nombreDisplay = subcategoriaEntrada ? subcategoriaEntrada.nombre : entrada?.nombre ?? mostrarCategoria;
    const titulo = subcategoriaEntrada
      ? "✨ " + subcategoriaEntrada.nombre
      : getEmoji(mostrarCategoria) + " " + nombreDisplay.charAt(0).toUpperCase() + nombreDisplay.slice(1);
    const haySubcategoriasEnEstaCategoria = subcategoriasCategoriaActual.length > 0;

    // Si la subcategoría abierta tiene hijas, mostrar una cuadrícula de sub-subcategorías
    const hijas = subcategoriaAbierta
      ? subcategoriasCategoriaActual.filter((s) => s.padreSubcategoriaId === subcategoriaAbierta)
      : [];
    if (hijas.length > 0) {
      return (
        <div className="tienda-vista tienda-vista--categoria-abierta tienda-page-layout maika-anchor" style={{ padding: 40 }}>
          <header className="tienda-vista__cabecera-categoria">
            <div className="tienda-vista__cabecera-placeholder" aria-hidden />
            <h2 className="tienda-vista__titulo-categoria" style={{ color: THEME.goldMain, fontSize: "2rem" }}>
              {titulo}
            </h2>
            <div className="tienda-vista__cabecera-categoria-cerrar">
              <BotonCerrar
                onClick={() => setSubcategoriaAbierta(null)}
                ariaLabel="Volver a subcategorías"
                title="Volver a subcategorías"
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
            {hijas.map((sub) => {
              const count = productosCatBase.filter((p) => p.subcategoriaId === sub.id).length;
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
            })}
          </div>
        </div>
      );
    }

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
                if (!subcategoriaAbierta) {
                  setMostrarCategoria(null);
                  setFiltroIntencion("");
                  return;
                }
                if (subcategoriaAbierta.startsWith("__todas__:")) {
                  const padreId = subcategoriaAbierta.split(":")[1];
                  setSubcategoriaAbierta(padreId);
                  return;
                }
                if (haySubcategoriasEnEstaCategoria) {
                  setSubcategoriaAbierta(null);
                  return;
                }
                setMostrarCategoria(null);
                setFiltroIntencion("");
              }}
              ariaLabel={subcategoriaAbierta ? (subcategoriaAbierta.startsWith("__todas__:") ? "Volver a subcategorías" : "Volver a categorías") : "Volver a categorías"}
              title={subcategoriaAbierta ? (subcategoriaAbierta.startsWith("__todas__:") ? "Volver a subcategorías" : "Volver a categorías") : "Volver a categorías"}
            />
          </div>
        </header>

        {permiteFiltroIntencion && (
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
        )}

        <div
          className="tienda-grid-principal"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 220px))",
            justifyContent: "center",
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
                padding: 10,
                borderRadius: 13,
                textAlign: "center",
                background: fondoServicios,
                opacity: disponibles === 0 ? (limiteCarrito ? 0.88 : 0.6) : 1,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                boxSizing: "border-box"
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
                  onClick={(e) => { e.stopPropagation(); setProductoDetalle(prod); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setProductoDetalle(prod); } }}
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
                    background: "#ff4444",
                    color: "white",
                    padding: "5px 10px",
                    borderRadius: 15,
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                    maxWidth: "min(140px, calc(100% - 52px))",
                    lineHeight: 1.15,
                    textAlign: "center"
                  }}
                >
                  AGOTADO
                </div>
              )}

              <div style={{ minHeight: 24, margin: "5px 0 0" }}>
                {disponibles > 0 && disponibles <= 3 && (
                  <div style={{
                    background: THEME.goldMain,
                    color: "#1b1745",
                    padding: "3px 8px",
                    borderRadius: 12,
                    fontSize: "0.66rem",
                    fontWeight: "bold",
                    textAlign: "center",
                    lineHeight: 1.2
                  }}>
                    {disponibles === 1 ? "🔥 ¡ÚLTIMA UNIDAD!" : `🔥 ¡ÚLTIMAS ${disponibles} UNIDADES!`}
                  </div>
                )}
              </div>

              <h3 style={{
                color: prod.nombreColor ?? "white",
                fontSize: `${Math.min(17, Number(prod.nombreTamano) || 17)}px`,
                fontStyle: prod.nombreEstilo === "italic" ? "italic" : undefined,
                fontWeight: prod.nombreEstilo === "bold" ? "bold" : undefined,
                height: "2.75rem",
                margin: "5px 0 4px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                overflow: "hidden",
                lineHeight: 1.2
              }}>
                {prod.nombre}
              </h3>
              <p className="tienda-precio-producto" style={{ color: THEME.goldMain, minHeight: "1.65rem", margin: "0", display: "flex", alignItems: "baseline", justifyContent: "center", flexWrap: "wrap", fontSize: "0.95rem", lineHeight: 1.1 }}>
                {prod.descuentoPorcentaje != null && prod.descuentoPorcentaje > 0 && (
                  <span style={{ textDecoration: "line-through", opacity: 0.8, marginRight: 8 }}>
                    {Number(prod.precio).toFixed(2)} €
                  </span>
                )}
                {precioConDescuento(prod).toFixed(2)} €
                {prod.descuentoPorcentaje != null && prod.descuentoPorcentaje > 0 && (
                  <span style={{ fontSize: "0.75rem", color: "#4caf50", marginLeft: 6 }}>−{prod.descuentoPorcentaje}%</span>
                )}
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.62rem", margin: "2px 0 4px", letterSpacing: "0.04em" }}>IVA incluido</p>

              {(() => {
                const todoEnCarrito = stockCatalogo > 0 && disponibles === 0 && enCarrito > 0;
                if (enCarrito <= 0 || todoEnCarrito) return null;
                return (
                  <p style={{ fontSize: "0.85rem", margin: "4px 0 6px", lineHeight: 1.35 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.78rem",
                        fontWeight: 500,
                        color: THEME.goldMain,
                        opacity: 0.95
                      }}
                    >
                      En carrito: {enCarrito} · Puedes añadir {disponibles} más.
                    </span>
                  </p>
                );
              })()}

              <div style={{ marginBottom: 6, minHeight: 23, fontSize: "0.72rem", color: disponibles > 5 ? "#4caf50" : disponibles > 0 ? THEME.goldMain : limiteCarrito ? THEME.goldMain : "#ff4444", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                {disponibles > 0 ? (
                  <>
                    {disponibles >= 4 && <span>📦 {disponibles} disponibles</span>}
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
                  !limiteCarrito && <span>❌ Sin stock</span>
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
    padding: "6px 14px",
    borderRadius: 18,
    fontSize: "0.76rem",
    cursor: disponibles > 0 ? "pointer" : "not-allowed",
    fontWeight: "bold",
    color: disponibles > 0 ? (recienAnadido ? "#fff" : THEME.goldMain) : "#ccc",
    width: "100%",
    marginTop: "auto",
    transition: "background 0.32s ease, border-color 0.32s ease, color 0.32s ease, transform 0.28s ease",
  }}
>
  {recienAnadido
    ? "Añadido ✓"
    : disponibles > 0
      ? "Añadir al carrito"
      : limiteCarrito
        ? "Sin existencias"
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 220px))", justifyContent: "center", gap: 20 }}>
              {productosBusqueda.map((prod) => {
                const { disponibles, limiteCarrito: limiteCarritoBusq, prodKey: prodKeyBusq, recienAnadido: recienAnadidoBusq } = calcularEstadoTarjeta(prod, cantidadEnCarrito, anadirCarritoOkKey);
                return (
                  <div
                    key={`busqueda-${prodKeyBusq}`}
                    className="tienda-tarjeta-producto"
                    style={{ border: `2px solid ${THEME.goldMain}`, padding: 10, borderRadius: 13, textAlign: "center", background: fondoServicios, opacity: disponibles === 0 ? (limiteCarritoBusq ? 0.88 : 0.6) : 1, position: "relative", display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box" }}
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
                        onClick={() => setProductoDetalle(prod)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setProductoDetalle(prod); } }}
                        style={{ ...TIENDA_THUMB_IMG, cursor: "pointer" }}
                        onError={(e) => { (e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%231b1745"/><text x="200" y="200" font-size="80" text-anchor="middle" dominant-baseline="central">📦</text></svg>')}`; }}
                      />
                    </div>
                    <h3 style={{ color: prod.nombreColor ?? "white", height: "2.75rem", margin: "7px 0 4px", display: "flex", alignItems: "flex-start", justifyContent: "center", overflow: "hidden", lineHeight: 1.2, fontSize: `${Math.min(17, Number(prod.nombreTamano) || 17)}px` }}>
                      {prod.nombre}
                    </h3>
                    <p className="tienda-precio-producto" style={{ color: THEME.goldMain, minHeight: "1.65rem", margin: "0 0 4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem" }}>
                      {precioConDescuento(prod).toFixed(2)} €
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        if (disponibles > 0) {
                          intentarAnadirAlCarrito(prod, e.currentTarget.closest(".tienda-tarjeta-producto"));
                        }
                      }}
                      disabled={disponibles === 0}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 18,
                        fontSize: "0.76rem",
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
                        marginTop: "auto",
                        transition: "background 0.32s ease, border-color 0.32s ease, color 0.32s ease, transform 0.28s ease",
                      }}
                    >
                      {recienAnadidoBusq
                        ? "Añadido ✓"
                        : disponibles > 0
                          ? "Añadir al carrito"
                          : limiteCarritoBusq
                            ? "Sin existencias"
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
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 20,
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
            display: "flex",
            flexDirection: "column",
            height: "100%",
            boxSizing: "border-box",
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
              fontSize: `${Math.min(17, Number(p.nombreTamano) || 17)}px`,
              fontWeight: "bold",
              lineHeight: 1.2,
              textShadow: "0 1px 2px rgba(0,0,0,0.45)",
              fontStyle: p.nombreEstilo === "italic" ? "italic" : undefined,
              height: "2.75rem",
              margin: "4px 0",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              overflow: "hidden"
            }}>
              {p.nombre}
            </h4>
            {p.paraQueSirve && (
            <p style={{ color: "rgba(255,255,255,0.96)", fontSize: "0.98rem", margin: "8px 0", lineHeight: 1.45 }}>
              ✦ {p.paraQueSirve}
            </p>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 8 }}>
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