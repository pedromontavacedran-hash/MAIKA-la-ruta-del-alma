import type { EnviarPedidoWhatsAppOverride, ResultadoCheckout } from "../procesarCheckout.types";
import { aplicarEstadoUiTrasCheckoutCompletado, type AplicarEstadoUiTrasCheckoutCompletadoDeps } from "./aplicarEstadoUiTrasCheckoutCompletado";
import { manejarConfirmacionBizum, type ManejarConfirmacionBizumDeps } from "./manejarConfirmacionBizum";
import { manejarErrorCheckout, type ManejarErrorCheckoutDeps } from "./manejarErrorCheckout";

export type OrquestarEnvioPedidoWhatsAppDeps = AplicarEstadoUiTrasCheckoutCompletadoDeps &
  ManejarConfirmacionBizumDeps &
  ManejarErrorCheckoutDeps;

/**
 * Tras `ejecutarCheckout` (motor en `procesarCheckout`), aplica solo efectos de UI según `resultado.tipo`.
 */
export async function orquestarEnvioPedidoWhatsApp(
  ejecutarCheckout: (override?: EnviarPedidoWhatsAppOverride) => Promise<ResultadoCheckout>,
  override: EnviarPedidoWhatsAppOverride | undefined,
  deps: OrquestarEnvioPedidoWhatsAppDeps
): Promise<void> {
  let resultado: ResultadoCheckout;
  try {
    resultado = await ejecutarCheckout(override);
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Error inesperado al procesar el pedido. Inténtalo de nuevo.";
    manejarErrorCheckout(
      { tipo: "error", mensaje: msg },
      {
        mostrarNotificacion: deps.mostrarNotificacion,
        setMensajeErrorCheckoutPago: deps.setMensajeErrorCheckoutPago,
        onMarcarCheckoutErrorRechazoServidor: deps.onMarcarCheckoutErrorRechazoServidor
      }
    );
    return;
  }
  const { setConfirmacionBizumOtroNumeroAbierto, ...depsCompletado } = deps;

  switch (resultado.tipo) {
    case "ok":
      aplicarEstadoUiTrasCheckoutCompletado(resultado, depsCompletado);
      return;
    case "error":
      manejarErrorCheckout(resultado, {
        mostrarNotificacion: deps.mostrarNotificacion,
        setMensajeErrorCheckoutPago: deps.setMensajeErrorCheckoutPago,
        onMarcarCheckoutErrorRechazoServidor: deps.onMarcarCheckoutErrorRechazoServidor
      });
      return;
    case "bizum_confirmacion":
      manejarConfirmacionBizum(resultado, { setConfirmacionBizumOtroNumeroAbierto });
      return;
    default: {
      const _never: never = resultado;
      return _never;
    }
  }
}
