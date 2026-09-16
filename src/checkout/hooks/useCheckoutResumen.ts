import { useMemo } from "react";
import type { Cliente, CuponAplicado, DireccionUsuario } from "../../types";
import { calcularEnvio } from "../../utils/envio";
import { normalizarTelefonoES9 } from "../../utils/telefono";

export type UseCheckoutResumenParams = {
  datosCliente: Cliente;
  total: number;
  cuponAplicado: CuponAplicado | null;
  direccionCheckoutActiva: DireccionUsuario | null;
  direccionCheckoutSeleccionadaId: string;
  direccionesCheckout: DireccionUsuario[];
};

/**
 * Derivados de checkout (envío, cupón, validación de datos, teléfono, dirección seleccionada).
 * La lógica de negocio y el envío del pedido siguen en App / useCheckoutMaika.
 */
export function useCheckoutResumen({
  datosCliente,
  total,
  cuponAplicado,
  direccionCheckoutActiva,
  direccionCheckoutSeleccionadaId,
  direccionesCheckout
}: UseCheckoutResumenParams) {
  const envioPreview = calcularEnvio(datosCliente.provincia, total);
  const totalPreview = total + envioPreview;

  const descuentoCupon = useMemo(() => {
    if (!cuponAplicado) return 0;
    const valor = Number(cuponAplicado.valor);
    if (cuponAplicado.tipo === "porcentaje" && Number.isFinite(valor)) {
      return (total * valor) / 100;
    }
    return envioPreview;
  }, [cuponAplicado, total, envioPreview]);

  const totalAPagarResumen = useMemo(
    () => Math.max(0, total + envioPreview - descuentoCupon),
    [total, envioPreview, descuentoCupon]
  );

  const datosObligatoriosCompletos = useMemo(() => {
    const n = `${(datosCliente.nombre || "").trim()} ${(datosCliente.apellidos || "").trim()}`.trim();
    const soloDigitos = (datosCliente.telefono || "").replace(/\D/g, "").trim();
    const t = soloDigitos.startsWith("0034") && soloDigitos.length > 4
      ? soloDigitos.slice(4)
      : soloDigitos.startsWith("34") && soloDigitos.length > 2
        ? soloDigitos.slice(2)
        : soloDigitos;
    const calle = (datosCliente.calle || "").trim();
    const num = (datosCliente.numero || "").trim();
    const cp = (datosCliente.cp || "").trim();
    const pob = (datosCliente.poblacion || "").trim();
    const prov = (datosCliente.provincia || "").trim();
    const pais = (datosCliente.pais || "ESPAÑA").trim();
    return (
      n.length > 0 &&
      /^[67]\d{8}$/.test(t) &&
      calle.length > 0 &&
      num.length > 0 &&
      cp.length === 5 &&
      pob.length > 0 &&
      prov.length > 0 &&
      pais.length > 0
    );
  }, [
    datosCliente.nombre,
    datosCliente.apellidos,
    datosCliente.telefono,
    datosCliente.calle,
    datosCliente.numero,
    datosCliente.cp,
    datosCliente.poblacion,
    datosCliente.provincia,
    datosCliente.pais
  ]);

  const primerCampoFaltanteCheckout = useMemo(() => {
    const nombreCompleto = `${(datosCliente.nombre || "").trim()} ${(datosCliente.apellidos || "").trim()}`.trim();
    if (!nombreCompleto) return "Nombre y apellidos";
    if (nombreCompleto.split(/\s+/).filter(Boolean).length < 2) return "Nombre y apellidos (completos)";

    const soloDigitos = (datosCliente.telefono || "").replace(/\D/g, "").trim();
    const tel = soloDigitos.startsWith("0034") && soloDigitos.length > 4
      ? soloDigitos.slice(4)
      : soloDigitos.startsWith("34") && soloDigitos.length > 2
        ? soloDigitos.slice(2)
        : soloDigitos;
    if (!/^[67]\d{8}$/.test(tel)) return "Teléfono (móvil 9 dígitos)";

    const calle = (datosCliente.calle || "").trim();
    if (!calle) return "Dirección";

    const num = (datosCliente.numero || "").trim();
    if (!num) return "Número";

    const cp = (datosCliente.cp || "").trim();
    if (cp.length !== 5) return "Código postal (5 dígitos)";

    const pob = (datosCliente.poblacion || "").trim();
    if (!pob) return "Población";

    const prov = (datosCliente.provincia || "").trim();
    if (!prov) return "Provincia";

    const pais = (datosCliente.pais || "").trim();
    if (!pais) return "País";

    return null;
  }, [
    datosCliente.nombre,
    datosCliente.apellidos,
    datosCliente.telefono,
    datosCliente.calle,
    datosCliente.numero,
    datosCliente.cp,
    datosCliente.poblacion,
    datosCliente.provincia,
    datosCliente.pais
  ]);

  const telefonoCheckoutLimpio = normalizarTelefonoES9(datosCliente.telefono || "").slice(0, 9);
  const telefonoCheckoutEsValido = /^[67]\d{8}$/.test(telefonoCheckoutLimpio);
  const telefonoCheckoutPrimerDigito = telefonoCheckoutLimpio.slice(0, 1);
  const telefonoCheckoutPrefijoInvalido =
    telefonoCheckoutLimpio.length > 0 && telefonoCheckoutPrimerDigito !== "6" && telefonoCheckoutPrimerDigito !== "7";

  const direccionCheckoutSeleccionada =
    direccionCheckoutActiva ||
    (direccionCheckoutSeleccionadaId && direccionCheckoutSeleccionadaId !== "__nueva__"
      ? direccionesCheckout.find((d) => d.id === direccionCheckoutSeleccionadaId) || null
      : null);

  return {
    envioPreview,
    totalPreview,
    descuentoCupon,
    totalAPagarResumen,
    datosObligatoriosCompletos,
    primerCampoFaltanteCheckout,
    telefonoCheckoutLimpio,
    telefonoCheckoutEsValido,
    telefonoCheckoutPrefijoInvalido,
    direccionCheckoutSeleccionada
  };
}
