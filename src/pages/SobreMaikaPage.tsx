import "./sobreMaika.css";

function SeparadorSeccion() {
  return (
    <div className="sobre-maika-separador" aria-hidden="true">
      <span className="linea" />
      <span className="estrella">✦</span>
      <span className="linea" />
    </div>
  );
}

export default function SobreMaikaPage() {
  return (
    <div className="inicio-page sobre-maika-page">
      <div className="sobre-maika-pergamino">
        <div className="sobre-maika-deco" aria-hidden="true">
          <span className="estrella">✦</span>
          <span className="luna">☾</span>
          <span className="estrella">✦</span>
        </div>

        <h2 id="pagina-sobre-maika-titulo" className="inicio-seccion-titulo sobre-maika-titulo">
          🌙 ¿Quién es MAIKA?
        </h2>
        <div className="sobre-maika-texto">
          <p>
            MAIKA no nació como una simple tienda ni como un personaje creado para vender productos. La idea que fuimos
            construyendo es la de una mujer, un camino y muchas cosas por aprender.
          </p>
          <p>
            MAIKA es Carmen, una mujer hecha a sí misma desde joven, con un recorrido de experiencias difíciles y
            aprendizajes que hoy forman parte de su manera de entender la vida.
          </p>
          <p>
            Desde pequeña tuvo una sensibilidad y una atracción hacia lo espiritual y lo esotérico. Hubo un momento en que
            se alejó de ese mundo, pero años después volvió a acercarse a él desde otra perspectiva: estudiando,
            aprendiendo y buscando comprender, no simplemente creyendo.
          </p>
          <p>Y aquí hay algo que definimos muy claramente:</p>
          <p>
            <strong>MAIKA no se presenta como médium ni como vidente.</strong>
          </p>
          <p>
            Trabaja con las cartas, la intuición, los símbolos y aquello que va aprendiendo de las diferentes tradiciones.
            Su manera de acercarse al Tarot es propia, pero siempre desde el estudio, el respeto y la humildad.
          </p>
        </div>

        <SeparadorSeccion />

        <h3 className="inicio-seccion-titulo sobre-maika-subtitulo">
          🌿 La filosofía de MAIKA
        </h3>
        <div className="sobre-maika-texto">
          <p>Hay una frase que resume muy bien todo lo que hemos construido:</p>
          <p className="sobre-maika-cita">
            «Lo espiritual no es un juego. Es un camino que merece respeto.»
          </p>
          <p>
            Por eso MAIKA no quiere trabajar desde el miedo, el espectáculo ni las falsas promesas.
          </p>
          <p>No pretende decirle a nadie en qué tiene que creer.</p>
          <p>
            Quiere ofrecer un espacio donde cada persona pueda descubrir, aprender, reflexionar y encontrar aquello que
            tenga significado para ella.
          </p>
          <p>Y algo que se ha repetido mucho en nuestro proyecto:</p>
          <p>
            <strong>Sin prisas.</strong>
          </p>
          <p>Que quien llegue a MAIKA no se sienta una clienta más.</p>
          <p>Que pueda sentirse escuchada, respetada y especial.</p>
        </div>

        <SeparadorSeccion />

        <h3 className="inicio-seccion-titulo sobre-maika-subtitulo">
          ✨ Y «Rutas del Alma»
        </h3>
        <div className="sobre-maika-texto">
          <p>El nombre tiene sentido precisamente por eso.</p>
          <p>No existe un único camino espiritual.</p>
          <p>
            Cada persona tiene su propia historia, sus heridas, sus aprendizajes, sus preguntas y su manera de buscar
            respuestas.
          </p>
          <p>
            MAIKA · Rutas del Alma pretende ser un espacio para recorrer esas preguntas juntos, utilizando el Tarot, los
            símbolos, los rituales, los talleres, los productos artesanales y, sobre todo, la experiencia y el
            aprendizaje.
          </p>
          <p>Y hay otra frase que dejamos como firma de la comunidad:</p>
          <p className="sobre-maika-cita">
            «Gracias por formar parte de mi despertar.»
          </p>
        </div>
      </div>
    </div>
  );
}
