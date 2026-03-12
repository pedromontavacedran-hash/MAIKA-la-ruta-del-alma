import { useApp } from "../context/AppContext";
import type { Pagina } from "../types";

interface NavPrincipalProps {
  pagina: Pagina;
  setPagina: (p: Pagina) => void;
  onTerminarCompra: () => void;
  mostrarBotonUnClic: boolean;
  onComprarUnClic: () => void;
  esAppNativa: boolean;
}

const btnBase = {
  color: "gold",
  border: "2px solid gold",
  padding: "12px 30px",
  borderRadius: 25,
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: 22
} as const;

export default function NavPrincipal({
  pagina,
  setPagina,
  onTerminarCompra,
  mostrarBotonUnClic,
  onComprarUnClic,
  esAppNativa
}: NavPrincipalProps) {
  const { cart, accesoAdmin } = useApp();
  const totalItemsCarrito = cart.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
  const hayItems = totalItemsCarrito > 0;

  return (
    <div
      className="app-topbar"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 30,
        borderBottom: "2px solid gold",
        paddingBottom: 15
      }}
    >
      <div className="app-nav-buttons" style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <button
          onClick={() => setPagina("inicio")}
          style={{
            ...btnBase,
            fontSize: 22,
            background: pagina === "inicio" ? "rgba(255, 215, 0, 0.18)" : "transparent"
          }}
        >
          🏠 Inicio
        </button>
        {!accesoAdmin && (
          <button
            onClick={() => setPagina("seguimiento")}
            style={{
              ...btnBase,
              fontSize: 18,
              background: pagina === "seguimiento" ? "gold" : "transparent",
              color: pagina === "seguimiento" ? "#1b1745" : "gold"
            }}
          >
            🔍 Seguimiento
          </button>
        )}
        <button
          onClick={() => setPagina("cuenta")}
          style={{
            ...btnBase,
            fontSize: 18,
            background: pagina === "cuenta" ? "gold" : "transparent",
            color: pagina === "cuenta" ? "#1b1745" : "gold"
          }}
        >
          👤 Mi Cuenta
        </button>
        <button
          onClick={() => setPagina("favoritos")}
          style={{
            ...btnBase,
            fontSize: 18,
            background: pagina === "favoritos" ? "gold" : "transparent",
            color: pagina === "favoritos" ? "#1b1745" : "gold"
          }}
        >
          💛 Favoritos
        </button>
        {!esAppNativa && (
          <button
            onClick={() => setPagina("admin")}
            style={{
              ...btnBase,
              fontSize: 18,
              background: pagina === "admin" ? "gold" : "transparent",
              color: pagina === "admin" ? "#1b1745" : "gold"
            }}
          >
            ⚙️ Admin
          </button>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {hayItems ? (
          <>
            <span style={{ fontSize: 16, color: "white", whiteSpace: "nowrap" }}>
              🛒 {totalItemsCarrito} {totalItemsCarrito === 1 ? "artículo" : "artículos"}
            </span>
            <button
              type="button"
              onClick={() => setPagina("carrito")}
              style={{
                ...btnBase,
                fontSize: 16,
                padding: "10px 18px",
                background: "transparent"
              }}
            >
              Ver carrito
            </button>
            <button
              type="button"
              className="btn-terminar-compra-animado"
              onClick={onTerminarCompra}
              style={{
                ...btnBase,
                fontSize: 16,
                padding: "10px 18px",
                background: "gold",
                color: "#1b1745",
                border: "2px solid gold"
              }}
            >
              Terminar compra
            </button>
            {mostrarBotonUnClic && (
              <button
                type="button"
                onClick={onComprarUnClic}
                style={{
                  ...btnBase,
                  fontSize: 16,
                  padding: "10px 18px",
                  background: "#25D366",
                  color: "white",
                  border: "2px solid #25D366"
                }}
              >
                ⚡ 1 clic
              </button>
            )}
          </>
        ) : (
          <button
            onClick={() => setPagina("carrito")}
            style={{
              ...btnBase,
              fontSize: 18,
              background: "transparent",
              display: "flex",
              alignItems: "center",
              gap: 10,
              whiteSpace: "nowrap"
            }}
          >
            🛒 <span>{totalItemsCarrito}</span> artículos
          </button>
        )}
      </div>
    </div>
  );
}
