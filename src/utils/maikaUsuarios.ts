import type { Cliente, DireccionUsuario, Usuario } from "../types";
import { construirDireccionBasica } from "./direccion";

export const MAIKA_USUARIOS_KEY = "maika_usuarios";

export type MaikaUsuarioLS = {
  telefono: string; // guardado como +34XXXXXXXXX
  nombre: string;
  apellidos: string;
  email: string;
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

export function guardarMaikaUsuarios(usuarios: MaikaUsuarioLS[], normalizarTelefonoES9: (telefono: string) => string) {
  localStorage.setItem(MAIKA_USUARIOS_KEY, JSON.stringify(usuarios));
  // Sincroniza "usuarios" (panel gestión) sin perder campos legacy (password, verificado, etc.).
  let legacyUsuarios: Usuario[] = [];
  try {
    legacyUsuarios = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
    if (!Array.isArray(legacyUsuarios)) legacyUsuarios = [];
  } catch {
    legacyUsuarios = [];
  }

  for (const u of usuarios) {
    const tel9 = normalizarTelefonoES9(u.telefono || "");
    if (!/^[67]\d{8}$/.test(tel9)) continue;
    const idx = legacyUsuarios.findIndex(
      (x) => normalizarTelefonoES9((x.telefono || "").trim()) === tel9
    );
    const nombreCompleto = `${(u.nombre || "").trim()} ${(u.apellidos || "").trim()}`.trim() || (u.nombre || "").trim();
    const base = {
      nombre: nombreCompleto,
      email: (u.email || "").trim(),
      dni: (u.dni || "").trim(),
      telefono: tel9,
      calle: (u.calle || "").trim(),
      numero: (u.numero || "").trim(),
      bloque: (u.bloque || "").trim(),
      escalera: (u.escalera || "").trim(),
      piso: (u.piso || "").trim(),
      puerta: (u.puerta || "").trim(),
      cp: (u.cp || "").trim(),
      poblacion: (u.poblacion || "").trim(),
      provincia: (u.provincia || "").trim(),
      pais: (u.pais || "").trim(),
      direccion: construirDireccionBasica(u.calle || "", u.numero || "")
    } as Partial<Usuario>;

    if (idx >= 0) {
      legacyUsuarios[idx] = { ...legacyUsuarios[idx], ...base };
    } else {
      legacyUsuarios.push({
        id: `u_${tel9}`,
        verificado: true,
        ...base
      } as Usuario);
    }
  }
  localStorage.setItem("usuarios", JSON.stringify(legacyUsuarios));
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

export function emailRegistradoUnificadoParaTel9(
  tel9: string,
  findFn: (tel9: string) => MaikaUsuarioLS | null,
  normalizarTelefonoES9: (telefono: string) => string
): string {
  const maikaU = findFn(tel9);
  let legacy: Usuario | undefined;
  try {
    const usuariosLS = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
    const arr = Array.isArray(usuariosLS) ? usuariosLS : [];
    legacy = arr.find((u) => normalizarTelefonoES9(u.telefono || "") === tel9);
  } catch {
    legacy = undefined;
  }
  const eM = (maikaU?.email || "").trim().toLowerCase();
  const eL = (legacy?.email || "").trim().toLowerCase();
  return eM || eL;
}

export function resolverUsuarioLegacyIdxPorTel9(
  tel9: string,
  normalizarTelefonoES9: (telefono: string) => string,
  findMaikaUsuarioPorTel9: (tel9: string) => MaikaUsuarioLS | null,
  guardarMaikaUsuarios: (usuarios: MaikaUsuarioLS[]) => void,
  leerMaikaUsuarios: () => MaikaUsuarioLS[]
): { usuarios: Usuario[]; idx: number } {
  let usuariosLS: Usuario[] = [];
  try {
    usuariosLS = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
    if (!Array.isArray(usuariosLS)) usuariosLS = [];
  } catch {
    usuariosLS = [];
  }
  let idx = usuariosLS.findIndex((u) => normalizarTelefonoES9(u.telefono || "") === tel9);
  if (idx === -1 && findMaikaUsuarioPorTel9(tel9)) {
    guardarMaikaUsuarios(leerMaikaUsuarios());
    try {
      usuariosLS = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
      if (!Array.isArray(usuariosLS)) usuariosLS = [];
    } catch {
      usuariosLS = [];
    }
    idx = usuariosLS.findIndex((u) => normalizarTelefonoES9(u.telefono || "") === tel9);
  }
  return { usuarios: usuariosLS, idx };
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
  const direccion = `${calle}${numero ? `, Nº ${numero}` : ""}`.trim() || calle;
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

export function sincronizarMaikaDesdeLegacy(params: {
  legacyUsuarios: Usuario[];
  leerMaikaUsuarios: () => MaikaUsuarioLS[];
  guardarMaikaUsuarios: (usuarios: MaikaUsuarioLS[]) => void;
  normalizarTelefonoES9: (telefono: string) => string;
  claveTelefonoES: (telefono: string) => string | null;
  repartirNombreApellidos: (nombreRaw: string, apellidosRaw: string) => { nombre: string; apellidos: string };
}) {
  const {
    legacyUsuarios,
    leerMaikaUsuarios,
    guardarMaikaUsuarios,
    normalizarTelefonoES9,
    claveTelefonoES,
    repartirNombreApellidos
  } = params;
  const maikaActual = leerMaikaUsuarios();
  if (!Array.isArray(maikaActual) || maikaActual.length === 0) return;

  const actualizado = [...maikaActual];
  for (const u of legacyUsuarios) {
    const tel9 = normalizarTelefonoES9(u.telefono || "");
    const clave = claveTelefonoES(tel9);
    if (!clave) continue;
    const idx = actualizado.findIndex((m) => normalizarTelefonoES9(m.telefono || "") === tel9);
    if (idx === -1) continue;

    const prev = actualizado[idx];
    const has = (key: keyof Usuario) => Object.prototype.hasOwnProperty.call(u, key);
    const fromLegacy = (key: keyof Usuario, prevValue: string) =>
      has(key) ? String((u as any)[key] || "").trim() : (prevValue || "").trim();
    const nombrePartido = repartirNombreApellidos((u.nombre || "").trim(), "");
    actualizado[idx] = {
      ...prev,
      telefono: clave,
      nombre: (nombrePartido.nombre || prev.nombre || "").trim(),
      apellidos: (nombrePartido.apellidos || prev.apellidos || "").trim(),
      // Si en Gestión se vacía un campo, debe quedar vacío también en maika_usuarios.
      email: fromLegacy("email", prev.email || ""),
      dni: fromLegacy("dni", prev.dni || ""),
      calle: fromLegacy("calle", prev.calle || ""),
      numero: fromLegacy("numero", prev.numero || ""),
      bloque: fromLegacy("bloque", prev.bloque || ""),
      escalera: fromLegacy("escalera", prev.escalera || ""),
      piso: fromLegacy("piso", prev.piso || ""),
      puerta: fromLegacy("puerta", prev.puerta || ""),
      cp: fromLegacy("cp", prev.cp || ""),
      poblacion: fromLegacy("poblacion", prev.poblacion || ""),
      provincia: fromLegacy("provincia", prev.provincia || ""),
      pais: fromLegacy("pais", prev.pais || "España")
    };
  }

  guardarMaikaUsuarios(actualizado);
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
    direccionesDesdeHistorial,
    normalizarTelefonoES9
  } = params;
  if (!/^[67]\d{8}$/.test(tel9)) return false;
  if (emailRegistradoUnificadoParaTel9(tel9)) return false;
  const maikaU = findMaikaUsuarioPorTel9(tel9);
  const clave = claveTelefonoES(tel9);
  const hayDirecciones = !!(maikaU?.direcciones && maikaU.direcciones.length > 0);
  const hayHistorial = direccionesDesdeHistorial(clave).length > 0;
  let hayPedidosLegacy = false;
  try {
    const usuariosLS = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
    const arr = Array.isArray(usuariosLS) ? usuariosLS : [];
    const u = arr.find((x) => normalizarTelefonoES9(x.telefono || "") === tel9);
    hayPedidosLegacy = !!(u?.pedidos && u.pedidos.length > 0);
  } catch {
    hayPedidosLegacy = false;
  }
  return hayDirecciones || hayHistorial || hayPedidosLegacy;
}

