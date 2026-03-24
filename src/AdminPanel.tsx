export default function AdminPanel() {
  return (
    <div style={{
      padding: "30px",
      color: "white",
      background: "#1b1745",
      minHeight: "100vh"
    }}>
      <h1 style={{ color: "#d4af37" }}>Panel Admin MAIKA</h1>

      <div style={{ marginTop: "20px" }}>
        <button>Pedidos</button>
        <button style={{ marginLeft: "10px" }}>Clientes</button>
        <button style={{ marginLeft: "10px" }}>Inventario</button>
      </div>
    </div>
  );
}
