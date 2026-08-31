import { MAIKA_LOGO_PUBLIC_URL } from "../../config";

const LOGO_DEFAULT_URL = MAIKA_LOGO_PUBLIC_URL;
const LOGO_ALLOWED_PATHS = new Set([
  "/logotipos.jpg",
  "/logotipos-blanco.jpg",
  "/logos/logo%20web%20lila%20fuerte.png",
  "/logos/logo%20web%20lila.png",
  "/logos/logo%20web%20lila2.png",
  "/logos/logo%20web%20lila3.png",
  "/logos/logo%20web%20granate.png",
  "/logos/logo%20web%20negro.png",
]);

/** Persistencia actual (barra + logo; sin textos del modal). */
export const BARRA_TOP_PEDIDO_EXITO_CFG_KEY = "maikaBarraTopPedidoExitoCfg";
export const BARRA_TOP_PEDIDO_EXITO_CFG_UPDATED_EVENT = "maika:barra-top-pedido-exito-cfg-updated";

/** Vista previa en admin: altura temporal sin guardar en LS (`NavPrincipal` escucha y alinea logo/iconos). */
export const BARRA_TOP_ADMIN_PREVIEW_EVENT = "maika:barra-top-admin-preview";
export type BarraTopAdminPreviewDetail = { alturaBarraSuperior: number; iconosEscalaPct: number } | null;

/** Clave antigua (checkout modal + barra); se migra una vez al leer. */
const BARRA_TOP_PEDIDO_EXITO_CFG_LEGACY_KEY = "maikaCheckoutModalFinalVisualConfig";

/** Misma escala que el logo de la barra superior (`NavPrincipal`); alineado con el slider admin (40–120). */
export function tamanoLogoVisibleEnBarra(logoTamano: number): number {
  return Math.max(40, Math.min(120, Math.round(Number(logoTamano)) || 0));
}

export const LOGO_POS_X_REL_MIN = 0;
export const LOGO_POS_X_REL_MAX = 69;

const LOGO_POS_X_REL_TO_ABS_DENOM = 72;
export const LOGO_POS_X_DEFAULT = 0;

const LOGO_POS_X_REL_V1_MAX = 100;
const LOGO_POS_X_REL_V2_MAX = 96;
const LOGO_POS_X_REL_V3_MAX = 89;
const LOGO_POS_X_REL_V4_MAX = 85;
const LOGO_POS_X_REL_V5_MAX = 82;
const LOGO_POS_X_REL_V6_MAX = 75;
const LOGO_POS_X_REL_V7_MAX = 72;

/** Rev. previa unificada (checkout): logo 0–69 en LS. */
const LOGO_MIG_REV_PREVIA_UNIFICADA = 8;

/**
 * Rev. actual: barra+logo + `alturaBarraSuperior` + escala fina de iconos.
 */
export const BARRA_TOP_PEDIDO_EXITO_CFG_REVISION = 11;

/** Altura útil de la barra fija (hero); coincide con `--app-topbar-h` en `NavPrincipal`. */
export const ALTURA_BARRA_TOP_MIN = 72;
/** Tope duro: permite logo más visible sin desajustar la cabecera. */
export const ALTURA_BARRA_TOP_MAX = 128;
export const ALTURA_BARRA_TOP_DEFAULT = 100;
export const ICONOS_BARRA_ESCALA_MIN = 70;
export const ICONOS_BARRA_ESCALA_MAX = 135;
export const ICONOS_BARRA_ESCALA_DEFAULT = 100;

const LOGO_POS_X_TRACK_ANCHOR_MIN = 16;
const LOGO_POS_X_TRACK_ANCHOR_MAX = 96;
const LOGO_POS_X_PHYS_LEFT = 25;
const LOGO_POS_X_PHYS_RIGHT = 96;

export function logoPosXRelativoAU(rel0a69: number): number {
  let rel = Number(rel0a69);
  if (!Number.isFinite(rel)) rel = LOGO_POS_X_DEFAULT;
  rel = Math.max(LOGO_POS_X_REL_MIN, Math.min(LOGO_POS_X_REL_MAX, rel));
  const abs =
    LOGO_POS_X_PHYS_LEFT +
    (rel / LOGO_POS_X_REL_TO_ABS_DENOM) * (LOGO_POS_X_PHYS_RIGHT - LOGO_POS_X_PHYS_LEFT);
  return (abs - LOGO_POS_X_TRACK_ANCHOR_MIN) / (LOGO_POS_X_TRACK_ANCHOR_MAX - LOGO_POS_X_TRACK_ANCHOR_MIN);
}

export type BarraTopPedidoExitoCfg = {
  logoUrl: string;
  logoTamano: number;
  logoPosX: number;
  mostrarLogoBarra: boolean;
  cfgRevision?: number;
  fondoBarraSuperior: string;
  colorIconosBarraSuperior: string;
  /** Altura visible de la barra (px); sincroniza `document.documentElement` `--app-topbar-h`. */
  alturaBarraSuperior: number;
  /** Ajuste fino independiente: 100 = tamaño derivado de la altura de barra. */
  iconosEscalaPct: number;
};

export const BARRA_TOP_PEDIDO_EXITO_CFG_DEFAULT: BarraTopPedidoExitoCfg = {
  logoUrl: LOGO_DEFAULT_URL,
  logoTamano: 86,
  logoPosX: LOGO_POS_X_DEFAULT,
  mostrarLogoBarra: true,
  cfgRevision: BARRA_TOP_PEDIDO_EXITO_CFG_REVISION,
  fondoBarraSuperior: "#0B0B0D",
  colorIconosBarraSuperior: "#E5C07B",
  alturaBarraSuperior: ALTURA_BARRA_TOP_DEFAULT,
  iconosEscalaPct: ICONOS_BARRA_ESCALA_DEFAULT
};

function limpiarColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const v = value.trim();
  if (!v) return fallback;
  return v;
}

function limpiarNumeroRango(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

/**
 * Tamaño de logo de barra ligado a la altura (una sola escala en admin).
 * Referencia: `logoTamano` y `alturaBarraSuperior` por defecto del sitio.
 */
export function logoTamanoDesdeAlturaBarra(alturaPx: number): number {
  const h = limpiarNumeroRango(alturaPx, ALTURA_BARRA_TOP_DEFAULT, ALTURA_BARRA_TOP_MIN, ALTURA_BARRA_TOP_MAX);
  const refLogo = BARRA_TOP_PEDIDO_EXITO_CFG_DEFAULT.logoTamano;
  return tamanoLogoVisibleEnBarra(Math.round((refLogo * h) / ALTURA_BARRA_TOP_DEFAULT));
}

function limpiarBooleano(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

function migrarLogoPosXDesdeRevision0(rawPos: unknown, fallbackRel100: number): number {
  const n = typeof rawPos === "number" ? rawPos : Number(rawPos);
  if (!Number.isFinite(n)) return fallbackRel100;
  const ri = Math.round(n);
  if (ri >= LOGO_POS_X_PHYS_LEFT && ri <= LOGO_POS_X_PHYS_RIGHT) {
    const span = LOGO_POS_X_PHYS_RIGHT - LOGO_POS_X_PHYS_LEFT;
    return limpiarNumeroRango(
      Math.round(((ri - LOGO_POS_X_PHYS_LEFT) / span) * LOGO_POS_X_REL_V1_MAX),
      fallbackRel100,
      LOGO_POS_X_REL_MIN,
      LOGO_POS_X_REL_V1_MAX
    );
  }
  if (ri >= 16 && ri < LOGO_POS_X_PHYS_LEFT) return LOGO_POS_X_REL_MIN;
  if (ri > LOGO_POS_X_PHYS_RIGHT) return LOGO_POS_X_REL_V1_MAX;
  return limpiarNumeroRango(ri, fallbackRel100, LOGO_POS_X_REL_MIN, LOGO_POS_X_REL_V1_MAX);
}

function relativoV1_100aActual(rel100: number, fallback69: number): number {
  const v = Math.round(
    (limpiarNumeroRango(rel100, 50, LOGO_POS_X_REL_MIN, LOGO_POS_X_REL_V1_MAX) * LOGO_POS_X_REL_MAX) / LOGO_POS_X_REL_V1_MAX
  );
  return limpiarNumeroRango(v, fallback69, LOGO_POS_X_REL_MIN, LOGO_POS_X_REL_MAX);
}

function relativoV2_96aActual(rel96: number, fallback69: number): number {
  const v = Math.round(
    (limpiarNumeroRango(rel96, 50, LOGO_POS_X_REL_MIN, LOGO_POS_X_REL_V2_MAX) * LOGO_POS_X_REL_MAX) / LOGO_POS_X_REL_V2_MAX
  );
  return limpiarNumeroRango(v, fallback69, LOGO_POS_X_REL_MIN, LOGO_POS_X_REL_MAX);
}

function relativoV3_89aActual(rel89: number, fallback69: number): number {
  const v = Math.round(
    (limpiarNumeroRango(rel89, 50, LOGO_POS_X_REL_MIN, LOGO_POS_X_REL_V3_MAX) * LOGO_POS_X_REL_MAX) / LOGO_POS_X_REL_V3_MAX
  );
  return limpiarNumeroRango(v, fallback69, LOGO_POS_X_REL_MIN, LOGO_POS_X_REL_MAX);
}

function relativoV4_85aActual(rel85: number, fallback69: number): number {
  const v = Math.round(
    (limpiarNumeroRango(rel85, 50, LOGO_POS_X_REL_MIN, LOGO_POS_X_REL_V4_MAX) * LOGO_POS_X_REL_MAX) / LOGO_POS_X_REL_V4_MAX
  );
  return limpiarNumeroRango(v, fallback69, LOGO_POS_X_REL_MIN, LOGO_POS_X_REL_MAX);
}

function relativoV5_82aActual(rel82: number, fallback69: number): number {
  const v = Math.round(
    (limpiarNumeroRango(rel82, 50, LOGO_POS_X_REL_MIN, LOGO_POS_X_REL_V5_MAX) * LOGO_POS_X_REL_MAX) / LOGO_POS_X_REL_V5_MAX
  );
  return limpiarNumeroRango(v, fallback69, LOGO_POS_X_REL_MIN, LOGO_POS_X_REL_MAX);
}

function relativoV6_75aActual(rel75: number, fallback69: number): number {
  const v = Math.round(
    (limpiarNumeroRango(rel75, 50, LOGO_POS_X_REL_MIN, LOGO_POS_X_REL_V6_MAX) * LOGO_POS_X_REL_MAX) / LOGO_POS_X_REL_V6_MAX
  );
  return limpiarNumeroRango(v, fallback69, LOGO_POS_X_REL_MIN, LOGO_POS_X_REL_MAX);
}

function relativoV7_72aActual(rel72scale: number, fallback69: number): number {
  const x = limpiarNumeroRango(rel72scale, fallback69, LOGO_POS_X_REL_MIN, LOGO_POS_X_REL_V7_MAX);
  return limpiarNumeroRango(x, fallback69, LOGO_POS_X_REL_MIN, LOGO_POS_X_REL_MAX);
}

function normalizarLogoUrl(value: unknown, fallback: string): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return fallback;
  if (raw.startsWith("data:image/")) return raw;
  if (raw.startsWith("blob:")) return fallback;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.pathname === "/logotipos.jpg" || url.pathname === "/logotipos-blanco.jpg") return fallback;
    if (LOGO_ALLOWED_PATHS.has(url.pathname)) return url.pathname;
    return fallback;
  } catch {
    const basePath = raw.split("?")[0].split("#")[0];
    if (basePath === "/logotipos.jpg" || basePath === "/logotipos-blanco.jpg") return fallback;
    if (LOGO_ALLOWED_PATHS.has(basePath)) return basePath;
    return fallback;
  }
}

function migrarLogoPosXDesdeRaw(r: Record<string, unknown>): number {
  const d = BARRA_TOP_PEDIDO_EXITO_CFG_DEFAULT;
  const revNum = Number(r.cfgRevision);
  const revisionIn = Number.isFinite(revNum) && revNum >= 0 ? Math.floor(revNum) : 0;
  const fallback69 = d.logoPosX;
  /** Rev. 8+ en LS antiguo y actual: misma escala 0–69 almacenada. */
  if (revisionIn >= LOGO_MIG_REV_PREVIA_UNIFICADA) {
    return limpiarNumeroRango(r.logoPosX, fallback69, LOGO_POS_X_REL_MIN, LOGO_POS_X_REL_MAX);
  }
  if (revisionIn === 7) {
    return relativoV7_72aActual(Number(r.logoPosX), fallback69);
  }
  if (revisionIn === 6) {
    return relativoV6_75aActual(Number(r.logoPosX), fallback69);
  }
  if (revisionIn === 5) {
    return relativoV5_82aActual(Number(r.logoPosX), fallback69);
  }
  if (revisionIn === 4) {
    return relativoV4_85aActual(Number(r.logoPosX), fallback69);
  }
  if (revisionIn === 3) {
    return relativoV3_89aActual(Number(r.logoPosX), fallback69);
  }
  if (revisionIn === 2) {
    return relativoV2_96aActual(Number(r.logoPosX), fallback69);
  }
  if (revisionIn === 1) {
    return relativoV1_100aActual(Number(r.logoPosX), fallback69);
  }
  const rel100 = migrarLogoPosXDesdeRevision0(
    r.logoPosX,
    Math.round((Math.max(LOGO_POS_X_REL_MIN, Math.min(LOGO_POS_X_REL_MAX, fallback69)) * LOGO_POS_X_REL_V1_MAX) / LOGO_POS_X_REL_MAX)
  );
  return relativoV1_100aActual(rel100, fallback69);
}

export function normalizarBarraTopPedidoExitoCfg(
  raw: Partial<BarraTopPedidoExitoCfg> | Record<string, unknown> | null | undefined
): BarraTopPedidoExitoCfg {
  const d = BARRA_TOP_PEDIDO_EXITO_CFG_DEFAULT;
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...d };
  }
  const r = raw as Record<string, unknown>;
  const logoPosX = migrarLogoPosXDesdeRaw(r);
  return {
    logoUrl: normalizarLogoUrl(r.logoUrl, d.logoUrl),
    logoTamano: limpiarNumeroRango(r.logoTamano, d.logoTamano, 40, 180),
    logoPosX,
    mostrarLogoBarra: limpiarBooleano(r.mostrarLogoBarra, d.mostrarLogoBarra),
    cfgRevision: BARRA_TOP_PEDIDO_EXITO_CFG_REVISION,
    fondoBarraSuperior: limpiarColor(r.fondoBarraSuperior, d.fondoBarraSuperior),
    colorIconosBarraSuperior: limpiarColor(r.colorIconosBarraSuperior, d.colorIconosBarraSuperior),
    alturaBarraSuperior: limpiarNumeroRango(
      r.alturaBarraSuperior,
      d.alturaBarraSuperior,
      ALTURA_BARRA_TOP_MIN,
      ALTURA_BARRA_TOP_MAX
    ),
    iconosEscalaPct: limpiarNumeroRango(
      r.iconosEscalaPct,
      d.iconosEscalaPct,
      ICONOS_BARRA_ESCALA_MIN,
      ICONOS_BARRA_ESCALA_MAX
    )
  };
}

function persistirYLanzarEvento(cfg: BarraTopPedidoExitoCfg): void {
  localStorage.setItem(BARRA_TOP_PEDIDO_EXITO_CFG_KEY, JSON.stringify(cfg));
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(BARRA_TOP_PEDIDO_EXITO_CFG_UPDATED_EVENT, {
        detail: cfg
      })
    );
  }
}

export function leerBarraTopPedidoExitoCfg(): BarraTopPedidoExitoCfg {
  try {
    let rawStr = localStorage.getItem(BARRA_TOP_PEDIDO_EXITO_CFG_KEY);
    if (!rawStr) {
      rawStr = localStorage.getItem(BARRA_TOP_PEDIDO_EXITO_CFG_LEGACY_KEY);
      if (rawStr) {
        const parsed = JSON.parse(rawStr) as Record<string, unknown>;
        const normalized = normalizarBarraTopPedidoExitoCfg(parsed);
        persistirYLanzarEvento(normalized);
        localStorage.removeItem(BARRA_TOP_PEDIDO_EXITO_CFG_LEGACY_KEY);
        return normalized;
      }
      return BARRA_TOP_PEDIDO_EXITO_CFG_DEFAULT;
    }
    const parsed = JSON.parse(rawStr) as Record<string, unknown>;
    const normalized = normalizarBarraTopPedidoExitoCfg(parsed);
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      persistirYLanzarEvento(normalized);
    }
    try {
      localStorage.removeItem(BARRA_TOP_PEDIDO_EXITO_CFG_LEGACY_KEY);
    } catch {
      /* noop */
    }
    return normalized;
  } catch {
    return BARRA_TOP_PEDIDO_EXITO_CFG_DEFAULT;
  }
}

export function guardarBarraTopPedidoExitoCfg(cfg: BarraTopPedidoExitoCfg): BarraTopPedidoExitoCfg {
  const normalized = normalizarBarraTopPedidoExitoCfg(cfg);
  try {
    persistirYLanzarEvento(normalized);
    localStorage.removeItem(BARRA_TOP_PEDIDO_EXITO_CFG_LEGACY_KEY);
    return normalized;
  } catch {
    const fallbackCfg = normalizarBarraTopPedidoExitoCfg({
      ...cfg,
      logoUrl: BARRA_TOP_PEDIDO_EXITO_CFG_DEFAULT.logoUrl
    });
    try {
      persistirYLanzarEvento(fallbackCfg);
      localStorage.removeItem(BARRA_TOP_PEDIDO_EXITO_CFG_LEGACY_KEY);
      return fallbackCfg;
    } catch {
      return BARRA_TOP_PEDIDO_EXITO_CFG_DEFAULT;
    }
  }
}
