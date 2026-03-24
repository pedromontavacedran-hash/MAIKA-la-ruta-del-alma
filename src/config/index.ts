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
/** Clave en localStorage del carrito. */
export const CARRITO_KEY = "carritoMaika";
export const CATEGORIA_IMAGENES_KEY = "maikaCategoriaImagenes";
export const UMBRAL_STOCK_BAJO_KEY = "maikaUmbralStockBajo";

/** Clave en localStorage para la nota que se muestra en factura/pedido y puede usarse en email o etiqueta de envío. */
export const NOTA_PEDIDO_ENVIO_KEY = "maikaNotaPedidoEnvio";

/** Texto por defecto de la nota en pedido/envío (ej. instrucciones para el cliente). */
export const NOTA_PEDIDO_ENVIO_DEFAULT = "Encender en luna creciente. Instrucciones en el sobre.";

/** Clave en localStorage para el desplegable de la página de inicio (lista de bloques). */
export const DESPLEGABLE_INICIO_KEY = "maikaDesplegableInicio";

/** Un bloque desplegable: título, subtítulo, desde qué producto empieza (inicio) y cuántos muestra. */
export type BloqueDesplegableInicio = {
  titulo: string;
  subtitulo: string;
  inicio: number;
  numProductos: number;
};

/** Valores por defecto: un solo bloque. En subtítulo usa {mes} y {año} para fecha actual. */
export const DESPLEGABLE_INICIO_DEFAULT: BloqueDesplegableInicio[] = [
  { titulo: "🌙 Ritual del mes", subtitulo: "Lunas de {mes} {año} – Ver productos", inicio: 0, numProductos: 3 },
];

/** Clave en localStorage para los servicios de la página de inicio (nombre, imagen, duración, precio, botón, WhatsApp). */
export const SERVICIOS_INICIO_KEY = "maikaServiciosInicio";

/** Un servicio mostrado en la sección SERVICIOS de Inicio. */
export type ServicioInicio = {
  titulo: string;
  imagen: string;
  duracion: string;
  precio: string;
  textoBoton: string;
  urlWhatsApp: string;
};

/** Valores por defecto de los 3 servicios de la página de inicio. */
export const SERVICIOS_INICIO_DEFAULT: ServicioInicio[] = [
  { titulo: "🔮 Tarot Evolutivo", imagen: "/tarot%20evolutivo.jpg", duracion: "Sesión 60 min", precio: "45€", textoBoton: "Reservar Tarot", urlWhatsApp: "https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20reservar%20Tarot" },
  { titulo: "✨ Limpieza Energética", imagen: "/limpieza%20energetica.jpg", duracion: "Sesión 45 min", precio: "35€", textoBoton: "Reservar Limpieza", urlWhatsApp: "https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20reservar%20Limpieza" },
  { titulo: "🕯️ Ritual Personalizado", imagen: "/ritual%20personalizado.jpg", duracion: "Sesión 60 min", precio: "50€", textoBoton: "Reservar Ritual", urlWhatsApp: "https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20consultar%20Ritual" },
];

/** Clave en localStorage donde tú guardas los códigos promocionales (los puedes cambiar desde Admin). */
export const CUPONES_MAIKA_KEY = "maikaCuponesPromocionales";

/** Cupones por defecto; si no hay ninguno en localStorage, se usan estos. */
export const CUPONES_DISPONIBLES: Record<string, { tipo: "porcentaje" | "envio_gratis"; valor: number }> = {
  MAIKA10: { tipo: "porcentaje", valor: 10 },
  ENVIOGRATIS: { tipo: "envio_gratis", valor: 0 }
};

/**
 * API key de Google Places para autocompletado de direcciones en checkout.
 * Si está definida y no vacía, se usa Google Places; si no, se usan Nominatim + Photon (gratis).
 * Para desactivar Google Places: borra esta variable en .env o déjala vacía.
 */
export const GOOGLE_PLACES_API_KEY = (typeof import.meta !== "undefined" && (import.meta as { env?: Record<string, string> }).env?.VITE_GOOGLE_PLACES_API_KEY) || "";

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
