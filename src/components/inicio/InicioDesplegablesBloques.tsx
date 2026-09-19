import { useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { THEME } from "../../config";
import { normalizarSrcImagenProducto } from "../../utils/campanaPack";
const MESES_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre"
] as const;

function interpolarSubtituloInicio(subtitulo: string): string {
  const d = new Date();
  return subtitulo
    .replace(/\{mes\}/gi, MESES_ES[d.getMonth()] ?? "")
    .replace(/\{año\}/gi, String(d.getFullYear()));
}

/** Bloques desplegables de inicio (ritual del mes, ofertas…), mismos datos que edita el admin. */
export default function InicioDesplegablesBloques() {
  const { desplegableInicio, velas, inciensos, figuras, kits, joyas, abrirTiendaConProducto } = useApp();

  const listaCat = useMemo(
    () => [...velas, ...inciensos, ...figuras, ...(kits ?? []), ...(joyas ?? [])],
    [velas, inciensos, figuras, kits, joyas]
  );

  return (
    <div
      className="inicio-wrapper inicio-page maika-route-fill-column"
      data-maika="inicio-sections"
      style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}
    >
      <div className="inicio-bloques-texto">
        {desplegableInicio.map((bloque, idx) => {
          const totalCat = listaCat.length;
          const inicioValido = totalCat > 0 ? Math.min(Math.max(0, bloque.inicio), totalCat - 1) : 0;
          const num = Math.max(0, bloque.numProductos);
          const mostrados = listaCat.slice(inicioValido, inicioValido + num);

          return (
            <details
              key={idx}
              className={`inicio-desplegable-productos${idx === 0 ? " inicio-ritual-mes-destacado" : ""}`}
              open={idx === 0}
            >
              <summary className="inicio-desplegable-summary">
                <span className="inicio-desplegable-titulo">{bloque.titulo}</span>
                <span className="inicio-desplegable-sub">{interpolarSubtituloInicio(bloque.subtitulo)}</span>
              </summary>
              <div style={{ padding: "12px 16px 20px" }}>
                {mostrados.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, margin: 0, textAlign: "center" }}>
                    Aún no hay productos en el catálogo para este bloque.
                  </p>
                ) : (
                  <div
                    className="inicio-productos-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(168px, 1fr))",
                      gap: 18
                    }}
                  >
                    {mostrados.map((p) => (
                      <div
                        key={`${p.categoria}-${p.id}`}
                        className={idx === 0 ? "inicio-ritual-pack-card" : undefined}
                        style={{
                          border: `2px solid ${THEME.goldMain}`,
                          padding: 16,
                          borderRadius: 14,
                          textAlign: "center",
                          background: THEME.bg,
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                          boxSizing: "border-box"
                        }}
                      >
                        <img
                          src={normalizarSrcImagenProducto(p.imagen)}
                          alt={p.nombre}
                          width={200}
                          height={200}
                          loading="lazy"
                          decoding="async"
                          role="button"
                          tabIndex={0}
                          onClick={() => abrirTiendaConProducto(p)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirTiendaConProducto(p); } }}
                          style={{
                            width: "100%",
                            maxWidth: 200,
                            height: "auto",
                            borderRadius: 10,
                            marginBottom: 10,
                            objectFit: "cover",
                            cursor: "pointer"
                          }}
                        />
                        <div
                          style={{
                            color: THEME.text,
                            fontWeight: 700,
                            fontSize: 14,
                            marginBottom: 10,
                            lineHeight: 1.35
                          }}
                        >
                          {p.nombre}
                        </div>
                        <button
                          type="button"
                          className="inicio-btn-categoria"
                          onClick={() => abrirTiendaConProducto(p)}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 10,
                            border: `2px solid ${THEME.goldMain}`,
                            background: "rgba(24, 14, 40, 0.6)",
                            color: THEME.goldLight,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: 13,
                            marginTop: "auto"
                          }}
                        >
                          Ver en tienda
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
