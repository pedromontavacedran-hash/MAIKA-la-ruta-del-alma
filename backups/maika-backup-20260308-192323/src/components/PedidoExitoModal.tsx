interface PedidoExitoModalProps {
  abierto: boolean;
  numeroPedido: string | null;
  onClose: () => void;
}

export default function PedidoExitoModal({
  abierto,
  numeroPedido,
  onClose
}: PedidoExitoModalProps) {
  if (!abierto) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.9)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000
    }}>
      <div style={{
        background: "#2b2560",
        border: "3px solid gold",
        borderRadius: 30,
        padding: 40,
        textAlign: "center",
        maxWidth: 400
      }}>
        <h2 style={{ color: "gold", marginBottom: 20 }}>✅ PEDIDO REALIZADO</h2>
        <p style={{ color: "white", marginBottom: 20 }}>
          Tu pedido <strong>{numeroPedido}</strong> ha sido enviado por WhatsApp
        </p>
        <p style={{ color: "white", marginBottom: 30 }}>
          Te contactaremos en breve para confirmar
        </p>
        <button
          onClick={onClose}
          style={{
            padding: "12px 30px",
            borderRadius: 25,
            border: "none",
            background: "gold",
            color: "#1b1745",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}

