import type { EnviarPedidoWhatsAppOverride, ResultadoCheckout } from "../../checkout/procesarCheckout.types";
import {
  orquestarEnvioPedidoWhatsApp,
  type OrquestarEnvioPedidoWhatsAppDeps
} from "../../checkout/ui/orquestarEnvioPedidoWhatsApp";

export type EjecutarCheckoutMaika = (override?: EnviarPedidoWhatsAppOverride) => Promise<ResultadoCheckout>;

/**
 * Punto de entrada de aplicación al flujo post-motor: mantiene `App` desacoplada de `checkout/ui/orquestarEnvioPedidoWhatsApp`.
 */
export async function orquestarCheckout(
  ejecutarCheckout: EjecutarCheckoutMaika,
  override: EnviarPedidoWhatsAppOverride | undefined,
  deps: OrquestarEnvioPedidoWhatsAppDeps
): Promise<void> {
  await orquestarEnvioPedidoWhatsApp(ejecutarCheckout, override, deps);
}
