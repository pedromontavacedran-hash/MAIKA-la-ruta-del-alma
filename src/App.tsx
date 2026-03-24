import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from "react";
import { flushSync } from "react-dom";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import ModalConfirmacion from "./ModalConfirmacion";
import { Capacitor } from "@capacitor/core";
import PedidoExitoModal from "./components/PedidoExitoModal";
import CheckoutTelefonoAviso from "./components/CheckoutTelefonoAviso";
import LegalDocModal from "./components/modals/LegalDocModal";
import CookiesBanner from "./components/modals/CookiesBanner";
import AccesoRapidoModal from "./components/modals/AccesoRapidoModal";
import NotificacionOverlay from "./components/modals/NotificacionOverlay";
import PedidoModal from "./components/modals/PedidoModal";
import RepeatPedidoModal from "./components/modals/RepeatPedidoModal";
import Layout from "./components/Layout";
import NavPrincipal from "./components/NavPrincipal";
import HeroParticles from "./components/HeroParticles";
import { AppProvider, type AppContextValue } from "./context/AppContext";
import InicioPage from "./pages/InicioPage";
import ContabilidadPage from "./pages/ContabilidadPage";
import FavoritosPage from "./pages/FavoritosPage";
import GestionUsuariosPage from "./pages/GestionUsuariosPage";
const loadTiendaPage = () => import("./pages/TiendaPage");
const TiendaPage = lazy(loadTiendaPage);
const preloadTiendaPage = () => {
  void loadTiendaPage();
};
const loadCarritoPage = () => import("./pages/CarritoPage");
const CarritoPage = lazy(loadCarritoPage);
const preloadCarritoPage = () => {
  void loadCarritoPage();
};
const loadCuentaPage = () => import("./pages/CuentaPage");
const CuentaPage = lazy(loadCuentaPage);
const preloadCuentaPage = () => {
  void loadCuentaPage();
};
const loadSeguimientoPage = () => import("./pages/SeguimientoPage");
const SeguimientoPage = lazy(loadSeguimientoPage);
const preloadSeguimientoPage = () => {
  void loadSeguimientoPage();
};
const loadEditarCategoriasPage = () => import("./pages/admin/EditarCategoriasPage");
const EditarCategoriasPage = lazy(loadEditarCategoriasPage);
const loadNuevaCategoriaPage = () => import("./pages/admin/NuevaCategoriaPage");
const NuevaCategoriaPage = lazy(loadNuevaCategoriaPage);
const loadEditarProductosPage = () => import("./pages/admin/EditarProductosPage");
const EditarProductosPage = lazy(loadEditarProductosPage);
const loadInventarioPage = () => import("./pages/admin/InventarioPage");
const InventarioPage = lazy(loadInventarioPage);
const loadNuevoProductoPage = () => import("./pages/admin/NuevoProductoPage");
const NuevoProductoPage = lazy(loadNuevoProductoPage);
import type { ItemCarrito, Cliente, Usuario, Pedido, CuponAplicado, ConsentimientoCookies, PerfilCompraRapida, AuthForm, EditUsuarioForm, Pagina, DireccionUsuario } from "./types";
import { inputStyle } from "./styles/inputStyle";
import {
  EMAILJS_CONFIG,
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_VERSION,
  QUICK_CHECKOUT_KEY,
  CATEGORIA_IMAGENES_KEY,
  UMBRAL_STOCK_BAJO_KEY,
  NOTA_PEDIDO_ENVIO_KEY,
  NOTA_PEDIDO_ENVIO_DEFAULT,
  DESPLEGABLE_INICIO_KEY,
  DESPLEGABLE_INICIO_DEFAULT,
  SERVICIOS_INICIO_KEY,
  SERVICIOS_INICIO_DEFAULT,
  type ServicioInicio,
  CUPONES_DISPONIBLES,
  THEME,
  CUPONES_MAIKA_KEY,
  CATALOGO_VELAS_KEY,
  CATALOGO_INCIENSOS_KEY,
  CATALOGO_FIGURAS_KEY,
  CATALOGO_KITS_KEY,
  GOOGLE_PLACES_API_KEY
} from "./config";
import { useCatalogo } from "./hooks/useCatalogo";
import { useCategorias } from "./hooks/useCategorias";
import { useNotificacion } from "./hooks/useNotificacion";
import { useCarrito } from "./hooks/useCarrito";
import { usePedidosMaika } from "./hooks/usePedidosMaika";
import { usePerfilCompraRapida } from "./hooks/usePerfilCompraRapida";
import { useUsuarios } from "./hooks/useUsuarios";
import ResumenPago from "./components/ResumenPago";
import BotonCerrar from "./components/BotonCerrar";
import { calcularEnvio } from "./utils/envio";
import { precioSeguro } from "./utils/precio";
import { parseFechaPedido } from "./utils/fechaPedido";
import {
  SESSION_LOGIN_TRAS_ACCESO_RAPIDO,
  formatearCuentaAtrasMmSs,
  guardarBloqueoEmailAccesoRapido,
  guardarBloqueoSeguridadAccesoRapido,
  leerBloqueoEmailAccesoRapidoActivo,
  limpiarBloqueoEmailAccesoRapido,
  msRestantesBloqueoEmailAccesoRapido,
  msRestantesBloqueoSeguridadAccesoRapido
} from "./utils/accesoRapidoBloqueos";
import { normalizarCodigoCupon, PROVINCIA_POR_PREFIJO_CP } from "./utils/appCoreUtils";
import {
  generarNumeroPedido,
  generarReferenciaPago,
  repartirNombreApellidos
} from "./utils/appIdentity";
import { claveTelefonoES, formatearTelefonoESVisual, normalizarTelefonoES9 } from "./utils/telefono";
import {
  getCuponesDisponibles as getCuponesDisponiblesStorage,
  resolverCuponAplicable
} from "./utils/cupones";
import { normalizarTelefonoBizum, validarDatosPago } from "./utils/pago";
import { cargarClienteInvitadoDesdeStorage } from "./utils/clienteStorage";
import { calcularMetricasAdmin } from "./utils/adminMetrics";
import { calcularMetricasUsuariosAdmin } from "./utils/adminUserMetrics";
import {
  enmascararEmail,
  evaluarPasswordBasica,
  hashCodigoAccesoRapido,
  passwordSeguraBasica
} from "./utils/accesoRapidoUtils";
import { obtenerDatosCodigoPostal } from "./utils/codigoPostal";
import { enviarCodigoEmail as enviarCodigoEmailUtil } from "./utils/emailCodigo";
import { crearFormAuthRegistroDesdeAcceso } from "./utils/authForms";
import { parseGoogleAddressComponents } from "./utils/googleAddress";
import {
  construirQueryBusquedaDireccion,
  filtrarSugerenciasPorCp,
  normalizarPhotonFeature,
  type SugerenciaDireccion
} from "./utils/addressSearch";
import { resetAccesoRapidoCheckoutState } from "./utils/accesoRapidoState";
import {
  cargarConsentimientoCookiesDesdeStorage,
  construirConsentimientoCookies,
  guardarConsentimientoCookiesEnStorage
} from "./utils/cookiesConsent";
import { construirDireccionBasica, construirDireccionCompleta } from "./utils/direccion";
import {
  direccionClave as direccionClaveUtil,
  direccionDesdeCliente as direccionDesdeClienteUtil,
  direccionLegacyDesdeUsuarioLS as direccionLegacyDesdeUsuarioLSUtil,
  direccionesDesdeHistorial as direccionesDesdeHistorialUtil,
  normalizarDireccionesUsuario as normalizarDireccionesUsuarioUtil
} from "./utils/direcciones";
import {
  emailRegistradoUnificadoParaTel9 as emailRegistradoUnificadoParaTel9Storage,
  findMaikaUsuarioPorTel9 as findMaikaUsuarioPorTel9Storage,
  guardarMaikaUsuarios as guardarMaikaUsuariosStorage,
  leerMaikaUsuarios as leerMaikaUsuariosStorage,
  maikaUsuarioToCliente as maikaUsuarioToClienteUtil,
  resolverUsuarioLegacyIdxPorTel9 as resolverUsuarioLegacyIdxPorTel9Util,
  sincronizarMaikaDesdeLegacy as sincronizarMaikaDesdeLegacyUtil,
  telefonoTieneActividadSinEmail as telefonoTieneActividadSinEmailUtil,
  type MaikaUsuarioLS
} from "./utils/maikaUsuarios";
import {
  construirItemsDesdeProductos as construirItemsDesdeProductosUtil,
  guardarMaikaPedidos as guardarMaikaPedidosStorage,
  leerMaikaPedidos as leerMaikaPedidosStorage,
  obtenerCodigoUltimoPedidoPorTel9 as obtenerCodigoUltimoPedidoPorTel9Util,
  sumarPedidoAlCarrito as sumarPedidoAlCarritoUtil,
  type MaikaPedidoProductoLS,
  type MaikaPedidoLS
} from "./utils/maikaPedidos";
import {
  clearAdminAuthorization,
  getAdminLastLoginMs,
  getAdminSessionRemainingMs,
  isAdminAuthorized
} from "./utils/adminAuth";
import { prefetchConDelay, runOnce } from "./utils/prefetchPredictivo";
import { actualizarEstadoPedidoApi, crearPedidoApi } from "./services/apiPedidos";
import { actualizarPasswordApi, obtenerPerfilApi } from "./services/apiAuth";
import { getUsuarioId } from "./utils/usuarioId";

export type { Producto, ItemCarrito, Cliente, Usuario, Pedido, EditUsuarioForm } from "./types";

const preloadTiendaOnce = () => {
  runOnce("route-tienda", preloadTiendaPage);
};
const preloadCarritoOnce = () => {
  runOnce("route-carrito", preloadCarritoPage);
};
const preloadCuentaOnce = () => {
  runOnce("route-cuenta", preloadCuentaPage);
};
const preloadSeguimientoOnce = () => {
  runOnce("route-seguimiento", preloadSeguimientoPage);
};
const preloadAdminOnce = () => {
  runOnce("route-admin-core", () => Promise.all([
    loadEditarCategoriasPage(),
    loadEditarProductosPage(),
    loadInventarioPage(),
    loadNuevoProductoPage(),
    loadNuevaCategoriaPage()
  ]));
};

const PATH_BY_PAGINA: Record<Pagina, string> = {
  inicio: "/",
  tienda: "/tienda",
  carrito: "/carrito",
  seguimiento: "/seguimiento",
  cuenta: "/cuenta",
  favoritos: "/favoritos",
  admin: "/admin",
  contabilidad: "/contabilidad",
  editarCategorias: "/admin/editar-categorias",
  editarProductos: "/admin/editar-productos",
  editarCupones: "/admin/editar-cupones",
  inventario: "/admin/inventario",
  nuevoProducto: "/admin/nuevo-producto",
  nuevaCategoria: "/admin/nueva-categoria"
};

const PAGINA_BY_PATH: Record<string, Pagina> = {
  "/": "inicio",
  "/tienda": "tienda",
  "/carrito": "carrito",
  "/seguimiento": "seguimiento",
  "/cuenta": "cuenta",
  "/favoritos": "favoritos",
  "/admin": "admin",
  "/contabilidad": "contabilidad",
  "/admin/editar-categorias": "editarCategorias",
  "/admin/editar-productos": "editarProductos",
  "/admin/editar-cupones": "editarCupones",
  "/admin/inventario": "inventario",
  "/admin/nuevo-producto": "nuevoProducto",
  "/admin/nueva-categoria": "nuevaCategoria"
};

const AUTO_LOGOUT_INACTIVIDAD_MIN = 20;
const EMAIL_VALIDO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function esEmailVerificable(email: string): boolean {
  return EMAIL_VALIDO_REGEX.test(String(email || "").trim().toLowerCase());
}

function sanearVerificacionUsuario(u: Usuario): Usuario {
  const emailNorm = String(u?.email || "").trim().toLowerCase();
  return {
    ...u,
    email: emailNorm,
    verificado: esEmailVerificable(emailNorm) && !!u?.verificado
  };
}

export default function App() {
const RECORDAR_INVITADO_KEY = "maika_recordar_datos_invitado";
const navigate = useNavigate();
const location = useLocation();
const pagina: Pagina = PAGINA_BY_PATH[location.pathname] ?? "inicio";
const setPagina = useCallback((next: Pagina) => {
  const targetPath = PATH_BY_PAGINA[next] ?? "/";
  if (location.pathname !== targetPath) {
    navigate(targetPath);
  }
}, [location.pathname, navigate]);
useEffect(() => {
  if (!PAGINA_BY_PATH[location.pathname]) {
    navigate("/", { replace: true });
  }
}, [location.pathname, navigate]);
useEffect(() => {
  preloadTiendaOnce();
  preloadCarritoOnce();
}, []);
useEffect(() => {
  if (location.pathname.startsWith("/admin")) {
    preloadAdminOnce();
    void prefetchConDelay("route-admin-secondary", () => {
      void Promise.all([loadNuevaCategoriaPage(), loadEditarCategoriasPage()]);
    }, 200);
  }
  if (location.pathname === "/carrito") {
    void prefetchConDelay("route-post-carrito", () => {
      preloadCuentaOnce();
      preloadSeguimientoOnce();
    }, 150);
  }
  if (location.pathname === "/cuenta") {
    void prefetchConDelay("route-post-cuenta", () => {
      preloadSeguimientoOnce();
      preloadCarritoOnce();
    }, 180);
  }
}, [location.pathname]);
  const [legalDoc, setLegalDoc] = useState<"aviso-legal" | "politica-cookies" | "politica-privacidad" | "terminos-condiciones" | null>(null);
  const { notificacion, setNotificacion, mostrarNotificacion } = useNotificacion();
  const categorias = useCategorias();
  const {
    categoriasCatalogo,
    setCategoriasCatalogo,
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    previewCategoria,
    setPreviewCategoria,
    tamanoCategoria,
    setTamanoCategoria,
    colorCategoria,
    setColorCategoria,
    estiloTextoCategoria,
    setEstiloTextoCategoria,
    nombreImagenCategoria,
    setNombreImagenCategoria,
    nuevaCategoriaNombre,
    setNuevaCategoriaNombre,
    nuevaCategoriaImagen,
    setNuevaCategoriaImagen,
    nuevaCategoriaNombreImagen,
    setNuevaCategoriaNombreImagen,
    nuevaCategoriaTamano,
    setNuevaCategoriaTamano,
    nuevaCategoriaColor,
    setNuevaCategoriaColor,
    nuevaCategoriaEstilo,
    setNuevaCategoriaEstilo,
    categoriaARenombrar,
    setCategoriaARenombrar,
    loadCategoryImage
  } = categorias;

  const catalogo = useCatalogo();
  const {
    velas,
    setVelas,
    inciensos,
    setInciensos,
    figuras,
    setFiguras,
    kits,
    setKits,
    getProductoByValue,
    precioCatalogoPorId,
    precioItemCarrito,
    normalizarItemCarrito
  } = catalogo;

  const carrito = useCarrito(
    {
      precioItemCarrito,
      normalizarItemCarrito,
      precioCatalogoPorId,
      velas,
      inciensos,
      figuras,
      kits
    },
    mostrarNotificacion
  );
  const { cart, setCart, total, totalItemsCarrito, agregarAlCarrito, cambiarCantidad, getStockProducto } = carrito;
  const prevItemsCarritoRef = useRef(totalItemsCarrito);
  useEffect(() => {
    if (totalItemsCarrito > prevItemsCarritoRef.current) {
      preloadCarritoOnce();
      void prefetchConDelay("intent-after-add", () => {
        preloadCuentaOnce();
      }, 120);
    }
    prevItemsCarritoRef.current = totalItemsCarrito;
  }, [totalItemsCarrito]);
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 600) {
        runOnce("intent-scroll-buy", preloadCarritoPage);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [categoriaEditarProductos, setCategoriaEditarProductos] = useState<"velas" | "inciensos" | "figuras">("velas");
  const [productoSeleccionado, setProductoSeleccionado] = useState<string>("");
  const [previewProducto, setPreviewProducto] = useState<string | null>(null);
  const [nombreImagenProducto, setNombreImagenProducto] = useState("");
  const [colorProducto, setColorProducto] = useState<string>("#ffffff");
  const [tamanoProducto, setTamanoProducto] = useState<string>("22");
  const [estiloTextoProducto, setEstiloTextoProducto] = useState<string>("normal");

  const [categoriaNuevoProducto, setCategoriaNuevoProducto] = useState<"velas" | "inciensos" | "figuras">("velas");
  const [nuevoProductoNombre, setNuevoProductoNombre] = useState("");
  const [nuevoProductoPrecio, setNuevoProductoPrecio] = useState("10");
  const [nuevoProductoStock, setNuevoProductoStock] = useState(5);
  const [nuevoProductoDescripcion, setNuevoProductoDescripcion] = useState("");
  const [nuevoProductoImagen, setNuevoProductoImagen] = useState<string | null>(null);
  const [nuevoProductoNombreImagen, setNuevoProductoNombreImagen] = useState("");
  const [nuevoProductoTamano, setNuevoProductoTamano] = useState("22");
  const [nuevoProductoColor, setNuevoProductoColor] = useState("#ffffff");
  const [nuevoProductoEstilo, setNuevoProductoEstilo] = useState<string>("normal");

  useEffect(() => {
    if (pagina !== "editarCategorias") return;
    loadCategoryImage(categoriaSeleccionada);
  }, [pagina, categoriaSeleccionada, loadCategoryImage]);
  const [mostrarAvisoCookies, setMostrarAvisoCookies] = useState(false);
  const [claveAdmin, setClaveAdmin] = useState("");
  const [accesoAdmin, setAccesoAdmin] = useState(false);

  const [numeroSeguimiento, setNumeroSeguimiento] = useState("");
  const [pedidoBuscado, setPedidoBuscado] = useState<Pedido | null>(null);

  const [formPedidoAbierto, setFormPedidoAbierto] = useState(false);
  const [pasoFinalizarCompra, setPasoFinalizarCompra] = useState<"datos" | "confirmarDireccion" | "pago">("datos");
  const [pedidoRealizado, setPedidoRealizado] = useState(false);
  const [urlWhatsAppPendiente, setUrlWhatsAppPendiente] = useState<string | null>(null);
  const [numeroPedidoPreview, setNumeroPedidoPreview] = useState<string | null>(null);
  const [ultimoPedidoNumero, setUltimoPedidoNumero] = useState<string | null>(null);
  const { pedidos, setPedidos } = usePedidosMaika();
  const [busquedaPedido, setBusquedaPedido] = useState("");
  const [pedidoAbierto, setPedidoAbierto] = useState<number | null>(null);
  const [pedidoFacturaAbierto, setPedidoFacturaAbierto] = useState<Pedido | null>(null);

  const [pendientesAbierto, setPendientesAbierto] = useState(true);
  const [enviadosAbierto, setEnviadosAbierto] = useState(false);
  const [entregadosAbierto, setEntregadosAbierto] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [confirmacionBizumOtroNumeroAbierto, setConfirmacionBizumOtroNumeroAbierto] = useState(false);
  const bizumConfirmadoRef = useRef(false);

  const [modalUsuariosAbierto, setModalUsuariosAbierto] = useState(false);
  const { listaUsuarios, setListaUsuarios } = useUsuarios();
  const [modalEditarUsuarioAbierto, setModalEditarUsuarioAbierto] = useState(false);
  const [editUsuarioForm, setEditUsuarioForm] = useState<EditUsuarioForm | null>(null);
  const [metodoPago, setMetodoPago] = useState<"bizum" | "tarjeta">("bizum");
  const [datosPago, setDatosPago] = useState({
    bizumTelefono: "",
    tarjetaNumero: "",
    tarjetaTitular: "",
    tarjetaCaducidad: "",
    tarjetaCVV: ""
  });

  const [modalRepeatPedidoAbierto, setModalRepeatPedidoAbierto] = useState(false);
  const [pedidoRepeatSeleccionado, setPedidoRepeatSeleccionado] = useState<MaikaPedidoLS | null>(null);
  const [avisoTelefonoCheckout, setAvisoTelefonoCheckout] = useState<{ encontrado: boolean; texto: string } | null>(null);
  const ACCESO_RAPIDO_MAX_INTENTOS_EMAIL = 3;
  const ACCESO_RAPIDO_MSG_EMAIL_NO_COINCIDE = "El correo no coincide con este teléfono.";
  const [accesoRapidoCheckoutAbierto, setAccesoRapidoCheckoutAbierto] = useState(false);
  const [accesoRapidoPaso, setAccesoRapidoPaso] = useState<1 | 2 | 3 | 4>(1);
  const [accesoRapidoTelefono, setAccesoRapidoTelefono] = useState("");
  const [accesoRapidoEmail, setAccesoRapidoEmail] = useState("");
  /** Email real en minúsculas si la cuenta ya tiene email (nunca se muestra completo en UI; solo validación/envío). */
  const [accesoRapidoEmailRegistrado, setAccesoRapidoEmailRegistrado] = useState("");
  const [accesoRapidoCodigoEnviado, setAccesoRapidoCodigoEnviado] = useState("");
  const [accesoRapidoCodigoIngresado, setAccesoRapidoCodigoIngresado] = useState("");
  const [accesoRapidoCodigoUltimoPedido, setAccesoRapidoCodigoUltimoPedido] = useState("");
  const [accesoRapidoIntentosSeguridad, setAccesoRapidoIntentosSeguridad] = useState(0);
  const [accesoRapidoEstadoVerificacionSeguridad, setAccesoRapidoEstadoVerificacionSeguridad] = useState<"idle" | "ok" | "error">("idle");
  const [accesoRapidoReenvioEn, setAccesoRapidoReenvioEn] = useState(0);
  const [accesoRapidoCuentaSinEmail, setAccesoRapidoCuentaSinEmail] = useState(false);
  const [accesoRapidoCuentaConActividadSinEmail, setAccesoRapidoCuentaConActividadSinEmail] = useState(false);
  const [accesoRapidoCodigoExpiraEnMs, setAccesoRapidoCodigoExpiraEnMs] = useState<number | null>(null);
  const [accesoRapidoIntentosCodigo, setAccesoRapidoIntentosCodigo] = useState(0);
  const [accesoRapidoCodigoBloqueado, setAccesoRapidoCodigoBloqueado] = useState(false);
  const [accesoRapidoEmailVerificado, setAccesoRapidoEmailVerificado] = useState("");
  const [accesoRapidoPasswordNueva, setAccesoRapidoPasswordNueva] = useState("");
  const [accesoRapidoPasswordConfirmar, setAccesoRapidoPasswordConfirmar] = useState("");
  const [accesoRapidoMostrarPasswordNueva, setAccesoRapidoMostrarPasswordNueva] = useState(false);
  const [accesoRapidoMostrarPasswordConfirmar, setAccesoRapidoMostrarPasswordConfirmar] = useState(false);
  /** Un solo estado: intentos + bloqueo + mensaje (evita que el contador y el texto queden desincronizados). */
  const [accesoRapidoEmailUi, setAccesoRapidoEmailUi] = useState<{
    intentosRestantes: number;
    bloqueado: boolean;
    ayudaInline: string | null;
  }>(() => ({
    intentosRestantes: ACCESO_RAPIDO_MAX_INTENTOS_EMAIL,
    bloqueado: false,
    ayudaInline: null
  }));
  const [enviando, setEnviando] = useState(false);
  const [errorCodigo, setErrorCodigo] = useState(false);
  const [tickAccesoRapido, setTickAccesoRapido] = useState(0);
  const [tickBloqueoEmailAccesoRapido, setTickBloqueoEmailAccesoRapido] = useState(0);
  const [accesoRapidoSeguridadUiBloqueado, setAccesoRapidoSeguridadUiBloqueado] = useState(false);
  const [tickBloqueoSeguridadAccesoRapido, setTickBloqueoSeguridadAccesoRapido] = useState(0);
  const [textoCuentaAtrasBloqueoSeguridadUi, setTextoCuentaAtrasBloqueoSeguridadUi] = useState("00:00");
  const accesoRapidoPasswordEstado = evaluarPasswordBasica((accesoRapidoPasswordNueva || "").trim());
  const accesoRapidoPassValida = accesoRapidoPasswordEstado.valida;
  const accesoRapidoPasswordsCoinciden =
    (accesoRapidoPasswordNueva || "").trim().length > 0 &&
    (accesoRapidoPasswordConfirmar || "").trim().length > 0 &&
    (accesoRapidoPasswordNueva || "").trim() === (accesoRapidoPasswordConfirmar || "").trim();
  const accesoRapidoPuedeGuardarPassword = accesoRapidoPassValida && accesoRapidoPasswordsCoinciden;
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [cuponInput, setCuponInput] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState<CuponAplicado | null>(null);
  const [cuponError, setCuponError] = useState<string | null>(null);
  const [mostrarInputCuponCheckout, setMostrarInputCuponCheckout] = useState(false);
  const [cuponesAdmin, setCuponesAdmin] = useState<Record<string, { tipo: "porcentaje" | "envio_gratis"; valor: number }>>({});
  const [mostrarConfigCookies, setMostrarConfigCookies] = useState(false);
  const [consentimientoCookies, setConsentimientoCookies] = useState<ConsentimientoCookies>({
    necesarias: true,
    preferencias: false,
    analiticas: false,
    marketing: false,
    fechaActualizacion: "",
    version: COOKIE_CONSENT_VERSION
  });
  const [umbralStockBajo, setUmbralStockBajo] = useState(2);
  const [notaPedidoEnvio, setNotaPedidoEnvio] = useState(NOTA_PEDIDO_ENVIO_DEFAULT);
  const [desplegableInicio, setDesplegableInicio] = useState(DESPLEGABLE_INICIO_DEFAULT);
  const [serviciosInicio, setServiciosInicio] = useState<ServicioInicio[]>(SERVICIOS_INICIO_DEFAULT);
  const [categoriaTiendaAlAbrir, setCategoriaTiendaAlAbrir] = useState<string | null>(null);
  const [busquedaTienda, setBusquedaTienda] = useState("");
  const { perfil: perfilCompraRapida, setPerfil: setPerfilCompraRapida } = usePerfilCompraRapida(QUICK_CHECKOUT_KEY);
  const [recordarDatosInvitado, setRecordarDatosInvitado] = useState(false);
  const [direccionesCheckout, setDireccionesCheckout] = useState<DireccionUsuario[]>([]);
  const [direccionCheckoutSeleccionadaId, setDireccionCheckoutSeleccionadaId] = useState("");
  const [mostrarCamposOpcionalesCheckout, setMostrarCamposOpcionalesCheckout] = useState(false);
  const [ubicacionManualPoblacion, setUbicacionManualPoblacion] = useState(false);
  const [ubicacionManualProvincia, setUbicacionManualProvincia] = useState(false);
  const [telefonoCheckoutValidPulse, setTelefonoCheckoutValidPulse] = useState(false);
  const [, setAdminSessionTick] = useState(0);
  const esAdmin = isAdminAuthorized();
  const adminAhora = new Date();
  const adminUltimoLoginMs = getAdminLastLoginMs();
  const adminUltimoLoginTexto = adminUltimoLoginMs
    ? new Date(adminUltimoLoginMs).toLocaleString("es-ES")
    : "Sin registro";
  const adminAhoraTexto = adminAhora.toLocaleString("es-ES");

  useEffect(() => {
    const refrescarCuentaAdmin = () => setAdminSessionTick((prev) => prev + 1);
    refrescarCuentaAdmin();
    const id = window.setInterval(() => {
      refrescarCuentaAdmin();
    }, 5000);
    return () => {
      window.clearInterval(id);
    };
  }, []);

  const abrirTiendaConCategoria = useCallback((categoria: string) => {
    setCategoriaTiendaAlAbrir(categoria);
    setPagina("tienda");
  }, [setPagina]);

  const [datosCliente, setDatosCliente] = useState<Cliente>({
    nombre: "",
    apellidos: "",
    nombreApellidos: "",
    email: "",
    dni: "",
    telefono: "",
    direccion: "",
    calle: "",
    numero: "",
    bloque: "",
    escalera: "",
    piso: "",
    puerta: "",
    ciudad: "",
    cp: "",
    poblacion: "",
    provincia: "",
    pais: "",
    notas: ""
  });

  const [sugerenciasCalleCheckout, setSugerenciasCalleCheckout] = useState<SugerenciaDireccion[]>([]);
  const [mostrarSugerenciasCalleCheckout, setMostrarSugerenciasCalleCheckout] = useState(false);
  const [buscandoSugerenciasCalleCheckout, setBuscandoSugerenciasCalleCheckout] = useState(false);
  const debounceCalleCheckoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const calleElegidaDesdeSugerenciaRef = useRef(false);
  const permitirSugerenciasCalleRef = useRef(false);
  const inputCalleCheckoutRef = useRef<HTMLInputElement>(null);
  const inputTelefonoCheckoutRef = useRef<HTMLInputElement>(null);
  const textareaNotasCheckoutRef = useRef<HTMLTextAreaElement>(null);
  const botonIrAlPagoRef = useRef<HTMLButtonElement>(null);
  const inputAccesoRapidoPasswordNuevaRef = useRef<HTMLInputElement>(null);
  const inputAccesoRapidoPasswordConfirmarRef = useRef<HTMLInputElement>(null);
  const botonAccesoRapidoCrearPasswordRef = useRef<HTMLButtonElement>(null);
  /** Solo avanzar si pointerdown fue EN el botón y pointerup termina en el botón (mismo pointerId). Evita clics/onClick espurios al seleccionar texto en el teléfono. */
  const irAlPagoPointerIdRef = useRef<number | null>(null);
  const irAlPagoEjecutarRef = useRef<() => void>(() => {});
  const botonEnviarCodigoAccesoRapidoRef = useRef<HTMLButtonElement>(null);
  const telefonoCheckoutValidoPrevRef = useRef(false);
  const googleAutocompleteRef = useRef<{ unbind: () => void } | null>(null);

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [modoRegistro, setModoRegistro] = useState<"login" | "register">("login");
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
    pais: "España",
    confirmPassword: "",
    codigoVerificacion: "",
    codigoIngresado: "",
    pasoVerificacion: 1
  });
  const [reenvioDisponibleEn, setReenvioDisponibleEn] = useState(0);
  const esAppNativa = Capacitor.isNativePlatform();

  // ================== SISTEMA maika_usuarios (teléfono como clave única) ==================
  const leerMaikaUsuarios = (): MaikaUsuarioLS[] => leerMaikaUsuariosStorage();
  const guardarMaikaUsuarios = (usuarios: MaikaUsuarioLS[]) =>
    guardarMaikaUsuariosStorage(usuarios, normalizarTelefonoES9);

  /** Sincroniza cambios manuales de gestión (legacy) hacia maika_usuarios por teléfono. */
  const sincronizarMaikaDesdeLegacy = (legacyUsuarios: Usuario[]) =>
    sincronizarMaikaDesdeLegacyUtil({
      legacyUsuarios,
      leerMaikaUsuarios,
      guardarMaikaUsuarios,
      normalizarTelefonoES9,
      claveTelefonoES,
      repartirNombreApellidos
    });

  /** maika_usuarios es la fuente de verdad del email en checkout; legacy a veces va desincronizado. */
  const findMaikaUsuarioPorTel9 = (tel9: string): MaikaUsuarioLS | null =>
    findMaikaUsuarioPorTel9Storage(tel9, leerMaikaUsuarios, claveTelefonoES, normalizarTelefonoES9);

  const emailRegistradoUnificadoParaTel9 = (tel9: string): string =>
    emailRegistradoUnificadoParaTel9Storage(tel9, findMaikaUsuarioPorTel9, normalizarTelefonoES9);

  const telefonoTieneActividadSinEmail = (tel9: string): boolean =>
    telefonoTieneActividadSinEmailUtil({
      tel9,
      emailRegistradoUnificadoParaTel9,
      findMaikaUsuarioPorTel9,
      claveTelefonoES,
      direccionesDesdeHistorial,
      normalizarTelefonoES9
    });

  const obtenerCodigoUltimoPedidoPorTel9 = (tel9: string): string =>
    obtenerCodigoUltimoPedidoPorTel9Util(tel9, claveTelefonoES, parseFechaPedido, leerMaikaPedidos);

  const abrirRegistroForzadoDesdeAcceso = (modo: "registro" | "activar") => {
    resetAccesoRapidoCheckout();
    setAccesoRapidoCheckoutAbierto(false);
    setAvisoTelefonoCheckout(null);
    setFormPedidoAbierto(false);
    setPasoFinalizarCompra("datos");
    setModoRegistro("register");
    setTelefonoForzadoRegistroDesdeAcceso(accesoRapidoTelefono);
    setModoForzadoRegistroDesdeAcceso(modo);
    if (modo !== "activar") setConfirmacionIdentidadActivacion(false);
    setFormAuth(crearFormAuthRegistroDesdeAcceso(accesoRapidoTelefono));
    setPagina("cuenta");
  };

  const resolverUsuarioLegacyIdxPorTel9 = (tel9: string): { usuarios: Usuario[]; idx: number } =>
    resolverUsuarioLegacyIdxPorTel9Util(
      tel9,
      normalizarTelefonoES9,
      findMaikaUsuarioPorTel9,
      guardarMaikaUsuarios,
      leerMaikaUsuarios
    );

  const DIRECCIONES_MAX = 3;

  const direccionClave = (d: Pick<DireccionUsuario, "calle" | "numero" | "cp" | "poblacion" | "provincia" | "pais">) =>
    direccionClaveUtil(d);

  const direccionDesdeCliente = (c: Cliente): DireccionUsuario | null =>
    direccionDesdeClienteUtil(c);

  const direccionLegacyDesdeUsuarioLS = (u: MaikaUsuarioLS | null | undefined): DireccionUsuario | null =>
    direccionLegacyDesdeUsuarioLSUtil(u);

  const normalizarDireccionesUsuario = (dirsRaw: unknown): DireccionUsuario[] =>
    normalizarDireccionesUsuarioUtil(dirsRaw, DIRECCIONES_MAX);

  const direccionesDesdeHistorial = (claveTelefono: string | null): DireccionUsuario[] => {
    if (!claveTelefono) return [];
    let pedidosLegacy: Pedido[] = [];
    try {
      const raw = localStorage.getItem("pedidosMaika");
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      pedidosLegacy = Array.isArray(parsed) ? (parsed as Pedido[]) : [];
    } catch {
      pedidosLegacy = [];
    }
    return direccionesDesdeHistorialUtil(claveTelefono, pedidosLegacy, claveTelefonoES, DIRECCIONES_MAX);
  };

  const aplicarDireccionEnCheckout = (dir: DireccionUsuario) => {
    permitirSugerenciasCalleRef.current = false;
    setMostrarSugerenciasCalleCheckout(false);
    setSugerenciasCalleCheckout([]);
    setDatosCliente((prev) => ({
      ...prev,
      direccion: construirDireccionBasica(dir.calle, dir.numero),
      calle: dir.calle || prev.calle,
      numero: dir.numero || prev.numero,
      bloque: dir.bloque || "",
      escalera: dir.escalera || "",
      piso: dir.piso || "",
      puerta: dir.puerta || "",
      cp: dir.cp || prev.cp,
      poblacion: dir.poblacion || prev.poblacion,
      ciudad: dir.poblacion || prev.ciudad,
      provincia: dir.provincia || prev.provincia,
      pais: dir.pais || prev.pais
    }));
  };

  // ================== SISTEMA maika_pedidos (historial por usuario) ==================
  const leerMaikaPedidos = (): MaikaPedidoLS[] => leerMaikaPedidosStorage();
  const guardarMaikaPedidos = (pedidos: MaikaPedidoLS[]) => guardarMaikaPedidosStorage(pedidos);

  const ultimoTelefonoRecuperadoRef = useRef<string | null>(null);

  useEffect(() => {
    // Migración: pasar usuarios antiguos (key "usuarios") a "maika_usuarios" para autocompletado por teléfono
    const yaMigrado = localStorage.getItem("maika_usuarios_migrado") === "1";
    if (yaMigrado) return;

    let antiguos: Usuario[] = [];
    try {
      antiguos = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
    } catch {
      antiguos = [];
    }
    if (!Array.isArray(antiguos) || antiguos.length === 0) {
      localStorage.setItem("maika_usuarios_migrado", "1");
      return;
    }

    const actuales = leerMaikaUsuarios();
    const mapa = new Map<string, MaikaUsuarioLS>();
    for (const u of actuales) {
      if (u?.telefono) mapa.set(String(u.telefono).trim(), u);
    }

    for (const u of antiguos) {
      const clave = claveTelefonoES(u.telefono || "");
      if (!clave) continue;
      if (mapa.has(clave)) continue;

      const nombreCompleto = String(u.nombre || "").trim();
      const partes = nombreCompleto.split(/\s+/).filter(Boolean);
      const nombreDetectado = partes.length > 0 ? partes[0] : "";
      const apellidosDetectados = partes.length > 1 ? partes.slice(1).join(" ") : "";
      const { nombre, apellidos } = repartirNombreApellidos(nombreDetectado, apellidosDetectados);
      const calle = String(u.calle || "").trim();
      const numero = String(u.numero || "").trim();
      const cp = String(u.cp || "").trim();
      const poblacion = String(u.poblacion || "").trim();
      const provincia = String(u.provincia || "").trim();
      const pais = String(u.pais || "").trim();
      const direccionMigrada: DireccionUsuario | null =
        calle && numero && cp && poblacion && provincia && pais
          ? {
              id: `dir_mig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              alias: "Dirección principal",
              calle,
              numero,
              bloque: String(u.bloque || "").trim(),
              escalera: String(u.escalera || "").trim(),
              piso: String(u.piso || "").trim(),
              puerta: String(u.puerta || "").trim(),
              cp,
              poblacion,
              provincia,
              pais
            }
          : null;

      mapa.set(clave, {
        telefono: clave,
        nombre,
        apellidos,
        email: String(u.email || "").trim(),
        dni: String((u as any).dni || "").trim(),
        calle,
        numero,
        bloque: String(u.bloque || "").trim(),
        escalera: String(u.escalera || "").trim(),
        piso: String(u.piso || "").trim(),
        puerta: String(u.puerta || "").trim(),
        cp,
        poblacion,
        provincia,
        pais,
        direcciones: direccionMigrada ? [direccionMigrada] : [],
        direccionPredeterminadaId: direccionMigrada?.id || ""
      });
    }

    const migrados = Array.from(mapa.values());
    guardarMaikaUsuarios(migrados);
    localStorage.setItem("maika_usuarios_migrado", "1");
  }, []);

  useEffect(() => {
    // Buscar y NO autorellenar al escribir 9 dígitos en teléfono
    // (privacidad): el usuario no debe ver datos de otro por un typo.
    const clave = claveTelefonoES(datosCliente.telefono || "");
    if (!clave) {
      setAvisoTelefonoCheckout(null);
      return;
    }
    if (ultimoTelefonoRecuperadoRef.current === clave) return;

    // Ya hay sesión: no mostrar "inicia sesión / invitado" (los datos vienen de la cuenta).
    if (usuario) {
      setAvisoTelefonoCheckout(null);
      ultimoTelefonoRecuperadoRef.current = clave;
      return;
    }

    const usuarios = leerMaikaUsuarios();
    const encontrado = usuarios.find((u) => (u.telefono || "").trim() === clave);
    if (!encontrado) {
      ultimoTelefonoRecuperadoRef.current = clave;
      setAvisoTelefonoCheckout(null);
      return;
    }

    ultimoTelefonoRecuperadoRef.current = clave;
    setAvisoTelefonoCheckout({ encontrado: true, texto: "Usuario registrado. Inicia sesión para recuperar tus datos guardados." });

    // Si el usuario tenía abierto/desplegando sugerencias, evitamos que se perciba como “autorrellenado”.
    calleElegidaDesdeSugerenciaRef.current = true;
    setSugerenciasCalleCheckout([]);
    setMostrarSugerenciasCalleCheckout(false);
    setBuscandoSugerenciasCalleCheckout(false);
  }, [datosCliente.telefono, usuario]);

  // Mensaje fijo solo durante la introducción de datos.
  useEffect(() => {
    if (!formPedidoAbierto || pasoFinalizarCompra !== "datos") setAvisoTelefonoCheckout(null);
  }, [pasoFinalizarCompra, formPedidoAbierto]);

  useEffect(() => {
    if (usuario) {
      setAvisoTelefonoCheckout(null);
    } else {
      // Tras cerrar sesión, permitir de nuevo la lógica de aviso por teléfono (invitado)
      ultimoTelefonoRecuperadoRef.current = null;
    }
  }, [usuario]);

  useEffect(() => {
    localStorage.setItem(RECORDAR_INVITADO_KEY, recordarDatosInvitado ? "1" : "0");
    if (!recordarDatosInvitado) {
      // Si no quiere recordar en este dispositivo, borrar caché de invitado.
      localStorage.removeItem("clienteMaika");
      localStorage.removeItem(QUICK_CHECKOUT_KEY);
      if (!usuario) setPerfilCompraRapida(null);
    }
  }, [recordarDatosInvitado, usuario]);

  useEffect(() => {
    if (accesoRapidoReenvioEn <= 0) return;
    const id = window.setInterval(() => {
      setAccesoRapidoReenvioEn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [accesoRapidoReenvioEn]);

  useEffect(() => {
    if (!accesoRapidoCheckoutAbierto) return;
    if (accesoRapidoPaso !== 2) return;
    if (!accesoRapidoCodigoExpiraEnMs) return;
    const id = window.setInterval(() => setTickAccesoRapido((p) => p + 1), 1000);
    return () => window.clearInterval(id);
  }, [accesoRapidoCheckoutAbierto, accesoRapidoPaso, accesoRapidoCodigoExpiraEnMs]);

  const accesoRapidoCodigoExpiradoAhora = useMemo(() => {
    if (!accesoRapidoCodigoExpiraEnMs) return false;
    return Date.now() > accesoRapidoCodigoExpiraEnMs;
  }, [accesoRapidoCodigoExpiraEnMs, tickAccesoRapido]);

  useEffect(() => {
    if (!accesoRapidoCheckoutAbierto || !accesoRapidoEmailUi.bloqueado) return;
    const tel9 = normalizarTelefonoES9(accesoRapidoTelefono || "");
    const id = window.setInterval(() => {
      setTickBloqueoEmailAccesoRapido((x) => x + 1);
      const ms = msRestantesBloqueoEmailAccesoRapido(tel9);
      if (ms <= 0) {
        setAccesoRapidoEmailUi({
          intentosRestantes: ACCESO_RAPIDO_MAX_INTENTOS_EMAIL,
          bloqueado: false,
          ayudaInline: null
        });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [accesoRapidoCheckoutAbierto, accesoRapidoEmailUi.bloqueado, accesoRapidoTelefono]);

  const textoCuentaAtrasBloqueoEmail = useMemo(() => {
    if (!accesoRapidoEmailUi.bloqueado || !accesoRapidoCheckoutAbierto) return "00:00";
    const tel9 = normalizarTelefonoES9(accesoRapidoTelefono || "");
    const ms = msRestantesBloqueoEmailAccesoRapido(tel9);
    return formatearCuentaAtrasMmSs(ms);
  }, [accesoRapidoEmailUi.bloqueado, accesoRapidoCheckoutAbierto, accesoRapidoTelefono, tickBloqueoEmailAccesoRapido]);

  useEffect(() => {
    if (!accesoRapidoCheckoutAbierto || accesoRapidoPaso !== 4 || !accesoRapidoSeguridadUiBloqueado) return;
    const tel9 = normalizarTelefonoES9(accesoRapidoTelefono || "");
    setTextoCuentaAtrasBloqueoSeguridadUi(formatearCuentaAtrasMmSs(msRestantesBloqueoSeguridadAccesoRapido(tel9)));
    const id = window.setInterval(() => {
      setTickBloqueoSeguridadAccesoRapido((x) => x + 1);
      const ms = msRestantesBloqueoSeguridadAccesoRapido(tel9);
      setTextoCuentaAtrasBloqueoSeguridadUi(formatearCuentaAtrasMmSs(ms));
      if (ms <= 0) {
        setAccesoRapidoSeguridadUiBloqueado(false);
        setAccesoRapidoIntentosSeguridad(0);
        setAccesoRapidoEstadoVerificacionSeguridad("idle");
        setAccesoRapidoCodigoUltimoPedido("");
        setTextoCuentaAtrasBloqueoSeguridadUi("00:00");
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [accesoRapidoCheckoutAbierto, accesoRapidoPaso, accesoRapidoSeguridadUiBloqueado, accesoRapidoTelefono]);

  const msBloqueoSeguridadAccesoRapido = useMemo(() => {
    if (!accesoRapidoSeguridadUiBloqueado || !accesoRapidoCheckoutAbierto || accesoRapidoPaso !== 4) return 0;
    const tel9 = normalizarTelefonoES9(accesoRapidoTelefono || "");
    return msRestantesBloqueoSeguridadAccesoRapido(tel9);
  }, [accesoRapidoSeguridadUiBloqueado, accesoRapidoCheckoutAbierto, accesoRapidoPaso, accesoRapidoTelefono, tickBloqueoSeguridadAccesoRapido]);

  const pedidosPendientes = useMemo(
    () => pedidos.filter(p => (p.estado ?? "pendiente") === "pendiente"),
    [pedidos]
  );

  const pedidosEnviados = useMemo(
    () => pedidos.filter(p => (p.estado ?? "pendiente") === "enviado"),
    [pedidos]
  );

  const pedidosEntregados = useMemo(
    () => pedidos.filter(p => (p.estado ?? "pendiente") === "entregado"),
    [pedidos]
  );

  const pedidosPendientesOrdenados = useMemo(
    () => [...pedidosPendientes].sort((a: Pedido, b: Pedido) =>
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    ),
    [pedidosPendientes]
  );

  const pedidosEnviadosOrdenados = useMemo(
    () => [...pedidosEnviados].sort((a: Pedido, b: Pedido) =>
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    ),
    [pedidosEnviados]
  );

  const pedidosEntregadosOrdenados = useMemo(
    () => [...pedidosEntregados].sort((a: Pedido, b: Pedido) =>
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    ),
    [pedidosEntregados]
  );

  const metricasAdmin = useMemo(
    () =>
      calcularMetricasAdmin({
        pedidos,
        cart,
        catalogoProductos: [...velas, ...inciensos, ...figuras, ...kits],
        umbralStockBajo,
        parseFechaPedido,
        precioSeguro
      }),
    [pedidos, cart, velas, inciensos, figuras, kits, umbralStockBajo]
  );

  const metricasUsuariosAdmin = useMemo(
    () => calcularMetricasUsuariosAdmin(listaUsuarios),
    [listaUsuarios, usuario, accesoAdmin]
  );

  // ========== FUNCIÓN ENVIAR EMAIL CORREGIDA ==========
  const enviarCodigoEmail = async (email: string, nombre: string, codigo: string) => {
    return enviarCodigoEmailUtil(email, nombre, codigo, EMAILJS_CONFIG);
  };

  const renderRequisitosPassword = (password: string) => {
    const estado = evaluarPasswordBasica(password || "");
    const tieneMinimo = estado.tieneMinimo;
    const tieneLetrasYNumeros = estado.tieneLetrasYNumeros;
    return (
      <div style={{ marginTop: 8, marginBottom: 2, fontSize: 12, lineHeight: 1.45 }}>
        <div style={{ color: tieneMinimo ? "rgba(126,205,143,0.95)" : "rgba(255,255,255,0.62)" }}>
          {tieneMinimo ? "✔" : "•"} Minimo 8 caracteres
        </div>
        <div style={{ color: tieneLetrasYNumeros ? "rgba(126,205,143,0.95)" : "rgba(255,255,255,0.62)" }}>
          {tieneLetrasYNumeros ? "✔" : "•"} Contiene letras y numeros
        </div>
      </div>
    );
  };

  const ACCESO_RAPIDO_CODIGO_EXPIRA_MIN = 10;
  const ACCESO_RAPIDO_MAX_INTENTOS = 5;

  const resetAccesoRapidoCheckout = () =>
    resetAccesoRapidoCheckoutState({
      setAccesoRapidoPaso,
      setAccesoRapidoCodigoEnviado,
      setAccesoRapidoCodigoIngresado,
      setAccesoRapidoCodigoUltimoPedido,
      setAccesoRapidoIntentosSeguridad,
      setAccesoRapidoEstadoVerificacionSeguridad,
      setAccesoRapidoSeguridadUiBloqueado,
      setAccesoRapidoCodigoExpiraEnMs,
      setAccesoRapidoIntentosCodigo,
      setAccesoRapidoCodigoBloqueado,
      setAccesoRapidoReenvioEn,
      setAccesoRapidoEmailVerificado,
      setAccesoRapidoPasswordNueva,
      setAccesoRapidoPasswordConfirmar,
      setAccesoRapidoMostrarPasswordNueva,
      setAccesoRapidoMostrarPasswordConfirmar,
      setErrorCodigo
    });

  const abrirAccesoRapidoCheckout = () => {
    const tel9 = normalizarTelefonoES9(datosCliente.telefono || "");
    setAccesoRapidoTelefono(tel9);
    const emailReal = emailRegistradoUnificadoParaTel9(tel9);
    const sinEmail = !emailReal;
    const actividadSinEmail = sinEmail && telefonoTieneActividadSinEmail(tel9);
    setAccesoRapidoCuentaSinEmail(sinEmail);
    setAccesoRapidoCuentaConActividadSinEmail(actividadSinEmail);
    const msBloqueoSeg = msRestantesBloqueoSeguridadAccesoRapido(tel9);
    setAccesoRapidoSeguridadUiBloqueado(msBloqueoSeg > 0);
    if (emailReal) {
      setAccesoRapidoEmailRegistrado(emailReal.trim().toLowerCase());
      setAccesoRapidoEmail("");
    } else {
      setAccesoRapidoEmailRegistrado("");
      setAccesoRapidoEmail("");
    }
    setModoForzadoRegistroDesdeAcceso("");
    setAccesoRapidoCodigoEnviado("");
    setAccesoRapidoCodigoIngresado("");
    setAccesoRapidoCodigoUltimoPedido("");
    setAccesoRapidoReenvioEn(0);
    setAccesoRapidoCodigoExpiraEnMs(null);
    setAccesoRapidoIntentosCodigo(0);
    setAccesoRapidoCodigoBloqueado(false);
    setAccesoRapidoEmailVerificado("");
    setAccesoRapidoPasswordNueva("");
    setAccesoRapidoPasswordConfirmar("");
    if (leerBloqueoEmailAccesoRapidoActivo(tel9)) {
      setAccesoRapidoEmailUi({ intentosRestantes: 0, bloqueado: true, ayudaInline: null });
    } else {
      setAccesoRapidoEmailUi({
        intentosRestantes: ACCESO_RAPIDO_MAX_INTENTOS_EMAIL,
        bloqueado: false,
        ayudaInline: null
      });
    }
    setAccesoRapidoPaso(1);
    setAccesoRapidoCheckoutAbierto(true);
  };

  // Cargar resto de datos guardados (usuario, cookies, etc.)
  useEffect(() => {
    // Migra datos antiguos: nunca permitir "verificado" sin email válido.
    try {
      const rawUsuarios = localStorage.getItem("usuarios");
      if (rawUsuarios) {
        const parsed = JSON.parse(rawUsuarios) as Usuario[];
        if (Array.isArray(parsed)) {
          const saneados = parsed.map(sanearVerificacionUsuario);
          localStorage.setItem("usuarios", JSON.stringify(saneados));
        }
      }
    } catch {
      // Ignorar storage corrupto para no bloquear arranque.
    }

    // ✅ Cargar usuario guardado
    const usuarioGuardado = localStorage.getItem("usuarioActual");
    if (usuarioGuardado) {
      try {
        const parsed = JSON.parse(usuarioGuardado) as Usuario;
        const saneado = sanearVerificacionUsuario(parsed);
        setUsuario(saneado);
        localStorage.setItem("usuarioActual", JSON.stringify(saneado));
      } catch {
        localStorage.removeItem("usuarioActual");
      }
    }

    const consentimientoCargado = cargarConsentimientoCookiesDesdeStorage(
      COOKIE_CONSENT_KEY,
      COOKIE_CONSENT_VERSION
    );
    if (consentimientoCargado) {
      setConsentimientoCookies(consentimientoCargado);
    }

    const recordarInvitadoRaw = localStorage.getItem(RECORDAR_INVITADO_KEY);
    setRecordarDatosInvitado(recordarInvitadoRaw === "1");

    // No precargar datos de checkout al entrar: el formulario empieza vacío siempre
    const umbralGuardado = localStorage.getItem(UMBRAL_STOCK_BAJO_KEY);
    if (umbralGuardado) {
      const n = parseInt(umbralGuardado, 10);
      if (Number.isFinite(n) && n >= 0 && n <= 99) setUmbralStockBajo(n);
    }
    const notaGuardada = localStorage.getItem(NOTA_PEDIDO_ENVIO_KEY);
    if (notaGuardada != null && notaGuardada !== "") setNotaPedidoEnvio(notaGuardada);
    const desplegableGuardado = localStorage.getItem(DESPLEGABLE_INICIO_KEY);
    if (desplegableGuardado) {
      try {
        const parsed = JSON.parse(desplegableGuardado);
        const def = DESPLEGABLE_INICIO_DEFAULT[0];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDesplegableInicio(parsed.map((b: { titulo?: string; subtitulo?: string; numProductos?: number; inicio?: number }) => ({
            titulo: typeof b.titulo === "string" ? b.titulo : def?.titulo ?? "",
            subtitulo: typeof b.subtitulo === "string" ? b.subtitulo : def?.subtitulo ?? "",
            inicio: Number.isFinite(b.inicio) && (b.inicio as number) >= 0 ? (b.inicio as number) : 0,
            numProductos: Number.isFinite(b.numProductos) && (b.numProductos as number) >= 1 ? Math.min(20, (b.numProductos as number)) : 3,
          })));
        } else if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && "titulo" in parsed) {
          setDesplegableInicio([{
            titulo: typeof parsed.titulo === "string" ? parsed.titulo : def?.titulo ?? "",
            subtitulo: typeof parsed.subtitulo === "string" ? parsed.subtitulo : def?.subtitulo ?? "",
            inicio: 0,
            numProductos: Number.isFinite(parsed.numProductos) && (parsed.numProductos as number) >= 1 ? Math.min(20, (parsed.numProductos as number)) : 3,
          }]);
        }
      } catch {
        // ignorar
      }
    }
    const serviciosGuardado = localStorage.getItem(SERVICIOS_INICIO_KEY);
    if (serviciosGuardado) {
      try {
        const parsed = JSON.parse(serviciosGuardado) as ServicioInicio[];
        if (Array.isArray(parsed) && parsed.length >= 3) {
          const def = SERVICIOS_INICIO_DEFAULT;
          setServiciosInicio(parsed.slice(0, 3).map((s, i) => ({
            titulo: typeof s.titulo === "string" ? s.titulo : (def[i]?.titulo ?? ""),
            imagen: typeof s.imagen === "string" ? s.imagen : (def[i]?.imagen ?? ""),
            duracion: typeof s.duracion === "string" ? s.duracion : (def[i]?.duracion ?? ""),
            precio: typeof s.precio === "string" ? s.precio : (def[i]?.precio ?? ""),
            textoBoton: typeof s.textoBoton === "string" ? s.textoBoton : (def[i]?.textoBoton ?? ""),
            urlWhatsApp: typeof s.urlWhatsApp === "string" ? s.urlWhatsApp : (def[i]?.urlWhatsApp ?? ""),
          })));
        }
      } catch {
        // ignorar
      }
    }
    if (!consentimientoCargado) {
      setMostrarAvisoCookies(true);
    }
    // Solo al montar: no depender de normalizarItemCarrito para no re-ejecutar al cambiar catálogo
  // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial intencional una sola vez
  }, []);

  useEffect(() => {
    let activo = true;
    const hydrateAuthUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const perfil = await obtenerPerfilApi(token);
        if (!activo) return;
        const previoRaw = localStorage.getItem("usuarioActual");
        const previo = previoRaw ? (JSON.parse(previoRaw) as Usuario) : null;
        const usuarioFromMe: Usuario = {
          id: Number(perfil.id) || previo?.id || Date.now(),
          nombre: perfil.nombre || previo?.nombre || "Usuario",
          email: perfil.email || previo?.email || "",
          telefono: perfil.telefono || previo?.telefono || "",
          calle: previo?.calle || "",
          bloque: previo?.bloque || "",
          escalera: previo?.escalera || "",
          piso: previo?.piso || "",
          puerta: previo?.puerta || "",
          numero: previo?.numero || "",
          cp: previo?.cp || "",
          provincia: previo?.provincia || "",
          poblacion: previo?.poblacion || "",
          pais: previo?.pais || "",
          direccion: previo?.direccion || "",
          password: previo?.password || "",
          verificado: esEmailVerificable(perfil.email || previo?.email || ""),
          pedidos: previo?.pedidos || []
        };
        setUsuario(usuarioFromMe);
        localStorage.setItem("usuarioActual", JSON.stringify(usuarioFromMe));
      } catch {
        // Fallback local: si /me falla mantenemos usuarioActual.
      }
    };
    void hydrateAuthUser();
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    const haySesionActiva =
      !!usuario ||
      !!localStorage.getItem("token") ||
      !!localStorage.getItem("usuarioActual");
    if (!haySesionActiva) return;

    const timeoutMs = AUTO_LOGOUT_INACTIVIDAD_MIN * 60_000;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cerrarSesionPorInactividad = () => {
      setUsuario(null);
      localStorage.removeItem("token");
      localStorage.removeItem("maika_auth_user");
      localStorage.removeItem("usuarioActual");
      setPagina("cuenta");
      mostrarNotificacion("⏳ Sesión cerrada por inactividad", "normal");
    };

    const resetInactividad = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(cerrarSesionPorInactividad, timeoutMs);
    };

    const eventos: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart"
    ];
    for (const ev of eventos) {
      window.addEventListener(ev, resetInactividad, { passive: true });
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") resetInactividad();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    resetInactividad();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      for (const ev of eventos) {
        window.removeEventListener(ev, resetInactividad);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [usuario, setPagina, mostrarNotificacion]);

  useEffect(() => {
    if (pagina !== "editarProductos") return;
    const list = categoriaEditarProductos === "velas" ? velas : categoriaEditarProductos === "inciensos" ? inciensos : figuras;
    const first = list[0];
    if (first) {
      setProductoSeleccionado(`${categoriaEditarProductos}-${first.id}`);
      setTamanoProducto(String(first.nombreTamano ?? 22));
      setColorProducto(first.nombreColor ?? "#ffffff");
      setEstiloTextoProducto(first.nombreEstilo ?? "normal");
      setPreviewProducto(first.imagen ? first.imagen : null);
      setNombreImagenProducto("");
    }
  }, [pagina, categoriaEditarProductos, velas, inciensos, figuras]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data === "cerrarLegal") setLegalDoc(null);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const envioPreview = calcularEnvio(datosCliente.provincia, total);
  const totalPreview = total + envioPreview;
  const descuentoCupon = useMemo(() => {
    if (!cuponAplicado) return 0;
    const valor = Number(cuponAplicado.valor);
    if (cuponAplicado.tipo === "porcentaje" && Number.isFinite(valor)) {
      return (total * valor) / 100;
    }
    return envioPreview;
  }, [cuponAplicado, total, envioPreview]);

  const totalAPagarResumen = useMemo(
    () => Math.max(0, total + envioPreview - descuentoCupon),
    [total, envioPreview, descuentoCupon]
  );

  /** Validación para no pasar a "Revisa tus datos" sin completar campos obligatorios. (No usar normalizarTelefonoBizum aquí: se define más abajo.) */
  const datosObligatoriosCompletos = useMemo(() => {
    const n = `${(datosCliente.nombre || "").trim()} ${(datosCliente.apellidos || "").trim()}`.trim();
    const soloDigitos = (datosCliente.telefono || "").replace(/\D/g, "").trim();
    const t = soloDigitos.startsWith("0034") && soloDigitos.length > 4
      ? soloDigitos.slice(4)
      : soloDigitos.startsWith("34") && soloDigitos.length > 2
        ? soloDigitos.slice(2)
        : soloDigitos;
    const calle = (datosCliente.calle || "").trim();
    const num = (datosCliente.numero || "").trim();
    const cp = (datosCliente.cp || "").trim();
    const pob = (datosCliente.poblacion || "").trim();
    const prov = (datosCliente.provincia || "").trim();
    const pais = (datosCliente.pais || "").trim();
    return (
      n.length > 0 &&
      /^[67]\d{8}$/.test(t) &&
      calle.length > 0 &&
      num.length > 0 &&
      cp.length === 5 &&
      pob.length > 0 &&
      prov.length > 0 &&
      pais.length > 0
    );
  }, [datosCliente.nombre, datosCliente.apellidos, datosCliente.telefono, datosCliente.calle, datosCliente.numero, datosCliente.cp, datosCliente.poblacion, datosCliente.provincia, datosCliente.pais]);

  const primerCampoFaltanteCheckout = useMemo(() => {
    const nombreCompleto = `${(datosCliente.nombre || "").trim()} ${(datosCliente.apellidos || "").trim()}`.trim();
    if (!nombreCompleto) return "Nombre y apellidos";

    const soloDigitos = (datosCliente.telefono || "").replace(/\D/g, "").trim();
    const tel = soloDigitos.startsWith("0034") && soloDigitos.length > 4
      ? soloDigitos.slice(4)
      : soloDigitos.startsWith("34") && soloDigitos.length > 2
        ? soloDigitos.slice(2)
        : soloDigitos;
    if (!/^[67]\d{8}$/.test(tel)) return "Teléfono (móvil 9 dígitos)";

    const calle = (datosCliente.calle || "").trim();
    if (!calle) return "Dirección";

    const num = (datosCliente.numero || "").trim();
    if (!num) return "Número";

    const cp = (datosCliente.cp || "").trim();
    if (cp.length !== 5) return "Código postal (5 dígitos)";

    const pob = (datosCliente.poblacion || "").trim();
    if (!pob) return "Población";

    const prov = (datosCliente.provincia || "").trim();
    if (!prov) return "Provincia";

    const pais = (datosCliente.pais || "").trim();
    if (!pais) return "País";

    return null;
  }, [datosCliente.nombre, datosCliente.apellidos, datosCliente.telefono, datosCliente.calle, datosCliente.numero, datosCliente.cp, datosCliente.poblacion, datosCliente.provincia, datosCliente.pais]);

  irAlPagoEjecutarRef.current = () => {
    if (accesoRapidoCheckoutAbierto) return;
    if (!datosObligatoriosCompletos) {
      const faltante = primerCampoFaltanteCheckout;
      if ((faltante || "").toLowerCase().includes("teléfono")) {
        mostrarNotificacion("Revisa el teléfono (9 dígitos, empieza por 6 o 7)", "normal");
        inputTelefonoCheckoutRef.current?.focus();
        return;
      }
      mostrarNotificacion(`Revisa: ${faltante || "datos obligatorios"}`, "normal");
      return;
    }
    setAvisoTelefonoCheckout(null);
    setPasoFinalizarCompra("confirmarDireccion");
  };

  const telefonoCheckoutLimpio = normalizarTelefonoES9(datosCliente.telefono || "").slice(0, 9);
  const telefonoCheckoutEsValido = /^[67]\d{8}$/.test(telefonoCheckoutLimpio);
  const telefonoCheckoutPrimerDigito = telefonoCheckoutLimpio.slice(0, 1);
  const telefonoCheckoutPrefijoInvalido =
    telefonoCheckoutLimpio.length > 0 && telefonoCheckoutPrimerDigito !== "6" && telefonoCheckoutPrimerDigito !== "7";

  useEffect(() => {
    if (telefonoCheckoutEsValido && !telefonoCheckoutValidoPrevRef.current) {
      setTelefonoCheckoutValidPulse(true);
      const t = setTimeout(() => setTelefonoCheckoutValidPulse(false), 220);
      telefonoCheckoutValidoPrevRef.current = true;
      return () => clearTimeout(t);
    }
    if (!telefonoCheckoutEsValido) {
      telefonoCheckoutValidoPrevRef.current = false;
      setTelefonoCheckoutValidPulse(false);
    }
    return;
  }, [telefonoCheckoutEsValido]);

  useEffect(() => {
    const cancelar = (e: PointerEvent) => {
      if (irAlPagoPointerIdRef.current === e.pointerId) irAlPagoPointerIdRef.current = null;
    };
    window.addEventListener("pointercancel", cancelar, true);
    return () => window.removeEventListener("pointercancel", cancelar, true);
  }, []);

  useEffect(() => {
    const up = (e: PointerEvent) => {
      if (irAlPagoPointerIdRef.current !== e.pointerId) return;
      irAlPagoPointerIdRef.current = null;
      const btn = botonIrAlPagoRef.current;
      if (!btn || !formPedidoAbierto || pasoFinalizarCompra !== "datos" || accesoRapidoCheckoutAbierto) return;
      const { clientX: x, clientY: y } = e;
      const r = btn.getBoundingClientRect();
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) return;
      const top = document.elementFromPoint(x, y);
      if (!top || !btn.contains(top)) return;
      irAlPagoEjecutarRef.current();
    };
    window.addEventListener("pointerup", up, true);
    return () => window.removeEventListener("pointerup", up, true);
  }, [formPedidoAbierto, pasoFinalizarCompra, accesoRapidoCheckoutAbierto]);

  useEffect(() => {
    if (!formPedidoAbierto) irAlPagoPointerIdRef.current = null;
  }, [formPedidoAbierto]);

  const guardarConsentimientoCookies = (consentimientoBase: Omit<ConsentimientoCookies, "necesarias" | "fechaActualizacion" | "version">) => {
    const consentimientoFinal = construirConsentimientoCookies(consentimientoBase, COOKIE_CONSENT_VERSION);
    guardarConsentimientoCookiesEnStorage(COOKIE_CONSENT_KEY, consentimientoFinal);
    setConsentimientoCookies(consentimientoFinal);
    setMostrarAvisoCookies(false);
    setMostrarConfigCookies(false);
  };

  const aceptarTodasCookies = () => {
    guardarConsentimientoCookies({ preferencias: true, analiticas: true, marketing: true });
    mostrarNotificacion("✅ Cookies aceptadas", "exito");
  };

  const rechazarCookiesOpcionales = () => {
    guardarConsentimientoCookies({ preferencias: false, analiticas: false, marketing: false });
    mostrarNotificacion("✅ Solo cookies necesarias activas", "normal");
  };

  const comprarEnUnClick = async () => {
    if (!perfilCompraRapida) {
      mostrarNotificacion("No tienes un perfil guardado para compra rápida", "error");
      return;
    }

    if (cart.length === 0) {
      mostrarNotificacion("Carrito vacío", "error");
      return;
    }

    setDatosCliente(perfilCompraRapida.datosCliente);
    setMetodoPago(perfilCompraRapida.metodoPago);
    setDatosPago(perfilCompraRapida.datosPago);

    const errorPago = validarDatosPago(
      perfilCompraRapida.metodoPago,
      perfilCompraRapida.datosPago,
      "No se pudo usar compra rápida: móvil de Bizum no válido",
      "No se pudo usar compra rápida: tarjeta no válida",
      "No se pudo usar compra rápida: falta titular",
      "No se pudo usar compra rápida: caducidad no válida",
      "No se pudo usar compra rápida: CVC no válido"
    );

    if (errorPago) {
      mostrarNotificacion(errorPago, "error");
      return;
    }

    // Abrir formulario de finalizar compra con datos y pago ya rellenados; el cliente revisa y pulsa "Pagar y enviar"
    setNumeroPedidoPreview(generarNumeroPedido());
    setPasoFinalizarCompra("datos");
    setFormPedidoAbierto(true);
    mostrarNotificacion("⚡ Datos cargados. Revisa y pulsa «Continuar al pago»", "normal");
  };

  const getCuponesDisponibles = (): Record<string, { tipo: "porcentaje" | "envio_gratis"; valor: number }> =>
    getCuponesDisponiblesStorage(
      CUPONES_MAIKA_KEY,
      CUPONES_DISPONIBLES as Record<string, { tipo: "porcentaje" | "envio_gratis"; valor: number }>
    );

  // Al abrir la página de cupones, cargar desde localStorage para que "Guardar cambios" y el 30% se mantengan tras recargar/resetear.
  useEffect(() => {
    if (pagina !== "editarCupones") return;
    setCuponesAdmin(getCuponesDisponibles());
  }, [pagina]);

  const aplicarCupon = () => {
    setCuponError(null);
    const cupones = getCuponesDisponibles();
    const { codigo, cupon } = resolverCuponAplicable(cuponInput, normalizarCodigoCupon, cupones);
    if (!codigo) {
      setMostrarInputCuponCheckout(false);
      return;
    }
    if (!cupon) {
      setCuponError("El código no es válido");
      mostrarNotificacion("El código no es válido", "normal");
      return;
    }

    setCuponAplicado({ codigo, ...cupon });
    setCuponInput(codigo);

    if (cupon.tipo === "porcentaje") {
      mostrarNotificacion(`✅ Cupón ${codigo} aplicado (${cupon.valor}% descuento)`, "exito");
      return;
    }

    mostrarNotificacion(`✅ Cupón ${codigo} aplicado (envío gratis)`, "exito");
  };

  const quitarCupon = () => {
    setCuponAplicado(null);
    setCuponInput("");
    setCuponError(null);
    mostrarNotificacion("Cupón eliminado", "normal");
  };

  const vaciarCarrito = () => {
    if (cart.length === 0) {
      mostrarNotificacion("Carrito vacío", "error");
      return;
    }
    setModalAbierto(true);
  };

  const confirmarVaciarCarrito = () => {
    setCart([]);
    setModalAbierto(false);
    mostrarNotificacion("Carrito vaciado", "exito");
  };


  const autocompletarPorCodigoPostal = async (
    cp: string,
    destino: "registro" | "checkout" | "editUsuario"
  ) => {
    const datos = await obtenerDatosCodigoPostal(cp, PROVINCIA_POR_PREFIJO_CP);
    if (!datos) return;
    const { poblacion, provincia, pais } = datos;

    if (destino === "registro") {
      setFormAuth((prev) =>
        prev.cp === cp
          ? {
              ...prev,
              poblacion: poblacion || prev.poblacion,
              provincia: provincia || prev.provincia,
              pais
            }
          : prev
      );
      return;
    }

    if (destino === "editUsuario") {
      setEditUsuarioForm((prev) =>
        prev && prev.cp === cp
          ? {
              ...prev,
              poblacion: poblacion || prev.poblacion,
              provincia: provincia || prev.provincia,
              pais
            }
          : prev
      );
      return;
    }

    setDatosCliente((prev) =>
      prev.cp === cp
        ? {
            ...prev,
            poblacion: poblacion || prev.poblacion,
            provincia: provincia || prev.provincia,
            pais
          }
        : prev
    );
  };

  useEffect(() => {
    if (/^\d{5}$/.test(formAuth.cp)) {
      autocompletarPorCodigoPostal(formAuth.cp, "registro");
    }
  }, [formAuth.cp]);

  useEffect(() => {
    if (reenvioDisponibleEn <= 0) return;

    const timer = window.setInterval(() => {
      setReenvioDisponibleEn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [reenvioDisponibleEn]);

  useEffect(() => {
    const cpCheckout = String(datosCliente.cp || "");
    if (/^\d{5}$/.test(cpCheckout)) {
      autocompletarPorCodigoPostal(cpCheckout, "checkout");
    }
  }, [datosCliente.cp]);

  useEffect(() => {
    const cpEdit = editUsuarioForm?.cp?.trim() ?? "";
    if (editUsuarioForm && /^\d{5}$/.test(cpEdit)) {
      autocompletarPorCodigoPostal(cpEdit, "editUsuario");
    }
  }, [editUsuarioForm?.cp]);

  const provinciaPaisBloqueadosRegistro =
    /^\d{5}$/.test(formAuth.cp) && !!formAuth.provincia?.trim() && !!formAuth.pais?.trim();

  const buscarSugerenciasCalleCheckout = useCallback(async (texto: string) => {
    const calle = (texto || "").trim();
    if (calle.length < 2) {
      setSugerenciasCalleCheckout([]);
      setMostrarSugerenciasCalleCheckout(false);
      setBuscandoSugerenciasCalleCheckout(false);
      return;
    }
    setBuscandoSugerenciasCalleCheckout(true);
    const pob = (datosCliente.poblacion || "").trim();
    const cp = (datosCliente.cp || "").replace(/\D/g, "").trim().slice(0, 5);

    try {
      const queryFinal = construirQueryBusquedaDireccion(calle, cp, pob);
      if (queryFinal.length < 2) {
        setSugerenciasCalleCheckout([]);
        setMostrarSugerenciasCalleCheckout(false);
        setBuscandoSugerenciasCalleCheckout(false);
        return;
      }
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(queryFinal)}&limit=5`;
      console.log("[Photon] URL (debe tener %20 en espacios):", url);

      const photonRes = await fetch(url, { headers: { "Accept-Language": "es" } });
      let data: SugerenciaDireccion[] = [];
      if (photonRes.ok) {
        const json = (await photonRes.json()) as { features?: Array<{ properties?: Record<string, unknown> }> };
        const features = json.features || [];
        data = features
          .map(normalizarPhotonFeature)
          .filter((x): x is SugerenciaDireccion => x !== null)
          .filter((s) => s.address?.road || s.display_name)
          .slice(0, 5);
        // Si se buscó por CP, solo mostrar sugerencias de ese CP; si no hay ninguna, no saldrá nada.
        data = filtrarSugerenciasPorCp(data, cp);
      }
      setSugerenciasCalleCheckout(data);
      setMostrarSugerenciasCalleCheckout(data.length > 0 && permitirSugerenciasCalleRef.current);
      setBuscandoSugerenciasCalleCheckout(false);
    } catch {
      setSugerenciasCalleCheckout([]);
      setMostrarSugerenciasCalleCheckout(false);
      setBuscandoSugerenciasCalleCheckout(false);
    }
  }, [datosCliente.poblacion, datosCliente.cp]);

  // Solo usar Nominatim + Photon cuando no está activo Google Places (para poder desactivar Google fácilmente).
  useEffect(() => {
    if (GOOGLE_PLACES_API_KEY) return;
    const calle = (datosCliente.calle || "").trim();
    if (debounceCalleCheckoutRef.current) clearTimeout(debounceCalleCheckoutRef.current);
    if (calle.length < 2) {
      setSugerenciasCalleCheckout([]);
      setMostrarSugerenciasCalleCheckout(false);
      return;
    }
    debounceCalleCheckoutRef.current = setTimeout(() => {
      if (calleElegidaDesdeSugerenciaRef.current) {
        calleElegidaDesdeSugerenciaRef.current = false;
        return;
      }
      void buscarSugerenciasCalleCheckout(calle);
    }, 400);
    return () => {
      if (debounceCalleCheckoutRef.current) clearTimeout(debounceCalleCheckoutRef.current);
    };
  }, [datosCliente.calle, buscarSugerenciasCalleCheckout]);

  // Google Places: cargar script y enganchar Autocomplete al input calle cuando hay API key y estamos en paso "datos".
  useEffect(() => {
    if (!GOOGLE_PLACES_API_KEY || pasoFinalizarCompra !== "datos") return;
    const input = inputCalleCheckoutRef.current;
    if (!input) return;

    const win = window as Window & {
      google?: { maps?: { places?: { Autocomplete: unknown }; event?: { clearInstanceListeners: (o: object) => void } } };
      __maikaGoogleMapsResolve?: () => void;
    };

    const loadScript = (): Promise<void> => {
      if (win.google?.maps?.places) return Promise.resolve();
      return new Promise((resolve, reject) => {
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
          if (win.google?.maps?.places) resolve();
          else (win as { __maikaGoogleMapsResolve?: () => void }).__maikaGoogleMapsResolve = resolve;
          return;
        }
        (win as { __maikaGoogleMapsResolve?: () => void }).__maikaGoogleMapsResolve = resolve;
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_PLACES_API_KEY)}&libraries=places&callback=__maikaGoogleMapsResolve`;
        script.async = true;
        script.onerror = () => reject(new Error("Google Maps script failed"));
        document.head.appendChild(script);
      });
    };

    type AutocompleteInstance = {
      getPlace: () => { address_components?: Array<{ types: string[]; long_name: string; short_name: string }> };
      addListener: (ev: string, fn: () => void) => { remove: () => void };
    };
    let autocomplete: AutocompleteInstance | null = null;

    loadScript()
      .then(() => {
        if (!win.google?.maps?.places?.Autocomplete || !input) return;
        const Autocomplete = win.google.maps.places.Autocomplete as new (input: HTMLInputElement, opts: object) => AutocompleteInstance;
        autocomplete = new Autocomplete(input, {
          types: ["address"],
          componentRestrictions: { country: "es" },
          fields: ["address_components"]
        });
        googleAutocompleteRef.current = autocomplete as unknown as { unbind: () => void };

        const ac = autocomplete;
        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          const components = place?.address_components || [];
          const { route, streetNumber, postalCode, locality, province } = parseGoogleAddressComponents(components);
          setDatosCliente((prev) => ({
            ...prev,
            calle: (route || prev.calle || "").trim(),
            numero: streetNumber || prev.numero || "",
            cp: postalCode || prev.cp || "",
            poblacion: locality || prev.poblacion || "",
            provincia: province || prev.provincia || ""
          }));
        });
      })
      .catch(() => {});

    return () => {
      const gmaps = win.google?.maps;
      if (autocomplete && gmaps?.event) gmaps.event.clearInstanceListeners(autocomplete as unknown as object);
      googleAutocompleteRef.current = null;
    };
  }, [GOOGLE_PLACES_API_KEY, pasoFinalizarCompra]);

  const enviarPedidoWhatsApp = async (override?: {
    datosCliente?: Cliente;
    metodoPago?: "bizum" | "tarjeta";
    datosPago?: {
      bizumTelefono: string;
      tarjetaNumero: string;
      tarjetaTitular: string;
      tarjetaCaducidad: string;
      tarjetaCVV: string;
    };
  }) => {
    const datosClienteActual = override?.datosCliente ?? datosCliente;
    const nombreCompletoActual = `${(datosClienteActual.nombre || "").trim()} ${(datosClienteActual.apellidos || "").trim()}`.trim() || (datosClienteActual.nombreApellidos || "").trim();
    const metodoPagoActual = override?.metodoPago ?? metodoPago;
    const datosPagoActual = override?.datosPago ?? datosPago;

    const direccionCompleta = construirDireccionCompleta({
      calle: datosClienteActual.calle,
      numero: datosClienteActual.numero,
      bloque: datosClienteActual.bloque,
      escalera: datosClienteActual.escalera,
      piso: datosClienteActual.piso,
      puerta: datosClienteActual.puerta
    });

    if (
      !nombreCompletoActual ||
      !datosClienteActual.calle?.trim() ||
      !datosClienteActual.numero?.trim() ||
      !datosClienteActual.cp?.trim() ||
      !datosClienteActual.poblacion?.trim() ||
      !datosClienteActual.provincia?.trim() ||
      !datosClienteActual.pais?.trim()
    ) {
      mostrarNotificacion("Completa todos los datos", "error");
      return;
    }
    const telefonoNormalizadoCheckout = normalizarTelefonoES9(datosClienteActual.telefono || "");
    if (!/^[67]\d{8}$/.test(telefonoNormalizadoCheckout)) {
      mostrarNotificacion("Introduce un teléfono válido (9 dígitos, empieza por 6 o 7)", "error");
      return;
    }
    if (cart.length === 0) {
      mostrarNotificacion("Carrito vacío", "error");
      return;
    }

    const errorPago = validarDatosPago(
      metodoPagoActual,
      datosPagoActual,
      "Introduce el número de móvil para pago Bizum (9 dígitos)",
      "Número de tarjeta no válido",
      "Introduce el titular de la tarjeta",
      "No se pudo usar compra rápida: caducidad no válida",
      "No se pudo usar compra rápida: CVC no válido"
    );
    if (errorPago) {
      mostrarNotificacion(errorPago, "error");
      return;
    }

    // Si pago es Bizum: avisar cuando el teléfono de contacto esté vacío o no coincida con el de Bizum
    if (metodoPagoActual === "bizum") {
      const bizumNorm = normalizarTelefonoBizum(datosPagoActual.bizumTelefono);
      const contactoNorm = normalizarTelefonoBizum(datosClienteActual.telefono || "");
      const contactoValido = /^[67]\d{8}$/.test(contactoNorm);
      const sonDiferentes = contactoNorm !== bizumNorm;
      if (bizumNorm && (!contactoValido || sonDiferentes)) {
        if (!bizumConfirmadoRef.current) {
          setConfirmacionBizumOtroNumeroAbierto(true);
          return;
        }
        // Ya confirmado en el modal: seguir sin volver a abrirlo
      }
    }

    setProcesandoPago(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const referenciaPago = generarReferenciaPago();
      const numeroPedido = generarNumeroPedido();
      setUltimoPedidoNumero(numeroPedido);
      const envio = calcularEnvio(datosClienteActual.provincia, total);
      const descuentoAplicado = descuentoCupon;
      const totalFinal = Math.max(0, total + envio - descuentoAplicado);
      const metodoPagoTexto = metodoPagoActual === "bizum" ? "Bizum" : "Tarjeta";

      let mensaje = `🛍️ *NUEVO PEDIDO MAIKA* 🛍️\n\n`;
      mensaje += `📦 *Nº Pedido:* ${numeroPedido}\n`;
      mensaje += `💳 *Pago:* ${metodoPagoTexto}\n`;
      mensaje += `🧾 *Referencia pago:* ${referenciaPago}\n`;
      if (metodoPagoActual === "bizum") {
        const bizumNormalizado = normalizarTelefonoBizum(datosPagoActual.bizumTelefono);
        mensaje += `📱 *Bizum:* +34 ${bizumNormalizado}\n`;
      }
      mensaje += `👤 *Cliente:* ${nombreCompletoActual}\n`;
      mensaje += `🪪 *DNI:* ${datosClienteActual.dni?.trim() || "—"}\n`;
      mensaje += `📧 *Email:* ${datosClienteActual.email?.trim() || "—"}\n`;
      mensaje += `📞 *Teléfono:* ${datosClienteActual.telefono}\n`;
      mensaje += `📍 *Dirección:* ${direccionCompleta}, ${datosClienteActual.cp} ${datosClienteActual.poblacion}, ${datosClienteActual.provincia}, ${datosClienteActual.pais}\n\n`;
      mensaje += `📋 *PRODUCTOS:*\n`;

      cart.forEach(item => {
        const precioUnitario = precioItemCarrito(item);
        mensaje += `   • ${item.nombre} x${item.cantidad} = ${(precioUnitario * item.cantidad).toFixed(2)}€\n`;
      });

      mensaje += `\n💰 *Subtotal:* ${total.toFixed(2)}€`;
      mensaje += `\n🚚 *Envío:* ${envio.toFixed(2)}€`;
      if (cuponAplicado) {
        const textoDesc =
          cuponAplicado.tipo === "porcentaje"
            ? `Descuento (${cuponAplicado.valor}%):`
            : "Descuento (envío gratis):";
        mensaje += `\n🎟️ *Cupón:* ${cuponAplicado.codigo}`;
        mensaje += `\n➖ *${textoDesc}* -${descuentoAplicado.toFixed(2)}€`;
      }
      mensaje += `\n💶 *TOTAL:* ${totalFinal.toFixed(2)}€`;

      const urlWhatsApp = `https://wa.me/34673175547?text=${encodeURIComponent(mensaje)}`;

      const pedidoNuevo: Pedido = {
        numero: numeroPedido,
        fecha: new Date().toISOString(),
        usuarioId: getUsuarioId(),
        cliente: { ...datosClienteActual, nombreApellidos: nombreCompletoActual },
        items: cart,
        subtotal: total,
        envio,
        total: totalFinal,
        estado: "pendiente",
        pago: {
          metodo: metodoPagoActual,
          estado: "pagado",
          referencia: referenciaPago
        },
        descuento: descuentoAplicado,
        cupon: cuponAplicado?.codigo
      };

      const pedidosActuales = JSON.parse(localStorage.getItem("pedidosMaika") || "[]") as Pedido[];
      const nuevosPedidos = [pedidoNuevo, ...pedidosActuales];
      localStorage.setItem("pedidosMaika", JSON.stringify(nuevosPedidos));
      setPedidos(nuevosPedidos as Pedido[]);
      try {
        await crearPedidoApi(pedidoNuevo);
      } catch {
        // Si backend no está disponible, mantenemos persistencia local sin bloquear checkout.
      }

      // ================== HISTORIAL maika_pedidos (por teléfono) ==================
      const telefonoClavePedido = claveTelefonoES(datosClienteActual.telefono || "");
      if (telefonoClavePedido) {
        const pedidosLS = leerMaikaPedidos();
        const productosLS: MaikaPedidoProductoLS[] = cart.map((it) => ({
          idProducto: Number(it.id),
          nombre: String(it.nombre || ""),
          precio: Number(it.precio || 0),
          cantidad: Number(it.cantidad || 0)
        }));

        const nuevoPedidoLS: MaikaPedidoLS = {
          idPedido: String(numeroPedido),
          telefono: telefonoClavePedido,
          fecha: new Date().toISOString(),
          productos: productosLS,
          total: Number(totalFinal),
          direccionCompleta,
          estado: "pendiente",
          nota: (datosClienteActual.notas || "").trim() || undefined
        };

        guardarMaikaPedidos([nuevoPedidoLS, ...pedidosLS]);
      }
      // ===========================================================================

      // ========== SISTEMA maika_usuarios (teléfono único) ==========
      const claveTel = claveTelefonoES(datosClienteActual.telefono || "");
      if (claveTel) {
        const usuariosLS = leerMaikaUsuarios();
        const idx = usuariosLS.findIndex((u) => (u.telefono || "").trim() === claveTel);
        const prevUsuario = idx !== -1 ? usuariosLS[idx] : null;
        const direccionActual = direccionDesdeCliente(datosClienteActual);
        const baseDirecciones = normalizarDireccionesUsuario(prevUsuario?.direcciones);
        const legacyPrev = direccionLegacyDesdeUsuarioLS(prevUsuario);
        if (legacyPrev && !baseDirecciones.some((d) => direccionClave(d) === direccionClave(legacyPrev))) {
          baseDirecciones.push(legacyPrev);
        }
        let direccionesActualizadas = baseDirecciones;
        let direccionPredeterminadaId = prevUsuario?.direccionPredeterminadaId || "";
        const nombrePartido = repartirNombreApellidos(datosClienteActual.nombre || "", datosClienteActual.apellidos || "");
        if (direccionActual) {
          const claveNueva = direccionClave(direccionActual);
          const idxDir = baseDirecciones.findIndex((d) => direccionClave(d) === claveNueva);
          if (idxDir >= 0) {
            direccionesActualizadas = [...baseDirecciones];
            direccionesActualizadas[idxDir] = { ...direccionesActualizadas[idxDir], ...direccionActual, id: direccionesActualizadas[idxDir].id };
            direccionPredeterminadaId = direccionesActualizadas[idxDir].id;
          } else {
            direccionesActualizadas = [direccionActual, ...baseDirecciones].slice(0, DIRECCIONES_MAX);
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
          email: (datosClienteActual.email || "").trim(),
          dni: (datosClienteActual.dni || "").trim(),
          calle: (datosClienteActual.calle || "").trim(),
          numero: (datosClienteActual.numero || "").trim(),
          bloque: (datosClienteActual.bloque || "").trim(),
          escalera: (datosClienteActual.escalera || "").trim(),
          piso: (datosClienteActual.piso || "").trim(),
          puerta: (datosClienteActual.puerta || "").trim(),
          cp: (datosClienteActual.cp || "").trim(),
          poblacion: (datosClienteActual.poblacion || "").trim(),
          provincia: (datosClienteActual.provincia || "").trim(),
          pais: (datosClienteActual.pais || "").trim(),
          direcciones: direccionesFinales,
          direccionPredeterminadaId
        };

        if (idx !== -1) usuariosLS[idx] = { ...usuariosLS[idx], ...payload };
        else usuariosLS.push(payload);
        guardarMaikaUsuarios(usuariosLS);
      }
      // ==========================================================

      // Restar existencias en Inventario por lo comprado y guardar en localStorage al instante
      const restarPorId = (items: { id: number; cantidad: number }[]) =>
        items.reduce((acc, it) => {
          acc[it.id] = (acc[it.id] ?? 0) + it.cantidad;
          return acc;
        }, {} as Record<number, number>);
      const velasRestar = restarPorId(
        cart.filter((it) => Number(it.id) < 100).map((it) => ({ id: Number(it.id), cantidad: Math.max(0, Number(it.cantidad) || 0) }))
      );
      const inciensosRestar = restarPorId(
        cart.filter((it) => Number(it.id) >= 100 && Number(it.id) < 200).map((it) => ({ id: Number(it.id), cantidad: Math.max(0, Number(it.cantidad) || 0) }))
      );
      const figurasRestar = restarPorId(
        cart.filter((it) => { const n = Number(it.id); return n >= 200 && n < 300; }).map((it) => ({ id: Number(it.id), cantidad: Math.max(0, Number(it.cantidad) || 0) }))
      );
      const kitsRestar = restarPorId(
        cart.filter((it) => Number(it.id) >= 300).map((it) => ({ id: Number(it.id), cantidad: Math.max(0, Number(it.cantidad) || 0) }))
      );
      const newVelas = velas.map((p) => {
        const q = velasRestar[p.id];
        if (q == null || q <= 0) return p;
        return { ...p, stock: Math.max(0, Number(p.stock) - q) };
      });
      const newInciensos = inciensos.map((p) => {
        const q = inciensosRestar[p.id];
        if (q == null || q <= 0) return p;
        return { ...p, stock: Math.max(0, Number(p.stock) - q) };
      });
      const newFiguras = figuras.map((p) => {
        const q = figurasRestar[p.id];
        if (q == null || q <= 0) return p;
        return { ...p, stock: Math.max(0, Number(p.stock) - q) };
      });
      const newKits = kits.map((p) => {
        const q = kitsRestar[p.id];
        if (q == null || q <= 0) return p;
        return { ...p, stock: Math.max(0, Number(p.stock) - q) };
      });
      setVelas(newVelas);
      setInciensos(newInciensos);
      setFiguras(newFiguras);
      setKits(newKits);
      localStorage.setItem(CATALOGO_VELAS_KEY, JSON.stringify(newVelas));
      localStorage.setItem(CATALOGO_INCIENSOS_KEY, JSON.stringify(newInciensos));
      localStorage.setItem(CATALOGO_FIGURAS_KEY, JSON.stringify(newFiguras));
      localStorage.setItem(CATALOGO_KITS_KEY, JSON.stringify(newKits));

      setCart([]);
      setPasoFinalizarCompra("datos");
      setFormPedidoAbierto(false);
      setUrlWhatsAppPendiente(urlWhatsApp);
      setPedidoRealizado(true);
      setPagina("inicio");
      bizumConfirmadoRef.current = false;

      const puedeRecordarEnDispositivo = !!usuario || recordarDatosInvitado;
      if (puedeRecordarEnDispositivo) {
        localStorage.setItem("clienteMaika", JSON.stringify(datosClienteActual));
        const perfilNuevo: PerfilCompraRapida = {
          datosCliente: { ...datosClienteActual },
          metodoPago: metodoPagoActual,
          datosPago: { ...datosPagoActual },
          actualizadoEn: new Date().toISOString()
        };
        localStorage.setItem(QUICK_CHECKOUT_KEY, JSON.stringify(perfilNuevo));
        setPerfilCompraRapida(perfilNuevo);
      } else {
        localStorage.removeItem("clienteMaika");
        localStorage.removeItem(QUICK_CHECKOUT_KEY);
        setPerfilCompraRapida(null);
      }

      setDatosCliente({
        nombre: "",
        apellidos: "",
        nombreApellidos: "",
        email: "",
        dni: "",
        telefono: "",
        direccion: "",
        calle: "",
        numero: "",
        bloque: "",
        escalera: "",
        piso: "",
        puerta: "",
        ciudad: "",
        cp: "",
        poblacion: "",
        provincia: "",
        pais: "",
        notas: ""
      });

      setMetodoPago("bizum");
      setDatosPago({
        bizumTelefono: "",
        tarjetaNumero: "",
        tarjetaTitular: "",
        tarjetaCaducidad: "",
        tarjetaCVV: ""
      });
      setCuponAplicado(null);
      setCuponInput("");
      setCuponError(null);
      setSugerenciasCalleCheckout([]);
      setMostrarSugerenciasCalleCheckout(false);
      setBuscandoSugerenciasCalleCheckout(false);

      mostrarNotificacion(`✅ Pago recibido y pedido ${numeroPedido} enviado`, "exito");
    } finally {
      setProcesandoPago(false);
    }
  };

  const aceptarCookies = () => {
    aceptarTodasCookies();
  };

  const cambiarEstadoPedido = async (numeroPedido: string, nuevoEstado: Pedido["estado"]) => {
    const pedidoOriginal = pedidos.find((p) => p.numero === numeroPedido);
    if (!pedidoOriginal) {
      mostrarNotificacion(`No se encontró el pedido ${numeroPedido}`, "error");
      return;
    }

    const nuevosPedidos = pedidos.map((p) =>
      p.numero === numeroPedido ? { ...p, estado: nuevoEstado } : p
    );

    localStorage.setItem("pedidosMaika", JSON.stringify(nuevosPedidos));
    try {
      await actualizarEstadoPedidoApi(numeroPedido, nuevoEstado);
    } catch {
      // Si backend no responde, dejamos el cambio guardado localmente.
    }

    // Sincronizar historial por teléfono (maika_pedidos) con el estado del pedido
    try {
      const historial = leerMaikaPedidos();
      const siguienteHistorial = historial.map((p) =>
        p.idPedido === numeroPedido ? { ...p, estado: nuevoEstado } : p
      );
      guardarMaikaPedidos(siguienteHistorial);
    } catch {
      // Si el historial no existe o está corrupto, no bloqueamos la actualización del pedido.
    }
    flushSync(() => {
      setPedidos(nuevosPedidos as Pedido[]);
    });

    mostrarNotificacion(
      `✅ Pedido ${pedidoOriginal.numero} → ${nuevoEstado}`,
      "exito"
    );

    setPedidoAbierto(null);
  };

  const cargarUsuarios = () => {
    // Fuerza sincronización de altas recientes checkout -> gestión de usuarios.
    const maikaUsuarios = leerMaikaUsuarios();
    if (maikaUsuarios.length > 0) {
      guardarMaikaUsuarios(maikaUsuarios);
      let legacyUsuarios: Usuario[] = [];
      try {
        legacyUsuarios = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
        if (!Array.isArray(legacyUsuarios)) legacyUsuarios = [];
      } catch {
        legacyUsuarios = [];
      }
      const usuariosDesdeMaika = maikaUsuarios.map((u) => {
        const tel9 = normalizarTelefonoES9(u.telefono || "");
        const legacy = legacyUsuarios.find((x) => normalizarTelefonoES9(x.telefono || "") === tel9);
        return {
        id: `u_${tel9}`,
        nombre: `${(u.nombre || "").trim()} ${(u.apellidos || "").trim()}`.trim(),
        email: (u.email || "").trim(),
        dni: (u.dni || "").trim(),
        telefono: tel9,
        calle: (u.calle || "").trim(),
        numero: (u.numero || "").trim(),
        bloque: (u.bloque || "").trim(),
        escalera: (u.escalera || "").trim(),
        piso: (u.piso || "").trim(),
        puerta: (u.puerta || "").trim(),
        cp: (u.cp || "").trim(),
        poblacion: (u.poblacion || "").trim(),
        provincia: (u.provincia || "").trim(),
        pais: (u.pais || "").trim(),
        direccion: construirDireccionBasica(u.calle || "", u.numero || ""),
        password: (legacy?.password || "").trim(),
        verificado: (() => {
          const emailValido = esEmailVerificable((u.email || "").trim());
          if (!emailValido) return false;
          return legacy ? !!legacy.verificado : false;
        })()
      };
      }) as Usuario[];

      // Completa con legacy que no exista en maika (evita "usuario abierto no visible").
      const telMaika = new Set(
        usuariosDesdeMaika
          .map((u) => normalizarTelefonoES9(u.telefono || ""))
          .filter((t) => /^[67]\d{8}$/.test(t))
      );
      const legacySinMaika = legacyUsuarios.filter((u) => {
        const tel9 = normalizarTelefonoES9(u.telefono || "");
        if (!/^[67]\d{8}$/.test(tel9)) return true;
        return !telMaika.has(tel9);
      });
      const combinados = [...usuariosDesdeMaika, ...legacySinMaika];
      const upsertEnCombinados = (candidato: Usuario | null | undefined) => {
        if (!candidato) return;
        const telC = normalizarTelefonoES9(candidato.telefono || "");
        const emailC = (candidato.email || "").trim().toLowerCase();
        const idC = String(candidato.id || "");
        const idx = combinados.findIndex((u) => {
          const telU = normalizarTelefonoES9(u.telefono || "");
          const emailU = (u.email || "").trim().toLowerCase();
          if (telC && telU && telC === telU) return true;
          if (emailC && emailU && emailC === emailU) return true;
          if (idC && String(u.id || "") === idC) return true;
          return false;
        });
        const limpio = {
          id: candidato.id || `u_${telC || Date.now()}`,
          nombre: (candidato.nombre || "").trim(),
          email: (candidato.email || "").trim(),
          dni: ((candidato as any).dni || "").trim(),
          telefono: telC || (candidato.telefono || "").trim(),
          calle: (candidato.calle || "").trim(),
          numero: (candidato.numero || "").trim(),
          bloque: (candidato.bloque || "").trim(),
          escalera: (candidato.escalera || "").trim(),
          piso: (candidato.piso || "").trim(),
          puerta: (candidato.puerta || "").trim(),
          cp: (candidato.cp || "").trim(),
          poblacion: (candidato.poblacion || "").trim(),
          provincia: (candidato.provincia || "").trim(),
          pais: (candidato.pais || "España").trim(),
          direccion: (candidato.direccion || "").trim(),
          verificado: esEmailVerificable((candidato.email || "").trim()) && !!candidato.verificado
        } as Usuario;
        if (idx === -1) {
          combinados.push(limpio);
        } else {
          const prev = combinados[idx];
          const tieneVerificado = Object.prototype.hasOwnProperty.call(candidato, "verificado");
          combinados[idx] = {
            ...prev,
            id: String(limpio.id || "").trim() || prev.id,
            nombre: limpio.nombre || prev.nombre,
            email: limpio.email || prev.email,
            dni: limpio.dni || (prev as any).dni || "",
            telefono: limpio.telefono || prev.telefono,
            calle: limpio.calle || prev.calle,
            numero: limpio.numero || prev.numero,
            bloque: limpio.bloque || prev.bloque,
            escalera: limpio.escalera || prev.escalera,
            piso: limpio.piso || prev.piso,
            puerta: limpio.puerta || prev.puerta,
            cp: limpio.cp || prev.cp,
            poblacion: limpio.poblacion || prev.poblacion,
            provincia: limpio.provincia || prev.provincia,
            pais: limpio.pais || prev.pais,
            direccion: limpio.direccion || prev.direccion,
            verificado: (() => {
              const emailFinal = (limpio.email || prev.email || "").trim();
              if (!esEmailVerificable(emailFinal)) return false;
              return tieneVerificado ? !!candidato.verificado : !!prev.verificado;
            })()
          } as Usuario;
        }
      };

      // Rescate final robusto: incluye sesión actual en memoria y en localStorage.
      upsertEnCombinados(usuario);
      try {
        const rawActual = localStorage.getItem("usuarioActual");
        if (rawActual) upsertEnCombinados(JSON.parse(rawActual) as Usuario);
      } catch {
        /* ignore */
      }
      localStorage.setItem("usuarios", JSON.stringify(combinados));

      setListaUsuarios(combinados);
    } else {
      const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
      setListaUsuarios(usuarios);
    }
    setModalUsuariosAbierto(true);
  };

  const abrirEditorUsuario = (usuarioAEditar: Usuario) => {
    setEditUsuarioForm({
      id: usuarioAEditar.id,
      nombre: usuarioAEditar.nombre || "",
      email: usuarioAEditar.email || "",
      dni: (usuarioAEditar as any).dni || "",
      telefono: usuarioAEditar.telefono || "",
      password: usuarioAEditar.password || "",
      calle: usuarioAEditar.calle || usuarioAEditar.direccion || "",
      bloque: usuarioAEditar.bloque || "",
      escalera: usuarioAEditar.escalera || "",
      piso: usuarioAEditar.piso || "",
      puerta: usuarioAEditar.puerta || "",
      numero: usuarioAEditar.numero || "",
      cp: usuarioAEditar.cp || "",
      provincia: usuarioAEditar.provincia || "",
      poblacion: usuarioAEditar.poblacion || "",
      pais: usuarioAEditar.pais || "España",
      direccion: usuarioAEditar.direccion || "",
      verificado: !!usuarioAEditar.verificado
    });
    setModalEditarUsuarioAbierto(true);
  };

  const guardarEdicionUsuario = async () => {
    if (!editUsuarioForm) return;

    if (!editUsuarioForm.nombre.trim() || !editUsuarioForm.telefono?.trim()) {
      mostrarNotificacion("Nombre y teléfono son obligatorios", "error");
      return;
    }

    const usuariosActuales = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
    const telNorm = normalizarTelefonoBizum(editUsuarioForm.telefono.trim());
    const emailNorm = (editUsuarioForm.email || "").trim().toLowerCase();
    const dniNorm = (editUsuarioForm.dni || "").trim().toUpperCase().replace(/\s+/g, "");

    const telefonoDuplicado = /^[67]\d{8}$/.test(telNorm) && usuariosActuales.some(
      (u) => String(u.id) !== String(editUsuarioForm.id) && normalizarTelefonoBizum(u.telefono || "") === telNorm
    );

    if (telefonoDuplicado) {
      mostrarNotificacion("Usuario registrado: ese teléfono ya pertenece a otro usuario", "error");
      return;
    }

    const emailDuplicado =
      !!emailNorm &&
      usuariosActuales.some((u) => String(u.id) !== String(editUsuarioForm.id) && (u.email || "").trim().toLowerCase() === emailNorm);
    if (emailDuplicado) {
      mostrarNotificacion("Usuario registrado: ese email ya pertenece a otro usuario", "error");
      return;
    }

    const dniDuplicado =
      !!dniNorm &&
      usuariosActuales.some((u) => {
        if (String(u.id) === String(editUsuarioForm.id)) return false;
        const uDni = ((u as any).dni || "").trim().toUpperCase().replace(/\s+/g, "");
        return uDni && uDni === dniNorm;
      });
    if (dniDuplicado) {
      mostrarNotificacion("Usuario registrado: ese DNI ya pertenece a otro usuario", "error");
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
        (idEdit && idU === idEdit) ||
        (!!telEdit && !!telU && telU === telEdit) ||
        (!!emailEdit && !!emailU && emailU === emailEdit);
      if (!coincide) return u;
      huboActualizacion = true;
      return {
        ...u,
        nombre: editUsuarioForm.nombre.trim(),
        email: editUsuarioForm.email.trim(),
        dni: (editUsuarioForm.dni || "").trim(),
        telefono: editUsuarioForm.telefono.trim(),
        password: editUsuarioForm.password.trim(),
        calle: editUsuarioForm.calle.trim(),
        bloque: editUsuarioForm.bloque.trim(),
        escalera: editUsuarioForm.escalera.trim(),
        piso: editUsuarioForm.piso.trim(),
        puerta: editUsuarioForm.puerta.trim(),
        numero: editUsuarioForm.numero.trim(),
        cp: editUsuarioForm.cp.trim(),
        provincia: editUsuarioForm.provincia.trim(),
        poblacion: editUsuarioForm.poblacion.trim(),
        pais: editUsuarioForm.pais.trim(),
        direccion: construirDireccionCompleta({
          calle: editUsuarioForm.calle,
          numero: editUsuarioForm.numero,
          bloque: editUsuarioForm.bloque,
          escalera: editUsuarioForm.escalera,
          piso: editUsuarioForm.piso,
          puerta: editUsuarioForm.puerta
        }),
        verificado: esEmailVerificable(editUsuarioForm.email.trim()) && !!editUsuarioForm.verificado
      };
    });
    if (!huboActualizacion) {
      mostrarNotificacion("No se encontró el usuario a actualizar. Recarga Gestión e inténtalo de nuevo.", "error");
      return;
    }

    localStorage.setItem("usuarios", JSON.stringify(usuariosActualizados));
    sincronizarMaikaDesdeLegacy(usuariosActualizados);
    setListaUsuarios(usuariosActualizados);

    try {
      const passwordNueva = editUsuarioForm.password.trim();
      const emailSync = editUsuarioForm.email.trim().toLowerCase();
      const telSync = normalizarTelefonoBizum(editUsuarioForm.telefono.trim());
      if (passwordNueva && (emailSync || telSync)) {
        await actualizarPasswordApi({
          email: emailSync || undefined,
          telefono: telSync || undefined,
          password: passwordNueva
        });
      }
    } catch {
      // Sync backend opcional: mantenemos guardado local si backend no responde.
    }

    const usuarioActual = localStorage.getItem("usuarioActual");
    if (usuarioActual) {
      const usuarioLogueado = JSON.parse(usuarioActual) as Usuario;
      const actualizado = usuariosActualizados.find((u) => String(u.id) === String(usuarioLogueado.id));
      if (actualizado) {
        localStorage.setItem("usuarioActual", JSON.stringify(actualizado));
        setUsuario(actualizado);
        precargarDatosClienteDesdeUsuario(actualizado);
      }
    }

    mostrarNotificacion(`✅ Usuario ${editUsuarioForm.nombre} actualizado`, "exito");
    setModalEditarUsuarioAbierto(false);
    setEditUsuarioForm(null);
  };

  const buscarPedido = () => {
    if (!numeroSeguimiento.trim()) {
      mostrarNotificacion("Introduce un número de pedido", "error");
      return;
    }

    const encontrado = pedidos.find(p => p.numero === numeroSeguimiento);
    setPedidoBuscado(encontrado || null);

    if (!encontrado) {
      mostrarNotificacion("Pedido no encontrado", "error");
    }
  };

  const volverATienda = () => {
    setPagina("tienda");
  };

  /** Convierte un usuario guardado (maika_usuarios) en Cliente para el formulario de checkout. */
  const maikaUsuarioToCliente = (u: MaikaUsuarioLS): Cliente =>
    maikaUsuarioToClienteUtil(u, repartirNombreApellidos);

  const precargarDatosClienteDesdeUsuario = (usuarioFuente: Usuario | null) => {
    if (!usuarioFuente) return;

    const repartido = repartirNombreApellidos(usuarioFuente.nombre || "", "");
    setDatosCliente((prev) => ({
      ...prev,
      nombre: (repartido.nombre || "").toUpperCase(),
      apellidos: (repartido.apellidos || "").toUpperCase(),
      nombreApellidos: `${(repartido.nombre || "").trim()} ${(repartido.apellidos || "").trim()}`.trim() || usuarioFuente.nombre || prev.nombreApellidos,
      email: usuarioFuente.email || prev.email,
      dni: usuarioFuente.dni || prev.dni,
      telefono: usuarioFuente.telefono || prev.telefono,
      direccion: usuarioFuente.direccion || prev.direccion,
      calle: usuarioFuente.calle || prev.calle,
      numero: usuarioFuente.numero || prev.numero,
      bloque: usuarioFuente.bloque || prev.bloque,
      escalera: usuarioFuente.escalera || prev.escalera,
      piso: usuarioFuente.piso || prev.piso,
      puerta: usuarioFuente.puerta || prev.puerta,
      cp: usuarioFuente.cp || prev.cp,
      poblacion: usuarioFuente.poblacion || prev.poblacion,
      provincia: usuarioFuente.provincia || prev.provincia,
      ciudad: usuarioFuente.ciudad || prev.ciudad,
      pais: usuarioFuente.pais || prev.pais
    }));
  };

  const CLIENTE_VACIO: Cliente = {
    nombre: "",
    apellidos: "",
    nombreApellidos: "",
    email: "",
    dni: "",
    telefono: "",
    direccion: "",
    calle: "",
    numero: "",
    bloque: "",
    escalera: "",
    piso: "",
    puerta: "",
    ciudad: "",
    cp: "",
    poblacion: "",
    provincia: "",
    pais: "",
    notas: ""
  };

  const finalizarCarrito = () => {
    ultimoTelefonoRecuperadoRef.current = null;
    setDireccionesCheckout([]);
    setDireccionCheckoutSeleccionadaId("");

    // 1) Usuario logueado: intentar datos completos desde maika_usuarios (apellidos, dni); si no, desde usuario
    if (usuario) {
      const clave = claveTelefonoES(usuario.telefono || "");
      const usuariosLS = leerMaikaUsuarios();
      const encontrado = usuariosLS.find((u) => (u.telefono || "").trim() === clave);
      if (encontrado) {
        setDatosCliente(maikaUsuarioToCliente(encontrado));
        const dirsGuardadas = normalizarDireccionesUsuario(encontrado.direcciones);
        const dirLegacy = direccionLegacyDesdeUsuarioLS(encontrado);
        const dirsHistorial = direccionesDesdeHistorial(clave);
        const dirs = [...dirsGuardadas];
        if (dirLegacy && !dirs.some((d) => direccionClave(d) === direccionClave(dirLegacy))) {
          dirs.push(dirLegacy);
        }
        for (const dh of dirsHistorial) {
          if (!dirs.some((d) => direccionClave(d) === direccionClave(dh))) dirs.push(dh);
          if (dirs.length >= DIRECCIONES_MAX) break;
        }
        const dirsFinal = dirs.slice(0, DIRECCIONES_MAX);
        setDireccionesCheckout(dirsFinal);
        const predeterminada = (encontrado.direccionPredeterminadaId || "").trim();
        const seleccionId = predeterminada && dirsFinal.some((d) => d.id === predeterminada)
          ? predeterminada
          : (dirsFinal[0]?.id || "");
        setDireccionCheckoutSeleccionadaId(seleccionId);
        if (seleccionId) {
          const dirSeleccionada = dirsFinal.find((d) => d.id === seleccionId);
          if (dirSeleccionada) aplicarDireccionEnCheckout(dirSeleccionada);
        }
      } else {
        precargarDatosClienteDesdeUsuario(usuario);
        const dirsHistorial = direccionesDesdeHistorial(clave);
        setDireccionesCheckout(dirsHistorial.slice(0, DIRECCIONES_MAX));
        const primera = dirsHistorial[0]?.id || "";
        setDireccionCheckoutSeleccionadaId(primera);
        if (primera) {
          const dir = dirsHistorial.find((d) => d.id === primera);
          if (dir) aplicarDireccionEnCheckout(dir);
        }
      }
    } else {
      if (recordarDatosInvitado) {
        setDatosCliente(cargarClienteInvitadoDesdeStorage(CLIENTE_VACIO, QUICK_CHECKOUT_KEY));
      } else {
        // Sin sesión iniciada: por privacidad, checkout vacío.
        setDatosCliente(CLIENTE_VACIO);
      }
      setAvisoTelefonoCheckout(null);
    }

    setNumeroPedidoPreview(generarNumeroPedido());
    setPasoFinalizarCompra("datos");
    setFormPedidoAbierto(true);
  };

  const construirItemsDesdeProductos = (productos: MaikaPedidoProductoLS[]) =>
    construirItemsDesdeProductosUtil(productos, getStockProducto, normalizarItemCarrito);

  const repetirPedido = (pedido: MaikaPedidoLS, modo: "replace" | "add") => {
    if (!pedido) return;

    if (modo === "replace") {
      const items = construirItemsDesdeProductos(pedido.productos);
      flushSync(() => {
        setCart(items);
      });
      mostrarNotificacion(items.length > 0 ? "Pedido reemplazado al carrito" : "No se pudieron añadir productos", "exito");
      finalizarCarrito();
      return;
    }

    // add
    const nextItems = sumarPedidoAlCarritoUtil(cart, pedido.productos, getStockProducto, normalizarItemCarrito);
    flushSync(() => {
      setCart(nextItems);
    });

    mostrarNotificacion("Pedido añadido al carrito", "exito");
    finalizarCarrito();
  };

  const handleRepetirPedido = (pedido: MaikaPedidoLS) => {
    if (!pedido) return;
    if (cart.length > 0) {
      setPedidoRepeatSeleccionado(pedido);
      setModalRepeatPedidoAbierto(true);
    } else {
      repetirPedido(pedido, "replace");
    }
  };

  const pulseAnimationStyle = `
    @keyframes pulseCaja {
      0% { box-shadow: 0 0 0 0 #22d3ee; border-color: #22d3ee; }
      50% { box-shadow: 0 0 25px 8px #22d3ee; border-color: #ffffff; }
      100% { box-shadow: 0 0 0 0 #22d3ee; border-color: #22d3ee; }
    }
  `;

  const renderCajaPedidos = (
    titulo: string,
    pedidosList: Pedido[],
    color: string,
    icono: string,
    abierto: boolean,
    setAbierto: (value: boolean) => void,
    animar: boolean = false
  ) => {
    const q = busquedaPedido.trim().toLowerCase();
    const qTel = normalizarTelefonoES9(busquedaPedido);
    const filtroTelefonoExacto = /^[67]\d{8}$/.test(qTel);
    const pedidosFiltrados = pedidosList.filter(p =>
      q === ""
        ? true
        : filtroTelefonoExacto
          ? normalizarTelefonoES9(p.cliente?.telefono || "") === qTel
          : (
            String(p.numero).toLowerCase().includes(q) ||
            p.cliente?.nombreApellidos?.toLowerCase().includes(q) ||
            (p.cliente?.telefono || "").toLowerCase().includes(q)
          )
    );
    const debeAnimar = animar && pedidosFiltrados.length > 0;

    return (
      <div style={{
        marginBottom: 20,
        border: `2px solid ${color}`,
        borderRadius: 15,
        overflow: "hidden",
        background: THEME.bg,
        boxShadow: abierto ? `0 0 20px ${color}` : "none",
        transition: "all 0.3s ease",
        animation: debeAnimar ? "pulseCaja 1.4s ease-in-out infinite" : "none"
      }}>
        <div
          onClick={() => setAbierto(!abierto)}
          style={{
            padding: "15px 20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: THEME.bg
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            <span style={{ fontSize: "1.8rem" }}>{icono}</span>
            <h3 style={{ margin: 0, color: color }}>
              {titulo}
            </h3>
          </div>
          <span style={{ color: color, fontSize: "1.5rem" }}>
            {abierto ? "▼" : "▶"}
          </span>
        </div>

        {abierto && (
          <div style={{ padding: "20px", maxHeight: "500px", overflowY: "auto" }}>
            {pedidosFiltrados.length === 0 ? (
              <p style={{ color: "white", opacity: 0.7, textAlign: "center" }}>
                {q ? "No hay pedidos para esta búsqueda" : "No hay pedidos"}
              </p>
            ) : (
              pedidosFiltrados.map((p) => {
                const indexEnOriginal = pedidos.findIndex(original => original.numero === p.numero);
                return (
                  <div
                    key={p.numero}
                    onClick={() => setPedidoAbierto(pedidoAbierto === indexEnOriginal ? null : indexEnOriginal)}
                    style={{
                      background: THEME.bg,
                      border: `1px solid ${THEME.goldMain}`,
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 10,
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong style={{ color: THEME.goldMain }}>{p.numero}</strong>
                      <span style={{ color: "white", fontSize: "0.8rem" }}>{p.fecha}</span>
                    </div>
                    <div style={{ color: "white" }}>{p.cliente?.nombreApellidos}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                      <span style={{ color: THEME.goldMain }}>{p.total?.toFixed(2)} €</span>
                      <span style={{
                        color: p.estado === "pendiente" ? "#22d3ee" : p.estado === "enviado" ? "#e67e22" : "#2ecc71",
                        background: p.estado === "pendiente" ? "rgba(34,211,238,0.15)" : p.estado === "enviado" ? "rgba(230,126,34,0.15)" : "rgba(46,204,113,0.15)",
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 14
                      }}>
                        {p.estado === "pendiente" ? "🛒 " : p.estado === "enviado" ? "🚚 " : "✅ "}{p.estado}
                      </span>
                    </div>

                    {accesoAdmin && (
                      <select
                        value={p.estado}
                        onChange={(e) => {
                          e.stopPropagation();
                          cambiarEstadoPedido(p.numero, e.target.value as Pedido["estado"]);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          marginTop: 8,
                          padding: 8,
                          borderRadius: 8,
                          width: "100%",
                          background: THEME.bg,
                          color: THEME.goldMain,
                          border: `1px solid ${THEME.goldMain}`,
                          cursor: "pointer"
                        }}
                      >
                        <option value="pendiente">🛒 Pendiente</option>
                        <option value="enviado">🚚 Enviado</option>
                        <option value="entregado">✅ Entregado</option>
                      </select>
                    )}

                    {pedidoAbierto === indexEnOriginal && (
                      <div style={{ marginTop: 10, borderTop: `1px solid ${THEME.goldMain}`, paddingTop: 10 }}>
                        <strong style={{ color: THEME.goldMain }}>📦 Productos:</strong>
                        {p.items?.map((it: ItemCarrito, idx: number) => (
                          <div key={`${p.numero}-item-${idx}`} style={{ color: "white", marginLeft: 10 }}>
                            • {it.nombre} x{it.cantidad} = {(it.precio * it.cantidad).toFixed(2)} €
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPedidoFacturaAbierto(p); }}
                      style={{
                        marginTop: 8,
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: `1px solid ${THEME.goldMain}`,
                        background: "rgba(201,162,74,0.15)",
                        color: THEME.goldMain,
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: 13
                      }}
                    >
                      📄 Ver factura / pedido completo
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  };

  const appContextValue = useMemo<AppContextValue>(() => ({
    setPagina,
    abrirTiendaConCategoria,
    velas,
    inciensos,
    figuras,
    kits,
    categoriasCatalogo,
    agregarAlCarrito,
    cart,
    total,
    totalItemsCarrito,
    precioItemCarrito,
    cambiarCantidad,
    volverATienda,
    vaciarCarrito,
    finalizarCarrito,
    envioPreview,
    totalPreview,
    generarNumeroPedido,
    setNumeroPedidoPreview,
    setFormPedidoAbierto,
    precargarDatosClienteDesdeUsuario,
    usuario,
    perfilCompraRapida,
    comprarEnUnClick,
    numeroSeguimiento,
    setNumeroSeguimiento,
    buscarPedido,
    pedidoBuscado,
    accesoAdmin,
    busquedaPedido,
    setBusquedaPedido,
    renderCajaPedidos,
    pendientesAbierto,
    setPendientesAbierto,
    enviadosAbierto,
    setEnviadosAbierto,
    entregadosAbierto,
    setEntregadosAbierto,
    pedidosPendientesOrdenados,
    pedidosEnviadosOrdenados,
    pedidosEntregadosOrdenados,
    setPedidoFacturaAbierto,
    pedidos,
    categoriaTiendaAlAbrir,
    setCategoriaTiendaAlAbrir,
    busquedaTienda,
    setBusquedaTienda,
    desplegableInicio,
    setDesplegableInicio,
    serviciosInicio,
    setServiciosInicio,
    openLegal: setLegalDoc
  }), [
    setPagina, abrirTiendaConCategoria, velas, inciensos, figuras, kits, categoriasCatalogo, agregarAlCarrito,
    cart, total, totalItemsCarrito, precioItemCarrito, cambiarCantidad, volverATienda, vaciarCarrito, finalizarCarrito,
    envioPreview, totalPreview, generarNumeroPedido, setNumeroPedidoPreview, setFormPedidoAbierto,
    precargarDatosClienteDesdeUsuario, usuario, perfilCompraRapida, comprarEnUnClick,
    numeroSeguimiento, buscarPedido, pedidoBuscado, accesoAdmin, busquedaPedido, renderCajaPedidos,
    pendientesAbierto, enviadosAbierto, entregadosAbierto,
    pedidosPendientesOrdenados, pedidosEnviadosOrdenados, pedidosEntregadosOrdenados,
    setPedidoFacturaAbierto, pedidos, kits, categoriaTiendaAlAbrir, setCategoriaTiendaAlAbrir,
    busquedaTienda, setBusquedaTienda,
    desplegableInicio, setDesplegableInicio, serviciosInicio, setServiciosInicio, setLegalDoc
  ]);

  const fallbackAdmin = (
    <div style={{ padding: 48, textAlign: "center", color: THEME.goldMain }}>Cargando…</div>
  );
  void [
    Suspense,
    Navigate,
    EditarCategoriasPage,
    NuevaCategoriaPage,
    EditarProductosPage,
    InventarioPage,
    NuevoProductoPage,
    CATEGORIA_IMAGENES_KEY,
    setCategoriasCatalogo,
    setCategoriaSeleccionada,
    previewCategoria,
    setPreviewCategoria,
    tamanoCategoria,
    setTamanoCategoria,
    colorCategoria,
    setColorCategoria,
    estiloTextoCategoria,
    setEstiloTextoCategoria,
    nombreImagenCategoria,
    setNombreImagenCategoria,
    nuevaCategoriaNombre,
    setNuevaCategoriaNombre,
    nuevaCategoriaImagen,
    setNuevaCategoriaImagen,
    nuevaCategoriaNombreImagen,
    setNuevaCategoriaNombreImagen,
    nuevaCategoriaTamano,
    setNuevaCategoriaTamano,
    nuevaCategoriaColor,
    setNuevaCategoriaColor,
    nuevaCategoriaEstilo,
    setNuevaCategoriaEstilo,
    categoriaARenombrar,
    setCategoriaARenombrar,
    getProductoByValue,
    setCategoriaEditarProductos,
    productoSeleccionado,
    previewProducto,
    nombreImagenProducto,
    colorProducto,
    tamanoProducto,
    estiloTextoProducto,
    categoriaNuevoProducto,
    setCategoriaNuevoProducto,
    nuevoProductoNombre,
    setNuevoProductoNombre,
    nuevoProductoPrecio,
    setNuevoProductoPrecio,
    nuevoProductoStock,
    setNuevoProductoStock,
    nuevoProductoDescripcion,
    setNuevoProductoDescripcion,
    nuevoProductoImagen,
    setNuevoProductoImagen,
    nuevoProductoNombreImagen,
    setNuevoProductoNombreImagen,
    nuevoProductoTamano,
    setNuevoProductoTamano,
    nuevoProductoColor,
    setNuevoProductoColor,
    nuevoProductoEstilo,
    setNuevoProductoEstilo,
    fallbackAdmin
  ];

  useEffect(() => {
    if (location.pathname === "/admin" && !esAdmin) {
      if (accesoAdmin) setAccesoAdmin(false);
      navigate("/", { replace: true });
    }
  }, [location.pathname, esAdmin, accesoAdmin, navigate]);

  const cuponesEntradas = Object.entries(cuponesAdmin);
  const editarCuponesElement = (
      <div className="cupones-promocionales-page" style={{ maxWidth: 720, margin: "0 auto", padding: 20, position: "relative" }}>
        <BotonCerrar
          onClick={() => {
            if (getAdminSessionRemainingMs() > 0) {
              setPagina("admin");
            }
          }}
          ariaLabel="Cerrar"
          title="Cerrar"
        />
        <h2 style={{ color: THEME.goldMain, marginBottom: 20 }}>🎟️ Códigos promocionales</h2>
        <p style={{ color: "white", marginBottom: 20, opacity: 0.9 }}>
          Los códigos que guardes aquí serán los únicos válidos en Finalizar compra. Puedes cambiarlos cuando quieras.
        </p>
        <div style={{ background: THEME.bg, border: `2px solid ${THEME.goldMain}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
          {cuponesEntradas.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.7)" }}>No hay códigos. Añade uno abajo.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {cuponesEntradas.map(([codigo, data]) => (
                <div key={codigo} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ color: THEME.goldMain, fontWeight: "bold", minWidth: 100 }}>{codigo}</span>
                  <span style={{ color: "white", opacity: 0.9 }}>
                    {data.tipo === "porcentaje" ? `${data.valor}% descuento` : "Envío gratis"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...cuponesAdmin };
                      delete next[codigo];
                      setCuponesAdmin(next);
                    }}
                    style={{
                      background: "transparent",
                      color: "#ff4444",
                      border: "1px solid #ff4444",
                      borderRadius: 8,
                      padding: "6px 12px",
                      cursor: "pointer",
                      fontSize: 13
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ background: THEME.bg, border: `2px solid ${THEME.goldMain}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <p style={{ color: THEME.goldMain, fontWeight: "bold", marginBottom: 12 }}>Añadir código</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 400 }}>
            <input
              type="text"
              placeholder="Código (ej. VERANO20)"
              id="nuevo-cupon-codigo"
              style={inputStyle}
            />
            <select id="nuevo-cupon-tipo" style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="porcentaje">Porcentaje de descuento</option>
              <option value="envio_gratis">Envío gratis</option>
            </select>
            <input
              type="number"
              placeholder="Valor (% si es porcentaje, 0 si envío gratis)"
              id="nuevo-cupon-valor"
              min={0}
              max={100}
              defaultValue={10}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => {
                const codigoInput = (document.getElementById("nuevo-cupon-codigo") as HTMLInputElement)?.value?.trim().toUpperCase().replace(/\s+/g, "");
                const tipo = (document.getElementById("nuevo-cupon-tipo") as HTMLSelectElement)?.value as "porcentaje" | "envio_gratis";
                const valorInput = (document.getElementById("nuevo-cupon-valor") as HTMLInputElement)?.value;
                const valor = tipo === "envio_gratis" ? 0 : Math.min(100, Math.max(0, parseFloat(valorInput) || 0));
                if (!codigoInput) {
                  mostrarNotificacion("Escribe un código", "error");
                  return;
                }
                setCuponesAdmin((prev) => ({ ...prev, [codigoInput]: { tipo, valor } }));
                (document.getElementById("nuevo-cupon-codigo") as HTMLInputElement).value = "";
                (document.getElementById("nuevo-cupon-valor") as HTMLInputElement).value = "10";
              }}
              style={{
                background: THEME.goldMain,
                color: "#1b1745",
                border: "none",
                padding: 12,
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Añadir código
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem(CUPONES_MAIKA_KEY, JSON.stringify(cuponesAdmin));
              if (getAdminSessionRemainingMs() > 0) {
                setPagina("admin");
              }
              mostrarNotificacion("Códigos promocionales guardados", "exito");
            }}
            style={{
              background: "#4caf50",
              color: "white",
              border: "none",
              padding: "14px 24px",
              borderRadius: 14,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 18
            }}
          >
            Guardar cambios
          </button>
        </div>
      </div>
    );
  void editarCuponesElement;

  return (
    <Layout pulseStyle={pulseAnimationStyle} fullBleedTop={location.pathname === "/"}>
      <AppProvider value={appContextValue}>
      <NavPrincipal
        key={cart.map((i) => `${i.id}:${i.cantidad}`).join("|")}
        pagina={pagina}
        setPagina={setPagina}
        onPrefetchPagina={(p) => {
          if (p === "tienda") preloadTiendaOnce();
          if (p === "carrito") preloadCarritoOnce();
          if (p === "admin") preloadAdminOnce();
          if (p === "cuenta") preloadCuentaOnce();
        }}
        onTerminarCompra={() => finalizarCarrito()}
        esAppNativa={esAppNativa}
      />

      {/* Pantalla legal (dentro de la app, sin abrir otra pestaña). La cruz de cierre está solo dentro del iframe. */}
      <LegalDocModal legalDoc={legalDoc} />

      {/* Aviso cookies */}
      <CookiesBanner
        visible={mostrarAvisoCookies}
        pagina={pagina}
        bgColor={THEME.bg}
        goldColor={THEME.goldMain}
        mostrarConfigCookies={mostrarConfigCookies}
        consentimientoCookies={consentimientoCookies}
        onAbrirPoliticaCookies={() => setLegalDoc("politica-cookies")}
        onRechazarOpcionales={rechazarCookiesOpcionales}
        onToggleConfig={() => setMostrarConfigCookies((prev) => !prev)}
        onAceptarTodas={aceptarCookies}
        onCerrarConfig={() => setMostrarConfigCookies(false)}
        onGuardarPreferencias={() => {
          guardarConsentimientoCookies({
            preferencias: consentimientoCookies.preferencias,
            analiticas: consentimientoCookies.analiticas,
            marketing: consentimientoCookies.marketing
          });
          mostrarNotificacion("✅ Preferencias de cookies guardadas", "exito");
        }}
        onUpdatePreferencias={(checked) =>
          setConsentimientoCookies((prev) => ({
            ...prev,
            preferencias: checked
          }))
        }
        onUpdateAnaliticas={(checked) =>
          setConsentimientoCookies((prev) => ({
            ...prev,
            analiticas: checked
          }))
        }
        onUpdateMarketing={(checked) =>
          setConsentimientoCookies((prev) => ({
            ...prev,
            marketing: checked
          }))
        }
      />

      {/* Notificaciones */}
      <NotificacionOverlay notificacion={notificacion} onClose={() => setNotificacion(null)} />

      {/* PÁGINAS */}
      <Routes>
      {/* INICIO - hero + contenido */}
      <Route path="/" element={(
        <>
          <section className="hero-section" aria-label="Banner principal">
            <img
              src="/banner.jpg"
              alt="Conecta con tu esencia - Magia y Bienestar para tu Alma"
              className="hero-section__img"
            />
            <HeroParticles />
            <button
              type="button"
              className="hero-section__btn-explorar"
              onClick={(e) => { e.stopPropagation(); setPagina("tienda"); }}
              aria-label="Explorar tienda"
            >
              Explorar tienda
            </button>
          </section>
          <div
            className="inicio-wrapper"
            style={{
              maxWidth: 900,
              margin: "0 auto",
              width: "100%",
              padding: "0 20px 64px",
              marginTop: 0,
              boxSizing: "border-box",
              minHeight: "calc(100vh - 120px)",
              color: "rgba(255,255,255,0.95)"
            }}
          >
            <InicioPage />
          </div>
        </>
      )} />

      {/* MI CUENTA */}
      <Route path="/cuenta" element={(
        <CuentaPage
          formAuth={formAuth}
          setFormAuth={setFormAuth}
          modoRegistro={modoRegistro}
          setModoRegistro={setModoRegistro}
          usuario={usuario}
          setUsuario={setUsuario}
          reenvioDisponibleEn={reenvioDisponibleEn}
          setReenvioDisponibleEn={setReenvioDisponibleEn}
          provinciaPaisBloqueadosRegistro={provinciaPaisBloqueadosRegistro}
          mostrarNotificacion={mostrarNotificacion}
          precargarDatosClienteDesdeUsuario={precargarDatosClienteDesdeUsuario}
          pedidos={pedidos}
          onRepetirPedido={handleRepetirPedido}
          enviarCodigoEmail={enviarCodigoEmail}
          setPagina={setPagina}
          telefonoForzadoRegistroDesdeAcceso={telefonoForzadoRegistroDesdeAcceso}
          setTelefonoForzadoRegistroDesdeAcceso={setTelefonoForzadoRegistroDesdeAcceso}
          modoForzadoRegistroDesdeAcceso={modoForzadoRegistroDesdeAcceso}
          setModoForzadoRegistroDesdeAcceso={setModoForzadoRegistroDesdeAcceso}
          confirmacionIdentidadActivacion={confirmacionIdentidadActivacion}
          setConfirmacionIdentidadActivacion={setConfirmacionIdentidadActivacion}
        />
      )} />

      {/* TIENDA */}
      <Route path="/tienda" element={(
        <Suspense fallback={<div style={{ opacity: 0.6, textAlign: "center", padding: 24, color: THEME.goldMain }}>Cargando MAIKA...</div>}>
          <div style={{ maxWidth: 720, margin: "0 auto", width: "100%", padding: "0 20px", boxSizing: "border-box" }}>
            <TiendaPage />
          </div>
        </Suspense>
      )} />

      <Route
        path="/admin/editar-categorias"
        element={(
          <Suspense fallback={fallbackAdmin}>
            <EditarCategoriasPage
              setPagina={setPagina}
              categoriasCatalogo={categoriasCatalogo}
              setCategoriasCatalogo={setCategoriasCatalogo}
              categoriaSeleccionada={categoriaSeleccionada}
              setCategoriaSeleccionada={setCategoriaSeleccionada}
              previewCategoria={previewCategoria}
              setPreviewCategoria={setPreviewCategoria}
              nombreImagenCategoria={nombreImagenCategoria}
              setNombreImagenCategoria={setNombreImagenCategoria}
              colorCategoria={colorCategoria}
              setColorCategoria={setColorCategoria}
              tamanoCategoria={tamanoCategoria}
              setTamanoCategoria={setTamanoCategoria}
              estiloTextoCategoria={estiloTextoCategoria}
              setEstiloTextoCategoria={setEstiloTextoCategoria}
              setCategoriaARenombrar={setCategoriaARenombrar}
              setNuevaCategoriaNombre={setNuevaCategoriaNombre}
              setNuevaCategoriaImagen={setNuevaCategoriaImagen}
              setNuevaCategoriaNombreImagen={setNuevaCategoriaNombreImagen}
              setNuevaCategoriaTamano={setNuevaCategoriaTamano}
              setNuevaCategoriaColor={setNuevaCategoriaColor}
              setNuevaCategoriaEstilo={setNuevaCategoriaEstilo}
              mostrarNotificacion={mostrarNotificacion}
              CATEGORIA_IMAGENES_KEY={CATEGORIA_IMAGENES_KEY}
            />
          </Suspense>
        )}
      />
      <Route
        path="/admin/nueva-categoria"
        element={(
          <Suspense fallback={fallbackAdmin}>
            <NuevaCategoriaPage
              setPagina={setPagina}
              categoriasCatalogo={categoriasCatalogo}
              setCategoriasCatalogo={setCategoriasCatalogo}
              categoriaARenombrar={categoriaARenombrar}
              setCategoriaARenombrar={setCategoriaARenombrar}
              categoriaSeleccionada={categoriaSeleccionada}
              setCategoriaSeleccionada={setCategoriaSeleccionada}
              nuevaCategoriaNombre={nuevaCategoriaNombre}
              setNuevaCategoriaNombre={setNuevaCategoriaNombre}
              nuevaCategoriaImagen={nuevaCategoriaImagen}
              setNuevaCategoriaImagen={setNuevaCategoriaImagen}
              nuevaCategoriaNombreImagen={nuevaCategoriaNombreImagen}
              setNuevaCategoriaNombreImagen={setNuevaCategoriaNombreImagen}
              nuevaCategoriaTamano={nuevaCategoriaTamano}
              setNuevaCategoriaTamano={setNuevaCategoriaTamano}
              nuevaCategoriaColor={nuevaCategoriaColor}
              setNuevaCategoriaColor={setNuevaCategoriaColor}
              nuevaCategoriaEstilo={nuevaCategoriaEstilo}
              setNuevaCategoriaEstilo={setNuevaCategoriaEstilo}
              setPreviewCategoria={setPreviewCategoria}
              setNombreImagenCategoria={setNombreImagenCategoria}
              setTamanoCategoria={setTamanoCategoria}
              setColorCategoria={setColorCategoria}
              setEstiloTextoCategoria={setEstiloTextoCategoria}
              mostrarNotificacion={mostrarNotificacion}
              CATEGORIA_IMAGENES_KEY={CATEGORIA_IMAGENES_KEY}
            />
          </Suspense>
        )}
      />
      <Route
        path="/admin/editar-productos"
        element={(
          <Suspense fallback={fallbackAdmin}>
            <EditarProductosPage
              setPagina={setPagina}
              velas={velas}
              setVelas={setVelas}
              inciensos={inciensos}
              setInciensos={setInciensos}
              figuras={figuras}
              setFiguras={setFiguras}
              getProductoByValue={getProductoByValue}
              categoriaEditarProductos={categoriaEditarProductos}
              setCategoriaEditarProductos={setCategoriaEditarProductos}
              productoSeleccionado={productoSeleccionado}
              setProductoSeleccionado={setProductoSeleccionado}
              previewProducto={previewProducto}
              setPreviewProducto={setPreviewProducto}
              nombreImagenProducto={nombreImagenProducto}
              setNombreImagenProducto={setNombreImagenProducto}
              colorProducto={colorProducto}
              setColorProducto={setColorProducto}
              tamanoProducto={tamanoProducto}
              setTamanoProducto={setTamanoProducto}
              estiloTextoProducto={estiloTextoProducto}
              setEstiloTextoProducto={setEstiloTextoProducto}
              setCategoriaNuevoProducto={setCategoriaNuevoProducto}
              setNuevoProductoNombre={setNuevoProductoNombre}
              setNuevoProductoPrecio={setNuevoProductoPrecio}
              setNuevoProductoStock={setNuevoProductoStock}
              setNuevoProductoDescripcion={setNuevoProductoDescripcion}
              setNuevoProductoImagen={setNuevoProductoImagen}
              setNuevoProductoNombreImagen={setNuevoProductoNombreImagen}
              setNuevoProductoTamano={setNuevoProductoTamano}
              setNuevoProductoColor={setNuevoProductoColor}
              setNuevoProductoEstilo={setNuevoProductoEstilo}
              mostrarNotificacion={mostrarNotificacion}
            />
          </Suspense>
        )}
      />
      <Route
        path="/admin/inventario"
        element={(
          <Suspense fallback={fallbackAdmin}>
            <InventarioPage
              setPagina={setPagina}
              velas={velas}
              setVelas={setVelas}
              inciensos={inciensos}
              setInciensos={setInciensos}
              figuras={figuras}
              setFiguras={setFiguras}
              kits={kits}
              setKits={setKits}
              umbralStockBajo={umbralStockBajo}
              mostrarNotificacion={mostrarNotificacion}
            />
          </Suspense>
        )}
      />
      <Route
        path="/admin/nuevo-producto"
        element={(
          <Suspense fallback={fallbackAdmin}>
            <NuevoProductoPage
              setPagina={setPagina}
              velas={velas}
              setVelas={setVelas}
              inciensos={inciensos}
              setInciensos={setInciensos}
              figuras={figuras}
              setFiguras={setFiguras}
              categoriaNuevoProducto={categoriaNuevoProducto}
              setCategoriaNuevoProducto={setCategoriaNuevoProducto}
              nuevoProductoNombre={nuevoProductoNombre}
              setNuevoProductoNombre={setNuevoProductoNombre}
              nuevoProductoPrecio={nuevoProductoPrecio}
              setNuevoProductoPrecio={setNuevoProductoPrecio}
              nuevoProductoStock={nuevoProductoStock}
              setNuevoProductoStock={setNuevoProductoStock}
              nuevoProductoDescripcion={nuevoProductoDescripcion}
              setNuevoProductoDescripcion={setNuevoProductoDescripcion}
              nuevoProductoImagen={nuevoProductoImagen}
              setNuevoProductoImagen={setNuevoProductoImagen}
              nuevoProductoNombreImagen={nuevoProductoNombreImagen}
              setNuevoProductoNombreImagen={setNuevoProductoNombreImagen}
              nuevoProductoTamano={nuevoProductoTamano}
              setNuevoProductoTamano={setNuevoProductoTamano}
              nuevoProductoColor={nuevoProductoColor}
              setNuevoProductoColor={setNuevoProductoColor}
              nuevoProductoEstilo={nuevoProductoEstilo}
              setNuevoProductoEstilo={setNuevoProductoEstilo}
              setProductoSeleccionado={setProductoSeleccionado}
              setCategoriaEditarProductos={setCategoriaEditarProductos}
              mostrarNotificacion={mostrarNotificacion}
            />
          </Suspense>
        )}
      />

      {/* FAVORITOS */}
      <Route path="/favoritos" element={(
        <div style={{ maxWidth: 720, margin: "0 auto", width: "100%", padding: "0 20px", boxSizing: "border-box" }}>
          <FavoritosPage />
        </div>
      )} />

      {/* ADMIN (solo un bloque para evitar espacio negro y duplicado) */}
      <Route path="/admin" element={(
        <>
        {esAdmin && (
        <div style={{ maxWidth: 1100, margin: "0 auto", width: "98%", paddingTop: 8 }}>
          <h2 style={{ textAlign: "center", color: THEME.goldMain, marginBottom: 28, fontSize: 42 }}>⚙️ PANEL ADMIN</h2>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.78)", marginTop: -12, marginBottom: 18, fontSize: 13 }}>
            Ultima sesion: {adminUltimoLoginTexto} | Ahora: {adminAhoraTexto}
          </p>

          {!accesoAdmin ? (
            <div style={{
              background: THEME.bg,
              border: `3px solid ${THEME.goldMain}`,
              borderRadius: 24,
              padding: 34,
              maxWidth: 620,
              margin: "0 auto"
            }}>
              <h3 style={{ color: THEME.goldMain, textAlign: "center", marginBottom: 16, fontSize: 30 }}>🔐 Acceso</h3>
              <input
                type="password"
                placeholder="Clave"
                value={claveAdmin}
                onChange={(e) => setClaveAdmin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (claveAdmin === "maika2026") {
                      setAccesoAdmin(true);
                      setClaveAdmin("");
                      mostrarNotificacion("✅ Acceso concedido", "exito");
                    } else {
                      mostrarNotificacion("❌ Clave incorrecta", "error");
                    }
                  }
                }}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: 14,
                  border: `2px solid ${THEME.goldMain}`,
                  background: THEME.bg,
                  color: THEME.goldMain,
                  marginBottom: 14,
                  fontSize: 22
                }}
                autoFocus
              />
              <button
                className="btn-azul-categoria"
                onClick={() => {
                  if (claveAdmin === "maika2026") {
                    setAccesoAdmin(true);
                    setClaveAdmin("");
                    mostrarNotificacion("✅ Acceso concedido", "exito");
                  } else {
                    mostrarNotificacion("❌ Clave incorrecta", "error");
                  }
                }}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: 14,
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: 22
                }}
              >
                Acceder
              </button>
            </div>
          ) : (
            <div className="panel-admin-contenido" style={{
              background: THEME.bg,
              border: `3px solid ${THEME.goldMain}`,
              borderRadius: 24,
              padding: 30,
              position: "relative"
            }}>
              <BotonCerrar
                onClick={() => {
                  clearAdminAuthorization();
                  setAccesoAdmin(false);
                  setPagina("inicio");
                }}
                ariaLabel="Cerrar panel y volver al inicio"
                title="Cerrar"
              />
              <div style={{ display: "grid", gap: 14, marginBottom: 18 }}>
                <button
                  className="btn-admin-limpio"
                  onClick={cargarUsuarios}
                  style={{
                    background: "#4caf50",
                    color: "white",
                    border: "none",
                    padding: "18px",
                    borderRadius: 14,
                    cursor: "pointer",
                    width: "100%",
                    fontWeight: "bold",
                    fontSize: 22
                  }}
                >
                  📋 GESTIÓN DE USUARIOS
                </button>

  <details
                  style={{
                    gridColumn: "1 / -1",
                    marginBottom: 12,
                    border: "2px solid #006064",
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "rgba(0, 96, 100, 0.12)"
                  }}
                >
                  <summary
                    style={{
                      padding: "18px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: 22,
                      color: "white",
                      background: "#006064",
                      listStyle: "none",
                      textAlign: "center"
                    }}
                  >
                    🛒 EDICIÓN TIENDA
                  </summary>
                  <div style={{ padding: "0 18px 18px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
                    <button
                      className="btn-admin-limpio"
                      onClick={() => setPagina("editarCategorias")}
                      style={{
                        background: "#ff9800",
                        color: "white",
                        border: "none",
                        padding: "18px",
                        borderRadius: 14,
                        cursor: "pointer",
                        width: "100%",
                        fontWeight: "bold",
                        fontSize: 20
                      }}
                    >
                      📁 Editar categorías
                    </button>
                    <button
                      className="btn-admin-limpio"
                      onClick={() => setPagina("editarProductos")}
                      style={{
                        background: "#673ab7",
                        color: "white",
                        border: "none",
                        padding: "18px",
                        borderRadius: 14,
                        cursor: "pointer",
                        width: "100%",
                        fontWeight: "bold",
                        fontSize: 20
                      }}
                    >
                      🛠️ Edición de productos
                    </button>
                    <details style={{ border: `1px solid ${THEME.goldMain}`, borderRadius: 14, overflow: "hidden", background: "rgba(201,162,74,0.08)" }}>
                      <summary
                        style={{
                          padding: "18px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: 20,
                          color: "white",
                          background: THEME.goldMain,
                          listStyle: "none",
                          textAlign: "center"
                        }}
                      >
                        📂 Desplegable de la página de inicio
                      </summary>
                      <div style={{ padding: "12px 14px", background: "rgba(11,11,13,0.6)", borderTop: `1px solid ${THEME.goldMain}` }}>
                        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 8 }}>Cada bloque es <strong style={{ color: THEME.goldMain }}>lo que tú quieras</strong>: algo novedoso, ofertas, ritual del mes, caja misteriosa… Título y subtítulo los pones tú; eliges desde qué producto empieza y cuántos mostrar. En subtítulo puedes usar <strong style={{ color: THEME.goldMain }}>{"{mes}"}</strong> y <strong style={{ color: THEME.goldMain }}>{"{año}"}</strong> para la fecha.</p>
                        <details style={{ marginBottom: 12 }}>
                          <summary style={{ color: THEME.goldMain, cursor: "pointer", fontSize: 13, fontWeight: "bold" }}>¿De dónde salen los productos? Ver orden del catálogo</summary>
                          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 8, marginBottom: 4 }}>Los productos salen del catálogo en este orden: <strong>velas</strong> → <strong>inciensos</strong> → <strong>figuras</strong> → <strong>kits</strong>. El número &quot;Desde producto&quot; es la posición (0 = el primero, 1 = el segundo…). Así sabes qué productos verá cada bloque:</p>
                          <ul style={{ margin: 0, paddingLeft: 20, color: "rgba(255,255,255,0.85)", fontSize: 12, maxHeight: 120, overflowY: "auto" }}>
                            {[...velas, ...inciensos, ...figuras, ...(kits ?? [])].map((p, i) => (
                              <li key={`${p.categoria}-${p.id}`} style={{ marginBottom: 2 }}><strong style={{ color: THEME.goldMain }}>{i}</strong> – {p.nombre}</li>
                            ))}
                          </ul>
                          {[...velas, ...inciensos, ...figuras, ...(kits ?? [])].length === 0 && (
                            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>No hay productos en el catálogo. Añade productos en Edición de productos / Inventario.</p>
                          )}
                        </details>
                        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginBottom: 12 }}>Elige <strong style={{ color: THEME.goldMain }}>desde qué producto</strong> empieza el bloque y <strong style={{ color: THEME.goldMain }}>cuántos</strong> mostrar. Abajo ves los nombres que se verán en la página.</p>
                        {desplegableInicio.map((bloque, idx) => (
                          <div key={idx} style={{ marginBottom: 16, padding: 12, border: "1px solid rgba(201,162,74,0.5)", borderRadius: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <span style={{ color: THEME.goldMain, fontWeight: "bold" }}>Bloque {idx + 1}</span>
                              {desplegableInicio.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = desplegableInicio.filter((_, i) => i !== idx);
                                    setDesplegableInicio(next);
                                    localStorage.setItem(DESPLEGABLE_INICIO_KEY, JSON.stringify(next));
                                    mostrarNotificacion("Bloque eliminado", "normal");
                                  }}
                                  style={{ padding: "4px 10px", fontSize: 12, background: "rgba(200,80,80,0.3)", color: "#ff9999", border: "1px solid #cc6666", borderRadius: 8, cursor: "pointer" }}
                                >
                                  Eliminar bloque
                                </button>
                              )}
                            </div>
                            <div style={{ marginBottom: 8 }}>
                              <label style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 2 }}>Título</label>
                              <input
                                type="text"
                                value={bloque.titulo}
                                onChange={(e) => {
                                  const next = desplegableInicio.slice();
                                  next[idx] = { ...next[idx], titulo: e.target.value };
                                  setDesplegableInicio(next);
                                  localStorage.setItem(DESPLEGABLE_INICIO_KEY, JSON.stringify(next));
                                }}
                                placeholder="Ej: Lo nuevo, Ofertas, Lo que quieras destacar…"
                                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: "white", fontSize: 13, boxSizing: "border-box" }}
                              />
                            </div>
                            <div style={{ marginBottom: 8 }}>
                              <label style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 2 }}>Subtítulo</label>
                              <input
                                type="text"
                                value={bloque.subtitulo}
                                onChange={(e) => {
                                  const next = desplegableInicio.slice();
                                  next[idx] = { ...next[idx], subtitulo: e.target.value };
                                  setDesplegableInicio(next);
                                  localStorage.setItem(DESPLEGABLE_INICIO_KEY, JSON.stringify(next));
                                }}
                                placeholder="Ej: Lunas de {mes} {año} – Ver productos"
                                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: "white", fontSize: 13, boxSizing: "border-box" }}
                              />
                            </div>
                            {(() => {
                              const listaCat = [...velas, ...inciensos, ...figuras, ...(kits ?? [])];
                              const totalCat = listaCat.length;
                              const inicioValido = totalCat > 0 ? Math.min(bloque.inicio, totalCat - 1) : 0;
                              const mostrados = listaCat.slice(inicioValido, inicioValido + bloque.numProductos);
                              return (
                            <div>
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
                              <div style={{ flex: "1 1 200px" }}>
                                <label style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 2 }}>Empezar desde este producto</label>
                                <select
                                  value={inicioValido}
                                  onChange={(e) => {
                                    const v = Math.max(0, parseInt(e.target.value, 10) || 0);
                                    const next = desplegableInicio.slice();
                                    next[idx] = { ...next[idx], inicio: v };
                                    setDesplegableInicio(next);
                                    localStorage.setItem(DESPLEGABLE_INICIO_KEY, JSON.stringify(next));
                                  }}
                                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: "white", fontSize: 13, cursor: "pointer", boxSizing: "border-box" }}
                                >
                                  {listaCat.map((p, i) => (
                                    <option key={`${p.categoria}-${p.id}`} value={i}>{p.nombre}</option>
                                  ))}
                                  {totalCat === 0 && (
                                    <option value={0}>Sin productos en catálogo</option>
                                  )}
                                </select>
                              </div>
                              <div>
                                <label style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 2 }}>Nº productos</label>
                                <select
                                  value={bloque.numProductos}
                                  onChange={(e) => {
                                    const v = Math.min(20, Math.max(1, parseInt(e.target.value, 10)));
                                    const next = desplegableInicio.slice();
                                    next[idx] = { ...next[idx], numProductos: v };
                                    setDesplegableInicio(next);
                                    localStorage.setItem(DESPLEGABLE_INICIO_KEY, JSON.stringify(next));
                                  }}
                                  style={{ padding: "8px 10px", borderRadius: 6, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: THEME.goldMain, fontSize: 13, cursor: "pointer" }}
                                >
                                  {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            {mostrados.length > 0 && (
                              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 4 }}>
                                En la página se verán: <strong style={{ color: THEME.goldMain }}>{mostrados.map((p) => p.nombre).join(", ")}</strong>
                              </p>
                            )}
                            </div>
                              );
                            })()}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const listaCat = [...velas, ...inciensos, ...figuras, ...(kits ?? [])];
                            const totalCat = listaCat.length;
                            const ultimo = desplegableInicio[desplegableInicio.length - 1];
                            const inicioSiguiente = ultimo ? ultimo.inicio + ultimo.numProductos : 0;
                            const inicioNuevo = totalCat > 0 && inicioSiguiente < totalCat
                              ? inicioSiguiente
                              : 0;
                            const next = [...desplegableInicio, { titulo: "Nuevo bloque", subtitulo: "Ver productos", inicio: inicioNuevo, numProductos: 3 }];
                            setDesplegableInicio(next);
                            localStorage.setItem(DESPLEGABLE_INICIO_KEY, JSON.stringify(next));
                            mostrarNotificacion("Bloque añadido. Edita título y elige desde qué producto mostrar.", "normal");
                          }}
                          style={{ width: "100%", padding: "12px", marginTop: 8, background: "rgba(201,162,74,0.2)", color: THEME.goldMain, border: `2px dashed ${THEME.goldMain}`, borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 14 }}
                        >
                          ＋ Añadir otro bloque (lo que quieras: novedades, ofertas, etc.)
                        </button>
                      </div>
                    </details>
                    <details style={{ border: `1px solid ${THEME.goldMain}`, borderRadius: 14, overflow: "hidden", background: "rgba(201,162,74,0.08)" }}>
                      <summary
                        style={{
                          padding: "18px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: 20,
                          color: "white",
                          background: "#8B4513",
                          listStyle: "none",
                          textAlign: "center"
                        }}
                      >
                        ✨ Servicios (modificar tarjetas de la página de inicio)
                      </summary>
                      <div style={{ padding: "12px 14px", background: "rgba(11,11,13,0.6)", borderTop: `1px solid ${THEME.goldMain}` }}>
                        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 12 }}>Edita los 3 servicios que se muestran en la sección SERVICIOS de la página de inicio. La imagen es la ruta del archivo en <code style={{ color: THEME.goldMain }}>public/</code> (ej: /mi-imagen.jpg).</p>
                        {serviciosInicio.map((s, idx) => (
                          <div key={idx} style={{ marginBottom: 16, padding: 12, border: "1px solid rgba(201,162,74,0.4)", borderRadius: 10 }}>
                            <div style={{ color: THEME.goldMain, fontWeight: "bold", marginBottom: 8 }}>Servicio {idx + 1}</div>
                            <div style={{ display: "grid", gap: 8 }}>
                              <div>
                                <label style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 2 }}>Título</label>
                                <input
                                  type="text"
                                  value={s.titulo}
                                  onChange={(e) => {
                                    const next = [...serviciosInicio];
                                    next[idx] = { ...next[idx], titulo: e.target.value };
                                    setServiciosInicio(next);
                                    localStorage.setItem(SERVICIOS_INICIO_KEY, JSON.stringify(next));
                                  }}
                                  placeholder="Ej: 🔮 Tarot Evolutivo"
                                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: "white", fontSize: 13, boxSizing: "border-box" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 2 }}>Imagen (ruta)</label>
                                <input
                                  type="text"
                                  value={s.imagen}
                                  onChange={(e) => {
                                    const next = [...serviciosInicio];
                                    next[idx] = { ...next[idx], imagen: e.target.value };
                                    setServiciosInicio(next);
                                    localStorage.setItem(SERVICIOS_INICIO_KEY, JSON.stringify(next));
                                  }}
                                  placeholder="/tarot.jpg"
                                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: "white", fontSize: 13, boxSizing: "border-box" }}
                                />
                              </div>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <div style={{ flex: "1 1 120px" }}>
                                  <label style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 2 }}>Duración</label>
                                  <input
                                    type="text"
                                    value={s.duracion}
                                    onChange={(e) => {
                                      const next = [...serviciosInicio];
                                      next[idx] = { ...next[idx], duracion: e.target.value };
                                      setServiciosInicio(next);
                                      localStorage.setItem(SERVICIOS_INICIO_KEY, JSON.stringify(next));
                                    }}
                                    placeholder="Sesión 60 min"
                                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: "white", fontSize: 13, boxSizing: "border-box" }}
                                  />
                                </div>
                                <div style={{ flex: "1 1 80px" }}>
                                  <label style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 2 }}>Precio</label>
                                  <input
                                    type="text"
                                    value={s.precio}
                                    onChange={(e) => {
                                      const next = [...serviciosInicio];
                                      next[idx] = { ...next[idx], precio: e.target.value };
                                      setServiciosInicio(next);
                                      localStorage.setItem(SERVICIOS_INICIO_KEY, JSON.stringify(next));
                                    }}
                                    placeholder="45€"
                                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: "white", fontSize: 13, boxSizing: "border-box" }}
                                  />
                                </div>
                              </div>
                              <div>
                                <label style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 2 }}>Texto del botón</label>
                                <input
                                  type="text"
                                  value={s.textoBoton}
                                  onChange={(e) => {
                                    const next = [...serviciosInicio];
                                    next[idx] = { ...next[idx], textoBoton: e.target.value };
                                    setServiciosInicio(next);
                                    localStorage.setItem(SERVICIOS_INICIO_KEY, JSON.stringify(next));
                                  }}
                                  placeholder="Reservar Tarot"
                                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: "white", fontSize: 13, boxSizing: "border-box" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 2 }}>Enlace WhatsApp</label>
                                <input
                                  type="text"
                                  value={s.urlWhatsApp}
                                  onChange={(e) => {
                                    const next = [...serviciosInicio];
                                    next[idx] = { ...next[idx], urlWhatsApp: e.target.value };
                                    setServiciosInicio(next);
                                    localStorage.setItem(SERVICIOS_INICIO_KEY, JSON.stringify(next));
                                  }}
                                  placeholder="https://wa.me/..."
                                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: "white", fontSize: 13, boxSizing: "border-box" }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                </details>
                <button
                  className="btn-admin-limpio"
                  onClick={() => setPagina("inventario")}
                  style={{
                    background: "#2e7d32",
                    color: "white",
                    border: "none",
                    padding: "18px",
                    borderRadius: 14,
                    cursor: "pointer",
                    width: "100%",
                    fontWeight: "bold",
                    fontSize: 22
                  }}
                >
                  📦 INVENTARIO
                </button>
                <button
                  className="btn-admin-limpio"
                  onClick={() => setPagina("seguimiento")}
                  style={{
                    background: "#1565c0",
                    color: "white",
                    border: "none",
                    padding: "18px",
                    borderRadius: 14,
                    cursor: "pointer",
                    width: "100%",
                    fontWeight: "bold",
                    fontSize: 22
                  }}
                >
                  🚚 SEGUIMIENTO DE PEDIDOS
                </button>
                <button
                  className="btn-admin-limpio"
                  onClick={() => setPagina("contabilidad")}
                  style={{
                    background: "#6a1b9a",
                    color: "white",
                    border: "none",
                    padding: "18px",
                    borderRadius: 14,
                    cursor: "pointer",
                    width: "100%",
                    fontWeight: "bold",
                    fontSize: 22
                  }}
                >
                  📅 CONTABILIDAD
                </button>
                <button
                  className="btn-admin-limpio"
                  onClick={() => {
                    setCuponesAdmin(getCuponesDisponibles());
                    setPagina("editarCupones");
                  }}
                  style={{
                    background: "#e91e63",
                    color: "white",
                    border: "none",
                    padding: "18px",
                    borderRadius: 14,
                    cursor: "pointer",
                    width: "100%",
                    fontWeight: "bold",
                    fontSize: 22
                  }}
                >
                  🎟️ CÓDIGOS PROMOCIONALES
                </button>
              </div>

              <div
                style={{
                  background: THEME.bg,
                  border: `1px solid ${THEME.goldMain}`,
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 18,
                  color: "white",
                  fontSize: 20
                }}
              >
                <div style={{ color: THEME.goldMain, fontWeight: "bold", marginBottom: 12, fontSize: 24 }}>
                  📊 MÉTRICAS BÁSICAS
                </div>
                <div style={{ color: "white", opacity: 0.85, marginBottom: 12, fontSize: 16 }}>
                  Pulsa cada bloque para ver el detalle.
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 12,
                    marginBottom: 16
                  }}
                >
                  <div style={{ border: `1px solid ${THEME.goldMain}`, borderRadius: 12, padding: 12, background: "rgba(201,162,74,0.06)" }}>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>💶 Ventas semana</div>
                    <div style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: 22 }}>{metricasAdmin.ventasSemana.toFixed(2)} €</div>
                  </div>
                  <div style={{ border: `1px solid ${THEME.goldMain}`, borderRadius: 12, padding: 12, background: "rgba(201,162,74,0.06)" }}>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>📦 Pedidos pendientes</div>
                    <div style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: 22 }}>{pedidosPendientes.length}</div>
                  </div>
                  <div style={{ border: `1px solid ${THEME.goldMain}`, borderRadius: 12, padding: 12, background: "rgba(201,162,74,0.06)" }}>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>👥 Usuarios totales</div>
                    <div style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: 22 }}>{metricasUsuariosAdmin.total}</div>
                  </div>
                  <div style={{ border: `1px solid ${THEME.goldMain}`, borderRadius: 12, padding: 12, background: "rgba(201,162,74,0.06)" }}>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>⚠️ Stock bajo</div>
                    <div style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: 22 }}>{metricasAdmin.alertasStockBajo.length}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 14, padding: "12px 14px", background: "rgba(201,162,74,0.06)", border: `1px solid ${THEME.goldMain}`, borderRadius: 12 }}>
                  <div style={{ color: THEME.goldMain, fontWeight: "bold", marginBottom: 8 }}>📋 Umbral de stock bajo</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ color: "white", opacity: 0.9 }}>Considerar "stock bajo" cuando haya ≤</span>
                    <select
                      value={umbralStockBajo}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (Number.isFinite(v) && v >= 0) {
                          setUmbralStockBajo(v);
                          localStorage.setItem(UMBRAL_STOCK_BAJO_KEY, String(v));
                          mostrarNotificacion(`Umbral de stock bajo: ${v} unidades`, "normal");
                        }
                      }}
                      style={{ padding: "8px 12px", borderRadius: 8, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: THEME.goldMain, fontSize: 16, cursor: "pointer" }}
                    >
                      {[2, 3, 5, 10, 15, 20].map((n) => (
                        <option key={n} value={n}>{n} unidades</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 14, padding: "12px 14px", background: "rgba(201,162,74,0.06)", border: `1px solid ${THEME.goldMain}`, borderRadius: 12 }}>
                  <div style={{ color: THEME.goldMain, fontWeight: "bold", marginBottom: 8 }}>📝 Nota en pedido / envío</div>
                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 8 }}>Texto que se muestra en la factura del pedido y puede usarse en el email o etiqueta de envío (ej. &quot;Encender en luna creciente&quot;).</p>
                  <textarea
                    value={notaPedidoEnvio}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNotaPedidoEnvio(v);
                      localStorage.setItem(NOTA_PEDIDO_ENVIO_KEY, v);
                    }}
                    placeholder={NOTA_PEDIDO_ENVIO_DEFAULT}
                    rows={3}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: "white", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
                  />
                </div>

                <details style={{ marginBottom: 14 }}>
                  <summary
                    style={{
                      color: THEME.goldMain,
                      fontWeight: "bold",
                      fontSize: 22,
                      cursor: "pointer",
                      border: `2px solid ${THEME.goldMain}`,
                      borderRadius: 12,
                      padding: "10px 14px",
                      background: "rgba(255, 215, 0, 0.08)",
                      listStyle: "none"
                    }}
                  >
                    🏆 Productos
                  </summary>

                  <div style={{ marginTop: 10, paddingLeft: 4 }}>
                    <div style={{ color: THEME.goldMain, fontWeight: "bold", marginBottom: 8 }}>
                      📦 Informe: Productos a reponer (stock ≤ {umbralStockBajo})
                    </div>
                    {metricasAdmin.alertasStockBajo.length === 0 ? (
                      <div style={{ opacity: 0.85, marginBottom: 12 }}>Ningún producto por debajo del umbral. No hay que reponer.</div>
                    ) : (
                      <div style={{ marginBottom: 12, overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
                          <thead>
                            <tr style={{ borderBottom: `2px solid ${THEME.goldMain}` }}>
                              <th style={{ textAlign: "left", padding: "8px 12px", color: THEME.goldMain }}>Producto</th>
                              <th style={{ textAlign: "left", padding: "8px 12px", color: THEME.goldMain }}>Categoría</th>
                              <th style={{ textAlign: "right", padding: "8px 12px", color: THEME.goldMain }}>Stock actual</th>
                            </tr>
                          </thead>
                          <tbody>
                            {metricasAdmin.alertasStockBajo.map((producto) => (
                              <tr key={`stock-${producto.id}`} style={{ borderBottom: "1px solid rgba(201,162,74,0.3)" }}>
                                <td style={{ padding: "8px 12px", color: "white" }}>{producto.nombre}</td>
                                <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.85)" }}>{producto.categoria}</td>
                                <td style={{ padding: "8px 12px", textAlign: "right", color: THEME.goldMain, fontWeight: "bold" }}>{producto.stock}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div style={{ color: THEME.goldMain, fontWeight: "bold", marginBottom: 6 }}>
                      📈 Subidas / bajadas (semana actual vs anterior)
                    </div>
                    {metricasAdmin.tendenciaTopProductos.length === 0 ? (
                      <div style={{ opacity: 0.85, marginBottom: 12 }}>Sin ventas esta semana</div>
                    ) : (
                      <div style={{ marginBottom: 12 }}>
                        {metricasAdmin.tendenciaTopProductos.map((producto, index) => (
                          <div key={`trend-${producto.nombre}-${index}`} style={{ marginBottom: 6 }}>
                            {producto.tendencia === "sube"
                              ? "📈"
                              : producto.tendencia === "baja"
                                ? "📉"
                                : producto.tendencia === "nuevo"
                                  ? "🆕"
                                  : "➖"} {producto.nombre} · {producto.actual} uds (antes {producto.anterior})
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ color: THEME.goldMain, fontWeight: "bold", marginBottom: 6 }}>
                      🔝 Top vendidos (acumulado)
                    </div>
                    {metricasAdmin.topProductos.length === 0 ? (
                      <div style={{ opacity: 0.85, marginBottom: 12 }}>Sin datos todavía</div>
                    ) : (
                      <div style={{ marginBottom: 12 }}>
                        {metricasAdmin.topProductos.map((producto, index) => (
                          <div key={`${producto.nombre}-${index}`} style={{ marginBottom: 6 }}>
                            {index + 1}. {producto.nombre} ({producto.cantidad})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </details>

                <details style={{ marginBottom: 14 }}>
                  <summary
                    style={{
                      color: THEME.goldMain,
                      fontWeight: "bold",
                      fontSize: 22,
                      cursor: "pointer",
                      border: `2px solid ${THEME.goldMain}`,
                      borderRadius: 12,
                      padding: "10px 14px",
                      background: "rgba(255, 215, 0, 0.08)",
                      listStyle: "none"
                    }}
                  >
                    👥 Usuarios
                  </summary>

                  <div style={{ marginTop: 10, paddingLeft: 4 }}>
                    <div style={{ marginBottom: 8 }}>
                      Total registrados: <strong style={{ color: THEME.goldMain }}>{metricasUsuariosAdmin.total}</strong>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      Verificados: <strong style={{ color: THEME.goldMain }}>{metricasUsuariosAdmin.verificados}</strong>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      Pendientes: <strong style={{ color: THEME.goldMain }}>{metricasUsuariosAdmin.pendientes}</strong>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      Con pedidos: <strong style={{ color: THEME.goldMain }}>{metricasUsuariosAdmin.conPedidos}</strong>
                    </div>
                    <div>
                      Nuevos (7 días): <strong style={{ color: THEME.goldMain }}>{metricasUsuariosAdmin.nuevos7dias}</strong>
                    </div>
                  </div>
                </details>

                <details style={{ marginBottom: 14 }}>
                  <summary
                    style={{
                      color: THEME.goldMain,
                      fontWeight: "bold",
                      fontSize: 22,
                      cursor: "pointer",
                      border: `2px solid ${THEME.goldMain}`,
                      borderRadius: 12,
                      padding: "10px 14px",
                      background: "rgba(255, 215, 0, 0.08)",
                      listStyle: "none"
                    }}
                  >
                    💰 Ventas rápidas
                  </summary>

                  <div style={{ marginTop: 10, paddingLeft: 4 }}>
                    <div style={{ marginBottom: 8 }}>
                      💶 Ventas hoy: <strong style={{ color: THEME.goldMain }}>{metricasAdmin.ventasHoy.toFixed(2)} €</strong>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      📅 Ventas semana: <strong style={{ color: THEME.goldMain }}>{metricasAdmin.ventasSemana.toFixed(2)} €</strong>
                    </div>
                    <div>
                      📦 Pedidos totales: <strong style={{ color: THEME.goldMain }}>{pedidos.length}</strong>
                    </div>
                  </div>
                </details>

                <details style={{ marginBottom: 14 }}>
                  <summary
                    style={{
                      color: THEME.goldMain,
                      fontWeight: "bold",
                      fontSize: 22,
                      cursor: "pointer",
                      border: `2px solid ${THEME.goldMain}`,
                      borderRadius: 12,
                      padding: "10px 14px",
                      background: "rgba(255, 215, 0, 0.08)",
                      listStyle: "none"
                    }}
                  >
                    📦 Estado de pedidos
                  </summary>

                  <div style={{ marginTop: 10, paddingLeft: 4 }}>
                    <div style={{ marginBottom: 8 }}>
                      🛒 Pendientes: <strong style={{ color: THEME.goldMain }}>{pedidosPendientes.length}</strong>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      🚚 Enviados: <strong style={{ color: THEME.goldMain }}>{pedidosEnviados.length}</strong>
                    </div>
                    <div>
                      ✅ Entregados: <strong style={{ color: THEME.goldMain }}>{pedidosEntregados.length}</strong>
                    </div>
                  </div>
                </details>

                <details>
                  <summary
                    style={{
                      color: THEME.goldMain,
                      fontWeight: "bold",
                      fontSize: 22,
                      cursor: "pointer",
                      border: `2px solid ${THEME.goldMain}`,
                      borderRadius: 12,
                      padding: "10px 14px",
                      background: "rgba(255, 215, 0, 0.08)",
                      listStyle: "none"
                    }}
                  >
                    🛒 Carrito activo
                  </summary>

                  <div style={{ marginTop: 10, paddingLeft: 4 }}>
                    {metricasAdmin.carritoItemsPendientes > 0 ? (
                      <>
                        <div style={{ marginBottom: 8 }}>
                          Items en carrito: <strong style={{ color: THEME.goldMain }}>{metricasAdmin.carritoItemsPendientes}</strong>
                        </div>
                        <div>
                          Importe estimado: <strong style={{ color: THEME.goldMain }}>{metricasAdmin.carritoImportePendiente.toFixed(2)} €</strong>
                        </div>
                      </>
                    ) : (
                      <div>Sin carrito pendiente</div>
                    )}
                  </div>
                </details>
              </div>

            </div>
          )}
        </div>
        )}
        </>
      )} />

      {/* CARRITO */}
      <Route path="/admin/editar-cupones" element={editarCuponesElement} />

      {/* CARRITO */}
      <Route path="/carrito" element={(
        <Suspense fallback={<div style={{ opacity: 0.6, textAlign: "center", padding: 24, color: THEME.goldMain }}>Cargando MAIKA...</div>}>
          <div style={{ maxWidth: 800, margin: "0 auto", width: "100%", padding: "0 20px 40px", boxSizing: "border-box", minHeight: "50vh" }}>
            <CarritoPage />
          </div>
        </Suspense>
      )} />

      {/* SEGUIMIENTO DE PEDIDOS */}
      <Route path="/seguimiento" element={<SeguimientoPage />} />

      {/* CONTABILIDAD */}
      <Route path="/contabilidad" element={<ContabilidadPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Modal Confirmación */}
      <ModalConfirmacion
        abierto={modalAbierto}
        mensaje="¿Vaciar el carrito?"
        onConfirmar={confirmarVaciarCarrito}
        onCancelar={() => setModalAbierto(false)}
        textoConfirmar="Vaciar carrito"
      />

      {/* Modal: número Bizum distinto o teléfono de contacto vacío/inválido */}
      <ModalConfirmacion
        abierto={confirmacionBizumOtroNumeroAbierto}
        mensaje={(() => {
          const bizumNum = normalizarTelefonoBizum(datosPago.bizumTelefono) || "";
          const contactoNum = normalizarTelefonoBizum(datosCliente.telefono || "");
          const contactoOk = /^[67]\d{8}$/.test(contactoNum);
          if (!contactoNum || !contactoOk) {
            return `El teléfono de contacto está vacío o no es válido (9 dígitos, España). El cobro Bizum se hará al +34 ${bizumNum}. ¿Continuar?`;
          }
          return `El número para cobro Bizum (+34 ${bizumNum}) no coincide con el teléfono de contacto del pedido (${contactoNum}). ¿Cobrar a este número de todas formas?`;
        })()}
        onConfirmar={() => {
          setConfirmacionBizumOtroNumeroAbierto(false);
          requestAnimationFrame(() => {
            bizumConfirmadoRef.current = true;
            enviarPedidoWhatsApp();
          });
        }}
        onCancelar={() => setConfirmacionBizumOtroNumeroAbierto(false)}
        textoConfirmar="Sí, cobrar a este número"
        textoCancelar="No, corregir número"
        zIndex={10002}
      />

      {/* Modal factura / pedido completo */}
      <PedidoModal
        pedido={pedidoFacturaAbierto}
        onClose={() => setPedidoFacturaAbierto(null)}
        bgColor={THEME.bg}
        goldColor={THEME.goldMain}
        notaPedidoEnvio={notaPedidoEnvio}
      />

      {/* Formulario de pedido */}
      {formPedidoAbierto && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: "12px 0"
        }}>
          <div style={{
            background: THEME.bg,
            border: `3px solid ${THEME.goldMain}`,
            borderRadius: 30,
            padding: 20,
            width: "95%",
            maxWidth: 780,
            maxHeight: "95vh",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            boxSizing: "border-box"
          }}>
            <button
              type="button"
              onClick={() => {
                setPasoFinalizarCompra("datos");
                setFormPedidoAbierto(false);
              }}
              aria-label="Cerrar finalizar compra"
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 26,
                height: 26,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.28)",
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.7)",
                fontSize: 14,
                lineHeight: 1,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ✕
            </button>
            {pasoFinalizarCompra === "confirmarDireccion" ? (
              <div key="paso-confirmar-direccion" style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", color: "#fff", fontSize: 15 }}>
                <h2 style={{ color: THEME.goldMain, marginBottom: 20, textTransform: "uppercase" }}>Revisa tus datos antes de pagar</h2>
                <div style={{ background: "rgba(0,0,0,0.2)", padding: "20px 22px", borderRadius: 12, marginBottom: 24, border: `2px solid ${THEME.goldMain}`, textTransform: "uppercase" }}>
                  <div style={{ fontSize: 16, color: "rgba(255,255,255,0.92)", lineHeight: 1.7 }}>
                    <div style={{ marginBottom: 6 }}>
                      <strong>
                        {`${(datosCliente.nombre || "").trim()} ${(datosCliente.apellidos || "").trim()}`.trim() || datosCliente.nombreApellidos || "—"}
                      </strong>
                    </div>
                    <div style={{ marginBottom: 6 }}>{(`${(datosCliente.calle || "").trim()}${(datosCliente.numero || "").trim() ? " " + (datosCliente.numero || "").trim() : ""}`.trim()) || "—"}</div>
                    {([datosCliente.bloque, datosCliente.escalera, datosCliente.piso, datosCliente.puerta].some((v) => (v || "").trim())) && (
                      <div style={{ marginBottom: 6 }}>
                        {[datosCliente.bloque?.trim() && `Bloque ${datosCliente.bloque.trim()}`, datosCliente.escalera?.trim() && `Esc. ${datosCliente.escalera.trim()}`, datosCliente.piso?.trim() && `Piso ${datosCliente.piso.trim()}`, datosCliente.puerta?.trim() && `Puerta ${datosCliente.puerta.trim()}`].filter(Boolean).join(", ")}
                      </div>
                    )}
                    <div style={{ marginBottom: 6 }}>{(`${(datosCliente.cp || "").trim()} ${(datosCliente.poblacion || "").trim()}`.trim()) || "—"}</div>
                    <div style={{ marginBottom: (datosCliente.notas || "").trim() ? 6 : 0 }}>{([(datosCliente.provincia || "").trim(), (datosCliente.pais || "").trim()].filter(Boolean).join(" – ")) || "—"}</div>
                    {(datosCliente.notas || "").trim() && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(201,162,74,0.3)", fontSize: 14, color: "rgba(255,255,255,0.85)" }}>
                        <strong>Notas:</strong> {datosCliente.notas?.trim()}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.2)", padding: "20px 22px", borderRadius: 12, marginBottom: 24, border: `2px solid ${THEME.goldMain}`, textTransform: "uppercase" }}>
                  <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 600, color: "rgba(245,230,200,0.95)", letterSpacing: "0.04em" }}>📱 Teléfono de contacto y pago</p>
                  <div style={{ fontSize: 18, color: THEME.goldMain, fontWeight: "bold", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>✔</span> +34 {normalizarTelefonoBizum(datosCliente.telefono || "") || "—"}
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                    Este número se utilizará para el contacto y para el pago por Bizum.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setPasoFinalizarCompra("datos")}
                    style={{ flex: 1, padding: 12, borderRadius: 25, border: `2px solid ${THEME.goldMain}`, background: "transparent", color: THEME.goldMain, fontWeight: "bold", cursor: "pointer" }}
                  >
                    ← Volver
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPasoFinalizarCompra("pago");
                      setDatosPago((prev) => ({ ...prev, bizumTelefono: normalizarTelefonoBizum(datosCliente.telefono || "") }));
                    }}
                    style={{ flex: 1, padding: 12, borderRadius: 25, border: "none", background: THEME.goldMain, color: "#1b1745", fontWeight: "bold", cursor: "pointer" }}
                  >
                    Confirmar y continuar al pago →
                  </button>
                </div>
              </div>
            ) : pasoFinalizarCompra === "pago" ? (
              <div key="paso-pago" style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", color: "#fff", fontSize: 15 }}>
                <h2 style={{ color: THEME.goldMain, marginBottom: 20 }}>💳 MÉTODO DE PAGO</h2>
                {/* Recuadro: elegir método */}
                <div style={{
                  background: THEME.bg,
                  padding: "8px 12px",
                  borderRadius: 10,
                  marginBottom: 10,
                  border: `1px solid ${THEME.goldMain}`
                }}>
                  <p style={{ marginTop: 0, marginBottom: 4, color: "white", fontSize: 16 }}><strong>Elige cómo pagar</strong></p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setMetodoPago("bizum");
                        setDatosPago((prev) => ({ ...prev, bizumTelefono: normalizarTelefonoBizum(datosCliente.telefono || "") }));
                      }}
                      style={{
                        flex: 1,
                        padding: 6,
                        borderRadius: 20,
                        border: metodoPago === "bizum" ? `2px solid ${THEME.goldMain}` : "1px solid rgba(201,162,74,0.4)",
                        background: metodoPago === "bizum" ? THEME.goldMain : "transparent",
                        color: metodoPago === "bizum" ? "#1b1745" : THEME.goldMain,
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                      title="Pago con Bizum"
                      aria-label="Pago con Bizum"
                    >
                      📱 BIZUM
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodoPago("tarjeta")}
                      style={{
                        flex: 1,
                        padding: 6,
                        borderRadius: 20,
                        border: metodoPago === "tarjeta" ? `2px solid ${THEME.goldMain}` : "1px solid rgba(201,162,74,0.4)",
                        background: metodoPago === "tarjeta" ? THEME.goldMain : "transparent",
                        color: metodoPago === "tarjeta" ? "#1b1745" : THEME.goldMain,
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                    >
                      💳 Tarjeta bancaria
                    </button>
                  </div>
                </div>
                {/* Cuadro: datos tarjeta (Bizum usa el teléfono ya confirmado en "Revisa tus datos") */}
                {metodoPago === "tarjeta" && (
                  <div style={{
                    background: THEME.bg,
                    padding: "14px 16px",
                    borderRadius: 12,
                    marginTop: 16,
                    marginBottom: 12,
                    border: `2px solid ${THEME.goldMain}`,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.4)"
                  }}>
                    <p style={{ marginTop: 0, marginBottom: 10, color: THEME.goldMain, fontSize: 16, fontWeight: "bold" }}>💳 Datos de la tarjeta</p>
                    <input
                      type="text"
                      placeholder="Número de tarjeta"
                      value={datosPago.tarjetaNumero}
                      onChange={(e) => setDatosPago({ ...datosPago, tarjetaNumero: e.target.value })}
                      name="cc-number"
                      autoComplete="cc-number"
                      inputMode="numeric"
                      style={{ ...inputStyle, marginBottom: 8, height: 36, padding: "6px 10px", fontSize: 14, width: "100%", boxSizing: "border-box" }}
                    />
                    <input
                      type="text"
                      placeholder="Titular"
                      value={datosPago.tarjetaTitular}
                      onChange={(e) => setDatosPago({ ...datosPago, tarjetaTitular: e.target.value })}
                      name="cc-name"
                      autoComplete="cc-name"
                      style={{ ...inputStyle, marginBottom: 8, height: 36, padding: "6px 10px", fontSize: 14, width: "100%", boxSizing: "border-box" }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <label style={{ display: "block", color: "white", fontSize: 12, marginBottom: 4 }}>Caducidad</label>
                        <input
                          type="text"
                          placeholder="MM/AA"
                          value={datosPago.tarjetaCaducidad}
                          onChange={(e) => setDatosPago({ ...datosPago, tarjetaCaducidad: e.target.value })}
                          name="cc-exp"
                          autoComplete="cc-exp"
                          inputMode="numeric"
                          maxLength={5}
                          style={{ ...inputStyle, height: 36, padding: "6px 10px", fontSize: 14, width: "100%", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", color: "white", fontSize: 12, marginBottom: 4 }}>CVC</label>
                        <input
                          type="text"
                          placeholder="CVC"
                          value={datosPago.tarjetaCVV}
                          onChange={(e) => setDatosPago({ ...datosPago, tarjetaCVV: e.target.value })}
                          name="cc-csc"
                          autoComplete="cc-csc"
                          inputMode="numeric"
                          maxLength={4}
                          style={{ ...inputStyle, height: 36, padding: "6px 10px", fontSize: 14, width: "100%", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ background: THEME.bg, padding: 15, borderRadius: 10, marginBottom: 20, border: `1px solid ${THEME.goldMain}` }}>
                  <ResumenPago total={total} envioPreview={envioPreview} cuponAplicado={cuponAplicado} totalAPagar={totalAPagarResumen} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setPasoFinalizarCompra("confirmarDireccion")}
                    style={{ flex: 1, padding: 12, borderRadius: 25, border: `2px solid ${THEME.goldMain}`, background: "transparent", color: THEME.goldMain, fontWeight: "bold", cursor: "pointer" }}
                  >
                    ← Volver
                  </button>
                  <button
                    type="button"
                    onClick={() => { void enviarPedidoWhatsApp(); }}
                    disabled={procesandoPago}
                    style={{ flex: 1, padding: 12, borderRadius: 25, border: "none", background: procesandoPago ? "#8a8a8a" : "#25D366", color: "white", fontWeight: "bold", cursor: procesandoPago ? "not-allowed" : "pointer", opacity: procesandoPago ? 0.85 : 1 }}
                  >
                    {procesandoPago ? "Procesando pago..." : "💳 Pagar y enviar"}
                  </button>
                </div>
              </div>
            ) : (
              <>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
            {/* Sin <form>: evita envío implícito; campos con data-lpignore. «Ir al pago» va en pie fijo fuera del scroll. */}
            <div
              role="form"
              aria-label="Datos del pedido"
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                const target = e.target as HTMLElement;
                if (target instanceof HTMLTextAreaElement) return;
                e.preventDefault();
                const form = e.currentTarget as HTMLDivElement;
                const focusables = Array.from(
                  form.querySelectorAll<HTMLElement>("input, select, textarea, button")
                ).filter((el) => {
                  if (el.hasAttribute("disabled")) return false;
                  if (el.getAttribute("tabindex") === "-1") return false;
                  if (el.getAttribute("aria-hidden") === "true") return false;
                  return true;
                });
                const idx = focusables.indexOf(target);
                if (idx >= 0 && idx < focusables.length - 1) {
                  focusables[idx + 1].focus();
                }
              }}
              style={{ display: "contents" }}
            >
            {/* Campos señuelo: muchos navegadores rellenan el primero; así no tocan nombre/teléfono */}
            <input type="text" name="maika-honeypot-user" autoComplete="off" tabIndex={-1} readOnly aria-hidden style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", border: 0 }} />
            <input type="password" name="maika-honeypot-pass" autoComplete="new-password" tabIndex={-1} readOnly aria-hidden style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", border: 0 }} />

            <h2 style={{ color: THEME.goldMain, marginBottom: 20 }}>📝 FINALIZAR COMPRA</h2>

            {!usuario && (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 14,
                  color: "white",
                  fontSize: 13,
                  cursor: "pointer",
                  userSelect: "none"
                }}
              >
                <input
                  type="checkbox"
                  checked={recordarDatosInvitado}
                  onChange={(e) => setRecordarDatosInvitado(e.target.checked)}
                />
                Recordar mis datos en este dispositivo
              </label>
            )}

            {numeroPedidoPreview && (
              <div style={{
                background: THEME.goldMain,
                color: "#1b1745",
                padding: 10,
                borderRadius: 10,
                textAlign: "center",
                fontWeight: "bold",
                marginBottom: 20
              }}>
                Pedido: {numeroPedidoPreview}
              </div>
            )}

            {usuario && direccionesCheckout.length > 0 && (
              <div style={{ marginBottom: 14, background: "rgba(27,23,69,0.6)", border: `1px solid ${THEME.goldMain}`, borderRadius: 10, padding: 10 }}>
                <p style={{ margin: "0 0 8px", color: THEME.goldMain, fontWeight: "bold", fontSize: 13 }}>
                  Direcciones guardadas ({direccionesCheckout.length}/{DIRECCIONES_MAX})
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                  <select
                    value={direccionCheckoutSeleccionadaId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setDireccionCheckoutSeleccionadaId(id);
                      if (id === "__nueva__") {
                        setDatosCliente((prev) => ({
                          ...prev,
                          direccion: "",
                          calle: "",
                          numero: "",
                          bloque: "",
                          escalera: "",
                          piso: "",
                          puerta: "",
                          cp: "",
                          poblacion: "",
                          ciudad: "",
                          provincia: "",
                          pais: prev.pais || "ESPAÑA"
                        }));
                        return;
                      }
                      const dir = direccionesCheckout.find((d) => d.id === id);
                      if (dir) aplicarDireccionEnCheckout(dir);
                    }}
                    style={{ ...inputStyle, marginBottom: 0 }}
                  >
                    <option value="__nueva__">Nueva dirección (sin guardar)</option>
                    {direccionesCheckout.map((d, i) => (
                      <option key={d.id} value={d.id}>
                        {((d.alias || "").trim().match(/^pedido\s+\d+$/i) ? `Dirección alternativa ${i + 1}` : (d.alias || `Dirección ${i + 1}`))} - {d.calle} {d.numero}, {d.cp} {d.poblacion}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setDireccionCheckoutSeleccionadaId("__nueva__");
                      setDatosCliente((prev) => ({
                        ...prev,
                        direccion: "",
                        calle: "",
                        numero: "",
                        bloque: "",
                        escalera: "",
                        piso: "",
                        puerta: "",
                        cp: "",
                        poblacion: "",
                        ciudad: "",
                        provincia: "",
                        pais: prev.pais || "ESPAÑA"
                      }));
                    }}
                    style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${THEME.goldMain}`, background: "transparent", color: THEME.goldMain, cursor: "pointer", fontWeight: "bold" }}
                  >
                    Nueva
                  </button>
                </div>
              </div>
            )}

            <input
              type="text"
              name="maika-checkout-nombre-completo"
              placeholder="Nombre completo *"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              value={`${(datosCliente.nombre || "").trim()} ${(datosCliente.apellidos || "").trim()}`.trim()}
              onChange={(e) => {
                const completo = e.target.value.toUpperCase();
                const repartido = repartirNombreApellidos(completo, "");
                setDatosCliente({
                  ...datosCliente,
                  nombre: repartido.nombre,
                  apellidos: repartido.apellidos,
                  nombreApellidos: `${repartido.nombre} ${repartido.apellidos}`.trim()
                });
              }}
              style={{ ...inputStyle, textTransform: "uppercase" }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <input
                  ref={inputTelefonoCheckoutRef}
                  type="text"
                  name="maika-checkout-telefono"
                  placeholder="Teléfono *"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  value={formatearTelefonoESVisual(datosCliente.telefono || "")}
                  onChange={(e) =>
                    setDatosCliente({
                      ...datosCliente,
                      telefono: normalizarTelefonoES9(e.target.value).slice(0, 9)
                    })
                  }
                  style={{
                    ...inputStyle,
                    marginBottom: 0,
                    touchAction: "manipulation"
                  }}
                  inputMode="numeric"
                />
                {telefonoCheckoutLimpio.length > 0 && (
                  <div style={{
                    marginTop: 6,
                    fontSize: 12,
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    color: telefonoCheckoutEsValido
                      ? "rgba(126, 205, 143, 0.95)"
                      : telefonoCheckoutPrefijoInvalido
                        ? "rgba(201,162,74,0.9)"
                        : "rgba(255,255,255,0.62)",
                    transition: "all 0.2s ease",
                    transform: telefonoCheckoutValidPulse ? "scale(1.02)" : "scale(1)",
                    textShadow: telefonoCheckoutEsValido ? "0 0 6px rgba(126,205,143,0.22)" : "none"
                  }}>
                    {telefonoCheckoutEsValido
                      ? "✔ Teléfono válido"
                      : telefonoCheckoutPrefijoInvalido
                        ? "Debe empezar por 6 o 7"
                        : `${telefonoCheckoutLimpio.length} / 9 dígitos`}
                  </div>
                )}
              </div>
              <div>
                <input
                  type="email"
                  name="maika-checkout-email-principal"
                  placeholder="Email (opcional)"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  value={datosCliente.email || ""}
                  onChange={(e) => setDatosCliente({ ...datosCliente, email: e.target.value.trim() })}
                  style={{ ...inputStyle, marginBottom: 0 }}
                />
              </div>
            </div>

            {/* (El aviso del teléfono se renderiza fuera del panel, como overlay aparte) */}

            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, marginTop: 14, marginBottom: 0, alignItems: "center" }}>
              <input
                type="text"
                name="maika-checkout-cp"
                placeholder="CP *"
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                value={datosCliente.cp || ""}
                onChange={(e) =>
                  setDatosCliente({
                    ...datosCliente,
                    cp: e.target.value.replace(/\D/g, "").slice(0, 5)
                  })
                }
                onInput={() => {
                  setUbicacionManualPoblacion(false);
                  setUbicacionManualProvincia(false);
                }}
                inputMode="numeric"
                maxLength={5}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  e.stopPropagation();
                  inputCalleCheckoutRef.current?.focus();
                }}
                style={{ ...inputStyle, minWidth: 0, marginBottom: 0, padding: "8px 10px", lineHeight: 1.2 }}
              />
              <div
                style={{
                  border: `1px solid ${THEME.goldMain}`,
                  borderRadius: 10,
                  padding: "6px 8px",
                  background: "rgba(255,255,255,0.02)",
                  color: "rgba(255,255,255,0.9)",
                  minHeight: 40,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center"
                }}
              >
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.72)", marginBottom: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  📍 Ubicación detectada automáticamente (CP)
                  {(ubicacionManualPoblacion || ubicacionManualProvincia) && (
                    <span style={{ fontSize: 10, color: THEME.goldMain, fontWeight: 700 }}>
                      modificado
                    </span>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  <input
                    type="text"
                    name="maika-checkout-poblacion-inline"
                    placeholder="Municipio *"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    value={datosCliente.poblacion || ""}
                    onChange={(e) => {
                      setUbicacionManualPoblacion(true);
                      setDatosCliente({ ...datosCliente, poblacion: e.target.value.toUpperCase() });
                    }}
                    style={{
                      width: "100%",
                      border: "1px solid rgba(201,162,74,0.45)",
                      borderRadius: 8,
                      background: ubicacionManualPoblacion ? "rgba(201,162,74,0.16)" : "rgba(255,255,255,0.05)",
                      color: ubicacionManualPoblacion ? THEME.goldMain : "rgba(255,255,255,0.88)",
                      fontSize: 12,
                      padding: "6px 8px",
                      textTransform: "uppercase"
                    }}
                  />
                  <input
                    type="text"
                    name="maika-checkout-provincia-inline"
                    placeholder="Provincia *"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    value={datosCliente.provincia || ""}
                    onChange={(e) => {
                      setUbicacionManualProvincia(true);
                      setDatosCliente({ ...datosCliente, provincia: e.target.value.toUpperCase() });
                    }}
                    style={{
                      width: "100%",
                      border: "1px solid rgba(201,162,74,0.45)",
                      borderRadius: 8,
                      background: ubicacionManualProvincia ? "rgba(201,162,74,0.16)" : "rgba(255,255,255,0.05)",
                      color: ubicacionManualProvincia ? THEME.goldMain : "rgba(255,255,255,0.88)",
                      fontSize: 12,
                      padding: "6px 8px",
                      textTransform: "uppercase"
                    }}
                  />
                  <input
                    type="text"
                    name="maika-checkout-pais-inline"
                    placeholder="País *"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    value={datosCliente.pais || ""}
                    onChange={(e) => setDatosCliente({ ...datosCliente, pais: e.target.value.toUpperCase() })}
                    style={{
                      width: "100%",
                      border: "1px solid rgba(201,162,74,0.45)",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.05)",
                      color: "rgba(255,255,255,0.88)",
                      fontSize: 12,
                      padding: "6px 8px",
                      textTransform: "uppercase"
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.62)", marginTop: 6 }}>
                  Puedes ajustar estos datos si es necesario
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <div className="checkout-direccion-grid" style={{ display: "grid", gap: 6 }}>
                <div style={{ position: "relative" }}>
                <input
                  ref={inputCalleCheckoutRef}
                  type="text"
                  name="maika-checkout-calle"
                  placeholder="Dirección *"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  value={datosCliente.calle || ""}
                  onChange={(e) => {
                    calleElegidaDesdeSugerenciaRef.current = false;
                    permitirSugerenciasCalleRef.current = true;
                    setDatosCliente({ ...datosCliente, calle: e.target.value.toUpperCase() });
                    if (!GOOGLE_PLACES_API_KEY) setMostrarSugerenciasCalleCheckout(false);
                  }}
                  onFocus={() => {
                    if (
                      !GOOGLE_PLACES_API_KEY &&
                      permitirSugerenciasCalleRef.current &&
                      (datosCliente.calle || "").trim().length >= 3 &&
                      sugerenciasCalleCheckout.length > 0
                    ) {
                      setMostrarSugerenciasCalleCheckout(true);
                    } else if (!GOOGLE_PLACES_API_KEY) {
                      setMostrarSugerenciasCalleCheckout(false);
                    }
                  }}
                  onBlur={() => {
                    permitirSugerenciasCalleRef.current = false;
                    setMostrarSugerenciasCalleCheckout(false);
                  }}
                  style={{ ...inputStyle, textTransform: "uppercase", marginBottom: 0, minWidth: 0 }}
                />
                {!GOOGLE_PLACES_API_KEY && mostrarSugerenciasCalleCheckout && sugerenciasCalleCheckout.length > 0 && (
                  <ul
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: "100%",
                      margin: 0,
                      padding: 0,
                      listStyle: "none",
                      background: THEME.bg,
                      border: `2px solid ${THEME.goldMain}`,
                      borderRadius: 8,
                      maxHeight: 220,
                      overflowY: "auto",
                      zIndex: 10002,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.4)"
                    }}
                  >
                    {sugerenciasCalleCheckout.map((s, i) => (
                      <li
                        key={`${s.display_name}-${i}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          calleElegidaDesdeSugerenciaRef.current = true;
                          if (debounceCalleCheckoutRef.current) {
                            clearTimeout(debounceCalleCheckoutRef.current);
                            debounceCalleCheckoutRef.current = null;
                          }
                          const addr = s.address || {};
                          const calleSugerida = addr.road?.trim() || (s.display_name.split(",")[0] || "").trim();
                          const numeroSugerido = addr.house_number?.trim() || "";
                          const cpSugerido = (addr.postcode || "").replace(/\D/g, "").slice(0, 5);
                          const provinciaSugerida = (cpSugerido.length === 5 ? PROVINCIA_POR_PREFIJO_CP[cpSugerido.slice(0, 2)] : null)
                            || addr.county?.trim()
                            || addr.state?.trim() || "";
                          setDatosCliente((prev) => ({
                            ...prev,
                            ...(calleSugerida && { calle: calleSugerida.toUpperCase() }),
                            ...(numeroSugerido && { numero: numeroSugerido.toUpperCase() }),
                            ...(addr.postcode && { cp: String(addr.postcode).replace(/\D/g, "").slice(0, 5) }),
                            ...(addr.city && { poblacion: String(addr.city).trim().toUpperCase() }),
                            ...(provinciaSugerida && { provincia: provinciaSugerida.toUpperCase() })
                          }));
                          setMostrarSugerenciasCalleCheckout(false);
                          setSugerenciasCalleCheckout([]);
                          if (inputCalleCheckoutRef.current) {
                            inputCalleCheckoutRef.current.blur();
                          }
                        }}
                        style={{
                          padding: "10px 14px",
                          cursor: "pointer",
                          color: "white",
                          borderBottom: i < sugerenciasCalleCheckout.length - 1 ? "1px solid rgba(201,162,74,0.3)" : "none",
                          fontSize: 14
                        }}
                      >
                        {s.display_name}
                      </li>
                    ))}
                  </ul>
                )}
                </div>
                <input
                  type="text"
                  name="maika-checkout-numero"
                  placeholder="Número *"
                  className="checkout-mini-placeholder"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  value={datosCliente.numero || ""}
                  onChange={(e) => setDatosCliente({ ...datosCliente, numero: e.target.value.toUpperCase() })}
                  style={{ ...inputStyle, textTransform: "uppercase", marginBottom: 0, minWidth: 0, textAlign: "center" }}
                />
                <input
                  type="text"
                  name="maika-checkout-piso"
                  placeholder="Piso"
                  className="checkout-mini-placeholder"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  value={datosCliente.piso || ""}
                  onChange={(e) => setDatosCliente({ ...datosCliente, piso: e.target.value.toUpperCase() })}
                  style={{ ...inputStyle, textTransform: "uppercase", marginBottom: 0, minWidth: 0, textAlign: "center" }}
                />
                <input
                  type="text"
                  name="maika-checkout-puerta"
                  placeholder="Puerta"
                  className="checkout-mini-placeholder"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  value={datosCliente.puerta || ""}
                  onChange={(e) => setDatosCliente({ ...datosCliente, puerta: e.target.value.toUpperCase() })}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    e.stopPropagation();
                    textareaNotasCheckoutRef.current?.focus();
                  }}
                  style={{ ...inputStyle, textTransform: "uppercase", marginBottom: 0, minWidth: 0, textAlign: "center" }}
                />
              </div>
              <div style={{ margin: "0 0 4px" }}>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                {GOOGLE_PLACES_API_KEY ? "Escribe y elige tu dirección." : "Si no aparece tu dirección, puedes escribirla manualmente."}
              </p>
              {!GOOGLE_PLACES_API_KEY && (
                <div style={{ minHeight: 16 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", opacity: buscandoSugerenciasCalleCheckout ? 1 : 0 }}>
                    Buscando...
                  </span>
                </div>
              )}
              </div>
              <textarea
                ref={textareaNotasCheckoutRef}
                name="maika-checkout-notas"
                placeholder="Indicaciones para la entrega (opcional)"
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                value={datosCliente.notas}
                onChange={(e) => setDatosCliente({ ...datosCliente, notas: e.target.value.toUpperCase() })}
                style={{ ...inputStyle, minHeight: 52, resize: "vertical", textTransform: "uppercase", marginBottom: 0 }}
              />
            </div>


            <button
              type="button"
              onClick={() => setMostrarCamposOpcionalesCheckout((prev) => !prev)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${THEME.goldMain}`,
                background: "rgba(255,255,255,0.04)",
                color: THEME.goldMain,
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              {mostrarCamposOpcionalesCheckout ? "Ocultar datos opcionales" : "Añadir más datos (opcionales)"}
            </button>

            {mostrarCamposOpcionalesCheckout && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input
                    type="text"
                    name="maika-checkout-dni"
                    placeholder="DNI (opcional)"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    value={datosCliente.dni || ""}
                    onChange={(e) => setDatosCliente({ ...datosCliente, dni: e.target.value.toUpperCase() })}
                    style={{ ...inputStyle, textTransform: "uppercase", gridColumn: "1 / -1" }}
                  />
                  <input
                    type="text"
                    name="maika-checkout-bloque"
                    placeholder="Bloque (opcional)"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    value={datosCliente.bloque || ""}
                    onChange={(e) => setDatosCliente({ ...datosCliente, bloque: e.target.value.toUpperCase() })}
                    style={{ ...inputStyle, textTransform: "uppercase" }}
                  />
                  <input
                    type="text"
                    name="maika-checkout-escalera"
                    placeholder="Escalera (opcional)"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    value={datosCliente.escalera || ""}
                    onChange={(e) => setDatosCliente({ ...datosCliente, escalera: e.target.value.toUpperCase() })}
                    style={{ ...inputStyle, textTransform: "uppercase" }}
                  />
                </div>
              </>
            )}

            <div
              key={`resumen-${totalAPagarResumen}-${cuponAplicado?.codigo ?? ""}`}
              style={{
                background: THEME.bg,
                padding: 15,
                borderRadius: 10,
                margin: "20px 0"
              }}
            >
              <ResumenPago
                total={total}
                envioPreview={envioPreview}
                cuponAplicado={cuponAplicado}
                totalAPagar={totalAPagarResumen}
              />
            </div>

            <div style={{
              background: THEME.bg,
              padding: 10,
              borderRadius: 10,
              marginBottom: 12,
              marginRight: "auto",
              border: "1px solid rgba(201,162,74,0.55)",
              width: "40%"
            }}>
              {!mostrarInputCuponCheckout && !cuponAplicado && !cuponError ? (
                <button
                  type="button"
                  onClick={() => setMostrarInputCuponCheckout(true)}
                  style={{
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    color: "rgba(255,255,255,0.72)",
                    fontSize: 13,
                    textDecoration: "underline",
                    cursor: "pointer"
                  }}
                >
                  + Agregar código
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8, marginBottom: cuponAplicado || cuponError ? 10 : 0 }}>
                  <input
                    type="text"
                    name="maika-checkout-cupon"
                    placeholder="Introduce tu código"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    value={cuponInput}
                    onChange={(e) => {
                      setCuponInput(e.target.value);
                      setCuponError(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), aplicarCupon())}
                    style={{ ...inputStyle, marginBottom: 0, borderColor: cuponError ? "rgba(201,162,74,0.55)" : undefined, fontSize: 13 }}
                  />
                  <button
                    type="button"
                    onClick={aplicarCupon}
                    style={{
                      minWidth: 110,
                      borderRadius: 10,
                      border: "none",
                      background: THEME.goldMain,
                      color: "#1b1745",
                      fontWeight: "bold",
                      cursor: "pointer",
                      padding: "0 12px"
                    }}
                  >
                    Aplicar
                  </button>
                </div>
              )}

              {cuponAplicado && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <span style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: 13 }}>
                    ✅ Cupón activo: {cuponAplicado?.codigo}
                  </span>
                  <button
                    type="button"
                    onClick={quitarCupon}
                    style={{
                      background: "transparent",
                      color: "#ff4444",
                      border: "1px solid #ff4444",
                      borderRadius: 8,
                      padding: "4px 10px",
                      cursor: "pointer",
                      fontSize: 12
                    }}
                  >
                    Quitar
                  </button>
                </div>
              )}
            </div>

            </div>
            </div>
            <div
              style={{
                flexShrink: 0,
                paddingTop: 14,
                marginTop: 4,
                borderTop: `1px solid rgba(201,162,74,0.35)`,
                background: THEME.bg
              }}
            >
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                ref={botonIrAlPagoRef}
                onPointerDown={(e) => {
                  if (accesoRapidoCheckoutAbierto) return;
                  if (e.pointerType === "mouse" && e.button !== 0) return;
                  irAlPagoPointerIdRef.current = e.pointerId;
                }}
                onKeyDown={(e) => {
                  if (accesoRapidoCheckoutAbierto) return;
                  if (e.key !== "Enter" && e.key !== " ") return;
                  e.preventDefault();
                  irAlPagoEjecutarRef.current();
                }}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 25,
                  border: "none",
                  background: THEME.goldMain,
                  color: "#1b1745",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Ir al pago
              </button>
            </div>
            <p style={{ marginTop: 8, marginBottom: 0, textAlign: "right", fontSize: 12, color: "rgba(255,255,255,0.72)", width: "100%", maxWidth: "none" }}>
              Revisarás antes de confirmar
            </p>
            </div>
              </>
            )}
          </div>
        </div>
      )}

      <RepeatPedidoModal
        abierto={modalRepeatPedidoAbierto && !!pedidoRepeatSeleccionado}
        onClose={() => setModalRepeatPedidoAbierto(false)}
        onReemplazar={() => {
          if (!pedidoRepeatSeleccionado) return;
          setModalRepeatPedidoAbierto(false);
          repetirPedido(pedidoRepeatSeleccionado, "replace");
        }}
        onAnadir={() => {
          if (!pedidoRepeatSeleccionado) return;
          setModalRepeatPedidoAbierto(false);
          repetirPedido(pedidoRepeatSeleccionado, "add");
        }}
        bgColor={THEME.bg}
        goldColor={THEME.goldMain}
      />

      {accesoRapidoCheckoutAbierto && (
        <AccesoRapidoModal
          visible={accesoRapidoCheckoutAbierto}
          onClose={() => {
            resetAccesoRapidoCheckout();
            setAccesoRapidoCheckoutAbierto(false);
          }}
          bgColor={THEME.bg}
          goldColor={THEME.goldMain}
          subtitulo={
            accesoRapidoPaso === 1
              ? "Confirma tu email para validar tu identidad"
              : accesoRapidoPaso === 2
                ? "Introduce el código que te hemos enviado por email"
                : accesoRapidoPaso === 4
                  ? "Verifica tu identidad antes de activar la cuenta"
                  : "Crea una contraseña para tu cuenta"
          }
        >
            {accesoRapidoPaso === 1 ? (
              <>
                <input
                  type="text"
                  readOnly
                  value={accesoRapidoTelefono}
                  placeholder="Teléfono"
                  onPointerDown={(e) => e.preventDefault()}
                  style={{ ...inputStyle, opacity: 0.9, userSelect: "none", WebkitUserSelect: "none" as any }}
                />
                {accesoRapidoTelefono.length > 0 ? (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: /^[67]\d{8}$/.test(accesoRapidoTelefono)
                        ? "rgba(126, 205, 143, 0.95)"
                        : accesoRapidoTelefono.replace(/\D/g, "").length > 0 &&
                            !/^[67]/.test(accesoRapidoTelefono.replace(/\D/g, ""))
                          ? "rgba(201,162,74,0.9)"
                          : "rgba(255,255,255,0.62)",
                      textShadow: /^[67]\d{8}$/.test(accesoRapidoTelefono) ? "0 0 6px rgba(126,205,143,0.22)" : "none"
                    }}
                  >
                    {/^[67]\d{8}$/.test(accesoRapidoTelefono)
                      ? "✔ Teléfono listo"
                      : accesoRapidoTelefono.replace(/\D/g, "").length > 0 &&
                          !/^[67]/.test(accesoRapidoTelefono.replace(/\D/g, ""))
                        ? "Debe empezar por 6 o 7"
                        : `${accesoRapidoTelefono.replace(/\D/g, "").slice(0, 9).length} / 9 dígitos`}
                  </div>
                ) : null}

                {accesoRapidoCuentaSinEmail ? (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ color: "white", margin: 0, fontWeight: 800, marginBottom: 10 }}>
                      {accesoRapidoCuentaConActividadSinEmail
                        ? "Este número ya tiene actividad. Activa tu cuenta."
                        : "Este número necesita completar el registro"}
                    </p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => {
                          resetAccesoRapidoCheckout();
                          setAccesoRapidoCheckoutAbierto(false);
                          setAvisoTelefonoCheckout(null);
                        }}
                        style={{
                          flex: 1,
                          padding: "12px 10px",
                          borderRadius: 10,
                          border: `2px solid ${THEME.goldMain}`,
                          background: "transparent",
                          color: THEME.goldMain,
                          cursor: "pointer",
                          fontWeight: "bold"
                        }}
                      >
                        Continuar como invitado
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (accesoRapidoCuentaConActividadSinEmail) {
                            setAccesoRapidoCodigoUltimoPedido("");
                            setAccesoRapidoPaso(4);
                            return;
                          }
                          abrirRegistroForzadoDesdeAcceso("registro");
                        }}
                        style={{
                          flex: 1,
                          padding: "12px 10px",
                          borderRadius: 10,
                          border: "none",
                          background: THEME.goldMain,
                          color: "#1b1745",
                          cursor: "pointer",
                          fontWeight: "bold"
                        }}
                      >
                        {accesoRapidoCuentaConActividadSinEmail ? "Activar cuenta" : "Completar registro"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {accesoRapidoEmailRegistrado ? (
                      <p style={{ margin: "12px 0 8px", color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.45 }}>
                        📧 Email asociado:{" "}
                        <strong style={{ color: THEME.goldMain }}>{enmascararEmail(accesoRapidoEmailRegistrado)}</strong>
                      </p>
                    ) : null}
                    <input
                      type="email"
                      name="maika-acceso-confirm-email"
                      value={accesoRapidoEmail}
                      onChange={(e) => {
                        setAccesoRapidoEmail(e.target.value);
                        // Al editar de nuevo: quita aviso (evita sensación de bloqueo)
                        setAccesoRapidoEmailUi((s) => ({ ...s, ayudaInline: null }));
                      }}
                      readOnly={false}
                      placeholder={
                        accesoRapidoEmailRegistrado
                          ? "Introduce tu email para confirmar"
                          : "Correo electrónico de confirmación"
                      }
                      disabled={accesoRapidoEmailUi.bloqueado}
                      style={{
                        ...inputStyle,
                        marginTop: accesoRapidoEmailRegistrado ? 0 : 12,
                        opacity: accesoRapidoEmailUi.bloqueado ? 0.65 : 1
                      }}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-1p-ignore="true"
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        if (accesoRapidoEmailUi.bloqueado || enviando) return;
                        botonEnviarCodigoAccesoRapidoRef.current?.click();
                      }}
                    />
                    <div style={{ margin: "8px 0 0" }}>
                      {accesoRapidoEmailUi.bloqueado ? (
                        <div style={{ lineHeight: 1.5 }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              fontWeight: 700,
                              color: "rgba(255, 190, 185, 0.98)",
                              letterSpacing: "0.01em"
                            }}
                          >
                            Has superado los intentos permitidos.
                          </p>
                          <p
                            style={{
                              margin: "10px 0 0",
                              fontSize: 12,
                              fontWeight: 400,
                              color: "rgba(255, 200, 200, 0.58)",
                              lineHeight: 1.5
                            }}
                          >
                            Por seguridad, podrás volver a intentarlo en 5 minutos.
                          </p>
                          <div
                            style={{
                              margin: "12px 0 0",
                              display: "flex",
                              flexWrap: "wrap",
                              alignItems: "center",
                              gap: 8
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                color: "rgba(255,255,255,0.55)",
                                fontWeight: 500
                              }}
                            >
                              Disponible en:
                            </span>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                fontVariantNumeric: "tabular-nums",
                                letterSpacing: "0.06em",
                                color: THEME.goldMain,
                                padding: "5px 12px",
                                borderRadius: 9,
                                background: "rgba(201, 162, 74, 0.2)",
                                border: `1px solid rgba(201, 162, 74, 0.45)`,
                                boxShadow: "0 0 12px rgba(201, 162, 74, 0.16)",
                                lineHeight: 1.25
                              }}
                            >
                              {textoCuentaAtrasBloqueoEmail}
                            </span>
                          </div>
                        </div>
                      ) : accesoRapidoEmailUi.ayudaInline === ACCESO_RAPIDO_MSG_EMAIL_NO_COINCIDE ? (
                        <div
                          style={{
                            margin: 0,
                            padding: "10px 12px",
                            borderRadius: 10,
                            background: "rgba(201, 162, 74, 0.07)",
                            border: "1px solid rgba(201, 162, 74, 0.22)"
                          }}
                        >
                          <p
                            style={{
                              margin: "0 0 8px",
                              fontSize: 12,
                              color: "rgba(220, 190, 120, 0.96)",
                              lineHeight: 1.45,
                              fontWeight: 600
                            }}
                          >
                            {ACCESO_RAPIDO_MSG_EMAIL_NO_COINCIDE}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 11,
                              color: "rgba(191, 174, 122, 0.78)",
                              lineHeight: 1.45,
                              fontWeight: 400
                            }}
                          >
                            {accesoRapidoEmailUi.intentosRestantes === 1
                              ? "Último intento disponible"
                              : `Intentos restantes: ${accesoRapidoEmailUi.intentosRestantes}`}
                          </p>
                        </div>
                      ) : accesoRapidoEmailUi.ayudaInline ? (
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            color: "rgba(201,162,74,0.95)",
                            lineHeight: 1.45
                          }}
                        >
                          {accesoRapidoEmailUi.ayudaInline}
                        </p>
                      ) : null}
                    </div>
                    <button
                      ref={botonEnviarCodigoAccesoRapidoRef}
                      type="button"
                      onClick={async () => {
                        if (enviando) return;
                        if (accesoRapidoEmailUi.bloqueado) {
                          return;
                        }
                        setEnviando(true);
                        setErrorCodigo(false);
                        try {
                        const tel9 = normalizarTelefonoES9(accesoRapidoTelefono || "");
                        if (!/^[67]\d{8}$/.test(tel9)) { mostrarNotificacion("❌ Teléfono no válido", "error"); return; }
                        const emailCuentaFija = emailRegistradoUnificadoParaTel9(tel9);
                        if (!emailCuentaFija) {
                          mostrarNotificacion("❌ Este número debe completar registro antes de usar acceso rápido", "error");
                          return;
                        }
                        const emailIntroducido = (accesoRapidoEmail || "").trim().toLowerCase();
                        const { idx } = resolverUsuarioLegacyIdxPorTel9(tel9);
                        if (idx === -1) { mostrarNotificacion("❌ No existe cuenta con ese teléfono", "error"); return; }
                        const aplicarFalloEmail = () => {
                          setAccesoRapidoEmailUi((s) => {
                            const intentosRestantes = Math.max(0, s.intentosRestantes - 1);
                            if (intentosRestantes <= 0) {
                              guardarBloqueoEmailAccesoRapido(tel9);
                              return { intentosRestantes: 0, bloqueado: true, ayudaInline: null };
                            }
                            return {
                              ...s,
                              intentosRestantes,
                              ayudaInline: ACCESO_RAPIDO_MSG_EMAIL_NO_COINCIDE
                            };
                          });
                        };
                        let emailEnvio: string;
                        if (accesoRapidoEmailRegistrado) {
                          if (!emailIntroducido) {
                            setAccesoRapidoEmailUi((s) => ({
                              ...s,
                              ayudaInline: "Introduce tu correo para confirmar."
                            }));
                            return;
                          }
                          if (emailIntroducido !== accesoRapidoEmailRegistrado) {
                            aplicarFalloEmail();
                            return;
                          }
                          emailEnvio = accesoRapidoEmailRegistrado;
                        } else {
                          mostrarNotificacion("❌ Este número debe completar registro antes de usar acceso rápido", "error");
                          return;
                        }
                        setAccesoRapidoEmailUi((s) => ({ ...s, ayudaInline: null }));
                        limpiarBloqueoEmailAccesoRapido(tel9);
                        const { usuarios: usuariosLS2, idx: idxEnvio } = resolverUsuarioLegacyIdxPorTel9(tel9);
                        if (idxEnvio === -1) {
                          mostrarNotificacion("❌ No existe cuenta con ese teléfono", "error");
                          return;
                        }
                        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
                        const enviado = await enviarCodigoEmail(
                          emailEnvio,
                          usuariosLS2[idxEnvio].nombre || "Cliente",
                          codigo
                        );
                        if (!enviado) {
                          mostrarNotificacion("❌ No se pudo enviar el código. Revisa tu conexión o inténtalo más tarde.", "error");
                          return;
                        }
                        setAccesoRapidoCodigoEnviado(hashCodigoAccesoRapido(codigo));
                        setAccesoRapidoCodigoExpiraEnMs(Date.now() + ACCESO_RAPIDO_CODIGO_EXPIRA_MIN * 60_000);
                        setAccesoRapidoIntentosCodigo(0);
                        setAccesoRapidoCodigoBloqueado(false);
                        setAccesoRapidoReenvioEn(90);
                        setAccesoRapidoCodigoIngresado("");
                        setAccesoRapidoPaso(2);
                        try {
                          sessionStorage.setItem(
                            SESSION_LOGIN_TRAS_ACCESO_RAPIDO,
                            JSON.stringify({ email: emailEnvio })
                          );
                        } catch {
                          /* ignore */
                        }
                        setAvisoTelefonoCheckout(null);
                        mostrarNotificacion(
                          "✅ Te hemos enviado un código a tu correo. Introdúcelo en el siguiente paso.",
                          "exito"
                        );
                        } finally {
                          setEnviando(false);
                        }
                      }}
                  disabled={enviando || accesoRapidoEmailUi.bloqueado}
                  style={{
                    width: "100%",
                    marginTop: accesoRapidoEmailUi.bloqueado ? 16 : 0,
                    padding: 12,
                    borderRadius: 10,
                    border: "none",
                    background: THEME.goldMain,
                    color: "#1b1745",
                    fontWeight: "bold",
                    cursor: enviando || accesoRapidoEmailUi.bloqueado ? "not-allowed" : "pointer",
                    opacity: enviando || accesoRapidoEmailUi.bloqueado ? 0.85 : 1
                  }}
                    >
                  {enviando ? "Enviando..." : accesoRapidoEmailUi.bloqueado ? "Intentar más tarde" : "Enviar código y continuar"}
                    </button>
                  </>
                )}
              </>
            ) : accesoRapidoPaso === 4 ? (
              <>
                <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.45, margin: "0 0 10px" }}>
                  Introduce el código de tu último pedido para verificar tu identidad.
                </p>
                {(() => {
                  const bloqueado = msBloqueoSeguridadAccesoRapido > 0;
                  return (
                    <>
                <input
                  type="text"
                  value={accesoRapidoCodigoUltimoPedido}
                  onChange={(e) => {
                    setAccesoRapidoCodigoUltimoPedido(e.target.value);
                    if (accesoRapidoEstadoVerificacionSeguridad !== "idle") {
                      setAccesoRapidoEstadoVerificacionSeguridad("idle");
                    }
                  }}
                  placeholder="Código del último pedido"
                  style={{ ...inputStyle, opacity: bloqueado ? 0.7 : 1 }}
                  disabled={bloqueado}
                />
                {bloqueado ? (
                  <div style={{ margin: "8px 0 0", display: "flex", alignItems: "center", gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 12, color: "rgba(255, 183, 183, 0.95)" }}>
                      Demasiados intentos.
                    </p>
                    <button
                      type="button"
                      disabled
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: THEME.goldMain,
                        padding: "4px 10px",
                        borderRadius: 8,
                        border: "1px solid rgba(201, 162, 74, 0.55)",
                        background: "rgba(201, 162, 74, 0.18)",
                        cursor: "default"
                      }}
                    >
                      {textoCuentaAtrasBloqueoSeguridadUi}
                    </button>
                  </div>
                ) : (
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: 12,
                      color:
                        accesoRapidoEstadoVerificacionSeguridad === "ok"
                          ? "rgba(126,205,143,0.95)"
                          : accesoRapidoEstadoVerificacionSeguridad === "error"
                            ? "rgba(255, 183, 183, 0.95)"
                            : "rgba(255,255,255,0.72)"
                    }}
                  >
                    {accesoRapidoEstadoVerificacionSeguridad === "ok"
                      ? "✅ Identidad verificada"
                      : (accesoRapidoEstadoVerificacionSeguridad === "error" && accesoRapidoIntentosSeguridad > 0)
                        ? `❌ No se pudo verificar la identidad. Intentos restantes: ${Math.max(0, 3 - accesoRapidoIntentosSeguridad)}`
                        : `Intentos disponibles: ${Math.max(0, 3 - accesoRapidoIntentosSeguridad)}`}
                  </p>
                )}
                <button
                  type="button"
                  disabled={bloqueado}
                  onClick={() => {
                    const tel9 = normalizarTelefonoES9(accesoRapidoTelefono || "");
                    const bloqueoActivo = msRestantesBloqueoSeguridadAccesoRapido(tel9) > 0;
                    if (bloqueoActivo) {
                      setAccesoRapidoEstadoVerificacionSeguridad("error");
                      return;
                    }
                    const esperado = obtenerCodigoUltimoPedidoPorTel9(tel9).replace(/\s+/g, "").toLowerCase();
                    const recibido = (accesoRapidoCodigoUltimoPedido || "").replace(/\s+/g, "").toLowerCase();
                    if (!esperado || !recibido || esperado !== recibido) {
                      const proximo = accesoRapidoIntentosSeguridad + 1;
                      setAccesoRapidoIntentosSeguridad(proximo);
                      setAccesoRapidoEstadoVerificacionSeguridad("error");
                      if (proximo >= 3) {
                        guardarBloqueoSeguridadAccesoRapido(tel9);
                        setAccesoRapidoSeguridadUiBloqueado(true);
                      }
                      return;
                    }
                    setAccesoRapidoIntentosSeguridad(0);
                    setAccesoRapidoEstadoVerificacionSeguridad("ok");
                    setConfirmacionIdentidadActivacion(true);
                    window.setTimeout(() => {
                      abrirRegistroForzadoDesdeAcceso("activar");
                    }, 250);
                  }}
                  style={{
                    width: "100%",
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 10,
                    border: "none",
                    background: bloqueado ? "rgba(201, 162, 74, 0.35)" : THEME.goldMain,
                    color: bloqueado ? "rgba(27, 23, 69, 0.75)" : "#1b1745",
                    fontWeight: "bold",
                    cursor: bloqueado ? "default" : "pointer",
                    opacity: bloqueado ? 0.5 : 1
                  }}
                >
                  {bloqueado ? "Bloqueado temporalmente" : "Verificar identidad"}
                </button>
                    </>
                  );
                })()}
              </>
            ) : accesoRapidoPaso === 2 ? (
              <>
                <input
                  type="text"
                  value={accesoRapidoCodigoIngresado}
                  onChange={(e) => {
                    if (errorCodigo) setErrorCodigo(false);
                    setAccesoRapidoCodigoIngresado(e.target.value.replace(/\D/g, "").slice(0, 6));
                  }}
                  placeholder="Código de 6 dígitos"
                  inputMode="numeric"
                  style={inputStyle}
                />
                <button
                  type="button"
                  disabled={enviando || accesoRapidoCodigoBloqueado || accesoRapidoCodigoExpiradoAhora}
                  onClick={() => {
                    const ahora = Date.now();
                    if (accesoRapidoCodigoExpiraEnMs && ahora > accesoRapidoCodigoExpiraEnMs) {
                      setAccesoRapidoCodigoBloqueado(true);
                      setAccesoRapidoCodigoEnviado("");
                      setAccesoRapidoCodigoIngresado("");
                      setErrorCodigo(true);
                      mostrarNotificacion("❌ Código expirado, solicita uno nuevo", "error");
                      return;
                    }
                    const inputHash = hashCodigoAccesoRapido(accesoRapidoCodigoIngresado || "");
                    if (inputHash !== accesoRapidoCodigoEnviado) {
                      setErrorCodigo(true);
                      const proximo = accesoRapidoIntentosCodigo + 1;
                      setAccesoRapidoIntentosCodigo(proximo);
                      if (proximo >= ACCESO_RAPIDO_MAX_INTENTOS) {
                        setAccesoRapidoCodigoBloqueado(true);
                        mostrarNotificacion("❌ Demasiados intentos. Reenvía el código.", "error");
                      } else {
                        mostrarNotificacion(`❌ Código incorrecto. Te quedan ${ACCESO_RAPIDO_MAX_INTENTOS - proximo} intentos.`, "error");
                      }
                      return;
                    }
                    setErrorCodigo(false);
                    const tel9 = normalizarTelefonoES9(accesoRapidoTelefono || "");
                    const emailCuentaFija = emailRegistradoUnificadoParaTel9(tel9);
                    if (!emailCuentaFija) {
                      mostrarNotificacion("❌ Este número debe completar registro antes de usar acceso rápido", "error");
                      return;
                    }
                    const { usuarios: usuariosLS, idx } = resolverUsuarioLegacyIdxPorTel9(tel9);
                    if (idx === -1) { mostrarNotificacion("❌ Cuenta no encontrada", "error"); return; }
                    const emailVerificado = (usuariosLS[idx].email || "").trim().toLowerCase();
                    if (!emailVerificado) {
                      mostrarNotificacion("❌ Esta cuenta no tiene email asociado. Completa registro.", "error");
                      return;
                    }
                    setAccesoRapidoEmailVerificado(emailVerificado);
                    // Tras validar OTP siempre pasamos al paso de nueva contraseña.
                    setAccesoRapidoCodigoEnviado("");
                    setAccesoRapidoCodigoIngresado("");
                    setAccesoRapidoCodigoExpiraEnMs(null);
                    setAccesoRapidoIntentosCodigo(0);
                    setAccesoRapidoCodigoBloqueado(false);
                    setEnviando(false);
                    setAccesoRapidoReenvioEn(0);
                    setAccesoRapidoPasswordNueva("");
                    setAccesoRapidoPasswordConfirmar("");
                    setAccesoRapidoMostrarPasswordNueva(false);
                    setAccesoRapidoMostrarPasswordConfirmar(false);
                    setAccesoRapidoPaso(3);
                    mostrarNotificacion("✅ Código válido. Ahora define tu nueva contraseña.", "exito");
                  }}
                  style={{ width: "100%", padding: 12, borderRadius: 10, border: "none", background: THEME.goldMain, color: "#1b1745", fontWeight: "bold", cursor: "pointer" }}
                >
                  Verificar código
                </button>
                <button
                  type="button"
                  disabled={enviando || accesoRapidoReenvioEn > 0}
                  onClick={async () => {
                    if (enviando) return;
                    setEnviando(true);
                    setErrorCodigo(false);
                    try {
                      const tel9 = normalizarTelefonoES9(accesoRapidoTelefono || "");
                      if (!/^[67]\d{8}$/.test(tel9)) { mostrarNotificacion("❌ Teléfono no válido", "error"); return; }
                      const emailCuentaFija = emailRegistradoUnificadoParaTel9(tel9);
                      if (!emailCuentaFija) {
                        mostrarNotificacion("❌ Este número no permite reenvío por acceso rápido", "error");
                        return;
                      }
                      const { usuarios: usuariosLS, idx } = resolverUsuarioLegacyIdxPorTel9(tel9);
                      if (idx === -1) { mostrarNotificacion("❌ No existe cuenta con ese teléfono", "error"); return; }
                      if (!accesoRapidoEmailRegistrado) {
                        mostrarNotificacion("❌ Este número no tiene email asociado para reenviar código", "error");
                        return;
                      }
                      const emailEnvio = accesoRapidoEmailRegistrado;
                      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
                      const enviado = await enviarCodigoEmail(emailEnvio, usuariosLS[idx].nombre || "Cliente", codigo);
                      if (!enviado) { mostrarNotificacion("❌ No se pudo reenviar el código", "error"); return; }
                      setAccesoRapidoCodigoEnviado(hashCodigoAccesoRapido(codigo));
                      setAccesoRapidoCodigoExpiraEnMs(Date.now() + ACCESO_RAPIDO_CODIGO_EXPIRA_MIN * 60_000);
                      setAccesoRapidoIntentosCodigo(0);
                      setAccesoRapidoCodigoBloqueado(false);
                      setAccesoRapidoReenvioEn(90);
                      mostrarNotificacion("✅ Código reenviado a tu email registrado", "exito");
                    } finally {
                      setEnviando(false);
                    }
                  }}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 10,
                    border: `1px solid ${THEME.goldMain}`,
                    background: accesoRapidoReenvioEn > 0 ? "#555" : "transparent",
                    color: THEME.goldMain,
                    fontWeight: "bold",
                    cursor: enviando || accesoRapidoReenvioEn > 0 ? "not-allowed" : "pointer",
                    opacity: enviando || accesoRapidoReenvioEn > 0 ? 0.85 : 1
                  }}
                >
                  {enviando
                    ? "Enviando..."
                    : accesoRapidoReenvioEn > 0
                      ? `Reenviar en ${accesoRapidoReenvioEn}s`
                      : "Reenviar código"}
                </button>
                <button
                  type="button"
                  onClick={() => setAccesoRapidoPaso(1)}
                  style={{ width: "100%", marginTop: 10, padding: 12, borderRadius: 10, border: `1px solid ${THEME.goldMain}`, background: "transparent", color: THEME.goldMain, fontWeight: "bold", cursor: "pointer" }}
                >
                  ← Volver
                </button>
              </>
            ) : (
              <>
                <div style={{ position: "relative" }}>
                  <input
                    ref={inputAccesoRapidoPasswordNuevaRef}
                    type={accesoRapidoMostrarPasswordNueva ? "text" : "password"}
                    value={accesoRapidoPasswordNueva}
                    onChange={(e) => setAccesoRapidoPasswordNueva(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      inputAccesoRapidoPasswordConfirmarRef.current?.focus();
                    }}
                    placeholder="Crear contraseña"
                    autoComplete="new-password"
                    style={{ ...inputStyle, paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setAccesoRapidoMostrarPasswordNueva((v) => !v)}
                    title={accesoRapidoMostrarPasswordNueva ? "Ocultar contraseña" : "Ver contraseña"}
                    aria-label={accesoRapidoMostrarPasswordNueva ? "Ocultar contraseña" : "Ver contraseña"}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 19,
                      padding: 2,
                      color: THEME.goldMain
                    }}
                  >
                    {accesoRapidoMostrarPasswordNueva ? "🙈" : "👁"}
                  </button>
                </div>
                {renderRequisitosPassword(accesoRapidoPasswordNueva)}
                <div style={{ position: "relative", marginTop: 10 }}>
                  <input
                    ref={inputAccesoRapidoPasswordConfirmarRef}
                    type={accesoRapidoMostrarPasswordConfirmar ? "text" : "password"}
                    value={accesoRapidoPasswordConfirmar}
                    onChange={(e) => setAccesoRapidoPasswordConfirmar(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      if (accesoRapidoPuedeGuardarPassword) {
                        botonAccesoRapidoCrearPasswordRef.current?.click();
                      }
                    }}
                    placeholder="Confirmar contraseña"
                    autoComplete="new-password"
                    style={{ ...inputStyle, marginTop: 0, paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setAccesoRapidoMostrarPasswordConfirmar((v) => !v)}
                    title={accesoRapidoMostrarPasswordConfirmar ? "Ocultar contraseña" : "Ver contraseña"}
                    aria-label={accesoRapidoMostrarPasswordConfirmar ? "Ocultar contraseña" : "Ver contraseña"}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 19,
                      padding: 2,
                      color: THEME.goldMain
                    }}
                  >
                    {accesoRapidoMostrarPasswordConfirmar ? "🙈" : "👁"}
                  </button>
                </div>
                {(accesoRapidoPasswordNueva.trim().length > 0 || accesoRapidoPasswordConfirmar.trim().length > 0) ? (
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: 12,
                      color:
                        accesoRapidoPasswordsCoinciden
                          ? "rgba(126,205,143,0.95)"
                          : "rgba(255, 166, 166, 0.95)"
                    }}
                  >
                    {accesoRapidoPasswordsCoinciden
                      ? "✔ Contraseñas coinciden"
                      : "❌ Las contraseñas no coinciden"}
                  </p>
                ) : null}
                <button
                  ref={botonAccesoRapidoCrearPasswordRef}
                  type="button"
                  disabled={!accesoRapidoPuedeGuardarPassword}
                  onClick={() => {
                    const tel9 = normalizarTelefonoES9(accesoRapidoTelefono || "");
                    const pass = (accesoRapidoPasswordNueva || "").trim();
                    const pass2 = (accesoRapidoPasswordConfirmar || "").trim();
                    if (!/^[67]\d{8}$/.test(tel9)) { mostrarNotificacion("❌ Teléfono no válido", "error"); return; }
                    if (!pass || !pass2) { mostrarNotificacion("❌ Introduce y confirma tu contraseña", "error"); return; }
                    if (!passwordSeguraBasica(pass)) {
                      mostrarNotificacion("❌ Usa mínimo 8 caracteres e incluye letras y números", "error");
                      return;
                    }
                    if (pass !== pass2) { mostrarNotificacion("❌ Las contraseñas no coinciden", "error"); return; }
                    const { usuarios: usuariosLS, idx } = resolverUsuarioLegacyIdxPorTel9(tel9);
                    if (idx === -1) { mostrarNotificacion("❌ Cuenta no encontrada", "error"); return; }

                    const emailFinal = (accesoRapidoEmailVerificado || usuariosLS[idx].email || "").trim().toLowerCase();
                    if (emailFinal && !usuariosLS[idx].email) usuariosLS[idx].email = emailFinal;
                    usuariosLS[idx].password = pass;
                    localStorage.setItem("usuarios", JSON.stringify(usuariosLS));
                    void actualizarPasswordApi({
                      email: emailFinal || undefined,
                      telefono: tel9 || undefined,
                      password: pass
                    }).catch(() => {
                      // Si backend falla, mantenemos password local para no bloquear al usuario.
                    });

                    const usuarioFinal = usuariosLS[idx];
                    setUsuario(usuarioFinal);
                    localStorage.setItem("usuarioActual", JSON.stringify(usuarioFinal));
                    precargarDatosClienteDesdeUsuario(usuarioFinal);

                    setAccesoRapidoCodigoEnviado("");
                    setAccesoRapidoCodigoIngresado("");
                    setAccesoRapidoCodigoExpiraEnMs(null);
                    setAccesoRapidoIntentosCodigo(0);
                    setAccesoRapidoCodigoBloqueado(false);
                    setAccesoRapidoReenvioEn(0);
                    setAccesoRapidoEmailVerificado("");
                    setAccesoRapidoPasswordNueva("");
                    setAccesoRapidoPasswordConfirmar("");
                    setAccesoRapidoCheckoutAbierto(false);
                    setAvisoTelefonoCheckout(null);
                    setFormPedidoAbierto(false);
                    setPasoFinalizarCompra("datos");
                    setPagina("cuenta");
                    mostrarNotificacion("✅ Contraseña creada. Has iniciado sesión correctamente.", "exito");
                  }}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 10,
                    border: "none",
                    background: THEME.goldMain,
                    color: "#1b1745",
                    fontWeight: "bold",
                    cursor: accesoRapidoPuedeGuardarPassword ? "pointer" : "not-allowed",
                    opacity: accesoRapidoPuedeGuardarPassword ? 1 : 0.7
                  }}
                >
                  Crear contraseña y entrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccesoRapidoPasswordNueva("");
                    setAccesoRapidoPasswordConfirmar("");
                    setAccesoRapidoMostrarPasswordNueva(false);
                    setAccesoRapidoMostrarPasswordConfirmar(false);
                    setAccesoRapidoPaso(2);
                  }}
                  style={{ width: "100%", marginTop: 10, padding: 12, borderRadius: 10, border: `1px solid ${THEME.goldMain}`, background: "transparent", color: THEME.goldMain, fontWeight: "bold", cursor: "pointer" }}
                >
                  ← Volver al código
                </button>
              </>
            )}
        </AccesoRapidoModal>
      )}

      <PedidoExitoModal
        abierto={pedidoRealizado}
        numeroPedido={ultimoPedidoNumero}
        onClose={() => {
          if (urlWhatsAppPendiente) {
            window.open(urlWhatsAppPendiente, "_blank");
            setUrlWhatsAppPendiente(null);
          }
          setPedidoRealizado(false);
          setPagina("inicio");
        }}
      />

      <GestionUsuariosPage
        modalUsuariosAbierto={modalUsuariosAbierto}
        listaUsuarios={listaUsuarios}
        setModalUsuariosAbierto={setModalUsuariosAbierto}
        mostrarNotificacion={mostrarNotificacion}
        abrirEditorUsuario={abrirEditorUsuario}
        setListaUsuarios={setListaUsuarios}
        cargarUsuarios={cargarUsuarios}
        normalizarTelefonoES9={normalizarTelefonoES9}
        leerMaikaUsuarios={leerMaikaUsuarios}
        guardarMaikaUsuarios={guardarMaikaUsuarios}
        usuario={usuario}
        setUsuario={setUsuario}
        normalizarTelefonoBizum={normalizarTelefonoBizum}
        setPagina={setPagina}
        modalEditarUsuarioAbierto={modalEditarUsuarioAbierto}
        editUsuarioForm={editUsuarioForm}
        setEditUsuarioForm={setEditUsuarioForm}
        setModalEditarUsuarioAbierto={setModalEditarUsuarioAbierto}
        guardarEdicionUsuario={guardarEdicionUsuario}
      />

      <CheckoutTelefonoAviso
        visible={formPedidoAbierto && pasoFinalizarCompra === "datos"}
        aviso={avisoTelefonoCheckout}
        onClose={() => setAvisoTelefonoCheckout(null)}
        onContinuarInvitado={() => setAvisoTelefonoCheckout(null)}
        onIniciarSesion={() => {
          setAvisoTelefonoCheckout(null);
          abrirAccesoRapidoCheckout();
        }}
        goldColor={THEME.goldMain}
      />

      </AppProvider>
    </Layout>
  );
}
