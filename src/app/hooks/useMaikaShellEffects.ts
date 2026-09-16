import { useEffect, useLayoutEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { CUPONES_DISPONIBLES, CUPONES_MAIKA_KEY } from "../../config";
import type { BloqueDesplegableInicio, ServicioInicio } from "../../config";
import type { Pagina } from "../../types";
import { getCuponesDisponibles as getCuponesDisponiblesStorage } from "../../utils/cupones";
import { prefetchConDelay } from "../../utils/prefetchPredictivo";
import { clearAdminAuthorization, isAdminAuthorized } from "../../utils/adminAuth";
import { ensureAdminUsuariosApiJwt, reconciliarSesionAdminAlArrancar } from "../../services/apiAuth";
import { MAIKA_API_BECAME_REACHABLE_EVENT } from "../../utils/maikaApiProbe";
import {
  leerOutbox,
  sincronizarOutbox,
  MAIKA_OUTBOX_REPLANIFICAR_TEMPORIZADOR_EVENT
} from "../../utils/maikaOutbox";
import { normalizarTelefonoES9 } from "../../utils/telefono";
import { installPreserveMaikaScrollPortOnDetailsToggle } from "../../utils/maikaScrollPort";
import {
  aplicarWebLayoutCssDesdeStorage,
  MAIKA_WEB_LAYOUT_LS_KEY,
  MAIKA_WEB_LAYOUT_UPDATED_EVENT
} from "../../utils/webLayoutConfig";
import { MAIKA_TABS_BROADCAST_NAME, type MaikaTabsBroadcastPayload } from "../../utils/maikaTabsBroadcast";
import { preloadCarritoOnce, preloadCuentaOnce } from "../routing/preloadOnce";
import { useCallback } from "react";
import { BARRA_TOP_PEDIDO_EXITO_CFG_UPDATED_EVENT } from "../../utils/barraTopPedidoExito/barraTopPedidoExitoCfg";
import { FONDO_PANTALLA_UPDATED_EVENT } from "../../utils/fondoPantallaConfig";
import { HERO_BANNER_UPDATED_EVENT } from "../../utils/heroBannerConfig";
import { HERO_LOGO_UPDATED_EVENT } from "../../utils/heroLogoConfig";
import { HERO_EXPLORAR_TIENDA_UPDATED_EVENT } from "../../utils/heroExplorarTiendaConfig";
import { CAMPANA_PACK_EVENT } from "../../utils/campanaPack";
import { MAIKA_LECTURA_PANTALLA_UPDATED_EVENT } from "../../utils/lecturaPantallaConfig";
import { aplicarCheckoutVisualPresetPayload } from "../../utils/checkoutVisualPresets";
import {
  storageEscribirBaselineJson,
  storageEscribirPresetsJson
} from "../../utils/checkoutVisualPresetsStorage";
import {
  aplicarDisenoWebExtras,
  normalizarBloquesDesplegable,
  normalizarServiciosInicio
} from "../../utils/disenoWebExtras";
import {
  leerDisenoWebAdminServidor,
  leerDisenoWebServidor,
  programarPublicacionDisenoWeb
} from "../../services/apiDisenoWeb";

/** Cola vacía: pocos intentos en reposo. Con cola: reintentos más frecuentes (sin esperar 3 min). */
const MAIKA_OUTBOX_INTERVALO_REPOSO_MS = 180_000;
const MAIKA_OUTBOX_INTERVALO_CON_COLA_MS = 25_000;

export type CuponesAdminMap = Record<string, { tipo: "porcentaje" | "envio_gratis"; valor: number }>;

export type UseMaikaShellEffectsInput = {
  pathname: string;
  pagina: Pagina;
  mostrarNotificacion: (mensaje: string, tipo?: "normal" | "exito" | "error") => void;
  accesoAdmin: boolean;
  setAccesoAdmin: Dispatch<SetStateAction<boolean>>;
  totalItemsCarrito: number;
  cuponesAdmin: CuponesAdminMap;
  setCuponesAdmin: Dispatch<SetStateAction<CuponesAdminMap>>;
  desplegableInicio: BloqueDesplegableInicio[];
  setDesplegableInicio: Dispatch<SetStateAction<BloqueDesplegableInicio[]>>;
  serviciosInicio: ServicioInicio[];
  setServiciosInicio: Dispatch<SetStateAction<ServicioInicio[]>>;
  umbralStockBajo: number;
  setUmbralStockBajo: Dispatch<SetStateAction<number>>;
  notaPedidoEnvio: string;
  setNotaPedidoEnvio: Dispatch<SetStateAction<string>>;
};

/**
 * Efectos de infraestructura del shell: layout CSS desde storage, broadcast entre
 * pestañas, reconciliación/keepalive de sesión admin, outbox offline, preservación
 * del scrollport, prefetch al crecer el carrito y carga de cupones al abrir su página.
 */
export function useMaikaShellEffects(p: UseMaikaShellEffectsInput) {
  const {
    pathname,
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
  } = p;

  /**
   * Config del sitio en servidor: al cargar, todo visitante aplica el payload publicado
   * (diseño visual + extras → localStorage/estado → los componentes se refrescan).
   * Admin: recibe además presets/baseline; al guardar cualquier cosa republica todo.
   */
  useEffect(() => {
    let cancelado = false;
    void (async () => {
      let payload = isAdminAuthorized() ? await leerDisenoWebAdminServidor() : null;
      if (!payload) payload = await leerDisenoWebServidor();
      if (cancelado || !payload) return;
      if (payload.visual) aplicarCheckoutVisualPresetPayload(payload.visual);
      const ex = payload.extras;
      if (ex) {
        aplicarDisenoWebExtras(ex);
        const bloques = normalizarBloquesDesplegable(ex.desplegableInicio);
        if (bloques) setDesplegableInicio(bloques);
        const servicios = normalizarServiciosInicio(ex.serviciosInicio);
        if (servicios) setServiciosInicio(servicios);
        if (typeof ex.umbralStockBajo === "number" && Number.isFinite(ex.umbralStockBajo)) {
          setUmbralStockBajo(Math.max(0, Math.min(99, Math.round(ex.umbralStockBajo))));
        }
        if (typeof ex.notaPedidoEnvio === "string" && ex.notaPedidoEnvio !== "") {
          setNotaPedidoEnvio(ex.notaPedidoEnvio);
        }
        if (ex.cupones && typeof ex.cupones === "object") {
          setCuponesAdmin(
            getCuponesDisponiblesStorage(
              CUPONES_MAIKA_KEY,
              CUPONES_DISPONIBLES as CuponesAdminMap
            )
          );
        }
      }
      if (payload.admin) {
        if (typeof payload.admin.presetsJson === "string" && payload.admin.presetsJson !== "") {
          await storageEscribirPresetsJson(payload.admin.presetsJson);
        }
        if (typeof payload.admin.baselineJson === "string" && payload.admin.baselineJson !== "") {
          await storageEscribirBaselineJson(payload.admin.baselineJson);
        }
      }
    })();
    const eventos = [
      BARRA_TOP_PEDIDO_EXITO_CFG_UPDATED_EVENT,
      FONDO_PANTALLA_UPDATED_EVENT,
      HERO_BANNER_UPDATED_EVENT,
      HERO_LOGO_UPDATED_EVENT,
      HERO_EXPLORAR_TIENDA_UPDATED_EVENT,
      MAIKA_WEB_LAYOUT_UPDATED_EVENT,
      CAMPANA_PACK_EVENT,
      MAIKA_LECTURA_PANTALLA_UPDATED_EVENT
    ];
    const onDisenoCambiado = () => programarPublicacionDisenoWeb();
    for (const ev of eventos) window.addEventListener(ev, onDisenoCambiado);
    return () => {
      cancelado = true;
      for (const ev of eventos) window.removeEventListener(ev, onDisenoCambiado);
    };
  }, [setDesplegableInicio, setServiciosInicio, setUmbralStockBajo, setNotaPedidoEnvio, setCuponesAdmin]);

  /** Al entrar al panel admin se publica la config local actual (bootstrap: sube lo ya configurado). */
  useEffect(() => {
    if (!accesoAdmin) return;
    programarPublicacionDisenoWeb();
  }, [accesoAdmin]);

  /** Config sin evento propio: cuando cambia el estado del shell (admin editando), republicar. */
  useEffect(() => {
    programarPublicacionDisenoWeb();
  }, [desplegableInicio, serviciosInicio, umbralStockBajo, notaPedidoEnvio, cuponesAdmin]);

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

  const pathnameResetBroadcastRef = useRef(pathname);
  pathnameResetBroadcastRef.current = pathname;
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

  useEffect(() => {
    if (!pathname.startsWith("/admin")) return;
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
  }, [pathname, setAccesoAdmin]);

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

  /** Sesión admin: la UI solo se desbloquea si el backend confirma la cookie httpOnly. */
  useEffect(() => {
    if (!pathname.startsWith("/admin") || !accesoAdmin) return;
    const id = window.setInterval(() => {
      void ensureAdminUsuariosApiJwt().then((ok) => {
        if (ok) return;
        clearAdminAuthorization();
        setAccesoAdmin(false);
      });
    }, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [accesoAdmin, pathname, setAccesoAdmin]);

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

  const getCuponesDisponibles = useCallback(
    (): CuponesAdminMap =>
      getCuponesDisponiblesStorage(
        CUPONES_MAIKA_KEY,
        CUPONES_DISPONIBLES as CuponesAdminMap
      ),
    []
  );

  // Al abrir la página de cupones, cargar desde localStorage para que "Guardar cambios" y el 30% se mantengan tras recargar/resetear.
  useEffect(() => {
    if (pagina !== "editarCupones") return;
    setCuponesAdmin(getCuponesDisponibles());
  }, [pagina, getCuponesDisponibles, setCuponesAdmin]);

  return { getCuponesDisponibles };
}
