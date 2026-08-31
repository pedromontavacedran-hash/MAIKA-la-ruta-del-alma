import { THEME } from "../config";

export default function EnviosPage() {
  return (
    <div className="inicio-page" style={{ textAlign: "center", color: "inherit" }}>
      <div className="inicio-bloques-texto" style={{ maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
        <h2
          id="pagina-envios-titulo"
          className="inicio-seccion-titulo"
          style={{
            fontSize: "clamp(22px, 3.5vw, 28px)",
            marginBottom: 16,
            color: THEME.goldMain,
            fontWeight: "bold",
            scrollMarginTop: 140,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", transform: "scaleX(-1)" }}>
            <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke={THEME.goldMain} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </span>{" "}
          Envíos e información
        </h2>
        <p className="card inicio-card-texto">
          Envíos a toda España. Plazos y condiciones según destino. Para consultas de envío, devoluciones o pedidos, escríbenos por WhatsApp.
        </p>
      </div>
    </div>
  );
}
