import { createContext, useContext, type ReactNode } from "react";
import type { Producto, ItemCarrito, Usuario, CategoriaEntrada, Pagina, Pedido } from "../types";
import type { PerfilCompraRapida } from "../types";

export interface AppContextValue {
  setPagina: (p: Pagina) => void;
  /** Abre la tienda con esta categoría ya seleccionada (desde Inicio, accesos rápidos). */
  abrirTiendaConCategoria: (categoria: string) => void;
  // Tienda
  velas: Producto[];
  inciensos: Producto[];
  figuras: Producto[];
  kits: Producto[];
  categoriasCatalogo: CategoriaEntrada[];
  agregarAlCarrito: (p: Producto) => void;
  // Carrito
  cart: ItemCarrito[];
  total: number;
  totalItemsCarrito: number;
  precioItemCarrito: (item: ItemCarrito) => number;
  cambiarCantidad: (id: number, inc: number) => void;
  volverATienda: () => void;
  vaciarCarrito: () => void;
  finalizarCarrito: () => void;
  envioPreview: number;
  totalPreview: number;
  generarNumeroPedido: () => string;
  setNumeroPedidoPreview: (n: string | null) => void;
  setFormPedidoAbierto: (v: boolean) => void;
  precargarDatosClienteDesdeUsuario: (u: Usuario | null) => void;
  usuario: Usuario | null;
  perfilCompraRapida: PerfilCompraRapida | null;
  comprarEnUnClick: () => Promise<void>;
  // Seguimiento
  numeroSeguimiento: string;
  setNumeroSeguimiento: (v: string) => void;
  buscarPedido: () => void;
  pedidoBuscado: Pedido | null;
  accesoAdmin: boolean;
  busquedaPedido: string;
  setBusquedaPedido: (v: string) => void;
  renderCajaPedidos: (
    titulo: string,
    pedidosList: Pedido[],
    color: string,
    icono: string,
    abierto: boolean,
    setAbierto: (v: boolean) => void,
    animar?: boolean
  ) => ReactNode;
  pendientesAbierto: boolean;
  setPendientesAbierto: (v: boolean) => void;
  enviadosAbierto: boolean;
  setEnviadosAbierto: (v: boolean) => void;
  entregadosAbierto: boolean;
  setEntregadosAbierto: (v: boolean) => void;
  pedidosPendientesOrdenados: Pedido[];
  pedidosEnviadosOrdenados: Pedido[];
  pedidosEntregadosOrdenados: Pedido[];
  setPedidoFacturaAbierto: (p: Pedido | null) => void;
  /** Todos los pedidos (para contabilidad por meses) */
  pedidos: Pedido[];
  /** Categoría a mostrar al abrir la tienda (se limpia tras aplicar). */
  categoriaTiendaAlAbrir: string | null;
  setCategoriaTiendaAlAbrir: (v: string | null) => void;
  /** Término de búsqueda para la tienda (desde el menú principal). Se limpia al aplicar. */
  busquedaTienda: string;
  setBusquedaTienda: (v: string) => void;
  /** Bloques desplegables de inicio (cada uno: título, subtítulo, inicio, numProductos). Editable desde Admin. */
  desplegableInicio: import("../config").BloqueDesplegableInicio[];
  setDesplegableInicio: (v: import("../config").BloqueDesplegableInicio[]) => void;
  /** Servicios de la página de inicio (nombre, imagen, duración, precio, botón, WhatsApp). Editable desde Admin. */
  serviciosInicio: import("../config").ServicioInicio[];
  setServiciosInicio: (v: import("../config").ServicioInicio[]) => void;
  /** Abre la pantalla legal dentro de la app (aviso legal, cookies, privacidad, términos). */
  openLegal: (doc: "aviso-legal" | "politica-cookies" | "politica-privacidad" | "terminos-condiciones") => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

interface AppProviderProps {
  value: AppContextValue;
  children: ReactNode;
}

export function AppProvider({ value, children }: AppProviderProps) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
