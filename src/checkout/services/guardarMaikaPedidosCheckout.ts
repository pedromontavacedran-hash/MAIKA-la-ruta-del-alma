import type { Cliente, ItemCarrito } from "../../types";
import { logCheckoutWarn } from "../../utils/loggerCheckout";
import { claveTelefonoES } from "../../utils/telefono";
import {
  guardarMaikaPedidos,
  leerMaikaPedidos,
  type MaikaPedidoLS,
  type MaikaPedidoProductoLS
} from "../../utils/maikaPedidos";

export function registrarMaikaPedidoDesdeCheckout(params: {
  telefonoNormalizadoCheckout: string;
  numeroPedido: string;
  cart: ItemCarrito[];
  totalFinal: number;
  direccionEnvioCompletaTexto: string;
  dcOk: Cliente;
}): void {
  const { telefonoNormalizadoCheckout, numeroPedido, cart, totalFinal, direccionEnvioCompletaTexto, dcOk } =
    params;
  const telefonoClavePedido = claveTelefonoES(telefonoNormalizadoCheckout);
  if (!telefonoClavePedido) return;

  try {
    const pedidosLS = leerMaikaPedidos();
    const productosLS: MaikaPedidoProductoLS[] = cart.map((it) => ({
      idProducto: Number(it.id),
      nombre: String(it.nombre || ""),
      precio: Number(it.precio || 0),
      cantidad: Number(it.cantidad || 0)
    }));

    const nuevoPedidoLS: MaikaPedidoLS = {
      idPedido: String(numeroPedido),
      telefono: telefonoClavePedido,
      fecha: new Date().toISOString(),
      productos: productosLS,
      total: Number(totalFinal),
      direccionCompleta: direccionEnvioCompletaTexto,
      estado: "pendiente",
      nota: (dcOk.notas || "").trim() || undefined
    };

    guardarMaikaPedidos([nuevoPedidoLS, ...pedidosLS]);
  } catch (e) {
    logCheckoutWarn("maika_pedidos_local", e);
  }
}
