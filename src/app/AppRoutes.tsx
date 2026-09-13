import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction
} from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import HeroParticles from "../components/HeroParticles";
import MaikaLogoImg from "../components/MaikaLogoImg";
import AdminRouteGuard from "../components/AdminRouteGuard";
import ExperienciaAuthGuard from "../components/ExperienciaAuthGuard";
import ServiciosPage from "../pages/ServiciosPage";
import RitualDelMesPage from "../pages/RitualDelMesPage";
import TestimoniosPage from "../pages/TestimoniosPage";
import EnviosPage from "../pages/EnviosPage";
import ContactoPage from "../pages/ContactoPage";
import SobreMaikaPage from "../pages/SobreMaikaPage";
import LegalIndexPage from "../pages/LegalIndexPage";
import LegalDocumentPage from "../pages/LegalDocumentPage";
import { type CuponAdminEntrada } from "./routes/EditarCuponesAdminPanel";
import {
  AdminMainRoute,
  CarritoPage,
  ConfigMetricasPage,
  ContabilidadPage,
  CuentaPage,
  DetalleClientePage,
  EditarCategoriasPage,
  EditarCuponesAdminPanel,
  EditarProductosPage,
  HoroscoposPage,
  InventarioPage,
  LecturaPage,
  NuevaCategoriaPage,
  NuevoProductoPage,
  ResetPasswordPage,
  SeguimientoPage,
  Sueno,
  SuenoPremiumPage,
  TiendaView
} from "./routing/lazyPages";
import {
  THEME,
  NOTA_PEDIDO_ENVIO_DEFAULT,
  NOTA_PEDIDO_ENVIO_KEY,
  UMBRAL_STOCK_BAJO_KEY,
  type ServicioInicio,
  type BloqueDesplegableInicio
} from "../config";
import type { AuthForm, Usuario, Pedido, Producto, CategoriaEntrada, SubcategoriaEntrada, Pagina, EditUsuarioForm } from "../types";
import type { AdminMetricsResumen } from "../admin/hooks/useAdminMetrics";
import type { MaikaUsuarioLS } from "../utils/maikaUsuarios";
import type { MaikaPedidoLS } from "../utils/maikaPedidos";
import {
  HERO_BANNER_UPDATED_EVENT,
  HERO_BANNER_KEY,
  HERO_BANNER_AJUSTE_KEY,
  HERO_BANNER_DEFAULT_SRC,
  HERO_BANNER_AJUSTE_DEFAULT,
  aplicarHeroCtaOffsetCss,
  leerHeroBannerAjuste,
  leerHeroBannerSrc,
  type HeroBannerAjuste
} from "../utils/heroBannerConfig";
import {
  esVistaHeroWebConSesionPanel,
  HERO_IFRAME_PREVIEW_SESSION_KEY,
  parseHeroIframePreviewSession
} from "../utils/heroWebPreviewEmbed";
import { esVistaFondoEstrellasSoloEmbebida } from "../utils/fondoEstrellasPreviewEmbed";
import {
  HERO_LOGO_CONFIG_KEY,
  HERO_LOGO_UPDATED_EVENT,
  leerHeroLogoConfig,
  type HeroLogoConfig
} from "../utils/heroLogoConfig";
import { PATH_BY_PAGINA } from "./routing/routeMaps";
export interface AppRoutesProps {
  setPagina: (p: Pagina) => void;
  esAdmin: boolean;
  accesoAdmin: boolean;
  modalUsuariosAbierto: boolean;
  setModalUsuariosAbierto: (v: boolean) => void;
  altaUsuarioEnGestionAbierta: boolean;
  setAltaUsuarioEnGestionAbierta: (v: boolean) => void;
  listaUsuarios: Usuario[];
  abrirRegistroAdminCuenta: () => void;
  formAuth: AuthForm;
  setFormAuth: Dispatch<SetStateAction<AuthForm>>;
  modoRegistro: "login" | "register";
  setModoRegistro: Dispatch<SetStateAction<"login" | "register">>;
  usuario: Usuario | null;
  setUsuario: (u: Usuario | null) => void;
  iniciarSesionConToken: (token: string, opts?: { mostrarBienvenida?: boolean }) => Promise<Usuario | null>;
  reenvioDisponibleEn: number;
  setReenvioDisponibleEn: Dispatch<SetStateAction<number>>;
  mostrarNotificacion: (m: string, t: "normal" | "exito" | "error") => void;
  precargarDatosClienteDesdeUsuario: (u: Usuario | null) => void;
  pedidos: Pedido[];
  handleRepetirPedido: (pedido: MaikaPedidoLS) => void;
  enviarCodigoEmail: (email: string, nombre: string, codigo: string) => Promise<boolean>;
  telefonoForzadoRegistroDesdeAcceso: string;
  setTelefonoForzadoRegistroDesdeAcceso: (v: string) => void;
  modoForzadoRegistroDesdeAcceso: "" | "registro" | "activar";
  setModoForzadoRegistroDesdeAcceso: (v: "" | "registro" | "activar") => void;
  confirmacionIdentidadActivacion: boolean;
  setConfirmacionIdentidadActivacion: (v: boolean) => void;
  cargarUsuarios: () => void | Promise<void>;
  abrirEditorUsuario: (u: Usuario) => void;
  abrirDetalleCliente: (u: Usuario) => void;
  setListaUsuarios: Dispatch<SetStateAction<Usuario[]>>;
  leerMaikaUsuarios: () => MaikaUsuarioLS[];
  guardarMaikaUsuarios: (u: MaikaUsuarioLS[]) => void;
  modalEditarUsuarioAbierto: boolean;
  editUsuarioForm: EditUsuarioForm;
  setEditUsuarioForm: Dispatch<SetStateAction<EditUsuarioForm>>;
  setModalEditarUsuarioAbierto: (v: boolean) => void;
  guardarEdicionUsuario: () => void | Promise<void>;
  claveAdmin: string;
  setClaveAdmin: (v: string) => void;
  setAccesoAdmin: (v: boolean) => void;
  adminUltimoLoginTexto: string;
  adminAhoraTexto: string;
  categoriasCatalogo: CategoriaEntrada[];
  setCategoriasCatalogo: Dispatch<SetStateAction<CategoriaEntrada[]>>;
  categoriaSeleccionada: string;
  setCategoriaSeleccionada: (v: string) => void;
  previewCategoria: string | null;
  setPreviewCategoria: (v: string | null) => void;
  nombreImagenCategoria: string;
  setNombreImagenCategoria: (v: string) => void;
  colorCategoria: string;
  setColorCategoria: (v: string) => void;
  tamanoCategoria: string;
  setTamanoCategoria: (v: string) => void;
  estiloTextoCategoria: string;
  setEstiloTextoCategoria: (v: string) => void;
  setCategoriaARenombrar: (v: string) => void;
  setNuevaCategoriaNombre: (v: string) => void;
  setNuevaCategoriaImagen: (v: string | null) => void;
  setNuevaCategoriaNombreImagen: (v: string) => void;
  setNuevaCategoriaTamano: (v: string) => void;
  setNuevaCategoriaColor: (v: string) => void;
  setNuevaCategoriaEstilo: (v: string) => void;
  categoriaARenombrar: string;
  nuevaCategoriaNombre: string;
  nuevaCategoriaImagen: string | null;
  nuevaCategoriaNombreImagen: string;
  nuevaCategoriaTamano: string;
  nuevaCategoriaColor: string;
  nuevaCategoriaEstilo: string;
  subcategoriasCatalogo: SubcategoriaEntrada[];
  setSubcategoriasCatalogo: Dispatch<SetStateAction<SubcategoriaEntrada[]>>;
  subcategoriasDe: (categoriaId: string) => SubcategoriaEntrada[];
  agregarSubcategoria: (categoriaId: string, nombre: string) => Promise<SubcategoriaEntrada>;
  renombrarSubcategoria: (id: string, nombre: string) => Promise<void>;
  eliminarSubcategoria: (id: string) => Promise<void>;
  velas: Producto[];
  setVelas: Dispatch<SetStateAction<Producto[]>>;
  inciensos: Producto[];
  setInciensos: Dispatch<SetStateAction<Producto[]>>;
  figuras: Producto[];
  setFiguras: Dispatch<SetStateAction<Producto[]>>;
  kits: Producto[];
  setKits: Dispatch<SetStateAction<Producto[]>>;
  joyas: Producto[];
  setJoyas: Dispatch<SetStateAction<Producto[]>>;
  getProductoByValue: (v: string) => Producto | undefined;
  categoriaEditarProductos: "velas" | "inciensos" | "figuras" | "joyas";
  setCategoriaEditarProductos: (v: "velas" | "inciensos" | "figuras" | "joyas") => void;
  productoSeleccionado: string;
  setProductoSeleccionado: (v: string) => void;
  previewProducto: string | null;
  setPreviewProducto: (v: string | null) => void;
  nombreImagenProducto: string;
  setNombreImagenProducto: (v: string) => void;
  colorProducto: string;
  setColorProducto: (v: string) => void;
  tamanoProducto: string;
  setTamanoProducto: (v: string) => void;
  estiloTextoProducto: string;
  setEstiloTextoProducto: (v: string) => void;
  setCategoriaNuevoProducto: (v: "velas" | "inciensos" | "figuras" | "joyas") => void;
  setNuevoProductoNombre: (v: string) => void;
  setNuevoProductoPrecio: (v: string) => void;
  setNuevoProductoStock: (v: number) => void;
  setNuevoProductoDescripcion: (v: string) => void;
  setNuevoProductoImagen: (v: string | null) => void;
  setNuevoProductoNombreImagen: (v: string) => void;
  setNuevoProductoTamano: (v: string) => void;
  setNuevoProductoColor: (v: string) => void;
  setNuevoProductoEstilo: (v: string) => void;
  categoriaNuevoProducto: "velas" | "inciensos" | "figuras" | "joyas";
  nuevoProductoNombre: string;
  nuevoProductoPrecio: string;
  nuevoProductoStock: number;
  nuevoProductoDescripcion: string;
  nuevoProductoImagen: string | null;
  nuevoProductoNombreImagen: string;
  nuevoProductoTamano: string;
  nuevoProductoColor: string;
  nuevoProductoEstilo: string;
  umbralStockBajo: number;
  setUmbralStockBajo: (v: number) => void;
  desplegableInicio: BloqueDesplegableInicio[];
  setDesplegableInicio: (v: BloqueDesplegableInicio[]) => void;
  serviciosInicio: ServicioInicio[];
  setServiciosInicio: (v: ServicioInicio[]) => void;
  metrics: AdminMetricsResumen;
  pedidosPendientes: Pedido[];
  pedidosEnviados: Pedido[];
  pedidosEntregados: Pedido[];
  notaPedidoEnvio: string;
  setNotaPedidoEnvio: (v: string) => void;
  getCuponesDisponibles: () => Record<string, CuponAdminEntrada>;
  setCuponesAdmin: Dispatch<SetStateAction<Record<string, CuponAdminEntrada>>>;
  cuponesAdmin: Record<string, CuponAdminEntrada>;
}

export function AppRoutes(p: AppRoutesProps) {
  const [heroBannerSrc, setHeroBannerSrc] = useState(HERO_BANNER_DEFAULT_SRC);
  const [heroBannerAjuste, setHeroBannerAjuste] = useState(HERO_BANNER_AJUSTE_DEFAULT);
  /** Fuerza remount del `<img>` del hero tras sync (storage / customEvent); evita caché agresiva con la misma `src`. */
  const [heroBannerVisualTick, setHeroBannerVisualTick] = useState(0);
  const [heroLogoCfg, setHeroLogoCfg] = useState<HeroLogoConfig>(() => leerHeroLogoConfig());
  const [portalTiendaActivo, setPortalTiendaActivo] = useState(false);
  const portalTiendaTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const fallbackAdmin = (
    <div style={{ padding: 48, textAlign: "center", color: THEME.goldMain }}>Cargando…</div>
  );
  const buildScreenStyle = (
    maxWidth: number,
    horizontalPadding: string,
    extra?: CSSProperties,
    bottomPadding: string = "0px"
  ): CSSProperties => ({
    maxWidth,
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
    paddingLeft: horizontalPadding,
    paddingRight: horizontalPadding,
    paddingBottom: bottomPadding,
    /*
     * Altura mínima del bloque de ruta: compensar `--app-topbar-stack` (regla layout Maika).
     * El scroll principal va en `routes-grow` / tienda-shell; evitar `100dvh` bruto aquí para no duplicar barra.
     */
    display: "flex",
    flexDirection: "column",
    minHeight: "calc(100svh - var(--app-topbar-stack))",
    ...extra
  });

  /** Misma envoltura en todas las pantallas de contenido (espaciado global + ancho/padding unificado). */
  const bloqueLayoutContenido = (children: ReactNode) => (
    <div className="page-top-spacing">
      <div style={buildScreenStyle(800, "20px", undefined, "40px")}>{children}</div>
    </div>
  );

  /**
   * /suenos: igual que `bloqueLayoutContenido`, pero sin el `min-height` de "al menos toda la pantalla".
   * Esa reserva asume que el hueco real bajo la barra (`routes-grow`) coincide con `100svh - app-topbar-stack`,
   * pero el shell le resta además su propio padding inferior; en páginas con mucho contenido no se nota (ya
   * scrollean de sobra), pero el estado inicial de Sueños es más corto que ese mínimo forzado, así que la
   * página "obligada a medir eso" quedaba unos px más alta que el hueco real y cualquier rueda de ratón lo
   * consumía de golpe (efecto de salto). Aquí el alto lo pone el contenido real, sin mínimo artificial.
   */
  const bloqueLayoutSuenos = (children: ReactNode) => (
    <div className="page-top-spacing">
      <div style={buildScreenStyle(800, "20px", { minHeight: 0 }, "40px")}>{children}</div>
    </div>
  );

  /** /tienda: catálogo más ancho que las páginas editoriales para aprovechar el grid de productos. */
  const bloqueLayoutTienda = (children: ReactNode) => (
    <div className="page-top-spacing">
      <div style={buildScreenStyle(1120, "20px", undefined, "40px")}>{children}</div>
    </div>
  );

  /** /lectura: ancho del wrap enlazado a `--lectura-pantalla-ancho-max` (admin); el texto usa otra var, la carta no. */
  const lecturaRutaInnerStyle: CSSProperties = {
    margin: "0 auto",
    width: "100%",
    maxWidth: "var(--lectura-pantalla-ancho-max, min(800px, 100%))",
    boxSizing: "border-box",
    paddingLeft: "20px",
    paddingRight: "20px",
    paddingBottom: "40px",
    display: "flex",
    flexDirection: "column",
    minHeight: "calc(100svh - var(--app-topbar-stack))"
  };

  const bloqueLayoutLectura = (children: ReactNode) => (
    <div className="page-top-spacing">
      <div className="lectura-page-ruta-wrap" style={lecturaRutaInnerStyle}>
        {children}
      </div>
    </div>
  );

  const {
    setPagina,
    esAdmin,
    accesoAdmin,
    modalUsuariosAbierto,
    setModalUsuariosAbierto,
    altaUsuarioEnGestionAbierta,
    setAltaUsuarioEnGestionAbierta,
    listaUsuarios,
    abrirRegistroAdminCuenta,
    formAuth,
    setFormAuth,
    modoRegistro,
    setModoRegistro,
    usuario,
    setUsuario,
    iniciarSesionConToken,
    reenvioDisponibleEn,
    setReenvioDisponibleEn,
    mostrarNotificacion,
    precargarDatosClienteDesdeUsuario,
    pedidos,
    handleRepetirPedido,
    enviarCodigoEmail,
    telefonoForzadoRegistroDesdeAcceso,
    setTelefonoForzadoRegistroDesdeAcceso,
    modoForzadoRegistroDesdeAcceso,
    setModoForzadoRegistroDesdeAcceso,
    confirmacionIdentidadActivacion,
    setConfirmacionIdentidadActivacion,
    cargarUsuarios,
    abrirEditorUsuario,
    abrirDetalleCliente,
    setListaUsuarios,
    leerMaikaUsuarios,
    guardarMaikaUsuarios,
    modalEditarUsuarioAbierto,
    editUsuarioForm,
    setEditUsuarioForm,
    setModalEditarUsuarioAbierto,
    guardarEdicionUsuario,
    claveAdmin,
    setClaveAdmin,
    setAccesoAdmin,
    adminUltimoLoginTexto,
    adminAhoraTexto,
    categoriasCatalogo,
    setCategoriasCatalogo,
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    previewCategoria,
    setPreviewCategoria,
    nombreImagenCategoria,
    setNombreImagenCategoria,
    colorCategoria,
    setColorCategoria,
    tamanoCategoria,
    setTamanoCategoria,
    estiloTextoCategoria,
    setEstiloTextoCategoria,
    setCategoriaARenombrar,
    setNuevaCategoriaNombre,
    setNuevaCategoriaImagen,
    setNuevaCategoriaNombreImagen,
    setNuevaCategoriaTamano,
    setNuevaCategoriaColor,
    setNuevaCategoriaEstilo,
    categoriaARenombrar,
    nuevaCategoriaNombre,
    nuevaCategoriaImagen,
    nuevaCategoriaNombreImagen,
    nuevaCategoriaTamano,
    nuevaCategoriaColor,
    nuevaCategoriaEstilo,
    subcategoriasCatalogo,
    subcategoriasDe,
    agregarSubcategoria,
    renombrarSubcategoria,
    eliminarSubcategoria,
    velas,
    setVelas,
    inciensos,
    setInciensos,
    figuras,
    setFiguras,
    kits,
    setKits,
    joyas,
    setJoyas,
    getProductoByValue,
    categoriaEditarProductos,
    setCategoriaEditarProductos,
    productoSeleccionado,
    setProductoSeleccionado,
    previewProducto,
    setPreviewProducto,
    nombreImagenProducto,
    setNombreImagenProducto,
    colorProducto,
    setColorProducto,
    tamanoProducto,
    setTamanoProducto,
    estiloTextoProducto,
    setEstiloTextoProducto,
    setCategoriaNuevoProducto,
    setNuevoProductoNombre,
    setNuevoProductoPrecio,
    setNuevoProductoStock,
    setNuevoProductoDescripcion,
    setNuevoProductoImagen,
    setNuevoProductoNombreImagen,
    setNuevoProductoTamano,
    setNuevoProductoColor,
    setNuevoProductoEstilo,
    categoriaNuevoProducto,
    nuevoProductoNombre,
    nuevoProductoPrecio,
    nuevoProductoStock,
    nuevoProductoDescripcion,
    nuevoProductoImagen,
    nuevoProductoNombreImagen,
    nuevoProductoTamano,
    nuevoProductoColor,
    nuevoProductoEstilo,
    umbralStockBajo,
    setUmbralStockBajo,
    desplegableInicio,
    setDesplegableInicio,
    serviciosInicio,
    setServiciosInicio,
    metrics,
    pedidosPendientes,
    pedidosEnviados,
    pedidosEntregados,
    notaPedidoEnvio,
    setNotaPedidoEnvio,
    getCuponesDisponibles,
    setCuponesAdmin,
    cuponesAdmin
  } = p;

  const location = useLocation();
  const { pathname, search } = location;
  const navigate = useNavigate();
  const esVistaSoloFondoEstrellasEmbed =
    pathname === "/" && esVistaFondoEstrellasSoloEmbebida(search);

  const entrarTiendaDesdeHero = useCallback(() => {
    if (portalTiendaTimerRef.current != null) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduceMotion) {
      navigate(PATH_BY_PAGINA.tienda, { state: { maikaEntradaTienda: "hero-cta" } });
      return;
    }
    setPortalTiendaActivo(true);
    portalTiendaTimerRef.current = window.setTimeout(() => {
      portalTiendaTimerRef.current = null;
      navigate(PATH_BY_PAGINA.tienda, { state: { maikaEntradaTienda: "hero-cta" } });
      setPortalTiendaActivo(false);
    }, 280);
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (portalTiendaTimerRef.current != null) {
        window.clearTimeout(portalTiendaTimerRef.current);
        portalTiendaTimerRef.current = null;
      }
    };
  }, []);

  /** Inicio (hero + CTA "Explorar tienda"): nunca debe desplazarse, ver `inicio-no-scroll` en home.css. */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const esInicio = pathname === "/" && !esVistaSoloFondoEstrellasEmbed;
    if (esInicio) {
      html.classList.add("inicio-no-scroll");
      body.classList.add("inicio-no-scroll");
    }
    return () => {
      html.classList.remove("inicio-no-scroll");
      body.classList.remove("inicio-no-scroll");
    };
  }, [pathname, esVistaSoloFondoEstrellasEmbed]);

  /** Rutas `/admin/*`: solo toasts de error; éxito e info no molestan (salvo pantallas dedicadas de diseño web hero). */
  const sinNotificacionAdmin = useCallback(
    (msg: string, tipo: "normal" | "exito" | "error") => {
      if (tipo === "error") {
        mostrarNotificacion(msg, "error");
        return;
      }
      const apartadoDisenoWebHeroExito =
        pathname === "/admin/diseno-web/logo" ||
        pathname === "/admin/diseno-web/barra" ||
        pathname === "/admin/diseno-web/fondo" ||
        pathname === "/admin/diseno-web/imagen" ||
        pathname === "/admin/diseno-web/boton" ||
        pathname === "/admin/diseno-web/espaciado";
      if (apartadoDisenoWebHeroExito && tipo === "exito") {
        mostrarNotificacion(msg, "exito");
      }
    },
    [mostrarNotificacion, pathname]
  );

  useEffect(() => {
    const syncHeroBanner = (event?: Event) => {
      const customEvent = event as
        | CustomEvent<{ src?: string; ajuste?: Partial<HeroBannerAjuste>; persisted?: boolean }>
        | undefined;
      const detail = customEvent?.detail;
      if (detail?.src) {
        setHeroBannerSrc(detail.src);
      } else {
        setHeroBannerSrc(leerHeroBannerSrc());
      }
      if (detail?.ajuste) {
        setHeroBannerAjuste((prev) => ({ ...prev, ...detail.ajuste }));
        const paraCss: HeroBannerAjuste = { ...leerHeroBannerAjuste(), ...detail.ajuste };
        aplicarHeroCtaOffsetCss(paraCss.ctaOffset);
      } else {
        const next = leerHeroBannerAjuste();
        setHeroBannerAjuste(next);
        aplicarHeroCtaOffsetCss(next.ctaOffset);
      }
      if (event != null) {
        setHeroBannerVisualTick((n) => n + 1);
      }
    };

    const syncHeroLogo = () => {
      setHeroLogoCfg(leerHeroLogoConfig());
    };

    const search = typeof window !== "undefined" ? window.location.search : "";
    let sessionParsed: ReturnType<typeof parseHeroIframePreviewSession> | null = null;
    if (esVistaHeroWebConSesionPanel(search)) {
      try {
        const raw = sessionStorage.getItem(HERO_IFRAME_PREVIEW_SESSION_KEY);
        sessionParsed = raw ? parseHeroIframePreviewSession(raw) : null;
      } catch {
        sessionParsed = null;
      }
    }

    if (sessionParsed) {
      setHeroBannerSrc(sessionParsed.src);
      setHeroBannerAjuste(sessionParsed.ajuste);
      aplicarHeroCtaOffsetCss(sessionParsed.ajuste.ctaOffset);
    } else {
      syncHeroBanner();
    }
    syncHeroLogo();

    window.addEventListener(HERO_BANNER_UPDATED_EVENT, syncHeroBanner as EventListener);
    window.addEventListener(HERO_LOGO_UPDATED_EVENT, syncHeroLogo as EventListener);
    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key === HERO_BANNER_KEY || event.key === HERO_BANNER_AJUSTE_KEY) {
        syncHeroBanner(event);
      }
      if (event.key === HERO_LOGO_CONFIG_KEY) {
        syncHeroLogo();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(HERO_BANNER_UPDATED_EVENT, syncHeroBanner as EventListener);
      window.removeEventListener(HERO_LOGO_UPDATED_EVENT, syncHeroLogo as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const adminMainRouteElement = (
    <Suspense fallback={fallbackAdmin}>
      <AdminRouteGuard>
        <AdminMainRoute
        esAdmin={esAdmin}
        accesoAdmin={accesoAdmin}
        modalUsuariosAbierto={modalUsuariosAbierto}
        setModalUsuariosAbierto={setModalUsuariosAbierto}
        altaUsuarioEnGestionAbierta={altaUsuarioEnGestionAbierta}
        setAltaUsuarioEnGestionAbierta={setAltaUsuarioEnGestionAbierta}
        listaUsuarios={listaUsuarios}
        abrirRegistroAdminCuenta={abrirRegistroAdminCuenta}
        formAuth={formAuth}
        setFormAuth={setFormAuth}
        modoRegistro={modoRegistro}
        setModoRegistro={setModoRegistro}
        usuario={usuario}
        setUsuario={setUsuario}
        iniciarSesionConToken={iniciarSesionConToken}
        reenvioDisponibleEn={reenvioDisponibleEn}
        setReenvioDisponibleEn={setReenvioDisponibleEn}
        mostrarNotificacion={sinNotificacionAdmin}
        precargarDatosClienteDesdeUsuario={precargarDatosClienteDesdeUsuario}
        pedidos={pedidos}
        handleRepetirPedido={handleRepetirPedido}
        enviarCodigoEmail={enviarCodigoEmail}
        setPagina={setPagina}
        telefonoForzadoRegistroDesdeAcceso={telefonoForzadoRegistroDesdeAcceso}
        setTelefonoForzadoRegistroDesdeAcceso={setTelefonoForzadoRegistroDesdeAcceso}
        modoForzadoRegistroDesdeAcceso={modoForzadoRegistroDesdeAcceso}
        setModoForzadoRegistroDesdeAcceso={setModoForzadoRegistroDesdeAcceso}
        confirmacionIdentidadActivacion={confirmacionIdentidadActivacion}
        setConfirmacionIdentidadActivacion={setConfirmacionIdentidadActivacion}
        cargarUsuarios={cargarUsuarios}
        abrirEditorUsuario={abrirEditorUsuario}
        abrirDetalleCliente={abrirDetalleCliente}
        setListaUsuarios={setListaUsuarios}
        leerMaikaUsuarios={leerMaikaUsuarios}
        guardarMaikaUsuarios={guardarMaikaUsuarios}
        modalEditarUsuarioAbierto={modalEditarUsuarioAbierto}
        editUsuarioForm={editUsuarioForm}
        setEditUsuarioForm={setEditUsuarioForm}
        setModalEditarUsuarioAbierto={setModalEditarUsuarioAbierto}
        guardarEdicionUsuario={guardarEdicionUsuario}
        claveAdmin={claveAdmin}
        setClaveAdmin={setClaveAdmin}
        setAccesoAdmin={setAccesoAdmin}
        adminUltimoLoginTexto={adminUltimoLoginTexto}
        adminAhoraTexto={adminAhoraTexto}
        desplegableInicio={desplegableInicio}
        setDesplegableInicio={setDesplegableInicio}
        velas={velas}
        inciensos={inciensos}
        figuras={figuras}
        kits={kits}
        joyas={joyas}
        serviciosInicio={serviciosInicio}
        setServiciosInicio={setServiciosInicio}
        setCuponesAdmin={setCuponesAdmin}
        getCuponesDisponibles={getCuponesDisponibles}
        metrics={metrics}
        pedidosPendientes={pedidosPendientes}
        pedidosEnviados={pedidosEnviados}
        pedidosEntregados={pedidosEntregados}
        umbralStockBajo={umbralStockBajo}
        setUmbralStockBajo={setUmbralStockBajo}
        notaPedidoEnvio={notaPedidoEnvio}
        setNotaPedidoEnvio={setNotaPedidoEnvio}
      />
      </AdminRouteGuard>
    </Suspense>
  );

  return (
    <Routes>
    {/* INICIO - hero + contenido (solo cielo en iframe de previsualización admin) */}
    <Route path="/" element={esVistaSoloFondoEstrellasEmbed ? (
      <main
        className="maika-fondo-solo-preview-root"
        style={{
          minHeight: "100svh",
          width: "100%",
          margin: 0,
          padding: 0,
          boxSizing: "border-box"
        }}
        aria-label="Vista previa: cielo estrellado"
      />
    ) : (
      <>
        <section
          className={`hero-section${portalTiendaActivo ? " hero-section--portal-activo" : ""}`}
          data-maika="hero-main"
          aria-label="Banner principal"
          style={{ ["--hero-desktop-stretch-x" as string]: `${heroBannerAjuste.stretchX / 100}` }}
        >
          <div className="hero-section__visual">
            <div className="hero-section__img-scale-x">
              <img
                key={`hero-banner-${heroBannerVisualTick}`}
                src={heroBannerSrc}
                alt="Conecta con tu esencia - Magia y Bienestar para tu Alma"
                className="hero-section__img"
                style={{
                  transformOrigin: "center center",
                  transform: `scale(${heroBannerAjuste.zoom / 100})`
                }}
              />
            </div>
            <HeroParticles />
            <div className="hero-section__brand-stack">
              {heroLogoCfg.mostrarHeroLogo ? (
                <MaikaLogoImg
                  preferredSrc={(heroLogoCfg.heroLogoUrl || "").trim() || undefined}
                  alt="Logo MAIKA"
                  className="hero-section__mandala"
                  style={{
                    position: "relative",
                    width: `${heroLogoCfg.heroLogoTamano}px`,
                    maxWidth: "min(92vw, 100%)",
                    height: "auto",
                    objectFit: "contain",
                    pointerEvents: "none",
                    zIndex: 9,
                    display: "block",
                    flexShrink: 0
                  }}
                />
              ) : null}
              <button
                type="button"
                className="hero-section__btn-explorar"
                onClick={(e) => {
                  e.stopPropagation();
                  entrarTiendaDesdeHero();
                }}
                aria-label="Explorar tienda"
              >
                Explorar tienda
              </button>
            </div>
          </div>
        </section>
        {portalTiendaActivo ? <div className="portal-tienda-overlay" aria-hidden="true" /> : null}
      </>
    )} />

    {/* MI CUENTA */}
    <Route path="/cuenta" element={(
      <Suspense fallback={<div style={{ opacity: 0.6, textAlign: "center", padding: 24, color: THEME.goldMain }}>Cargando MAIKA...</div>}>
        {bloqueLayoutContenido(
          <CuentaPage
        formAuth={formAuth}
        setFormAuth={setFormAuth}
        modoRegistro={modoRegistro}
        setModoRegistro={setModoRegistro}
        usuario={usuario}
        setUsuario={setUsuario}
        iniciarSesionConToken={iniciarSesionConToken}
        reenvioDisponibleEn={reenvioDisponibleEn}
        setReenvioDisponibleEn={setReenvioDisponibleEn}
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
      />)}
      </Suspense>
    )} />
    <Route path="/reset-password" element={<Suspense fallback={<div style={{ opacity: 0.6, textAlign: "center", padding: 24, color: THEME.goldMain }}>Cargando MAIKA...</div>}>{bloqueLayoutContenido(<ResetPasswordPage />)}</Suspense>} />

    {/* TIENDA */}
    <Route path="/tienda/*" element={(
      <Suspense fallback={<div style={{ opacity: 0.6, textAlign: "center", padding: 24, color: THEME.goldMain }}>Cargando MAIKA...</div>}>
        {bloqueLayoutTienda(
          <div
            className={(location.state as { maikaEntradaTienda?: string } | null)?.maikaEntradaTienda === "hero-cta" ? "tienda-entrada-hero" : undefined}
            style={{ width: "100%" }}
          >
            <TiendaView />
          </div>
        )}
      </Suspense>
    )} />

    <Route path="/servicios" element={bloqueLayoutContenido(<ServiciosPage />)} />
    <Route path="/suenos" element={bloqueLayoutSuenos(<ExperienciaAuthGuard tipo="sueno"><Suspense fallback={<div style={{ opacity: 0.6, textAlign: "center", padding: 24, color: THEME.goldMain }}>Cargando MAIKA...</div>}><Sueno /></Suspense></ExperienciaAuthGuard>)} />
    <Route path="/sueno-premium" element={bloqueLayoutContenido(<ExperienciaAuthGuard tipo="sueno"><Suspense fallback={<div style={{ opacity: 0.6, textAlign: "center", padding: 24, color: THEME.goldMain }}>Cargando MAIKA...</div>}><SuenoPremiumPage /></Suspense></ExperienciaAuthGuard>)} />
    <Route path="/horoscopos" element={bloqueLayoutContenido(<ExperienciaAuthGuard tipo="horoscopo"><Suspense fallback={<div style={{ opacity: 0.6, textAlign: "center", padding: 24, color: THEME.goldMain }}>Cargando MAIKA...</div>}><HoroscoposPage /></Suspense></ExperienciaAuthGuard>)} />
    <Route path="/ritual-del-mes" element={bloqueLayoutContenido(<RitualDelMesPage />)} />
    <Route path="/testimonios" element={bloqueLayoutContenido(<TestimoniosPage />)} />
    <Route path="/lectura" element={bloqueLayoutLectura(<ExperienciaAuthGuard tipo="horoscopo"><Suspense fallback={<div style={{ opacity: 0.6, textAlign: "center", padding: 24, color: THEME.goldMain }}>Cargando MAIKA...</div>}><LecturaPage /></Suspense></ExperienciaAuthGuard>)} />
    <Route path="/envios" element={bloqueLayoutContenido(<EnviosPage />)} />
    <Route path="/contacto" element={bloqueLayoutContenido(<ContactoPage />)} />
    <Route path="/sobre-maika" element={bloqueLayoutContenido(<SobreMaikaPage />)} />

    <Route path="/legal" element={bloqueLayoutContenido(<LegalIndexPage />)} />
    <Route path="/legal/:slug" element={bloqueLayoutContenido(<LegalDocumentPage />)} />

    <Route
      path="/admin/editar-categorias"
      element={(
        <AdminRouteGuard>
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
            mostrarNotificacion={sinNotificacionAdmin}
            velas={velas}
            inciensos={inciensos}
            figuras={figuras}
            kits={kits}
            joyas={joyas}
            subcategoriasCatalogo={subcategoriasCatalogo}
            subcategoriasDe={subcategoriasDe}
            agregarSubcategoria={agregarSubcategoria}
            renombrarSubcategoria={renombrarSubcategoria}
            eliminarSubcategoria={eliminarSubcategoria}
          />
        </Suspense>
        </AdminRouteGuard>
      )}
    />
    <Route
      path="/admin/nueva-categoria"
      element={(
        <AdminRouteGuard>
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
            mostrarNotificacion={sinNotificacionAdmin}
          />
        </Suspense>
        </AdminRouteGuard>
      )}
    />
    <Route
      path="/admin/editar-productos"
      element={(
        <AdminRouteGuard>
        <Suspense fallback={fallbackAdmin}>
          <EditarProductosPage
            setPagina={setPagina}
            velas={velas}
            setVelas={setVelas}
            inciensos={inciensos}
            setInciensos={setInciensos}
            figuras={figuras}
            setFiguras={setFiguras}
            kits={kits}
            setKits={setKits}
            joyas={joyas}
            setJoyas={setJoyas}
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
            mostrarNotificacion={sinNotificacionAdmin}
            subcategoriasDe={subcategoriasDe}
          />
        </Suspense>
        </AdminRouteGuard>
      )}
    />
    <Route
      path="/admin/inventario"
      element={(
        <AdminRouteGuard>
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
            joyas={joyas}
            setJoyas={setJoyas}
            umbralStockBajo={umbralStockBajo}
            mostrarNotificacion={sinNotificacionAdmin}
          />
        </Suspense>
        </AdminRouteGuard>
      )}
    />
    <Route
      path="/admin/nuevo-producto"
      element={(
        <AdminRouteGuard>
        <Suspense fallback={fallbackAdmin}>
          <NuevoProductoPage
            setPagina={setPagina}
            velas={velas}
            setVelas={setVelas}
            inciensos={inciensos}
            setInciensos={setInciensos}
            figuras={figuras}
            setFiguras={setFiguras}
            setKits={setKits}
            setJoyas={setJoyas}
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
            mostrarNotificacion={sinNotificacionAdmin}
            subcategoriasDe={subcategoriasDe}
          />
        </Suspense>
        </AdminRouteGuard>
      )}
    />

    {/*
      Rutas /admin: las MÁS ESPECÍFICAS primero. Si existiera `/admin/*`, atraparía todo y `/admin/diseno-web/*` no llegaría.
      Aquí `/admin` es ruta exacta (sin *), no sombrea `/admin/diseno-web/...`; igual dejamos diseño web antes del índice admin.
      `espaciado` va explícito antes del `*` por compatibilidad con el `path="*"` global que redirige a `/`.
    */}
    <Route path="/admin/diseno-web/imagen-hero" element={<Navigate to="/admin/diseno-web/imagen" replace />} />
    <Route path="/admin/diseno-web/boton" element={adminMainRouteElement} />
    <Route path="/admin/diseno-web/espaciado" element={adminMainRouteElement} />
    <Route path="/admin/diseno-web/*" element={adminMainRouteElement} />
    <Route path="/admin" element={adminMainRouteElement} />
    <Route
      path="/admin/configuracion-metricas"
      element={(
        <AdminRouteGuard>
          <Suspense fallback={fallbackAdmin}>
            <ConfigMetricasPage
            setPagina={setPagina}
            umbralStockBajo={umbralStockBajo}
            setUmbralStockBajo={setUmbralStockBajo}
            umbralKey={UMBRAL_STOCK_BAJO_KEY}
            mostrarNotificacion={sinNotificacionAdmin}
            notaPedidoEnvio={notaPedidoEnvio}
            setNotaPedidoEnvio={setNotaPedidoEnvio}
            notaKey={NOTA_PEDIDO_ENVIO_KEY}
            notaDefault={NOTA_PEDIDO_ENVIO_DEFAULT}
          />
          </Suspense>
        </AdminRouteGuard>
      )}
    />
    {/* ADMIN: CUPONES */}
    <Route
      path="/admin/editar-cupones"
      element={
        <AdminRouteGuard>
        <Suspense fallback={fallbackAdmin}>
          <EditarCuponesAdminPanel
          cuponesAdmin={cuponesAdmin}
          setCuponesAdmin={setCuponesAdmin}
          setPagina={setPagina}
          mostrarNotificacion={sinNotificacionAdmin}
        />
        </Suspense>
        </AdminRouteGuard>
      }
    />

    {/* DETALLE CLIENTE (solo lectura) */}
    <Route
      path="/admin/detalle-cliente"
      element={(
        <AdminRouteGuard>
        <Suspense fallback={fallbackAdmin}>
          <DetalleClientePage
            mostrarNotificacion={sinNotificacionAdmin}
            abrirEditorUsuario={abrirEditorUsuario}
          />
        </Suspense>
        </AdminRouteGuard>
      )}
    />

    {/* CARRITO */}
    <Route path="/carrito" element={(
      <Suspense fallback={<div style={{ opacity: 0.6, textAlign: "center", padding: 24, color: THEME.goldMain }}>Cargando MAIKA...</div>}>
        {bloqueLayoutContenido(<CarritoPage />)}
      </Suspense>
    )} />

    {/* SEGUIMIENTO DE PEDIDOS */}
    <Route path="/seguimiento" element={<Suspense fallback={<div style={{ opacity: 0.6, textAlign: "center", padding: 24, color: THEME.goldMain }}>Cargando MAIKA...</div>}>{bloqueLayoutContenido(<SeguimientoPage />)}</Suspense>} />

    {/* CONTABILIDAD (admin real + compat legacy) */}
    <Route
      path="/admin/contabilidad"
      element={accesoAdmin ? <Suspense fallback={fallbackAdmin}>{bloqueLayoutContenido(<ContabilidadPage />)}</Suspense> : <Navigate to="/" replace />}
    />
    <Route path="/contabilidad" element={<Navigate to="/admin/contabilidad" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
