import type { Pedido } from "../../types";
import type { MaikaPedidoLS } from "../maikaPedidos";
import { actualizarEstadoPedidoApi } from "../../services/apiPedidos";

const PEDIDOS_MAIKA_STORAGE_KEY = "pedidosMaika";

export type SincronizarEstadoPedidoMaikaInput = {
  pedidos: Pedido[];
  numeroPedido: string;
  nuevoEstado: Pedido["estado"];
  leerMaikaPedidos: () => MaikaPedidoLS[];
  guardarMaikaPedidos: (p: MaikaPedidoLS[]) => void;
};

export type SincronizarEstadoPedidoMaikaResult =
  | { ok: true; nuevosPedidos: Pedido[]; pedidoOriginal: Pedido }
  | { ok: false; razon: "no_encontrado" };

/**
 * Actualiza estado en memoria local (`pedidosMaika`), intenta API y alinea `maika_pedidos` por `idPedido`.
 */
export async function sincronizarEstadoPedidoMaika(
  input: SincronizarEstadoPedidoMaikaInput
): Promise<SincronizarEstadoPedidoMaikaResult> {
  const { pedidos, numeroPedido, nuevoEstado, leerMaikaPedidos, guardarMaikaPedidos } = input;

  const pedidoOriginal = pedidos.find((p) => p.numero === numeroPedido);
  if (!pedidoOriginal) return { ok: false, razon: "no_encontrado" };

  const nuevosPedidos = pedidos.map((p) =>
    p.numero === numeroPedido ? { ...p, estado: nuevoEstado } : p
  );

  localStorage.setItem(PEDIDOS_MAIKA_STORAGE_KEY, JSON.stringify(nuevosPedidos));
  try {
    await actualizarEstadoPedidoApi(numeroPedido, nuevoEstado);
  } catch {
    // Si backend no responde, dejamos el cambio guardado localmente.
  }

  try {
    const historial = leerMaikaPedidos();
    const siguienteHistorial = historial.map((p) =>
      p.idPedido === numeroPedido ? { ...p, estado: nuevoEstado } : p
    );
    guardarMaikaPedidos(siguienteHistorial);
  } catch {
    // Si el historial no existe o está corrupto, no bloqueamos la actualización del pedido.
  }

  return { ok: true, nuevosPedidos, pedidoOriginal };
}
