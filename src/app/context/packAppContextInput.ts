import type { UseAppContextValueInput } from "../hooks/useAppContextValue";

export type AppContextNavPack = Pick<UseAppContextValueInput, "setPagina" | "abrirTiendaConCategoria">;

export type AppContextCatalogoPack = Pick<
  UseAppContextValueInput,
  "velas" | "inciensos" | "figuras" | "kits" | "joyas" | "categoriasCatalogo" | "subcategoriasCatalogo"
>;

export type AppContextCarritoPack = Pick<
  UseAppContextValueInput,
  | "agregarAlCarrito"
  | "cart"
  | "total"
  | "totalItemsCarrito"
  | "precioItemCarrito"
  | "cambiarCantidad"
  | "eliminarProductoCarrito"
  | "volverATienda"
  | "vaciarCarrito"
  | "finalizarCarrito"
  | "sincronizarCarritoAlEntrarVista"
  | "checkoutHayRechazoServidor"
  | "procesandoPagoCheckout"
  | "envioPreview"
  | "totalPreview"
  | "generarNumeroPedido"
  | "setNumeroPedidoPreview"
  | "setFormPedidoAbierto"
>;

export type AppContextUsuarioPack = Pick<
  UseAppContextValueInput,
  "precargarDatosClienteDesdeUsuario" | "usuario" | "perfilCompraRapida" | "comprarEnUnClick"
>;

export type AppContextSeguimientoPack = Pick<
  UseAppContextValueInput,
  "numeroSeguimiento" | "setNumeroSeguimiento" | "buscarPedido" | "pedidoBuscado"
>;

export type AppContextAdminPedidosPack = Pick<
  UseAppContextValueInput,
  | "accesoAdmin"
  | "busquedaPedido"
  | "setBusquedaPedido"
  | "renderCajaPedidos"
  | "pendientesAbierto"
  | "setPendientesAbierto"
  | "enviadosAbierto"
  | "setEnviadosAbierto"
  | "entregadosAbierto"
  | "setEntregadosAbierto"
  | "pedidosPendientesOrdenados"
  | "pedidosEnviadosOrdenados"
  | "pedidosEntregadosOrdenados"
  | "setPedidoFacturaAbierto"
  | "pedidos"
>;

export type AppContextTiendaBusquedaPack = Pick<
  UseAppContextValueInput,
  "categoriaTiendaAlAbrir" | "setCategoriaTiendaAlAbrir" | "busquedaTienda" | "setBusquedaTienda"
>;

export type AppContextInicioPack = Pick<
  UseAppContextValueInput,
  "desplegableInicio" | "setDesplegableInicio" | "serviciosInicio" | "setServiciosInicio"
>;

/** Chrome global: notificaciones, hidratación de sesión para el contexto. */
export type AppContextChromePack = Pick<
  UseAppContextValueInput,
  "mostrarNotificacion" | "authHydrated"
>;

export type AppContextInputPacks = {
  nav: AppContextNavPack;
  catalogo: AppContextCatalogoPack;
  carrito: AppContextCarritoPack;
  usuario: AppContextUsuarioPack;
  seguimiento: AppContextSeguimientoPack;
  adminPedidos: AppContextAdminPedidosPack;
  tiendaBusqueda: AppContextTiendaBusquedaPack;
  inicio: AppContextInicioPack;
  chrome: AppContextChromePack;
};

export function packAppContextInput(p: AppContextInputPacks): UseAppContextValueInput {
  return {
    ...p.nav,
    ...p.catalogo,
    ...p.carrito,
    ...p.usuario,
    ...p.seguimiento,
    ...p.adminPedidos,
    ...p.tiendaBusqueda,
    ...p.inicio,
    ...p.chrome
  };
}
