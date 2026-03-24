import React, { useState } from "react";
import DashboardPage from "./dashboard/DashboardPage";
import OrdersPage from "./orders/OrdersPage";
import ProductsPage from "./products/ProductsPage";
import CustomersPage from "./customers/CustomersPage";

type AdminSection = "dashboard" | "orders" | "products" | "customers";

const AdminApp: React.FC = () => {
  const [section, setSection] = useState<AdminSection>("dashboard");

  const renderSection = () => {
    switch (section) {
      case "orders":
        return <OrdersPage />;
      case "products":
        return <ProductsPage />;
      case "customers":
        return <CustomersPage />;
      case "dashboard":
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#0b0718",
        color: "white",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      }}
    >
      <header
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid rgba(255, 215, 0, 0.3)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--maika-bg)"
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24, color: "var(--gold-main)" }}>Panel de administración MAIKA</h1>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>
            Gestión de tienda, pedidos, clientes y catálogo
          </p>
        </div>
      </header>

      <nav
        style={{
          display: "flex",
          gap: 8,
          padding: "10px 16px",
          borderBottom: "1px solid rgba(255, 215, 0, 0.2)",
          background: "#140f35"
        }}
      >
        {(
          [
            { id: "dashboard", label: "Dashboard" },
            { id: "orders", label: "Pedidos" },
            { id: "products", label: "Productos" },
            { id: "customers", label: "Clientes" }
          ] as const
        ).map((tab) => {
          const isActive = section === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id)}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: isActive ? "2px solid gold" : "1px solid rgba(255, 215, 0, 0.4)",
                background: isActive ? "var(--gold-main)" : "transparent",
                color: isActive ? "#1b1745" : "var(--gold-main)",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                transition: "background 0.15s, color 0.15s, border-color 0.15s"
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <main
        style={{
          flex: 1,
          padding: "20px 24px",
          maxWidth: 1200,
          width: "100%",
          margin: "0 auto"
        }}
      >
        {renderSection()}
      </main>
    </div>
  );
};

export default AdminApp;

