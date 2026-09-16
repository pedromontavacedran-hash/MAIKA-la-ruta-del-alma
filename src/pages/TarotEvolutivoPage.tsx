import { useNavigate } from "react-router-dom";
import { CHECKOUT_CONFIG } from "../config/checkoutConfig";
import { THEME } from "../config";
import { PATH_BY_PAGINA } from "../app/routing/routeMaps";
import "./tarotEvolutivo.css";

type ModalidadTarot = {
  nombre: string;
  precio: number;
  descripcion: string;
};

const MODALIDADES_TAROT: ModalidadTarot[] = [
  {
    nombre: "Tirada de 3 cartas",
    precio: 15,
    descripcion: "Una mirada rápida y clara a tu momento actual: pasado, presente y futuro en tres cartas."
  },
  {
    nombre: "Tirada general",
    precio: 25,
    descripcion: "Una lectura amplia de tu situación: amor, trabajo, energía y lo que se mueve a tu alrededor."
  },
  {
    nombre: "Tirada sobre un tema",
    precio: 20,
    descripcion: "Profundiza en una pregunta o área concreta de tu vida que necesitas resolver con claridad."
  },
  {
    nombre: "Lectura completa",
    precio: 35,
    descripcion: "La experiencia más profunda: un recorrido completo por tu presente y tu camino, con tiempo para todas tus preguntas."
  }
];

function urlWhatsAppModalidad(m: ModalidadTarot): string {
  const mensaje = `Hola MAIKA, estoy interesada/o en la ${m.nombre} de Tarot Evolutivo de ${m.precio} €. Me gustaría recibir información para reservar.`;
  return `https://wa.me/${CHECKOUT_CONFIG.whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
}

export default function TarotEvolutivoPage() {
  const navigate = useNavigate();

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
              <p className="tarot-evolutivo-page__descripcion">{m.descripcion}</p>
              <p
                className="inicio-servicio-precio-linea"
                style={{ color: THEME.goldMain, fontSize: 18, fontWeight: "bold", textAlign: "center", margin: 0 }}
              >
                {m.precio} €
              </p>
              <a
                href={urlWhatsAppModalidad(m)}
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
                Consultar por WhatsApp
              </a>
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
