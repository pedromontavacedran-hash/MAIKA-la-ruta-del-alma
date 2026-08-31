/**
 * Textos y colores del modal de pedido realizado (código; no se persisten en LS).
 * Sustitución única: "{pedido}" → número mostrado.
 */

export const PEDIDO_EXITO_MODAL_FONDO = "#0B0B0D";
export const PEDIDO_EXITO_MODAL_BORDE = "#C9A24A";

export const PEDIDO_EXITO_TITULO = "Pedido nº {pedido} enviado por WhatsApp";
export const PEDIDO_EXITO_LINEA1 = "Hemos recibido tu pedido correctamente.";
export const PEDIDO_EXITO_LINEA2 = "En unos segundos se abrirá WhatsApp para confirmarlo contigo.";
export const PEDIDO_EXITO_TEXTO_BOTON = "Continuar";

export const PEDIDO_EXITO_COLOR_TITULO = "#C9A24A";
export const PEDIDO_EXITO_COLOR_TEXTO = "#F5E6C8";
export const PEDIDO_EXITO_FONDO_BOTON = "#C9A24A";
export const PEDIDO_EXITO_COLOR_BOTON = "#1b1745";

export function sustituirMarcadorPedido(texto: string, numeroPedido: string): string {
  return texto.replaceAll("{pedido}", numeroPedido);
}
