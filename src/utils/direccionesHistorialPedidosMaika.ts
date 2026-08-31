import type { DireccionUsuario, Pedido } from "../types";
import { direccionesDesdeHistorial as direccionesDesdeHistorialUtil } from "./direcciones";

/** Direcciones inferidas del historial `pedidosMaika` en localStorage (legacy). */
export function direccionesDesdePedidosMaikaLegacy(
  claveTelefono: string | null,
  claveTelefonoES: (telefono: string) => string | null,
  maxDirecciones: number
): DireccionUsuario[] {
  if (!claveTelefono) return [];
  let pedidosLegacy: Pedido[] = [];
  try {
    const raw = localStorage.getItem("pedidosMaika");
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    pedidosLegacy = Array.isArray(parsed) ? (parsed as Pedido[]) : [];
  } catch {
    pedidosLegacy = [];
  }
  return direccionesDesdeHistorialUtil(claveTelefono, pedidosLegacy, claveTelefonoES, maxDirecciones);
}
