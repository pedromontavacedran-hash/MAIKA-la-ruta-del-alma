import { lazy } from "react";

export const loadTiendaView = () => import("../views/TiendaView");
/** Vista tienda (packs + listado + más vendidos); lazy-loaded. */
export const TiendaView = lazy(loadTiendaView);
/** Alias histórico (mismo componente que `TiendaView`). */
export const TiendaPage = TiendaView;
export const loadTiendaPage = loadTiendaView;
export const preloadTiendaPage = () => {
  void loadTiendaView();
};

export const loadCarritoPage = () => import("../../pages/CarritoPage");
export const CarritoPage = lazy(loadCarritoPage);
export const preloadCarritoPage = () => {
  void loadCarritoPage();
};

export const loadCuentaPage = () => import("../../pages/CuentaPage");
export const CuentaPage = lazy(loadCuentaPage);
export const preloadCuentaPage = () => {
  void loadCuentaPage();
};

export const loadResetPasswordPage = () => import("../../pages/ResetPasswordPage");
export const ResetPasswordPage = lazy(loadResetPasswordPage);

export const loadSeguimientoPage = () => import("../../pages/SeguimientoPage");
export const SeguimientoPage = lazy(loadSeguimientoPage);
export const preloadSeguimientoPage = () => {
  void loadSeguimientoPage();
};

export const loadEditarCategoriasPage = () => import("../../pages/admin/EditarCategoriasPage");
export const EditarCategoriasPage = lazy(loadEditarCategoriasPage);

export const loadNuevaCategoriaPage = () => import("../../pages/admin/NuevaCategoriaPage");
export const NuevaCategoriaPage = lazy(loadNuevaCategoriaPage);

export const loadEditarProductosPage = () => import("../../pages/admin/EditarProductosPage");
export const EditarProductosPage = lazy(loadEditarProductosPage);

export const loadInventarioPage = () => import("../../pages/admin/InventarioPage");
export const InventarioPage = lazy(loadInventarioPage);

export const loadDetalleClientePage = () => import("../../pages/admin/DetalleClientePage");
export const DetalleClientePage = lazy(loadDetalleClientePage);

export const loadNuevoProductoPage = () => import("../../pages/admin/NuevoProductoPage");
export const NuevoProductoPage = lazy(loadNuevoProductoPage);
