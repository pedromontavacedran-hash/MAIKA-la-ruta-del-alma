import { THEME } from "../../../config";
import type { ItemComparativaPrecio } from "../../../services/apiPreciosCompetencia";

type EstadoComparativa = "mas-caro" | "mas-barato" | "igual" | "sin-dato";

function estadoDe(it: ItemComparativaPrecio): EstadoComparativa {
  if (!it.ok || it.precioOrigen == null || it.precioMio == null) return "sin-dato";
  const diff = Math.round((it.precioMio - it.precioOrigen) * 100) / 100;
  if (diff > 0.01) return "mas-caro";
  if (diff < -0.01) return "mas-barato";
  return "igual";
}

const ESTILO_ESTADO: Record<EstadoComparativa, { texto: string; bg: string }> = {
  "mas-caro": { texto: "Tú más caro", bg: "#7a1f1f" },
  "mas-barato": { texto: "Tú más barato", bg: "#1f7a3a" },
  igual: { texto: "Igual", bg: "#4a4a4a" },
  "sin-dato": { texto: "Sin comprobar", bg: "#4a4a4a" }
};

function fmtEur(n: number | null): string {
  return n == null ? "—" : `${n.toFixed(2)} €`;
}

function dominioDe(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Apartado plegable de Inventario: tu precio frente al último precio comprobado
 * en la web oficial del fabricante. «Comprobar ahora» re-descarga todas las webs.
 */
export default function PreciosCompetenciaSection({
  items,
  cargando,
  comprobadoEn,
  onComprobarTodos
}: {
  items: ItemComparativaPrecio[];
  cargando: boolean;
  comprobadoEn: string | null;
  onComprobarTodos: () => void;
}) {
  return (
    <details
      className="inventario-info-details"
      style={{ marginTop: 4, marginBottom: 8, color: "rgba(255,255,255,0.78)", fontSize: 13, lineHeight: 1.45 }}
    >
      <summary
        style={{
          cursor: "pointer",
          color: `color-mix(in srgb, ${THEME.goldMain} 72%, transparent)`,
          fontWeight: 500,
          fontSize: 12,
          letterSpacing: "0.02em",
          userSelect: "none",
          listStyle: "none"
        }}
      >
        🏷️ Comparativa con fabricante
      </summary>
      <div
        style={{
          marginTop: 10,
          paddingLeft: 10,
          borderLeft: `2px solid rgba(212,175,55,0.3)`
        }}
      >
        <p style={{ margin: "0 0 10px", color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
          Último precio visto en la web oficial de cada producto con enlace de origen. También aparece
          como cajita «Fab» junto al precio de venta en la lista.
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onComprobarTodos}
            disabled={cargando}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: `1px solid ${THEME.goldMain}`,
              background: "rgba(201,162,74,0.15)",
              color: THEME.goldMain,
              fontSize: 12,
              fontWeight: 600,
              cursor: cargando ? "wait" : "pointer"
            }}
          >
            {cargando ? "Comprobando…" : "Comprobar ahora"}
          </button>
          {comprobadoEn && !cargando ? (
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>
              Última: {new Date(comprobadoEn).toLocaleString("es-ES")}
            </span>
          ) : null}
        </div>

        {cargando ? (
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: 0 }}>
            Visitando las webs oficiales… puede tardar unos segundos.
          </p>
        ) : items.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: 0 }}>
            Ningún producto tiene enlace de origen todavía.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {items.map((it) => {
              const est = estadoDe(it);
              const diff =
                it.precioMio != null && it.precioOrigen != null
                  ? Math.round((it.precioMio - it.precioOrigen) * 100) / 100
                  : null;
              return (
                <div
                  key={it.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px 1fr auto",
                    gap: 10,
                    alignItems: "center",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid rgba(201,162,74,0.3)",
                    background: "rgba(255,255,255,0.03)"
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 6, overflow: "hidden", background: "#fff" }}>
                    {it.imagen ? (
                      <img src={it.imagen} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    ) : null}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{it.nombre}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                      {it.marca ? `${it.marca} · ` : ""}Tu precio:{" "}
                      <strong style={{ color: THEME.goldMain }}>{fmtEur(it.precioMio)}</strong>
                      {" · "}
                      {dominioDe(it.urlOrigen)}:{" "}
                      <strong style={{ color: "white" }}>{it.ok ? fmtEur(it.precioOrigen) : "—"}</strong>
                      {it.ok && it.precioRegularOrigen != null && it.precioRegularOrigen !== it.precioOrigen ? (
                        <span style={{ textDecoration: "line-through", opacity: 0.6, marginLeft: 5 }}>
                          {fmtEur(it.precioRegularOrigen)}
                        </span>
                      ) : null}
                      {diff != null && diff !== 0 ? (
                        <span style={{ marginLeft: 5 }}>
                          ({diff > 0 ? "+" : ""}
                          {diff.toFixed(2)} €)
                        </span>
                      ) : null}
                      {!it.ok && it.error ? (
                        <span style={{ color: "#ff9999", marginLeft: 5 }}>· {it.error}</span>
                      ) : null}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: 7,
                      fontSize: 10,
                      fontWeight: 700,
                      background: ESTILO_ESTADO[est].bg,
                      color: "#fff",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {ESTILO_ESTADO[est].texto}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </details>
  );
}
