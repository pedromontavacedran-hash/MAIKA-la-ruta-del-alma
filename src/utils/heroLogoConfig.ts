export const HERO_LOGO_CONFIG_KEY = "maikaHeroLogoConfig";
export const HERO_LOGO_PRESETS_KEY = "maikaHeroLogoPresets";
export const HERO_LOGO_UPDATED_EVENT = "maika:hero-logo-updated";

export type HeroLogoConfig = {
  mostrarHeroLogo: boolean;
  heroLogoUrl: string;
  heroLogoTamano: number;
  heroLogoPosX: number;
  heroLogoPosY: number;
};

export const HERO_LOGO_DEFAULT: HeroLogoConfig = {
  mostrarHeroLogo: false,
  heroLogoUrl: "",
  heroLogoTamano: 120,
  heroLogoPosX: 50,
  heroLogoPosY: 22
};

/** Instantánea con nombre para la lista en `maikaHeroLogoPresets`. */
export type HeroLogoPreset = {
  nombre: string;
  mostrarHeroLogo: boolean;
  heroLogoUrl: string;
  heroLogoTamano: number;
  heroLogoPosX: number;
  heroLogoPosY: number;
};

function normalizarRango(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function normalizarBooleano(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

function normalizarHeroLogoUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const v = value.trim();
  if (!v) return "";
  if (v.startsWith("data:image/")) return v;
  if (v.startsWith("/")) return v;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return "";
}

export function normalizarHeroLogoConfig(
  raw: Partial<HeroLogoConfig> | null | undefined
): HeroLogoConfig {
  const d = HERO_LOGO_DEFAULT;
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...d };
  }
  const r = raw as Record<string, unknown>;
  return {
    mostrarHeroLogo: normalizarBooleano(r.mostrarHeroLogo, d.mostrarHeroLogo),
    heroLogoUrl: normalizarHeroLogoUrl(r.heroLogoUrl),
    heroLogoTamano: normalizarRango(r.heroLogoTamano, 40, 200, d.heroLogoTamano),
    heroLogoPosX: normalizarRango(r.heroLogoPosX, 0, 100, d.heroLogoPosX),
    heroLogoPosY: normalizarRango(r.heroLogoPosY, 0, 100, d.heroLogoPosY)
  };
}

export function leerHeroLogoConfig(): HeroLogoConfig {
  try {
    const raw = localStorage.getItem(HERO_LOGO_CONFIG_KEY);
    if (!raw) return HERO_LOGO_DEFAULT;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return normalizarHeroLogoConfig(parsed as Partial<HeroLogoConfig>);
  } catch {
    return HERO_LOGO_DEFAULT;
  }
}

export function guardarHeroLogoConfig(cfg: HeroLogoConfig): HeroLogoConfig {
  const normalized = normalizarHeroLogoConfig(cfg);
  try {
    localStorage.setItem(HERO_LOGO_CONFIG_KEY, JSON.stringify(normalized));
  } catch {
    /* cuota o modo privado: no emitir evento como si estuviera persistido */
    return normalized;
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(HERO_LOGO_UPDATED_EVENT, { detail: normalized }));
  }
  return normalized;
}

function normalizarNombrePreset(nombre: string): string {
  return nombre.trim().replace(/\s+/g, " ");
}

function presetDesdeConfig(nombre: string, cfg: HeroLogoConfig): HeroLogoPreset {
  const c = normalizarHeroLogoConfig(cfg);
  return {
    nombre: normalizarNombrePreset(nombre),
    mostrarHeroLogo: c.mostrarHeroLogo,
    heroLogoUrl: c.heroLogoUrl,
    heroLogoTamano: c.heroLogoTamano,
    heroLogoPosX: c.heroLogoPosX,
    heroLogoPosY: c.heroLogoPosY
  };
}

function normalizarPresetEntrada(raw: unknown): HeroLogoPreset | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const nombre = normalizarNombrePreset(String(r.nombre ?? ""));
  if (!nombre) return null;
  const c = normalizarHeroLogoConfig(r as Partial<HeroLogoConfig>);
  return { nombre, ...c };
}

function leerPresetsLista(): HeroLogoPreset[] {
  try {
    const raw = localStorage.getItem(HERO_LOGO_PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: HeroLogoPreset[] = [];
    for (const item of parsed) {
      const p = normalizarPresetEntrada(item);
      if (p) out.push(p);
    }
    return out;
  } catch {
    return [];
  }
}

function escribirPresetsLista(lista: HeroLogoPreset[]): boolean {
  try {
    localStorage.setItem(HERO_LOGO_PRESETS_KEY, JSON.stringify(lista));
    return true;
  } catch {
    return false;
  }
}

export function listarPresetsHero(): HeroLogoPreset[] {
  return leerPresetsLista();
}

export type GuardarPresetHeroResult =
  | { ok: true; presets: HeroLogoPreset[] }
  | { ok: false; error: string };

/**
 * Guarda o sustituye un preset con el mismo nombre (comparación sin distinguir mayúsculas).
 * `actual` suele ser el borrador del panel admin (`heroLogoEdicion`).
 */
export function guardarPresetHero(nombre: string, actual: HeroLogoConfig): GuardarPresetHeroResult {
  const n = normalizarNombrePreset(nombre);
  if (!n) return { ok: false, error: "Indica un nombre para el preset." };
  const snapshot = presetDesdeConfig(n, actual);
  const lista = leerPresetsLista();
  const idx = lista.findIndex((p) => p.nombre.toLowerCase() === n.toLowerCase());
  const next = idx === -1 ? [...lista, snapshot] : lista.map((p, i) => (i === idx ? snapshot : p));
  if (!escribirPresetsLista(next)) {
    return { ok: false, error: "No se pudo guardar en el almacenamiento del navegador." };
  }
  return { ok: true, presets: next };
}

/** Devuelve la config lista para `guardarHeroLogoConfig`, o null si no existe. */
export function cargarPresetHero(nombre: string): HeroLogoConfig | null {
  const n = normalizarNombrePreset(nombre);
  if (!n) return null;
  const found = leerPresetsLista().find((p) => p.nombre.toLowerCase() === n.toLowerCase());
  if (!found) return null;
  return normalizarHeroLogoConfig(found);
}
