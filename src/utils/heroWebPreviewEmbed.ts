/**
 * Vista previa «hero web» desde admin: iframe con la home real (`/` + query).
 * Contrato único: admin (URL del iframe) y shell (detección del query) deben usar estas constantes.
 */

import type { HeroBannerAjuste } from "./heroBannerConfig";
import {
  HERO_BANNER_AJUSTE_DEFAULT,
  HERO_BANNER_STRETCH_X_MAX,
  HERO_BANNER_STRETCH_X_MIN,
  HERO_BANNER_ZOOM_MAX,
  HERO_BANNER_ZOOM_MIN,
  HERO_CTA_OFFSET_MAX,
  HERO_CTA_OFFSET_MIN
} from "./heroBannerConfig";
import type { HeroExplorarTiendaConfig } from "./heroExplorarTiendaConfig";
import { HERO_EXPLORAR_TIENDA_DEFAULT } from "./heroExplorarTiendaConfig";

export const HERO_WEB_PREVIEW_EMBED_PARAM = "maikaEmbedHeroPreview";
export const HERO_WEB_PREVIEW_EMBED_VALUE = "1";

/** Si está en la URL junto al embed, `AppRoutes` aplica `HERO_IFRAME_PREVIEW_SESSION_KEY` en sessionStorage. */
export const HERO_WEB_PREVIEW_SESSION_PARAM = "maikaHeroIframeSession";
export const HERO_WEB_PREVIEW_SESSION_VALUE = "1";

export const HERO_IFRAME_PREVIEW_SESSION_KEY = "maikaHeroIframePreviewSessionV1";

export type HeroIframePreviewSessionPayload = {
  src: string;
  zoom: number;
  stretchX: number;
  /** px vertical del CTA (opcional en sesiones antiguas). */
  ctaOffset?: number;
  /** Posición botón «Explorar tienda» (opcional en JSON antiguo). */
  cta?: HeroExplorarTiendaConfig;
};

function clampRango(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

/** Guarda el estado actual del panel admin para que el iframe de la home lo lea (misma origen). */
export function guardarHeroIframePreviewSessionP(payload: HeroIframePreviewSessionPayload): boolean {
  try {
    const body: Record<string, unknown> = {
      src: payload.src,
      zoom: payload.zoom,
      stretchX: clampRango(payload.stretchX, HERO_BANNER_STRETCH_X_MIN, HERO_BANNER_STRETCH_X_MAX, HERO_BANNER_AJUSTE_DEFAULT.stretchX)
    };
    if (payload.ctaOffset !== undefined) {
      body.ctaOffset = clampRango(payload.ctaOffset, HERO_CTA_OFFSET_MIN, HERO_CTA_OFFSET_MAX, HERO_BANNER_AJUSTE_DEFAULT.ctaOffset);
    }
    if (payload.cta) body.cta = payload.cta;
    sessionStorage.setItem(HERO_IFRAME_PREVIEW_SESSION_KEY, JSON.stringify(body));
    return true;
  } catch {
    return false;
  }
}

export function limpiarHeroIframePreviewSession(): void {
  try {
    sessionStorage.removeItem(HERO_IFRAME_PREVIEW_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function parseCtaSesion(j: { cta?: unknown }): HeroExplorarTiendaConfig | null {
  const c = j.cta;
  if (!c || typeof c !== "object") return null;
  const o = c as { escritorio?: { x?: unknown; y?: unknown }; movil?: { x?: unknown; y?: unknown } };
  if (!o.escritorio || !o.movil) return null;
  const ex = clampRango(o.escritorio.x, 0, 100, HERO_EXPLORAR_TIENDA_DEFAULT.escritorio.x);
  const ey = clampRango(o.escritorio.y, 0, 100, HERO_EXPLORAR_TIENDA_DEFAULT.escritorio.y);
  const mx = clampRango(o.movil.x, 0, 100, HERO_EXPLORAR_TIENDA_DEFAULT.movil.x);
  const my = clampRango(o.movil.y, 0, 100, HERO_EXPLORAR_TIENDA_DEFAULT.movil.y);
  return { escritorio: { x: ex, y: ey }, movil: { x: mx, y: my } };
}

export type HeroIframePreviewSessionParsed = {
  src: string;
  ajuste: HeroBannerAjuste;
  cta: HeroExplorarTiendaConfig | null;
};

export function parseHeroIframePreviewSession(raw: string): HeroIframePreviewSessionParsed | null {
  try {
    const j = JSON.parse(raw) as {
      src?: unknown;
      zoom?: unknown;
      stretchX?: unknown;
      ctaOffset?: unknown;
      cta?: unknown;
    };
    if (typeof j.src !== "string") return null;
    const src = j.src.trim();
    if (!src) return null;
    const okSrc =
      src.startsWith("data:image/") ||
      src.startsWith("/") ||
      src.startsWith("http://") ||
      src.startsWith("https://");
    if (!okSrc) return null;
    const ctaParsed = parseCtaSesion(j);
    return {
      src,
      ajuste: {
        zoom: clampRango(j.zoom, HERO_BANNER_ZOOM_MIN, HERO_BANNER_ZOOM_MAX, HERO_BANNER_AJUSTE_DEFAULT.zoom),
        stretchX: clampRango(
          j.stretchX,
          HERO_BANNER_STRETCH_X_MIN,
          HERO_BANNER_STRETCH_X_MAX,
          HERO_BANNER_AJUSTE_DEFAULT.stretchX
        ),
        ctaOffset: clampRango(
          j.ctaOffset,
          HERO_CTA_OFFSET_MIN,
          HERO_CTA_OFFSET_MAX,
          HERO_BANNER_AJUSTE_DEFAULT.ctaOffset
        )
      },
      cta: ctaParsed
    };
  } catch {
    return null;
  }
}

export function esVistaHeroWebEmbebida(search: string): boolean {
  return new URLSearchParams(search).get(HERO_WEB_PREVIEW_EMBED_PARAM) === HERO_WEB_PREVIEW_EMBED_VALUE;
}

export function esVistaHeroWebConSesionPanel(search: string): boolean {
  const sp = new URLSearchParams(search);
  return (
    sp.get(HERO_WEB_PREVIEW_EMBED_PARAM) === HERO_WEB_PREVIEW_EMBED_VALUE &&
    sp.get(HERO_WEB_PREVIEW_SESSION_PARAM) === HERO_WEB_PREVIEW_SESSION_VALUE
  );
}

/** Ancho mínimo del iframe miniatura para que sigan aplicando los estilos de escritorio del hero (`min-width: 769px`). */
export const HERO_PREVIEW_MINI_IFRAME_MIN_W = 769;

/**
 * Tamaño lógico (atributos width/height del iframe) de la vista rápida del hero en admin.
 * Copia la relación de aspecto de `window` para que `object-fit: cover` y el zoom coincidan
 * con abrir `/` en la misma ventana (antes 1280×720 fijo desviaba el recorte).
 */
export function dimensionesIframeHeroPreviewMiniDesdeVentanaAdmin(): { w: number; h: number } {
  if (typeof window === "undefined") return { w: 1280, h: 720 };
  const iw = Math.max(1, window.innerWidth);
  const ih = Math.max(1, window.innerHeight);
  const w = Math.min(4096, Math.max(HERO_PREVIEW_MINI_IFRAME_MIN_W, Math.round(iw)));
  const h = Math.min(2160, Math.max(480, Math.round(ih * (w / iw))));
  return { w, h };
}

/** URL absoluta del inicio en modo embebido (misma app; opcionalmente lee hero desde sessionStorage). */
export function urlAbsolutaPrevisualizacionHeroWeb(opts?: { sesionPanel: boolean }): string {
  if (typeof window === "undefined") return "/";
  const u = new URL("/", window.location.origin);
  u.searchParams.set(HERO_WEB_PREVIEW_EMBED_PARAM, HERO_WEB_PREVIEW_EMBED_VALUE);
  if (opts?.sesionPanel) {
    u.searchParams.set(HERO_WEB_PREVIEW_SESSION_PARAM, HERO_WEB_PREVIEW_SESSION_VALUE);
  }
  return u.toString();
}
