export function precioSeguro(precio: unknown): number {
  if (typeof precio === "string") {
    const limpio = precio
      .trim()
      .replace(/[^\d,.-]/g, "")
      .replace(/\.(?=\d{3}(\D|$))/g, "")
      .replace(",", ".");
    const n = Number(limpio);
    return Number.isFinite(n) ? n : 0;
  }
  const n = typeof precio === "number" ? precio : Number(precio);
  return Number.isFinite(n) ? n : 0;
}

export function idSeguro(id: unknown): number | null {
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}
