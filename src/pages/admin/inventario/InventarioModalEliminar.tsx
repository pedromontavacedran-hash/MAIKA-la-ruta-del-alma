import { THEME } from "../../../config";

export interface InventarioModalEliminarProps {
  nombre: string;
  onCancelar: () => void;
  onConfirmar: () => void;
}

/** Modal de confirmación de eliminación de producto del inventario. */
export default function InventarioModalEliminar({ nombre, onCancelar, onConfirmar }: InventarioModalEliminarProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1001,
        padding: 20
      }}
      onClick={onCancelar}
    >
      <div
        style={{
          background: THEME.bg,
          border: `2px solid ${THEME.goldMain}`,
          borderRadius: 20,
          padding: 32,
          maxWidth: 520,
          width: "100%"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ color: THEME.goldMain, fontWeight: "bold", marginBottom: 12, fontSize: 22 }}>Eliminar producto</div>
        <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 15, marginBottom: 20, lineHeight: 1.5 }}>
          ¿Eliminar <strong style={{ color: THEME.goldMain }}>{nombre}</strong> del catálogo?
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancelar}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: `2px solid ${THEME.goldMain}`,
              background: "transparent",
              color: THEME.goldMain,
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#e57373",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
