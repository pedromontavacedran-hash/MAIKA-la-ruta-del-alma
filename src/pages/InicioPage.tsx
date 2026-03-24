import { useMemo } from "react";
import { useApp } from "../context/AppContext";
import type { Producto } from "../types";
import { THEME } from "../config";

const MESES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function precioConDescuento(p: Producto): number {
  const base = Number(p.precio) || 0;
  const d = p.descuentoPorcentaje != null ? Math.min(100, Math.max(0, Number(p.descuentoPorcentaje))) : 0;
  return d <= 0 ? base : Math.round(base * (1 - d / 100) * 100) / 100;
}

export default function InicioPage() {
  const { setPagina, velas, inciensos, figuras, kits, desplegableInicio, serviciosInicio } = useApp();

  const todosProductos = useMemo(() => {
    return [...velas, ...inciensos, ...figuras, ...(kits ?? [])];
  }, [velas, inciensos, figuras, kits]);

  const mesActual = MESES_ES[new Date().getMonth()];
  const añoActual = new Date().getFullYear();

  return (
    <div className="inicio-page" style={{ textAlign: "center", color: "inherit" }}>
      {desplegableInicio.map((bloque, bloqueIdx) => {
        const productosBloque = todosProductos.slice(bloque.inicio, bloque.inicio + bloque.numProductos);
        const subtitulo = bloque.subtitulo.replace("{mes}", mesActual).replace("{año}", String(añoActual));
        if (productosBloque.length === 0) return null;
        return (
          <details key={bloqueIdx} className="inicio-desplegable-productos" style={{ marginBottom: 32, marginTop: bloqueIdx === 0 ? 24 : 0 }}>
            <summary className="inicio-desplegable-summary">
              <span className="inicio-desplegable-titulo">{bloque.titulo}</span>
              <span className="inicio-desplegable-sub">{subtitulo}</span>
            </summary>
            <div style={{ marginTop: 12, paddingTop: 4 }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
              {productosBloque.map((p) => (
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
                <h3 style={{ color: THEME.goldMain, margin: "4px 0", fontSize: 16, textAlign: "center" }}>{p.nombre}</h3>
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
                    color: THEME.goldMain,
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
        );
      })}

      <h2 id="inicio-servicios" className="inicio-seccion-titulo" style={{ fontSize: "clamp(22px, 3.5vw, 28px)", marginBottom: 20, color: THEME.goldMain, fontWeight: "bold", textShadow: "0 0 16px rgba(212,175,55,0.25)", scrollMarginTop: 140 }}>🌟 SERVICIOS</h2>
      <section style={{ display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap", marginBottom: 36 }} aria-label="Servicios">
        {serviciosInicio.map((s, idx) => (
          <div key={idx} className="card inicio-servicio-card" style={{ width: 240, padding: 18, display: "flex", flexDirection: "column", minHeight: 305 }}>
            <h3 className="inicio-servicio-titulo" style={{ color: THEME.goldMain, margin: "6px 0", fontSize: 18, textAlign: "center", minHeight: 52, display: "flex", flexDirection: "column", justifyContent: "center" }}>{s.titulo}</h3>
            <img
              src={s.imagen.startsWith("/") ? s.imagen : `/${s.imagen}`}
              alt={s.titulo.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim() || `Servicio ${idx + 1}`}
              style={{ width: "100%", height: 115, objectFit: "cover", borderRadius: 10, border: "1px solid gold", marginBottom: 8, display: "block" }}
            />
            <p style={{ color: "white", margin: "4px 0", fontSize: 16, textAlign: "center" }}>{s.duracion}</p>
            <p style={{ color: THEME.goldMain, fontSize: 20, fontWeight: "bold", margin: "6px 0", textAlign: "center" }}>{s.precio}</p>
            <a
              href={s.urlWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                width: "100%",
                marginTop: "auto",
                padding: "12px 16px",
                background: THEME.goldGradient,
                color: THEME.bg,
                fontSize: 16,
                fontWeight: "bold",
                textAlign: "center",
                borderRadius: 20,
                textDecoration: "none",
                border: `1px solid ${THEME.goldMain}`,
                cursor: "pointer",
              }}
            >
              {s.textoBoton}
            </a>
          </div>
        ))}
      </section>

      <div className="inicio-bloques-texto" style={{ maxWidth: 560, margin: "0 auto" }}>
        <h2 id="inicio-empresa" className="inicio-seccion-titulo" style={{ fontSize: "clamp(22px, 3.5vw, 28px)", marginBottom: 16, color: THEME.goldMain, fontWeight: "bold", textShadow: "0 0 16px rgba(212,175,55,0.25)", scrollMarginTop: 140 }}>🌙 Sobre Maika</h2>
        <p className="card inicio-card-texto">
          Maika es tu espacio de magia y bienestar. Ofrecemos productos para rituales, velas, inciensos y figuras, además de servicios como tarot evolutivo, limpieza energética y rituales personalizados. Conecta con tu esencia.
        </p>

        <h2 id="inicio-envios" className="inicio-seccion-titulo" style={{ fontSize: "clamp(22px, 3.5vw, 28px)", marginBottom: 16, color: THEME.goldMain, fontWeight: "bold", textShadow: "0 0 16px rgba(212,175,55,0.25)", scrollMarginTop: 140, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span style={{ display: "inline-flex", alignItems: "center", transform: "scaleX(-1)" }}><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke={THEME.goldMain} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg></span> Envíos e información</h2>
        <p className="card inicio-card-texto">
          Envíos a toda España. Plazos y condiciones según destino. Para consultas de envío, devoluciones o pedidos, escríbenos por WhatsApp.
        </p>

        <h2 className="inicio-seccion-titulo" style={{ fontSize: "clamp(22px, 3.5vw, 28px)", marginBottom: 20, color: THEME.goldMain, fontWeight: "bold", textShadow: "0 0 16px rgba(212,175,55,0.25)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span style={{ display: "inline-flex", alignItems: "center" }}><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke={THEME.goldMain} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg></span> TESTIMONIOS</h2>
        <section className="inicio-testimonios" aria-label="Testimonios">
          <p className="card testimonio-card inicio-card-texto">
            "Sentí claridad y paz después de la primera consulta. ¡Recomendadísima!"
          </p>
          <p className="card testimonio-card inicio-card-texto">
            "Me ayudó a entender lo que estaba viviendo. Gracias Maika"
          </p>
        </section>
      </div>
    </div>
  );
}
