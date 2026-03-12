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
    vaciarCarrito,
    perfilCompraRapida,
    comprarEnUnClick
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
      {perfilCompraRapida && cart.length > 0 && (
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button
            onClick={comprarEnUnClick}
            style={{
              background: "#25D366",
              color: "white",
              border: "none",
              padding: "12px 30px",
              borderRadius: 25,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 16
            }}
          >
            ⚡ Comprar en 1 clic
          </button>
        </div>
      )}
    </>
  );
}
