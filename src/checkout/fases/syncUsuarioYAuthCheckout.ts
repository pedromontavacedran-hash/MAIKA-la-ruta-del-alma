import type { Cliente } from "../../types";
import { sincronizarUsuarioServidorCheckout } from "../../utils/checkoutSyncUsuarioServidor";
import { resolverUsuarioYAuthTrasSyncCheckout } from "../services/usuarioDesdeLoginSync";

/**
 * Sync de perfil / JWT antes del pedido.
 * El carrito en servidor no se toca aquí: una sola vaciado al final en `persistirTrasPedidoCheckout` vía `vaciarCarritoServidorSiHayToken`.
 */
export async function syncUsuarioYAuthCheckout(
  dcOk: Cliente,
  telefonoNormalizadoCheckout: string,
  direccionEnvioCompletaTexto: string
) {
  const syncSrv = await sincronizarUsuarioServidorCheckout({
    datosCliente: dcOk,
    direccionEnvioLinea: direccionEnvioCompletaTexto,
    tel9: telefonoNormalizadoCheckout
  });

  const { usuarioActualizado, authHydrated } = resolverUsuarioYAuthTrasSyncCheckout(syncSrv);

  const errorSync = syncSrv.ok === false ? syncSrv.error : undefined;

  return { usuarioActualizado, authHydrated, errorSync };
}
