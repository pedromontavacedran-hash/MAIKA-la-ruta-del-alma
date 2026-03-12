import React from "react";

const OrdersPage: React.FC = () => {
  return (
    <section>
      <h2 style={{ fontSize: 22, marginBottom: 8, color: "#C9A24A" }}>Gestión de pedidos</h2>
      <p style={{ fontSize: 14, opacity: 0.85 }}>
        Esta sección mostrará la lista de pedidos, filtros por estado y detalles de cada pedido
        cuando movamos la lógica desde la aplicación principal.
      </p>
    </section>
  );
};

export default OrdersPage;

