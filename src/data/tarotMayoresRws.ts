/**
 * Arcanos mayores (0–21) para /lectura: nombres y orden fijo.
 * Imágenes en `public/tarot/`; el archivo debe coincidir con `archivoJpg`.
 */
export type ArcanoMayorRws = {
  indice: number;
  /** Nombre exacto del archivo en disco (incluye `.jpg`). */
  archivoJpg: string;
  nombreEs: string;
};

export const ARCANOS_MAYORES_RWS: readonly ArcanoMayorRws[] = [
  { indice: 0, archivoJpg: "el-loco.jpg", nombreEs: "El Loco" },
  { indice: 1, archivoJpg: "el-mago.jpg", nombreEs: "El Mago" },
  { indice: 2, archivoJpg: "la-sacerdotisa.jpg", nombreEs: "La Sacerdotisa" },
  { indice: 3, archivoJpg: "la-emperatriz.jpg", nombreEs: "La Emperatriz" },
  { indice: 4, archivoJpg: "el-emperador.jpg", nombreEs: "El Emperador" },
  { indice: 5, archivoJpg: "el-hierofante.jpg", nombreEs: "El Hierofante" },
  { indice: 6, archivoJpg: "los-enamorados.jpg", nombreEs: "Los Enamorados" },
  { indice: 7, archivoJpg: "el-carro.jpg", nombreEs: "El Carro" },
  { indice: 8, archivoJpg: "la-fuerza.jpg", nombreEs: "La Fuerza" },
  { indice: 9, archivoJpg: "el-ermitano.jpg", nombreEs: "El Ermitaño" },
  { indice: 10, archivoJpg: "la-rueda-de-la-fortuna.jpg", nombreEs: "La Rueda de la Fortuna" },
  { indice: 11, archivoJpg: "la-justicia.jpg", nombreEs: "La Justicia" },
  { indice: 12, archivoJpg: "el-colgado.jpg", nombreEs: "El Colgado" },
  { indice: 13, archivoJpg: "la-muerte.jpg", nombreEs: "La Muerte" },
  { indice: 14, archivoJpg: "la-templanza.jpg", nombreEs: "La Templanza" },
  { indice: 15, archivoJpg: "el-diablo.jpg", nombreEs: "El Diablo" },
  { indice: 16, archivoJpg: "la-torre.jpg", nombreEs: "La Torre" },
  { indice: 17, archivoJpg: "la-estrella.jpg", nombreEs: "La Estrella" },
  { indice: 18, archivoJpg: "la-luna.jpg", nombreEs: "La Luna" },
  { indice: 19, archivoJpg: "el-sol.jpg", nombreEs: "El Sol" },
  { indice: 20, archivoJpg: "el-juicio.jpg", nombreEs: "El Juicio" },
  { indice: 21, archivoJpg: "el-mundo.jpg", nombreEs: "El Mundo" }
] as const;

/** Carpeta servida por Vite desde `public/tarot/`. */
const CARPETA_MAIKA_MAYORES = "tarot";

export function urlImagenArcanoMayorRws(indice: number): string {
  const i = ((indice % 22) + 22) % 22;
  const { archivoJpg } = ARCANOS_MAYORES_RWS[i];
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  /* Los JPG originales (~3MB) se sirven como WebP (~200KB) del mismo nombre. */
  const archivoWebp = archivoJpg.replace(/\.jpg$/i, ".webp");
  return `${base}${CARPETA_MAIKA_MAYORES}/${encodeURIComponent(archivoWebp)}`;
}

export function infoArcanoMayorRws(indice: number): ArcanoMayorRws {
  const i = ((indice % 22) + 22) % 22;
  return ARCANOS_MAYORES_RWS[i];
}
