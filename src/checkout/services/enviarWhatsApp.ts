import { CHECKOUT_CONFIG } from "@/config/checkoutConfig";

/**
 * El checkout no envía el mensaje por red; la URL se construye en `calcularPedidoYWhatsApp` (core).
 * Punto de anclaje de la capa servicios para un futuro envío vía API o plantillas centralizadas.
 */
export const WHATSAPP_PEDIDO_E164_SIN_PLUS = CHECKOUT_CONFIG.whatsappNumber;

export function urlWhatsAppWaMeDesdeTexto(texto: string): string {
  return `https://wa.me/${CHECKOUT_CONFIG.whatsappNumber}?text=${encodeURIComponent(texto)}`;
}
