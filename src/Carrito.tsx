import React from 'react';

interface ItemCarrito {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface Props {
  cart: ItemCarrito[];
  total: number;
  cambiarCantidad: (id: number, incremento: number) => void;
  volver: () => void;
}

export default function Carrito({ cart, total, cambiarCantidad, volver }: Props) {
  
  // Filtramos SOLO los productos con cantidad > 0
  const productosVisibles = cart.filter(item => item.cantidad > 0);
  
  // Calculamos el número REAL de productos (suma de cantidades)
  const numeroRealProductos = cart.reduce((sum, item) => sum + item.cantidad, 0);

  const botonCantidad = {
    background: "#ffd700",
    color: "#1b1745",
    border: "none",
    borderRadius: "50%",
    width: "30px",
    height: "30px",
    cursor: "pointer",
    fontWeight: "bold",
  };

  return (
    <div style={{ padding: 40, color: "white" }}>

      <button
        onClick={volver}
        style={{
          background: "#ffd700",
          color: "#1b1745",
          border: "none",
          borderRadius: "30px",
          padding: "8px 20px",
          cursor: "pointer",
          fontWeight: "bold",
          marginBottom: "20px"
        }}
      >
        ← Volver
      </button>

      <h2 style={{ color: "gold" }}>Tu Carrito</h2>
      
      <p style={{ color: "gold", marginBottom: 20 }}>
        Total de productos: {numeroRealProductos}
      </p>

      {productosVisibles.length === 0 && (
        <p style={{ marginTop: 20 }}>El carrito está vacío</p>
      )}

      {productosVisibles.map((item) => (
        <div
          key={item.id}
          style={{
            border: "2px solid gold",
            padding: 20,
            borderRadius: 15,
            marginBottom: 20,
          }}
        >
          <h3 style={{ marginBottom: 10 }}>
            {item.nombre}
          </h3>

          <p style={{ marginBottom: 10 }}>
            {item.precio.toFixed(2)} € x {item.cantidad} ={" "}
            <strong style={{ color: "#ffd700" }}>
              {(item.precio * item.cantidad).toFixed(2)} €
            </strong>
          </p>

          <div style={{ display: "flex", alignItems: "center" }}>
            
            <button
              onClick={() => cambiarCantidad(item.id, -1)}
              style={botonCantidad}
            >
              −
            </button>

            <span style={{ margin: "0 15px", fontWeight: "bold" }}>
              {item.cantidad}
            </span>

            <button
              onClick={() => cambiarCantidad(item.id, 1)}
              style={botonCantidad}
            >
              +
            </button>

          </div>
        </div>
      ))}

      <h2 style={{ color: "gold", marginTop: 30 }}>
        Total: {total.toFixed(2)} €
      </h2>
    </div>
  );
}