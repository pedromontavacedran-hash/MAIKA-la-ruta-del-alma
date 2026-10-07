import type { ObraAcademica } from "./fuentesRutasDelAlma";

type Props = {
  /** Fuentes primarias/tradicionales realmente utilizadas en el contenido. */
  tradicionales?: string[];
  /** Obras académicas usadas para esta sección (contextuales, no todas). */
  academicas?: ObraAcademica[];
};

/**
 * «📚 Fuentes y bibliografía» — bloque desplegable discreto al final de las
 * páginas de Rutas del Alma. Solo lista las fuentes utilizadas en cada página.
 */
export default function FuentesYBibliografia({ tradicionales = [], academicas = [] }: Props) {
  if (tradicionales.length === 0 && academicas.length === 0) return null;

  return (
    <details className="rutas-fuentes">
      <summary className="rutas-fuentes-resumen">📚 Fuentes y bibliografía</summary>
      <div className="rutas-fuentes-cuerpo">
        <p className="rutas-fuentes-intro">
          Esta sección se ha elaborado a partir de fuentes tradicionales, históricas y estudios
          académicos especializados.
        </p>

        {tradicionales.length > 0 ? (
          <>
            <p className="rutas-fuentes-grupo">Fuentes tradicionales</p>
            <ul className="rutas-fuentes-lista">
              {tradicionales.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </>
        ) : null}

        {academicas.length > 0 ? (
          <>
            <p className="rutas-fuentes-grupo">Estudios académicos de referencia</p>
            <ul className="rutas-fuentes-lista">
              {academicas.map((o) => (
                <li key={o.id}>
                  <span className="rutas-fuentes-obra">
                    {o.autor}, <em>{o.titulo}</em>. {o.edicion}.
                  </span>{" "}
                  <span className="rutas-fuentes-ambito">{o.ambito}</span>{" "}
                  {o.enlace ? (
                    <a
                      className="rutas-fuentes-enlace"
                      href={o.enlace}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ficha y acceso ↗
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </details>
  );
}
