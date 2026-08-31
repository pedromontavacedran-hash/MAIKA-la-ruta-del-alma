import type { Cliente, DireccionUsuario, Usuario } from "../types";
import { repartirNombreApellidos } from "./appIdentity";
import {
  direccionClave,
  direccionDesdeCliente,
  normalizarDireccionesUsuario as normalizarDireccionesUsuarioFn
} from "./direcciones";
import { direccionesDesdePedidosMaikaLegacy } from "./direccionesHistorialPedidosMaika";
import { claveTelefonoES } from "./telefono";
import { DIRECCIONES_MAX } from "../app/routing/routeMaps";

function clientePlanoDesdeUsuario(usuario: Usuario): Cliente {
  const repartido = repartirNombreApellidos(usuario.nombre || "", "");
  return {
    nombre: (repartido.nombre || "").toUpperCase(),
    apellidos: (repartido.apellidos || "").toUpperCase(),
    nombreApellidos:
      `${(repartido.nombre || "").trim()} ${(repartido.apellidos || "").trim()}`.trim() || usuario.nombre || "",
    email: usuario.email || "",
    dni: usuario.dni || "",
    telefono: usuario.telefono || "",
    direccion: usuario.direccion || "",
    calle: usuario.calle || "",
    numero: usuario.numero || "",
    bloque: usuario.bloque || "",
    escalera: usuario.escalera || "",
    piso: usuario.piso || "",
    puerta: usuario.puerta || "",
    cp: usuario.cp || "",
    poblacion: usuario.poblacion || "",
    ciudad: usuario.ciudad || "",
    provincia: usuario.provincia || "",
    pais: (usuario.pais || "").trim() || "ESPAÑA",
    notas: ""
  };
}

/** Claves de dirección que cuentan como «perfil / cuenta» (libreta + campos planos coherentes). */
export function clavesPerfilCheckoutDesdeUsuario(usuario: Usuario | null): Set<string> {
  const out = new Set<string>();
  if (!usuario) return out;
  const dirsUsuario = normalizarDireccionesUsuarioFn(usuario.direcciones, DIRECCIONES_MAX);
  for (const d of dirsUsuario) out.add(direccionClave(d));
  const dirPlana = direccionDesdeCliente(clientePlanoDesdeUsuario(usuario));
  if (dirPlana) out.add(direccionClave(dirPlana));
  return out;
}

/** Dirección inferida solo de pedidos antiguos (no está en la libreta ni como campos de perfil). */
export function direccionCheckoutEsSoloHistorialPedidos(usuario: Usuario | null, d: DireccionUsuario): boolean {
  if (!usuario) return false;
  const claveTel = claveTelefonoES(usuario.telefono || "");
  if (!claveTel) return false;
  const ck = direccionClave(d);
  const perfil = clavesPerfilCheckoutDesdeUsuario(usuario);
  if (perfil.has(ck)) return false;
  const historial = direccionesDesdePedidosMaikaLegacy(claveTel, claveTelefonoES, DIRECCIONES_MAX);
  return historial.some((h) => direccionClave(h) === ck);
}

/** Coincide con la dirección construida desde los campos del perfil pero no hay entrada equivalente en `usuario.direcciones`. */
export function direccionCheckoutEsSoloCamposPerfilSinLibreta(usuario: Usuario | null, d: DireccionUsuario): boolean {
  if (!usuario) return false;
  const dirsUsuario = normalizarDireccionesUsuarioFn(usuario.direcciones, DIRECCIONES_MAX);
  const ck = direccionClave(d);
  if (dirsUsuario.some((u) => direccionClave(u) === ck)) return false;
  const dirPlana = direccionDesdeCliente(clientePlanoDesdeUsuario(usuario));
  if (!dirPlana) return false;
  return direccionClave(dirPlana) === ck;
}

export function partirDireccionesCheckoutPorOrigen(
  usuario: Usuario | null,
  lista: DireccionUsuario[]
): { guardadasYPerfil: DireccionUsuario[]; soloHistorial: DireccionUsuario[] } {
  if (!usuario) {
    return { guardadasYPerfil: lista, soloHistorial: [] };
  }
  const guardadasYPerfil: DireccionUsuario[] = [];
  const soloHistorial: DireccionUsuario[] = [];
  for (const dir of lista) {
    if (direccionCheckoutEsSoloHistorialPedidos(usuario, dir)) soloHistorial.push(dir);
    else guardadasYPerfil.push(dir);
  }
  return { guardadasYPerfil, soloHistorial };
}
