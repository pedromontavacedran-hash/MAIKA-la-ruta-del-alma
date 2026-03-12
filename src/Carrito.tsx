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
  total: _total,
  obtenerPrecioItem,
  cambiarCantidad, 
  volver, 
  finalizar, 
  vaciar 
}: Props) {
  const UMBRAL_ENVIO_GRATIS = 50;
  const ENVIO_BASE = 4.9;
  const total = cart.reduce((sum, item) => sum + obtenerPrecioItem(item) * (Number(item.cantidad) || 0), 0);
  const faltaParaEnvioGratis = Math.max(0, UMBRAL_ENVIO_GRATIS - total);
  const envioCalculado = total >= UMBRAL_ENVIO_GRATIS ? 0 : ENVIO_BASE;
  const totalConEnvio = total + envioCalculado;
  
  if (cart.length === 0) {
    return (
      <div className="carrito-vista" style={{ textAlign: "center", padding: 40 }}>
        <div style={{ textAlign: "left" }}>
          <button
            className="btn-volver-azul"
            onClick={volver}
            style={{
              background: "#0B0B0D",
              color: "#C9A24A",
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
        <h2 style={{ color: "#C9A24A", fontSize: "2.1rem" }}>🛒 Carrito vacío</h2>
      </div>
    );
  }

  return (
    <div className="carrito-vista" style={{ maxWidth: 800, margin: "0 auto", color: "#C9A24A" }}>
      <div style={{ textAlign: "left", marginBottom: 20 }}>
        <button
          className="btn-volver-azul"
          onClick={volver}
          style={{
            background: "#0B0B0D",
            color: "#C9A24A",
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
      
      <div style={{ background: "#0B0B0D", borderRadius: 20, padding: 20, marginBottom: 20 }}>
        {cart.map(item => (
          <div
            key={`${item.id}-${item.cantidad}`}
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              padding: "15px 0",
              borderBottom: "1px solid rgba(255,215,0,0.3)"
            }}
          >
            <div style={{ flex: 2 }}>
              <strong style={{ color: "#C9A24A", fontSize: 18 }}>{item.nombre}</strong>
              <p style={{ margin: "5px 0 0 0", color: "white" }}>{item.descripcion}</p>
              <p style={{ margin: "5px 0 0 0", color: "#C9A24A" }}>{obtenerPrecioItem(item).toFixed(2)} €</p>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
              <button
                onClick={() => cambiarCantidad(Number(item.id), -1)}
                style={{
                  background: "transparent",
                  border: "1px solid gold",
                  color: "#C9A24A",
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
                onClick={() => cambiarCantidad(Number(item.id), 1)}
                style={{
                  background: "transparent",
                  border: "1px solid gold",
                  color: "#C9A24A",
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  cursor: "pointer",
                  fontSize: 18
                }}
              >
                +
              </button>
              <span style={{ color: "#C9A24A", fontWeight: "bold", marginLeft: 10 }}>
                {(obtenerPrecioItem(item) * item.cantidad).toFixed(2)} €
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        background: "#0B0B0D", 
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
            background: "#0B0B0D",
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
        <p style={{ fontSize: 24, color: "#C9A24A" }}>Total: <strong>{totalConEnvio.toFixed(2)} €</strong></p>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
        <button
          onClick={vaciar}
          style={{
            flex: 1,
            padding: "15px",
            borderRadius: 30,
            border: "2px solid #C9A24A",
            background: "transparent",
            color: "#fff",
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
            background: "#C9A24A",
            color: "#1b1745",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 16
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Finalizar compra
          </span>
        </button>
      </div>
    </div>
  );
}