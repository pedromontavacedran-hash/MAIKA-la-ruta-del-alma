import {
  actualizarUsuarioPorIdApi,
  hasClientSession,
  listarUsuariosApi
} from "../services/apiAuth";
import type { DireccionUsuario } from "../types";
import { leerMaikaUsuarios } from "./maikaUsuarios";
import { perfilUsuarioPayloadDesdeMaika } from "./perfilPayloadDesdeMaika";
import { prepareDireccionesParaGuardar } from "./prepareDireccionesParaGuardar";
import { normalizarTelefonoES9 } from "./telefono";

/**
 * Tras guardar en maika, sube el mismo perfil al servidor si hay JWT y el cliente existe en GET /usuarios.
 * Así gestión / detalle cliente no dependen solo del navegador donde se editó.
 *
 * Debe usar el mismo origen de JWT que `listarUsuariosApi` / `actualizarUsuarioPorIdApi`
 * (`getStoredJwtToken`: token, accessToken, jwt, authToken, fallback en memoria tras login).
 * Solo comprobar JWT en memoria/localStorage dejaba sin sincronizar o desincronizado con las peticiones API (cookie httpOnly).
 */
export async function sincronizarMaikaUsuarioEnServidorSiHayToken(tel9: string): Promise<{ ok: boolean; error?: string }> {
  if (!/^[67]\d{8}$/.test(tel9)) return { ok: true };
  if (!hasClientSession()) return { ok: true };
  const m = leerMaikaUsuarios().find((u) => normalizarTelefonoES9(u.telefono || "") === tel9);
  if (!m) return { ok: true };
  try {
    const lista = await listarUsuariosApi();
    const row = lista.find((u) => normalizarTelefonoES9(u.telefono || "") === tel9);
    if (row?.id === undefined || row?.id === null || String(row.id).trim() === "") return { ok: true };
    const body = perfilUsuarioPayloadDesdeMaika(m);
    if (Array.isArray(body.direcciones)) {
      const preparado = prepareDireccionesParaGuardar(
        body.direcciones as DireccionUsuario[],
        Array.isArray(row.direcciones) ? row.direcciones : [],
        String(body.direccionPredeterminadaId || row.direccionPredeterminadaId || "")
      );
      body.direcciones = preparado.direcciones;
      body.direccionPredeterminadaId = preparado.direccionPredeterminadaId;
    }
    await actualizarUsuarioPorIdApi(row.id, body);
    return { ok: true };
  } catch (e) {
    const msg = String((e as Error)?.message || e);
    if (typeof console !== "undefined") console.warn("[syncMaikaUsuario]", msg);
    return { ok: false, error: msg };
  }
}
