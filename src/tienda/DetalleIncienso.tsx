import BotonCerrar from "../components/BotonCerrar";
import { THEME } from "../config";
import type { Producto } from "../App";
import type { CategoriaEntrada, ImagenLightbox } from "./tiendaHelpers";
import type { SubcategoriaEntrada } from "../types";
import { precioConDescuento } from "./tiendaHelpers";
import { TiendaLightbox } from "./TiendaLightbox";

export interface DetalleInciensoProps {
  producto: Producto;
  categoriaDetalle?: CategoriaEntrada;
  subcategoriaDetalle?: SubcategoriaEntrada;
  disponibles: number;
  limiteCarrito: boolean;
  recienAnadido: boolean;
  imgSrc: string;
  onVolver: () => void;
  onAbrirLightbox: (src: string, alt: string) => void;
  onAnadirAlCarrito: (producto: Producto) => void;
  lightboxImagen: ImagenLightbox | null;
  onCerrarLightbox: () => void;
}

/** Ficha profesional específica para productos de la categoría inciensos. */
export function DetalleIncienso({
  producto,
  categoriaDetalle,
  subcategoriaDetalle,
  disponibles,
  limiteCarrito,
  recienAnadido,
  imgSrc,
  onVolver,
  onAbrirLightbox,
  onAnadirAlCarrito,
  lightboxImagen,
  onCerrarLightbox
}: DetalleInciensoProps) {
  const pd = producto;
  const fichaIncienso: [string, string][] = [
    ["Marca", pd.marca],
    ["Aroma", pd.aroma],
    ["Peso", pd.peso],
    ["Tipo de incienso", pd.tipoProducto],
    ["Origen", pd.origen],
    ["EAN", pd.ean],
    ["Duración aprox.", pd.duracionAproximada],
    ["Ingredientes", pd.ingredientes]
  ].filter((par): par is [string, string] => typeof par[1] === "string" && par[1].trim().length > 0) as [string, string][];

  const tieneDescripcion = typeof pd.descripcion === "string" && pd.descripcion.trim().length > 0;
  const tieneParaQueSirve = typeof pd.paraQueSirve === "string" && pd.paraQueSirve.trim().length > 0;
  const tieneComoUsar = typeof pd.comoUsar === "string" && pd.comoUsar.trim().length > 0;
  const tieneModoUso = typeof pd.modoUsoProveedor === "string" && pd.modoUsoProveedor.trim().length > 0;
  const tieneAdvertencias = typeof pd.advertencias === "string" && pd.advertencias.trim().length > 0;
  const tieneCaracteristicas = Array.isArray(pd.caracteristicas) && pd.caracteristicas.length > 0;

  return (
    <>
    <div className="tienda-vista tienda-vista--categoria-abierta tienda-page-layout maika-anchor" style={{ padding: "40px 20px" }}>
      <header className="tienda-vista__cabecera-categoria">
        <button
          type="button"
          onClick={onVolver}
          style={{ border: "none", background: "transparent", color: THEME.goldMain, cursor: "pointer", fontWeight: "bold", fontSize: 14 }}
        >
          ← Volver
        </button>
        <h2 className="tienda-vista__titulo-categoria" style={{ color: THEME.goldMain, fontSize: "2rem" }}>
          {(categoriaDetalle?.nombre ?? "Inciensos").charAt(0).toUpperCase() + (categoriaDetalle?.nombre ?? "Inciensos").slice(1)}
        </h2>
        <div className="tienda-vista__cabecera-categoria-cerrar">
          <BotonCerrar onClick={onVolver} ariaLabel="Volver a productos" title="Volver a productos" />
        </div>
      </header>

      {/* Contenedor principal: galería + info */}
      <div
        style={{
          width: "min(1100px, 100%)",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
          gap: 40,
          padding: 0
        }}
      >
        {/* === GALERÍA === */}
        <div style={{ position: "sticky", top: 20, alignSelf: "start" }}>
          <div
            style={{
              position: "relative",
              borderRadius: 16,
              overflow: "hidden",
              background: "#0a0a0a",
              border: `1px solid ${THEME.goldMain}`,
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)"
            }}
          >
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
              style={{ width: "100%", height: "auto", maxHeight: 680, objectFit: "contain", cursor: "zoom-in", display: "block" }}
              onError={(e) => { (e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="%231b1745"/><text x="300" y="300" font-size="100" text-anchor="middle" dominant-baseline="central">📦</text></svg>')}`; }}
            />
          </div>

        </div>

        {/* === ZONA PRINCIPAL DEL PRODUCTO === */}
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {categoriaDetalle?.nombre ?? "Inciensos"}
            {subcategoriaDetalle ? ` · ${subcategoriaDetalle.nombre}` : ""}
          </p>
          <h1
            style={{
              color: producto.nombreColor ?? "white",
              fontSize: "clamp(1.7rem, 3.5vw, 2.5rem)",
              lineHeight: 1.15,
              margin: "0 0 20px",
              fontStyle: producto.nombreEstilo === "italic" ? "italic" : undefined,
              fontWeight: 700
            }}
          >
            {producto.nombre}
          </h1>

          {/* Precio + IVA */}
          <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid rgba(255,215,0,0.15)` }}>
            <p className="tienda-precio-producto" style={{ color: THEME.goldMain, fontSize: "1.8rem", margin: 0, lineHeight: 1.1, fontWeight: 700 }}>
              {producto.descuentoPorcentaje != null && producto.descuentoPorcentaje > 0 && (
                <span style={{ textDecoration: "line-through", opacity: 0.5, marginRight: 12, fontSize: "1.1rem" }}>
                  {Number(producto.precio).toFixed(2)} €
                </span>
              )}
              {precioConDescuento(producto).toFixed(2)} €
            </p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem", margin: "4px 0 0", letterSpacing: "0.04em" }}>IVA incluido</p>
          </div>

          {/* Disponibilidad */}
          <p style={{
            color: disponibles > 0 ? THEME.goldMain : "#ff8a80",
            fontWeight: "bold",
            margin: "0 0 20px",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: disponibles > 0 ? THEME.goldMain : "#ff5252",
              display: "inline-block",
              flexShrink: 0
            }} />
            {disponibles > 0 ? `${disponibles} ${disponibles === 1 ? "unidad disponible" : "unidades disponibles"}` : limiteCarrito ? "No puedes añadir más" : "Producto agotado"}
          </p>

          {/* Botón añadir al carrito */}
          <button
            type="button"
            className={disponibles > 0 ? "btn-anadir-dorado" : undefined}
            disabled={disponibles === 0}
            onClick={() => { if (disponibles > 0) onAnadirAlCarrito(producto); }}
            style={{
              width: "100%",
              padding: "16px 24px",
              borderRadius: 12,
              border: `2px solid ${recienAnadido ? "rgba(0, 220, 140, 0.85)" : THEME.goldMain}`,
              background: recienAnadido ? "linear-gradient(135deg, rgba(0, 200, 120, 0.95), rgba(0, 150, 95, 0.98))" : disponibles > 0 ? "linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,180,0,0.08))" : "transparent",
              color: disponibles > 0 ? (recienAnadido ? "#fff" : THEME.goldMain) : "#666",
              cursor: disponibles > 0 ? "pointer" : "not-allowed",
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: "0.03em"
            }}
          >
            {recienAnadido ? "Añadido ✓" : disponibles > 0 ? "Añadir al carrito" : limiteCarrito ? "No puedes añadir más" : "Sin stock"}
          </button>

          {/* Descripción comercial */}
          {tieneDescripcion && (
            <div style={{ marginTop: 28 }}>
              <h3 style={{ color: THEME.goldMain, fontSize: 14, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                Descripción
              </h3>
              <p style={{ color: "rgba(255,255,255,0.88)", lineHeight: 1.75, margin: 0, fontSize: 14 }}>
                {producto.descripcion}
              </p>
            </div>
          )}

          {/* Para qué sirve */}
          {tieneParaQueSirve && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ color: THEME.goldMain, fontSize: 14, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                Para qué sirve
              </h3>
              <p style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.65, margin: 0, fontSize: 14 }}>
                {producto.paraQueSirve}
              </p>
            </div>
          )}

          {/* Cómo usar */}
          {tieneComoUsar && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ color: THEME.goldMain, fontSize: 14, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                Cómo usar
              </h3>
              <p style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.65, margin: 0, fontSize: 14 }}>
                {producto.comoUsar}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* === FICHA TÉCNICA === */}
      {fichaIncienso.length > 0 && (
        <div
          style={{
            width: "min(1100px, 100%)",
            margin: "40px auto 0",
            padding: "28px 32px",
            borderRadius: 16,
            border: `1px solid ${THEME.goldMain}`,
            background: THEME.bg
          }}
        >
          <h3 style={{ color: THEME.goldMain, fontSize: 16, margin: "0 0 20px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, textAlign: "center" }}>
            Ficha técnica
          </h3>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "14px 28px",
              margin: 0
            }}
          >
            {fichaIncienso.map(([label, value]) => (
              <div key={label} style={{ minWidth: 0, paddingBottom: 12, borderBottom: "1px solid rgba(255,215,0,0.08)" }}>
                <dt style={{ color: "rgba(255,215,0,0.6)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</dt>
                <dd style={{ margin: 0, color: "rgba(255,255,255,0.92)", fontSize: 14, overflowWrap: "break-word" }}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* === BLOQUES DE INFORMACIÓN ESPECÍFICA === */}
      <div style={{ width: "min(1100px, 100%)", margin: "32px auto 0" }}>
        {/* Características */}
        {tieneCaracteristicas && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ color: THEME.goldMain, fontSize: 15, margin: "0 0 14px", fontWeight: 700 }}>Características</h3>
            <ul style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.7, margin: 0, paddingLeft: 20, fontSize: 14, listStyle: "none" }}>
              {producto.caracteristicas!.map((c, i) => (
                <li key={`car-${i}`} style={{ marginBottom: 8, paddingLeft: 4, position: "relative" }}>
                  <span style={{ color: THEME.goldMain, position: "absolute", left: -16 }}>◆</span> {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Modo de uso */}
        {tieneModoUso && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ color: THEME.goldMain, fontSize: 15, margin: "0 0 10px", fontWeight: 700 }}>Modo de uso</h3>
            <p style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.7, margin: 0, fontSize: 14 }}>
              {producto.modoUsoProveedor}
            </p>
          </div>
        )}

        {/* Advertencias */}
        {tieneAdvertencias && (
          <div
            style={{
              marginBottom: 28,
              padding: "16px 20px",
              borderRadius: 12,
              border: "1px solid rgba(255,180,80,0.3)",
              background: "rgba(255,180,80,0.05)"
            }}
          >
            <h3 style={{ color: "#ffcc80", fontSize: 15, margin: "0 0 10px", fontWeight: 700 }}>Advertencias</h3>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.65, margin: 0, fontSize: 14 }}>
              {producto.advertencias}
            </p>
          </div>
        )}
      </div>
    </div>
    <TiendaLightbox imagen={lightboxImagen} onClose={onCerrarLightbox} ampliar />
    </>
  );
}
