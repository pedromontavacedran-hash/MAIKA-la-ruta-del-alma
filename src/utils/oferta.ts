export type OfertaConfig = {
  inicio: string;
  fin: string;
};

const OFERTA_KEY = "oferta_maika";
const OFERTA_EVENT = "maika:oferta-updated";

export const getOferta = (): OfertaConfig | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(OFERTA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OfertaConfig>;
    if (typeof parsed?.inicio !== "string" || typeof parsed?.fin !== "string") return null;
    return { inicio: parsed.inicio, fin: parsed.fin };
  } catch {
    return null;
  }
};

export const setOferta = (oferta: OfertaConfig | null) => {
  if (typeof window === "undefined") return;
  if (!oferta) {
    window.localStorage.removeItem(OFERTA_KEY);
  } else {
    window.localStorage.setItem(OFERTA_KEY, JSON.stringify(oferta));
  }
  window.dispatchEvent(new CustomEvent(OFERTA_EVENT));
};

export const subscribeOferta = (onChange: () => void) => {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === OFERTA_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(OFERTA_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(OFERTA_EVENT, onChange);
  };
};

/** Fecha local desde string tipo `YYYY-MM-DDTHH:mm` (misma lógica que admin al guardar). */
export const parseFechaLocalOferta = (valor: string) => {
  const m = valor.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return new Date(valor);
  const [, y, mo, d, h, mi, s] = m;
  return new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(s ?? "0"),
    0
  );
};

const rangoHoyFallback = () => {
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const finHoy = new Date();
  finHoy.setHours(23, 59, 59, 999);
  return { inicio: inicioHoy, fin: finHoy };
};

/**
 * Fechas de la campaña tal cual están guardadas (hora local).
 * Solo para fechas inválidas usa fallback “hoy” (no prolonga una campaña ya terminada hasta medianoche).
 */
export const obtenerRangoOfertaActivo = (ofertaConfig: OfertaConfig | null) => {
  if (!ofertaConfig) return rangoHoyFallback();

  const inicioConfig = parseFechaLocalOferta(ofertaConfig.inicio);
  const finConfig = parseFechaLocalOferta(ofertaConfig.fin);

  if (Number.isNaN(inicioConfig.getTime()) || Number.isNaN(finConfig.getTime())) {
    return rangoHoyFallback();
  }

  return { inicio: inicioConfig, fin: finConfig };
};

/**
 * Oferta solo con campaña guardada y **dentro** de inicio/fin (sin alargar el fin hasta las 23:59 del día).
 */
export const esOfertaEnVigencia = (ofertaConfig: OfertaConfig | null) => {
  if (ofertaConfig == null) return false;
  const inicio = parseFechaLocalOferta(ofertaConfig.inicio);
  const fin = parseFechaLocalOferta(ofertaConfig.fin);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) return false;
  const ahora = new Date();
  return ahora >= inicio && ahora <= fin;
};
