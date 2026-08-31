import type { Usuario } from "../../types";
import type { OrquestarEnvioPedidoWhatsAppDeps } from "./orquestarEnvioPedidoWhatsApp";

/** Entrada con `usuario` (App); el orquestador usa `usuarioPrevio` para `aplicarResultadoCheckoutUi`. */
export type ConstruirOrquestarEnvioPedidoWhatsAppInput = Omit<OrquestarEnvioPedidoWhatsAppDeps, "usuarioPrevio"> & {
  usuario: Usuario | null;
};

export function construirOrquestarEnvioPedidoWhatsAppDeps(
  input: ConstruirOrquestarEnvioPedidoWhatsAppInput
): OrquestarEnvioPedidoWhatsAppDeps {
  const { usuario, ...rest } = input;
  return { ...rest, usuarioPrevio: usuario };
}
