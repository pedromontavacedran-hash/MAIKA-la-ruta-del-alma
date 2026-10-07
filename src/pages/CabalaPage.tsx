import { useRef } from "react";
import { Link } from "react-router-dom";
import FuentesYBibliografia from "./FuentesYBibliografia";
import { OBRAS_ACADEMICAS } from "./fuentesRutasDelAlma";
import "./rutasDelAlma.css";

/** Posiciones de las 10 Sefirot en el Árbol de la Vida (viewBox 300×420, pilares clásicos). */
const SEFIROT: { nombre: string; x: number; y: number; color: string }[] = [
  { nombre: "Kéter", x: 150, y: 34, color: "#f5ecd7" },
  { nombre: "Jojmá", x: 222, y: 96, color: "#7fa7d9" },
  { nombre: "Biná", x: 78, y: 96, color: "#b3b86a" },
  { nombre: "Jesed", x: 222, y: 196, color: "#bcd4ea" },
  { nombre: "Gueburá", x: 78, y: 196, color: "#8e3b3b" },
  { nombre: "Tiféret", x: 150, y: 164, color: "#a8a05c" },
  { nombre: "Nétsaj", x: 222, y: 296, color: "#d98aa0" },
  { nombre: "Hod", x: 78, y: 296, color: "#b05f7c" },
  { nombre: "Yesod", x: 150, y: 332, color: "#b98a4e" },
  { nombre: "Maljut", x: 150, y: 396, color: "#3d5a8f" }
];

/** Los 22 senderos tradicionales que unen las Sefirot (índices de SEFIROT). */
const SENDEROS: [number, number][] = [
  [0, 1], [0, 2], [0, 5],
  [1, 2], [1, 5], [1, 3],
  [2, 5], [2, 4],
  [3, 4], [3, 5], [3, 6],
  [4, 5], [4, 7],
  [5, 6], [5, 7], [5, 8],
  [6, 7], [6, 8], [6, 9],
  [7, 8], [7, 9],
  [8, 9]
];

const SEFIROT_DETALLE: { nombre: string; significado: string }[] = [
  { nombre: "Kéter — Corona", significado: "la voluntad primera, el origen puro del que todo procede." },
  { nombre: "Jojmá — Sabiduría", significado: "el destello inicial de la sabiduría, la intuición antes de tomar forma." },
  { nombre: "Biná — Entendimiento", significado: "la forma que da estructura a la sabiduría, el principio receptivo." },
  { nombre: "Jesed — Misericordia", significado: "la expansión, la generosidad y el amor que se entrega." },
  { nombre: "Gueburá — Rigor", significado: "la fuerza que pone límites, la disciplina y la justicia." },
  { nombre: "Tiféret — Belleza", significado: "el corazón del Árbol: equilibrio, armonía y compasión." },
  { nombre: "Nétsaj — Victoria", significado: "la perseverancia, la resistencia y la fuerza que sostiene." },
  { nombre: "Hod — Esplendor", significado: "la mente racional, la palabra y la forma del pensamiento." },
  { nombre: "Yesod — Fundamento", significado: "el canal que reúne todas las energías y las hace descender." },
  { nombre: "Maljut — Reino", significado: "la manifestación: lo que finalmente se hace realidad en el mundo." }
];

function SeparadorSeccion() {
  return (
    <div className="rutas-del-alma-separador" aria-hidden="true">
      <span className="linea" />
      <span className="estrella">✦</span>
      <span className="linea" />
    </div>
  );
}

export default function CabalaPage() {
  const destinoRef = useRef<{ el: HTMLElement; timer: number } | null>(null);

  /** Pulsar una Sefirá del Árbol: scroll suave a su ficha + parpadeo suave de destino (~40 s). */
  const irASefira = (i: number) => {
    const el = document.getElementById(`sefira-${i}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (destinoRef.current) {
      window.clearTimeout(destinoRef.current.timer);
      destinoRef.current.el.classList.remove("sefira-destino");
    }
    el.classList.add("sefira-destino");
    destinoRef.current = {
      el,
      timer: window.setTimeout(() => {
        el.classList.remove("sefira-destino");
        destinoRef.current = null;
      }, 41000)
    };
  };

  return (
    <div className="inicio-page rutas-del-alma-page">
      <div className="inicio-bloques-texto rutas-del-alma-contenido">
        <h2 id="pagina-cabala-titulo" className="inicio-seccion-titulo rutas-del-alma-titulo">
          ✡️ La Cábala
        </h2>
        <p className="rutas-del-alma-subtitulo">
          Una de las grandes tradiciones de sabiduría espiritual: un mapa simbólico
          para entender el universo y a nosotros mismos.
        </p>

        <div className="rutas-del-alma-texto">
          <h3 className="rutas-del-alma-seccion-titulo">✦ ¿Qué es la Cábala?</h3>
          <p>
            La <strong>Cábala</strong> (del hebreo <em>Qabbalah</em>, «recibir» o «tradición») es la corriente
            mística y esotérica del judaísmo. Más que una doctrina cerrada, es una forma de <strong>leer la
            realidad</strong>: entiende que detrás de lo visible existe una estructura profunda que puede
            comprenderse a través del símbolo, la meditación y el estudio.
          </p>
          <p>
            Su propósito no es acumular conocimiento, sino <strong>transformar a quien estudia</strong>:
            acercar al ser humano a una comprensión más amplia de sí mismo y de su lugar en el mundo.
          </p>

          <h3 className="rutas-del-alma-seccion-titulo">✦ Origen y contexto</h3>
          <p>
            La Cábala hunde sus raíces en antiguas tradiciones místicas judías y se desarrolla como
            corriente diferenciada durante la Edad Media. El <strong>Zóhar</strong> («Libro del Esplendor»),
            aparecido en la España del siglo XIII, se convirtió en uno de sus textos fundamentales:
            tradicionalmente se atribuyó a <em>Shimon bar Yojai</em>, mientras que la investigación moderna
            lo relaciona principalmente con <em>Moisés de León</em> y los círculos de su época.
            Desde entonces, la Cábala ha dialogado con la filosofía, el hermetismo y otras tradiciones
            espirituales.
          </p>
          <p>
            Con el tiempo trascendió su marco original y hoy se estudia también como un
            <strong> sistema universal de símbolos</strong>: una manera de ordenar preguntas esenciales —
            quiénes somos, de dónde venimos, hacia dónde vamos.
          </p>
        </div>

        <SeparadorSeccion />

        <h3 className="rutas-del-alma-seccion-titulo">✦ El Árbol de la Vida</h3>
        <div className="rutas-del-alma-texto">
          <p>
            El símbolo central de la Cábala es el <strong>Árbol de la Vida</strong> (<em>Etz Jaim</em>).
            Una de las representaciones más conocidas muestra <strong>diez Sefirot</strong> relacionadas
            mediante veintidós senderos, asociados tradicionalmente a las letras del alfabeto hebreo.
            Representa, a la vez, el proceso por el que lo divino se manifiesta en el mundo y el mapa
            interior del ser humano.
          </p>
        </div>

        <svg
          className="rutas-del-alma-arbol"
          viewBox="0 0 300 420"
          role="img"
          aria-label="Diagrama del Árbol de la Vida con las diez Sefirot"
        >
          {SENDEROS.map(([a, b]) => (
            <line
              key={`${a}-${b}`}
              x1={SEFIROT[a].x}
              y1={SEFIROT[a].y}
              x2={SEFIROT[b].x}
              y2={SEFIROT[b].y}
              stroke="rgba(212, 175, 55, 0.35)"
              strokeWidth="1.2"
            />
          ))}
          {SEFIROT.map((s, i) => (
            <g
              key={s.nombre}
              role="button"
              tabIndex={0}
              aria-label={`Ir a ${s.nombre}`}
              onClick={() => irASefira(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  irASefira(i);
                }
              }}
            >
              <circle
                cx={s.x}
                cy={s.y}
                r="15"
                fill="rgba(27, 23, 69, 0.9)"
                stroke="#d4af37"
                strokeWidth="1.6"
              />
              <circle className="sefira-halo" cx={s.x} cy={s.y} r="13" fill={s.color} opacity="0.14" />
              <circle cx={s.x} cy={s.y} r="4.5" fill={s.color} />
              <text x={s.x} y={s.y - 22} textAnchor="middle">{s.nombre}</text>
            </g>
          ))}
        </svg>

        <h3 className="rutas-del-alma-seccion-titulo">✦ Las 10 Sefirot</h3>
        <div className="rutas-del-alma-texto">
          <p>
            Cada Sefirá es una cualidad, una energía o un estado de conciencia. Juntas describen
            el descenso de lo infinito hacia lo concreto — y el camino de regreso. Las descripciones
            que siguen son claves de lectura inspiradas en la tradición, no definiciones cerradas:
            el sentido de cada Sefirá varía según la obra y la época.
          </p>
        </div>
        <ol className="rutas-del-alma-sefirot">
          {SEFIROT_DETALLE.map((s, i) => (
            <li key={s.nombre} id={`sefira-${i}`}>
              <span className="num" aria-hidden="true">{i + 1}.</span>
              <span>
                <span className="nombre">{s.nombre}</span>
                <span className="significado"> — {s.significado}</span>
              </span>
            </li>
          ))}
        </ol>

        <SeparadorSeccion />

        <h3 className="rutas-del-alma-seccion-titulo">✦ Conceptos básicos</h3>
        <div className="rutas-del-alma-texto">
          <p>
            <strong>Ein Sof</strong> («sin fin») es lo infinito e incognoscible, aquello que está más allá
            de toda definición. Las Sefirot son la manera en que esa infinitud se hace comprensible.
          </p>
          <p>
            <strong>Los cuatro mundos</strong> describen niveles de existencia, de lo más sutil a lo más
            material: <em>Atsilut</em> (emanación), <em>Beriah</em> (creación), <em>Yetzirah</em> (formación)
            y <em>Asiyah</em> (acción).
          </p>
          <p>
            <strong>Los veintidós senderos</strong> que unen las Sefirot se asocian a las letras del
            alfabeto hebreo: cada sendero es una experiencia, una lección o un pasaje interior.
          </p>

          <h3 className="rutas-del-alma-seccion-titulo">✦ Su simbolismo</h3>
          <p>
            Hasta aquí, la tradición. Desde MAIKA lo miramos además como un espejo: cada Sefirá habla
            de algo que también existe en nosotros — la inspiración de Jojmá, el orden de Biná, el
            equilibrio de Tiféret, la acción de Maljut. La Cábala propone que comprender el mundo
            empieza por <strong>comprenderse a uno mismo</strong>, y que ambos caminos, en el fondo,
            son el mismo.
          </p>
        </div>

        <FuentesYBibliografia
          tradicionales={[
            "Zóhar",
            "tradición cabalística medieval (Provenza, Gerona, Castilla)"
          ]}
          academicas={[OBRAS_ACADEMICAS.scholem, OBRAS_ACADEMICAS.idel]}
        />

        <div className="rutas-del-alma-nota">
          Este contenido forma parte de <strong>Rutas del Alma</strong>: un espacio de MAIKA dedicado al
          conocimiento espiritual, compartido como introducción e invitación a la reflexión.
        </div>

        <p style={{ textAlign: "center", marginTop: 28 }}>
          <Link to="/rutas-del-alma" style={{ color: "#d4af37" }}>
            ← Volver a Rutas del Alma
          </Link>
        </p>
      </div>
    </div>
  );
}
