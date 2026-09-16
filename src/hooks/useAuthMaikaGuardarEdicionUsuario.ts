import type { Dispatch, SetStateAction } from "react";
import type { DireccionUsuario, EditUsuarioForm, Usuario } from "../types";
import { passwordSeguraBasica } from "../utils/accesoRapidoUtils";
import { isAdminAuthorized } from "../utils/adminAuth";
import {
  deduplicarListaGestionUsuarios,
  fusionarApiYLocales,
  fusionarListaGestionUsuarios,
  leerLegacyUsuariosJSON,
  mapearUsuarioApiAGestion
} from "../utils/adminUsuariosFusion";
import {
  actualizarUsuarioPorIdApi,
  ensureAdminUsuariosApiJwt,
  getJwtTokenParaOperacionesUsuarios,
  hasClientSession,
  listarUsuariosApi,
  registerApi
} from "../services/apiAuth";
import {
  direccionClave as direccionClaveUtil,
  normalizarDireccionesUsuario as normalizarDireccionesUsuarioUtil
} from "../utils/direcciones";
import type { MaikaUsuarioLS } from "../utils/maikaUsuarios";
import { repartirNombreApellidos } from "../utils/appIdentity";
import { perfilUsuarioPayloadDesdeMaika } from "../utils/perfilPayloadDesdeMaika";
import { prepareDireccionesParaGuardar } from "../utils/prepareDireccionesParaGuardar";
import { proyectarUsuariosDesdeMaika, esEmailVerificable } from "../utils/proyectarUsuariosDesdeMaika";
import { normalizarTelefonoBizum } from "../utils/pago";
import { normalizarTelefonoES9 } from "../utils/telefono";
import { notificarError, notificarExito } from "../utils/ui/notificaciones";

export type GuardarEdicionUsuarioMaikaDeps = {
  editUsuarioForm: EditUsuarioForm;
  usuario: Usuario | null;
  mostrarNotificacion: (mensaje: string, tipo?: "normal" | "exito" | "error") => void;
  setListaUsuarios: Dispatch<SetStateAction<Usuario[]>>;
  setUsuario: Dispatch<SetStateAction<Usuario | null>>;
  precargarDatosClienteDesdeUsuario: (u: Usuario | null) => void;
  setModalEditarUsuarioAbierto: (open: boolean) => void;
  setEditUsuarioForm: (f: EditUsuarioForm | null) => void;
  getUsuarioCanonico: () => Promise<Usuario | null>;
  leerMaikaUsuarios: () => MaikaUsuarioLS[];
  guardarMaikaUsuarios: (usuarios: MaikaUsuarioLS[]) => void;
  direccionesMax: number;
};

export async function guardarEdicionUsuarioMaika(d: GuardarEdicionUsuarioMaikaDeps): Promise<void> {
  const {
    editUsuarioForm,
    usuario,
    mostrarNotificacion,
    setListaUsuarios,
    setUsuario,
    precargarDatosClienteDesdeUsuario,
    setModalEditarUsuarioAbierto,
    setEditUsuarioForm,
    getUsuarioCanonico,
    leerMaikaUsuarios,
    guardarMaikaUsuarios,
    direccionesMax
  } = d;

  if (!editUsuarioForm) return;

  if (!editUsuarioForm.nombre.trim() || !editUsuarioForm.telefono?.trim()) {
    notificarError(mostrarNotificacion, "Nombre y teléfono son obligatorios");
    return;
  }
  if (editUsuarioForm.nombre.trim().split(/\s+/).filter(Boolean).length < 2) {
    notificarError(mostrarNotificacion, "Escribe el nombre y apellidos completos (ej.: Pedro Montava Cedran)");
    return;
  }
  const passwordEdit = editUsuarioForm.password.trim();
  if (passwordEdit && !passwordSeguraBasica(passwordEdit)) {
    notificarError(mostrarNotificacion, "La contraseña debe tener mínimo 8 caracteres, letras y números");
    return;
  }

  const normalizarDireccionesUsuario = (dirsRaw: unknown): DireccionUsuario[] =>
    normalizarDireccionesUsuarioUtil(dirsRaw, direccionesMax);
  const direccionClave = direccionClaveUtil;

  const usuariosActuales = proyectarUsuariosDesdeMaika(leerMaikaUsuarios());
  const normalizarViaCalle = (txt: string): string =>
    String(txt || "")
      .trim()
      .replace(/^(?:C\.?\s*\/?\s*)?CARRERA(\b|[\s\-.,/]+)/i, "CARRER$1")
      .replace(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])'([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])/g, "$1$2");
  const telNorm = normalizarTelefonoBizum(editUsuarioForm.telefono.trim());
  const emailNorm = (editUsuarioForm.email || "").trim().toLowerCase();
  const dniNorm = (editUsuarioForm.dni || "").trim().toUpperCase().replace(/\s+/g, "");

  const telefonoDuplicado =
    /^[67]\d{8}$/.test(telNorm) &&
    usuariosActuales.some(
      (u) => String(u.id) !== String(editUsuarioForm.id) && normalizarTelefonoBizum(u.telefono || "") === telNorm
    );

  if (telefonoDuplicado) {
    notificarError(mostrarNotificacion, "Usuario registrado: ese teléfono ya pertenece a otro usuario");
    return;
  }

  const emailDuplicado =
    !!emailNorm &&
    usuariosActuales.some(
      (u) => String(u.id) !== String(editUsuarioForm.id) && (u.email || "").trim().toLowerCase() === emailNorm
    );
  if (emailDuplicado) {
    notificarError(mostrarNotificacion, "Usuario registrado: ese email ya pertenece a otro usuario");
    return;
  }

  const dniDuplicado =
    !!dniNorm &&
    usuariosActuales.some((u) => {
      if (String(u.id) === String(editUsuarioForm.id)) return false;
      const uDni = (u.dni || "").trim().toUpperCase().replace(/\s+/g, "");
      return uDni && uDni === dniNorm;
    });
  if (dniDuplicado) {
    notificarError(mostrarNotificacion, "Usuario registrado: ese DNI ya pertenece a otro usuario");
    return;
  }

  const idEdit = String(editUsuarioForm.id || "");
  const telEdit = normalizarTelefonoBizum(editUsuarioForm.telefono.trim());
  const emailEdit = (editUsuarioForm.email || "").trim().toLowerCase();
  let huboActualizacion = false;
  const usuariosActualizados = usuariosActuales.map((u) => {
    const idU = String(u.id || "");
    const telU = normalizarTelefonoBizum(u.telefono || "");
    const emailU = (u.email || "").trim().toLowerCase();
    const coincide =
      (idEdit && idU === idEdit) || (!!telEdit && !!telU && telU === telEdit) || (!!emailEdit && !!emailU && emailU === emailEdit);
    if (!coincide) return u;
    huboActualizacion = true;
    return {
      ...u,
      nombre: editUsuarioForm.nombre.trim(),
      email: editUsuarioForm.email.trim(),
      dni: (editUsuarioForm.dni || "").trim(),
      telefono: editUsuarioForm.telefono.trim(),
      password: "",
      calle: normalizarViaCalle(editUsuarioForm.calle.trim()),
      bloque: editUsuarioForm.bloque.trim(),
      escalera: editUsuarioForm.escalera.trim(),
      piso: editUsuarioForm.piso.trim(),
      puerta: editUsuarioForm.puerta.trim(),
      numero: editUsuarioForm.numero.trim(),
      cp: editUsuarioForm.cp.trim(),
      provincia: editUsuarioForm.provincia.trim(),
      poblacion: editUsuarioForm.poblacion.trim(),
      pais: editUsuarioForm.pais.trim(),
      verificado: esEmailVerificable(editUsuarioForm.email.trim()) && !!editUsuarioForm.verificado
    };
  });
  if (!huboActualizacion) {
    notificarError(mostrarNotificacion, "No se encontró el usuario a actualizar. Recarga Gestión e inténtalo de nuevo.");
    return;
  }

  setListaUsuarios(usuariosActualizados);

  let persistidoEnMaika = false;
  try {
    const tel9Admin = normalizarTelefonoES9(editUsuarioForm.telefono.trim());
    const tel9DesdeId = String(editUsuarioForm.id || "").startsWith("u_")
      ? normalizarTelefonoES9(String(editUsuarioForm.id || "").slice(2))
      : "";
    const emailAdmin = String(editUsuarioForm.email || "").trim().toLowerCase();

    const maikaUsuariosLS = leerMaikaUsuarios();
    if (Array.isArray(maikaUsuariosLS) && maikaUsuariosLS.length > 0) {
      let idxMaika = maikaUsuariosLS.findIndex((m) => normalizarTelefonoES9(m.telefono || "") === tel9Admin);
      if (idxMaika < 0 && tel9DesdeId) {
        idxMaika = maikaUsuariosLS.findIndex((m) => normalizarTelefonoES9(m.telefono || "") === tel9DesdeId);
      }
      if (idxMaika < 0 && emailAdmin) {
        idxMaika = maikaUsuariosLS.findIndex((m) => String(m.email || "").trim().toLowerCase() === emailAdmin);
      }
      if (idxMaika >= 0) {
        const prevMaika = maikaUsuariosLS[idxMaika];

        let direccionesNext: DireccionUsuario[] = normalizarDireccionesUsuario(prevMaika?.direcciones);
        let direccionPredeterminadaId = prevMaika?.direccionPredeterminadaId || "";
        const dirPrincipalActual =
          direccionesNext.find((dir) => dir.id === direccionPredeterminadaId) || direccionesNext[0] || null;

        const calleAdmin =
          normalizarViaCalle(String(editUsuarioForm.calle || "").trim()).toUpperCase() ||
          normalizarViaCalle(String(dirPrincipalActual?.calle || prevMaika.calle || "").trim()).toUpperCase();
        const numeroAdmin =
          String(editUsuarioForm.numero || "").trim().toUpperCase() ||
          String(dirPrincipalActual?.numero || prevMaika.numero || "").trim().toUpperCase();
        const cpAdmin =
          (String(editUsuarioForm.cp || "").trim().replace(/\D/g, "").slice(0, 5)) ||
          String(dirPrincipalActual?.cp || prevMaika.cp || "").trim().replace(/\D/g, "").slice(0, 5);
        const poblacionAdmin =
          String(editUsuarioForm.poblacion || "").trim().toUpperCase() ||
          String(dirPrincipalActual?.poblacion || prevMaika.poblacion || "").trim().toUpperCase();
        const provinciaAdmin =
          String(editUsuarioForm.provincia || "").trim().toUpperCase() ||
          String(dirPrincipalActual?.provincia || prevMaika.provincia || "").trim().toUpperCase();
        const paisAdmin =
          String(editUsuarioForm.pais || "").trim().toUpperCase() ||
          String(dirPrincipalActual?.pais || prevMaika.pais || "").trim().toUpperCase();
        const bloqueAdmin =
          String(editUsuarioForm.bloque || "").trim().toUpperCase() ||
          String(dirPrincipalActual?.bloque || prevMaika.bloque || "").trim().toUpperCase();
        const escaleraAdmin =
          String(editUsuarioForm.escalera || "").trim().toUpperCase() ||
          String(dirPrincipalActual?.escalera || prevMaika.escalera || "").trim().toUpperCase();
        const pisoAdmin =
          String(editUsuarioForm.piso || "").trim().toUpperCase() ||
          String(dirPrincipalActual?.piso || prevMaika.piso || "").trim().toUpperCase();
        const puertaAdmin =
          String(editUsuarioForm.puerta || "").trim().toUpperCase() ||
          String(dirPrincipalActual?.puerta || prevMaika.puerta || "").trim().toUpperCase();

        if (calleAdmin && numeroAdmin && cpAdmin && poblacionAdmin && provinciaAdmin && paisAdmin) {
          const nuevoDir: DireccionUsuario = {
            id: `dir_admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            alias: "Dirección principal",
            calle: calleAdmin,
            numero: numeroAdmin,
            bloque: bloqueAdmin,
            escalera: escaleraAdmin,
            piso: pisoAdmin,
            puerta: puertaAdmin,
            cp: cpAdmin,
            poblacion: poblacionAdmin,
            provincia: provinciaAdmin,
            pais: paisAdmin
          };

          const claveNueva = direccionClave(nuevoDir);
          const idEditando = String(editUsuarioForm.direccionEditandoId || "").trim();
          const idxDirPorId = idEditando ? direccionesNext.findIndex((dir) => dir.id === idEditando) : -1;
          const idxDirPorClave = direccionesNext.findIndex((dir) => direccionClave(dir) === claveNueva);
          const idxDir = idxDirPorId >= 0 ? idxDirPorId : idxDirPorClave;
          if (idxDir >= 0) {
            const idExistente = direccionesNext[idxDir]?.id || idEditando;
            direccionesNext = [...direccionesNext];
            direccionesNext[idxDir] = {
              ...direccionesNext[idxDir],
              ...nuevoDir,
              id: idExistente || direccionesNext[idxDir].id
            };
          } else {
            direccionesNext = [{ ...nuevoDir }, ...direccionesNext].slice(0, direccionesMax);
          }

          direccionesNext = normalizarDireccionesUsuario(direccionesNext);
          direccionPredeterminadaId =
            direccionesNext.find((dir) => direccionClave(dir) === claveNueva)?.id || direccionesNext[0]?.id || "";
        }

        maikaUsuariosLS[idxMaika] = {
          ...prevMaika,
          nombre: repartirNombreApellidos(editUsuarioForm.nombre.trim(), "").nombre || prevMaika.nombre,
          apellidos: repartirNombreApellidos(editUsuarioForm.nombre.trim(), "").apellidos || prevMaika.apellidos,
          telefono: tel9Admin,
          email: editUsuarioForm.email.trim(),
          dni: (editUsuarioForm.dni || "").trim(),
          password: "",
          passwordTemporal: !!editUsuarioForm.passwordTemporal,
          calle: calleAdmin || prevMaika.calle,
          numero: numeroAdmin || prevMaika.numero,
          bloque: bloqueAdmin || prevMaika.bloque,
          escalera: escaleraAdmin || prevMaika.escalera,
          piso: pisoAdmin || prevMaika.piso,
          puerta: puertaAdmin || prevMaika.puerta,
          cp: cpAdmin || prevMaika.cp,
          poblacion: poblacionAdmin || prevMaika.poblacion,
          provincia: provinciaAdmin || prevMaika.provincia,
          pais: paisAdmin || prevMaika.pais,
          direcciones: direccionesNext,
          direccionPredeterminadaId
        };

        guardarMaikaUsuarios(maikaUsuariosLS);

        const despues = leerMaikaUsuarios();
        const encontrarDespues = () => {
          const porTel = despues.find((m) => normalizarTelefonoES9(String(m.telefono || "")) === tel9Admin);
          if (porTel) return porTel;
          if (tel9DesdeId) {
            const porTelId = despues.find((m) => normalizarTelefonoES9(String(m.telefono || "")) === tel9DesdeId);
            if (porTelId) return porTelId;
          }
          if (emailAdmin) {
            const porEmail = despues.find((m) => String(m.email || "").trim().toLowerCase() === emailAdmin);
            if (porEmail) return porEmail;
          }
          return null;
        };

        const actualizadoDespues = encontrarDespues();
        const dniEsperado = String(editUsuarioForm.dni || "").trim();
        const emailEsperado = String(editUsuarioForm.email || "").trim().toLowerCase();

        if (!actualizadoDespues) {
          notificarError(mostrarNotificacion, "No se pudo verificar el guardado en maika_usuarios. Recarga e inténtalo de nuevo.");
          return;
        }

        const dniReal = String(actualizadoDespues.dni || "").trim();
        const emailReal = String(actualizadoDespues.email || "").trim().toLowerCase();

        if (emailEsperado && emailReal !== emailEsperado) {
          notificarError(mostrarNotificacion, "El guardado no quedó reflejado (email). Recarga e inténtalo de nuevo.");
          return;
        }

        if (dniEsperado && dniReal !== dniEsperado) {
          notificarError(mostrarNotificacion, "El guardado no quedó reflejado (DNI). Recarga e inténtalo de nuevo.");
          return;
        }

        persistidoEnMaika = true;

        try {
          if (isAdminAuthorized()) {
            await ensureAdminUsuariosApiJwt();
          }
          const tokenSrv = getJwtTokenParaOperacionesUsuarios();
          if (tokenSrv) {
            const listaSrv = await listarUsuariosApi();
            const tel9Srv = normalizarTelefonoES9(String(actualizadoDespues.telefono || ""));
            const emailSrv = String(actualizadoDespues.email || "").trim().toLowerCase();
            const rawIdSrv = editUsuarioForm.id;
            const idStrSrv = rawIdSrv !== undefined && rawIdSrv !== null ? String(rawIdSrv).trim() : "";

            let rowSrv = listaSrv.find((u) => {
              const telU = normalizarTelefonoES9(String(u.telefono || ""));
              const emailU = String(u.email || "").trim().toLowerCase();
              if (tel9Srv && telU && telU === tel9Srv) return true;
              if (emailSrv && emailU && emailU === emailSrv) return true;
              return false;
            });
            if (!rowSrv && /^\d+$/.test(idStrSrv)) {
              rowSrv = listaSrv.find((u) => String(u.id) === idStrSrv);
            }

            const pl = perfilUsuarioPayloadDesdeMaika(actualizadoDespues);
            if (passwordEdit) {
              pl.password = passwordEdit;
              if (editUsuarioForm.passwordTemporal) {
                pl.passwordTemporal = true;
              }
            }
            if (Array.isArray(pl.direcciones)) {
              const preparado = prepareDireccionesParaGuardar(
                pl.direcciones as DireccionUsuario[],
                Array.isArray(rowSrv?.direcciones) ? rowSrv.direcciones : [],
                String(pl.direccionPredeterminadaId || rowSrv?.direccionPredeterminadaId || "")
              );
              pl.direcciones = preparado.direcciones;
              pl.direccionPredeterminadaId = preparado.direccionPredeterminadaId;
            }

            if (rowSrv?.id !== undefined && rowSrv?.id !== null && String(rowSrv.id).trim() !== "") {
              await actualizarUsuarioPorIdApi(rowSrv.id, pl);
            } else {
              const pwd = passwordEdit;
              if (!passwordSeguraBasica(pwd)) {
                notificarError(
                  mostrarNotificacion,
                  "Usuario guardado en este dispositivo. Para crearlo en el servidor (y poder iniciar sesión) indica una contraseña válida: mínimo 8 caracteres, letras y números, y vuelve a guardar."
                );
              } else {
                await registerApi({
                  email: String(pl.email || "").trim().toLowerCase(),
                  password: pwd,
                  passwordTemporal: !!editUsuarioForm.passwordTemporal,
                  nombre: String(pl.nombre || ""),
                  telefono: String(pl.telefono || ""),
                  dni: String(pl.dni || ""),
                  direccion: String(pl.direccion || ""),
                  calle: String(pl.calle || ""),
                  numero: String(pl.numero || ""),
                  bloque: String(pl.bloque || ""),
                  escalera: String(pl.escalera || ""),
                  piso: String(pl.piso || ""),
                  puerta: String(pl.puerta || ""),
                  cp: String(pl.cp || ""),
                  poblacion: String(pl.poblacion || ""),
                  provincia: String(pl.provincia || ""),
                  pais: String(pl.pais || ""),
                  direcciones: pl.direcciones,
                  direccionPredeterminadaId: String(pl.direccionPredeterminadaId || "")
                });
                notificarExito(
                  mostrarNotificacion,
                  "✅ Usuario dado de alta en el servidor: puede iniciar sesión con ese correo y contraseña."
                );
              }
            }

            try {
              const apiRows = await listarUsuariosApi();
              const apiGestion = apiRows.map(mapearUsuarioApiAGestion);
              const localesFusionados = fusionarListaGestionUsuarios(
                proyectarUsuariosDesdeMaika(leerMaikaUsuarios()),
                leerLegacyUsuariosJSON()
              );
              const listaRefrescada = deduplicarListaGestionUsuarios(
                fusionarApiYLocales(apiGestion, localesFusionados)
              );
              setListaUsuarios(listaRefrescada);
            } catch {
              /* refresco opcional */
            }
          }
        } catch (eSync) {
          const msg = eSync instanceof Error ? eSync.message : String(eSync);
          notificarError(
            mostrarNotificacion,
            msg.trim()
              ? `Datos guardados en este dispositivo; servidor: ${msg}`
              : "Datos guardados en este dispositivo; no se pudo sincronizar el servidor."
          );
        }
      }
    }
  } catch {
    // Si falla el saneado nuevo, mantenemos legacy y el usuario puede recargar.
  }

  if (!persistidoEnMaika) {
    notificarError(mostrarNotificacion, "No se pudo persistir el usuario en maika_usuarios. Recarga e inténtalo de nuevo.");
    return;
  }

  if (usuario) {
    const telSesion = normalizarTelefonoES9(String(usuario.telefono || ""));
    const actualizado = usuariosActualizados.find((u) => normalizarTelefonoES9(String(u.telefono || "")) === telSesion);
    if (actualizado) {
      setUsuario(actualizado);
      precargarDatosClienteDesdeUsuario(actualizado);
    }
    try {
      const sesionActiva = hasClientSession();
      const emailSesion = String(usuario.email || "").trim().toLowerCase();
      const emailEditado = String(editUsuarioForm.email || "").trim().toLowerCase();
      const telEditado = normalizarTelefonoES9(String(editUsuarioForm.telefono || ""));
      const coincideSesion =
        (!!telSesion && !!telEditado && telSesion === telEditado) ||
        (!!emailSesion && !!emailEditado && emailSesion === emailEditado);
      if (sesionActiva && coincideSesion) {
        const canonico = await getUsuarioCanonico();
        if (canonico) {
          setUsuario(canonico);
          precargarDatosClienteDesdeUsuario(canonico);
        }
      }
    } catch {
      // Si backend falla, mantenemos el estado local para no bloquear la UX.
    }
  }

  notificarExito(mostrarNotificacion, `✅ Usuario ${editUsuarioForm.nombre} actualizado`);
  setModalEditarUsuarioAbierto(false);
  setEditUsuarioForm(null);
}
