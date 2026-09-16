import { getApiBaseUrl } from "../config/apiBaseUrl";
import { fetchMaikaApi } from "../utils/fetchMaikaApi";

export type WebEstado = { cerrada: boolean; mensaje: string };

/** Estado público de la web (interruptor abierta/cerrada). Si falla, asumimos abierta. */
export async function leerEstadoWeb(signal?: AbortSignal): Promise<WebEstado> {
  try {
    const res = await fetchMaikaApi(`${getApiBaseUrl()}/estado-web`, { cache: "no-store", signal });
    const j = await res.json().catch(() => ({}));
    if (res.ok && j?.ok) {
      return { cerrada: j.cerrada === true, mensaje: String(j.mensaje || "") };
    }
  } catch {
    /* backend caído → no bloquear la web */
  }
  return { cerrada: false, mensaje: "" };
}

export async function guardarEstadoWebApi(
  estado: WebEstado
): Promise<{ ok: true } | { ok: false; status: number }> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/admin/estado-web`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(estado)
  });
  if (res.ok) return { ok: true };
  return { ok: false, status: res.status };
}
