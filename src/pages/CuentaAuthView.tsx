import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import type { AuthForm, Usuario, Pedido, Pagina } from "../types";
import { checkoutInputStyle, checkoutPrimaryButtonStyleNoShadow } from "../styles/inputStyle";
import BotonCerrar from "../components/BotonCerrar";
import { THEME } from "../config";
import {
  loginApi,
  LoginApiError,
  registerApi,
  solicitarCodigoRegistroApi
} from "../services/apiAuth";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { construirDireccionBasica } from "../utils/direccion";
import { leerMaikaUsuarios } from "../utils/maikaUsuarios";
import { normalizarTelefonoES9 } from "../utils/telefono";
import { notificarError, notificarExito } from "../utils/ui/notificaciones";
import {
  esActivacionIdentidadVerificadaEnSession,
  limpiarActivacionIdentidadVerificada,
  obtenerCodigoActivacionVerificadaEnSession
} from "../utils/activacionIdentidadSession";

import RequisitosPasswordHint from "../components/RequisitosPasswordHint";
import RecuperarPasswordView from "./cuenta/RecuperarPasswordView";
import LoginFormView from "./cuenta/LoginFormView";
import RegistroVerificarCuentaView from "./cuenta/RegistroVerificarCuentaView";
import {
  normalizarTelefono,
  claveTelefonoMaika,
  telefonoRegistradoEnLocal,
  emailRegistradoEnLocal,
  tieneEmailVerificable,
  passwordSeguraBasica,
  textoCapitalizadoEnVivo,
  cargarPedidosUsuario,
  type MaikaPedidoLS
} from "../utils/cuentaPageHelpers";

export interface CuentaPageProps {
  formAuth: AuthForm;
  setFormAuth: Dispatch<SetStateAction<AuthForm>>;
  modoRegistro: "login" | "register";
  setModoRegistro: Dispatch<SetStateAction<"login" | "register">>;
  usuario: Usuario | null;
  setUsuario: Dispatch<SetStateAction<Usuario | null>>;
  iniciarSesionConToken: (token: string, opts?: { mostrarBienvenida?: boolean }) => Promise<Usuario | null>;
  reenvioDisponibleEn: number;
  setReenvioDisponibleEn: Dispatch<SetStateAction<number>>;
  mostrarNotificacion: (mensaje: string, tipo: "normal" | "exito" | "error") => void;
  precargarDatosClienteDesdeUsuario: (u: Usuario | null) => void;
  pedidos: Pedido[];
  onRepetirPedido: (pedido: MaikaPedidoLS) => void;
  setPagina: (p: Pagina) => void;
  telefonoForzadoRegistroDesdeAcceso: string;
  setTelefonoForzadoRegistroDesdeAcceso: Dispatch<SetStateAction<string>>;
  modoForzadoRegistroDesdeAcceso: "" | "registro" | "activar";
  setModoForzadoRegistroDesdeAcceso: Dispatch<SetStateAction<"" | "registro" | "activar">>;
  confirmacionIdentidadActivacion: boolean;
  setConfirmacionIdentidadActivacion: Dispatch<SetStateAction<boolean>>;
  /** Alta admin embebida en Gestión de usuarios (mismo formulario, sin navegar a /cuenta). */
  embedPanelGestion?: boolean;
  /** Fuerza modo admin sin `?adminRegistro=1` en la URL. */
  adminRegistroSinVerificacionOverride?: boolean;
  onSalirEmbedPanelGestion?: () => void;
  /** Tras registro+login correcto en embed (p. ej. refrescar listado y cerrar panel). */
  onExitoAltaEmbedGestion?: () => void;
}

const formAuthReset: AuthForm = {
  nombre: "", email: "", password: "", telefono: "",
  confirmEmail: "", calle: "", bloque: "", escalera: "", piso: "", puerta: "", numero: "", cp: "", provincia: "", poblacion: "", pais: "", confirmPassword: "",
  codigoVerificacion: "", codigoIngresado: "", pasoVerificacion: 1
};
export default function CuentaAuthView({
  formAuth,
  setFormAuth,
  modoRegistro,
  setModoRegistro,
  usuario,
  iniciarSesionConToken,
  reenvioDisponibleEn,
  setReenvioDisponibleEn,
  mostrarNotificacion,
  precargarDatosClienteDesdeUsuario,
  setPagina,
  telefonoForzadoRegistroDesdeAcceso,
  setTelefonoForzadoRegistroDesdeAcceso,
  modoForzadoRegistroDesdeAcceso,
  setModoForzadoRegistroDesdeAcceso,
  confirmacionIdentidadActivacion,
  setConfirmacionIdentidadActivacion,
  embedPanelGestion = false,
  adminRegistroSinVerificacionOverride,
  onSalirEmbedPanelGestion,
  onExitoAltaEmbedGestion
}: CuentaPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDev = import.meta.env.DEV;
  const adminRegistroSinVerificacion =
    adminRegistroSinVerificacionOverride === true || searchParams.get("adminRegistro") === "1";
  const marcarReabrirCheckoutTrasAuth = () => {
    if (embedPanelGestion || adminRegistroSinVerificacion) return;
    if (searchParams.get("modo") !== "direccion") return;
    try {
      sessionStorage.setItem("maika_reabrir_checkout_tras_auth", "1");
    } catch {
      /* ignore */
    }
  };
  const [, setCambioPasswordAbierto] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registroAdminLoading, setRegistroAdminLoading] = useState(false);
  const [envioCodigoRegistroCargando, setEnvioCodigoRegistroCargando] = useState(false);
  /** Aceptación expresa obligatoria en alta pública (el alta admin no la pide). */
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [declaraMayorEdad, setDeclaraMayorEdad] = useState(false);
  const prevModoRef = useRef<"login" | "register" | null>(null);
  const nombreRegistroRef = useRef<HTMLInputElement>(null);
  const emailRegistroRef = useRef<HTMLInputElement>(null);
  const passwordRegistroRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRegistroRef = useRef<HTMLInputElement>(null);
  const botonEnviarCodigoRegistroRef = useRef<HTMLButtonElement>(null);
  const botonCrearUsuarioGestionRef = useRef<HTMLButtonElement>(null);
  const telefonoRegistroRef = useRef<HTMLInputElement>(null);

  // Estados para recuperar contraseña
  const [modoRecuperar, setModoRecuperar] = useState(false);
  /** Enlace para abrir en el mismo navegador (Chrome); el correo suele abrir Brave en Windows. */
  const [enlaceRecuperacionMismoNavegador, setEnlaceRecuperacionMismoNavegador] = useState<string | null>(null);
  const claveUsuario = claveTelefonoMaika(usuario?.telefono || "");
  const [, setMaikaPedidosUsuario] = useState<MaikaPedidoLS[]>([]);

  const [, setMostrarBannerCompletarPerfil] = useState(false);
  const [telefonoDuplicadoRegistro, setTelefonoDuplicadoRegistro] = useState(false);
  const [emailDuplicadoRegistro, setEmailDuplicadoRegistro] = useState(false);

  const mostrarAvisoAccesoTemporalLogin = useMemo(() => {
    const ident = String(formAuth.email || "").trim().toLowerCase();
    if (!ident) return false;
    const tel = normalizarTelefonoES9(ident);
    return leerMaikaUsuarios().some((u) => {
      if (!u.passwordTemporal) return false;
      const emailU = String(u.email || "").trim().toLowerCase();
      const telU = normalizarTelefonoES9(u.telefono || "");
      return (!!emailU && emailU === ident) || (!!tel && !!telU && tel === telU);
    });
  }, [formAuth.email]);




  /** Mismos inputs que Finalizar compra (checkout). */
  const cuentaInputStyle: CSSProperties = {
    ...checkoutInputStyle,
    marginBottom: 12,
    boxSizing: "border-box"
  };
  const cuentaInputWithEyeStyle: CSSProperties = { ...cuentaInputStyle, paddingRight: 44 };
  const passwordWrapperStyle = { position: "relative" as const, marginBottom: 12 };
  const eyeBtnStyle = {
    position: "absolute" as const,
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    padding: 4,
    color: THEME.goldMain
  };
  const cuentaBotonAuth: CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    fontSize: 15,
    borderRadius: 10,
    fontWeight: 600,
    cursor: "pointer",
    boxSizing: "border-box"
  };
  /** CTA principal = mismo tono que «Finalizar compra». */
  const cuentaCtaPrincipalStyle: CSSProperties = {
    ...cuentaBotonAuth,
    ...checkoutPrimaryButtonStyleNoShadow
  };
  /** Campos solo lectura (perfil): mismo relleno que checkout. */
  /** Registro paso 1: densidad tipo checkout */
  const cuentaRegistroDensoInput: CSSProperties = {
    ...checkoutInputStyle,
    marginBottom: 6,
    fontSize: 13,
    boxSizing: "border-box"
  };
  const cuentaRegistroConOjoStyle: CSSProperties = { ...cuentaRegistroDensoInput, paddingRight: 44 };
  const cuentaRegistroPasswordWrap = { position: "relative" as const, marginBottom: 6 };

  const telefonoForzadoRegistro = normalizarTelefono(telefonoForzadoRegistroDesdeAcceso || "").slice(0, 9);
  const registroForzadoDesdeAcceso = modoRegistro === "register" && !modoRecuperar && !!telefonoForzadoRegistro;
  const activacionForzadaDesdeAcceso = registroForzadoDesdeAcceso && modoForzadoRegistroDesdeAcceso === "activar";
  const telefonoForzadoEnmascarado =
    telefonoForzadoRegistro.length === 9
      ? `${telefonoForzadoRegistro.slice(0, 3)}****${telefonoForzadoRegistro.slice(7)}`
      : telefonoForzadoRegistro;
  const evaluarTelefonoDuplicado = (telefonoRaw: string) => {
    const telNorm = normalizarTelefono(telefonoRaw || "");
    if (activacionForzadaDesdeAcceso) {
      setTelefonoDuplicadoRegistro(false);
      return;
    }
    if (/^[67]\d{8}$/.test(telNorm)) {
      setTelefonoDuplicadoRegistro(telefonoRegistradoEnLocal(telNorm));
    } else {
      setTelefonoDuplicadoRegistro(false);
    }
  };
  const evaluarEmailDuplicado = (emailRaw: string) => {
    const emailNorm = String(emailRaw || "").trim().toLowerCase();
    if (!emailNorm || !tieneEmailVerificable(emailNorm)) {
      setEmailDuplicadoRegistro(false);
      return;
    }
    setEmailDuplicadoRegistro(emailRegistradoEnLocal(emailNorm));
  };

  const validarRegistroPaso1ParaApi = useCallback(
    (skipActivacionCheck: boolean): boolean => {
      const telNorm = normalizarTelefono(formAuth.telefono);
      if (!/^[67]\d{8}$/.test(telNorm)) {
        notificarError(mostrarNotificacion, "❌ El teléfono debe ser 9 dígitos (móvil España, 6 o 7)");
        return false;
      }
      if (!formAuth.nombre || !formAuth.telefono || !formAuth.password || !formAuth.confirmPassword) {
        notificarError(mostrarNotificacion, "❌ Completa todos los campos obligatorios");
        return false;
      }
      const palabrasNombre = (formAuth.nombre || "").trim().split(/\s+/).filter(Boolean);
      if (palabrasNombre.length < 2) {
        notificarError(mostrarNotificacion, "❌ Escribe tu nombre y apellidos completos (ej.: Pedro Montava Cedran)");
        return false;
      }
      const emailParaCodigo = (formAuth.email || formAuth.confirmEmail || "").trim().toLowerCase();
      if (!tieneEmailVerificable(emailParaCodigo)) {
        notificarError(mostrarNotificacion, "❌ Indica un correo electrónico válido");
        return false;
      }
      if (formAuth.password !== formAuth.confirmPassword) {
        notificarError(mostrarNotificacion, "❌ Las contraseñas no coinciden");
        return false;
      }
      if (!passwordSeguraBasica(formAuth.password)) {
        notificarError(mostrarNotificacion, "❌ La contraseña debe tener mínimo 8 caracteres, con letras y números");
        return false;
      }
      if (!skipActivacionCheck && !aceptaTerminos) {
        notificarError(
          mostrarNotificacion,
          "❌ Debes aceptar los Términos y Condiciones"
        );
        return false;
      }
      if (!skipActivacionCheck && !aceptaPrivacidad) {
        notificarError(
          mostrarNotificacion,
          "❌ Debes aceptar la Política de Privacidad"
        );
        return false;
      }
      if (!skipActivacionCheck && !declaraMayorEdad) {
        notificarError(
          mostrarNotificacion,
          "❌ Debes declarar que eres mayor de 18 años"
        );
        return false;
      }
      if (
        !skipActivacionCheck &&
        activacionForzadaDesdeAcceso &&
        !confirmacionIdentidadActivacion &&
        !esActivacionIdentidadVerificadaEnSession(telefonoForzadoRegistroDesdeAcceso)
      ) {
        notificarError(
          mostrarNotificacion,
          "❌ Confirma tu identidad en el acceso rápido antes de activar la cuenta."
        );
        return false;
      }
      return true;
    },
    [
      formAuth,
      registroForzadoDesdeAcceso,
      activacionForzadaDesdeAcceso,
      confirmacionIdentidadActivacion,
      telefonoForzadoRegistroDesdeAcceso,
      mostrarNotificacion,
      aceptaTerminos,
      aceptaPrivacidad,
      declaraMayorEdad
    ]
  );

  const validarRegistroAdminSinVerificacion = useCallback((): boolean => {
    // Alta desde gestión: mismo formulario completo que registro normal,
    // pero sin paso de código por email.
    return validarRegistroPaso1ParaApi(true);
  }, [validarRegistroPaso1ParaApi]);

  const completarRegistroApiYSesion = useCallback(
    async (opts?: {
      quitarQueryAdmin?: boolean;
      embedGestion?: boolean;
      /** Tras registro+login en desarrollo: mensaje, banner y abrir flujo de dirección (checkout embebido). */
      postDevAutoPerfil?: boolean;
      /** Alta pública: token emitido por el backend tras validar el código de email (paso 2). */
      verificacionToken?: string;
    }) => {
      let emailNorm = (formAuth.email || formAuth.confirmEmail || "").trim().toLowerCase();
      if (!tieneEmailVerificable(emailNorm) && isDev) {
        emailNorm = `dev+${Date.now()}@maika.local`;
      }
      if (!tieneEmailVerificable(emailNorm) || !formAuth.password) {
        notificarError(mostrarNotificacion, "❌ Falta email o contraseña");
        return;
      }

      const telefonoApi = (formAuth.telefono || "").trim();
      const nombreApi = (formAuth.nombre || "").trim();

      if (opts?.embedGestion) {
        const direccionBasica = construirDireccionBasica(
          String(formAuth.calle || "").trim(),
          String(formAuth.numero || "").trim()
        );
        try {
          await registerApi({
            email: emailNorm,
            password: formAuth.password,
            telefono: telefonoApi,
            nombre: nombreApi,
            dni: String(formAuth.dni || "").trim(),
            direccion: direccionBasica,
            calle: String(formAuth.calle || "").trim(),
            numero: String(formAuth.numero || "").trim(),
            bloque: String(formAuth.bloque || "").trim(),
            escalera: String(formAuth.escalera || "").trim(),
            piso: String(formAuth.piso || "").trim(),
            puerta: String(formAuth.puerta || "").trim(),
            cp: String(formAuth.cp || "").trim(),
            poblacion: String(formAuth.poblacion || "").trim(),
            provincia: String(formAuth.provincia || "").trim(),
            pais: String(formAuth.pais || "").trim()
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          const m = /Registro fallido \((\d+)\)/.exec(msg);
          const st = m ? Number(m[1]) : 0;
          if (st === 400) {
            if (/tel[eé]fono/i.test(msg)) {
              notificarError(mostrarNotificacion, "❌ Ese teléfono ya está registrado en el servidor.");
            } else {
              notificarError(mostrarNotificacion, "❌ Ese correo ya está registrado en el servidor.");
            }
          } else {
            notificarError(mostrarNotificacion, `❌ ${msg}`);
          }
          return;
        }
        notificarExito(mostrarNotificacion, `✅ Usuario creado en el servidor: ${emailNorm}`);
        setTelefonoForzadoRegistroDesdeAcceso("");
        setModoForzadoRegistroDesdeAcceso("");
        setConfirmacionIdentidadActivacion(false);
        limpiarActivacionIdentidadVerificada();
        setFormAuth(formAuthReset);
        setReenvioDisponibleEn(0);
        onExitoAltaEmbedGestion?.();
        return;
      }

      let registroHecho = false;
      try {
        await registerApi({
          email: emailNorm,
          password: formAuth.password,
          telefono: telefonoApi,
          nombre: nombreApi,
          verificacionToken: opts?.verificacionToken,
          aceptacionTerminos: aceptaTerminos,
          aceptacionPrivacidad: aceptaPrivacidad,
          declaraMayorEdad,
          activarCuentaTecnica: activacionForzadaDesdeAcceso,
          codigoUltimoPedido: activacionForzadaDesdeAcceso
            ? obtenerCodigoActivacionVerificadaEnSession(telefonoForzadoRegistroDesdeAcceso)
            : undefined,
          calle: registroForzadoDesdeAcceso ? "" : formAuth.calle,
          numero: registroForzadoDesdeAcceso ? "" : formAuth.numero,
          bloque: registroForzadoDesdeAcceso ? "" : formAuth.bloque,
          escalera: registroForzadoDesdeAcceso ? "" : formAuth.escalera,
          piso: registroForzadoDesdeAcceso ? "" : formAuth.piso,
          puerta: registroForzadoDesdeAcceso ? "" : formAuth.puerta,
          cp: registroForzadoDesdeAcceso ? "" : formAuth.cp,
          poblacion: registroForzadoDesdeAcceso ? "" : formAuth.poblacion,
          provincia: registroForzadoDesdeAcceso ? "" : formAuth.provincia,
          pais: registroForzadoDesdeAcceso ? "" : formAuth.pais
        });
        registroHecho = true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const m = /Registro fallido \((\d+)\)/.exec(msg);
        const st = m ? Number(m[1]) : 0;
        if (st === 400) {
          notificarExito(mostrarNotificacion, "ℹ️ Ese correo ya está registrado en el servidor. Iniciando sesión…");
        } else {
          notificarError(mostrarNotificacion, `❌ ${msg}`);
          return;
        }
      }
      try {
        const auth = await loginApi(emailNorm, formAuth.password);
        const usuarioSesion = await iniciarSesionConToken(auth.token);
        if (usuarioSesion) {
          precargarDatosClienteDesdeUsuario(usuarioSesion);
        }
        if (registroHecho && opts?.postDevAutoPerfil && isDev) {
          sessionStorage.setItem("maika_banner_completar_perfil", "1");
          notificarExito(
            mostrarNotificacion,
            "Cuenta creada correctamente. Completa tu teléfono y dirección para continuar."
          );
        } else {
          notificarExito(
            mostrarNotificacion,
            registroHecho
              ? `✅ Cuenta creada: ${emailNorm}${isDev && !(formAuth.email || formAuth.confirmEmail || "").trim() ? " (email generado en desarrollo)" : ""}`
              : usuarioSesion
                ? `✅ Sesión iniciada: ${usuarioSesion.nombre}`
                : "Sesión iniciada. Cargando tus datos guardados…"
          );
        }
        setTelefonoForzadoRegistroDesdeAcceso("");
        setModoForzadoRegistroDesdeAcceso("");
        setConfirmacionIdentidadActivacion(false);
        limpiarActivacionIdentidadVerificada();
        setAceptaTerminos(false);
        setAceptaPrivacidad(false);
        setDeclaraMayorEdad(false);
        setFormAuth(formAuthReset);
        setReenvioDisponibleEn(0);
        setModoRegistro("login");
        if (opts?.embedGestion) {
          onExitoAltaEmbedGestion?.();
        } else if (opts?.postDevAutoPerfil && isDev) {
          window.setTimeout(() => {
            navigate("/cuenta?modo=direccion", { replace: true });
          }, 0);
        } else {
          navigate({ pathname: "/cuenta", search: "", hash: "" }, { replace: true });
        }
      } catch (e) {
        if (e instanceof LoginApiError && (e.status === 401 || e.status === 404)) {
          notificarError(
            mostrarNotificacion,
            "❌ No se pudo iniciar sesión. Si el correo ya existía, prueba «Iniciar sesión» con tu contraseña."
          );
          return;
        }
        const msg = e instanceof Error ? e.message : String(e);
        notificarError(mostrarNotificacion, `❌ ${msg}`);
      }
    },
    [
      formAuth,
      registroForzadoDesdeAcceso,
      activacionForzadaDesdeAcceso,
      telefonoForzadoRegistroDesdeAcceso,
      isDev,
      iniciarSesionConToken,
      precargarDatosClienteDesdeUsuario,
      mostrarNotificacion,
      setTelefonoForzadoRegistroDesdeAcceso,
      setModoForzadoRegistroDesdeAcceso,
      setConfirmacionIdentidadActivacion,
      setFormAuth,
      setReenvioDisponibleEn,
      navigate,
      onExitoAltaEmbedGestion,
      setModoRegistro,
      aceptaTerminos,
      aceptaPrivacidad,
      declaraMayorEdad
    ]
  );

  useEffect(() => {
    if (!adminRegistroSinVerificacion) return;
    setModoRegistro("register");
    setModoRecuperar(false);
    setFormAuth((prev) =>
      prev.pasoVerificacion !== 1 ? { ...prev, pasoVerificacion: 1, codigoIngresado: "" } : prev
    );
  }, [adminRegistroSinVerificacion, setModoRegistro, setFormAuth]);

  const ocultarTelefonoYDireccionRegistroRapido = false;

  /**
   * Alta sin datos “heredados” de otras vistas: al pasar de login → registro se vacía todo el formulario.
   * Excepción: flujo forzado desde checkout (teléfono ya fijado en App) — no machacar nombre/teléfono que App acaba de poner.
   * CP, municipio y calle vacíos hasta que el usuario escriba; el autocompletado por CP y sugerencias de calle siguen igual después.
   */
  useEffect(() => {
    const prev = prevModoRef.current;
    if (modoRegistro === "register" && prev === "login") {
      if (telefonoForzadoRegistro) {
        setFormAuth((prevForm) => ({
          ...prevForm,
          email: "",
          confirmEmail: "",
          password: "",
          confirmPassword: ""
        }));
      } else {
        setFormAuth({ ...formAuthReset, pasoVerificacion: 1 });
      }
    } else if (modoRegistro === "login" && prev === "register") {
      setFormAuth((prevForm) => ({
        ...prevForm,
        email: "",
        confirmEmail: "",
        password: ""
      }));
    }
    prevModoRef.current = modoRegistro;
  }, [modoRegistro, setFormAuth, telefonoForzadoRegistro]);

  useEffect(() => {
    if (!registroForzadoDesdeAcceso) return;
    setFormAuth((prev) => ({ ...prev, telefono: telefonoForzadoRegistro }));
  }, [registroForzadoDesdeAcceso, telefonoForzadoRegistro, setFormAuth]);

  useEffect(() => {
    if (!usuario) {
      setMaikaPedidosUsuario([]);
      return;
    }
    const recargar = () => setMaikaPedidosUsuario(cargarPedidosUsuario(claveUsuario));
    recargar();
    window.addEventListener("focus", recargar);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "maika_pedidos" || e.key === "pedidosMaika") recargar();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", recargar);
      window.removeEventListener("storage", onStorage);
    };
  }, [claveUsuario, usuario]);

  useEffect(() => {
    if (!usuario) {
      setMostrarBannerCompletarPerfil(false);
      return;
    }
    try {
      if (sessionStorage.getItem("maika_banner_completar_perfil") === "1") {
        setMostrarBannerCompletarPerfil(true);
      }
    } catch {
      /* ignore */
    }
  }, [usuario]);

  useEffect(() => {
    if (!usuario?.mustChangePassword) return;
    setCambioPasswordAbierto(true);
  }, [usuario?.mustChangePassword]);

  /** Sin barra de scroll visible en la página (sigue el desplazamiento con rueda/táctil). */
  useEffect(() => {
    if (embedPanelGestion) return;
    document.documentElement.classList.add("cuenta-maika-sin-scrollbar");
    document.body.classList.add("cuenta-maika-sin-scrollbar");
    return () => {
      document.documentElement.classList.remove("cuenta-maika-sin-scrollbar");
      document.body.classList.remove("cuenta-maika-sin-scrollbar");
    };
  }, [embedPanelGestion]);

  /** Tras enlace de recuperación: mensaje claro y URL limpia. */
  useEffect(() => {
    if (embedPanelGestion) return;
    if (searchParams.get("restablecido") !== "1") return;
    mostrarNotificacion("Contraseña actualizada. Inicia sesión con tu nueva contraseña.", "exito");
    const next = new URLSearchParams(searchParams);
    next.delete("restablecido");
    setSearchParams(next, { replace: true });
  }, [embedPanelGestion, searchParams, setSearchParams, mostrarNotificacion]);

  /**
   * Hueco bajo la nav: `page-top-spacing` y `__content` usan `--app-content-pad-bajo-nav` (= `--app-topbar-stack` en `global.css`).
   */
  const cuentaShellOuter: CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: 0,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: "max(10px, env(safe-area-inset-bottom, 0px))"
  };

  /** Invitado o alta embebida en gestión. NO usar solo `adminRegistroSinVerificacion`: con `?adminRegistro=1` en la URL seguirías en el formulario aunque ya hubiera sesión tras registrar. */

    const formularioRegistroLargo =
      !modoRecuperar && modoRegistro === "register" && formAuth.pasoVerificacion === 1;
    return (
      <div className="cuenta-maika-page maika-anchor" style={cuentaShellOuter}>
        <div
          className="maika-page-content maika-page-content--narrow"
          style={{
            maxWidth: 480,
            marginLeft: "auto",
            marginRight: "auto",
            marginTop: 0,
            marginBottom: 0,
            width: "100%",
            position: "relative",
            flex: "0 1 auto",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start"
          }}
        >
        <div
          style={{
            width: "100%",
            flex: "0 1 auto",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box"
          }}
        >
        <div className="maika-page-header">
          <h2 className="cuenta-maika-auth-heading maika-page-title">
            {embedPanelGestion
              ? "👤 Alta de usuario (gestión)"
              : adminRegistroSinVerificacion
                ? "👤 Alta de usuario (admin)"
                : "👤 Mi Cuenta"}
          </h2>
          <BotonCerrar
            onClick={() => {
              setTelefonoForzadoRegistroDesdeAcceso("");
              setModoForzadoRegistroDesdeAcceso("");
              setConfirmacionIdentidadActivacion(false);
              limpiarActivacionIdentidadVerificada();
              if (embedPanelGestion) {
                onSalirEmbedPanelGestion?.();
              } else if (adminRegistroSinVerificacion) {
                navigate("/admin", { replace: true });
              } else {
                setPagina("inicio");
              }
            }}
            ariaLabel={
              embedPanelGestion
                ? "Cerrar formulario de alta"
                : adminRegistroSinVerificacion
                  ? "Volver al panel admin"
                  : "Volver al inicio"
            }
            title={
              embedPanelGestion
                ? "Cerrar formulario de alta"
                : adminRegistroSinVerificacion
                  ? "Volver al panel admin"
                  : "Volver al inicio"
            }
          />
        </div>
        <div className="maika-page-subheader">
          {!adminRegistroSinVerificacion ? (
          <div className="cuenta-maika-tabs">
            <button
              type="button"
              disabled={registroForzadoDesdeAcceso}
              className={`cuenta-maika-tab${modoRegistro === "login" ? " cuenta-maika-tab--active" : ""}`}
              onClick={() => {
                if (registroForzadoDesdeAcceso) return;
                setModoRegistro("login");
                setModoForzadoRegistroDesdeAcceso("");
                setConfirmacionIdentidadActivacion(false);
                limpiarActivacionIdentidadVerificada();
                setFormAuth({ ...formAuth, password: "", pasoVerificacion: 1 });
                setReenvioDisponibleEn(0);
                setModoRecuperar(false);
              }}
            >Iniciar Sesión</button>
            <button
              type="button"
              className={`cuenta-maika-tab${modoRegistro === "register" && !modoRecuperar ? " cuenta-maika-tab--active" : ""}`}
              onClick={() => {
                setModoRegistro("register");
                setModoForzadoRegistroDesdeAcceso("");
                setConfirmacionIdentidadActivacion(false);
                limpiarActivacionIdentidadVerificada();
                setAceptaTerminos(false);
                setAceptaPrivacidad(false);
                setDeclaraMayorEdad(false);
                setFormAuth({ ...formAuthReset, pasoVerificacion: 1 });
                setReenvioDisponibleEn(0);
                setModoRecuperar(false);
              }}
            >Registrarse</button>
          </div>
          ) : null}
        </div>
        <div
          className="cuenta-maika-card maika-page-body"
          style={{
            padding: formularioRegistroLargo ? 12 : 20,
            boxSizing: "border-box"
          }}
        >
          {!modoRecuperar && modoRegistro === "register" && formAuth.pasoVerificacion === 1 && (
            <>
              <h3 style={{ color: THEME.goldMain, textAlign: "center", marginBottom: 8, fontSize: 15 }}>
                {adminRegistroSinVerificacion
                  ? "Mismo formulario de registro (sin verificación por email)"
                  : activacionForzadaDesdeAcceso
                    ? "Activa tu cuenta"
                    : "Crea tu cuenta"}
              </h3>
              {adminRegistroSinVerificacion ? (
                <p
                  style={{
                    color: "rgba(255,255,255,0.88)",
                    textAlign: "center",
                    marginTop: -4,
                    marginBottom: 10,
                    fontSize: 12,
                    lineHeight: 1.45
                  }}
                >
                  {embedPanelGestion
                    ? "Se crea la cuenta en el servidor (verificada). Tu sesión actual no cambia; el nuevo usuario puede iniciar sesión con su email y contraseña."
                    : "Sin código por email: registro directo en el servidor e inicio de sesión con el usuario creado."}
                </p>
              ) : null}
              {registroForzadoDesdeAcceso ? (
                <p style={{ color: "rgba(255,255,255,0.9)", textAlign: "center", marginTop: -4, marginBottom: 8, fontWeight: 600, fontSize: 12 }}>
                  {activacionForzadaDesdeAcceso
                    ? "Este número ya tiene actividad. Activa tu cuenta para recuperar el acceso."
                    : "Completa tu registro para activar tu cuenta"}
                </p>
              ) : null}
              {activacionForzadaDesdeAcceso && confirmacionIdentidadActivacion ? (
                <p style={{ color: "#8ad9b2", textAlign: "center", marginTop: -6, marginBottom: 12, fontSize: 13 }}>
                  ✔ Identidad verificada correctamente
                </p>
              ) : null}

              <p style={{ fontSize: 13, color: THEME.goldMain, fontWeight: 700, letterSpacing: 0.4, marginBottom: 12, marginTop: 0 }}>
                Datos personales
              </p>
              {registroForzadoDesdeAcceso ? (
                <div style={{ marginBottom: 15 }}>
                  <label style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", display: "block", marginBottom: 6 }}>
                    Nombre 🔒
                  </label>
                  <input
                    ref={nombreRegistroRef}
                    type="text"
                    value={formAuth.nombre}
                    disabled
                    readOnly
                    aria-readonly="true"
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      emailRegistroRef.current?.focus();
                    }}
                    style={{
                      ...cuentaRegistroDensoInput,
                      opacity: 0.88,
                      cursor: "not-allowed",
                      borderColor: "rgba(201, 162, 74, 0.45)"
                    }}
                  />
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
                    Nombre asociado al pedido (no editable)
                  </div>
                </div>
              ) : (
                <input
                  ref={nombreRegistroRef}
                  type="text"
                  placeholder={
                    ocultarTelefonoYDireccionRegistroRapido ? "Nombre (opcional)" : "Nombre completo *"
                  }
                  value={formAuth.nombre}
                  onChange={(e) => setFormAuth({ ...formAuth, nombre: textoCapitalizadoEnVivo(e.target.value) })}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    if (ocultarTelefonoYDireccionRegistroRapido) {
                      emailRegistroRef.current?.focus();
                    } else {
                      telefonoRegistroRef.current?.focus();
                    }
                  }}
                  style={cuentaRegistroDensoInput}
                />
              )}
              {!ocultarTelefonoYDireccionRegistroRapido ? (
                <>
                  <input
                    ref={telefonoRegistroRef}
                    type="tel"
                    placeholder="Teléfono * (identificador de cuenta)"
                    value={formAuth.telefono}
                    onChange={(e) => {
                      if (registroForzadoDesdeAcceso) return;
                      const nextTel = e.target.value.replace(/\D/g, "").slice(0, 11);
                      setFormAuth({ ...formAuth, telefono: nextTel });
                      evaluarTelefonoDuplicado(nextTel);
                    }}
                    onBlur={(e) => evaluarTelefonoDuplicado(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      emailRegistroRef.current?.focus();
                    }}
                    readOnly={registroForzadoDesdeAcceso}
                    inputMode="numeric"
                    maxLength={11}
                    style={{ ...cuentaRegistroDensoInput, opacity: registroForzadoDesdeAcceso ? 0.82 : 1 }}
                  />
                  {!registroForzadoDesdeAcceso && telefonoDuplicadoRegistro ? (
                    <p style={{ color: "#ffb3b3", fontSize: 11, margin: "-2px 0 6px" }}>
                      Este dispositivo ya conoce ese teléfono. El servidor confirmará si puede registrarse.
                    </p>
                  ) : null}
                  {registroForzadoDesdeAcceso ? (
                    <p style={{ color: "rgba(201,162,74,0.95)", fontSize: 11, margin: "-2px 0 6px" }}>
                      Teléfono verificado: {telefonoForzadoEnmascarado}
                    </p>
                  ) : null}
                </>
              ) : null}
              <input
                ref={emailRegistroRef}
                type="email"
                placeholder={
                  ocultarTelefonoYDireccionRegistroRapido && !adminRegistroSinVerificacion
                    ? "Correo (opcional en desarrollo)"
                    : "Correo electrónico *"
                }
                value={formAuth.confirmEmail}
                required={!isDev || adminRegistroSinVerificacion || registroForzadoDesdeAcceso}
                aria-required={!isDev || adminRegistroSinVerificacion || registroForzadoDesdeAcceso}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormAuth({ ...formAuth, email: v, confirmEmail: v });
                  evaluarEmailDuplicado(v);
                }}
                onBlur={(e) => evaluarEmailDuplicado(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  passwordRegistroRef.current?.focus();
                }}
                style={cuentaRegistroDensoInput}
                autoComplete="email"
              />
              {emailDuplicadoRegistro ? (
                <p style={{ color: "#ffb3b3", fontSize: 11, margin: "-2px 0 6px" }}>
                  Este dispositivo ya conoce ese correo. El servidor confirmará si puede registrarse.
                </p>
              ) : null}
              <div style={cuentaRegistroPasswordWrap}>
                <input
                  ref={passwordRegistroRef}
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña *"
                  value={formAuth.password}
                  onChange={(e) => setFormAuth({ ...formAuth, password: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    confirmPasswordRegistroRef.current?.focus();
                  }}
                  style={cuentaRegistroConOjoStyle}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} style={eyeBtnStyle} title={showPassword ? "Ocultar contraseña" : "Ver contraseña"} aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}>{showPassword ? "🙈" : "👁"}</button>
              </div>
              <RequisitosPasswordHint password={formAuth.password} compact />
              <div style={cuentaRegistroPasswordWrap}>
                <input
                  ref={confirmPasswordRegistroRef}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmar Contraseña *"
                  value={formAuth.confirmPassword}
                  onChange={(e) => setFormAuth({ ...formAuth, confirmPassword: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    if (adminRegistroSinVerificacion) {
                      botonCrearUsuarioGestionRef.current?.click();
                    } else if (registroForzadoDesdeAcceso) {
                      botonEnviarCodigoRegistroRef.current?.click();
                    } else {
                      botonEnviarCodigoRegistroRef.current?.focus();
                    }
                  }}
                  style={cuentaRegistroDensoInput}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} style={eyeBtnStyle} title={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"} aria-label={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}>{showConfirmPassword ? "🙈" : "👁"}</button>
              </div>
              {!adminRegistroSinVerificacion ? (
                <>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      marginTop: 8,
                      fontSize: 12,
                      lineHeight: 1.45,
                      color: "rgba(255,255,255,0.8)",
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={aceptaTerminos}
                      onChange={(e) => setAceptaTerminos(e.target.checked)}
                      style={{ marginTop: 2, accentColor: THEME.goldMain, flexShrink: 0 }}
                    />
                    <span>
                      He leído y acepto los{" "}
                      <Link to="/legal/terminos" target="_blank" style={{ color: THEME.goldMain }}>
                        Términos y Condiciones
                      </Link>
                      . *
                    </span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      marginTop: 4,
                      fontSize: 12,
                      lineHeight: 1.45,
                      color: "rgba(255,255,255,0.8)",
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={aceptaPrivacidad}
                      onChange={(e) => setAceptaPrivacidad(e.target.checked)}
                      style={{ marginTop: 2, accentColor: THEME.goldMain, flexShrink: 0 }}
                    />
                    <span>
                      He leído y acepto la{" "}
                      <Link to="/legal/privacidad" target="_blank" style={{ color: THEME.goldMain }}>
                        Política de Privacidad
                      </Link>
                      . *
                    </span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      marginTop: 4,
                      fontSize: 12,
                      lineHeight: 1.45,
                      color: "rgba(255,255,255,0.8)",
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={declaraMayorEdad}
                      onChange={(e) => setDeclaraMayorEdad(e.target.checked)}
                      style={{ marginTop: 2, accentColor: THEME.goldMain, flexShrink: 0 }}
                    />
                    <span>Declaro que soy mayor de 18 años. *</span>
                  </label>
                </>
              ) : null}
              {adminRegistroSinVerificacion ? (
                <button
                  ref={botonCrearUsuarioGestionRef}
                  type="button"
                  disabled={registroAdminLoading}
                  onClick={async () => {
                    if (!validarRegistroAdminSinVerificacion()) return;
                    setRegistroAdminLoading(true);
                    try {
                      await completarRegistroApiYSesion({
                        quitarQueryAdmin: true,
                        embedGestion: embedPanelGestion
                      });
                    } finally {
                      setRegistroAdminLoading(false);
                    }
                  }}
                  className="checkout-boton-finalizar"
                  style={{
                    ...cuentaCtaPrincipalStyle,
                    marginTop: 12,
                    opacity: registroAdminLoading ? 0.85 : 1,
                    cursor: registroAdminLoading ? "wait" : "pointer"
                  }}
                >
                  {registroAdminLoading
                    ? "Creando cuenta…"
                    : embedPanelGestion
                      ? "Crear usuario (sin verificación por email)"
                      : "Crear cuenta en servidor (sin verificación por email)"}
                </button>
              ) : (
                <button
                  ref={botonEnviarCodigoRegistroRef}
                  onClick={async () => {
                    if (!validarRegistroPaso1ParaApi(false)) return;
                    const emailParaCodigo = (formAuth.email || formAuth.confirmEmail || "").trim().toLowerCase();
                    setEnvioCodigoRegistroCargando(true);
                    try {
                      const r = await solicitarCodigoRegistroApi(emailParaCodigo, declaraMayorEdad);
                      setFormAuth((prev) => ({
                        ...prev,
                        email: emailParaCodigo,
                        confirmEmail: emailParaCodigo,
                        codigoVerificacion: "",
                        codigoIngresado: "",
                        pasoVerificacion: 2
                      }));
                      setReenvioDisponibleEn(60);
                      notificarExito(
                        mostrarNotificacion,
                        r.emailEnviado
                          ? `✅ Código enviado a ${emailParaCodigo}`
                          : "⚠️ No se pudo enviar el email ahora; prueba «Reenviar código» en unos segundos."
                      );
                    } catch (e) {
                      const msg = e instanceof Error ? e.message : "❌ Error al enviar el código";
                      notificarError(mostrarNotificacion, `❌ ${msg}`);
                    } finally {
                      setEnvioCodigoRegistroCargando(false);
                    }
                  }}
                  className="checkout-boton-finalizar"
                  disabled={envioCodigoRegistroCargando}
                  aria-busy={envioCodigoRegistroCargando}
                  style={{
                    ...cuentaCtaPrincipalStyle,
                    marginTop: 12,
                    opacity: envioCodigoRegistroCargando ? 0.85 : 1,
                    cursor: envioCodigoRegistroCargando ? "wait" : "pointer"
                  }}
                >
                  {envioCodigoRegistroCargando
                    ? "Enviando código…"
                    : activacionForzadaDesdeAcceso
                      ? "Enviar código de activación"
                      : "Enviar código de verificación"}
                </button>
              )}
            </>
          )}
          {!modoRecuperar &&
            modoRegistro === "register" &&
            formAuth.pasoVerificacion === 2 && (
            <RegistroVerificarCuentaView
              formAuth={formAuth}
              setFormAuth={setFormAuth}
              activacionForzadaDesdeAcceso={activacionForzadaDesdeAcceso}
              confirmacionIdentidadActivacion={confirmacionIdentidadActivacion}
              telefonoForzadoRegistroDesdeAcceso={telefonoForzadoRegistroDesdeAcceso}
              reenvioDisponibleEn={reenvioDisponibleEn}
              setReenvioDisponibleEn={setReenvioDisponibleEn}
              mostrarNotificacion={mostrarNotificacion}
              declaraMayorEdad={declaraMayorEdad}
              onCompletarRegistro={async (verificacionToken) => { await completarRegistroApiYSesion({ quitarQueryAdmin: false, verificacionToken }); }}
              onVolver={() => { setFormAuth((prev) => ({ ...prev, pasoVerificacion: 1, codigoIngresado: "" })); setReenvioDisponibleEn(0); }}
              cuentaRegistroDensoInput={cuentaRegistroDensoInput}
              cuentaCtaPrincipalStyle={cuentaCtaPrincipalStyle}
              cuentaBotonAuth={cuentaBotonAuth}
            />
          )}
          {!modoRecuperar &&
            modoRegistro === "register" &&
            formAuth.pasoVerificacion !== 1 &&
            formAuth.pasoVerificacion !== 2 && (
            <div style={{ textAlign: "center", padding: "10px 0 6px" }}>
              <p style={{ color: "rgba(255,255,255,0.82)", marginBottom: 10 }}>
                Hubo un salto inesperado del flujo. Pulsa para continuar el registro.
              </p>
              <button
                type="button"
                onClick={() => setFormAuth((prev) => ({ ...prev, pasoVerificacion: 1, codigoIngresado: "" }))}
                className="checkout-boton-finalizar"
                style={{ ...cuentaCtaPrincipalStyle }}
              >
                Continuar registro
              </button>
            </div>
          )}
          {!modoRecuperar && modoRegistro === "login" && (
            <LoginFormView
              formAuth={formAuth}
              setFormAuth={setFormAuth}
              formAuthReset={formAuthReset}
              iniciarSesionConToken={iniciarSesionConToken}
              precargarDatosClienteDesdeUsuario={precargarDatosClienteDesdeUsuario}
              mostrarNotificacion={mostrarNotificacion}
              mostrarAvisoAccesoTemporalLogin={mostrarAvisoAccesoTemporalLogin}
              enlaceRecuperacionMismoNavegador={enlaceRecuperacionMismoNavegador}
              onEnlaceCerrar={() => setEnlaceRecuperacionMismoNavegador(null)}
              onOlvidastePassword={() => { setModoRecuperar(true); }}
              onPostAuthReset={() => {
                setTelefonoForzadoRegistroDesdeAcceso("");
                setModoForzadoRegistroDesdeAcceso("");
                setConfirmacionIdentidadActivacion(false);
                limpiarActivacionIdentidadVerificada();
              }}
              onMarcarReabrirCheckout={marcarReabrirCheckoutTrasAuth}
              cuentaInputWithEyeStyle={cuentaInputWithEyeStyle}
              passwordWrapperStyle={passwordWrapperStyle}
              eyeBtnStyle={eyeBtnStyle}
              cuentaCtaPrincipalStyle={cuentaCtaPrincipalStyle}
            />
          )}
          {modoRecuperar && (
            <RecuperarPasswordView
              onClose={() => setModoRecuperar(false)}
              onEnlaceCambiado={(enlace) => setEnlaceRecuperacionMismoNavegador(enlace)}
              onExitoVolverALogin={(email) => {
                setModoRegistro("login");
                setFormAuth((prev) => ({ ...prev, email, confirmEmail: email, password: "" }));
              }}
              mostrarNotificacion={mostrarNotificacion}
              cuentaBotonAuth={cuentaBotonAuth}
              cuentaCtaPrincipalStyle={cuentaCtaPrincipalStyle}
            />
          )}
        </div>
        </div>
        </div>
      </div>
    );
}
