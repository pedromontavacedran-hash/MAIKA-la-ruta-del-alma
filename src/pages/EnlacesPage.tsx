import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { iconoParaEnlace, type EnlaceConfig } from "../config/enlaces";
import { leerEnlacesConfig } from "../services/apiEnlaces";
import "./enlaces.css";

function esRutaInterna(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

/**
 * `/enlaces` — página destino del QR de las tarjetas de visita.
 * Los botones los gestiona el admin (backend/data/enlaces.json); esta página
 * solo los pinta. Si la API falla, `leerEnlacesConfig` devuelve los defaults.
 */
export default function EnlacesPage() {
  const [enlaces, setEnlaces] = useState<EnlaceConfig[] | null>(null);

  useEffect(() => {
    let vivo = true;
    void leerEnlacesConfig().then((lista) => {
      if (vivo) setEnlaces(lista.filter((e) => e.activa));
    });
    return () => {
      vivo = false;
    };
  }, []);

  return (
    <div className="inicio-page enlaces-page">
      <div className="enlaces-contenido">
        <div className="enlaces-deco" aria-hidden="true">
          <span>✦</span>
          <span className="luna">☾</span>
          <span>✦</span>
        </div>

        <h1 id="pagina-enlaces-titulo" className="enlaces-titulo">
          MAIKA
        </h1>
        <p className="enlaces-subtitulo">Rutas del Alma · Elige por dónde empezar</p>

        {enlaces === null ? (
          <p className="enlaces-estado">Cargando…</p>
        ) : enlaces.length === 0 ? (
          <p className="enlaces-estado">Muy pronto aquí nuevos enlaces ✦</p>
        ) : (
          <nav className="enlaces-lista" aria-label="Enlaces de MAIKA">
            {enlaces.map((e) => {
              const interna = esRutaInterna(e.url);
              const clase = "enlace-btn";
              const contenido = (
                <>
                  <span className="enlace-btn-icono" aria-hidden="true">
                    {iconoParaEnlace(e)}
                  </span>
                  <span className="enlace-btn-etiqueta">{e.etiqueta}</span>
                  <span className="enlace-btn-flecha" aria-hidden="true">→</span>
                </>
              );
              return interna ? (
                <Link key={e.id} to={e.url} className={clase}>
                  {contenido}
                </Link>
              ) : (
                <a
                  key={e.id}
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clase}
                >
                  {contenido}
                </a>
              );
            })}
          </nav>
        )}

        <Link to="/" className="enlaces-volver">
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
