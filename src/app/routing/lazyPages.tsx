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

/* ---------------- Experiencias (pesadas) ---------------- */
export const loadHoroscoposPage = () => import("../../pages/HoroscoposPage");
export const HoroscoposPage = lazy(loadHoroscoposPage);

export const loadLecturaPage = () => import("../../pages/LecturaPage");
export const LecturaPage = lazy(loadLecturaPage);

export const loadSueno = () => import("../../Sueno");
export const Sueno = lazy(loadSueno);

export const loadSuenoPremiumPage = () => import("../../pages/SuenoPremiumPage");
export const SuenoPremiumPage = lazy(loadSuenoPremiumPage);

/* ---------------- Admin ---------------- */
export const loadAdminMainRoute = () =>
  import("../routes/AdminMainRoute").then((m) => ({ default: m.AdminMainRoute }));
export const AdminMainRoute = lazy(loadAdminMainRoute);

export const loadEditarCuponesAdminPanel = () =>
  import("../routes/EditarCuponesAdminPanel").then((m) => ({ default: m.EditarCuponesAdminPanel }));
export const EditarCuponesAdminPanel = lazy(loadEditarCuponesAdminPanel);

export const loadContabilidadPage = () => import("../../pages/ContabilidadPage");
export const ContabilidadPage = lazy(loadContabilidadPage);

export const loadAdminSugerenciasPage = () => import("../../pages/AdminSugerenciasPage");
export const AdminSugerenciasPage = lazy(loadAdminSugerenciasPage);

export const loadConfigMetricasPage = () => import("../../pages/admin/ConfigMetricasPage");
export const ConfigMetricasPage = lazy(loadConfigMetricasPage);

export const loadAnaliticaPage = () => import("../../pages/admin/AnaliticaPage");
export const AnaliticaPage = lazy(loadAnaliticaPage);

/* ---------------- Artículos ---------------- */
export const loadArticulosPage = () => import("../../pages/ArticulosPage");
export const ArticulosPage = lazy(loadArticulosPage);

export const loadArticuloPage = () => import("../../pages/ArticuloPage");
export const ArticuloPage = lazy(loadArticuloPage);

