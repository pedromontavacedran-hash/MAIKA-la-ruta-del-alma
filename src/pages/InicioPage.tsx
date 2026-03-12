import { useMemo } from "react";
import { useApp } from "../context/AppContext";
import type { Producto } from "../types";

const MESES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function precioConDescuento(p: Producto): number {
  const base = Number(p.precio) || 0;
  const d = p.descuentoPorcentaje != null ? Math.min(100, Math.max(0, Number(p.descuentoPorcentaje))) : 0;
  return d <= 0 ? base : Math.round(base * (1 - d / 100) * 100) / 100;
}

export default function InicioPage() {
  const { setPagina, velas, inciensos, figuras, kits } = useApp();

  const productosRitual = useMemo(() => {
    const todos = [...velas, ...inciensos, ...figuras, ...(kits ?? [])];
    return todos.slice(0, 3);
  }, [velas, inciensos, figuras, kits]);

  const mesActual = MESES_ES[new Date().getMonth()];
  const añoActual = new Date().getFullYear();

  return (
    <div className="inicio-page" style={{ textAlign: "center", color: "inherit" }}>
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
                  background: "rgba(0, 0, 0, 0.95)"
                }}
              >
                <img
                  src={p.imagen?.startsWith("/") ? p.imagen : `/${p.imagen}`}
                  alt={p.nombre}
                  style={{ width: "100%", height: 100, objectFit: "contain", borderRadius: 10, border: "1px solid rgba(212,175,55,0.5)", marginBottom: 8 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <h3 style={{ color: "#C9A24A", margin: "4px 0", fontSize: 16, textAlign: "center" }}>{p.nombre}</h3>
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
                    color: "#C9A24A",
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

      <h2 id="inicio-servicios" className="inicio-seccion-titulo" style={{ fontSize: "clamp(22px, 3.5vw, 28px)", marginBottom: 24, color: "#C9A24A", fontWeight: "bold", textShadow: "0 0 16px rgba(212,175,55,0.25)", scrollMarginTop: 100 }}>🌟 SERVICIOS</h2>
      <section style={{ display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap", marginBottom: 56 }} aria-label="Servicios">
        <div className="card inicio-servicio-card" style={{ width: 240, padding: 18, display: "flex", flexDirection: "column", minHeight: 305 }}>
          <h3 className="inicio-servicio-titulo" style={{ color: "#C9A24A", margin: "6px 0", fontSize: 18, textAlign: "center", minHeight: 52, display: "flex", flexDirection: "column", justifyContent: "center" }}>🔮 Tarot<br />Evolutivo</h3>
          <img
            src="/tarot%20evolutivo.jpg"
            alt="Tarot Evolutivo"
            style={{ width: "100%", height: 115, objectFit: "cover", borderRadius: 10, border: "1px solid gold", marginBottom: 8, display: "block" }}
          />
          <p style={{ color: "white", margin: "4px 0", fontSize: 16, textAlign: "center" }}>Sesión 60 min</p>
          <p style={{ color: "#C9A24A", fontSize: 20, fontWeight: "bold", margin: "6px 0", textAlign: "center" }}>45€</p>
          <button
            className="btn-reservar-inicio"
            onClick={() => window.open("https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20reservar%20Tarot", "_blank")}
            style={{ border: "none", padding: "12px 16px", borderRadius: 20, cursor: "pointer", width: "100%", fontWeight: "bold", fontSize: 16, marginTop: "auto" }}
          >
            Reservar
          </button>
        </div>
        <div className="card inicio-servicio-card" style={{ width: 240, padding: 18, display: "flex", flexDirection: "column", minHeight: 305 }}>
          <h3 className="inicio-servicio-titulo" style={{ color: "#C9A24A", margin: "6px 0", fontSize: 18, textAlign: "center", minHeight: 52, display: "flex", flexDirection: "column", justifyContent: "center" }}>✨ Limpieza Energética</h3>
          <img
            src="/limpieza%20energetica.jpg"
            alt="Limpieza Energética"
            style={{ width: "100%", height: 115, objectFit: "cover", borderRadius: 10, border: "1px solid gold", marginBottom: 8, display: "block" }}
          />
          <p style={{ color: "white", margin: "4px 0", fontSize: 16, textAlign: "center" }}>Sesión 45 min</p>
          <p style={{ color: "#C9A24A", fontSize: 20, fontWeight: "bold", margin: "6px 0", textAlign: "center" }}>35€</p>
          <button
            className="btn-reservar-inicio"
            onClick={() => window.open("https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20reservar%20Limpieza", "_blank")}
            style={{ border: "none", padding: "12px 16px", borderRadius: 20, cursor: "pointer", width: "100%", fontWeight: "bold", fontSize: 16, marginTop: "auto" }}
          >
            Reservar
          </button>
        </div>
        <div className="card inicio-servicio-card" style={{ width: 240, padding: 18, display: "flex", flexDirection: "column", minHeight: 305 }}>
          <h3 className="inicio-servicio-titulo" style={{ color: "#C9A24A", margin: "6px 0", fontSize: 18, textAlign: "center", minHeight: 52, display: "flex", flexDirection: "column", justifyContent: "center" }}>🕯️ Ritual Personalizado</h3>
          <img
            src="/ritual%20personalizado.jpg"
            alt="Ritual Personalizado"
            style={{ width: "100%", height: 115, objectFit: "cover", borderRadius: 10, border: "1px solid gold", marginBottom: 8, display: "block" }}
          />
          <p style={{ color: "white", margin: "4px 0", fontSize: 16, textAlign: "center" }}>Sesión 60 min</p>
          <p style={{ color: "#C9A24A", fontSize: 20, fontWeight: "bold", margin: "6px 0", textAlign: "center" }}>50€</p>
          <button
            className="btn-reservar-inicio"
            onClick={() => window.open("https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20consultar%20Ritual", "_blank")}
            style={{ border: "none", padding: "12px 16px", borderRadius: 20, cursor: "pointer", width: "100%", fontWeight: "bold", fontSize: 16, marginTop: "auto" }}
          >
            Reservar
          </button>
        </div>
      </section>

      <h2 id="inicio-empresa" className="inicio-seccion-titulo" style={{ fontSize: "clamp(22px, 3.5vw, 28px)", marginBottom: 16, color: "#C9A24A", fontWeight: "bold", textShadow: "0 0 16px rgba(212,175,55,0.25)", scrollMarginTop: 100 }}>🌙 Sobre Maika</h2>
      <p className="card" style={{ maxWidth: 560, margin: "0 auto 40px", padding: 20, fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,0.9)" }}>
        Maika es tu espacio de magia y bienestar. Ofrecemos productos para rituales, velas, inciensos y figuras, además de servicios como tarot evolutivo, limpieza energética y rituales personalizados. Conecta con tu esencia.
      </p>

      <h2 id="inicio-envios" className="inicio-seccion-titulo" style={{ fontSize: "clamp(22px, 3.5vw, 28px)", marginBottom: 16, color: "#C9A24A", fontWeight: "bold", textShadow: "0 0 16px rgba(212,175,55,0.25)", scrollMarginTop: 100 }}>🚚 Envíos e información</h2>
      <p className="card" style={{ maxWidth: 560, margin: "0 auto 40px", padding: 20, fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,0.9)" }}>
        Envíos a toda España. Plazos y condiciones según destino. Para consultas de envío, devoluciones o pedidos, escríbenos por WhatsApp.
      </p>

      <h2 className="inicio-seccion-titulo" style={{ fontSize: "clamp(22px, 3.5vw, 28px)", marginBottom: 20, color: "#C9A24A", fontWeight: "bold", textShadow: "0 0 16px rgba(212,175,55,0.25)" }}>💬 TESTIMONIOS</h2>
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
