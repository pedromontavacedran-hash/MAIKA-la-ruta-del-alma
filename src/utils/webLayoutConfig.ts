/** Espacio extra bajo la barra fija (px). Persistido en localStorage; única escritura: `document.documentElement`. */

export const MAIKA_WEB_LAYOUT_LS_KEY = "maikaWebLayout";

export const MAIKA_WEB_LAYOUT_UPDATED_EVENT = "maika_web_layout_updated";

export const WEB_LAYOUT_TOP_OFFSET_MAX = 200;
export const WEB_LAYOUT_PAGE_GAP_MAX = 40;
export const WEB_LAYOUT_PAGE_GAP_MIN = 0;

export type WebLayoutSnapshot = {
  topOffset: number;
  pageHeaderGap?: number;
  pageSubheaderGap?: number;
};

const DEFAULT_LAYOUT: WebLayoutSnapshot = { topOffset: 0 };

function normalizarGap(v: unknown): number | undefined {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(WEB_LAYOUT_PAGE_GAP_MIN, Math.min(WEB_LAYOUT_PAGE_GAP_MAX, Math.round(n)));
}

export function normalizarWebLayoutSnapshot(raw: unknown): WebLayoutSnapshot {
  const d: WebLayoutSnapshot = DEFAULT_LAYOUT;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return d;
  const t = Number((raw as Record<string, unknown>).topOffset);
  const pageHeaderGap = normalizarGap((raw as Record<string, unknown>).pageHeaderGap);
  const pageSubheaderGap = normalizarGap((raw as Record<string, unknown>).pageSubheaderGap);
  return {
    topOffset: Number.isFinite(t) ? Math.max(0, Math.min(WEB_LAYOUT_TOP_OFFSET_MAX, Math.round(t))) : d.topOffset,
    ...(pageHeaderGap == null ? {} : { pageHeaderGap }),
    ...(pageSubheaderGap == null ? {} : { pageSubheaderGap })
  };
}

export function leerWebLayoutConfig(): WebLayoutSnapshot {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  try {
    const raw = localStorage.getItem(MAIKA_WEB_LAYOUT_LS_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const parsed = JSON.parse(raw) as unknown;
    return normalizarWebLayoutSnapshot(parsed);
  } catch {
    return DEFAULT_LAYOUT;
  }
}

/** Aplica `--app-layout-top-offset` en `<html>` leyendo localStorage (primer arranque / otras pestañas). */
export function aplicarWebLayoutCssDesdeStorage(): void {
  if (typeof document === "undefined") return;
  const { topOffset, pageHeaderGap, pageSubheaderGap } = leerWebLayoutConfig();
  document.documentElement.style.setProperty("--app-layout-top-offset", `${topOffset}px`);
  if (pageHeaderGap == null) document.documentElement.style.removeProperty("--maika-page-header-gap");
  else document.documentElement.style.setProperty("--maika-page-header-gap", `${pageHeaderGap}px`);
  if (pageSubheaderGap == null) document.documentElement.style.removeProperty("--maika-page-subheader-gap");
  else document.documentElement.style.setProperty("--maika-page-subheader-gap", `${pageSubheaderGap}px`);
}

function persistirYEmitir(next: WebLayoutSnapshot): WebLayoutSnapshot {
  try {
    localStorage.setItem(MAIKA_WEB_LAYOUT_LS_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  aplicarWebLayoutCssDesdeStorage();
  try {
    window.dispatchEvent(new CustomEvent(MAIKA_WEB_LAYOUT_UPDATED_EVENT, { detail: next }));
  } catch {
    /* noop */
  }
  return next;
}

/** Guarda snapshot completo de layout (permite limpiar overrides de gaps con `undefined`). */
export function guardarWebLayoutSnapshot(snapshot: WebLayoutSnapshot): WebLayoutSnapshot {
  const next = normalizarWebLayoutSnapshot(snapshot);
  return persistirYEmitir(next);
}

export function guardarWebLayoutTopOffset(topOffset: number): WebLayoutSnapshot {
  const prev = leerWebLayoutConfig();
  const next = normalizarWebLayoutSnapshot({ ...prev, topOffset });
  return persistirYEmitir(next);
}

export function guardarWebLayoutPageGaps(pageHeaderGap: number, pageSubheaderGap: number): WebLayoutSnapshot {
  const prev = leerWebLayoutConfig();
  const next = normalizarWebLayoutSnapshot({ ...prev, pageHeaderGap, pageSubheaderGap });
  return persistirYEmitir(next);
}
