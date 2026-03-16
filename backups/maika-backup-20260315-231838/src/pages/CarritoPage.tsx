import Carrito from "../Carrito";
import { useApp } from "../context/AppContext";

export default function CarritoPage() {
  const {
    cart,
    total,
    precioItemCarrito,
    cambiarCantidad,
    volverATienda,
    finalizarCarrito,
    vaciarCarrito
  } = useApp();

  const carritoKey = cart.map((i) => `${i.id}:${i.cantidad}`).join("|");

  return (
    <>
      <Carrito
        key={carritoKey}
        cart={cart}
        total={total}
        obtenerPrecioItem={precioItemCarrito}
        cambiarCantidad={cambiarCantidad}
        volver={volverATienda}
        finalizar={finalizarCarrito}
        vaciar={vaciarCarrito}
      />
    </>
  );
}
