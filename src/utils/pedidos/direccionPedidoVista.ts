import type { Cliente, Pedido } from "../../types";
import { construirDireccionCompleta } from "../direccion";
import { direccionLineaCompletaDesdeEnvio, type DireccionEnvioSnapshot } from "./direccionEnvioFormato";

/**
 * Vista canónica de dirección de entrega (admin, seguimiento, detalle cliente, listas de pedidos, factura modal).
 * Aplica a **cualquier** cliente y pedido — actuales y futuros —: no hay lógica por ID de usuario ni listas blancas;
 * solo el contenido de `Pedido` y, si faltan datos, el `cliente` embebido o el perfil en pantallas que lo permiten.
 * Los pedidos **nuevos** desde checkout ya persisten `direccionEnvio` + `direccionTexto` completos (`App.tsx` → `direccionLineaCompletaDesdeEnvio`).
 */

/** Rellena CP / población / provincia / país del cliente cuando el snapshot de envío va incompleto (pedidos antiguos). */
function mergeEnvioConCliente(
  d: NonNullable<Pedido["direccionEnvio"]>,
  c: Cliente | undefined
): DireccionEnvioSnapshot {
  const cl = c || ({} as Cliente);
  return {
    calle: String(d.calle || cl.calle || "").trim(),
    numero: String(d.numero || cl.numero || "").trim(),
    piso: String(d.piso ?? cl.piso ?? "").trim(),
    puerta: String(d.puerta ?? cl.puerta ?? "").trim(),
    cp: String(d.cp || cl.cp || "").trim(),
    poblacion: String(d.poblacion || cl.poblacion || cl.ciudad || "").trim(),
    provincia: String(d.provincia || cl.provincia || "").trim(),
    pais: String(d.pais || cl.pais || "").trim() || "España",
    bloque: d.bloque ?? cl.bloque,
    escalera: d.escalera ?? cl.escalera
  };
}

/** Campos planos (perfil, usuario, cliente en pedido) → una línea con CP, población, provincia y país. */
export type DatosEnvioPlano = {
  calle?: string;
  numero?: string;
  bloque?: string;
  escalera?: string;
  piso?: string;
  puerta?: string;
  cp?: string;
  poblacion?: string;
  ciudad?: string;
  provincia?: string;
  pais?: string;
  /** Texto libre si no hay vía estructurada */
  direccion?: string;
};

/**
 * Misma idea que {@link direccionLineaCompletaDesdeEnvio}: vía + CP y población + provincia + país.
 */
export function lineaCompletaDesdeDatosEnvio(d: DatosEnvioPlano | null | undefined): string {
  if (!d) return "";
  const via = construirDireccionCompleta({
    calle: d.calle,
    numero: d.numero,
    bloque: d.bloque,
    escalera: d.escalera,
    piso: d.piso,
    puerta: d.puerta
  });
  const cp = String(d.cp || "").trim();
  const pob = String(d.poblacion || d.ciudad || "").trim();
  const prov = String(d.provincia || "").trim();
  const pais = String(d.pais || "").trim() || "España";
  const legacyDir = String(d.direccion || "").trim();

  const primera = via || legacyDir;
  if (!primera && !cp && !pob) return "";

  if (!primera) {
    const partes = [[cp, pob].filter(Boolean).join(" ").trim(), prov, pais].filter((s) => String(s).trim().length > 0);
    return partes.join(", ");
  }

  const partes: string[] = [primera];
  if (cp || pob) partes.push(`${cp} ${pob}`.trim());
  if (prov) partes.push(prov);
  if (pais) partes.push(pais);
  return partes.join(", ");
}

export function lineaCompletaDesdeClientePedido(c: Cliente | null | undefined): string {
  if (!c) return "";
  return lineaCompletaDesdeDatosEnvio({
    calle: c.calle,
    numero: c.numero,
    bloque: c.bloque,
    escalera: c.escalera,
    piso: c.piso,
    puerta: c.puerta,
    cp: c.cp,
    poblacion: c.poblacion,
    ciudad: c.ciudad,
    provincia: c.provincia,
    pais: c.pais,
    direccion: c.direccion
  });
}

/** Dirección al confirmar: prioriza `direccionEnvio` (misma regla que checkout / WhatsApp). */
export function textoDireccionConfirmadaPedido(p: Pedido): string {
  const desdeCliente = lineaCompletaDesdeClientePedido(p.cliente);
  const d = p.direccionEnvio;
  if (d && (d.calle || d.numero || d.cp || d.poblacion || d.provincia || d.pais)) {
    return direccionLineaCompletaDesdeEnvio(mergeEnvioConCliente(d, p.cliente));
  }
  const t = p.direccionTexto?.trim();
  if (t) {
    if (/\b\d{5}\b/.test(t)) return t;
    if (desdeCliente && /\b\d{5}\b/.test(desdeCliente)) return desdeCliente;
    return t;
  }
  return desdeCliente;
}

/** Admin / seguimiento / listas: misma cadena completa (incl. CP, población, provincia, país vía cliente si hace falta). */
export function textoDireccionVistaAdmin(p: Pedido): string {
  return textoDireccionConfirmadaPedido(p);
}
