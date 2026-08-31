import { runOnce } from "../../utils/prefetchPredictivo";
import {
  loadDetalleClientePage,
  loadEditarCategoriasPage,
  loadEditarProductosPage,
  loadInventarioPage,
  loadNuevaCategoriaPage,
  loadNuevoProductoPage,
  preloadCarritoPage,
  preloadCuentaPage,
  preloadSeguimientoPage,
  preloadTiendaPage
} from "./lazyPages";

export const preloadTiendaOnce = () => {
  runOnce("route-tienda", preloadTiendaPage);
};

export const preloadCarritoOnce = () => {
  runOnce("route-carrito", preloadCarritoPage);
};

export const preloadCuentaOnce = () => {
  runOnce("route-cuenta", preloadCuentaPage);
};

export const preloadSeguimientoOnce = () => {
  runOnce("route-seguimiento", preloadSeguimientoPage);
};

export const preloadAdminOnce = () => {
  runOnce("route-admin-core", () =>
    Promise.all([
      loadEditarCategoriasPage(),
      loadEditarProductosPage(),
      loadInventarioPage(),
      loadDetalleClientePage(),
      loadNuevoProductoPage(),
      loadNuevaCategoriaPage()
    ])
  );
};
