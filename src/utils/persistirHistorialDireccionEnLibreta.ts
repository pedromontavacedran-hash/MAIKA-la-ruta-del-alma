import type { DireccionUsuario, Usuario } from "../types";
import type { MaikaUsuarioLS } from "./maikaUsuarios";
import { DIRECCIONES_MAX } from "../app/routing/routeMaps";
import { construirDireccionBasica, construirDireccionCompleta } from "./direccion";
import { direccionCheckoutEsSoloHistorialPedidos } from "./direccionCheckoutOrigen";
import { direccionClave, normalizarDireccionesUsuario } from "./direcciones";
import { claveTelefonoES, normalizarTelefonoES9 } from "./telefono";

export type PersistirHistorialLibretaResult =
  | { ok: true; usuariosLS: MaikaUsuarioLS[]; usuarioNext: Usuario }
  | { ok: false; error: string };

/**
 * Añade a la libreta del usuario (`maika_usuarios`) una dirección que solo existía en el historial de pedidos.
 * Solo debe llamarse cuando `direccionCheckoutEsSoloHistorialPedidos` es true (p. ej. al elegirla en checkout).
 */
export function persistirDireccionHistorialSeleccionadaEnLibreta(params: {
  usuario: Usuario;
  dir: DireccionUsuario;
  leerMaikaUsuarios: () => MaikaUsuarioLS[];
}): PersistirHistorialLibretaResult {
  const { usuario, dir, leerMaikaUsuarios } = params;
  if (!direccionCheckoutEsSoloHistorialPedidos(usuario, dir)) {
    return { ok: false, error: "Esta dirección ya está en tu cuenta" };
  }

  const dirsPrev = normalizarDireccionesUsuario(usuario.direcciones, DIRECCIONES_MAX);
  const ck = direccionClave(dir);
  if (dirsPrev.some((x) => direccionClave(x) === ck)) {
    return { ok: false, error: "Esta dirección ya está en tu cuenta" };
  }
  if (dirsPrev.length >= DIRECCIONES_MAX) {
    return {
      ok: false,
      error: `Solo puedes guardar hasta ${DIRECCIONES_MAX} direcciones. Libera una en Mi cuenta para añadir esta.`
    };
  }

  const nuevoId = `dir_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const nuevaDir: DireccionUsuario = {
    ...dir,
    id: nuevoId,
    alias: String(dir.alias || "").trim() || "Desde pedido anterior"
  };
  const dirsNext = normalizarDireccionesUsuario([...dirsPrev, nuevaDir], DIRECCIONES_MAX);
  const predId = nuevoId;

  const telRef = normalizarTelefonoES9(String(usuario.telefono || ""));
  const emailRef = String(usuario.email || "").trim().toLowerCase();
  const usuariosLS = leerMaikaUsuarios();
  let idxMaika = usuariosLS.findIndex((u) => normalizarTelefonoES9(String(u.telefono || "")) === telRef);
  if (idxMaika < 0 && emailRef) {
    idxMaika = usuariosLS.findIndex((u) => String(u.email || "").trim().toLowerCase() === emailRef);
  }
  if (idxMaika < 0) {
    const cl = claveTelefonoES(usuario.telefono || "");
    if (cl) {
      idxMaika = usuariosLS.findIndex((u) => String(u.telefono || "").trim() === cl);
    }
  }
  if (idxMaika < 0) {
    return { ok: false, error: "No se encontró tu ficha local para guardar la dirección" };
  }

  const prev = usuariosLS[idxMaika];
  const dirPred = dirsNext.find((x) => x.id === predId) || nuevaDir;
  usuariosLS[idxMaika] = {
    ...prev,
    direcciones: dirsNext,
    direccionPredeterminadaId: predId,
    calle: String(dirPred.calle || "").trim(),
    numero: String(dirPred.numero || "").trim(),
    bloque: String(dirPred.bloque || "").trim(),
    escalera: String(dirPred.escalera || "").trim(),
    piso: String(dirPred.piso || "").trim(),
    puerta: String(dirPred.puerta || "").trim(),
    cp: String(dirPred.cp || "").trim(),
    poblacion: String(dirPred.poblacion || "").trim(),
    provincia: String(dirPred.provincia || "").trim(),
    pais: String(dirPred.pais || "").trim()
  };

  const usuarioNext: Usuario = {
    ...usuario,
    direcciones: dirsNext,
    direccionPredeterminadaId: predId,
    direccion:
      construirDireccionCompleta({
        calle: dirPred.calle,
        numero: dirPred.numero,
        bloque: dirPred.bloque,
        escalera: dirPred.escalera,
        piso: dirPred.piso,
        puerta: dirPred.puerta
      }) || construirDireccionBasica(dirPred.calle || "", dirPred.numero || ""),
    calle: dirPred.calle || "",
    numero: dirPred.numero || "",
    bloque: dirPred.bloque || "",
    escalera: dirPred.escalera || "",
    piso: dirPred.piso || "",
    puerta: dirPred.puerta || "",
    cp: dirPred.cp || "",
    poblacion: dirPred.poblacion || "",
    provincia: dirPred.provincia || "",
    pais: dirPred.pais || ""
  };

  return { ok: true, usuariosLS, usuarioNext };
}
