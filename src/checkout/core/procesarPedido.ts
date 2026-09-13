import type { Cliente, CuponAplicado, ItemCarrito, Pedido } from "../../types";
import { calcularEnvio } from "../../utils/envio";
import { generarNumeroPedido, generarReferenciaPago } from "../../utils/appIdentity";
import { normalizarTelefonoES9 } from "../../utils/telefono";
import { normalizarTelefonoBizum, validarDatosPago } from "../../utils/pago";
import { buildPedido } from "../../utils/pedidos/buildPedido";
import { direccionLineaCompletaDesdeEnvio } from "../../utils/pedidos/direccionEnvioFormato";
import { construirDireccionCompleta } from "../../utils/direccion";
import { calcularTotales } from "../../utils/pedidos/calcularTotales";

export type DatosPagoCheckout = {
  bizumTelefono: string;
};

/** Datos que la capa de aplicación (App) usa para actualizar UI tras un checkout completado. */
export type CheckoutExitoUiPayload = {
  urlWhatsApp: string;
  numeroPedido: string;
  datosClienteActual: Cliente;
  metodoPagoActual: "bizum";
  datosPagoActual: DatosPagoCheckout;
};

export type DireccionEnvioPlana = {
  calle: string;
  numero: string;
  bloque: string;
  escalera: string;
  piso: string;
  puerta: string;
  cp: string;
  poblacion: string;
  provincia: string;
  pais: string;
};

/** Pedido tal como lo persiste hoy el checkout (buildPedido + envío). */
export type PedidoCheckoutExtendido = Pedido & {
  direccionEnvio: DireccionEnvioPlana;
  direccionTexto: string;
};

function sanitizarDatosClienteCheckout(c: Cliente, telefono9: string): Cliente {
  const t = (s: string | undefined) => (s ?? "").trim();
  return {
    ...c,
    nombre: t(c.nombre),
    apellidos: t(c.apellidos),
    nombreApellidos: t(c.nombreApellidos),
    email: t(c.email).toLowerCase(),
    telefono: telefono9,
    direccion: t(c.direccion),
    tipoVia: t(c.tipoVia),
    nombreVia: t(c.nombreVia),
    calle: t(c.calle),
    numero: t(c.numero),
    bloque: t(c.bloque),
    escalera: t(c.escalera),
    piso: t(c.piso),
    puerta: t(c.puerta),
    ciudad: t(c.ciudad),
    cp: t(c.cp),
    poblacion: t(c.poblacion),
    provincia: t(c.provincia),
    pais: t(c.pais) || "España",
    notas: t(c.notas),
    dni: t(c.dni)
  };
}

export type ValidarCheckoutPedidoInput = {
  datosClienteActual: Cliente;
  datosPagoActual: DatosPagoCheckout;
  cart: ItemCarrito[];
  /** Sustituye la lectura de `bizumConfirmadoRef.current` en la capa UI. */
  bizumYaConfirmadoPorUsuario: boolean;
};

export type ValidarCheckoutPedidoResult =
  | { ok: false; tipo: "error"; mensaje: string }
  | { ok: false; tipo: "confirmar_bizum" }
  | {
      ok: true;
      datosClienteActual: Cliente;
      nombreCompletoActual: string;
      metodoPagoActual: "bizum";
      datosPagoActual: DatosPagoCheckout;
      telefonoNormalizadoCheckout: string;
      direccionEnvio: DireccionEnvioPlana;
      direccionEnvioCompletaTexto: string;
    };

/**
 * Validación + dirección de envío. Sin React, sin persistencia, sin totales.
 */
export function validarCheckoutPedido(input: ValidarCheckoutPedidoInput): ValidarCheckoutPedidoResult {
  const { datosClienteActual, datosPagoActual, cart, bizumYaConfirmadoPorUsuario } = input;

  const nombreCompletoActual =
    `${(datosClienteActual.nombre || "").trim()} ${(datosClienteActual.apellidos || "").trim()}`.trim() ||
    (datosClienteActual.nombreApellidos || "").trim();
  /** Checkout solo usa Bizum (WhatsApp); evita estado antiguo "tarjeta" que bloqueaba validación. */
  const metodoPagoActual: "bizum" | "tarjeta" = "bizum";

  if (
    !nombreCompletoActual ||
    !datosClienteActual.calle?.trim() ||
    !datosClienteActual.numero?.trim() ||
    !datosClienteActual.cp?.trim() ||
    !datosClienteActual.poblacion?.trim() ||
    !datosClienteActual.provincia?.trim() ||
    !datosClienteActual.pais?.trim()
  ) {
    return { ok: false, tipo: "error", mensaje: "Completa todos los datos" };
  }
  const telefonoNormalizadoCheckout = normalizarTelefonoES9(datosClienteActual.telefono || "");
  if (!/^[67]\d{8}$/.test(telefonoNormalizadoCheckout)) {
    return {
      ok: false,
      tipo: "error",
      mensaje: "Introduce un teléfono válido (9 dígitos, empieza por 6 o 7)"
    };
  }
  if (cart.length === 0) {
    return { ok: false, tipo: "error", mensaje: "Carrito vacío" };
  }

  const errorPago = validarDatosPago(
    metodoPagoActual,
    datosPagoActual,
    "Introduce el número de móvil para pago Bizum (9 dígitos)"
  );
  if (errorPago) {
    return { ok: false, tipo: "error", mensaje: errorPago };
  }

  if (metodoPagoActual === "bizum") {
    const bizumNorm = normalizarTelefonoBizum(datosPagoActual.bizumTelefono);
    const contactoNorm = normalizarTelefonoBizum(datosClienteActual.telefono || "");
    const contactoValido = /^[67]\d{8}$/.test(contactoNorm);
    const sonDiferentes = contactoNorm !== bizumNorm;
    if (bizumNorm && (!contactoValido || sonDiferentes)) {
      if (!bizumYaConfirmadoPorUsuario) {
        return { ok: false, tipo: "confirmar_bizum" };
      }
    }
  }

  const datosClienteSanitizado = sanitizarDatosClienteCheckout(
    datosClienteActual,
    telefonoNormalizadoCheckout
  );
  const nombreCompletoSanitizado =
    `${datosClienteSanitizado.nombre} ${datosClienteSanitizado.apellidos}`.trim() ||
    datosClienteSanitizado.nombreApellidos ||
    "";

  const direccionEnvio: DireccionEnvioPlana = {
    calle: datosClienteSanitizado.calle || "",
    numero: datosClienteSanitizado.numero || "",
    bloque: datosClienteSanitizado.bloque || "",
    escalera: datosClienteSanitizado.escalera || "",
    piso: datosClienteSanitizado.piso || "",
    puerta: datosClienteSanitizado.puerta || "",
    cp: datosClienteSanitizado.cp || "",
    poblacion: datosClienteSanitizado.poblacion || "",
    provincia: datosClienteSanitizado.provincia || "",
    pais: datosClienteSanitizado.pais || "España"
  };
  const direccionEnvioCompletaTexto = direccionLineaCompletaDesdeEnvio(direccionEnvio);

  return {
    ok: true,
    datosClienteActual: datosClienteSanitizado,
    nombreCompletoActual: nombreCompletoSanitizado,
    metodoPagoActual,
    datosPagoActual,
    telefonoNormalizadoCheckout,
    direccionEnvio,
    direccionEnvioCompletaTexto
  };
}

export type CalcularPedidoYWhatsAppInput = {
  datosClienteActual: Cliente;
  nombreCompletoActual: string;
  cart: ItemCarrito[];
  descuentoCupon: number;
  cuponAplicado: CuponAplicado | null;
  precioItemCarrito: (item: ItemCarrito) => number;
  metodoPagoActual: "bizum";
  datosPagoActual: DatosPagoCheckout;
  direccionEnvio: DireccionEnvioPlana;
  direccionEnvioCompletaTexto: string;
  getUsuarioId: () => string;
};

export type CalcularPedidoYWhatsAppResult = {
  numeroPedido: string;
  referenciaPago: string;
  subtotal: number;
  envio: number;
  totalFinal: number;
  descuentoAplicado: number;
  metodoPagoTexto: string;
  mensajeWhatsApp: string;
  urlWhatsApp: string;
  pedidoNuevo: PedidoCheckoutExtendido;
};

export type CheckoutWhatsAppConfig = {
  whatsappNumber: string;
};

/**
 * Número de pedido, totales, mensaje, URL y objeto pedido (sin persistir ni tocar UI).
 * Debe ejecutarse en el mismo punto que antes: tras sync + espera, igual que en el flujo legacy.
 * `config` (p. ej. desde `CHECKOUT_CONFIG`) evita acoplar el core a módulos de aplicación.
 */
export function calcularPedidoYWhatsApp(
  input: CalcularPedidoYWhatsAppInput,
  config: CheckoutWhatsAppConfig
): CalcularPedidoYWhatsAppResult {
  const {
    datosClienteActual,
    nombreCompletoActual,
    cart,
    descuentoCupon,
    cuponAplicado,
    precioItemCarrito,
    metodoPagoActual,
    direccionEnvio,
    direccionEnvioCompletaTexto,
    getUsuarioId
  } = input;

  const referenciaPago = generarReferenciaPago();
  const numeroPedido = generarNumeroPedido();
  const descuentoAplicado = descuentoCupon;
  const { subtotal, envio, total: totalFinal } = calcularTotales({
    items: cart,
    provincia: datosClienteActual.provincia,
    descuento: descuentoAplicado,
    calcularEnvioFn: calcularEnvio,
    resolverPrecioItem: precioItemCarrito
  });
  const metodoPagoTexto = metodoPagoActual === "bizum" ? "Bizum" : "Tarjeta";
  const totalTexto = totalFinal.toFixed(2).replace(".", ",");

  const viaUnaLinea = construirDireccionCompleta({
    calle: direccionEnvio.calle,
    numero: direccionEnvio.numero,
    bloque: direccionEnvio.bloque,
    escalera: direccionEnvio.escalera,
    piso: direccionEnvio.piso,
    puerta: direccionEnvio.puerta
  });
  const direccionLineas = [
    viaUnaLinea,
    `${direccionEnvio.cp} ${direccionEnvio.poblacion}${direccionEnvio.provincia ? `, ${direccionEnvio.provincia}` : ""}`.trim(),
    direccionEnvio.pais
  ].filter((l) => String(l || "").trim().length > 0);

  const lineasProductos = cart.map((item) => `• ${item.nombre} x${item.cantidad}`).join("\n");
  const direccionStr = (direccionLineas.length > 0 ? direccionLineas : [direccionEnvioCompletaTexto]).join("\n");
  const telefonoStr = datosClienteActual.telefono || "";
  const totalConEuro = `${totalTexto} €`;

  let mensaje =
    "Hola, te escribo para confirmar mi pedido ✨\n\n" +
    `📦 Pedido nº ${numeroPedido}\n\n` +
    "🛍️ Productos:\n" +
    `${lineasProductos}\n\n` +
    `💰 Total: ${totalConEuro}\n\n` +
    `👤 Nombre: ${nombreCompletoActual}\n\n` +
    "📍 Dirección de envío:\n" +
    `${direccionStr}\n\n` +
    `📞 Teléfono: ${telefonoStr}`;

  const notas = (datosClienteActual.notas || "").trim();
  if (notas) {
    mensaje += `\n\nNotas:\n${notas}`;
  }

  mensaje +=
    "\n\nQuedo pendiente de tu confirmación 😊\n" +
    "Gracias por tu atención.\n\n" +
    "Maika Rutas del Alma";

  const urlWhatsApp = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
  const direccionTexto = direccionEnvioCompletaTexto;

  const pedidoNuevo: PedidoCheckoutExtendido = {
    ...buildPedido({
      numeroPedido,
      usuarioId: getUsuarioId(),
      cliente: {
        ...datosClienteActual,
        nombreApellidos: nombreCompletoActual,
        direccion: direccionEnvioCompletaTexto
      },
      items: cart,
      subtotal,
      envio,
      total: totalFinal,
      metodoPago: metodoPagoActual,
      referenciaPago,
      descuento: descuentoAplicado,
      cupon: cuponAplicado?.codigo
    }),
    direccionEnvio,
    direccionTexto
  };

  return {
    numeroPedido,
    referenciaPago,
    subtotal,
    envio,
    totalFinal,
    descuentoAplicado,
    metodoPagoTexto,
    mensajeWhatsApp: mensaje,
    urlWhatsApp,
    pedidoNuevo
  };
}
