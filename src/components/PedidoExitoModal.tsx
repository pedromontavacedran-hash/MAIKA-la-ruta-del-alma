import ModalBase from "./ModalBase";
import {
  PEDIDO_EXITO_COLOR_BOTON,
  PEDIDO_EXITO_COLOR_TEXTO,
  PEDIDO_EXITO_COLOR_TITULO,
  PEDIDO_EXITO_FONDO_BOTON,
  PEDIDO_EXITO_LINEA1,
  PEDIDO_EXITO_LINEA2,
  PEDIDO_EXITO_MODAL_BORDE,
  PEDIDO_EXITO_MODAL_FONDO,
  PEDIDO_EXITO_TEXTO_BOTON,
  PEDIDO_EXITO_TITULO,
  sustituirMarcadorPedido
} from "../utils/barraTopPedidoExito/pedidoExitoModalFijo";

interface PedidoExitoModalProps {
  abierto: boolean;
  numeroPedido: string | null;
  onClose: () => void;
}

export default function PedidoExitoModal({ abierto, numeroPedido, onClose }: PedidoExitoModalProps) {
  const refPedido = numeroPedido || "";
  const tituloCompleto = sustituirMarcadorPedido(PEDIDO_EXITO_TITULO, refPedido);
  const textoLinea1 = sustituirMarcadorPedido(PEDIDO_EXITO_LINEA1, refPedido);
  const textoLinea2 = sustituirMarcadorPedido(PEDIDO_EXITO_LINEA2, refPedido);

  return (
    <ModalBase
      abierto={abierto}
      onClose={onClose}
      maxWidth="400px"
      cerrarAlPulsarFondo={false}
      styleCard={{
        position: "relative",
        background: PEDIDO_EXITO_MODAL_FONDO,
        border: `3px solid ${PEDIDO_EXITO_MODAL_BORDE}`,
        borderRadius: 30,
        padding: 40,
        textAlign: "center"
      }}
    >
      {tituloCompleto.trim() ? (
        <h2
          style={{
            color: PEDIDO_EXITO_COLOR_TITULO,
            margin: "0 0 16px",
            lineHeight: 1.3,
            fontSize: "1.15rem",
            fontWeight: 700
          }}
        >
          {tituloCompleto}
        </h2>
      ) : null}
      {textoLinea1.trim() ? (
        <p style={{ color: PEDIDO_EXITO_COLOR_TEXTO, margin: "0 0 12px", lineHeight: 1.5 }}>{textoLinea1}</p>
      ) : null}
      {textoLinea2.trim() ? (
        <p style={{ color: PEDIDO_EXITO_COLOR_TEXTO, margin: "0 0 12px", lineHeight: 1.5 }}>{textoLinea2}</p>
      ) : null}
      <button
        type="button"
        onClick={onClose}
        style={{
          marginTop: 22,
          padding: "12px 30px",
          borderRadius: 25,
          border: "none",
          background: PEDIDO_EXITO_FONDO_BOTON,
          color: PEDIDO_EXITO_COLOR_BOTON,
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        {PEDIDO_EXITO_TEXTO_BOTON}
      </button>
    </ModalBase>
  );
}
