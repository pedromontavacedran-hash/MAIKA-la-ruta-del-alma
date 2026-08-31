import BotonCerrar from "./BotonCerrar";

type AvisoTelefonoCheckout = {
  encontrado: boolean;
  texto: string;
  origen?: "local";
};

type Props = {
  visible: boolean;
  aviso: AvisoTelefonoCheckout | null;
  onClose: () => void;
  onContinuarInvitado: () => void;
  onCambiarDatos: () => void;
  onIniciarSesion: () => void;
  goldColor: string;
};

export default function CheckoutTelefonoAviso({
  visible,
  aviso,
  onClose,
  onContinuarInvitado,
  onCambiarDatos,
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
        className="maika-anchor"
        style={{
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
        <BotonCerrar onClick={onClose} ariaLabel="Cerrar aviso" title="Cerrar" />
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
          {aviso.encontrado ? "✅ Datos encontrados" : "ℹ️ Teléfono no encontrado"}
        </div>
        <div style={{ opacity: 0.95, fontWeight: 600 }}>{aviso.texto}</div>
        {aviso.origen === "local" ? (
          <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.72)" }}>
            Solo se usan datos guardados en este dispositivo.
          </div>
        ) : null}

        {aviso.encontrado && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginTop: 14 }}>
            <button
              type="button"
              onClick={onContinuarInvitado}
              style={{
                width: "100%",
                padding: "11px 10px",
                borderRadius: 12,
                border: "none",
                background: goldColor,
                color: "#1b1745",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Continuar sin usar datos guardados
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={onCambiarDatos}
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
                Cambiar datos
              </button>
              <button
                type="button"
                onClick={onIniciarSesion}
                style={{
                  flex: 1,
                  padding: "10px 10px",
                  borderRadius: 12,
                  border: `1px solid rgba(255,255,255,0.22)`,
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.92)",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
