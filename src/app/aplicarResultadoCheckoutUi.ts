import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { Cliente, CuponAplicado, Pagina, PerfilCompraRapida, Usuario } from "../types";
import { QUICK_CHECKOUT_KEY } from "../config";
import type { CheckoutExitoUiPayload, DatosPagoCheckout } from "../checkout/procesarPedido";

export type AplicarResultadoCheckoutUiContext = {
  setPasoFinalizarCompra: Dispatch<SetStateAction<"datos" | "confirmarDireccion" | "pago">>;
  setFormPedidoAbierto: Dispatch<SetStateAction<boolean>>;
  setUrlWhatsAppPendiente: Dispatch<SetStateAction<string | null>>;
  setPedidoRealizado: Dispatch<SetStateAction<boolean>>;
  setPagina: (p: Pagina) => void;
  bizumConfirmadoRef: MutableRefObject<boolean>;
  usuario: Usuario | null;
  setPerfilCompraRapida: Dispatch<SetStateAction<PerfilCompraRapida | null>>;
  setDatosCliente: Dispatch<SetStateAction<Cliente>>;
  setMetodoPago: Dispatch<SetStateAction<"bizum" | "tarjeta">>;
  setDatosPago: Dispatch<SetStateAction<DatosPagoCheckout>>;
  setCuponAplicado: Dispatch<SetStateAction<CuponAplicado | null>>;
  setCuponInput: Dispatch<SetStateAction<string>>;
  setCuponError: Dispatch<SetStateAction<string | null>>;
  setCalleCheckoutResetSignal: Dispatch<SetStateAction<number>>;
  setBuscandoCalleCheckout: Dispatch<SetStateAction<boolean>>;
};

/**
 * Capa de aplicación: efectos de UI tras checkout exitoso (post-persistencia en checkout).
 */
export function aplicarResultadoCheckoutUi(ctx: AplicarResultadoCheckoutUiContext, input: CheckoutExitoUiPayload): void {
  const {
    setPasoFinalizarCompra,
    setFormPedidoAbierto,
    setUrlWhatsAppPendiente,
    setPedidoRealizado,
    setPagina,
    bizumConfirmadoRef,
    usuario,
    setPerfilCompraRapida,
    setDatosCliente,
    setMetodoPago,
    setDatosPago,
    setCuponAplicado,
    setCuponInput,
    setCuponError,
    setCalleCheckoutResetSignal,
    setBuscandoCalleCheckout
  } = ctx;

  const { urlWhatsApp, datosClienteActual, metodoPagoActual, datosPagoActual } = input;

  setPasoFinalizarCompra("datos");
  setFormPedidoAbierto(false);
  setUrlWhatsAppPendiente(urlWhatsApp);
  setPedidoRealizado(true);
  setPagina("inicio");
  bizumConfirmadoRef.current = false;

  const puedeRecordarEnDispositivo = !!usuario;
  if (puedeRecordarEnDispositivo) {
    localStorage.setItem("clienteMaika", JSON.stringify(datosClienteActual));
    const perfilNuevo: PerfilCompraRapida = {
      datosCliente: { ...datosClienteActual },
      metodoPago: metodoPagoActual,
      datosPago: { ...datosPagoActual },
      actualizadoEn: new Date().toISOString()
    };
    localStorage.setItem(QUICK_CHECKOUT_KEY, JSON.stringify(perfilNuevo));
    setPerfilCompraRapida(perfilNuevo);
  } else {
    localStorage.removeItem("clienteMaika");
    localStorage.removeItem(QUICK_CHECKOUT_KEY);
    setPerfilCompraRapida(null);
  }

  setDatosCliente({
    nombre: "",
    apellidos: "",
    nombreApellidos: "",
    email: "",
    dni: "",
    telefono: "",
    direccion: "",
    calle: "",
    numero: "",
    bloque: "",
    escalera: "",
    piso: "",
    puerta: "",
    ciudad: "",
    cp: "",
    poblacion: "",
    provincia: "",
    pais: "",
    notas: ""
  });

  setMetodoPago("bizum");
  setDatosPago({
    bizumTelefono: "",
    tarjetaNumero: "",
    tarjetaTitular: "",
    tarjetaCaducidad: "",
    tarjetaCVV: ""
  });
  setCuponAplicado(null);
  setCuponInput("");
  setCuponError(null);
  setCalleCheckoutResetSignal((n) => n + 1);
  setBuscandoCalleCheckout(false);
}
