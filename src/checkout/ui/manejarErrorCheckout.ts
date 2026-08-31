import { notificarError } from "../../utils/ui/notificaciones";
import type { ResultadoCheckout } from "../procesarCheckout.types";

export type ResultadoCheckoutError = Extract<ResultadoCheckout, { tipo: "error" }>;

function esMensajeStockInsuficiente(mensajeTecnico: string): boolean {
  const m = mensajeTecnico.toLowerCase();
  return m.includes("stock") && (m.includes("insuficiente") || m.includes("insufficient"));
}

/** Rechazo 4xx del backend cuando el id no está en productos.json (no confundir con “última unidad vendida”). */
function esProductoNoEnCatalogoServidor(mensajeTecnico: string): boolean {
  const m = mensajeTecnico.toLowerCase();
  return (
    (m.includes("no encontrado") && m.includes("catálogo")) ||
    (m.includes("no encontrado") && m.includes("catalogo")) ||
    m.includes("producto_no_encontrado")
  );
}

/** Texto para el banner del modal de pago (sin tecnicismos de API). */
export function mensajeErrorCheckoutParaUsuario(resultado: ResultadoCheckoutError): string {
  const raw = String(resultado.mensaje ?? "").trim();
  const esRechazoServidor = resultado.origen === "rechazo_servidor";

  if (esRechazoServidor && esMensajeStockInsuficiente(raw)) {
    return "Lo sentimos, otro cliente ha comprado la última unidad.\n\nEste producto ya no está disponible.";
  }
  if (esRechazoServidor && esProductoNoEnCatalogoServidor(raw)) {
    return "Hubo un desfase al validar un producto del pedido con el servidor.\n\nVuelve a pulsar «Pagar y enviar» una vez. Si se repite, entra en la tienda, vacía el carrito y añade el artículo de nuevo.";
  }
  if (esRechazoServidor) {
    return "No pudimos registrar tu pedido. Revisa los datos o inténtalo de nuevo en unos minutos.";
  }
  return raw || "No se pudo completar el pedido. Revisa los datos e inténtalo de nuevo.";
}

export type ManejarErrorCheckoutDeps = {
  mostrarNotificacion: (mensaje: string, tipo?: "normal" | "exito" | "error") => void;
  /** Mensaje visible en el paso de pago (p. ej. stock insuficiente); no reintentar como red. */
  setMensajeErrorCheckoutPago?: (mensaje: string | null) => void;
  /** Solo `true` si el motor devolvió `origen: "rechazo_servidor"` (p. ej. 409 stock). Red/validación → `false`. */
  onMarcarCheckoutErrorRechazoServidor?: (esRechazoServidor: boolean) => void;
};

export function manejarErrorCheckout(resultado: ResultadoCheckoutError, deps: ManejarErrorCheckoutDeps): void {
  const esRechazoServidor = resultado.origen === "rechazo_servidor";
  const mensajeParaUsuario = mensajeErrorCheckoutParaUsuario(resultado);
  /** Rechazo 4xx: el modal de pago sigue abierto con este mensaje; no se vacía el carrito hasta que el usuario cierre. */
  deps.setMensajeErrorCheckoutPago?.(mensajeParaUsuario);
  deps.onMarcarCheckoutErrorRechazoServidor?.(esRechazoServidor);
  /** En rechazo_servidor el aviso principal es el banner del modal; evitamos toast duplicado. */
  if (!esRechazoServidor) {
    notificarError(deps.mostrarNotificacion, mensajeParaUsuario);
  }
}
