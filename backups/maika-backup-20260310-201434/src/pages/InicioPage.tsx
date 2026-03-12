import { useMemo } from "react";
import { useApp } from "../context/AppContext";
import type { Producto } from "../types";

const MESES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function precioConDescuento(p: Producto): number {
  const base = Number(p.precio) || 0;
  const d = p.descuentoPorcentaje != null ? Math.min(100, Math.max(0, Number(p.descuentoPorcentaje))) : 0;
  return d <= 0 ? base : Math.round(base * (1 - d / 100) * 100) / 100;
}

const ACCESOS_CATEGORIAS = [
  { id: "velas", nombre: "Velas", emoji: "🕯️" },
  { id: "inciensos", nombre: "Inciensos", emoji: "🌿" },
  { id: "figuras", nombre: "Figuras", emoji: "🪷" },
  { id: "kits", nombre: "Kits", emoji: "📦" }
] as const;

export default function InicioPage() {
  const { setPagina, abrirTiendaConCategoria, velas, inciensos, figuras, kits } = useApp();

  const productosRitual = useMemo(() => {
    const todos = [...velas, ...inciensos, ...figuras, ...(kits ?? [])];
    return todos.slice(0, 3);
  }, [velas, inciensos, figuras, kits]);

  const mesActual = MESES_ES[new Date().getMonth()];
  const añoActual = new Date().getFullYear();

  return (
    <div className="inicio-page" style={{ textAlign: "center", color: "inherit" }}>
      <h1
        className="hero-title"
        style={{
          fontSize: "clamp(28px, 5vw, 42px)",
          marginBottom: 32,
          color: "gold",
          opacity: 0.95,
          textTransform: "uppercase",
          letterSpacing: "2px",
          whiteSpace: "nowrap",
          lineHeight: 1.2,
          textShadow: "0 0 24px rgba(255,215,0,0.3)"
        }}
      >
        MAIKA&nbsp;&nbsp;LA RUTA DEL ALMA
      </h1>

      <section style={{ textAlign: "center", marginBottom: 56 }} aria-label="Acceso a tienda">
        <div
          className="imagen-inicio-hover"
          style={{
            width: "50%",
            maxWidth: 320,
            margin: "0 auto",
            borderRadius: 16,
            overflow: "hidden",
            border: "2px solid rgba(212,175,55,0.5)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(255,215,0,0.15)"
          }}
        >
          <img
            src="/tienda.jpg"
            alt="Tienda"
            style={{ width: "100%", height: "auto", display: "block" }}
            onError={(e) => {
              const fallbackActual = e.currentTarget.getAttribute("data-fallback");
              if (!fallbackActual) {
                e.currentTarget.setAttribute("data-fallback", "1");
                e.currentTarget.src = "tienda.jpg";
                return;
              }
              if (fallbackActual === "1") {
                e.currentTarget.setAttribute("data-fallback", "2");
                e.currentTarget.src = "/copia.png";
                return;
              }
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
        <button
          className="boton-tienda-hover"
          onClick={() => setPagina("tienda")}
          style={{
            marginTop: "24px",
            background: "transparent",
            color: "#f7d046",
            border: "2px solid gold",
            padding: "16px 56px",
            minWidth: 260,
            borderRadius: 30,
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 20,
            letterSpacing: "1.5px",
            boxShadow: "0 0 20px gold"
          }}
        >
          🛍️ TIENDA
        </button>

        <div className="inicio-accesos-categoria" style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
          {ACCESOS_CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => abrirTiendaConCategoria(cat.id)}
              className="inicio-btn-categoria"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 22px",
                borderRadius: 28,
                border: "2px solid rgba(255,215,0,0.7)",
                background: "rgba(27, 23, 69, 0.75)",
                color: "gold",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: 15,
                boxShadow: "0 4px 16px rgba(0,0,0,0.3), 0 0 12px rgba(255,215,0,0.12)",
                transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease"
              }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.nombre}</span>
            </button>
          ))}
        </div>
      </section>

      {productosRitual.length > 0 && (
        <details className="inicio-desplegable-productos" style={{ marginBottom: 56 }}>
          <summary className="inicio-desplegable-summary">
            <span className="inicio-desplegable-titulo">🌙 Ritual del mes</span>
            <span className="inicio-desplegable-sub">Lunas de {mesActual} {añoActual} – Ver productos</span>
          </summary>
          <div style={{ marginTop: 20, paddingTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            {productosRitual.map((p) => (
              <div
                key={`${p.categoria}-${p.id}`}
                className="card"
                style={{
                  width: 200,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  border: "2px solid gold",
                  borderRadius: 16,
                  background: "rgba(27, 23, 69, 0.9)"
                }}
              >
                <img
                  src={p.imagen?.startsWith("/") ? p.imagen : `/${p.imagen}`}
                  alt={p.nombre}
                  style={{ width: "100%", height: 100, objectFit: "contain", borderRadius: 10, border: "1px solid rgba(255,215,0,0.5)", marginBottom: 8 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <h3 style={{ color: "gold", margin: "4px 0", fontSize: 16, textAlign: "center" }}>{p.nombre}</h3>
                <p style={{ color: "white", fontSize: 18, fontWeight: "bold", margin: "4px 0" }}>{precioConDescuento(p).toFixed(2)} €</p>
                <button
                  type="button"
                  onClick={() => setPagina("tienda")}
                  style={{
                    marginTop: 8,
                    padding: "10px 16px",
                    borderRadius: 20,
                    border: "2px solid gold",
                    background: "transparent",
                    color: "gold",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: 14
                  }}
                >
                  Ver en tienda
                </button>
              </div>
            ))}
          </div>
          </div>
        </details>
      )}

      <h2 className="inicio-seccion-titulo" style={{ fontSize: "clamp(22px, 3.5vw, 28px)", marginBottom: 24, color: "gold", fontWeight: "bold", textShadow: "0 0 16px rgba(255,215,0,0.25)" }}>🌟 SERVICIOS</h2>
      <section style={{ display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap", marginBottom: 56 }} aria-label="Servicios">
        <div className="card" style={{ width: 240, padding: 18, display: "flex", flexDirection: "column", minHeight: 305 }}>
          <h3 style={{ color: "gold", margin: "6px 0", fontSize: 18, textAlign: "center" }}>🔮 Tarot Evolutivo</h3>
          <img
            src="/tarot%20evolutivo.jpg"
            alt="Tarot Evolutivo"
            style={{ width: "100%", height: 115, objectFit: "cover", borderRadius: 10, border: "1px solid gold", marginBottom: 8, display: "block" }}
          />
          <p style={{ color: "white", margin: "4px 0", fontSize: 16, textAlign: "center" }}>Sesión 60 min</p>
          <p style={{ color: "gold", fontSize: 20, fontWeight: "bold", margin: "6px 0", textAlign: "center" }}>45€</p>
          <button
            className="btn-reservar-inicio"
            onClick={() => window.open("https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20reservar%20Tarot", "_blank")}
            style={{ border: "none", padding: "12px 16px", borderRadius: 20, cursor: "pointer", width: "100%", fontWeight: "bold", fontSize: 16, marginTop: "auto" }}
          >
            Reservar
          </button>
        </div>
        <div className="card" style={{ width: 240, padding: 18, display: "flex", flexDirection: "column", minHeight: 305 }}>
          <h3 style={{ color: "gold", margin: "6px 0", fontSize: 18, textAlign: "center" }}>✨ Limpieza Energética</h3>
          <img
            src="/limpieza%20energetica.jpg"
            alt="Limpieza Energética"
            style={{ width: "100%", height: 115, objectFit: "cover", borderRadius: 10, border: "1px solid gold", marginBottom: 8, display: "block" }}
          />
          <p style={{ color: "white", margin: "4px 0", fontSize: 16, textAlign: "center" }}>Sesión 45 min</p>
          <p style={{ color: "gold", fontSize: 20, fontWeight: "bold", margin: "6px 0", textAlign: "center" }}>35€</p>
          <button
            className="btn-reservar-inicio"
            onClick={() => window.open("https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20reservar%20Limpieza", "_blank")}
            style={{ border: "none", padding: "12px 16px", borderRadius: 20, cursor: "pointer", width: "100%", fontWeight: "bold", fontSize: 16, marginTop: "auto" }}
          >
            Reservar
          </button>
        </div>
        <div className="card" style={{ width: 240, padding: 18, display: "flex", flexDirection: "column", minHeight: 305 }}>
          <h3 style={{ color: "gold", margin: "6px 0", fontSize: 18, textAlign: "center" }}>🕯️ Ritual Personalizado</h3>
          <img
            src="/ritual%20personalizado.jpg"
            alt="Ritual Personalizado"
            style={{ width: "100%", height: 115, objectFit: "cover", borderRadius: 10, border: "1px solid gold", marginBottom: 8, display: "block" }}
          />
          <p style={{ color: "white", margin: "4px 0", fontSize: 16, textAlign: "center" }}>Sesión 60 min</p>
          <p style={{ color: "gold", fontSize: 20, fontWeight: "bold", margin: "6px 0", textAlign: "center" }}>50€</p>
          <button
            className="btn-reservar-inicio"
            onClick={() => window.open("https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20consultar%20Ritual", "_blank")}
            style={{ border: "none", padding: "12px 16px", borderRadius: 20, cursor: "pointer", width: "100%", fontWeight: "bold", fontSize: 16, marginTop: "auto" }}
          >
            Reservar
          </button>
        </div>
      </section>

      <h2 className="inicio-seccion-titulo" style={{ fontSize: "clamp(22px, 3.5vw, 28px)", marginBottom: 20, color: "gold", fontWeight: "bold", textShadow: "0 0 16px rgba(255,215,0,0.25)" }}>💬 TESTIMONIOS</h2>
      <section style={{ maxWidth: 620, margin: "0 auto 32px" }} aria-label="Testimonios">
        <p className="card testimonio-card" style={{ marginBottom: 14, fontSize: 16, lineHeight: 1.55, color: "rgba(255,255,255,0.95)" }}>
          "Sentí claridad y paz después de la primera consulta. ¡Recomendadísima!"
        </p>
        <p className="card testimonio-card" style={{ fontSize: 16, lineHeight: 1.55, color: "rgba(255,255,255,0.95)" }}>
          "Me ayudó a entender lo que estaba viviendo. Gracias Maika"
        </p>
      </section>
    </div>
  );
}
