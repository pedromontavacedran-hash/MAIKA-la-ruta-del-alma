import { useState, useEffect } from "react";
import type { Producto } from "./App";
import { INTENCIONES_OPCIONES } from "./types";
import { useFavoritos } from "./hooks/useFavoritos";
import BotonCerrar from "./components/BotonCerrar";
import { THEME } from "./config";

export type CategoriaEntrada = { id: string; nombre: string };

/** Item mínimo del carrito para calcular disponibles = stock - en carrito */
type ItemCarritoRef = { id: number; cantidad: number };

/** Props: velas, inciensos, figuras y kits son la base real del catálogo (misma fuente que Inventario). */
interface Props {
  velas: Producto[];
  inciensos: Producto[];
  figuras: Producto[];
  kits?: Producto[];
  categoriasCatalogo?: CategoriaEntrada[];
  cart?: ItemCarritoRef[];
  agregarAlCarrito: (producto: Producto) => void;
  volver: () => void;
  /** Si se pasa, al montar se muestra esta categoría (ej. desde accesos rápidos en Inicio). */
  categoriaInicial?: string | null;
  /** Se llama una vez después de aplicar categoriaInicial para limpiar el estado en el padre. */
  onCategoriaInicialAplicada?: () => void;
  /** Término de búsqueda desde el menú principal; se muestran resultados filtrados. */
  busquedaInicial?: string;
  /** Limpiar el término de búsqueda en el padre. */
  onBusquedaInicialAplicada?: () => void;
}

function getProductosForCategoria(
  cat: string,
  velas: Producto[],
  inciensos: Producto[],
  figuras: Producto[],
  kits: Producto[] = []
): Producto[] {
  const c = cat.toLowerCase();
  if (c === "velas") return velas;
  if (c === "inciensos") return inciensos;
  if (c === "figuras") return figuras;
  if (c === "kits") return kits;
  return [];
}

function getEmoji(cat: string): string {
  const c = cat.toLowerCase();
  if (c === "velas") return "🕯️";
  if (c === "inciensos") return "🌿";
  if (c === "figuras") return "🪷";
  if (c === "kits") return "📦";
  return "📦";
}

/** Precio de venta con descuento aplicado (igual que en Inventario y useCatalogo). */
function precioConDescuento(p: Producto): number {
  const base = Number(p.precio) || 0;
  const d = p.descuentoPorcentaje != null ? Math.min(100, Math.max(0, Number(p.descuentoPorcentaje))) : 0;
  if (d <= 0) return base;
  return Math.round(base * (1 - d / 100) * 100) / 100;
}

/** Convierte el nombre del producto en nombre de archivo: "Vela Blanca" → "vela-blanca.jpg" */
function nombreProductoToImagen(nombre: string): string {
  const slug = nombre
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\u0300-\u036f/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return slug ? `/${slug}.jpg` : "";
}

const categoriasPorDefecto: CategoriaEntrada[] = [
  { id: "velas", nombre: "velas" },
  { id: "inciensos", nombre: "inciensos" },
  { id: "figuras", nombre: "figuras" },
  { id: "kits", nombre: "kits" }
];

export default function Tienda({ velas, inciensos, figuras, kits = [], categoriasCatalogo = categoriasPorDefecto, cart = [], agregarAlCarrito, volver, categoriaInicial, onCategoriaInicialAplicada, busquedaInicial, onBusquedaInicialAplicada }: Props) {
  const [mostrarCategoria, setMostrarCategoria] = useState<string | null>(null);
  const [filtroIntencion, setFiltroIntencion] = useState<string>("");
  const terminoBusqueda = (busquedaInicial ?? "").trim();
  const todosProductos = [...velas, ...inciensos, ...figuras, ...kits];
  const productosBusqueda = terminoBusqueda
    ? todosProductos.filter((p) => {
        const texto = `${p.nombre} ${p.descripcion ?? ""}`.toLowerCase();
        return texto.includes(terminoBusqueda.toLowerCase());
      })
    : [];
  const fondoServicios = THEME.bg;
  const [lightboxImagen, setLightboxImagen] = useState<{ src: string; alt: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { isFavorito, toggleFavorito } = useFavoritos();

  const getProductImageSrc = (prod: Producto): string =>
    prod.imagen && (prod.imagen.startsWith("data:") || prod.imagen.startsWith("http") || prod.imagen.startsWith("/"))
      ? prod.imagen
      : prod.imagen
        ? `/${prod.imagen.replace(/^\//, "")}`
        : nombreProductoToImagen(prod.nombre) || `/${prod.categoria}-${prod.id}.jpg`;

  const cerrarLightbox = () => setLightboxImagen(null);

  const Lightbox = () =>
    lightboxImagen ? (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Imagen ampliada"
        onClick={cerrarLightbox}
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
          onClick={(e) => { e?.stopPropagation(); cerrarLightbox(); }}
          ariaLabel="Cerrar"
          title="Cerrar"
          style={{ top: 16, right: 16, zIndex: 10000 }}
        />
        <img
          src={lightboxImagen.src}
          alt={lightboxImagen.alt}
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: "100%", maxHeight: "85vh", objectFit: "contain", borderRadius: 12 }}
        />
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem", marginTop: 12 }}>
          Clic fuera o tecla Escape para cerrar
        </p>
      </div>
    ) : null;

  useEffect(() => {
    if (categoriaInicial) {
      setMostrarCategoria(categoriaInicial);
      onCategoriaInicialAplicada?.();
    }
  }, [categoriaInicial, onCategoriaInicialAplicada]);

  /** Cantidad de este producto en el carrito (para mostrar disponibles = stock - en carrito). */
  const cantidadEnCarrito = (idProducto: number) =>
    cart.find((it) => Number(it.id) === idProducto)?.cantidad ?? 0;

  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [velas, inciensos, figuras, categoriasCatalogo, cart]);

  useEffect(() => {
    if (!lightboxImagen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxImagen(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxImagen]);

  if (mostrarCategoria) {
    const productosCat = getProductosForCategoria(mostrarCategoria, velas, inciensos, figuras, kits);
    const productos = filtroIntencion
      ? productosCat.filter((p) => p.intencion === filtroIntencion)
      : productosCat;
    const entrada = categoriasCatalogo.find((c) => c.id === mostrarCategoria);
    const nombreDisplay = entrada?.nombre ?? mostrarCategoria;
    const titulo = getEmoji(mostrarCategoria) + " " + nombreDisplay.charAt(0).toUpperCase() + nombreDisplay.slice(1);

    return (
      <>
      <div className="tienda-vista" style={{ padding: 40, position: "relative" }}>
        <BotonCerrar onClick={() => { setMostrarCategoria(null); setFiltroIntencion(""); }} ariaLabel="Volver a categorías" title="Volver a categorías" />

        <h2 style={{ textAlign: "center", color: THEME.goldMain, fontSize: "2rem", marginBottom: 30 }}>
          {titulo}
        </h2>

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
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          {productos.map((prod) => {
            const enCarrito = cantidadEnCarrito(Number(prod.id));
            const disponibles = Math.max(0, Number(prod.stock) - enCarrito);
            return (
            <div
              key={`${prod.id}-${prod.stock}-${enCarrito}-${refreshKey}`}
              style={{
                border: `2px solid ${THEME.goldMain}`,
                padding: 20,
                borderRadius: 15,
                textAlign: "center",
                background: fondoServicios,
                opacity: disponibles === 0 ? 0.6 : 1,
                position: "relative"
              }}
            >
              {/* Botón Favorito */}
              <div
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorito(prod.id);
                }}
                style={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  fontSize: "1.6rem",
                  cursor: "pointer",
                  zIndex: 2,
                  opacity: isFavorito(prod.id) ? 1 : 0.5,
                  transition: "opacity 0.2s, transform 0.2s",
                  transform: isFavorito(prod.id) ? "scale(1.1)" : "scale(1)",
                  userSelect: "none",
                  WebkitTapHighlightColor: "transparent"
                }}
                title={isFavorito(prod.id) ? "Quitar de favoritos" : "Añadir a favoritos"}
              >
                {isFavorito(prod.id) ? "💛" : "🤍"}
              </div>

              <div style={{ marginBottom: 12, minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img
                  src={getProductImageSrc(prod)}
                  alt={prod.nombre}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); setLightboxImagen({ src: getProductImageSrc(prod), alt: prod.nombre }); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLightboxImagen({ src: getProductImageSrc(prod), alt: prod.nombre }); } }}
                  style={{ maxWidth: "100%", maxHeight: 140, objectFit: "contain", borderRadius: 10, border: "1px solid rgba(212,175,55,0.5)", cursor: "pointer" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              {disponibles === 0 && (
                <div style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  background: "#ff4444",
                  color: "white",
                  padding: "4px 10px",
                  borderRadius: 15,
                  fontSize: "0.7rem",
                  fontWeight: "bold"
                }}>
                  AGOTADO
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
              <p style={{ color: THEME.goldMain, fontSize: "1.2rem", margin: "10px 0" }}>
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

              <div style={{ marginBottom: 15, fontSize: "0.8rem", color: disponibles > 5 ? "#4caf50" : disponibles > 0 ? THEME.goldMain : "#ff4444" }}>
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
                  <span>❌ Sin stock</span>
                )}
              </div>

       <button
  type="button"
  className={disponibles > 0 ? "btn-anadir-dorado" : undefined}
  onClick={() => {
    if (disponibles > 0) {
      agregarAlCarrito(prod);
      setRefreshKey(prev => prev + 1);
    }
  }}
  disabled={disponibles === 0}
  style={{
    background: disponibles > 0 ? "#1565c0" : "#666",
    border: `2px solid ${THEME.goldMain}`,
    padding: "10px 25px",
    borderRadius: 25,
    cursor: disponibles > 0 ? "pointer" : "not-allowed",
    fontWeight: "bold",
    color: disponibles > 0 ? THEME.goldMain : "#ccc",
    width: "100%"
  }}
>
  {disponibles > 0 ? "Añadir al carrito" : "Sin stock"}
</button>
            </div>
            );
          })}
        </div>
      </div>
      <Lightbox />
    </>
    );
  }

  return (
    <>
    <div className="tienda-vista" style={{ padding: 40, position: "relative" }}>
      <BotonCerrar onClick={volver} ariaLabel="Volver al inicio" title="Volver al inicio" />

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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
              {productosBusqueda.map((prod) => {
                const enCarrito = cantidadEnCarrito(Number(prod.id));
                const disponibles = Math.max(0, Number(prod.stock) - enCarrito);
                return (
                  <div
                    key={`busqueda-${prod.categoria}-${prod.id}`}
                    style={{ border: `2px solid ${THEME.goldMain}`, padding: 20, borderRadius: 15, textAlign: "center", background: fondoServicios, opacity: disponibles === 0 ? 0.6 : 1, position: "relative" }}
                  >
                    <div
                      role="button"
                      onClick={(e) => { e.stopPropagation(); toggleFavorito(prod.id); }}
                      style={{ position: "absolute", top: 10, left: 10, fontSize: "1.6rem", cursor: "pointer", zIndex: 2 }}
                      title={isFavorito(prod.id) ? "Quitar de favoritos" : "Añadir a favoritos"}
                    >
                      {isFavorito(prod.id) ? "💛" : "🤍"}
                    </div>
                    <div style={{ marginBottom: 12, minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img src={getProductImageSrc(prod)} alt={prod.nombre} style={{ maxWidth: "100%", maxHeight: 140, objectFit: "contain", borderRadius: 10, border: "1px solid rgba(212,175,55,0.5)" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <h3 style={{ color: prod.nombreColor ?? "white" }}>{prod.nombre}</h3>
                    <p style={{ color: THEME.goldMain, fontSize: "1.2rem", margin: "10px 0" }}>{precioConDescuento(prod).toFixed(2)} €</p>
                    <button
                      type="button"
                      onClick={() => { if (disponibles > 0) { agregarAlCarrito(prod); setRefreshKey((k) => k + 1); } }}
                      disabled={disponibles === 0}
                      style={{ padding: "10px 25px", borderRadius: 25, border: `2px solid ${THEME.goldMain}`, background: disponibles > 0 ? THEME.goldMain : "#666", color: disponibles > 0 ? "#1b1745" : "#ccc", cursor: disponibles > 0 ? "pointer" : "not-allowed", fontWeight: "bold", width: "100%" }}
                    >
                      {disponibles > 0 ? "Añadir al carrito" : "Sin stock"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MÁS VENDIDOS */}
      <div key={`mas-vendidos-${refreshKey}`} style={{  // 👈 NUEVO: Key para actualizar esta sección
        marginBottom: 44,
        background: fondoServicios,
        padding: "16px 12px",
        borderRadius: 22,
        border: `2px solid ${THEME.goldMain}`
      }}>
        <h3 style={{
          textAlign: "center",
          color: THEME.goldMain,
          fontSize: "1.08rem",
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8
        }}>
          <span style={{ fontSize: "1.2rem" }}>🔥</span>
          LOS MÁS VENDIDOS
          <span style={{ fontSize: "1.2rem" }}>✨</span>
        </h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 10,
        }}>
          {/* Vela Blanca */}
          <div style={{
            background: fondoServicios,
            borderRadius: 16,
            padding: "10px",
            border: `2px solid ${THEME.goldMain}`,
            position: "relative",
          }}>
            <div
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorito(1);
              }}
              style={{
                position: "absolute",
                top: 5,
                left: 5,
                fontSize: "1.4rem",
                cursor: "pointer",
                zIndex: 2,
                opacity: isFavorito(1) ? 1 : 0.5,
                transition: "opacity 0.2s, transform 0.2s",
                transform: isFavorito(1) ? "scale(1.1)" : "scale(1)",
                userSelect: "none",
                WebkitTapHighlightColor: "transparent"
              }}
              title={isFavorito(1) ? "Quitar de favoritos" : "Añadir a favoritos"}
            >
              {isFavorito(1) ? "💛" : "🤍"}
            </div>
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
              🔥 234 vendidos
            </div>
            <div style={{ fontSize: "1.7rem", textAlign: "center", marginBottom: 6 }}>🕯️</div>
            <h4 style={{
              color: velas.find(v => v.id === 1)?.nombreColor ?? THEME.goldMain,
              textAlign: "center",
              fontSize: velas.find(v => v.id === 1)?.nombreTamano ? `${velas.find(v => v.id === 1)!.nombreTamano}px` : "1.06rem",
              fontWeight: "bold",
              lineHeight: 1.2,
              textShadow: "0 1px 2px rgba(0,0,0,0.45)",
              fontStyle: velas.find(v => v.id === 1)?.nombreEstilo === "italic" ? "italic" : undefined
            }}>
              {velas.find(v => v.id === 1)?.nombre ?? "Vela Blanca"}
            </h4>
            <p style={{ color: "rgba(255,255,255,0.96)", fontSize: "0.98rem", margin: "8px 0", lineHeight: 1.45 }}>
              La favorita para limpiezas
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: "0.85rem" }}>12.50€</span>
              <button
                type="button"
                className={`btn-mas-vendidos ${velas.find(v => v.id === 1)?.stock ? "btn-anadir-dorado" : ""}`}
                onClick={() => {
                  const vela = velas.find(v => v.id === 1);
                  if (vela && vela.stock > 0) {
                    agregarAlCarrito(vela);
                    setRefreshKey(prev => prev + 1);  // 👈 NUEVO
                  }
                }}
                style={{
                  background: velas.find(v => v.id === 1)?.stock ? THEME.goldMain : "#666",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: 20,
                  cursor: velas.find(v => v.id === 1)?.stock ? "pointer" : "not-allowed",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  color: velas.find(v => v.id === 1)?.stock ? "#1b1745" : "#ccc"
                }}
              >
                {velas.find(v => v.id === 1)?.stock ? "Añadir" : "Agotado"}
              </button>
            </div>
          </div>

          {/* Incienso Sándalo */}
          <div style={{
            background: fondoServicios,
            borderRadius: 16,
            padding: "10px",
            border: `2px solid ${THEME.goldMain}`,
            position: "relative",
          }}>
            <div
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorito(101);
              }}
              style={{
                position: "absolute",
                top: 5,
                left: 5,
                fontSize: "1.4rem",
                cursor: "pointer",
                zIndex: 2,
                opacity: isFavorito(101) ? 1 : 0.5,
                transition: "opacity 0.2s, transform 0.2s",
                transform: isFavorito(101) ? "scale(1.1)" : "scale(1)",
                userSelect: "none",
                WebkitTapHighlightColor: "transparent"
              }}
              title={isFavorito(101) ? "Quitar de favoritos" : "Añadir a favoritos"}
            >
              {isFavorito(101) ? "💛" : "🤍"}
            </div>
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
              🔥 189 vendidos
            </div>
            <div style={{ fontSize: "1.7rem", textAlign: "center", marginBottom: 6 }}>🌿</div>
            <h4 style={{
              color: inciensos.find(i => i.id === 101)?.nombreColor ?? THEME.goldMain,
              textAlign: "center",
              fontSize: inciensos.find(i => i.id === 101)?.nombreTamano ? `${inciensos.find(i => i.id === 101)!.nombreTamano}px` : "1.06rem",
              fontWeight: "bold",
              lineHeight: 1.2,
              textShadow: "0 1px 2px rgba(0,0,0,0.45)",
              fontStyle: inciensos.find(i => i.id === 101)?.nombreEstilo === "italic" ? "italic" : undefined
            }}>
              {inciensos.find(i => i.id === 101)?.nombre ?? "Incienso Sándalo"}
            </h4>
            <p style={{ color: "rgba(255,255,255,0.96)", fontSize: "0.98rem", margin: "8px 0", lineHeight: 1.45 }}>
              Conexión espiritual
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: "0.85rem" }}>6.50€</span>
              <button
                type="button"
                className={`btn-mas-vendidos ${inciensos.find(i => i.id === 101)?.stock ? "btn-anadir-dorado" : ""}`}
                onClick={() => {
                  const incienso = inciensos.find(i => i.id === 101);
                  if (incienso && incienso.stock > 0) {
                    agregarAlCarrito(incienso);
                    setRefreshKey(prev => prev + 1);  // 👈 NUEVO
                  }
                }}
                style={{
                  background: inciensos.find(i => i.id === 101)?.stock ? THEME.goldMain : "#666",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: 20,
                  cursor: inciensos.find(i => i.id === 101)?.stock ? "pointer" : "not-allowed",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  color: inciensos.find(i => i.id === 101)?.stock ? "#1b1745" : "#ccc"
                }}
              >
                {inciensos.find(i => i.id === 101)?.stock ? "Añadir" : "Agotado"}
              </button>
            </div>
          </div>

          {/* Buda Dorado */}
          <div style={{
            background: fondoServicios,
            borderRadius: 16,
            padding: "10px",
            border: `2px solid ${THEME.goldMain}`,
            position: "relative",
          }}>
            <div
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorito(201);
              }}
              style={{
                position: "absolute",
                top: 5,
                left: 5,
                fontSize: "1.4rem",
                cursor: "pointer",
                zIndex: 2,
                opacity: isFavorito(201) ? 1 : 0.5,
                transition: "opacity 0.2s, transform 0.2s",
                transform: isFavorito(201) ? "scale(1.1)" : "scale(1)",
                userSelect: "none",
                WebkitTapHighlightColor: "transparent"
              }}
              title={isFavorito(201) ? "Quitar de favoritos" : "Añadir a favoritos"}
            >
              {isFavorito(201) ? "💛" : "🤍"}
            </div>
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
              🔥 156 vendidos
            </div>
            <div style={{ fontSize: "1.7rem", textAlign: "center", marginBottom: 6 }}>🪷</div>
            <h4 style={{
              color: figuras.find(f => f.id === 201)?.nombreColor ?? THEME.goldMain,
              textAlign: "center",
              fontSize: figuras.find(f => f.id === 201)?.nombreTamano ? `${figuras.find(f => f.id === 201)!.nombreTamano}px` : "1.06rem",
              fontWeight: "bold",
              lineHeight: 1.2,
              textShadow: "0 1px 2px rgba(0,0,0,0.45)",
              fontStyle: figuras.find(f => f.id === 201)?.nombreEstilo === "italic" ? "italic" : undefined
            }}>
              {figuras.find(f => f.id === 201)?.nombre ?? "Buda Dorado"}
            </h4>
            <p style={{ color: "rgba(255,255,255,0.96)", fontSize: "0.98rem", margin: "8px 0", lineHeight: 1.45 }}>
              Prosperidad
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: "0.85rem" }}>35.00€</span>
              <button
                type="button"
                className={`btn-mas-vendidos ${figuras.find(f => f.id === 201)?.stock ? "btn-anadir-dorado" : ""}`}
                onClick={() => {
                  const figura = figuras.find(f => f.id === 201);
                  if (figura && figura.stock > 0) {
                    agregarAlCarrito(figura);
                    setRefreshKey(prev => prev + 1);  // 👈 NUEVO
                  }
                }}
                style={{
                  background: figuras.find(f => f.id === 201)?.stock ? THEME.goldMain : "#666",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: 20,
                  cursor: figuras.find(f => f.id === 201)?.stock ? "pointer" : "not-allowed",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  color: figuras.find(f => f.id === 201)?.stock ? "#1b1745" : "#ccc"
                }}
              >
                {figuras.find(f => f.id === 201)?.stock ? "Añadir" : "Agotado"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORÍAS (sincronizadas con Editar Categorías) */}
      <h2 style={{ textAlign: "center", color: THEME.goldMain, fontSize: "2rem", marginBottom: 30 }}>
        Categorías
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 30,
        }}
      >
        {categoriasCatalogo.map((categoria) => {
          const productosCat = getProductosForCategoria(categoria.id, velas, inciensos, figuras);
          const nombreDisplay = categoria.nombre.charAt(0).toUpperCase() + categoria.nombre.slice(1);
          return (
            <div
              key={categoria.id}
              onClick={() => setMostrarCategoria(categoria.id)}
              style={{
                cursor: "pointer",
                background: fondoServicios,
                borderRadius: 20,
                padding: 30,
                border: `2px solid ${THEME.goldMain}`,
                textAlign: "center",
              }}
            >
              <div style={{ marginBottom: 12, minHeight: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img
                  src={`/${categoria.id}.jpg`}
                  alt={nombreDisplay}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); setLightboxImagen({ src: `/${categoria.id}.jpg`, alt: nombreDisplay }); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLightboxImagen({ src: `/${categoria.id}.jpg`, alt: nombreDisplay }); } }}
                  style={{ maxWidth: "100%", maxHeight: 120, objectFit: "contain", borderRadius: 12, border: "1px solid rgba(212,175,55,0.5)", cursor: "pointer" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <h2 style={{ color: THEME.goldMain }}>{getEmoji(categoria.id)} {nombreDisplay}</h2>
              <p style={{ color: "white" }}>{productosCat.length} productos</p>
              <div style={{
                background: THEME.goldMain,
                color: "#1b1745",
                padding: "8px 20px",
                borderRadius: 20,
                fontWeight: "bold",
                display: "inline-block",
                marginTop: 10
              }}>
                Ver todas →
              </div>
            </div>
          );
        })}
      </div>
    </div>
    <Lightbox />
  </>
  );
}