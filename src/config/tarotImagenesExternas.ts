/**
 * Imágenes Rider-Waite servidas por CDN (sin archivos en `public/tarot/`).
 *
 * - Por defecto: jsDelivr del paquete `tarot-card-img` (arcanos mayores como `major/Nm.jpg`).
 * - Opcional: `VITE_TAROT_IMAGEN_PLANTILLA` con `{slug}` si tu CDN usa nombres tipo `la-muerte.jpg`.
 * - Opcional: `TAROT_IMAGEN_CARTA_OVERRIDES` para nombres raros o URLs absolutas.
 */

const env = typeof import.meta !== "undefined" ? (import.meta as ImportMeta).env : undefined;

/**
 * Plantilla de URL: debe incluir exactamente `{slug}` (reemplazado por el slug normalizado).
 * Ej.: `https://tu-cdn.com/tarot/{slug}.jpg`
 * Si no se define, se usa el CDN npm + mapa de arcanos mayores.
 */
export const TAROT_IMAGEN_PLANTILLA = (env?.VITE_TAROT_IMAGEN_PLANTILLA ?? "").trim();

/** Base del paquete npm (Rider-Waite, dominio público empaquetado). */
export const TAROT_IMAGEN_NPM_BASE = "https://cdn.jsdelivr.net/npm/tarot-card-img@0.1.0";

/**
 * Arcanos mayores: slug normalizado → ruta bajo el base npm (`major/Nm.jpg`).
 * Orden clásico RWS: VIII Fuerza, XI Justicia.
 */
export const TAROT_SLUG_A_ARCHIVO_NPM: Record<string, string> = {
  "el-loco": "major/0m.jpg",
  "el-mago": "major/1m.jpg",
  "la-sacerdotisa": "major/2m.jpg",
  "la-emperatriz": "major/3m.jpg",
  "el-emperador": "major/4m.jpg",
  "el-hierofante": "major/5m.jpg",
  "el-papa": "major/5m.jpg",
  "los-enamorados": "major/6m.jpg",
  "el-carro": "major/7m.jpg",
  "la-fuerza": "major/8m.jpg",
  "el-ermitano": "major/9m.jpg",
  "la-rueda-de-la-fortuna": "major/10m.jpg",
  "la-justicia": "major/11m.jpg",
  "el-colgado": "major/12m.jpg",
  "la-muerte": "major/13m.jpg",
  "la-templanza": "major/14m.jpg",
  "el-diablo": "major/15m.jpg",
  "la-torre": "major/16m.jpg",
  "la-estrella": "major/17m.jpg",
  "la-luna": "major/18m.jpg",
  "el-sol": "major/19m.jpg",
  "el-juicio": "major/20m.jpg",
  "el-mundo": "major/21m.jpg"
};

/**
 * Overrides: clave = nombre exacto de `cartaTarot` en datos, o slug normalizado.
 * Valor = ruta relativa al base npm (ej. `major/3m.jpg`), fragmento para plantilla, o URL absoluta.
 */
export const TAROT_IMAGEN_CARTA_OVERRIDES: Record<string, string> = {
  // Ej.: otro nombre visible para el mismo arcano:
  // "La Papisa": "major/2m.jpg",
};
