import { getApiBaseUrl } from "../config/apiBaseUrl";
import { fetchMaikaApi } from "../utils/fetchMaikaApi";
import { isAdminAuthorized } from "../utils/adminAuth";
import {
  buildCheckoutVisualPayloadFromLocalStorage,
  type CheckoutVisualPresetPayload
} from "../utils/checkoutVisualPresets";
import {
  storageLeerBaselineJson,
  storageLeerPresetsJson
} from "../utils/checkoutVisualPresetsStorage";
import { leerDisenoWebExtras, type DisenoWebExtras } from "../utils/disenoWebExtras";

/**
 * Lo que se guarda en el servidor:
 * - `visual`: diseño (barra, fondo, hero, logo, layout) — lo aplican todos los visitantes.
 * - `extras`: campaña, desplegable, servicios, cupones, /lectura, CTA explorar, umbral, nota.
 * - `admin`: presets y baseline de restauración — solo para admin (no se sirven al público).
 */
export type DisenoWebServidorPayload = {
  visual?: CheckoutVisualPresetPayload;
  extras?: Partial<DisenoWebExtras>;
  admin?: {
    presetsJson?: string | null;
    baselineJson?: string | null;
  };
};

function payloadDesdeRespuesta(j: unknown): DisenoWebServidorPayload | null {
  const payload = (j as { payload?: unknown } | null)?.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  return payload as DisenoWebServidorPayload;
}

/** Diseño público publicado (sin sección admin). null si no hay o falla la petición. */
export async function leerDisenoWebServidor(signal?: AbortSignal): Promise<DisenoWebServidorPayload | null> {
  try {
    const res = await fetchMaikaApi(`${getApiBaseUrl()}/diseno-web`, { cache: "no-store", signal });
    const j = await res.json().catch(() => ({}));
    if (res.ok && j?.ok) return payloadDesdeRespuesta(j);
  } catch {
    /* backend caído → se usa el diseño local */
  }
  return null;
}

/** Diseño completo incluida la sección admin (presets/baseline). null si no hay sesión admin o no hay datos. */
export async function leerDisenoWebAdminServidor(): Promise<DisenoWebServidorPayload | null> {
  try {
    const res = await fetchMaikaApi(`${getApiBaseUrl()}/admin/diseno-web`, { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (res.ok && j?.ok) return payloadDesdeRespuesta(j);
  } catch {
    /* sin sesión admin o backend caído */
  }
  return null;
}

export async function publicarDisenoWebServidor(
  payload: DisenoWebServidorPayload
): Promise<{ ok: true } | { ok: false; status: number }> {
  const res = await fetchMaikaApi(`${getApiBaseUrl()}/admin/diseno-web`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ payload })
  });
  if (res.ok) return { ok: true };
  return { ok: false, status: res.status };
}

let timerPublicacion: number | null = null;
const PUBLICACION_DEBOUNCE_MS = 900;

/**
 * El admin guarda algo de diseño/config en localStorage → publicamos todo al servidor
 * (debounce: varios cambios seguidos = una sola subida). Visitantes no publican nada.
 */
export function programarPublicacionDisenoWeb(): void {
  if (typeof window === "undefined") return;
  if (timerPublicacion != null) window.clearTimeout(timerPublicacion);
  timerPublicacion = window.setTimeout(() => {
    timerPublicacion = null;
    if (!isAdminAuthorized()) return;
    void (async () => {
      const [presetsJson, baselineJson] = await Promise.all([
        storageLeerPresetsJson(),
        storageLeerBaselineJson()
      ]);
      const payload: DisenoWebServidorPayload = {
        visual: buildCheckoutVisualPayloadFromLocalStorage(),
        extras: leerDisenoWebExtras(),
        admin: { presetsJson, baselineJson }
      };
      await publicarDisenoWebServidor(payload).catch(() => {});
    })();
  }, PUBLICACION_DEBOUNCE_MS);
}
