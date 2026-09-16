import type { Usuario } from "../types";
import type { UsuarioListItemApi } from "../services/apiAuth";
import { repartirNombreApellidos } from "./appIdentity";
import { construirDireccionBasica, construirDireccionCompleta } from "./direccion";
import { normalizarDireccionesUsuario } from "./direcciones";
import type { MaikaUsuarioLS } from "./maikaUsuarios";
import { normalizarTelefonoES9 } from "./telefono";

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * La tabla de gestión muestra `usuario.direccion` (una línea). Si la dirección principal
 * solo está en `direcciones[]`, el texto queda vacío hasta rellenarlo aquí.
 */
export function completarDireccionTextoUsuario(u: Usuario): Usuario {
  if (String(u.direccion || "").trim() !== "") return u;

  const predId = String(u.direccionPredeterminadaId || "").trim();
  const dirs = Array.isArray(u.direcciones) ? u.direcciones : [];
  let d = predId ? dirs.find((x) => x.id === predId) : undefined;
  if (!d && dirs.length > 0) d = dirs[0];
  if (d) {
    const linea = construirDireccionCompleta({
      calle: d.calle,
      numero: d.numero,
      bloque: d.bloque,
      escalera: d.escalera,
      piso: d.piso,
      puerta: d.puerta
    });
    const resto = [d.cp, d.poblacion, d.provincia]
      .map((s) => String(s || "").trim())
      .filter(Boolean)
      .join(", ");
    const texto = [linea, resto].filter(Boolean).join(" · ");
    if (texto) return { ...u, direccion: texto };
  }

  const basica = construirDireccionBasica(String(u.calle || ""), String(u.numero || ""));
  if (basica) {
    const resto = [u.cp, u.poblacion, u.provincia]
      .map((s) => String(s || "").trim())
      .filter(Boolean)
      .join(", ");
    const texto = [basica, resto].filter(Boolean).join(" · ");
    return { ...u, direccion: texto };
  }
  return u;
}

/** Convierte fila de GET /usuarios al shape de gestión (sin contraseña). */
export function mapearUsuarioApiAGestion(u: UsuarioListItemApi): Usuario {
  const email = String(u.email || "").trim();
  const tel9 = normalizarTelefonoES9(u.telefono || "");
  const dirs = Array.isArray(u.direcciones) ? u.direcciones : [];
  return {
    id: u.id,
    nombre: String(u.nombre || "").trim(),
    email,
    telefono: tel9,
    verificado: typeof u.verificado === "boolean" ? u.verificado : EMAIL_OK.test(email.toLowerCase()),
    direccion: String(u.direccion || "").trim(),
    calle: String(u.calle || "").trim(),
    bloque: String(u.bloque || "").trim(),
    escalera: String(u.escalera || "").trim(),
    piso: String(u.piso || "").trim(),
    puerta: String(u.puerta || "").trim(),
    numero: String(u.numero || "").trim(),
    cp: String(u.cp || "").trim(),
    poblacion: String(u.poblacion || "").trim(),
    provincia: String(u.provincia || "").trim(),
    pais: String(u.pais || "").trim(),
    direcciones: dirs,
    direccionPredeterminadaId: String(u.direccionPredeterminadaId || "").trim(),
    password: "",
    hasPassword: !!u.hasPassword,
    dni: String(u.dni || "").trim(),
    bloqueado: !!u.bloqueado,
    bloqueadoMotivo: String(u.bloqueadoMotivo || "").trim(),
    bloqueadoEn: String(u.bloqueadoEn || "").trim()
  } as Usuario;
}

function usuarioTienePerfilDireccionServidor(u: Usuario): boolean {
  if (String(u.direccion || "").trim()) return true;
  if (Array.isArray(u.direcciones) && u.direcciones.length > 0) return true;
  if (String(u.calle || "").trim() && String(u.cp || "").trim()) return true;
  return false;
}

/**
 * Si el servidor ya tiene dirección (persistida como en local), no la sustituye por maika del navegador.
 * Si la fila API viene vacía (usuarios antiguos), rellena desde maika.
 */
function enriquecerApiConLocalMaika(apiU: Usuario, local: Usuario): Usuario {
  if (usuarioTienePerfilDireccionServidor(apiU)) return apiU;

  const tieneDirLocal =
    (Array.isArray(local.direcciones) && local.direcciones.length > 0) ||
    String(local.calle || "").trim() !== "" ||
    String(local.direccion || "").trim() !== "";

  if (!tieneDirLocal) return apiU;

  return {
    ...apiU,
    direccion: local.direccion || apiU.direccion,
    calle: local.calle || apiU.calle,
    bloque: local.bloque || apiU.bloque,
    escalera: local.escalera || apiU.escalera,
    piso: local.piso || apiU.piso,
    puerta: local.puerta || apiU.puerta,
    numero: local.numero || apiU.numero,
    cp: local.cp || apiU.cp,
    poblacion: local.poblacion || apiU.poblacion,
    provincia: local.provincia || apiU.provincia,
    pais: local.pais || apiU.pais,
    direcciones: local.direcciones?.length ? local.direcciones : apiU.direcciones,
    direccionPredeterminadaId: local.direccionPredeterminadaId || apiU.direccionPredeterminadaId,
    // `??` fallaba: `false` local anulaba `verificado: true` del servidor.
    verificado: Boolean(apiU.verificado || local.verificado)
  };
}

/**
 * Servidor primero (id/email/nombre fiables); cada fila API se enriquece con maika local si coincide móvil o email.
 * Después se añaden filas solo locales que no existen en API por email ni móvil ES.
 */
/**
 * Convierte la lista unificada de gestión (servidor+navegador) al formato `maika_usuarios`.
 * Solo filas con móvil ES válido (6/7 + 8 dígitos). Conserva contraseña local si viene en el mapa.
 */
export function usuariosGestionAMaikaUsuarioLS(
  lista: Usuario[],
  passwordsPorTel9: Map<string, string>,
  normalizarTel: (t: string) => string
): MaikaUsuarioLS[] {
  const out: MaikaUsuarioLS[] = [];
  const vistos = new Set<string>();
  for (const u of lista) {
    const tel9 = normalizarTel(u.telefono || "");
    if (!/^[67]\d{8}$/.test(tel9)) continue;
    if (vistos.has(tel9)) continue;
    vistos.add(tel9);
    const { nombre, apellidos } = repartirNombreApellidos(u.nombre || "", "");
    const dirs = normalizarDireccionesUsuario(u.direcciones as unknown, 10);
    let pred = String(u.direccionPredeterminadaId || "").trim();
    if (pred && !dirs.some((d) => d.id === pred)) pred = dirs[0]?.id || "";
    const row: MaikaUsuarioLS = {
      telefono: `+34${tel9}`,
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      email: (u.email || "").trim().toLowerCase(),
      dni: (u.dni || "").trim(),
      calle: (u.calle || "").trim(),
      numero: (u.numero || "").trim(),
      bloque: (u.bloque || "").trim(),
      escalera: (u.escalera || "").trim(),
      piso: (u.piso || "").trim(),
      puerta: (u.puerta || "").trim(),
      cp: (u.cp || "").trim(),
      poblacion: (u.poblacion || "").trim(),
      provincia: (u.provincia || "").trim(),
      pais: (u.pais || "").trim() || "España",
      direcciones: dirs,
      direccionPredeterminadaId: pred
    };
    const pw = passwordsPorTel9.get(tel9);
    if (pw) row.password = pw;
    row.hasPassword = typeof u.hasPassword === "boolean" ? u.hasPassword : !!pw;
    out.push(row);
  }
  return out;
}

export function fusionarApiYLocales(desdeApi: Usuario[], localesFusionados: Usuario[]): Usuario[] {
  const localesPorTel = new Map<string, Usuario>();
  const localesPorEmail = new Map<string, Usuario>();
  for (const u of localesFusionados) {
    const t = normalizarTelefonoES9(u.telefono || "");
    const e = (u.email || "").trim().toLowerCase();
    if (t) localesPorTel.set(t, u);
    if (e) localesPorEmail.set(e, u);
  }

  const fusionadosApi = desdeApi.map((apiU) => {
    const t = normalizarTelefonoES9(apiU.telefono || "");
    const e = (apiU.email || "").trim().toLowerCase();
    const local = (t && localesPorTel.get(t)) || (e && localesPorEmail.get(e)) || null;
    if (!local) return apiU;
    return enriquecerApiConLocalMaika(apiU, local);
  });

  const emails = new Set<string>();
  const tels = new Set<string>();
  for (const u of fusionadosApi) {
    const e = (u.email || "").trim().toLowerCase();
    if (e) emails.add(e);
    const t = normalizarTelefonoES9(u.telefono || "");
    if (t) tels.add(t);
  }
  const extras = localesFusionados.filter((u) => {
    const e = (u.email || "").trim().toLowerCase();
    const t = normalizarTelefonoES9(u.telefono || "");
    if (e && emails.has(e)) return false;
    if (t && tels.has(t)) return false;
    return true;
  });
  return [...fusionadosApi, ...extras];
}

/** Copia de seguridad antigua (`usuarios` en localStorage) antes de `maika_usuarios`. */
export function leerLegacyUsuariosJSON(): Usuario[] {
  try {
    const raw = localStorage.getItem("usuarios");
    const parsed = raw ? (JSON.parse(raw) as Usuario[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Lista de gestión: usuarios ya proyectados desde `maika_usuarios` + entradas solo presentes en
 * la clave legacy `usuarios` (misma WiFi/navegador). Por teléfono normalizado no se duplica: gana maika.
 */
export function fusionarListaGestionUsuarios(desdeMaika: Usuario[], legacy: Usuario[]): Usuario[] {
  const normTel = (t: string) => normalizarTelefonoES9(t || "");
  const vistos = new Set<string>();
  for (const u of desdeMaika) {
    const t = normTel(u.telefono || "");
    if (t) vistos.add(t);
  }
  const extras: Usuario[] = [];
  for (let i = 0; i < legacy.length; i++) {
    const u = legacy[i];
    const t = normTel(u.telefono || "");
    if (t && vistos.has(t)) continue;
    if (t) vistos.add(t);
    extras.push({
      ...u,
      id:
        u.id !== undefined && u.id !== null && String(u.id).trim() !== ""
          ? u.id
          : `legacy_${i}_${String(u.email || "").slice(0, 12)}`
    } as Usuario);
  }
  return [...desdeMaika, ...extras];
}

/** Prioridad para quedarse con un único registro: id numérico de API > otros. */
function prioridadUsuario(u: Usuario): number {
  if (typeof u.id === "number") return 100;
  if (typeof u.id === "string" && /^\d+$/.test(String(u.id).trim())) return 90;
  return 0;
}

function mismaIdentidadGestion(a: Usuario, b: Usuario): boolean {
  const ta = normalizarTelefonoES9(a.telefono || "");
  const tb = normalizarTelefonoES9(b.telefono || "");
  if (ta && tb && ta === tb && /^[67]\d{8}$/.test(ta)) return true;
  const ea = (a.email || "").trim().toLowerCase();
  const eb = (b.email || "").trim().toLowerCase();
  if (ea && eb && ea === eb && EMAIL_OK.test(ea)) return true;
  return false;
}

/**
 * Une dos filas que representan al mismo cliente (mismo móvil ES o mismo email).
 * Gana el registro con id de servidor; se rellenan huecos de nombre/email/tel y dirección desde maika.
 */
export function fusionarDosUsuariosDuplicados(a: Usuario, b: Usuario): Usuario {
  const base = prioridadUsuario(a) >= prioridadUsuario(b) ? a : b;
  const other = base === a ? b : a;
  const merged = enriquecerApiConLocalMaika(base, other);
  return {
    ...merged,
    nombre: String(base.nombre || "").trim() || String(other.nombre || "").trim(),
    email: (String(base.email || "").trim() || String(other.email || "").trim()).toLowerCase(),
    telefono: normalizarTelefonoES9(base.telefono || other.telefono || "") || base.telefono,
    verificado: Boolean(base.verificado || other.verificado)
  };
}

/**
 * Un solo usuario por móvil ES (9 dígitos 6/7) y un solo registro por email verificable.
 * Agrupa por unión (si A≡B y B≡C entonces A≡C) para casos API+maika con datos incompletos en una fila.
 */
export function deduplicarListaGestionUsuarios(lista: Usuario[]): Usuario[] {
  const n = lista.length;
  if (n <= 1) return lista.map(completarDireccionTextoUsuario);

  const parent = [...Array(n).keys()];
  const find = (x: number): number => {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  };
  const union = (i: number, j: number) => {
    const ri = find(i);
    const rj = find(j);
    if (ri !== rj) parent[rj] = ri;
  };

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (mismaIdentidadGestion(lista[i], lista[j])) union(i, j);
    }
  }

  const grupos = new Map<number, Usuario[]>();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    let g = grupos.get(r);
    if (!g) {
      g = [];
      grupos.set(r, g);
    }
    g.push(lista[i]);
  }

  const salida: Usuario[] = [];
  for (const usuarios of grupos.values()) {
    if (usuarios.length === 1) {
      salida.push(usuarios[0]);
      continue;
    }
    usuarios.sort((x, y) => prioridadUsuario(y) - prioridadUsuario(x));
    let merged = usuarios[0];
    for (let k = 1; k < usuarios.length; k++) {
      merged = fusionarDosUsuariosDuplicados(merged, usuarios[k]);
    }
    salida.push(merged);
  }
  return salida.map(completarDireccionTextoUsuario);
}
