export type CuponAdmin = { tipo: "porcentaje" | "envio_gratis"; valor: number };

export function resolverCuponAplicable(
  input: string,
  normalizarCodigoCupon: (codigo: string) => string,
  cupones: Record<string, CuponAdmin>
): { codigo: string; cupon: CuponAdmin | null } {
  let codigo = normalizarCodigoCupon(input);
  if (!codigo) return { codigo: "", cupon: null };

  let cupon = cupones[codigo] || null;
  if (!cupon && /\s+o\s+/i.test(input)) {
    const primero = input.trim().split(/\s+o\s+/i)[0];
    if (primero) {
      codigo = normalizarCodigoCupon(primero);
      cupon = cupones[codigo] || null;
    }
  }

  return { codigo, cupon };
}

export function getCuponesDisponibles(
  storageKey: string,
  fallback: Record<string, CuponAdmin>
): Record<string, CuponAdmin> {
  try {
    const guardado = localStorage.getItem(storageKey);
    if (guardado) {
      const parsed = JSON.parse(guardado) as Record<string, { tipo: string; valor: unknown }>;
      if (parsed && typeof parsed === "object") {
        const out: Record<string, CuponAdmin> = {};
        for (const [codigo, v] of Object.entries(parsed)) {
          if (!v || typeof v !== "object") continue;
          const tipo = v.tipo === "envio_gratis" ? "envio_gratis" : "porcentaje";
          const valor = Number(v.valor);
          if (!Number.isFinite(valor) || valor < 0) continue;
          out[codigo] = { tipo, valor: tipo === "porcentaje" ? Math.min(100, valor) : 0 };
        }
        if (Object.keys(out).length > 0) return out;
      }
    }
  } catch {
    /* usar defecto */
  }
  return fallback;
}
