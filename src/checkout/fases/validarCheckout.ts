import type { EnviarPedidoWhatsAppContext, EnviarPedidoWhatsAppOverride, ResultadoCheckout } from "../procesarCheckout.types";
import { validarCheckoutPedido, type ValidarCheckoutPedidoResult } from "../core/procesarPedido";

/**
 * Validación obligatoria del checkout en el motor (override + `validarCheckoutPedido`).
 * No debe duplicarse en la UI como única barrera: `procesarCheckout` siempre pasa por aquí antes de sync/persistir.
 */
export function validarCheckout(
  ctx: EnviarPedidoWhatsAppContext,
  override?: EnviarPedidoWhatsAppOverride
): { salida: ResultadoCheckout } | Extract<ValidarCheckoutPedidoResult, { ok: true }> {
  const { datosCliente, datosPago, cart, bizumYaConfirmadoPorUsuario } = ctx;

  const datosClienteActual = override?.datosCliente ?? datosCliente;
  const datosPagoActual = override?.datosPago ?? datosPago;

  const validacion = validarCheckoutPedido({
    datosClienteActual,
    datosPagoActual,
    cart,
    bizumYaConfirmadoPorUsuario
  });

  if (validacion.ok === false) {
    if (validacion.tipo === "confirmar_bizum") {
      return { salida: { tipo: "bizum_confirmacion" } };
    }
    return { salida: { tipo: "error", mensaje: validacion.mensaje } };
  }

  return validacion;
}
