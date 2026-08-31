/** Pantalla 2 (/lectura): excepción bajo barra + anchos vía CSS vars en `html`. Persistido en localStorage. */

export const MAIKA_LECTURA_PANTALLA_LS_KEY = "maikaLecturaPantalla";

/** Solo panel «Pantalla · /lectura»: destino de «Valores por defecto» (no afecta al resto del admin). */
export const MAIKA_LECTURA_PANTALLA_BASELINE_LS_KEY = "maikaLecturaPantallaRestauracion";

export const MAIKA_LECTURA_PANTALLA_UPDATED_EVENT = "maika_lectura_pantalla_updated";

export type LecturaPantallaSnapshot = {
  /** 0 = ancho completo (`100%`). Si no, `min(Npx, 100%)`. */
  shellAnchoMaxPx: number;
  /** Ancho máximo solo de la columna de texto (px); la carta no usa esto. */
  mallaAnchoMaxPx: number;
  /**
   * Resta píxeles al `padding-top` interno de `.lectura-shell.lectura-page` (aire bajo la barra ya lo da
   * `.page-top-spacing`). Acerca carta + texto a la zona útil sin tocar el resto del sitio.
   */
  tirarHaciaBarraPx: number;
};

const DEFAULTS: LecturaPantallaSnapshot = {
  shellAnchoMaxPx: 1100,
  mallaAnchoMaxPx: 900,
  tirarHaciaBarraPx: 0
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function normalizarLecturaPantallaSnapshot(raw: unknown): LecturaPantallaSnapshot {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...DEFAULTS };
  const o = raw as Record<string, unknown>;
  const shell = Math.round(Number(o.shellAnchoMaxPx));
  const malla = Math.round(Number(o.mallaAnchoMaxPx));
  const tirarRaw =
    o.tirarHaciaBarraPx != null && o.tirarHaciaBarraPx !== ""
      ? Number(o.tirarHaciaBarraPx)
      : o.extraArribaPx != null && o.extraArribaPx !== ""
        ? Number(o.extraArribaPx)
        : NaN;
  return {
    shellAnchoMaxPx: Number.isFinite(shell) ? clamp(shell, 0, 2400) : DEFAULTS.shellAnchoMaxPx,
    mallaAnchoMaxPx: Number.isFinite(malla) ? clamp(malla, 400, 1200) : DEFAULTS.mallaAnchoMaxPx,
    tirarHaciaBarraPx: Number.isFinite(tirarRaw) ? clamp(Math.round(tirarRaw), 0, 120) : DEFAULTS.tirarHaciaBarraPx
  };
}

export function leerLecturaPantallaConfig(): LecturaPantallaSnapshot {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(MAIKA_LECTURA_PANTALLA_LS_KEY);
    if (!raw) return { ...DEFAULTS };
    return normalizarLecturaPantallaSnapshot(JSON.parse(raw) as unknown);
  } catch {
    return { ...DEFAULTS };
  }
}

/** Valores a los que vuelve «Valores por defecto» en el panel de /lectura (baseline o fábrica del código). */
export function leerLecturaPantallaSnapshotRestauracion(): LecturaPantallaSnapshot {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(MAIKA_LECTURA_PANTALLA_BASELINE_LS_KEY);
    if (!raw) return { ...DEFAULTS };
    return normalizarLecturaPantallaSnapshot(JSON.parse(raw) as unknown);
  } catch {
    return { ...DEFAULTS };
  }
}

export function hayLecturaPantallaBaselineRestauracion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(localStorage.getItem(MAIKA_LECTURA_PANTALLA_BASELINE_LS_KEY));
  } catch {
    return false;
  }
}

/** Guarda los ajustes actuales como destino de «Valores por defecto» (solo este panel). */
export function guardarLecturaPantallaBaselineRestauracion(cfg: LecturaPantallaSnapshot): LecturaPantallaSnapshot {
  const next = normalizarLecturaPantallaSnapshot(cfg);
  try {
    localStorage.setItem(MAIKA_LECTURA_PANTALLA_BASELINE_LS_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  try {
    window.dispatchEvent(new CustomEvent(MAIKA_LECTURA_PANTALLA_UPDATED_EVENT, { detail: next }));
  } catch {
    /* noop */
  }
  return next;
}

/** Aplica `--lectura-pantalla-*` en `<html>` (deben leerse desde `:root` en lectura.css). */
export function aplicarLecturaPantallaCssDesdeConfig(cfg: LecturaPantallaSnapshot): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  /* Envoltorio de la ruta /lectura (sustituye el 800px fijo del resto de páginas). */
  const wrapW =
    cfg.shellAnchoMaxPx <= 0 ? "min(800px, 100%)" : `min(${cfg.shellAnchoMaxPx}px, 100%)`;
  root.style.setProperty("--lectura-pantalla-ancho-max", wrapW);

  /* Solo columna de lectura (títulos y párrafos); la carta no lee esta variable. */
  root.style.setProperty("--lectura-pantalla-texto-ancho-max", `${cfg.mallaAnchoMaxPx}px`);
  root.style.removeProperty("--lectura-pantalla-malla-ancho-max");

  root.style.setProperty("--lectura-pantalla-alto", "calc(100dvh - var(--app-topbar-stack))");
  root.style.setProperty("--lectura-tirar-hacia-barra", `${cfg.tirarHaciaBarraPx}px`);
  root.style.removeProperty("--lectura-pantalla-extra-arriba");
}

export function aplicarLecturaPantallaCssDesdeStorage(): void {
  aplicarLecturaPantallaCssDesdeConfig(leerLecturaPantallaConfig());
}

/** Otra pestaña con `localStorage.setItem` dispara `storage` aquí; reaplica vars en `html`. */
export function registrarLecturaPantallaSyncEntrePestanas(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("storage", (e: StorageEvent) => {
    if (e.storageArea !== localStorage) return;
    if (
      e.key != null &&
      e.key !== MAIKA_LECTURA_PANTALLA_LS_KEY &&
      e.key !== MAIKA_LECTURA_PANTALLA_BASELINE_LS_KEY
    ) {
      return;
    }
    const next = leerLecturaPantallaConfig();
    aplicarLecturaPantallaCssDesdeConfig(next);
    try {
      window.dispatchEvent(new CustomEvent(MAIKA_LECTURA_PANTALLA_UPDATED_EVENT, { detail: next }));
    } catch {
      /* noop */
    }
  });
}

export function guardarLecturaPantallaConfig(partial: Partial<LecturaPantallaSnapshot>): LecturaPantallaSnapshot {
  const prev = leerLecturaPantallaConfig();
  const next = normalizarLecturaPantallaSnapshot({ ...prev, ...partial });
  try {
    localStorage.setItem(MAIKA_LECTURA_PANTALLA_LS_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  aplicarLecturaPantallaCssDesdeConfig(next);
  try {
    window.dispatchEvent(new CustomEvent(MAIKA_LECTURA_PANTALLA_UPDATED_EVENT, { detail: next }));
  } catch {
    /* noop */
  }
  return next;
}

export function restaurarLecturaPantallaPorDefecto(): LecturaPantallaSnapshot {
  const next = leerLecturaPantallaSnapshotRestauracion();
  try {
    localStorage.removeItem(MAIKA_LECTURA_PANTALLA_LS_KEY);
  } catch {
    /* noop */
  }
  try {
    localStorage.setItem(MAIKA_LECTURA_PANTALLA_LS_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  aplicarLecturaPantallaCssDesdeConfig(next);
  try {
    window.dispatchEvent(new CustomEvent(MAIKA_LECTURA_PANTALLA_UPDATED_EVENT, { detail: next }));
  } catch {
    /* noop */
  }
  return { ...next };
}
