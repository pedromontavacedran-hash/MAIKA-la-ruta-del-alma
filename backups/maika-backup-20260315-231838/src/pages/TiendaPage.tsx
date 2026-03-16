import Tienda from "../Tienda";
import { useApp } from "../context/AppContext";

/** La tienda usa la misma base de productos que el Inventario (Admin): velas, inciensos, figuras, kits del catálogo. */
export default function TiendaPage() {
  const { setPagina, velas, inciensos, figuras, kits, categoriasCatalogo, cart, agregarAlCarrito, categoriaTiendaAlAbrir, setCategoriaTiendaAlAbrir, busquedaTienda, setBusquedaTienda } = useApp();
  return (
    <Tienda
      velas={velas}
      inciensos={inciensos}
      figuras={figuras}
      kits={kits}
      categoriasCatalogo={categoriasCatalogo}
      cart={cart}
      agregarAlCarrito={agregarAlCarrito}
      volver={() => setPagina("inicio")}
      categoriaInicial={categoriaTiendaAlAbrir}
      onCategoriaInicialAplicada={() => setCategoriaTiendaAlAbrir(null)}
      busquedaInicial={busquedaTienda}
      onBusquedaInicialAplicada={() => setBusquedaTienda("")}
    />
  );
}
