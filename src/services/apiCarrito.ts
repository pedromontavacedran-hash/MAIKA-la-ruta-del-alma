import type { ItemCarrito } from "../types";

import { getApiBaseUrl } from "../config/apiBaseUrl";
import { buildOptionalAuthHeaders } from "../services/apiAuth";
import { fetchMaikaApi } from "../utils/fetchMaikaApi";

function authHeaders() {
  return buildOptionalAuthHeaders();
}

type CarritoResponse = {
  usuarioId: string;
  items: ItemCarrito[];
  updatedAt: string | null;
};

export async function obtenerCarritoApi(usuarioId: string): Promise<CarritoResponse> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/carrito/${encodeURIComponent(usuarioId)}`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error(`Error al obtener carrito (${res.status})`);
  return (await res.json()) as CarritoResponse;
}

export async function guardarCarritoApi(usuarioId: string, items: ItemCarrito[]): Promise<CarritoResponse> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/carrito/${encodeURIComponent(usuarioId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ items })
  });
  if (!res.ok) throw new Error(`Error al guardar carrito (${res.status})`);
  return (await res.json()) as CarritoResponse;
}
