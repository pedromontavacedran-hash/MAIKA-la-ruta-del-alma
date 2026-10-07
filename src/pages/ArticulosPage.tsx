import { Link } from "react-router-dom";
import { ARTICULOS } from "../data/articulos";
import { THEME } from "../config";

function fechaLegible(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

/** Índice de artículos: guías y reflexiones escritas por MAIKA (Fase 0). */
export default function ArticulosPage() {
  return (
    <div className="inicio-page" style={{ color: "inherit", paddingTop: 8, paddingBottom: 40 }}>
      <h1
        className="inicio-seccion-titulo"
        style={{
          fontSize: "clamp(24px, 4vw, 32px)",
          color: THEME.goldMain,
          fontWeight: "bold",
          marginBottom: 10,
          textAlign: "center"
        }}
      >
        Artículos
      </h1>
      <p
        style={{
          textAlign: "center",
          color: "rgba(255,255,255,0.75)",
          fontSize: 14.5,
          maxWidth: 560,
          margin: "0 auto 28px",
          lineHeight: 1.6
        }}
      >
        Guías y reflexiones sobre sueños, símbolos y las tradiciones que habitan Rutas del Alma.
        Escritas con calma, para leer despacio.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640, margin: "0 auto", width: "100%" }}>
        {ARTICULOS.map((a) => (
          <Link
            key={a.slug}
            to={`/articulos/${a.slug}`}
            style={{
              display: "block",
              padding: "18px 20px",
              borderRadius: 14,
              border: "1px solid rgba(229, 192, 123, 0.45)",
              background: "rgba(8, 6, 15, 0.85)",
              textDecoration: "none",
              transition: "border-color 0.2s ease, background 0.2s ease"
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "2px 10px",
                borderRadius: 12,
                background: "rgba(212,175,55,0.18)",
                color: THEME.goldMain,
                fontSize: 12,
                fontWeight: "bold",
                marginBottom: 8
              }}
            >
              {a.tema}
            </span>
            <h2 style={{ color: "rgba(255,255,255,0.95)", fontSize: 17.5, fontWeight: 600, margin: "0 0 6px", lineHeight: 1.35 }}>
              {a.titulo}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13.5, lineHeight: 1.55, margin: "0 0 8px" }}>
              {a.extracto}
            </p>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
              {fechaLegible(a.fecha)} · {a.lecturaMin} min de lectura
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
