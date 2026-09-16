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

/** Para qué está pensada la pieza (filtro futuro, solo relevante hoy en Pulseras). */
export type GeneroJoya = "hombre" | "mujer" | "unisex";

export const GENEROS_JOYA_OPCIONES: { value: GeneroJoya | ""; label: string }[] = [
  { value: "", label: "— Sin especificar —" },
  { value: "hombre", label: "Hombre" },
  { value: "mujer", label: "Mujer" },
  { value: "unisex", label: "Unisex" }
];

/** Acabado/metal de la pieza. Variante del producto, no una categoría. */
export type AcabadoJoya = "oro" | "acero";

export const ACABADOS_JOYA_OPCIONES: { value: AcabadoJoya | ""; label: string }[] = [
  { value: "", label: "— Sin especificar —" },
  { value: "oro", label: "Dorado" },
  { value: "acero", label: "Acero" }
];

export type TipoFuenteProducto = "manufacturer" | "supplier" | "product_label" | "retailer" | "other";
export type ConfianzaDatoProducto = "high" | "medium" | "low";
export type EstadoVerificacionProducto = "pending" | "imported" | "needs_review" | "verified";
export type EstadoDatoProducto = "found" | "not_found" | "conflict" | "accepted" | "rejected";
export type TipoContenidoProducto = "objective" | "commercial" | "symbolic";

export type CampoEnriquecimientoProducto =
  | "nombre"
  | "marca"
  | "referencia"
  | "sku"
  | "ean"
  | "peso"
  | "cantidad"
  | "formato"
  | "aroma"
  | "origen"
  | "fabricante"
  | "tipoProducto"
  | "ingredientes"
  | "dimensiones"
  | "duracionAproximada"
  | "descripcionProveedor"
  | "caracteristicas"
  | "modoUsoProveedor"
  | "advertencias"
  | "imagenes"
  | "codigoHsTaric";

export interface FuenteInformacionProducto {
  url: string;
  sourceType: TipoFuenteProducto;
  checkedAt: string;
  title?: string;
}

export interface AlternativaDatoProducto {
  value: string | string[];
  source: string;
  sourceType: TipoFuenteProducto;
  confidence: ConfianzaDatoProducto;
}

export interface DatoEnriquecidoProducto {
  value: string | string[] | null;
  source: string | null;
  sourceType: TipoFuenteProducto | null;
  confidence: ConfianzaDatoProducto | null;
  status: EstadoDatoProducto;
  contentType: TipoContenidoProducto;
  alternatives?: AlternativaDatoProducto[];
  /** True cuando una fuente posterior contradice el valor aceptado; no lo sobrescribe. */
  hasContradiction?: boolean;
  /** True cuando el admin introdujo manualmente el valor (Corregir). */
  correctedByAdmin?: boolean;
}

export interface EnriquecimientoProducto {
  status: EstadoVerificacionProducto;
  checkedAt: string | null;
  input: {
    nombre: string;
    marca: string | null;
    url: string | null;
    ean: string | null;
  };
  fields: Partial<Record<CampoEnriquecimientoProducto, DatoEnriquecidoProducto>>;
  sources: FuenteInformacionProducto[];
  fetchError?: string | null;
}

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
  /** "velas" | "inciensos" | "figuras" | "kits" | "joyas": categorías base con estado propio. */
  categoria: string;
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
  /** Id de `SubcategoriaEntrada` (pertenece a `categoria`). Gestionada desde admin, no un enum fijo. */
  subcategoriaId?: string;
  /** Atributo de la pieza, no categoría. Hoy solo relevante en Pulseras. */
  generoJoya?: GeneroJoya;
  /** Variante de la pieza (oro/acero), no categoría. */
  acabadoJoya?: AcabadoJoya;
  marca?: string | null;
  referencia?: string | null;
  sku?: string | null;
  ean?: string | null;
  peso?: string | null;
  cantidadContenido?: string | null;
  formato?: string | null;
  aroma?: string | null;
  origen?: string | null;
  fabricante?: string | null;
  tipoProducto?: string | null;
  ingredientes?: string | null;
  dimensiones?: string | null;
  duracionAproximada?: string | null;
  descripcionProveedor?: string | null;
  caracteristicas?: string[] | null;
  modoUsoProveedor?: string | null;
  advertencias?: string | null;
  imagenes?: string[] | null;
  urlOrigen?: string | null;
  codigoHsTaric?: string | null;
  fuentesInformacion?: FuenteInformacionProducto[];
  fechaUltimaComprobacion?: string | null;
  estadoVerificacion?: EstadoVerificacionProducto;
  enriquecimiento?: EnriquecimientoProducto;
  /** Si false, el producto no se muestra en la tienda ni se puede añadir al carrito. */
  activo?: boolean;
}

export interface ItemCarrito extends Producto {
  cantidad: number;
}

export interface Cliente {
  /** Nombre de pila del cliente (ej. "MARÍA CARMEN") */
  nombre?: string;
  /** Apellidos del cliente (ej. "GARCÍA LÓPEZ") */
  apellidos?: string;
  /** Nombre completo histórico (para pedidos antiguos) */
  nombreApellidos: string;
  email: string;
  dni?: string;
  telefono?: string;
  direccion?: string;
  /** Tipo de vía: Calle, Avenida, Plaza, etc. */
  tipoVia?: string;
  /** Nombre de la vía (sin el tipo): ej. "Joan Vilanova i Abril". */
  nombreVia?: string;
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

export interface DireccionUsuario {
  id: string;
  alias: string;
  calle: string;
  numero: string;
  bloque?: string;
  escalera?: string;
  piso?: string;
  puerta?: string;
  cp: string;
  poblacion: string;
  provincia: string;
  pais: string;
}

export interface Usuario {
  id: number | string;
  nombre: string;
  email: string;
  dni?: string;
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
  direcciones?: DireccionUsuario[];
  direccionPredeterminadaId?: string;
  password?: string;
  hasPassword?: boolean;
  passwordTemporal?: boolean;
  verificado?: boolean;
  mustChangePassword?: boolean;
  /** Bloqueado desde admin: no puede hacer login. */
  bloqueado?: boolean;
  bloqueadoMotivo?: string;
  bloqueadoEn?: string;
  pedidos?: Pedido[];
}

export interface AuthForm {
  nombre: string;
  email: string;
  dni?: string;
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
  dni?: string;
  telefono: string;
  password: string;
  passwordTemporal?: boolean;
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
  direccionesDisponibles?: DireccionUsuario[];
  direccionEditandoId?: string;
}

export interface Pedido {
  numero: string;
  fecha: string;
  usuarioId?: string;
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
  /** Fuente estructurada al confirmar; el texto largo se deriva con direccionLineaCompletaDesdeEnvio. */
  direccionEnvio?: {
    calle: string;
    numero: string;
    piso: string;
    puerta: string;
    cp: string;
    poblacion: string;
    provincia: string;
    pais: string;
    bloque?: string;
    escalera?: string;
  };
  /** Redundante con la línea derivada de direccionEnvio (compatibilidad / lectura rápida). */
  direccionTexto?: string;
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
  /** Único método de pago real es Bizum: no se recogen ni persisten campos de tarjeta (número/CVV). */
  datosPago: {
    bizumTelefono: string;
  };
  actualizadoEn: string;
}

export type CategoriaEntrada = { id: string; nombre: string; imagen?: string };

/** Subcategoría real: pertenece a una categoría principal (`categoriaId`), gestionable desde admin. */
export type SubcategoriaEntrada = { id: string; categoriaId: string; nombre: string; padreSubcategoriaId?: string };

/** Pack armado por el cliente (reservado para futuro). */
export type TipoPackCampana = "fijo" | "dinamico";

/** Una línea del pack: producto del catálogo + cantidad. */
export interface CampanaPackLinea {
  productoId: number;
  cantidad: number;
}

/**
 * Campaña = pack único en tienda (visual + contenido + control).
 * Una sola campaña activa; se persiste en localStorage (`campana_pack_maika_v1`).
 */
export interface CampanaPackConfig {
  version: 1;
  tipo: TipoPackCampana;
  /** Si false, no se muestra el pack en tienda. */
  activo: boolean;
  /** VISUAL */
  nombre: string;
  subtitulo: string;
  /** URL o ruta de imagen; vacío = primera imagen del primer producto resuelto. */
  imagenUrl: string;
  precio: number;
  precioAnterior: number | null;
  textoBotonTarjeta: string;
  /** CONTENIDO */
  descripcionLarga: string;
  lineas: CampanaPackLinea[];
  /** Texto storytelling / ritual (opcional). */
  textoEspiritual: string;
  /** CONTROL */
  inicio: string;
  fin: string;
  mostrarContador: boolean;
  mostrarAhorro: boolean;
}

export type Pagina =
  | "inicio"
  | "tienda"
  | "suenos"
  | "servicios"
  | "horoscopos"
  | "ritualDelMes"
  | "testimonios"
  | "lectura"
  | "envios"
  | "contacto"
  | "sobreMaika"
  | "legal"
  | "legalTerminos"
  | "legalPrivacidad"
  | "legalCookies"
  | "legalAviso"
  | "carrito"
  | "seguimiento"
  | "cuenta"
  | "admin"
  | "contabilidad"
  | "editarCategorias"
  | "editarProductos"
  | "editarCupones"
  | "inventario"
  | "nuevoProducto"
  | "nuevaCategoria";
