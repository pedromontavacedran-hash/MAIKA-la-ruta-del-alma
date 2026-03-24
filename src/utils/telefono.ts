export function normalizarTelefonoES9(telefono: string): string {
  const soloDigitos = (telefono || "").replace(/\D/g, "").trim();
  if (soloDigitos.startsWith("0034") && soloDigitos.length > 4) return soloDigitos.slice(4);
  if (soloDigitos.startsWith("34") && soloDigitos.length > 9) return soloDigitos.slice(2);
  return soloDigitos;
}

export function formatearTelefonoESVisual(telefono: string): string {
  const t = normalizarTelefonoES9(telefono).slice(0, 9);
  if (t.length <= 3) return t;
  if (t.length <= 5) return `${t.slice(0, 3)} ${t.slice(3)}`;
  if (t.length <= 7) return `${t.slice(0, 3)} ${t.slice(3, 5)} ${t.slice(5)}`;
  return `${t.slice(0, 3)} ${t.slice(3, 5)} ${t.slice(5, 7)} ${t.slice(7, 9)}`;
}

export function claveTelefonoES(telefono: string): string | null {
  const t9 = normalizarTelefonoES9(telefono);
  if (!/^[67]\d{8}$/.test(t9)) return null;
  return `+34${t9}`;
}
