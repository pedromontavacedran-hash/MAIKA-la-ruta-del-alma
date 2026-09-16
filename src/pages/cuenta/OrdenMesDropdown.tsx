export type OrdenMes = "desc" | "asc";

export interface OrdenMesDropdownProps {
  titulo: string;
  ordenActual: OrdenMes;
  abierto: boolean;
  onToggle: () => void;
  onSelect: (orden: OrdenMes) => void;
}

/** Dropdown «Más recientes / Más antiguos» dentro de cada grupo de pedidos por mes. */
export default function OrdenMesDropdown({ titulo, ordenActual, abierto, onToggle, onSelect }: OrdenMesDropdownProps) {
  return (
    <span
      style={{ position: "relative", flexShrink: 0, width: 128 }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label={`Ordenar pedidos de ${titulo}`}
        aria-expanded={abierto}
        onClick={onToggle}
        style={{
          width: "100%",
          padding: "6px 8px",
          borderRadius: 8,
          border: "1px solid rgba(212, 175, 55, 0.5)",
          background: "rgba(27, 23, 69, 0.96)",
          color: "#fff",
          fontSize: 11,
          fontWeight: 800,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6
        }}
      >
        <span>{ordenActual === "desc" ? "Más recientes" : "Más antiguos"}</span>
        <span style={{ transform: abierto ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.16s ease" }}>▾</span>
      </button>
      {abierto ? (
        <span
          style={{
            position: "absolute",
            top: "calc(100% + 5px)",
            right: 0,
            width: "100%",
            borderRadius: 9,
            overflow: "hidden",
            border: "1px solid rgba(212, 175, 55, 0.55)",
            background: "rgba(34, 28, 82, 0.98)",
            boxShadow: "0 12px 26px rgba(0,0,0,0.38)",
            zIndex: 20
          }}
        >
          {(["desc", "asc"] as const).map((orden) => (
            <button
              key={orden}
              type="button"
              onClick={() => onSelect(orden)}
              style={{
                width: "100%",
                padding: "8px 9px",
                border: "none",
                borderBottom: orden === "desc" ? "1px solid rgba(212, 175, 55, 0.16)" : "none",
                background: ordenActual === orden ? "rgba(212, 175, 55, 0.18)" : "transparent",
                color: "#fff",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 800,
                textAlign: "left"
              }}
            >
              {orden === "desc" ? "Más recientes" : "Más antiguos"}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
}
