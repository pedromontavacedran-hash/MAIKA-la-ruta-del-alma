import { HERO_BANNER_AJUSTE_DEFAULT, HERO_BANNER_KEY, guardarHeroBannerAjuste, type HeroBannerAjuste } from "./heroBannerConfig";
import { guardarHeroExplorarTiendaPos, HERO_EXPLORAR_TIENDA_DEFAULT, type HeroExplorarTiendaConfig } from "./heroExplorarTiendaConfig";

/** Identificador del perfil que coincide con el «restaurar bloque 5» histórico. */
export const HERO_WEB_PRESET_PRODUCTO_ID = "producto";

export type HeroWebPreset = {
  id: string;
  /** Texto corto en botón del admin */
  etiqueta: string;
  /** Ayuda al pasar el ratón */
  titulo: string;
  ajuste: HeroBannerAjuste;
  cta: HeroExplorarTiendaConfig;
};

/**
 * Perfiles rápidos para el fondo hero (misma imagen por defecto `/banner.jpg`;
 * cambian zoom, estirado horizontal y posición del CTA «Explorar tienda»).
 */
export const HERO_WEB_PRESETS: HeroWebPreset[] = [
  {
    id: HERO_WEB_PRESET_PRODUCTO_ID,
    etiqueta: "Producto",
    titulo: "Valores de fábrica: zoom, estirado y botón como en el código original",
    ajuste: { ...HERO_BANNER_AJUSTE_DEFAULT },
    cta: {
      escritorio: { ...HERO_EXPLORAR_TIENDA_DEFAULT.escritorio },
      movil: { ...HERO_EXPLORAR_TIENDA_DEFAULT.movil }
    }
  },
  {
    id: "cercano",
    etiqueta: "Cercano",
    titulo: "Banner más cerca; CTA escritorio más abajo a la derecha (útil en pantallas altas)",
    ajuste: { ...HERO_BANNER_AJUSTE_DEFAULT, zoom: 58, stretchX: 100 },
    cta: {
      escritorio: { x: 78, y: 48 },
      movil: { x: 88, y: 10 }
    }
  },
  {
    id: "equilibrado",
    etiqueta: "Equilibrado",
    titulo: "Zoom medio y estirado moderado; CTA centrado-arriba en escritorio",
    ajuste: { ...HERO_BANNER_AJUSTE_DEFAULT, zoom: 82, stretchX: 114 },
    cta: {
      escritorio: { x: 50, y: 22 },
      movil: { x: 88, y: 12 }
    }
  },
  {
    id: "panoramico",
    etiqueta: "Panorámico",
    titulo: "Más lejos y más ancho en escritorio; CTA un poco más bajo",
    ajuste: { ...HERO_BANNER_AJUSTE_DEFAULT, zoom: 72, stretchX: 130 },
    cta: {
      escritorio: { x: 50, y: 28 },
      movil: { x: 50, y: 14 }
    }
  }
];

/**
 * Aplica un perfil: quita imagen personalizada del hero, guarda zoom/estirado y posición del CTA.
 * @returns el preset aplicado o null si el id no existe
 */
export function aplicarHeroWebPreset(presetId: string): HeroWebPreset | null {
  const preset = HERO_WEB_PRESETS.find((p) => p.id === presetId);
  if (!preset) return null;
  try {
    localStorage.removeItem(HERO_BANNER_KEY);
  } catch {
    /* ignore */
  }
  guardarHeroBannerAjuste(preset.ajuste);
  guardarHeroExplorarTiendaPos(preset.cta);
  return preset;
}
