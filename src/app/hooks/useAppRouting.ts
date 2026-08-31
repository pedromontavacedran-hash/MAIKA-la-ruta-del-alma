import { useCallback, useEffect, useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Pagina } from "../../types";
import {
  loadEditarCategoriasPage,
  loadNuevaCategoriaPage
} from "../routing/lazyPages";
import {
  preloadAdminOnce,
  preloadCarritoOnce,
  preloadCuentaOnce,
  preloadSeguimientoOnce,
  preloadTiendaOnce
} from "../routing/preloadOnce";
import { PAGINA_BY_PATH, PATH_BY_PAGINA } from "../routing/routeMaps";
import { prefetchConDelay } from "../../utils/prefetchPredictivo";
import { esRutaVistaTiendaShellScroll, getMaikaScrollPortEl } from "../../utils/maikaScrollPort";

/** Scrollport: `.app-shell` solo en tienda; en el resto, `.app-shell__routes-grow`. */
function scrollVistaMaikaAlInicio() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  const port = getMaikaScrollPortEl();
  if (port) port.scrollTop = 0;
}

export function useAppRouting() {
  const navigate = useNavigate();
  const location = useLocation();
  const pagina: Pagina =
    PAGINA_BY_PATH[location.pathname] ??
    (location.pathname.startsWith("/admin/diseno-web")
      ? "admin"
      : esRutaVistaTiendaShellScroll(location.pathname)
        ? "tienda"
        : "inicio");
  const modoDireccionCheckout = new URLSearchParams(location.search).get("modo") === "direccion";

  const setPagina = useCallback(
    (next: Pagina) => {
      const targetPath = PATH_BY_PAGINA[next] ?? "/";
      const samePath = location.pathname === targetPath;
      const searchDirty = Boolean(location.search);
      const hashDirty = Boolean(location.hash);

      if (!samePath) {
        /** Sin `flushSync`: con rutas lazy (tienda/carrito) el sync forzaba transiciones raras con Suspense. */
        void navigate({ pathname: targetPath, search: "", hash: "" });
        queueMicrotask(() => {
          scrollVistaMaikaAlInicio();
        });
        return;
      }

      /** Misma URL (p. ej. /cuenta?modo=direccion → volver a pulsar «Mi cuenta»): limpiar query/hash y subir scroll. */
      if (searchDirty || hashDirty) {
        void navigate({ pathname: targetPath, search: "", hash: "" }, { replace: true });
      }

      queueMicrotask(() => {
        scrollVistaMaikaAlInicio();
      });
    },
    [location.pathname, location.search, location.hash, navigate]
  );

  useEffect(() => {
    if (PAGINA_BY_PATH[location.pathname]) return;
    /** Rutas hero diseño web: el panel vive en React Router; no forzar `/` (map puede ir por detrás de nuevos segmentos). */
    if (location.pathname.startsWith("/admin/diseno-web")) return;
    if (esRutaVistaTiendaShellScroll(location.pathname)) return;
    navigate("/", { replace: true });
  }, [location.pathname, navigate]);

  /** Antes de pintar: evita un fotograma con scroll “viejo” y luego salto al ir a 0. */
  useLayoutEffect(() => {
    scrollVistaMaikaAlInicio();
  }, [location.pathname]);

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

  return { navigate, location, pagina, modoDireccionCheckout, setPagina };
}
