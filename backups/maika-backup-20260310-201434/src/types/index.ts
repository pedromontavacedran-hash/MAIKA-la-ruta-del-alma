/**
 * Tipos e interfaces compartidos de la aplicación Maika.
 */

/** Intenciones para filtrar en tienda esotérica (protección, amor, dinero, etc.). */
export type IntencionProducto =
  | "protección"
  | "amor"
  | "dinero"
  | "limpieza"
  | "trabajo"
  | "sueño"
  | "otro";

export const INTENCIONES_OPCIONES: { value: IntencionProducto | ""; label: string }[] = [
  { value: "", label: "— Sin intención —" },
  { value: "protección", label: "Protección" },
  { value: "amor", label: "Amor" },
  { value: "dinero", label: "Dinero / Abundancia" },
  { value: "limpieza", label: "Limpieza energética" },
  { value: "trabajo", label: "Trabajo / Éxito" },
  { value: "sueño", label: "Sueño / Calma" },
  { value: "otro", label: "Otro" }
];

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  /** Descuento en % (0-100). Si está definido, el precio de venta es precio * (1 - descuento/100). */
  descuentoPorcentaje?: number;
  /** Precio de coste (IVA incluido). Opcional, para uso en inventario/admin. */
  precioCosteIvaIncluido?: number;
  stock: number;
  imagen: string;
  categoria: "velas" | "inciensos" | "figuras" | "kits";
  descripcion: string;
  nombreTamano?: number;
  nombreColor?: string;
  nombreEstilo?: "normal" | "italic" | "bold";
  /** Intención / uso (para filtrar en tienda). */
  intencion?: IntencionProducto | "";
  /** Para qué sirve (texto corto en ficha). */
  paraQueSirve?: string;
  /** Cómo usarlo (instrucciones en ficha). */
  comoUsar?: string;
}

export interface ItemCarrito extends Producto {
  cantidad: number;
}

export interface Cliente {
  nombreApellidos: string;
  email: string;
  telefono?: string;
  direccion?: string;
  calle?: string;
  numero?: string;
  bloque?: string;
  escalera?: string;
  piso?: string;
  puerta?: string;
  ciudad?: string;
  cp?: string;
  poblacion?: string;
  provincia?: string;
  pais?: string;
  notas?: string;
}

export interface Usuario {
  id: number | string;
  nombre: string;
  email: string;
  telefono?: string;
  direccion?: string;
  calle?: string;
  bloque?: string;
  escalera?: string;
  piso?: string;
  puerta?: string;
  numero?: string;
  ciudad?: string;
  pais?: string;
  cp?: string;
  poblacion?: string;
  provincia?: string;
  password?: string;
  verificado?: boolean;
  pedidos?: Pedido[];
}

export interface AuthForm {
  nombre: string;
  email: string;
  password: string;
  telefono: string;
  confirmEmail: string;
  calle: string;
  bloque: string;
  escalera: string;
  piso: string;
  puerta: string;
  numero: string;
  cp: string;
  provincia: string;
  poblacion: string;
  pais: string;
  confirmPassword: string;
  codigoVerificacion: string;
  codigoIngresado: string;
  pasoVerificacion: number;
}

export interface EditUsuarioForm {
  id: number | string;
  nombre: string;
  email: string;
  telefono: string;
  password: string;
  calle: string;
  bloque: string;
  escalera: string;
  piso: string;
  puerta: string;
  numero: string;
  cp: string;
  provincia: string;
  poblacion: string;
  pais: string;
  direccion: string;
  verificado: boolean;
}

export interface Pedido {
  numero: string;
  fecha: string;
  cliente: Cliente;
  items: ItemCarrito[];
  subtotal: number;
  envio: number;
  total: number;
  estado: "pendiente" | "enviado" | "entregado";
  pago?: {
    metodo: "bizum" | "tarjeta";
    estado: "pagado";
    referencia: string;
  };
  descuento?: number;
  cupon?: string;
}

export type CuponTipo = "porcentaje" | "envio_gratis";

export interface CuponAplicado {
  codigo: string;
  tipo: CuponTipo;
  valor: number;
}

export interface ConsentimientoCookies {
  necesarias: true;
  preferencias: boolean;
  analiticas: boolean;
  marketing: boolean;
  fechaActualizacion: string;
  version: number;
}

export interface PerfilCompraRapida {
  datosCliente: Cliente;
  metodoPago: "bizum" | "tarjeta";
  datosPago: {
    bizumTelefono: string;
    tarjetaNumero: string;
    tarjetaTitular: string;
    tarjetaCaducidad: string;
    tarjetaCVV: string;
  };
  actualizadoEn: string;
}

export type CategoriaEntrada = { id: string; nombre: string };

export type Pagina =
  | "inicio"
  | "tienda"
  | "carrito"
  | "seguimiento"
  | "cuenta"
  | "favoritos"
  | "admin"
  | "contabilidad"
  | "editarCategorias"
  | "editarProductos"
  | "editarCupones"
  | "inventario"
  | "nuevoProducto"
  | "nuevaCategoria";
