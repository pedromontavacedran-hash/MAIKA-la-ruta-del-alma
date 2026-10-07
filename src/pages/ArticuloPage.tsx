import type { ReactNode } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ARTICULOS, obtenerArticuloPorSlug, type BloqueArticulo } from "../data/articulos";
import { THEME } from "../config";

/**
 * Renderiza `[texto](/ruta)` como <Link> interno. Solo acepta rutas que empiezan
 * por `/` (enlaces externos no se soportan a propósito en el cuerpo editorial).
 */
function textoConEnlaces(texto: string): ReactNode[] {
  const partes: ReactNode[] = [];
  const re = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(texto)) !== null) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index));
    partes.push(
      <Link key={i++} to={m[2]} style={{ color: THEME.goldMain }}>
        {m[1]}
      </Link>
    );
    ultimo = m.index + m[0].length;
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));
  return partes;
}

function Bloque({ bloque }: { bloque: BloqueArticulo }) {
  switch (bloque.tipo) {
    case "subtitulo":
      return (
        <h2 style={{ color: THEME.goldMain, fontSize: 19, fontWeight: "bold", margin: "26px 0 10px" }}>
          {bloque.texto}
        </h2>
      );
    case "parrafo":
      return (
        <p style={{ color: "rgba(255,255,255,0.88)", fontSize: 15.5, lineHeight: 1.75, margin: "0 0 16px" }}>
          {textoConEnlaces(bloque.texto)}
        </p>
      );
    case "lista":
      return (
        <ul style={{ color: "rgba(255,255,255,0.88)", fontSize: 15, lineHeight: 1.7, margin: "0 0 16px", paddingLeft: 22 }}>
          {bloque.items.map((item, i) => (
            <li key={i} style={{ marginBottom: 6 }}>{textoConEnlaces(item)}</li>
          ))}
        </ul>
      );
    case "cita":
      return (
        <blockquote
          style={{
            borderLeft: `3px solid ${THEME.goldMain}`,
            margin: "22px 0",
            padding: "4px 0 4px 18px",
            color: "rgba(255,255,255,0.9)",
            fontSize: 16.5,
            fontStyle: "italic",
            lineHeight: 1.6
          }}
        >
          {bloque.texto}
        </blockquote>
      );
    case "cta":
      return (
        <div
          style={{
            border: `1px solid rgba(229, 192, 123, 0.45)`,
            borderRadius: 14,
            background: "rgba(8, 6, 15, 0.85)",
            padding: "18px 20px",
            margin: "26px 0",
            textAlign: "center"
          }}
        >
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14.5, margin: "0 0 12px", lineHeight: 1.6 }}>
            {bloque.texto}
          </p>
          <Link
            to={bloque.ruta}
            style={{
              display: "inline-block",
              padding: "10px 22px",
              borderRadius: 22,
              background: THEME.goldMain,
              color: "#1b1745",
              fontWeight: "bold",
              fontSize: 14,
              textDecoration: "none"
            }}
          >
            {bloque.etiqueta}
          </Link>
        </div>
      );
  }
}

/** Detalle de artículo: contenido editorial + JSON-LD + enlaces a artículos relacionados. */
export default function ArticuloPage() {
  const { slug } = useParams<{ slug: string }>();
  const articulo = slug ? obtenerArticuloPorSlug(slug) : undefined;

  if (!articulo) {
    return <Navigate to="/articulos" replace />;
  }

  const otros = ARTICULOS.filter((a) => a.slug !== articulo.slug).slice(0, 2);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: articulo.titulo,
    description: articulo.extracto,
    datePublished: articulo.fecha,
    author: { "@type": "Organization", name: "MAIKA · Rutas del Alma" },
    publisher: { "@type": "Organization", name: "MAIKA · Rutas del Alma" },
    inLanguage: "es",
    mainEntityOfPage: { "@type": "WebPage", "@id": `/articulos/${articulo.slug}` }
  };

  return (
    <article className="inicio-page" style={{ color: "inherit", paddingTop: 8, paddingBottom: 40, maxWidth: 680, margin: "0 auto" }}>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>

      <nav aria-label="Migas" style={{ marginBottom: 18, fontSize: 13 }}>
        <Link to="/articulos" style={{ color: THEME.goldMain, textDecoration: "none" }}>
          ← Volver a artículos
        </Link>
      </nav>

      <span
        style={{
          display: "inline-block",
          padding: "2px 10px",
          borderRadius: 12,
          background: "rgba(212,175,55,0.18)",
          color: THEME.goldMain,
          fontSize: 12,
          fontWeight: "bold",
          marginBottom: 10
        }}
      >
        {articulo.tema}
      </span>
      <h1 style={{ color: "rgba(255,255,255,0.97)", fontSize: "clamp(24px, 4.5vw, 30px)", fontWeight: "bold", lineHeight: 1.3, margin: "0 0 14px" }}>
        {articulo.titulo}
      </h1>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: "0 0 24px" }}>
        {articulo.lecturaMin} min de lectura · Lectura simbólica y orientativa
      </p>

      {articulo.bloques.map((b, i) => (
        <Bloque key={i} bloque={b} />
      ))}

      <hr style={{ border: "none", borderTop: "1px solid rgba(229,192,123,0.3)", margin: "34px 0 20px" }} />
      <h2 style={{ color: THEME.goldMain, fontSize: 16, margin: "0 0 12px" }}>Seguir leyendo</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {otros.map((a) => (
          <Link
            key={a.slug}
            to={`/articulos/${a.slug}`}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid rgba(229, 192, 123, 0.35)",
              background: "rgba(8, 6, 15, 0.85)",
              color: "rgba(255,255,255,0.9)",
              textDecoration: "none",
              fontSize: 14.5
            }}
          >
            {a.titulo}
          </Link>
        ))}
      </div>
    </article>
  );
}
