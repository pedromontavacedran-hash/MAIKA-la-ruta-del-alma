import { getApiBaseUrl } from "../config/apiBaseUrl";
import type { Sugerencia, TipoSugerencia } from "../types";
import { fetchMaikaApi } from "../utils/fetchMaikaApi";
import { clearAdminAuthorization } from "../utils/adminAuth";
import { buildOptionalAuthHeaders } from "./apiAuth";

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

/** Buzón "Sugerencias y mejoras" del menú. Requiere sesión de cliente; el backend toma el usuario del JWT/cookie. */
export async function enviarSugerenciaApi(datos: {
  tipo: TipoSugerencia;
  mensaje: string;
}): Promise<void> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/sugerencias`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...buildOptionalAuthHeaders() },
    body: JSON.stringify(datos)
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, `No se pudo enviar la sugerencia (${res.status})`));
}

/** Listado completo: solo admin. */
export async function fetchAdminSugerenciasApi(): Promise<Sugerencia[]> {
  const res = await fetchAdminAutenticado(`${getApiBaseUrl()}/admin/sugerencias`, {
    method: "GET",
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, `No se pudieron leer las sugerencias (${res.status})`));
  return (await res.json()) as Sugerencia[];
}

export async function marcarSugerenciaEstadoApi(id: string, estado: "pendiente" | "revisada"): Promise<Sugerencia> {
  const res = await fetchAdminAutenticado(`${getApiBaseUrl()}/admin/sugerencias/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ estado })
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, `No se pudo actualizar la sugerencia (${res.status})`));
  return (await res.json()) as Sugerencia;
}

export async function eliminarSugerenciaApi(id: string): Promise<void> {
  const res = await fetchAdminAutenticado(`${getApiBaseUrl()}/admin/sugerencias/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, `No se pudo eliminar la sugerencia (${res.status})`));
}
