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
        background: "#0B0B0D",
        border: "3px solid #C9A24A",
        borderRadius: 30,
        padding: 40,
        textAlign: "center",
        maxWidth: 400
      }}>
        <h2 style={{ color: "#C9A24A", marginBottom: 20 }}>✅ PEDIDO REALIZADO</h2>
        <p style={{ color: "#F5E6C8", marginBottom: 20 }}>
          Tu pedido <strong>{numeroPedido}</strong> ha sido enviado por WhatsApp
        </p>
        <p style={{ color: "#F5E6C8", marginBottom: 10 }}>
          Te contactaremos en breve para confirmar
        </p>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, marginBottom: 30 }}>
          Pulsa Aceptar para abrir WhatsApp y enviar el resumen del pedido.
        </p>
        <button
          onClick={onClose}
          style={{
            padding: "12px 30px",
            borderRadius: 25,
            border: "none",
            background: "#C9A24A",
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

