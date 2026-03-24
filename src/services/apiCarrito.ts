import type { ItemCarrito } from "../types";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || "http://localhost:3001";
const TOKEN_KEY = "token";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

type CarritoResponse = {
  usuarioId: string;
  items: ItemCarrito[];
  updatedAt: string | null;
};

export async function obtenerCarritoApi(usuarioId: string): Promise<CarritoResponse> {
  const res = await fetch(`${API_URL}/carrito/${encodeURIComponent(usuarioId)}`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error(`Error al obtener carrito (${res.status})`);
  return (await res.json()) as CarritoResponse;
}

export async function guardarCarritoApi(usuarioId: string, items: ItemCarrito[]): Promise<CarritoResponse> {
  const res = await fetch(`${API_URL}/carrito/${encodeURIComponent(usuarioId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ items })
  });
  if (!res.ok) throw new Error(`Error al guardar carrito (${res.status})`);
  return (await res.json()) as CarritoResponse;
}
