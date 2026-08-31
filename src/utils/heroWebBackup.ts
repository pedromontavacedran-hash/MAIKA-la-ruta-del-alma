import {
  aplicarHeroCtaOffsetCss,
  HERO_BANNER_AJUSTE_KEY,
  HERO_BANNER_KEY,
  HERO_BANNER_UPDATED_EVENT,
  leerHeroBannerAjuste,
  leerHeroBannerSrc
} from "./heroBannerConfig";
import { HERO_EXPLORAR_TIENDA_KEY, HERO_EXPLORAR_TIENDA_UPDATED_EVENT, leerHeroExplorarTiendaPos } from "./heroExplorarTiendaConfig";

export const HERO_WEB_BACKUP_VERSION = 1 as const;

export type HeroWebBackupPayload = {
  maikaHeroBackupVersion: typeof HERO_WEB_BACKUP_VERSION;
  exportadoIso: string;
  /** Valores tal cual en localStorage (string o null = clave ausente). */
  localStorage: {
    [HERO_BANNER_KEY]: string | null;
    [HERO_BANNER_AJUSTE_KEY]: string | null;
    [HERO_EXPLORAR_TIENDA_KEY]: string | null;
  };
};

function leerLsSeguro(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Genera JSON con imagen (si hay), zoom/estirado y posición del CTA. Guárdalo en disco o nube. */
export function serializarHeroWebBackup(): string {
  const payload: HeroWebBackupPayload = {
    maikaHeroBackupVersion: HERO_WEB_BACKUP_VERSION,
    exportadoIso: new Date().toISOString(),
    localStorage: {
      [HERO_BANNER_KEY]: leerLsSeguro(HERO_BANNER_KEY),
      [HERO_BANNER_AJUSTE_KEY]: leerLsSeguro(HERO_BANNER_AJUSTE_KEY),
      [HERO_EXPLORAR_TIENDA_KEY]: leerLsSeguro(HERO_EXPLORAR_TIENDA_KEY)
    }
  };
  return JSON.stringify(payload, null, 2);
}

export type ImportarHeroWebBackupResult = { ok: true } | { ok: false; error: string };

/**
 * Restaura las claves del hero desde un JSON exportado con `serializarHeroWebBackup`.
 * Emite los mismos eventos que el resto de la app para refrescar inicio / admin.
 */
export function importarHeroWebBackup(jsonStr: string): ImportarHeroWebBackupResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return { ok: false, error: "El archivo no es JSON válido." };
  }
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "Formato de copia no reconocido." };
  }
  const o = parsed as Record<string, unknown>;
  if (o.maikaHeroBackupVersion !== HERO_WEB_BACKUP_VERSION) {
    return { ok: false, error: "Versión de copia no compatible." };
  }
  const bag = o.localStorage;
  if (!bag || typeof bag !== "object") {
    return { ok: false, error: "Falta el bloque localStorage en la copia." };
  }
  const b = bag as Record<string, unknown>;
  const keys = [HERO_BANNER_KEY, HERO_BANNER_AJUSTE_KEY, HERO_EXPLORAR_TIENDA_KEY] as const;
  try {
    for (const key of keys) {
      const v = b[key];
      if (v === null || v === undefined) {
        localStorage.removeItem(key);
      } else if (typeof v === "string") {
        localStorage.setItem(key, v);
      } else {
        return { ok: false, error: `Valor inválido para la clave ${key}.` };
      }
    }
  } catch {
    return { ok: false, error: "No se pudo escribir en el almacenamiento (cuota llena o bloqueado)." };
  }

  if (typeof window !== "undefined") {
    const src = leerHeroBannerSrc();
    const ajuste = leerHeroBannerAjuste();
    aplicarHeroCtaOffsetCss(ajuste.ctaOffset);
    const cta = leerHeroExplorarTiendaPos();
    window.dispatchEvent(
      new CustomEvent(HERO_BANNER_UPDATED_EVENT, {
        detail: { src, ajuste }
      })
    );
    window.dispatchEvent(new CustomEvent(HERO_EXPLORAR_TIENDA_UPDATED_EVENT, { detail: cta }));
  }

  return { ok: true };
}

export function nombreArchivoHeroWebBackup(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `maika-hero-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
}
