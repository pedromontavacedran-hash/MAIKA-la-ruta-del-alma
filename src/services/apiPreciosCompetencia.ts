import { getApiBaseUrl } from "../config/apiBaseUrl";
import { fetchMaikaApi } from "../utils/fetchMaikaApi";

export type ItemComparativaPrecio = {
  id: number;
  categoria: string | null;
  nombre: string;
  imagen: string | null;
  marca: string | null;
  precioMio: number | null;
  urlOrigen: string;
  precioOrigen: number | null;
  precioRegularOrigen: number | null;
  comprobadoEn: string | null;
  ok: boolean | null;
  error: string | null;
};

function errorHttp(res: Response): Error {
  return new Error(res.status === 403 ? "sesión admin caducada (vuelve a entrar al panel)" : `Error ${res.status}`);
}

/** Lee la última comparativa guardada (rápido: no descarga webs del fabricante). */
export async function leerPreciosCompetencia(): Promise<ItemComparativaPrecio[]> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/admin/precios-competencia`, { cache: "no-store" });
  const j = (await res.json().catch(() => ({}))) as { ok?: boolean; items?: ItemComparativaPrecio[] };
  if (!res.ok || !j.ok) throw errorHttp(res);
  return j.items ?? [];
}

/** Re-descarga el precio del fabricante de todos los productos con enlace de origen. */
export async function comprobarTodosPreciosCompetencia(): Promise<ItemComparativaPrecio[]> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/admin/precios-competencia`, { method: "POST" });
  const j = (await res.json().catch(() => ({}))) as { ok?: boolean; items?: ItemComparativaPrecio[] };
  if (!res.ok || !j.ok) throw errorHttp(res);
  return j.items ?? [];
}

/** Re-descarga solo los productos pendientes (nunca comprobados o con URL cambiada). */
export async function comprobarPendientesPreciosCompetencia(): Promise<ItemComparativaPrecio[]> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/admin/precios-competencia?pendientes=1`, { method: "POST" });
  const j = (await res.json().catch(() => ({}))) as { ok?: boolean; items?: ItemComparativaPrecio[] };
  if (!res.ok || !j.ok) throw errorHttp(res);
  return j.items ?? [];
}

/** Re-descarga el precio del fabricante de un solo producto. */
export async function comprobarPrecioOrigenProducto(id: number): Promise<ItemComparativaPrecio> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/admin/productos/${id}/precio-origen`, { method: "POST" });
  const j = (await res.json().catch(() => ({}))) as { ok?: boolean; item?: ItemComparativaPrecio; error?: string };
  if (!res.ok || !j.ok || !j.item) throw new Error(j.error ?? `Error ${res.status}`);
  return j.item;
}
