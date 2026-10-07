import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import type { AuthForm, Usuario, Pedido, Pagina, Cliente, DireccionUsuario } from "../types";
import { checkoutInputStyle, checkoutPrimaryButtonStyleNoShadow } from "../styles/inputStyle";
import BotonCerrar from "../components/BotonCerrar";
import { GUEST_CART_PENDING_KEY, THEME } from "../config";
import { parseFechaPedido } from "../utils/fechaPedido";
import {
  cambiarPasswordAutenticadoApi,
  hasClientSession,
} from "../services/apiAuth";
import { limpiarClavesSesionEnLocalStorage } from "../services/apiAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DIRECCIONES_MAX } from "../app/routing/routeMaps";
import { normalizarDireccionesUsuario } from "../utils/direcciones";
import { resolverUsoDireccionCheckout } from "../utils/checkoutDireccionesActions";
import { leerMaikaUsuarios, guardarMaikaUsuarios } from "../utils/maikaUsuarios";
import { claveTelefonoES, normalizarTelefonoES9 } from "../utils/telefono";
import { notificarError, notificarExito } from "../utils/ui/notificaciones";
import { perfilUsuarioPayloadDesdeMaika } from "../utils/perfilPayloadDesdeMaika";
import { actualizarPerfilOEncolar } from "../utils/perfilOfflineQueue";
import { prepareDireccionesParaGuardar } from "../utils/prepareDireccionesParaGuardar";
import {
  esActivacionIdentidadVerificadaEnSession,
  limpiarActivacionIdentidadVerificada,
  marcarActivacionIdentidadVerificada,
} from "../utils/activacionIdentidadSession";
import {
  validarCodigoUltimoPedido
} from "../utils/accesoRapidoVerificacion";
import { crearFormAuthRegistroDesdeAcceso } from "../utils/authForms";
import { tieneEmailRealMaika } from "../utils/emailTecnicoMaika";

import CambioPasswordTemporalModal from "../components/CambioPasswordTemporalModal";
import CambioPasswordSection from "./cuenta/CambioPasswordSection";
import DireccionesSection from "./cuenta/DireccionesSection";
import MisPedidosSection from "./cuenta/MisPedidosSection";
import PedidoDetalleModal from "./cuenta/PedidoDetalleModal";
import ActivarEmailModal from "./cuenta/ActivarEmailModal";
import CuentaAuthView from "./CuentaAuthView";
import {
  normalizarTelefono,
  claveTelefonoMaika,
  passwordSeguraBasica,
  direccionCuentaEnDosLineas,
  cargarPedidosUsuario,
  tituloMesPedido,
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
export default function CuentaPage(props: CuentaPageProps) {
  const {
  setFormAuth,
  modoRegistro,
  setModoRegistro,
  usuario,
  setUsuario,
  setReenvioDisponibleEn,
  mostrarNotificacion,
  precargarDatosClienteDesdeUsuario,
  onRepetirPedido,
  setPagina,
  telefonoForzadoRegistroDesdeAcceso,
  setTelefonoForzadoRegistroDesdeAcceso,
  setModoForzadoRegistroDesdeAcceso,
  confirmacionIdentidadActivacion,
  setConfirmacionIdentidadActivacion,
  embedPanelGestion = false,
  adminRegistroSinVerificacionOverride,
  } = props;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const adminRegistroSinVerificacion =
    adminRegistroSinVerificacionOverride === true || searchParams.get("adminRegistro") === "1";
  const [cambioPasswordAbierto, setCambioPasswordAbierto] = useState(false);
  const [passwordActualCuenta, setPasswordActualCuenta] = useState("");
  const [passwordNuevaCuenta, setPasswordNuevaCuenta] = useState("");
  const [passwordConfirmarCuenta, setPasswordConfirmarCuenta] = useState("");
  const [showPasswordActualCuenta, setShowPasswordActualCuenta] = useState(false);
  const [showPasswordNuevaCuenta, setShowPasswordNuevaCuenta] = useState(false);
  const [showPasswordConfirmarCuenta, setShowPasswordConfirmarCuenta] = useState(false);
  const [cambioPasswordCargando, setCambioPasswordCargando] = useState(false);
  const [modalPasswordTemporalAbierto, setModalPasswordTemporalAbierto] = useState(false);
  const prevModoRef = useRef<"login" | "register" | null>(null);

  // Estados para recuperar contraseña
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [cuentaAtrasRecuperar, setCuentaAtrasRecuperar] = useState(0);
  /** Enlace para abrir en el mismo navegador (Chrome); el correo suele abrir Brave en Windows. */
  const claveUsuario = claveTelefonoMaika(usuario?.telefono || "");
  const [maikaPedidosUsuario, setMaikaPedidosUsuario] = useState<MaikaPedidoLS[]>([]);
  const [pedidoDetalleAbierto, setPedidoDetalleAbierto] = useState<MaikaPedidoLS | null>(null);
  const [modalActivarEmailAbierto, setModalActivarEmailAbierto] = useState(false);
  const [codigoPedidoActivacion, setCodigoPedidoActivacion] = useState("");
  const [errorActivacionEmail, setErrorActivacionEmail] = useState("");
  const [intentosActivacionEmail, setIntentosActivacionEmail] = useState(0);
  const [activacionEmailOk, setActivacionEmailOk] = useState(false);
  const [ordenPedidosPorMes, setOrdenPedidosPorMes] = useState<Record<string, "desc" | "asc">>({});
  const [dropdownOrdenMesAbierto, setDropdownOrdenMesAbierto] = useState<string | null>(null);
  const [mostrarBannerCompletarPerfil, setMostrarBannerCompletarPerfil] = useState(false);
  const [, setCalleRegistroResetSignal] = useState(0);
  const dirsCuentaNormalizadas = useMemo(
    () => (usuario ? normalizarDireccionesUsuario(usuario.direcciones, DIRECCIONES_MAX) : []),
    [usuario]
  );
  const ultimosPedidosCuenta = useMemo(
    () => maikaPedidosUsuario.slice(0, 3),
    [maikaPedidosUsuario]
  );
  const pedidosHistoricoPorMes = useMemo(() => {
    const grupos = new Map<string, { key: string; titulo: string; pedidos: MaikaPedidoLS[] }>();
    for (const pedido of maikaPedidosUsuario.slice(3)) {
      const { key, titulo } = tituloMesPedido(pedido.fecha);
      const grupo = grupos.get(key) ?? { key, titulo, pedidos: [] };
      grupo.pedidos.push(pedido);
      grupos.set(key, grupo);
    }
    const secciones = Array.from(grupos.values()).map((grupo) => ({
      ...grupo,
      pedidos: [...grupo.pedidos].sort((a, b) => {
        const ordenMes = ordenPedidosPorMes[grupo.key] ?? "desc";
        const ta = parseFechaPedido(a.fecha)?.getTime() ?? 0;
        const tb = parseFechaPedido(b.fecha)?.getTime() ?? 0;
        return ordenMes === "asc" ? ta - tb : tb - ta;
      })
    }));
    return secciones;
  }, [maikaPedidosUsuario, ordenPedidosPorMes]);

  const datosClienteParaSyncMaika = useMemo((): Cliente => {
    const nom = (usuario?.nombre || "").trim();
    return {
      nombreApellidos: nom ? nom.toUpperCase() : "Cliente",
      email: tieneEmailRealMaika(usuario?.email || "") ? usuario?.email || "" : "",
      telefono: usuario?.telefono || "",
      notas: ""
    };
  }, [usuario?.nombre, usuario?.email, usuario?.telefono]);

  const aplicarDireccionPrincipalDesdeCuenta = useCallback(
    (idDir: string) => {
      if (!usuario) return;
      const r = resolverUsoDireccionCheckout({
        idDir,
        usuario,
        datosCliente: datosClienteParaSyncMaika,
        direccionesCheckout: dirsCuentaNormalizadas,
        leerMaikaUsuarios,
        normalizarTelefonoES9,
        normalizarDireccionesUsuario: (raw) => normalizarDireccionesUsuario(raw, DIRECCIONES_MAX),
        claveTelefonoES
      });
      if (r.ok === false) {
        notificarError(mostrarNotificacion, r.error);
        return;
      }
      guardarMaikaUsuarios(r.usuariosLS, normalizarTelefonoES9);
      const siguiente: Usuario = {
        ...usuario,
        ...r.mergedUser,
        direcciones: r.dirs,
        direccionPredeterminadaId: r.dir.id
      };
      setUsuario(siguiente);
      precargarDatosClienteDesdeUsuario(siguiente);
      const tel9 = normalizarTelefonoES9(siguiente.telefono || "");
      const row = r.usuariosLS.find((u) => normalizarTelefonoES9(String(u.telefono || "")) === tel9);
      if (row && hasClientSession()) {
        const payload = perfilUsuarioPayloadDesdeMaika(row);
        if (Array.isArray(payload.direcciones)) {
          const preparado = prepareDireccionesParaGuardar(
            payload.direcciones as DireccionUsuario[],
            Array.isArray(usuario?.direcciones) ? usuario.direcciones : [],
            String(payload.direccionPredeterminadaId || usuario?.direccionPredeterminadaId || "")
          );
          payload.direcciones = preparado.direcciones;
          payload.direccionPredeterminadaId = preparado.direccionPredeterminadaId;
        }
        void actualizarPerfilOEncolar(payload).catch(() => {
          mostrarNotificacion("Dirección principal actualizada en este dispositivo. No se pudo sincronizar con el servidor.", "normal");
        });
      }
      notificarExito(mostrarNotificacion, "Dirección principal actualizada");
    },
    [
      usuario,
      datosClienteParaSyncMaika,
      dirsCuentaNormalizadas,
      mostrarNotificacion,
      setUsuario,
      precargarDatosClienteDesdeUsuario
    ]
  );

  const handleVolverInicio = useCallback(() => {
    setTelefonoForzadoRegistroDesdeAcceso("");
    setModoForzadoRegistroDesdeAcceso("");
    setConfirmacionIdentidadActivacion(false);
    limpiarActivacionIdentidadVerificada();
    setPagina("inicio");
  }, [
    setTelefonoForzadoRegistroDesdeAcceso,
    setModoForzadoRegistroDesdeAcceso,
    setConfirmacionIdentidadActivacion,
    setPagina
  ]);
  const handleLogoutSeguro = useCallback(() => {
    const bloquearHastaRaw = sessionStorage.getItem("maika_ignore_logout_until");
    const bloquearHasta = Number(bloquearHastaRaw || 0);
    if (Number.isFinite(bloquearHasta) && Date.now() < bloquearHasta) return;
    limpiarClavesSesionEnLocalStorage();
    localStorage.removeItem(GUEST_CART_PENDING_KEY);
    setUsuario(null);
    setModoRecuperar(false);
    setTelefonoForzadoRegistroDesdeAcceso("");
    setModoForzadoRegistroDesdeAcceso("");
    setConfirmacionIdentidadActivacion(false);
    limpiarActivacionIdentidadVerificada();
    setReenvioDisponibleEn(0);
    setPagina("inicio");
    mostrarNotificacion("👋 Sesión cerrada", "normal");
  }, [
    setUsuario,
    mostrarNotificacion,
    setTelefonoForzadoRegistroDesdeAcceso,
    setModoForzadoRegistroDesdeAcceso,
    setConfirmacionIdentidadActivacion,
    setReenvioDisponibleEn,
    setPagina
  ]);

  /** Mismos inputs que Finalizar compra (checkout). */
  const cuentaInputStyle: CSSProperties = {
    ...checkoutInputStyle,
    marginBottom: 12,
    boxSizing: "border-box"
  };
  const cuentaInputWithEyeStyle: CSSProperties = { ...cuentaInputStyle, paddingRight: 44 };
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
  const cuentaCampoSoloLectura: CSSProperties = {
    ...checkoutInputStyle,
    marginBottom: 0,
    opacity: 0.9,
    cursor: "not-allowed"
  };
  /** Registro paso 1: densidad tipo checkout */
  useEffect(() => {
    if (cuentaAtrasRecuperar <= 0) return;
    const t = window.setTimeout(() => {
      setCuentaAtrasRecuperar((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(t);
  }, [cuentaAtrasRecuperar]);

  const telefonoForzadoRegistro = normalizarTelefono(telefonoForzadoRegistroDesdeAcceso || "").slice(0, 9);
  const registroForzadoDesdeAcceso = modoRegistro === "register" && !modoRecuperar && !!telefonoForzadoRegistro;




  useEffect(() => {
    if (!adminRegistroSinVerificacion) return;
    setModoRegistro("register");
    setModoRecuperar(false);
    setFormAuth((prev) =>
      prev.pasoVerificacion !== 1 ? { ...prev, pasoVerificacion: 1, codigoIngresado: "" } : prev
    );
  }, [adminRegistroSinVerificacion, setModoRegistro, setFormAuth]);


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
    setModalPasswordTemporalAbierto(true);
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

  /** `?vista=registro|login`: entrada directa a la pestaña pedida (p. ej. desde el guard de Sueños/Horóscopo). */
  useEffect(() => {
    if (embedPanelGestion) return;
    const vista = searchParams.get("vista");
    if (vista !== "registro" && vista !== "login") return;
    setModoRegistro(vista === "registro" ? "register" : "login");
    const next = new URLSearchParams(searchParams);
    next.delete("vista");
    setSearchParams(next, { replace: true });
  }, [embedPanelGestion, searchParams, setSearchParams, setModoRegistro]);

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
  const mostrarFlujoInvitadoOCuentaEmbebida = !usuario || embedPanelGestion;

  if (mostrarFlujoInvitadoOCuentaEmbebida) {
    return <CuentaAuthView {...props} />;
  }

  const direccionDosLineas = direccionCuentaEnDosLineas(usuario);
  const obtenerCodigoUltimoPedidoDesdeCuenta = () => {
    const ultimo = maikaPedidosUsuario[0];
    return String(ultimo?.idPedido || "").trim();
  };
  const limpiarCambioPasswordCuenta = () => {
    setPasswordActualCuenta("");
    setPasswordNuevaCuenta("");
    setPasswordConfirmarCuenta("");
    setShowPasswordActualCuenta(false);
    setShowPasswordNuevaCuenta(false);
    setShowPasswordConfirmarCuenta(false);
  };
  const guardarCambioPasswordCuenta = async () => {
    if (!passwordActualCuenta || !passwordNuevaCuenta || !passwordConfirmarCuenta) {
      notificarError(mostrarNotificacion, "Completa la contraseña actual y la nueva.");
      return;
    }
    if (passwordNuevaCuenta !== passwordConfirmarCuenta) {
      notificarError(mostrarNotificacion, "Las contraseñas nuevas no coinciden.");
      return;
    }
    if (!passwordSeguraBasica(passwordNuevaCuenta)) {
      notificarError(mostrarNotificacion, "La nueva contraseña debe tener mínimo 8 caracteres, con letras y números.");
      return;
    }
    setCambioPasswordCargando(true);
    try {
      await cambiarPasswordAutenticadoApi({
        currentPassword: passwordActualCuenta,
        newPassword: passwordNuevaCuenta
      });
      limpiarCambioPasswordCuenta();
      setCambioPasswordAbierto(false);
      setUsuario((prev) => (prev ? { ...prev, mustChangePassword: false } : prev));
      notificarExito(mostrarNotificacion, "Contraseña actualizada correctamente.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      notificarError(mostrarNotificacion, msg || "No se pudo cambiar la contraseña.");
    } finally {
      setCambioPasswordCargando(false);
    }
  };
  const abrirRegistroForzadoDesdeMiCuenta = () => {
    const tel9 = normalizarTelefono(usuario?.telefono || "").slice(0, 9);
    if (!/^[67]\d{8}$/.test(tel9)) {
      notificarError(mostrarNotificacion, "No hay un teléfono válido para activar esta cuenta.");
      return;
    }
    setModoRegistro("register");
    setTelefonoForzadoRegistroDesdeAcceso(tel9);
    setModoForzadoRegistroDesdeAcceso("activar");
    setFormAuth(crearFormAuthRegistroDesdeAcceso(tel9));
    setModalActivarEmailAbierto(false);
    setCodigoPedidoActivacion("");
    setErrorActivacionEmail("");
    setIntentosActivacionEmail(0);
  };
  const activarCuentaDesdeMiCuenta = () => {
    if (!usuario?.telefono) {
      notificarError(mostrarNotificacion, "No hay un teléfono asociado a esta cuenta.");
      return;
    }
    if (maikaPedidosUsuario.length === 0 || !obtenerCodigoUltimoPedidoDesdeCuenta()) {
      notificarError(mostrarNotificacion, "No hay pedidos asociados. Contacta con MAIKA para activar la cuenta.");
      return;
    }
    if (confirmacionIdentidadActivacion || esActivacionIdentidadVerificadaEnSession(usuario.telefono)) {
      abrirRegistroForzadoDesdeMiCuenta();
      return;
    }
    setCodigoPedidoActivacion("");
    setErrorActivacionEmail("");
    setIntentosActivacionEmail(0);
    setActivacionEmailOk(false);
    setModalActivarEmailAbierto(true);
  };
  const verificarPedidoYActivarCuenta = () => {
    if (intentosActivacionEmail >= 3) {
      setErrorActivacionEmail("Demasiados intentos. Cierra y vuelve a intentarlo más tarde o contacta con MAIKA.");
      return;
    }
    const esperado = obtenerCodigoUltimoPedidoDesdeCuenta();
    const recibido = codigoPedidoActivacion;
    if (!validarCodigoUltimoPedido(esperado, recibido)) {
      const siguienteIntentos = intentosActivacionEmail + 1;
      setIntentosActivacionEmail(siguienteIntentos);
      setErrorActivacionEmail(
        siguienteIntentos >= 3
          ? "El código no coincide con tu último pedido. Por seguridad, contacta con MAIKA si necesitas ayuda."
          : "El código no coincide con tu último pedido."
      );
      return;
    }
    marcarActivacionIdentidadVerificada(usuario?.telefono || "");
    setConfirmacionIdentidadActivacion(true);
    setActivacionEmailOk(true);
    window.setTimeout(() => {
      abrirRegistroForzadoDesdeMiCuenta();
      setActivacionEmailOk(false);
    }, 800);
  };
  return (
    <div className="cuenta-maika-page maika-anchor" style={cuentaShellOuter}>
      <div className="maika-page-content maika-page-content--narrow" style={{ maxWidth: 480, marginLeft: "auto", marginRight: "auto", marginTop: 0, marginBottom: 0, width: "100%", position: "relative", flex: "0 1 auto", boxSizing: "border-box" }}>
      <div className="maika-page-header">
        <h2 className="maika-page-title" style={{ fontSize: 20 }}>👤 Mi Cuenta</h2>
        <BotonCerrar
          onClick={handleVolverInicio}
          ariaLabel="Volver al inicio"
          title="Volver al inicio"
        />
      </div>
      <div className="maika-page-subheader" aria-hidden />
      <div className="maika-page-body">
      {mostrarBannerCompletarPerfil ? (
        <div
          role="status"
          style={{
            marginBottom: 14,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(120, 200, 255, 0.45)",
            background: "rgba(40, 80, 120, 0.35)",
            color: "rgba(255,255,255,0.95)",
            fontSize: 14,
            lineHeight: 1.45,
            textAlign: "center"
          }}
        >
          <strong style={{ color: "#b8e0ff" }}>Siguiente paso</strong>
          <div style={{ marginTop: 6 }}>
            Completa tu teléfono y dirección aquí o desde «Cambiar dirección» para poder comprar sin fricción.
          </div>
          <button
            type="button"
            onClick={() => {
              try {
                sessionStorage.removeItem("maika_banner_completar_perfil");
              } catch {
                /* ignore */
              }
              setMostrarBannerCompletarPerfil(false);
            }}
            style={{
              marginTop: 10,
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid rgba(180, 220, 255, 0.5)",
              background: "rgba(255,255,255,0.08)",
              color: "#e8f4ff",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Entendido
          </button>
        </div>
      ) : null}
      <div className="cuenta-maika-card" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ color: THEME.goldMain, marginBottom: 12, fontSize: 17 }}>Bienvenido</h3>
        <div style={{ marginBottom: 15 }}>
          <label style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", display: "block", marginBottom: 6 }}>
            Nombre 🔒
          </label>
          <input
            value={(usuario?.nombre || "").toUpperCase()}
            disabled
            readOnly
            aria-readonly="true"
            style={cuentaCampoSoloLectura}
          />
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 6 }}>
            Nombre asociado al pedido (no editable)
          </div>
        </div>
        <p style={{ color: "white" }}>📞 {usuario.telefono || "—"}</p>
        {tieneEmailRealMaika(usuario.email || "") ? (
          <p style={{ color: "white" }}>📧 {usuario.email}</p>
        ) : (
          <div style={{ marginTop: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.62)", marginBottom: 6 }}>Email</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 8 }}>
              Sin email asociado
            </div>
            <button
              type="button"
              className="checkout-boton-finalizar"
              onClick={activarCuentaDesdeMiCuenta}
              style={{ ...cuentaCtaPrincipalStyle, width: "100%", padding: "10px 12px" }}
            >
              Añadir email y activar cuenta
            </button>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.58)", marginTop: 6, lineHeight: 1.35 }}>
              Verificaremos tu identidad antes de vincular el email a tus pedidos.
            </div>
          </div>
        )}
        {tieneEmailRealMaika(usuario.email || "") ? (
          <CambioPasswordSection
            mustChangePassword={!!usuario.mustChangePassword}
            abierto={cambioPasswordAbierto}
            onToggle={() => {
              if (usuario.mustChangePassword) {
                setModalPasswordTemporalAbierto(true);
                return;
              }
              setCambioPasswordAbierto((v) => {
                if (v) limpiarCambioPasswordCuenta();
                return !v;
              });
            }}
            passwordActual={passwordActualCuenta}
            setPasswordActual={setPasswordActualCuenta}
            passwordNueva={passwordNuevaCuenta}
            setPasswordNueva={setPasswordNuevaCuenta}
            passwordConfirmar={passwordConfirmarCuenta}
            setPasswordConfirmar={setPasswordConfirmarCuenta}
            showActual={showPasswordActualCuenta}
            setShowActual={setShowPasswordActualCuenta}
            showNueva={showPasswordNuevaCuenta}
            setShowNueva={setShowPasswordNuevaCuenta}
            showConfirmar={showPasswordConfirmarCuenta}
            setShowConfirmar={setShowPasswordConfirmarCuenta}
            cargando={cambioPasswordCargando}
            onGuardar={() => void guardarCambioPasswordCuenta()}
            cuentaBotonAuth={cuentaBotonAuth}
            cuentaInputWithEyeStyle={cuentaInputWithEyeStyle}
            cuentaCtaPrincipalStyle={cuentaCtaPrincipalStyle}
          />
        ) : null}
        <DireccionesSection
          dirsCuentaNormalizadas={dirsCuentaNormalizadas}
          direccionPredeterminadaId={usuario.direccionPredeterminadaId}
          direccionDosLineas={direccionDosLineas}
          onElegirPrincipal={aplicarDireccionPrincipalDesdeCuenta}
          onIrADireccion={() => navigate("/cuenta?modo=direccion")}
          cuentaCtaPrincipalStyle={cuentaCtaPrincipalStyle}
        />
        <button
          type="button"
          className="checkout-boton-finalizar"
          onClick={() => setPagina("tienda")}
          style={{ ...cuentaCtaPrincipalStyle, marginTop: 10, width: "100%" }}
        >
          🛍️ Volver a la tienda
        </button>
        <button
          type="button"
          onClick={handleLogoutSeguro}
          style={{
            ...cuentaBotonAuth,
            marginTop: 8,
            background: "transparent",
            color: "#ff6666",
            border: "1px solid rgba(255, 100, 100, 0.55)"
          }}
        >
          Cerrar Sesión
        </button>
      </div>
      <MisPedidosSection
        claveUsuario={claveUsuario}
        maikaPedidosUsuario={maikaPedidosUsuario}
        ultimosPedidosCuenta={ultimosPedidosCuenta}
        pedidosHistoricoPorMes={pedidosHistoricoPorMes}
        ordenPedidosPorMes={ordenPedidosPorMes}
        setOrdenPedidosPorMes={setOrdenPedidosPorMes}
        dropdownOrdenMesAbierto={dropdownOrdenMesAbierto}
        setDropdownOrdenMesAbierto={setDropdownOrdenMesAbierto}
        onVerDetalles={setPedidoDetalleAbierto}
        onRepetirPedido={onRepetirPedido}
      />

      {pedidoDetalleAbierto && (
        <PedidoDetalleModal
          pedido={pedidoDetalleAbierto}
          onClose={() => setPedidoDetalleAbierto(null)}
          cuentaBotonAuth={cuentaBotonAuth}
        />
      )}
      {modalActivarEmailAbierto && (
        <ActivarEmailModal
          codigoPedidoActivacion={codigoPedidoActivacion}
          setCodigoPedidoActivacion={setCodigoPedidoActivacion}
          errorActivacionEmail={errorActivacionEmail}
          setErrorActivacionEmail={setErrorActivacionEmail}
          intentosActivacionEmail={intentosActivacionEmail}
          activacionEmailOk={activacionEmailOk}
          setActivacionEmailOk={setActivacionEmailOk}
          onVerificar={verificarPedidoYActivarCuenta}
          onClose={() => setModalActivarEmailAbierto(false)}
          cuentaBotonAuth={cuentaBotonAuth}
          cuentaCtaPrincipalStyle={cuentaCtaPrincipalStyle}
        />
      )}
      {modalPasswordTemporalAbierto && (
        <CambioPasswordTemporalModal
          abierto
          onClose={() => setModalPasswordTemporalAbierto(false)}
          onExito={() => {
            setModalPasswordTemporalAbierto(false);
            setUsuario((prev) => (prev ? { ...prev, mustChangePassword: false } : prev));
          }}
          mostrarNotificacion={mostrarNotificacion}
        />
      )}
      </div>
    </div>
    </div>
  );
}
