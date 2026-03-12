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
export const CATEGORIA_IMAGENES_KEY = "maikaCategoriaImagenes";
export const UMBRAL_STOCK_BAJO_KEY = "maikaUmbralStockBajo";

export const CUPONES_DISPONIBLES: Record<string, { tipo: "porcentaje" | "envio_gratis"; valor: number }> = {
  MAIKA10: { tipo: "porcentaje", valor: 10 },
  ENVIOGRATIS: { tipo: "envio_gratis", valor: 0 }
};
