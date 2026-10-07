import { useState } from "react";
import { Link } from "react-router-dom";
import ModalBase from "../components/ModalBase";
import ChatRutasDelAlma from "./ChatRutasDelAlma";
import FuentesYBibliografia from "./FuentesYBibliografia";
import { OBRAS_ACADEMICAS } from "./fuentesRutasDelAlma";
import "./rutasDelAlma.css";

type EntradaRuta = {
  icono: string;
  titulo: string;
  descripcion: string;
  path: string;
};

/**
 * Índice de la sección «Rutas del Alma»: contenido y conocimiento espiritual.
 * Las futuras entradas (rituales, artículos…) se añaden aquí.
 */
const ENTRADAS: EntradaRuta[] = [
  {
    icono: "✡️",
    titulo: "La Cábala",
    descripcion: "Qué es, su origen, el Árbol de la Vida y las 10 Sefirot: una introducción clara a su simbolismo.",
    path: "/rutas-del-alma/cabala"
  },
  {
    icono: "✨",
    titulo: "Los 72 Nombres de Dios",
    descripcion: "Setenta y dos combinaciones de tres letras hebreas: su origen, su tradición y su lectura contemplativa.",
    path: "/rutas-del-alma/72-nombres"
  }
];

/** Icono de la tarjeta «Chat de Cábala»: burbuja de conversación con la estrella de 4 puntas MAIKA. */
const iconoChat = (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>
    <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2h9A3.5 3.5 0 0 1 20 5.5v7a3.5 3.5 0 0 1-3.5 3.5H11l-4.6 4.1a.6.6 0 0 1-1-.45V16A3.5 3.5 0 0 1 4 12.5z" transform="translate(0,-0.5)" />
    <path d="M12 5.6c.36 1.5 1.24 2.38 2.75 2.75-1.51.37-2.39 1.25-2.75 2.75-.36-1.5-1.24-2.38-2.75-2.75 1.51-.37 2.39-1.25 2.75-2.75z" fill="currentColor" stroke="none" />
  </svg>
);

export default function RutasDelAlmaPage() {
  const [chatAbierto, setChatAbierto] = useState(false);

  return (
    <div className="inicio-page rutas-del-alma-page">
      <div className="inicio-bloques-texto rutas-del-alma-contenido">
        <h2 id="pagina-rutas-del-alma-titulo" className="inicio-seccion-titulo rutas-del-alma-titulo">
          🌿 Rutas del Alma
        </h2>
        <p className="rutas-del-alma-subtitulo">
          Un espacio de conocimiento y reflexión: tradiciones, símbolos y caminos espirituales,
          explicados con calma y sin prisa.
        </p>

        <div className="rutas-del-alma-separador" aria-hidden="true">
          <span className="linea" />
          <span className="estrella">✦</span>
          <span className="linea" />
        </div>

        <div className="rutas-del-alma-lista">
          {ENTRADAS.map((entrada) => (
            <Link key={entrada.path} to={entrada.path} className="rutas-del-alma-tarjeta">
              <span className="rutas-del-alma-tarjeta__icono" aria-hidden="true">{entrada.icono}</span>
              <span>
                <p className="rutas-del-alma-tarjeta__titulo">{entrada.titulo}</p>
                <p className="rutas-del-alma-tarjeta__desc">{entrada.descripcion}</p>
              </span>
              <span className="rutas-del-alma-tarjeta__flecha" aria-hidden="true">→</span>
            </Link>
          ))}

          <button
            type="button"
            className="rutas-del-alma-tarjeta rutas-del-alma-tarjeta--boton"
            onClick={() => setChatAbierto(true)}
          >
            <span className="rutas-del-alma-tarjeta__icono rutas-del-alma-tarjeta__icono--dorado" aria-hidden="true">{iconoChat}</span>
            <span>
              <p className="rutas-del-alma-tarjeta__titulo">Chat de Cábala</p>
              <p className="rutas-del-alma-tarjeta__desc">
                Pregunta y conversa sobre la Cábala, sus símbolos, su historia y sus
                tradiciones.
              </p>
            </span>
            <span className="rutas-del-alma-tarjeta__flecha" aria-hidden="true">→</span>
          </button>
        </div>

        <FuentesYBibliografia
          academicas={[OBRAS_ACADEMICAS.scholem, OBRAS_ACADEMICAS.idel, OBRAS_ACADEMICAS.giller]}
        />

        <div className="rutas-del-alma-nota">
          Rutas del Alma es un espacio divulgativo basado en fuentes tradicionales, históricas y
          estudios académicos. Diferenciamos, siempre que es posible, entre tradición, reconstrucción
          histórica e interpretaciones posteriores.
        </div>
      </div>

      <ModalBase
        abierto={chatAbierto}
        onClose={() => setChatAbierto(false)}
        maxWidth="min(640px, 96vw)"
        classNameOverlay="modal-overlay--flujo-checkout"
        ariaLabelledBy="chat-rutas-titulo"
      >
        <ChatRutasDelAlma />
      </ModalBase>
    </div>
  );
}
