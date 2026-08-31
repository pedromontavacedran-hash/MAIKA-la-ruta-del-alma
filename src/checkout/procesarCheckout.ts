import { CHECKOUT_CONFIG } from "@/config/checkoutConfig";
import { hasClientSession } from "../services/apiAuth";
import { generarUuidV4 } from "../utils/appIdentity";
import { getUsuarioId } from "../utils/usuarioId";
import { calcularPedidoYWhatsApp } from "./core/procesarPedido";
import type { CheckoutExitoUiPayload } from "./core/procesarPedido";
import type { EnviarPedidoWhatsAppContext, EnviarPedidoWhatsAppOverride, ResultadoCheckout } from "./procesarCheckout.types";
import { validarCheckout } from "./fases/validarCheckout";
import { syncUsuarioYAuthCheckout } from "./fases/syncUsuarioYAuthCheckout";
import { esperarAntesDeCalcularPedido } from "./fases/esperarAntesDeCalcularPedido";
import { persistirTrasPedidoCheckout } from "./fases/persistirTrasPedidoCheckout";
import { construirResultadoCompletado } from "./fases/construirResultadoCompletado";

export type {
  ConfirmarPedidoIdempotencyOpts,
  EnviarPedidoWhatsAppOverride,
  CatalogoActualizadoCheckout,
  EnviarPedidoWhatsAppContext,
  EnviarPedidoWhatsAppResult,
  ResultadoCheckout
} from "./procesarCheckout.types";

/**
 * Orquestación async: validación (core), sync API, motor de pedido (core), persistencias (servicios).
 *
 * CHECKOUT FLOW CONTRACT — no añadir vaciado de carrito en servidor fuera de `persistirTrasPedidoCheckout`.
 *
 * 0. `validarCheckout` (override + `validarCheckoutPedido`): reglas obligatorias en motor; no sustituir por validación solo en UI.
 * 1. `syncUsuarioYAuthCheckout` (perfil / JWT): sin efectos laterales sobre carrito (ni API ni `localStorage` del carrito).
 * 2. `calcularPedidoYWhatsApp`: construye pedido y URL WhatsApp; solo lee el carrito en memoria del contexto.
 * 3. `persistirTrasPedidoCheckout`: único punto que confirma pedido vía API (si aplica) con `Idempotency-Key` por intento,
 *    persiste historial local, actualiza stock, llama a `vaciarCarritoServidorSiHayToken` y deja `CARRITO_KEY` en `[]` en `localStorage`.
 * 4. La capa UI vacía el estado React del carrito al aplicar el resultado (`orquestarEnvioPedidoWhatsApp` / hooks);
 *    no duplicar el paso 3 en sync ni en otros sitios.
 */
export async function procesarCheckout(
  ctx: EnviarPedidoWhatsAppContext,
  override?: EnviarPedidoWhatsAppOverride
): Promise<ResultadoCheckout> {
  const {
    cart,
    descuentoCupon,
    cuponAplicado,
    velas,
    inciensos,
    figuras,
    kits,
    joyas,
    direccionesMax,
    pedidoApiPendienteRef,
    leerMaikaUsuarios,
    guardarMaikaUsuarios,
    precioItemCarrito,
    ejecutarConfirmacionPedido
  } = ctx;

  const validacionPaso = validarCheckout(ctx, override);
  if ("salida" in validacionPaso) {
    return validacionPaso.salida;
  }

  const {
    datosClienteActual: dcOk,
    nombreCompletoActual,
    metodoPagoActual,
    datosPagoActual: dpOk,
    telefonoNormalizadoCheckout,
    direccionEnvio,
    direccionEnvioCompletaTexto
  } = validacionPaso;

  /** Una clave por invocación de este motor (no `useRef` aquí: no es un hook). Reintentos con la misma llamada comparten clave. */
  const idempotencyKey = generarUuidV4();

  const { usuarioActualizado, authHydrated, errorSync } = await syncUsuarioYAuthCheckout(
    dcOk,
    telefonoNormalizadoCheckout,
    direccionEnvioCompletaTexto
  );

  /**
   * Sin JWT no puede ejecutarse `POST /pedidos` → el stock no baja en el servidor.
   * Cualquier `GET /productos` posterior (p. ej. al cerrar el modal o en otro navegador)
   * volvería a mostrar unidades que en cliente se habían “vendido” solo en local.
   * Misma fuente que el sync (`getStoredJwtToken`: `token` y alias en localStorage).
   */
  if (!hasClientSession()) {
    const fallback =
      "No pudimos registrar tu sesión en el servidor. Comprueba la conexión e inténtalo de nuevo; el pedido debe confirmarse en la tienda para actualizar el stock.";
    const detalle = String(errorSync ?? "").trim();
    return {
      tipo: "error",
      mensaje: detalle || fallback
    };
  }

  await esperarAntesDeCalcularPedido();

  const calc = calcularPedidoYWhatsApp(
    {
      datosClienteActual: dcOk,
      nombreCompletoActual,
      cart,
      descuentoCupon,
      cuponAplicado,
      precioItemCarrito,
      metodoPagoActual,
      datosPagoActual: dpOk,
      direccionEnvio,
      direccionEnvioCompletaTexto,
      getUsuarioId
    },
    CHECKOUT_CONFIG
  );

  const { numeroPedido, totalFinal, urlWhatsApp, pedidoNuevo } = calc;

  const { pedidosActualizados, catalogoActualizado, errorServidorCheckout } = await persistirTrasPedidoCheckout({
    pedidoNuevo,
    pedidoApiPendienteRef,
    idempotencyKey,
    ejecutarConfirmacionPedido,
    telefonoNormalizadoCheckout,
    numeroPedido,
    cart,
    totalFinal,
    direccionEnvioCompletaTexto,
    dcOk,
    direccionesMax,
    leerMaikaUsuarios,
    guardarMaikaUsuarios,
    velas,
    inciensos,
    figuras,
    kits,
    joyas
  });

  if (errorServidorCheckout) {
    const msg = String(errorServidorCheckout.mensaje ?? "").trim();
    return {
      tipo: "error",
      mensaje: msg || "No se pudo registrar el pedido en el servidor.",
      origen: "rechazo_servidor"
    };
  }

  const aplicarInput: CheckoutExitoUiPayload = {
    urlWhatsApp,
    numeroPedido,
    datosClienteActual: dcOk,
    metodoPagoActual,
    datosPagoActual: dpOk
  };

  return construirResultadoCompletado(
    pedidoNuevo,
    aplicarInput,
    pedidosActualizados,
    usuarioActualizado,
    catalogoActualizado,
    numeroPedido,
    authHydrated
  );
}
