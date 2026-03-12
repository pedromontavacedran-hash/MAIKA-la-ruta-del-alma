import { useState, useEffect } from "react";
import type { Producto } from "./App";

export type CategoriaEntrada = { id: string; nombre: string };

/** Props: velas, inciensos y figuras son la base real del catálogo (misma fuente que Inventario). */
interface Props {
  velas: Producto[];
  inciensos: Producto[];
  figuras: Producto[];
  categoriasCatalogo?: CategoriaEntrada[];
  agregarAlCarrito: (producto: Producto) => void;
  volver: () => void;
}

function getProductosForCategoria(
  cat: string,
  velas: Producto[],
  inciensos: Producto[],
  figuras: Producto[]
): Producto[] {
  const c = cat.toLowerCase();
  if (c === "velas") return velas;
  if (c === "inciensos") return inciensos;
  if (c === "figuras") return figuras;
  return [];
}

function getEmoji(cat: string): string {
  const c = cat.toLowerCase();
  if (c === "velas") return "🕯️";
  if (c === "inciensos") return "🌿";
  if (c === "figuras") return "🪷";
  return "📦";
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
  { id: "figuras", nombre: "figuras" }
];

export default function Tienda({ velas, inciensos, figuras, categoriasCatalogo = categoriasPorDefecto, agregarAlCarrito, volver }: Props) {
  const [mostrarCategoria, setMostrarCategoria] = useState<string | null>(null);
  const fondoServicios = "rgba(27, 23, 69, 0.85)";
  
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [velas, inciensos, figuras, categoriasCatalogo]);

  if (mostrarCategoria) {
    const productos = getProductosForCategoria(mostrarCategoria, velas, inciensos, figuras);
    const entrada = categoriasCatalogo.find((c) => c.id === mostrarCategoria);
    const nombreDisplay = entrada?.nombre ?? mostrarCategoria;
    const titulo = getEmoji(mostrarCategoria) + " " + nombreDisplay.charAt(0).toUpperCase() + nombreDisplay.slice(1);

    return (
      <div className="tienda-vista" style={{ padding: 40 }}>
        <button
          onClick={() => setMostrarCategoria(null)}
          style={{
            background: "#ffd700",
            color: "#1b1745",
            border: "none",
            borderRadius: "30px",
            padding: "8px 20px",
            cursor: "pointer",
            fontWeight: "bold",
            marginBottom: 30,
          }}
        >
          ← Volver a Categorías
        </button>

        <h2 style={{ textAlign: "center", color: "gold", fontSize: "2rem", marginBottom: 30 }}>
          {titulo}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          {productos.map((prod) => (
            <div
              key={`${prod.id}-${prod.stock}-${refreshKey}`}
              style={{
                border: "2px solid gold",
                padding: 20,
                borderRadius: 15,
                textAlign: "center",
                background: fondoServicios,
                opacity: prod.stock === 0 ? 0.6 : 1,
                position: "relative"
              }}
            >
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
                  style={{ maxWidth: "100%", maxHeight: 140, objectFit: "contain", borderRadius: 10, border: "1px solid rgba(255,215,0,0.5)" }}
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

              {prod.stock > 0 && prod.stock <= 3 && (
                <div style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  background: "#ffaa00",
                  color: "#1b1745",
                  padding: "4px 10px",
                  borderRadius: 15,
                  fontSize: "0.7rem",
                  fontWeight: "bold"
                }}>
                  ¡ÚLTIMAS {prod.stock}!
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
              <p style={{ color: "gold", fontSize: "1.2rem", margin: "10px 0" }}>
                {prod.precio.toFixed(2)} € <span style={{ fontSize: "0.75rem", opacity: 0.9 }}>(IVA incl.)</span>
              </p>

              <div style={{ marginBottom: 15, fontSize: "0.8rem", color: prod.stock > 5 ? "#4caf50" : prod.stock > 0 ? "#ffaa00" : "#ff4444" }}>
                {prod.stock > 0 ? (
                  <>
                    <span>📦 {prod.stock} disponibles</span>
                    <div style={{
                      width: "100%",
                      height: 4,
                      background: "rgba(255,255,255,0.2)",
                      borderRadius: 2,
                      marginTop: 5,
                      overflow: "hidden"
                    }}>
                      <div style={{
                        width: `${Math.min((prod.stock / 20) * 100, 100)}%`,
                        height: "100%",
                        background: prod.stock > 5 ? "#4caf50" : "#ffaa00",
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
  className={prod.stock > 0 ? "btn-anadir-amarillo" : undefined}
  onClick={() => {
    if (prod.stock > 0) {
      agregarAlCarrito(prod);
      setRefreshKey(prev => prev + 1);
    }
  }}
  disabled={prod.stock === 0}
  style={{
    background: prod.stock > 0 ? "#1565c0" : "#666",
    border: "2px solid gold",
    padding: "10px 25px",
    borderRadius: 25,
    cursor: prod.stock > 0 ? "pointer" : "not-allowed",
    fontWeight: "bold",
    color: prod.stock > 0 ? "gold" : "#ccc",
    width: "100%"
  }}
>
  {prod.stock > 0 ? "Añadir al carrito" : "Sin stock"}
</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="tienda-vista" style={{ padding: 40 }}>
      <button
        className="btn-volver-azul"
        onClick={volver}
        style={{
          backgroundImage: "linear-gradient(rgba(10, 7, 25, 0.45), rgba(10, 7, 25, 0.45)), url('/fondo%20estrellado.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          color: "gold",
          border: "2px solid gold",
          borderRadius: "30px",
          padding: "8px 20px",
          cursor: "pointer",
          fontWeight: "bold",
          marginBottom: 30,
        }}
      >
        ← Volver al Inicio
      </button>

      {/* MÁS VENDIDOS */}
      <div key={`mas-vendidos-${refreshKey}`} style={{  // 👈 NUEVO: Key para actualizar esta sección
        marginBottom: 44,
        background: fondoServicios,
        padding: "16px 12px",
        borderRadius: 22,
        border: "2px solid gold"
      }}>
        <h3 style={{
          textAlign: "center",
          color: "gold",
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
            border: "2px solid gold",
            position: "relative",
          }}>
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
              color: velas.find(v => v.id === 1)?.nombreColor ?? "#ffe082",
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
              <span style={{ color: "gold", fontWeight: "bold", fontSize: "0.85rem" }}>12.50€</span>
              <button
                type="button"
                className={`btn-mas-vendidos ${velas.find(v => v.id === 1)?.stock ? "btn-anadir-amarillo" : ""}`}
                onClick={() => {
                  const vela = velas.find(v => v.id === 1);
                  if (vela && vela.stock > 0) {
                    agregarAlCarrito(vela);
                    setRefreshKey(prev => prev + 1);  // 👈 NUEVO
                  }
                }}
                style={{
                  background: velas.find(v => v.id === 1)?.stock ? "gold" : "#666",
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
            border: "2px solid gold",
            position: "relative",
          }}>
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
              color: inciensos.find(i => i.id === 101)?.nombreColor ?? "#ffe082",
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
              <span style={{ color: "gold", fontWeight: "bold", fontSize: "0.85rem" }}>6.50€</span>
              <button
                type="button"
                className={`btn-mas-vendidos ${inciensos.find(i => i.id === 101)?.stock ? "btn-anadir-amarillo" : ""}`}
                onClick={() => {
                  const incienso = inciensos.find(i => i.id === 101);
                  if (incienso && incienso.stock > 0) {
                    agregarAlCarrito(incienso);
                    setRefreshKey(prev => prev + 1);  // 👈 NUEVO
                  }
                }}
                style={{
                  background: inciensos.find(i => i.id === 101)?.stock ? "gold" : "#666",
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
            border: "2px solid gold",
            position: "relative",
          }}>
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
              color: figuras.find(f => f.id === 201)?.nombreColor ?? "#ffe082",
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
              <span style={{ color: "gold", fontWeight: "bold", fontSize: "0.85rem" }}>35.00€</span>
              <button
                type="button"
                className={`btn-mas-vendidos ${figuras.find(f => f.id === 201)?.stock ? "btn-anadir-amarillo" : ""}`}
                onClick={() => {
                  const figura = figuras.find(f => f.id === 201);
                  if (figura && figura.stock > 0) {
                    agregarAlCarrito(figura);
                    setRefreshKey(prev => prev + 1);  // 👈 NUEVO
                  }
                }}
                style={{
                  background: figuras.find(f => f.id === 201)?.stock ? "gold" : "#666",
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
      <h2 style={{ textAlign: "center", color: "gold", fontSize: "2rem", marginBottom: 30 }}>
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
                border: "2px solid gold",
                textAlign: "center",
              }}
            >
              <div style={{ marginBottom: 12, minHeight: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img
                  src={`/${categoria.id}.jpg`}
                  alt={nombreDisplay}
                  style={{ maxWidth: "100%", maxHeight: 120, objectFit: "contain", borderRadius: 12, border: "1px solid rgba(255,215,0,0.5)" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <h2 style={{ color: "gold" }}>{getEmoji(categoria.id)} {nombreDisplay}</h2>
              <p style={{ color: "white" }}>{productosCat.length} productos</p>
              <div style={{
                background: "#ffd700",
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
  );
}