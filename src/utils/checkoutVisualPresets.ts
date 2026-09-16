import type { BarraTopPedidoExitoCfg } from "./barraTopPedidoExito/barraTopPedidoExitoCfg";
import {
  ALTURA_BARRA_TOP_MAX,
  ALTURA_BARRA_TOP_MIN,
  BARRA_TOP_PEDIDO_EXITO_CFG_DEFAULT,
  guardarBarraTopPedidoExitoCfg,
  ICONOS_BARRA_ESCALA_MAX,
  ICONOS_BARRA_ESCALA_MIN,
  leerBarraTopPedidoExitoCfg,
  logoTamanoDesdeAlturaBarra,
  normalizarBarraTopPedidoExitoCfg
} from "./barraTopPedidoExito/barraTopPedidoExitoCfg";
import {
  FONDO_ESTRELLAS_COLOR_DEFAULT,
  FONDO_ESTRELLAS_DENSIDAD_DEFAULT,
  FONDO_ESTRELLAS_MOVIMIENTO_DEFAULT,
  guardarFondoEstrellasColor,
  guardarFondoEstrellasDensidad,
  guardarFondoEstrellasMovimiento,
  guardarFondoAppCapaPreset,
  guardarFondoPantallaConfig,
  guardarFondoPantallaOscuridad,
  guardarFondoPantallaTono,
  leerFondoAppCapaPreset,
  leerFondoEstrellasColor,
  leerFondoEstrellasDensidad,
  leerFondoEstrellasMovimiento,
  leerFondoPantallaConfig,
  leerFondoPantallaOscuridad,
  leerFondoPantallaTono,
  limpiarFondoPantallaConfig,
  type FondoAppCapaPresetId
} from "./fondoPantallaConfig";
import {
  guardarHeroBannerAjuste,
  guardarHeroBannerSrc,
  HERO_BANNER_AJUSTE_DEFAULT,
  HERO_BANNER_DEFAULT_SRC,
  HERO_BANNER_STRETCH_X_MAX,
  HERO_BANNER_STRETCH_X_MIN,
  HERO_BANNER_ZOOM_MAX,
  HERO_BANNER_ZOOM_MIN,
  HERO_CTA_OFFSET_MAX,
  HERO_CTA_OFFSET_MIN,
  leerHeroBannerAjuste,
  leerHeroBannerSrc
} from "./heroBannerConfig";
import {
  guardarHeroLogoConfig,
  HERO_LOGO_DEFAULT,
  leerHeroLogoConfig,
  normalizarHeroLogoConfig,
  type HeroLogoConfig
} from "./heroLogoConfig";
import {
  storageBorrarBaseline,
  storageEscribirBaselineJson,
  storageEscribirPresetsJson,
  storageLeerBaselineJson,
  storageLeerPresetsJson
} from "./checkoutVisualPresetsStorage";
import {
  guardarWebLayoutSnapshot,
  leerWebLayoutConfig,
  normalizarWebLayoutSnapshot
} from "./webLayoutConfig";

export const CHECKOUT_VISUAL_PRESETS_KEY = "maikaCheckoutVisualPresets";

/** Si existe, «Restaurar todo» del admin aplica este snapshot en lugar del built-in del código. */
export const CHECKOUT_VISUAL_RESTORE_BASELINE_KEY = "maikaCheckoutVisualRestoreBaseline";

/** Evita volver a auto-sembrar el baseline si el usuario lo borró a posta (quiere usar solo el built-in). */
const CHECKOUT_VISUAL_RESTORE_BASELINE_MIGRATED_KEY = "maikaCheckoutVisualRestoreBaselineMigrated";

export const CHECKOUT_VISUAL_PRESET_REVISION = 1 as const;

/** Límite de presets con nombre guardados (reduce riesgo de llenar almacenamiento por base64). */
export const CHECKOUT_VISUAL_PRESETS_MAX = 3;

export type CheckoutVisualFondoSnapshot = {
  pantallaUrl: string;
  oscuridad: number;
  tono: string;
  estrellasDensidad: number;
  estrellasColor: string;
  estrellasMovimiento: number;
  appCapaPreset: "" | "maika-lila";
};

export type CheckoutVisualLayoutSnapshot = {
  topOffset: number;
  pageHeaderGap?: number;
  pageSubheaderGap?: number;
};

export type CheckoutVisualPresetPayload = {
  revision: typeof CHECKOUT_VISUAL_PRESET_REVISION;
  barra: BarraTopPedidoExitoCfg;
  fondo: CheckoutVisualFondoSnapshot;
  hero: { bannerSrc: string; zoom: number; stretchX: number; ctaOffset: number };
  heroLogo: HeroLogoConfig;
  /** Hueco extra bajo la barra (px); compat presets viejos sin campo → 0. */
  layout: CheckoutVisualLayoutSnapshot;
};

export type CheckoutVisualPreset = { nombre: string; payload: CheckoutVisualPresetPayload };

function normalizarNombrePreset(nombre: string): string {
  return nombre.trim().replace(/\s+/g, " ");
}

/** `localStorage` suele tener ~5 MB; presets y baseline guardan imágenes en base64 completas. */
function esErrorCuotaLocalStorage(error: unknown): boolean {
  return error instanceof DOMException && (error.name === "QuotaExceededError" || error.code === 22);
}

function mensajeFalloLocalStorage(error: unknown): string {
  if (esErrorCuotaLocalStorage(error)) {
    return "Sin espacio en el navegador (cuota llena). Cada preset o «predeterminado» guarda copias enteras del hero, fondo y logos en base64. Prueba a borrar presets viejos, usar imágenes más ligeras o liberar sitios en el almacenamiento del navegador.";
  }
  return "No se pudo guardar (modo privado, almacenamiento bloqueado u otro límite del navegador).";
}

function normalizarHex(valor: unknown, fallback: string): string {
  if (typeof valor !== "string") return fallback;
  const v = valor.trim();
  if (!/^#([0-9a-fA-F]{6})$/.test(v)) return fallback;
  return v.toLowerCase();
}

function normalizarFondoSnapshot(raw: unknown): CheckoutVisualFondoSnapshot {
  const d: CheckoutVisualFondoSnapshot = {
    pantallaUrl: "",
    oscuridad: 45,
    tono: "#0b0b0d",
    estrellasDensidad: FONDO_ESTRELLAS_DENSIDAD_DEFAULT,
    estrellasColor: FONDO_ESTRELLAS_COLOR_DEFAULT,
    estrellasMovimiento: FONDO_ESTRELLAS_MOVIMIENTO_DEFAULT,
    appCapaPreset: ""
  };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...d };
  const r = raw as Record<string, unknown>;
  const url = typeof r.pantallaUrl === "string" ? r.pantallaUrl.trim() : "";
  const osc = Number(r.oscuridad);
  const den = Number(r.estrellasDensidad);
  const mov = Number(r.estrellasMovimiento);
  return {
    pantallaUrl: url,
    oscuridad: Number.isFinite(osc) ? Math.max(0, Math.min(85, Math.round(osc))) : d.oscuridad,
    tono: normalizarHex(r.tono, d.tono),
    estrellasDensidad: Number.isFinite(den)
      ? Math.max(0, Math.min(180, Math.round(den)))
      : d.estrellasDensidad,
    estrellasColor: normalizarHex(r.estrellasColor, d.estrellasColor),
    estrellasMovimiento: Number.isFinite(mov)
      ? Math.max(0, Math.min(300, Math.round(mov)))
      : d.estrellasMovimiento,
    appCapaPreset: r.appCapaPreset === "maika-lila" ? "maika-lila" : ""
  };
}

function normalizarHeroSnapshot(raw: unknown): CheckoutVisualPresetPayload["hero"] {
  const d = {
    bannerSrc: HERO_BANNER_DEFAULT_SRC,
    zoom: HERO_BANNER_AJUSTE_DEFAULT.zoom,
    stretchX: HERO_BANNER_AJUSTE_DEFAULT.stretchX,
    ctaOffset: HERO_BANNER_AJUSTE_DEFAULT.ctaOffset
  };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...d };
  const r = raw as Record<string, unknown>;
  const src = typeof r.bannerSrc === "string" ? r.bannerSrc.trim() : "";
  const z = Number(r.zoom);
  const sx = Number(r.stretchX);
  const cta = Number(r.ctaOffset);
  const bannerSrc =
    src && (src.startsWith("data:image/") || src.startsWith("/") || src.startsWith("http://") || src.startsWith("https://"))
      ? src
      : HERO_BANNER_DEFAULT_SRC;
  return {
    bannerSrc,
    zoom: Number.isFinite(z) ? Math.max(HERO_BANNER_ZOOM_MIN, Math.min(HERO_BANNER_ZOOM_MAX, Math.round(z))) : d.zoom,
    stretchX: Number.isFinite(sx)
      ? Math.max(HERO_BANNER_STRETCH_X_MIN, Math.min(HERO_BANNER_STRETCH_X_MAX, Math.round(sx)))
      : d.stretchX,
    ctaOffset: Number.isFinite(cta)
      ? Math.max(HERO_CTA_OFFSET_MIN, Math.min(HERO_CTA_OFFSET_MAX, Math.round(cta)))
      : d.ctaOffset
  };
}

function normalizarPayload(raw: unknown): CheckoutVisualPresetPayload | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (r.revision !== CHECKOUT_VISUAL_PRESET_REVISION) return null;
  return {
    revision: CHECKOUT_VISUAL_PRESET_REVISION,
    barra: normalizarBarraTopPedidoExitoCfg(r.barra as Partial<BarraTopPedidoExitoCfg>),
    fondo: normalizarFondoSnapshot(r.fondo),
    hero: normalizarHeroSnapshot(r.hero),
    heroLogo: normalizarHeroLogoConfig(r.heroLogo as Partial<HeroLogoConfig>),
    layout: normalizarWebLayoutSnapshot((r as Record<string, unknown>).layout)
  };
}

function parseListaDesdeJson(raw: string | null): CheckoutVisualPreset[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: CheckoutVisualPreset[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const o = item as Record<string, unknown>;
      const nombre = normalizarNombrePreset(String(o.nombre ?? ""));
      if (!nombre) continue;
      const payload = normalizarPayload(o.payload);
      if (payload) out.push({ nombre, payload });
    }
    return out;
  } catch {
    return [];
  }
}

async function leerLista(): Promise<CheckoutVisualPreset[]> {
  const raw = await storageLeerPresetsJson();
  return parseListaDesdeJson(raw);
}

async function escribirLista(lista: CheckoutVisualPreset[]): Promise<{ ok: true } | { ok: false; error: unknown }> {
  return storageEscribirPresetsJson(JSON.stringify(lista));
}

export async function listarCheckoutVisualPresets(): Promise<CheckoutVisualPreset[]> {
  return leerLista();
}

export type GuardarCheckoutVisualPresetResult =
  | { ok: true; presets: CheckoutVisualPreset[] }
  | { ok: false; error: string };

export async function guardarCheckoutVisualPreset(
  nombre: string,
  payload: CheckoutVisualPresetPayload
): Promise<GuardarCheckoutVisualPresetResult> {
  const n = normalizarNombrePreset(nombre);
  if (!n) return { ok: false, error: "Indica un nombre para el preset." };
  const normalizedPayload = normalizarPayload(payload);
  if (!normalizedPayload) return { ok: false, error: "Datos del preset no válidos." };
  const lista = await leerLista();
  const idx = lista.findIndex((p) => p.nombre.toLowerCase() === n.toLowerCase());
  if (idx === -1 && lista.length >= CHECKOUT_VISUAL_PRESETS_MAX) {
    return {
      ok: false,
      error: `Solo puedes guardar hasta ${CHECKOUT_VISUAL_PRESETS_MAX} presets. Elimina uno antes de crear otro (o guarda con el mismo nombre para sustituir uno existente).`
    };
  }
  const entry: CheckoutVisualPreset = { nombre: n, payload: normalizedPayload };
  const next = idx === -1 ? [...lista, entry] : lista.map((p, i) => (i === idx ? entry : p));
  const w = await escribirLista(next);
  if (w.ok === false) {
    return { ok: false, error: mensajeFalloLocalStorage(w.error) };
  }
  return { ok: true, presets: next };
}

export async function cargarCheckoutVisualPresetPorNombre(nombre: string): Promise<CheckoutVisualPresetPayload | null> {
  const n = normalizarNombrePreset(nombre);
  if (!n) return null;
  const found = (await leerLista()).find((p) => p.nombre.toLowerCase() === n.toLowerCase());
  return found ? normalizarPayload(found.payload) : null;
}

export type EliminarCheckoutVisualPresetResult =
  | { ok: true; presets: CheckoutVisualPreset[] }
  | { ok: false; error: string };

/** Quita un preset de la lista guardada (no modifica la configuración activa del sitio). */
export async function eliminarCheckoutVisualPresetPorNombre(nombre: string): Promise<EliminarCheckoutVisualPresetResult> {
  const n = normalizarNombrePreset(nombre);
  if (!n) return { ok: false, error: "Nombre no válido." };
  const lista = await leerLista();
  const idx = lista.findIndex((p) => p.nombre.toLowerCase() === n.toLowerCase());
  if (idx === -1) return { ok: false, error: "Preset no encontrado." };
  const next = lista.filter((_, i) => i !== idx);
  const w = await escribirLista(next);
  if (w.ok === false) {
    return { ok: false, error: mensajeFalloLocalStorage(w.error) };
  }
  return { ok: true, presets: next };
}

function buildCheckoutVisualBuiltInDefaultsPayload(): CheckoutVisualPresetPayload {
  return {
    revision: CHECKOUT_VISUAL_PRESET_REVISION,
    barra: { ...BARRA_TOP_PEDIDO_EXITO_CFG_DEFAULT },
    fondo: {
      pantallaUrl: "",
      oscuridad: 45,
      tono: "#0b0b0d",
      estrellasDensidad: FONDO_ESTRELLAS_DENSIDAD_DEFAULT,
      estrellasColor: FONDO_ESTRELLAS_COLOR_DEFAULT,
      estrellasMovimiento: FONDO_ESTRELLAS_MOVIMIENTO_DEFAULT,
      appCapaPreset: ""
    },
    hero: {
      bannerSrc: HERO_BANNER_DEFAULT_SRC,
      zoom: HERO_BANNER_AJUSTE_DEFAULT.zoom,
      stretchX: HERO_BANNER_AJUSTE_DEFAULT.stretchX,
      ctaOffset: HERO_BANNER_AJUSTE_DEFAULT.ctaOffset
    },
    heroLogo: { ...HERO_LOGO_DEFAULT },
    layout: { topOffset: 0 }
  };
}

/** Lee el baseline personalizado para «Restaurar todo» (null si no se ha guardado ninguno). */
export async function leerCheckoutVisualRestoreBaseline(): Promise<CheckoutVisualPresetPayload | null> {
  try {
    const raw = await storageLeerBaselineJson();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return normalizarPayload(parsed);
  } catch {
    return null;
  }
}

export type GuardarCheckoutVisualRestoreBaselineResult =
  | { ok: true }
  | { ok: false; error: string };

/** Guarda la configuración actual del panel como destino de «Restaurar todo». */
export async function guardarCheckoutVisualRestoreBaseline(
  payload: CheckoutVisualPresetPayload
): Promise<GuardarCheckoutVisualRestoreBaselineResult> {
  const p = normalizarPayload(payload);
  if (!p) return { ok: false, error: "Datos no válidos para guardar el predeterminado." };
  const w = await storageEscribirBaselineJson(JSON.stringify(p));
  if (w.ok === false) {
    return { ok: false, error: mensajeFalloLocalStorage(w.error) };
  }
  try {
    localStorage.setItem(CHECKOUT_VISUAL_RESTORE_BASELINE_MIGRATED_KEY, "1");
  } catch {
    /* ignore */
  }
  return { ok: true };
}

export async function borrarCheckoutVisualRestoreBaseline(): Promise<void> {
  await storageBorrarBaseline();
}

/**
 * La primera vez que se abre el admin en este navegador, copia lo ya guardado en LS como baseline de «Restaurar todo».
 * Si el usuario borró el baseline después, no se vuelve a ejecutar (queda el built-in del código).
 */
export async function asegurarCheckoutVisualRestoreBaselineDesdeLocalStorageSiPrimeraVez(): Promise<boolean> {
  try {
    if (await leerCheckoutVisualRestoreBaseline()) return false;
    if (localStorage.getItem(CHECKOUT_VISUAL_RESTORE_BASELINE_MIGRATED_KEY) === "1") return false;
    const payload = buildCheckoutVisualPayloadFromLocalStorage();
    const r = await guardarCheckoutVisualRestoreBaseline(payload);
    return r.ok;
  } catch {
    return false;
  }
}

/** Arma el mismo shape que un preset leyendo solo lo persistido en localStorage (sin estado temporal del panel). */
export function buildCheckoutVisualPayloadFromLocalStorage(): CheckoutVisualPresetPayload {
  const barra = leerBarraTopPedidoExitoCfg();
  const ajuste = leerHeroBannerAjuste();
  return {
    revision: CHECKOUT_VISUAL_PRESET_REVISION,
    barra: normalizarBarraTopPedidoExitoCfg(barra),
    fondo: {
      pantallaUrl: leerFondoPantallaConfig(),
      oscuridad: leerFondoPantallaOscuridad(),
      tono: leerFondoPantallaTono(),
      estrellasDensidad: leerFondoEstrellasDensidad(),
      estrellasColor: leerFondoEstrellasColor(),
      estrellasMovimiento: leerFondoEstrellasMovimiento(),
      appCapaPreset: leerFondoAppCapaPreset()
    },
    hero: {
      bannerSrc: leerHeroBannerSrc(),
      zoom: ajuste.zoom,
      stretchX: ajuste.stretchX,
      ctaOffset: ajuste.ctaOffset
    },
    heroLogo: { ...leerHeroLogoConfig() },
    layout: { ...leerWebLayoutConfig() }
  };
}

/**
 * Mismo shape que `buildCheckoutVisualPayloadFromLocalStorage` pero con el estado temporal
 * del panel admin (valores pendientes de aplicar, sin pasar por localStorage).
 */
export function buildCheckoutVisualPayloadFromPanelState(params: {
  barraCfg: BarraTopPedidoExitoCfg;
  colorFondoBarra: string;
  colorIconosBarra: string;
  alturaBarra: number;
  iconosEscalaPct: number;
  logoUrlDataPendiente: string | null;
  fondoPantallaUrl: string;
  fondoOscuridad: number;
  fondoTono: string;
  estrellasDensidad: number;
  estrellasColor: string;
  estrellasMovimiento: number;
  appCapaPreset: FondoAppCapaPresetId;
  heroBannerSrc: string;
  heroBannerZoom: number;
  heroBannerStretchX: number;
  heroBannerCtaOffset: number;
  heroLogo: HeroLogoConfig;
}): CheckoutVisualPresetPayload {
  const alturaBarraSuperior = Math.max(
    ALTURA_BARRA_TOP_MIN,
    Math.min(ALTURA_BARRA_TOP_MAX, Math.round(params.alturaBarra))
  );
  return {
    revision: CHECKOUT_VISUAL_PRESET_REVISION,
    barra: {
      ...params.barraCfg,
      fondoBarraSuperior: params.colorFondoBarra,
      colorIconosBarraSuperior: params.colorIconosBarra,
      alturaBarraSuperior,
      iconosEscalaPct: Math.max(
        ICONOS_BARRA_ESCALA_MIN,
        Math.min(ICONOS_BARRA_ESCALA_MAX, Math.round(params.iconosEscalaPct))
      ),
      logoTamano: logoTamanoDesdeAlturaBarra(alturaBarraSuperior),
      ...(params.logoUrlDataPendiente ? { logoUrl: params.logoUrlDataPendiente } : {})
    },
    fondo: {
      pantallaUrl: params.fondoPantallaUrl,
      oscuridad: params.fondoOscuridad,
      tono: params.fondoTono,
      estrellasDensidad: params.estrellasDensidad,
      estrellasColor: params.estrellasColor,
      estrellasMovimiento: params.estrellasMovimiento,
      appCapaPreset: params.appCapaPreset
    },
    hero: {
      bannerSrc: params.heroBannerSrc,
      zoom: params.heroBannerZoom,
      stretchX: params.heroBannerStretchX,
      ctaOffset: params.heroBannerCtaOffset
    },
    heroLogo: { ...params.heroLogo },
    layout: { ...leerWebLayoutConfig() }
  };
}

/**
 * Payload que usa «Restaurar todo»: si hay baseline guardado en este navegador, ese; si no, valores built-in del código.
 */
export async function buildCheckoutVisualDefaultsPayload(): Promise<CheckoutVisualPresetPayload> {
  const custom = await leerCheckoutVisualRestoreBaseline();
  if (custom) return custom;
  return buildCheckoutVisualBuiltInDefaultsPayload();
}

/**
 * Persiste en localStorage todo lo del acordeón «Hero diseño web completa».
 * No actualiza estado React (hazlo leyendo LS después).
 */
export function aplicarCheckoutVisualPresetPayload(payload: CheckoutVisualPresetPayload): void {
  const p = normalizarPayload(payload);
  if (!p) return;

  guardarBarraTopPedidoExitoCfg(p.barra);

  if (!p.fondo.pantallaUrl.trim()) {
    limpiarFondoPantallaConfig();
  } else {
    guardarFondoPantallaConfig(p.fondo.pantallaUrl);
  }
  guardarFondoPantallaOscuridad(p.fondo.oscuridad);
  guardarFondoPantallaTono(p.fondo.tono);
  guardarFondoEstrellasDensidad(p.fondo.estrellasDensidad);
  guardarFondoEstrellasColor(p.fondo.estrellasColor);
  guardarFondoEstrellasMovimiento(p.fondo.estrellasMovimiento);
  guardarFondoAppCapaPreset(p.fondo.appCapaPreset);

  guardarHeroBannerSrc(p.hero.bannerSrc);
  guardarHeroBannerAjuste({ zoom: p.hero.zoom, stretchX: p.hero.stretchX, ctaOffset: p.hero.ctaOffset });

  guardarHeroLogoConfig(p.heroLogo);

  // Aplicar snapshot completo de espaciado (offset + gaps) para que presets/restaurar sean 100% fieles.
  guardarWebLayoutSnapshot({
    topOffset: p.layout.topOffset,
    pageHeaderGap: p.layout.pageHeaderGap,
    pageSubheaderGap: p.layout.pageSubheaderGap
  });
}
