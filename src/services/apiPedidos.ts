import type { Pedido } from "../types";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || "http://localhost:3001";
const TOKEN_KEY = "token";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function obtenerPedidosApi(): Promise<Pedido[]> {
  const res = await fetch(`${API_URL}/pedidos`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) {
    throw new Error(`Error al obtener pedidos (${res.status})`);
  }
  const data = await res.json();
  return Array.isArray(data) ? (data as Pedido[]) : [];
}

export async function crearPedidoApi(pedido: Pedido): Promise<Pedido> {
  const res = await fetch(`${API_URL}/pedidos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(pedido)
  });
  if (!res.ok) {
    throw new Error(`Error al crear pedido (${res.status})`);
  }
  return (await res.json()) as Pedido;
}

export async function actualizarEstadoPedidoApi(numero: string, estado: Pedido["estado"]): Promise<Pedido> {
  const res = await fetch(`${API_URL}/pedidos/${encodeURIComponent(numero)}/estado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ estado })
  });
  if (!res.ok) {
    throw new Error(`Error al actualizar estado (${res.status})`);
  }
  return (await res.json()) as Pedido;
}
