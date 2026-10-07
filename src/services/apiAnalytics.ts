import { getApiBaseUrl } from "../config/apiBaseUrl";
import { fetchMaikaApi } from "../utils/fetchMaikaApi";
import { clearAdminAuthorization } from "../utils/adminAuth";

export type AnaliticaDia = {
  fecha: string;
  sesiones: number;
  primeraVez: number;
  recurrentes: number;
  vistas: number;
  secciones: Record<string, number>;
  entradas: Record<string, number>;
  salidas: Record<string, number>;
  procedencia: Record<string, number>;
  dispositivo: Record<string, number>;
  duracionTotalMs: number;
  duraciones: number;
  funciones: Record<string, number>;
  /** slug editorial → vistas agregadas (solo slugs cerrados de `articulos.ts`). */
  articulos: Record<string, number>;
};

export type AnaliticaResumen = {
  hoy: string;
  dias: number;
  porDia: AnaliticaDia[];
  totales: Omit<AnaliticaDia, "fecha">;
};

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string };
    if (j?.error && String(j.error).trim()) return String(j.error).trim();
  } catch {
    /* ignore */
  }
  return fallback;
}

/** Resumen agregado de la analítica propia: solo admin (cookie `admin_token`). */
export async function fetchAdminAnaliticaApi(dias = 30): Promise<AnaliticaResumen> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/admin/analytics?dias=${dias}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include"
  });
  if (res.status === 401 || res.status === 403) {
    clearAdminAuthorization();
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
      window.location.assign("/");
    }
  }
  if (!res.ok) throw new Error(await readErrorMessage(res, `No se pudo leer la analítica (${res.status})`));
  return (await res.json()) as AnaliticaResumen;
}

/** Vacía toda la estadística agregada. Solo admin; el panel pide confirmación antes de llamar. */
export async function resetAdminAnaliticaApi(): Promise<void> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/admin/analytics`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    credentials: "include"
  });
  if (res.status === 401 || res.status === 403) {
    clearAdminAuthorization();
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
      window.location.assign("/");
    }
  }
  if (!res.ok) throw new Error(await readErrorMessage(res, `No se pudo reiniciar la analítica (${res.status})`));
}
