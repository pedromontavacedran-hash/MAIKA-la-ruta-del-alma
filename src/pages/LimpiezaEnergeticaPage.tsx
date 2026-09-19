import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CHECKOUT_CONFIG } from "../config/checkoutConfig";
import { THEME } from "../config";
import { PATH_BY_PAGINA } from "../app/routing/routeMaps";
import { getMaikaScrollPortEl } from "../utils/maikaScrollPort";
import "./limpiezaEnergetica.css";

type PasoLimpieza = {
  /** Opcional: paso con icono + título + texto (opción «Profunda»). */
  icono?: string;
  titulo?: string;
  texto: string;
};

type OpcionLimpieza = {
  nombre: string;
  duracion: string;
  precio: number;
  /** WebP servida desde /servicios/ (original PNG en originales/servicios/). */
  imagen: string;
  /** Frase corta que se muestra en la tarjeta del grid. */
  descripcion: string;
  /** Texto amplio del detalle: para quién está pensada y qué se trabaja. */
  descripcionLarga: string;
  /** «¿Qué incluye?» — pasos de la sesión. */
  incluye: PasoLimpieza[];
};

/*
 * Opciones de «Limpieza Energética Personal» — PROVISIONALES, pendientes de revisión
 * para adaptarlas al ritual real de MAIKA. Misma estructura/estética que
 * TarotEvolutivoPage (4 tarjetas, grid 2×2 escritorio, 1 columna móvil, WhatsApp).
 */
const OPCIONES_LIMPIEZA: OpcionLimpieza[] = [
  {
    nombre: "✨ Limpieza Energética",
    duracion: "60 min aprox.",
    precio: 50,
    imagen: "/servicios/limpieza-energetica.webp",
    descripcion: "Para renovar y armonizar tu energía.",
    descripcionLarga:
      "Para quien busca un espacio de pausa, renovación y armonización dentro de un ritual personal.",
    incluye: [
      { icono: "🌿", texto: "Acogida y breve conversación inicial para conocer el momento de la persona." },
      { icono: "🕯️", texto: "Preparación y apertura del ritual." },
      { icono: "✨", texto: "Limpieza energética mediante elementos rituales adecuados a la sesión." },
      { icono: "💫", texto: "Trabajo de armonización." },
      { icono: "🌙", texto: "Cierre del ritual." },
      { icono: "🌸", texto: "Recomendaciones finales para integrar la experiencia." }
    ]
  },
  {
    nombre: "🌿 Limpieza + Armonización",
    duracion: "90 min aprox.",
    precio: 65,
    imagen: "/servicios/limpieza-armonizacion.webp",
    descripcion: "Un trabajo más completo para armonizar tu energía.",
    descripcionLarga:
      "Una experiencia más completa que combina limpieza y armonización dentro del ritual.",
    incluye: [
      { icono: "🌿", texto: "Acogida y valoración inicial." },
      { icono: "🕯️", texto: "Preparación y apertura del ritual." },
      { icono: "✨", texto: "Limpieza energética personal." },
      { icono: "💫", texto: "Armonización energética." },
      { icono: "🌙", texto: "Trabajo de equilibrio y armonización." },
      { icono: "🔮", texto: "Cierre del ritual." },
      { icono: "🌸", texto: "Recomendaciones finales." }
    ]
  },
  {
    nombre: "🛡️ Limpieza + Protección",
    duracion: "1–2 h aprox.",
    precio: 75,
    imagen: "/servicios/limpieza-proteccion.webp",
    descripcion: "Limpieza, armonización y cierre del ritual.",
    descripcionLarga:
      "Una experiencia que amplía la limpieza energética incorporando una fase específica de protección y cierre. Pensada para quien desea reforzar simbólicamente su energía tras la limpieza, con recomendaciones para continuar el cuidado personal después de la sesión.",
    incluye: [
      { icono: "🌿", texto: "Acogida y valoración inicial." },
      { icono: "🕯️", texto: "Preparación y apertura." },
      { icono: "✨", texto: "Limpieza energética personal." },
      { icono: "💫", texto: "Armonización." },
      { icono: "🛡️", texto: "Trabajo ritual de protección." },
      { icono: "🔮", texto: "Cierre y sellado simbólico del ritual." },
      { icono: "🌸", texto: "Recomendaciones para mantener una práctica personal de protección." }
    ]
  },
  {
    nombre: "🔥 Limpieza Energética Profunda",
    duracion: "3 horas aprox.",
    precio: 90,
    imagen: "/servicios/limpieza-profunda.webp",
    descripcion: "Una experiencia completa y personalizada.",
    descripcionLarga:
      "La experiencia más completa de las cuatro, pensada como un proceso personalizado y con tiempo suficiente para trabajar diferentes fases del ritual. No es simplemente una sesión más larga: es una experiencia a medida, adaptada al momento y a la intención de cada persona.",
    incluye: [
      {
        icono: "🌿",
        titulo: "Acogida y valoración",
        texto: "Conversación inicial para conocer el momento y la intención de la persona."
      },
      {
        icono: "🕯️",
        titulo: "Preparación y apertura",
        texto: "Preparación del espacio y apertura del ritual."
      },
      {
        icono: "✨",
        titulo: "Limpieza profunda",
        texto: "Limpieza profunda mediante los elementos rituales que forman parte del método de MAIKA."
      },
      {
        icono: "💫",
        titulo: "Armonización",
        texto: "Trabajo de armonización y equilibrio energético."
      },
      {
        icono: "🛡️",
        titulo: "Protección y cierre",
        texto: "Fase final de protección y cierre simbólico del ritual."
      },
      {
        icono: "🌙",
        titulo: "Integración",
        texto: "Tiempo final para explicar la experiencia y ofrecer recomendaciones."
      }
    ]
  }
];

function urlWhatsAppOpcion(o: OpcionLimpieza): string {
  const mensaje = `Hola MAIKA, estoy interesada/o en la opción ${o.nombre} de Limpieza Energética Personal (${o.duracion}, ${o.precio} €). Me gustaría recibir información para reservar.`;
  return `https://wa.me/${CHECKOUT_CONFIG.whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
}

export default function LimpiezaEnergeticaPage() {
  const navigate = useNavigate();
  const [opcionDetalle, setOpcionDetalle] = useState<OpcionLimpieza | null>(null);

  /*
   * Escritorio (≥900px): tanto el grid como cada ficha caben enteros en pantalla,
   * así que se quita el scroll de `.app-shell__routes-grow` — misma técnica que
   * `servicios-no-scroll` en /servicios. El detalle usa CSS compacto para caber.
   * En móvil el scroll sigue activo (el contenido apilado no cabe en pantalla).
   */
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("limpieza-energetica-no-scroll");
    return () => {
      html.classList.remove("limpieza-energetica-no-scroll");
    };
  }, []);

  /* Al abrir un detalle (o volver al grid), subir al inicio del scrollport. */
  useEffect(() => {
    const port = getMaikaScrollPortEl();
    if (port) port.scrollTop = 0;
    window.scrollTo(0, 0);
  }, [opcionDetalle]);

  if (opcionDetalle != null) {
    const o = opcionDetalle;
    return (
      <div className="inicio-page limpieza-energetica-page limpieza-energetica-page--detalle" style={{ color: "inherit" }}>
        <article className="limpieza-energetica-detalle card" aria-labelledby="limpieza-detalle-titulo">
          <h1 id="limpieza-detalle-titulo" className="limpieza-energetica-detalle__titulo">
            {o.nombre}
          </h1>
          <img src={o.imagen} alt="" className="limpieza-energetica-detalle__imagen" />
          <p className="limpieza-energetica-detalle__descripcion">{o.descripcionLarga}</p>

          <h2 className="limpieza-energetica-detalle__subtitulo">¿Qué incluye?</h2>
          <ul className="limpieza-energetica-detalle__lista">
            {o.incluye.map((paso, idx) => (
              <li key={idx} className="limpieza-energetica-detalle__paso">
                {paso.titulo != null ? (
                  <span className="limpieza-energetica-detalle__paso-bloque">
                    <span className="limpieza-energetica-detalle__paso-titulo">
                      {paso.icono} {paso.titulo}
                    </span>
                    <span className="limpieza-energetica-detalle__paso-texto">{paso.texto}</span>
                  </span>
                ) : (
                  <span className="limpieza-energetica-detalle__paso-texto">
                    {paso.icono != null ? `${paso.icono} ` : ""}{paso.texto}
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className="limpieza-energetica-detalle__meta">
            <span className="limpieza-energetica-detalle__duracion">{o.duracion}</span>
            <span className="limpieza-energetica-detalle__precio">{o.precio} €</span>
          </div>

          <a
            href={urlWhatsAppOpcion(o)}
            target="_blank"
            rel="noopener noreferrer"
            className="limpieza-energetica-detalle__whatsapp"
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
            className="limpieza-energetica-detalle__volver"
            onClick={() => setOpcionDetalle(null)}
          >
            ← Volver a las opciones
          </button>
        </article>
      </div>
    );
  }

  return (
    <div className="inicio-page limpieza-energetica-page" style={{ textAlign: "center", color: "inherit" }}>
      <header className="limpieza-energetica-page__intro">
        <h1 id="pagina-limpieza-energetica-titulo" className="limpieza-energetica-page__titulo">
          ✨ Limpieza Energética Personal
        </h1>
        <p className="limpieza-energetica-page__subtitulo">Elige la experiencia que necesitas</p>
      </header>

      <section
        className="inicio-servicios-bloque limpieza-energetica-page__bloque-tarjetas"
        data-maika="limpieza-energetica-section"
        aria-labelledby="pagina-limpieza-energetica-titulo"
      >
        <div className="limpieza-energetica-page__grid">
          {OPCIONES_LIMPIEZA.map((o, idx) => (
            <div
              key={idx}
              className="card inicio-servicio-card inicio-servicio-card--limpieza-energetica"
              style={{ display: "flex", flexDirection: "column", minHeight: 220 }}
            >
              <img src={o.imagen} alt="" loading="lazy" className="limpieza-energetica-card__imagen" />
              <h3
                className="inicio-servicio-titulo"
                style={{
                  color: THEME.goldMain,
                  fontSize: 18,
                  textAlign: "center",
                  margin: 0
                }}
              >
                {o.nombre}
              </h3>
              {/* Bloque de altura fija: la descripción absorbe el aire sobrante (flex)
                  y duración + precio quedan clavados a la misma altura en las 4 tarjetas. */}
              <div className="limpieza-energetica-page__meta">
                <p className="limpieza-energetica-page__descripcion">{o.descripcion}</p>
              </div>
              <button
                type="button"
                className="limpieza-energetica-page__ver-detalle"
                style={{ marginTop: "auto" }}
                onClick={() => setOpcionDetalle(o)}
              >
                Ver qué incluye
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer className="limpieza-energetica-page__cierre">
        <button type="button" className="limpieza-energetica-page__volver" onClick={() => navigate(PATH_BY_PAGINA.servicios)}>
          ← Volver a Servicios
        </button>
      </footer>
    </div>
  );
}
