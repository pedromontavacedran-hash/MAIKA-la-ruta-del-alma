import type { Pedido, Usuario } from "../types";
import { construirDireccionBasica, construirDireccionCompleta } from "./direccion";
import { parseFechaPedido } from "./fechaPedido";
import { tieneEmailRealMaika } from "./emailTecnicoMaika";

export type MaikaPedidoProductoLS = {
  idProducto: number;
  nombre: string;
  precio: number;
  cantidad: number;
};

export type MaikaPedidoLS = {
  idPedido: string;
  telefono: string;
  fecha: string;
  productos: MaikaPedidoProductoLS[];
  total: number;
  direccionCompleta: string;
  estado?: "pendiente" | "enviado" | "entregado";
  nota?: string;
};

/** Evita «código incorrecto» si el usuario pega espacios, guiones o el email añade caracteres raros. */
export function codigoVerificacionSoloDigitos(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
}

/** Normaliza teléfono a 9 dígitos (España): quita prefijo 34/0034 y no numéricos */
export function normalizarTelefono(t: string): string {
  const soloDigitos = (t || "").replace(/\D/g, "").trim();
  if (soloDigitos.startsWith("0034") && soloDigitos.length > 4) return soloDigitos.slice(4);
  if (soloDigitos.startsWith("34") && soloDigitos.length > 9) return soloDigitos.slice(2);
  return soloDigitos;
}

/** Misma lógica que en App (claveTelefonoES): solo móvil ES 6/7 + 8 dígitos → +34XXXXXXXXX */
export function claveTelefonoMaika(telefono: string): string | null {
  const t9 = normalizarTelefono(telefono || "");
  if (!/^[67]\d{8}$/.test(t9)) return null;
  return `+34${t9}`;
}

export function telefonoRegistradoEnLocal(tel9: string): boolean {
  if (!/^[67]\d{8}$/.test(tel9)) return false;
  const norm = (v: string) => normalizarTelefono(v || "");
  try {
    const rawMaika = localStorage.getItem("maika_usuarios");
    const maika = rawMaika ? (JSON.parse(rawMaika) as Array<{ telefono?: string }>) : [];
    if (Array.isArray(maika) && maika.some((u) => norm(String(u?.telefono || "")) === tel9)) return true;
  } catch {
    /* ignore */
  }
  try {
    const rawLegacy = localStorage.getItem("usuarios");
    const legacy = rawLegacy ? (JSON.parse(rawLegacy) as Array<{ telefono?: string }>) : [];
    if (Array.isArray(legacy) && legacy.some((u) => norm(String(u?.telefono || "")) === tel9)) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function emailRegistradoEnLocal(emailRaw: string): boolean {
  const email = String(emailRaw || "").trim().toLowerCase();
  if (!email) return false;
  try {
    const rawMaika = localStorage.getItem("maika_usuarios");
    const maika = rawMaika ? (JSON.parse(rawMaika) as Array<{ email?: string }>) : [];
    if (Array.isArray(maika) && maika.some((u) => String(u?.email || "").trim().toLowerCase() === email)) return true;
  } catch {
    /* ignore */
  }
  try {
    const rawLegacy = localStorage.getItem("usuarios");
    const legacy = rawLegacy ? (JSON.parse(rawLegacy) as Array<{ email?: string }>) : [];
    if (Array.isArray(legacy) && legacy.some((u) => String(u?.email || "").trim().toLowerCase() === email)) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function emailValidoLogin(s: string): boolean {
  const t = (s || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) && tieneEmailRealMaika(t);
}

export function tieneEmailVerificable(email: string): boolean {
  return emailValidoLogin((email || "").trim().toLowerCase());
}

export function passwordSeguraBasica(password: string): boolean {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(String(password || ""));
}

export function textoCapitalizado(s: string): string {
  const txt = String(s || "").trim().toLowerCase();
  if (!txt) return "";
  return txt.replace(/(^|[\s,.-])([a-záéíóúñü])/g, (_, sep: string, c: string) => `${sep}${c.toUpperCase()}`);
}

export function textoCapitalizadoEnVivo(s: string): string {
  const txt = String(s || "").toLowerCase();
  return txt.replace(/(^|[\s,.-])([a-záéíóúñü])/g, (_, sep: string, c: string) => `${sep}${c.toUpperCase()}`);
}

export function direccionVisualCuenta(direccion: string): string {
  return textoCapitalizado(direccion || "");
}

export function direccionPredeterminadaCuenta(usuario: Usuario | null) {
  if (!usuario) return null;
  const dirs = Array.isArray(usuario.direcciones) ? usuario.direcciones : [];
  const predId = String(usuario.direccionPredeterminadaId || "").trim();
  if (predId) return dirs.find((d) => d.id === predId) || dirs[0] || null;
  return dirs[0] || null;
}

export function direccionCuentaEnDosLineas(usuario: Usuario | null): { linea1: string; linea2: string } {
  const pred = direccionPredeterminadaCuenta(usuario);
  const calle = String(usuario?.calle || pred?.calle || "").trim();
  const numero = String(usuario?.numero || pred?.numero || "").trim();
  const bloque = String(usuario?.bloque || pred?.bloque || "").trim();
  const escalera = String(usuario?.escalera || pred?.escalera || "").trim();
  const piso = String(usuario?.piso || pred?.piso || "").trim();
  const puerta = String(usuario?.puerta || pred?.puerta || "").trim();
  const direccionRaw = String(usuario?.direccion || "").trim();

  const linea1Base =
    construirDireccionCompleta({ calle, numero, bloque, escalera, piso, puerta }) || direccionRaw;
  const linea1 = direccionVisualCuenta(linea1Base);

  const cp = String(usuario?.cp || "").trim();
  const poblacion = String(usuario?.poblacion || "").trim();
  const provincia = String(usuario?.provincia || "").trim();
  const pais = String(usuario?.pais || "").trim();
  const linea2Campos = [cp, poblacion, provincia, pais].filter(Boolean).join(", ");
  const linea2Base = linea2Campos;
  const linea2 = direccionVisualCuenta(linea2Base);

  return { linea1, linea2 };
}

function pedidoLegacyAMaika(p: Pedido): MaikaPedidoLS | null {
  const clave = claveTelefonoMaika(p.cliente?.telefono || "");
  if (!clave) return null;
  const c = p.cliente;
  const direccionCompleta =
    (c?.direccion || "").trim() ||
    construirDireccionCompleta({
      calle: c?.calle,
      numero: c?.numero,
      bloque: c?.bloque,
      escalera: c?.escalera,
      piso: c?.piso,
      puerta: c?.puerta
    }) ||
    construirDireccionBasica(String(c?.calle || "").trim(), String(c?.numero || "").trim()) ||
    "—";
  let fechaIso = p.fecha || "";
  const d = parseFechaPedido(p.fecha);
  if (d) fechaIso = d.toISOString();

  return {
    idPedido: String(p.numero),
    telefono: clave,
    fecha: fechaIso,
    productos: (p.items || []).map((it) => ({
      idProducto: Number(it.id),
      nombre: String(it.nombre || ""),
      precio: Number(it.precio || 0),
      cantidad: Number(it.cantidad || 0)
    })),
    total: Number(p.total || 0),
    direccionCompleta,
    estado: p.estado,
    nota: undefined
  };
}

export function cargarPedidosUsuario(claveUsuario: string | null): MaikaPedidoLS[] {
  if (!claveUsuario) return [];

  let listaMaika: MaikaPedidoLS[] = [];
  try {
    const raw = localStorage.getItem("maika_pedidos");
    const parsed = raw ? JSON.parse(raw) : [];
    listaMaika = Array.isArray(parsed) ? (parsed as MaikaPedidoLS[]) : [];
  } catch {
    listaMaika = [];
  }

  const desdeMaika = listaMaika.filter((p) => claveTelefonoMaika(p.telefono || "") === claveUsuario);

  let desdeLegacy: MaikaPedidoLS[] = [];
  try {
    const rawL = localStorage.getItem("pedidosMaika");
    const legacy = rawL ? JSON.parse(rawL) : [];
    if (Array.isArray(legacy)) {
      desdeLegacy = (legacy as Pedido[])
        .map(pedidoLegacyAMaika)
        .filter((x): x is MaikaPedidoLS => x !== null && x.telefono === claveUsuario);
    }
  } catch {
    desdeLegacy = [];
  }

  const mapa = new Map<string, MaikaPedidoLS>();
  for (const p of desdeLegacy) mapa.set(String(p.idPedido), p);
  for (const p of desdeMaika) mapa.set(String(p.idPedido), p);

  return Array.from(mapa.values()).sort((a, b) => {
    const tb = parseFechaPedido(b.fecha)?.getTime() ?? 0;
    const ta = parseFechaPedido(a.fecha)?.getTime() ?? 0;
    return tb - ta;
  });
}

export function tituloMesPedido(fechaRaw: string): { key: string; titulo: string } {
  const fecha = parseFechaPedido(fechaRaw);
  if (!fecha) return { key: "sin-fecha", titulo: "Sin fecha" };
  const mes = fecha.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  return {
    key: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`,
    titulo: mes.charAt(0).toUpperCase() + mes.slice(1)
  };
}
