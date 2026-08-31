export type SignoId =
  | "aries"
  | "tauro"
  | "geminis"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "escorpio"
  | "sagitario"
  | "capricornio"
  | "acuario"
  | "piscis";

/** Orden fijo para validar rutas /lectura y la rueda. */
export const SIGNOS_ZODIACO_IDS: readonly SignoId[] = [
  "aries",
  "tauro",
  "geminis",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "escorpio",
  "sagitario",
  "capricornio",
  "acuario",
  "piscis"
] as const;

export function esSignoId(v: string): v is SignoId {
  return (SIGNOS_ZODIACO_IDS as readonly string[]).includes(v);
}

type LecturaContenido = {
  signo: string;
  semana: string;
  carta: string;
  pincelada: string;
  fraseFinal: string;
};

export type HoroscopoLecturaDiaria = {
  fecha: string;
  signo: SignoId;
  contenido: LecturaContenido | null;
};

const STORAGE_LECTURA_DIARIA_KEY = "horoscopo-lectura-diaria-v1";

function fechaLocalHoy(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function leerLecturaDiaria(): HoroscopoLecturaDiaria | null {
  const raw = localStorage.getItem(STORAGE_LECTURA_DIARIA_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as HoroscopoLecturaDiaria;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.fecha !== fechaLocalHoy()) {
      localStorage.removeItem(STORAGE_LECTURA_DIARIA_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_LECTURA_DIARIA_KEY);
    return null;
  }
}

export function guardarLecturaDiaria(signo: SignoId, contenido: LecturaContenido | null): void {
  const payload: HoroscopoLecturaDiaria = {
    fecha: fechaLocalHoy(),
    signo,
    contenido,
  };
  localStorage.setItem(STORAGE_LECTURA_DIARIA_KEY, JSON.stringify(payload));
}

export function limpiarLecturaDiaria(): void {
  localStorage.removeItem(STORAGE_LECTURA_DIARIA_KEY);
}
