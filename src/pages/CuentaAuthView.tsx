import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import type { AuthForm, Usuario, Pedido, Pagina } from "../types";
import { checkoutInputStyle, checkoutPrimaryButtonStyleNoShadow } from "../styles/inputStyle";
import BotonCerrar from "../components/BotonCerrar";
import UbicacionCpPanel from "../components/UbicacionCpPanel";
import CalleInputConSugerencias from "../components/CalleInputConSugerencias";
import { THEME } from "../config";
import {
  loginApi,
  LoginApiError,
  registerApi,
  solicitarRecuperacionPasswordApi
} from "../services/apiAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import {
  codigoVerificacionSoloDigitos,
  normalizarTelefono,
  claveTelefonoMaika,
  telefonoRegistradoEnLocal,
  emailRegistradoEnLocal,
  emailValidoLogin,
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
  enviarCodigoEmail: (email: string, nombre: string, codigo: string) => Promise<boolean>;
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
  enviarCodigoEmail,
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
  const [registroAdminLoading, setRegistroAdminLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [, setCambioPasswordAbierto] = useState(false);
  const [loginCargando, setLoginCargando] = useState(false);
  const [verificarRegistroCargando, setVerificarRegistroCargando] = useState(false);
  const prevModoRef = useRef<"login" | "register" | null>(null);
  const nombreRegistroRef = useRef<HTMLInputElement>(null);
  const emailRegistroRef = useRef<HTMLInputElement>(null);
  const passwordRegistroRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRegistroRef = useRef<HTMLInputElement>(null);
  const botonEnviarCodigoRegistroRef = useRef<HTMLButtonElement>(null);
  const botonVerificarRegistroCodigoRef = useRef<HTMLButtonElement>(null);
  const botonCrearUsuarioGestionRef = useRef<HTMLButtonElement>(null);
  const inputCalleRegistroRef = useRef<HTMLInputElement>(null);
  const telefonoRegistroRef = useRef<HTMLInputElement>(null);
  const cpRegistroRef = useRef<HTMLInputElement>(null);
  const numeroRegistroRef = useRef<HTMLInputElement>(null);
  const pisoRegistroRef = useRef<HTMLInputElement>(null);
  const puertaRegistroRef = useRef<HTMLInputElement>(null);
  const bloqueRegistroRef = useRef<HTMLInputElement>(null);
  const escaleraRegistroRef = useRef<HTMLInputElement>(null);
  const emailLoginRef = useRef<HTMLInputElement>(null);
  const passwordLoginRef = useRef<HTMLInputElement>(null);
  const botonLoginRef = useRef<HTMLButtonElement>(null);
  const emailRecuperarRef = useRef<HTMLInputElement>(null);
  const botonRecuperarRef = useRef<HTMLButtonElement>(null);
  const codigoRecuperarRef = useRef<HTMLInputElement>(null);
  const nuevaPasswordRecuperarRef = useRef<HTMLInputElement>(null);
  const botonActualizarPasswordRef = useRef<HTMLButtonElement>(null);

  // Estados para recuperar contraseña
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [pasoRecuperar, setPasoRecuperar] = useState(1);
  const [emailRecuperar, setEmailRecuperar] = useState("");
  const [codigoRecuperar, setCodigoRecuperar] = useState("");
  const [codigoIngresadoRecuperar, setCodigoIngresadoRecuperar] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [showNuevaPassword, setShowNuevaPassword] = useState(false);
  const [cuentaAtrasRecuperar, setCuentaAtrasRecuperar] = useState(0);
  const [recuperarEnlaceEnviando, setRecuperarEnlaceEnviando] = useState(false);
  /** Enlace para abrir en el mismo navegador (Chrome); el correo suele abrir Brave en Windows. */
  const [enlaceRecuperacionMismoNavegador, setEnlaceRecuperacionMismoNavegador] = useState<string | null>(null);
  const [envioCodigoRegistroCargando, setEnvioCodigoRegistroCargando] = useState(false);
  const [reenviandoCodigoRegistro, setReenviandoCodigoRegistro] = useState(false);
  const claveUsuario = claveTelefonoMaika(usuario?.telefono || "");
  const [, setMaikaPedidosUsuario] = useState<MaikaPedidoLS[]>([]);
  const [mostrarCamposOpcionalesRegistro, setMostrarCamposOpcionalesRegistro] = useState(false);
  const [, setMostrarBannerCompletarPerfil] = useState(false);
  const [telefonoDuplicadoRegistro, setTelefonoDuplicadoRegistro] = useState(false);
  const [emailDuplicadoRegistro, setEmailDuplicadoRegistro] = useState(false);
  const [calleRegistroResetSignal, setCalleRegistroResetSignal] = useState(0);
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
  useEffect(() => {
    if (cuentaAtrasRecuperar <= 0) return;
    const t = window.setTimeout(() => {
      setCuentaAtrasRecuperar((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(t);
  }, [cuentaAtrasRecuperar]);

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
      const requiereDireccion = !registroForzadoDesdeAcceso;
      if (!formAuth.nombre || !formAuth.telefono || !formAuth.password || !formAuth.confirmPassword) {
        notificarError(mostrarNotificacion, "❌ Completa todos los campos obligatorios");
        return false;
      }
      const emailParaCodigo = (formAuth.email || formAuth.confirmEmail || "").trim().toLowerCase();
      if (!tieneEmailVerificable(emailParaCodigo)) {
        notificarError(mostrarNotificacion, "❌ Indica un correo electrónico válido");
        return false;
      }
      if (
        requiereDireccion &&
        (!formAuth.calle || !formAuth.numero || !formAuth.cp || !formAuth.provincia || !formAuth.poblacion || !formAuth.pais)
      ) {
        notificarError(mostrarNotificacion, "❌ Completa todos los campos obligatorios");
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
      mostrarNotificacion
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
      setModoRegistro
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
        setCalleRegistroResetSignal((n) => n + 1);
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
                setFormAuth({ ...formAuthReset, pasoVerificacion: 1 });
                setReenvioDisponibleEn(0);
                setModoRecuperar(false);
                setCalleRegistroResetSignal((n) => n + 1);
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
                      cpRegistroRef.current?.focus();
                    }
                  }}
                  style={cuentaRegistroDensoInput}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} style={eyeBtnStyle} title={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"} aria-label={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}>{showConfirmPassword ? "🙈" : "👁"}</button>
              </div>
              {!registroForzadoDesdeAcceso && !ocultarTelefonoYDireccionRegistroRapido && (
                <>
                  <p style={{ fontSize: 12, color: THEME.goldMain, fontWeight: 700, letterSpacing: 0.4, marginBottom: 6, marginTop: 10 }}>
                    Dirección de envío
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: -4, marginBottom: 8 }}>
                    Usaremos esta dirección como principal para tus pedidos.
                  </p>
                  <div style={{ marginBottom: 0 }}>
                    <UbicacionCpPanel
                      namePrefix="maika-registro"
                      layoutUbicacion="stack"
                      cpInputRef={cpRegistroRef}
                      cp={formAuth.cp || ""}
                      onCpChange={(next) => {
                        setFormAuth((prev) => ({
                          ...prev,
                          cp: next,
                          ...(next.length < 5 ? { poblacion: "", provincia: "", pais: "" } : {})
                        }));
                      }}
                      onCpKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        inputCalleRegistroRef.current?.focus();
                      }}
                      poblacion={formAuth.poblacion || ""}
                      provincia={formAuth.provincia || ""}
                      pais={formAuth.pais || ""}
                      inputStyle={cuentaRegistroDensoInput}
                    />
                  </div>
                  {/*
                    Misma proporción en las dos filas: columna principal flexible + 96px fijos
                    (alinea Puerta bajo N.º sin depender del grid con celdas de altura distinta).
                  */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      marginTop: 8,
                      marginBottom: 0,
                      maxWidth: "100%"
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", width: "100%" }}>
                      <div style={{ flex: "1 1 0", minWidth: 0, width: "100%" }}>
                        <CalleInputConSugerencias
                          name="maika-registro-calle"
                          placeholder="Calle *"
                          value={formAuth.calle || ""}
                          onValueChange={(v) => setFormAuth((prev) => ({ ...prev, calle: v }))}
                          onMergeCampos={(patch) => setFormAuth((prev) => ({ ...prev, ...patch }))}
                          cp={formAuth.cp || ""}
                          poblacion={formAuth.poblacion || ""}
                          inputStyle={cuentaRegistroDensoInput}
                          forwardedRef={inputCalleRegistroRef}
                          attachGooglePlaces={modoRegistro === "register" && (!usuario || adminRegistroSinVerificacion)}
                          resetSignal={calleRegistroResetSignal}
                          onInputKeyDown={(e) => {
                            if (e.key !== "Enter") return;
                            e.preventDefault();
                            numeroRegistroRef.current?.focus();
                          }}
                        />
                      </div>
                      <input
                        ref={numeroRegistroRef}
                        type="text"
                        name="maika-registro-numero"
                        placeholder="N.º *"
                        className="checkout-mini-placeholder"
                        autoComplete="off"
                        value={formAuth.numero}
                        onChange={(e) => setFormAuth({ ...formAuth, numero: e.target.value.toUpperCase() })}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          e.preventDefault();
                          pisoRegistroRef.current?.focus();
                        }}
                        style={{
                          ...cuentaRegistroDensoInput,
                          textTransform: "uppercase",
                          marginBottom: 0,
                          marginTop: 0,
                          width: 96,
                          minWidth: 96,
                          maxWidth: 96,
                          flexShrink: 0,
                          boxSizing: "border-box",
                          textAlign: "center"
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", width: "100%" }}>
                      <input
                        ref={pisoRegistroRef}
                        type="text"
                        name="maika-registro-piso"
                        placeholder="Piso"
                        className="checkout-mini-placeholder"
                        autoComplete="off"
                        value={formAuth.piso}
                        onChange={(e) => setFormAuth({ ...formAuth, piso: e.target.value.toUpperCase() })}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          e.preventDefault();
                          puertaRegistroRef.current?.focus();
                        }}
                        style={{
                          ...cuentaRegistroDensoInput,
                          textTransform: "uppercase",
                          marginBottom: 0,
                          flex: "1 1 0",
                          minWidth: 0,
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "6px 9px",
                          fontSize: 12,
                          lineHeight: 1.25
                        }}
                      />
                      <input
                        ref={puertaRegistroRef}
                        type="text"
                        name="maika-registro-puerta"
                        placeholder="Puerta"
                        className="checkout-mini-placeholder"
                        autoComplete="off"
                        value={formAuth.puerta}
                        onChange={(e) => setFormAuth({ ...formAuth, puerta: e.target.value.toUpperCase() })}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          e.preventDefault();
                          if (mostrarCamposOpcionalesRegistro) {
                            bloqueRegistroRef.current?.focus();
                          } else {
                            botonEnviarCodigoRegistroRef.current?.focus();
                          }
                        }}
                        style={{
                          ...cuentaRegistroDensoInput,
                          textTransform: "uppercase",
                          marginBottom: 0,
                          width: 96,
                          minWidth: 96,
                          maxWidth: 96,
                          flexShrink: 0,
                          boxSizing: "border-box",
                          textAlign: "center",
                          padding: "6px 9px",
                          fontSize: 12,
                          lineHeight: 1.25
                        }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMostrarCamposOpcionalesRegistro((prev) => !prev)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: `1px solid ${THEME.goldMain}`,
                      background: "rgba(255,255,255,0.04)",
                      color: THEME.goldMain,
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: 13,
                      marginTop: 10,
                      marginBottom: mostrarCamposOpcionalesRegistro ? 6 : 4
                    }}
                  >
                    {mostrarCamposOpcionalesRegistro ? "Ocultar bloque y escalera" : "Añadir bloque o escalera"}
                  </button>
                  {!mostrarCamposOpcionalesRegistro ? (
                    <p
                      style={{
                        margin: "0 0 8px",
                        fontSize: 11,
                        lineHeight: 1.35,
                        color: "rgba(255,255,255,0.52)",
                        textAlign: "center"
                      }}
                    >
                      Opcional: solo si tu vivienda lo necesita
                    </p>
                  ) : null}
                  {mostrarCamposOpcionalesRegistro && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                        gap: 8,
                        marginBottom: 6,
                        maxWidth: "100%"
                      }}
                    >
                      <input
                        ref={bloqueRegistroRef}
                        type="text"
                        name="maika-registro-bloque"
                        placeholder="Bloque"
                        autoComplete="off"
                        value={formAuth.bloque}
                        onChange={(e) => setFormAuth({ ...formAuth, bloque: e.target.value.toUpperCase() })}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          e.preventDefault();
                          escaleraRegistroRef.current?.focus();
                        }}
                        style={{ ...cuentaRegistroDensoInput, textTransform: "uppercase", marginBottom: 0 }}
                      />
                      <input
                        ref={escaleraRegistroRef}
                        type="text"
                        name="maika-registro-escalera"
                        placeholder="Escalera"
                        autoComplete="off"
                        value={formAuth.escalera}
                        onChange={(e) => setFormAuth({ ...formAuth, escalera: e.target.value.toUpperCase() })}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          e.preventDefault();
                          botonEnviarCodigoRegistroRef.current?.focus();
                        }}
                        style={{ ...cuentaRegistroDensoInput, textTransform: "uppercase", marginBottom: 0 }}
                      />
                    </div>
                  )}
                </>
              )}
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
                    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
                    setEnvioCodigoRegistroCargando(true);
                    try {
                      const enviado = await enviarCodigoEmail(emailParaCodigo, formAuth.nombre, codigo);
                      if (enviado) {
                        setFormAuth((prev) => ({
                          ...prev,
                          email: emailParaCodigo,
                          confirmEmail: emailParaCodigo,
                          codigoVerificacion: codigo,
                          codigoIngresado: "",
                          pasoVerificacion: 2
                        }));
                        setReenvioDisponibleEn(60);
                        notificarExito(mostrarNotificacion, `✅ Código enviado a ${emailParaCodigo}`);
                      } else {
                        notificarError(mostrarNotificacion, "❌ Error al enviar el código. Revisa la consola (F12)");
                      }
                    } catch {
                      notificarError(mostrarNotificacion, "❌ Error al enviar el código");
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
            <>
              <h3 style={{ color: THEME.goldMain, textAlign: "center", marginBottom: 8, fontSize: 15 }}>
                {activacionForzadaDesdeAcceso ? "Paso 2: Activar cuenta" : "Paso 2: Verificar cuenta"}
              </h3>
              <p style={{ color: "white", textAlign: "center", marginBottom: 8, fontSize: 13 }}>{formAuth.email?.trim() ? `Hemos enviado un código a ${formAuth.email}` : "Introduce el código que te hemos mostrado"}</p>
              <p style={{ color: "white", textAlign: "center", fontSize: 12, marginTop: -4, marginBottom: 10, opacity: 0.85 }}>{formAuth.email?.trim() ? "El mensaje suele llegar en menos de 1 minuto. Revisa también spam." : "Si no lo anotaste, vuelve atrás y pon un email para recibir el código."}</p>
              <input
                type="text"
                placeholder="Código de 6 dígitos"
                value={formAuth.codigoIngresado || ""}
                onChange={(e) => setFormAuth({ ...formAuth, codigoIngresado: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  if (!verificarRegistroCargando) botonVerificarRegistroCodigoRef.current?.click();
                }}
                style={cuentaRegistroDensoInput}
              />
              <button
                ref={botonVerificarRegistroCodigoRef}
                type="button"
                disabled={verificarRegistroCargando}
                aria-busy={verificarRegistroCargando}
                onClick={async () => {
                  const esperado = codigoVerificacionSoloDigitos(formAuth.codigoVerificacion || "");
                  const ingresado = codigoVerificacionSoloDigitos(formAuth.codigoIngresado || "");
                  if (!esperado) {
                    notificarError(
                      mostrarNotificacion,
                      "❌ No hay código activo. Vuelve al paso anterior y pulsa «Enviar código» o «Reenviar código»."
                    );
                    return;
                  }
                  if (ingresado.length < 6 || ingresado !== esperado) {
                    notificarError(mostrarNotificacion, "❌ Código incorrecto");
                    return;
                  }
                  if (
                    activacionForzadaDesdeAcceso &&
                    !confirmacionIdentidadActivacion &&
                    !esActivacionIdentidadVerificadaEnSession(telefonoForzadoRegistroDesdeAcceso)
                  ) {
                    notificarError(
                      mostrarNotificacion,
                      "❌ Debes verificar tu identidad desde el acceso rápido del checkout (código del último pedido) antes de activar la cuenta."
                    );
                    return;
                  }
                  setVerificarRegistroCargando(true);
                  try {
                    await completarRegistroApiYSesion({ quitarQueryAdmin: false });
                  } finally {
                    setVerificarRegistroCargando(false);
                  }
                }}
                className="checkout-boton-finalizar"
                style={{
                  ...cuentaCtaPrincipalStyle,
                  marginTop: 10,
                  opacity: verificarRegistroCargando ? 0.85 : 1,
                  cursor: verificarRegistroCargando ? "wait" : "pointer"
                }}
              >
                {verificarRegistroCargando
                  ? "Procesando…"
                  : activacionForzadaDesdeAcceso
                    ? "Verificar y activar cuenta"
                    : "Verificar y completar registro"}
              </button>
              <button
                onClick={async () => {
                  if (reenvioDisponibleEn > 0 || reenviandoCodigoRegistro) return;
                  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
                  const emailR = (formAuth.email || "").trim().toLowerCase();
                  if (!tieneEmailVerificable(emailR)) {
                    notificarError(mostrarNotificacion, "❌ Debes indicar un email válido para reenviar el código");
                    return;
                  }
                  setReenviandoCodigoRegistro(true);
                  try {
                    const enviado = await enviarCodigoEmail(emailR, formAuth.nombre, codigo);
                    if (enviado) {
                      setFormAuth((prev) => ({
                        ...prev,
                        email: emailR,
                        confirmEmail: emailR,
                        codigoVerificacion: codigo,
                        codigoIngresado: "",
                        pasoVerificacion: 2
                      }));
                      setReenvioDisponibleEn(60);
                      notificarExito(mostrarNotificacion, `✅ Nuevo código enviado a ${emailR}`);
                    } else {
                      notificarError(mostrarNotificacion, "❌ No se pudo reenviar el código");
                    }
                  } finally {
                    setReenviandoCodigoRegistro(false);
                  }
                }}
                disabled={reenvioDisponibleEn > 0 || reenviandoCodigoRegistro}
                style={{
                  ...cuentaBotonAuth,
                  background: reenvioDisponibleEn > 0 ? "#666" : "rgba(255,255,255,0.04)",
                  color: THEME.goldMain,
                  border: "1px solid rgba(212, 175, 55, 0.45)",
                  cursor: reenvioDisponibleEn > 0 || reenviandoCodigoRegistro ? "wait" : "pointer",
                  fontSize: 14,
                  marginTop: 10,
                  opacity: reenvioDisponibleEn > 0 || reenviandoCodigoRegistro ? 0.85 : 1
                }}
              >
                {reenviandoCodigoRegistro
                  ? "Reenviando…"
                  : reenvioDisponibleEn > 0
                    ? `Reenviar código en ${reenvioDisponibleEn}s`
                    : "Reenviar código"}
              </button>
              <button type="button" onClick={() => { setFormAuth((prev) => ({ ...prev, pasoVerificacion: 1, codigoIngresado: "" })); setReenvioDisponibleEn(0); }} style={{ ...cuentaBotonAuth, background: "transparent", color: THEME.goldMain, border: "1px solid rgba(212, 175, 55, 0.45)", marginTop: 10 }}>← Volver</button>
            </>
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
          {!modoRecuperar && modoRegistro === "login" && enlaceRecuperacionMismoNavegador ? (
            <div
              role="region"
              aria-label="Enlace de recuperación en este navegador"
              style={{
                marginBottom: 16,
                padding: "14px 16px",
                borderRadius: 12,
                border: `1px solid ${THEME.goldMain}`,
                background: "rgba(11, 11, 13, 0.92)",
                textAlign: "center"
              }}
            >
              <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, lineHeight: 1.45, margin: "0 0 12px" }}>
                El correo no se pudo enviar. Abre el enlace en <strong>este navegador</strong>:
              </p>
              <a
                href={enlaceRecuperacionMismoNavegador}
                className="checkout-boton-finalizar"
                style={{
                  ...cuentaCtaPrincipalStyle,
                  display: "inline-block",
                  textDecoration: "none",
                  marginBottom: 10
                }}
              >
                Restablecer contraseña aquí
              </a>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(enlaceRecuperacionMismoNavegador).then(
                      () => notificarExito(mostrarNotificacion, "Enlace copiado"),
                      () => notificarError(mostrarNotificacion, "No se pudo copiar")
                    );
                  }}
                  style={{
                    background: "transparent",
                    border: `1px solid ${THEME.goldMain}`,
                    color: THEME.goldMain,
                    borderRadius: 8,
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: 13
                  }}
                >
                  Copiar enlace
                </button>
                <button
                  type="button"
                  onClick={() => setEnlaceRecuperacionMismoNavegador(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(255,255,255,0.55)",
                    cursor: "pointer",
                    fontSize: 13,
                    textDecoration: "underline"
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : null}
          {!modoRecuperar && modoRegistro === "login" && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                void (async () => {
                const identificadorNorm = (formAuth.email || "").trim().toLowerCase();
                if (!identificadorNorm || !formAuth.password) {
                  notificarError(mostrarNotificacion, "❌ Introduce correo/teléfono y contraseña");
                  return;
                }
                setLoginCargando(true);
                try {
                  const auth = await loginApi(identificadorNorm, formAuth.password);
                  marcarReabrirCheckoutTrasAuth();
                  const usuarioSesion = await iniciarSesionConToken(auth.token);
                  if (usuarioSesion) {
                    precargarDatosClienteDesdeUsuario(usuarioSesion);
                    notificarExito(mostrarNotificacion, `✅ Bienvenido ${usuarioSesion.nombre}`);
                  } else {
                    notificarExito(mostrarNotificacion, "Sesión iniciada. Cargando tus datos guardados…");
                  }
                  setTelefonoForzadoRegistroDesdeAcceso("");
                  setModoForzadoRegistroDesdeAcceso("");
                  setConfirmacionIdentidadActivacion(false);
                  limpiarActivacionIdentidadVerificada();
                  setFormAuth(formAuthReset);
                } catch (err) {
                  if (err instanceof LoginApiError) {
                    if (err.status === 401 || err.status === 403) {
                      notificarError(mostrarNotificacion, "❌ Correo/teléfono o contraseña incorrectos.");
                    } else if (err.status === 404) {
                      notificarError(
                        mostrarNotificacion,
                        "❌ No existe una cuenta con ese correo/teléfono en el servidor. Regístrate primero."
                      );
                    } else {
                      notificarError(mostrarNotificacion, `❌ Error del servidor (${err.status}).`);
                    }
                    return;
                  }
                  const e = err instanceof Error ? err : new Error(String(err));
                  const falloRed =
                    e instanceof TypeError ||
                    /failed to fetch|networkerror|load failed|aborted|timeout/i.test(e.message);
                  if (falloRed) {
                    notificarError(
                      mostrarNotificacion,
                      "❌ No se alcanza la API (:3001). Si solo tienes Vite, arranca también el servidor: «npm run dev:full» o en otra terminal «npm run backend:dev». En red Wi‑Fi, configura apiBaseUrl en public/maika-api.json."
                    );
                    return;
                  }
                  notificarError(mostrarNotificacion, `❌ ${e.message}`);
                } finally {
                  setLoginCargando(false);
                }
                })();
              }} 
              autoComplete="off"
            >
              <input
                ref={emailLoginRef}
                type="text"
                placeholder="Correo o teléfono"
                value={formAuth.email}
                disabled={loginCargando}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormAuth({ ...formAuth, email: v, confirmEmail: v });
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  passwordLoginRef.current?.focus();
                }}
                style={{ ...cuentaInputStyle, opacity: loginCargando ? 0.85 : 1 }}
                autoComplete="off"
                name="login-email"
              />
              <div style={passwordWrapperStyle}>
                <input
                  ref={passwordLoginRef}
                  type={showPasswordLogin ? "text" : "password"}
                  placeholder="Contraseña"
                  value={formAuth.password}
                  disabled={loginCargando}
                  onChange={(e) => setFormAuth({ ...formAuth, password: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    botonLoginRef.current?.click();
                  }}
                  style={{ ...cuentaInputWithEyeStyle, opacity: loginCargando ? 0.85 : 1 }}
                  autoComplete="new-password"
                  name="login-password"
                />
                <button
                  type="button"
                  disabled={loginCargando}
                  onClick={() => setShowPasswordLogin((v) => !v)}
                  style={{ ...eyeBtnStyle, opacity: loginCargando ? 0.5 : 1, cursor: loginCargando ? "not-allowed" : "pointer" }}
                  title={showPasswordLogin ? "Ocultar contraseña" : "Ver contraseña"}
                  aria-label={showPasswordLogin ? "Ocultar contraseña" : "Ver contraseña"}
                >{showPasswordLogin ? "🙈" : "👁"}</button>
              </div>
              {mostrarAvisoAccesoTemporalLogin ? (
                <p style={{ color: "rgba(255,255,255,0.62)", fontSize: 11, margin: "-4px 0 10px", lineHeight: 1.35 }}>
                  Acceso temporal activo para esta cuenta: usa la contraseña recibida. Caduca a los 10 minutos y después deberás cambiarla en Mi Cuenta.
                </p>
              ) : null}
              <button
                ref={botonLoginRef}
                type="submit"
                disabled={loginCargando}
                aria-busy={loginCargando}
                className="checkout-boton-finalizar"
                style={{
                  ...cuentaCtaPrincipalStyle,
                  cursor: loginCargando ? "wait" : "pointer",
                  marginTop: 10,
                  opacity: loginCargando ? 0.88 : 1,
                  filter: loginCargando ? "brightness(0.92)" : undefined
                }}
              >{loginCargando ? "Entrando…" : "Iniciar Sesión"}</button>
              <div style={{ textAlign: "center", marginTop: 15 }}>
                <button type="button" onClick={() => { 
                  setModoRecuperar(true); 
                  setPasoRecuperar(1); 
                  setEmailRecuperar("");
                  setCodigoIngresadoRecuperar(""); 
                  setNuevaPassword("");
                  setCuentaAtrasRecuperar(0);
                }} style={{ background: "none", border: "none", color: THEME.goldMain, cursor: "pointer", textDecoration: "underline", fontSize: 14 }}>¿Olvidaste tu contraseña?</button>
              </div>
            </form>
          )}
          {modoRecuperar && (
            <>
              {pasoRecuperar === 1 && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const emailNorm = (emailRecuperar || "").trim().toLowerCase();
                    if (!emailValidoLogin(emailNorm)) { notificarError(mostrarNotificacion, "❌ Introduce un e-mail válido"); return; }
                    setRecuperarEnlaceEnviando(true);
                    try {
                      const res = await solicitarRecuperacionPasswordApi(emailNorm);
                      setEmailRecuperar(emailNorm);
                      setCodigoRecuperar("");
                      setCodigoIngresadoRecuperar("");
                      setNuevaPassword("");
                      setCuentaAtrasRecuperar(0);
                      if (res.devEmailFallo && (res.sameBrowserResetLink || res.devResetLink)) {
                        setEnlaceRecuperacionMismoNavegador(
                          res.sameBrowserResetLink || res.devResetLink || null
                        );
                        notificarExito(
                          mostrarNotificacion,
                          "⚠️ El correo no se envió. Usa el botón de abajo en este navegador."
                        );
                      } else {
                        setEnlaceRecuperacionMismoNavegador(null);
                        notificarExito(
                          mostrarNotificacion,
                          "✅ Revisa el correo y pulsa el enlace: se abrirá Chrome. Permanece aquí en Mi cuenta."
                        );
                      }
                      setModoRecuperar(false);
                      setModoRegistro("login");
                      setFormAuth((prev) => ({ ...prev, email: emailNorm, confirmEmail: emailNorm, password: "" }));
                    } catch {
                      notificarError(mostrarNotificacion, "❌ No se pudo solicitar la recuperación. Inténtalo más tarde.");
                    } finally {
                      setRecuperarEnlaceEnviando(false);
                    }
                  }}
                  autoComplete="off"
                >
                  <h3 style={{ color: THEME.goldMain, textAlign: "center", marginBottom: 20 }}>Recuperar contraseña</h3>
                  <p style={{ color: "white", textAlign: "center", marginBottom: 20 }}>Introduce el e-mail de tu cuenta y te enviaremos un enlace seguro.</p>
                  <input
                    ref={emailRecuperarRef}
                    type="email"
                    placeholder="E-mail"
                    value={emailRecuperar}
                    onChange={(e) => setEmailRecuperar(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      botonRecuperarRef.current?.click();
                    }}
                    style={cuentaInputStyle}
                    autoComplete="email"
                    name="email-recuperacion"
                  />
                  <button
                    ref={botonRecuperarRef}
                    type="submit"
                    disabled={recuperarEnlaceEnviando}
                    className="checkout-boton-finalizar"
                    style={{
                      ...cuentaCtaPrincipalStyle,
                      marginTop: 10,
                      opacity: recuperarEnlaceEnviando ? 0.88 : 1,
                      cursor: recuperarEnlaceEnviando ? "wait" : "pointer"
                    }}
                  >{recuperarEnlaceEnviando ? "Enviando…" : "Enviar enlace seguro"}</button>
                  <button type="button" onClick={() => setModoRecuperar(false)} style={{ ...cuentaBotonAuth, background: "transparent", color: THEME.goldMain, border: "1px solid rgba(212, 175, 55, 0.45)", marginTop: 10 }}>← Cancelar</button>
                </form>
              )}
              {pasoRecuperar === 2 && (
                <>
                  <h3 style={{ color: THEME.goldMain, textAlign: "center", marginBottom: 20 }}>Cambiar contraseña</h3>
                  <p style={{ color: "white", textAlign: "center", marginBottom: 8 }}>Introduce el código y tu nueva contraseña</p>
                  <p style={{ color: "rgba(255,255,255,0.8)", textAlign: "center", marginBottom: 16, fontSize: 13 }}>
                    Código válido durante {cuentaAtrasRecuperar}s
                  </p>
                  {cuentaAtrasRecuperar <= 0 && (
                    <p style={{ color: "#ffb3b3", textAlign: "center", marginTop: -8, marginBottom: 14, fontSize: 13 }}>
                      El código ha expirado. Solicita uno nuevo.
                    </p>
                  )}
                  <input
                    ref={codigoRecuperarRef}
                    type="text"
                    placeholder="Código de verificación"
                    value={codigoIngresadoRecuperar}
                    onChange={(e) => setCodigoIngresadoRecuperar(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      nuevaPasswordRecuperarRef.current?.focus();
                    }}
                    style={cuentaInputStyle}
                    autoComplete="off"
                    name="codigo-recuperacion"
                  />
                  <div style={passwordWrapperStyle}>
                    <input
                      ref={nuevaPasswordRecuperarRef}
                      type={showNuevaPassword ? "text" : "password"}
                      placeholder="Nueva Contraseña"
                      value={nuevaPassword}
                      onChange={(e) => setNuevaPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        botonActualizarPasswordRef.current?.click();
                      }}
                      style={cuentaInputWithEyeStyle}
                      autoComplete="new-password"
                      name="nueva-password"
                    />
                    <button type="button" onClick={() => setShowNuevaPassword((v) => !v)} style={eyeBtnStyle} title={showNuevaPassword ? "Ocultar contraseña" : "Ver contraseña"} aria-label={showNuevaPassword ? "Ocultar contraseña" : "Ver contraseña"}>{showNuevaPassword ? "🙈" : "👁"}</button>
                  </div>
                  <RequisitosPasswordHint password={nuevaPassword} />
                  <button
                    ref={botonActualizarPasswordRef}
                    onClick={async () => {
                      if (!codigoIngresadoRecuperar || !nuevaPassword) { notificarError(mostrarNotificacion, "❌ Completa todos los campos"); return; }
                      if (cuentaAtrasRecuperar <= 0) { notificarError(mostrarNotificacion, "❌ Código expirado. Reenvía uno nuevo"); return; }
                      if (!passwordSeguraBasica(nuevaPassword)) {
                        notificarError(mostrarNotificacion, "❌ La contraseña debe tener mínimo 8 caracteres, con letras y números");
                        return;
                      }
                      if (codigoIngresadoRecuperar !== codigoRecuperar) { notificarError(mostrarNotificacion, "❌ Código incorrecto"); return; }
                      const emailNorm = (emailRecuperar || "").trim().toLowerCase();
                      if (!emailValidoLogin(emailNorm)) {
                        notificarError(mostrarNotificacion, "❌ E-mail no válido");
                        return;
                      }
                      try {
                        await solicitarRecuperacionPasswordApi(emailNorm);
                        notificarExito(
                          mostrarNotificacion,
                          "✅ Te hemos enviado un enlace seguro para crear tu contraseña. Revisa tu correo."
                        );
                        setModoRecuperar(false);
                        setPasoRecuperar(1);
                        setCuentaAtrasRecuperar(0);
                        setCodigoIngresadoRecuperar("");
                        setNuevaPassword("");
                        setModoRegistro("login");
                        setFormAuth((prev) => ({
                          ...prev,
                          email: emailNorm,
                          confirmEmail: emailNorm,
                          password: ""
                        }));
                      } catch (err) {
                        const msg = err instanceof Error ? err.message : String(err);
                        if (/\(404\)/.test(msg)) {
                          notificarError(
                            mostrarNotificacion,
                            "❌ No hay cuenta con ese correo en el servidor. Regístrate primero."
                          );
                          return;
                        }
                        notificarError(mostrarNotificacion, `❌ ${msg}`);
                      }
                    }}
                    className="checkout-boton-finalizar"
                    style={{ ...cuentaCtaPrincipalStyle, marginTop: 10 }}
                  >Cambiar contraseña</button>
                  <button
                    type="button"
                    disabled={cuentaAtrasRecuperar > 0}
                    onClick={async () => {
                      const emailNorm = (emailRecuperar || "").trim().toLowerCase();
                      if (!emailValidoLogin(emailNorm)) { notificarError(mostrarNotificacion, "❌ E-mail no válido"); return; }
                      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
                      setCodigoRecuperar(codigo);
                      setCodigoIngresadoRecuperar("");
                      setCuentaAtrasRecuperar(90);
                      const enviado = await enviarCodigoEmail(emailNorm, emailNorm.split("@")[0] || "Usuario", codigo);
                      if (enviado) notificarExito(mostrarNotificacion, `✅ Nuevo código enviado a ${emailNorm}`);
                      else notificarError(mostrarNotificacion, "❌ Error al reenviar el código");
                    }}
                    style={{ ...cuentaBotonAuth, background: cuentaAtrasRecuperar > 0 ? "#666" : "rgba(255,255,255,0.04)", color: THEME.goldMain, border: "1px solid rgba(212, 175, 55, 0.45)", cursor: cuentaAtrasRecuperar > 0 ? "not-allowed" : "pointer", marginTop: 10 }}
                  >
                    {cuentaAtrasRecuperar > 0 ? `Reenviar código en ${cuentaAtrasRecuperar}s` : "Reenviar código"}
                  </button>
                  <button type="button" onClick={() => { setPasoRecuperar(1); setEmailRecuperar(""); setCuentaAtrasRecuperar(0); }} style={{ ...cuentaBotonAuth, background: "transparent", color: THEME.goldMain, border: "1px solid rgba(212, 175, 55, 0.45)", marginTop: 10 }}>← Volver</button>
                </>
              )}
            </>
          )}
        </div>
        </div>
        </div>
      </div>
    );
}