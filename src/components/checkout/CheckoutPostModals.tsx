import { useState } from "react";
import type { Pagina } from "../../types";
import type { MaikaPedidoLS } from "../../utils/maikaPedidos";
import ModalConfirmacion from "../../ModalConfirmacion";
import RepeatPedidoModal from "../modals/RepeatPedidoModal";
import PedidoExitoModal from "../PedidoExitoModal";
import CheckoutTelefonoAviso from "../CheckoutTelefonoAviso";
import ModalBase from "../ModalBase";

type Props = {
  direccionCheckoutAEliminarId: string | null;
  modalRepeatPedidoAbierto: boolean;
  pedidoRepeatSeleccionado: MaikaPedidoLS | null;
  pedidoRealizado: boolean;
  ultimoPedidoNumero: string;
  urlWhatsAppPendiente: string | null;
  formPedidoAbierto: boolean;
  pasoFinalizarCompra: "datos" | "confirmarDireccion" | "pago";
  avisoTelefonoCheckout: { encontrado: boolean; texto: string; origen?: "local" } | null;
  bgColor: string;
  goldColor: string;
  onEliminarDireccionConfirmar: (id: string) => void;
  onSetDireccionCheckoutAEliminarId: (id: string | null) => void;
  onSetModalRepeatPedidoAbierto: (abierto: boolean) => void;
  onRepetirPedido: (pedido: MaikaPedidoLS, modo: "replace" | "add") => void;
  onSetUrlWhatsAppPendiente: (url: string | null) => void;
  onSetPedidoRealizado: (v: boolean) => void;
  onSetPagina: (pagina: Pagina) => void;
  onSetAvisoTelefonoCheckout: (v: { encontrado: boolean; texto: string; origen?: "local" } | null) => void;
  onAbrirAccesoRapidoCheckout: () => void;
};

export default function CheckoutPostModals(props: Props) {
  const {
    direccionCheckoutAEliminarId,
    modalRepeatPedidoAbierto,
    pedidoRepeatSeleccionado,
    pedidoRealizado,
    ultimoPedidoNumero,
    urlWhatsAppPendiente,
    formPedidoAbierto,
    pasoFinalizarCompra,
    avisoTelefonoCheckout,
    bgColor,
    goldColor,
    onEliminarDireccionConfirmar,
    onSetDireccionCheckoutAEliminarId,
    onSetModalRepeatPedidoAbierto,
    onRepetirPedido,
    onSetUrlWhatsAppPendiente,
    onSetPedidoRealizado,
    onSetPagina,
    onSetAvisoTelefonoCheckout,
    onAbrirAccesoRapidoCheckout
  } = props;
  const [fallbackWhatsappUrl, setFallbackWhatsappUrl] = useState<string | null>(null);

  const abrirWhatsAppSeguro = (url: string) => {
    const popup = window.open(url, "_blank");
    if (popup) return true;
    setFallbackWhatsappUrl(url);
    return false;
  };

  return (
    <>
      <ModalConfirmacion
        abierto={!!direccionCheckoutAEliminarId}
        mensaje="¿Seguro que quieres eliminar esta dirección?"
        textoConfirmar="Eliminar dirección"
        textoCancelar="Cancelar"
        onConfirmar={() => {
          if (direccionCheckoutAEliminarId) onEliminarDireccionConfirmar(direccionCheckoutAEliminarId);
        }}
        onCancelar={() => onSetDireccionCheckoutAEliminarId(null)}
        zIndex={10032}
      />

      <RepeatPedidoModal
        abierto={modalRepeatPedidoAbierto && !!pedidoRepeatSeleccionado}
        onClose={() => onSetModalRepeatPedidoAbierto(false)}
        onReemplazar={() => {
          if (!pedidoRepeatSeleccionado) return;
          onSetModalRepeatPedidoAbierto(false);
          onRepetirPedido(pedidoRepeatSeleccionado, "replace");
        }}
        onAnadir={() => {
          if (!pedidoRepeatSeleccionado) return;
          onSetModalRepeatPedidoAbierto(false);
          onRepetirPedido(pedidoRepeatSeleccionado, "add");
        }}
        bgColor={bgColor}
        goldColor={goldColor}
      />

      <PedidoExitoModal
        abierto={pedidoRealizado}
        numeroPedido={ultimoPedidoNumero}
        onClose={() => {
          if (urlWhatsAppPendiente) {
            abrirWhatsAppSeguro(urlWhatsAppPendiente);
            onSetUrlWhatsAppPendiente(null);
          }
          onSetPedidoRealizado(false);
          onSetPagina("inicio");
        }}
      />

      <ModalBase
        abierto={!!fallbackWhatsappUrl}
        onClose={() => setFallbackWhatsappUrl(null)}
        zIndex={10034}
        maxWidth="520px"
      >
        <h3 style={{ marginTop: 0, marginBottom: 10, color: "rgba(245,230,200,0.95)" }}>
          No se pudo abrir WhatsApp automáticamente
        </h3>
        <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.82)", lineHeight: 1.45 }}>
          Usa este enlace:
        </p>
        {fallbackWhatsappUrl ? (
          <a
            href={fallbackWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: goldColor, wordBreak: "break-all", fontSize: 13 }}
          >
            {fallbackWhatsappUrl}
          </a>
        ) : null}
      </ModalBase>

      <CheckoutTelefonoAviso
        visible={formPedidoAbierto && pasoFinalizarCompra === "datos"}
        aviso={avisoTelefonoCheckout}
        onClose={() => onSetAvisoTelefonoCheckout(null)}
        onContinuarInvitado={() => onSetAvisoTelefonoCheckout(null)}
        onCambiarDatos={() => onSetAvisoTelefonoCheckout(null)}
        onIniciarSesion={() => {
          onSetAvisoTelefonoCheckout(null);
          onAbrirAccesoRapidoCheckout();
        }}
        goldColor={goldColor}
      />
    </>
  );
}
