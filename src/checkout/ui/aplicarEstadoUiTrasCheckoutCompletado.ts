import { flushSync } from "react-dom";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { ItemCarrito, Pedido, Usuario } from "../../types";
import { aplicarResultadoCheckoutUi, type AplicarResultadoCheckoutUiContext } from "../../app/aplicarResultadoCheckoutUi";
import type { CatalogoActualizadoCheckout, ResultadoCheckout } from "../procesarCheckout.types";

export type ResultadoCheckoutOk = Extract<ResultadoCheckout, { tipo: "ok" }>;

/** Setters y contexto de UI que App inyecta; la lógica de negocio del pedido ya viene en `resultado`. */
export type AplicarEstadoUiTrasCheckoutCompletadoDeps = Omit<AplicarResultadoCheckoutUiContext, "usuario"> & {
  usuarioPrevio: Usuario | null;
  setAuthHydrated: Dispatch<SetStateAction<boolean>>;
  setUltimoPedidoNumero: Dispatch<SetStateAction<string | null>>;
  setPedidos: Dispatch<SetStateAction<Pedido[]>>;
  setUsuario: Dispatch<SetStateAction<Usuario | null>>;
  aplicarCatalogoActualizado: (catalogo: CatalogoActualizadoCheckout) => void;
  setCart: Dispatch<SetStateAction<ItemCarrito[]>>;
  setMensajeErrorCheckoutPago?: (mensaje: string | null) => void;
  onMarcarCheckoutErrorRechazoServidor?: (esRechazoServidor: boolean) => void;
  /**
   * Marcar antes de cualquier `setState`: evita que una sync de carrito inmediata interprete
   * líneas quitadas (stock ya vendido en esta compra) como “error de disponibilidad”.
   */
  silenciarAvisosLimpiezaCarritoStockTrasCompraOkRef?: MutableRefObject<boolean>;
};

/**
 * Aplica en la capa de UI el resultado de un checkout exitoso (estado React + `aplicarResultadoCheckoutUi`).
 */
export function aplicarEstadoUiTrasCheckoutCompletado(
  resultado: ResultadoCheckoutOk,
  deps: AplicarEstadoUiTrasCheckoutCompletadoDeps
): void {
  const {
    usuarioPrevio,
    setAuthHydrated,
    setUltimoPedidoNumero,
    setPedidos,
    setUsuario,
    aplicarCatalogoActualizado,
    setCart,
    setMensajeErrorCheckoutPago,
    onMarcarCheckoutErrorRechazoServidor,
    silenciarAvisosLimpiezaCarritoStockTrasCompraOkRef,
    setPasoFinalizarCompra,
    setFormPedidoAbierto,
    setUrlWhatsAppPendiente,
    setPedidoRealizado,
    setPagina,
    bizumConfirmadoRef,
    setPerfilCompraRapida,
    setDatosCliente,
    setMetodoPago,
    setDatosPago,
    setCuponAplicado,
    setCuponInput,
    setCuponError,
    setCalleCheckoutResetSignal,
    setBuscandoCalleCheckout
  } = deps;

  if (silenciarAvisosLimpiezaCarritoStockTrasCompraOkRef) {
    silenciarAvisosLimpiezaCarritoStockTrasCompraOkRef.current = true;
  }

  setMensajeErrorCheckoutPago?.(null);
  onMarcarCheckoutErrorRechazoServidor?.(false);

  if (resultado.authHydrated) {
    setAuthHydrated(true);
  }
  setUltimoPedidoNumero(resultado.ultimoPedidoNumero);
  /** Carrito vacío ANTES de `setUsuario` / catálogo: si no, `carritoIdentityKey` cambia y `useCarrito` relee LS y repone ítems. */
  flushSync(() => {
    setCart(resultado.nuevoCarrito);
  });
  setPedidos(resultado.pedidosActualizados);
  if (resultado.usuarioActualizado !== undefined) {
    setUsuario(resultado.usuarioActualizado);
  }
  aplicarCatalogoActualizado(resultado.catalogoActualizado);
  aplicarResultadoCheckoutUi(
    {
      setPasoFinalizarCompra,
      setFormPedidoAbierto,
      setUrlWhatsAppPendiente,
      setPedidoRealizado,
      setPagina,
      bizumConfirmadoRef,
      usuario: resultado.usuarioActualizado ?? usuarioPrevio,
      setPerfilCompraRapida,
      setDatosCliente,
      setMetodoPago,
      setDatosPago,
      setCuponAplicado,
      setCuponInput,
      setCuponError,
      setCalleCheckoutResetSignal,
      setBuscandoCalleCheckout
    },
    resultado.aplicarInput
  );
}
