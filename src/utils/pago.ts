export type MetodoPago = "bizum" | "tarjeta";

export type DatosPago = {
  bizumTelefono: string;
  tarjetaNumero: string;
  tarjetaTitular: string;
  tarjetaCaducidad: string;
  tarjetaCVV: string;
};

export const DATOS_PAGO_VACIOS: DatosPago = {
  bizumTelefono: "",
  tarjetaNumero: "",
  tarjetaTitular: "",
  tarjetaCaducidad: "",
  tarjetaCVV: ""
};

export function normalizarTelefonoBizum(telefono: string): string {
  const soloDigitos = (telefono || "").replace(/\D/g, "").trim();
  if (soloDigitos.startsWith("0034") && soloDigitos.length > 4) return soloDigitos.slice(4);
  if (soloDigitos.startsWith("34") && soloDigitos.length > 9) return soloDigitos.slice(2);
  return soloDigitos;
}

export function validarDatosPago(
  metodoPago: MetodoPago,
  datosPago: DatosPago,
  mensajeBizumInvalido: string,
  mensajeTarjetaInvalida: string,
  mensajeTitularVacio: string,
  mensajeCaducidadInvalida: string,
  mensajeCvvInvalido: string
): string | null {
  if (metodoPago === "bizum") {
    const telefonoSinPrefijo = normalizarTelefonoBizum(datosPago.bizumTelefono);
    if (!/^[67]\d{8}$/.test(telefonoSinPrefijo)) {
      return mensajeBizumInvalido;
    }
    return null;
  }

  const numero = datosPago.tarjetaNumero.replace(/\s+/g, "");
  if (!/^\d{13,19}$/.test(numero)) return mensajeTarjetaInvalida;
  if (!datosPago.tarjetaTitular.trim()) return mensajeTitularVacio;
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(datosPago.tarjetaCaducidad.trim())) return mensajeCaducidadInvalida;
  if (!/^\d{3,4}$/.test(datosPago.tarjetaCVV.trim())) return mensajeCvvInvalido;
  return null;
}
