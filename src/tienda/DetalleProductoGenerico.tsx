import BotonCerrar from "../components/BotonCerrar";
import { THEME } from "../config";
import type { Producto } from "../App";
import type { CategoriaEntrada, ImagenLightbox } from "./tiendaHelpers";
import type { SubcategoriaEntrada } from "../types";
import { precioConDescuento } from "./tiendaHelpers";
import { TiendaLightbox } from "./TiendaLightbox";

export interface DetalleProductoGenericoProps {
  producto: Producto;
  categoriaDetalle?: CategoriaEntrada;
  subcategoriaDetalle?: SubcategoriaEntrada;
  disponibles: number;
  limiteCarrito: boolean;
  recienAnadido: boolean;
  imgSrc: string;
  fichaTecnica: [string, string][];
  onVolver: () => void;
  onAbrirLightbox: (src: string, alt: string) => void;
  onAnadirAlCarrito: (producto: Producto) => void;
  lightboxImagen: ImagenLightbox | null;
  onCerrarLightbox: () => void;
}

/** Ficha genérica para productos de categorías que no son inciensos. */
export function DetalleProductoGenerico({
  producto,
  categoriaDetalle,
  subcategoriaDetalle,
  disponibles,
  limiteCarrito,
  recienAnadido,
  imgSrc,
  fichaTecnica,
  onVolver,
  onAbrirLightbox,
  onAnadirAlCarrito,
  lightboxImagen,
  onCerrarLightbox
}: DetalleProductoGenericoProps) {
  return (
    <>
    <div className="tienda-vista tienda-vista--categoria-abierta tienda-page-layout maika-anchor" style={{ padding: 40 }}>
      <header className="tienda-vista__cabecera-categoria">
        <button
          type="button"
          onClick={onVolver}
          style={{ border: "none", background: "transparent", color: THEME.goldMain, cursor: "pointer", fontWeight: "bold", fontSize: 14 }}
        >
          ← Volver
        </button>
        <h2 className="tienda-vista__titulo-categoria" style={{ color: THEME.goldMain, fontSize: "2rem" }}>
          Detalle del producto
        </h2>
        <div className="tienda-vista__cabecera-categoria-cerrar">
          <BotonCerrar onClick={onVolver} ariaLabel="Volver a productos" title="Volver a productos" />
        </div>
      </header>

      <article
        style={{
          width: "min(920px, 100%)",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
          gap: 32,
          padding: 24,
          border: `2px solid ${THEME.goldMain}`,
          borderRadius: 20,
          background: THEME.bg,
          boxSizing: "border-box"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320, position: "relative" }}>
          <img
            src={imgSrc}
            alt={producto.nombre}
            width={600}
            height={600}
            decoding="async"
            role="button"
            tabIndex={0}
            onClick={() => onAbrirLightbox(imgSrc, producto.nombre)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onAbrirLightbox(imgSrc, producto.nombre); } }}
            style={{ width: "100%", maxHeight: 480, objectFit: "contain", borderRadius: 16, background: "white", border: `1px solid ${THEME.goldMain}`, cursor: "zoom-in" }}
            onError={(e) => { (e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="%231b1745"/><text x="300" y="300" font-size="100" text-anchor="middle" dominant-baseline="central">📦</text></svg>')}`; }}
          />
          <span
            aria-hidden
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.55)",
              color: THEME.goldMain,
              fontSize: 20,
              pointerEvents: "none",
              border: `1px solid ${THEME.goldMain}`
            }}
          >
            🔍
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, margin: "0 0 8px" }}>
            {categoriaDetalle?.nombre ?? producto.categoria}
            {subcategoriaDetalle ? ` · ${subcategoriaDetalle.nombre}` : ""}
          </p>
          <h1
            style={{
              color: producto.nombreColor ?? "white",
              fontSize: "clamp(1.6rem, 4vw, 2.35rem)",
              lineHeight: 1.15,
              margin: "0 0 16px",
              fontStyle: producto.nombreEstilo === "italic" ? "italic" : undefined
            }}
          >
            {producto.nombre}
          </h1>
          <p className="tienda-precio-producto" style={{ color: THEME.goldMain, fontSize: "1.55rem", margin: "0 0 4px", lineHeight: 1.1 }}>
            {producto.descuentoPorcentaje != null && producto.descuentoPorcentaje > 0 && (
              <span style={{ textDecoration: "line-through", opacity: 0.65, marginRight: 10, fontSize: "1rem" }}>
                {Number(producto.precio).toFixed(2)} €
              </span>
            )}
            {precioConDescuento(producto).toFixed(2)} €
          </p>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.7rem", margin: "0 0 18px", letterSpacing: "0.04em" }}>IVA incluido</p>
          {producto.descripcion && (
            <p style={{ color: "rgba(255,255,255,0.88)", lineHeight: 1.65, margin: "0 0 16px" }}>
              {producto.descripcion}
            </p>
          )}
          {producto.paraQueSirve && (
            <p style={{ color: "rgba(255,255,255,0.9)", lineHeight: 1.5, margin: "0 0 10px" }}>
              <strong style={{ color: THEME.goldMain }}>Para qué sirve:</strong> {producto.paraQueSirve}
            </p>
          )}
          {producto.comoUsar && (
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.5, margin: "0 0 18px" }}>
              <strong style={{ color: THEME.goldMain }}>Cómo usar:</strong> {producto.comoUsar}
            </p>
          )}
          {fichaTecnica.length > 0 && (
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "6px 18px",
                margin: "0 0 16px",
                fontSize: 13
              }}
            >
              {fichaTecnica.map(([label, value]) => (
                <div key={label} style={{ minWidth: 0 }}>
                  <dt style={{ color: THEME.goldMain, fontWeight: 600 }}>{label}</dt>
                  <dd style={{ margin: 0, color: "rgba(255,255,255,0.85)", overflowWrap: "break-word" }}>{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {producto.descripcionProveedor && (
            <p style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.55, margin: "0 0 12px", fontSize: 13 }}>
              <strong style={{ color: THEME.goldMain }}>Según el proveedor:</strong> {producto.descripcionProveedor}
            </p>
          )}
          {Array.isArray(producto.caracteristicas) && producto.caracteristicas.length > 0 && (
            <ul style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.5, margin: "0 0 12px", paddingLeft: 18, fontSize: 13 }}>
              {producto.caracteristicas.map((c, i) => (
                <li key={`${i}-${c.slice(0, 24)}`}>{c}</li>
              ))}
            </ul>
          )}
          {producto.modoUsoProveedor && (
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.5, margin: "0 0 10px", fontSize: 13 }}>
              <strong style={{ color: THEME.goldMain }}>Modo de uso (proveedor):</strong> {producto.modoUsoProveedor}
            </p>
          )}
          {producto.advertencias && (
            <p style={{ color: "#ffcc80", lineHeight: 1.5, margin: "0 0 14px", fontSize: 13 }}>
              <strong>Advertencias:</strong> {producto.advertencias}
            </p>
          )}
          <p style={{ color: disponibles > 0 ? THEME.goldMain : "#ff8a80", fontWeight: "bold", margin: "0 0 14px" }}>
            {disponibles > 0 ? `${disponibles} ${disponibles === 1 ? "unidad disponible" : "unidades disponibles"}` : limiteCarrito ? "No puedes añadir más" : "Producto agotado"}
          </p>
          <button
            type="button"
            className={disponibles > 0 ? "btn-anadir-dorado" : undefined}
            disabled={disponibles === 0}
            onClick={() => {
              if (disponibles > 0) onAnadirAlCarrito(producto);
            }}
            style={{
              width: "100%",
              padding: "13px 24px",
              borderRadius: 25,
              border: `2px solid ${recienAnadido ? "rgba(0, 220, 140, 0.85)" : THEME.goldMain}`,
              background: recienAnadido ? "linear-gradient(135deg, rgba(0, 200, 120, 0.95), rgba(0, 150, 95, 0.98))" : disponibles > 0 ? "#1565c0" : "#666",
              color: disponibles > 0 ? (recienAnadido ? "#fff" : THEME.goldMain) : "#ccc",
              cursor: disponibles > 0 ? "pointer" : "not-allowed",
              fontWeight: "bold"
            }}
          >
            {recienAnadido ? "Añadido ✓" : disponibles > 0 ? "Añadir al carrito" : limiteCarrito ? "No puedes añadir más" : "Sin stock"}
          </button>
        </div>
      </article>
    </div>
    <TiendaLightbox imagen={lightboxImagen} onClose={onCerrarLightbox} />
    </>
  );
}
