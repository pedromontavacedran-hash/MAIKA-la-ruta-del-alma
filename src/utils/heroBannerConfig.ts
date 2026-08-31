export const HERO_BANNER_KEY = "maikaHeroBannerPersonalizado";
export const HERO_BANNER_AJUSTE_KEY = "maikaHeroBannerAjuste";
export const HERO_BANNER_UPDATED_EVENT = "maika:hero-banner-updated";
/** Imagen y ajustes por defecto del hero (admin «Restaurar bloque 5» = volver aquí tras pruebas). */
export const HERO_BANNER_DEFAULT_SRC = "/logos/logo%20web%20negro.png";

export type HeroBannerAjuste = {
  zoom: number;
  /**
   * Escritorio: `scaleX(stretchX / 100)` sobre el JPG (solo horizontal).
   * 100 = ancho natural del contain; mayor = más ancho.
   */
  stretchX: number;
  /** px: desplazamiento vertical extra del botón «Explorar tienda» (`--hero-cta-offset`). */
  ctaOffset: number;
};

/** Por debajo de 100%, el hero usa transform: scale() y deja bandas con object-fit: cover. */
export const HERO_BANNER_ZOOM_MIN = 70;
export const HERO_BANNER_ZOOM_MAX = 160;

export const HERO_BANNER_STRETCH_X_MIN = 100;
export const HERO_BANNER_STRETCH_X_MAX = 150;

export const HERO_CTA_OFFSET_MIN = -100;
export const HERO_CTA_OFFSET_MAX = 200;

/** Valores al pulsar «Restaurar bloque 5». */
export const HERO_BANNER_AJUSTE_DEFAULT: HeroBannerAjuste = {
  zoom: 100,
  stretchX: 114,
  ctaOffset: 0
};

/** Sincroniza `--hero-cta-offset` en `<html>` (mismo criterio que layout web). */
export function aplicarHeroCtaOffsetCss(ctaOffsetPx: number): void {
  if (typeof document === "undefined") return;
  const n = normalizarRango(ctaOffsetPx, HERO_CTA_OFFSET_MIN, HERO_CTA_OFFSET_MAX, HERO_BANNER_AJUSTE_DEFAULT.ctaOffset);
  document.documentElement.style.setProperty("--hero-cta-offset", `${n}px`);
}

export function aplicarHeroCtaOffsetDesdeStorage(): void {
  aplicarHeroCtaOffsetCss(leerHeroBannerAjuste().ctaOffset);
}

function normalizarHeroSrc(valor: unknown): string {
  if (typeof valor !== "string") return HERO_BANNER_DEFAULT_SRC;
  const v = valor.trim();
  if (!v) return HERO_BANNER_DEFAULT_SRC;
  if (v.startsWith("data:image/")) return v;
  if (v.startsWith("/")) return v;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return HERO_BANNER_DEFAULT_SRC;
}

export function leerHeroBannerSrc(): string {
  try {
    return normalizarHeroSrc(localStorage.getItem(HERO_BANNER_KEY));
  } catch {
    return HERO_BANNER_DEFAULT_SRC;
  }
}

/** @returns true si quedó guardado en localStorage (si false, suele ser cuota/tamaño). */
export function guardarHeroBannerSrc(src: string): boolean {
  const normalizado = normalizarHeroSrc(src);
  let persistido = true;
  try {
    localStorage.setItem(HERO_BANNER_KEY, normalizado);
  } catch {
    persistido = false;
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(HERO_BANNER_UPDATED_EVENT, {
        detail: { src: normalizado, persisted: persistido }
      })
    );
  }
  return persistido;
}

function normalizarRango(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function leerHeroBannerAjuste(): HeroBannerAjuste {
  try {
    const raw = localStorage.getItem(HERO_BANNER_AJUSTE_KEY);
    if (!raw) return HERO_BANNER_AJUSTE_DEFAULT;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      zoom: normalizarRango(parsed.zoom, HERO_BANNER_ZOOM_MIN, HERO_BANNER_ZOOM_MAX, HERO_BANNER_AJUSTE_DEFAULT.zoom),
      stretchX: normalizarRango(
        parsed.stretchX,
        HERO_BANNER_STRETCH_X_MIN,
        HERO_BANNER_STRETCH_X_MAX,
        HERO_BANNER_AJUSTE_DEFAULT.stretchX
      ),
      ctaOffset: normalizarRango(
        (parsed as Record<string, unknown>).ctaOffset,
        HERO_CTA_OFFSET_MIN,
        HERO_CTA_OFFSET_MAX,
        HERO_BANNER_AJUSTE_DEFAULT.ctaOffset
      )
    };
  } catch {
    return HERO_BANNER_AJUSTE_DEFAULT;
  }
}

export function guardarHeroBannerAjuste(parcial: Partial<HeroBannerAjuste>): void {
  const prev = leerHeroBannerAjuste();
  const merged: HeroBannerAjuste = { ...prev, ...parcial };
  const normalizado: HeroBannerAjuste = {
    zoom: normalizarRango(merged.zoom, HERO_BANNER_ZOOM_MIN, HERO_BANNER_ZOOM_MAX, HERO_BANNER_AJUSTE_DEFAULT.zoom),
    stretchX: normalizarRango(
      merged.stretchX,
      HERO_BANNER_STRETCH_X_MIN,
      HERO_BANNER_STRETCH_X_MAX,
      HERO_BANNER_AJUSTE_DEFAULT.stretchX
    ),
    ctaOffset: normalizarRango(
      merged.ctaOffset,
      HERO_CTA_OFFSET_MIN,
      HERO_CTA_OFFSET_MAX,
      HERO_BANNER_AJUSTE_DEFAULT.ctaOffset
    )
  };
  aplicarHeroCtaOffsetCss(normalizado.ctaOffset);
  let persistido = true;
  try {
    localStorage.setItem(HERO_BANNER_AJUSTE_KEY, JSON.stringify(normalizado));
  } catch {
    persistido = false;
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(HERO_BANNER_UPDATED_EVENT, {
        detail: { ajuste: normalizado, persisted: persistido }
      })
    );
  }
}

export function restaurarHeroBannerDefault(): void {
  localStorage.removeItem(HERO_BANNER_KEY);
  localStorage.removeItem(HERO_BANNER_AJUSTE_KEY);
  aplicarHeroCtaOffsetCss(HERO_BANNER_AJUSTE_DEFAULT.ctaOffset);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(HERO_BANNER_UPDATED_EVENT, {
        detail: { src: HERO_BANNER_DEFAULT_SRC, ajuste: HERO_BANNER_AJUSTE_DEFAULT }
      })
    );
  }
}
