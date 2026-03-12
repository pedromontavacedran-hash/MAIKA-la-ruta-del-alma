import { useState, useEffect } from "react";
import type { Producto } from "./App";

interface Props {
  velas: Producto[];
  inciensos: Producto[];
  figuras: Producto[];
  agregarAlCarrito: (producto: Producto) => void;
  volver: () => void;
}

export default function Tienda({ velas, inciensos, figuras, agregarAlCarrito, volver }: Props) {
  const [mostrarCategoria, setMostrarCategoria] = useState<string | null>(null);
  
  // 👇 NUEVO: Para forzar actualizaciones
  const [refreshKey, setRefreshKey] = useState(0);
  
  // 👇 NUEVO: Se activa cuando cambian los productos
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
    console.log("🔄 Productos actualizados - refreshKey:", refreshKey + 1);
  }, [velas, inciensos, figuras]);

  if (mostrarCategoria) {
    let productos: Producto[] = [];
    let titulo = "";

    if (mostrarCategoria === "velas") {
      productos = velas;
      titulo = "🕯️ Velas";
    } else if (mostrarCategoria === "inciensos") {
      productos = inciensos;
      titulo = "🌿 Inciensos";
    } else if (mostrarCategoria === "figuras") {
      productos = figuras;
      titulo = "🪷 Figuras";
    }

    return (
      <div style={{ padding: 40 }}>
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
              key={`${prod.id}-${prod.stock}-${refreshKey}`}  // 👈 CAMBIADO: Incluye stock y refreshKey
              style={{
                border: "2px solid gold",
                padding: 20,
                borderRadius: 15,
                textAlign: "center",
                background: "#2b2560",
                opacity: prod.stock === 0 ? 0.6 : 1,
                position: "relative"
              }}
            >
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

              <h3 style={{ color: "white" }}>{prod.nombre}</h3>
              <p style={{ color: "gold", fontSize: "1.2rem", margin: "10px 0" }}>
                {prod.precio.toFixed(2)} €
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
                onClick={() => {
                  if (prod.stock > 0) {
                    agregarAlCarrito(prod);
                    setRefreshKey(prev => prev + 1);  // 👈 NUEVO: Forzar actualización después de comprar
                  }
                }}
                disabled={prod.stock === 0}
                style={{
                  background: prod.stock > 0 ? "gold" : "#666",
                  border: "none",
                  padding: "10px 25px",
                  borderRadius: 25,
                  cursor: prod.stock > 0 ? "pointer" : "not-allowed",
                  fontWeight: "bold",
                  color: prod.stock > 0 ? "#1b1745" : "#ccc",
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
    <div style={{ padding: 40 }}>
      <button
        onClick={volver}
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
        ← Volver al Inicio
      </button>

      {/* MÁS VENDIDOS */}
      <div key={`mas-vendidos-${refreshKey}`} style={{  // 👈 NUEVO: Key para actualizar esta sección
        marginBottom: 60,
        background: "linear-gradient(135deg, #1b1745 0%, #2b2560 100%)",
        padding: "30px 20px",
        borderRadius: 30,
        border: "2px solid gold"
      }}>
        <h3 style={{
          textAlign: "center",
          color: "gold",
          fontSize: "1.8rem",
          marginBottom: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10
        }}>
          <span style={{ fontSize: "2rem" }}>🔥</span>
          LOS MÁS VENDIDOS
          <span style={{ fontSize: "2rem" }}>✨</span>
        </h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 25,
        }}>
          {/* Vela Blanca */}
          <div style={{
            background: "#2b2560",
            borderRadius: 20,
            padding: "20px",
            border: "2px solid gold",
            position: "relative",
          }}>
            <div style={{
              position: "absolute",
              top: -10,
              right: -10,
              background: "#ff4444",
              color: "white",
              padding: "5px 12px",
              borderRadius: 20,
              fontWeight: "bold",
              fontSize: "0.8rem",
            }}>
              🔥 234 vendidos
            </div>
            <div style={{ fontSize: "3rem", textAlign: "center", marginBottom: 10 }}>🕯️</div>
            <h4 style={{ color: "gold", textAlign: "center" }}>Vela Blanca</h4>
            <p style={{ color: "white", fontSize: "0.85rem", margin: "10px 0" }}>
              La favorita para limpiezas
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 15 }}>
              <span style={{ color: "gold", fontWeight: "bold" }}>12.50€</span>
              <button
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
                  padding: "5px 15px",
                  borderRadius: 20,
                  cursor: velas.find(v => v.id === 1)?.stock ? "pointer" : "not-allowed",
                  fontWeight: "bold",
                  color: velas.find(v => v.id === 1)?.stock ? "#1b1745" : "#ccc"
                }}
              >
                {velas.find(v => v.id === 1)?.stock ? "Añadir" : "Agotado"}
              </button>
            </div>
          </div>

          {/* Incienso Sándalo */}
          <div style={{
            background: "#2b2560",
            borderRadius: 20,
            padding: "20px",
            border: "2px solid gold",
            position: "relative",
          }}>
            <div style={{
              position: "absolute",
              top: -10,
              right: -10,
              background: "#ff4444",
              color: "white",
              padding: "5px 12px",
              borderRadius: 20,
              fontWeight: "bold",
              fontSize: "0.8rem",
            }}>
              🔥 189 vendidos
            </div>
            <div style={{ fontSize: "3rem", textAlign: "center", marginBottom: 10 }}>🌿</div>
            <h4 style={{ color: "gold", textAlign: "center" }}>Incienso Sándalo</h4>
            <p style={{ color: "white", fontSize: "0.85rem", margin: "10px 0" }}>
              Conexión espiritual
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 15 }}>
              <span style={{ color: "gold", fontWeight: "bold" }}>6.50€</span>
              <button
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
                  padding: "5px 15px",
                  borderRadius: 20,
                  cursor: inciensos.find(i => i.id === 101)?.stock ? "pointer" : "not-allowed",
                  fontWeight: "bold",
                  color: inciensos.find(i => i.id === 101)?.stock ? "#1b1745" : "#ccc"
                }}
              >
                {inciensos.find(i => i.id === 101)?.stock ? "Añadir" : "Agotado"}
              </button>
            </div>
          </div>

          {/* Buda Dorado */}
          <div style={{
            background: "#2b2560",
            borderRadius: 20,
            padding: "20px",
            border: "2px solid gold",
            position: "relative",
          }}>
            <div style={{
              position: "absolute",
              top: -10,
              right: -10,
              background: "#ff4444",
              color: "white",
              padding: "5px 12px",
              borderRadius: 20,
              fontWeight: "bold",
              fontSize: "0.8rem",
            }}>
              🔥 156 vendidos
            </div>
            <div style={{ fontSize: "3rem", textAlign: "center", marginBottom: 10 }}>🪷</div>
            <h4 style={{ color: "gold", textAlign: "center" }}>Buda Dorado</h4>
            <p style={{ color: "white", fontSize: "0.85rem", margin: "10px 0" }}>
              Prosperidad
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 15 }}>
              <span style={{ color: "gold", fontWeight: "bold" }}>35.00€</span>
              <button
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
                  padding: "5px 15px",
                  borderRadius: 20,
                  cursor: figuras.find(f => f.id === 201)?.stock ? "pointer" : "not-allowed",
                  fontWeight: "bold",
                  color: figuras.find(f => f.id === 201)?.stock ? "#1b1745" : "#ccc"
                }}
              >
                {figuras.find(f => f.id === 201)?.stock ? "Añadir" : "Agotado"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORÍAS */}
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
        {/* Velas */}
        <div
          onClick={() => setMostrarCategoria("velas")}
          style={{
            cursor: "pointer",
            background: "#2b2560",
            borderRadius: 20,
            padding: 30,
            border: "2px solid gold",
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "gold" }}>🕯️ Velas</h2>
          <p style={{ color: "white" }}>{velas.length} productos</p>
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

        {/* Inciensos */}
        <div
          onClick={() => setMostrarCategoria("inciensos")}
          style={{
            cursor: "pointer",
            background: "#2b2560",
            borderRadius: 20,
            padding: 30,
            border: "2px solid gold",
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "gold" }}>🌿 Inciensos</h2>
          <p style={{ color: "white" }}>{inciensos.length} productos</p>
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

        {/* Figuras */}
        <div
          onClick={() => setMostrarCategoria("figuras")}
          style={{
            cursor: "pointer",
            background: "#2b2560",
            borderRadius: 20,
            padding: 30,
            border: "2px solid gold",
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "gold" }}>🪷 Figuras</h2>
          <p style={{ color: "white" }}>{figuras.length} productos</p>
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
      </div>
    </div>
  );
}