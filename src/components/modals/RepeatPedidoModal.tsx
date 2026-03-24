type Props = {
  abierto: boolean;
  onClose: () => void;
  onReemplazar: () => void;
  onAnadir: () => void;
  bgColor: string;
  goldColor: string;
};

export default function RepeatPedidoModal({
  abierto,
  onClose,
  onReemplazar,
  onAnadir,
  bgColor,
  goldColor
}: Props) {
  if (!abierto) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(5px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 12000
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          background: bgColor,
          border: `3px solid ${goldColor}`,
          borderRadius: 30,
          padding: "30px 40px",
          maxWidth: 420,
          width: "90%",
          boxShadow: "0 0 50px rgba(255,215,0,0.35)",
          textAlign: "center"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          title="Cerrar"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 34,
            height: 34,
            borderRadius: "50%",
            border: `2px solid ${goldColor}`,
            background: "transparent",
            color: goldColor,
            fontSize: 20,
            fontWeight: "bold",
            cursor: "pointer",
            lineHeight: "28px"
          }}
        >
          ×
        </button>
        <div style={{ fontSize: 48, marginBottom: 10 }}>🧩</div>
        <h3 style={{ color: goldColor, fontSize: "1.5rem", marginBottom: 10 }}>
          ¿Reemplazar carrito o añadir?
        </h3>
        <p style={{ color: "white", fontSize: "1.05rem", marginBottom: 22, opacity: 0.9 }}>
          Tu carrito ya tiene productos.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={onReemplazar}
            style={{
              flex: 1,
              background: bgColor,
              color: goldColor,
              border: `2px solid ${goldColor}`,
              borderRadius: 20,
              padding: "12px 10px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Reemplazar
          </button>
          <button
            type="button"
            onClick={onAnadir}
            style={{
              flex: 1,
              background: goldColor,
              color: "#1b1745",
              border: "none",
              borderRadius: 20,
              padding: "12px 10px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}
