import { normalizarNombreCartaTarotASlug } from "./tarotCartaImagen";

/** Símbolo visual MAIKA por slug de carta (arcanos mayores y alias). */
const SIMBOLO_POR_SLUG: Record<string, string> = {
  "el-loco": "🌠",
  "el-mago": "✋",
  "la-sacerdotisa": "🔮",
  "la-emperatriz": "🌿",
  "el-emperador": "👑",
  "el-hierofante": "⛪",
  "el-papa": "⛪",
  "los-enamorados": "💞",
  "el-carro": "⚜️",
  "la-fuerza": "🦁",
  "el-ermitano": "🕯️",
  "la-rueda-de-la-fortuna": "☸️",
  "la-justicia": "⚖️",
  "el-colgado": "🙃",
  "la-muerte": "🔥",
  "la-templanza": "🏺",
  "el-diablo": "🔺",
  "la-torre": "⚡",
  "la-estrella": "✨",
  "la-luna": "🌙",
  "el-sol": "☀️",
  "el-juicio": "📯",
  "el-mundo": "🌌"
};

const DEFAULT_SIMBOLO = "✨";

/**
 * Devuelve un símbolo (emoji) acorde al nombre de la carta en español.
 * Si no hay entrada, `✨`.
 */
export function simboloMaikaParaCartaTarot(cartaNombre: string): string {
  const slug = normalizarNombreCartaTarotASlug(cartaNombre);
  return SIMBOLO_POR_SLUG[slug] ?? DEFAULT_SIMBOLO;
}
