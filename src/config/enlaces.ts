/**
 * Página pública `/enlaces` (destino del QR de las tarjetas de visita).
 * Los datos reales viven en el backend (`backend/data/enlaces.json`, editables
 * desde el panel admin); esto solo sirve de respaldo si la API no responde.
 */

export type EnlaceConfig = {
  id: string;
  etiqueta: string;
  /** Ruta interna (`/tienda`) o URL absoluta `https://…`. */
  url: string;
  /** Emoji/texto corto opcional; vacío = se deduce de la URL. */
  icono: string;
  activa: boolean;
};

export const ENLACES_DEFAULT: EnlaceConfig[] = [
  { id: "tienda", etiqueta: "Tienda online", url: "/tienda", icono: "🛍️", activa: true },
  { id: "tiktok", etiqueta: "TikTok", url: "https://www.tiktok.com/@maika.rutasdelalma", icono: "♪", activa: true },
  { id: "instagram", etiqueta: "Instagram", url: "https://www.instagram.com/maika.rutasdelalma/", icono: "📸", activa: true },
  { id: "whatsapp", etiqueta: "WhatsApp", url: "https://wa.me/34673175547?text=Hola%20MAIKA", icono: "💬", activa: true }
];

function hostDe(url: string): string {
  try {
    return new URL(url, "https://maika.local").hostname.toLowerCase();
  } catch {
    return "";
  }
}

/** Icono de reserva cuando el enlace no lleva `icono` propio. */
export function iconoParaEnlace(e: EnlaceConfig): string {
  const propio = e.icono.trim();
  if (propio) return propio;
  const host = hostDe(e.url);
  const u = e.url.toLowerCase();
  if (u === "/tienda" || host.includes("tienda")) return "🛍️";
  if (host.includes("tiktok.")) return "♪";
  if (host.includes("instagram.")) return "📸";
  if (host.includes("whatsapp.") || host === "wa.me") return "💬";
  if (host.includes("facebook.") || host === "fb.me") return "f";
  if (host.includes("youtube.") || host === "youtu.be") return "▶";
  return "✦";
}
