import { crearPedidoApi } from "../../services/apiPedidos";
import type { Pedido } from "../../types";

type Result = {
  ok: boolean;
  error?: unknown;
};

export async function confirmarPedidoBackend(pedido: Pedido, idempotencyKey?: string): Promise<Result> {
  try {
    await crearPedidoApi(pedido, idempotencyKey);
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}
