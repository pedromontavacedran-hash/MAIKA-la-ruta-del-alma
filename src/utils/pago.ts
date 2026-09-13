export type MetodoPago = "bizum" | "tarjeta";

/** Único método de pago real es Bizum: no se recogen ni persisten campos de tarjeta (número/CVV). */
export type DatosPago = {
  bizumTelefono: string;
};

export const DATOS_PAGO_VACIOS: DatosPago = {
  bizumTelefono: ""
};

export function normalizarTelefonoBizum(telefono: string): string {
  const soloDigitos = (telefono || "").replace(/\D/g, "").trim();
  if (soloDigitos.startsWith("0034") && soloDigitos.length > 4) return soloDigitos.slice(4);
  if (soloDigitos.startsWith("34") && soloDigitos.length > 9) return soloDigitos.slice(2);
  return soloDigitos;
}

/** "tarjeta" no tiene datos que validar (no se recogen campos de tarjeta): pasa siempre. */
export function validarDatosPago(
  metodoPago: MetodoPago,
  datosPago: DatosPago,
  mensajeBizumInvalido: string
): string | null {
  if (metodoPago !== "bizum") return null;
  const telefonoSinPrefijo = normalizarTelefonoBizum(datosPago.bizumTelefono);
  if (!/^[67]\d{8}$/.test(telefonoSinPrefijo)) {
    return mensajeBizumInvalido;
  }
  return null;
}
