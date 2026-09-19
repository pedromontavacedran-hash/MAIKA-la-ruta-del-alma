import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CHECKOUT_CONFIG } from "../config/checkoutConfig";
import { THEME } from "../config";
import { PATH_BY_PAGINA } from "../app/routing/routeMaps";
import { getMaikaScrollPortEl } from "../utils/maikaScrollPort";
import "./ritualPersonalizado.css";

type PasoRitual = {
  icono?: string;
  texto: string;
};

type ModalidadRitual = {
  nombre: string;
  precio: number;
  /** Frase corta que se muestra en la tarjeta del grid. */
  descripcion: string;
  /** Texto amplio del detalle: para quién está pensada y qué se trabaja. */
  descripcionLarga: string;
  /** «¿Qué incluye?» — pasos del ritual. */
  incluye: PasoRitual[];
};

/*
 * Modalidades de «Ritual Personalizado» — confirmadas por MAIKA. No se mencionan
 * técnicas ni elementos concretos (cristales, hierbas, velas, Reiki, chakras,
 * péndulo…) hasta confirmar que forman parte del método real. Misma estructura y
 * estética que LimpiezaEnergeticaPage y TarotEvolutivoPage.
 */
const MODALIDADES_RITUAL: ModalidadRitual[] = [
  {
    nombre: "🌿 Ritual de Renovación",
    precio: 50,
    descripcion: "Para acompañar un cambio, cierre o nuevo comienzo.",
    descripcionLarga:
      "Un ritual pensado para acompañar momentos de cambio, cierre de una etapa o comienzo de un nuevo ciclo. Un espacio para poner intención en aquello que quieres dejar atrás y abrirte simbólicamente a una nueva etapa.",
    incluye: [
      { icono: "🌿", texto: "Definición de la intención que quieres trabajar." },
      { icono: "🕯️", texto: "Preparación y apertura del ritual." },
      { icono: "✨", texto: "Trabajo ritual enfocado en renovación." },
      { icono: "🌙", texto: "Enfoque simbólico en el cierre de una etapa y el comienzo de otra." },
      { icono: "🔮", texto: "Cierre del ritual." }
    ]
  },
  {
    nombre: "✨ Ritual de Armonización",
    precio: 50,
    descripcion: "Para trabajar una intención de equilibrio y armonía personal.",
    descripcionLarga:
      "Un ritual orientado a trabajar una intención de equilibrio y armonía personal. Un espacio creado para detenerte, conectar con tu intención y dedicar un momento consciente a tu bienestar espiritual.",
    incluye: [
      { icono: "🌿", texto: "Definición de la intención." },
      { icono: "🕯️", texto: "Preparación y apertura del ritual." },
      { icono: "✨", texto: "Trabajo ritual de armonización." },
      { icono: "💫", texto: "Enfoque en equilibrio y armonía." },
      { icono: "🔮", texto: "Cierre del ritual." }
    ]
  },
  {
    nombre: "🛡️ Ritual de Protección",
    precio: 50,
    descripcion: "Un ritual enfocado en protección y cierre simbólico.",
    descripcionLarga:
      "Un ritual enfocado en protección y cierre simbólico. Una experiencia pensada para trabajar una intención de protección y finalizar el ritual con un cierre consciente.",
    incluye: [
      { icono: "🌿", texto: "Definición de la intención." },
      { icono: "🕯️", texto: "Preparación y apertura." },
      { icono: "✨", texto: "Preparación del trabajo ritual." },
      { icono: "🛡️", texto: "Trabajo enfocado en protección." },
      { icono: "🔮", texto: "Cierre simbólico del ritual." },
      { icono: "🌙", texto: "Cierre de la experiencia." }
    ]
  },
  {
    nombre: "🔥 Ritual Personalizado",
    precio: 50,
    descripcion: "Un trabajo creado específicamente según tu momento y tu intención.",
    descripcionLarga:
      "Un trabajo creado específicamente según tu momento y tu intención. No todos los caminos son iguales, por eso este ritual parte de aquello que deseas trabajar para preparar una experiencia adaptada a ti.",
    incluye: [
      { icono: "🌿", texto: "Conversación inicial para conocer tu intención." },
      { icono: "✨", texto: "Definición del enfoque del ritual." },
      { icono: "🕯️", texto: "Preparación personalizada." },
      { icono: "🔥", texto: "Realización del ritual adaptado a la intención." },
      { icono: "🌙", texto: "Cierre del ritual." },
      { icono: "💫", texto: "Orientación final para integrar la experiencia." }
    ]
  }
];

function urlWhatsAppModalidad(m: ModalidadRitual): string {
  /* El nombre lleva el icono delante («🌿 Ritual de Renovación»); se quita para el mensaje. */
  const nombreSinIcono = m.nombre.replace(/^[^\p{L}]+/u, "").trim();
  const mensaje = `Hola, me gustaría consultar sobre el ${nombreSinIcono}.`;
  return `https://wa.me/${CHECKOUT_CONFIG.whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
}

export default function RitualPersonalizadoPage() {
  const navigate = useNavigate();
  const [modalidadDetalle, setModalidadDetalle] = useState<ModalidadRitual | null>(null);

  /*
   * Escritorio (≥900px): tanto el grid como cada ficha caben enteros en pantalla,
   * así que se quita el scroll de `.app-shell__routes-grow` — misma técnica que
   * `limpieza-energetica-no-scroll` y `servicios-no-scroll`. El detalle usa CSS
   * compacto para caber. En móvil el scroll sigue activo.
   */
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("ritual-personalizado-no-scroll");
    return () => {
      html.classList.remove("ritual-personalizado-no-scroll");
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
      <div className="inicio-page ritual-personalizado-page ritual-personalizado-page--detalle" style={{ color: "inherit" }}>
        <article className="ritual-personalizado-detalle card" aria-labelledby="ritual-detalle-titulo">
          <h1 id="ritual-detalle-titulo" className="ritual-personalizado-detalle__titulo">
            {m.nombre}
          </h1>
          <p className="ritual-personalizado-detalle__descripcion">{m.descripcionLarga}</p>

          <h2 className="ritual-personalizado-detalle__subtitulo">¿Qué incluye?</h2>
          <ul className="ritual-personalizado-detalle__lista">
            {m.incluye.map((paso, idx) => (
              <li key={idx} className="ritual-personalizado-detalle__paso">
                <span className="ritual-personalizado-detalle__paso-texto">
                  {paso.icono != null ? `${paso.icono} ` : ""}{paso.texto}
                </span>
              </li>
            ))}
          </ul>

          <div className="ritual-personalizado-detalle__meta">
            <span className="ritual-personalizado-detalle__precio">{m.precio} €</span>
          </div>

          <a
            href={urlWhatsAppModalidad(m)}
            target="_blank"
            rel="noopener noreferrer"
            className="ritual-personalizado-detalle__whatsapp"
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

          <button
            type="button"
            className="ritual-personalizado-detalle__volver"
            onClick={() => setModalidadDetalle(null)}
          >
            ← Volver a las opciones
          </button>
        </article>
      </div>
    );
  }

  return (
    <div className="inicio-page ritual-personalizado-page" style={{ textAlign: "center", color: "inherit" }}>
      <header className="ritual-personalizado-page__intro">
        <h1 id="pagina-ritual-personalizado-titulo" className="ritual-personalizado-page__titulo">
          🕯️ Ritual Personalizado
        </h1>
        <p className="ritual-personalizado-page__subtitulo">Elige la experiencia que necesitas</p>
      </header>

      <section
        className="inicio-servicios-bloque ritual-personalizado-page__bloque-tarjetas"
        data-maika="ritual-personalizado-section"
        aria-labelledby="pagina-ritual-personalizado-titulo"
      >
        <div className="ritual-personalizado-page__grid">
          {MODALIDADES_RITUAL.map((m, idx) => (
            <div
              key={idx}
              className="card inicio-servicio-card inicio-servicio-card--ritual-personalizado"
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
                  y el precio queda clavado a la misma altura en las 4 tarjetas. */}
              <div className="ritual-personalizado-page__meta">
                <p className="ritual-personalizado-page__descripcion">{m.descripcion}</p>
                <div className="ritual-personalizado-page__precio-linea">
                  <span className="ritual-personalizado-page__precio">{m.precio} €</span>
                </div>
              </div>
              <button
                type="button"
                className="ritual-personalizado-page__ver-detalle"
                style={{ marginTop: "auto" }}
                onClick={() => setModalidadDetalle(m)}
              >
                Ver qué incluye
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer className="ritual-personalizado-page__cierre">
        <button type="button" className="ritual-personalizado-page__volver" onClick={() => navigate(PATH_BY_PAGINA.servicios)}>
          ← Volver a Servicios
        </button>
      </footer>
    </div>
  );
}
