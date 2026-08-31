import type { ItemCarrito, Pedido, Usuario } from "../../types";
import type { CheckoutExitoUiPayload } from "../core/procesarPedido";
import type { CatalogoActualizadoCheckout, ResultadoCheckout } from "../procesarCheckout.types";

export function construirResultadoCompletado(
  pedido: Pedido,
  aplicarInput: CheckoutExitoUiPayload,
  pedidosActualizados: Pedido[],
  usuarioActualizado: Usuario | undefined,
  catalogoActualizado: CatalogoActualizadoCheckout,
  numeroPedido: string,
  authHydrated: true | undefined
): ResultadoCheckout {
  return {
    tipo: "ok",
    pedido,
    urlWhatsApp: aplicarInput.urlWhatsApp,
    aplicarInput,
    pedidosActualizados,
    usuarioActualizado,
    catalogoActualizado,
    nuevoCarrito: [] as ItemCarrito[],
    ultimoPedidoNumero: numeroPedido,
    ...(authHydrated !== undefined ? { authHydrated } : {})
  };
}
