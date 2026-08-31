import type { CheckoutViewProps } from "../views/CheckoutView";
import type { UseAccesoRapidoCheckoutReturn } from "../../checkout/hooks/useAccesoRapidoCheckout";
import type { UseCheckoutDireccionesReturn } from "../../checkout/hooks/useCheckoutDirecciones";
import { buildCheckoutViewProps, type BuildCheckoutViewPropsInput } from "./buildCheckoutViewProps";

export type CheckoutCorePack = {
  THEME: { bg: string; goldMain: string };
  direcciones: UseCheckoutDireccionesReturn;
  accesoRapido: UseAccesoRapidoCheckoutReturn;
};

export type CheckoutRefsPack = Pick<
  CheckoutViewProps,
  | "bizumConfirmadoRef"
  | "inputCalleCheckoutRef"
  | "inputTelefonoCheckoutRef"
  | "textareaNotasCheckoutRef"
  | "botonIrAlPagoRef"
  | "irAlPagoPointerIdRef"
  | "irAlPagoEjecutarRef"
>;

export type CheckoutConfirmationsPack = Pick<
  CheckoutViewProps,
  | "modalAbierto"
  | "confirmacionBizumOtroNumeroAbierto"
  | "setModalAbierto"
  | "setConfirmacionBizumOtroNumeroAbierto"
  | "normalizarTelefonoBizum"
  | "confirmarVaciarCarrito"
  | "enviarPedidoWhatsApp"
>;

export type CheckoutInvoicePack = Pick<CheckoutViewProps, "pedidoFacturaAbierto" | "setPedidoFacturaAbierto" | "notaPedidoEnvio">;

export type CheckoutFlowPack = Pick<
  CheckoutViewProps,
  | "formPedidoAbierto"
  | "pasoFinalizarCompra"
  | "modoDireccionCheckout"
  | "usuario"
  | "recordarDatosInvitado"
  | "direccionCheckoutSeleccionada"
  | "numeroPedidoPreview"
  | "checkoutIrAlPagoGesturaActiva"
  | "onCheckoutIrAlPagoGesturaInicio"
  | "onCheckoutIrAlPagoGesturaFin"
>;

export type CheckoutPhoneAddressPack = Pick<
  CheckoutViewProps,
  | "telefonoCheckoutLimpio"
  | "telefonoCheckoutEsValido"
  | "telefonoCheckoutPrefijoInvalido"
  | "telefonoCheckoutValidPulse"
  | "buscandoCalleCheckout"
  | "calleCheckoutResetSignal"
>;

export type CheckoutPaymentTotalsPack = Pick<
  CheckoutViewProps,
  | "metodoPago"
  | "setMetodoPago"
  | "total"
  | "envioPreview"
  | "cuponAplicado"
  | "totalAPagarResumen"
  | "procesandoPago"
  | "datosPago"
  | "datosCliente"
  | "cerrarCheckoutSinGuardar"
  | "setPasoFinalizarCompra"
  | "setDatosPago"
  | "setRecordarDatosInvitado"
  | "setDatosCliente"
  | "mensajeErrorCheckoutPago"
  | "setMensajeErrorCheckoutPago"
  | "checkoutHayRechazoServidor"
>;

export type CheckoutCouponPack = Pick<
  CheckoutViewProps,
  | "mostrarInputCuponCheckout"
  | "cuponError"
  | "cuponInput"
  | "aplicarCupon"
  | "quitarCupon"
  | "setMostrarInputCuponCheckout"
  | "setCuponInput"
  | "setCuponError"
>;

export type CheckoutNavPack = Pick<
  CheckoutViewProps,
  | "mostrarNotificacion"
  | "setBuscandoCalleCheckout"
  | "setAvisoTelefonoCheckout"
  | "setPagina"
  | "enmascararEmail"
  | "preCheckoutCarritoAviso"
  | "cerrarPreCheckoutCarritoAviso"
  | "cerrarPreCheckoutCarritoAvisoSinNavegar"
>;

export type CheckoutRepeatPack = Pick<
  CheckoutViewProps,
  | "modalRepeatPedidoAbierto"
  | "pedidoRepeatSeleccionado"
  | "pedidoRealizado"
  | "ultimoPedidoNumero"
  | "urlWhatsAppPendiente"
  | "avisoTelefonoCheckout"
  | "repetirPedido"
  | "setModalRepeatPedidoAbierto"
  | "setUrlWhatsAppPendiente"
  | "setPedidoRealizado"
>;

export type CheckoutLoginPack = Pick<
  CheckoutViewProps,
  "loginModalAbierto" | "setLoginModalAbierto" | "iniciarSesionConToken" | "enviarCodigoEmail"
>;

export type CheckoutCompraRapidaPack = Pick<
  CheckoutViewProps,
  "comprarEnUnClick" | "compraRapidaCheckoutDisponible"
>;

export type CheckoutStylesPack = Pick<CheckoutViewProps, "inputStyle">;

export type CheckoutViewAppPack = {
  direccionesMax: number;
  core: CheckoutCorePack;
  refs: CheckoutRefsPack;
  confirmations: CheckoutConfirmationsPack;
  invoice: CheckoutInvoicePack;
  flow: CheckoutFlowPack;
  phoneAddress: CheckoutPhoneAddressPack;
  paymentTotals: CheckoutPaymentTotalsPack;
  coupon: CheckoutCouponPack;
  nav: CheckoutNavPack;
  repeat: CheckoutRepeatPack;
  login: CheckoutLoginPack;
  compraRapida: CheckoutCompraRapidaPack;
  onLoginModalSuccess: CheckoutViewProps["onLoginModalSuccess"];
  styles: CheckoutStylesPack;
};

export function packCheckoutViewAppInput(p: CheckoutViewAppPack): BuildCheckoutViewPropsInput {
  return {
    THEME: p.core.THEME,
    direcciones: p.core.direcciones,
    accesoRapido: p.core.accesoRapido,
    ...p.styles,
    ...p.refs,
    ...p.confirmations,
    ...p.invoice,
    ...p.flow,
    ...p.phoneAddress,
    ...p.paymentTotals,
    ...p.coupon,
    ...p.nav,
    ...p.repeat,
    ...p.login,
    ...p.compraRapida,
    onLoginModalSuccess: p.onLoginModalSuccess,
    direccionesMax: p.direccionesMax
  };
}

export function buildCheckoutViewPropsFromPack(pack: CheckoutViewAppPack): CheckoutViewProps {
  return buildCheckoutViewProps(packCheckoutViewAppInput(pack));
}
