/**
 * Constantes y configuración de la aplicación Maika.
 */

export const EMAILJS_CONFIG = {
  PUBLIC_KEY: "Z-4fOHeB2ph9ZNZIH",
  SERVICE_ID: "service_m0olcbz",
  TEMPLATE_ID: "template_k1m7v65"
} as const;

export const COOKIE_CONSENT_KEY = "maikaCookieConsentV1";
export const COOKIE_CONSENT_VERSION = 1;

export const DEMO_ACTIVO_KEY = "maikaDemoActivoV1";
export const DEMO_CATALOGO_KEY = "maikaDemoCatalogoV1";
export const QUICK_CHECKOUT_KEY = "maikaQuickCheckoutV1";

export const CATALOGO_VELAS_KEY = "maikaCatalogoVelas";
export const CATALOGO_INCIENSOS_KEY = "maikaCatalogoInciensos";
export const CATALOGO_FIGURAS_KEY = "maikaCatalogoFiguras";
export const CATALOGO_KITS_KEY = "maikaCatalogoKits";
export const CATEGORIA_IMAGENES_KEY = "maikaCategoriaImagenes";
export const UMBRAL_STOCK_BAJO_KEY = "maikaUmbralStockBajo";

/** Clave en localStorage para la nota que se muestra en factura/pedido y puede usarse en email o etiqueta de envío. */
export const NOTA_PEDIDO_ENVIO_KEY = "maikaNotaPedidoEnvio";

/** Texto por defecto de la nota en pedido/envío (ej. instrucciones para el cliente). */
export const NOTA_PEDIDO_ENVIO_DEFAULT = "Encender en luna creciente. Instrucciones en el sobre.";

/** Clave en localStorage donde tú guardas los códigos promocionales (los puedes cambiar desde Admin). */
export const CUPONES_MAIKA_KEY = "maikaCuponesPromocionales";

/** Cupones por defecto; si no hay ninguno en localStorage, se usan estos. */
export const CUPONES_DISPONIBLES: Record<string, { tipo: "porcentaje" | "envio_gratis"; valor: number }> = {
  MAIKA10: { tipo: "porcentaje", valor: 10 },
  ENVIOGRATIS: { tipo: "envio_gratis", valor: 0 }
};

/** Paleta dorada reutilizable (alineada con App.css) — usar en estilos inline cuando haga falta. */
export const THEME = {
  bg: "#0B0B0D",
  goldMain: "#C9A24A",
  goldLight: "#E6C77A",
  goldDark: "#8A6A2A",
  goldGlow: "rgba(201,162,74,0.35)",
  goldGradient: "linear-gradient(135deg, #E6C77A, #C9A24A, #8A6A2A)",
  goldHoverShadow: "0 0 12px rgba(201,162,74,0.35)",
  text: "#F5E6C8"
} as const;
