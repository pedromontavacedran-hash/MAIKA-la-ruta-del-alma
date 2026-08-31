import { useEffect } from "react";
import InicioDesplegablesBloques from "../components/inicio/InicioDesplegablesBloques";
import "./ritualDelMes.css";

export default function RitualDelMesPage() {
  /*
   * Escritorio (≥900px, mismo corte que servicios.css): el contenido ya cabe en pantalla, así que
   * quitamos el scroll de `.app-shell__routes-grow` (el scroll real de escritorio en toda la app,
   * ver layout-shell.css) y le damos más aire arriba (ver ritualDelMes.css, scopeado bajo esta
   * misma clase). En móvil no se toca: las tarjetas en columna no caben y necesitan scroll.
   */
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("ritual-no-scroll");
    return () => {
      html.classList.remove("ritual-no-scroll");
    };
  }, []);

  return <InicioDesplegablesBloques />;
}
