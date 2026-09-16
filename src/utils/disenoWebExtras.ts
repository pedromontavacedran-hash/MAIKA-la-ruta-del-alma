/**
 * Extras de configuración del sitio que también se publican al servidor junto al diseño visual,
 * para que todos los visitantes vean lo mismo (campaña/pack, desplegable de inicio, servicios,
 * cupones, ajustes de /lectura, posición del botón «Explorar tienda», umbral y nota de pedido).
 */
import {
  CUPONES_DISPONIBLES,
  CUPONES_MAIKA_KEY,
  DESPLEGABLE_INICIO_DEFAULT,
  DESPLEGABLE_INICIO_KEY,
  NOTA_PEDIDO_ENVIO_KEY,
  SERVICIOS_INICIO_DEFAULT,
  SERVICIOS_INICIO_KEY,
  UMBRAL_STOCK_BAJO_KEY,
  type BloqueDesplegableInicio,
  type ServicioInicio
} from "../config";
import type { CampanaPackConfig } from "../types";
import { getCampanaPack, setCampanaPack } from "./campanaPack";
import { getCuponesDisponibles, type CuponAdmin } from "./cupones";
import {
  guardarLecturaPantallaBaselineRestauracion,
  guardarLecturaPantallaConfig,
  leerLecturaPantallaConfig,
  leerLecturaPantallaSnapshotRestauracion,
  normalizarLecturaPantallaSnapshot,
  type LecturaPantallaSnapshot
} from "./lecturaPantallaConfig";
import {
  guardarHeroExplorarTiendaPos,
  leerHeroExplorarTiendaPos,
  type HeroExplorarTiendaConfig
} from "./heroExplorarTiendaConfig";

export type DisenoWebExtras = {
  campanaPack: CampanaPackConfig;
  desplegableInicio: BloqueDesplegableInicio[];
  serviciosInicio: ServicioInicio[];
  umbralStockBajo: number | null;
  notaPedidoEnvio: string | null;
  cupones: Record<string, CuponAdmin>;
  lecturaPantalla: LecturaPantallaSnapshot;
  lecturaPantallaBaseline: LecturaPantallaSnapshot;
  heroExplorarTienda: HeroExplorarTiendaConfig;
};

function leerJsonLS(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function escribirJsonLS(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

/** Misma normalización que el bootstrap de la app (array de bloques u objeto suelto legacy). */
export function normalizarBloquesDesplegable(raw: unknown): BloqueDesplegableInicio[] | null {
  const def = DESPLEGABLE_INICIO_DEFAULT[0];
  const norm = (b: unknown): BloqueDesplegableInicio => {
    const o = (b ?? {}) as { titulo?: string; subtitulo?: string; inicio?: number; numProductos?: number };
    return {
      titulo: typeof o.titulo === "string" ? o.titulo : def?.titulo ?? "",
      subtitulo: typeof o.subtitulo === "string" ? o.subtitulo : def?.subtitulo ?? "",
      inicio: Number.isFinite(o.inicio) && (o.inicio as number) >= 0 ? (o.inicio as number) : 0,
      numProductos:
        Number.isFinite(o.numProductos) && (o.numProductos as number) >= 1
          ? Math.min(20, o.numProductos as number)
          : 3
    };
  };
  if (Array.isArray(raw) && raw.length > 0) return raw.map(norm);
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "titulo" in raw) return [norm(raw)];
  return null;
}

export function normalizarServiciosInicio(raw: unknown): ServicioInicio[] | null {
  if (!Array.isArray(raw) || raw.length < 3) return null;
  const def = SERVICIOS_INICIO_DEFAULT;
  return raw.slice(0, 3).map((s, i) => {
    const o = (s ?? {}) as Partial<ServicioInicio>;
    return {
      titulo: typeof o.titulo === "string" ? o.titulo : def[i]?.titulo ?? "",
      fraseBreve: typeof o.fraseBreve === "string" ? o.fraseBreve : def[i]?.fraseBreve ?? "",
      imagen: typeof o.imagen === "string" ? o.imagen : def[i]?.imagen ?? "",
      duracion: typeof o.duracion === "string" ? o.duracion : def[i]?.duracion ?? "",
      precio: typeof o.precio === "string" ? o.precio : def[i]?.precio ?? "",
      textoBoton: typeof o.textoBoton === "string" ? o.textoBoton : def[i]?.textoBoton ?? "",
      urlWhatsApp: typeof o.urlWhatsApp === "string" ? o.urlWhatsApp : def[i]?.urlWhatsApp ?? ""
    };
  });
}

/** Config efectiva actual (lo guardado o los defaults): es lo que se publica al servidor. */
export function leerDisenoWebExtras(): DisenoWebExtras {
  const umbralRaw = localStorage.getItem(UMBRAL_STOCK_BAJO_KEY);
  const umbralNum = umbralRaw != null ? parseInt(umbralRaw, 10) : NaN;
  return {
    campanaPack: getCampanaPack(),
    desplegableInicio:
      normalizarBloquesDesplegable(leerJsonLS(DESPLEGABLE_INICIO_KEY)) ?? [...DESPLEGABLE_INICIO_DEFAULT],
    serviciosInicio:
      normalizarServiciosInicio(leerJsonLS(SERVICIOS_INICIO_KEY)) ?? [...SERVICIOS_INICIO_DEFAULT],
    umbralStockBajo:
      Number.isFinite(umbralNum) && umbralNum >= 0 && umbralNum <= 99 ? umbralNum : null,
    notaPedidoEnvio: (() => {
      const raw = localStorage.getItem(NOTA_PEDIDO_ENVIO_KEY);
      return raw != null && raw !== "" ? raw : null;
    })(),
    cupones: getCuponesDisponibles(CUPONES_MAIKA_KEY, CUPONES_DISPONIBLES),
    lecturaPantalla: leerLecturaPantallaConfig(),
    lecturaPantallaBaseline: leerLecturaPantallaSnapshotRestauracion(),
    heroExplorarTienda: leerHeroExplorarTiendaPos()
  };
}

/** Escribe los extras recibidos del servidor en localStorage (los eventos propios refrescan a sus oyentes). */
export function aplicarDisenoWebExtras(extras: Partial<DisenoWebExtras> | null | undefined): void {
  if (!extras || typeof extras !== "object") return;
  if (extras.campanaPack && typeof extras.campanaPack === "object") {
    setCampanaPack(extras.campanaPack);
  }
  const bloques = normalizarBloquesDesplegable(extras.desplegableInicio);
  if (bloques) escribirJsonLS(DESPLEGABLE_INICIO_KEY, bloques);
  const servicios = normalizarServiciosInicio(extras.serviciosInicio);
  if (servicios) escribirJsonLS(SERVICIOS_INICIO_KEY, servicios);
  if (typeof extras.umbralStockBajo === "number" && Number.isFinite(extras.umbralStockBajo)) {
    try {
      localStorage.setItem(
        UMBRAL_STOCK_BAJO_KEY,
        String(Math.max(0, Math.min(99, Math.round(extras.umbralStockBajo))))
      );
    } catch {
      /* ignore */
    }
  }
  if (typeof extras.notaPedidoEnvio === "string" && extras.notaPedidoEnvio !== "") {
    try {
      localStorage.setItem(NOTA_PEDIDO_ENVIO_KEY, extras.notaPedidoEnvio);
    } catch {
      /* ignore */
    }
  }
  if (extras.cupones && typeof extras.cupones === "object" && !Array.isArray(extras.cupones)) {
    escribirJsonLS(CUPONES_MAIKA_KEY, extras.cupones);
  }
  if (extras.lecturaPantalla && typeof extras.lecturaPantalla === "object") {
    guardarLecturaPantallaConfig(normalizarLecturaPantallaSnapshot(extras.lecturaPantalla));
  }
  if (extras.lecturaPantallaBaseline && typeof extras.lecturaPantallaBaseline === "object") {
    guardarLecturaPantallaBaselineRestauracion(
      normalizarLecturaPantallaSnapshot(extras.lecturaPantallaBaseline)
    );
  }
  if (extras.heroExplorarTienda && typeof extras.heroExplorarTienda === "object") {
    guardarHeroExplorarTiendaPos(extras.heroExplorarTienda);
  }
}
