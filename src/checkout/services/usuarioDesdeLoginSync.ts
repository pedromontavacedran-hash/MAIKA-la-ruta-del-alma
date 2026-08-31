import type { Usuario } from "../../types";
import type { SyncCheckoutUsuarioResult } from "../../utils/checkoutSyncUsuarioServidor";
import type { UsuarioPerfilCompletoApi } from "../../services/apiAuth";
import { logCheckoutWarn } from "../../utils/loggerCheckout";
import { normalizarTelefonoES9 } from "../../utils/telefono";

function usuarioDesdePerfilApi(perfil: UsuarioPerfilCompletoApi): Usuario {
  return {
    id: perfil.id,
    nombre: (perfil.nombre || perfil.email?.split("@")[0] || "").trim() || "Cliente",
    email: perfil.email || "",
    telefono: normalizarTelefonoES9(perfil.telefono || ""),
    direccion: perfil.direccion || "",
    calle: perfil.calle || "",
    numero: perfil.numero || "",
    bloque: perfil.bloque || "",
    escalera: perfil.escalera || "",
    piso: perfil.piso || "",
    puerta: perfil.puerta || "",
    cp: perfil.cp || "",
    poblacion: perfil.poblacion || "",
    provincia: perfil.provincia || "",
    pais: perfil.pais || "",
    dni: perfil.dni || "",
    direcciones: Array.isArray(perfil.direcciones) ? perfil.direcciones : [],
    direccionPredeterminadaId: perfil.direccionPredeterminadaId || "",
    password: "",
    verificado: perfil.verificado,
    pedidos: []
  };
}

export function resolverUsuarioYAuthTrasSyncCheckout(
  syncSrv: SyncCheckoutUsuarioResult
): { usuarioActualizado?: Usuario; authHydrated?: true } {
  if (syncSrv.ok === false) {
    logCheckoutWarn("syncUsuarioServidor", syncSrv.error);
    return {};
  }
  if (syncSrv.usuario) {
    return {
      usuarioActualizado: usuarioDesdePerfilApi(syncSrv.usuario),
      ...(syncSrv.kind === "login" ? { authHydrated: true as const } : {})
    };
  }
  return {};
}
