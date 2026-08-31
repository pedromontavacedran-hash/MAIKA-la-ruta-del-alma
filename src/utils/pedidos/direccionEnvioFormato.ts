import { construirDireccionCompleta } from "../direccion";

/**
 * Snapshot al confirmar pedido: la única “verdad” estructurada.
 * `direccionTexto` y textos en `maika_pedidos` / cliente se derivan de aquí.
 */
export type DireccionEnvioSnapshot = {
  calle: string;
  numero: string;
  piso: string;
  puerta: string;
  cp: string;
  poblacion: string;
  provincia: string;
  pais: string;
  bloque?: string;
  escalera?: string;
};

/** Una sola regla para WhatsApp, cliente.direccion del pedido, direccionTexto y maika_pedidos.direccionCompleta. */
export function direccionLineaCompletaDesdeEnvio(d: DireccionEnvioSnapshot): string {
  const vía = construirDireccionCompleta({
    calle: d.calle,
    numero: d.numero,
    bloque: d.bloque,
    escalera: d.escalera,
    piso: d.piso,
    puerta: d.puerta
  });
  const cp = String(d.cp || "").trim();
  const pob = String(d.poblacion || "").trim();
  const prov = String(d.provincia || "").trim();
  const pais = String(d.pais || "").trim() || "España";
  return `${vía}, ${cp} ${pob}, ${prov}, ${pais}`.trim();
}
