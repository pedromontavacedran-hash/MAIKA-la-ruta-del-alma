import type { ItemCarrito, Pedido } from "../types";

export const MAIKA_PEDIDOS_KEY = "maika_pedidos";

export type MaikaPedidoProductoLS = {
  idProducto: number;
  nombre: string;
  precio: number;
  cantidad: number;
};

export type MaikaPedidoLS = {
  idPedido: string;
  telefono: string; // clave del usuario: +34XXXXXXXXX
  fecha: string; // ISO
  productos: MaikaPedidoProductoLS[];
  total: number;
  direccionCompleta: string;
  estado?: "pendiente" | "enviado" | "entregado";
  nota?: string;
};

export function leerMaikaPedidos(): MaikaPedidoLS[] {
  try {
    const raw = localStorage.getItem(MAIKA_PEDIDOS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as MaikaPedidoLS[]) : [];
  } catch {
    return [];
  }
}

export function guardarMaikaPedidos(pedidos: MaikaPedidoLS[]) {
  localStorage.setItem(MAIKA_PEDIDOS_KEY, JSON.stringify(pedidos));
}

export function obtenerCodigoUltimoPedidoPorTel9(
  tel9: string,
  claveTelefonoES: (telefono: string) => string | null,
  parseFechaPedido: (fecha: string) => Date | null,
  leerMaikaPedidosFn: () => MaikaPedidoLS[]
): string {
  const clave = claveTelefonoES(tel9);
  if (!clave) return "";
  const candidatos: { codigo: string; ts: number }[] = [];
  try {
    const pedidosM = leerMaikaPedidosFn();
    for (const p of pedidosM) {
      if ((p.telefono || "").trim() !== clave) continue;
      const codigo = String(p.idPedido || "").trim();
      if (!codigo) continue;
      candidatos.push({ codigo, ts: parseFechaPedido(p.fecha)?.getTime() || 0 });
    }
  } catch {
    /* ignore */
  }
  try {
    const pedidosL = JSON.parse(localStorage.getItem("pedidosMaika") || "[]") as Pedido[];
    const arr = Array.isArray(pedidosL) ? pedidosL : [];
    for (const p of arr) {
      if (claveTelefonoES(String(p?.cliente?.telefono || "")) !== clave) continue;
      const codigo = String(p?.numero || "").trim();
      if (!codigo) continue;
      candidatos.push({ codigo, ts: parseFechaPedido(p?.fecha || "")?.getTime() || 0 });
    }
  } catch {
    /* ignore */
  }
  if (candidatos.length === 0) return "";
  candidatos.sort((a, b) => b.ts - a.ts);
  return candidatos[0].codigo;
}

export function construirItemsDesdeProductos(
  productos: MaikaPedidoProductoLS[],
  getStockProducto: (id: number) => number,
  normalizarItemCarrito: (item: ItemCarrito) => ItemCarrito
): ItemCarrito[] {
  const items: ItemCarrito[] = [];
  for (const prod of productos) {
    const idNum = Number(prod.idProducto);
    const cantidad = Number.isFinite(Number(prod.cantidad)) ? Number(prod.cantidad) : 0;
    if (!Number.isFinite(idNum) || idNum <= 0 || cantidad <= 0) continue;
    const stockDisponible = getStockProducto(idNum);
    const cantidadFinal = stockDisponible > 0 ? Math.min(cantidad, stockDisponible) : 0;
    if (cantidadFinal <= 0) continue;
    items.push(
      normalizarItemCarrito({
        id: idNum,
        nombre: prod.nombre,
        precio: Number(prod.precio) || 0,
        cantidad: cantidadFinal
      } as ItemCarrito)
    );
  }
  return items;
}

export function sumarPedidoAlCarrito(
  cart: ItemCarrito[],
  productos: MaikaPedidoProductoLS[],
  getStockProducto: (id: number) => number,
  normalizarItemCarrito: (item: ItemCarrito) => ItemCarrito
): ItemCarrito[] {
  const nextMap = new Map<number, ItemCarrito>();
  for (const it of cart) {
    const idNum = Number(it.id);
    if (!Number.isFinite(idNum)) continue;
    nextMap.set(idNum, {
      ...(it as ItemCarrito),
      id: idNum,
      cantidad: Number.isFinite(Number(it.cantidad)) ? Number(it.cantidad) : 0
    });
  }

  for (const prod of productos) {
    const idNum = Number(prod.idProducto);
    const addQty = Number.isFinite(Number(prod.cantidad)) ? Number(prod.cantidad) : 0;
    if (!Number.isFinite(idNum) || idNum <= 0 || addQty <= 0) continue;
    const stockDisponible = getStockProducto(idNum);
    if (stockDisponible <= 0) continue;

    const existing = nextMap.get(idNum);
    const baseQty = existing ? existing.cantidad : 0;
    const mergedQty = baseQty + addQty;
    const cantidadFinal = Math.min(mergedQty, stockDisponible);
    if (cantidadFinal <= 0) continue;

    nextMap.set(idNum, {
      id: idNum,
      nombre: (existing?.nombre || prod.nombre) as string,
      precio: existing?.precio ?? (Number(prod.precio) || 0),
      cantidad: cantidadFinal
    } as ItemCarrito);
  }

  return Array.from(nextMap.values()).map((it) => normalizarItemCarrito(it));
}
