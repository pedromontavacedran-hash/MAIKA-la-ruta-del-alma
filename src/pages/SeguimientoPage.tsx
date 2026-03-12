import { useApp } from "../context/AppContext";

export default function SeguimientoPage() {
  const {
    numeroSeguimiento,
    setNumeroSeguimiento,
    buscarPedido,
    pedidoBuscado,
    accesoAdmin,
    busquedaPedido,
    setBusquedaPedido,
    renderCajaPedidos,
    pendientesAbierto,
    setPendientesAbierto,
    enviadosAbierto,
    setEnviadosAbierto,
    entregadosAbierto,
    setEntregadosAbierto,
    pedidosPendientesOrdenados,
    pedidosEnviadosOrdenados,
    pedidosEntregadosOrdenados,
    setPedidoFacturaAbierto
  } = useApp();

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center" }}>🔍 SEGUIMIENTO DE PEDIDOS</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 30 }}>
        <input
          type="text"
          placeholder="Ej: MK240215-42"
          value={numeroSeguimiento}
          onChange={(e) => setNumeroSeguimiento(e.target.value.toUpperCase())}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            border: "2px solid #C9A24A",
            background: "#0B0B0D",
            color: "white",
            fontSize: 16
          }}
        />
        <button
          onClick={buscarPedido}
          style={{
            background: "#C9A24A",
            color: "#1b1745",
            border: "none",
            padding: "12px 20px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Buscar
        </button>
      </div>

      {pedidoBuscado && pedidoBuscado.cliente && (
        <div style={{
          background: "#0B0B0D",
          border: "2px solid #C9A24A",
          borderRadius: 20,
          padding: 20
        }}>
          <h3 style={{ color: "#C9A24A", marginBottom: 15 }}>📦 {pedidoBuscado.numero}</h3>

          <div style={{ marginBottom: 15 }}>
            <p><strong>Fecha:</strong> {pedidoBuscado.fecha}</p>
            <p><strong>Cliente:</strong> {pedidoBuscado.cliente.nombreApellidos}</p>
            <p><strong>Total:</strong> {pedidoBuscado.total?.toFixed(2)} €</p>
          </div>

          <div style={{
            background: "#0B0B0D",
            padding: 15,
            borderRadius: 10,
            marginBottom: 15
          }}>
            <p><strong>ESTADO:</strong></p>
            <div style={{
              display: "inline-block",
              padding: "8px 20px",
              borderRadius: 30,
              background: pedidoBuscado.estado === "pendiente" ? "rgba(34,211,238,0.2)" :
                pedidoBuscado.estado === "enviado" ? "rgba(230,126,34,0.2)" :
                  "rgba(46,204,113,0.2)",
              color: pedidoBuscado.estado === "pendiente" ? "#22d3ee" :
                pedidoBuscado.estado === "enviado" ? "#e67e22" :
                  "#2ecc71",
              fontWeight: "bold"
            }}>
              {pedidoBuscado.estado === "pendiente" ? "🛒 PENDIENTE" :
                pedidoBuscado.estado === "enviado" ? "🚚 ENVIADO" : "✅ ENTREGADO"}
            </div>
          </div>

          <div>
            <p><strong>📍 Dirección de envío:</strong></p>
            <p>{pedidoBuscado.cliente.direccion}</p>
            <p>{pedidoBuscado.cliente.cp} {pedidoBuscado.cliente.poblacion}</p>
            <p>{pedidoBuscado.cliente.provincia}</p>
          </div>

          <button
            onClick={() => setPedidoFacturaAbierto(pedidoBuscado)}
            style={{
              marginTop: 12,
              background: "rgba(212,175,55,0.2)",
              color: "#C9A24A",
              border: "2px solid #C9A24A",
              padding: "10px",
              borderRadius: 10,
              cursor: "pointer",
              width: "100%",
              fontWeight: "bold"
            }}
          >
            📄 Ver factura / pedido completo
          </button>
          <button
            onClick={() => window.open(`https://wa.me/34673175547?text=Hola%20Maika%2C%20consulta%20sobre%20pedido%20${pedidoBuscado.numero}`, "_blank")}
            style={{
              marginTop: 10,
              background: "#25D366",
              color: "white",
              border: "none",
              padding: "10px",
              borderRadius: 10,
              cursor: "pointer",
              width: "100%",
              fontWeight: "bold"
            }}
          >
            📱 Contactar por WhatsApp
          </button>
        </div>
      )}

      {accesoAdmin && (
        <div style={{ marginTop: 50 }}>
          <h3 style={{ textAlign: "center" }}>📋 GESTIÓN DE PEDIDOS</h3>

          <input
            placeholder="Buscar pedido..."
            value={busquedaPedido}
            onChange={(e) => setBusquedaPedido(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 10,
              border: "2px solid #C9A24A",
              background: "#0B0B0D",
              color: "white",
              marginBottom: 20
            }}
          />

          <div key={`pendientes-${pedidosPendientesOrdenados.length}`}>
            {renderCajaPedidos("PENDIENTES", pedidosPendientesOrdenados, "#22d3ee", "🛒", pendientesAbierto, setPendientesAbierto, true)}
          </div>
          <div key={`enviados-${pedidosEnviadosOrdenados.length}`}>
            {renderCajaPedidos("ENVIADOS", pedidosEnviadosOrdenados, "#e67e22", "🚚", enviadosAbierto, setEnviadosAbierto, false)}
          </div>
          <div key={`entregados-${pedidosEntregadosOrdenados.length}`}>
            {renderCajaPedidos("ENTREGADOS", pedidosEntregadosOrdenados, "#2ecc71", "✅", entregadosAbierto, setEntregadosAbierto, false)}
          </div>
        </div>
      )}
    </div>
  );
}
