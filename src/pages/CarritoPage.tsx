import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Carrito from "../Carrito";
import { useApp } from "../context/AppContext";

export default function CarritoPage() {
  const location = useLocation();
  const {
    cart,
    precioItemCarrito,
    cambiarCantidad,
    eliminarProductoCarrito,
    volverATienda,
    finalizarCarrito,
    vaciarCarrito,
    checkoutHayRechazoServidor,
    procesandoPagoCheckout,
    sesionCarritoLista,
    sincronizarCarritoAlEntrarVista
  } = useApp();

  useEffect(() => {
    if (!sesionCarritoLista) return;
    /** Tras el pintado de la ruta: la sync no debe competir con el commit de navegación al entrar. */
    const t = window.setTimeout(() => {
      void sincronizarCarritoAlEntrarVista();
    }, 0);
    return () => window.clearTimeout(t);
  }, [sesionCarritoLista, location.key, sincronizarCarritoAlEntrarVista]);

  return (
    <>
      {/*
        Sin key volátil: `key={cart...}` remontaba todo el árbol en cada sync/cantidad,
        la cruz desaparecía un instante y los clics se perdían o parecían “lentos”.
      */}
      <Carrito
        cart={cart}
        obtenerPrecioItem={precioItemCarrito}
        cambiarCantidad={cambiarCantidad}
        eliminarProducto={eliminarProductoCarrito}
        volver={volverATienda}
        finalizar={finalizarCarrito}
        vaciar={vaciarCarrito}
        checkoutHayRechazoServidor={checkoutHayRechazoServidor}
        procesandoPagoCheckout={procesandoPagoCheckout}
      />
    </>
  );
}
