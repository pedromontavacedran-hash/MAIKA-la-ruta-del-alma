import type { Pedido } from "../../types";

export function leerPedidosMaikaLocalStorage(): Pedido[] {
  try {
    const raw = localStorage.getItem("pedidosMaika") || "[]";
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Pedido[]) : [];
  } catch {
    return [];
  }
}

export function guardarPedidosMaikaLocalStorage(pedidos: Pedido[]): void {
  localStorage.setItem("pedidosMaika", JSON.stringify(pedidos));
}

/** Inserta el pedido al inicio y persiste en `pedidosMaika`. */
export function prependPedidoYPersistirPedidosMaika(pedido: Pedido): Pedido[] {
  const nuevos = [pedido, ...leerPedidosMaikaLocalStorage()];
  guardarPedidosMaikaLocalStorage(nuevos);
  return nuevos;
}
