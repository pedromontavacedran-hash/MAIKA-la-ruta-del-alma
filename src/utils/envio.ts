/**
 * Cálculo de coste de envío.
 * Envío gratis si subtotal >= 50 € o si no hay provincia; si no, 4.90 €.
 */
export function calcularEnvio(provincia: string | undefined, subtotal: number): number {
  if (!provincia?.trim()) return 0;
  if (subtotal >= 50) return 0;
  return 4.9;
}
