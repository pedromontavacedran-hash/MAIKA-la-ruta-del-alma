import Tienda from "../Tienda";
import { useApp } from "../context/AppContext";

/** La tienda usa la misma base de productos que el Inventario (Admin): velas, inciensos, figuras del catálogo. */
export default function TiendaPage() {
  const { setPagina, velas, inciensos, figuras, categoriasCatalogo, agregarAlCarrito } = useApp();
  return (
    <Tienda
      velas={velas}
      inciensos={inciensos}
      figuras={figuras}
      categoriasCatalogo={categoriasCatalogo}
      agregarAlCarrito={agregarAlCarrito}
      volver={() => setPagina("inicio")}
    />
  );
}
