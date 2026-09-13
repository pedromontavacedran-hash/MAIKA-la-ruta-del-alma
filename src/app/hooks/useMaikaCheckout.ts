import { useState, useRef, useCallback, useEffect, type Dispatch, type SetStateAction } from "react";
import { flushSync } from "react-dom";
import type { Location, NavigateFunction } from "react-router-dom";
import { useCheckoutDireccionFlow } from "../../checkout/hooks/useCheckoutDireccionFlow";
import { useCheckoutResumen } from "../../checkout/hooks/useCheckoutResumen";
import { useAccesoRapidoCheckout } from "../../checkout/hooks/useAccesoRapidoCheckout";
import { useCheckoutMaika } from "../../checkout/hooks/useCheckoutMaika";
import { useIrAlPagoCheckout } from "../../checkout/hooks/useIrAlPagoCheckout";
import { useCompraRapida } from "../../hooks/useCompraRapida";
import { useCheckoutFlow } from "../../hooks/useCheckoutFlow";
import { useAvisoTelefonoRegistradoCheckout } from "./useAvisoTelefonoRegistradoCheckout";
import { useRecordarDatosInvitadoPersistence } from "./useRecordarDatosInvitadoPersistence";
import { buildCheckoutViewPropsFromPack } from "../checkout/packCheckoutViewAppInput";
import type { ConstruirOrquestarEnvioPedidoWhatsAppInput } from "../../checkout/ui/construirOrquestarEnvioPedidoWhatsAppDeps";
import type {
  Usuario,
  ItemCarrito,
  Producto,
  CuponAplicado,
  AuthForm,
  Cliente,
  Pagina,
  Pedido
} from "../../types";
import type { PerfilCompraRapida } from "../../types";
import type { CatalogoActualizadoCheckout } from "../../checkout/enviarPedidoWhatsApp";
import { inputStyle } from "../../styles/inputStyle";
import {
  CARRITO_KEY,
  EMAILJS_CONFIG,
  GUEST_CART_PENDING_KEY,
  CUPONES_DISPONIBLES,
  CUPONES_MAIKA_KEY,
  THEME
} from "../../config";
import { parseFechaPedido } from "../../utils/fechaPedido";
import { normalizarCodigoCupon } from "../../utils/appCoreUtils";
import { claveTelefonoES, normalizarTelefonoES9 } from "../../utils/telefono";
import {
  getCuponesDisponibles as getCuponesDisponiblesStorage,
  resolverCuponAplicable
} from "../../utils/cupones";
import { normalizarTelefonoBizum } from "../../utils/pago";
import { enviarCodigoEmail as enviarCodigoEmailUtil } from "../../utils/emailCodigo";
import { hasClientSession } from "../../services/apiAuth";
import { enmascararEmail } from "../../utils/accesoRapidoUtils";
import { direccionesDesdePedidosMaikaLegacy } from "../../utils/direccionesHistorialPedidosMaika";
import {
  emailRegistradoUnificadoParaTel9 as emailRegistradoDesdeMaikaUsuarios,
  findMaikaUsuarioPorTel9 as findMaikaUsuarioPorTel9Storage,
  telefonoTieneActividadSinEmail as telefonoTieneActividadSinEmailUtil,
  type MaikaUsuarioLS
} from "../../utils/maikaUsuarios";
import {
  construirItemsDesdeProductos as construirItemsDesdeProductosUtil,
  leerMaikaPedidos as leerMaikaPedidosStorage,
  obtenerCodigoUltimoPedidoPorTel9 as obtenerCodigoUltimoPedidoPorTel9Util,
  sumarPedidoAlCarrito as sumarPedidoAlCarritoUtil,
  type MaikaPedidoProductoLS,
  type MaikaPedidoLS
} from "../../utils/maikaPedidos";
import { notificarError, notificarExito } from "../../utils/ui/notificaciones";
import { loadCuentaPage } from "../routing/lazyPages";
import { DIRECCIONES_MAX, PATH_BY_PAGINA } from "../routing/routeMaps";
import { guardarCarritoApi } from "../../services/apiCarrito";
import { fetchCatalogoCuatroListasDesdeApi } from "../../services/apiProductos";
import { getUsuarioId } from "../../utils/usuarioId";
import {
  limpiarYRecortarCarritoConCatalogo,
  MSJ_PRODUCTO_ELIMINADO_SIN_STOCK,
  MSJ_PRODUCTOS_ELIMINADOS_SIN_STOCK,
  MSJ_RECORTE_CANTIDAD_STOCK
} from "../../checkout/utils/limpiarYRecortarCarritoConCatalogo";
import {
  validarCarritoAntesCheckout,
  MENSAJE_CARRITO_VACIO_PRE_CHECKOUT
} from "../../checkout/utils/validarCarritoAntesCheckout";
import type { CatalogoCuatroListas } from "../../checkout/core/restarStockCatalogo";

export type UseMaikaCheckoutInput = {
  navigate: NavigateFunction;
  location: Location;
  modoDireccionCheckout: boolean;
  setPagina: (p: Pagina) => void;
  datosCliente: Cliente;
  setDatosCliente: Dispatch<SetStateAction<Cliente>>;
  usuario: Usuario | null;
  setUsuario: Dispatch<SetStateAction<Usuario | null>>;
  iniciarSesionConToken: (token: string, opts?: { mostrarBienvenida?: boolean }) => Promise<Usuario | null>;
  authHydrated: boolean;
  precargarDatosClienteDesdeUsuario: (u: Usuario | null) => void;
  resetCliente: () => void;
  mostrarNotificacion: (mensaje: string, tipo: "normal" | "exito" | "error") => void;
  leerMaikaUsuarios: () => MaikaUsuarioLS[];
  guardarMaikaUsuarios: (u: MaikaUsuarioLS[]) => void;
  getUsuarioCanonico: () => Promise<Usuario | null>;
  proyectarUsuariosDesdeMaika: (u: MaikaUsuarioLS[]) => Usuario[];
  cart: ItemCarrito[];
  setCart: Dispatch<SetStateAction<ItemCarrito[]>>;
  total: number;
  getStockProducto: (id: number) => number;
  normalizarItemCarrito: (item: ItemCarrito) => ItemCarrito;
  velas: Producto[];
  inciensos: Producto[];
  figuras: Producto[];
  kits: Producto[];
  joyas: Producto[];
  precioItemCarrito: (item: ItemCarrito) => number;
  aplicarCatalogoActualizado: (patch: CatalogoActualizadoCheckout) => void;
  setPedidos: Dispatch<SetStateAction<Pedido[]>>;
  setAuthHydrated: (v: boolean) => void;
  perfilCompraRapida: PerfilCompraRapida | null;
  setPerfilCompraRapida: Dispatch<SetStateAction<PerfilCompraRapida | null>>;
  loginModalAbierto: boolean;
  setLoginModalAbierto: (v: boolean) => void;
  setModoRegistro: (m: "login" | "register") => void;
  setTelefonoForzadoRegistroDesdeAcceso: Dispatch<SetStateAction<string>>;
  setModoForzadoRegistroDesdeAcceso: Dispatch<SetStateAction<"" | "registro" | "activar">>;
  setConfirmacionIdentidadActivacion: Dispatch<SetStateAction<boolean>>;
  setFormAuth: Dispatch<SetStateAction<AuthForm>>;
  notaPedidoEnvio: string;
};

export function useMaikaCheckout(p: UseMaikaCheckoutInput) {
  const {
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
  } = p;

  /** Carrito visto por el motor de checkout: se iguala a `cart` cada render y se escribe dentro del `setCart` de la sync (antes de que termine el render). */
  const motorCartRef = useRef<ItemCarrito[]>(cart);
  motorCartRef.current = cart;

  /** Tras `origen: "rechazo_servidor"`, al cerrar el modal: vaciar carrito, limpiar error y volver a la tienda. */
  const checkoutRechazoServidorRef = useRef(false);
  const [checkoutHayRechazoServidor, setCheckoutHayRechazoServidor] = useState(false);
  const onMarcarCheckoutErrorRechazoServidor = useCallback((es: boolean) => {
    checkoutRechazoServidorRef.current = es;
    setCheckoutHayRechazoServidor(es);
  }, []);

  const [formPedidoAbierto, setFormPedidoAbierto] = useState(false);
  /**
   * Al abrir el modal de login (transición cerrado→abierto), guardamos si el formulario de finalizar compra estaba visible.
   * Así, tras iniciar sesión, no dependemos de un `formPedidoAbierto` que a veces queda en falso un instante (sync carrito / identidad)
   * y evitamos el ramal que llama a `finalizarCarrito()` con validación → sensación de «me devolvió al carrito» sin el checkout.
   */
  const loginModalEstabaAbiertoRef = useRef(false);
  const checkoutVisibleAlAbrirLoginRef = useRef(false);
  const [pasoFinalizarCompra, setPasoFinalizarCompra] = useState<"datos" | "confirmarDireccion" | "pago">("datos");
  const [pedidoRealizado, setPedidoRealizado] = useState(false);
  const pedidoRealizadoRef = useRef(false);
  pedidoRealizadoRef.current = pedidoRealizado;
  /**
   * `true` desde checkout OK hasta que el usuario cierra el modal de éxito (no solo “una sync”):
   * si no, una segunda sync en paralelo veía ref ya a false y `pedidoRealizado` aún no commiteado → toast falso de “sin stock”.
   */
  const silenciarAvisosLimpiezaCarritoStockTrasCompraOkRef = useRef(false);
  const pedidoRealizadoPrevioParaSilencioRef = useRef(false);
  /** Se actualiza tras `useCheckoutFlow`; la sync lee `.current` al ejecutarse (no al crear el callback). */
  const procesandoPagoCheckoutRef = useRef(false);
  const [urlWhatsAppPendiente, setUrlWhatsAppPendiente] = useState<string | null>(null);
  const [numeroPedidoPreview, setNumeroPedidoPreview] = useState<string | null>(null);
  const [ultimoPedidoNumero, setUltimoPedidoNumero] = useState<string | null>(null);
  const [mensajeErrorCheckoutPago, setMensajeErrorCheckoutPagoRaw] = useState<string | null>(null);
  /** Al limpiar el mensaje (reintento, volver de paso, éxito) se baja el flag de rechazo para carrito + modal. */
  const setMensajeErrorCheckoutPago = useCallback((v: string | null) => {
    setMensajeErrorCheckoutPagoRaw(v);
    if (v == null) {
      checkoutRechazoServidorRef.current = false;
      setCheckoutHayRechazoServidor(false);
    }
  }, []);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [confirmacionBizumOtroNumeroAbierto, setConfirmacionBizumOtroNumeroAbierto] = useState(false);
  const bizumConfirmadoRef = useRef(false);

  const [metodoPago, setMetodoPago] = useState<"bizum" | "tarjeta">("bizum");
  const [datosPago, setDatosPago] = useState({
    bizumTelefono: ""
  });

  const [modalRepeatPedidoAbierto, setModalRepeatPedidoAbierto] = useState(false);
  const [pedidoRepeatSeleccionado, setPedidoRepeatSeleccionado] = useState<MaikaPedidoLS | null>(null);
  const [avisoTelefonoCheckout, setAvisoTelefonoCheckout] = useState<
    { encontrado: boolean; texto: string; origen?: "local" } | null
  >(
    null
  );
  const [cuponInput, setCuponInput] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState<CuponAplicado | null>(null);
  const [cuponError, setCuponError] = useState<string | null>(null);
  const [mostrarInputCuponCheckout, setMostrarInputCuponCheckout] = useState(false);

  /** Bloqueo del CTA datos → confirmar dirección (evita doble envío); debe liberarse siempre al soltar el puntero o si falla validación. */
  const [checkoutIrAlPagoGesturaActiva, setCheckoutIrAlPagoGesturaActiva] = useState(false);
  const onCheckoutIrAlPagoGesturaFin = useCallback(() => setCheckoutIrAlPagoGesturaActiva(false), []);
  const onCheckoutIrAlPagoGesturaInicio = useCallback(() => setCheckoutIrAlPagoGesturaActiva(true), []);

  const [recordarDatosInvitado, setRecordarDatosInvitado] = useState(false);
  const [telefonoCheckoutValidPulse, setTelefonoCheckoutValidPulse] = useState(false);

  const [pedidoFacturaAbierto, setPedidoFacturaAbierto] = useState<Pedido | null>(null);

  type PreCheckoutCarritoAvisoState = {
    titulo: string;
    mensaje: string;
    detalle: string;
    textoBoton: string;
    irTiendaAlConfirmar: boolean;
    /** Si existe, segunda acción “solo cerrar” (sin navegar) + la X del modal usa el mismo cierre. */
    textoBotonSecundario?: string;
  };
  const [preCheckoutCarritoAviso, setPreCheckoutCarritoAviso] = useState<PreCheckoutCarritoAvisoState | null>(null);
  const preCheckoutCarritoAvisoRef = useRef<PreCheckoutCarritoAvisoState | null>(null);
  preCheckoutCarritoAvisoRef.current = preCheckoutCarritoAviso;

  const cerrarPreCheckoutCarritoAviso = useCallback(() => {
    const snap = preCheckoutCarritoAvisoRef.current;
    setPreCheckoutCarritoAviso(null);
    if (snap?.irTiendaAlConfirmar) {
      setPagina("tienda");
      navigate(PATH_BY_PAGINA.tienda, { replace: true });
    }
  }, [navigate, setPagina]);

  const cerrarPreCheckoutCarritoAvisoSinNavegar = useCallback(() => {
    setPreCheckoutCarritoAviso(null);
  }, []);

  useRecordarDatosInvitadoPersistence({
    recordarDatosInvitado,
    usuario,
    setPerfilCompraRapida
  });

  useEffect(() => {
    if (pedidoRealizadoPrevioParaSilencioRef.current && !pedidoRealizado) {
      silenciarAvisosLimpiezaCarritoStockTrasCompraOkRef.current = false;
    }
    pedidoRealizadoPrevioParaSilencioRef.current = pedidoRealizado;
  }, [pedidoRealizado]);

  useEffect(() => {
    if (loginModalAbierto && !loginModalEstabaAbiertoRef.current) {
      checkoutVisibleAlAbrirLoginRef.current = formPedidoAbierto;
    }
    loginModalEstabaAbiertoRef.current = loginModalAbierto;
  }, [loginModalAbierto, formPedidoAbierto]);

  const inputCalleCheckoutRef = useRef<HTMLInputElement>(null);
  const inputTelefonoCheckoutRef = useRef<HTMLInputElement>(null);
  const textareaNotasCheckoutRef = useRef<HTMLTextAreaElement>(null);
  const botonIrAlPagoRef = useRef<HTMLButtonElement>(null);
  const irAlPagoPointerIdRef = useRef<number | null>(null);
  const irAlPagoEjecutarRef = useRef<() => void>(() => {});
  const telefonoCheckoutValidoPrevRef = useRef(false);
  const ultimoTelefonoRecuperadoRef = useRef<string | null>(null);
  const prepararAperturaCheckoutModalRef = useRef<(() => Promise<boolean>) | null>(null);
  /** Tras limpieza por stock en `interaccionUsuario`, si el carrito queda vacío se redirige a tienda y el checkout no debe abrirse. */
  const redirigidoCarritoVacioPorLimpiezaRef = useRef(false);

  const {
    direcciones,
    finalizarCarrito: abrirModalCheckoutDesdeFlow,
    cerrarCheckoutSinGuardar: cerrarModalCheckoutSinGuardarBase,
    buscandoCalleCheckout,
    setBuscandoCalleCheckout,
    calleCheckoutResetSignal,
    setCalleCheckoutResetSignal
  } = useCheckoutDireccionFlow({
    datosCliente,
    setDatosCliente,
    usuario,
    setUsuario,
    authHydrated,
    modoDireccionCheckout,
    navigate,
    location,
    mostrarNotificacion,
    precargarDatosClienteDesdeUsuario,
    leerMaikaUsuarios,
    guardarMaikaUsuarios,
    setPasoFinalizarCompra,
    setFormPedidoAbierto,
    getUsuarioCanonico,
    proyectarUsuariosDesdeMaika,
    recordarDatosInvitado,
    resetCliente,
    setAvisoTelefonoCheckout,
    setNumeroPedidoPreview,
    ultimoTelefonoRecuperadoRef,
    antesDeAbrirCheckoutModal: async () => {
      const fn = prepararAperturaCheckoutModalRef.current;
      return fn ? fn() : true;
    }
  });

  type SyncCarritoTrasCatalogoModo = "trasCierreModal" | "interaccionUsuario";

  const sincronizarCatalogoYCarritoDesdeServidor = useCallback(
    async (modo: SyncCarritoTrasCatalogoModo = "trasCierreModal"): Promise<CatalogoCuatroListas | null> => {
      /** Snapshot local antes de aplicar la respuesta del servidor (evita falsos “sin stock” si el GET omite un id momentáneamente). */
      const catRespaldoPreSync: CatalogoCuatroListas = { velas, inciensos, figuras, kits, joyas };
      const cat = await fetchCatalogoCuatroListasDesdeApi();
      if (!cat) return null;
      const interaccion = modo === "interaccionUsuario";
      /**
       * Un `requestAnimationFrame` antes de `flushSync`: al volver del `await` deja procesar
       * eventos de entrada; el `flushSync` inmediato tras la red bloqueaba el hilo.
       */
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          let lineasEliminadas = 0;
          let huboRecorte = false;
          flushSync(() => {
            aplicarCatalogoActualizado(cat);
          });
          flushSync(() => {
            setCart((prev) => {
              const r = limpiarYRecortarCarritoConCatalogo(prev, cat, catRespaldoPreSync);
              lineasEliminadas = r.lineasEliminadas;
              huboRecorte = r.huboRecorteCantidad;
              const next = r.siguienteCarrito.map(normalizarItemCarrito);
              motorCartRef.current = next;
              return next;
            });
          });
          if (interaccion) {
            const silencioPorCompraExitosa =
              silenciarAvisosLimpiezaCarritoStockTrasCompraOkRef.current ||
              pedidoRealizadoRef.current ||
              procesandoPagoCheckoutRef.current;
            if (!silencioPorCompraExitosa) {
              if (lineasEliminadas === 1) {
                mostrarNotificacion(MSJ_PRODUCTO_ELIMINADO_SIN_STOCK, "normal");
              } else if (lineasEliminadas > 1) {
                mostrarNotificacion(MSJ_PRODUCTOS_ELIMINADOS_SIN_STOCK, "normal");
              }
              if (huboRecorte) {
                mostrarNotificacion(MSJ_RECORTE_CANTIDAD_STOCK, "normal");
              }
              if (motorCartRef.current.length === 0 && lineasEliminadas > 0) {
                redirigidoCarritoVacioPorLimpiezaRef.current = true;
                setPagina("tienda");
                navigate(PATH_BY_PAGINA.tienda, { replace: true });
              }
            }
          }
          resolve();
        });
      });
      return cat;
    },
    [
      aplicarCatalogoActualizado,
      setCart,
      normalizarItemCarrito,
      mostrarNotificacion,
      navigate,
      setPagina,
      velas,
      inciensos,
      figuras,
      kits,
      joyas
    ]
  );

  const bloquearSiCarritoNoComprablePreCheckout = useCallback(
    (cat: CatalogoCuatroListas, catRespaldo: CatalogoCuatroListas | null): boolean => {
    const v = validarCarritoAntesCheckout(motorCartRef.current, cat, catRespaldo);
    if (v.ok === false) {
      const mensaje = v.mensaje;
      const soloCarritoVacio = mensaje === MENSAJE_CARRITO_VACIO_PRE_CHECKOUT;
      setPreCheckoutCarritoAviso(
        soloCarritoVacio
          ? {
              titulo: "Carrito sin productos",
              mensaje,
              detalle:
                "Añade artículos al carrito y vuelve a pulsar «Finalizar pedido por WhatsApp» cuando quieras.",
              textoBoton: "Ir a la tienda",
              irTiendaAlConfirmar: true,
              textoBotonSecundario: "Cerrar"
            }
          : {
              titulo: "No podemos abrir el pedido",
              mensaje,
              detalle:
                "El carrito no se puede completar con el catálogo actual. Vuelve a la tienda o revisa las cantidades.",
              textoBoton: "Entendido",
              irTiendaAlConfirmar: false
            }
      );
      return true;
    }
    return false;
  }, []);

  const prepararAperturaCheckoutModal = useCallback(async (): Promise<boolean> => {
    redirigidoCarritoVacioPorLimpiezaRef.current = false;
    const cat = await sincronizarCatalogoYCarritoDesdeServidor("interaccionUsuario");
    if (!cat) {
      setPreCheckoutCarritoAviso({
        titulo: "No pudimos comprobar el catálogo",
        mensaje: "Revisa tu conexión e inténtalo de nuevo.",
        detalle:
          "Sin datos actualizados no podemos asegurar precios ni stock. Cuando tengas conexión estable, vuelve a intentarlo.",
        textoBoton: "Entendido",
        irTiendaAlConfirmar: false
      });
      return false;
    }
    if (redirigidoCarritoVacioPorLimpiezaRef.current) {
      redirigidoCarritoVacioPorLimpiezaRef.current = false;
      return false;
    }
    /** Cierre del hook antes del `await`: catálogo que el usuario veía antes de la sync (no el estado ya commiteado por `flushSync` dentro de la sync). */
    const catRespaldoPreSync: CatalogoCuatroListas = { velas, inciensos, figuras, kits, joyas };
    if (motorCartRef.current.length === 0) {
      return bloquearSiCarritoNoComprablePreCheckout(cat, catRespaldoPreSync);
    }
    if (bloquearSiCarritoNoComprablePreCheckout(cat, catRespaldoPreSync)) return false;
    return true;
  }, [
    sincronizarCatalogoYCarritoDesdeServidor,
    bloquearSiCarritoNoComprablePreCheckout,
    velas,
    inciensos,
    figuras,
    kits,
    joyas
  ]);

  prepararAperturaCheckoutModalRef.current = prepararAperturaCheckoutModal;

  const sincronizarCarritoAlEntrarVista = useCallback(async () => {
    await sincronizarCatalogoYCarritoDesdeServidor("interaccionUsuario");
  }, [sincronizarCatalogoYCarritoDesdeServidor]);

  const finalizarCarrito = useCallback(async () => {
    await abrirModalCheckoutDesdeFlow();
  }, [abrirModalCheckoutDesdeFlow]);

  /** Tras cerrar el modal, refresca catálogo (stock real) para que el carrito muestre p. ej. 0 u (!) si otro ya compró. */
  const cerrarCheckoutSinGuardar = useCallback(() => {
    if (checkoutRechazoServidorRef.current) {
      checkoutRechazoServidorRef.current = false;
      try {
        localStorage.removeItem(CARRITO_KEY);
        localStorage.removeItem(GUEST_CART_PENDING_KEY);
      } catch {
        /* ignorar */
      }
      flushSync(() => {
        setCart([]);
      });
      motorCartRef.current = [];
      if (hasClientSession()) {
        void guardarCarritoApi(getUsuarioId(), []).catch(() => {});
      }
      setMensajeErrorCheckoutPago(null);
      cerrarModalCheckoutSinGuardarBase();
      setPagina("tienda");
      navigate(PATH_BY_PAGINA.tienda, { replace: true });
      void sincronizarCatalogoYCarritoDesdeServidor();
      return;
    }
    setMensajeErrorCheckoutPago(null);
    cerrarModalCheckoutSinGuardarBase();
    void sincronizarCatalogoYCarritoDesdeServidor();
  }, [
    cerrarModalCheckoutSinGuardarBase,
    sincronizarCatalogoYCarritoDesdeServidor,
    navigate,
    setCart,
    setMensajeErrorCheckoutPago,
    setPagina
  ]);

  const {
    envioPreview,
    totalPreview,
    descuentoCupon,
    totalAPagarResumen,
    datosObligatoriosCompletos,
    primerCampoFaltanteCheckout,
    telefonoCheckoutLimpio,
    telefonoCheckoutEsValido,
    telefonoCheckoutPrefijoInvalido,
    direccionCheckoutSeleccionada
  } = useCheckoutResumen({
    datosCliente,
    total,
    cuponAplicado,
    direccionCheckoutActiva: direcciones.direccionCheckoutActiva,
    direccionCheckoutSeleccionadaId: direcciones.direccionCheckoutSeleccionadaId,
    direccionesCheckout: direcciones.direccionesCheckout
  });

  const findMaikaUsuarioPorTel9 = (tel9: string): MaikaUsuarioLS | null =>
    findMaikaUsuarioPorTel9Storage(tel9, leerMaikaUsuarios, claveTelefonoES, normalizarTelefonoES9);

  const emailRegistradoUnificadoParaTel9 = (tel9: string): string =>
    emailRegistradoDesdeMaikaUsuarios(tel9, findMaikaUsuarioPorTel9);

  const telefonoTieneActividadSinEmail = (tel9: string): boolean =>
    telefonoTieneActividadSinEmailUtil({
      tel9,
      emailRegistradoUnificadoParaTel9,
      findMaikaUsuarioPorTel9,
      claveTelefonoES,
      direccionesDesdeHistorial: (cl) => direccionesDesdePedidosMaikaLegacy(cl, claveTelefonoES, DIRECCIONES_MAX),
      normalizarTelefonoES9
    });

  useAvisoTelefonoRegistradoCheckout({
    telefonoCliente: datosCliente.telefono || "",
    usuario,
    findMaikaUsuarioPorTel9,
    setAvisoTelefonoCheckout,
    setCalleCheckoutResetSignal,
    ultimoTelefonoRecuperadoRef,
    formPedidoAbierto,
    pasoFinalizarCompra
  });

  const leerMaikaPedidos = (): MaikaPedidoLS[] => leerMaikaPedidosStorage();

  const obtenerCodigoUltimoPedidoPorTel9 = (tel9: string): string =>
    obtenerCodigoUltimoPedidoPorTel9Util(tel9, claveTelefonoES, parseFechaPedido, leerMaikaPedidos);

  const enviarCodigoEmail = async (email: string, nombre: string, codigo: string) => {
    return enviarCodigoEmailUtil(email, nombre, codigo, EMAILJS_CONFIG);
  };

  const accesoRapido = useAccesoRapidoCheckout({
    datosCliente,
    mostrarNotificacion,
    iniciarSesionConToken,
    setPagina,
    setFormPedidoAbierto,
    setPasoFinalizarCompra,
    pasoFinalizarCompraActual: pasoFinalizarCompra,
    setAvisoTelefonoCheckout,
    setModoRegistro,
    setTelefonoForzadoRegistroDesdeAcceso,
    setModoForzadoRegistroDesdeAcceso,
    setConfirmacionIdentidadActivacion,
    setFormAuth,
    findMaikaUsuarioPorTel9,
    telefonoTieneActividadSinEmail,
    obtenerCodigoUltimoPedidoPorTel9,
    emailRegistradoUnificadoParaTel9,
    proyectarUsuariosDesdeMaika,
    leerMaikaUsuarios,
    guardarMaikaUsuarios,
    enviarCodigoEmail,
    loadCuentaPage,
    onAuthAccesoRapido: (usuarioAuth) => {
      precargarDatosClienteDesdeUsuario(usuarioAuth);
      direcciones.prepararListaYSeleccionDesdeUsuario(usuarioAuth);
    },
    antesDeAbrirModalPedido: prepararAperturaCheckoutModal
  });

  useIrAlPagoCheckout({
    irAlPagoEjecutarRef,
    accesoRapidoCheckoutAbierto: accesoRapido.accesoRapidoCheckoutAbierto,
    datosObligatoriosCompletos,
    primerCampoFaltanteCheckout,
    mostrarNotificacion,
    usuario,
    inputCalleCheckoutRef,
    inputTelefonoCheckoutRef,
    setAvisoTelefonoCheckout,
    setPasoFinalizarCompra,
    telefonoCheckoutEsValido,
    setTelefonoCheckoutValidPulse,
    telefonoCheckoutValidoPrevRef,
    irAlPagoPointerIdRef,
    botonIrAlPagoRef,
    formPedidoAbierto,
    pasoFinalizarCompra,
    onIrAlPagoTrackedPointerEnd: onCheckoutIrAlPagoGesturaFin
  });

  useEffect(() => {
    if (!formPedidoAbierto || pasoFinalizarCompra !== "datos") {
      setCheckoutIrAlPagoGesturaActiva(false);
    }
  }, [formPedidoAbierto, pasoFinalizarCompra]);

  const { comprarEnUnClick, metodoPagoRapidoValido } = useCompraRapida({
    perfilCompraRapida,
    cart,
    setDatosCliente,
    setMetodoPago,
    setDatosPago,
    setNumeroPedidoPreview,
    setPasoFinalizarCompra,
    setFormPedidoAbierto,
    mostrarNotificacion,
    antesDeAbrirModalCheckout: prepararAperturaCheckoutModal
  });

  const getCuponesDisponibles = (): Record<string, { tipo: "porcentaje" | "envio_gratis"; valor: number }> =>
    getCuponesDisponiblesStorage(
      CUPONES_MAIKA_KEY,
      CUPONES_DISPONIBLES as Record<string, { tipo: "porcentaje" | "envio_gratis"; valor: number }>
    );

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
      notificarExito(mostrarNotificacion, `✅ Cupón ${codigo} aplicado (${cupon.valor}% descuento)`);
      return;
    }

    notificarExito(mostrarNotificacion, `✅ Cupón ${codigo} aplicado (envío gratis)`);
  };

  const quitarCupon = () => {
    setCuponAplicado(null);
    setCuponInput("");
    setCuponError(null);
    mostrarNotificacion("Cupón eliminado", "normal");
  };

  const vaciarCarrito = () => {
    if (cart.length === 0) {
      notificarError(mostrarNotificacion, "Carrito vacío");
      return;
    }
    setModalAbierto(true);
  };

  const confirmarVaciarCarrito = () => {
    setCart([]);
    setModalAbierto(false);
    try {
      localStorage.removeItem(GUEST_CART_PENDING_KEY);
      localStorage.setItem(CARRITO_KEY, "[]");
    } catch {
      /* ignore */
    }
    if (hasClientSession()) {
      void guardarCarritoApi(getUsuarioId(), []).catch(() => {});
    }
    notificarExito(mostrarNotificacion, "Carrito vaciado");
  };

  /**
   * Catálogo y datos del checkout para el motor (sin `cart`: ese va en `motorCartRef` para no leer un array
   * vacío entre el `flushSync` del `setCart` y el siguiente render).
   */
  const checkoutMotorSnapRef = useRef({
    datosCliente,
    datosPago,
    descuentoCupon,
    cuponAplicado,
    velas,
    inciensos,
    figuras,
    kits,
    joyas,
    precioItemCarrito
  });
  checkoutMotorSnapRef.current = {
    datosCliente,
    datosPago,
    descuentoCupon,
    cuponAplicado,
    velas,
    inciensos,
    figuras,
    kits,
    joyas,
    precioItemCarrito
  };

  const { ejecutarCheckout } = useCheckoutMaika({
    getInput: () => ({
      ...checkoutMotorSnapRef.current,
      cart: motorCartRef.current,
      direccionesMax: DIRECCIONES_MAX,
      bizumYaConfirmadoPorUsuario: bizumConfirmadoRef.current,
      leerMaikaUsuarios,
      guardarMaikaUsuarios,
      sincronizarCatalogoYCarritoDesdeServidor
    })
  });

  const depsUiEnvioPedidoCheckout: ConstruirOrquestarEnvioPedidoWhatsAppInput = {
    usuario,
    setAuthHydrated,
    setUltimoPedidoNumero,
    setPedidos,
    setUsuario,
    aplicarCatalogoActualizado,
    setCart,
    mostrarNotificacion,
    setPasoFinalizarCompra,
    setFormPedidoAbierto,
    setUrlWhatsAppPendiente,
    setPedidoRealizado,
    setPagina,
    bizumConfirmadoRef,
    setPerfilCompraRapida,
    setDatosCliente,
    setMetodoPago,
    setDatosPago,
    setCuponAplicado,
    setCuponInput,
    setCuponError,
    setCalleCheckoutResetSignal,
    setBuscandoCalleCheckout,
    setConfirmacionBizumOtroNumeroAbierto,
    setMensajeErrorCheckoutPago,
    onMarcarCheckoutErrorRechazoServidor,
    silenciarAvisosLimpiezaCarritoStockTrasCompraOkRef
  };

  const { procesandoPago, enviarPedidoWhatsApp } = useCheckoutFlow({
    ejecutarCheckout,
    depsUi: depsUiEnvioPedidoCheckout
  });
  procesandoPagoCheckoutRef.current = procesandoPago;

  const construirItemsDesdeProductos = (productos: MaikaPedidoProductoLS[]) =>
    construirItemsDesdeProductosUtil(productos, getStockProducto, normalizarItemCarrito);

  const repetirPedido = (pedido: MaikaPedidoLS, modo: "replace" | "add") => {
    if (!pedido) return;

    if (modo === "replace") {
      const items = construirItemsDesdeProductos(pedido.productos);
      flushSync(() => {
        setCart(items);
      });
      notificarExito(mostrarNotificacion, items.length > 0 ? "Pedido reemplazado al carrito" : "No se pudieron añadir productos");
      finalizarCarrito();
      return;
    }

    const nextItems = sumarPedidoAlCarritoUtil(cart, pedido.productos, getStockProducto, normalizarItemCarrito);
    flushSync(() => {
      setCart(nextItems);
    });

    notificarExito(mostrarNotificacion, "Pedido añadido al carrito");
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

  const hayModalAbiertoCheckout =
    formPedidoAbierto ||
    accesoRapido.accesoRapidoCheckoutAbierto ||
    modalAbierto ||
    confirmacionBizumOtroNumeroAbierto ||
    modalRepeatPedidoAbierto ||
    !!direcciones.direccionCheckoutAEliminarId;

  const onLoginModalSuccess = useCallback(
    (u: Usuario) => {
      setUsuario(u);
      precargarDatosClienteDesdeUsuario(u);
      setLoginModalAbierto(false);
      const seguirEnCheckoutTrasLogin =
        formPedidoAbierto || checkoutVisibleAlAbrirLoginRef.current;
      checkoutVisibleAlAbrirLoginRef.current = false;
      if (seguirEnCheckoutTrasLogin) {
        /**
         * No volver a ejecutar `prepararAperturaCheckoutModal` aquí: tras el login el efecto de carrito
         * deja `cart` en [] un instante hasta fusionar invitado+API → el pre-checkout mostraba «Carrito sin productos».
         * Reaplicar usuario/direcciones sin revalidar ni cambiar el número de pedido (misma ruta de envío).
         */
        void abrirModalCheckoutDesdeFlow({
          validarAntesDeAbrir: false,
          regenerarNumeroPedidoPreview: false
        });
        return;
      }
      void finalizarCarrito();
    },
    [
      setUsuario,
      precargarDatosClienteDesdeUsuario,
      setLoginModalAbierto,
      formPedidoAbierto,
      finalizarCarrito,
      abrirModalCheckoutDesdeFlow
    ]
  );


  const checkoutViewProps = buildCheckoutViewPropsFromPack({
    direccionesMax: DIRECCIONES_MAX,
    core: { THEME, direcciones, accesoRapido },
    styles: { inputStyle },
    refs: {
      bizumConfirmadoRef,
      inputCalleCheckoutRef,
      inputTelefonoCheckoutRef,
      textareaNotasCheckoutRef,
      botonIrAlPagoRef,
      irAlPagoPointerIdRef,
      irAlPagoEjecutarRef
    },
    confirmations: {
      modalAbierto,
      confirmacionBizumOtroNumeroAbierto,
      setModalAbierto,
      setConfirmacionBizumOtroNumeroAbierto,
      normalizarTelefonoBizum,
      confirmarVaciarCarrito,
      enviarPedidoWhatsApp
    },
    invoice: { pedidoFacturaAbierto, setPedidoFacturaAbierto, notaPedidoEnvio },
    flow: {
      formPedidoAbierto,
      pasoFinalizarCompra,
      modoDireccionCheckout,
      usuario,
      recordarDatosInvitado,
      numeroPedidoPreview: numeroPedidoPreview ?? "",
      direccionCheckoutSeleccionada,
      checkoutIrAlPagoGesturaActiva,
      onCheckoutIrAlPagoGesturaInicio,
      onCheckoutIrAlPagoGesturaFin
    },
    phoneAddress: {
      telefonoCheckoutLimpio,
      telefonoCheckoutEsValido,
      telefonoCheckoutPrefijoInvalido,
      telefonoCheckoutValidPulse,
      buscandoCalleCheckout,
      calleCheckoutResetSignal
    },
    paymentTotals: {
      datosPago,
      datosCliente,
      metodoPago,
      setMetodoPago,
      total,
      envioPreview,
      cuponAplicado,
      totalAPagarResumen,
      procesandoPago,
      cerrarCheckoutSinGuardar,
      setPasoFinalizarCompra,
      setDatosPago,
      setRecordarDatosInvitado,
      setDatosCliente,
      mensajeErrorCheckoutPago,
      setMensajeErrorCheckoutPago,
      checkoutHayRechazoServidor
    },
    coupon: {
      mostrarInputCuponCheckout,
      cuponError,
      cuponInput,
      aplicarCupon,
      quitarCupon,
      setMostrarInputCuponCheckout,
      setCuponInput,
      setCuponError
    },
    nav: {
      mostrarNotificacion,
      setBuscandoCalleCheckout,
      setAvisoTelefonoCheckout,
      setPagina,
      enmascararEmail,
      preCheckoutCarritoAviso,
      cerrarPreCheckoutCarritoAviso,
      cerrarPreCheckoutCarritoAvisoSinNavegar
    },
    repeat: {
      modalRepeatPedidoAbierto,
      pedidoRepeatSeleccionado,
      pedidoRealizado,
      ultimoPedidoNumero: ultimoPedidoNumero ?? "",
      urlWhatsAppPendiente,
      avisoTelefonoCheckout,
      repetirPedido,
      setModalRepeatPedidoAbierto,
      setUrlWhatsAppPendiente,
      setPedidoRealizado
    },
    login: { loginModalAbierto, setLoginModalAbierto, iniciarSesionConToken, enviarCodigoEmail },
    compraRapida: {
      comprarEnUnClick,
      compraRapidaCheckoutDisponible: metodoPagoRapidoValido && cart.length > 0
    },
    onLoginModalSuccess
  });

  return {
    finalizarCarrito,
    envioPreview,
    totalPreview,
    setNumeroPedidoPreview,
    setFormPedidoAbierto,
    vaciarCarrito,
    comprarEnUnClick,
    pedidoFacturaAbierto,
    setPedidoFacturaAbierto,
    handleRepetirPedido,
    hayModalAbiertoCheckout,
    checkoutViewProps,
    enviarCodigoEmail,
    setRecordarDatosInvitado,
    checkoutHayRechazoServidor,
    procesandoPagoCheckout: procesandoPago,
    sincronizarCarritoAlEntrarVista
  };
}
