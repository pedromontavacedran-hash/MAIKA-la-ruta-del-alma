export function construirDireccionBasica(calle: string, numero?: string): string {
  const c = String(calle || "").trim();
  const n = String(numero || "").trim();
  return `${c}${n ? `, Nº ${n}` : ""}`.trim();
}

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
  return `${calle}${numero ? `, Nº ${numero}` : ""}${bloque ? `, Bloque ${bloque}` : ""}${escalera ? `, Esc. ${escalera}` : ""}${piso ? `, Piso ${piso}` : ""}${puerta ? `, Puerta ${puerta}` : ""}`.trim();
}
