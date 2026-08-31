export const FONDO_PANTALLA_KEY = "maikaFondoPantallaPersonalizado";
export const FONDO_PANTALLA_OSCURIDAD_KEY = "maikaFondoPantallaOscuridad";
export const FONDO_PANTALLA_TONO_KEY = "maikaFondoPantallaTono";
/** Porcentaje 0–180: 0 = sin estrellas; 100 = cantidad base; escala cielo + refuerzo móvil por igual. */
export const FONDO_ESTRELLAS_DENSIDAD_KEY = "maikaFondoEstrellasDensidad";
/** Color de las estrellas (#RRGGBB), mismo tono que --gold-main por defecto. */
export const FONDO_ESTRELLAS_COLOR_KEY = "maikaFondoEstrellasColor";
/** Velocidad de desplazamiento del cielo estrellado (0–300). */
export const FONDO_ESTRELLAS_MOVIMIENTO_KEY = "maikaFondoEstrellasMovimiento";
export const FONDO_PANTALLA_UPDATED_EVENT = "maika:fondo-pantalla-updated";

/** Capa base de toda la app (debajo de estrellas y contenido). Se elige desde el admin. */
export const FONDO_APP_CAPA_PRESET_KEY = "maikaFondoAppCapaPreset";

/** Degradado lila oscuro (misma familia que lectura/noria); una sola fuente de verdad. */
export const FONDO_APP_GRADIENTE_MAIKA_LILA =
  "radial-gradient(120% 85% at 50% -8%, rgba(255, 250, 255, 0.038) 0%, transparent 50%), " +
  "radial-gradient(95% 72% at 11% 90%, rgba(58, 28, 95, 0.62) 0%, transparent 56%), " +
  "radial-gradient(88% 64% at 93% 74%, rgba(78, 34, 112, 0.48) 0%, transparent 52%), " +
  "linear-gradient(168deg, #140e22 0%, #241038 32%, #2f1544 56%, #170c24 100%)";

export type FondoAppCapaPresetId = "" | "maika-lila";

function normalizarFondoAppCapaPreset(valor: unknown): FondoAppCapaPresetId {
  if (valor === "maika-lila") return "maika-lila";
  return "";
}

export function leerFondoAppCapaPreset(): FondoAppCapaPresetId {
  try {
    return normalizarFondoAppCapaPreset(localStorage.getItem(FONDO_APP_CAPA_PRESET_KEY));
  } catch {
    return "";
  }
}

export function guardarFondoAppCapaPreset(id: FondoAppCapaPresetId): void {
  const normalizado = normalizarFondoAppCapaPreset(id);
  if (normalizado) {
    localStorage.setItem(FONDO_APP_CAPA_PRESET_KEY, normalizado);
  } else {
    localStorage.removeItem(FONDO_APP_CAPA_PRESET_KEY);
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(FONDO_PANTALLA_UPDATED_EVENT, { detail: normalizado }));
  }
}

export const FONDO_ESTRELLAS_DENSIDAD_MIN = 0;
export const FONDO_ESTRELLAS_DENSIDAD_MAX = 180;
export const FONDO_ESTRELLAS_DENSIDAD_DEFAULT = 100;
export const FONDO_ESTRELLAS_COLOR_DEFAULT = "#c9a24a";
export const FONDO_ESTRELLAS_MOVIMIENTO_MIN = 0;
export const FONDO_ESTRELLAS_MOVIMIENTO_MAX = 300;
export const FONDO_ESTRELLAS_MOVIMIENTO_DEFAULT = 0;

function normalizarFondoPantalla(valor: unknown): string {
  if (typeof valor !== "string") return "";
  const v = valor.trim();
  if (!v) return "";
  if (v.startsWith("data:image/")) return v;
  if (v.startsWith("/")) return v;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return "";
}

export function leerFondoPantallaConfig(): string {
  try {
    return normalizarFondoPantalla(localStorage.getItem(FONDO_PANTALLA_KEY));
  } catch {
    return "";
  }
}

export function guardarFondoPantallaConfig(url: string): void {
  const normalizado = normalizarFondoPantalla(url);
  localStorage.setItem(FONDO_PANTALLA_KEY, normalizado);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(FONDO_PANTALLA_UPDATED_EVENT, {
        detail: normalizado
      })
    );
  }
}

export function limpiarFondoPantallaConfig(): void {
  localStorage.removeItem(FONDO_PANTALLA_KEY);
  try {
    localStorage.removeItem(FONDO_ESTRELLAS_COLOR_KEY);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(FONDO_PANTALLA_UPDATED_EVENT, {
        detail: ""
      })
    );
  }
}

export function leerFondoPantallaOscuridad(): number {
  try {
    const raw = localStorage.getItem(FONDO_PANTALLA_OSCURIDAD_KEY);
    const n = Number(raw);
    if (!Number.isFinite(n)) return 45;
    return Math.max(0, Math.min(85, Math.round(n)));
  } catch {
    return 45;
  }
}

export function guardarFondoPantallaOscuridad(valor: number): void {
  const normalizado = Math.max(0, Math.min(85, Math.round(valor)));
  localStorage.setItem(FONDO_PANTALLA_OSCURIDAD_KEY, String(normalizado));
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(FONDO_PANTALLA_UPDATED_EVENT, {
        detail: normalizado
      })
    );
  }
}

function normalizarHexColor(valor: unknown): string {
  if (typeof valor !== "string") return "#0b0b0d";
  const v = valor.trim();
  if (!/^#([0-9a-fA-F]{6})$/.test(v)) return "#0b0b0d";
  return v.toLowerCase();
}

export function leerFondoPantallaTono(): string {
  try {
    return normalizarHexColor(localStorage.getItem(FONDO_PANTALLA_TONO_KEY));
  } catch {
    return "#0b0b0d";
  }
}

export function guardarFondoPantallaTono(color: string): void {
  const normalizado = normalizarHexColor(color);
  localStorage.setItem(FONDO_PANTALLA_TONO_KEY, normalizado);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(FONDO_PANTALLA_UPDATED_EVENT, {
        detail: normalizado
      })
    );
  }
}

export function leerFondoEstrellasDensidad(): number {
  try {
    const n = Number(localStorage.getItem(FONDO_ESTRELLAS_DENSIDAD_KEY));
    if (!Number.isFinite(n)) return FONDO_ESTRELLAS_DENSIDAD_DEFAULT;
    return Math.max(FONDO_ESTRELLAS_DENSIDAD_MIN, Math.min(FONDO_ESTRELLAS_DENSIDAD_MAX, Math.round(n)));
  } catch {
    return FONDO_ESTRELLAS_DENSIDAD_DEFAULT;
  }
}

export function guardarFondoEstrellasDensidad(valor: number): void {
  const normalizado = Math.max(
    FONDO_ESTRELLAS_DENSIDAD_MIN,
    Math.min(FONDO_ESTRELLAS_DENSIDAD_MAX, Math.round(valor))
  );
  localStorage.setItem(FONDO_ESTRELLAS_DENSIDAD_KEY, String(normalizado));
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(FONDO_PANTALLA_UPDATED_EVENT, {
        detail: normalizado
      })
    );
  }
}

function normalizarHexEstrellas(valor: unknown): string {
  if (typeof valor !== "string") return FONDO_ESTRELLAS_COLOR_DEFAULT;
  const v = valor.trim();
  if (!/^#([0-9a-fA-F]{6})$/.test(v)) return FONDO_ESTRELLAS_COLOR_DEFAULT;
  return v.toLowerCase();
}

export function leerFondoEstrellasColor(): string {
  try {
    return normalizarHexEstrellas(localStorage.getItem(FONDO_ESTRELLAS_COLOR_KEY));
  } catch {
    return FONDO_ESTRELLAS_COLOR_DEFAULT;
  }
}

export function guardarFondoEstrellasColor(color: string): void {
  const normalizado = normalizarHexEstrellas(color);
  localStorage.setItem(FONDO_ESTRELLAS_COLOR_KEY, normalizado);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(FONDO_PANTALLA_UPDATED_EVENT, {
        detail: normalizado
      })
    );
  }
}

export function leerFondoEstrellasMovimiento(): number {
  try {
    const n = Number(localStorage.getItem(FONDO_ESTRELLAS_MOVIMIENTO_KEY));
    if (!Number.isFinite(n)) return FONDO_ESTRELLAS_MOVIMIENTO_DEFAULT;
    return Math.max(FONDO_ESTRELLAS_MOVIMIENTO_MIN, Math.min(FONDO_ESTRELLAS_MOVIMIENTO_MAX, Math.round(n)));
  } catch {
    return FONDO_ESTRELLAS_MOVIMIENTO_DEFAULT;
  }
}

export function guardarFondoEstrellasMovimiento(valor: number): void {
  const normalizado = Math.max(
    FONDO_ESTRELLAS_MOVIMIENTO_MIN,
    Math.min(FONDO_ESTRELLAS_MOVIMIENTO_MAX, Math.round(valor))
  );
  localStorage.setItem(FONDO_ESTRELLAS_MOVIMIENTO_KEY, String(normalizado));
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(FONDO_PANTALLA_UPDATED_EVENT, {
        detail: normalizado
      })
    );
  }
}
