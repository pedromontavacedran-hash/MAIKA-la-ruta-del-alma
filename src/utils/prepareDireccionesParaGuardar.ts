import { DIRECCIONES_MAX } from "../app/routing/routeMaps";
import type { DireccionUsuario } from "../types";
import { normalizarDireccionesUsuario } from "./direcciones";

type PrepareDireccionesParaGuardarResult = {
  direcciones: DireccionUsuario[];
  direccionPredeterminadaId?: string;
};

export function prepareDireccionesParaGuardar(
  direccionesEntrantes: DireccionUsuario[] = [],
  direccionesActuales: DireccionUsuario[] = [],
  direccionPredeterminadaId?: string | null
): PrepareDireccionesParaGuardarResult {
  const direcciones = normalizarDireccionesUsuario(
    [...(direccionesEntrantes || []), ...(direccionesActuales || [])],
    DIRECCIONES_MAX
  );
  let direccionPredeterminadaFinal = String(direccionPredeterminadaId || "").trim() || undefined;
  if (!direccionPredeterminadaFinal || !direcciones.some((d) => d.id === direccionPredeterminadaFinal)) {
    direccionPredeterminadaFinal = direcciones[0]?.id;
  }
  return { direcciones, direccionPredeterminadaId: direccionPredeterminadaFinal };
}
