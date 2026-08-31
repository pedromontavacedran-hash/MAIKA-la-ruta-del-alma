export function normalizarCodigoUltimoPedidoInput(value: string): string {
  return String(value || "").toUpperCase();
}

export function validarCodigoUltimoPedido(esperado: string, recibido: string): boolean {
  const esperadoNorm = String(esperado || "").replace(/\s+/g, "").toLowerCase();
  const recibidoNorm = String(recibido || "").replace(/\s+/g, "").toLowerCase();
  if (!esperadoNorm || !recibidoNorm) return false;
  return esperadoNorm === recibidoNorm;
}

