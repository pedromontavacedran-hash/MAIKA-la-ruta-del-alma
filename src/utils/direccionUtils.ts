import type { DatosCodigoPostal } from "./codigoPostal";

/**
 * Aplica el resultado del autocompletado por CP solo si el estado sigue
 * mostrando el mismo código (evita condiciones de carrera al borrar dígitos).
 */
export function aplicarDatosCpDetectados<
  T extends { cp?: string; poblacion?: string; provincia?: string; pais?: string }
>(prev: T, cpSolicitado: string, datos: DatosCodigoPostal | null): T {
  if (!datos || String(prev.cp ?? "").trim() !== cpSolicitado) return prev;
  return {
    ...prev,
    poblacion: datos.poblacion || prev.poblacion,
    provincia: datos.provincia || prev.provincia,
    pais: datos.pais || prev.pais
  };
}

/** Normaliza para comparar país (España por defecto en CP nacionales). */
function esPaisEspanaDefault(pais: string): boolean {
  const p = String(pais || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return p === "" || p === "espana" || p === "spain" || p === "es";
}

/** Capitalización natural (evita todo en mayúsculas desde APIs). */
function capitalizarLugar(s: string): string {
  const t = String(s || "").trim();
  if (!t) return "";
  return t
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

/**
 * Una sola línea para UI: 📍 municipio, provincia [, país si no es el caso por defecto].
 * Checkout y sitios donde se acorta omitiendo "España" en CP nacionales.
 */
export function textoLineaUbicacionCp(poblacion: string, provincia: string, pais: string): string {
  const pub = capitalizarLugar(poblacion);
  const prov = capitalizarLugar(provincia);
  const paisTrim = String(pais || "").trim();
  const incluirPais = !!paisTrim;

  const parts: string[] = [];
  if (pub) parts.push(pub);
  if (prov) parts.push(prov);
  if (incluirPais) parts.push(esPaisEspanaDefault(paisTrim) ? "España" : capitalizarLugar(paisTrim));

  if (parts.length === 0) return "";
  return `📍 ${parts.join(", ")}`;
}

/** 📍 municipio, provincia, país (incluye España cuando viene del autocompletado). */
export function textoLineaUbicacionCpCompleta(poblacion: string, provincia: string, pais: string): string {
  const pub = capitalizarLugar(poblacion);
  const prov = capitalizarLugar(provincia);
  const paisTrim = String(pais || "").trim();
  const paisCap = paisTrim ? capitalizarLugar(paisTrim) : "";

  const parts: string[] = [];
  if (pub) parts.push(pub);
  if (prov) parts.push(prov);
  if (paisCap) parts.push(paisCap);

  if (parts.length === 0) return "";
  return `📍 ${parts.join(", ")}`;
}

/** CP de 5 dígitos y al menos municipio o provincia rellenados (datos coherentes con CP válido). */
export function hayDatosUbicacionPorCp(cp: string, poblacion: string, provincia: string): boolean {
  if (!/^\d{5}$/.test(String(cp || "").trim())) return false;
  return !!(String(poblacion || "").trim() || String(provincia || "").trim());
}
