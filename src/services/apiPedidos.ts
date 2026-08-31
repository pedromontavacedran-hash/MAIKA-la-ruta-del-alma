import type { Pedido } from "../types";

import { getApiBaseUrl } from "../config/apiBaseUrl";
import { buildOptionalAuthHeaders } from "../services/apiAuth";
import { fetchMaikaApi } from "../utils/fetchMaikaApi";

/** Error HTTP al crear pedido (permite distinguir 4xx vs red / 5xx en checkout). */
export class PedidoApiError extends Error {
  readonly status: number;
  readonly code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "PedidoApiError";
    this.status = status;
    this.code = code;
  }
}

/**
 * 4xx del POST /pedidos (stock, validación, idempotencia…): no reintentar en outbox como si fuera red.
 */
export function esPedidoApiRechazoClienteSinReintento(error: unknown): boolean {
  return error instanceof PedidoApiError && error.status >= 400 && error.status < 500;
}

function authHeaders() {
  return buildOptionalAuthHeaders();
}

export async function obtenerPedidosApi(): Promise<Pedido[]> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/pedidos`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) {
    throw new Error(`Error al obtener pedidos (${res.status})`);
  }
  const data = await res.json();
  return Array.isArray(data) ? (data as Pedido[]) : [];
}

export async function crearPedidoApi(pedido: Pedido, idempotencyKey?: string): Promise<Pedido> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders()
  };
  const key = idempotencyKey?.trim();
  if (key) {
    headers["Idempotency-Key"] = key;
  }

  const res = await fetchMaikaApi(`${getApiBaseUrl()}/pedidos`, {
    method: "POST",
    headers,
    body: JSON.stringify(pedido)
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    if (!res.ok) {
      throw new Error(`Error al crear pedido (${res.status})`);
    }
    throw new Error("Error al crear pedido (cuerpo no JSON)");
  }

  if (!res.ok) {
    const errMsg =
      body && typeof body === "object" && !Array.isArray(body) && "error" in body
        ? String((body as { error?: unknown }).error ?? "")
        : "";
    const codeRaw =
      body && typeof body === "object" && !Array.isArray(body) && "code" in body
        ? String((body as { code?: unknown }).code ?? "").trim()
        : "";
    throw new PedidoApiError(
      errMsg.trim() || `Error al crear pedido (${res.status})`,
      res.status,
      codeRaw || undefined
    );
  }

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Error al crear pedido (HTTP ${res.status}, se esperaba 200 o 201)`);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Error al crear pedido (respuesta no es un objeto)");
  }

  const numeroEsperado = String(pedido?.numero ?? "").trim();
  const numeroResp = String((body as { numero?: unknown }).numero ?? "").trim();
  if (!numeroEsperado || numeroResp !== numeroEsperado) {
    throw new Error("Error al crear pedido (respuesta sin el número de pedido esperado)");
  }

  return body as Pedido;
}

export async function actualizarEstadoPedidoApi(numero: string, estado: Pedido["estado"]): Promise<Pedido> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/pedidos/${encodeURIComponent(numero)}/estado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ estado })
  });
  if (!res.ok) {
    throw new Error(`Error al actualizar estado (${res.status})`);
  }
  return (await res.json()) as Pedido;
}
