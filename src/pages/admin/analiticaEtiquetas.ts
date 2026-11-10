import { ARTICULOS } from "../../data/articulos";

/**
 * Etiquetas legibles del panel de analítica propia.
 * Módulo puro (sin React) para poder probar los nombres mostrados en tests.
 */

export const NOMBRE_SECCION: Record<string, string> = {
  inicio: "Inicio",
  tienda: "Tienda",
  carrito: "Carrito",
  seguimiento: "Seguimiento",
  servicios: "Servicios",
  suenos: "Sueños",
  horoscopos: "Horóscopos",
  lectura: "Lectura",
  "ritual-del-mes": "Ritual del mes",
  testimonios: "Testimonios",
  "sobre-maika": "Sobre MAIKA",
  "rutas-del-alma": "Rutas del Alma",
  articulos: "Artículos",
  contacto: "Contacto",
  enlaces: "Enlaces",
  envios: "Envíos",
  legal: "Legal",
  cuenta: "Cuenta",
  admin: "Admin",
  otra: "Otras"
};

export const NOMBRE_PROCEDENCIA: Record<string, string> = {
  google: "Google",
  instagram: "Instagram",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  pinterest: "Pinterest",
  directo: "Directo / interno",
  otro: "Otras"
};

export const NOMBRE_FUNCION: Record<string, string> = {
  interpretaciones: "Interpretaciones de sueños",
  horoscopos: "Lecturas de horóscopo",
  chatCabala: "Preguntas a Cábala",
  sugerencias: "Sugerencias enviadas"
};

/** slug editorial → título del artículo, derivado de `articulos.ts` (fuente única). */
export const NOMBRE_ARTICULO: Record<string, string> = Object.fromEntries(
  ARTICULOS.map((a) => [a.slug, a.titulo])
);

export function etiqueta(mapa: Record<string, string>, clave: string): string {
  return mapa[clave] ?? clave;
}

export function formatoDuracion(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  return `${m} min ${s % 60} s`;
}

/** Tarjetas de totales del panel. «Páginas vistas» se llama así a propósito: no son personas. */
export function tarjetasResumen(totales: {
  sesiones: number;
  primeraVez: number;
  recurrentes: number;
  vistas: number;
  duracionTotalMs: number;
  duraciones: number;
}): { label: string; valor: string | number }[] {
  const media = totales.duraciones > 0 ? totales.duracionTotalMs / totales.duraciones : 0;
  return [
    { label: "Sesiones", valor: totales.sesiones },
    { label: "Nuevas", valor: totales.primeraVez },
    { label: "Recurrentes", valor: totales.recurrentes },
    { label: "Páginas vistas", valor: totales.vistas },
    { label: "Duración media", valor: formatoDuracion(media) }
  ];
}
