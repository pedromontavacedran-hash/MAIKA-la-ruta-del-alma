import { useState } from "react";
import { Link } from "react-router-dom";
import ModalBase from "../components/ModalBase";
import FuentesYBibliografia from "./FuentesYBibliografia";
import { OBRAS_ACADEMICAS } from "./fuentesRutasDelAlma";
import { NOMBRES_72, nombreDeLasLetras } from "./nombres72Data";
import "./rutasDelAlma.css";

function SeparadorSeccion() {
  return (
    <div className="rutas-del-alma-separador" aria-hidden="true">
      <span className="linea" />
      <span className="estrella">✦</span>
      <span className="linea" />
    </div>
  );
}

export default function Nombres72Page() {
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const nombre = seleccionado !== null ? NOMBRES_72[seleccionado] : null;

  return (
    <div className="inicio-page rutas-del-alma-page">
      <div className="inicio-bloques-texto rutas-del-alma-contenido">
        <h2 id="pagina-nombres-72-titulo" className="inicio-seccion-titulo rutas-del-alma-titulo">
          ✨ Los 72 Nombres de Dios
        </h2>
        <p className="rutas-del-alma-subtitulo">
          Setenta y dos combinaciones de tres letras hebreas: una de las tradiciones
          más antiguas y contempladas de la mística judía.
        </p>

        <div className="rutas-del-alma-texto">
          <h3 className="rutas-del-alma-seccion-titulo">✦ Qué son</h3>
          <p>
            Los <strong>72 Nombres de Dios</strong> — en la tradición, el <strong>Shem HaMephorash</strong>
            («el Nombre explícito») — son setenta y dos combinaciones de <strong>tres letras hebreas</strong>.
            No son nombres en el sentido habitual, sino secuencias de letras que la tradición considera
            portadoras de un significado profundo: una especie de <strong>alfabeto interior</strong> para
            la meditación y la reflexión.
          </p>

          <h3 className="rutas-del-alma-seccion-titulo">✦ De dónde proceden</h3>
          <p>
            La tradición los deriva de tres versículos concretos del Éxodo (<strong>14:19–21</strong>),
            el relato del cruce del mar. Esos tres versículos contienen exactamente
            <strong> 216 letras hebreas</strong> — 72 en cada uno — y los sabios los escribieron en tres
            filas leídas de forma alterna (directo, inverso, directo), formando 72 columnas de tres letras.
            El procedimiento aparece explicado ya en el <em>Sefer HaBahir</em> (s. XII) y por <em>Rashi</em>,
            y cobró especial importancia en el <em>Sefer Raziel HaMalaj</em>.
          </p>

          <h3 className="rutas-del-alma-seccion-titulo">✦ Su relación con la Cábala</h3>
          <p>
            Los 72 Nombres pertenecen al corazón de la tradición cabalística: se entienden como una
            <strong> expansión del Nombre de cuatro letras</strong> (el Tetragrammaton) y se relacionan
            con las Sefirot y con los senderos del Árbol de la Vida. Algunas corrientes medievales los
            usaban en prácticas de meditación con las letras; la tradición atribuye a estos nombres un
            lugar central en la contemplación cabalística.
          </p>
          <p>
            Siglos después, la tradición cristiano-hermética europea (Reuchlin, <em>De Arte
            Cabalistica</em>, 1517) convirtió los tripletes en <strong>nombres de ángeles</strong>
            añadiéndoles sufijos como «-el» o «-iah», y los asoció a coros angelicales y a versículos
            de los Salmos. Esa capa es posterior y diferente de la tradición judía: aquí la mostramos
            etiquetada como tal, sin mezclar ambas.
          </p>

          <h3 className="rutas-del-alma-seccion-titulo">✦ Contemplar los Nombres</h3>
          <p>
            En la tradición, «trabajar» con un Nombre no es pronunciar una fórmula mágica: es
            <strong> mirar las letras con calma</strong>, dejar que la atención repose en ellas y observar
            qué despiertan. Es una práctica de presencia — parecida a contemplar un símbolo o un
            mandala — más que una técnica con un resultado esperado.
          </p>
          <p>
            Conviene decirlo con claridad: los 72 Nombres son una <strong>tradición espiritual y
            simbólica</strong>, no una herramienta científica, médica ni predictiva, y no ofrecen
            garantías ni resultados medibles. Su valor está en lo que cada persona encuentra al
            detenerse ante ellos.
          </p>

          <h3 className="rutas-del-alma-seccion-titulo">✦ Sobre las interpretaciones</h3>
          <p>
            Cada Nombre ha recibido significados distintos según la época y la escuela: hay
            interpretaciones clásicas, listas modernas con «palabras clave» y enfoques muy diversos.
            Las versiones no siempre coinciden — ni siquiera en alguna letra — y ninguna puede
            presentarse como definitiva. Por eso aquí mostramos las letras y los datos documentados
            de cada tradición, sin atribuirles significados inventados: el sentido, si llega, nace
            de la propia contemplación.
          </p>
        </div>

        <SeparadorSeccion />

        <h3 className="rutas-del-alma-seccion-titulo">✦ Los 72 Nombres</h3>
        <p className="rutas-del-alma-subtitulo" style={{ textAlign: "left", margin: "0 0 14px" }}>
          Las setenta y dos combinaciones, en su orden tradicional. Pulsa cualquiera para ver su ficha.
        </p>

        <ol className="rutas-del-alma-nombres-grid">
          {NOMBRES_72.map((n, i) => (
            <li key={i + 1}>
              <button
                type="button"
                className="rutas-del-alma-nombre"
                onClick={() => setSeleccionado(i)}
                aria-label={`Nombre ${i + 1}: ${n.hebreo}`}
              >
                <span className="num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <span className="sep" aria-hidden="true">·</span>
                <span className="letras" lang="he" dir="rtl">{n.hebreo}</span>
              </button>
            </li>
          ))}
        </ol>

        <FuentesYBibliografia
          tradicionales={[
            "Éxodo 14:19–21",
            "Sefer ha-Bahir",
            "Rashi, comentario a b. Sukkah 45a",
            "Sefer Raziel ha-Malaj",
            "Johannes Reuchlin, De Arte Cabalistica (1517)",
            "Thomas Rudd, tabla hermética (s. XVII)"
          ]}
          academicas={[OBRAS_ACADEMICAS.scholem]}
        />

        <div className="rutas-del-alma-nota">
          <strong>Tradición y reflexión.</strong> Lo anterior describe la tradición cabalística tal como
          se ha transmitido. Desde MAIKA lo compartimos como una invitación a la contemplación: si un
          Nombre te llama la atención, puedes simplemente quedarte un momento con sus letras y observar
          qué te evoca. Forma parte de <strong>Rutas del Alma</strong>, nuestro espacio de conocimiento
          y reflexión — no es doctrina, ni una promesa, ni una técnica.
        </div>

        <p style={{ textAlign: "center", marginTop: 28 }}>
          <Link to="/rutas-del-alma" style={{ color: "#d4af37" }}>
            ← Volver a Rutas del Alma
          </Link>
        </p>
      </div>

      <ModalBase
        abierto={nombre !== null}
        onClose={() => setSeleccionado(null)}
        maxWidth="440px"
        ariaLabelledBy="nombre-72-modal-titulo"
      >
        {nombre && seleccionado !== null ? (
          <div className="rutas-del-alma-ficha">
            <p className="num-grande">{String(seleccionado + 1).padStart(2, "0")}</p>
            <p id="nombre-72-modal-titulo" className="letras-grande" lang="he" dir="rtl">
              {nombre.hebreo}
            </p>

            <dl className="rutas-del-alma-ficha-datos">
              <dt>Las tres letras</dt>
              <dd>
                {nombreDeLasLetras(nombre.hebreo)}
                <span className="rutas-del-alma-ficha-nota">
                  Son letras del alfabeto hebreo, no una palabra con traducción literal.
                </span>
              </dd>

              <dt>Nombre angélico atribuido</dt>
              <dd>
                {nombre.angel}
                <span className="rutas-del-alma-ficha-nota">
                  Tradición cristiano-hermética (Reuchlin, <em>De Arte Cabalistica</em>, 1517),
                  posterior a la Cábala judía: se formó añadiendo al triplete un sufijo divino.
                </span>
              </dd>

              <dt>Coro en esa tradición</dt>
              <dd>{nombre.coro}</dd>

              <dt>Versículo asociado</dt>
              <dd>
                {nombre.versiculo}
                <span className="rutas-del-alma-ficha-nota">
                  Asociación de la tradición hermética (tabla de T. Rudd, s. XVII).
                </span>
              </dd>

              <dt>Significado</dt>
              <dd>
                No existe una traducción única establecida. Las interpretaciones modernas difieren
                entre fuentes; preferimos no atribuir una.
              </dd>
            </dl>

            <p className="rutas-del-alma-ficha-fuentes">
              Fuentes: Éxodo 14:19–21 · Sefer HaBahir · Rashi (Sukkah 45a) · Reuchlin (1517) · T. Rudd (s. XVII)
            </p>
          </div>
        ) : null}
      </ModalBase>
    </div>
  );
}
