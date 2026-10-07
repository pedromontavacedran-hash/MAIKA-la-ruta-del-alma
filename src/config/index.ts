/**
 * Constantes y configuración de la aplicación Maika.
 */

import { CHECKOUT_CONFIG } from "./checkoutConfig";

export const COOKIE_CONSENT_KEY = "maikaCookieConsentV1";
export const COOKIE_CONSENT_VERSION = 2;

export const DEMO_ACTIVO_KEY = "maikaDemoActivoV1";
export const DEMO_CATALOGO_KEY = "maikaDemoCatalogoV1";
export const QUICK_CHECKOUT_KEY = "maikaQuickCheckoutV1";
/** Persistir preferencia “recordar datos de invitado” en este dispositivo. */
export const RECORDAR_DATOS_INVITADO_KEY = "maika_recordar_datos_invitado";

export const CATALOGO_VELAS_KEY = "maikaCatalogoVelas";
export const CATALOGO_INCIENSOS_KEY = "maikaCatalogoInciensos";
export const CATALOGO_FIGURAS_KEY = "maikaCatalogoFiguras";
export const CATALOGO_KITS_KEY = "maikaCatalogoKits";
export const CATALOGO_JOYAS_KEY = "maikaCatalogoJoyas";
/** Clave en localStorage del carrito. */
export const CARRITO_KEY = "carritoMaika";
/** Carrito modificado sin JWT; al iniciar sesión se fusiona con el servidor (evita duplicar al cerrar sesión). */
export const GUEST_CART_PENDING_KEY = "maika_guest_cart_pending";
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
  /** Mini frase bajo el título (beneficio / para quién es). Opcional. */
  fraseBreve?: string;
  imagen: string;
  duracion: string;
  precio: string;
  textoBoton: string;
  urlWhatsApp: string;
};

/** Valores por defecto de los 3 servicios de la página de inicio. */
export const SERVICIOS_INICIO_DEFAULT: ServicioInicio[] = [
  {
    titulo: "🔮 Tarot Evolutivo",
    fraseBreve: "Para entender tu momento actual",
    imagen: "/tarot%20evolutivo.jpg",
    duracion: "Sesión 60 min",
    precio: "45€",
    textoBoton: "Reservar Tarot",
    urlWhatsApp: `https://wa.me/${CHECKOUT_CONFIG.whatsappNumber}?text=Hola%20Maika%2C%20quiero%20reservar%20Tarot`
  },
  {
    titulo: "✨ Limpieza Energética Personal",
    fraseBreve: "Para limpiar, armonizar y recuperar tu equilibrio.",
    imagen: "/limpieza%20energetica.jpg",
    duracion: "Sesión 45 min",
    precio: "35€",
    textoBoton: "Ver opciones",
    urlWhatsApp: `https://wa.me/${CHECKOUT_CONFIG.whatsappNumber}?text=Hola%20Maika%2C%20quiero%20reservar%20Limpieza`
  },
  {
    titulo: "🕯️ Ritual Personalizado",
    fraseBreve: "Para un trabajo más profundo",
    imagen: "/ritual%20personalizado.jpg",
    duracion: "Sesión 60 min",
    precio: "50€",
    textoBoton: "Ver opciones",
    urlWhatsApp: `https://wa.me/${CHECKOUT_CONFIG.whatsappNumber}?text=Hola%20Maika%2C%20quiero%20consultar%20Ritual`
  }
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
  bg: "#08060f",
  goldMain: "#c6a85a",
  goldLight: "#e8d28a",
  goldDark: "#8f6e28",
  goldGlow: "rgba(232,210,138,0.38)",
  goldGradient: "linear-gradient(135deg, #f8ecbc, #e0c068, #8f6e28)",
  goldHoverShadow: "0 0 20px rgba(248,236,188,0.2), 0 0 44px rgba(200,165,80,0.14)",
  text: "#F5E6C8"
} as const;

/** Ruta bajo `public/` respetando `base` de Vite (subcarpetas / Capacitor). */
function maikaPublicUrl(pathSegments: string): string {
  const env = typeof import.meta !== "undefined" ? (import.meta as ImportMeta).env : undefined;
  const base = env?.BASE_URL != null && String(env.BASE_URL) !== "" ? String(env.BASE_URL) : "/";
  const clean = pathSegments.replace(/^\/+/, "");
  return base.endsWith("/") ? `${base}${clean}` : `${base}/${clean}`;
}

/** Logo principal actualizado en `public/logos/logo web lila fuerte.png`. */
const MAIKA_LOGO_CACHE_BUSTER = "20260421-1";
export const MAIKA_LOGO_PUBLIC_URL = maikaPublicUrl(`logos/logo%20web%20lila%20fuerte.png?v=${MAIKA_LOGO_CACHE_BUSTER}`);

/** Se mantiene el alias legacy, pero apuntando al logo nuevo para evitar volver al antiguo. */
export const MAIKA_LOGO_LEGACY_PUBLIC_URL = MAIKA_LOGO_PUBLIC_URL;
export const MAIKA_LOGO_SIN_FONDO_PUBLIC_URL = MAIKA_LOGO_PUBLIC_URL;
