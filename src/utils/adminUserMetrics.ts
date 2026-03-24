import type { Usuario } from "../types";

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
    try {
      const parsed = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
      usuariosGuardados = Array.isArray(parsed) ? parsed : [];
    } catch {
      usuariosGuardados = [];
    }
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
