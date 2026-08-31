import type { PerfilCompraRapida, ItemCarrito } from "../../types";

type Result =
  | { ok: true }
  | { ok: false; message: string };

type Params = {
  perfil: PerfilCompraRapida | null;
  items: ItemCarrito[];
  metodoPagoValido: boolean;
};

export function validarCompraRapida({
  perfil,
  items,
  metodoPagoValido
}: Params): Result {
  if (!items || items.length === 0) {
    return { ok: false, message: "Carrito vacío" };
  }

  if (!perfil) {
    return { ok: false, message: "No tienes un perfil guardado para compra rápida" };
  }

  if (!metodoPagoValido) {
    return { ok: false, message: "Método de pago no válido" };
  }

  return { ok: true };
}
