import ModalBase from "../ModalBase";

export type PreCheckoutCarritoAvisoModalProps = {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  detalle: string;
  textoBoton: string;
  /** Segundo botón (p. ej. «Cerrar»); la X del modal usa el mismo cierre que este cuando hay texto. */
  textoBotonSecundario?: string;
  bgColor: string;
  goldColor: string;
  onConfirmar: () => void;
  onCerrarSoloModal: () => void;
};

/**
 * Aviso explícito cuando no se puede abrir el checkout (stock, catálogo, carrito vacío).
 * Obliga a leer y confirmar; evita que solo un toast breve deje al usuario desorientado.
 */
export default function PreCheckoutCarritoAvisoModal({
  abierto,
  titulo,
  mensaje,
  detalle,
  textoBoton,
  textoBotonSecundario,
  bgColor,
  goldColor,
  onConfirmar,
  onCerrarSoloModal
}: PreCheckoutCarritoAvisoModalProps) {
  const cerrarDesdeX =
    textoBotonSecundario && textoBotonSecundario.trim() !== "" ? onCerrarSoloModal : onConfirmar;
  return (
    <ModalBase
      abierto={abierto}
      onClose={cerrarDesdeX}
      zIndex={10030}
      maxWidth="440px"
      cerrarAlPulsarFondo={false}
      ariaLabelledBy="pre-checkout-carrito-aviso-titulo"
      styleCard={{
        background: `linear-gradient(165deg, ${bgColor} 0%, rgba(20,18,32,0.98) 100%)`,
        border: `2px solid ${goldColor}`,
        borderRadius: 22,
        padding: "28px 26px 30px",
        textAlign: "center",
        boxSizing: "border-box"
      }}
    >
      <h2
        id="pre-checkout-carrito-aviso-titulo"
        style={{
          color: goldColor,
          fontSize: "1.15rem",
          fontWeight: 700,
          margin: "0 0 14px",
          lineHeight: 1.35
        }}
      >
        {titulo}
      </h2>
      <p style={{ color: "rgba(255,255,255,0.95)", margin: "0 0 12px", fontSize: 15, fontWeight: 600, lineHeight: 1.45 }}>
        {mensaje}
      </p>
      <p style={{ color: "rgba(255,255,255,0.78)", margin: "0 0 26px", fontSize: 14, lineHeight: 1.5 }}>{detalle}</p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          alignItems: "stretch",
          width: "100%",
          maxWidth: 280,
          margin: "0 auto"
        }}
      >
        <button
          type="button"
          onClick={onConfirmar}
          style={{
            padding: "12px 28px",
            borderRadius: 24,
            border: "none",
            background: goldColor,
            color: "#1a1525",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
            boxShadow: "0 4px 18px rgba(0,0,0,0.35)"
          }}
        >
          {textoBoton}
        </button>
        {textoBotonSecundario && textoBotonSecundario.trim() !== "" ? (
          <button
            type="button"
            onClick={onCerrarSoloModal}
            style={{
              padding: "10px 20px",
              borderRadius: 24,
              border: `1px solid rgba(255,255,255,0.35)`,
              background: "transparent",
              color: "rgba(245, 230, 200, 0.92)",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer"
            }}
          >
            {textoBotonSecundario}
          </button>
        ) : null}
      </div>
    </ModalBase>
  );
}
