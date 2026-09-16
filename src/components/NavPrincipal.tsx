import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PATH_BY_PAGINA } from "@/app/routing/routeMaps";
import { preloadAdminOnce } from "@/app/routing/preloadOnce";
import { useApp } from "../context/AppContext";
import type { Pagina } from "../types";
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
import {
  gold,
  iconAdmin,
  iconCarrito,
  iconMenuTresLineas,
  iconCerrar,
  iconPersona,
  linkStyle
} from "./nav/navIcons";
import NavAdminModal from "./nav/NavAdminModal";

/** Máximo desliz (px) desde el ancla junto a la hamburguesa; la geometría de la barra puede reducirlo. */
const LOGO_DESLIZ_DESDE_HAMBURGUESA_MAX_PX = 80;

interface NavPrincipalProps {
  pagina: Pagina;
  setPagina: (p: Pagina) => void;
  onPrefetchPagina?: (p: Pagina) => void;
  onTerminarCompra: () => void;
}

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
  const { cart, accesoAdmin, usuario, setBusquedaTienda, sesionCarritoLista } = useApp();
  const esAdmin = isAdminAuthorized();
  const totalItemsCarrito = cart.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
  const mostrarBadgeCarrito = sesionCarritoLista && totalItemsCarrito > 0;
  const [inicioMenuAbierto, setInicioMenuAbierto] = useState(false);
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
  /** Título de cada grupo del menú: más pequeño que los enlaces, dorado tenue y en mayúsculas. */
  const tituloSeccionMenu = {
    marginTop: 16,
    marginBottom: 8,
    paddingTop: 12,
    borderTop: "1px solid rgba(229, 192, 123, 0.22)",
    color: "rgba(229, 192, 123, 0.62)",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const
  };

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
        <div style={tituloSeccionMenu}>✨ Experiencias</div>
        <div style={{ marginBottom: 6 }}>
          <Link
            to={PATH_BY_PAGINA.suenos}
            onClick={() => setInicioMenuAbierto(false)}
            style={{ ...itemMenuInicio, textDecoration: "none", color: "white", fontWeight: location.pathname === PATH_BY_PAGINA.suenos ? 700 : itemMenuInicio.fontWeight }}
          >
            🌙 Sueños
          </Link>
        </div>
        <div style={{ marginBottom: 6 }}>
          <Link
            to={PATH_BY_PAGINA.horoscopos}
            onClick={() => setInicioMenuAbierto(false)}
            style={{ ...itemMenuInicio, textDecoration: "none", color: "white", fontWeight: location.pathname === PATH_BY_PAGINA.horoscopos ? 700 : itemMenuInicio.fontWeight }}
          >
            🔮 Horóscopos
          </Link>
        </div>
        <div>
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
            🕯 Ritual del mes
          </Link>
        </div>

        <div style={tituloSeccionMenu}>🛍 Tienda</div>
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
        {!accesoAdmin && (
          <div>
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

        <div style={tituloSeccionMenu}>🪷 Sobre Maika</div>
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
            to={PATH_BY_PAGINA.servicios}
            onClick={() => setInicioMenuAbierto(false)}
            style={{ ...itemMenuInicio, textDecoration: "none", color: "white", fontWeight: location.pathname === PATH_BY_PAGINA.servicios ? 700 : itemMenuInicio.fontWeight }}
          >
            Servicios
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
        <div>
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

        <div style={tituloSeccionMenu}>👤 Mi cuenta</div>
        {usuario ? (
          <div>
            <Link
              to={PATH_BY_PAGINA.cuenta}
              onClick={() => setInicioMenuAbierto(false)}
              onMouseEnter={() => onPrefetchPagina?.("cuenta")}
              style={{ ...itemMenuInicio, textDecoration: "none", color: "white", fontWeight: location.pathname === PATH_BY_PAGINA.cuenta ? 700 : itemMenuInicio.fontWeight }}
            >
              Mi cuenta
            </Link>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 6 }}>
              <Link
                to="/cuenta?vista=login"
                onClick={() => setInicioMenuAbierto(false)}
                style={{ ...itemMenuInicio, textDecoration: "none", color: "white" }}
              >
                Iniciar sesión
              </Link>
            </div>
            <div>
              <Link
                to="/cuenta?vista=registro"
                onClick={() => setInicioMenuAbierto(false)}
                style={{ ...itemMenuInicio, textDecoration: "none", color: "white" }}
              >
                Crear cuenta gratuita
              </Link>
            </div>
          </>
        )}
      </div>
    )}
    {modalAdminAbierto && (
      <NavAdminModal
        claveAdminInput={claveAdminInput}
        setClaveAdminInput={setClaveAdminInput}
        mostrarClaveAdminNav={mostrarClaveAdminNav}
        setMostrarClaveAdminNav={setMostrarClaveAdminNav}
        errorClaveAdmin={errorClaveAdmin}
        setErrorClaveAdmin={setErrorClaveAdmin}
        mensajeErrorClaveAdmin={mensajeErrorClaveAdmin}
        setMensajeErrorClaveAdmin={setMensajeErrorClaveAdmin}
        adminRateLimitBloqueado={adminRateLimitBloqueado}
        setAdminRateLimitBloqueado={setAdminRateLimitBloqueado}
        cerrarModalAdmin={cerrarModalAdmin}
        confirmarAccesoAdmin={confirmarAccesoAdmin}
      />
    )}
    </>
  );
}
