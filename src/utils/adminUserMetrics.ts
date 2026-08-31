import type { Usuario } from "../types";
import { leerMaikaUsuarios } from "./maikaUsuarios";
import { normalizarTelefonoES9 } from "./telefono";

export type MetricasUsuariosAdmin = {
  total: number;
  verificados: number;
  pendientes: number;
  conPedidos: number;
  nuevos7dias: number;
};

export function calcularMetricasUsuariosAdmin(listaUsuarios: Usuario[]): MetricasUsuariosAdmin {
  let usuariosGuardados: Usuario[] = [];
  if (listaUsuarios.length > 0) {
    usuariosGuardados = listaUsuarios;
  } else {
    const maika = leerMaikaUsuarios();
    usuariosGuardados = maika.map((u) => {
      const tel9 = normalizarTelefonoES9(u.telefono || "");
      return {
        id: `u_${tel9 || Date.now()}`,
        nombre: `${String(u.nombre || "").trim()} ${String(u.apellidos || "").trim()}`.trim(),
        email: String(u.email || "").trim(),
        telefono: tel9,
        verificado: !!String(u.email || "").trim()
      } as Usuario;
    });
  }

  const ahora = Date.now();
  const sieteDiasMs = 7 * 24 * 60 * 60 * 1000;

  const total = usuariosGuardados.length;
  const verificados = usuariosGuardados.filter((u) => !!u.verificado).length;
  const pendientes = total - verificados;
  const conPedidos = usuariosGuardados.filter((u) => (u.pedidos?.length || 0) > 0).length;
  const nuevos7dias = usuariosGuardados.filter((u) => {
    const idNumero = Number(u.id);
    return Number.isFinite(idNumero) && idNumero > 1_000_000_000_000 && ahora - idNumero <= sieteDiasMs;
  }).length;

  return {
    total,
    verificados,
    pendientes,
    conPedidos,
    nuevos7dias
  };
}
