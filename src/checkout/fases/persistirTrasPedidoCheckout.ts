import type { MutableRefObject } from "react";
import { CARRITO_KEY, GUEST_CART_PENDING_KEY } from "../../config";
import type { Cliente, ItemCarrito, Pedido, Producto } from "../../types";
import type { CatalogoCuatroListas } from "../core/restarStockCatalogo";
import { prependPedidoYPersistirPedidosMaika } from "../services/guardarPedidosLocal";
import { registrarMaikaPedidoDesdeCheckout } from "../services/guardarMaikaPedidosCheckout";
import { fusionarYGuardarUsuarioMaikaCheckout } from "../services/guardarUsuarios";
import { fetchCatalogoCuatroListasDesdeApi } from "../../services/apiProductos";
import { actualizarStockCatalogoYPersistir } from "../services/actualizarStock";
import { vaciarCarritoServidorSiHayToken } from "../services/vaciarCarritoServidor";
import type { ConfirmarPedidoIdempotencyOpts, ResultadoConfirmacionPedidoApi } from "../procesarCheckout.types";
import {
  encolarPedidoCrear,
  programarSincronizarOutbox,
  quitarPedidoCreadoDelOutbox
} from "../../utils/maikaOutbox";
import { normalizarTelefonoES9 } from "../../utils/telefono";

export async function persistirTrasPedidoCheckout(params: {
  pedidoNuevo: Pedido;
  pedidoApiPendienteRef: MutableRefObject<Pedido | null>;
  idempotencyKey: string;
  ejecutarConfirmacionPedido: (opts: ConfirmarPedidoIdempotencyOpts) => Promise<ResultadoConfirmacionPedidoApi>;
  telefonoNormalizadoCheckout: string;
  numeroPedido: string;
  cart: ItemCarrito[];
  totalFinal: number;
  direccionEnvioCompletaTexto: string;
  dcOk: Cliente;
  direccionesMax: number;
  leerMaikaUsuarios: () => import("../../utils/maikaUsuarios").MaikaUsuarioLS[];
  guardarMaikaUsuarios: (usuarios: import("../../utils/maikaUsuarios").MaikaUsuarioLS[]) => void;
  velas: Producto[];
  inciensos: Producto[];
  figuras: Producto[];
  kits: Producto[];
  joyas: Producto[];
}): Promise<{
  pedidosActualizados: Pedido[];
  catalogoActualizado: CatalogoCuatroListas;
  /** Si el servidor rechazó el POST (p. ej. stock): no se vació carrito ni se mutó stock local. */
  errorServidorCheckout?: { mensaje: string };
}> {
  const {
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
  } = params;

  const pedidosActualizados = prependPedidoYPersistirPedidosMaika(pedidoNuevo);

  /** Outbox-first: siempre hay entrada de envío antes del POST; si la API OK, se retira. */
  encolarPedidoCrear(pedidoNuevo, idempotencyKey);
  programarSincronizarOutbox(normalizarTelefonoES9);

  let conf: ResultadoConfirmacionPedidoApi = { ok: false, kind: "red_o_5xx" };
  try {
    pedidoApiPendienteRef.current = pedidoNuevo;
    conf = await ejecutarConfirmacionPedido({ idempotencyKey });
  } catch {
    conf = { ok: false, kind: "red_o_5xx" };
  } finally {
    pedidoApiPendienteRef.current = null;
  }

  const pedidoApiOk = conf.ok === true;
  const rechazoServidor = conf.ok === false && conf.kind === "rechazo_servidor";

  if (pedidoApiOk) {
    quitarPedidoCreadoDelOutbox(pedidoNuevo, idempotencyKey);
    programarSincronizarOutbox(normalizarTelefonoES9);
  } else if (rechazoServidor) {
    /** Stock insuficiente u otro 4xx: no dejar el pedido en cola (evita “reintentando” infinito). */
    quitarPedidoCreadoDelOutbox(pedidoNuevo, idempotencyKey);
    programarSincronizarOutbox(normalizarTelefonoES9);
  }

  registrarMaikaPedidoDesdeCheckout({
    telefonoNormalizadoCheckout,
    numeroPedido,
    cart,
    totalFinal,
    direccionEnvioCompletaTexto,
    dcOk
  });

  fusionarYGuardarUsuarioMaikaCheckout({
    telefonoNormalizadoCheckout,
    dcOk,
    direccionesMax,
    leerMaikaUsuarios,
    guardarMaikaUsuarios
  });

  /**
   * Catálogo tras checkout:
   * - Rechazo servidor (409, etc.): sin cambios (servidor no descontó; no simular en cliente).
   * - API OK: GET /productos o resta local de respaldo.
   * - Sin token o red/5xx: resta local (fallback / offline).
   */
  let catalogoActualizado: CatalogoCuatroListas;
  if (rechazoServidor) {
    catalogoActualizado = { velas, inciensos, figuras, kits, joyas };
  } else if (pedidoApiOk) {
    catalogoActualizado =
      (await fetchCatalogoCuatroListasDesdeApi()) ??
      actualizarStockCatalogoYPersistir(cart, velas, inciensos, figuras, kits, joyas);
  } else {
    catalogoActualizado = actualizarStockCatalogoYPersistir(cart, velas, inciensos, figuras, kits, joyas);
  }

  if (!rechazoServidor) {
    await vaciarCarritoServidorSiHayToken("fin pedido");

    /** Evita carrera con `useCarrito`: si `setUsuario` cambia `carritoIdentityKey` antes de `setCart([])`, el efecto relee LS/API y repone el carrito. */
    try {
      localStorage.setItem(CARRITO_KEY, "[]");
      localStorage.removeItem(GUEST_CART_PENDING_KEY);
    } catch {
      /* noop */
    }
  }

  const errorServidorCheckout =
    rechazoServidor && conf.ok === false && conf.kind === "rechazo_servidor"
      ? { mensaje: conf.mensaje }
      : undefined;

  return {
    pedidosActualizados,
    catalogoActualizado,
    ...(errorServidorCheckout != null ? { errorServidorCheckout } : {})
  };
}
