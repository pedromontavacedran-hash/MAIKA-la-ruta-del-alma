import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { CHECKOUT_CONFIG } from "../config/checkoutConfig";
import { SERVICIOS_CONTRATABLES } from "../config/lanzamiento";
import { THEME } from "../config";
import { RUTA_TAROT_EVOLUTIVO } from "./tarotEvolutivoRuta";
import { RUTA_LIMPIEZA_ENERGETICA } from "./limpiezaEnergeticaRuta";
import { RUTA_RITUAL_PERSONALIZADO } from "./ritualPersonalizadoRuta";

const URL_WHATSAPP_CONSULTA = `https://wa.me/${CHECKOUT_CONFIG.whatsappNumber}?text=${encodeURIComponent(
  "Hola Maika, no sé cuál servicio elegir, ¿me puedes orientar?"
)}`;

/** Casos especiales: las 3 tarjetas abren su propia pantalla de opciones. */
function esTarjetaTarotEvolutivo(titulo: string): boolean {
  return /tarot evolutivo/i.test(titulo);
}

function esTarjetaLimpiezaEnergetica(titulo: string): boolean {
  return /limpieza energ/i.test(titulo);
}

function esTarjetaRitualPersonalizado(titulo: string): boolean {
  return /ritual personalizado/i.test(titulo);
}

export default function ServiciosPage() {
  const { serviciosInicio } = useApp();
  const navigate = useNavigate();

  /*
   * Escritorio (≥900px): con las 3 tarjetas compactadas la página ya cabe en pantalla, así que
   * quitamos el scroll de `.app-shell__routes-grow` (ver servicios.css). Solo esta ruta, solo
   * escritorio — en móvil las 3 tarjetas apiladas siguen sin caber y necesitan scroll normal.
   */
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("servicios-no-scroll");
    return () => {
      html.classList.remove("servicios-no-scroll");
    };
  }, []);

  const cerrar = () => {
    // Vuelve atrás si hay historial dentro de la app; si no, a inicio.
    const idx = (window.history.state as { idx?: number } | null)?.idx;
    if (typeof idx === "number" && idx > 0) navigate(-1);
    else navigate("/");
  };

  return (
    <div className="inicio-page servicios-page" style={{ textAlign: "center", color: "inherit" }}>
      <button
        type="button"
        className="servicios-page__cerrar"
        aria-label="Cerrar servicios"
        onClick={cerrar}
      >
        ✕
      </button>
      <header className="servicios-page__intro">
        <h1 id="pagina-servicios-titulo" className="servicios-page__titulo">
          Servicios
        </h1>
        <p className="servicios-page__subtitulo">Elige la experiencia que necesitas para tu camino</p>
      </header>

      <section className="inicio-servicios-bloque servicios-page__bloque-tarjetas" data-maika="services-section" aria-labelledby="pagina-servicios-titulo">
        <div className="inicio-servicios-bloque__grid inicio-servicios-bloque__grid--servicios">
          {serviciosInicio.map((s, idx) => {
            const esTarot = esTarjetaTarotEvolutivo(s.titulo);
            const esLimpieza = !esTarot && esTarjetaLimpiezaEnergetica(s.titulo);
            const esRitual = !esTarot && !esLimpieza && esTarjetaRitualPersonalizado(s.titulo);
            const conOpciones = esTarot || esLimpieza || esRitual;
            const irAOpciones = esTarot
              ? () => navigate(RUTA_TAROT_EVOLUTIVO)
              : esLimpieza
                ? () => navigate(RUTA_LIMPIEZA_ENERGETICA)
                : () => navigate(RUTA_RITUAL_PERSONALIZADO);
            return (
              <div
                key={idx}
                className={`card inicio-servicio-card inicio-servicio-card--pagina-servicios${s.fraseBreve?.trim() ? " inicio-servicio-card--con-frase" : ""}`}
                style={{ display: "flex", flexDirection: "column", minHeight: 250, cursor: conOpciones ? "pointer" : undefined }}
                onClick={conOpciones ? irAOpciones : undefined}
                role={conOpciones ? "button" : undefined}
                tabIndex={conOpciones ? 0 : undefined}
                onKeyDown={
                  conOpciones
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          irAOpciones();
                        }
                      }
                    : undefined
                }
              >
                <h3
                  className="inicio-servicio-titulo"
                  style={{
                    color: THEME.goldMain,
                    fontSize: 18,
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center"
                  }}
                >
                  {s.titulo}
                </h3>
                {/* Se renderiza siempre (vacía si no hay frase) para que la imagen quede
                    a la misma altura en todas las tarjetas — ver servicios.css. */}
                <p className="inicio-servicio-card__frase">{s.fraseBreve?.trim()}</p>
                <img
                  src={s.imagen.startsWith("/") ? s.imagen : `/${s.imagen}`}
                  alt={s.titulo.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim() || `Servicio ${idx + 1}`}
                  width={480}
                  height={276}
                  loading="lazy"
                  decoding="async"
                  style={{ width: "100%", height: 92, objectFit: "cover", borderRadius: 10, border: "1px solid gold", display: "block" }}
                />
                {conOpciones ? null : (
                  <>
                    <p className="inicio-servicio-duracion" style={{ color: "white", fontSize: 14, textAlign: "center" }}>{s.duracion}</p>
                    <p className="inicio-servicio-precio-linea" style={{ color: THEME.goldMain, fontSize: 18, fontWeight: "bold", textAlign: "center" }}>{SERVICIOS_CONTRATABLES ? s.precio : "Próximamente"}</p>
                  </>
                )}
                {conOpciones ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      irAOpciones();
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      marginTop: "auto",
                      padding: "8px 16px",
                      background: THEME.goldGradient,
                      color: THEME.bg,
                      fontSize: 16,
                      fontWeight: "bold",
                      textAlign: "center",
                      borderRadius: 20,
                      border: `1px solid ${THEME.goldMain}`,
                      cursor: "pointer"
                    }}
                  >
                    Ver opciones
                  </button>
                ) : !SERVICIOS_CONTRATABLES ? null : (
                  <a
                    href={s.urlWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      width: "100%",
                      marginTop: "auto",
                      padding: "8px 16px",
                      background: THEME.goldGradient,
                      color: THEME.bg,
                      fontSize: 16,
                      fontWeight: "bold",
                      textAlign: "center",
                      borderRadius: 20,
                      textDecoration: "none",
                      border: `1px solid ${THEME.goldMain}`,
                      cursor: "pointer"
                    }}
                  >
                    {s.textoBoton}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <footer className="servicios-page__cierre">
        <p className="servicios-page__cierre-texto">Si no sabes cuál elegir, puedo ayudarte personalmente</p>
        <a
          className="servicios-page__cierre-cta"
          href={URL_WHATSAPP_CONSULTA}
          target="_blank"
          rel="noopener noreferrer"
        >
          Consultar por WhatsApp
        </a>
      </footer>
    </div>
  );
}
