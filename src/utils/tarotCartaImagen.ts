import {
  TAROT_IMAGEN_CARTA_OVERRIDES,
  TAROT_IMAGEN_NPM_BASE,
  TAROT_IMAGEN_PLANTILLA,
  TAROT_SLUG_A_ARCHIVO_NPM
} from "@/config/tarotImagenesExternas";

/**
 * Convierte el nombre visible de una carta Rider-Waite (español) al slug del archivo.
 * Ej.: "La Muerte" → "la-muerte", "El Ermitaño" → "el-ermitano"
 */
export function normalizarNombreCartaTarotASlug(nombre: string): string {
  const raw = nombre.trim();
  if (!raw) return "carta";

  let s = raw.toLowerCase().replace(/\s+/g, " ");
  s = s.replace(/ñ/g, "n");
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  s = s.replace(/\s/g, "-");
  s = s.replace(/[^a-z0-9-]/g, "");
  s = s.replace(/-+/g, "-").replace(/^-|-$/g, "");

  return s || "carta";
}

/**
 * URL final de la imagen: CDN externo (por defecto jsDelivr + mapa de arcanos mayores),
 * o plantilla `VITE_TAROT_IMAGEN_PLANTILLA` con `{slug}`, u override en `tarotImagenesExternas.ts`.
 */
export function urlImagenTarotCarta(cartaNombre: string): string {
  const t = cartaNombre.trim();
  const slug = normalizarNombreCartaTarotASlug(t);
  const raw = TAROT_IMAGEN_CARTA_OVERRIDES[t] ?? TAROT_IMAGEN_CARTA_OVERRIDES[slug];

  if (raw && /^https?:\/\//i.test(raw)) {
    return raw;
  }

  const segmentoParaPlantilla = raw ?? slug;

  if (TAROT_IMAGEN_PLANTILLA) {
    return TAROT_IMAGEN_PLANTILLA.replace(/\{slug\}/g, segmentoParaPlantilla);
  }

  const rel = raw ?? TAROT_SLUG_A_ARCHIVO_NPM[slug];
  if (rel) {
    return `${TAROT_IMAGEN_NPM_BASE}/${rel}`;
  }

  return `${TAROT_IMAGEN_NPM_BASE}/major/${slug}.jpg`;
}

/** @deprecated Usar `urlImagenTarotCarta` */
export function urlPublicImagenTarotRider(cartaNombre: string): string {
  return urlImagenTarotCarta(cartaNombre);
}
