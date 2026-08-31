import type { Cliente, DireccionUsuario, Pedido } from "../types";
import type { MaikaUsuarioLS } from "./maikaUsuarios";

/** Normaliza para comparar direcciones (evita duplicar guardada vs sugerida por tildes: Cristòfor / Cristofor). */
function segmentoClaveDireccion(v: unknown): string {
  return String(v ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export function direccionClave(
  d: Pick<DireccionUsuario, "calle" | "numero" | "cp" | "poblacion" | "provincia" | "pais">
    & Partial<Pick<DireccionUsuario, "bloque" | "escalera" | "piso" | "puerta">>
) {
  return [d.calle, d.numero, d.cp, d.poblacion, d.provincia, d.pais, d.bloque, d.escalera, d.piso, d.puerta]
    .map((v) => segmentoClaveDireccion(v))
    .join("|");
}

export function direccionDesdeCliente(c: Cliente): DireccionUsuario | null {
  const calle = String(c.calle || "").trim();
  const numero = String(c.numero || "").trim();
  const cp = String(c.cp || "").trim();
  const poblacion = String(c.poblacion || "").trim();
  const provincia = String(c.provincia || "").trim();
  const pais = String(c.pais || "").trim() || "ESPAÑA";
  if (!calle || !numero || !cp || !poblacion || !provincia) return null;

  return {
    id: `dir_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    alias: "Dirección principal",
    calle,
    numero,
    bloque: String(c.bloque || "").trim(),
    escalera: String(c.escalera || "").trim(),
    piso: String(c.piso || "").trim(),
    puerta: String(c.puerta || "").trim(),
    cp,
    poblacion,
    provincia,
    pais
  };
}

export function direccionLegacyDesdeUsuarioLS(u: MaikaUsuarioLS | null | undefined): DireccionUsuario | null {
  if (!u) return null;
  const calle = String(u.calle || "").trim();
  const numero = String(u.numero || "").trim();
  const cp = String(u.cp || "").trim();
  const poblacion = String(u.poblacion || "").trim();
  const provincia = String(u.provincia || "").trim();
  const pais = String(u.pais || "").trim();
  if (!calle || !numero || !cp || !poblacion || !provincia || !pais) return null;
  return {
    id: `dir_legacy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    alias: "Dirección principal",
    calle,
    numero,
    bloque: String(u.bloque || "").trim(),
    escalera: String(u.escalera || "").trim(),
    piso: String(u.piso || "").trim(),
    puerta: String(u.puerta || "").trim(),
    cp,
    poblacion,
    provincia,
    pais
  };
}

export function normalizarDireccionesUsuario(
  dirsRaw: unknown,
  direccionesMax: number
): DireccionUsuario[] {
  if (!Array.isArray(dirsRaw)) return [];
  const out: DireccionUsuario[] = [];
  const claves = new Set<string>();
  const ids = new Set<string>();

  for (let i = 0; i < dirsRaw.length; i += 1) {
    const d = dirsRaw[i] as Partial<DireccionUsuario>;
    if (!d || typeof d !== "object") continue;
    const calle = String(d.calle || "").trim();
    const numero = String(d.numero || "").trim();
    const cp = String(d.cp || "").trim();
    const poblacion = String(d.poblacion || "").trim();
    const provincia = String(d.provincia || "").trim();
    const pais = String(d.pais || "").trim() || "ESPAÑA";
    const bloque = String(d.bloque || "").trim();
    const escalera = String(d.escalera || "").trim();
    const piso = String(d.piso || "").trim();
    const puerta = String(d.puerta || "").trim();
    if (!calle || !numero || !cp || !poblacion || !provincia || !pais) continue;

    const clave = direccionClave({ calle, numero, cp, poblacion, provincia, pais, bloque, escalera, piso, puerta });
    if (claves.has(clave)) continue;
    claves.add(clave);

    const idRaw = String(d.id || "").trim();
    let id = idRaw || `dir_auto_${i}_${Math.random().toString(36).slice(2, 8)}`;
    if (ids.has(id)) {
      id = `dir_fix_${i}_${Math.random().toString(36).slice(2, 8)}`;
    }
    ids.add(id);
    out.push({
      id,
      alias: String(d.alias || "").trim() || `Dirección ${out.length + 1}`,
      calle,
      numero,
      bloque: String(d.bloque || "").trim(),
      escalera: String(d.escalera || "").trim(),
      piso: String(d.piso || "").trim(),
      puerta: String(d.puerta || "").trim(),
      cp,
      poblacion,
      provincia,
      pais
    });
    if (out.length >= direccionesMax) break;
  }
  return out;
}

export function direccionesDesdeHistorial(
  claveTelefono: string | null,
  pedidosLegacy: Pedido[],
  claveTelefonoES: (telefono: string) => string | null,
  direccionesMax: number
): DireccionUsuario[] {
  if (!claveTelefono) return [];
  const out: DireccionUsuario[] = [];
  const claves = new Set<string>();
  for (const p of pedidosLegacy) {
    const c = p?.cliente;
    if (!c) continue;
    const clavePedido = claveTelefonoES(String(c.telefono || ""));
    if (clavePedido !== claveTelefono) continue;

    const calle = String(c.calle || "").trim();
    const numero = String(c.numero || "").trim();
    const cp = String(c.cp || "").trim();
    const poblacion = String(c.poblacion || c.ciudad || "").trim();
    const provincia = String(c.provincia || "").trim();
    const pais = String(c.pais || "").trim();
    if (!calle || !numero || !cp || !poblacion || !provincia || !pais) continue;

    const claveDir = direccionClave({ calle, numero, cp, poblacion, provincia, pais });
    if (claves.has(claveDir)) continue;
    claves.add(claveDir);

    out.push({
      id: `dir_hist_${out.length}_${Math.random().toString(36).slice(2, 8)}`,
      alias: `Dirección alternativa ${out.length + 1}`,
      calle,
      numero,
      bloque: String(c.bloque || "").trim(),
      escalera: String(c.escalera || "").trim(),
      piso: String(c.piso || "").trim(),
      puerta: String(c.puerta || "").trim(),
      cp,
      poblacion,
      provincia,
      pais
    });
    if (out.length >= direccionesMax) break;
  }
  return out;
}
