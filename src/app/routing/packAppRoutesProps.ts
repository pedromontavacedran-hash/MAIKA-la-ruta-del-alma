import type { AppRoutesProps } from "../AppRoutes";

/** Navegación por páginas internas (sin gate admin). */
export type AppRoutesRoutingPack = Pick<AppRoutesProps, "setPagina">;

/** Acceso y metadatos de panel admin en rutas. */
export type AppRoutesAdminPack = Pick<
  AppRoutesProps,
  | "esAdmin"
  | "accesoAdmin"
  | "claveAdmin"
  | "setClaveAdmin"
  | "setAccesoAdmin"
  | "adminUltimoLoginTexto"
  | "adminAhoraTexto"
>;

/** @deprecated Usar `AppRoutesRoutingPack` + `AppRoutesAdminPack`. */
export type AppRoutesShellPack = AppRoutesRoutingPack & AppRoutesAdminPack;

export type AppRoutesSesionUsuariosPack = Pick<
  AppRoutesProps,
  | "modalUsuariosAbierto"
  | "setModalUsuariosAbierto"
  | "altaUsuarioEnGestionAbierta"
  | "setAltaUsuarioEnGestionAbierta"
  | "listaUsuarios"
  | "abrirRegistroAdminCuenta"
  | "formAuth"
  | "setFormAuth"
  | "modoRegistro"
  | "setModoRegistro"
  | "usuario"
  | "setUsuario"
  | "iniciarSesionConToken"
  | "reenvioDisponibleEn"
  | "setReenvioDisponibleEn"
  | "mostrarNotificacion"
  | "precargarDatosClienteDesdeUsuario"
  | "pedidos"
  | "handleRepetirPedido"
  | "enviarCodigoEmail"
  | "telefonoForzadoRegistroDesdeAcceso"
  | "setTelefonoForzadoRegistroDesdeAcceso"
  | "modoForzadoRegistroDesdeAcceso"
  | "setModoForzadoRegistroDesdeAcceso"
  | "confirmacionIdentidadActivacion"
  | "setConfirmacionIdentidadActivacion"
  | "cargarUsuarios"
  | "abrirEditorUsuario"
  | "abrirDetalleCliente"
  | "setListaUsuarios"
  | "leerMaikaUsuarios"
  | "guardarMaikaUsuarios"
  | "modalEditarUsuarioAbierto"
  | "editUsuarioForm"
  | "setEditUsuarioForm"
  | "setModalEditarUsuarioAbierto"
  | "guardarEdicionUsuario"
>;

/** Props de rutas que vienen del flujo de checkout (pedidos / repetir / email). */
export type AppRoutesCheckoutPack = Pick<AppRoutesProps, "pedidos" | "handleRepetirPedido" | "enviarCodigoEmail">;

/** Notificaciones globales (chrome) reutilizadas en pantallas de rutas. */
export type AppRoutesChromePack = Pick<AppRoutesProps, "mostrarNotificacion">;

/** Sesión / usuarios en rutas, sin mezclar checkout ni chrome. */
export type AppRoutesSesionCorePack = Omit<
  AppRoutesSesionUsuariosPack,
  "pedidos" | "handleRepetirPedido" | "enviarCodigoEmail" | "mostrarNotificacion"
>;

export type AppRoutesCategoriasPack = Pick<
  AppRoutesProps,
  | "categoriasCatalogo"
  | "setCategoriasCatalogo"
  | "categoriaSeleccionada"
  | "setCategoriaSeleccionada"
  | "previewCategoria"
  | "setPreviewCategoria"
  | "nombreImagenCategoria"
  | "setNombreImagenCategoria"
  | "colorCategoria"
  | "setColorCategoria"
  | "tamanoCategoria"
  | "setTamanoCategoria"
  | "estiloTextoCategoria"
  | "setEstiloTextoCategoria"
  | "setCategoriaARenombrar"
  | "setNuevaCategoriaNombre"
  | "setNuevaCategoriaImagen"
  | "setNuevaCategoriaNombreImagen"
  | "setNuevaCategoriaTamano"
  | "setNuevaCategoriaColor"
  | "setNuevaCategoriaEstilo"
  | "categoriaARenombrar"
  | "nuevaCategoriaNombre"
  | "nuevaCategoriaImagen"
  | "nuevaCategoriaNombreImagen"
  | "nuevaCategoriaTamano"
  | "nuevaCategoriaColor"
  | "nuevaCategoriaEstilo"
  | "subcategoriasCatalogo"
  | "setSubcategoriasCatalogo"
  | "subcategoriasDe"
  | "agregarSubcategoria"
  | "renombrarSubcategoria"
  | "eliminarSubcategoria"
>;

export type AppRoutesCatalogoPack = Pick<
  AppRoutesProps,
  "velas" | "setVelas" | "inciensos" | "setInciensos" | "figuras" | "setFiguras" | "kits" | "setKits" | "joyas" | "setJoyas" | "getProductoByValue"
>;

export type AppRoutesEditarProductoPack = Pick<
  AppRoutesProps,
  | "categoriaEditarProductos"
  | "setCategoriaEditarProductos"
  | "productoSeleccionado"
  | "setProductoSeleccionado"
  | "previewProducto"
  | "setPreviewProducto"
  | "nombreImagenProducto"
  | "setNombreImagenProducto"
  | "colorProducto"
  | "setColorProducto"
  | "tamanoProducto"
  | "setTamanoProducto"
  | "estiloTextoProducto"
  | "setEstiloTextoProducto"
>;

export type AppRoutesNuevoProductoPack = Pick<
  AppRoutesProps,
  | "setCategoriaNuevoProducto"
  | "setNuevoProductoNombre"
  | "setNuevoProductoPrecio"
  | "setNuevoProductoStock"
  | "setNuevoProductoDescripcion"
  | "setNuevoProductoImagen"
  | "setNuevoProductoNombreImagen"
  | "setNuevoProductoTamano"
  | "setNuevoProductoColor"
  | "setNuevoProductoEstilo"
  | "categoriaNuevoProducto"
  | "nuevoProductoNombre"
  | "nuevoProductoPrecio"
  | "nuevoProductoStock"
  | "nuevoProductoDescripcion"
  | "nuevoProductoImagen"
  | "nuevoProductoNombreImagen"
  | "nuevoProductoTamano"
  | "nuevoProductoColor"
  | "nuevoProductoEstilo"
>;

export type AppRoutesSitioPack = Pick<
  AppRoutesProps,
  | "umbralStockBajo"
  | "setUmbralStockBajo"
  | "desplegableInicio"
  | "setDesplegableInicio"
  | "serviciosInicio"
  | "setServiciosInicio"
  | "metrics"
  | "pedidosPendientes"
  | "pedidosEnviados"
  | "pedidosEntregados"
  | "notaPedidoEnvio"
  | "setNotaPedidoEnvio"
  | "getCuponesDisponibles"
  | "setCuponesAdmin"
  | "cuponesAdmin"
>;

/** Bloque tienda + CMS + métricas / cupones en una sola pieza para el shell. */
export type AppRoutesTiendaPack = AppRoutesCategoriasPack &
  AppRoutesCatalogoPack &
  AppRoutesEditarProductoPack &
  AppRoutesNuevoProductoPack &
  AppRoutesSitioPack;

export type AppRoutesAppPack = {
  routing: AppRoutesRoutingPack;
  admin: AppRoutesAdminPack;
  chrome: AppRoutesChromePack;
  checkout: AppRoutesCheckoutPack;
  sesion: AppRoutesSesionCorePack;
  tienda: AppRoutesTiendaPack;
};

export function packAppRoutesProps(p: AppRoutesAppPack): AppRoutesProps {
  return {
    ...p.routing,
    ...p.admin,
    ...p.chrome,
    ...p.checkout,
    ...p.sesion,
    ...p.tienda
  };
}
