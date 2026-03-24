import { useApp } from "../context/AppContext";
import { useFavoritos } from "../hooks/useFavoritos";
import type { Producto } from "../types";
import BotonCerrar from "../components/BotonCerrar";
import { THEME } from "../config";

export default function FavoritosPage() {
  const { setPagina, velas, inciensos, figuras, agregarAlCarrito } = useApp();
  const { favoritos, toggleFavorito } = useFavoritos();

  // Todos los productos disponibles en el catálogo
  const todosLosProductos = [...velas, ...inciensos, ...figuras];

  // Filtrar los productos que están en favoritos
  const productosFavoritos = todosLosProductos.filter((prod) =>
    favoritos.includes(prod.id)
  );

  const fondoServicios = THEME.bg;

  /** Precio con descuento aplicado (igual que en Tienda e Inventario). */
  function precioConDescuento(p: Producto): number {
    const base = Number(p.precio) || 0;
    const d = p.descuentoPorcentaje != null ? Math.min(100, Math.max(0, Number(p.descuentoPorcentaje))) : 0;
    if (d <= 0) return base;
    return Math.round(base * (1 - d / 100) * 100) / 100;
  }

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

  return (
    <div className="tienda-vista" style={{ padding: 40, position: "relative" }}>
      <BotonCerrar onClick={() => setPagina("tienda")} ariaLabel="Volver a la tienda" title="Volver a la tienda" />

      <h2 style={{ textAlign: "center", color: THEME.goldMain, fontSize: "2rem", marginBottom: 30 }}>
        Mis Favoritos 💛
      </h2>

      {productosFavoritos.length === 0 ? (
        <div style={{
          background: THEME.bg,
          border: `2px solid ${THEME.goldMain}`,
          borderRadius: 20,
          padding: 40,
          textAlign: "center",
          maxWidth: 500,
          margin: "0 auto"
        }}>
          <h3 style={{ color: "white", fontSize: "1.3rem", marginBottom: 20 }}>
            No tienes productos favoritos todavía.
          </h3>
          <button
            onClick={() => setPagina("tienda")}
            style={{
              background: THEME.goldMain,
              color: "#1b1745",
              border: "none",
              borderRadius: "30px",
              padding: "12px 30px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "1.1rem"
            }}
          >
            Ir a la tienda
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          {productosFavoritos.map((prod) => (
            <div
              key={prod.id}
              style={{
                border: `2px solid ${THEME.goldMain}`,
                padding: 20,
                borderRadius: 15,
                textAlign: "center",
                background: fondoServicios,
                opacity: prod.stock === 0 ? 0.6 : 1,
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
                  opacity: 1,
                  transition: "opacity 0.2s, transform 0.2s",
                  transform: "scale(1.1)",
                  userSelect: "none",
                  WebkitTapHighlightColor: "transparent"
                }}
                title="Quitar de favoritos"
              >
                💛
              </div>

              <div style={{ marginBottom: 12, minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img
                  src={
                    prod.imagen && (prod.imagen.startsWith("data:") || prod.imagen.startsWith("http") || prod.imagen.startsWith("/"))
                      ? prod.imagen
                      : prod.imagen
                        ? `/${prod.imagen.replace(/^\//, "")}`
                        : nombreProductoToImagen(prod.nombre) || `/${prod.categoria}-${prod.id}.jpg`
                  }
                  alt={prod.nombre}
                  style={{ maxWidth: "100%", maxHeight: 140, objectFit: "contain", borderRadius: 10, border: "1px solid rgba(212,175,55,0.5)" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>

              {prod.stock === 0 && (
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

              <div style={{ marginBottom: 15, fontSize: "0.8rem", color: prod.stock > 5 ? "#4caf50" : prod.stock > 0 ? THEME.goldMain : "#ff4444" }}>
                {prod.stock > 0 ? (
                  <span>📦 {prod.stock} disponibles</span>
                ) : (
                  <span>❌ Sin stock</span>
                )}
              </div>

              <button
                type="button"
                className={prod.stock > 0 ? "btn-anadir-dorado" : undefined}
                onClick={() => {
                  if (prod.stock > 0) {
                    agregarAlCarrito(prod);
                  }
                }}
                disabled={prod.stock === 0}
                style={{
                  background: prod.stock > 0 ? "#1565c0" : "#666",
                  border: `2px solid ${THEME.goldMain}`,
                  padding: "10px 25px",
                  borderRadius: 25,
                  cursor: prod.stock > 0 ? "pointer" : "not-allowed",
                  fontWeight: "bold",
                  color: prod.stock > 0 ? THEME.goldMain : "#ccc",
                  width: "100%"
                }}
              >
                {prod.stock > 0 ? "Añadir al carrito" : "Sin stock"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
