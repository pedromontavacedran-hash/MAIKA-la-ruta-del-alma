import { useState, useEffect, useCallback } from "react";
import type { NavigateFunction } from "react-router-dom";
import type { Usuario, AuthForm, Pagina } from "../../types";
import { useAuthMaika } from "./useAuthMaika";
import { useClienteMaika } from "./useClienteMaika";
import { useModalesMaika } from "./useModalesMaika";
import { useUsuariosMaika } from "./useUsuariosMaika";
import { useAutocompletarCodigoPostalEffects } from "./useAutocompletarCodigoPostalEffects";
import { normalizarTelefonoES9 } from "../../utils/telefono";
import { migrarLegacyAMaikaSiHaceFalta } from "../../utils/maikaUsuarios";
import { DIRECCIONES_MAX } from "../routing/routeMaps";

export type UseMaikaSesionUsuariosInput = {
  pathname: string;
  setPagina: (p: Pagina) => void;
  mostrarNotificacion: (mensaje: string, tipo: "normal" | "exito" | "error") => void;
  navigate: NavigateFunction;
};

export function useMaikaSesionUsuarios(p: UseMaikaSesionUsuariosInput) {
  const { pathname, setPagina, mostrarNotificacion, navigate } = p;

  const {
    modalUsuariosAbierto,
    setModalUsuariosAbierto,
    altaUsuarioEnGestionAbierta,
    setAltaUsuarioEnGestionAbierta
  } = useModalesMaika(pathname);

  const {
    datosCliente,
    setDatosCliente,
    precargarDatosClienteDesdeUsuario,
    resetCliente
  } = useClienteMaika();

  const {
    usuario,
    setUsuario,
    authHydrated,
    setAuthHydrated,
    loginModalAbierto,
    setLoginModalAbierto,
    modoRegistro,
    setModoRegistro,
    getUsuarioCanonico,
    authPerfilSync,
    reintentarPerfilAhora,
    iniciarSesionConToken
  } = useAuthMaika({
    mostrarNotificacion,
    setPagina
  });

  const {
    listaUsuarios,
    setListaUsuarios,
    modalEditarUsuarioAbierto,
    setModalEditarUsuarioAbierto,
    editUsuarioForm,
    setEditUsuarioForm,
    guardarEdicionUsuario,
    proyectarUsuariosDesdeMaika,
    abrirEditorUsuario,
    cargarUsuarios,
    leerMaikaUsuarios,
    guardarMaikaUsuarios
  } = useUsuariosMaika({
    mostrarNotificacion,
    usuario,
    setUsuario,
    getUsuarioCanonico,
    precargarDatosClienteDesdeUsuario,
    setModalUsuariosAbierto,
    direccionesMax: DIRECCIONES_MAX
  });

  const [telefonoForzadoRegistroDesdeAcceso, setTelefonoForzadoRegistroDesdeAcceso] = useState("");
  const [modoForzadoRegistroDesdeAcceso, setModoForzadoRegistroDesdeAcceso] = useState<"" | "registro" | "activar">("");
  const [confirmacionIdentidadActivacion, setConfirmacionIdentidadActivacion] = useState(false);
  const [formAuth, setFormAuth] = useState<AuthForm>({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
    confirmEmail: "",
    calle: "",
    bloque: "",
    escalera: "",
    piso: "",
    puerta: "",
    numero: "",
    cp: "",
    provincia: "",
    poblacion: "",
    pais: "",
    confirmPassword: "",
    codigoVerificacion: "",
    codigoIngresado: "",
    pasoVerificacion: 1
  });
  const [reenvioDisponibleEn, setReenvioDisponibleEn] = useState(0);

  useEffect(() => {
    migrarLegacyAMaikaSiHaceFalta(normalizarTelefonoES9);
  }, []);

  const abrirRegistroAdminCuenta = useCallback(() => {
    setTelefonoForzadoRegistroDesdeAcceso("");
    setModoForzadoRegistroDesdeAcceso("");
    setConfirmacionIdentidadActivacion(false);
    setModoRegistro("register");
    setFormAuth({
      nombre: "",
      email: "",
      password: "",
      telefono: "",
      confirmEmail: "",
      calle: "",
      bloque: "",
      escalera: "",
      piso: "",
      puerta: "",
      numero: "",
      cp: "",
      provincia: "",
      poblacion: "",
      pais: "",
      confirmPassword: "",
      codigoVerificacion: "",
      codigoIngresado: "",
      pasoVerificacion: 1
    });
    setReenvioDisponibleEn(0);
    setAltaUsuarioEnGestionAbierta(true);
  }, [
    setTelefonoForzadoRegistroDesdeAcceso,
    setModoForzadoRegistroDesdeAcceso,
    setConfirmacionIdentidadActivacion,
    setModoRegistro,
    setFormAuth,
    setReenvioDisponibleEn,
    setAltaUsuarioEnGestionAbierta
  ]);

  useAutocompletarCodigoPostalEffects({
    formAuthCp: formAuth.cp,
    datosClienteCp: datosCliente.cp,
    editUsuarioForm,
    editUsuarioFormCp: editUsuarioForm?.cp,
    setFormAuth,
    setEditUsuarioForm,
    setDatosCliente
  });

  useEffect(() => {
    if (reenvioDisponibleEn <= 0) return;

    const timer = window.setInterval(() => {
      setReenvioDisponibleEn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [reenvioDisponibleEn]);

  const abrirDetalleCliente = useCallback(
    (usuarioRef: Usuario) => {
      const id = encodeURIComponent(String(usuarioRef.id || ""));
      const tel = encodeURIComponent(String(usuarioRef.telefono || ""));
      const qs = tel ? `id=${id}&tel=${tel}` : `id=${id}`;
      navigate(`/admin/detalle-cliente?${qs}`);
    },
    [navigate]
  );

  return {
    modalUsuariosAbierto,
    setModalUsuariosAbierto,
    altaUsuarioEnGestionAbierta,
    setAltaUsuarioEnGestionAbierta,
    datosCliente,
    setDatosCliente,
    precargarDatosClienteDesdeUsuario,
    resetCliente,
    usuario,
    setUsuario,
    authHydrated,
    setAuthHydrated,
    loginModalAbierto,
    setLoginModalAbierto,
    modoRegistro,
    setModoRegistro,
    getUsuarioCanonico,
    authPerfilSync,
    reintentarPerfilAhora,
    iniciarSesionConToken,
    listaUsuarios,
    setListaUsuarios,
    modalEditarUsuarioAbierto,
    setModalEditarUsuarioAbierto,
    editUsuarioForm,
    setEditUsuarioForm,
    guardarEdicionUsuario,
    proyectarUsuariosDesdeMaika,
    abrirEditorUsuario,
    cargarUsuarios,
    leerMaikaUsuarios,
    guardarMaikaUsuarios,
    telefonoForzadoRegistroDesdeAcceso,
    setTelefonoForzadoRegistroDesdeAcceso,
    modoForzadoRegistroDesdeAcceso,
    setModoForzadoRegistroDesdeAcceso,
    confirmacionIdentidadActivacion,
    setConfirmacionIdentidadActivacion,
    formAuth,
    setFormAuth,
    reenvioDisponibleEn,
    setReenvioDisponibleEn,
    abrirRegistroAdminCuenta,
    abrirDetalleCliente
  };
}
