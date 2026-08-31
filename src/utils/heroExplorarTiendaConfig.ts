/**
 * Posición del botón «Explorar tienda» sobre el hero (centro del botón en % del recuadro).
 */

export const HERO_EXPLORAR_TIENDA_KEY = "maikaHeroExplorarTiendaPos";
export const HERO_EXPLORAR_TIENDA_UPDATED_EVENT = "maika:hero-explorar-tienda-updated";

export type HeroExplorarTiendaPos = { x: number; y: number };

export type HeroExplorarTiendaConfig = {
  escritorio: HeroExplorarTiendaPos;
  movil: HeroExplorarTiendaPos;
};

/** Coincide con el diseño previo (centro-arriba en escritorio). */
export const HERO_EXPLORAR_TIENDA_DEFAULT_ESCRITORIO: HeroExplorarTiendaPos = { x: 50, y: 8 };

/** Similar al CTA pequeño arriba a la derecha en móvil. */
export const HERO_EXPLORAR_TIENDA_DEFAULT_MOVIL: HeroExplorarTiendaPos = { x: 88, y: 8 };

export const HERO_EXPLORAR_TIENDA_DEFAULT: HeroExplorarTiendaConfig = {
  escritorio: HERO_EXPLORAR_TIENDA_DEFAULT_ESCRITORIO,
  movil: HERO_EXPLORAR_TIENDA_DEFAULT_MOVIL
};

function clampPct(n: unknown, fallback: number): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function leerHeroExplorarTiendaPos(): HeroExplorarTiendaConfig {
  try {
    const raw = localStorage.getItem(HERO_EXPLORAR_TIENDA_KEY);
    if (!raw) return HERO_EXPLORAR_TIENDA_DEFAULT;
    const j = JSON.parse(raw) as {
      escritorio?: { x?: unknown; y?: unknown };
      movil?: { x?: unknown; y?: unknown };
      /** formato antiguo solo escritorio */
      x?: unknown;
      y?: unknown;
    };
    if (j.escritorio || j.movil) {
      return {
        escritorio: {
          x: clampPct(j.escritorio?.x, HERO_EXPLORAR_TIENDA_DEFAULT_ESCRITORIO.x),
          y: clampPct(j.escritorio?.y, HERO_EXPLORAR_TIENDA_DEFAULT_ESCRITORIO.y)
        },
        movil: {
          x: clampPct(j.movil?.x, HERO_EXPLORAR_TIENDA_DEFAULT_MOVIL.x),
          y: clampPct(j.movil?.y, HERO_EXPLORAR_TIENDA_DEFAULT_MOVIL.y)
        }
      };
    }
    const x = clampPct(j.x, HERO_EXPLORAR_TIENDA_DEFAULT_ESCRITORIO.x);
    const y = clampPct(j.y, HERO_EXPLORAR_TIENDA_DEFAULT_ESCRITORIO.y);
    return {
      escritorio: { x, y },
      movil: HERO_EXPLORAR_TIENDA_DEFAULT_MOVIL
    };
  } catch {
    return HERO_EXPLORAR_TIENDA_DEFAULT;
  }
}

export function guardarHeroExplorarTiendaPos(config: HeroExplorarTiendaConfig): void {
  const normalizado: HeroExplorarTiendaConfig = {
    escritorio: {
      x: clampPct(config.escritorio.x, HERO_EXPLORAR_TIENDA_DEFAULT_ESCRITORIO.x),
      y: clampPct(config.escritorio.y, HERO_EXPLORAR_TIENDA_DEFAULT_ESCRITORIO.y)
    },
    movil: {
      x: clampPct(config.movil.x, HERO_EXPLORAR_TIENDA_DEFAULT_MOVIL.x),
      y: clampPct(config.movil.y, HERO_EXPLORAR_TIENDA_DEFAULT_MOVIL.y)
    }
  };
  try {
    localStorage.setItem(HERO_EXPLORAR_TIENDA_KEY, JSON.stringify(normalizado));
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(HERO_EXPLORAR_TIENDA_UPDATED_EVENT, {
        detail: normalizado
      })
    );
  }
}

export function restaurarHeroExplorarTiendaDefault(): void {
  try {
    localStorage.removeItem(HERO_EXPLORAR_TIENDA_KEY);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(HERO_EXPLORAR_TIENDA_UPDATED_EVENT, {
        detail: HERO_EXPLORAR_TIENDA_DEFAULT
      })
    );
  }
}
