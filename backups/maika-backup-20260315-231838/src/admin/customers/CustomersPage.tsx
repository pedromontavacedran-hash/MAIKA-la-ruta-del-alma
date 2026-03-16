import React from "react";

const CustomersPage: React.FC = () => {
  return (
    <section>
      <h2 style={{ fontSize: 22, marginBottom: 8, color: "#C9A24A" }}>Gestión de clientes</h2>
      <p style={{ fontSize: 14, opacity: 0.85 }}>
        En esta página se gestionarán los clientes de la tienda (datos de contacto, verificación y
        pedidos asociados) cuando traslademos la lógica actual.
      </p>
    </section>
  );
};

export default CustomersPage;

