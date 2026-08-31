import type { Cliente, DireccionUsuario, Usuario } from "../types";
import { normalizarDireccionesUsuario } from "./direcciones";
import { construirDireccionBasica, construirDireccionCompleta } from "./direccion";
import { prepareDireccionesParaGuardar } from "./prepareDireccionesParaGuardar";

export const MAIKA_USUARIOS_KEY = "maika_usuarios";
export const MAIKA_SCHEMA_VERSION_KEY = "maika_usuarios_schema_version";
export const MAIKA_SCHEMA_VERSION = 1;
const MAIKA_SYNC_DEBOUNCE_MS = 900;

let syncTimeoutId: ReturnType<typeof setTimeout> | null = null;
let syncEnCurso = false;
let snapshotPendiente: MaikaUsuarioLS[] | null = null;

export type MaikaUsuarioLS = {
  telefono: string; // guardado como +34XXXXXXXXX
  nombre: string;
  apellidos: string;
  email: string;
  password?: string;
  hasPassword?: boolean;
  passwordTemporal?: boolean;
  dni: string;
  calle: string;
  numero: string;
  bloque: string;
  escalera: string;
  piso: string;
  puerta: string;
  cp: string;
  poblacion: string;
  provincia: string;
  pais: string;
  direcciones?: DireccionUsuario[];
  direccionPredeterminadaId?: string;
};

export function leerMaikaUsuarios(): MaikaUsuarioLS[] {
  try {
    const raw = localStorage.getItem(MAIKA_USUARIOS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as MaikaUsuarioLS[]) : [];
  } catch {
    return [];
  }
}

export type GuardarMaikaUsuariosOptions = {
  /**
   * Por defecto true. Pon false justo después de un GET /usuarios para no reenviar todo al API otra vez.
   */
  sincronizarServidor?: boolean;
  /** No añadir a `maika_outbox` (p. ej. datos recién traídos del servidor o re-saneo local). */
  omitirOutbox?: boolean;
};

export function guardarMaikaUsuarios(
  usuarios: MaikaUsuarioLS[],
  normalizarTelefonoES9: (telefono: string) => string,
  options?: GuardarMaikaUsuariosOptions
) {
  const saneados = (Array.isArray(usuarios) ? usuarios : [])
    .map(saneaUsuarioMaika)
    .filter((u) => /^[67]\d{8}$/.test(normalizarTelefonoES9(String(u.telefono || ""))));
  localStorage.setItem(MAIKA_USUARIOS_KEY, JSON.stringify(saneados));
  const syncServer = options?.sincronizarServidor !== false;
  const omitirOutbox = options?.omitirOutbox === true;

  if (!omitirOutbox && typeof window !== "undefined") {
    void import("./maikaOutbox").then((m) => {
      for (const u of saneados) {
        m.encolarUsuarioUpsert(u);
      }
      if (syncServer) m.programarSincronizarOutbox(normalizarTelefonoES9);
    });
  } else if (syncServer && typeof window !== "undefined") {
    programarSyncUsuariosBackend(saneados, normalizarTelefonoES9);
  }
}

function usuarioApiAMaika(u: Record<string, unknown>, normalizarTelefonoES9: (telefono: string) => string): MaikaUsuarioLS | null {
  const tel9 = normalizarTelefonoES9(String(u.telefono || ""));
  if (!/^[67]\d{8}$/.test(tel9)) return null;
  const dirs = normalizarDireccionesUsuario(u.direcciones as unknown, 10);
  const pred = String(u.direccionPredeterminadaId || "").trim();
  const d = (pred && dirs.find((x) => x.id === pred)) || dirs[0] || null;
  const nombreCompleto = String(u.nombre || "").trim();
  const partes = nombreCompleto.split(/\s+/).filter(Boolean);
  const nombre = partes.shift() || nombreCompleto || "";
  const apellidos = partes.join(" ");
  return saneaUsuarioMaika({
    telefono: `+34${tel9}`,
    nombre,
    apellidos,
    email: String(u.email || "").trim().toLowerCase(),
    hasPassword: typeof u.hasPassword === "boolean" ? u.hasPassword : undefined,
    dni: String(u.dni || "").trim(),
    calle: String(d?.calle || u.calle || "").trim(),
    numero: String(d?.numero || u.numero || "").trim(),
    bloque: String(d?.bloque || u.bloque || "").trim(),
    escalera: String(d?.escalera || u.escalera || "").trim(),
    piso: String(d?.piso || u.piso || "").trim(),
    puerta: String(d?.puerta || u.puerta || "").trim(),
    cp: String(d?.cp || u.cp || "").trim(),
    poblacion: String(d?.poblacion || u.poblacion || "").trim(),
    provincia: String(d?.provincia || u.provincia || "").trim(),
    pais: String(d?.pais || u.pais || "España").trim(),
    direcciones: dirs,
    direccionPredeterminadaId: pred
  });
}

function programarSyncUsuariosBackend(usuarios: MaikaUsuarioLS[], normalizarTelefonoES9: (telefono: string) => string) {
  if (typeof window === "undefined") return;
  snapshotPendiente = usuarios;
  if (syncTimeoutId) window.clearTimeout(syncTimeoutId);
  syncTimeoutId = window.setTimeout(() => {
    void sincronizarUsuariosBackend(snapshotPendiente || [], normalizarTelefonoES9);
  }, MAIKA_SYNC_DEBOUNCE_MS);
}

export type MaikaUsuarioSyncBackendResult =
  | { ok: true }
  | { ok: false; connectionIssue: boolean };

/**
 * Sincroniza un usuario con la API (PUT si existe, POST si no).
 * `connectionIssue` indica que no hubo respuesta útil del servidor (red, timeout, backend apagado).
 */
export async function sincronizarUnUsuarioMaikaConBackend(
  u: MaikaUsuarioLS,
  normalizarTelefonoES9: (telefono: string) => string
): Promise<MaikaUsuarioSyncBackendResult> {
  const { esErrorDeConexion } = await import("./esErrorDeConexion");
  try {
    const api = await import("../services/apiAuth");
    const payload = await import("./perfilPayloadDesdeMaika");
    const tel9 = normalizarTelefonoES9(String(u.telefono || ""));
    const email = String(u.email || "").trim().toLowerCase();
    const tokenOk = Boolean(api.getJwtTokenParaOperacionesUsuarios());
    if (!tokenOk) {
      if (!tel9 || !/^[67]\d{8}$/.test(tel9)) return { ok: true };
      try {
        await api.registerApi({
          email: email || `maika.sync.${tel9}@usuarios.maika.shop`,
          password: `Sync!${tel9}Maika`,
          telefono: tel9,
          nombre: `${String(u.nombre || "").trim()} ${String(u.apellidos || "").trim()}`.trim() || "Cliente",
          dni: String(u.dni || "").trim(),
          calle: String(u.calle || "").trim(),
          numero: String(u.numero || "").trim(),
          bloque: String(u.bloque || "").trim(),
          escalera: String(u.escalera || "").trim(),
          piso: String(u.piso || "").trim(),
          puerta: String(u.puerta || "").trim(),
          cp: String(u.cp || "").trim(),
          poblacion: String(u.poblacion || "").trim(),
          provincia: String(u.provincia || "").trim(),
          pais: String(u.pais || "España").trim(),
          direcciones: Array.isArray(u.direcciones) ? u.direcciones : [],
          direccionPredeterminadaId: String(u.direccionPredeterminadaId || "").trim()
        });
        return { ok: true };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/usuario ya existe|tel[eé]fono ya existe/i.test(msg)) return { ok: true };
        return { ok: false, connectionIssue: esErrorDeConexion(e) };
      }
    }
    const apiRows = await api.listarUsuariosApi();
    const indexPorTel = new Map<string, { id: string | number; direcciones?: DireccionUsuario[]; direccionPredeterminadaId?: string }>();
    const indexPorEmail = new Map<string, { id: string | number; direcciones?: DireccionUsuario[]; direccionPredeterminadaId?: string }>();
    for (const row of apiRows) {
      const tel9 = normalizarTelefonoES9(String(row.telefono || ""));
      const indexed = {
        id: row.id,
        direcciones: Array.isArray(row.direcciones) ? row.direcciones : [],
        direccionPredeterminadaId: String(row.direccionPredeterminadaId || "").trim()
      };
      if (tel9) indexPorTel.set(tel9, indexed);
      const email = String(row.email || "").trim().toLowerCase();
      if (email) indexPorEmail.set(email, indexed);
    }

    const match = (tel9 && indexPorTel.get(tel9)) || (email && indexPorEmail.get(email)) || null;
    const body = payload.perfilUsuarioPayloadDesdeMaika(u);
    if (match?.id != null) {
      try {
        if (Array.isArray(body.direcciones)) {
          const preparado = prepareDireccionesParaGuardar(
            body.direcciones as DireccionUsuario[],
            Array.isArray(match.direcciones) ? match.direcciones : [],
            String(body.direccionPredeterminadaId || match.direccionPredeterminadaId || "")
          );
          body.direcciones = preparado.direcciones;
          body.direccionPredeterminadaId = preparado.direccionPredeterminadaId;
        }
        await api.actualizarUsuarioPorIdApi(match.id, body);
        return { ok: true };
      } catch (e) {
        return { ok: false, connectionIssue: esErrorDeConexion(e) };
      }
    }
    if (!tel9 || !/^[67]\d{8}$/.test(tel9)) return { ok: false, connectionIssue: false };
    try {
      await api.registerApi({
        email: email || `maika.sync.${tel9}@usuarios.maika.shop`,
        password: `Sync!${tel9}Maika`,
        telefono: tel9,
        nombre: `${String(u.nombre || "").trim()} ${String(u.apellidos || "").trim()}`.trim() || "Cliente",
        dni: String(u.dni || "").trim(),
        calle: String(u.calle || "").trim(),
        numero: String(u.numero || "").trim(),
        bloque: String(u.bloque || "").trim(),
        escalera: String(u.escalera || "").trim(),
        piso: String(u.piso || "").trim(),
        puerta: String(u.puerta || "").trim(),
        cp: String(u.cp || "").trim(),
        poblacion: String(u.poblacion || "").trim(),
        provincia: String(u.provincia || "").trim(),
        pais: String(u.pais || "España").trim(),
        direcciones: Array.isArray(u.direcciones) ? u.direcciones : [],
        direccionPredeterminadaId: String(u.direccionPredeterminadaId || "").trim()
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, connectionIssue: esErrorDeConexion(e) };
    }
  } catch (e) {
    return { ok: false, connectionIssue: esErrorDeConexion(e) };
  }
}

async function sincronizarUsuariosBackend(usuarios: MaikaUsuarioLS[], normalizarTelefonoES9: (telefono: string) => string): Promise<void> {
  if (syncEnCurso) return;
  if (!Array.isArray(usuarios) || usuarios.length === 0) return;
  syncEnCurso = true;
  try {
    for (const u of usuarios) {
      await sincronizarUnUsuarioMaikaConBackend(u, normalizarTelefonoES9);
    }
  } finally {
    syncEnCurso = false;
  }
}

const RESTAURAR_USUARIOS_INTENTOS_MAX = 4;
const RESTAURAR_USUARIOS_PAUSA_BASE_MS = 350;

/**
 * Si `maika_usuarios` está vacío (p. ej. tras borrar datos del navegador), descarga la lista desde la API
 * y la vuelve a guardar en localStorage. Reintenta varias veces ante fallos de red o token aún no listo.
 */
export async function restaurarMaikaUsuariosDesdeBackendSiVacio(
  normalizarTelefonoES9: (telefono: string) => string
): Promise<MaikaUsuarioLS[]> {
  const actuales = leerMaikaUsuarios();
  if (actuales.length > 0) return actuales;

  const { isAdminAuthorized } = await import("./adminAuth");
  if (!isAdminAuthorized()) return [];

  for (let intento = 0; intento < RESTAURAR_USUARIOS_INTENTOS_MAX; intento++) {
    if (intento > 0) {
      await new Promise((r) => setTimeout(r, RESTAURAR_USUARIOS_PAUSA_BASE_MS * intento));
    }
    try {
      const api = await import("../services/apiAuth");
      const tokenOk =
        Boolean(api.getJwtTokenParaOperacionesUsuarios()) ||
        ((await import("./adminAuth")).isAdminAuthorized() && (await api.ensureAdminUsuariosApiJwt()));
      if (!tokenOk) continue;

      const apiRows = await api.listarUsuariosApi();
      const restaurados = (Array.isArray(apiRows) ? apiRows : [])
        .map((u) => usuarioApiAMaika(u as unknown as Record<string, unknown>, normalizarTelefonoES9))
        .filter((u): u is MaikaUsuarioLS => !!u);

      if (restaurados.length > 0) {
        guardarMaikaUsuarios(restaurados, normalizarTelefonoES9, {
          omitirOutbox: true,
          sincronizarServidor: false
        });
        return restaurados;
      }
      /* El servidor respondió bien pero no hay filas: no reintentar */
      return [];
    } catch {
      /* siguiente intento */
    }
  }
  return [];
}

function claveTelefonoDesdeTel9(tel9: string) {
  return /^\d{9}$/.test(tel9) ? `+34${tel9}` : "";
}

function saneaUsuarioMaika(u: MaikaUsuarioLS): MaikaUsuarioLS {
  const dirs = normalizarDireccionesUsuario(u?.direcciones as unknown, 10);
  let pred = String(u?.direccionPredeterminadaId || "").trim();
  if (!dirs.some((d) => d.id === pred)) pred = dirs[0]?.id || "";
  const principal = dirs.find((d) => d.id === pred) || dirs[0] || null;
  return {
    ...u,
    passwordTemporal: !!u?.passwordTemporal,
    direcciones: dirs,
    direccionPredeterminadaId: pred,
    calle: principal?.calle || String(u?.calle || "").trim(),
    numero: principal?.numero || String(u?.numero || "").trim(),
    bloque: principal?.bloque || String(u?.bloque || "").trim(),
    escalera: principal?.escalera || String(u?.escalera || "").trim(),
    piso: principal?.piso || String(u?.piso || "").trim(),
    puerta: principal?.puerta || String(u?.puerta || "").trim(),
    cp: principal?.cp || String(u?.cp || "").trim(),
    poblacion: principal?.poblacion || String(u?.poblacion || "").trim(),
    provincia: principal?.provincia || String(u?.provincia || "").trim(),
    pais: principal?.pais || String(u?.pais || "").trim()
  };
}

export function migrarLegacyAMaikaSiHaceFalta(normalizarTelefonoES9: (telefono: string) => string) {
  const maika = leerMaikaUsuarios();
  if (maika.length > 0) {
    const saneados = maika.map(saneaUsuarioMaika);
    guardarMaikaUsuarios(saneados, normalizarTelefonoES9, { omitirOutbox: true, sincronizarServidor: false });
    localStorage.setItem(MAIKA_SCHEMA_VERSION_KEY, String(MAIKA_SCHEMA_VERSION));
    return saneados;
  }

  let legacy: Usuario[] = [];
  try {
    const raw = localStorage.getItem("usuarios");
    const parsed = raw ? (JSON.parse(raw) as Usuario[]) : [];
    legacy = Array.isArray(parsed) ? parsed : [];
  } catch {
    legacy = [];
  }

  if (legacy.length === 0) {
    localStorage.setItem(MAIKA_SCHEMA_VERSION_KEY, String(MAIKA_SCHEMA_VERSION));
    return [];
  }

  const map = new Map<string, MaikaUsuarioLS>();
  for (const u of legacy) {
    const tel9 = normalizarTelefonoES9(String(u?.telefono || ""));
    if (!/^[67]\d{8}$/.test(tel9)) continue;
    const clave = claveTelefonoDesdeTel9(tel9);
    const nombreRaw = String(u?.nombre || "").trim();
    const [nombrePrimero, ...resto] = nombreRaw.split(/\s+/).filter(Boolean);
    const nombre = (nombrePrimero || nombreRaw || "").trim();
    const apellidos = resto.join(" ").trim();
    const dirs = normalizarDireccionesUsuario(u.direcciones, 10);
    const pred = String(u.direccionPredeterminadaId || "").trim();
    const dirPred = (pred && dirs.find((d) => d.id === pred)) || dirs[0] || null;

    map.set(tel9, {
      telefono: clave,
      nombre,
      apellidos,
      email: String(u?.email || "").trim(),
      password: String(u?.password || "").trim(),
      passwordTemporal: !!u?.passwordTemporal,
      dni: String(u.dni || "").trim(),
      calle: String(dirPred?.calle || u?.calle || "").trim(),
      numero: String(dirPred?.numero || u?.numero || "").trim(),
      bloque: String(dirPred?.bloque || u?.bloque || "").trim(),
      escalera: String(dirPred?.escalera || u?.escalera || "").trim(),
      piso: String(dirPred?.piso || u?.piso || "").trim(),
      puerta: String(dirPred?.puerta || u?.puerta || "").trim(),
      cp: String(dirPred?.cp || u?.cp || "").trim(),
      poblacion: String(dirPred?.poblacion || u?.poblacion || "").trim(),
      provincia: String(dirPred?.provincia || u?.provincia || "").trim(),
      pais: String(dirPred?.pais || u?.pais || "España").trim(),
      direcciones: dirs,
      direccionPredeterminadaId: pred
    });
  }

  const migrados = Array.from(map.values()).map(saneaUsuarioMaika);
  guardarMaikaUsuarios(migrados, normalizarTelefonoES9);
  localStorage.setItem(MAIKA_SCHEMA_VERSION_KEY, String(MAIKA_SCHEMA_VERSION));
  return migrados;
}

export function findMaikaUsuarioPorTel9(
  tel9: string,
  leerFn: () => MaikaUsuarioLS[],
  claveTelefonoES: (telefono: string) => string | null,
  normalizarTelefonoES9: (telefono: string) => string
): MaikaUsuarioLS | null {
  if (!/^[67]\d{8}$/.test(tel9)) return null;
  const lista = leerFn();
  const clave = claveTelefonoES(tel9);
  if (clave) {
    const porClave = lista.find((u) => (u.telefono || "").trim() === clave);
    if (porClave) return porClave;
  }
  return lista.find((u) => normalizarTelefonoES9(u.telefono || "") === tel9) || null;
}

export function emailRegistradoUnificadoParaTel9(tel9: string, findFn: (tel9: string) => MaikaUsuarioLS | null): string {
  const maikaU = findFn(tel9);
  const eM = (maikaU?.email || "").trim().toLowerCase();
  return eM;
}

export function maikaUsuarioToCliente(
  u: MaikaUsuarioLS,
  repartirNombreApellidos: (nombreRaw: string, apellidosRaw: string) => { nombre: string; apellidos: string }
): Cliente {
  const nom = repartirNombreApellidos(u.nombre || "", u.apellidos || "");
  const dirs = Array.isArray(u.direcciones) ? u.direcciones : [];
  const dirPred = dirs.find((d) => d.id === u.direccionPredeterminadaId) || dirs[0];
  const nombre = (nom.nombre || "").trim();
  const apellidos = (nom.apellidos || "").trim();
  const nombreApellidos = `${nombre} ${apellidos}`.trim() || nombre;
  const calle = (dirPred?.calle || u.calle || "").trim();
  const numero = (dirPred?.numero || u.numero || "").trim();
  const direccion =
    construirDireccionCompleta({
      calle,
      numero,
      bloque: (dirPred?.bloque || u.bloque || "").trim(),
      escalera: (dirPred?.escalera || u.escalera || "").trim(),
      piso: (dirPred?.piso || u.piso || "").trim(),
      puerta: (dirPred?.puerta || u.puerta || "").trim()
    }) ||
    construirDireccionBasica(calle, numero) ||
    calle;
  return {
    nombre: nombre.toUpperCase(),
    apellidos,
    nombreApellidos,
    email: (u.email || "").trim(),
    dni: (u.dni || "").trim(),
    telefono: (u.telefono || "").trim(),
    direccion,
    calle,
    numero,
    bloque: (dirPred?.bloque || u.bloque || "").trim(),
    escalera: (dirPred?.escalera || u.escalera || "").trim(),
    piso: (dirPred?.piso || u.piso || "").trim(),
    puerta: (dirPred?.puerta || u.puerta || "").trim(),
    cp: (dirPred?.cp || u.cp || "").trim(),
    poblacion: (dirPred?.poblacion || u.poblacion || "").trim(),
    ciudad: (dirPred?.poblacion || u.poblacion || "").trim(),
    provincia: (dirPred?.provincia || u.provincia || "").trim(),
    pais: (dirPred?.pais || u.pais || "España").trim(),
    notas: ""
  };
}

export function telefonoTieneActividadSinEmail(params: {
  tel9: string;
  emailRegistradoUnificadoParaTel9: (tel9: string) => string;
  findMaikaUsuarioPorTel9: (tel9: string) => MaikaUsuarioLS | null;
  claveTelefonoES: (telefono: string) => string | null;
  direccionesDesdeHistorial: (claveTelefono: string | null) => DireccionUsuario[];
  normalizarTelefonoES9: (telefono: string) => string;
}): boolean {
  const {
    tel9,
    emailRegistradoUnificadoParaTel9,
    findMaikaUsuarioPorTel9,
    claveTelefonoES,
    direccionesDesdeHistorial
  } = params;
  if (!/^[67]\d{8}$/.test(tel9)) return false;
  if (emailRegistradoUnificadoParaTel9(tel9)) return false;
  const maikaU = findMaikaUsuarioPorTel9(tel9);
  const clave = claveTelefonoES(tel9);
  const hayDirecciones = !!(maikaU?.direcciones && maikaU.direcciones.length > 0);
  const hayHistorial = direccionesDesdeHistorial(clave).length > 0;
  return hayDirecciones || hayHistorial;
}

