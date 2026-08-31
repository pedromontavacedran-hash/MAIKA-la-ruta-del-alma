import type { DireccionUsuario } from "../types";

/** Piso y puerta en un solo segmento: `3-1`; si falta uno, solo el que exista. */
function joinPisoPuerta(piso: string, puerta: string): string {
  const p = String(piso || "").trim();
  const u = String(puerta || "").trim();
  if (p && u) return `${p}-${u}`;
  if (p) return p;
  if (u) return u;
  return "";
}

/** Calle + coma + número (sin «Nº»). */
export function construirDireccionBasica(calle: string, numero?: string): string {
  const c = String(calle || "").trim();
  const n = String(numero || "").trim();
  if (!c) return n;
  if (!n) return c;
  return `${c}, ${n}`;
}

/**
 * Solo para la zona «selecciona dirección» (lista): línea 1 = misma regla que {@link construirDireccionCompleta}.
 * Línea 2: CP, población, provincia, país.
 */
export function lineasTextoSeleccionDireccion(
  d: Pick<
    DireccionUsuario,
    "calle" | "numero" | "cp" | "poblacion" | "provincia" | "pais" | "piso" | "puerta" | "bloque" | "escalera"
  >
): { linea1: string; linea2: string } {
  const linea1 = construirDireccionCompleta({
    calle: d.calle,
    numero: d.numero,
    bloque: d.bloque,
    escalera: d.escalera,
    piso: d.piso,
    puerta: d.puerta
  });
  const linea2 = [d.cp, d.poblacion, d.provincia, d.pais]
    .map((s) => String(s ?? "").trim())
    .filter(Boolean)
    .join(" ");
  return { linea1, linea2 };
}

type CamposResumenEnvio = Pick<
  DireccionUsuario,
  "calle" | "numero" | "cp" | "poblacion" | "provincia" | "pais" | "bloque" | "escalera" | "piso" | "puerta"
>;

/**
 * «Enviaremos a»: línea 1 = vía (calle, número, bloque/escalera, piso-puerta); línea 2 = CP, población · provincia, país.
 */
export function lineasResumenEnviaremosA(d: CamposResumenEnvio): { lineaCalle: string; lineaCpLoc: string } {
  const lineaCalle = construirDireccionCompleta({
    calle: d.calle,
    numero: d.numero,
    bloque: d.bloque,
    escalera: d.escalera,
    piso: d.piso,
    puerta: d.puerta
  }).trim();

  const cpPob = [d.cp, d.poblacion].map((s) => String(s ?? "").trim()).filter(Boolean).join(" ");
  const provPais = [d.provincia, d.pais].map((s) => String(s ?? "").trim()).filter(Boolean).join(", ");
  const lineaCpLoc =
    cpPob && provPais ? `${cpPob} · ${provPais}` : cpPob || provPais || "";

  return { lineaCalle, lineaCpLoc };
}

/**
 * Compat: todo en una cadena (p. ej. tests o listados).
 */
export function textoResumidoDireccionLista(d: CamposResumenEnvio): string {
  const { lineaCalle, lineaCpLoc } = lineasResumenEnviaremosA(d);
  return [lineaCalle, lineaCpLoc].filter((s) => String(s).trim().length > 0).join(" · ");
}

/**
 * Una sola línea de vía: `CALLE, número` + opcional ` Bloque X` ` Esc. Y` + opcional ` · piso-puerta`
 * (punto medio antes de piso/puerta para separar bien del número en pantalla).
 * Ej.: `PABLO PICASSO, 12 · 3-1`; con bloque/escalera: `…, 12 Bloque A Esc. B · 3-1`.
 */
export function construirDireccionCompleta(params: {
  calle?: string;
  numero?: string;
  bloque?: string;
  escalera?: string;
  piso?: string;
  puerta?: string;
}): string {
  const calle = String(params.calle || "").trim();
  const numero = String(params.numero || "").trim();
  const bloque = String(params.bloque || "").trim();
  const escalera = String(params.escalera || "").trim();
  const piso = String(params.piso || "").trim();
  const puerta = String(params.puerta || "").trim();

  let head = "";
  if (calle && numero) head = `${calle}, ${numero}`;
  else if (calle) head = calle;
  else head = numero;

  const parteBloque = bloque ? ` Bloque ${bloque}` : "";
  const parteEsc = escalera ? ` Esc. ${escalera}` : "";
  const pp = joinPisoPuerta(piso, puerta);
  const partePiso = pp ? ` · ${pp}` : "";

  return `${head}${parteBloque}${parteEsc}${partePiso}`.trim();
}
