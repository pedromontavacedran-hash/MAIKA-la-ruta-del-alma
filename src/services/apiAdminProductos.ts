import type { Dispatch, SetStateAction } from "react";
import { getApiBaseUrl } from "../config/apiBaseUrl";
import type { CampoEnriquecimientoProducto, Producto } from "../types";
import { listaProductosSegura } from "../utils/listaProductosSegura";
import { clearAdminAuthorization } from "../utils/adminAuth";
import { fetchMaikaApi } from "../utils/fetchMaikaApi";

function handleAdminSesionExpirada(res: Response): void {
  if (res.status !== 401 && res.status !== 403) return;
  clearAdminAuthorization();
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
    window.location.assign("/");
  }
}

async function fetchAdminAutenticado(url: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers as HeadersInit | undefined);
  const res = await fetchMaikaApi(url, { ...init, headers, credentials: "include" });
  handleAdminSesionExpirada(res);
  return res;
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string };
    if (j?.error && String(j.error).trim()) return String(j.error).trim();
  } catch {
    /* ignore */
  }
  return fallback;
}

/**
 * Actualiza un producto en `productos.json` (`PUT /admin/productos/:id`).
 * Requiere cookie httpOnly de admin.
 */
export async function putAdminProductoApi(id: number, body: Record<string, unknown>): Promise<Producto> {
  const url = `${getApiBaseUrl()}/admin/productos/${encodeURIComponent(String(id))}`;
  const res = await fetchAdminAutenticado(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `No se pudo guardar el producto (${res.status})`));
  }
  return (await res.json()) as Producto;
}

export async function postAdminProductoApi(body: Record<string, unknown>): Promise<Producto> {
  const res = await fetchAdminAutenticado(`${getApiBaseUrl()}/admin/productos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `No se pudo crear el producto (${res.status})`));
  }
  return (await res.json()) as Producto;
}

/**
 * Lanza el importador sobre un producto (`POST /admin/productos/:id/enriquecer`).
 * `body`: { url?, ean?, marca?, sourceType? } — si se omite, usa lo ya guardado en el producto.
 */
export async function postAdminEnriquecerProductoApi(
  id: number,
  body: Record<string, unknown>
): Promise<Producto> {
  const url = `${getApiBaseUrl()}/admin/productos/${encodeURIComponent(String(id))}/enriquecer`;
  const res = await fetchAdminAutenticado(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `No se pudo enriquecer el producto (${res.status})`));
  }
  return (await res.json()) as Producto;
}

/**
 * Revisión humana de un campo importado (`PATCH /admin/productos/:id/enriquecimiento/:campo`).
 * action "accept" admite sourceUrl/value para elegir alternativa en conflicto; "correct" exige value.
 */
export async function patchAdminEnriquecimientoCampoApi(
  id: number,
  campo: CampoEnriquecimientoProducto,
  body: { action: "accept" | "reject" | "correct"; value?: unknown; sourceUrl?: string }
): Promise<Producto> {
  const url = `${getApiBaseUrl()}/admin/productos/${encodeURIComponent(String(id))}/enriquecimiento/${encodeURIComponent(campo)}`;
  const res = await fetchAdminAutenticado(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `No se pudo actualizar el dato (${res.status})`));
  }
  return (await res.json()) as Producto;
}

/** Baja lógica en servidor (`activo: false`). */
export async function deleteAdminProductoApi(id: number): Promise<void> {
  const url = `${getApiBaseUrl()}/admin/productos/${encodeURIComponent(String(id))}`;
  const res = await fetchAdminAutenticado(url, {
    method: "DELETE",
    headers: { Accept: "application/json" }
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `No se pudo eliminar el producto (${res.status})`));
  }
}

/**
 * Catálogo completo en admin (`GET /admin/productos`). Incluye inactivos.
 */
export async function getAdminProductosApi(): Promise<unknown[]> {
  const res = await fetchAdminAutenticado(`${getApiBaseUrl()}/admin/productos`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `No se pudo leer el catálogo admin (${res.status})`));
  }
  const data: unknown = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Misma fuente que la tienda: solo productos con `activo !== false`.
 */
export async function fetchAdminProductosCatalogoActivo(): Promise<Producto[]> {
  const raw = await getAdminProductosApi();
  const activos = raw.filter(
    (x) => x && typeof x === "object" && (x as { activo?: boolean }).activo !== false
  );
  return listaProductosSegura(activos);
}

function particionarCuatroListas(list: Producto[]): {
  velas: Producto[];
  inciensos: Producto[];
  figuras: Producto[];
  kits: Producto[];
  joyas: Producto[];
} {
  const porCat = (c: Producto["categoria"]) =>
    list.filter((p) => p.categoria === c).sort((a, b) => a.id - b.id);
  return {
    velas: porCat("velas"),
    inciensos: porCat("inciensos"),
    figuras: porCat("figuras"),
    kits: porCat("kits"),
    joyas: porCat("joyas")
  };
}

/** Tras PUT/POST/DELETE: alinear estado React con `productos.json` (solo activos, como la tienda). */
export async function aplicarCatalogoActivoEnEstado(
  setVelas: Dispatch<SetStateAction<Producto[]>>,
  setInciensos: Dispatch<SetStateAction<Producto[]>>,
  setFiguras: Dispatch<SetStateAction<Producto[]>>,
  setKits: Dispatch<SetStateAction<Producto[]>>,
  setJoyas: Dispatch<SetStateAction<Producto[]>>
): Promise<void> {
  const ok = await fetchAdminProductosCatalogoActivo();
  const { velas, inciensos, figuras, kits, joyas } = particionarCuatroListas(ok);
  setVelas(velas);
  setInciensos(inciensos);
  setFiguras(figuras);
  setKits(kits);
  setJoyas(joyas);
}
