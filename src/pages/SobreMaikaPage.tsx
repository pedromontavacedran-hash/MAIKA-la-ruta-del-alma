import { THEME } from "../config";

export default function SobreMaikaPage() {
  return (
    <div className="inicio-page" style={{ textAlign: "center", color: "inherit" }}>
      <div className="inicio-bloques-texto" style={{ maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
        <h2
          id="pagina-sobre-maika-titulo"
          className="inicio-seccion-titulo"
          style={{ fontSize: "clamp(22px, 3.5vw, 28px)", marginBottom: 16, color: THEME.goldMain, fontWeight: "bold", scrollMarginTop: 140 }}
        >
          🌙 Sobre Maika
        </h2>
        <p className="card inicio-card-texto">
          Maika es tu espacio de magia y bienestar. Ofrecemos productos para rituales, velas, inciensos y figuras, además de servicios como tarot evolutivo, limpieza energética y rituales personalizados. Conecta con tu esencia.
        </p>
      </div>
    </div>
  );
}
