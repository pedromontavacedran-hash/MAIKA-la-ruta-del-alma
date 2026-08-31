import { useCallback, useRef } from "react";
import {
  enviarPedidoWhatsApp,
  type EnviarPedidoWhatsAppContext,
  type EnviarPedidoWhatsAppOverride,
  type ResultadoCheckout
} from "../enviarPedidoWhatsApp";
import type { Pedido } from "../../types";
import { useConfirmarPedido } from "../../hooks/useConfirmarPedido";
import { logCheckoutError } from "../../utils/loggerCheckout";

export type CheckoutInputFragment = Omit<
  EnviarPedidoWhatsAppContext,
  "pedidoApiPendienteRef" | "ejecutarConfirmacionPedido"
>;

export type UseCheckoutMaikaOptions = {
  /** Se lee en cada `ejecutarCheckout` vía ref (siempre estado actual). */
  getInput: () => CheckoutInputFragment;
};

/**
 * Expone `ejecutarCheckout`: solo el motor (`procesarCheckout`).
 * `procesandoPago` lo envuelve App alrededor de `orquestarEnvioPedidoWhatsApp`.
 */
export function useCheckoutMaika(options: UseCheckoutMaikaOptions) {
  const { getInput } = options;
  const getInputRef = useRef(getInput);
  getInputRef.current = getInput;

  const pedidoApiPendienteRef = useRef<Pedido | null>(null);
  /** Evita doble envío si el usuario pulsa dos veces antes de que la UI deshabilite el botón. */
  const procesandoCheckoutRef = useRef(false);
  const getPedido = useCallback(() => pedidoApiPendienteRef.current, []);
  const confirmarFlow = useConfirmarPedido({
    getPedido,
    onError: (error) => {
      logCheckoutError("confirmarPedidoApi", error);
    }
  });

  const ejecutarCheckout = useCallback(
    async (override?: EnviarPedidoWhatsAppOverride): Promise<ResultadoCheckout> => {
      if (procesandoCheckoutRef.current) {
        return {
          tipo: "error",
          mensaje: "El pedido ya se está procesando. Espera un momento."
        };
      }
      procesandoCheckoutRef.current = true;
      try {
        await getInputRef.current().sincronizarCatalogoYCarritoDesdeServidor?.();
        return await enviarPedidoWhatsApp(
          {
            ...getInputRef.current(),
            pedidoApiPendienteRef,
            ejecutarConfirmacionPedido: (opts) => confirmarFlow.ejecutarConfirmacion(opts)
          },
          override
        );
      } finally {
        procesandoCheckoutRef.current = false;
      }
    },
    [confirmarFlow]
  );

  return { ejecutarCheckout };
}
