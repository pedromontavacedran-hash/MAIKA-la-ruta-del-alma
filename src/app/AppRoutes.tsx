import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction
} from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import ExperienciaAuthGuard from "../components/ExperienciaAuthGuard";
import ServiciosPage from "../pages/ServiciosPage";
import TarotEvolutivoPage from "../pages/TarotEvolutivoPage";
import LimpiezaEnergeticaPage from "../pages/LimpiezaEnergeticaPage";
import RitualPersonalizadoPage from "../pages/RitualPersonalizadoPage";
import RitualDelMesPage from "../pages/RitualDelMesPage";
import TestimoniosPage from "../pages/TestimoniosPage";
import EnviosPage from "../pages/EnviosPage";
import ContactoPage from "../pages/ContactoPage";
import SobreMaikaPage from "../pages/SobreMaikaPage";
import LegalIndexPage from "../pages/LegalIndexPage";
import LegalDocumentPage from "../pages/LegalDocumentPage";
import { type CuponAdminEntrada } from "./routes/EditarCuponesAdminPanel";
import {
  CarritoPage,
  HoroscoposPage,
  LecturaPage,
  SeguimientoPage,
  Sueno,
  SuenoPremiumPage,
  TiendaView
} from "./routing/lazyPages";
import {
  THEME,
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
import { tituloDocumento } from "./routing/routeTitles";
import {
  bloqueLayoutContenido,
  bloqueLayoutContenidoAncho,
  bloqueLayoutLectura,
  bloqueLayoutSuenos,
  bloqueLayoutTienda
} from "./routing/routeLayouts";
import { HomeHeroRoute } from "./routing/HomeHeroRoute";
import { AccountRoutes } from "./routing/AccountRoutes";
import { AdminRoutes } from "./routing/AdminRoutes";
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
  agregarSubcategoria: (categoriaId: string, nombre: string, padreSubcategoriaId?: string) => Promise<SubcategoriaEntrada>;
  renombrarSubcategoria: (id: string, nombre: string, padreSubcategoriaId?: string) => Promise<void>;
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

  /** Rutas `/admin/*`: solo toasts de error; éxito e info no molestan (salvo pantallas dedicadas de diseño web hero). */
  const sinNotificacionAdmin = useCallback(
    (msg: string, tipo: "normal" | "exito" | "error") => {
      if (tipo === "error") {
        p.mostrarNotificacion(msg, "error");
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
        p.mostrarNotificacion(msg, "exito");
      }
    },
    [p.mostrarNotificacion, pathname]
  );

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

  /** Título de la pestaña según la ruta (`routeTitles.ts`); index.html deja el de la portada. */
  useEffect(() => {
    document.title = tituloDocumento(pathname);
  }, [pathname]);

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
      <HomeHeroRoute
        bannerSrc={heroBannerSrc}
        bannerAjuste={heroBannerAjuste}
        visualTick={heroBannerVisualTick}
        logoCfg={heroLogoCfg}
        portalTiendaActivo={portalTiendaActivo}
        onExplorarTienda={entrarTiendaDesdeHero}
      />
    )} />

    {AccountRoutes(p)}

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

    <Route path="/servicios" element={bloqueLayoutContenidoAncho(<ServiciosPage />)} />
    <Route path="/servicios/tarot-evolutivo" element={bloqueLayoutContenidoAncho(<TarotEvolutivoPage />)} />
    <Route path="/servicios/limpieza-energetica" element={bloqueLayoutContenidoAncho(<LimpiezaEnergeticaPage />)} />
    <Route path="/servicios/ritual-personalizado" element={bloqueLayoutContenidoAncho(<RitualPersonalizadoPage />)} />
    <Route path="/suenos" element={bloqueLayoutSuenos(<ExperienciaAuthGuard tipo="sueno"><Suspense fallback={<div style={{ opacity: 0.6, textAlign: "center", padding: 24, color: THEME.goldMain }}>Cargando MAIKA...</div>}><Sueno /></Suspense></ExperienciaAuthGuard>)} />
    <Route path="/sueno-premium" element={bloqueLayoutContenido(<ExperienciaAuthGuard tipo="sueno"><Suspense fallback={<div style={{ opacity: 0.6, textAlign: "center", padding: 24, color: THEME.goldMain }}>Cargando MAIKA...</div>}><SuenoPremiumPage /></Suspense></ExperienciaAuthGuard>)} />
    <Route path="/horoscopos" element={bloqueLayoutContenido(<ExperienciaAuthGuard tipo="horoscopo"><Suspense fallback={<div style={{ opacity: 0.6, textAlign: "center", padding: 24, color: THEME.goldMain }}>Cargando MAIKA...</div>}><HoroscoposPage /></Suspense></ExperienciaAuthGuard>)} />
    <Route path="/ritual-del-mes" element={bloqueLayoutContenidoAncho(<RitualDelMesPage />)} />
    <Route path="/testimonios" element={bloqueLayoutContenido(<TestimoniosPage />)} />
    <Route path="/lectura" element={bloqueLayoutLectura(<ExperienciaAuthGuard tipo="horoscopo"><Suspense fallback={<div style={{ opacity: 0.6, textAlign: "center", padding: 24, color: THEME.goldMain }}>Cargando MAIKA...</div>}><LecturaPage /></Suspense></ExperienciaAuthGuard>)} />
    <Route path="/envios" element={bloqueLayoutContenido(<EnviosPage />)} />
    <Route path="/contacto" element={bloqueLayoutContenido(<ContactoPage />)} />
    <Route path="/sobre-maika" element={bloqueLayoutContenido(<SobreMaikaPage />)} />

    <Route path="/legal" element={bloqueLayoutContenido(<LegalIndexPage />)} />
    <Route path="/legal/:slug" element={bloqueLayoutContenido(<LegalDocumentPage />)} />

    {AdminRoutes({ ...p, mostrarNotificacion: sinNotificacionAdmin })}

    {/* CARRITO */}
    <Route path="/carrito" element={(
      <Suspense fallback={<div style={{ opacity: 0.6, textAlign: "center", padding: 24, color: THEME.goldMain }}>Cargando MAIKA...</div>}>
        {bloqueLayoutContenido(<CarritoPage />)}
      </Suspense>
    )} />

    {/* SEGUIMIENTO DE PEDIDOS */}
    <Route path="/seguimiento" element={<Suspense fallback={<div style={{ opacity: 0.6, textAlign: "center", padding: 24, color: THEME.goldMain }}>Cargando MAIKA...</div>}>{bloqueLayoutContenido(<SeguimientoPage />)}</Suspense>} />

    <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
