import type { CheckoutViewProps } from "../views/CheckoutView";
import type { UseAccesoRapidoCheckoutReturn } from "../../checkout/hooks/useAccesoRapidoCheckout";
import type { UseCheckoutDireccionesReturn } from "../../checkout/hooks/useCheckoutDirecciones";

/** Props que se rellenan desde THEME, `direcciones` o `accesoRapido` (más `abrirLoginDesdeCheckout`). */
type CheckoutViewBundledPropKeys =
  | "themeBg"
  | "themeGold"
  | "modoNuevaDireccionCheckout"
  | "modoEdicionUnaDireccionCheckout"
  | "setModoEdicionUnaDireccionCheckout"
  | "direccionesCheckout"
  | "direccionCheckoutSeleccionadaId"
  | "direccionPredeterminadaCheckoutId"
  | "guardandoDireccionCheckout"
  | "guardandoDireccionHistorialEnCuenta"
  | "setDireccionCheckoutSeleccionadaId"
  | "setDireccionCheckoutActiva"
  | "setModoNuevaDireccionCheckout"
  | "setDireccionPredeterminadaCheckoutId"
  | "setUsarDireccionPrincipalCheckout"
  | "aplicarDireccionEnCheckout"
  | "elegirDireccionParaEnvioPedido"
  | "usarDireccionCheckout"
  | "setDireccionCheckoutAEliminarId"
  | "guardarDireccionCheckout"
  | "guardarDireccionHistorialEnCuenta"
  | "direccionCheckoutAEliminarId"
  | "eliminarDireccionCheckout"
  | "setDireccionCheckoutAEliminarIdNull"
  | "accesoRapidoCheckoutAbierto"
  | "accesoRapidoPaso"
  | "enviando"
  | "accesoRapidoTelefono"
  | "accesoRapidoCuentaSinEmail"
  | "accesoRapidoCuentaConActividadSinEmail"
  | "accesoRapidoCuentaSinPassword"
  | "accesoRapidoEmailRegistrado"
  | "accesoRapidoLoginPassword"
  | "accesoRapidoEmail"
  | "accesoRapidoEmailUi"
  | "textoCuentaAtrasBloqueoEmail"
  | "mensajeEmailNoCoincide"
  | "resetAccesoRapidoCheckout"
  | "setAccesoRapidoCheckoutAbierto"
  | "setAccesoRapidoLoginPassword"
  | "setAccesoRapidoEmail"
  | "setAccesoRapidoEmailUi"
  | "setAccesoRapidoCodigoUltimoPedido"
  | "setAccesoRapidoPaso"
  | "abrirRegistroForzadoDesdeAcceso"
  | "entrarAccesoRapido"
  | "enviarCodigoAccesoRapidoPaso1"
  | "accesoRapidoCodigoUltimoPedido"
  | "msBloqueoSeguridadAccesoRapido"
  | "accesoRapidoEstadoVerificacionSeguridad"
  | "accesoRapidoIntentosSeguridad"
  | "textoCuentaAtrasBloqueoSeguridadUi"
  | "setAccesoRapidoEstadoVerificacionSeguridad"
  | "verificarIdentidadAccesoRapido"
  | "accesoRapidoCodigoIngresado"
  | "accesoRapidoCodigoBloqueado"
  | "accesoRapidoCodigoExpiradoAhora"
  | "accesoRapidoReenvioEn"
  | "errorCodigo"
  | "setErrorCodigo"
  | "setAccesoRapidoCodigoIngresado"
  | "verificarCodigoAccesoRapido"
  | "reenviarCodigoAccesoRapido"
  | "accesoRapidoPasswordNueva"
  | "accesoRapidoPasswordConfirmar"
  | "accesoRapidoMostrarPasswordNueva"
  | "accesoRapidoMostrarPasswordConfirmar"
  | "accesoRapidoPuedeGuardarPassword"
  | "accesoRapidoPasswordsCoinciden"
  | "renderRequisitosPassword"
  | "setAccesoRapidoPasswordNueva"
  | "setAccesoRapidoPasswordConfirmar"
  | "setAccesoRapidoMostrarPasswordNueva"
  | "setAccesoRapidoMostrarPasswordConfirmar"
  | "guardarPasswordAccesoRapido"
  | "abrirAccesoRapidoCheckout"
  | "abrirLoginDesdeCheckout";

export type BuildCheckoutViewPropsInput = {
  THEME: { bg: string; goldMain: string };
  direcciones: UseCheckoutDireccionesReturn;
  accesoRapido: UseAccesoRapidoCheckoutReturn;
} & Omit<CheckoutViewProps, CheckoutViewBundledPropKeys>;

export function buildCheckoutViewProps(input: BuildCheckoutViewPropsInput): CheckoutViewProps {
  const { THEME, direcciones: d, accesoRapido: ar, ...rest } = input;
  return {
    ...rest,
    themeBg: THEME.bg,
    themeGold: THEME.goldMain,
    modoNuevaDireccionCheckout: d.modoNuevaDireccionCheckout,
    modoEdicionUnaDireccionCheckout: d.modoEdicionUnaDireccionCheckout,
    setModoEdicionUnaDireccionCheckout: d.setModoEdicionUnaDireccionCheckout,
    direccionesCheckout: d.direccionesCheckout,
    direccionCheckoutSeleccionadaId: d.direccionCheckoutSeleccionadaId,
    direccionPredeterminadaCheckoutId: d.direccionPredeterminadaCheckoutId,
    guardandoDireccionCheckout: d.guardandoDireccionCheckout,
    guardandoDireccionHistorialEnCuenta: d.guardandoDireccionHistorialEnCuenta,
    setDireccionCheckoutSeleccionadaId: d.setDireccionCheckoutSeleccionadaId,
    setDireccionCheckoutActiva: d.setDireccionCheckoutActiva,
    setModoNuevaDireccionCheckout: d.setModoNuevaDireccionCheckout,
    setDireccionPredeterminadaCheckoutId: d.setDireccionPredeterminadaCheckoutId,
    setUsarDireccionPrincipalCheckout: d.setUsarDireccionPrincipalCheckout,
    aplicarDireccionEnCheckout: d.aplicarDireccionEnCheckout,
    elegirDireccionParaEnvioPedido: d.elegirDireccionParaEnvioPedido,
    usarDireccionCheckout: d.usarDireccionCheckout,
    setDireccionCheckoutAEliminarId: d.setDireccionCheckoutAEliminarId,
    guardarDireccionCheckout: d.guardarDireccionCheckout,
    guardarDireccionHistorialEnCuenta: d.guardarDireccionHistorialEnCuenta,
    direccionCheckoutAEliminarId: d.direccionCheckoutAEliminarId,
    eliminarDireccionCheckout: d.eliminarDireccionCheckout,
    setDireccionCheckoutAEliminarIdNull: d.setDireccionCheckoutAEliminarId,
    accesoRapidoCheckoutAbierto: ar.accesoRapidoCheckoutAbierto,
    accesoRapidoPaso: ar.accesoRapidoPaso,
    enviando: ar.enviando,
    accesoRapidoTelefono: ar.accesoRapidoTelefono,
    accesoRapidoCuentaSinEmail: ar.accesoRapidoCuentaSinEmail,
    accesoRapidoCuentaConActividadSinEmail: ar.accesoRapidoCuentaConActividadSinEmail,
    accesoRapidoCuentaSinPassword: ar.accesoRapidoCuentaSinPassword,
    accesoRapidoEmailRegistrado: ar.accesoRapidoEmailRegistrado,
    accesoRapidoLoginPassword: ar.accesoRapidoLoginPassword,
    accesoRapidoEmail: ar.accesoRapidoEmail,
    accesoRapidoEmailUi: ar.accesoRapidoEmailUi,
    textoCuentaAtrasBloqueoEmail: ar.textoCuentaAtrasBloqueoEmail,
    mensajeEmailNoCoincide: ar.ACCESO_RAPIDO_MSG_EMAIL_NO_COINCIDE,
    resetAccesoRapidoCheckout: ar.resetAccesoRapidoCheckout,
    setAccesoRapidoCheckoutAbierto: ar.setAccesoRapidoCheckoutAbierto,
    setAccesoRapidoLoginPassword: ar.setAccesoRapidoLoginPassword,
    setAccesoRapidoEmail: ar.setAccesoRapidoEmail,
    setAccesoRapidoEmailUi: ar.setAccesoRapidoEmailUi,
    setAccesoRapidoCodigoUltimoPedido: ar.setAccesoRapidoCodigoUltimoPedido,
    setAccesoRapidoPaso: ar.setAccesoRapidoPaso,
    abrirRegistroForzadoDesdeAcceso: ar.abrirRegistroForzadoDesdeAcceso,
    entrarAccesoRapido: ar.entrarAccesoRapido,
    enviarCodigoAccesoRapidoPaso1: ar.enviarCodigoAccesoRapidoPaso1,
    accesoRapidoCodigoUltimoPedido: ar.accesoRapidoCodigoUltimoPedido,
    msBloqueoSeguridadAccesoRapido: ar.msBloqueoSeguridadAccesoRapido,
    accesoRapidoEstadoVerificacionSeguridad: ar.accesoRapidoEstadoVerificacionSeguridad,
    accesoRapidoIntentosSeguridad: ar.accesoRapidoIntentosSeguridad,
    textoCuentaAtrasBloqueoSeguridadUi: ar.textoCuentaAtrasBloqueoSeguridadUi,
    setAccesoRapidoEstadoVerificacionSeguridad: ar.setAccesoRapidoEstadoVerificacionSeguridad,
    verificarIdentidadAccesoRapido: ar.verificarIdentidadAccesoRapido,
    accesoRapidoCodigoIngresado: ar.accesoRapidoCodigoIngresado,
    accesoRapidoCodigoBloqueado: ar.accesoRapidoCodigoBloqueado,
    accesoRapidoCodigoExpiradoAhora: ar.accesoRapidoCodigoExpiradoAhora,
    accesoRapidoReenvioEn: ar.accesoRapidoReenvioEn,
    errorCodigo: ar.errorCodigo,
    setErrorCodigo: ar.setErrorCodigo,
    setAccesoRapidoCodigoIngresado: ar.setAccesoRapidoCodigoIngresado,
    verificarCodigoAccesoRapido: ar.verificarCodigoAccesoRapido,
    reenviarCodigoAccesoRapido: ar.reenviarCodigoAccesoRapido,
    accesoRapidoPasswordNueva: ar.accesoRapidoPasswordNueva,
    accesoRapidoPasswordConfirmar: ar.accesoRapidoPasswordConfirmar,
    accesoRapidoMostrarPasswordNueva: ar.accesoRapidoMostrarPasswordNueva,
    accesoRapidoMostrarPasswordConfirmar: ar.accesoRapidoMostrarPasswordConfirmar,
    accesoRapidoPuedeGuardarPassword: ar.accesoRapidoPuedeGuardarPassword,
    accesoRapidoPasswordsCoinciden: ar.accesoRapidoPasswordsCoinciden,
    renderRequisitosPassword: ar.renderRequisitosPassword,
    setAccesoRapidoPasswordNueva: ar.setAccesoRapidoPasswordNueva,
    setAccesoRapidoPasswordConfirmar: ar.setAccesoRapidoPasswordConfirmar,
    setAccesoRapidoMostrarPasswordNueva: ar.setAccesoRapidoMostrarPasswordNueva,
    setAccesoRapidoMostrarPasswordConfirmar: ar.setAccesoRapidoMostrarPasswordConfirmar,
    guardarPasswordAccesoRapido: ar.guardarPasswordAccesoRapido,
    abrirAccesoRapidoCheckout: ar.abrirAccesoRapidoCheckout,
    abrirLoginDesdeCheckout: () => input.setLoginModalAbierto(true)
  };
}
