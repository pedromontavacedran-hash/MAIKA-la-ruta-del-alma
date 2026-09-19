import { useEffect } from "react";
import InicioDesplegablesBloques from "../components/inicio/InicioDesplegablesBloques";
import "./ritualDelMes.css";

export default function RitualDelMesPage() {
  /*
   * Marca la ruta /ritual-del-mes en <html> para que ritualDelMes.css pueda ajustar solo
   * esta página (aire superior + tarjetas algo más compactas) sin tocar /testimonios,
   * que reutiliza los mismos bloques. El scroll vertical con rueda queda activo.
   */
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("ritual-del-mes-page");
    return () => {
      html.classList.remove("ritual-del-mes-page");
    };
  }, []);

  return <InicioDesplegablesBloques />;
}
