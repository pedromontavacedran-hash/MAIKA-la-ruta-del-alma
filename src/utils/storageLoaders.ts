import type { Pedido, PerfilCompraRapida } from "../types";

export function cargarPerfilCompraRapidaDesdeStorage(key: string): PerfilCompraRapida | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const perfil = JSON.parse(raw) as PerfilCompraRapida;
    if (perfil?.datosCliente && perfil?.metodoPago && perfil?.datosPago) {
      return perfil;
    }
    return null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function cargarPedidosDesdeStorage(key: string): Pedido[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const pedidosCargados = JSON.parse(raw) as Pedido[];
    const arr = Array.isArray(pedidosCargados) ? pedidosCargados : [];
    const pedidosReparados = arr.map((p: Pedido) => ({
      ...p,
      estado: p.estado || "pendiente"
    }));
    localStorage.setItem(key, JSON.stringify(pedidosReparados));
    return pedidosReparados;
  } catch {
    return [];
  }
}
