import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import "./App.css";
import Notificacion from "./Notificacion";
import ModalConfirmacion from "./ModalConfirmacion";
import "./Notificacion.css";
import emailjs from "@emailjs/browser";
import { Capacitor } from "@capacitor/core";
import ModalUsuarios from "./components/ModalUsuarios";
import EditUsuarioModal from "./components/EditUsuarioModal";
import PedidoExitoModal from "./components/PedidoExitoModal";
import VisitasCounter from "./components/VisitasCounter";
import Layout from "./components/Layout";
import NavPrincipal from "./components/NavPrincipal";
import { AppProvider, type AppContextValue } from "./context/AppContext";
import InicioPage from "./pages/InicioPage";
import TiendaPage from "./pages/TiendaPage";
import CarritoPage from "./pages/CarritoPage";
import SeguimientoPage from "./pages/SeguimientoPage";
import ContabilidadPage from "./pages/ContabilidadPage";
import CuentaPage from "./pages/CuentaPage";
import FavoritosPage from "./pages/FavoritosPage";
import EditarCategoriasPage from "./pages/admin/EditarCategoriasPage";
import NuevaCategoriaPage from "./pages/admin/NuevaCategoriaPage";
import EditarProductosPage from "./pages/admin/EditarProductosPage";
import InventarioPage from "./pages/admin/InventarioPage";
import NuevoProductoPage from "./pages/admin/NuevoProductoPage";
import type { Producto, ItemCarrito, Cliente, Usuario, Pedido, CuponAplicado, ConsentimientoCookies, PerfilCompraRapida, AuthForm, EditUsuarioForm, Pagina } from "./types";
import { inputStyle } from "./styles/inputStyle";
import {
  EMAILJS_CONFIG,
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_VERSION,
  QUICK_CHECKOUT_KEY,
  CATEGORIA_IMAGENES_KEY,
  UMBRAL_STOCK_BAJO_KEY,
  NOTA_PEDIDO_ENVIO_KEY,
  NOTA_PEDIDO_ENVIO_DEFAULT,
  CUPONES_DISPONIBLES,
  CUPONES_MAIKA_KEY,
  CATALOGO_VELAS_KEY,
  CATALOGO_INCIENSOS_KEY,
  CATALOGO_FIGURAS_KEY,
  CATALOGO_KITS_KEY
} from "./config";
import { useCatalogo } from "./hooks/useCatalogo";
import { useCategorias } from "./hooks/useCategorias";
import { useNotificacion } from "./hooks/useNotificacion";

export type { Producto, ItemCarrito, Cliente, Usuario, Pedido, EditUsuarioForm } from "./types";

function normalizarCodigoCupon(codigo: string): string {
  return codigo.trim().toUpperCase().replace(/\s+/g, "");
}

function ResumenPago({
  total,
  envioPreview,
  cuponAplicado,
  totalAPagar
}: {
  total: number;
  envioPreview: number;
  cuponAplicado: CuponAplicado | null;
  totalAPagar: number;
}) {
  const descuento =
    cuponAplicado == null
      ? 0
      : cuponAplicado.tipo === "porcentaje"
        ? (total * cuponAplicado.valor) / 100
        : envioPreview;
  const textoDescuento =
    cuponAplicado == null
      ? ""
      : cuponAplicado.tipo === "porcentaje"
        ? `Descuento (${cuponAplicado.valor}%):`
        : "Descuento (envío gratis):";
  const fila = (key: string, label: React.ReactNode, valor: React.ReactNode, destacar = false) => (
    <div
      key={key}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        padding: destacar ? "10px 0" : "6px 0",
        borderBottom: destacar ? "2px solid #C9A24A" : "1px solid rgba(201,162,74,0.2)",
        marginBottom: destacar ? 0 : 4
      }}
    >
      <span style={{ color: "white", opacity: destacar ? 1 : 0.9 }}>{label}</span>
      <span style={{ color: destacar ? "#C9A24A" : "white", fontWeight: destacar ? "bold" : "normal", fontSize: destacar ? 18 : 14 }}>
        {valor}
      </span>
    </div>
  );
  return (
    <>
      <p style={{ marginBottom: 12 }}><strong>Resumen:</strong></p>
      {fila("subtotal", "Subtotal", `${Number(total).toFixed(2)} €`)}
      {fila("envio", "Envío", `${Number(envioPreview).toFixed(2)} €`)}
      {cuponAplicado != null && (
        <>
          {fila("cupon", "🎟️ Cupón", cuponAplicado.codigo)}
          {fila("descuento", textoDescuento, `-${Number(descuento).toFixed(2)} €`)}
        </>
      )}
      {fila("total", "TOTAL", `${Number(totalAPagar).toFixed(2)} €`, true)}
    </>
  );
}

function calcularEnvio(provincia: string | undefined, subtotal: number) {
  if (!provincia?.trim()) return 0;
  if (subtotal >= 50) return 0;
  return 4.9;
}

function precioSeguro(precio: unknown): number {
  if (typeof precio === "string") {
    const limpio = precio
      .trim()
      .replace(/[^\d,.-]/g, "")
      .replace(/\.(?=\d{3}(\D|$))/g, "")
      .replace(",", ".");
    const n = Number(limpio);
    return Number.isFinite(n) ? n : 0;
  }

  const n = typeof precio === "number" ? precio : Number(precio);
  return Number.isFinite(n) ? n : 0;
}

function idSeguro(id: unknown): number | null {
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

function fechaPedidoSeguro(fecha: string): Date | null {
  const directa = new Date(fecha);
  if (!Number.isNaN(directa.getTime())) return directa;

  const normalizada = fecha
    .replace(",", "")
    .replace(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/, "$2/$1/$3");

  const alternativa = new Date(normalizada);
  if (!Number.isNaN(alternativa.getTime())) return alternativa;

  return null;
}

export default function App() {
const [pagina, setPagina] = useState<Pagina>("inicio");
  const [cart, setCart] = useState<ItemCarrito[]>([]);
  const { notificacion, setNotificacion, mostrarNotificacion } = useNotificacion();
  const categorias = useCategorias();
  const {
    categoriasCatalogo,
    setCategoriasCatalogo,
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    previewCategoria,
    setPreviewCategoria,
    tamanoCategoria,
    setTamanoCategoria,
    colorCategoria,
    setColorCategoria,
    estiloTextoCategoria,
    setEstiloTextoCategoria,
    nombreImagenCategoria,
    setNombreImagenCategoria,
    nuevaCategoriaNombre,
    setNuevaCategoriaNombre,
    nuevaCategoriaImagen,
    setNuevaCategoriaImagen,
    nuevaCategoriaNombreImagen,
    setNuevaCategoriaNombreImagen,
    nuevaCategoriaTamano,
    setNuevaCategoriaTamano,
    nuevaCategoriaColor,
    setNuevaCategoriaColor,
    nuevaCategoriaEstilo,
    setNuevaCategoriaEstilo,
    categoriaARenombrar,
    setCategoriaARenombrar,
    loadCategoryImage
  } = categorias;

  const catalogo = useCatalogo();
  const {
    velas,
    setVelas,
    inciensos,
    setInciensos,
    figuras,
    setFiguras,
    kits,
    setKits,
    getProductoByValue,
    precioCatalogoPorId,
    precioCatalogoPorNombre,
    precioItemCarrito,
    normalizarItemCarrito
  } = catalogo;

  const [categoriaEditarProductos, setCategoriaEditarProductos] = useState<"velas" | "inciensos" | "figuras">("velas");
  const [productoSeleccionado, setProductoSeleccionado] = useState<string>("");
  const [previewProducto, setPreviewProducto] = useState<string | null>(null);
  const [nombreImagenProducto, setNombreImagenProducto] = useState("");
  const [colorProducto, setColorProducto] = useState<string>("#ffffff");
  const [tamanoProducto, setTamanoProducto] = useState<string>("22");
  const [estiloTextoProducto, setEstiloTextoProducto] = useState<string>("normal");

  const [categoriaNuevoProducto, setCategoriaNuevoProducto] = useState<"velas" | "inciensos" | "figuras">("velas");
  const [nuevoProductoNombre, setNuevoProductoNombre] = useState("");
  const [nuevoProductoPrecio, setNuevoProductoPrecio] = useState("10");
  const [nuevoProductoStock, setNuevoProductoStock] = useState(5);
  const [nuevoProductoDescripcion, setNuevoProductoDescripcion] = useState("");
  const [nuevoProductoImagen, setNuevoProductoImagen] = useState<string | null>(null);
  const [nuevoProductoNombreImagen, setNuevoProductoNombreImagen] = useState("");
  const [nuevoProductoTamano, setNuevoProductoTamano] = useState("22");
  const [nuevoProductoColor, setNuevoProductoColor] = useState("#ffffff");
  const [nuevoProductoEstilo, setNuevoProductoEstilo] = useState<string>("normal");

  useEffect(() => {
    if (pagina !== "editarCategorias") return;
    loadCategoryImage(categoriaSeleccionada);
  }, [pagina, categoriaSeleccionada, loadCategoryImage]);
  const [mostrarAvisoCookies, setMostrarAvisoCookies] = useState(false);
  const [visitas, setVisitas] = useState(0);
  const [claveAdmin, setClaveAdmin] = useState("");
  const [accesoAdmin, setAccesoAdmin] = useState(false);

  const [numeroSeguimiento, setNumeroSeguimiento] = useState("");
  const [pedidoBuscado, setPedidoBuscado] = useState<Pedido | null>(null);

  const [formPedidoAbierto, setFormPedidoAbierto] = useState(false);
  const [pasoFinalizarCompra, setPasoFinalizarCompra] = useState<"datos" | "pago">("datos");
  const [pedidoRealizado, setPedidoRealizado] = useState(false);
  const [urlWhatsAppPendiente, setUrlWhatsAppPendiente] = useState<string | null>(null);
  const [numeroPedidoPreview, setNumeroPedidoPreview] = useState<string | null>(null);
  const [ultimoPedidoNumero, setUltimoPedidoNumero] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [busquedaPedido, setBusquedaPedido] = useState("");
  const [pedidoAbierto, setPedidoAbierto] = useState<number | null>(null);
  const [pedidoFacturaAbierto, setPedidoFacturaAbierto] = useState<Pedido | null>(null);

  const [pendientesAbierto, setPendientesAbierto] = useState(true);
  const [enviadosAbierto, setEnviadosAbierto] = useState(false);
  const [entregadosAbierto, setEntregadosAbierto] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [confirmacionBizumOtroNumeroAbierto, setConfirmacionBizumOtroNumeroAbierto] = useState(false);
  const bizumConfirmadoRef = useRef(false);

  const [modalUsuariosAbierto, setModalUsuariosAbierto] = useState(false);
  const [listaUsuarios, setListaUsuarios] = useState<Usuario[]>([]);
  const [modalEditarUsuarioAbierto, setModalEditarUsuarioAbierto] = useState(false);
  const [editUsuarioForm, setEditUsuarioForm] = useState<EditUsuarioForm | null>(null);
  const [metodoPago, setMetodoPago] = useState<"bizum" | "tarjeta">("bizum");
  const [datosPago, setDatosPago] = useState({
    bizumTelefono: "",
    tarjetaNumero: "",
    tarjetaTitular: "",
    tarjetaCaducidad: "",
    tarjetaCVV: ""
  });
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [cuponInput, setCuponInput] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState<CuponAplicado | null>(null);
  const [cuponError, setCuponError] = useState<string | null>(null);
  const [cuponesAdmin, setCuponesAdmin] = useState<Record<string, { tipo: "porcentaje" | "envio_gratis"; valor: number }>>({});
  const [mostrarConfigCookies, setMostrarConfigCookies] = useState(false);
  const [consentimientoCookies, setConsentimientoCookies] = useState<ConsentimientoCookies>({
    necesarias: true,
    preferencias: false,
    analiticas: false,
    marketing: false,
    fechaActualizacion: "",
    version: COOKIE_CONSENT_VERSION
  });
  const [umbralStockBajo, setUmbralStockBajo] = useState(2);
  const [notaPedidoEnvio, setNotaPedidoEnvio] = useState(NOTA_PEDIDO_ENVIO_DEFAULT);
  const [categoriaTiendaAlAbrir, setCategoriaTiendaAlAbrir] = useState<string | null>(null);
  const [perfilCompraRapida, setPerfilCompraRapida] = useState<PerfilCompraRapida | null>(null);

  const abrirTiendaConCategoria = useCallback((categoria: string) => {
    setCategoriaTiendaAlAbrir(categoria);
    setPagina("tienda");
  }, [setPagina]);

  const [datosCliente, setDatosCliente] = useState<Cliente>({
    nombreApellidos: "",
    email: "",
    telefono: "",
    direccion: "",
    calle: "",
    numero: "",
    bloque: "",
    escalera: "",
    piso: "",
    puerta: "",
    ciudad: "",
    cp: "",
    poblacion: "",
    provincia: "Madrid",
    pais: "España",
    notas: ""
  });

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [modoRegistro, setModoRegistro] = useState<"login" | "register">("login");
  const [formAuth, setFormAuth] = useState<AuthForm>({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
    confirmEmail: "",
    calle: "",
    bloque: "",
    escalera: "",
    piso: "",
    puerta: "",
    numero: "",
    cp: "",
    provincia: "",
    poblacion: "",
    pais: "España",
    confirmPassword: "",
    codigoVerificacion: "",
    codigoIngresado: "",
    pasoVerificacion: 1
  });
  const [reenvioDisponibleEn, setReenvioDisponibleEn] = useState(0);
  const esAppNativa = Capacitor.isNativePlatform();

  const pedidosPendientes = useMemo(
    () => pedidos.filter(p => (p.estado ?? "pendiente") === "pendiente"),
    [pedidos]
  );

  const pedidosEnviados = useMemo(
    () => pedidos.filter(p => (p.estado ?? "pendiente") === "enviado"),
    [pedidos]
  );

  const pedidosEntregados = useMemo(
    () => pedidos.filter(p => (p.estado ?? "pendiente") === "entregado"),
    [pedidos]
  );

  const pedidosPendientesOrdenados = useMemo(
    () => [...pedidosPendientes].sort((a: Pedido, b: Pedido) =>
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    ),
    [pedidosPendientes]
  );

  const pedidosEnviadosOrdenados = useMemo(
    () => [...pedidosEnviados].sort((a: Pedido, b: Pedido) =>
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    ),
    [pedidosEnviados]
  );

  const pedidosEntregadosOrdenados = useMemo(
    () => [...pedidosEntregados].sort((a: Pedido, b: Pedido) =>
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    ),
    [pedidosEntregados]
  );

  const metricasAdmin = useMemo(() => {
    const ahora = new Date();
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const inicioSemana = new Date(inicioHoy);
    inicioSemana.setDate(inicioSemana.getDate() - 6);
    const inicioSemanaAnterior = new Date(inicioSemana);
    inicioSemanaAnterior.setDate(inicioSemanaAnterior.getDate() - 7);

    let ventasHoy = 0;
    let ventasSemana = 0;

    const acumuladoProductos = new Map<string, { cantidad: number; ventas: number }>();
    const ventasSemanaActual = new Map<string, number>();
    const ventasSemanaAnterior = new Map<string, number>();

    pedidos.forEach((pedido) => {
      const totalPedido = Number.isFinite(Number(pedido.total)) ? Number(pedido.total) : 0;
      const fechaPedido = fechaPedidoSeguro(pedido.fecha);

      if (fechaPedido && fechaPedido >= inicioHoy) {
        ventasHoy += totalPedido;
      }

      if (fechaPedido && fechaPedido >= inicioSemana) {
        ventasSemana += totalPedido;
      }

      pedido.items?.forEach((item) => {
        const nombre = (item.nombre || "Producto sin nombre").trim();
        const cantidad = Number.isFinite(Number(item.cantidad)) ? Number(item.cantidad) : 0;
        const precio = precioSeguro(item.precio);
        const actual = acumuladoProductos.get(nombre) ?? { cantidad: 0, ventas: 0 };

        acumuladoProductos.set(nombre, {
          cantidad: actual.cantidad + cantidad,
          ventas: actual.ventas + precio * cantidad
        });

        if (fechaPedido && fechaPedido >= inicioSemana) {
          ventasSemanaActual.set(nombre, (ventasSemanaActual.get(nombre) ?? 0) + cantidad);
        } else if (fechaPedido && fechaPedido >= inicioSemanaAnterior && fechaPedido < inicioSemana) {
          ventasSemanaAnterior.set(nombre, (ventasSemanaAnterior.get(nombre) ?? 0) + cantidad);
        }
      });
    });

    const topProductos = [...acumuladoProductos.entries()]
      .map(([nombre, data]) => ({ nombre, ...data }))
      .sort((a, b) => b.cantidad - a.cantidad || b.ventas - a.ventas)
      .slice(0, 3);

    const tendenciaTopProductos = [...ventasSemanaActual.entries()]
      .map(([nombre, cantidadActual]) => {
        const cantidadAnterior = ventasSemanaAnterior.get(nombre) ?? 0;
        const variacion = cantidadActual - cantidadAnterior;

        return {
          nombre,
          actual: cantidadActual,
          anterior: cantidadAnterior,
          variacion,
          tendencia:
            cantidadAnterior === 0
              ? "nuevo"
              : variacion > 0
                ? "sube"
                : variacion < 0
                  ? "baja"
                  : "igual"
        };
      })
      .sort((a, b) => b.actual - a.actual)
      .slice(0, 5);

    const catalogoProductos = [...velas, ...inciensos, ...figuras, ...kits];
    const alertasStockBajo = catalogoProductos
      .filter((producto) => Number(producto.stock) <= umbralStockBajo)
      .map((producto) => ({
        id: producto.id,
        nombre: producto.nombre,
        stock: Number(producto.stock),
        categoria: producto.categoria
      }))
      .sort((a, b) => a.stock - b.stock || a.nombre.localeCompare(b.nombre));

    const carritoItemsPendientes = cart.reduce((sum, item) => {
      const cantidad = Number.isFinite(Number(item.cantidad)) ? Number(item.cantidad) : 0;
      return sum + cantidad;
    }, 0);

    const carritoImportePendiente = cart.reduce((sum, item) => {
      const cantidad = Number.isFinite(Number(item.cantidad)) ? Number(item.cantidad) : 0;
      return sum + precioSeguro(item.precio) * cantidad;
    }, 0);

    return {
      ventasHoy,
      ventasSemana,
      topProductos,
      tendenciaTopProductos,
      alertasStockBajo,
      carritoItemsPendientes,
      carritoImportePendiente
    };
  }, [pedidos, cart, velas, inciensos, figuras, kits, umbralStockBajo]);

  const metricasUsuariosAdmin = useMemo(() => {
    const usuariosGuardados = (listaUsuarios.length > 0
      ? listaUsuarios
      : JSON.parse(localStorage.getItem("usuarios") || "[]")) as Usuario[];
    const ahora = Date.now();
    const sieteDiasMs = 7 * 24 * 60 * 60 * 1000;

    const total = usuariosGuardados.length;
    const verificados = usuariosGuardados.filter((u) => !!u.verificado).length;
    const pendientes = total - verificados;
    const conPedidos = usuariosGuardados.filter((u) => (u.pedidos?.length || 0) > 0).length;
    const nuevos7dias = usuariosGuardados.filter((u) => {
      const idNumero = Number(u.id);
      return Number.isFinite(idNumero) && idNumero > 1_000_000_000_000 && ahora - idNumero <= sieteDiasMs;
    }).length;

    return {
      total,
      verificados,
      pendientes,
      conPedidos,
      nuevos7dias
    };
  }, [listaUsuarios, usuario, accesoAdmin]);

  // ========== FUNCIÓN ENVIAR EMAIL CORREGIDA ==========
  const enviarCodigoEmail = async (email: string, nombre: string, codigo: string) => {
    try {
      // ✅ Inicializar con la Public Key (Z-4fOHeB2ph9ZNZIH)
      emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
      
    const templateParams = {
  to_email: email,
  to: email,
  email: email,
  to_name: nombre,
  name: nombre,
  from_name: "MAIKA - La ruta del alma",
  codigo: codigo,
  reply_to: email
};
      console.log("📧 Enviando email...", {
        serviceId: EMAILJS_CONFIG.SERVICE_ID,
        templateId: EMAILJS_CONFIG.TEMPLATE_ID,
        to: email
      });

      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams
      );
      
      console.log("✅ Email enviado:", response);
      return true;
      
    } catch (error: unknown) {
      console.error("❌ Error completo:", error);

      const err = error as any;
      // Mensajes de error más específicos
      if (err?.text) {
        console.error("Mensaje:", err.text);
      }
      if (err?.status) {
        console.error("Estado:", err.status);
      }

      return false;
    }
  };

  // Solo cargar carrito desde localStorage una vez al montar (no al cambiar normalizarItemCarrito)
  const carritoYaCargadoRef = useRef(false);
  useEffect(() => {
    if (carritoYaCargadoRef.current) return;
    carritoYaCargadoRef.current = true;

    const carritoGuardado = localStorage.getItem("carritoMaika");
    if (carritoGuardado) {
      try {
        const carritoParseado = JSON.parse(carritoGuardado) as ItemCarrito[];
        const carritoSeguro = Array.isArray(carritoParseado) ? carritoParseado : [];
        const carritoNormalizado = carritoSeguro
          .map((item) => normalizarItemCarrito(item))
          .filter((item) => item.cantidad > 0);

        setCart(carritoNormalizado);

        const originalSerializado = JSON.stringify(carritoSeguro);
        const normalizadoSerializado = JSON.stringify(carritoNormalizado);
        if (originalSerializado !== normalizadoSerializado) {
          localStorage.setItem("carritoMaika", normalizadoSerializado);
        }
      } catch {
        localStorage.removeItem("carritoMaika");
        setCart([]);
      }
    }
  }, [normalizarItemCarrito]);

  // Cargar resto de datos guardados (usuario, cookies, etc.)
  useEffect(() => {
    // ✅ Cargar usuario guardado
    const usuarioGuardado = localStorage.getItem("usuarioActual");
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado) as Usuario);
    }

    const consentimientoRaw = localStorage.getItem(COOKIE_CONSENT_KEY);
    let consentimientoCargado: ConsentimientoCookies | null = null;

    if (consentimientoRaw) {
      try {
        const parseado = JSON.parse(consentimientoRaw) as ConsentimientoCookies;
        if (parseado?.version === COOKIE_CONSENT_VERSION) {
          consentimientoCargado = {
            necesarias: true,
            preferencias: !!parseado.preferencias,
            analiticas: !!parseado.analiticas,
            marketing: !!parseado.marketing,
            fechaActualizacion: parseado.fechaActualizacion || "",
            version: COOKIE_CONSENT_VERSION
          };
          setConsentimientoCookies(consentimientoCargado);
        } else {
          localStorage.removeItem(COOKIE_CONSENT_KEY);
        }
      } catch {
        localStorage.removeItem(COOKIE_CONSENT_KEY);
      }
    }

    const perfilCompraRapidaRaw = localStorage.getItem(QUICK_CHECKOUT_KEY);
    if (perfilCompraRapidaRaw) {
      try {
        const perfil = JSON.parse(perfilCompraRapidaRaw) as PerfilCompraRapida;
        if (perfil?.datosCliente && perfil?.metodoPago && perfil?.datosPago) {
          setPerfilCompraRapida(perfil);
        }
      } catch {
        localStorage.removeItem(QUICK_CHECKOUT_KEY);
      }
    }

    const visitasGuardadasRaw = localStorage.getItem("visitasMaika");
    const visitasGuardadas = Number.parseInt(visitasGuardadasRaw || "0", 10);
    const visitasBase = Number.isFinite(visitasGuardadas) ? visitasGuardadas : 0;

    if (consentimientoCargado?.analiticas) {
      const nuevasVisitas = visitasBase + 1;
      setVisitas(nuevasVisitas);
      localStorage.setItem("visitasMaika", String(nuevasVisitas));
    } else {
      setVisitas(visitasBase);
    }

    const pedidosGuardados = localStorage.getItem("pedidosMaika");
    if (pedidosGuardados) {
      const pedidosCargados = JSON.parse(pedidosGuardados) as Pedido[];
      const pedidosReparados = pedidosCargados.map((p: Pedido) => ({
        ...p,
        estado: p.estado || "pendiente"
      }));
      setPedidos(pedidosReparados);
      localStorage.setItem("pedidosMaika", JSON.stringify(pedidosReparados));
    }

    const clienteGuardado = localStorage.getItem("clienteMaika");
    if (clienteGuardado) {
      setDatosCliente(JSON.parse(clienteGuardado) as Cliente);
    }
    const umbralGuardado = localStorage.getItem(UMBRAL_STOCK_BAJO_KEY);
    if (umbralGuardado) {
      const n = parseInt(umbralGuardado, 10);
      if (Number.isFinite(n) && n >= 0 && n <= 99) setUmbralStockBajo(n);
    }
    const notaGuardada = localStorage.getItem(NOTA_PEDIDO_ENVIO_KEY);
    if (notaGuardada != null && notaGuardada !== "") setNotaPedidoEnvio(notaGuardada);
    if (!consentimientoCargado) {
      setMostrarAvisoCookies(true);
    }
    // Solo al montar: no depender de normalizarItemCarrito para no re-ejecutar al cambiar catálogo
  // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial intencional una sola vez
  }, []);

  useEffect(() => {
    if (pagina !== "editarProductos") return;
    const list = categoriaEditarProductos === "velas" ? velas : categoriaEditarProductos === "inciensos" ? inciensos : figuras;
    const first = list[0];
    if (first) {
      setProductoSeleccionado(`${categoriaEditarProductos}-${first.id}`);
      setTamanoProducto(String(first.nombreTamano ?? 22));
      setColorProducto(first.nombreColor ?? "#ffffff");
      setEstiloTextoProducto(first.nombreEstilo ?? "normal");
      setPreviewProducto(first.imagen ? first.imagen : null);
      setNombreImagenProducto("");
    }
  }, [pagina, categoriaEditarProductos, velas, inciensos, figuras]);

  const esPrimeraEjecucionGuardarCarritoRef = useRef(true);
  useEffect(() => {
    if (esPrimeraEjecucionGuardarCarritoRef.current) {
      esPrimeraEjecucionGuardarCarritoRef.current = false;
      return;
    }
    localStorage.setItem("carritoMaika", JSON.stringify(cart));
  }, [cart]);

  const totalItemsCarrito = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const cantidad = Number.isFinite(Number(item.cantidad)) ? Number(item.cantidad) : 0;
        return sum + cantidad;
      }, 0),
    [cart]
  );

  const total = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const cantidad = Number.isFinite(Number(item.cantidad)) ? Number(item.cantidad) : 0;
        return sum + precioItemCarrito(item) * cantidad;
      }, 0),
    [cart, precioCatalogoPorId, precioCatalogoPorNombre]
  );
  const envioPreview = calcularEnvio(datosCliente.provincia, total);
  const totalPreview = total + envioPreview;
  const descuentoCupon = useMemo(() => {
    if (!cuponAplicado) return 0;
    if (cuponAplicado.tipo === "porcentaje") {
      return (total * cuponAplicado.valor) / 100;
    }
    return envioPreview;
  }, [cuponAplicado, total, envioPreview]);

  const totalAPagarResumen = useMemo(
    () => Math.max(0, total + envioPreview - descuentoCupon),
    [total, envioPreview, descuentoCupon]
  );

  const guardarConsentimientoCookies = (consentimientoBase: Omit<ConsentimientoCookies, "necesarias" | "fechaActualizacion" | "version">) => {
    const consentimientoFinal: ConsentimientoCookies = {
      necesarias: true,
      preferencias: !!consentimientoBase.preferencias,
      analiticas: !!consentimientoBase.analiticas,
      marketing: !!consentimientoBase.marketing,
      fechaActualizacion: new Date().toISOString(),
      version: COOKIE_CONSENT_VERSION
    };

    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentimientoFinal));
    setConsentimientoCookies(consentimientoFinal);
    setMostrarAvisoCookies(false);
    setMostrarConfigCookies(false);
  };

  const aceptarTodasCookies = () => {
    guardarConsentimientoCookies({ preferencias: true, analiticas: true, marketing: true });
    mostrarNotificacion("✅ Cookies aceptadas", "exito");
  };

  const rechazarCookiesOpcionales = () => {
    guardarConsentimientoCookies({ preferencias: false, analiticas: false, marketing: false });
    mostrarNotificacion("✅ Solo cookies necesarias activas", "normal");
  };

  const comprarEnUnClick = async () => {
    if (!perfilCompraRapida) {
      mostrarNotificacion("No tienes un perfil guardado para compra rápida", "error");
      return;
    }

    if (cart.length === 0) {
      mostrarNotificacion("Carrito vacío", "error");
      return;
    }

    setDatosCliente(perfilCompraRapida.datosCliente);
    setMetodoPago(perfilCompraRapida.metodoPago);
    setDatosPago(perfilCompraRapida.datosPago);

    const errorPago = (() => {
      if (perfilCompraRapida.metodoPago === "bizum") {
        const telefonoSinPrefijo = normalizarTelefonoBizum(perfilCompraRapida.datosPago.bizumTelefono);
        if (!/^[67]\d{8}$/.test(telefonoSinPrefijo)) {
          return "No se pudo usar compra rápida: móvil de Bizum no válido";
        }
        return null;
      }

      const numero = perfilCompraRapida.datosPago.tarjetaNumero.replace(/\s+/g, "");
      if (!/^\d{13,19}$/.test(numero)) return "No se pudo usar compra rápida: tarjeta no válida";
      if (!perfilCompraRapida.datosPago.tarjetaTitular.trim()) return "No se pudo usar compra rápida: falta titular";
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(perfilCompraRapida.datosPago.tarjetaCaducidad.trim())) {
        return "No se pudo usar compra rápida: caducidad no válida";
      }
      if (!/^\d{3,4}$/.test(perfilCompraRapida.datosPago.tarjetaCVV.trim())) return "No se pudo usar compra rápida: CVC no válido";
      return null;
    })();

    if (errorPago) {
      mostrarNotificacion(errorPago, "error");
      return;
    }

    // Abrir formulario de finalizar compra con datos y pago ya rellenados; el cliente revisa y pulsa "Pagar y enviar"
    setNumeroPedidoPreview(generarNumeroPedido());
    setPasoFinalizarCompra("datos");
    setFormPedidoAbierto(true);
    mostrarNotificacion("⚡ Datos cargados. Revisa y pulsa «Continuar al pago»", "normal");
  };

  const getCuponesDisponibles = (): Record<string, { tipo: "porcentaje" | "envio_gratis"; valor: number }> => {
    try {
      const guardado = localStorage.getItem(CUPONES_MAIKA_KEY);
      if (guardado) {
        const parsed = JSON.parse(guardado) as Record<string, { tipo: "porcentaje" | "envio_gratis"; valor: number }>;
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch {
      /* usar defecto */
    }
    return CUPONES_DISPONIBLES;
  };

  const aplicarCupon = () => {
    setCuponError(null);
    let codigo = normalizarCodigoCupon(cuponInput);
    if (!codigo) {
      setCuponError("Introduce un código promocional.");
      mostrarNotificacion("Introduce un código de cupón", "error");
      return;
    }

    const cupones = getCuponesDisponibles();
    let cupon = cupones[codigo];
    if (!cupon && /\s+o\s+/i.test(cuponInput)) {
      const primero = cuponInput.trim().split(/\s+o\s+/i)[0];
      if (primero) {
        codigo = normalizarCodigoCupon(primero);
        cupon = cupones[codigo];
      }
    }
    if (!cupon) {
      setCuponError("Código no válido. Comprueba el código e inténtalo de nuevo.");
      mostrarNotificacion("Código no válido", "error");
      return;
    }

    setCuponAplicado({ codigo, ...cupon });
    setCuponInput(codigo);

    if (cupon.tipo === "porcentaje") {
      mostrarNotificacion(`✅ Cupón ${codigo} aplicado (${cupon.valor}% descuento)`, "exito");
      return;
    }

    mostrarNotificacion(`✅ Cupón ${codigo} aplicado (envío gratis)`, "exito");
  };

  const quitarCupon = () => {
    setCuponAplicado(null);
    setCuponInput("");
    setCuponError(null);
    mostrarNotificacion("Cupón eliminado", "normal");
  };

  const agregarAlCarrito = useCallback((producto: Producto) => {
    const idNum = Number(producto.id);
    const stockDisponible = Math.max(0, Number(producto.stock));
    if (!Number.isFinite(idNum) || stockDisponible <= 0) {
      mostrarNotificacion(`❌ ${producto.nombre} agotado`, "error");
      return;
    }

    const cantidadEnCarrito = (() => {
      const item = cart.find((p) => idSeguro(p.id) === idNum);
      return item ? Math.max(0, Number(item.cantidad) || 0) : 0;
    })();
    if (cantidadEnCarrito >= stockDisponible) {
      mostrarNotificacion(`Solo hay ${stockDisponible} unidades disponibles de ${producto.nombre}`, "error");
      return;
    }

    const precioNormalizado = (() => {
      const directo = precioSeguro(producto.precio);
      if (directo > 0) return directo;
      return precioCatalogoPorId.get(idNum) ?? precioCatalogoPorId.get(producto.id as number) ?? 0;
    })();

    setCart((prev) => {
      const existente = prev.find((p) => idSeguro(p.id) === idNum);
      const cantidadActual = existente ? Number(existente.cantidad) || 0 : 0;
      const nuevaCantidad = Math.min(cantidadActual + 1, stockDisponible);
      if (existente) {
        return prev.map((p) =>
          idSeguro(p.id) === idNum
            ? {
                ...p,
                precio: precioNormalizado > 0 ? precioNormalizado : precioItemCarrito(p),
                cantidad: nuevaCantidad
              }
            : p
        );
      }
      return [...prev, normalizarItemCarrito({ ...producto, id: idNum, precio: precioNormalizado, cantidad: 1 })];
    });

    mostrarNotificacion(`✅ ${producto.nombre} añadido`, "exito");
  }, [cart, mostrarNotificacion, precioCatalogoPorId, precioItemCarrito, normalizarItemCarrito]);

  const getStockProducto = useCallback((id: number) => {
    const stock = (id < 100)
      ? velas.find(p => p.id === id)?.stock
      : (id < 200) ? inciensos.find(p => p.id === id)?.stock
      : (id < 300) ? figuras.find(p => p.id === id)?.stock
      : kits.find(p => p.id === id)?.stock;
    return Math.max(0, Number(stock ?? 0));
  }, [velas, inciensos, figuras, kits]);

  const cambiarCantidad = (id: number, incremento: number) => {
    const idNum = Number(id);
    if (!Number.isFinite(idNum)) return;

    const stockDisponible = getStockProducto(idNum);
    const itemActual = cart.find(p => idSeguro(p.id) === idNum || Number(p.id) === idNum);
    const cantidadActual = itemActual ? (Number(itemActual.cantidad) || 0) : 0;

    if (incremento > 0 && stockDisponible <= 0) {
      const nombre = itemActual?.nombre ?? "Producto";
      mostrarNotificacion(`❌ ${nombre} agotado`, "error");
      return;
    }
    if (incremento > 0 && cantidadActual >= stockDisponible) {
      const nombre = itemActual?.nombre ?? "Producto";
      mostrarNotificacion(`Solo hay ${stockDisponible} unidades disponibles de ${nombre}`, "error");
      return;
    }

    const nextCart = (prev: ItemCarrito[]) => {
      const item = prev.find(p => idSeguro(p.id) === idNum || Number(p.id) === idNum);
      if (!item) return prev;
      let nuevaCantidad = Math.max(0, (Number(item.cantidad) || 0) + incremento);
      if (incremento > 0) {
        nuevaCantidad = Math.min(nuevaCantidad, stockDisponible);
      }
      return prev.map(p => {
        if (idSeguro(p.id) !== idNum && Number(p.id) !== idNum) return { ...p };
        return {
          ...p,
          id: idNum,
          precio: precioItemCarrito(p),
          cantidad: nuevaCantidad
        };
      }).filter(p => p.cantidad > 0);
    };

    flushSync(() => {
      setCart(nextCart);
    });
  };

  const vaciarCarrito = () => {
    if (cart.length === 0) {
      mostrarNotificacion("Carrito vacío", "error");
      return;
    }
    setModalAbierto(true);
  };

  const confirmarVaciarCarrito = () => {
    setCart([]);
    setModalAbierto(false);
    mostrarNotificacion("Carrito vaciado", "exito");
  };

  const generarNumeroPedido = () => {
    const year = new Date().getFullYear().toString().slice(2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
    const day = new Date().getDate().toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 100).toString().padStart(2, "0");
    return `MK${year}${month}${day}-${random}`;
  };

  const normalizarTelefonoBizum = (telefono: string): string => {
    const soloDigitos = telefono.replace(/\D/g, "").trim();

    if (soloDigitos.startsWith("0034") && soloDigitos.length > 4) {
      return soloDigitos.slice(4);
    }

    if (soloDigitos.startsWith("34") && soloDigitos.length > 9) {
      return soloDigitos.slice(2);
    }

    return soloDigitos;
  };

  const autocompletarPorCodigoPostal = async (
    cp: string,
    destino: "registro" | "checkout"
  ) => {
    if (!/^\d{5}$/.test(cp)) return;

    const provinciaPorPrefijo: Record<string, string> = {
      "01": "Álava", "02": "Albacete", "03": "Alicante", "04": "Almería", "05": "Ávila",
      "06": "Badajoz", "07": "Illes Balears", "08": "Barcelona", "09": "Burgos", "10": "Cáceres",
      "11": "Cádiz", "12": "Castellón", "13": "Ciudad Real", "14": "Córdoba", "15": "A Coruña",
      "16": "Cuenca", "17": "Girona", "18": "Granada", "19": "Guadalajara", "20": "Gipuzkoa",
      "21": "Huelva", "22": "Huesca", "23": "Jaén", "24": "León", "25": "Lleida",
      "26": "La Rioja", "27": "Lugo", "28": "Madrid", "29": "Málaga", "30": "Murcia",
      "31": "Navarra", "32": "Ourense", "33": "Asturias", "34": "Palencia", "35": "Las Palmas",
      "36": "Pontevedra", "37": "Salamanca", "38": "Santa Cruz de Tenerife", "39": "Cantabria", "40": "Segovia",
      "41": "Sevilla", "42": "Soria", "43": "Tarragona", "44": "Teruel", "45": "Toledo",
      "46": "Valencia", "47": "Valladolid", "48": "Bizkaia", "49": "Zamora", "50": "Zaragoza",
      "51": "Ceuta", "52": "Melilla"
    };

    try {
      const response = await fetch(`https://api.zippopotam.us/es/${cp}`);
      if (!response.ok) return;

      const data = (await response.json()) as {
        places?: Array<{
          state: string;
          "place name": string;
        }>;
      };

      const lugar = data.places?.[0];
      if (!lugar) return;

      const poblacion = (lugar["place name"] || "").trim();
      const provincia = provinciaPorPrefijo[cp.slice(0, 2)] || (lugar.state || "").trim();
      const pais = "España";

      if (destino === "registro") {
        setFormAuth((prev) =>
          prev.cp === cp
            ? {
                ...prev,
                poblacion: poblacion || prev.poblacion,
                provincia: provincia || prev.provincia,
                pais
              }
            : prev
        );
        return;
      }

      setDatosCliente((prev) =>
        prev.cp === cp
          ? {
              ...prev,
              poblacion: poblacion || prev.poblacion,
              provincia: provincia || prev.provincia,
              pais
            }
          : prev
      );
    } catch {
      // Ignorar errores de red para no interrumpir el flujo del usuario
    }
  };

  useEffect(() => {
    if (/^\d{5}$/.test(formAuth.cp)) {
      autocompletarPorCodigoPostal(formAuth.cp, "registro");
    }
  }, [formAuth.cp]);

  useEffect(() => {
    if (reenvioDisponibleEn <= 0) return;

    const timer = window.setInterval(() => {
      setReenvioDisponibleEn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [reenvioDisponibleEn]);

  useEffect(() => {
    const cpCheckout = String(datosCliente.cp || "");
    if (/^\d{5}$/.test(cpCheckout)) {
      autocompletarPorCodigoPostal(cpCheckout, "checkout");
    }
  }, [datosCliente.cp]);

  const provinciaPaisBloqueadosRegistro =
    /^\d{5}$/.test(formAuth.cp) && !!formAuth.provincia?.trim() && !!formAuth.pais?.trim();

  const provinciaPaisBloqueadosCheckout =
    /^\d{5}$/.test(String(datosCliente.cp || "")) &&
    !!datosCliente.provincia?.trim() &&
    !!datosCliente.pais?.trim();

  const generarReferenciaPago = () => {
    const time = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 900 + 100);
    return `PAY-${time}-${random}`;
  };

  const enviarPedidoWhatsApp = async (override?: {
    datosCliente?: Cliente;
    metodoPago?: "bizum" | "tarjeta";
    datosPago?: {
      bizumTelefono: string;
      tarjetaNumero: string;
      tarjetaTitular: string;
      tarjetaCaducidad: string;
      tarjetaCVV: string;
    };
  }) => {
    const datosClienteActual = override?.datosCliente ?? datosCliente;
    const metodoPagoActual = override?.metodoPago ?? metodoPago;
    const datosPagoActual = override?.datosPago ?? datosPago;

    const direccionCompleta = `${datosClienteActual.calle?.trim() || ""}${datosClienteActual.numero?.trim() ? `, Nº ${datosClienteActual.numero.trim()}` : ""}${datosClienteActual.bloque?.trim() ? `, Bloque ${datosClienteActual.bloque.trim()}` : ""}${datosClienteActual.escalera?.trim() ? `, Esc. ${datosClienteActual.escalera.trim()}` : ""}${datosClienteActual.piso?.trim() ? `, Piso ${datosClienteActual.piso.trim()}` : ""}${datosClienteActual.puerta?.trim() ? `, Puerta ${datosClienteActual.puerta.trim()}` : ""}`.trim();

    if (
      !datosClienteActual.nombreApellidos?.trim() ||
      !datosClienteActual.email?.trim() ||
      !datosClienteActual.calle?.trim() ||
      !datosClienteActual.numero?.trim() ||
      !datosClienteActual.cp?.trim() ||
      !datosClienteActual.poblacion?.trim() ||
      !datosClienteActual.provincia?.trim() ||
      !datosClienteActual.pais?.trim()
    ) {
      mostrarNotificacion("Completa todos los datos", "error");
      return;
    }
    if (cart.length === 0) {
      mostrarNotificacion("Carrito vacío", "error");
      return;
    }

    const errorPago = (() => {
      if (metodoPagoActual === "bizum") {
        const telefonoSinPrefijo = normalizarTelefonoBizum(datosPagoActual.bizumTelefono);

        if (!/^[67]\d{8}$/.test(telefonoSinPrefijo)) {
          return "Introduce el número de móvil para pago Bizum (9 dígitos)";
        }
        return null;
      }

      const numero = datosPagoActual.tarjetaNumero.replace(/\s+/g, "");
      if (!/^\d{13,19}$/.test(numero)) {
        return "Número de tarjeta no válido";
      }
      if (!datosPagoActual.tarjetaTitular.trim()) {
        return "Introduce el titular de la tarjeta";
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(datosPagoActual.tarjetaCaducidad.trim())) {
        return "No se pudo usar compra rápida: caducidad no válida";
      }
      if (!/^\d{3,4}$/.test(datosPagoActual.tarjetaCVV.trim())) {
        return "No se pudo usar compra rápida: CVC no válido";
      }
      return null;
    })();
    if (errorPago) {
      mostrarNotificacion(errorPago, "error");
      return;
    }

    // Si pago es Bizum: avisar cuando el teléfono de contacto esté vacío o no coincida con el de Bizum
    if (metodoPagoActual === "bizum") {
      const bizumNorm = normalizarTelefonoBizum(datosPagoActual.bizumTelefono);
      const contactoNorm = normalizarTelefonoBizum(datosClienteActual.telefono || "");
      const contactoValido = /^[67]\d{8}$/.test(contactoNorm);
      const sonDiferentes = contactoNorm !== bizumNorm;
      if (bizumNorm && (!contactoValido || sonDiferentes)) {
        if (bizumConfirmadoRef.current) {
          bizumConfirmadoRef.current = false;
        } else {
          setConfirmacionBizumOtroNumeroAbierto(true);
          return;
        }
      }
    }

    setProcesandoPago(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const referenciaPago = generarReferenciaPago();
      const numeroPedido = generarNumeroPedido();
      setUltimoPedidoNumero(numeroPedido);
      const envio = calcularEnvio(datosClienteActual.provincia, total);
      const descuentoAplicado = descuentoCupon;
      const totalFinal = Math.max(0, total + envio - descuentoAplicado);
      const metodoPagoTexto = metodoPagoActual === "bizum" ? "Bizum" : "Tarjeta";

      let mensaje = `🛍️ *NUEVO PEDIDO MAIKA* 🛍️\n\n`;
      mensaje += `📦 *Nº Pedido:* ${numeroPedido}\n`;
      mensaje += `💳 *Pago:* ${metodoPagoTexto}\n`;
      mensaje += `🧾 *Referencia pago:* ${referenciaPago}\n`;
      if (metodoPagoActual === "bizum") {
        const bizumNormalizado = normalizarTelefonoBizum(datosPagoActual.bizumTelefono);
        mensaje += `📱 *Bizum:* +34 ${bizumNormalizado}\n`;
      }
      mensaje += `👤 *Cliente:* ${datosClienteActual.nombreApellidos}\n`;
      mensaje += `📧 *Email:* ${datosClienteActual.email}\n`;
      mensaje += `📞 *Teléfono:* ${datosClienteActual.telefono}\n`;
      mensaje += `📍 *Dirección:* ${direccionCompleta}, ${datosClienteActual.cp} ${datosClienteActual.poblacion}, ${datosClienteActual.provincia}, ${datosClienteActual.pais}\n\n`;
      mensaje += `📋 *PRODUCTOS:*\n`;

      cart.forEach(item => {
        const precioUnitario = precioItemCarrito(item);
        mensaje += `   • ${item.nombre} x${item.cantidad} = ${(precioUnitario * item.cantidad).toFixed(2)}€\n`;
      });

      mensaje += `\n💰 *Subtotal:* ${total.toFixed(2)}€`;
      mensaje += `\n🚚 *Envío:* ${envio.toFixed(2)}€`;
      if (cuponAplicado) {
        const textoDesc =
          cuponAplicado.tipo === "porcentaje"
            ? `Descuento (${cuponAplicado.valor}%):`
            : "Descuento (envío gratis):";
        mensaje += `\n🎟️ *Cupón:* ${cuponAplicado.codigo}`;
        mensaje += `\n➖ *${textoDesc}* -${descuentoAplicado.toFixed(2)}€`;
      }
      mensaje += `\n💶 *TOTAL:* ${totalFinal.toFixed(2)}€`;

      const urlWhatsApp = `https://wa.me/34673175547?text=${encodeURIComponent(mensaje)}`;

      const pedidoNuevo: Pedido = {
        numero: numeroPedido,
        fecha: new Date().toLocaleString(),
        cliente: { ...datosClienteActual },
        items: cart,
        subtotal: total,
        envio,
        total: totalFinal,
        estado: "pendiente",
        pago: {
          metodo: metodoPagoActual,
          estado: "pagado",
          referencia: referenciaPago
        },
        descuento: descuentoAplicado,
        cupon: cuponAplicado?.codigo
      };

      const pedidosActuales = JSON.parse(localStorage.getItem("pedidosMaika") || "[]") as Pedido[];
      const nuevosPedidos = [pedidoNuevo, ...pedidosActuales];
      localStorage.setItem("pedidosMaika", JSON.stringify(nuevosPedidos));
      setPedidos(nuevosPedidos as Pedido[]);

      // ========== INTEGRACIÓN CON SISTEMA DE USUARIOS ==========
      const emailCliente = datosClienteActual.email.trim().toLowerCase();
      const usuariosGuardados = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
      const usuarioIndex = usuariosGuardados.findIndex((u: Usuario) => u.email.toLowerCase() === emailCliente);

      if (usuarioIndex !== -1) {
        // El usuario ya existe, le añadimos el pedido a su lista
        if (!usuariosGuardados[usuarioIndex].pedidos) {
          usuariosGuardados[usuarioIndex].pedidos = [];
        }
        usuariosGuardados[usuarioIndex].pedidos!.push(pedidoNuevo);
        localStorage.setItem("usuarios", JSON.stringify(usuariosGuardados));
        
        // Si es el usuario actualmente logueado, actualizamos su estado
        if (usuario && usuario.email.toLowerCase() === emailCliente) {
          setUsuario(usuariosGuardados[usuarioIndex]);
          localStorage.setItem("usuarioActual", JSON.stringify(usuariosGuardados[usuarioIndex]));
        }
      } else {
        // El usuario NO existe, lo creamos y le añadimos el pedido
        const nuevoUsuario: Usuario = {
          id: Date.now(),
          nombre: datosClienteActual.nombreApellidos,
          email: datosClienteActual.email,
          telefono: datosClienteActual.telefono,
          direccion: direccionCompleta,
          calle: datosClienteActual.calle,
          numero: datosClienteActual.numero,
          bloque: datosClienteActual.bloque,
          escalera: datosClienteActual.escalera,
          piso: datosClienteActual.piso,
          puerta: datosClienteActual.puerta,
          cp: datosClienteActual.cp,
          poblacion: datosClienteActual.poblacion,
          provincia: datosClienteActual.provincia,
          pais: datosClienteActual.pais,
          password: "", // Contraseña vacía porque no se ha registrado oficialmente
          verificado: false, // Opcional: puedes marcarlo como false hasta que ponga contraseña
          pedidos: [pedidoNuevo]
        };
        usuariosGuardados.push(nuevoUsuario);
        localStorage.setItem("usuarios", JSON.stringify(usuariosGuardados));
      }
      // ==========================================================

      // Restar existencias en Inventario por lo comprado y guardar en localStorage al instante
      const restarPorId = (items: { id: number; cantidad: number }[]) =>
        items.reduce((acc, it) => {
          acc[it.id] = (acc[it.id] ?? 0) + it.cantidad;
          return acc;
        }, {} as Record<number, number>);
      const velasRestar = restarPorId(
        cart.filter((it) => Number(it.id) < 100).map((it) => ({ id: Number(it.id), cantidad: Math.max(0, Number(it.cantidad) || 0) }))
      );
      const inciensosRestar = restarPorId(
        cart.filter((it) => Number(it.id) >= 100 && Number(it.id) < 200).map((it) => ({ id: Number(it.id), cantidad: Math.max(0, Number(it.cantidad) || 0) }))
      );
      const figurasRestar = restarPorId(
        cart.filter((it) => { const n = Number(it.id); return n >= 200 && n < 300; }).map((it) => ({ id: Number(it.id), cantidad: Math.max(0, Number(it.cantidad) || 0) }))
      );
      const kitsRestar = restarPorId(
        cart.filter((it) => Number(it.id) >= 300).map((it) => ({ id: Number(it.id), cantidad: Math.max(0, Number(it.cantidad) || 0) }))
      );
      const newVelas = velas.map((p) => {
        const q = velasRestar[p.id];
        if (q == null || q <= 0) return p;
        return { ...p, stock: Math.max(0, Number(p.stock) - q) };
      });
      const newInciensos = inciensos.map((p) => {
        const q = inciensosRestar[p.id];
        if (q == null || q <= 0) return p;
        return { ...p, stock: Math.max(0, Number(p.stock) - q) };
      });
      const newFiguras = figuras.map((p) => {
        const q = figurasRestar[p.id];
        if (q == null || q <= 0) return p;
        return { ...p, stock: Math.max(0, Number(p.stock) - q) };
      });
      const newKits = kits.map((p) => {
        const q = kitsRestar[p.id];
        if (q == null || q <= 0) return p;
        return { ...p, stock: Math.max(0, Number(p.stock) - q) };
      });
      setVelas(newVelas);
      setInciensos(newInciensos);
      setFiguras(newFiguras);
      setKits(newKits);
      localStorage.setItem(CATALOGO_VELAS_KEY, JSON.stringify(newVelas));
      localStorage.setItem(CATALOGO_INCIENSOS_KEY, JSON.stringify(newInciensos));
      localStorage.setItem(CATALOGO_FIGURAS_KEY, JSON.stringify(newFiguras));
      localStorage.setItem(CATALOGO_KITS_KEY, JSON.stringify(newKits));

      setCart([]);
      setPasoFinalizarCompra("datos");
      setFormPedidoAbierto(false);
      setUrlWhatsAppPendiente(urlWhatsApp);
      setPedidoRealizado(true);
      setPagina("inicio");

      localStorage.setItem("clienteMaika", JSON.stringify(datosClienteActual));

      const perfilNuevo: PerfilCompraRapida = {
        datosCliente: { ...datosClienteActual },
        metodoPago: metodoPagoActual,
        datosPago: { ...datosPagoActual },
        actualizadoEn: new Date().toISOString()
      };
      localStorage.setItem(QUICK_CHECKOUT_KEY, JSON.stringify(perfilNuevo));
      setPerfilCompraRapida(perfilNuevo);

      setDatosCliente({
        nombreApellidos: "",
        email: "",
        telefono: "",
        direccion: "",
        calle: "",
        numero: "",
        bloque: "",
        escalera: "",
        piso: "",
        puerta: "",
        ciudad: "",
        cp: "",
        poblacion: "",
        provincia: "",
        pais: "España",
        notas: ""
      });

      setMetodoPago("bizum");
      setDatosPago({
        bizumTelefono: "",
        tarjetaNumero: "",
        tarjetaTitular: "",
        tarjetaCaducidad: "",
        tarjetaCVV: ""
      });
      setCuponAplicado(null);
      setCuponInput("");

      mostrarNotificacion(`✅ Pago recibido y pedido ${numeroPedido} enviado`, "exito");
    } finally {
      setProcesandoPago(false);
    }
  };

  const aceptarCookies = () => {
    aceptarTodasCookies();
  };

  const cambiarEstadoPedido = (numeroPedido: string, nuevoEstado: Pedido["estado"]) => {
    const pedidoOriginal = pedidos.find((p) => p.numero === numeroPedido);
    if (!pedidoOriginal) {
      mostrarNotificacion(`No se encontró el pedido ${numeroPedido}`, "error");
      return;
    }

    const nuevosPedidos = pedidos.map((p) =>
      p.numero === numeroPedido ? { ...p, estado: nuevoEstado } : p
    );

    localStorage.setItem("pedidosMaika", JSON.stringify(nuevosPedidos));
    flushSync(() => {
      setPedidos(nuevosPedidos as Pedido[]);
    });

    mostrarNotificacion(
      `✅ Pedido ${pedidoOriginal.numero} → ${nuevoEstado}`,
      "exito"
    );

    setPedidoAbierto(null);
  };

  const cargarUsuarios = () => {
    const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
    setListaUsuarios(usuarios);
    setModalUsuariosAbierto(true);
  };

  const abrirEditorUsuario = (usuarioAEditar: Usuario) => {
    setEditUsuarioForm({
      id: usuarioAEditar.id,
      nombre: usuarioAEditar.nombre || "",
      email: usuarioAEditar.email || "",
      telefono: usuarioAEditar.telefono || "",
      password: usuarioAEditar.password || "",
      calle: usuarioAEditar.calle || usuarioAEditar.direccion || "",
      bloque: usuarioAEditar.bloque || "",
      escalera: usuarioAEditar.escalera || "",
      piso: usuarioAEditar.piso || "",
      puerta: usuarioAEditar.puerta || "",
      numero: usuarioAEditar.numero || "",
      cp: usuarioAEditar.cp || "",
      provincia: usuarioAEditar.provincia || "",
      poblacion: usuarioAEditar.poblacion || "",
      pais: usuarioAEditar.pais || "España",
      direccion: usuarioAEditar.direccion || "",
      verificado: !!usuarioAEditar.verificado
    });
    setModalEditarUsuarioAbierto(true);
  };

  const guardarEdicionUsuario = () => {
    if (!editUsuarioForm) return;

    if (!editUsuarioForm.nombre.trim() || !editUsuarioForm.email.trim()) {
      mostrarNotificacion("Nombre y email son obligatorios", "error");
      return;
    }

    const usuariosActuales = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];

    const emailDuplicado = usuariosActuales.some(
      (u) => String(u.id) !== String(editUsuarioForm.id) && u.email.toLowerCase() === editUsuarioForm.email.toLowerCase()
    );

    if (emailDuplicado) {
      mostrarNotificacion("Ese email ya pertenece a otro usuario", "error");
      return;
    }

    const usuariosActualizados = usuariosActuales.map((u) =>
      String(u.id) === String(editUsuarioForm.id)
        ? {
            ...u,
            nombre: editUsuarioForm.nombre.trim(),
            email: editUsuarioForm.email.trim(),
            telefono: editUsuarioForm.telefono.trim(),
            password: editUsuarioForm.password.trim(),
            calle: editUsuarioForm.calle.trim(),
            bloque: editUsuarioForm.bloque.trim(),
            escalera: editUsuarioForm.escalera.trim(),
            piso: editUsuarioForm.piso.trim(),
            puerta: editUsuarioForm.puerta.trim(),
            numero: editUsuarioForm.numero.trim(),
            cp: editUsuarioForm.cp.trim(),
            provincia: editUsuarioForm.provincia.trim(),
            poblacion: editUsuarioForm.poblacion.trim(),
            pais: editUsuarioForm.pais.trim(),
            direccion: `${editUsuarioForm.calle.trim()}${editUsuarioForm.numero.trim() ? `, Nº ${editUsuarioForm.numero.trim()}` : ""}${editUsuarioForm.bloque.trim() ? `, Bloque ${editUsuarioForm.bloque.trim()}` : ""}${editUsuarioForm.escalera.trim() ? `, Esc. ${editUsuarioForm.escalera.trim()}` : ""}${editUsuarioForm.piso.trim() ? `, Piso ${editUsuarioForm.piso.trim()}` : ""}${editUsuarioForm.puerta.trim() ? `, Puerta ${editUsuarioForm.puerta.trim()}` : ""}`.trim(),
            verificado: editUsuarioForm.verificado
          }
        : u
    );

    localStorage.setItem("usuarios", JSON.stringify(usuariosActualizados));
    setListaUsuarios(usuariosActualizados);

    const usuarioActual = localStorage.getItem("usuarioActual");
    if (usuarioActual) {
      const usuarioLogueado = JSON.parse(usuarioActual) as Usuario;
      const actualizado = usuariosActualizados.find((u) => String(u.id) === String(usuarioLogueado.id));
      if (actualizado) {
        localStorage.setItem("usuarioActual", JSON.stringify(actualizado));
        setUsuario(actualizado);
        precargarDatosClienteDesdeUsuario(actualizado);
      }
    }

    mostrarNotificacion(`✅ Usuario ${editUsuarioForm.nombre} actualizado`, "exito");
    setModalEditarUsuarioAbierto(false);
    setEditUsuarioForm(null);
  };

  const buscarPedido = () => {
    if (!numeroSeguimiento.trim()) {
      mostrarNotificacion("Introduce un número de pedido", "error");
      return;
    }

    const encontrado = pedidos.find(p => p.numero === numeroSeguimiento);
    setPedidoBuscado(encontrado || null);

    if (!encontrado) {
      mostrarNotificacion("Pedido no encontrado", "error");
    }
  };

  const volverATienda = () => {
    setPagina("tienda");
  };

  const precargarDatosClienteDesdeUsuario = (usuarioFuente: Usuario | null) => {
    if (!usuarioFuente) return;

    setDatosCliente((prev) => ({
      ...prev,
      nombreApellidos: usuarioFuente.nombre || prev.nombreApellidos,
      email: usuarioFuente.email || prev.email,
      telefono: usuarioFuente.telefono || prev.telefono,
      direccion: usuarioFuente.direccion || prev.direccion,
      calle: usuarioFuente.calle || prev.calle,
      numero: usuarioFuente.numero || prev.numero,
      bloque: usuarioFuente.bloque || prev.bloque,
      escalera: usuarioFuente.escalera || prev.escalera,
      piso: usuarioFuente.piso || prev.piso,
      puerta: usuarioFuente.puerta || prev.puerta,
      cp: usuarioFuente.cp || prev.cp,
      poblacion: usuarioFuente.poblacion || prev.poblacion,
      provincia: usuarioFuente.provincia || prev.provincia,
      ciudad: usuarioFuente.ciudad || prev.ciudad,
      pais: usuarioFuente.pais || prev.pais
    }));
  };

  const finalizarCarrito = () => {
    precargarDatosClienteDesdeUsuario(usuario);
    setNumeroPedidoPreview(generarNumeroPedido());
    setPasoFinalizarCompra("datos");
    setFormPedidoAbierto(true);
  };

  const pulseAnimationStyle = `
    @keyframes pulseCaja {
      0% { box-shadow: 0 0 0 0 #22d3ee; border-color: #22d3ee; }
      50% { box-shadow: 0 0 25px 8px #22d3ee; border-color: #ffffff; }
      100% { box-shadow: 0 0 0 0 #22d3ee; border-color: #22d3ee; }
    }
  `;

  const renderCajaPedidos = (
    titulo: string,
    pedidosList: Pedido[],
    color: string,
    icono: string,
    abierto: boolean,
    setAbierto: (value: boolean) => void,
    animar: boolean = false
  ) => {
    const pedidosFiltrados = pedidosList.filter(p =>
      busquedaPedido.trim() === "" ||
      String(p.numero).toLowerCase().includes(busquedaPedido.toLowerCase()) ||
      p.cliente?.nombreApellidos?.toLowerCase().includes(busquedaPedido.toLowerCase())
    );

    const debeAnimar = animar && pedidosFiltrados.length > 0;

    return (
      <div style={{
        marginBottom: 20,
        border: `2px solid ${color}`,
        borderRadius: 15,
        overflow: "hidden",
        background: "#0B0B0D",
        boxShadow: abierto ? `0 0 20px ${color}` : "none",
        transition: "all 0.3s ease",
        animation: debeAnimar ? "pulseCaja 1.4s ease-in-out infinite" : "none"
      }}>
        <div
          onClick={() => setAbierto(!abierto)}
          style={{
            padding: "15px 20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#0B0B0D"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            <span style={{ fontSize: "1.8rem" }}>{icono}</span>
            <h3 style={{ margin: 0, color: color }}>
              {titulo} <span style={{ color: "white" }}>({pedidosFiltrados.length})</span>
            </h3>
          </div>
          <span style={{ color: color, fontSize: "1.5rem" }}>
            {abierto ? "▼" : "▶"}
          </span>
        </div>

        {abierto && (
          <div style={{ padding: "20px", maxHeight: "500px", overflowY: "auto" }}>
            {pedidosFiltrados.length === 0 ? (
              <p style={{ color: "white", opacity: 0.7, textAlign: "center" }}>
                No hay pedidos
              </p>
            ) : (
              pedidosFiltrados.map((p) => {
                const indexEnOriginal = pedidos.findIndex(original => original.numero === p.numero);
                return (
                  <div
                    key={p.numero}
                    onClick={() => setPedidoAbierto(pedidoAbierto === indexEnOriginal ? null : indexEnOriginal)}
                    style={{
                      background: p.numero === ultimoPedidoNumero ? "#0B0B0D" : "#0B0B0D",
                      border: "1px solid #C9A24A",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 10,
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong style={{ color: "#C9A24A" }}>{p.numero}</strong>
                      <span style={{ color: "white", fontSize: "0.8rem" }}>{p.fecha}</span>
                    </div>
                    <div style={{ color: "white" }}>{p.cliente?.nombreApellidos}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                      <span style={{ color: "#C9A24A" }}>{p.total?.toFixed(2)} €</span>
                      <span style={{
                        color: p.estado === "pendiente" ? "#22d3ee" : p.estado === "enviado" ? "#e67e22" : "#2ecc71",
                        background: p.estado === "pendiente" ? "rgba(34,211,238,0.15)" : p.estado === "enviado" ? "rgba(230,126,34,0.15)" : "rgba(46,204,113,0.15)",
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 14
                      }}>
                        {p.estado === "pendiente" ? "🛒 " : p.estado === "enviado" ? "🚚 " : "✅ "}{p.estado}
                      </span>
                    </div>

                    {accesoAdmin && (
                      <select
                        value={p.estado}
                        onChange={(e) => {
                          e.stopPropagation();
                          cambiarEstadoPedido(p.numero, e.target.value as Pedido["estado"]);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          marginTop: 8,
                          padding: 8,
                          borderRadius: 8,
                          width: "100%",
                          background: "#0B0B0D",
                          color: "#C9A24A",
                          border: "1px solid #C9A24A",
                          cursor: "pointer"
                        }}
                      >
                        <option value="pendiente">🛒 Pendiente</option>
                        <option value="enviado">🚚 Enviado</option>
                        <option value="entregado">✅ Entregado</option>
                      </select>
                    )}

                    {pedidoAbierto === indexEnOriginal && (
                      <div style={{ marginTop: 10, borderTop: "1px solid #C9A24A", paddingTop: 10 }}>
                        <strong style={{ color: "#C9A24A" }}>📦 Productos:</strong>
                        {p.items?.map((it: ItemCarrito, idx: number) => (
                          <div key={`${p.numero}-item-${idx}`} style={{ color: "white", marginLeft: 10 }}>
                            • {it.nombre} x{it.cantidad} = {(it.precio * it.cantidad).toFixed(2)} €
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPedidoFacturaAbierto(p); }}
                      style={{
                        marginTop: 8,
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #C9A24A",
                        background: "rgba(201,162,74,0.15)",
                        color: "#C9A24A",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: 13
                      }}
                    >
                      📄 Ver factura / pedido completo
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  };

  const appContextValue = useMemo<AppContextValue>(() => ({
    setPagina,
    abrirTiendaConCategoria,
    velas,
    inciensos,
    figuras,
    kits,
    categoriasCatalogo,
    agregarAlCarrito,
    cart,
    total,
    totalItemsCarrito,
    precioItemCarrito,
    cambiarCantidad,
    volverATienda,
    vaciarCarrito,
    finalizarCarrito,
    envioPreview,
    totalPreview,
    generarNumeroPedido,
    setNumeroPedidoPreview,
    setFormPedidoAbierto,
    precargarDatosClienteDesdeUsuario,
    usuario,
    perfilCompraRapida,
    comprarEnUnClick,
    numeroSeguimiento,
    setNumeroSeguimiento,
    buscarPedido,
    pedidoBuscado,
    accesoAdmin,
    busquedaPedido,
    setBusquedaPedido,
    renderCajaPedidos,
    pendientesAbierto,
    setPendientesAbierto,
    enviadosAbierto,
    setEnviadosAbierto,
    entregadosAbierto,
    setEntregadosAbierto,
    pedidosPendientesOrdenados,
    pedidosEnviadosOrdenados,
    pedidosEntregadosOrdenados,
    setPedidoFacturaAbierto,
    pedidos,
    categoriaTiendaAlAbrir,
    setCategoriaTiendaAlAbrir
  }), [
    setPagina, abrirTiendaConCategoria, velas, inciensos, figuras, kits, categoriasCatalogo, agregarAlCarrito,
    cart, total, totalItemsCarrito, precioItemCarrito, cambiarCantidad, volverATienda, vaciarCarrito, finalizarCarrito,
    envioPreview, totalPreview, generarNumeroPedido, setNumeroPedidoPreview, setFormPedidoAbierto,
    precargarDatosClienteDesdeUsuario, usuario, perfilCompraRapida, comprarEnUnClick,
    numeroSeguimiento, buscarPedido, pedidoBuscado, accesoAdmin, busquedaPedido, renderCajaPedidos,
    pendientesAbierto, enviadosAbierto, entregadosAbierto,
    pedidosPendientesOrdenados, pedidosEnviadosOrdenados, pedidosEntregadosOrdenados,
    setPedidoFacturaAbierto, pedidos, kits, categoriaTiendaAlAbrir, setCategoriaTiendaAlAbrir
  ]);

  if (pagina === "editarCategorias") {
    return (
      <EditarCategoriasPage
        setPagina={setPagina}
        categoriasCatalogo={categoriasCatalogo}
        setCategoriasCatalogo={setCategoriasCatalogo}
        categoriaSeleccionada={categoriaSeleccionada}
        setCategoriaSeleccionada={setCategoriaSeleccionada}
        previewCategoria={previewCategoria}
        setPreviewCategoria={setPreviewCategoria}
        nombreImagenCategoria={nombreImagenCategoria}
        setNombreImagenCategoria={setNombreImagenCategoria}
        colorCategoria={colorCategoria}
        setColorCategoria={setColorCategoria}
        tamanoCategoria={tamanoCategoria}
        setTamanoCategoria={setTamanoCategoria}
        estiloTextoCategoria={estiloTextoCategoria}
        setEstiloTextoCategoria={setEstiloTextoCategoria}
        setCategoriaARenombrar={setCategoriaARenombrar}
        setNuevaCategoriaNombre={setNuevaCategoriaNombre}
        setNuevaCategoriaImagen={setNuevaCategoriaImagen}
        setNuevaCategoriaNombreImagen={setNuevaCategoriaNombreImagen}
        setNuevaCategoriaTamano={setNuevaCategoriaTamano}
        setNuevaCategoriaColor={setNuevaCategoriaColor}
        setNuevaCategoriaEstilo={setNuevaCategoriaEstilo}
        mostrarNotificacion={mostrarNotificacion}
        CATEGORIA_IMAGENES_KEY={CATEGORIA_IMAGENES_KEY}
      />
    );
  }

  if (pagina === "nuevaCategoria") {
    return (
      <NuevaCategoriaPage
        setPagina={setPagina}
        categoriasCatalogo={categoriasCatalogo}
        setCategoriasCatalogo={setCategoriasCatalogo}
        categoriaARenombrar={categoriaARenombrar}
        setCategoriaARenombrar={setCategoriaARenombrar}
        categoriaSeleccionada={categoriaSeleccionada}
        setCategoriaSeleccionada={setCategoriaSeleccionada}
        nuevaCategoriaNombre={nuevaCategoriaNombre}
        setNuevaCategoriaNombre={setNuevaCategoriaNombre}
        nuevaCategoriaImagen={nuevaCategoriaImagen}
        setNuevaCategoriaImagen={setNuevaCategoriaImagen}
        nuevaCategoriaNombreImagen={nuevaCategoriaNombreImagen}
        setNuevaCategoriaNombreImagen={setNuevaCategoriaNombreImagen}
        nuevaCategoriaTamano={nuevaCategoriaTamano}
        setNuevaCategoriaTamano={setNuevaCategoriaTamano}
        nuevaCategoriaColor={nuevaCategoriaColor}
        setNuevaCategoriaColor={setNuevaCategoriaColor}
        nuevaCategoriaEstilo={nuevaCategoriaEstilo}
        setNuevaCategoriaEstilo={setNuevaCategoriaEstilo}
        setPreviewCategoria={setPreviewCategoria}
        setNombreImagenCategoria={setNombreImagenCategoria}
        setTamanoCategoria={setTamanoCategoria}
        setColorCategoria={setColorCategoria}
        setEstiloTextoCategoria={setEstiloTextoCategoria}
        mostrarNotificacion={mostrarNotificacion}
        CATEGORIA_IMAGENES_KEY={CATEGORIA_IMAGENES_KEY}
      />
    );
  }

  if (pagina === "editarProductos") {
    return (
      <EditarProductosPage
        setPagina={setPagina}
        velas={velas}
        setVelas={setVelas}
        inciensos={inciensos}
        setInciensos={setInciensos}
        figuras={figuras}
        setFiguras={setFiguras}
        getProductoByValue={getProductoByValue}
        categoriaEditarProductos={categoriaEditarProductos}
        setCategoriaEditarProductos={setCategoriaEditarProductos}
        productoSeleccionado={productoSeleccionado}
        setProductoSeleccionado={setProductoSeleccionado}
        previewProducto={previewProducto}
        setPreviewProducto={setPreviewProducto}
        nombreImagenProducto={nombreImagenProducto}
        setNombreImagenProducto={setNombreImagenProducto}
        colorProducto={colorProducto}
        setColorProducto={setColorProducto}
        tamanoProducto={tamanoProducto}
        setTamanoProducto={setTamanoProducto}
        estiloTextoProducto={estiloTextoProducto}
        setEstiloTextoProducto={setEstiloTextoProducto}
        setCategoriaNuevoProducto={setCategoriaNuevoProducto}
        setNuevoProductoNombre={setNuevoProductoNombre}
        setNuevoProductoPrecio={setNuevoProductoPrecio}
        setNuevoProductoStock={setNuevoProductoStock}
        setNuevoProductoDescripcion={setNuevoProductoDescripcion}
        setNuevoProductoImagen={setNuevoProductoImagen}
        setNuevoProductoNombreImagen={setNuevoProductoNombreImagen}
        setNuevoProductoTamano={setNuevoProductoTamano}
        setNuevoProductoColor={setNuevoProductoColor}
        setNuevoProductoEstilo={setNuevoProductoEstilo}
        mostrarNotificacion={mostrarNotificacion}
      />
    );
  }

  if (pagina === "inventario") {
    return (
      <InventarioPage
        setPagina={setPagina}
        velas={velas}
        setVelas={setVelas}
        inciensos={inciensos}
        setInciensos={setInciensos}
        figuras={figuras}
        setFiguras={setFiguras}
        kits={kits}
        setKits={setKits}
        umbralStockBajo={umbralStockBajo}
        mostrarNotificacion={mostrarNotificacion}
      />
    );
  }

  if (pagina === "editarCupones") {
    const cuponesEntradas = Object.entries(cuponesAdmin);
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 20 }}>
        <h2 style={{ color: "#C9A24A", marginBottom: 20 }}>🎟️ Códigos promocionales</h2>
        <p style={{ color: "white", marginBottom: 20, opacity: 0.9 }}>
          Los códigos que guardes aquí serán los únicos válidos en Finalizar compra. Puedes cambiarlos cuando quieras.
        </p>
        <div style={{ background: "#0B0B0D", border: "2px solid #C9A24A", borderRadius: 16, padding: 20, marginBottom: 20 }}>
          {cuponesEntradas.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.7)" }}>No hay códigos. Añade uno abajo.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {cuponesEntradas.map(([codigo, data]) => (
                <div key={codigo} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ color: "#C9A24A", fontWeight: "bold", minWidth: 100 }}>{codigo}</span>
                  <span style={{ color: "white", opacity: 0.9 }}>
                    {data.tipo === "porcentaje" ? `${data.valor}% descuento` : "Envío gratis"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...cuponesAdmin };
                      delete next[codigo];
                      setCuponesAdmin(next);
                    }}
                    style={{
                      background: "transparent",
                      color: "#ff4444",
                      border: "1px solid #ff4444",
                      borderRadius: 8,
                      padding: "6px 12px",
                      cursor: "pointer",
                      fontSize: 13
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ background: "#0B0B0D", border: "2px solid #C9A24A", borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <p style={{ color: "#C9A24A", fontWeight: "bold", marginBottom: 12 }}>Añadir código</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 400 }}>
            <input
              type="text"
              placeholder="Código (ej. VERANO20)"
              id="nuevo-cupon-codigo"
              style={inputStyle}
            />
            <select id="nuevo-cupon-tipo" style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="porcentaje">Porcentaje de descuento</option>
              <option value="envio_gratis">Envío gratis</option>
            </select>
            <input
              type="number"
              placeholder="Valor (% si es porcentaje, 0 si envío gratis)"
              id="nuevo-cupon-valor"
              min={0}
              max={100}
              defaultValue={10}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => {
                const codigoInput = (document.getElementById("nuevo-cupon-codigo") as HTMLInputElement)?.value?.trim().toUpperCase().replace(/\s+/g, "");
                const tipo = (document.getElementById("nuevo-cupon-tipo") as HTMLSelectElement)?.value as "porcentaje" | "envio_gratis";
                const valorInput = (document.getElementById("nuevo-cupon-valor") as HTMLInputElement)?.value;
                const valor = tipo === "envio_gratis" ? 0 : Math.min(100, Math.max(0, parseFloat(valorInput) || 0));
                if (!codigoInput) {
                  mostrarNotificacion("Escribe un código", "error");
                  return;
                }
                setCuponesAdmin((prev) => ({ ...prev, [codigoInput]: { tipo, valor } }));
                (document.getElementById("nuevo-cupon-codigo") as HTMLInputElement).value = "";
                (document.getElementById("nuevo-cupon-valor") as HTMLInputElement).value = "10";
              }}
              style={{
                background: "#C9A24A",
                color: "#1b1745",
                border: "none",
                padding: 12,
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Añadir código
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem(CUPONES_MAIKA_KEY, JSON.stringify(cuponesAdmin));
              setPagina("admin");
              mostrarNotificacion("Códigos promocionales guardados", "exito");
            }}
            style={{
              background: "#4caf50",
              color: "white",
              border: "none",
              padding: "14px 24px",
              borderRadius: 14,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 18
            }}
          >
            Guardar cambios
          </button>
          <button
            type="button"
            onClick={() => setPagina("admin")}
            style={{
              background: "#C9A24A",
              color: "#1b1745",
              border: "2px solid #C9A24A",
              padding: "14px 24px",
              borderRadius: 14,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 18
            }}
          >
            ← Volver al panel
          </button>
        </div>
      </div>
    );
  }

  if (pagina === "nuevoProducto") {
    return (
      <NuevoProductoPage
        setPagina={setPagina}
        velas={velas}
        setVelas={setVelas}
        inciensos={inciensos}
        setInciensos={setInciensos}
        figuras={figuras}
        setFiguras={setFiguras}
        categoriaNuevoProducto={categoriaNuevoProducto}
        setCategoriaNuevoProducto={setCategoriaNuevoProducto}
        nuevoProductoNombre={nuevoProductoNombre}
        setNuevoProductoNombre={setNuevoProductoNombre}
        nuevoProductoPrecio={nuevoProductoPrecio}
        setNuevoProductoPrecio={setNuevoProductoPrecio}
        nuevoProductoStock={nuevoProductoStock}
        setNuevoProductoStock={setNuevoProductoStock}
        nuevoProductoDescripcion={nuevoProductoDescripcion}
        setNuevoProductoDescripcion={setNuevoProductoDescripcion}
        nuevoProductoImagen={nuevoProductoImagen}
        setNuevoProductoImagen={setNuevoProductoImagen}
        nuevoProductoNombreImagen={nuevoProductoNombreImagen}
        setNuevoProductoNombreImagen={setNuevoProductoNombreImagen}
        nuevoProductoTamano={nuevoProductoTamano}
        setNuevoProductoTamano={setNuevoProductoTamano}
        nuevoProductoColor={nuevoProductoColor}
        setNuevoProductoColor={setNuevoProductoColor}
        nuevoProductoEstilo={nuevoProductoEstilo}
        setNuevoProductoEstilo={setNuevoProductoEstilo}
        setProductoSeleccionado={setProductoSeleccionado}
        setCategoriaEditarProductos={setCategoriaEditarProductos}
        mostrarNotificacion={mostrarNotificacion}
      />
    );
  }

  return (
    <Layout pulseStyle={pulseAnimationStyle} fullBleedTop={pagina === "inicio"}>
      <AppProvider value={appContextValue}>
      <NavPrincipal
        key={cart.map((i) => `${i.id}:${i.cantidad}`).join("|")}
        pagina={pagina}
        setPagina={setPagina}
        onTerminarCompra={() => {
          precargarDatosClienteDesdeUsuario(usuario);
          setNumeroPedidoPreview(generarNumeroPedido());
          setPasoFinalizarCompra("datos");
          setFormPedidoAbierto(true);
        }}
        esAppNativa={esAppNativa}
      />

      {/* Aviso cookies */}
      {mostrarAvisoCookies && (pagina === "inicio" || pagina === "tienda" || pagina === "carrito") && (
        <div className="cookie-banner" style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          right: 20,
          border: "2px solid #C9A24A",
          borderRadius: 15,
          padding: "15px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: 12,
          background: "#0B0B0D"
        }}>
          <div style={{ color: "white", fontSize: 14, lineHeight: 1.45 }}>
            🍪 Usamos cookies necesarias para el funcionamiento de la tienda y, con tu permiso,
            cookies de preferencias, analítica y marketing.{" "}
            <a href="/politica-cookies.html" target="_blank" rel="noopener noreferrer" style={{ color: "#C9A24A", textDecoration: "underline" }}>Política de Cookies</a>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              onClick={rechazarCookiesOpcionales}
              style={{
                background: "transparent",
                color: "#C9A24A",
                border: "1px solid #C9A24A",
                padding: "8px 14px",
                borderRadius: 20,
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Rechazar opcionales
            </button>

            <button
              onClick={() => setMostrarConfigCookies((prev) => !prev)}
              style={{
                background: "transparent",
                color: "white",
                border: "1px solid white",
                padding: "8px 14px",
                borderRadius: 20,
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Configurar cookies
            </button>

            <button
              onClick={aceptarCookies}
              style={{
                background: "#C9A24A",
                color: "#1b1745",
                border: "none",
                padding: "8px 16px",
                borderRadius: 20,
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Aceptar todas
            </button>
          </div>

          {mostrarConfigCookies && (
            <div style={{
              border: "1px solid rgba(201,162,74,0.5)",
              borderRadius: 12,
              padding: 12,
              background: "#0B0B0D",
              color: "white"
            }}>
              <p style={{ margin: "0 0 10px", color: "#C9A24A", fontWeight: "bold" }}>
                Preferencias de cookies
              </p>

              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span>Necesarias (siempre activas)</span>
                <input type="checkbox" checked disabled />
              </label>

              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span>Preferencias</span>
                <input
                  type="checkbox"
                  checked={consentimientoCookies.preferencias}
                  onChange={(e) =>
                    setConsentimientoCookies((prev) => ({
                      ...prev,
                      preferencias: e.target.checked
                    }))
                  }
                />
              </label>

              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span>Analítica</span>
                <input
                  type="checkbox"
                  checked={consentimientoCookies.analiticas}
                  onChange={(e) =>
                    setConsentimientoCookies((prev) => ({
                      ...prev,
                      analiticas: e.target.checked
                    }))
                  }
                />
              </label>

              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span>Marketing</span>
                <input
                  type="checkbox"
                  checked={consentimientoCookies.marketing}
                  onChange={(e) =>
                    setConsentimientoCookies((prev) => ({
                      ...prev,
                      marketing: e.target.checked
                    }))
                  }
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button
                  onClick={() => setMostrarConfigCookies(false)}
                  style={{
                    background: "transparent",
                    color: "#C9A24A",
                    border: "1px solid #C9A24A",
                    padding: "6px 12px",
                    borderRadius: 8,
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    guardarConsentimientoCookies({
                      preferencias: consentimientoCookies.preferencias,
                      analiticas: consentimientoCookies.analiticas,
                      marketing: consentimientoCookies.marketing
                    });
                    mostrarNotificacion("✅ Preferencias de cookies guardadas", "exito");
                  }}
                  style={{
                    background: "#C9A24A",
                    color: "#1b1745",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  Guardar preferencias
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notificaciones */}
      {notificacion && (
        <div style={{
          position: "fixed",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 999999,
          width: "90%",
          maxWidth: 400
        }}>
          <Notificacion
            mensaje={notificacion.mensaje}
            tipo={notificacion.tipo}
            onClose={() => setNotificacion(null)}
          />
        </div>
      )}

      {/* PÁGINAS */}

      {/* INICIO - hero + contenido */}
      {pagina === "inicio" && (
        <>
          <section className="hero-section" aria-label="Banner principal">
            <img
              src="/banner.jpg"
              alt="Conecta con tu esencia - Magia y Bienestar para tu Alma"
              className="hero-section__img"
            />
            <div
              className="hero-section__zona-clic"
              role="button"
              tabIndex={0}
              aria-label="Ir a tienda"
              onClick={() => setPagina("tienda")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setPagina("tienda");
                }
              }}
            />
            <button
              type="button"
              className="hero-section__btn-explorar"
              onClick={(e) => { e.stopPropagation(); setPagina("tienda"); }}
              aria-label="Explorar tienda"
            >
              Explorar tienda
            </button>
          </section>
          <div
            className="inicio-wrapper"
            style={{
              maxWidth: 900,
              margin: "0 auto",
              width: "100%",
              padding: "0 20px 64px",
              marginTop: "-40px",
              boxSizing: "border-box",
              minHeight: "calc(100vh - 120px)",
              color: "rgba(255,255,255,0.95)"
            }}
          >
            <InicioPage />
          </div>
        </>
      )}

      {/* MI CUENTA */}
      {pagina === "cuenta" && (
        <CuentaPage
          formAuth={formAuth}
          setFormAuth={setFormAuth}
          modoRegistro={modoRegistro}
          setModoRegistro={setModoRegistro}
          usuario={usuario}
          setUsuario={setUsuario}
          reenvioDisponibleEn={reenvioDisponibleEn}
          setReenvioDisponibleEn={setReenvioDisponibleEn}
          provinciaPaisBloqueadosRegistro={provinciaPaisBloqueadosRegistro}
          mostrarNotificacion={mostrarNotificacion}
          precargarDatosClienteDesdeUsuario={precargarDatosClienteDesdeUsuario}
          pedidos={pedidos}
          enviarCodigoEmail={enviarCodigoEmail}
          setPagina={setPagina}
        />
      )}

      {/* TIENDA */}
      {pagina === "tienda" && (
        <div style={{ maxWidth: 720, margin: "0 auto", width: "100%", padding: "0 20px", boxSizing: "border-box" }}>
          <TiendaPage />
        </div>
      )}

      {/* FAVORITOS */}
      {pagina === "favoritos" && (
        <div style={{ maxWidth: 720, margin: "0 auto", width: "100%", padding: "0 20px", boxSizing: "border-box" }}>
          <FavoritosPage />
        </div>
      )}

      {/* ADMIN (solo un bloque para evitar espacio negro y duplicado) */}
      {pagina === "admin" && (
        <div style={{ maxWidth: 1100, margin: "0 auto", width: "98%", paddingTop: 8 }}>
          <h2 style={{ textAlign: "center", color: "#C9A24A", marginBottom: 28, fontSize: 42 }}>⚙️ PANEL ADMIN</h2>

          {!accesoAdmin ? (
            <div style={{
              background: "#0B0B0D",
              border: "3px solid #C9A24A",
              borderRadius: 24,
              padding: 34,
              maxWidth: 620,
              margin: "0 auto"
            }}>
              <h3 style={{ color: "#C9A24A", textAlign: "center", marginBottom: 16, fontSize: 30 }}>🔐 Acceso</h3>
              <input
                type="password"
                placeholder="Clave"
                value={claveAdmin}
                onChange={(e) => setClaveAdmin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (claveAdmin === "maika2026") {
                      setAccesoAdmin(true);
                      setClaveAdmin("");
                      mostrarNotificacion("✅ Acceso concedido", "exito");
                    } else {
                      mostrarNotificacion("❌ Clave incorrecta", "error");
                    }
                  }
                }}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: 14,
                  border: "2px solid #C9A24A",
                  background: "#0B0B0D",
                  color: "#C9A24A",
                  marginBottom: 14,
                  fontSize: 22
                }}
                autoFocus
              />
              <button
                className="btn-azul-categoria"
                onClick={() => {
                  if (claveAdmin === "maika2026") {
                    setAccesoAdmin(true);
                    setClaveAdmin("");
                    mostrarNotificacion("✅ Acceso concedido", "exito");
                  } else {
                    mostrarNotificacion("❌ Clave incorrecta", "error");
                  }
                }}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: 14,
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: 22
                }}
              >
                Acceder
              </button>
            </div>
          ) : (
            <div style={{
              background: "#0B0B0D",
              border: "3px solid #C9A24A",
              borderRadius: 24,
              padding: 30
            }}>
              <div style={{ display: "grid", gap: 14, marginBottom: 18 }}>
                <button
                  className="btn-admin-limpio"
                  onClick={cargarUsuarios}
                  style={{
                    background: "#4caf50",
                    color: "white",
                    border: "none",
                    padding: "18px",
                    borderRadius: 14,
                    cursor: "pointer",
                    width: "100%",
                    fontWeight: "bold",
                    fontSize: 22
                  }}
                >
                  📋 GESTIÓN DE USUARIOS
                </button>

  <button
  className="btn-admin-limpio"
  onClick={() => setPagina("editarCategorias")}
  style={{
    background: "#ff9800",
    color: "white",
    border: "none",
    padding: "18px",
    borderRadius: 14,
    cursor: "pointer",
    width: "100%",
    fontWeight: "bold",
    fontSize: 22
  }}
>
📁 EDITAR CATEGORÍAS
</button>
                <button
                  className="btn-admin-limpio"
                  onClick={() => setPagina("editarProductos")}
                  style={{
                    background: "#673ab7",
                    color: "white",
                    border: "none",
                    padding: "18px",
                    borderRadius: 14,
                    cursor: "pointer",
                    width: "100%",
                    fontWeight: "bold",
                    fontSize: 22
                  }}
                >
                  🛠️ EDICIÓN DE PRODUCTOS
                </button>
                <button
                  className="btn-admin-limpio"
                  onClick={() => setPagina("inventario")}
                  style={{
                    background: "#2e7d32",
                    color: "white",
                    border: "none",
                    padding: "18px",
                    borderRadius: 14,
                    cursor: "pointer",
                    width: "100%",
                    fontWeight: "bold",
                    fontSize: 22
                  }}
                >
                  📦 INVENTARIO
                </button>
                <button
                  className="btn-admin-limpio"
                  onClick={() => setPagina("seguimiento")}
                  style={{
                    background: "#1565c0",
                    color: "white",
                    border: "none",
                    padding: "18px",
                    borderRadius: 14,
                    cursor: "pointer",
                    width: "100%",
                    fontWeight: "bold",
                    fontSize: 22
                  }}
                >
                  🚚 SEGUIMIENTO DE PEDIDOS
                </button>
                <button
                  className="btn-admin-limpio"
                  onClick={() => setPagina("contabilidad")}
                  style={{
                    background: "#6a1b9a",
                    color: "white",
                    border: "none",
                    padding: "18px",
                    borderRadius: 14,
                    cursor: "pointer",
                    width: "100%",
                    fontWeight: "bold",
                    fontSize: 22
                  }}
                >
                  📅 CONTABILIDAD
                </button>
                <button
                  className="btn-admin-limpio"
                  onClick={() => {
                    setCuponesAdmin(getCuponesDisponibles());
                    setPagina("editarCupones");
                  }}
                  style={{
                    background: "#e91e63",
                    color: "white",
                    border: "none",
                    padding: "18px",
                    borderRadius: 14,
                    cursor: "pointer",
                    width: "100%",
                    fontWeight: "bold",
                    fontSize: 22
                  }}
                >
                  🎟️ CÓDIGOS PROMOCIONALES
                </button>
              </div>

              <div
                style={{
                  background: "#0B0B0D",
                  border: "1px solid #C9A24A",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 18,
                  color: "white",
                  fontSize: 20
                }}
              >
                <div style={{ color: "#C9A24A", fontWeight: "bold", marginBottom: 12, fontSize: 24 }}>
                  📊 MÉTRICAS BÁSICAS
                </div>
                <div style={{ color: "white", opacity: 0.85, marginBottom: 12, fontSize: 16 }}>
                  Pulsa cada bloque para ver el detalle.
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 12,
                    marginBottom: 16
                  }}
                >
                  <div style={{ border: "1px solid #C9A24A", borderRadius: 12, padding: 12, background: "rgba(201,162,74,0.06)" }}>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>💶 Ventas semana</div>
                    <div style={{ color: "#C9A24A", fontWeight: "bold", fontSize: 22 }}>{metricasAdmin.ventasSemana.toFixed(2)} €</div>
                  </div>
                  <div style={{ border: "1px solid #C9A24A", borderRadius: 12, padding: 12, background: "rgba(201,162,74,0.06)" }}>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>📦 Pedidos pendientes</div>
                    <div style={{ color: "#C9A24A", fontWeight: "bold", fontSize: 22 }}>{pedidosPendientes.length}</div>
                  </div>
                  <div style={{ border: "1px solid #C9A24A", borderRadius: 12, padding: 12, background: "rgba(201,162,74,0.06)" }}>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>👥 Usuarios totales</div>
                    <div style={{ color: "#C9A24A", fontWeight: "bold", fontSize: 22 }}>{metricasUsuariosAdmin.total}</div>
                  </div>
                  <div style={{ border: "1px solid #C9A24A", borderRadius: 12, padding: 12, background: "rgba(201,162,74,0.06)" }}>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>⚠️ Stock bajo</div>
                    <div style={{ color: "#C9A24A", fontWeight: "bold", fontSize: 22 }}>{metricasAdmin.alertasStockBajo.length}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 14, padding: "12px 14px", background: "rgba(201,162,74,0.06)", border: "1px solid #C9A24A", borderRadius: 12 }}>
                  <div style={{ color: "#C9A24A", fontWeight: "bold", marginBottom: 8 }}>📋 Umbral de stock bajo</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ color: "white", opacity: 0.9 }}>Considerar "stock bajo" cuando haya ≤</span>
                    <select
                      value={umbralStockBajo}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (Number.isFinite(v) && v >= 0) {
                          setUmbralStockBajo(v);
                          localStorage.setItem(UMBRAL_STOCK_BAJO_KEY, String(v));
                          mostrarNotificacion(`Umbral de stock bajo: ${v} unidades`, "normal");
                        }
                      }}
                      style={{ padding: "8px 12px", borderRadius: 8, border: "2px solid #C9A24A", background: "#0B0B0D", color: "#C9A24A", fontSize: 16, cursor: "pointer" }}
                    >
                      {[2, 3, 5, 10, 15, 20].map((n) => (
                        <option key={n} value={n}>{n} unidades</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 14, padding: "12px 14px", background: "rgba(201,162,74,0.06)", border: "1px solid #C9A24A", borderRadius: 12 }}>
                  <div style={{ color: "#C9A24A", fontWeight: "bold", marginBottom: 8 }}>📝 Nota en pedido / envío</div>
                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 8 }}>Texto que se muestra en la factura del pedido y puede usarse en el email o etiqueta de envío (ej. &quot;Encender en luna creciente&quot;).</p>
                  <textarea
                    value={notaPedidoEnvio}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNotaPedidoEnvio(v);
                      localStorage.setItem(NOTA_PEDIDO_ENVIO_KEY, v);
                    }}
                    placeholder={NOTA_PEDIDO_ENVIO_DEFAULT}
                    rows={3}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "2px solid #C9A24A", background: "#0B0B0D", color: "white", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
                  />
                </div>

                <details style={{ marginBottom: 14 }}>
                  <summary
                    style={{
                      color: "#C9A24A",
                      fontWeight: "bold",
                      fontSize: 22,
                      cursor: "pointer",
                      border: "2px solid #C9A24A",
                      borderRadius: 12,
                      padding: "10px 14px",
                      background: "rgba(255, 215, 0, 0.08)",
                      listStyle: "none"
                    }}
                  >
                    🏆 Productos
                  </summary>

                  <div style={{ marginTop: 10, paddingLeft: 4 }}>
                    <div style={{ color: "#C9A24A", fontWeight: "bold", marginBottom: 8 }}>
                      📦 Informe: Productos a reponer (stock ≤ {umbralStockBajo})
                    </div>
                    {metricasAdmin.alertasStockBajo.length === 0 ? (
                      <div style={{ opacity: 0.85, marginBottom: 12 }}>Ningún producto por debajo del umbral. No hay que reponer.</div>
                    ) : (
                      <div style={{ marginBottom: 12, overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid #C9A24A" }}>
                              <th style={{ textAlign: "left", padding: "8px 12px", color: "#C9A24A" }}>Producto</th>
                              <th style={{ textAlign: "left", padding: "8px 12px", color: "#C9A24A" }}>Categoría</th>
                              <th style={{ textAlign: "right", padding: "8px 12px", color: "#C9A24A" }}>Stock actual</th>
                            </tr>
                          </thead>
                          <tbody>
                            {metricasAdmin.alertasStockBajo.map((producto) => (
                              <tr key={`stock-${producto.id}`} style={{ borderBottom: "1px solid rgba(201,162,74,0.3)" }}>
                                <td style={{ padding: "8px 12px", color: "white" }}>{producto.nombre}</td>
                                <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.85)" }}>{producto.categoria}</td>
                                <td style={{ padding: "8px 12px", textAlign: "right", color: "#C9A24A", fontWeight: "bold" }}>{producto.stock}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div style={{ color: "#C9A24A", fontWeight: "bold", marginBottom: 6 }}>
                      📈 Subidas / bajadas (semana actual vs anterior)
                    </div>
                    {metricasAdmin.tendenciaTopProductos.length === 0 ? (
                      <div style={{ opacity: 0.85, marginBottom: 12 }}>Sin ventas esta semana</div>
                    ) : (
                      <div style={{ marginBottom: 12 }}>
                        {metricasAdmin.tendenciaTopProductos.map((producto, index) => (
                          <div key={`trend-${producto.nombre}-${index}`} style={{ marginBottom: 6 }}>
                            {producto.tendencia === "sube"
                              ? "📈"
                              : producto.tendencia === "baja"
                                ? "📉"
                                : producto.tendencia === "nuevo"
                                  ? "🆕"
                                  : "➖"} {producto.nombre} · {producto.actual} uds (antes {producto.anterior})
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ color: "#C9A24A", fontWeight: "bold", marginBottom: 6 }}>
                      🔝 Top vendidos (acumulado)
                    </div>
                    {metricasAdmin.topProductos.length === 0 ? (
                      <div style={{ opacity: 0.85, marginBottom: 12 }}>Sin datos todavía</div>
                    ) : (
                      <div style={{ marginBottom: 12 }}>
                        {metricasAdmin.topProductos.map((producto, index) => (
                          <div key={`${producto.nombre}-${index}`} style={{ marginBottom: 6 }}>
                            {index + 1}. {producto.nombre} ({producto.cantidad})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </details>

                <details style={{ marginBottom: 14 }}>
                  <summary
                    style={{
                      color: "#C9A24A",
                      fontWeight: "bold",
                      fontSize: 22,
                      cursor: "pointer",
                      border: "2px solid #C9A24A",
                      borderRadius: 12,
                      padding: "10px 14px",
                      background: "rgba(255, 215, 0, 0.08)",
                      listStyle: "none"
                    }}
                  >
                    👥 Usuarios
                  </summary>

                  <div style={{ marginTop: 10, paddingLeft: 4 }}>
                    <div style={{ marginBottom: 8 }}>
                      Total registrados: <strong style={{ color: "#C9A24A" }}>{metricasUsuariosAdmin.total}</strong>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      Verificados: <strong style={{ color: "#C9A24A" }}>{metricasUsuariosAdmin.verificados}</strong>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      Pendientes: <strong style={{ color: "#C9A24A" }}>{metricasUsuariosAdmin.pendientes}</strong>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      Con pedidos: <strong style={{ color: "#C9A24A" }}>{metricasUsuariosAdmin.conPedidos}</strong>
                    </div>
                    <div>
                      Nuevos (7 días): <strong style={{ color: "#C9A24A" }}>{metricasUsuariosAdmin.nuevos7dias}</strong>
                    </div>
                  </div>
                </details>

                <details style={{ marginBottom: 14 }}>
                  <summary
                    style={{
                      color: "#C9A24A",
                      fontWeight: "bold",
                      fontSize: 22,
                      cursor: "pointer",
                      border: "2px solid #C9A24A",
                      borderRadius: 12,
                      padding: "10px 14px",
                      background: "rgba(255, 215, 0, 0.08)",
                      listStyle: "none"
                    }}
                  >
                    💰 Ventas rápidas
                  </summary>

                  <div style={{ marginTop: 10, paddingLeft: 4 }}>
                    <div style={{ marginBottom: 8 }}>
                      💶 Ventas hoy: <strong style={{ color: "#C9A24A" }}>{metricasAdmin.ventasHoy.toFixed(2)} €</strong>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      📅 Ventas semana: <strong style={{ color: "#C9A24A" }}>{metricasAdmin.ventasSemana.toFixed(2)} €</strong>
                    </div>
                    <div>
                      📦 Pedidos totales: <strong style={{ color: "#C9A24A" }}>{pedidos.length}</strong>
                    </div>
                  </div>
                </details>

                <details style={{ marginBottom: 14 }}>
                  <summary
                    style={{
                      color: "#C9A24A",
                      fontWeight: "bold",
                      fontSize: 22,
                      cursor: "pointer",
                      border: "2px solid #C9A24A",
                      borderRadius: 12,
                      padding: "10px 14px",
                      background: "rgba(255, 215, 0, 0.08)",
                      listStyle: "none"
                    }}
                  >
                    📦 Estado de pedidos
                  </summary>

                  <div style={{ marginTop: 10, paddingLeft: 4 }}>
                    <div style={{ marginBottom: 8 }}>
                      🛒 Pendientes: <strong style={{ color: "#C9A24A" }}>{pedidosPendientes.length}</strong>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      🚚 Enviados: <strong style={{ color: "#C9A24A" }}>{pedidosEnviados.length}</strong>
                    </div>
                    <div>
                      ✅ Entregados: <strong style={{ color: "#C9A24A" }}>{pedidosEntregados.length}</strong>
                    </div>
                  </div>
                </details>

                <details>
                  <summary
                    style={{
                      color: "#C9A24A",
                      fontWeight: "bold",
                      fontSize: 22,
                      cursor: "pointer",
                      border: "2px solid #C9A24A",
                      borderRadius: 12,
                      padding: "10px 14px",
                      background: "rgba(255, 215, 0, 0.08)",
                      listStyle: "none"
                    }}
                  >
                    🛒 Carrito activo
                  </summary>

                  <div style={{ marginTop: 10, paddingLeft: 4 }}>
                    {metricasAdmin.carritoItemsPendientes > 0 ? (
                      <>
                        <div style={{ marginBottom: 8 }}>
                          Items en carrito: <strong style={{ color: "#C9A24A" }}>{metricasAdmin.carritoItemsPendientes}</strong>
                        </div>
                        <div>
                          Importe estimado: <strong style={{ color: "#C9A24A" }}>{metricasAdmin.carritoImportePendiente.toFixed(2)} €</strong>
                        </div>
                      </>
                    ) : (
                      <div>Sin carrito pendiente</div>
                    )}
                  </div>
                </details>
              </div>

              <div style={{ display: "flex", gap: 14 }}>
                <button
                  className="btn-azul-categoria"
                  onClick={() => setPagina("inicio")}
                  style={{
                    flex: 1,
                    background: "#0B0B0D",
                    border: "2px solid #C9A24A",
                    color: "#C9A24A",
                    padding: "16px",
                    borderRadius: 14,
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: 21
                  }}
                >
                  ← Volver
                </button>
                <button
                  className="btn-azul-categoria"
                  onClick={() => {
                    setAccesoAdmin(false);
                    setPagina("inicio");
                  }}
                  style={{
                    flex: 1,
                    padding: "16px",
                    borderRadius: 14,
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: 21
                  }}
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CARRITO */}
      {pagina === "carrito" && <CarritoPage />}

      {/* SEGUIMIENTO DE PEDIDOS */}
      {pagina === "seguimiento" && <SeguimientoPage />}

      {/* CONTABILIDAD */}
      {pagina === "contabilidad" && <ContabilidadPage />}

      {/* Modal Confirmación */}
      <ModalConfirmacion
        abierto={modalAbierto}
        mensaje="¿Vaciar el carrito?"
        onConfirmar={confirmarVaciarCarrito}
        onCancelar={() => setModalAbierto(false)}
        textoConfirmar="Vaciar carrito"
      />

      {/* Modal: número Bizum distinto o teléfono de contacto vacío/inválido */}
      <ModalConfirmacion
        abierto={confirmacionBizumOtroNumeroAbierto}
        mensaje={(() => {
          const bizumNum = normalizarTelefonoBizum(datosPago.bizumTelefono) || "";
          const contactoNum = normalizarTelefonoBizum(datosCliente.telefono || "");
          const contactoOk = /^[67]\d{8}$/.test(contactoNum);
          if (!contactoNum || !contactoOk) {
            return `El teléfono de contacto está vacío o no es válido (9 dígitos, España). El cobro Bizum se hará al +34 ${bizumNum}. ¿Continuar?`;
          }
          return `El número para cobro Bizum (+34 ${bizumNum}) no coincide con el teléfono de contacto del pedido (${contactoNum}). ¿Cobrar a este número de todas formas?`;
        })()}
        onConfirmar={() => {
          setConfirmacionBizumOtroNumeroAbierto(false);
          bizumConfirmadoRef.current = true;
          enviarPedidoWhatsApp();
        }}
        onCancelar={() => setConfirmacionBizumOtroNumeroAbierto(false)}
        textoConfirmar="Sí, cobrar a este número"
        textoCancelar="No, corregir número"
        zIndex={10002}
      />

      {/* Modal factura / pedido completo */}
      {pedidoFacturaAbierto && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10001,
            padding: 20
          }}
          onClick={() => setPedidoFacturaAbierto(null)}
        >
          <div
            style={{
              background: "#0B0B0D",
              border: "3px solid #C9A24A",
              borderRadius: 20,
              padding: 24,
              maxWidth: 520,
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              color: "#fff"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ color: "#C9A24A", margin: 0 }}>📄 Factura / Pedido {pedidoFacturaAbierto.numero}</h2>
              <button
                type="button"
                onClick={() => setPedidoFacturaAbierto(null)}
                style={{
                  background: "transparent",
                  border: "2px solid #C9A24A",
                  color: "#C9A24A",
                  borderRadius: 10,
                  padding: "8px 14px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Cerrar
              </button>
            </div>

            <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.9)" }}><strong>Fecha:</strong> {pedidoFacturaAbierto.fecha}</p>
            <p style={{ margin: "0 0 12px", color: "rgba(255,255,255,0.9)" }}>
              <strong>Estado:</strong>{" "}
              <span style={{
                color: pedidoFacturaAbierto.estado === "pendiente" ? "#22d3ee" : pedidoFacturaAbierto.estado === "enviado" ? "#e67e22" : "#2ecc71",
                fontWeight: "bold"
              }}>
                {pedidoFacturaAbierto.estado === "pendiente" ? "Pendiente" : pedidoFacturaAbierto.estado === "enviado" ? "Enviado" : "Entregado"}
              </span>
            </p>

            <div style={{ background: "#0B0B0D", padding: 12, borderRadius: 10, marginBottom: 12, border: "1px solid #C9A24A" }}>
              <p style={{ color: "#C9A24A", margin: "0 0 6px", fontWeight: "bold" }}>Cliente</p>
              <p style={{ margin: "0 0 2px" }}>{pedidoFacturaAbierto.cliente?.nombreApellidos}</p>
              {pedidoFacturaAbierto.cliente?.email && <p style={{ margin: "0 0 2px" }}>{pedidoFacturaAbierto.cliente.email}</p>}
              {pedidoFacturaAbierto.cliente?.telefono && <p style={{ margin: "0 0 2px" }}>{pedidoFacturaAbierto.cliente.telefono}</p>}
              {(pedidoFacturaAbierto.cliente?.direccion || pedidoFacturaAbierto.cliente?.calle) && (
                <p style={{ margin: "4px 0 0" }}>
                  {pedidoFacturaAbierto.cliente.direccion || [pedidoFacturaAbierto.cliente.calle, pedidoFacturaAbierto.cliente.numero].filter(Boolean).join(" ")}
                  {pedidoFacturaAbierto.cliente.cp || pedidoFacturaAbierto.cliente.poblacion ? ` — ${[pedidoFacturaAbierto.cliente.cp, pedidoFacturaAbierto.cliente.poblacion].filter(Boolean).join(" ")}` : ""}
                  {pedidoFacturaAbierto.cliente.provincia ? `, ${pedidoFacturaAbierto.cliente.provincia}` : ""}
                </p>
              )}
            </div>

            <div style={{ background: "#0B0B0D", padding: 12, borderRadius: 10, marginBottom: 12, border: "1px solid #C9A24A" }}>
              <p style={{ color: "#C9A24A", margin: "0 0 8px", fontWeight: "bold" }}>Detalle</p>
              {pedidoFacturaAbierto.items?.map((it: ItemCarrito, idx: number) => (
                <div key={`factura-${pedidoFacturaAbierto.numero}-${idx}`} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>{it.nombre} x{it.cantidad}</span>
                  <span>{(it.precio * it.cantidad).toFixed(2)} €</span>
                </div>
              ))}
            </div>

            <div style={{ background: "#0B0B0D", padding: 12, borderRadius: 10, border: "1px solid #C9A24A" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Subtotal</span><span>{pedidoFacturaAbierto.subtotal?.toFixed(2)} €</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Envío</span><span>{pedidoFacturaAbierto.envio?.toFixed(2)} €</span></div>
              {pedidoFacturaAbierto.descuento != null && pedidoFacturaAbierto.descuento > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Descuento</span><span>-{pedidoFacturaAbierto.descuento.toFixed(2)} €</span></div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, color: "#C9A24A", fontWeight: "bold", fontSize: 18 }}><span>TOTAL</span><span>{pedidoFacturaAbierto.total?.toFixed(2)} €</span></div>
            </div>

            {pedidoFacturaAbierto.pago && (
              <p style={{ marginTop: 12, fontSize: 14, opacity: 0.9 }}>
                Pago: {pedidoFacturaAbierto.pago.metodo === "bizum" ? "Bizum" : "Tarjeta"} — {pedidoFacturaAbierto.pago.estado}
                {pedidoFacturaAbierto.pago.referencia ? ` (${pedidoFacturaAbierto.pago.referencia})` : ""}
              </p>
            )}

            {notaPedidoEnvio.trim() !== "" && (
              <div style={{ marginTop: 14, padding: 12, background: "rgba(201,162,74,0.1)", borderRadius: 10, border: "1px solid rgba(201,162,74,0.4)" }}>
                <p style={{ color: "#C9A24A", margin: "0 0 4px", fontWeight: "bold", fontSize: 14 }}>📝 Nota para el cliente / envío</p>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.95)", fontSize: 14, whiteSpace: "pre-wrap" }}>{notaPedidoEnvio.trim()}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formulario de pedido */}
      {formPedidoAbierto && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: "12px 0"
        }}>
          <div style={{
            background: "#0B0B0D",
            border: "3px solid #C9A24A",
            borderRadius: 30,
            padding: 30,
            width: "95%",
            maxWidth: 720,
            maxHeight: "60vh",
            overflowY: "auto"
          }}>
            {pasoFinalizarCompra === "pago" ? (
              <div key="paso-pago" style={{ color: "#fff", fontSize: 15 }}>
                <h2 style={{ color: "#C9A24A", marginBottom: 20 }}>💳 MÉTODO DE PAGO</h2>
                {/* Recuadro: elegir método */}
                <div style={{
                  background: "#0B0B0D",
                  padding: "8px 12px",
                  borderRadius: 10,
                  marginBottom: 10,
                  border: "1px solid #C9A24A"
                }}>
                  <p style={{ marginTop: 0, marginBottom: 4, color: "white", fontSize: 16 }}><strong>Elige cómo pagar</strong></p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setMetodoPago("bizum")}
                      style={{
                        flex: 1,
                        padding: 6,
                        borderRadius: 20,
                        border: metodoPago === "bizum" ? "2px solid #C9A24A" : "1px solid rgba(201,162,74,0.4)",
                        background: metodoPago === "bizum" ? "#C9A24A" : "transparent",
                        color: metodoPago === "bizum" ? "#1b1745" : "#C9A24A",
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                    >
                      📱 Bizum
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodoPago("tarjeta")}
                      style={{
                        flex: 1,
                        padding: 6,
                        borderRadius: 20,
                        border: metodoPago === "tarjeta" ? "2px solid #C9A24A" : "1px solid rgba(201,162,74,0.4)",
                        background: metodoPago === "tarjeta" ? "#C9A24A" : "transparent",
                        color: metodoPago === "tarjeta" ? "#1b1745" : "#C9A24A",
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                    >
                      💳 Tarjeta bancaria
                    </button>
                  </div>
                </div>
                {/* Cuadro nuevo aparte: datos Bizum */}
                {metodoPago === "bizum" && (
                  <div style={{
                    background: "#0B0B0D",
                    padding: "14px 16px",
                    borderRadius: 12,
                    marginTop: 16,
                    marginBottom: 12,
                    border: "2px solid #C9A24A",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.4)"
                  }}>
                    <p style={{ marginTop: 0, marginBottom: 10, color: "#C9A24A", fontSize: 16, fontWeight: "bold" }}>📱 Bizum</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ padding: 8, borderRadius: 10, border: "2px solid #C9A24A", background: "#0B0B0D", color: "#C9A24A", fontSize: 14, fontWeight: "bold", minWidth: 64, textAlign: "center" }}>+34</div>
                      <input
                        type="tel"
                        placeholder="Móvil (9 dígitos)"
                        value={datosPago.bizumTelefono}
                        onChange={(e) => setDatosPago({ ...datosPago, bizumTelefono: e.target.value.replace(/\D/g, "") })}
                        inputMode="numeric"
                        maxLength={9}
                        style={{ ...inputStyle, flex: 1, height: 36, padding: "6px 10px", fontSize: 14 }}
                      />
                    </div>
                  </div>
                )}
                {/* Cuadro nuevo aparte: datos tarjeta */}
                {metodoPago === "tarjeta" && (
                  <div style={{
                    background: "#0B0B0D",
                    padding: "14px 16px",
                    borderRadius: 12,
                    marginTop: 16,
                    marginBottom: 12,
                    border: "2px solid #C9A24A",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.4)"
                  }}>
                    <p style={{ marginTop: 0, marginBottom: 10, color: "#C9A24A", fontSize: 16, fontWeight: "bold" }}>💳 Datos de la tarjeta</p>
                    <input
                      type="text"
                      placeholder="Número de tarjeta"
                      value={datosPago.tarjetaNumero}
                      onChange={(e) => setDatosPago({ ...datosPago, tarjetaNumero: e.target.value })}
                      name="cc-number"
                      autoComplete="cc-number"
                      inputMode="numeric"
                      style={{ ...inputStyle, marginBottom: 8, height: 36, padding: "6px 10px", fontSize: 14, width: "100%", boxSizing: "border-box" }}
                    />
                    <input
                      type="text"
                      placeholder="Titular"
                      value={datosPago.tarjetaTitular}
                      onChange={(e) => setDatosPago({ ...datosPago, tarjetaTitular: e.target.value })}
                      name="cc-name"
                      autoComplete="cc-name"
                      style={{ ...inputStyle, marginBottom: 8, height: 36, padding: "6px 10px", fontSize: 14, width: "100%", boxSizing: "border-box" }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <label style={{ display: "block", color: "white", fontSize: 12, marginBottom: 4 }}>Caducidad</label>
                        <input
                          type="text"
                          placeholder="MM/AA"
                          value={datosPago.tarjetaCaducidad}
                          onChange={(e) => setDatosPago({ ...datosPago, tarjetaCaducidad: e.target.value })}
                          name="cc-exp"
                          autoComplete="cc-exp"
                          inputMode="numeric"
                          maxLength={5}
                          style={{ ...inputStyle, height: 36, padding: "6px 10px", fontSize: 14, width: "100%", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", color: "white", fontSize: 12, marginBottom: 4 }}>CVC</label>
                        <input
                          type="text"
                          placeholder="CVC"
                          value={datosPago.tarjetaCVV}
                          onChange={(e) => setDatosPago({ ...datosPago, tarjetaCVV: e.target.value })}
                          name="cc-csc"
                          autoComplete="cc-csc"
                          inputMode="numeric"
                          maxLength={4}
                          style={{ ...inputStyle, height: 36, padding: "6px 10px", fontSize: 14, width: "100%", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ background: "#0B0B0D", padding: 15, borderRadius: 10, marginBottom: 20, border: "1px solid #C9A24A" }}>
                  <ResumenPago total={total} envioPreview={envioPreview} cuponAplicado={cuponAplicado} totalAPagar={totalAPagarResumen} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setPasoFinalizarCompra("datos")}
                    style={{ flex: 1, padding: 12, borderRadius: 25, border: "2px solid #C9A24A", background: "transparent", color: "#C9A24A", fontWeight: "bold", cursor: "pointer" }}
                  >
                    ← Volver
                  </button>
                  <button
                    type="button"
                    onClick={() => { void enviarPedidoWhatsApp(); }}
                    disabled={procesandoPago}
                    style={{ flex: 1, padding: 12, borderRadius: 25, border: "none", background: procesandoPago ? "#8a8a8a" : "#25D366", color: "white", fontWeight: "bold", cursor: procesandoPago ? "not-allowed" : "pointer", opacity: procesandoPago ? 0.85 : 1 }}
                  >
                    {procesandoPago ? "Procesando pago..." : "💳 Pagar y enviar"}
                  </button>
                </div>
              </div>
            ) : (
              <>
            <h2 style={{ color: "#C9A24A", marginBottom: 20 }}>📝 FINALIZAR COMPRA</h2>

            {numeroPedidoPreview && (
              <div style={{
                background: "#C9A24A",
                color: "#1b1745",
                padding: 10,
                borderRadius: 10,
                textAlign: "center",
                fontWeight: "bold",
                marginBottom: 20
              }}>
                Pedido: {numeroPedidoPreview}
              </div>
            )}

            <input
              type="text"
              placeholder="Nombre completo *"
              value={datosCliente.nombreApellidos}
              onChange={(e) => setDatosCliente({ ...datosCliente, nombreApellidos: e.target.value })}
              style={inputStyle}
            />

            <input
              type="email"
              placeholder="Email *"
              value={datosCliente.email}
              onChange={(e) => setDatosCliente({ ...datosCliente, email: e.target.value })}
              style={inputStyle}
            />

            <input
              type="tel"
              placeholder="Teléfono *"
              value={datosCliente.telefono}
              onChange={(e) => setDatosCliente({ ...datosCliente, telefono: e.target.value })}
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="Calle *"
              value={datosCliente.calle || ""}
              onChange={(e) => setDatosCliente({ ...datosCliente, calle: e.target.value })}
              style={inputStyle}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <input
                type="text"
                placeholder="Número *"
                value={datosCliente.numero || ""}
                onChange={(e) => setDatosCliente({ ...datosCliente, numero: e.target.value })}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Bloque (opcional)"
                value={datosCliente.bloque || ""}
                onChange={(e) => setDatosCliente({ ...datosCliente, bloque: e.target.value })}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Escalera (opcional)"
                value={datosCliente.escalera || ""}
                onChange={(e) => setDatosCliente({ ...datosCliente, escalera: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input
                type="text"
                placeholder="Piso (opcional)"
                value={datosCliente.piso || ""}
                onChange={(e) => setDatosCliente({ ...datosCliente, piso: e.target.value })}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Puerta (opcional)"
                value={datosCliente.puerta || ""}
                onChange={(e) => setDatosCliente({ ...datosCliente, puerta: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
              <input
                type="text"
                placeholder="CP *"
                value={datosCliente.cp}
                onChange={(e) =>
                  setDatosCliente({
                    ...datosCliente,
                    cp: e.target.value.replace(/\D/g, "").slice(0, 5)
                  })
                }
                inputMode="numeric"
                maxLength={5}
                style={inputStyle}
              />

              <input
                type="text"
                placeholder="Población *"
                value={datosCliente.poblacion}
                onChange={(e) => setDatosCliente({ ...datosCliente, poblacion: e.target.value })}
                style={inputStyle}
              />
            </div>

            <input
              type="text"
              placeholder="Provincia *"
              value={datosCliente.provincia}
              onChange={(e) => setDatosCliente({ ...datosCliente, provincia: e.target.value })}
              readOnly={provinciaPaisBloqueadosCheckout}
              title={provinciaPaisBloqueadosCheckout ? "Autocompletado por C.P." : ""}
              style={{ ...inputStyle, opacity: provinciaPaisBloqueadosCheckout ? 0.85 : 1 }}
            />

            <input
              type="text"
              placeholder="País *"
              value={datosCliente.pais}
              onChange={(e) => setDatosCliente({ ...datosCliente, pais: e.target.value })}
              readOnly={provinciaPaisBloqueadosCheckout}
              title={provinciaPaisBloqueadosCheckout ? "Autocompletado por C.P." : ""}
              style={{ ...inputStyle, opacity: provinciaPaisBloqueadosCheckout ? 0.85 : 1 }}
            />

            <textarea
              placeholder="Notas adicionales (opcional)"
              value={datosCliente.notas}
              onChange={(e) => setDatosCliente({ ...datosCliente, notas: e.target.value })}
              style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
            />

            <div style={{
              background: "#0B0B0D",
              padding: 15,
              borderRadius: 10,
              marginBottom: 15,
              border: "1px solid #C9A24A"
            }}>
              <p style={{ marginTop: 0, marginBottom: 10 }}><strong>Cupón</strong></p>

              <div style={{ display: "flex", gap: 8, marginBottom: cuponAplicado || cuponError ? 10 : 0 }}>
                <input
                  type="text"
                  placeholder="Código promocional"
                  value={cuponInput}
                  onChange={(e) => {
                    setCuponInput(e.target.value);
                    setCuponError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), aplicarCupon())}
                  style={{ ...inputStyle, marginBottom: 0, borderColor: cuponError ? "#ff4444" : undefined }}
                />
                <button
                  type="button"
                  onClick={aplicarCupon}
                  style={{
                    minWidth: 110,
                    borderRadius: 10,
                    border: "none",
                    background: "#C9A24A",
                    color: "#1b1745",
                    fontWeight: "bold",
                    cursor: "pointer",
                    padding: "0 12px"
                  }}
                >
                  Aplicar
                </button>
              </div>

              {cuponError && (
                <div style={{
                  marginBottom: 10,
                  padding: "10px 12px",
                  background: "rgba(255, 68, 68, 0.15)",
                  border: "1px solid #ff4444",
                  borderRadius: 10,
                  color: "#ffcccc",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}>
                  <span style={{ fontSize: 18 }}>⚠️</span>
                  <span>{cuponError}</span>
                </div>
              )}

              {cuponAplicado && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#C9A24A", fontWeight: "bold", fontSize: 13 }}>
                    ✅ Cupón activo: {cuponAplicado.codigo}
                  </span>
                  <button
                    type="button"
                    onClick={quitarCupon}
                    style={{
                      background: "transparent",
                      color: "#ff4444",
                      border: "1px solid #ff4444",
                      borderRadius: 8,
                      padding: "4px 10px",
                      cursor: "pointer",
                      fontSize: 12
                    }}
                  >
                    Quitar
                  </button>
                </div>
              )}
            </div>

            <div
              key={`resumen-${totalAPagarResumen}-${cuponAplicado?.codigo ?? ""}`}
              style={{
                background: "#0B0B0D",
                padding: 15,
                borderRadius: 10,
                margin: "20px 0"
              }}
            >
              <ResumenPago
                total={total}
                envioPreview={envioPreview}
                cuponAplicado={cuponAplicado}
                totalAPagar={totalAPagarResumen}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  setPasoFinalizarCompra("datos");
                  setFormPedidoAbierto(false);
                }}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 25,
                  border: "2px solid #C9A24A",
                  background: "transparent",
                  color: "#C9A24A",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Cancelar
              </button>

              <button
                onClick={() => setPasoFinalizarCompra("pago")}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 25,
                  border: "none",
                  background: "#C9A24A",
                  color: "#1b1745",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Continuar al pago →
              </button>
            </div>
              </>
            )}
          </div>
        </div>
      )}

      <PedidoExitoModal
        abierto={pedidoRealizado}
        numeroPedido={ultimoPedidoNumero}
        onClose={() => {
          if (urlWhatsAppPendiente) {
            window.open(urlWhatsAppPendiente, "_blank");
            setUrlWhatsAppPendiente(null);
          }
          setPedidoRealizado(false);
          setPagina("inicio");
        }}
      />

      {!esAppNativa && pagina !== "tienda" && pagina !== "carrito" && (
        <VisitasCounter visitas={visitas} />
      )}


      <ModalUsuarios
        abierto={modalUsuariosAbierto}
        usuarios={listaUsuarios}
        onClose={() => setModalUsuariosAbierto(false)}
        mostrarNotificacion={mostrarNotificacion}
        onEditUsuario={abrirEditorUsuario}
        onUpdateUsuario={(nuevosUsuarios) => setListaUsuarios(nuevosUsuarios)}
        onDeleteUsuario={(id) => {
          const usuarioABorrar = listaUsuarios.find(u => u.id === id);
          const nuevosUsuarios = listaUsuarios.filter(u => u.id !== id);
          setListaUsuarios(nuevosUsuarios);
          
          if (usuario && usuarioABorrar && (usuario.id === id || usuario.email.toLowerCase() === usuarioABorrar.email.toLowerCase())) {
            setUsuario(null);
            localStorage.removeItem("usuarioActual");
            
            // Forzar volver a la página de inicio para cerrar sesión y evitar pantallas inconsistentes
            setPagina("inicio");
            setModalUsuariosAbierto(false); 
          }
        }}
      />

      <EditUsuarioModal
        abierto={modalEditarUsuarioAbierto}
        editUsuarioForm={editUsuarioForm}
        setEditUsuarioForm={setEditUsuarioForm}
        onClose={() => {
          setModalEditarUsuarioAbierto(false);
          setEditUsuarioForm(null);
        }}
        onSave={guardarEdicionUsuario}
      />
      </AppProvider>
    </Layout>
  );
}
