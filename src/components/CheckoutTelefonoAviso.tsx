type AvisoTelefonoCheckout = {
  encontrado: boolean;
  texto: string;
};

type Props = {
  visible: boolean;
  aviso: AvisoTelefonoCheckout | null;
  onClose: () => void;
  onContinuarInvitado: () => void;
  onIniciarSesion: () => void;
  goldColor: string;
};

export default function CheckoutTelefonoAviso({
  visible,
  aviso,
  onClose,
  onContinuarInvitado,
  onIniciarSesion,
  goldColor
}: Props) {
  if (!visible || !aviso?.encontrado) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 110,
        left: 0,
        right: 0,
        zIndex: 11050,
        display: "flex",
        justifyContent: "center",
        padding: "0 16px",
        pointerEvents: "auto"
      }}
    >
      <div
        style={{
          position: "relative",
          pointerEvents: "auto",
          width: "100%",
          maxWidth: 560,
          padding: "16px 16px",
          borderRadius: 16,
          border: `2px solid ${goldColor}`,
          background: "rgba(18,14,53,0.92)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          color: "white",
          textAlign: "center"
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar aviso"
          title="Cerrar"
          style={{
            position: "absolute",
            top: 6,
            right: 8,
            background: "transparent",
            border: "none",
            color: goldColor,
            fontSize: 28,
            cursor: "pointer",
            fontWeight: "bold",
            lineHeight: 1,
            width: 34,
            height: 34
          }}
        >
          ×
        </button>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
          {aviso.encontrado ? "✅ Usuario registrado" : "ℹ️ Teléfono no encontrado"}
        </div>
        <div style={{ opacity: 0.95, fontWeight: 600 }}>{aviso.texto}</div>

        {aviso.encontrado && (
          <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
            <button
              type="button"
              onClick={onContinuarInvitado}
              style={{
                flex: 1,
                padding: "10px 10px",
                borderRadius: 12,
                border: `2px solid ${goldColor}`,
                background: "transparent",
                color: goldColor,
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Continuar como invitado
            </button>
            <button
              type="button"
              onClick={onIniciarSesion}
              style={{
                flex: 1,
                padding: "10px 10px",
                borderRadius: 12,
                border: "none",
                background: goldColor,
                color: "#1b1745",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Iniciar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
