import { useEffect } from "react";
import { useApp } from "../context/AppContext";
import { CHECKOUT_CONFIG } from "../config/checkoutConfig";
import { THEME } from "../config";

const URL_WHATSAPP_CONSULTA = `https://wa.me/${CHECKOUT_CONFIG.whatsappNumber}?text=${encodeURIComponent(
  "Hola Maika, no sé cuál servicio elegir, ¿me puedes orientar?"
)}`;

export default function ServiciosPage() {
  const { serviciosInicio } = useApp();

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

  return (
    <div className="inicio-page servicios-page" style={{ textAlign: "center", color: "inherit" }}>
      <header className="servicios-page__intro">
        <h1 id="pagina-servicios-titulo" className="servicios-page__titulo">
          Servicios
        </h1>
        <p className="servicios-page__subtitulo">Elige la experiencia que necesitas para tu camino</p>
      </header>

      <section className="inicio-servicios-bloque servicios-page__bloque-tarjetas" data-maika="services-section" aria-labelledby="pagina-servicios-titulo">
        <div className="inicio-servicios-bloque__grid inicio-servicios-bloque__grid--servicios">
          {serviciosInicio.map((s, idx) => (
            <div
              key={idx}
              className={`card inicio-servicio-card inicio-servicio-card--pagina-servicios${s.fraseBreve?.trim() ? " inicio-servicio-card--con-frase" : ""}`}
              style={{ display: "flex", flexDirection: "column", minHeight: 230 }}
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
              {s.fraseBreve?.trim() ? (
                <p className="inicio-servicio-card__frase">{s.fraseBreve.trim()}</p>
              ) : null}
              <img
                src={s.imagen.startsWith("/") ? s.imagen : `/${s.imagen}`}
                alt={s.titulo.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim() || `Servicio ${idx + 1}`}
                width={480}
                height={276}
                loading="lazy"
                decoding="async"
                style={{ width: "100%", height: 78, objectFit: "cover", borderRadius: 10, border: "1px solid gold", display: "block" }}
              />
              <p className="inicio-servicio-duracion" style={{ color: "white", fontSize: 14, textAlign: "center" }}>{s.duracion}</p>
              <p className="inicio-servicio-precio-linea" style={{ color: THEME.goldMain, fontSize: 18, fontWeight: "bold", textAlign: "center" }}>{s.precio}</p>
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
            </div>
          ))}
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
