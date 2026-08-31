/**
 * Logging centralizado del flujo checkout (motor + servicios).
 * Evita `console.*` dispersos para poder redirigir o testear en un solo sitio.
 */
export function logCheckoutError(ctx: string, error: unknown): void {
  console.error(`[CHECKOUT][${ctx}]`, error);
}

export function logCheckoutWarn(ctx: string, detail: unknown): void {
  console.warn(`[CHECKOUT][${ctx}]`, detail);
}
