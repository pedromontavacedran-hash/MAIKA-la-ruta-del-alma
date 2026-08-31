import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from "react";
import "./App.css";
import { Capacitor } from "@capacitor/core";
import CheckoutView from "./app/views/CheckoutView";
import AppTopChrome from "./components/AppTopChrome";
import Layout from "./components/Layout";
import { AppProvider } from "./context/AppContext";
import type { Pagina, Pedido } from "./types";
import {
  QUICK_CHECKOUT_KEY,
  NOTA_PEDIDO_ENVIO_DEFAULT,
  DESPLEGABLE_INICIO_DEFAULT,
  SERVICIOS_INICIO_DEFAULT,
  type ServicioInicio,
  CUPONES_DISPONIBLES,
  THEME,
  CUPONES_MAIKA_KEY
} from "./config";
import { useCatalogoMaika } from "./hooks/useCatalogoMaika";
import { useCategorias } from "./hooks/useCategorias";
import { useSubcategorias } from "./hooks/useSubcategorias";
import { useCarrito } from "./hooks/useCarrito";
import { usePedidosMaika } from "./hooks/usePedidosMaika";
import { usePerfilCompraRapida } from "./hooks/usePerfilCompraRapida";
import { useAppContextValue } from "./app/hooks/useAppContextValue";
import { generarNumeroPedido } from "./utils/appIdentity";
import { getCuponesDisponibles as getCuponesDisponiblesStorage } from "./utils/cupones";
import { prefetchConDelay } from "./utils/prefetchPredictivo";
import { getUsuarioId } from "./utils/usuarioId";
import { clearAdminAuthorization } from "./utils/adminAuth";
import { ensureAdminUsuariosApiJwt, hasClientSession, reconciliarSesionAdminAlArrancar } from "./services/apiAuth";
import { notificarError } from "./utils/ui/notificaciones";
import { AppRoutes } from "./app/AppRoutes";
import {
  preloadAdminOnce,
  preloadCarritoOnce,
  preloadCuentaOnce,
  preloadSeguimientoOnce,
  preloadTiendaOnce
} from "./app/routing/preloadOnce";
import { useShellRoutesProps } from "./app/hooks/useShellRoutesProps";
import { packAppContextInput } from "./app/context/packAppContextInput";
import { useAppRouting } from "./app/hooks/useAppRouting";
import { useAppBootstrapStorage } from "./app/hooks/useAppBootstrapStorage";
import { useBodyClassModalOpen } from "./app/hooks/useBodyClassModalOpen";
import { useMaikaCheckout } from "./app/hooks/useMaikaCheckout";
import { useMaikaAdmin } from "./app/hooks/useMaikaAdmin";
import { useMaikaChrome } from "./app/hooks/useMaikaChrome";
import { useMaikaSesionUsuarios } from "./app/hooks/useMaikaSesionUsuarios";
import { MAIKA_API_BECAME_REACHABLE_EVENT } from "./utils/maikaApiProbe";
import {
  leerOutbox,
  sincronizarOutbox,
  MAIKA_OUTBOX_REPLANIFICAR_TEMPORIZADOR_EVENT
} from "./utils/maikaOutbox";
import { normalizarTelefonoES9 } from "./utils/telefono";
import { esVistaFondoEstrellasSoloEmbebida } from "./utils/fondoEstrellasPreviewEmbed";
import {
  esRutaVistaTiendaShellScroll,
  installPreserveMaikaScrollPortOnDetailsToggle
} from "./utils/maikaScrollPort";
import {
  aplicarWebLayoutCssDesdeStorage,
  MAIKA_WEB_LAYOUT_LS_KEY,
  MAIKA_WEB_LAYOUT_UPDATED_EVENT
} from "./utils/webLayoutConfig";
import { MAIKA_TABS_BROADCAST_NAME, type MaikaTabsBroadcastPayload } from "./utils/maikaTabsBroadcast";

/** Cola vacía: pocos intentos en reposo. Con cola: reintentos más frecuentes (sin esperar 3 min). */
const MAIKA_OUTBOX_INTERVALO_REPOSO_MS = 180_000;
const MAIKA_OUTBOX_INTERVALO_CON_COLA_MS = 25_000;

export default function MaikaAppShell() {
  const { navigate, location, pagina, modoDireccionCheckout, setPagina } = useAppRouting();

  useLayoutEffect(() => {
    aplicarWebLayoutCssDesdeStorage();
    const on = () => aplicarWebLayoutCssDesdeStorage();
    const onStorage = (e: StorageEvent) => {
      if (e.key === MAIKA_WEB_LAYOUT_LS_KEY) aplicarWebLayoutCssDesdeStorage();
    };
    window.addEventListener(MAIKA_WEB_LAYOUT_UPDATED_EVENT, on as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(MAIKA_WEB_LAYOUT_UPDATED_EVENT, on as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const chromeState = useMaikaChrome();
  const {
    notificacion,
    mostrarNotificacion,
    mostrarAvisoCookies,
    mostrarConfigCookies,
    consentimientoCookies,
    rechazarCookiesOpcionales,
    aceptarCookies,
    toggleMostrarConfigCookies,
    cerrarConfigCookies,
    cerrarNotificacion,
    guardarPreferenciasCookiesPanel,
    onUpdatePreferencias,
    onUpdateAnaliticas,
    onUpdateMarketing
  } = chromeState;

  const pathnameResetBroadcastRef = useRef(location.pathname);
  pathnameResetBroadcastRef.current = location.pathname;
  const mostrarNotificacionResetBroadcastRef = useRef(mostrarNotificacion);
  mostrarNotificacionResetBroadcastRef.current = mostrarNotificacion;

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(MAIKA_TABS_BROADCAST_NAME);
    let lastAvisoEn = 0;
    ch.onmessage = (ev: MessageEvent<unknown>) => {
      const data = ev.data as MaikaTabsBroadcastPayload | undefined;
      if (!data || data.type !== "reset-password-tab-opened") return;
      if (pathnameResetBroadcastRef.current.startsWith("/reset-password")) return;
      const ahora = Date.now();
      if (ahora - lastAvisoEn < 1500) return;
      lastAvisoEn = ahora;
      mostrarNotificacionResetBroadcastRef.current(
        "El enlace de recuperación se abrió en otra pestaña. Continúa allí o cierra esta cuando ya no la necesites.",
        "normal"
      );
    };
    return () => ch.close();
  }, []);

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

  const subcategorias = useSubcategorias();
  const {
    subcategoriasCatalogo,
    setSubcategoriasCatalogo,
    subcategoriasDe,
    agregarSubcategoria,
    renombrarSubcategoria,
    eliminarSubcategoria
  } = subcategorias;

  const {
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
    precioCatalogoPorId,
    precioItemCarrito,
    normalizarItemCarrito,
    aplicarCatalogoActualizado
  } = useCatalogoMaika();

  const sesionState = useMaikaSesionUsuarios({
    pathname: location.pathname,
    setPagina,
    mostrarNotificacion,
    navigate
  });
  const {
    modalUsuariosAbierto,
    setModalUsuariosAbierto,
    altaUsuarioEnGestionAbierta,
    setAltaUsuarioEnGestionAbierta,
    datosCliente,
    setDatosCliente,
    precargarDatosClienteDesdeUsuario,
    resetCliente,
    usuario,
    setUsuario,
    authHydrated,
    setAuthHydrated,
    loginModalAbierto,
    setLoginModalAbierto,
    modoRegistro,
    setModoRegistro,
    getUsuarioCanonico,
    authPerfilSync,
    reintentarPerfilAhora,
    iniciarSesionConToken,
    listaUsuarios,
    setListaUsuarios,
    modalEditarUsuarioAbierto,
    setModalEditarUsuarioAbierto,
    editUsuarioForm,
    setEditUsuarioForm,
    guardarEdicionUsuario,
    proyectarUsuariosDesdeMaika,
    abrirEditorUsuario,
    cargarUsuarios,
    leerMaikaUsuarios,
    guardarMaikaUsuarios,
    telefonoForzadoRegistroDesdeAcceso,
    setTelefonoForzadoRegistroDesdeAcceso,
    modoForzadoRegistroDesdeAcceso,
    setModoForzadoRegistroDesdeAcceso,
    confirmacionIdentidadActivacion,
    setConfirmacionIdentidadActivacion,
    formAuth,
    setFormAuth,
    reenvioDisponibleEn,
    setReenvioDisponibleEn,
    abrirRegistroAdminCuenta,
    abrirDetalleCliente
  } = sesionState;

  useEffect(() => {
    if (!location.pathname.startsWith("/admin")) return;
    let cancelled = false;
    void reconciliarSesionAdminAlArrancar().then((ok) => {
      if (!cancelled) setAccesoAdmin(ok);
    });
    const onAuthChanged = () => {
      void reconciliarSesionAdminAlArrancar().then((ok) => {
        if (!cancelled) setAccesoAdmin(ok);
      });
    };
    window.addEventListener("maika_admin_auth_changed", onAuthChanged);
    return () => {
      cancelled = true;
      window.removeEventListener("maika_admin_auth_changed", onAuthChanged);
    };
  }, [location.pathname]);

  useEffect(() => {
    const run = (origen?: string) => {
      if (import.meta.env.DEV && origen) {
        console.log(`[maika_outbox] ${origen} → sincronizarOutbox`);
      }
      void sincronizarOutbox(normalizarTelefonoES9);
    };

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const programarSiguiente = () => {
      if (timeoutId != null) window.clearTimeout(timeoutId);
      const delay =
        leerOutbox().length > 0 ? MAIKA_OUTBOX_INTERVALO_CON_COLA_MS : MAIKA_OUTBOX_INTERVALO_REPOSO_MS;
      timeoutId = window.setTimeout(() => {
        if (document.visibilityState === "visible") run("intervalo adaptativo");
        programarSiguiente();
      }, delay);
    };

    const onOnline = () => run("online");
    const handleFocus = () => run("FOCUS");
    const handleVisibility = () => {
      if (document.visibilityState === "visible") run("VISIBLE");
    };
    const onApiReachableAgain = () => run("API reachable de nuevo");
    const onReplanificarTemporizador = () => programarSiguiente();
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener(MAIKA_API_BECAME_REACHABLE_EVENT, onApiReachableAgain);
    window.addEventListener(MAIKA_OUTBOX_REPLANIFICAR_TEMPORIZADOR_EVENT, onReplanificarTemporizador);

    /** Tras registrar listeners: el sync inicial puede disparar replanificación. */
    run("mount");
    programarSiguiente();
    return () => {
      if (timeoutId != null) window.clearTimeout(timeoutId);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener(MAIKA_API_BECAME_REACHABLE_EVENT, onApiReachableAgain);
      window.removeEventListener(MAIKA_OUTBOX_REPLANIFICAR_TEMPORIZADOR_EVENT, onReplanificarTemporizador);
    };
  }, []);

  /** `<details>` en admin (y en todo el sitio) no debe desplazar el scrollport Maika al mutar altura. */
  useEffect(() => installPreserveMaikaScrollPortOnDetailsToggle(), []);

  const carritoIdentityKey = useMemo(() => {
    if (!authHydrated) return null;
    if (usuario?.id != null && String(usuario.id).trim() !== "") {
      return `user_${String(usuario.id).trim()}`;
    }
    return getUsuarioId();
  }, [authHydrated, usuario?.id]);

  /** Misma idea que el carrito: recargar pedidos al hidratar usuario o cambiar sesión. */
  const pedidosSyncKey = useMemo(() => {
    if (!authHydrated) return null;
    if (!hasClientSession()) return "local";
    if (usuario?.id != null && String(usuario.id).trim() !== "") {
      return `user_${String(usuario.id).trim()}`;
    }
    return "jwt";
  }, [authHydrated, usuario?.id]);

  const carrito = useCarrito(
    {
      precioItemCarrito,
      normalizarItemCarrito,
      precioCatalogoPorId,
      velas,
      inciensos,
      figuras,
      kits,
      joyas
    },
    mostrarNotificacion,
    carritoIdentityKey
  );
  const {
    cart,
    setCart,
    total,
    totalItemsCarrito,
    agregarAlCarrito,
    cambiarCantidad,
    eliminarProductoCarrito,
    getStockProducto
  } = carrito;
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

  const [categoriaEditarProductos, setCategoriaEditarProductos] = useState<"velas" | "inciensos" | "figuras" | "joyas">("velas");
  const [productoSeleccionado, setProductoSeleccionado] = useState<string>("");
  const [previewProducto, setPreviewProducto] = useState<string | null>(null);
  const [nombreImagenProducto, setNombreImagenProducto] = useState("");
  const [colorProducto, setColorProducto] = useState<string>("#ffffff");
  const [tamanoProducto, setTamanoProducto] = useState<string>("22");
  const [estiloTextoProducto, setEstiloTextoProducto] = useState<string>("normal");

  const [categoriaNuevoProducto, setCategoriaNuevoProducto] = useState<"velas" | "inciensos" | "figuras" | "joyas">("velas");
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
  const [claveAdmin, setClaveAdmin] = useState("");
  const [accesoAdmin, setAccesoAdmin] = useState(false);
  /** Sesión admin: la UI solo se desbloquea si el backend confirma la cookie httpOnly. */
  useEffect(() => {
    if (!location.pathname.startsWith("/admin") || !accesoAdmin) return;
    const id = window.setInterval(() => {
      void ensureAdminUsuariosApiJwt().then((ok) => {
        if (ok) return;
        clearAdminAuthorization();
        setAccesoAdmin(false);
      });
    }, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [accesoAdmin, location.pathname]);
  const [numeroSeguimiento, setNumeroSeguimiento] = useState("");
  const [pedidoBuscado, setPedidoBuscado] = useState<Pedido | null>(null);

  const { pedidos, setPedidos } = usePedidosMaika(pedidosSyncKey);

  const [cuponesAdmin, setCuponesAdmin] = useState<Record<string, { tipo: "porcentaje" | "envio_gratis"; valor: number }>>({});
  const [umbralStockBajo, setUmbralStockBajo] = useState(2);
  const [notaPedidoEnvio, setNotaPedidoEnvio] = useState(NOTA_PEDIDO_ENVIO_DEFAULT);
  const [desplegableInicio, setDesplegableInicio] = useState(DESPLEGABLE_INICIO_DEFAULT);
  const [serviciosInicio, setServiciosInicio] = useState<ServicioInicio[]>(SERVICIOS_INICIO_DEFAULT);
  const [categoriaTiendaAlAbrir, setCategoriaTiendaAlAbrir] = useState<string | null>(null);
  const [busquedaTienda, setBusquedaTienda] = useState("");
  const { perfil: perfilCompraRapida, setPerfil: setPerfilCompraRapida } = usePerfilCompraRapida(QUICK_CHECKOUT_KEY);

  const checkoutState = useMaikaCheckout({
    navigate,
    location,
    modoDireccionCheckout,
    setPagina,
    datosCliente,
    setDatosCliente,
    usuario,
    setUsuario,
    iniciarSesionConToken,
    authHydrated,
    precargarDatosClienteDesdeUsuario,
    resetCliente,
    mostrarNotificacion,
    leerMaikaUsuarios,
    guardarMaikaUsuarios,
    getUsuarioCanonico,
    proyectarUsuariosDesdeMaika,
    cart,
    setCart,
    total,
    getStockProducto,
    normalizarItemCarrito,
    velas,
    inciensos,
    figuras,
    kits,
    joyas,
    precioItemCarrito,
    aplicarCatalogoActualizado,
    setPedidos,
    setAuthHydrated,
    perfilCompraRapida,
    setPerfilCompraRapida,
    loginModalAbierto,
    setLoginModalAbierto,
    setModoRegistro,
    setTelefonoForzadoRegistroDesdeAcceso,
    setModoForzadoRegistroDesdeAcceso,
    setConfirmacionIdentidadActivacion,
    setFormAuth,
    notaPedidoEnvio
  });

  const {
    finalizarCarrito,
    envioPreview,
    totalPreview,
    setNumeroPedidoPreview,
    setFormPedidoAbierto,
    vaciarCarrito,
    comprarEnUnClick,
    setPedidoFacturaAbierto: onAbrirFacturaPedido,
    handleRepetirPedido,
    hayModalAbiertoCheckout,
    checkoutViewProps,
    enviarCodigoEmail,
    checkoutHayRechazoServidor,
    procesandoPagoCheckout,
    sincronizarCarritoAlEntrarVista
  } = checkoutState;

  const adminState = useMaikaAdmin({
    pedidos,
    setPedidos,
    cart,
    velas,
    inciensos,
    figuras,
    kits,
    joyas,
    umbralStockBajo,
    listaUsuarios,
    accesoAdmin,
    setAccesoAdmin,
    mostrarNotificacion,
    onAbrirFacturaPedido,
    navigate,
    locationPathname: location.pathname
  });

  const {
    pedidosPendientes,
    pedidosEnviados,
    pedidosEntregados,
    pedidosPendientesOrdenados,
    pedidosEnviadosOrdenados,
    pedidosEntregadosOrdenados,
    busquedaPedido,
    setBusquedaPedido,
    pendientesAbierto,
    setPendientesAbierto,
    enviadosAbierto,
    setEnviadosAbierto,
    entregadosAbierto,
    setEntregadosAbierto,
    metrics,
    renderCajaPedidos,
    pulseAnimationStyle,
    esAdmin,
    adminUltimoLoginTexto,
    adminAhoraTexto
  } = adminState;

  const abrirTiendaConCategoria = useCallback((categoria: string) => {
    setCategoriaTiendaAlAbrir(categoria);
    setPagina("tienda");
  }, [setPagina]);

  const esAppNativa = Capacitor.isNativePlatform();

  useAppBootstrapStorage({
    esAppNativa,
    setConsentimientoCookies: chromeState.setConsentimientoCookies,
    setRecordarDatosInvitado: checkoutState.setRecordarDatosInvitado,
    setUmbralStockBajo,
    setNotaPedidoEnvio,
    setDesplegableInicio,
    setServiciosInicio,
    setMostrarAvisoCookies: chromeState.setMostrarAvisoCookies
  });

  useEffect(() => {
    if (pagina !== "editarProductos") return;
    const list =
      categoriaEditarProductos === "velas" ? velas :
      categoriaEditarProductos === "inciensos" ? inciensos :
      categoriaEditarProductos === "figuras" ? figuras :
      joyas;
    const first = list[0];
    if (first) {
      setProductoSeleccionado(`${categoriaEditarProductos}-${first.id}`);
      setTamanoProducto(String(first.nombreTamano ?? 22));
      setColorProducto(first.nombreColor ?? "#ffffff");
      setEstiloTextoProducto(first.nombreEstilo ?? "normal");
      setPreviewProducto(first.imagen ? first.imagen : null);
      setNombreImagenProducto("");
    }
  }, [pagina, categoriaEditarProductos, velas, inciensos, figuras, joyas]);

  const hayModalAbierto = hayModalAbiertoCheckout || loginModalAbierto || modalEditarUsuarioAbierto;
  useBodyClassModalOpen(hayModalAbierto);

  const getCuponesDisponibles = useCallback(
    (): Record<string, { tipo: "porcentaje" | "envio_gratis"; valor: number }> =>
      getCuponesDisponiblesStorage(
        CUPONES_MAIKA_KEY,
        CUPONES_DISPONIBLES as Record<string, { tipo: "porcentaje" | "envio_gratis"; valor: number }>
      ),
    []
  );

  // Al abrir la página de cupones, cargar desde localStorage para que "Guardar cambios" y el 30% se mantengan tras recargar/resetear.
  useEffect(() => {
    if (pagina !== "editarCupones") return;
    setCuponesAdmin(getCuponesDisponibles());
  }, [pagina, getCuponesDisponibles]);

  const buscarPedido = useCallback(() => {
    if (!numeroSeguimiento.trim()) {
      notificarError(mostrarNotificacion, "Introduce un número de pedido");
      return;
    }

    const encontrado = pedidos.find((p) => p.numero === numeroSeguimiento);
    setPedidoBuscado(encontrado || null);

    if (!encontrado) {
      notificarError(mostrarNotificacion, "Pedido no encontrado");
    }
  }, [numeroSeguimiento, pedidos, mostrarNotificacion]);

  const volverATienda = useCallback(() => {
    preloadTiendaOnce();
    setPagina("tienda");
  }, [setPagina]);

  const onPrefetchPagina = useCallback((p: Pagina) => {
    if (p === "tienda") preloadTiendaOnce();
    if (p === "carrito") preloadCarritoOnce();
    if (p === "admin") preloadAdminOnce();
    if (p === "cuenta") preloadCuentaOnce();
    if (p === "seguimiento") preloadSeguimientoOnce();
  }, []);

  const routingPack = useMemo(() => ({ setPagina }), [setPagina]);

  const adminPack = useMemo(
    () => ({
      esAdmin,
      accesoAdmin,
      claveAdmin,
      setClaveAdmin,
      setAccesoAdmin,
      adminUltimoLoginTexto,
      adminAhoraTexto
    }),
    [
      esAdmin,
      accesoAdmin,
      claveAdmin,
      setClaveAdmin,
      setAccesoAdmin,
      adminUltimoLoginTexto,
      adminAhoraTexto
    ]
  );

  const chromeRoutesPack = useMemo(() => ({ mostrarNotificacion }), [mostrarNotificacion]);

  const checkoutRoutesPack = useMemo(
    () => ({ pedidos, handleRepetirPedido, enviarCodigoEmail }),
    [pedidos, handleRepetirPedido, enviarCodigoEmail]
  );

  const sesionRoutesPack = useMemo(
    () => ({
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
      precargarDatosClienteDesdeUsuario,
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
      guardarEdicionUsuario
    }),
    [
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
      precargarDatosClienteDesdeUsuario,
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
      guardarEdicionUsuario
    ]
  );

  const tiendaRoutesPack = useMemo(
    () => ({
      categoriasCatalogo,
      setCategoriasCatalogo,
      subcategoriasCatalogo,
      setSubcategoriasCatalogo,
      subcategoriasDe,
      agregarSubcategoria,
      renombrarSubcategoria,
      eliminarSubcategoria,
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
    }),
    [
      categoriasCatalogo,
      setCategoriasCatalogo,
      subcategoriasCatalogo,
      setSubcategoriasCatalogo,
      subcategoriasDe,
      agregarSubcategoria,
      renombrarSubcategoria,
      eliminarSubcategoria,
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
    ]
  );

  const routesProps = useShellRoutesProps(
    routingPack,
    adminPack,
    chromeRoutesPack,
    checkoutRoutesPack,
    sesionRoutesPack,
    tiendaRoutesPack
  );

  const contextInput = useMemo(
    () =>
      packAppContextInput({
        nav: { setPagina, abrirTiendaConCategoria },
        catalogo: { velas, inciensos, figuras, kits, joyas, categoriasCatalogo, subcategoriasCatalogo },
        carrito: {
          agregarAlCarrito,
          cart,
          total,
          totalItemsCarrito,
          precioItemCarrito,
          cambiarCantidad,
          eliminarProductoCarrito,
          volverATienda,
          vaciarCarrito,
          finalizarCarrito,
          sincronizarCarritoAlEntrarVista,
          checkoutHayRechazoServidor,
          procesandoPagoCheckout,
          envioPreview,
          totalPreview,
          generarNumeroPedido,
          setNumeroPedidoPreview,
          setFormPedidoAbierto
        },
        usuario: { precargarDatosClienteDesdeUsuario, usuario, perfilCompraRapida, comprarEnUnClick },
        seguimiento: { numeroSeguimiento, setNumeroSeguimiento, buscarPedido, pedidoBuscado },
        adminPedidos: {
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
          setPedidoFacturaAbierto: onAbrirFacturaPedido,
          pedidos
        },
        tiendaBusqueda: {
          categoriaTiendaAlAbrir,
          setCategoriaTiendaAlAbrir,
          busquedaTienda,
          setBusquedaTienda
        },
        inicio: { desplegableInicio, setDesplegableInicio, serviciosInicio, setServiciosInicio },
        chrome: { mostrarNotificacion, authHydrated }
      }),
    [
      setPagina,
      abrirTiendaConCategoria,
      velas,
      inciensos,
      figuras,
      kits,
      joyas,
      categoriasCatalogo,
      subcategoriasCatalogo,
      agregarAlCarrito,
      cart,
      total,
      totalItemsCarrito,
      precioItemCarrito,
      cambiarCantidad,
      eliminarProductoCarrito,
      volverATienda,
      vaciarCarrito,
      finalizarCarrito,
      sincronizarCarritoAlEntrarVista,
      checkoutHayRechazoServidor,
      procesandoPagoCheckout,
      envioPreview,
      totalPreview,
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
      onAbrirFacturaPedido,
      pedidos,
      categoriaTiendaAlAbrir,
      setCategoriaTiendaAlAbrir,
      busquedaTienda,
      setBusquedaTienda,
      desplegableInicio,
      setDesplegableInicio,
      serviciosInicio,
      setServiciosInicio,
      mostrarNotificacion,
      authHydrated
    ]
  );

  const appContextValue = useAppContextValue(contextInput);

  if (!authHydrated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 24,
          boxSizing: "border-box",
          textAlign: "center",
          background: `linear-gradient(165deg, ${THEME.bg} 0%, #1a1538 45%, #12102a 100%)`,
          color: "#e8e4dc",
          fontFamily: "system-ui, sans-serif"
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600, color: THEME.goldMain }}>MAIKA</div>
        <div style={{ fontSize: 15, lineHeight: 1.45, maxWidth: 320 }}>
          Conectando con tu cuenta…
        </div>
        <div style={{ fontSize: 13, opacity: 0.75, maxWidth: 320 }}>
          Si tarda, comprobamos el servidor; en unos segundos podrás seguir comprando.
        </div>
      </div>
    );
  }

  const esInventarioAdmin = location.pathname === "/admin/inventario";
  const esPanelAdminPrincipal = location.pathname === "/admin";
  const esConfigMetricasAdmin = location.pathname === "/admin/configuracion-metricas";
  const esSeguimientoAdmin = location.pathname === "/seguimiento" && accesoAdmin;
  const esInterpretacionSuenos = location.pathname === "/suenos" || location.pathname === "/sueno-premium";
  const esLectura = location.pathname === "/lectura";
  const esHoroscopos = location.pathname === "/horoscopos";
  const esVistaSoloFondoEstrellas =
    location.pathname === "/" && esVistaFondoEstrellasSoloEmbebida(location.search);

  return (
    <Layout
      pulseStyle={pulseAnimationStyle}
      fullBleedTop={location.pathname === "/"}
      fullBleedX={esLectura || esHoroscopos}
      tiendaShellScroll={esRutaVistaTiendaShellScroll(location.pathname)}
      adminPanelScroll={
        esPanelAdminPrincipal ||
        esConfigMetricasAdmin ||
        esSeguimientoAdmin ||
        esInterpretacionSuenos
      }
      inventarioAdminSinNav={esInventarioAdmin}
    >
      <AppProvider value={appContextValue}>
      {!esVistaSoloFondoEstrellas ? (
      <AppTopChrome
        omitirNavPrincipal={esInventarioAdmin}
        pagina={pagina}
        setPagina={setPagina}
        mostrarAvisoCookies={mostrarAvisoCookies}
        bgColor={THEME.bg}
        goldColor={THEME.goldMain}
        mostrarConfigCookies={mostrarConfigCookies}
        consentimientoCookies={consentimientoCookies}
        notificacion={notificacion}
        onPrefetchPagina={onPrefetchPagina}
        onTerminarCompra={() => finalizarCarrito()}
        onAbrirPoliticaCookies={() => setPagina("legalCookies")}
        onRechazarOpcionales={rechazarCookiesOpcionales}
        onToggleConfigCookies={toggleMostrarConfigCookies}
        onAceptarTodasCookies={aceptarCookies}
        onCerrarConfigCookies={cerrarConfigCookies}
        onGuardarPreferenciasCookies={guardarPreferenciasCookiesPanel}
        onUpdatePreferencias={onUpdatePreferencias}
        onUpdateAnaliticas={onUpdateAnaliticas}
        onUpdateMarketing={onUpdateMarketing}
        onCerrarNotificacion={cerrarNotificacion}
      />
      ) : null}
      {authPerfilSync.estado === "desactualizado" ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: "calc(var(--app-topbar-stack, 72px) + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9998,
            width: "min(520px, calc(100vw - 24px))",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "8px 10px",
            borderRadius: 999,
            border: "1px solid rgba(212, 175, 55, 0.45)",
            background: "rgba(10, 7, 24, 0.94)",
            color: "#f5e6a3",
            fontSize: 12,
            lineHeight: 1.25,
            backdropFilter: "blur(10px)"
          }}
        >
          <span style={{ minWidth: 0 }}>
            Sin conexión. Mostrando datos guardados.{" "}
            {authPerfilSync.reintentando ? "Reintentando..." : "Reintentando en breve..."}
          </span>
          <button
            type="button"
            onClick={reintentarPerfilAhora}
            disabled={authPerfilSync.reintentando}
            style={{
              flexShrink: 0,
              border: "1px solid rgba(212, 175, 55, 0.55)",
              borderRadius: 999,
              background: authPerfilSync.reintentando ? "rgba(255,255,255,0.08)" : "rgba(212, 175, 55, 0.16)",
              color: "#f5e6a3",
              padding: "5px 9px",
              fontSize: 12,
              fontWeight: 700,
              cursor: authPerfilSync.reintentando ? "not-allowed" : "pointer"
            }}
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {/* PÁGINAS: crece en columna (ver `.app-shell__routes-grow` en layout-responsive.css) */}
      <div className="app-shell__routes-grow">
        <AppRoutes {...routesProps} />
      </div>

      <CheckoutView {...checkoutViewProps} />

      </AppProvider>
    </Layout>
  );
}
