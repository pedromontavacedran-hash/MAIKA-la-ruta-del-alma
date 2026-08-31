import ModalBase from "../ModalBase";

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
  return (
    <ModalBase
      abierto={abierto}
      onClose={onClose}
      zIndex={12000}
      maxWidth="420px"
      styleCard={{
        background: bgColor,
        border: `3px solid ${goldColor}`,
        borderRadius: 30,
        padding: "30px 40px",
        width: "90%",
        boxShadow: "0 0 50px rgba(255,215,0,0.35)",
        textAlign: "center"
      }}
    >
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
    </ModalBase>
  );
}
