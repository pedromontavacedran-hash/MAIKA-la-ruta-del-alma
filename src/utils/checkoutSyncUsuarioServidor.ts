import {
  guardarSnapshotPerfilCliente,
  hasClientSession,
  iniciarSesionCheckoutApi,
  obtenerPerfilApi,
  type UsuarioPerfilCompletoApi
} from "../services/apiAuth";
import type { Cliente, DireccionUsuario } from "../types";
import { perfilUsuarioPayloadDesdeClienteCheckout } from "./perfilPayloadDesdeMaika";
import { actualizarPerfilOEncolar } from "./perfilOfflineQueue";
import { prepareDireccionesParaGuardar } from "./prepareDireccionesParaGuardar";

function persistirPerfilTrasCheckout(usuario?: UsuarioPerfilCompletoApi): void {
  if (usuario) guardarSnapshotPerfilCliente(usuario);
}

export type SyncCheckoutUsuarioResult =
  | { ok: true; kind: "patch"; usuario?: UsuarioPerfilCompletoApi }
  | { ok: true; kind: "login"; usuario?: UsuarioPerfilCompletoApi }
  | { ok: false; error: string };

function fusionarDireccionesConPerfilExistente(
  body: Record<string, unknown>,
  perfil: UsuarioPerfilCompletoApi | null
): Record<string, unknown> {
  if (!Array.isArray(body.direcciones)) return body;
  const predRaw = String(body.direccionPredeterminadaId || perfil?.direccionPredeterminadaId || "").trim();
  const preparado = prepareDireccionesParaGuardar(
    body.direcciones as DireccionUsuario[],
    Array.isArray(perfil?.direcciones) ? perfil.direcciones : [],
    predRaw
  );

  return {
    ...body,
    direcciones: preparado.direcciones,
    direccionPredeterminadaId: preparado.direccionPredeterminadaId
  };
}

async function actualizarPerfilCheckoutConLibreta(body: Record<string, unknown>): Promise<UsuarioPerfilCompletoApi | undefined> {
  let perfilPrevio: UsuarioPerfilCompletoApi | null = null;
  if (hasClientSession()) {
    try {
      perfilPrevio = await obtenerPerfilApi();
    } catch {
      perfilPrevio = null;
    }
  }
  const mergedBody = fusionarDireccionesConPerfilExistente(body, perfilPrevio);
  const r = await actualizarPerfilOEncolar(mergedBody);
  return r.ok ? r.usuario : undefined;
}

/**
 * Antes de crear el pedido en API: actualizar perfil si hay JWT; si no, registrar+login con cuenta por teléfono y PATCH /me.
 * No bloquea el checkout si falla (el llamador decide notificar).
 */
export async function sincronizarUsuarioServidorCheckout(params: {
  datosCliente: Cliente;
  direccionEnvioLinea: string;
  tel9: string;
}): Promise<SyncCheckoutUsuarioResult> {
  const { datosCliente, direccionEnvioLinea, tel9 } = params;
  const body = perfilUsuarioPayloadDesdeClienteCheckout(datosCliente, direccionEnvioLinea);

  if (hasClientSession()) {
    try {
      const usuario = await actualizarPerfilCheckoutConLibreta(body);
      persistirPerfilTrasCheckout(usuario);
      return { ok: true, kind: "patch", usuario };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: msg };
    }
  }

  /**
   * Sesión de checkout como invitado: el servidor crea/reutiliza la cuenta técnica del teléfono y entrega
   * la cookie directamente — ya no se calcula ni se envía una contraseña derivada del teléfono en el cliente.
   * Si el teléfono ya es una cuenta real (email/contraseña propios), el servidor responde 409 y aquí se
   * informa de que hace falta iniciar sesión (mismo resultado que antes cuando la cuenta ya estaba activada).
   */
  try {
    await iniciarSesionCheckoutApi(tel9);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      error: /requiere iniciar sesión/i.test(msg)
        ? "Esta cuenta ya tiene contraseña propia. Inicia sesión en Cuenta para continuar."
        : msg
    };
  }

  try {
    const usuario = await actualizarPerfilCheckoutConLibreta(body);
    persistirPerfilTrasCheckout(usuario);
    return { ok: true, kind: "login", usuario };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
