import ModalConfirmacion from "../../ModalConfirmacion";
import type { Cliente } from "../../types";

type Props = {
  modalAbierto: boolean;
  confirmacionBizumOtroNumeroAbierto: boolean;
  datosPagoBizumTelefono: string;
  datosCliente: Cliente;
  normalizarTelefonoBizum: (telefono: string) => string;
  confirmarVaciarCarrito: () => void;
  setModalAbierto: (v: boolean) => void;
  setConfirmacionBizumOtroNumeroAbierto: (v: boolean) => void;
  enviarPedidoWhatsApp: () => void | Promise<void>;
  bizumConfirmadoRef: { current: boolean };
};

export default function GlobalConfirmaciones({
  modalAbierto,
  confirmacionBizumOtroNumeroAbierto,
  datosPagoBizumTelefono,
  datosCliente,
  normalizarTelefonoBizum,
  confirmarVaciarCarrito,
  setModalAbierto,
  setConfirmacionBizumOtroNumeroAbierto,
  enviarPedidoWhatsApp,
  bizumConfirmadoRef
}: Props) {
  return (
    <>
      <ModalConfirmacion
        abierto={modalAbierto}
        mensaje="¿Vaciar el carrito?"
        onConfirmar={confirmarVaciarCarrito}
        onCancelar={() => setModalAbierto(false)}
        textoConfirmar="Vaciar carrito"
      />

      <ModalConfirmacion
        abierto={confirmacionBizumOtroNumeroAbierto}
        mensaje={(() => {
          const bizumNum = normalizarTelefonoBizum(datosPagoBizumTelefono) || "";
          const contactoNum = normalizarTelefonoBizum(datosCliente.telefono || "");
          const contactoOk = /^[67]\d{8}$/.test(contactoNum);
          if (!contactoNum || !contactoOk) {
            return `El teléfono de contacto está vacío o no es válido (9 dígitos, España). El cobro Bizum se hará al +34 ${bizumNum}. ¿Continuar?`;
          }
          return `El número para cobro Bizum (+34 ${bizumNum}) no coincide con el teléfono de contacto del pedido (${contactoNum}). ¿Cobrar a este número de todas formas?`;
        })()}
        onConfirmar={() => {
          setConfirmacionBizumOtroNumeroAbierto(false);
          requestAnimationFrame(() => {
            bizumConfirmadoRef.current = true;
            void enviarPedidoWhatsApp();
          });
        }}
        onCancelar={() => setConfirmacionBizumOtroNumeroAbierto(false)}
        textoConfirmar="Sí, cobrar a este número"
        textoCancelar="No, corregir número"
        zIndex={10040}
      />
    </>
  );
}
