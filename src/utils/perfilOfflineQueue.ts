import { actualizarPerfilUsuarioApi, type UsuarioPerfilCompletoApi } from "../services/apiAuth";
import { generarUuidV4 } from "./appIdentity";
import { esErrorDeConexion } from "./esErrorDeConexion";
import { encolarPerfilPatch, programarSincronizarOutbox } from "./maikaOutbox";
import { normalizarTelefonoES9 } from "./telefono";

function esErrorPerfilReintentable(error: unknown): boolean {
  if (esErrorDeConexion(error)) return true;
  const mensaje = error instanceof Error ? error.message : String(error);
  const status = Number(/Actualizaci[oó]n de perfil fallida \((\d+)\)/i.exec(mensaje)?.[1] || 0);
  return Number.isFinite(status) && status >= 500;
}

export type ActualizarPerfilOEncolarResult =
  | { ok: true; enqueued: false; usuario: UsuarioPerfilCompletoApi }
  | { ok: false; enqueued: true; idempotencyKey: string };

export async function actualizarPerfilOEncolar(
  body: Record<string, unknown>,
  opts?: { dedupeKey?: string; idempotencyKey?: string }
): Promise<ActualizarPerfilOEncolarResult> {
  const idempotencyKey = String(opts?.idempotencyKey || "").trim() || generarUuidV4();
  try {
    const res = await actualizarPerfilUsuarioApi(body, { idempotencyKey });
    return { ok: true, enqueued: false, usuario: res.usuario };
  } catch (error) {
    if (!esErrorPerfilReintentable(error)) throw error;
    encolarPerfilPatch(body, idempotencyKey, opts?.dedupeKey || "perfil:me");
    programarSincronizarOutbox(normalizarTelefonoES9);
    return { ok: false, enqueued: true, idempotencyKey };
  }
}
