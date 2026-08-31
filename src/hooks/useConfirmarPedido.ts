import { useCallback } from "react";
import type {
  ConfirmarPedidoIdempotencyOpts,
  ResultadoConfirmacionPedidoApi
} from "../checkout/procesarCheckout.types";
import { hasClientSession, probeClientSessionApi } from "../services/apiAuth";
import { PedidoApiError } from "../services/apiPedidos";
import { confirmarPedidoBackend } from "../utils/pedidos/confirmarPedidoBackend";
import type { Pedido } from "../types";

type Params = {
  getPedido: () => Pedido | null;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

export function useConfirmarPedido({
  getPedido,
  onSuccess,
  onError
}: Params) {
  const ejecutarConfirmacion = useCallback(
    async (opts: ConfirmarPedidoIdempotencyOpts): Promise<ResultadoConfirmacionPedidoApi> => {
      const pedido = getPedido();
      if (!pedido) {
        const error = new Error("No hay pedido para confirmar");
        onError?.(error);
        return { ok: false, kind: "red_o_5xx", mensaje: error.message };
      }

      let sesionActiva = hasClientSession();
      if (!sesionActiva) {
        sesionActiva = await probeClientSessionApi();
      }
      if (!sesionActiva) {
        return { ok: false, kind: "sin_token" };
      }

      const res = await confirmarPedidoBackend(pedido, opts.idempotencyKey);
      if (res.ok) {
        onSuccess?.();
        return { ok: true };
      }
      onError?.(res.error);
      const e = res.error;
      if (e instanceof PedidoApiError && e.status >= 400 && e.status < 500) {
        return { ok: false, kind: "rechazo_servidor", mensaje: e.message };
      }
      return {
        ok: false,
        kind: "red_o_5xx",
        mensaje: e instanceof Error ? e.message : String(e ?? "")
      };
    },
    [getPedido, onSuccess, onError]
  );

  return { ejecutarConfirmacion };
}
