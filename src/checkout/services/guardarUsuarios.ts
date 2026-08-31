import type { Cliente } from "../../types";
import { logCheckoutWarn } from "../../utils/loggerCheckout";
import { repartirNombreApellidos } from "../../utils/appIdentity";
import {
  direccionClave as direccionClaveUtil,
  direccionDesdeCliente as direccionDesdeClienteUtil,
  direccionLegacyDesdeUsuarioLS as direccionLegacyDesdeUsuarioLSUtil,
  normalizarDireccionesUsuario as normalizarDireccionesUsuarioUtil
} from "../../utils/direcciones";
import { claveTelefonoES } from "../../utils/telefono";
import type { MaikaUsuarioLS } from "../../utils/maikaUsuarios";

/**
 * Fusiona direcciones y persiste el usuario Maika en localStorage vía `guardarMaikaUsuarios`.
 */
export function fusionarYGuardarUsuarioMaikaCheckout(params: {
  telefonoNormalizadoCheckout: string;
  dcOk: Cliente;
  direccionesMax: number;
  leerMaikaUsuarios: () => MaikaUsuarioLS[];
  guardarMaikaUsuarios: (usuarios: MaikaUsuarioLS[]) => void;
}): void {
  const { telefonoNormalizadoCheckout, dcOk, direccionesMax, leerMaikaUsuarios, guardarMaikaUsuarios } = params;

  const normalizarDireccionesUsuario = (dirsRaw: unknown) =>
    normalizarDireccionesUsuarioUtil(dirsRaw, direccionesMax);
  const direccionClave = direccionClaveUtil;
  const direccionDesdeCliente = direccionDesdeClienteUtil;
  const direccionLegacyDesdeUsuarioLS = direccionLegacyDesdeUsuarioLSUtil;

  const claveTel = claveTelefonoES(telefonoNormalizadoCheckout);
  if (!claveTel) return;

  try {
    const usuariosLS = leerMaikaUsuarios();
    const idx = usuariosLS.findIndex((u) => (u.telefono || "").trim() === claveTel);
    const prevUsuario = idx !== -1 ? usuariosLS[idx] : null;
    const direccionActual = direccionDesdeCliente(dcOk);
    const baseDirecciones = normalizarDireccionesUsuario(prevUsuario?.direcciones);
    const legacyPrev = direccionLegacyDesdeUsuarioLS(prevUsuario);
    if (legacyPrev && !baseDirecciones.some((d) => direccionClave(d) === direccionClave(legacyPrev))) {
      baseDirecciones.push(legacyPrev);
    }
    let direccionesActualizadas = baseDirecciones;
    let direccionPredeterminadaId = prevUsuario?.direccionPredeterminadaId || "";
    const nombrePartido = repartirNombreApellidos(dcOk.nombre || "", dcOk.apellidos || "");
    if (direccionActual) {
      const claveNueva = direccionClave(direccionActual);
      const idxDir = baseDirecciones.findIndex((d) => direccionClave(d) === claveNueva);
      if (idxDir >= 0) {
        direccionesActualizadas = [...baseDirecciones];
        direccionesActualizadas[idxDir] = {
          ...direccionesActualizadas[idxDir],
          ...direccionActual,
          id: direccionesActualizadas[idxDir].id
        };
        direccionPredeterminadaId = direccionesActualizadas[idxDir].id;
      } else {
        direccionesActualizadas = [direccionActual, ...baseDirecciones].slice(0, direccionesMax);
        direccionPredeterminadaId = direccionActual.id;
      }
    }
    const direccionesFinales = normalizarDireccionesUsuario(direccionesActualizadas);
    if (!direccionesFinales.some((d) => d.id === direccionPredeterminadaId)) {
      direccionPredeterminadaId = direccionesFinales[0]?.id || "";
    }

    const payload: MaikaUsuarioLS = {
      telefono: claveTel,
      nombre: nombrePartido.nombre.trim(),
      apellidos: nombrePartido.apellidos.trim(),
      email: (dcOk.email || "").trim(),
      dni: (dcOk.dni || "").trim(),
      calle: (dcOk.calle || "").trim(),
      numero: (dcOk.numero || "").trim(),
      bloque: (dcOk.bloque || "").trim(),
      escalera: (dcOk.escalera || "").trim(),
      piso: (dcOk.piso || "").trim(),
      puerta: (dcOk.puerta || "").trim(),
      cp: (dcOk.cp || "").trim(),
      poblacion: (dcOk.poblacion || "").trim(),
      provincia: (dcOk.provincia || "").trim(),
      pais: (dcOk.pais || "").trim(),
      direcciones: direccionesFinales,
      direccionPredeterminadaId
    };

    if (idx !== -1) usuariosLS[idx] = { ...usuariosLS[idx], ...payload };
    else usuariosLS.push(payload);
    guardarMaikaUsuarios(usuariosLS);
  } catch (e) {
    logCheckoutWarn("maika_usuarios_local", e);
  }
}
