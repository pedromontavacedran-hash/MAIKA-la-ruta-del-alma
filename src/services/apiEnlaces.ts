import { getApiBaseUrl } from "../config/apiBaseUrl";
import { ENLACES_DEFAULT, type EnlaceConfig } from "../config/enlaces";
import { fetchMaikaApi } from "../utils/fetchMaikaApi";

function sanearEnlace(e: unknown): EnlaceConfig | null {
  if (!e || typeof e !== "object") return null;
  const o = e as Record<string, unknown>;
  const etiqueta = String(o.etiqueta ?? "").trim();
  const url = String(o.url ?? "").trim();
  if (!etiqueta || !url) return null;
  return {
    id: String(o.id ?? "").trim() || etiqueta,
    etiqueta,
    url,
    icono: String(o.icono ?? "").trim(),
    activa: o.activa !== false
  };
}

function sanearLista(raw: unknown): EnlaceConfig[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(sanearEnlace).filter((e): e is EnlaceConfig => e !== null);
}

/**
 * Lee la configuración de `/enlaces`. Si el backend no responde (p. ej. web
 * estática sin API), devuelve los enlaces por defecto para que la página del
 * QR nunca quede en blanco.
 */
export async function leerEnlacesConfig(signal?: AbortSignal): Promise<EnlaceConfig[]> {
  try {
    const res = await fetchMaikaApi(`${getApiBaseUrl()}/enlaces-config`, { cache: "no-store", signal });
    const j = (await res.json().catch(() => ({}))) as { ok?: boolean; enlaces?: unknown };
    if (res.ok && j?.ok) {
      // Lista vacía válida: el admin puede haber retirado todos los enlaces a propósito.
      return sanearLista(j.enlaces);
    }
  } catch {
    /* backend caído → defaults */
  }
  return ENLACES_DEFAULT.map((e) => ({ ...e }));
}

export async function guardarEnlacesAdminApi(
  enlaces: EnlaceConfig[]
): Promise<{ ok: true; enlaces: EnlaceConfig[] } | { ok: false; status: number }> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/admin/enlaces`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ enlaces })
  });
  if (!res.ok) return { ok: false, status: res.status };
  const j = (await res.json().catch(() => ({}))) as { enlaces?: unknown };
  return { ok: true, enlaces: sanearLista(j.enlaces) };
}
