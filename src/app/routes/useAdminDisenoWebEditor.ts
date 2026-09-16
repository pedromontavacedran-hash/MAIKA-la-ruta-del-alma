import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ADMIN_DISENO_WEB_PREFIX, primerSegmentoDisenoWeb } from "./diseno-web/disenoWebPaths";
import {
  ALTURA_BARRA_TOP_MAX,
  ALTURA_BARRA_TOP_MIN,
  BARRA_TOP_ADMIN_PREVIEW_EVENT,
  BARRA_TOP_PEDIDO_EXITO_CFG_DEFAULT,
  ICONOS_BARRA_ESCALA_MAX,
  ICONOS_BARRA_ESCALA_MIN,
  LOGO_POS_X_DEFAULT,
  LOGO_POS_X_REL_MAX,
  LOGO_POS_X_REL_MIN,
  type BarraTopPedidoExitoCfg,
  guardarBarraTopPedidoExitoCfg,
  leerBarraTopPedidoExitoCfg
} from "../../utils/barraTopPedidoExito/barraTopPedidoExitoCfg";
import {
  guardarHeroLogoConfig,
  HERO_LOGO_CONFIG_KEY,
  HERO_LOGO_UPDATED_EVENT,
  leerHeroLogoConfig,
  normalizarHeroLogoConfig,
  type HeroLogoConfig
} from "../../utils/heroLogoConfig";
import {
  FONDO_ESTRELLAS_COLOR_DEFAULT,
  FONDO_ESTRELLAS_MOVIMIENTO_DEFAULT,
  guardarFondoPantallaConfig,
  leerFondoAppCapaPreset,
  leerFondoEstrellasColor,
  leerFondoEstrellasDensidad,
  leerFondoEstrellasMovimiento,
  leerFondoPantallaConfig,
  leerFondoPantallaOscuridad,
  leerFondoPantallaTono,
  type FondoAppCapaPresetId
} from "../../utils/fondoPantallaConfig";
import {
  guardarHeroBannerSrc,
  guardarHeroBannerAjuste,
  aplicarHeroCtaOffsetCss,
  HERO_BANNER_AJUSTE_DEFAULT,
  HERO_BANNER_DEFAULT_SRC,
  leerHeroBannerAjuste,
  leerHeroBannerSrc
} from "../../utils/heroBannerConfig";
import {
  aplicarCheckoutVisualPresetPayload,
  asegurarCheckoutVisualRestoreBaselineDesdeLocalStorageSiPrimeraVez,
  borrarCheckoutVisualRestoreBaseline,
  buildCheckoutVisualDefaultsPayload,
  buildCheckoutVisualPayloadFromPanelState,
  cargarCheckoutVisualPresetPorNombre,
  eliminarCheckoutVisualPresetPorNombre,
  guardarCheckoutVisualPreset,
  guardarCheckoutVisualRestoreBaseline,
  leerCheckoutVisualRestoreBaseline,
  listarCheckoutVisualPresets,
  type CheckoutVisualPreset,
  type CheckoutVisualPresetPayload
} from "../../utils/checkoutVisualPresets";
import {
  dimensionesIframeHeroPreviewMiniDesdeVentanaAdmin,
  guardarHeroIframePreviewSessionP,
  limpiarHeroIframePreviewSession
} from "../../utils/heroWebPreviewEmbed";
import { comprimirDataUrlHeroSiHaceFalta } from "../../utils/heroImageCompress";
import { mountAdminRangeWheelScrollPassthrough } from "../../utils/adminRangeWheelScrollPassthrough";
import { getMaikaScrollPortEl } from "../../utils/maikaScrollPort";
import { THEME } from "../../config";
import { quitarFondoSolidoLogoBarra } from "./diseno-web/logoFondoHelpers";

/** Sub-bloques de «Hero diseño web completa» (pestañas + presets). */
export type AdminSeccionCheckoutHero = "barra" | "fondo" | "hero" | "heroLogo";
export type AdminHeroDisenoWebTab = "ajustes" | AdminSeccionCheckoutHero | "espaciado" | "boton";

export type HeroBannerUndoSnapshot = { src: string; zoom: number; stretchX: number; nombreArchivo: string };

export type UseAdminDisenoWebEditorParams = {
  esAdmin: boolean;
  accesoAdmin: boolean;
  mostrarNotificacion: (m: string, t: "normal" | "exito" | "error") => void;
};

/**
 * Todo el estado y los manejadores del editor «Hero diseño web»: barra superior, fondo de pantalla,
 * hero banner, logo del hero y presets visuales de checkout. Extraído de `AdminMainRoute` (antes ~970
 * líneas dentro del componente) sin cambiar comportamiento — mismos hooks, mismo orden, mismas claves.
 */
export function useAdminDisenoWebEditor({ esAdmin, accesoAdmin, mostrarNotificacion }: UseAdminDisenoWebEditorParams) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;

  const segmentoDisenoWebUrl = primerSegmentoDisenoWeb(pathname);
  /** Índice `/admin/diseno-web` o `?vista=diseno-web` en `/admin` (pestañas visibles). */
  const esVistaDisenoWebCompleta =
    pathname === ADMIN_DISENO_WEB_PREFIX ||
    pathname === `${ADMIN_DISENO_WEB_PREFIX}/` ||
    (pathname === "/admin" && searchParams.get("vista") === "diseno-web");
  /** Subruta bajo el mismo prefijo (barra, fondo, imagen, logo): cabecera «pantalla aparte». */
  const esApartadoDisenoWebHero =
    pathname.startsWith(ADMIN_DISENO_WEB_PREFIX) && segmentoDisenoWebUrl.length > 0;
  /** Bloque hero diseño web (índice, apartado o vista embebida en panel). */
  const mostrarBloqueHeroDisenoWeb = esVistaDisenoWebCompleta || esApartadoDisenoWebHero;
  const [adminAccesoBloqueadoRateLimit, setAdminAccesoBloqueadoRateLimit] = useState(false);
  const [adminAccesoMensajeError, setAdminAccesoMensajeError] = useState("");

  const [barraTopPedidoExitoCfg, setBarraTopPedidoExitoCfg] = useState<BarraTopPedidoExitoCfg>(BARRA_TOP_PEDIDO_EXITO_CFG_DEFAULT);
  const [colorFondoBarraTemporal, setColorFondoBarraTemporal] = useState(BARRA_TOP_PEDIDO_EXITO_CFG_DEFAULT.fondoBarraSuperior);
  const [colorIconosBarraTemporal, setColorIconosBarraTemporal] = useState(BARRA_TOP_PEDIDO_EXITO_CFG_DEFAULT.colorIconosBarraSuperior);
  const [alturaBarraTemporal, setAlturaBarraTemporal] = useState(BARRA_TOP_PEDIDO_EXITO_CFG_DEFAULT.alturaBarraSuperior);
  const [iconosEscalaTemporal, setIconosEscalaTemporal] = useState(BARRA_TOP_PEDIDO_EXITO_CFG_DEFAULT.iconosEscalaPct);
  const [logoUrlDataPendienteBarra, setLogoUrlDataPendienteBarra] = useState<string | null>(null);
  const [logoBarraNombreArchivoPendiente, setLogoBarraNombreArchivoPendiente] = useState("");
  const [pestanaHeroDisenoWeb, setPestanaHeroDisenoWeb] = useState<AdminHeroDisenoWebTab>("ajustes");
  const checkoutAccordionRefs = useRef<Partial<Record<AdminSeccionCheckoutHero, HTMLDivElement | null>>>({});

  /**
   * Segmento de URL para pintar cada pantalla (`""` = ajustes en `/admin/diseno-web`).
   * En `/admin?vista=diseno-web` no hay segmento en la URL: se usa la pestaña local.
   */
  const segmentoDisenoWebPantalla: "" | "barra" | "fondo" | "imagen" | "logo" | "espaciado" | "boton" = (() => {
    if (pathname.startsWith(ADMIN_DISENO_WEB_PREFIX)) {
      const s = segmentoDisenoWebUrl;
      if (s === "barra" || s === "fondo" || s === "imagen" || s === "logo" || s === "espaciado" || s === "boton") return s;
      return "";
    }
    if (pathname === "/admin" && searchParams.get("vista") === "diseno-web") {
      if (pestanaHeroDisenoWeb === "barra") return "barra";
      if (pestanaHeroDisenoWeb === "fondo") return "fondo";
      if (pestanaHeroDisenoWeb === "hero") return "imagen";
      if (pestanaHeroDisenoWeb === "heroLogo") return "logo";
      if (pestanaHeroDisenoWeb === "boton") return "boton";
      if (pestanaHeroDisenoWeb === "espaciado") return "espaciado";
      return "";
    }
    return "";
  })();

  const heroDisenoWebSesionPreviewActiva =
    segmentoDisenoWebPantalla === "imagen" || segmentoDisenoWebPantalla === "boton";

  /** Índice y subrutas conocidas de diseño web: mismo contenedor y sin resto del panel admin. */
  const pantallaLimpiaDisenoWebApartado =
    pathname.startsWith(ADMIN_DISENO_WEB_PREFIX) &&
    (segmentoDisenoWebUrl === "" ||
      segmentoDisenoWebUrl === "barra" ||
      segmentoDisenoWebUrl === "fondo" ||
      segmentoDisenoWebUrl === "imagen" ||
      segmentoDisenoWebUrl === "logo" ||
      segmentoDisenoWebUrl === "boton" ||
      segmentoDisenoWebUrl === "espaciado");

  const tabDisenoWebEfectiva: AdminHeroDisenoWebTab =
    segmentoDisenoWebPantalla === ""
      ? "ajustes"
      : segmentoDisenoWebPantalla === "barra"
        ? "barra"
        : segmentoDisenoWebPantalla === "fondo"
          ? "fondo"
          : segmentoDisenoWebPantalla === "imagen"
            ? "hero"
            : segmentoDisenoWebPantalla === "logo"
              ? "heroLogo"
              : segmentoDisenoWebPantalla === "boton"
                ? "boton"
                : segmentoDisenoWebPantalla === "espaciado"
                  ? "espaciado"
                  : "ajustes";

  const tituloApartadoDisenoWebHero =
    segmentoDisenoWebUrl === "logo"
      ? "Logo hero — pantalla aparte"
      : segmentoDisenoWebUrl === "barra"
        ? "Barra superior — pantalla aparte"
        : segmentoDisenoWebUrl === "fondo"
          ? "Fondo — pantalla aparte"
          : segmentoDisenoWebUrl === "imagen"
            ? "Imagen hero — pantalla aparte"
            : segmentoDisenoWebUrl === "boton"
              ? "Botón (CTA) — pantalla aparte"
              : segmentoDisenoWebUrl === "espaciado"
                ? "Espaciado — pantalla aparte"
                : "Hero diseño web — apartado";

  /** Pestaña «Barra / Fondo / …» o null si estás en «Ajustes» o espaciado (sin bloque accordion). */
  const seccionCheckoutHeroUiActiva: AdminSeccionCheckoutHero | null =
    tabDisenoWebEfectiva === "barra" ||
    tabDisenoWebEfectiva === "fondo" ||
    tabDisenoWebEfectiva === "hero" ||
    tabDisenoWebEfectiva === "heroLogo"
      ? tabDisenoWebEfectiva
      : null;

  /** Quitar `panel` heredado de versiones anteriores (ya no se usa). */
  useLayoutEffect(() => {
    if (!esVistaDisenoWebCompleta) return;
    if (!searchParams.get("panel")) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("panel");
        return next;
      },
      { replace: true }
    );
  }, [esVistaDisenoWebCompleta, searchParams, setSearchParams]);

  useEffect(() => {
    if (seccionCheckoutHeroUiActiva == null) return;
    const el = checkoutAccordionRefs.current[seccionCheckoutHeroUiActiva];
    if (!el) return;
    const t = window.setTimeout(() => {
      const port = getMaikaScrollPortEl();
      if (port) {
        const elRect = el.getBoundingClientRect();
        const portRect = port.getBoundingClientRect();
        const nextTop = elRect.top - portRect.top + port.scrollTop - 12;
        port.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
        return;
      }
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [seccionCheckoutHeroUiActiva]);

  useEffect(() => {
    if (!mostrarBloqueHeroDisenoWeb) return;
    const port = getMaikaScrollPortEl();
    if (port) port.scrollTop = 0;
  }, [mostrarBloqueHeroDisenoWeb]);

  const checkoutFocusActivo = seccionCheckoutHeroUiActiva != null;

  const estiloWrapFocusCheckout = useMemo((): CSSProperties => {
    const base: CSSProperties = {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      width: "100%",
      maxWidth: "100%",
      boxSizing: "border-box",
      isolation: "isolate",
      transition: "background 0.32s ease, padding 0.32s ease, margin 0.32s ease, border-radius 0.32s ease, box-shadow 0.32s ease"
    };
    if (!checkoutFocusActivo || pantallaLimpiaDisenoWebApartado) return base;
    return {
      ...base,
      gap: 14,
      padding: "24px 18px 30px",
      margin: "6px -8px 0",
      borderRadius: 20,
      background: "linear-gradient(180deg, rgba(4,3,10,0.58) 0%, rgba(10,8,20,0.82) 42%, rgba(6,5,14,0.7) 100%)",
      boxShadow: "inset 0 0 0 1px rgba(201,162,74,0.14), 0 0 72px rgba(0,0,0,0.42)"
    };
  }, [checkoutFocusActivo, pantallaLimpiaDisenoWebApartado]);

  const [fondoPantallaNombreArchivo, setFondoPantallaNombreArchivo] = useState("");
  const [fondoPantallaPreviewUrl, setFondoPantallaPreviewUrl] = useState("");
  const [fondoPantallaOscuridad, setFondoPantallaOscuridad] = useState(45);
  const [fondoPantallaTono, setFondoPantallaTono] = useState("#0b0b0d");
  const [fondoEstrellasDensidad, setFondoEstrellasDensidad] = useState(100);
  const [fondoEstrellasColor, setFondoEstrellasColor] = useState(FONDO_ESTRELLAS_COLOR_DEFAULT);
  const [fondoEstrellasMovimiento, setFondoEstrellasMovimiento] = useState(FONDO_ESTRELLAS_MOVIMIENTO_DEFAULT);
  const [fondoAppCapaPreset, setFondoAppCapaPreset] = useState<FondoAppCapaPresetId>(() => leerFondoAppCapaPreset());
  const [heroBannerSrc, setHeroBannerSrc] = useState(HERO_BANNER_DEFAULT_SRC);
  const [heroBannerNombreArchivo, setHeroBannerNombreArchivo] = useState("");
  const [heroBannerZoom, setHeroBannerZoom] = useState(HERO_BANNER_AJUSTE_DEFAULT.zoom);
  const [heroBannerStretchX, setHeroBannerStretchX] = useState(HERO_BANNER_AJUSTE_DEFAULT.stretchX);
  const [heroBannerCtaOffset, setHeroBannerCtaOffset] = useState(HERO_BANNER_AJUSTE_DEFAULT.ctaOffset);
  const [checkoutVisualPresetNombre, setCheckoutVisualPresetNombre] = useState("");
  const [checkoutVisualPresetsLista, setCheckoutVisualPresetsLista] = useState<CheckoutVisualPreset[]>([]);
  const [checkoutVisualBaselineTick, setCheckoutVisualBaselineTick] = useState(0);
  const [hayBaselineRestaurarTodo, setHayBaselineRestaurarTodo] = useState(false);
  useEffect(() => {
    void listarCheckoutVisualPresets().then(setCheckoutVisualPresetsLista);
  }, []);
  useEffect(() => {
    void leerCheckoutVisualRestoreBaseline().then((b) => setHayBaselineRestaurarTodo(b !== null));
  }, [checkoutVisualBaselineTick]);
  /** En /admin no se muestran toasts de éxito; este texto confirma «Fijar predeterminado» y «Quitar». */
  const [mensajePredeterminadoRestaurar, setMensajePredeterminadoRestaurar] = useState<string | null>(null);
  const predeterminadoRestaurarFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mostrarFeedbackPredeterminadoRestaurar = useCallback((texto: string) => {
    if (predeterminadoRestaurarFeedbackTimerRef.current != null) {
      window.clearTimeout(predeterminadoRestaurarFeedbackTimerRef.current);
    }
    setMensajePredeterminadoRestaurar(texto);
    predeterminadoRestaurarFeedbackTimerRef.current = window.setTimeout(() => {
      setMensajePredeterminadoRestaurar(null);
      predeterminadoRestaurarFeedbackTimerRef.current = null;
    }, 8000);
  }, []);
  useEffect(() => {
    return () => {
      if (predeterminadoRestaurarFeedbackTimerRef.current != null) {
        window.clearTimeout(predeterminadoRestaurarFeedbackTimerRef.current);
      }
    };
  }, []);
  const [, setHeroMiniPreviewSesionPanelOk] = useState(false);
  const [heroMiniPreviewIframeKey, setHeroMiniPreviewIframeKey] = useState(0);
  const [heroMiniPreviewDims, setHeroMiniPreviewDims] = useState(dimensionesIframeHeroPreviewMiniDesdeVentanaAdmin);
  const [, setHeroMiniIframeScale] = useState(() => {
    const d = dimensionesIframeHeroPreviewMiniDesdeVentanaAdmin();
    return Math.min(1, 560 / d.w);
  });
  const heroMiniPreviewWrapRef = useRef<HTMLDivElement | null>(null);
  const [heroPreviewAbierta, setHeroPreviewAbierta] = useState(false);
  const [heroPreviewSesionPanelOk, setHeroPreviewSesionPanelOk] = useState(false);
  const [heroPreviewIframeKey, setHeroPreviewIframeKey] = useState(0);
  const [fondoEstrellasPreviewAbierta, setFondoEstrellasPreviewAbierta] = useState(false);
  const [fondoEstrellasPreviewIframeKey, setFondoEstrellasPreviewIframeKey] = useState(0);
  const inputFondoPantallaRef = useRef<HTMLInputElement | null>(null);
  const inputHeroBannerRef = useRef<HTMLInputElement | null>(null);
  /** Copia del hero actual para apilar antes de sustituir la imagen (deshacer). */
  const HERO_BANNER_UNDO_MAX = 5;
  const heroBannerActRef = useRef<HeroBannerUndoSnapshot>({
    src: HERO_BANNER_DEFAULT_SRC,
    zoom: HERO_BANNER_AJUSTE_DEFAULT.zoom,
    stretchX: HERO_BANNER_AJUSTE_DEFAULT.stretchX,
    nombreArchivo: ""
  });
  const heroBannerUndoPilaRef = useRef<HeroBannerUndoSnapshot[]>([]);
  const [heroBannerPuedeDeshacer, setHeroBannerPuedeDeshacer] = useState(false);
  const inputHeroLogoRef = useRef<HTMLInputElement | null>(null);
  const inputLogoBarraRef = useRef<HTMLInputElement | null>(null);
  const [heroLogoEdicion, setHeroLogoEdicion] = useState<HeroLogoConfig>(() => leerHeroLogoConfig());
  const [heroLogoNombreArchivo, setHeroLogoNombreArchivo] = useState("");
  useEffect(() => {
    setBarraTopPedidoExitoCfg(leerBarraTopPedidoExitoCfg());
  }, []);
  useEffect(() => {
    setColorFondoBarraTemporal(barraTopPedidoExitoCfg.fondoBarraSuperior);
  }, [barraTopPedidoExitoCfg.fondoBarraSuperior]);
  useEffect(() => {
    setColorIconosBarraTemporal(barraTopPedidoExitoCfg.colorIconosBarraSuperior);
  }, [barraTopPedidoExitoCfg.colorIconosBarraSuperior]);
  useEffect(() => {
    setAlturaBarraTemporal(barraTopPedidoExitoCfg.alturaBarraSuperior);
  }, [barraTopPedidoExitoCfg.alturaBarraSuperior]);
  useEffect(() => {
    setIconosEscalaTemporal(barraTopPedidoExitoCfg.iconosEscalaPct);
  }, [barraTopPedidoExitoCfg.iconosEscalaPct]);
  useEffect(() => {
    if (seccionCheckoutHeroUiActiva !== "barra") {
      setLogoUrlDataPendienteBarra(null);
      setLogoBarraNombreArchivoPendiente("");
    }
  }, [seccionCheckoutHeroUiActiva]);
  useEffect(() => {
    if (seccionCheckoutHeroUiActiva !== "heroLogo") return;
    setHeroLogoEdicion(leerHeroLogoConfig());
    setHeroLogoNombreArchivo("");
    if (inputHeroLogoRef.current) inputHeroLogoRef.current.value = "";
  }, [seccionCheckoutHeroUiActiva]);

  useEffect(() => {
    if (!pathname.startsWith(ADMIN_DISENO_WEB_PREFIX)) return;
    const seg = segmentoDisenoWebUrl;
    if (!seg) setPestanaHeroDisenoWeb("ajustes");
    else if (seg === "logo") setPestanaHeroDisenoWeb("heroLogo");
    else if (seg === "barra") setPestanaHeroDisenoWeb("barra");
    else if (seg === "fondo") setPestanaHeroDisenoWeb("fondo");
    else if (seg === "imagen") setPestanaHeroDisenoWeb("hero");
    else if (seg === "boton") setPestanaHeroDisenoWeb("boton");
    else if (seg === "espaciado") setPestanaHeroDisenoWeb("espaciado");
  }, [pathname, segmentoDisenoWebUrl]);

  useEffect(() => {
    setFondoPantallaPreviewUrl(leerFondoPantallaConfig());
    setFondoPantallaOscuridad(leerFondoPantallaOscuridad());
    setFondoPantallaTono(leerFondoPantallaTono());
    setFondoEstrellasDensidad(leerFondoEstrellasDensidad());
    setFondoEstrellasColor(leerFondoEstrellasColor());
    setFondoEstrellasMovimiento(leerFondoEstrellasMovimiento());
    setFondoAppCapaPreset(leerFondoAppCapaPreset());
    setHeroBannerSrc(leerHeroBannerSrc());
    const ajuste = leerHeroBannerAjuste();
    setHeroBannerZoom(ajuste.zoom);
    setHeroBannerStretchX(ajuste.stretchX);
    setHeroBannerCtaOffset(ajuste.ctaOffset);
  }, []);

  useEffect(() => {
    heroBannerActRef.current = {
      src: heroBannerSrc,
      zoom: heroBannerZoom,
      stretchX: heroBannerStretchX,
      nombreArchivo: heroBannerNombreArchivo
    };
  }, [heroBannerSrc, heroBannerZoom, heroBannerStretchX, heroBannerNombreArchivo]);

  const cerrarHeroPreviewGrande = useCallback(() => {
    limpiarHeroIframePreviewSession();
    setHeroPreviewSesionPanelOk(false);
    setHeroPreviewAbierta(false);
  }, []);

  /** Vista previa real del inicio (iframe + sesión); sustituye ventanas popup que el navegador suele bloquear. */
  const abrirPreviewHeroFullscreen = useCallback(() => {
    const ok = guardarHeroIframePreviewSessionP({
      src: heroBannerSrc,
      zoom: heroBannerZoom,
      stretchX: heroBannerStretchX,
      ctaOffset: heroBannerCtaOffset
    });
    if (!ok) {
      setHeroPreviewSesionPanelOk(false);
      mostrarNotificacion(
        "No se pudo preparar la vista previa (almacenamiento del navegador o imagen demasiado grande). Prueba a recargar o reducir el hero.",
        "error"
      );
      return;
    }
    setHeroPreviewSesionPanelOk(true);
    setHeroPreviewIframeKey((k) => k + 1);
    setHeroPreviewAbierta(true);
  }, [heroBannerSrc, heroBannerZoom, heroBannerStretchX, heroBannerCtaOffset, mostrarNotificacion]);

  const cerrarFondoEstrellasPreviewGrande = useCallback(() => {
    setFondoEstrellasPreviewAbierta(false);
  }, []);

  useEffect(() => {
    if (!heroPreviewAbierta) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrarHeroPreviewGrande();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [heroPreviewAbierta, cerrarHeroPreviewGrande]);

  useEffect(() => {
    if (!fondoEstrellasPreviewAbierta) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrarFondoEstrellasPreviewGrande();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [fondoEstrellasPreviewAbierta, cerrarFondoEstrellasPreviewGrande]);

  useEffect(() => {
    if (!heroDisenoWebSesionPreviewActiva) return;
    const ok = guardarHeroIframePreviewSessionP({
      src: heroBannerSrc,
      zoom: heroBannerZoom,
      stretchX: heroBannerStretchX,
      ctaOffset: heroBannerCtaOffset
    });
    setHeroMiniPreviewSesionPanelOk(ok);
    setHeroMiniPreviewIframeKey((k) => k + 1);
  }, [heroDisenoWebSesionPreviewActiva, heroBannerSrc, heroBannerZoom, heroBannerStretchX, heroBannerCtaOffset]);

  useEffect(() => {
    if (!heroDisenoWebSesionPreviewActiva) return;
    const syncDims = () => setHeroMiniPreviewDims(dimensionesIframeHeroPreviewMiniDesdeVentanaAdmin());
    syncDims();
    window.addEventListener("resize", syncDims);
    return () => window.removeEventListener("resize", syncDims);
  }, [heroDisenoWebSesionPreviewActiva]);

  /** Escritorio: pasa el wheel al scrollport (`getMaikaScrollPortEl`); sin esto la rueda sobre `<input type="range">` solo mueve el slider. */
  useEffect(() => {
    if (!esAdmin || !accesoAdmin) return;
    return mountAdminRangeWheelScrollPassthrough();
  }, [esAdmin, accesoAdmin]);

  /** Primera vez en este navegador: «Restaurar todo» usa una copia de lo ya guardado en el almacenamiento del sitio. */
  useEffect(() => {
    if (!esAdmin || !accesoAdmin) return;
    void asegurarCheckoutVisualRestoreBaselineDesdeLocalStorageSiPrimeraVez().then((ok) => {
      if (ok) setCheckoutVisualBaselineTick((t) => t + 1);
    });
  }, [esAdmin, accesoAdmin]);

  useLayoutEffect(() => {
    if (!heroDisenoWebSesionPreviewActiva) return;
    const el = heroMiniPreviewWrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      setHeroMiniIframeScale(Math.min(1, w / heroMiniPreviewDims.w));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [heroDisenoWebSesionPreviewActiva, heroMiniPreviewIframeKey, heroMiniPreviewDims.w]);

  // Preview en vivo de la barra fija superior mientras el acordeón «barra» está abierto.
  useEffect(() => {
    if (seccionCheckoutHeroUiActiva !== "barra") return;
    const topbar = document.querySelector(".app-topbar.app-topbar--hero-style");
    if (!(topbar instanceof HTMLElement)) return;
    topbar.style.removeProperty("background");
    topbar.style.setProperty("--barra-fondo-usuario", colorFondoBarraTemporal);
    topbar.style.color = colorIconosBarraTemporal;
    topbar.style.setProperty("--barra-iconos-color", colorIconosBarraTemporal);
    const h = Math.max(ALTURA_BARRA_TOP_MIN, Math.min(ALTURA_BARRA_TOP_MAX, Math.round(alturaBarraTemporal)));
    document.documentElement.style.setProperty("--app-topbar-h", `${h}px`);
  }, [seccionCheckoutHeroUiActiva, colorFondoBarraTemporal, colorIconosBarraTemporal, alturaBarraTemporal]);

  /** Vista previa: `NavPrincipal` alinea logo e iconos con la altura temporal (sin guardar). */
  useEffect(() => {
    if (seccionCheckoutHeroUiActiva !== "barra") {
      window.dispatchEvent(new CustomEvent(BARRA_TOP_ADMIN_PREVIEW_EVENT, { detail: null }));
      return;
    }
    const h = Math.max(ALTURA_BARRA_TOP_MIN, Math.min(ALTURA_BARRA_TOP_MAX, Math.round(alturaBarraTemporal)));
    const iconosEscalaPct = Math.max(
      ICONOS_BARRA_ESCALA_MIN,
      Math.min(ICONOS_BARRA_ESCALA_MAX, Math.round(iconosEscalaTemporal))
    );
    window.dispatchEvent(new CustomEvent(BARRA_TOP_ADMIN_PREVIEW_EVENT, { detail: { alturaBarraSuperior: h, iconosEscalaPct } }));
  }, [seccionCheckoutHeroUiActiva, alturaBarraTemporal, iconosEscalaTemporal]);

  // Al salir del acordeón barra, vuelve a pintar la barra según la configuración guardada.
  useEffect(() => {
    if (seccionCheckoutHeroUiActiva === "barra") return;
    const topbar = document.querySelector(".app-topbar.app-topbar--hero-style");
    if (topbar instanceof HTMLElement) {
      topbar.style.removeProperty("background");
      topbar.style.setProperty("--barra-fondo-usuario", barraTopPedidoExitoCfg.fondoBarraSuperior);
      topbar.style.color = barraTopPedidoExitoCfg.colorIconosBarraSuperior;
      topbar.style.setProperty("--barra-iconos-color", barraTopPedidoExitoCfg.colorIconosBarraSuperior);
    }
    const cfg = leerBarraTopPedidoExitoCfg();
    document.documentElement.style.setProperty("--app-topbar-h", `${cfg.alturaBarraSuperior}px`);
  }, [
    seccionCheckoutHeroUiActiva,
    barraTopPedidoExitoCfg.fondoBarraSuperior,
    barraTopPedidoExitoCfg.colorIconosBarraSuperior,
    barraTopPedidoExitoCfg.alturaBarraSuperior
  ]);

  const actualizarBarraTopPedidoExitoCfg = <K extends keyof BarraTopPedidoExitoCfg>(
    key: K,
    value: BarraTopPedidoExitoCfg[K]
  ) => {
    setBarraTopPedidoExitoCfg((prev) => {
      const next = { ...prev, [key]: value };
      return guardarBarraTopPedidoExitoCfg(next);
    });
  };
  const actualizarBarraTopPedidoExitoCfgParcial = (patch: Partial<BarraTopPedidoExitoCfg>) => {
    setBarraTopPedidoExitoCfg((prev) => {
      const next = { ...prev, ...patch };
      return guardarBarraTopPedidoExitoCfg(next);
    });
  };

  const logoPosXAlmacenado = Math.max(
    LOGO_POS_X_REL_MIN,
    Math.min(
      LOGO_POS_X_REL_MAX,
      Math.round(Number(barraTopPedidoExitoCfg.logoPosX ?? LOGO_POS_X_DEFAULT))
    )
  );
  const aplicarLogoPosXDesdeUiPorCien = (uiPct: number) => {
    const p = Math.max(0, Math.min(100, Number(uiPct)));
    const almacen =
      LOGO_POS_X_REL_MAX > 0
        ? Math.max(
            LOGO_POS_X_REL_MIN,
            Math.min(LOGO_POS_X_REL_MAX, Math.round((p / 100) * LOGO_POS_X_REL_MAX))
          )
        : LOGO_POS_X_REL_MIN;
    actualizarBarraTopPedidoExitoCfg("logoPosX", almacen);
  };
  const logoPosXSliderUi =
    LOGO_POS_X_REL_MAX > 0 ? (logoPosXAlmacenado / LOGO_POS_X_REL_MAX) * 100 : 0;
  const estiloFlechaBarraLogo = {
    flex: "0 0 auto",
    width: 30,
    height: 28,
    borderRadius: 6,
    border: `1px solid ${THEME.goldMain}`,
    background: "rgba(201,162,74,0.12)",
    color: THEME.goldMain,
    cursor: "pointer",
    fontSize: 12,
    lineHeight: 1,
    padding: 0
  };

  const limpiarHeroBannerUndo = () => {
    heroBannerUndoPilaRef.current = [];
    setHeroBannerPuedeDeshacer(false);
  };

  const empilarHeroBannerAntesDeNuevaImagen = () => {
    const snap: HeroBannerUndoSnapshot = { ...heroBannerActRef.current };
    const pila = heroBannerUndoPilaRef.current;
    pila.push(snap);
    while (pila.length > HERO_BANNER_UNDO_MAX) pila.shift();
    setHeroBannerPuedeDeshacer(true);
  };

  const deshacerUltimoCambioHeroBanner = () => {
    const pila = heroBannerUndoPilaRef.current;
    const prev = pila.pop();
    if (!prev) {
      setHeroBannerPuedeDeshacer(false);
      return;
    }
    setHeroBannerSrc(prev.src);
    setHeroBannerZoom(prev.zoom);
    setHeroBannerStretchX(prev.stretchX);
    setHeroBannerNombreArchivo(prev.nombreArchivo);
    const guardado = guardarHeroBannerSrc(prev.src);
    guardarHeroBannerAjuste({ zoom: prev.zoom, stretchX: prev.stretchX });
    setHeroBannerPuedeDeshacer(pila.length > 0);
    setHeroMiniPreviewIframeKey((k) => k + 1);
    if (!guardado && prev.src.startsWith("data:")) {
      mostrarNotificacion(
        "Cambio deshecho en pantalla; no se pudo volver a guardar esa imagen en el almacenamiento del navegador (tamaño/cuota). Tras recargar podría no conservarse.",
        "normal"
      );
      return;
    }
    mostrarNotificacion("Se deshizo el último cambio de imagen del hero (y el zoom/estirado de ese momento).", "normal");
  };

  const sincronizarEstadoCheckoutVisualDesdeLocalStorage = useCallback(() => {
    const barra = leerBarraTopPedidoExitoCfg();
    setBarraTopPedidoExitoCfg(barra);
    setColorFondoBarraTemporal(barra.fondoBarraSuperior);
    setColorIconosBarraTemporal(barra.colorIconosBarraSuperior);
    setAlturaBarraTemporal(barra.alturaBarraSuperior);
    setIconosEscalaTemporal(barra.iconosEscalaPct);
    setLogoUrlDataPendienteBarra(null);
    setLogoBarraNombreArchivoPendiente("");
    if (inputLogoBarraRef.current) inputLogoBarraRef.current.value = "";

    const fondoUrl = leerFondoPantallaConfig();
    setFondoPantallaPreviewUrl(fondoUrl);
    setFondoPantallaOscuridad(leerFondoPantallaOscuridad());
    setFondoPantallaTono(leerFondoPantallaTono());
    setFondoEstrellasDensidad(leerFondoEstrellasDensidad());
    setFondoEstrellasColor(leerFondoEstrellasColor());
    setFondoEstrellasMovimiento(leerFondoEstrellasMovimiento());
    setFondoAppCapaPreset(leerFondoAppCapaPreset());
    setFondoPantallaNombreArchivo("");

    const srcHero = leerHeroBannerSrc();
    setHeroBannerSrc(srcHero);
    const ajuste = leerHeroBannerAjuste();
    setHeroBannerZoom(ajuste.zoom);
    setHeroBannerStretchX(ajuste.stretchX);
    setHeroBannerCtaOffset(ajuste.ctaOffset);
    setHeroBannerNombreArchivo(
      srcHero.startsWith("data:")
        ? "Imagen guardada"
        : srcHero !== HERO_BANNER_DEFAULT_SRC
          ? srcHero.split("/").pop() || ""
          : ""
    );

    setHeroLogoEdicion(leerHeroLogoConfig());
    setHeroLogoNombreArchivo("");
    if (inputHeroLogoRef.current) inputHeroLogoRef.current.value = "";

    setHeroMiniPreviewIframeKey((k) => k + 1);
    setFondoEstrellasPreviewIframeKey((k) => k + 1);
    void listarCheckoutVisualPresets().then(setCheckoutVisualPresetsLista);
    limpiarHeroBannerUndo();
  }, []);

  const construirCheckoutVisualPresetPayloadDesdePanel = (): CheckoutVisualPresetPayload =>
    buildCheckoutVisualPayloadFromPanelState({
      barraCfg: barraTopPedidoExitoCfg,
      colorFondoBarra: colorFondoBarraTemporal,
      colorIconosBarra: colorIconosBarraTemporal,
      alturaBarra: alturaBarraTemporal,
      iconosEscalaPct: iconosEscalaTemporal,
      logoUrlDataPendiente: logoUrlDataPendienteBarra,
      fondoPantallaUrl: fondoPantallaPreviewUrl,
      fondoOscuridad: fondoPantallaOscuridad,
      fondoTono: fondoPantallaTono,
      estrellasDensidad: fondoEstrellasDensidad,
      estrellasColor: fondoEstrellasColor,
      estrellasMovimiento: fondoEstrellasMovimiento,
      appCapaPreset: fondoAppCapaPreset,
      heroBannerSrc,
      heroBannerZoom,
      heroBannerStretchX,
      heroBannerCtaOffset,
      heroLogo: heroLogoEdicion
    });

  const guardarCheckoutVisualPresetDesdePanel = () => {
    void (async () => {
      const payload = construirCheckoutVisualPresetPayloadDesdePanel();
      const r = await guardarCheckoutVisualPreset(checkoutVisualPresetNombre, payload);
      if (r.ok === false) {
        mostrarNotificacion(r.error, "error");
        return;
      }
      setCheckoutVisualPresetsLista(r.presets);
      mostrarNotificacion(`Preset «${checkoutVisualPresetNombre.trim()}» guardado (barra, fondo, hero, logo y espaciado)`, "exito");
    })();
  };

  const cargarCheckoutVisualPresetDesdePanel = (nombrePreset: string) => {
    void (async () => {
      const data = await cargarCheckoutVisualPresetPorNombre(nombrePreset);
      if (!data) {
        mostrarNotificacion("Preset no encontrado", "error");
        return;
      }
      aplicarCheckoutVisualPresetPayload(data);
      sincronizarEstadoCheckoutVisualDesdeLocalStorage();
      mostrarNotificacion(`Preset «${nombrePreset.trim()}» aplicado`, "exito");
    })();
  };

  const eliminarCheckoutVisualPresetDesdePanel = (nombrePreset: string) => {
    const n = nombrePreset.trim();
    if (
      !window.confirm(
        `¿Eliminar el preset «${n}»?\n\nSolo se borra esta entrada guardada; no cambia la configuración que ves ahora en la web.`
      )
    ) {
      return;
    }
    void (async () => {
      const r = await eliminarCheckoutVisualPresetPorNombre(nombrePreset);
      if (r.ok === false) {
        mostrarNotificacion(r.error, "error");
        return;
      }
      setCheckoutVisualPresetsLista(r.presets);
      mostrarNotificacion(`Preset «${n}» eliminado`, "exito");
    })();
  };

  const fijarPredeterminadoRestaurarTodoCheckoutVisual = () => {
    void (async () => {
      const payload = construirCheckoutVisualPresetPayloadDesdePanel();
      const r = await guardarCheckoutVisualRestoreBaseline(payload);
      if (r.ok === false) {
        mostrarNotificacion(r.error, "error");
        return;
      }
      setCheckoutVisualBaselineTick((t) => t + 1);
      const hora = new Date().toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      mostrarFeedbackPredeterminadoRestaurar(
        `Guardado a las ${hora}. La copia para «Restaurar todo» se ha actualizado con lo que ves ahora en este panel (no cambia la web al instante; solo define qué se aplicará cuando pulses «Restaurar todo»).`
      );
      mostrarNotificacion(
        "Guardado: «Restaurar todo» volverá a la apariencia que tienes ahora en el panel (incluye barra si la dejas aplicada o pendiente aquí).",
        "exito"
      );
    })();
  };

  const quitarPredeterminadoPersonalizadoRestaurarTodo = () => {
    if (
      !window.confirm(
        "¿Quitar el predeterminado personalizado?\n\n«Restaurar todo» pasará a usar los valores genéricos del código (no cambia la web en este momento)."
      )
    ) {
      return;
    }
    void (async () => {
      await borrarCheckoutVisualRestoreBaseline();
      setCheckoutVisualBaselineTick((t) => t + 1);
      mostrarFeedbackPredeterminadoRestaurar(
        "Hecho. «Restaurar todo» usará otra vez los valores genéricos del código la próxima vez que lo pulses (no cambia lo que ves ahora hasta que pulses «Restaurar todo»)."
      );
      mostrarNotificacion("Hecho: «Restaurar todo» usará otra vez los valores por defecto del código.", "exito");
    })();
  };

  const restaurarTodoCheckoutVisualDesdePanel = () => {
    void (async () => {
      const defaults = await buildCheckoutVisualDefaultsPayload();
      aplicarCheckoutVisualPresetPayload(defaults);
      sincronizarEstadoCheckoutVisualDesdeLocalStorage();
      mostrarNotificacion(
        hayBaselineRestaurarTodo
          ? "Aplicado tu predeterminado de «Restaurar todo» (barra, fondo del modal, hero y logo del mensaje)."
          : "Aplicados los valores por defecto del código (barra, fondo del modal, hero y logo del mensaje).",
        "normal"
      );
    })();
  };

  const aplicarZoomHeroBanner = (zoom: number) => {
    setHeroBannerZoom(zoom);
    guardarHeroBannerAjuste({ zoom, stretchX: heroBannerStretchX });
  };
  const aplicarStretchXHeroBanner = (stretchX: number) => {
    setHeroBannerStretchX(stretchX);
    guardarHeroBannerAjuste({ zoom: heroBannerZoom, stretchX });
  };
  const aplicarCtaOffsetHeroBanner = (ctaOffset: number) => {
    setHeroBannerCtaOffset(ctaOffset);
    /* Misma pestaña: refuerzo inmediato en `html` (además `guardarHeroBannerAjuste` ya aplica). */
    aplicarHeroCtaOffsetCss(ctaOffset);
    guardarHeroBannerAjuste({ ctaOffset });
  };

  const subirHeroBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      mostrarNotificacion("Selecciona una imagen válida para el hero", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      void (async () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : "";
        if (!dataUrl) {
          mostrarNotificacion("No se pudo leer la imagen del hero", "error");
          return;
        }
        const optimizado = await comprimirDataUrlHeroSiHaceFalta(dataUrl, {
          dimensionesReferenciaSrc: heroBannerSrc
        });
        const huboCompresion = optimizado !== dataUrl;
        empilarHeroBannerAntesDeNuevaImagen();
        setHeroBannerSrc(optimizado);
        setHeroBannerNombreArchivo(file.name);
        const guardado = guardarHeroBannerSrc(optimizado);
        if (!guardado) {
          mostrarNotificacion(
            "Imagen aplicada en esta pantalla y en la vista previa. No se ha podido guardar en el almacenamiento del navegador (suele ser por tamaño o cuota): al recargar la página podría volver el hero anterior. Para conservarla, prueba otra foto más pequeña.",
            "normal"
          );
          return;
        }
        mostrarNotificacion(
          huboCompresion
            ? "Hero web guardado y actualizado. La imagen se ha ajustado a las mismas medidas en píxeles que el hero anterior (recorte centrado si el encuadre no coincide) y comprimida para el navegador; el zoom lo sigues controlando con la barra."
            : "Hero web guardado y actualizado. El zoom lo guardas con la barra de abajo.",
          "exito"
        );
      })();
    };
    reader.onerror = () => {
      mostrarNotificacion("No se pudo leer la imagen del hero", "error");
    };
    reader.readAsDataURL(file);
  };

  const subirHeroLogoPendiente = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      mostrarNotificacion("Selecciona una imagen válida para el logo del hero", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      void (async () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : "";
        if (!dataUrl) {
          mostrarNotificacion("No se pudo leer el logo del hero", "error");
          return;
        }
        const optimizado = await comprimirDataUrlHeroSiHaceFalta(dataUrl);
        setHeroLogoEdicion((prev) => guardarHeroLogoConfig({ ...prev, heroLogoUrl: optimizado }));
        setHeroLogoNombreArchivo(file.name);
      })();
    };
    reader.onerror = () => mostrarNotificacion("No se pudo leer el logo del hero", "error");
    reader.readAsDataURL(file);
  };

  const aplicarHeroLogoDesdePanel = () => {
    const normalized = normalizarHeroLogoConfig(heroLogoEdicion);
    try {
      localStorage.setItem(HERO_LOGO_CONFIG_KEY, JSON.stringify(normalized));
    } catch {
      mostrarNotificacion("No se pudo guardar el logo (cuota del navegador o modo privado).", "error");
      return;
    }
    setHeroLogoEdicion(normalized);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(HERO_LOGO_UPDATED_EVENT, { detail: normalized }));
    }
    mostrarNotificacion("Logo del hero guardado", "exito");
  };

  /** Persiste en LS y dispara evento para vista previa en inicio sin pulsar «Aplicar cambios». */
  const persistirHeroLogoEnVivo = (patch: Partial<HeroLogoConfig>) => {
    setHeroLogoEdicion((prev) => guardarHeroLogoConfig({ ...prev, ...patch }));
  };

  const subirFondoPantalla = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      mostrarNotificacion("Selecciona una imagen válida para el fondo", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) {
        mostrarNotificacion("No se pudo leer la imagen de fondo", "error");
        return;
      }
      guardarFondoPantallaConfig(dataUrl);
      setFondoPantallaNombreArchivo(file.name);
      setFondoPantallaPreviewUrl(dataUrl);
      mostrarNotificacion("Fondo de pantalla actualizado", "exito");
    };
    reader.onerror = () => {
      mostrarNotificacion("No se pudo leer la imagen de fondo", "error");
    };
    reader.readAsDataURL(file);
  };

  const subirLogoBarraPendiente = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      mostrarNotificacion("Selecciona una imagen válida para el logo", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      void (async () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : "";
        if (!dataUrl) {
          mostrarNotificacion("No se pudo leer el logo", "error");
          return;
        }
        const conservaTransparencia = /^data:image\/(png|webp)/i.test(dataUrl);
        const optimizado = conservaTransparencia
          ? await quitarFondoSolidoLogoBarra(dataUrl)
          : await comprimirDataUrlHeroSiHaceFalta(dataUrl);
        setLogoUrlDataPendienteBarra(optimizado);
        setLogoBarraNombreArchivoPendiente(file.name);
        mostrarNotificacion("Logo listo: pulsa «Aplicar cambios» para guardarlo en la barra.", "normal");
      })();
    };
    reader.onerror = () => {
      mostrarNotificacion("No se pudo leer el logo", "error");
    };
    reader.readAsDataURL(file);
  };

  return {
    searchParams,
    setSearchParams,
    navigate,
    location,
    pathname,
    segmentoDisenoWebUrl,
    esVistaDisenoWebCompleta,
    esApartadoDisenoWebHero,
    mostrarBloqueHeroDisenoWeb,
    adminAccesoBloqueadoRateLimit,
    setAdminAccesoBloqueadoRateLimit,
    adminAccesoMensajeError,
    setAdminAccesoMensajeError,
    barraTopPedidoExitoCfg,
    setBarraTopPedidoExitoCfg,
    colorFondoBarraTemporal,
    setColorFondoBarraTemporal,
    colorIconosBarraTemporal,
    setColorIconosBarraTemporal,
    alturaBarraTemporal,
    setAlturaBarraTemporal,
    iconosEscalaTemporal,
    setIconosEscalaTemporal,
    logoUrlDataPendienteBarra,
    setLogoUrlDataPendienteBarra,
    logoBarraNombreArchivoPendiente,
    setLogoBarraNombreArchivoPendiente,
    pestanaHeroDisenoWeb,
    setPestanaHeroDisenoWeb,
    checkoutAccordionRefs,
    segmentoDisenoWebPantalla,
    heroDisenoWebSesionPreviewActiva,
    pantallaLimpiaDisenoWebApartado,
    tabDisenoWebEfectiva,
    tituloApartadoDisenoWebHero,
    seccionCheckoutHeroUiActiva,
    checkoutFocusActivo,
    estiloWrapFocusCheckout,
    fondoPantallaNombreArchivo,
    setFondoPantallaNombreArchivo,
    fondoPantallaPreviewUrl,
    setFondoPantallaPreviewUrl,
    fondoPantallaOscuridad,
    setFondoPantallaOscuridad,
    fondoPantallaTono,
    setFondoPantallaTono,
    fondoEstrellasDensidad,
    setFondoEstrellasDensidad,
    fondoEstrellasColor,
    setFondoEstrellasColor,
    fondoEstrellasMovimiento,
    setFondoEstrellasMovimiento,
    fondoAppCapaPreset,
    setFondoAppCapaPreset,
    heroBannerSrc,
    setHeroBannerSrc,
    heroBannerNombreArchivo,
    setHeroBannerNombreArchivo,
    heroBannerZoom,
    setHeroBannerZoom,
    heroBannerStretchX,
    setHeroBannerStretchX,
    heroBannerCtaOffset,
    setHeroBannerCtaOffset,
    checkoutVisualPresetNombre,
    setCheckoutVisualPresetNombre,
    checkoutVisualPresetsLista,
    setCheckoutVisualPresetsLista,
    checkoutVisualBaselineTick,
    setCheckoutVisualBaselineTick,
    hayBaselineRestaurarTodo,
    setHayBaselineRestaurarTodo,
    mensajePredeterminadoRestaurar,
    setMensajePredeterminadoRestaurar,
    mostrarFeedbackPredeterminadoRestaurar,
    heroMiniPreviewIframeKey,
    setHeroMiniPreviewIframeKey,
    heroMiniPreviewDims,
    setHeroMiniPreviewDims,
    heroMiniPreviewWrapRef,
    heroPreviewAbierta,
    setHeroPreviewAbierta,
    heroPreviewSesionPanelOk,
    setHeroPreviewSesionPanelOk,
    heroPreviewIframeKey,
    setHeroPreviewIframeKey,
    fondoEstrellasPreviewAbierta,
    setFondoEstrellasPreviewAbierta,
    fondoEstrellasPreviewIframeKey,
    setFondoEstrellasPreviewIframeKey,
    inputFondoPantallaRef,
    inputHeroBannerRef,
    HERO_BANNER_UNDO_MAX,
    heroBannerActRef,
    heroBannerUndoPilaRef,
    heroBannerPuedeDeshacer,
    setHeroBannerPuedeDeshacer,
    inputHeroLogoRef,
    inputLogoBarraRef,
    heroLogoEdicion,
    setHeroLogoEdicion,
    heroLogoNombreArchivo,
    setHeroLogoNombreArchivo,
    cerrarHeroPreviewGrande,
    abrirPreviewHeroFullscreen,
    cerrarFondoEstrellasPreviewGrande,
    actualizarBarraTopPedidoExitoCfg,
    actualizarBarraTopPedidoExitoCfgParcial,
    logoPosXAlmacenado,
    aplicarLogoPosXDesdeUiPorCien,
    logoPosXSliderUi,
    estiloFlechaBarraLogo,
    limpiarHeroBannerUndo,
    empilarHeroBannerAntesDeNuevaImagen,
    deshacerUltimoCambioHeroBanner,
    sincronizarEstadoCheckoutVisualDesdeLocalStorage,
    construirCheckoutVisualPresetPayloadDesdePanel,
    guardarCheckoutVisualPresetDesdePanel,
    cargarCheckoutVisualPresetDesdePanel,
    eliminarCheckoutVisualPresetDesdePanel,
    fijarPredeterminadoRestaurarTodoCheckoutVisual,
    quitarPredeterminadoPersonalizadoRestaurarTodo,
    restaurarTodoCheckoutVisualDesdePanel,
    aplicarZoomHeroBanner,
    aplicarStretchXHeroBanner,
    aplicarCtaOffsetHeroBanner,
    subirHeroBanner,
    subirHeroLogoPendiente,
    aplicarHeroLogoDesdePanel,
    persistirHeroLogoEnVivo,
    subirFondoPantalla,
    subirLogoBarraPendiente
  };
}
