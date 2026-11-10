import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { analyticsFile, dataDir } from "./env.js";
import { fechaHoyEspana } from "./fechaEspana.js";

/**
 * Analítica propia mínima (Fase 0): contadores agregados por día natural Europe/Madrid.
 *
 * Privacidad por diseño:
 * - No hay registros por persona: solo cubos diarios con totales.
 * - No se persiste IP (el rate-limit la usa en memoria y la descarta).
 * - No hay fingerprint ni identificador persistente: la "sesión" la agrupa el
 *   navegador con un id en `sessionStorage`; el servidor solo suma entradas.
 * - Nunca se recibe contenido (textos de sueños, chats de Cábala, formularios):
 *   las rutas de experiencias solo incrementan `funciones.*`.
 */

/** Secciones medibles: lista cerrada, el cliente normaliza cada path a una de estas. */
export const SECCIONES_ANALITICA = new Set([
  "inicio",
  "tienda",
  "carrito",
  "seguimiento",
  "servicios",
  "suenos",
  "horoscopos",
  "lectura",
  "ritual-del-mes",
  "testimonios",
  "sobre-maika",
  "rutas-del-alma",
  "articulos",
  "contacto",
  "enlaces",
  "envios",
  "legal",
  "cuenta",
  "admin",
  "otra"
]);

/** Procedencia clasificada en el cliente desde `document.referrer` (lista cerrada). */
export const PROCEDENCIAS_ANALITICA = new Set([
  "google",
  "instagram",
  "tiktok",
  "whatsapp",
  "facebook",
  "pinterest",
  "directo",
  "otro"
]);

export const DISPOSITIVOS_ANALITICA = new Set(["movil", "escritorio"]);

/** Contadores de uso de funcionalidades (se incrementan en las rutas, nunca desde el cliente con texto). */
export const FUNCIONES_ANALITICA = new Set([
  "interpretaciones",
  "horoscopos",
  "chatCabala",
  "sugerencias"
]);

/**
 * Slugs editoriales de `/articulos/:slug` — lista cerrada, espejo de
 * `src/data/articulos.ts`. Solo estos identificadores se aceptan en el contador
 * por artículo: nada arbitrario enviado desde el navegador.
 * `backend/tests/analytics.test.js` verifica la paridad con `articulos.ts`.
 */
export const ARTICULOS_ANALITICA = new Set([
  "sonar-con-agua",
  "sonar-dientes-caen",
  "que-es-maika-rutas-del-alma",
  "tarot-evolutivo-cartas-mapa"
]);

/** Tope de una sola duración para que un valor corrupto no distorsione la media. */
const DURACION_MAX_MS = 30 * 60 * 1000;
/** Los cubos diarios pesan pocos bytes; se conserva ~1 año y se poda en cada escritura. */
const DIAS_RETENIDOS = 400;

let cache = null;

function cuboVacio() {
  return {
    sesiones: 0,
    primeraVez: 0,
    recurrentes: 0,
    vistas: 0,
    secciones: {},
    entradas: {},
    salidas: {},
    procedencia: {},
    dispositivo: {},
    duracionTotalMs: 0,
    duraciones: 0,
    funciones: {},
    articulos: {}
  };
}

function cargar() {
  if (cache && typeof cache === "object") return cache;
  cache = {};
  try {
    if (existsSync(analyticsFile)) {
      const data = JSON.parse(readFileSync(analyticsFile, "utf8"));
      if (data && typeof data === "object" && !Array.isArray(data)) cache = data;
    }
  } catch {
    cache = {};
  }
  return cache;
}

function cuboHoy() {
  const data = cargar();
  const hoy = fechaHoyEspana();
  const base = cuboVacio();
  const existente = data[hoy];
  data[hoy] = existente && typeof existente === "object" ? { ...base, ...existente } : base;
  return data[hoy];
}

function incrementar(mapa, clave) {
  if (!mapa || typeof mapa !== "object") return;
  mapa[clave] = (mapa[clave] ?? 0) + 1;
}

function persistir() {
  try {
    const data = cargar();
    const fechas = Object.keys(data).sort();
    while (fechas.length > DIAS_RETENIDOS) delete data[fechas.shift()];
    mkdirSync(path.dirname(analyticsFile) || dataDir, { recursive: true });
    writeFileSync(analyticsFile, JSON.stringify(data), "utf8");
  } catch (e) {
    if (process.env.MAIKA_QUIET !== "1") {
       
      console.error("[maika-backend] analytics persist", e);
    }
  }
}

/**
 * Vista de sección. `entrada` solo llega en la primera vista de la sesión de navegador,
 * así `sesiones`/`primeraVez`/`recurrentes` no necesitan deduplicar ids en servidor.
 */
export function registrarVista({ seccion, entrada, procedencia, dispositivo, primeraVez, articulo }) {
  const cubo = cuboHoy();
  cubo.vistas += 1;
  incrementar(cubo.secciones, seccion);
  if (ARTICULOS_ANALITICA.has(articulo)) {
    incrementar(cubo.articulos, articulo);
  }
  if (entrada === true) {
    cubo.sesiones += 1;
    if (primeraVez === true) cubo.primeraVez += 1;
    else cubo.recurrentes += 1;
    incrementar(cubo.entradas, seccion);
    incrementar(cubo.procedencia, procedencia);
    incrementar(cubo.dispositivo, dispositivo);
  }
  persistir();
}

/** Cierre/ocultado de página: última sección vista + duración aproximada (acotada). */
export function registrarSalida({ seccion, duracionMs }) {
  const cubo = cuboHoy();
  incrementar(cubo.salidas, seccion);
  const duracion = Number(duracionMs);
  if (Number.isFinite(duracion) && duracion > 0) {
    cubo.duracionTotalMs += Math.min(duracion, DURACION_MAX_MS);
    cubo.duraciones += 1;
  }
  persistir();
}

/**
 * Uso agregado de una funcionalidad. Lo llaman las rutas de experiencias tras
 * responder bien; recibe solo el nombre cerrado, jamás contenido del usuario.
 * Nunca lanza: la estadística no puede romper la experiencia.
 */
export function registrarFuncionAnalitica(nombre) {
  try {
    if (!FUNCIONES_ANALITICA.has(nombre)) return;
    const cubo = cuboHoy();
    incrementar(cubo.funciones, nombre);
    persistir();
  } catch (e) {
    if (process.env.MAIKA_QUIET !== "1") {
       
      console.error("[maika-backend] analytics funcion", e);
    }
  }
}

/** Vacía toda la estadística (botón «Reiniciar» del panel admin). */
export function resetearAnalitica() {
  cache = {};
  persistir();
}

function sumarMapas(destino, origen) {
  for (const [k, v] of Object.entries(origen ?? {})) {
    if (typeof v === "number" && Number.isFinite(v)) destino[k] = (destino[k] ?? 0) + v;
  }
}

/** Agregado de los últimos `dias` días (incluye hoy) para el panel de administración. */
export function resumenAnalitica(dias = 30) {
  const data = cargar();
  const hoy = fechaHoyEspana();
  const limite = Math.min(90, Math.max(1, Number.isFinite(dias) ? Math.trunc(dias) : 30));

  const fechas = Object.keys(data).filter((f) => f <= hoy).sort().slice(-limite);
  const porDia = [];
  const totales = cuboVacio();

  for (const fecha of fechas) {
    const cubo = { ...cuboVacio(), ...data[fecha] };
    porDia.push({ fecha, ...cubo });
    totales.sesiones += cubo.sesiones;
    totales.primeraVez += cubo.primeraVez;
    totales.recurrentes += cubo.recurrentes;
    totales.vistas += cubo.vistas;
    totales.duracionTotalMs += cubo.duracionTotalMs;
    totales.duraciones += cubo.duraciones;
    sumarMapas(totales.secciones, cubo.secciones);
    sumarMapas(totales.entradas, cubo.entradas);
    sumarMapas(totales.salidas, cubo.salidas);
    sumarMapas(totales.procedencia, cubo.procedencia);
    sumarMapas(totales.dispositivo, cubo.dispositivo);
    sumarMapas(totales.funciones, cubo.funciones);
    sumarMapas(totales.articulos, cubo.articulos);
  }

  return { hoy, dias: limite, porDia, totales };
}
