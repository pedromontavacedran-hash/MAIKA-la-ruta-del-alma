import type { ItemCarrito } from "../../types";

type CalcularTotalesParams = {
  items: ItemCarrito[];
  provincia?: string;
  descuento?: number;
  // Permite mantener la lógica de negocio actual del proyecto.
  calcularEnvioFn?: (provincia: string, subtotal: number) => number;
  // Permite usar el precio real de checkout (con descuentos por item, etc.).
  resolverPrecioItem?: (item: ItemCarrito) => number;
};

type Totales = {
  subtotal: number;
  envio: number;
  total: number;
};

export function calcularTotales({
  items,
  provincia = "",
  descuento = 0,
  calcularEnvioFn,
  resolverPrecioItem
}: CalcularTotalesParams): Totales {
  const subtotal = items.reduce((acc, item) => {
    const precio = resolverPrecioItem ? resolverPrecioItem(item) : Number(item.precio || 0);
    return acc + precio * Number(item.cantidad || 0);
  }, 0);

  const envio = calcularEnvioFn ? calcularEnvioFn(provincia, subtotal) : (subtotal >= 50 ? 0 : 4.9);
  const total = Math.max(0, subtotal + envio - descuento);

  return { subtotal, envio, total };
}
