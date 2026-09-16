import type { DireccionUsuario, Pedido } from "../../../types";
import { direccionClave } from "../../../utils/direcciones";
import { notificarError } from "../../../utils/ui/notificaciones";
import type { UsuarioListItemApi } from "../../../services/apiAuth";

export function buscarPedidoCompletoEnMap(map: Map<string, Pedido>, idPed: string): Pedido | undefined {
  const k = idPed.trim();
  if (!k) return undefined;
  const direct = map.get(k) ?? map.get(k.toUpperCase());
  if (direct) return direct;
  const lower = k.toLowerCase();
  for (const [key, val] of map) {
    if (key.toLowerCase() === lower) return val;
  }
  return undefined;
}

export function notificarErrorSyncServidor(
  mostrarNotificacion: (msg: string, tipo?: "normal" | "exito" | "error") => void,
  r: { ok: boolean; error?: string }
) {
  if (r.error) console.warn("[syncMaikaUsuario]", r.error);
  const msg =
    /\(401\)|Token inválido|No token/i.test(r.error || "")
      ? "Guardado local. Sesión caducada o sin permisos: vuelve a iniciar sesión como administrador."
      : "Guardado local; no se pudo sincronizar el servidor.";
  notificarError(mostrarNotificacion, msg);
}

export function formatearFechaEs(fecha: string) {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function estadoTexto(estado?: string) {
  if (estado === "enviado") return "🚚 Enviado";
  if (estado === "entregado") return "✅ Entregado";
  return "🛒 Pendiente";
}

export function normalizarTextoComparacion(s: string) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/gi, " ")
    .trim()
    .toUpperCase();
}

export function extraerTipoVia(calleRaw: string): "CARRER" | "CARRERA" | null {
  const c = String(calleRaw || "").trim().toUpperCase();
  if (!c) return null;
  const limpio = c
    .replace(/^C\.?\s*\/\s*/g, " ")
    .replace(/^C\s*\/\s*/g, " ")
    .replace(/^C\.?\s*/g, " ")
    .replace(/^CALLE\s+/g, "")
    .trim();
  const m = limpio.match(/^(CARRER|CARRERA)(?:\b|[\s\-.,/])/);
  return m ? (m[1] as "CARRER" | "CARRERA") : null;
}

export function titleCaseWords(inputRaw: string): string {
  const input = String(inputRaw || "").trim();
  if (!input) return "";
  return input
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function limpiaDireccionParaPerfil(d: DireccionUsuario): DireccionUsuario | null {
  const o: DireccionUsuario = {
    ...d,
    calle: String(d.calle || "").trim().toUpperCase(),
    numero: String(d.numero || "").trim().toUpperCase(),
    bloque: String(d.bloque || "").trim().toUpperCase(),
    escalera: String(d.escalera || "").trim().toUpperCase(),
    piso: String(d.piso || "").trim().toUpperCase(),
    puerta: String(d.puerta || "").trim().toUpperCase(),
    cp: String(d.cp || "").trim().replace(/\D/g, "").slice(0, 5),
    poblacion: String(d.poblacion || "").trim().toUpperCase(),
    provincia: String(d.provincia || "").trim().toUpperCase(),
    pais: String(d.pais || "").trim().toUpperCase() || "ESPAÑA",
    alias: String(d.alias || "").trim() || "Dirección"
  };
  if (!o.calle || !o.numero || !o.cp || !o.poblacion || !o.provincia || !o.pais) return null;
  return o;
}

export function lineaCpUbicacionMostrar(d: Pick<DireccionUsuario, "cp" | "poblacion" | "provincia" | "pais">): string {
  const cp = String(d.cp || "").trim();
  const pob = titleCaseWords(String(d.poblacion || ""));
  const prov = titleCaseWords(String(d.provincia || ""));
  const pais = titleCaseWords(String(d.pais || ""));
  const cola = [prov, pais].filter(Boolean).join(", ");
  const trasCp = [cp, pob].filter(Boolean).join(" ");
  if (!trasCp && !cola) return "";
  const nucleo = trasCp ? `📍C.P ${trasCp}` : "📍C.P";
  return cola ? `${nucleo}, ${cola}` : nucleo;
}

export function saneadoDireccionesEstructural(
  raw: unknown,
  predIdRaw: string,
  maxDirecciones: number
): { direcciones: DireccionUsuario[]; direccionPredeterminadaId: string } {
  const arr = Array.isArray(raw) ? raw as Partial<DireccionUsuario>[] : [];
  const out: DireccionUsuario[] = [];
  const claves = new Set<string>();
  const ids = new Set<string>();

  for (let i = 0; i < arr.length; i += 1) {
    const d = arr[i];
    if (!d || typeof d !== "object") continue;

    const calle = String(d.calle || "").trim().toUpperCase();
    const cp = String(d.cp || "").trim().replace(/\D/g, "").slice(0, 5);
    const poblacion = String(d.poblacion || "").trim().toUpperCase();
    const provincia = String(d.provincia || "").trim().toUpperCase();
    const pais = String(d.pais || "").trim().toUpperCase() || "ESPAÑA";
    const numero = String(d.numero || "").trim().toUpperCase();

    // Mínimo obligatorio (decisión ejecutiva): calle + población + CP.
    if (!calle || !poblacion || !cp) continue;

    /** Misma clave que checkout: número, piso, puerta, bloque y escalera distinguen viviendas en la misma calle/CP. */
    const clave = direccionClave({
      calle,
      numero,
      cp,
      poblacion,
      provincia,
      pais,
      bloque: String(d.bloque || "").trim().toUpperCase(),
      escalera: String(d.escalera || "").trim().toUpperCase(),
      piso: String(d.piso || "").trim().toUpperCase(),
      puerta: String(d.puerta || "").trim().toUpperCase()
    });
    if (claves.has(clave)) continue;
    claves.add(clave);

    let id = String(d.id || "").trim();
    if (!id || ids.has(id)) id = `dir_fix_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}`;
    ids.add(id);

    out.push({
      id,
      alias: String(d.alias || "").trim() || `Dirección ${out.length + 1}`,
      calle,
      numero,
      bloque: String(d.bloque || "").trim().toUpperCase(),
      escalera: String(d.escalera || "").trim().toUpperCase(),
      piso: String(d.piso || "").trim().toUpperCase(),
      puerta: String(d.puerta || "").trim().toUpperCase(),
      cp,
      poblacion,
      provincia,
      pais
    });

    if (out.length >= maxDirecciones) break;
  }

  let pred = String(predIdRaw || "").trim();
  if (!out.some((d) => d.id === pred)) pred = out[0]?.id || "";

  return { direcciones: out, direccionPredeterminadaId: pred };
}

/** Remoto (servidor) primero; se añaden filas solo locales que no choquen por clave. */
export function mergeDireccionesPorClavePreferirRemoto(
  remotos: DireccionUsuario[],
  locales: DireccionUsuario[],
  max: number
): DireccionUsuario[] {
  const map = new Map<string, DireccionUsuario>();
  for (const d of remotos) {
    map.set(direccionClave(d), d);
  }
  for (const d of locales) {
    const k = direccionClave(d);
    if (!map.has(k)) map.set(k, d);
  }
  return Array.from(map.values()).slice(0, max);
}

export function direccionesMaikaFusionadasServidor(
  maikaRow: { direcciones?: unknown; direccionPredeterminadaId?: string } | null,
  usuarioApiRow: UsuarioListItemApi | null | undefined,
  maxDirecciones: number
): DireccionUsuario[] {
  const fromMaika = saneadoDireccionesEstructural(
    maikaRow?.direcciones,
    String(maikaRow?.direccionPredeterminadaId || ""),
    maxDirecciones
  ).direcciones;
  if (usuarioApiRow === undefined || usuarioApiRow === null) return fromMaika;
  const apiSane = saneadoDireccionesEstructural(
    usuarioApiRow.direcciones,
    String(usuarioApiRow.direccionPredeterminadaId || ""),
    maxDirecciones
  );
  return mergeDireccionesPorClavePreferirRemoto(apiSane.direcciones, fromMaika, maxDirecciones);
}

type FilaMaikaDireccion = {
  calle?: string;
  numero?: string;
  bloque?: string;
  escalera?: string;
  piso?: string;
  puerta?: string;
  cp?: string;
  poblacion?: string;
  provincia?: string;
  pais?: string;
};

/**
 * Fila `maika_usuarios` con `direcciones` + `direccionPredeterminadaId` y los campos sueltos
 * copiados desde la dirección principal. Con `limpiarSiSinDireccion` los campos quedan en ""
 * si no hay direcciones (borrado); si no, conserva los valores previos.
 */
export function filaMaikaConDireccionPrincipal<T extends FilaMaikaDireccion>(
  prev: T,
  dirsNext: DireccionUsuario[],
  predId: string,
  opts?: { limpiarSiSinDireccion?: boolean }
): T & { direcciones: DireccionUsuario[]; direccionPredeterminadaId: string } {
  const dirPred = dirsNext.find((d) => d.id === predId) || dirsNext[0] || null;
  const limpiar = opts?.limpiarSiSinDireccion === true;
  const fb = (v: string | undefined, prevV: string | undefined) =>
    v || (limpiar ? "" : prevV || "");
  return {
    ...prev,
    direcciones: dirsNext,
    direccionPredeterminadaId: dirPred?.id || "",
    calle: fb(dirPred?.calle, prev.calle),
    numero: fb(dirPred?.numero, prev.numero),
    bloque: fb(dirPred?.bloque, prev.bloque),
    escalera: fb(dirPred?.escalera, prev.escalera),
    piso: fb(dirPred?.piso, prev.piso),
    puerta: fb(dirPred?.puerta, prev.puerta),
    cp: fb(dirPred?.cp, prev.cp),
    poblacion: fb(dirPred?.poblacion, prev.poblacion),
    provincia: fb(dirPred?.provincia, prev.provincia),
    pais: fb(dirPred?.pais, prev.pais)
  };
}
