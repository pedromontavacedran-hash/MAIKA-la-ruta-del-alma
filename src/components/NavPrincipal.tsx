import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PATH_BY_PAGINA } from "@/app/routing/routeMaps";
import { preloadAdminOnce } from "@/app/routing/preloadOnce";
import { useApp } from "../context/AppContext";
import type { Pagina } from "../types";
import type { Producto } from "../types";
import { THEME } from "../config";
import MaikaLogoImg from "./MaikaLogoImg";
import SyncIndicator from "./SyncIndicator";
import { isAdminAuthorized, setAdminAuthorization } from "../utils/adminAuth";
import {
  ensureAdminPanelJwtInSession,
  getLastAdminPanelLoginError,
  getLastAdminPanelRateLimitResetAt
} from "../services/apiAuth";
import { esAdminPermitidoEnEsteCliente, useEsAdminPermitidoEnEsteCliente } from "../utils/adminSoloEscritorio";
import { esRutaVistaTiendaShellScroll, getMaikaScrollPortEl } from "../utils/maikaScrollPort";
import {
  ALTURA_BARRA_TOP_MAX,
  ALTURA_BARRA_TOP_MIN,
  ALTURA_BARRA_TOP_DEFAULT,
  BARRA_TOP_ADMIN_PREVIEW_EVENT,
  BARRA_TOP_PEDIDO_EXITO_CFG_UPDATED_EVENT,
  ICONOS_BARRA_ESCALA_DEFAULT,
  ICONOS_BARRA_ESCALA_MAX,
  ICONOS_BARRA_ESCALA_MIN,
  LOGO_POS_X_DEFAULT,
  LOGO_POS_X_REL_MAX,
  LOGO_POS_X_REL_MIN,
  leerBarraTopPedidoExitoCfg,
  logoTamanoDesdeAlturaBarra,
  type BarraTopAdminPreviewDetail
} from "../utils/barraTopPedidoExito/barraTopPedidoExitoCfg";

const CATEGORIAS_ORDEN = ["velas", "inciensos", "figuras", "kits", "joyas"] as const;
const CAT_LABEL: Record<string, string> = { velas: "Velas", inciensos: "Inciensos", figuras: "Figuras", kits: "Kits", joyas: "Joyería del alma" };

/** Máximo desliz (px) desde el ancla junto a la hamburguesa; la geometría de la barra puede reducirlo. */
const LOGO_DESLIZ_DESDE_HAMBURGUESA_MAX_PX = 80;

interface NavPrincipalProps {
  pagina: Pagina;
  setPagina: (p: Pagina) => void;
  onPrefetchPagina?: (p: Pagina) => void;
  onTerminarCompra: () => void;
}

const gold = "#e5c07b";

const iconAdmin = (sizePx?: number) => (
  <svg className="nav-icon-stroke" width={sizePx ?? "1.45em"} height={sizePx ?? "1.45em"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block", marginRight: 0 }}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const iconCarrito = (sizePx?: number) => (
  <svg width={sizePx ?? "1.8em"} height={sizePx ?? "1.8em"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const iconMenuTresLineas = (sizePx?: number) => (
  <svg width={sizePx ?? "1.8em"} height={sizePx ?? "1.8em"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);


const iconCerrar = (
  <svg width="1.1em" height="1.1em" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const iconPersona = (sizePx?: number) => (
  <svg className="nav-icon-filled" width={sizePx ?? "2em"} height={sizePx ?? "2em"} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true" style={{ display: "block" }}>
    <path d="M12 12c2.76 0 5-2.46 5-5.5S14.76 1 12 1 7 3.46 7 6.5 9.24 12 12 12z" />
    <path d="M12 14c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6z" />
  </svg>
);

const linkStyle = (active: boolean, size = 16) => ({
  color: "var(--barra-iconos-color, #e5c07b)",
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  fontSize: size,
  fontWeight: active ? 600 : 500,
  textDecoration: "none",
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  whiteSpace: "nowrap" as const,
  transition: "color 0.2s ease"
});

export default function NavPrincipal({
  pagina,
  setPagina,
  onPrefetchPagina,
  onTerminarCompra
}: NavPrincipalProps) {
  void onTerminarCompra;
  const location = useLocation();
  const navigate = useNavigate();
  const adminUiPermitido = useEsAdminPermitidoEnEsteCliente();
  const { cart, accesoAdmin, velas, inciensos, figuras, kits, joyas, abrirTiendaConCategoria, setBusquedaTienda, sesionCarritoLista } = useApp();
  const esAdmin = isAdminAuthorized();
  const totalItemsCarrito = cart.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
  const mostrarBadgeCarrito = sesionCarritoLista && totalItemsCarrito > 0;
  const [inicioMenuAbierto, setInicioMenuAbierto] = useState(false);
  const [productosDesplegableAbierto, setProductosDesplegableAbierto] = useState(false);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [modalAdminAbierto, setModalAdminAbierto] = useState(false);
  const [claveAdminInput, setClaveAdminInput] = useState("");
  const [errorClaveAdmin, setErrorClaveAdmin] = useState(false);
  const [mensajeErrorClaveAdmin, setMensajeErrorClaveAdmin] = useState("Contraseña incorrecta");
  const [adminRateLimitBloqueado, setAdminRateLimitBloqueado] = useState(false);
  const [mostrarClaveAdminNav, setMostrarClaveAdminNav] = useState(false);
  const [logoPrincipalSrc, setLogoPrincipalSrc] = useState<string>(() => leerBarraTopPedidoExitoCfg().logoUrl);
  const [logoPrincipalPosX, setLogoPrincipalPosX] = useState<number>(() => leerBarraTopPedidoExitoCfg().logoPosX);
  const [mostrarLogoBarra, setMostrarLogoBarra] = useState<boolean>(() => leerBarraTopPedidoExitoCfg().mostrarLogoBarra);
  const [fondoBarraSuperior, setFondoBarraSuperior] = useState<string>(() => leerBarraTopPedidoExitoCfg().fondoBarraSuperior);
  const [alturaBarraSuperior, setAlturaBarraSuperior] = useState<number>(() => leerBarraTopPedidoExitoCfg().alturaBarraSuperior);
  const [colorIconosBarraSuperior, setColorIconosBarraSuperior] = useState<string>(() => leerBarraTopPedidoExitoCfg().colorIconosBarraSuperior);
  const [iconosEscalaPct, setIconosEscalaPct] = useState<number>(() => leerBarraTopPedidoExitoCfg().iconosEscalaPct);
  const adminClicksRef = useRef(0);
  const adminClicksTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inicioMenuRef = useRef<HTMLDivElement>(null);
  const inicioDropdownRef = useRef<HTMLDivElement>(null);
  const topbarInnerRowRef = useRef<HTMLDivElement>(null);
  const leadingRef = useRef<HTMLDivElement>(null);
  const syncColRef = useRef<HTMLDivElement>(null);
  const logoMarkRef = useRef<HTMLDivElement>(null);
  /** Tope de translateX (px) para no invadir la zona sync + iconos; empieza en 0 hasta medir (evita salto logo). */
  const [logoSlideGeoCapPx, setLogoSlideGeoCapPx] = useState<number>(0);
  const [logoSlideMedido, setLogoSlideMedido] = useState(false);
  /** Altura temporal desde el panel admin (vista previa); null = usar valor guardado. */
  const [previewBarraAltura, setPreviewBarraAltura] = useState<number | null>(null);
  const [previewBarraIconosEscala, setPreviewBarraIconosEscala] = useState<number | null>(null);

  const irABuscarEnTienda = () => {
    onPrefetchPagina?.("tienda");
    setBusquedaTienda(textoBusqueda.trim());
    setPagina("tienda");
    setInicioMenuAbierto(false);
    setTextoBusqueda("");
  };

  const itemMenuInicio = {
    display: "block" as const,
    width: "100%" as const,
    padding: "14px 0",
    border: "none",
    borderRadius: 0,
    background: "none",
    color: "white",
    cursor: "pointer" as const,
    fontWeight: 500,
    fontSize: 17,
    textAlign: "left" as const
  };
  const btnProductoLista = {
    display: "block" as const,
    width: "100%" as const,
    padding: "6px 10px",
    marginBottom: 2,
    border: "none",
    borderRadius: 6,
    background: "transparent",
    color: "rgba(255,255,255,0.9)",
    cursor: "pointer" as const,
    fontSize: 15,
    textAlign: "left" as const
  };
  const productosPorCategoria = useMemo(() => {
    const listas: Record<string, Producto[]> = {
      velas: Array.isArray(velas) ? velas : [],
      inciensos: Array.isArray(inciensos) ? inciensos : [],
      figuras: Array.isArray(figuras) ? figuras : [],
      kits: Array.isArray(kits) ? kits : [],
      joyas: Array.isArray(joyas) ? joyas : []
    };
    return listas;
  }, [velas, inciensos, figuras, kits, joyas]);

  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      const target = e.target as Node;
      const dentroMenu = inicioMenuRef.current?.contains(target);
      const dentroDropdown = inicioDropdownRef.current?.contains(target);
      if (!dentroMenu && !dentroDropdown) {
        setInicioMenuAbierto(false);
      }
    };
    if (inicioMenuAbierto) {
      document.addEventListener("click", cerrar);
      return () => document.removeEventListener("click", cerrar);
    }
  }, [inicioMenuAbierto]);

  useEffect(() => {
    if (!inicioMenuAbierto) {
      setProductosDesplegableAbierto(false);
    }
  }, [inicioMenuAbierto]);

  const cerrarModalAdmin = () => {
    setModalAdminAbierto(false);
    setMostrarClaveAdminNav(false);
  };

  const solicitarAccesoAdmin = () => {
    setClaveAdminInput("");
    setErrorClaveAdmin(false);
    setMostrarClaveAdminNav(false);
    setModalAdminAbierto(true);
  };

  const confirmarAccesoAdmin = async () => {
    const ok = await ensureAdminPanelJwtInSession(claveAdminInput);
    if (ok) {
      setAdminAuthorization();
      cerrarModalAdmin();
      window.location.assign(`${window.location.origin}/admin`);
      return;
    }
    const motivo = getLastAdminPanelLoginError();
    const resetAt = getLastAdminPanelRateLimitResetAt();
    const resetTexto = resetAt ? new Date(resetAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "";
    setAdminRateLimitBloqueado(motivo === "rate_limit");
    setMensajeErrorClaveAdmin(
      motivo === "rate_limit"
        ? `Demasiados intentos.${resetTexto ? ` Vuelve a probar sobre las ${resetTexto}.` : " Espera unos minutos y vuelve a probar."}`
        : motivo === "network"
          ? "No se pudo contactar con el servidor."
          : "Contraseña incorrecta"
    );
    setErrorClaveAdmin(true);
  };

  /** Contador de clics en logo solo en clientes donde el huevo de pascua admin está permitido. */
  const registrarClickLogoAdmin = () => {
    if (!esAdminPermitidoEnEsteCliente()) return;
    adminClicksRef.current += 1;
    if (adminClicksTimerRef.current) {
      window.clearTimeout(adminClicksTimerRef.current);
    }
    adminClicksTimerRef.current = setTimeout(() => {
      adminClicksRef.current = 0;
      adminClicksTimerRef.current = null;
    }, 1800);
    if (adminClicksRef.current >= 5) {
      adminClicksRef.current = 0;
      if (adminClicksTimerRef.current) {
        window.clearTimeout(adminClicksTimerRef.current);
        adminClicksTimerRef.current = null;
      }
      solicitarAccesoAdmin();
    }
  };

  /** Ir a inicio desde cualquier página (p. ej. Mi cuenta); el huevo admin sigue activo solo donde aplica. */
  const handleClickLogo = () => {
    setInicioMenuAbierto(false);
    setProductosDesplegableAbierto(false);
    registrarClickLogoAdmin();
    setPagina("inicio");
    try {
      const port = getMaikaScrollPortEl();
      if (port) port.scrollTop = 0;
      /* Sin `behavior: "smooth"` en el documento: el scroll útil va en el scrollport Maika; suavizar `window` desincroniza capas. */
      window.scrollTo(0, 0);
    } catch {
      window.scrollTo(0, 0);
    }
  };

  const irAdminRapido = () => {
    if (!isAdminAuthorized()) {
      solicitarAccesoAdmin();
      return;
    }
    if (
      location.pathname === "/carrito" ||
      location.pathname === "/tienda"
    ) {
      window.location.assign("/admin");
      return;
    }
    void navigate("/admin");
  };

  useEffect(() => {
    const syncLogoPrincipal = () => {
      const cfg = leerBarraTopPedidoExitoCfg();
      setLogoPrincipalSrc(cfg.logoUrl);
      const posX = cfg.logoPosX;
      setLogoPrincipalPosX(
        typeof posX === "number" && Number.isFinite(posX)
          ? Math.max(LOGO_POS_X_REL_MIN, Math.min(LOGO_POS_X_REL_MAX, Math.round(posX)))
          : LOGO_POS_X_DEFAULT
      );
      setFondoBarraSuperior(cfg.fondoBarraSuperior);
      setAlturaBarraSuperior(cfg.alturaBarraSuperior);
      setIconosEscalaPct(cfg.iconosEscalaPct);
      setColorIconosBarraSuperior(cfg.colorIconosBarraSuperior);
      setMostrarLogoBarra(cfg.mostrarLogoBarra);
    };
    /** Misma pestaña: `storage` no dispara; el `detail` del CustomEvent no siempre es fiable. Leemos siempre de LS. */
    const onConfigUpdated = () => {
      syncLogoPrincipal();
    };
    window.addEventListener("storage", syncLogoPrincipal);
    window.addEventListener(BARRA_TOP_PEDIDO_EXITO_CFG_UPDATED_EVENT, onConfigUpdated as EventListener);
    return () => {
      window.removeEventListener("storage", syncLogoPrincipal);
      window.removeEventListener(BARRA_TOP_PEDIDO_EXITO_CFG_UPDATED_EVENT, onConfigUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    const onPreview = (ev: Event) => {
      const d = (ev as CustomEvent<BarraTopAdminPreviewDetail>).detail;
      setPreviewBarraAltura(d?.alturaBarraSuperior ?? null);
      setPreviewBarraIconosEscala(d?.iconosEscalaPct ?? null);
    };
    window.addEventListener(BARRA_TOP_ADMIN_PREVIEW_EVENT, onPreview as EventListener);
    return () => window.removeEventListener(BARRA_TOP_ADMIN_PREVIEW_EVENT, onPreview as EventListener);
  }, []);

  useLayoutEffect(() => {
    const h = Math.max(
      ALTURA_BARRA_TOP_MIN,
      Math.min(ALTURA_BARRA_TOP_MAX, Math.round(previewBarraAltura ?? alturaBarraSuperior))
    );
    document.documentElement.style.setProperty("--app-topbar-h", `${h}px`);
  }, [previewBarraAltura, alturaBarraSuperior]);

  /** Altura efectiva de la barra (px); vista previa admin o valor guardado. */
  const barH = Math.max(
    ALTURA_BARRA_TOP_MIN,
    Math.min(ALTURA_BARRA_TOP_MAX, Math.round(previewBarraAltura ?? alturaBarraSuperior))
  );
  /**
   * Padding vertical interior: con barra baja (p. ej. 72px) el padding fijo 10+10 + logo 80+ px
   * superaba la altura y `overflow-y: hidden` en la topbar recortaba iconos.
   */
  const innerPadY = Math.min(10, Math.max(2, Math.round((barH - 48) * 0.22)));
  const logoMaxPorAlturaBarra = Math.max(40, barH - innerPadY * 2 - 2);
  const logoPorAltura = logoTamanoDesdeAlturaBarra(barH);
  const logoPrincipalTamanoWeb = Math.min(logoPorAltura, logoMaxPorAlturaBarra);
  /** Iconos y tipografía de la barra escalan con la altura (referencia 100px). */
  const iconosEscalaActivaPct = Math.max(
    ICONOS_BARRA_ESCALA_MIN,
    Math.min(ICONOS_BARRA_ESCALA_MAX, Math.round(previewBarraIconosEscala ?? iconosEscalaPct ?? ICONOS_BARRA_ESCALA_DEFAULT))
  );
  const navIconBasePx = Math.round(
    Math.min(27, Math.max(9, ((16 * barH) / ALTURA_BARRA_TOP_DEFAULT) * (iconosEscalaActivaPct / 100)))
  );
  const navIconVisualPx = Math.round(navIconBasePx * 1.8);
  const navIconMenuVisualPx = Math.round(navIconVisualPx * 1.08);
  const navIconRightVisualPx = Math.round(navIconVisualPx * 0.84);
  const navIconTouchPx = Math.max(36, Math.round(navIconVisualPx + 8));
  const navIconOffsetBottomPx = Math.max(0, Math.floor((barH - navIconTouchPx) / 2) - 8);
  /** Baja el logo un poco respecto al centro óptico de la barra (alineación con hamburguesa / iconos). */
  const logoBarMarkOffsetYPx = Math.min(16, Math.max(4, Math.round(barH * 0.08)));

  useEffect(() => {
    if (esAdmin && adminUiPermitido) preloadAdminOnce();
  }, [esAdmin, adminUiPermitido]);

  /**
   * Desplazamiento horizontal **desde** el hueco junto a la hamburguesa (admin 0–69 → 0…max px).
   * `logoSlideGeoCapPx` acota según ancho real hasta la columna sync/iconos.
   */
  const logoRelClamped = Math.max(
    LOGO_POS_X_REL_MIN,
    Math.min(LOGO_POS_X_REL_MAX, Math.round(logoPrincipalPosX))
  );
  const rawLogoSlideDesdeHamburguesaPx = (logoRelClamped / LOGO_POS_X_REL_MAX) * LOGO_DESLIZ_DESDE_HAMBURGUESA_MAX_PX;
  const logoSlideDesdeHamburguesaPx = logoSlideMedido
    ? Math.min(rawLogoSlideDesdeHamburguesaPx, logoSlideGeoCapPx)
    : 0;

  const recomputeLogoSlideGeoCap = useCallback(() => {
    const leading = leadingRef.current;
    const syncEl = syncColRef.current;
    const logoEl = logoMarkRef.current;
    if (!mostrarLogoBarra || !leading || !syncEl || !logoEl) {
      setLogoSlideGeoCapPx(LOGO_DESLIZ_DESDE_HAMBURGUESA_MAX_PX);
      return;
    }
    const syncLeft = syncEl.getBoundingClientRect().left;
    const leadingRect = leading.getBoundingClientRect();
    const logoLayoutRight = leadingRect.left + logoEl.offsetLeft + logoEl.offsetWidth;
    const margin = 8;
    const cap = Math.min(
      LOGO_DESLIZ_DESDE_HAMBURGUESA_MAX_PX,
      Math.max(0, syncLeft - margin - logoLayoutRight)
    );
    setLogoSlideGeoCapPx((prev) => (Math.abs(prev - cap) < 0.5 ? prev : cap));
    setLogoSlideMedido(true);
  }, [mostrarLogoBarra]);

  useLayoutEffect(() => {
    recomputeLogoSlideGeoCap();
    const inner = topbarInnerRowRef.current;
    const onResize = () => recomputeLogoSlideGeoCap();
    window.addEventListener("resize", onResize);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && inner) {
      ro = new ResizeObserver(() => recomputeLogoSlideGeoCap());
      ro.observe(inner);
    }
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [
    recomputeLogoSlideGeoCap,
    logoPrincipalTamanoWeb,
    innerPadY,
    barH,
    navIconBasePx,
    esAdmin,
    adminUiPermitido,
    pagina,
    mostrarBadgeCarrito,
    totalItemsCarrito,
    inicioMenuAbierto
  ]);

  useEffect(() => {
    return () => {
      if (adminClicksTimerRef.current) {
        window.clearTimeout(adminClicksTimerRef.current);
      }
    };
  }, []);

  const logoCuadrado = (
    <div
      ref={logoMarkRef}
      className="app-topbar__logo-mark"
      onClick={handleClickLogo}
      style={{
        position: "relative",
        flexShrink: 0,
        transform: `translate3d(${logoSlideDesdeHamburguesaPx}px, ${logoBarMarkOffsetYPx}px, 0)`,
        width: logoPrincipalTamanoWeb,
        height: logoPrincipalTamanoWeb,
        minWidth: logoPrincipalTamanoWeb,
        minHeight: logoPrincipalTamanoWeb,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        padding: 0,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: "inherit",
        zIndex: 1,
        pointerEvents: "auto"
      }}
    >
      <MaikaLogoImg preferredSrc={logoPrincipalSrc} title="" style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", objectFit: "contain" }} />
    </div>
  );

  return (
    <>
    <div
      className="app-topbar app-topbar--hero-style"
      data-maika="nav-main"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        /*
         * Por encima de capas de página (lightbox tienda, wa-float, cookies… suelen usar 9999).
         * Misma base que `.modal-overlay` (10000): los modales montados después en el árbol siguen tapando la barra.
         */
        zIndex: 10000,
        isolation: "isolate",
        boxSizing: "border-box",
        overflow: "visible",
        color: colorIconosBarraSuperior || gold,
        ["--barra-iconos-color" as string]: colorIconosBarraSuperior || gold,
        ["--maika-topbar-icon-box-px" as string]: `${navIconTouchPx}px`,
        ["--maika-topbar-icons-y-px" as string]: `${navIconOffsetBottomPx}px`,
        /** Color de fondo persistido (`BarraTopPedidoExitoCfg`); el gradiente por defecto vive en `App.css` como fallback de esta variable. */
        ["--barra-fondo-usuario" as string]: fondoBarraSuperior || undefined
      }}
    >
      <div
        ref={topbarInnerRowRef}
        className="app-topbar__inner-row"
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "nowrap",
          gap: 20,
          paddingTop: innerPadY,
          paddingBottom: innerPadY,
          paddingLeft: 24,
          paddingRight: 26,
          boxSizing: "border-box",
          overflowX: "auto",
          overflowY: "visible"
        }}
      >
      <div
        ref={leadingRef}
        className="app-topbar__leading"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          flexShrink: 0,
          gap: 10,
          minWidth: 0
        }}
      >
        <div ref={inicioMenuRef} style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setInicioMenuAbierto((v) => !v);
            }}
            style={{
              ...linkStyle(location.pathname === "/", navIconBasePx),
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: navIconTouchPx,
              minHeight: navIconTouchPx,
              width: navIconTouchPx,
              height: navIconTouchPx,
              padding: 0,
              lineHeight: 1,
              border: "none",
              boxShadow: "none",
              outline: "none",
              marginTop: 0,
              marginLeft: -14
            }}
            className="app-nav-link app-nav-link--menu-hamburger"
            aria-expanded={inicioMenuAbierto}
            aria-haspopup="true"
            aria-label="Menú"
            title="Menú"
          >
            {iconMenuTresLineas(navIconMenuVisualPx)}
          </button>
        </div>
        {mostrarLogoBarra ? logoCuadrado : null}
      </div>
      <div
        className="app-topbar__mid"
        style={{
          position: "relative",
          zIndex: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flex: 1,
          flexWrap: "nowrap",
          gap: 20,
          minWidth: 0,
          flexShrink: 1
        }}
      >
      <div style={{ flex: 1, minWidth: 0 }} aria-hidden />

      <div
        ref={syncColRef}
        className="app-topbar__sync-col"
        style={{
          position: "relative",
          zIndex: 5,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 18,
          flexShrink: 1,
          minWidth: 0,
          maxWidth: "100%",
          overflow: "visible"
        }}
      >
        <div
          className="app-topbar__sync-wrap"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            maxWidth: "min(360px, 48vw)",
            minWidth: 0,
            overflow: "hidden",
            flexShrink: 1
          }}
        >
          <SyncIndicator placement="topbar" />
        </div>
        <div
          className="app-topbar__right app-topbar__right--btns-aligned"
          style={{
            alignSelf: "center",
            position: "relative",
            zIndex: 20,
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: 2
          }}
        >
          <div style={{ position: "relative", zIndex: 20, display: "inline-flex", flexDirection: "row", alignItems: "center", flexWrap: "nowrap", gap: 14, pointerEvents: "auto" }}>
          {esAdmin && adminUiPermitido ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                irAdminRapido();
              }}
              onMouseEnter={() => onPrefetchPagina?.("admin")}
              className="app-nav-link app-nav-link--right"
              style={{
                ...linkStyle(pagina === "admin", navIconBasePx),
                background: "transparent",
                border: "none",
                boxShadow: "none",
                minWidth: navIconTouchPx,
                minHeight: navIconTouchPx,
                width: navIconTouchPx,
                height: navIconTouchPx,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                lineHeight: 1,
                fontSize: navIconBasePx,
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent"
              }}
              aria-label="Panel admin"
              title="Panel admin"
            >
              {iconAdmin(navIconRightVisualPx)}
            </button>
          ) : null}
          <Link
            to={PATH_BY_PAGINA.cuenta}
            onClick={(e) => {
              e.stopPropagation();
              onPrefetchPagina?.("cuenta");
            }}
            onMouseEnter={() => onPrefetchPagina?.("cuenta")}
            style={{
              ...linkStyle(pagina === "cuenta", navIconBasePx),
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: navIconTouchPx,
              minHeight: navIconTouchPx,
              width: navIconTouchPx,
              height: navIconTouchPx,
              padding: 0,
              lineHeight: 1,
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
              textDecoration: "none"
            }}
            className="app-nav-link app-nav-link--right"
            aria-label="Mi Cuenta"
            title="Mi Cuenta"
          >
            {iconPersona(navIconRightVisualPx)}
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPagina("carrito");
              void navigate(PATH_BY_PAGINA.carrito);
            }}
            onMouseEnter={() => onPrefetchPagina?.("carrito")}
            className="app-nav-link app-nav-link--carrito app-nav-link--right"
            style={{
              ...linkStyle(false, navIconBasePx),
              color: colorIconosBarraSuperior || gold,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: navIconTouchPx,
              minHeight: navIconTouchPx,
              width: navIconTouchPx,
              height: navIconTouchPx,
              padding: 0,
              lineHeight: 1,
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent"
            }}
            aria-label={mostrarBadgeCarrito ? `Carrito: ${totalItemsCarrito} artículo${totalItemsCarrito === 1 ? "" : "s"}` : "Carrito"}
            title="Carrito"
          >
            <span data-maika-cart-icon style={{ display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center" }}>{iconCarrito(navIconRightVisualPx)}</span>
              {mostrarBadgeCarrito && <span style={{ fontSize: "0.95em" }}>({totalItemsCarrito})</span>}
            </span>
          </button>
          </div>
        </div>
      </div>
      </div>
      </div>
    </div>
    {inicioMenuAbierto && (
      <div
        ref={inicioDropdownRef}
        className="app-inicio-dropdown app-inicio-dropdown--overlay"
        style={{
          position: "fixed",
          top: Math.max(0, barH - 2),
          left: 0,
          zIndex: 9950,
          width: "100%",
          maxWidth: "min(50vw, 420px)",
          padding: "16px 20px",
          background: THEME.bg,
          borderBottom: "2px solid rgba(229, 192, 123, 0.35)",
          boxSizing: "border-box",
          maxHeight: "min(90vh, 720px)",
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", marginBottom: 4, marginRight: -16 }}>
          <button
            type="button"
            className="app-inicio-dropdown__close"
            onClick={(e) => { e.stopPropagation(); setInicioMenuAbierto(false); }}
            style={{ background: "none", border: "none", boxShadow: "none", outline: "none", color: "#fff", cursor: "pointer", padding: 8, display: "inline-flex", alignItems: "center", marginRight: -8 }}
            aria-label="Cerrar menú"
            title="Cerrar"
          >
            <span style={{ fontSize: "1.75rem", lineHeight: 1, display: "inline-flex" }}>{iconCerrar}</span>
          </button>
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6, minWidth: 0, alignItems: "stretch" }}>
            <input
              type="search"
              placeholder="Buscar en tienda..."
              value={textoBusqueda}
              onFocus={() => onPrefetchPagina?.("tienda")}
              onChange={(e) => {
                onPrefetchPagina?.("tienda");
                setTextoBusqueda(e.target.value);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") irABuscarEnTienda(); }}
              style={{
                flex: 1,
                minWidth: 0,
                padding: "8px 10px",
                borderRadius: 8,
                border: "2px solid rgba(201,162,74,0.5)",
                background: THEME.bg,
                color: "white",
                fontSize: 14
              }}
            />
            <button
              type="button"
              className="app-inicio-dropdown__buscar-submit"
              onClick={irABuscarEnTienda}
              style={{
                flexShrink: 0,
                whiteSpace: "nowrap",
                padding: "8px 12px",
                borderRadius: 8,
                border: `2px solid ${THEME.goldMain}`,
                background: THEME.goldMain,
                color: "#1b1745",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: 13
              }}
            >
              Buscar
            </button>
          </div>
        </div>
        <div style={{ marginBottom: 6 }}>
          <Link
            to={PATH_BY_PAGINA.suenos}
            onClick={() => setInicioMenuAbierto(false)}
            style={{ ...itemMenuInicio, textDecoration: "none", color: "white", fontWeight: location.pathname === PATH_BY_PAGINA.suenos ? 700 : itemMenuInicio.fontWeight }}
          >
            Sueños
          </Link>
        </div>
        <div style={{ marginBottom: 6 }}>
          <Link
            to={PATH_BY_PAGINA.servicios}
            onClick={() => setInicioMenuAbierto(false)}
            style={{ ...itemMenuInicio, textDecoration: "none", color: "white", fontWeight: location.pathname === PATH_BY_PAGINA.servicios ? 700 : itemMenuInicio.fontWeight }}
          >
            Servicios
          </Link>
        </div>
        <div style={{ marginBottom: 6 }}>
          <Link
            to={PATH_BY_PAGINA.horoscopos}
            onClick={() => setInicioMenuAbierto(false)}
            style={{ ...itemMenuInicio, textDecoration: "none", color: "white", fontWeight: location.pathname === PATH_BY_PAGINA.horoscopos ? 700 : itemMenuInicio.fontWeight }}
          >
            Horóscopos
          </Link>
        </div>
        <div style={{ marginBottom: 6 }}>
          <Link
            to={PATH_BY_PAGINA.ritualDelMes}
            onClick={() => setInicioMenuAbierto(false)}
            style={{
              ...itemMenuInicio,
              textDecoration: "none",
              color: "white",
              fontWeight: location.pathname === PATH_BY_PAGINA.ritualDelMes ? 700 : itemMenuInicio.fontWeight
            }}
          >
            Ritual del mes
          </Link>
        </div>
        <div style={{ marginBottom: 6 }}>
          <Link
            to={PATH_BY_PAGINA.tienda}
            onClick={() => setInicioMenuAbierto(false)}
            onMouseEnter={() => onPrefetchPagina?.("tienda")}
            style={{ ...itemMenuInicio, textDecoration: "none", color: "white", fontWeight: esRutaVistaTiendaShellScroll(location.pathname) ? 700 : itemMenuInicio.fontWeight }}
          >
            Tienda
          </Link>
        </div>
        <div style={{ marginBottom: 6 }}>
          <button type="button" onClick={(e) => { e.stopPropagation(); setProductosDesplegableAbierto((v) => !v); }} style={itemMenuInicio}>
            Productos
          </button>
        </div>
        <div style={{ marginBottom: 6 }}>
          <Link
            to={PATH_BY_PAGINA.testimonios}
            onClick={() => setInicioMenuAbierto(false)}
            style={{
              ...itemMenuInicio,
              textDecoration: "none",
              color: "white",
              fontWeight: location.pathname === PATH_BY_PAGINA.testimonios ? 700 : itemMenuInicio.fontWeight
            }}
          >
            Testimonios
          </Link>
        </div>
        {productosDesplegableAbierto && (
          <div style={{ maxHeight: 280, overflowY: "auto", marginBottom: 6, paddingLeft: 4, borderLeft: "2px solid rgba(201,162,74,0.3)" }}>
            {CATEGORIAS_ORDEN.map((catId) => {
              const productos = productosPorCategoria[catId] ?? [];
              if (productos.length === 0) return null;
              return (
                <div key={catId} style={{ marginBottom: 10 }}>
                  <div style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: 14, marginBottom: 4 }}>{CAT_LABEL[catId]}</div>
                  {productos.map((p) => (
                    <button key={`${catId}-${p.id}`} type="button" onMouseEnter={() => onPrefetchPagina?.("tienda")} onClick={() => { abrirTiendaConCategoria(catId); setPagina("tienda"); setInicioMenuAbierto(false); }} style={btnProductoLista}>
                      {p.nombre}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
        {!accesoAdmin && (
          <div style={{ marginBottom: 6 }}>
            <Link
              to={PATH_BY_PAGINA.seguimiento}
              onClick={() => setInicioMenuAbierto(false)}
              onMouseEnter={() => onPrefetchPagina?.("seguimiento")}
              style={{ ...itemMenuInicio, textDecoration: "none", color: "white", fontWeight: location.pathname === PATH_BY_PAGINA.seguimiento ? 700 : itemMenuInicio.fontWeight }}
            >
              Seguimiento de pedidos
            </Link>
          </div>
        )}
        <div style={{ marginBottom: 6 }}>
          <Link
            to={PATH_BY_PAGINA.sobreMaika}
            onClick={() => setInicioMenuAbierto(false)}
            style={{ ...itemMenuInicio, textDecoration: "none", color: "white", fontWeight: location.pathname === PATH_BY_PAGINA.sobreMaika ? 700 : itemMenuInicio.fontWeight }}
          >
            Sobre Maika
          </Link>
        </div>
        <div style={{ marginBottom: 6 }}>
          <Link
            to={PATH_BY_PAGINA.contacto}
            onClick={() => setInicioMenuAbierto(false)}
            style={{ ...itemMenuInicio, textDecoration: "none", color: "white", fontWeight: location.pathname === PATH_BY_PAGINA.contacto ? 700 : itemMenuInicio.fontWeight }}
          >
            Contacto
          </Link>
        </div>
        <div style={{ marginBottom: 6 }}>
          <Link
            to={PATH_BY_PAGINA.envios}
            onClick={() => setInicioMenuAbierto(false)}
            style={{ ...itemMenuInicio, textDecoration: "none", color: "white", fontWeight: location.pathname === PATH_BY_PAGINA.envios ? 700 : itemMenuInicio.fontWeight }}
          >
            Envíos
          </Link>
        </div>
        <div style={{ marginBottom: 6 }}>
          <Link
            to={PATH_BY_PAGINA.legal}
            onClick={() => setInicioMenuAbierto(false)}
            style={{
              ...itemMenuInicio,
              textDecoration: "none",
              color: "white",
              fontWeight:
                location.pathname === PATH_BY_PAGINA.legal || location.pathname.startsWith(`${PATH_BY_PAGINA.legal}/`)
                  ? 700
                  : itemMenuInicio.fontWeight
            }}
          >
            Legal
          </Link>
        </div>
      </div>
    )}
    {modalAdminAbierto && (
      <div
        onClick={cerrarModalAdmin}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10030,
          background: "rgba(0,0,0,0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 360,
            background: THEME.bg,
            border: `2px solid ${THEME.goldMain}`,
            borderRadius: 14,
            padding: 16,
            color: "white"
          }}
        >
          <button
            type="button"
            onClick={cerrarModalAdmin}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: 999,
              border: `1px solid ${THEME.goldMain}`,
              background: "rgba(0,0,0,0.6)",
              color: THEME.goldMain,
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1
            }}
            aria-label="Cerrar acceso admin"
            title="Cerrar"
          >
            ×
          </button>
          <h3 style={{ margin: "0 0 12px", color: THEME.goldMain, textAlign: "center" }}>Acceso admin</h3>
          <div style={{ position: "relative" }}>
            <input
              type={mostrarClaveAdminNav ? "text" : "password"}
              placeholder="Introduce contraseña"
              value={claveAdminInput}
              onChange={(e) => {
                setClaveAdminInput(e.target.value);
                if (errorClaveAdmin) setErrorClaveAdmin(false);
                setMensajeErrorClaveAdmin("Contraseña incorrecta");
                setAdminRateLimitBloqueado(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !adminRateLimitBloqueado) confirmarAccesoAdmin();
              }}
              disabled={adminRateLimitBloqueado}
              autoFocus
              autoComplete="current-password"
              style={{
                width: "100%",
                padding: "10px 44px 10px 12px",
                borderRadius: 10,
                border: `2px solid ${errorClaveAdmin ? "#ff4d4d" : THEME.goldMain}`,
                background: "transparent",
                color: "white",
                opacity: adminRateLimitBloqueado ? 0.58 : 1,
                cursor: adminRateLimitBloqueado ? "not-allowed" : "text",
                boxSizing: "border-box"
              }}
            />
            <button
              type="button"
              onClick={() => setMostrarClaveAdminNav((v) => !v)}
              style={{
                position: "absolute",
                right: 6,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 18,
                padding: 4,
                color: THEME.goldMain
              }}
              title={mostrarClaveAdminNav ? "Ocultar contraseña" : "Ver contraseña"}
              aria-label={mostrarClaveAdminNav ? "Ocultar contraseña" : "Ver contraseña"}
              disabled={adminRateLimitBloqueado}
            >
              {mostrarClaveAdminNav ? "🙈" : "👁"}
            </button>
          </div>
          {errorClaveAdmin && (
            <p style={{ margin: "8px 0 0", color: "#ff8a8a", fontSize: 13 }}>{mensajeErrorClaveAdmin}</p>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button
              type="button"
              onClick={cerrarModalAdmin}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${THEME.goldMain}`,
                background: "transparent",
                color: THEME.goldMain,
                cursor: "pointer"
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmarAccesoAdmin}
              disabled={adminRateLimitBloqueado}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                background: THEME.goldMain,
                color: "#1b1745",
                fontWeight: "bold",
                cursor: adminRateLimitBloqueado ? "not-allowed" : "pointer",
                opacity: adminRateLimitBloqueado ? 0.58 : 1
              }}
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
