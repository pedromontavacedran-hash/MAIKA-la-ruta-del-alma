import { type ItemCarrito } from "./App";

interface Props {
  cart: ItemCarrito[];
  total: number;
  obtenerPrecioItem: (item: ItemCarrito) => number;
  cambiarCantidad: (id: number, incremento: number) => void;
  volver: () => void;
  finalizar: () => void;
  vaciar: () => void;
}

export default function Carrito({ 
  cart, 
  total, 
  obtenerPrecioItem,
  cambiarCantidad, 
  volver, 
  finalizar, 
  vaciar 
}: Props) {
  const UMBRAL_ENVIO_GRATIS = 50;
  const ENVIO_BASE = 4.9;
  const faltaParaEnvioGratis = Math.max(0, UMBRAL_ENVIO_GRATIS - total);
  const envioCalculado = total >= UMBRAL_ENVIO_GRATIS ? 0 : ENVIO_BASE;
  const totalConEnvio = total + envioCalculado;
  
  if (cart.length === 0) {
    return (
      <div className="carrito-vista" style={{ textAlign: "center", padding: 40 }}>
        <div style={{ textAlign: "left" }}>
          <button
            onClick={volver}
            style={{
              backgroundImage: "linear-gradient(rgba(10, 7, 25, 0.45), rgba(10, 7, 25, 0.45)), url('/fondo%20estrellado.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              color: "gold",
              border: "2px solid gold",
              borderRadius: "30px",
              padding: "8px 20px",
              cursor: "pointer",
              fontWeight: "bold",
              marginBottom: 30
            }}
          >
            ← Volver a tienda
          </button>
        </div>
        <h2 style={{ color: "gold", fontSize: "2.1rem" }}>🛒 Carrito vacío</h2>
      </div>
    );
  }

  return (
    <div className="carrito-vista" style={{ maxWidth: 800, margin: "0 auto", color: "gold" }}>
      <div style={{ textAlign: "left", marginBottom: 20 }}>
        <button
          onClick={volver}
          style={{
            backgroundImage: "linear-gradient(rgba(10, 7, 25, 0.45), rgba(10, 7, 25, 0.45)), url('/fondo%20estrellado.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            color: "gold",
            border: "2px solid gold",
            borderRadius: "30px",
            padding: "8px 20px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          ← Volver a tienda
        </button>
      </div>
      <h2 style={{ textAlign: "center", marginBottom: 30 }}>🛒 Tu carrito</h2>
      
      <div style={{ background: "#2b2560", borderRadius: 20, padding: 20, marginBottom: 20 }}>
        {cart.map(item => (
          <div
            key={item.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "15px 0",
              borderBottom: "1px solid rgba(255,215,0,0.3)"
            }}
          >
            <div style={{ flex: 2 }}>
              <strong style={{ color: "gold", fontSize: 18 }}>{item.nombre}</strong>
              <p style={{ margin: "5px 0 0 0", color: "white" }}>{item.descripcion}</p>
              <p style={{ margin: "5px 0 0 0", color: "gold" }}>{obtenerPrecioItem(item).toFixed(2)} €</p>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
              <button
                onClick={() => cambiarCantidad(item.id, -1)}
                style={{
                  background: "transparent",
                  border: "1px solid gold",
                  color: "gold",
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  cursor: "pointer",
                  fontSize: 18
                }}
              >
                −
              </button>
              <span style={{ color: "white", fontSize: 16 }}>{item.cantidad}</span>
              <button
                onClick={() => cambiarCantidad(item.id, 1)}
                style={{
                  background: "transparent",
                  border: "1px solid gold",
                  color: "gold",
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  cursor: "pointer",
                  fontSize: 18
                }}
              >
                +
              </button>
              <span style={{ color: "gold", fontWeight: "bold", marginLeft: 10 }}>
                {(obtenerPrecioItem(item) * item.cantidad).toFixed(2)} €
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        background: "#2b2560", 
        borderRadius: 20, 
        padding: 20,
        textAlign: "right"
      }}>
        <div
          style={{
            textAlign: "left",
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid gold",
            background: "#1b1745",
            color: "white",
            fontSize: 14,
            fontWeight: "bold"
          }}
        >
          {faltaParaEnvioGratis > 0
            ? `🚚 Te faltan ${faltaParaEnvioGratis.toFixed(2)} € para envío gratis`
            : "✅ ¡Ya tienes envío gratis!"}
        </div>
        <p style={{ margin: "0 0 12px", textAlign: "center", color: "white", opacity: 0.95, fontSize: 18, fontWeight: "bold" }}>
          Envío gratis a partir de 50 €
        </p>
        <p style={{ fontSize: 18 }}>Subtotal: <strong>{total.toFixed(2)} €</strong></p>
        <p style={{ fontSize: 18 }}>Envío: <strong>{envioCalculado.toFixed(2)} €</strong></p>
        <p style={{ fontSize: 24, color: "gold" }}>Total: <strong>{totalConEnvio.toFixed(2)} €</strong></p>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button
          onClick={vaciar}
          style={{
            flex: 1,
            padding: "15px",
            borderRadius: 30,
            border: "2px solid #ff4444",
            background: "transparent",
            color: "#ff4444",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 16
          }}
        >
          🗑️ Vaciar carrito
        </button>
        
        <button
          onClick={finalizar}
          style={{
            flex: 1,
            padding: "15px",
            borderRadius: 30,
            border: "none",
            background: "gold",
            color: "#1b1745",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 16
          }}
        >
          ✅ Finalizar compra
        </button>
      </div>
    </div>
  );
}