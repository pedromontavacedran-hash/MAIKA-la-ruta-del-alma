import { useState, useMemo, useCallback, useEffect } from "react";
import "./App.css";
import { Capacitor } from "@capacitor/core";
import CheckoutView from "./app/views/CheckoutView";
import AppTopChrome from "./components/AppTopChrome";
import Layout from "./components/Layout";
import MaikaHydratingScreen from "./components/MaikaHydratingScreen";
import PerfilSyncOfflineBanner from "./components/PerfilSyncOfflineBanner";
import { AppProvider } from "./context/AppContext";
import type { Pagina, Pedido, Producto } from "./types";
import {
  QUICK_CHECKOUT_KEY,
  NOTA_PEDIDO_ENVIO_DEFAULT,
  DESPLEGABLE_INICIO_DEFAULT,
  SERVICIOS_INICIO_DEFAULT,
  type ServicioInicio,
  THEME
} from "./config";
import { useCatalogoMaika } from "./hooks/useCatalogoMaika";
import { useCategorias } from "./hooks/useCategorias";
import { useSubcategorias } from "./hooks/useSubcategorias";
import { useCarrito } from "./hooks/useCarrito";
import { usePedidosMaika } from "./hooks/usePedidosMaika";
import { usePerfilCompraRapida } from "./hooks/usePerfilCompraRapida";
import { useAppContextValue } from "./app/hooks/useAppContextValue";
import { generarNumeroPedido } from "./utils/appIdentity";
import { getUsuarioId } from "./utils/usuarioId";
import { hasClientSession } from "./services/apiAuth";
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
import { useSesionRoutesPack, useTiendaRoutesPack } from "./app/hooks/useShellRoutesPacks";
import { packAppContextInput } from "./app/context/packAppContextInput";
import { useAppRouting } from "./app/hooks/useAppRouting";
import { useAppBootstrapStorage } from "./app/hooks/useAppBootstrapStorage";
import { useBodyClassModalOpen } from "./app/hooks/useBodyClassModalOpen";
import { useMaikaCheckout } from "./app/hooks/useMaikaCheckout";
import { useMaikaAdmin } from "./app/hooks/useMaikaAdmin";
import { useMaikaChrome } from "./app/hooks/useMaikaChrome";
import { useMaikaSesionUsuarios } from "./app/hooks/useMaikaSesionUsuarios";
import { useMaikaShellEffects } from "./app/hooks/useMaikaShellEffects";
import { useAdminProductosEditState } from "./app/hooks/useAdminProductosEditState";
import type { CuponesAdminMap } from "./app/hooks/useMaikaShellEffects";
import { esVistaFondoEstrellasSoloEmbebida } from "./utils/fondoEstrellasPreviewEmbed";
import { esRutaVistaTiendaShellScroll } from "./utils/maikaScrollPort";
import { getAdminLastLoginMs, isAdminAuthorized } from "./utils/adminAuth";
import { leerEstadoWeb, type WebEstado } from "./services/apiWebEstado";
import WebCerradaPage from "./components/WebCerradaPage";

export default function MaikaAppShell() {
  const { navigate, location, pagina, modoDireccionCheckout, setPagina } = useAppRouting();

  const chromeState = useMaikaChrome();
  const {
    notificacion,
    mostrarNotificacion,
    mostrarAvisoCookies,
    aceptarCookies,
    cerrarNotificacion
  } = chromeState;

  const categorias = useCategorias();
  const { loadCategoryImage, categoriaSeleccionada } = categorias;

  const subcategorias = useSubcategorias();

  const catalogo = useCatalogoMaika();
  const {
    velas,
    inciensos,
    figuras,
    kits,
    joyas,
    precioCatalogoPorId,
    precioItemCarrito,
    normalizarItemCarrito,
    aplicarCatalogoActualizado
  } = catalogo;

  const sesionState = useMaikaSesionUsuarios({
    pathname: location.pathname,
    setPagina,
    mostrarNotificacion,
    navigate
  });
  const {
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
    setModoRegistro,
    getUsuarioCanonico,
    authPerfilSync,
    reintentarPerfilAhora,
    iniciarSesionConToken,
    listaUsuarios,
    modalEditarUsuarioAbierto,
    proyectarUsuariosDesdeMaika,
    leerMaikaUsuarios,
    guardarMaikaUsuarios,
    setTelefonoForzadoRegistroDesdeAcceso,
    setModoForzadoRegistroDesdeAcceso,
    setConfirmacionIdentidadActivacion,
    setFormAuth
  } = sesionState;

  const carritoIdentityKey = useMemo(() => {
    if (!authHydrated) return null;
    if (usuario?.id != null && String(usuario.id).trim() !== "") {
      return `user_${String(usuario.id).trim()}`;
    }
    return getUsuarioId();
  }, [authHydrated, usuario?.id]);

  /** Misma idea que el carrito: recargar pedidos al hidratar usuario o cambiar sesión. */
  const pedidosSyncKey: string | null = !authHydrated
    ? null
    : !hasClientSession()
      ? "local"
      : usuario?.id != null && String(usuario.id).trim() !== ""
        ? `user_${String(usuario.id).trim()}`
        : "jwt";

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

  const productosEdit = useAdminProductosEditState({
    pagina,
    categoriaSeleccionada,
    loadCategoryImage,
    velas,
    inciensos,
    figuras,
    joyas
  });

  const [claveAdmin, setClaveAdmin] = useState("");
  const [accesoAdmin, setAccesoAdmin] = useState(false);
  const [numeroSeguimiento, setNumeroSeguimiento] = useState("");
  const [pedidoBuscado, setPedidoBuscado] = useState<Pedido | null>(null);

  const { pedidos, setPedidos } = usePedidosMaika(pedidosSyncKey);

  const [cuponesAdmin, setCuponesAdmin] = useState<CuponesAdminMap>({});
  const [umbralStockBajo, setUmbralStockBajo] = useState(2);
  const [notaPedidoEnvio, setNotaPedidoEnvio] = useState(NOTA_PEDIDO_ENVIO_DEFAULT);
  const [desplegableInicio, setDesplegableInicio] = useState(DESPLEGABLE_INICIO_DEFAULT);
  const [serviciosInicio, setServiciosInicio] = useState<ServicioInicio[]>(SERVICIOS_INICIO_DEFAULT);
  const [categoriaTiendaAlAbrir, setCategoriaTiendaAlAbrir] = useState<string | null>(null);
  const [productoTiendaAlAbrir, setProductoTiendaAlAbrir] = useState<Producto | null>(null);
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
    renderCajaPedidos,
    pulseAnimationStyle,
    esAdmin,
    adminUltimoLoginTexto,
    adminAhoraTexto
  } = adminState;

  const { getCuponesDisponibles } = useMaikaShellEffects({
    pathname: location.pathname,
    pagina,
    mostrarNotificacion,
    accesoAdmin,
    setAccesoAdmin,
    totalItemsCarrito,
    cuponesAdmin,
    setCuponesAdmin,
    desplegableInicio,
    setDesplegableInicio,
    serviciosInicio,
    setServiciosInicio,
    umbralStockBajo,
    setUmbralStockBajo,
    notaPedidoEnvio,
    setNotaPedidoEnvio
  });

  const abrirTiendaConCategoria = useCallback((categoria: string) => {
    setCategoriaTiendaAlAbrir(categoria);
    setPagina("tienda");
  }, [setPagina]);

  const abrirTiendaConProducto = useCallback((producto: Producto) => {
    setProductoTiendaAlAbrir(producto);
    setPagina("tienda");
  }, [setPagina]);

  const esAppNativa = Capacitor.isNativePlatform();

  /** Interruptor web abierta/cerrada (panel admin). null = aún sin respuesta del servidor → abierta. */
  const [webEstado, setWebEstado] = useState<WebEstado | null>(null);
  useEffect(() => {
    let cancelado = false;
    void leerEstadoWeb().then((e) => {
      if (!cancelado) setWebEstado(e);
    });
    return () => {
      cancelado = true;
    };
  }, []);

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

  const hayModalAbierto = hayModalAbiertoCheckout || loginModalAbierto || modalEditarUsuarioAbierto;
  useBodyClassModalOpen(hayModalAbierto);

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
    () => ({ pedidos, handleRepetirPedido }),
    [pedidos, handleRepetirPedido]
  );

  const sesionRoutesPack = useSesionRoutesPack(sesionState);
  const tiendaRoutesPack = useTiendaRoutesPack({
    categorias,
    subcategorias,
    catalogo,
    productosEdit,
    admin: adminState,
    umbralStockBajo,
    setUmbralStockBajo,
    desplegableInicio,
    setDesplegableInicio,
    serviciosInicio,
    setServiciosInicio,
    notaPedidoEnvio,
    setNotaPedidoEnvio,
    getCuponesDisponibles,
    setCuponesAdmin,
    cuponesAdmin
  });

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
        nav: { setPagina, abrirTiendaConCategoria, abrirTiendaConProducto },
        catalogo: { velas, inciensos, figuras, kits, joyas, categoriasCatalogo: categorias.categoriasCatalogo, subcategoriasCatalogo: subcategorias.subcategoriasCatalogo },
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
          productoTiendaAlAbrir,
          setProductoTiendaAlAbrir,
          busquedaTienda,
          setBusquedaTienda
        },
        inicio: { desplegableInicio, setDesplegableInicio, serviciosInicio, setServiciosInicio },
        chrome: { mostrarNotificacion, authHydrated }
      }),
    [
      setPagina,
      abrirTiendaConCategoria,
      abrirTiendaConProducto,
      velas,
      inciensos,
      figuras,
      kits,
      joyas,
      categorias.categoriasCatalogo,
      subcategorias.subcategoriasCatalogo,
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
      productoTiendaAlAbrir,
      setProductoTiendaAlAbrir,
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
    return <MaikaHydratingScreen />;
  }

  /** Web cerrada: visitantes ven «Estamos cerrados». El admin entra por /admin con su clave y ve todo.
   *  Si este navegador ya inició sesión admin alguna vez (getAdminLastLoginMs), no se le muestra la
   *  página de cerrado aunque la sesión haya caducado: la seguridad real la impone el servidor (JWT). */
  if (
    webEstado?.cerrada &&
    !accesoAdmin &&
    !isAdminAuthorized() &&
    !getAdminLastLoginMs() &&
    !location.pathname.startsWith("/admin")
  ) {
    return <WebCerradaPage mensaje={webEstado.mensaje} />;
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
      <a href="#maika-contenido" className="maika-skip-link">Saltar al contenido</a>
      {!esVistaSoloFondoEstrellas ? (
      <AppTopChrome
        omitirNavPrincipal={esInventarioAdmin}
        pagina={pagina}
        setPagina={setPagina}
        mostrarAvisoCookies={mostrarAvisoCookies}
        bgColor={THEME.bg}
        goldColor={THEME.goldMain}
        notificacion={notificacion}
        onPrefetchPagina={onPrefetchPagina}
        onTerminarCompra={() => finalizarCarrito()}
        onAbrirPoliticaCookies={() => setPagina("legalCookies")}
        onAceptarCookies={aceptarCookies}
        onCerrarNotificacion={cerrarNotificacion}
      />
      ) : null}
      {authPerfilSync.estado === "desactualizado" ? (
        <PerfilSyncOfflineBanner
          reintentando={authPerfilSync.reintentando}
          onReintentar={reintentarPerfilAhora}
        />
      ) : null}

      {/* PÁGINAS: crece en columna (ver `.app-shell__routes-grow` en layout-responsive.css) */}
      <div id="maika-contenido" role="main" tabIndex={-1} className="app-shell__routes-grow">
        <AppRoutes {...routesProps} />
      </div>

      <CheckoutView {...checkoutViewProps} />

      </AppProvider>
    </Layout>
  );
}
