import type { Cliente, ItemCarrito, Pedido } from "../../types";

type MetodoPago = NonNullable<Pedido["pago"]>["metodo"];

type BuildPedidoParams = {
  numeroPedido: string;
  usuarioId: string;
  cliente: Cliente;
  items: ItemCarrito[];
  subtotal: number;
  envio: number;
  total: number;
  metodoPago: MetodoPago;
  referenciaPago: string;
  descuento?: number;
  cupon?: string;
};

export function buildPedido({
  numeroPedido,
  usuarioId,
  cliente,
  items,
  subtotal,
  envio,
  total,
  metodoPago,
  referenciaPago,
  descuento,
  cupon
}: BuildPedidoParams): Pedido {
  return {
    numero: numeroPedido,
    fecha: new Date().toISOString(),
    usuarioId,
    cliente,
    items,
    subtotal,
    envio,
    total,
    estado: "pendiente",
    pago: {
      metodo: metodoPago,
      estado: "pagado",
      referencia: referenciaPago
    },
    descuento,
    cupon
  };
}
