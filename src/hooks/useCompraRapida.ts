import { useCallback, useMemo, type Dispatch, type SetStateAction } from "react";
import type { Cliente, ItemCarrito, PerfilCompraRapida } from "../types";
import { generarNumeroPedido } from "../utils/appIdentity";
import { validarDatosPago } from "../utils/pago";
import { notificarError } from "../utils/ui/notificaciones";
import { useAccesoRapido } from "./useAccesoRapido";

export type UseCompraRapidaParams = {
  perfilCompraRapida: PerfilCompraRapida | null;
  cart: ItemCarrito[];
  setDatosCliente: Dispatch<SetStateAction<Cliente>>;
  setMetodoPago: Dispatch<SetStateAction<"bizum" | "tarjeta">>;
  setDatosPago: Dispatch<SetStateAction<PerfilCompraRapida["datosPago"]>>;
  setNumeroPedidoPreview: Dispatch<SetStateAction<string | null>>;
  setPasoFinalizarCompra: Dispatch<SetStateAction<"datos" | "confirmarDireccion" | "pago">>;
  setFormPedidoAbierto: Dispatch<SetStateAction<boolean>>;
  mostrarNotificacion: (m: string, t: "normal" | "exito" | "error") => void;
  /** Si devuelve false, no se abre el checkout (p. ej. sin stock tras sincronizar). */
  antesDeAbrirModalCheckout?: () => Promise<boolean>;
};

export function useCompraRapida(p: UseCompraRapidaParams) {
  const {
    perfilCompraRapida,
    cart,
    setDatosCliente,
    setMetodoPago,
    setDatosPago,
    setNumeroPedidoPreview,
    setPasoFinalizarCompra,
    setFormPedidoAbierto,
    mostrarNotificacion,
    antesDeAbrirModalCheckout
  } = p;

  const comprarEnUnClickReal = async () => {
    const perfil = perfilCompraRapida;
    if (!perfil) return;

    if (antesDeAbrirModalCheckout) {
      const puede = await antesDeAbrirModalCheckout();
      if (!puede) return;
    }

    setDatosCliente(perfil.datosCliente);
    setMetodoPago(perfil.metodoPago);
    setDatosPago(perfil.datosPago);

    // Abrir formulario de finalizar compra con datos y pago ya rellenados; el cliente revisa y pulsa "Pagar y enviar"
    setNumeroPedidoPreview(generarNumeroPedido());
    setPasoFinalizarCompra("datos");
    setFormPedidoAbierto(true);
    mostrarNotificacion("⚡ Datos cargados. Revisa y continúa hacia WhatsApp.", "normal");
  };

  const metodoPagoRapidoValido = useMemo(() => {
    if (!perfilCompraRapida) return false;
    const errorPago = validarDatosPago(
      perfilCompraRapida.metodoPago,
      perfilCompraRapida.datosPago,
      "No se pudo usar compra rápida: móvil de Bizum no válido"
    );
    return !errorPago;
  }, [perfilCompraRapida]);

  const accesoRapidoFlow = useAccesoRapido({
    perfil: perfilCompraRapida,
    items: cart,
    metodoPagoValido: metodoPagoRapidoValido,
    crearPedidoRapido: comprarEnUnClickReal,
    onError: (message) => {
      notificarError(mostrarNotificacion, message);
    }
  });

  const comprarEnUnClick = useCallback(async () => {
    await accesoRapidoFlow.ejecutarCompraRapida();
  }, [accesoRapidoFlow]);

  return { comprarEnUnClick, metodoPagoRapidoValido, comprarEnUnClickReal };
}
