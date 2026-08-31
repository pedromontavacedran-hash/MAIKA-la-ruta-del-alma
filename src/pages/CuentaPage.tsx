import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import type { AuthForm, Usuario, Pedido, Pagina, Cliente, DireccionUsuario } from "../types";
import { checkoutInputStyle, checkoutPrimaryButtonStyleNoShadow } from "../styles/inputStyle";
import BotonCerrar from "../components/BotonCerrar";
import ModalBase from "../components/ModalBase";
import { GUEST_CART_PENDING_KEY, THEME } from "../config";
import { parseFechaPedido, textoFechaPedido } from "../utils/fechaPedido";
import {
  cambiarPasswordAutenticadoApi,
  hasClientSession,
} from "../services/apiAuth";
import { limpiarClavesSesionEnLocalStorage } from "../services/apiAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { lineasTextoSeleccionDireccion } from "../utils/direccion";
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
  normalizarCodigoUltimoPedidoInput,
  validarCodigoUltimoPedido
} from "../utils/accesoRapidoVerificacion";
import { crearFormAuthRegistroDesdeAcceso } from "../utils/authForms";
import { tieneEmailRealMaika } from "../utils/emailTecnicoMaika";

import RequisitosPasswordHint from "../components/RequisitosPasswordHint";
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
  const mostrarFlujoInvitadoOCuentaEmbebida = !usuario || embedPanelGestion;

  if (mostrarFlujoInvitadoOCuentaEmbebida) {
    return <CuentaAuthView {...props} />;
  }

  const estadoTexto = (estado?: MaikaPedidoLS["estado"]) => {
    if (estado === "enviado") return "🚚 Enviado";
    if (estado === "entregado") return "✅ Entregado";
    return "🛒 Pendiente";
  };
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
  const renderOrdenMesDropdown = (grupo: { key: string; titulo: string }) => {
    const ordenActual = ordenPedidosPorMes[grupo.key] ?? "desc";
    const abierto = dropdownOrdenMesAbierto === grupo.key;
    return (
      <span
        style={{ position: "relative", flexShrink: 0, width: 128 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label={`Ordenar pedidos de ${grupo.titulo}`}
          aria-expanded={abierto}
          onClick={() => setDropdownOrdenMesAbierto((prev) => (prev === grupo.key ? null : grupo.key))}
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: 8,
            border: "1px solid rgba(212, 175, 55, 0.5)",
            background: "rgba(27, 23, 69, 0.96)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6
          }}
        >
          <span>{ordenActual === "desc" ? "Más recientes" : "Más antiguos"}</span>
          <span style={{ transform: abierto ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.16s ease" }}>▾</span>
        </button>
        {abierto ? (
          <span
            style={{
              position: "absolute",
              top: "calc(100% + 5px)",
              right: 0,
              width: "100%",
              borderRadius: 9,
              overflow: "hidden",
              border: "1px solid rgba(212, 175, 55, 0.55)",
              background: "rgba(34, 28, 82, 0.98)",
              boxShadow: "0 12px 26px rgba(0,0,0,0.38)",
              zIndex: 20
            }}
          >
            {(["desc", "asc"] as const).map((orden) => (
              <button
                key={orden}
                type="button"
                onClick={() => {
                  setOrdenPedidosPorMes((prev) => ({ ...prev, [grupo.key]: orden }));
                  setDropdownOrdenMesAbierto(null);
                }}
                style={{
                  width: "100%",
                  padding: "8px 9px",
                  border: "none",
                  borderBottom: orden === "desc" ? "1px solid rgba(212, 175, 55, 0.16)" : "none",
                  background: ordenActual === orden ? "rgba(212, 175, 55, 0.18)" : "transparent",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 800,
                  textAlign: "left"
                }}
              >
                {orden === "desc" ? "Más recientes" : "Más antiguos"}
              </button>
            ))}
          </span>
        ) : null}
      </span>
    );
  };
  const renderPedidoCuentaCard = (p: MaikaPedidoLS) => {
    const resumenProductos = (p.productos || []).reduce((sum, pr) => sum + (Number(pr.cantidad) || 0), 0);
    return (
      <div key={p.idPedido} className="cuenta-maika-pedido-card" style={{ padding: 15, marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <strong style={{ color: THEME.goldMain }}>
            {textoFechaPedido(p.fecha, false)}
          </strong>
          <span style={{ color: "white", fontSize: 12 }}>{estadoTexto(p.estado)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ color: "white" }}>Total: {Number(p.total || 0).toFixed(2)} €</span>
          <span style={{ color: "white" }}>{resumenProductos} productos</span>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
          <button
            onClick={() => setPedidoDetalleAbierto(p)}
            style={{ flex: 1, minWidth: 0, padding: "12px 10px", background: "transparent", color: "rgba(255,255,255,0.92)", border: "1px solid rgba(212, 175, 55, 0.45)", borderRadius: 10, cursor: "pointer", fontWeight: 600 }}
          >
            Ver detalles
          </button>
          <button
            type="button"
            className="checkout-boton-finalizar"
            onClick={() => onRepetirPedido(p)}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "12px 10px",
              borderRadius: 10,
              cursor: "pointer",
              ...checkoutPrimaryButtonStyleNoShadow
            }}
          >
            Repetir pedido
          </button>
        </div>
      </div>
    );
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
          <div style={{ marginTop: 12, marginBottom: 14 }}>
            <button
              type="button"
              onClick={() => {
                if (usuario.mustChangePassword) {
                  setCambioPasswordAbierto(true);
                  return;
                }
                setCambioPasswordAbierto((v) => {
                  if (v) limpiarCambioPasswordCuenta();
                  return !v;
                });
              }}
              style={{
                ...cuentaBotonAuth,
                padding: "10px 12px",
                fontSize: 13,
                background: "rgba(255,255,255,0.04)",
                color: THEME.goldMain,
                border: "1px solid rgba(212, 175, 55, 0.45)"
              }}
            >
              {usuario.mustChangePassword
                ? "Debes cambiar tu contraseña"
                : cambioPasswordAbierto
                  ? "Cancelar cambio de contraseña"
                  : "Cambiar contraseña"}
            </button>
            {cambioPasswordAbierto ? (
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {usuario.mustChangePassword ? (
                  <p style={{ margin: 0, color: "#ffd98a", fontSize: 12, lineHeight: 1.35 }}>
                    Has entrado con una contraseña temporal. Cámbiala ahora por una que solo sepas tú.
                  </p>
                ) : null}
                <div style={{ ...passwordWrapperStyle, marginBottom: 0 }}>
                  <input
                    type={showPasswordActualCuenta ? "text" : "password"}
                    placeholder="Contraseña actual"
                    value={passwordActualCuenta}
                    onChange={(e) => setPasswordActualCuenta(e.target.value)}
                    style={{ ...cuentaInputWithEyeStyle, marginBottom: 0 }}
                    autoComplete="current-password"
                    name="cuenta-password-actual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordActualCuenta((v) => !v)}
                    style={eyeBtnStyle}
                    title={showPasswordActualCuenta ? "Ocultar contraseña" : "Ver contraseña"}
                    aria-label={showPasswordActualCuenta ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPasswordActualCuenta ? "🙈" : "👁"}
                  </button>
                </div>
                <div style={{ ...passwordWrapperStyle, marginBottom: 0 }}>
                  <input
                    type={showPasswordNuevaCuenta ? "text" : "password"}
                    placeholder="Nueva contraseña"
                    value={passwordNuevaCuenta}
                    onChange={(e) => setPasswordNuevaCuenta(e.target.value)}
                    style={{ ...cuentaInputWithEyeStyle, marginBottom: 0 }}
                    autoComplete="new-password"
                    name="cuenta-password-nueva"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordNuevaCuenta((v) => !v)}
                    style={eyeBtnStyle}
                    title={showPasswordNuevaCuenta ? "Ocultar contraseña" : "Ver contraseña"}
                    aria-label={showPasswordNuevaCuenta ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPasswordNuevaCuenta ? "🙈" : "👁"}
                  </button>
                </div>
                <div style={{ ...passwordWrapperStyle, marginBottom: 0 }}>
                  <input
                    type={showPasswordConfirmarCuenta ? "text" : "password"}
                    placeholder="Confirmar nueva contraseña"
                    value={passwordConfirmarCuenta}
                    onChange={(e) => setPasswordConfirmarCuenta(e.target.value)}
                    style={{ ...cuentaInputWithEyeStyle, marginBottom: 0 }}
                    autoComplete="new-password"
                    name="cuenta-password-confirmar"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirmarCuenta((v) => !v)}
                    style={eyeBtnStyle}
                    title={showPasswordConfirmarCuenta ? "Ocultar contraseña" : "Ver contraseña"}
                    aria-label={showPasswordConfirmarCuenta ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPasswordConfirmarCuenta ? "🙈" : "👁"}
                  </button>
                </div>
                <RequisitosPasswordHint password={passwordNuevaCuenta} compact />
                <button
                  type="button"
                  disabled={cambioPasswordCargando}
                  onClick={() => void guardarCambioPasswordCuenta()}
                  className="checkout-boton-finalizar"
                  style={{
                    ...cuentaCtaPrincipalStyle,
                    padding: "10px 12px",
                    opacity: cambioPasswordCargando ? 0.85 : 1,
                    cursor: cambioPasswordCargando ? "wait" : "pointer"
                  }}
                >
                  {cambioPasswordCargando ? "Guardando..." : "Guardar nueva contraseña"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", display: "block", marginBottom: 6 }}>
            Dirección 📍
            {dirsCuentaNormalizadas.length > 0 ? (
              <span style={{ fontWeight: 500, opacity: 0.7, fontSize: 11, marginLeft: 6 }}>
                ({dirsCuentaNormalizadas.length}/{DIRECCIONES_MAX})
              </span>
            ) : null}
          </label>
          {dirsCuentaNormalizadas.length > 0 ? (
            <>
              <div style={{ display: "grid", gap: 7 }}>
                {dirsCuentaNormalizadas.map((d) => {
                  const predId = String(usuario.direccionPredeterminadaId || "").trim();
                  const primeraId = dirsCuentaNormalizadas[0]?.id || "";
                  const esPrincipal = (predId && d.id === predId) || (!predId && d.id === primeraId);
                  const { linea1, linea2 } = lineasTextoSeleccionDireccion(d);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      aria-current={esPrincipal ? "true" : undefined}
                      onClick={() => {
                        if (esPrincipal) return;
                        aplicarDireccionPrincipalDesdeCuenta(d.id);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: esPrincipal ? `2px solid ${THEME.goldMain}` : "1px solid rgba(212,175,55,0.22)",
                        background: esPrincipal ? "rgba(201,162,74,0.1)" : "rgba(255,255,255,0.04)",
                        cursor: esPrincipal ? "default" : "pointer",
                        boxSizing: "border-box"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 8
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 13,
                              color: "rgba(255,255,255,0.94)",
                              lineHeight: 1.35
                            }}
                          >
                            {linea1 || "—"}
                          </div>
                          {linea2 ? (
                            <div
                              style={{
                                marginTop: 4,
                                fontSize: 11,
                                fontWeight: 500,
                                color: "rgba(190,185,230,0.85)",
                                lineHeight: 1.35
                              }}
                            >
                              {linea2}
                            </div>
                          ) : null}
                          {!esPrincipal ? (
                            <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.45)" }}>
                              Toca para usarla como principal
                            </div>
                          ) : null}
                        </div>
                        {esPrincipal ? (
                          <span
                            style={{
                              flexShrink: 0,
                              fontSize: 9,
                              fontWeight: 800,
                              letterSpacing: "0.06em",
                              color: THEME.goldMain,
                              border: `1px solid ${THEME.goldMain}`,
                              borderRadius: 8,
                              padding: "3px 8px"
                            }}
                          >
                            PRINCIPAL
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
              {dirsCuentaNormalizadas.length > 1 ? (
                <p style={{ margin: "8px 0 0", fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
                  Elige otra fila para cambiar la dirección principal.
                </p>
              ) : null}
              <button
                type="button"
                className="checkout-boton-finalizar"
                onClick={() => navigate("/cuenta?modo=direccion")}
                disabled={dirsCuentaNormalizadas.length >= DIRECCIONES_MAX}
                style={{
                  ...cuentaCtaPrincipalStyle,
                  marginTop: 10,
                  opacity: dirsCuentaNormalizadas.length >= DIRECCIONES_MAX ? 0.55 : 1,
                  cursor: dirsCuentaNormalizadas.length >= DIRECCIONES_MAX ? "not-allowed" : "pointer"
                }}
              >
                + Añadir otra dirección
              </button>
            </>
          ) : (
            <>
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 9,
                  border: "1px solid rgba(212, 175, 55, 0.25)",
                  background: "rgba(255, 255, 255, 0.04)",
                  color: "rgba(255,255,255,0.88)",
                  minHeight: 44,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.45,
                  cursor: "not-allowed",
                  boxSizing: "border-box"
                }}
                title="Dirección bloqueada. Pulsa «Cambiar dirección» para editar o añadir."
              >
                {direccionDosLineas.linea1 ? (
                  <>
                    <div>{direccionDosLineas.linea1}</div>
                    {direccionDosLineas.linea2 && (
                      <div style={{ marginTop: 2, opacity: 0.9 }}>{direccionDosLineas.linea2}</div>
                    )}
                  </>
                ) : (
                  "Sin dirección guardada"
                )}
              </div>
              <button
                type="button"
                className="checkout-boton-finalizar"
                onClick={() => navigate("/cuenta?modo=direccion")}
                style={{ ...cuentaCtaPrincipalStyle, marginTop: 10 }}
              >
                Cambiar dirección
              </button>
            </>
          )}
        </div>
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
      <h3 style={{ color: THEME.goldMain, marginBottom: 15 }}>📦 Mis Pedidos</h3>
      {!claveUsuario && (
        <p className="cuenta-maika-hint" style={{ color: "#ffb3b3", textAlign: "center", padding: 12, fontSize: 13, marginBottom: 12 }}>
          Tu cuenta no tiene un teléfono móvil válido (9 dígitos, 6 o 7). Los pedidos se asocian al teléfono; revisa tus datos o contacta si falta.
        </p>
      )}
      {maikaPedidosUsuario.length === 0 ? (
        <p className="cuenta-maika-hint" style={{ color: "rgba(255,255,255,0.92)", textAlign: "center", padding: 20 }}>No tienes pedidos aún</p>
      ) : (
        <>
          <div
            className="cuenta-maika-hint"
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 14px",
              marginBottom: 14,
              color: "rgba(255,255,255,0.92)",
              fontSize: 13,
              lineHeight: 1.35
            }}
          >
            <span>Pedidos totales: <strong>{maikaPedidosUsuario.length}</strong></span>
            <span>Último pedido: <strong>{textoFechaPedido(maikaPedidosUsuario[0]?.fecha || "", false)}</strong></span>
          </div>

          <h4 style={{ color: THEME.goldMain, margin: "0 0 10px", fontSize: 15 }}>Últimos 3 pedidos</h4>
          {ultimosPedidosCuenta.map(renderPedidoCuentaCard)}

          {pedidosHistoricoPorMes.length > 0 ? (
            <div style={{ marginTop: 18 }}>
              <h4 style={{ color: THEME.goldMain, margin: "0 0 10px", fontSize: 15 }}>Ver pedidos por meses</h4>
              {pedidosHistoricoPorMes.map((grupo, idx) => (
                <details
                  key={grupo.key}
                  open={idx === 0}
                  className="cuenta-maika-hint"
                  style={{
                    padding: "10px 12px",
                    marginBottom: 10,
                    color: "rgba(255,255,255,0.92)"
                  }}
                >
                  <summary
                    style={{
                      cursor: "pointer",
                      color: THEME.goldMain,
                      fontWeight: 800,
                      fontSize: 14
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "calc(100% - 18px)", verticalAlign: "middle" }}>
                      <span>
                        {grupo.titulo} · {grupo.pedidos.length} {grupo.pedidos.length === 1 ? "pedido" : "pedidos"}
                      </span>
                      {renderOrdenMesDropdown(grupo)}
                    </span>
                  </summary>
                  <div style={{ marginTop: 12 }}>
                    {grupo.pedidos.map(renderPedidoCuentaCard)}
                  </div>
                </details>
              ))}
            </div>
          ) : null}
        </>
      )}

      {pedidoDetalleAbierto && (
        <ModalBase
          abierto
          onClose={() => setPedidoDetalleAbierto(null)}
          zIndex={12000}
          maxWidth="520px"
          classNameCard="cuenta-maika-card modal-card"
          styleCard={{
            border: "1px solid rgba(212, 175, 55, 0.3)",
            borderRadius: 16,
            padding: "28px 22px 18px",
            width: "90%",
            textAlign: "center",
            boxSizing: "border-box"
          }}
        >
            <div style={{ fontSize: 44, marginBottom: 6 }}>🧾</div>
            <h3 style={{ color: THEME.goldMain, marginBottom: 10 }}>
              Detalles del pedido ({String(pedidoDetalleAbierto.idPedido ?? "").slice(-6)})
            </h3>
            <p style={{ color: "white", marginBottom: 10 }}>
              Fecha: {textoFechaPedido(pedidoDetalleAbierto.fecha, true)}
            </p>
            <p style={{ color: "white", marginBottom: 10 }}>
              Dirección: {pedidoDetalleAbierto.direccionCompleta || "—"}
            </p>
            <div style={{ color: "white", textAlign: "left", marginTop: 12 }}>
              {(pedidoDetalleAbierto.productos || []).map((pr, idx) => (
                <div key={`${pr.idProducto}-${idx}`} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                  <span>{pr.nombre} x {pr.cantidad}</span>
                  <span>{Number(pr.precio || 0).toFixed(2)} €</span>
                </div>
              ))}
            </div>
            <p className="checkout-total-precio" style={{ marginTop: 12 }}>
              Total: {Number(pedidoDetalleAbierto.total || 0).toFixed(2)} €
            </p>
            {pedidoDetalleAbierto.nota && (
              <p style={{ color: "white", marginTop: 10, opacity: 0.95 }}>
                Nota: {pedidoDetalleAbierto.nota}
              </p>
            )}
            <button
              type="button"
              onClick={() => setPedidoDetalleAbierto(null)}
              style={{ ...cuentaBotonAuth, marginTop: 16, background: "transparent", color: THEME.goldMain, border: "1px solid rgba(212, 175, 55, 0.45)" }}
            >
              Cerrar
            </button>
        </ModalBase>
      )}
      {modalActivarEmailAbierto && (
        <ModalBase
          abierto
          onClose={() => {
            setModalActivarEmailAbierto(false);
            setCodigoPedidoActivacion("");
            setErrorActivacionEmail("");
            setActivacionEmailOk(false);
          }}
          zIndex={12000}
          maxWidth="440px"
          classNameCard="cuenta-maika-card modal-card"
          styleCard={{
            border: "1px solid rgba(212, 175, 55, 0.35)",
            borderRadius: 16,
            padding: "26px 22px 18px",
            width: "90%",
            textAlign: "center",
            boxSizing: "border-box"
          }}
        >
          <div style={{ fontSize: 38, marginBottom: 6 }}>🔐</div>
          <h3 style={{ color: THEME.goldMain, marginBottom: 8 }}>Activar cuenta</h3>
          <p style={{ color: "rgba(255,255,255,0.84)", fontSize: 13, lineHeight: 1.45, marginBottom: 12 }}>
            Introduce el código de tu último pedido para vincular un email a tus pedidos.
          </p>
          <input
            value={codigoPedidoActivacion}
            disabled={activacionEmailOk || intentosActivacionEmail >= 3}
            onChange={(e) => {
              setCodigoPedidoActivacion(normalizarCodigoUltimoPedidoInput(e.target.value));
              if (errorActivacionEmail) setErrorActivacionEmail("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") verificarPedidoYActivarCuenta();
            }}
            placeholder="Código del último pedido"
            style={{ ...checkoutInputStyle, marginBottom: 10, boxSizing: "border-box", textTransform: "uppercase", opacity: activacionEmailOk || intentosActivacionEmail >= 3 ? 0.72 : 1 }}
            autoComplete="off"
          />
          <button
            type="button"
            className="checkout-boton-finalizar"
            disabled={activacionEmailOk || intentosActivacionEmail >= 3}
            onClick={verificarPedidoYActivarCuenta}
            style={{ ...cuentaCtaPrincipalStyle, width: "100%", opacity: activacionEmailOk || intentosActivacionEmail >= 3 ? 0.72 : 1, cursor: activacionEmailOk || intentosActivacionEmail >= 3 ? "not-allowed" : "pointer" }}
          >
            {activacionEmailOk ? "Verificación correcta ✓" : "Verificar y continuar"}
          </button>
          {activacionEmailOk ? (
            <p style={{ color: "#9be7bd", margin: "10px 0 0", fontSize: 12 }}>Abriendo activación de cuenta...</p>
          ) : null}
          {errorActivacionEmail ? (
            <p style={{ color: "#ffb3b3", margin: "10px 0 0", fontSize: 12 }}>{errorActivacionEmail}</p>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setModalActivarEmailAbierto(false);
              setCodigoPedidoActivacion("");
              setErrorActivacionEmail("");
              setActivacionEmailOk(false);
            }}
            style={{ ...cuentaBotonAuth, marginTop: 12, background: "transparent", color: THEME.goldMain, border: "1px solid rgba(212, 175, 55, 0.45)" }}
          >
            Cancelar
          </button>
        </ModalBase>
      )}
      </div>
    </div>
    </div>
  );
}
