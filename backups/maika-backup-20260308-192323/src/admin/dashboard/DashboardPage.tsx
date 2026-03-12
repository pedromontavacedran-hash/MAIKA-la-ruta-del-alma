import React from "react";

const DashboardPage: React.FC = () => {
  return (
    <section>
      <h2 style={{ fontSize: 22, marginBottom: 8, color: "gold" }}>Dashboard administrador</h2>
      <p style={{ fontSize: 14, opacity: 0.85 }}>
        Aquí verás un resumen de ventas, pedidos, productos destacados y alertas de stock cuando
        integremos la lógica del panel.
      </p>
    </section>
  );
};

export default DashboardPage;

