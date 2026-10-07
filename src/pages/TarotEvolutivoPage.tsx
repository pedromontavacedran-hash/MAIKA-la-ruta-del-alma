import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CHECKOUT_CONFIG } from "../config/checkoutConfig";
import { SERVICIOS_CONTRATABLES } from "../config/lanzamiento";
import { THEME } from "../config";
import { PATH_BY_PAGINA } from "../app/routing/routeMaps";
import { getMaikaScrollPortEl } from "../utils/maikaScrollPort";
import "./tarotEvolutivo.css";

type PasoTarot = {
  /** Opcional: paso con icono + título + texto. */
  icono?: string;
  titulo?: string;
  texto: string;
};

type ModalidadTarot = {
  nombre: string;
  precio: number;
  /** Frase corta que se muestra en la tarjeta del grid. */
  descripcion: string;
  /** Texto amplio del detalle. */
  descripcionLarga: string;
  /** «¿Qué incluye?» — pasos de la lectura. */
  incluye: PasoTarot[];
};

/*
 * Modalidades de «Tarot Evolutivo» — mismo sistema de navegación y presentación que
 * LimpiezaEnergeticaPage (tarjetas → «Ver qué incluye» → ficha → WhatsApp).
 */
const MODALIDADES_TAROT: ModalidadTarot[] = [
  {
    nombre: "🔮 Tirada de 3 cartas",
    precio: 15,
    descripcion: "Una mirada rápida y clara a tu momento actual: pasado, presente y futuro en tres cartas.",
    descripcionLarga:
      "Una lectura breve y directa para ver con claridad tu momento actual: de dónde vienes, qué está pasando ahora y hacia dónde se mueve la energía.",
    incluye: [
      { icono: "🌿", texto: "Acogida y breve conversación para centrar la consulta." },
      { icono: "🕯️", texto: "Preparación y apertura de la tirada." },
      { icono: "🔮", texto: "Lectura de las 3 cartas: pasado, presente y futuro." },
      { icono: "🌙", texto: "Cierre con orientación para integrar el mensaje." }
    ]
  },
  {
    nombre: "✨ Tirada de un tema en especial",
    precio: 20,
    descripcion: "Profundiza en una pregunta o área concreta de tu vida que necesitas resolver con claridad.",
    descripcionLarga:
      "Una lectura centrada en un área concreta de tu vida — amor, trabajo, decisiones— para mirarla en profundidad y con calma.",
    incluye: [
      { icono: "🌿", texto: "Conversación inicial para delimitar el tema de la consulta." },
      { icono: "🕯️", texto: "Preparación y apertura de la tirada." },
      { icono: "✨", texto: "Tirada centrada en el tema elegido." },
      { icono: "🔮", texto: "Lectura e interpretación de las cartas." },
      { icono: "🌙", texto: "Cierre con orientación." }
    ]
  },
  {
    nombre: "🌙 Tirada general",
    precio: 25,
    descripcion: "Una lectura amplia de tu situación: amor, trabajo, energía y lo que se mueve a tu alrededor.",
    descripcionLarga:
      "Una lectura amplia de tu situación actual: amor, trabajo, energía y lo que se mueve a tu alrededor, para tener una visión de conjunto.",
    incluye: [
      { icono: "🌿", texto: "Acogida y valoración inicial." },
      { icono: "🕯️", texto: "Preparación y apertura de la tirada." },
      { icono: "🌙", texto: "Tirada general completa." },
      { icono: "🔮", texto: "Lectura por áreas de tu vida." },
      { icono: "🌸", texto: "Cierre con orientación y recomendaciones." }
    ]
  },
  {
    nombre: "🔮 Lectura completa",
    precio: 35,
    descripcion: "La experiencia más profunda: un recorrido completo por tu presente y tu camino, con tiempo para todas tus preguntas.",
    descripcionLarga:
      "La experiencia más completa: un recorrido por tu presente y tu camino, con tiempo suficiente para todas tus preguntas y para integrar lo que las cartas muestran.",
    incluye: [
      { icono: "🌿", texto: "Acogida y valoración para conocer tu momento." },
      { icono: "🕯️", texto: "Preparación y apertura de la lectura." },
      { icono: "🔮", texto: "Lectura completa del tarot." },
      { icono: "✨", texto: "Espacio para tus preguntas." },
      { icono: "🌙", texto: "Cierre e integración de la experiencia." }
    ]
  }
];

function urlWhatsAppModalidad(m: ModalidadTarot): string {
  const mensaje = `Hola, estoy interesada/o en:\n\n${m.nombre} de Tarot Evolutivo\n\nPrecio: ${m.precio} €\n\nMe gustaría consultar para reservar.`;
  return `https://wa.me/${CHECKOUT_CONFIG.whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
}

export default function TarotEvolutivoPage() {
  const navigate = useNavigate();
  const [modalidadDetalle, setModalidadDetalle] = useState<ModalidadTarot | null>(null);

  /*
   * Escritorio (≥900px): tanto el grid como cada ficha caben enteros en pantalla,
   * así que se quita el scroll de `.app-shell__routes-grow` — misma técnica que
   * `limpieza-energetica-no-scroll` y `servicios-no-scroll`. En móvil el scroll
   * sigue activo (el contenido apilado no cabe en pantalla).
   */
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("tarot-evolutivo-no-scroll");
    return () => {
      html.classList.remove("tarot-evolutivo-no-scroll");
    };
  }, []);

  /* Al abrir una ficha (o volver al grid), subir al inicio del scrollport. */
  useEffect(() => {
    const port = getMaikaScrollPortEl();
    if (port) port.scrollTop = 0;
    window.scrollTo(0, 0);
  }, [modalidadDetalle]);

  if (modalidadDetalle != null) {
    const m = modalidadDetalle;
    return (
      <div className="inicio-page tarot-evolutivo-page tarot-evolutivo-page--detalle" style={{ color: "inherit" }}>
        <article className="tarot-evolutivo-detalle card" aria-labelledby="tarot-detalle-titulo">
          <h1 id="tarot-detalle-titulo" className="tarot-evolutivo-detalle__titulo">
            {m.nombre}
          </h1>
          <p className="tarot-evolutivo-detalle__descripcion">{m.descripcionLarga}</p>

          <h2 className="tarot-evolutivo-detalle__subtitulo">¿Qué incluye?</h2>
          <ul className="tarot-evolutivo-detalle__lista">
            {m.incluye.map((paso, idx) => (
              <li key={idx} className="tarot-evolutivo-detalle__paso">
                {paso.titulo != null ? (
                  <span className="tarot-evolutivo-detalle__paso-bloque">
                    <span className="tarot-evolutivo-detalle__paso-titulo">
                      {paso.icono} {paso.titulo}
                    </span>
                    <span className="tarot-evolutivo-detalle__paso-texto">{paso.texto}</span>
                  </span>
                ) : (
                  <span className="tarot-evolutivo-detalle__paso-texto">
                    {paso.icono != null ? `${paso.icono} ` : ""}{paso.texto}
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className="tarot-evolutivo-detalle__meta">
            <span className="tarot-evolutivo-detalle__precio">{SERVICIOS_CONTRATABLES ? `${m.precio} €` : "Próximamente"}</span>
          </div>

          {SERVICIOS_CONTRATABLES && (
          <a
            href={urlWhatsAppModalidad(m)}
            target="_blank"
            rel="noopener noreferrer"
            className="tarot-evolutivo-detalle__whatsapp"
            style={{
              display: "block",
              width: "100%",
              padding: "10px 16px",
              background: THEME.goldGradient,
              color: THEME.bg,
              fontSize: 16,
              fontWeight: "bold",
              textAlign: "center",
              borderRadius: 20,
              textDecoration: "none",
              border: `1px solid ${THEME.goldMain}`,
              cursor: "pointer",
              boxSizing: "border-box"
            }}
          >
            Consultar por WhatsApp
          </a>
          )}

          <button
            type="button"
            className="tarot-evolutivo-detalle__volver"
            onClick={() => setModalidadDetalle(null)}
          >
            ← Volver a las opciones
          </button>
        </article>
      </div>
    );
  }

  return (
    <div className="inicio-page tarot-evolutivo-page" style={{ textAlign: "center", color: "inherit" }}>
      <header className="tarot-evolutivo-page__intro">
        <h1 id="pagina-tarot-evolutivo-titulo" className="tarot-evolutivo-page__titulo">
          🔮 Tarot Evolutivo
        </h1>
        <p className="tarot-evolutivo-page__subtitulo">Elige la modalidad de lectura que necesitas</p>
      </header>

      <section
        className="inicio-servicios-bloque tarot-evolutivo-page__bloque-tarjetas"
        data-maika="tarot-evolutivo-section"
        aria-labelledby="pagina-tarot-evolutivo-titulo"
      >
        <div className="tarot-evolutivo-page__grid">
          {MODALIDADES_TAROT.map((m, idx) => (
            <div
              key={idx}
              className="card inicio-servicio-card inicio-servicio-card--tarot-evolutivo"
              style={{ display: "flex", flexDirection: "column", minHeight: 220 }}
            >
              <h3
                className="inicio-servicio-titulo"
                style={{
                  color: THEME.goldMain,
                  fontSize: 18,
                  textAlign: "center",
                  margin: 0
                }}
              >
                {m.nombre}
              </h3>
              {/* Bloque de altura fija: la descripción absorbe el aire sobrante (flex)
                  y queda centrada en él — duración/precio solo en la ficha. */}
              <div className="tarot-evolutivo-page__meta">
                <p className="tarot-evolutivo-page__descripcion">{m.descripcion}</p>
              </div>
              <button
                type="button"
                className="tarot-evolutivo-page__ver-detalle"
                style={{ marginTop: "auto" }}
                onClick={() => setModalidadDetalle(m)}
              >
                Ver qué incluye
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer className="tarot-evolutivo-page__cierre">
        <button type="button" className="tarot-evolutivo-page__volver" onClick={() => navigate(PATH_BY_PAGINA.servicios)}>
          ← Volver a Servicios
        </button>
      </footer>
    </div>
  );
}
