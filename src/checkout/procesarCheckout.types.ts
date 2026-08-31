import type { MutableRefObject } from "react";
import type { Cliente, CuponAplicado, ItemCarrito, Pedido, Producto, Usuario } from "../types";
import type { CheckoutExitoUiPayload, DatosPagoCheckout } from "./core/procesarPedido";
import type { CatalogoCuatroListas } from "./core/restarStockCatalogo";

export type EnviarPedidoWhatsAppOverride = {
  datosCliente?: Cliente;
  metodoPago?: "bizum" | "tarjeta";
  datosPago?: DatosPagoCheckout;
};

/** Catálogo tras restar stock del carrito; la capa app aplica vía `useCatalogoMaika().aplicarCatalogoActualizado`. */
export type CatalogoActualizadoCheckout = CatalogoCuatroListas;

/** Una clave por invocación de `procesarCheckout`; el backend deduplica con cabecera `Idempotency-Key`. */
export type ConfirmarPedidoIdempotencyOpts = {
  idempotencyKey: string;
};

/**
 * Resultado de intentar `POST /pedidos` en checkout.
 * - `sin_token`: no hay JWT → solo catálogo local (fallback).
 * - `rechazo_servidor`: 4xx → no mutar stock local en cliente; el motor devuelve `tipo: "error"` con `origen: "rechazo_servidor"`.
 *   La app puede vaciar carrito al cerrar el modal (evitar ítems sin stock).
 * - `red_o_5xx`: red o error servidor → stock local optimista (como offline).
 */
export type ResultadoConfirmacionPedidoApi =
  | { ok: true }
  | { ok: false; kind: "sin_token" }
  | { ok: false; kind: "rechazo_servidor"; mensaje: string }
  | { ok: false; kind: "red_o_5xx"; mensaje?: string };

export type EnviarPedidoWhatsAppContext = {
  datosCliente: Cliente;
  datosPago: DatosPagoCheckout;
  cart: ItemCarrito[];
  descuentoCupon: number;
  cuponAplicado: CuponAplicado | null;
  velas: Producto[];
  inciensos: Producto[];
  figuras: Producto[];
  kits: Producto[];
  joyas: Producto[];
  direccionesMax: number;
  bizumYaConfirmadoPorUsuario: boolean;
  pedidoApiPendienteRef: MutableRefObject<Pedido | null>;
  leerMaikaUsuarios: () => import("../utils/maikaUsuarios").MaikaUsuarioLS[];
  guardarMaikaUsuarios: (usuarios: import("../utils/maikaUsuarios").MaikaUsuarioLS[]) => void;
  precioItemCarrito: (item: ItemCarrito) => number;
  ejecutarConfirmacionPedido: (opts: ConfirmarPedidoIdempotencyOpts) => Promise<ResultadoConfirmacionPedidoApi>;
  /**
   * Opcional: GET /productos + ajuste de carrito antes de validar el motor.
   * La app debe volver a leer `getInput()` tras await para usar `cart` y catálogo frescos.
   */
  sincronizarCatalogoYCarritoDesdeServidor?: () => Promise<CatalogoCuatroListas | null | void>;
};

/**
 * Resultado único del motor de checkout (`procesarCheckout` / `ejecutarCheckout`).
 * La UI consume este discriminated union vía `orquestarEnvioPedidoWhatsApp`.
 */
export type ResultadoCheckout =
  | {
      tipo: "ok";
      pedido: Pedido;
      urlWhatsApp: string;
      aplicarInput: CheckoutExitoUiPayload;
      pedidosActualizados: Pedido[];
      usuarioActualizado?: Usuario;
      catalogoActualizado: CatalogoActualizadoCheckout;
      nuevoCarrito: ItemCarrito[];
      ultimoPedidoNumero: string;
      /** Solo si el sync devolvió login; App aplica `setAuthHydrated(true)`. */
      authHydrated?: true;
    }
  | { tipo: "error"; mensaje: string; origen?: "rechazo_servidor" }
  | { tipo: "bizum_confirmacion" };

/** Alias histórico; preferir `ResultadoCheckout`. */
export type EnviarPedidoWhatsAppResult = ResultadoCheckout;
