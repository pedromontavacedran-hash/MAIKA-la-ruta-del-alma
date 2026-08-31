import { guardarCarritoApi } from "../../services/apiCarrito";
import { hasClientSession } from "../../services/apiAuth";
import { logCheckoutError } from "../../utils/loggerCheckout";
import { getUsuarioId } from "../../utils/usuarioId";

/** Único punto de vaciado en API durante checkout exitoso: llamar solo desde `persistirTrasPedidoCheckout`. */
export async function vaciarCarritoServidorSiHayToken(contextoLog: string): Promise<void> {
  if (typeof localStorage === "undefined" || !hasClientSession()) return;
  try {
    await guardarCarritoApi(getUsuarioId(), []);
  } catch (e) {
    logCheckoutError(`vaciarCarritoServidor_${contextoLog}`, e);
  }
}
