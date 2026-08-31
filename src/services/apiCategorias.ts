import { getApiBaseUrl } from "../config/apiBaseUrl";
import type { CategoriaEntrada, SubcategoriaEntrada } from "../types";
import { fetchMaikaApi } from "../utils/fetchMaikaApi";
import { clearAdminAuthorization } from "../utils/adminAuth";

function categoriaValida(c: unknown): c is CategoriaEntrada {
  return !!c && typeof c === "object" && typeof (c as CategoriaEntrada).id === "string" && typeof (c as CategoriaEntrada).nombre === "string";
}

function subcategoriaValida(s: unknown): s is SubcategoriaEntrada {
  return (
    !!s &&
    typeof s === "object" &&
    typeof (s as SubcategoriaEntrada).id === "string" &&
    typeof (s as SubcategoriaEntrada).categoriaId === "string" &&
    typeof (s as SubcategoriaEntrada).nombre === "string"
  );
}

/** Catálogo público de categorías (`GET /categorias`). `null` si la red falla o la respuesta no es usable. */
export async function fetchCategoriasTienda(): Promise<CategoriaEntrada[] | null> {
  try {
    const res = await fetchMaikaApi(`${getApiBaseUrl()}/categorias`, { cache: "no-store" });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return null;
    const ok = data.filter(categoriaValida);
    return ok.length > 0 ? ok : null;
  } catch {
    return null;
  }
}

/** Catálogo público de subcategorías (`GET /subcategorias`). `null` si la red falla o la respuesta no es usable. */
export async function fetchSubcategoriasTienda(): Promise<SubcategoriaEntrada[] | null> {
  try {
    const res = await fetchMaikaApi(`${getApiBaseUrl()}/subcategorias`, { cache: "no-store" });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return null;
    return data.filter(subcategoriaValida);
  } catch {
    return null;
  }
}

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

export async function postAdminCategoriaApi(nombre: string, imagen?: string | null): Promise<CategoriaEntrada> {
  const res = await fetchAdminAutenticado(`${getApiBaseUrl()}/admin/categorias`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ nombre, ...(imagen ? { imagen } : {}) })
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, `No se pudo crear la categoría (${res.status})`));
  return (await res.json()) as CategoriaEntrada;
}

/** `imagen`: `undefined` no la toca, `null`/"" la borra, una data URL o ruta la guarda/actualiza. */
export async function putAdminCategoriaApi(id: string, nombre: string, imagen?: string | null): Promise<CategoriaEntrada> {
  const res = await fetchAdminAutenticado(`${getApiBaseUrl()}/admin/categorias/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ nombre, ...(imagen !== undefined ? { imagen: imagen ?? "" } : {}) })
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, `No se pudo guardar la categoría (${res.status})`));
  return (await res.json()) as CategoriaEntrada;
}

export async function deleteAdminCategoriaApi(id: string): Promise<void> {
  const res = await fetchAdminAutenticado(`${getApiBaseUrl()}/admin/categorias/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, `No se pudo eliminar la categoría (${res.status})`));
}

export async function postAdminSubcategoriaApi(categoriaId: string, nombre: string): Promise<SubcategoriaEntrada> {
  const res = await fetchAdminAutenticado(`${getApiBaseUrl()}/admin/subcategorias`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ categoriaId, nombre })
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, `No se pudo crear la subcategoría (${res.status})`));
  return (await res.json()) as SubcategoriaEntrada;
}

export async function putAdminSubcategoriaApi(id: string, nombre: string): Promise<SubcategoriaEntrada> {
  const res = await fetchAdminAutenticado(`${getApiBaseUrl()}/admin/subcategorias/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ nombre })
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, `No se pudo guardar la subcategoría (${res.status})`));
  return (await res.json()) as SubcategoriaEntrada;
}

export async function deleteAdminSubcategoriaApi(id: string): Promise<void> {
  const res = await fetchAdminAutenticado(`${getApiBaseUrl()}/admin/subcategorias/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, `No se pudo eliminar la subcategoría (${res.status})`));
}
