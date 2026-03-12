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
import FooterLegal from "./components/FooterLegal";
import Layout from "./components/Layout";
import NavPrincipal from "./components/NavPrincipal";
import { AppProvider, type AppContextValue } from "./context/AppContext";
import InicioPage from "./pages/InicioPage";
import TiendaPage from "./pages/TiendaPage";
import CarritoPage from "./pages/CarritoPage";
import SeguimientoPage from "./pages/SeguimientoPage";
import CuentaPage from "./pages/CuentaPage";
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
  CUPONES_DISPONIBLES
} from "./config";
import { useCatalogo } from "./hooks/useCatalogo";
import { useCategorias } from "./hooks/useCategorias";
import { useNotificacion } from "./hooks/useNotificacion";

export type { Producto, ItemCarrito, Cliente, Usuario, Pedido, EditUsuarioForm } from "./types";

function normalizarCodigoCupon(codigo: string): string {
  return codigo.trim().toUpperCase().replace(/\s+/g, "");
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
  const [pedidoRealizado, setPedidoRealizado] = useState(false);
  const [numeroPedidoPreview, setNumeroPedidoPreview] = useState<string | null>(null);
  const [ultimoPedidoNumero, setUltimoPedidoNumero] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [busquedaPedido, setBusquedaPedido] = useState("");
  const [pedidoAbierto, setPedidoAbierto] = useState<number | null>(null);

  const [pendientesAbierto, setPendientesAbierto] = useState(true);
  const [enviadosAbierto, setEnviadosAbierto] = useState(false);
  const [entregadosAbierto, setEntregadosAbierto] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);

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
  const [perfilCompraRapida, setPerfilCompraRapida] = useState<PerfilCompraRapida | null>(null);

  const [datosCliente, setDatosCliente] = useState<Cliente>({
    nombreApellidos: "",
    email: "",
    telefono: "",
    direccion: "",
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

    const catalogoProductos = [...velas, ...inciensos, ...figuras];
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
  }, [pedidos, cart, velas, inciensos, figuras, umbralStockBajo]);

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
  const totalFinalConCupon = Math.max(0, totalPreview - descuentoCupon);

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

    mostrarNotificacion("⚡ Compra rápida iniciada", "normal");
    await enviarPedidoWhatsApp({
      datosCliente: perfilCompraRapida.datosCliente,
      metodoPago: perfilCompraRapida.metodoPago,
      datosPago: perfilCompraRapida.datosPago
    });
  };

  const aplicarCupon = () => {
    const codigo = normalizarCodigoCupon(cuponInput);
    if (!codigo) {
      mostrarNotificacion("Introduce un código de cupón", "error");
      return;
    }

    const cupon = CUPONES_DISPONIBLES[codigo];
    if (!cupon) {
      mostrarNotificacion("Cupón no válido", "error");
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
    mostrarNotificacion("Cupón eliminado", "normal");
  };

  const agregarAlCarrito = useCallback((producto: Producto) => {
    const idNum = Number(producto.id);
    const stockDisponible = Math.max(0, Number(producto.stock));
    if (!Number.isFinite(idNum) || stockDisponible <= 0) {
      mostrarNotificacion(`❌ ${producto.nombre} agotado`, "error");
      return;
    }

    const precioNormalizado = (() => {
      const directo = precioSeguro(producto.precio);
      if (directo > 0) return directo;
      return precioCatalogoPorId.get(idNum) ?? precioCatalogoPorId.get(producto.id as number) ?? 0;
    })();

    const restarStock = (stockActual: number) => Math.max(0, Number(stockActual) - 1);
    flushSync(() => {
      if (idNum < 100) {
        setVelas(prev => prev.map(v =>
          v.id === idNum ? { ...v, stock: restarStock(v.stock) } : v
        ));
      } else if (idNum < 200) {
        setInciensos(prev => prev.map(i =>
          i.id === idNum ? { ...i, stock: restarStock(i.stock) } : i
        ));
      } else {
        setFiguras(prev => prev.map(f =>
          f.id === idNum ? { ...f, stock: restarStock(f.stock) } : f
        ));
      }
    });

    setCart((prev) => {
      const existente = prev.find((p) => idSeguro(p.id) === idNum);
      if (existente) {
        return prev.map((p) =>
          idSeguro(p.id) === idNum
            ? {
                ...p,
                precio: precioNormalizado > 0 ? precioNormalizado : precioItemCarrito(p),
                cantidad: p.cantidad + 1
              }
            : p
        );
      }
      return [...prev, normalizarItemCarrito({ ...producto, id: idNum, precio: precioNormalizado, cantidad: 1 })];
    });

    mostrarNotificacion(`✅ ${producto.nombre} añadido`, "exito");
  }, [cart, mostrarNotificacion, precioCatalogoPorId, precioItemCarrito, normalizarItemCarrito, setVelas, setInciensos, setFiguras]);

  const getStockProducto = useCallback((id: number) => {
    const stock = (id < 100)
      ? velas.find(p => p.id === id)?.stock
      : (id < 200) ? inciensos.find(p => p.id === id)?.stock : figuras.find(p => p.id === id)?.stock;
    return Math.max(0, Number(stock ?? 0));
  }, [velas, inciensos, figuras]);

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

    const nextCart = (prev: ItemCarrito[]) => {
      const item = prev.find(p => idSeguro(p.id) === idNum || Number(p.id) === idNum);
      if (!item) return prev;
      let nuevaCantidad = Math.max(0, (Number(item.cantidad) || 0) + incremento);
      if (incremento > 0) {
        const maxPermitido = cantidadActual + stockDisponible;
        nuevaCantidad = Math.min(nuevaCantidad, maxPermitido);
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

    const sumarStock = (s: number) => Math.max(0, Number(s) + 1);
    const restarStock = (s: number) => Math.max(0, Number(s) - 1);
    if (incremento < 0) {
      flushSync(() => {
        if (idNum < 100) setVelas(v => v.map(p => (p.id === idNum ? { ...p, stock: sumarStock(p.stock) } : p)));
        else if (idNum < 200) setInciensos(v => v.map(p => (p.id === idNum ? { ...p, stock: sumarStock(p.stock) } : p)));
        else setFiguras(v => v.map(p => (p.id === idNum ? { ...p, stock: sumarStock(p.stock) } : p)));
      });
    } else if (incremento > 0) {
      flushSync(() => {
        if (idNum < 100) setVelas(v => v.map(p => (p.id === idNum ? { ...p, stock: restarStock(p.stock) } : p)));
        else if (idNum < 200) setInciensos(v => v.map(p => (p.id === idNum ? { ...p, stock: restarStock(p.stock) } : p)));
        else setFiguras(v => v.map(p => (p.id === idNum ? { ...p, stock: restarStock(p.stock) } : p)));
      });
    }
  };

  const vaciarCarrito = () => {
    if (cart.length === 0) {
      mostrarNotificacion("Carrito vacío", "error");
      return;
    }
    setModalAbierto(true);
  };

  const confirmarVaciarCarrito = () => {
    cart.forEach(item => {
      if (item.id < 100) {
        setVelas(v => v.map(p =>
          p.id === item.id ? { ...p, stock: p.stock + item.cantidad } : p
        ));
      } else if (item.id < 200) {
        setInciensos(v => v.map(p =>
          p.id === item.id ? { ...p, stock: p.stock + item.cantidad } : p
        ));
      } else {
        setFiguras(v => v.map(p =>
          p.id === item.id ? { ...p, stock: p.stock + item.cantidad } : p
        ));
      }
    });

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

    if (
      !datosClienteActual.nombreApellidos?.trim() ||
      !datosClienteActual.email?.trim() ||
      !datosClienteActual.direccion?.trim() ||
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
          return "Introduce un móvil de España válido (9 dígitos)";
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
      mensaje += `📍 *Dirección:* ${datosClienteActual.direccion}, ${datosClienteActual.cp} ${datosClienteActual.poblacion}, ${datosClienteActual.provincia}, ${datosClienteActual.pais}\n\n`;
      mensaje += `📋 *PRODUCTOS:*\n`;

      cart.forEach(item => {
        const precioUnitario = precioItemCarrito(item);
        mensaje += `   • ${item.nombre} x${item.cantidad} = ${(precioUnitario * item.cantidad).toFixed(2)}€\n`;
      });

      mensaje += `\n💰 *Subtotal:* ${total.toFixed(2)}€`;
      mensaje += `\n🚚 *Envío:* ${envio.toFixed(2)}€`;
      if (cuponAplicado && descuentoAplicado > 0) {
        mensaje += `\n🎟️ *Cupón:* ${cuponAplicado.codigo}`;
        mensaje += `\n➖ *Descuento:* -${descuentoAplicado.toFixed(2)}€`;
      }
      mensaje += `\n💶 *TOTAL:* ${totalFinal.toFixed(2)}€`;

      const url = `https://wa.me/34673175547?text=${encodeURIComponent(mensaje)}`;
      window.open(url, "_blank");

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

      setCart([]);
      setFormPedidoAbierto(false);
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

  const cambiarEstadoPedido = (index: number, nuevoEstado: Pedido["estado"]) => {
    const pedidoOriginal = pedidos[index];

    const nuevosPedidos = pedidos.map((p, i) =>
      i === index ? { ...p, estado: nuevoEstado } : p
    );

setPedidos(nuevosPedidos as Pedido[]);
    localStorage.setItem("pedidosMaika", JSON.stringify(nuevosPedidos));

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
        background: "#2b2560",
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
            background: "linear-gradient(135deg, #2b2560 0%, #3a2e8a 100%)"
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
                      background: p.numero === ultimoPedidoNumero ? "#3a2f80" : "#2b2560",
                      border: "1px solid gold",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 10,
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong style={{ color: "gold" }}>{p.numero}</strong>
                      <span style={{ color: "white", fontSize: "0.8rem" }}>{p.fecha}</span>
                    </div>
                    <div style={{ color: "white" }}>{p.cliente?.nombreApellidos}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                      <span style={{ color: "gold" }}>{p.total?.toFixed(2)} €</span>
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
                          cambiarEstadoPedido(indexEnOriginal, e.target.value as Pedido["estado"]);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          marginTop: 8,
                          padding: 8,
                          borderRadius: 8,
                          width: "100%",
                          background: "#1b1745",
                          color: "gold",
                          border: "1px solid gold",
                          cursor: "pointer"
                        }}
                      >
                        <option value="pendiente">🛒 Pendiente</option>
                        <option value="enviado">🚚 Enviado</option>
                        <option value="entregado">✅ Entregado</option>
                      </select>
                    )}

                    {pedidoAbierto === indexEnOriginal && (
                      <div style={{ marginTop: 10, borderTop: "1px solid gold", paddingTop: 10 }}>
                        <strong style={{ color: "gold" }}>📦 Productos:</strong>
                        {p.items?.map((it: ItemCarrito, idx: number) => (
                          <div key={`${p.numero}-item-${idx}`} style={{ color: "white", marginLeft: 10 }}>
                            • {it.nombre} x{it.cantidad} = {(it.precio * it.cantidad).toFixed(2)} €
                          </div>
                        ))}
                      </div>
                    )}
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
    velas,
    inciensos,
    figuras,
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
    pedidosEntregadosOrdenados
  }), [
    setPagina, velas, inciensos, figuras, categoriasCatalogo, agregarAlCarrito,
    cart, total, totalItemsCarrito, precioItemCarrito, cambiarCantidad, volverATienda, vaciarCarrito, finalizarCarrito,
    envioPreview, totalPreview, generarNumeroPedido, setNumeroPedidoPreview, setFormPedidoAbierto,
    precargarDatosClienteDesdeUsuario, usuario, perfilCompraRapida, comprarEnUnClick,
    numeroSeguimiento, buscarPedido, pedidoBuscado, accesoAdmin, busquedaPedido, renderCajaPedidos,
    pendientesAbierto, enviadosAbierto, entregadosAbierto,
    pedidosPendientesOrdenados, pedidosEnviadosOrdenados, pedidosEntregadosOrdenados
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
        umbralStockBajo={umbralStockBajo}
        mostrarNotificacion={mostrarNotificacion}
      />
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
    <Layout pulseStyle={pulseAnimationStyle}>
      <AppProvider value={appContextValue}>
      <NavPrincipal
        key={cart.map((i) => `${i.id}:${i.cantidad}`).join("|")}
        pagina={pagina}
        setPagina={setPagina}
        onTerminarCompra={() => {
          precargarDatosClienteDesdeUsuario(usuario);
          setNumeroPedidoPreview(generarNumeroPedido());
          setFormPedidoAbierto(true);
        }}
        mostrarBotonUnClic={!!perfilCompraRapida}
        onComprarUnClic={comprarEnUnClick}
        esAppNativa={esAppNativa}
      />

      {/* Aviso cookies */}
      {mostrarAvisoCookies && (pagina === "inicio" || pagina === "tienda" || pagina === "carrito") && (
        <div className="cookie-banner" style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          right: 20,
          border: "2px solid gold",
          borderRadius: 15,
          padding: "15px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: 12,
          background: "#1b1745"
        }}>
          <div style={{ color: "white", fontSize: 14, lineHeight: 1.45 }}>
            🍪 Usamos cookies necesarias para el funcionamiento de la tienda y, con tu permiso,
            cookies de preferencias, analítica y marketing.
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              onClick={rechazarCookiesOpcionales}
              style={{
                background: "transparent",
                color: "gold",
                border: "1px solid gold",
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
                background: "gold",
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
              border: "1px solid rgba(255,215,0,0.5)",
              borderRadius: 12,
              padding: 12,
              background: "#2b2560",
              color: "white"
            }}>
              <p style={{ margin: "0 0 10px", color: "gold", fontWeight: "bold" }}>
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
                    color: "gold",
                    border: "1px solid gold",
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
                    background: "gold",
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

      {/* INICIO */}
      {pagina === "inicio" && (
        <div style={{ maxWidth: 720, margin: "0 auto", width: "100%", padding: "0 20px", boxSizing: "border-box" }}>
          <InicioPage />
        </div>
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

      {/* ADMIN (solo un bloque para evitar espacio negro y duplicado) */}
      {pagina === "admin" && (
        <div style={{ maxWidth: 1100, margin: "0 auto", width: "98%", paddingTop: 8 }}>
          <h2 style={{ textAlign: "center", color: "gold", marginBottom: 28, fontSize: 42 }}>⚙️ PANEL ADMIN</h2>

          {!accesoAdmin ? (
            <div style={{
              background: "#2b2560",
              border: "3px solid gold",
              borderRadius: 24,
              padding: 34,
              maxWidth: 620,
              margin: "0 auto"
            }}>
              <h3 style={{ color: "gold", textAlign: "center", marginBottom: 16, fontSize: 30 }}>🔐 Acceso</h3>
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
                  border: "2px solid gold",
                  background: "#1b1745",
                  color: "gold",
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
              background: "#2b2560",
              border: "3px solid gold",
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
              </div>

              <div
                style={{
                  background: "#1b1745",
                  border: "1px solid gold",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 18,
                  color: "white",
                  fontSize: 20
                }}
              >
                <div style={{ color: "gold", fontWeight: "bold", marginBottom: 12, fontSize: 24 }}>
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
                  <div style={{ border: "1px solid gold", borderRadius: 12, padding: 12, background: "rgba(255,215,0,0.06)" }}>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>💶 Ventas semana</div>
                    <div style={{ color: "gold", fontWeight: "bold", fontSize: 22 }}>{metricasAdmin.ventasSemana.toFixed(2)} €</div>
                  </div>
                  <div style={{ border: "1px solid gold", borderRadius: 12, padding: 12, background: "rgba(255,215,0,0.06)" }}>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>📦 Pedidos pendientes</div>
                    <div style={{ color: "gold", fontWeight: "bold", fontSize: 22 }}>{pedidosPendientes.length}</div>
                  </div>
                  <div style={{ border: "1px solid gold", borderRadius: 12, padding: 12, background: "rgba(255,215,0,0.06)" }}>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>👥 Usuarios totales</div>
                    <div style={{ color: "gold", fontWeight: "bold", fontSize: 22 }}>{metricasUsuariosAdmin.total}</div>
                  </div>
                  <div style={{ border: "1px solid gold", borderRadius: 12, padding: 12, background: "rgba(255,215,0,0.06)" }}>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>⚠️ Stock bajo</div>
                    <div style={{ color: "gold", fontWeight: "bold", fontSize: 22 }}>{metricasAdmin.alertasStockBajo.length}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 14, padding: "12px 14px", background: "rgba(255,215,0,0.06)", border: "1px solid gold", borderRadius: 12 }}>
                  <div style={{ color: "gold", fontWeight: "bold", marginBottom: 8 }}>📋 Umbral de stock bajo</div>
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
                      style={{ padding: "8px 12px", borderRadius: 8, border: "2px solid gold", background: "#1b1745", color: "gold", fontSize: 16, cursor: "pointer" }}
                    >
                      {[2, 3, 5, 10, 15, 20].map((n) => (
                        <option key={n} value={n}>{n} unidades</option>
                      ))}
                    </select>
                  </div>
                </div>

                <details style={{ marginBottom: 14 }}>
                  <summary
                    style={{
                      color: "gold",
                      fontWeight: "bold",
                      fontSize: 22,
                      cursor: "pointer",
                      border: "2px solid gold",
                      borderRadius: 12,
                      padding: "10px 14px",
                      background: "rgba(255, 215, 0, 0.08)",
                      listStyle: "none"
                    }}
                  >
                    🏆 Productos
                  </summary>

                  <div style={{ marginTop: 10, paddingLeft: 4 }}>
                    <div style={{ color: "gold", fontWeight: "bold", marginBottom: 8 }}>
                      📦 Informe: Productos a reponer (stock ≤ {umbralStockBajo})
                    </div>
                    {metricasAdmin.alertasStockBajo.length === 0 ? (
                      <div style={{ opacity: 0.85, marginBottom: 12 }}>Ningún producto por debajo del umbral. No hay que reponer.</div>
                    ) : (
                      <div style={{ marginBottom: 12, overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid gold" }}>
                              <th style={{ textAlign: "left", padding: "8px 12px", color: "gold" }}>Producto</th>
                              <th style={{ textAlign: "left", padding: "8px 12px", color: "gold" }}>Categoría</th>
                              <th style={{ textAlign: "right", padding: "8px 12px", color: "gold" }}>Stock actual</th>
                            </tr>
                          </thead>
                          <tbody>
                            {metricasAdmin.alertasStockBajo.map((producto) => (
                              <tr key={`stock-${producto.id}`} style={{ borderBottom: "1px solid rgba(255,215,0,0.3)" }}>
                                <td style={{ padding: "8px 12px", color: "white" }}>{producto.nombre}</td>
                                <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.85)" }}>{producto.categoria}</td>
                                <td style={{ padding: "8px 12px", textAlign: "right", color: "gold", fontWeight: "bold" }}>{producto.stock}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div style={{ color: "gold", fontWeight: "bold", marginBottom: 6 }}>
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

                    <div style={{ color: "gold", fontWeight: "bold", marginBottom: 6 }}>
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
                      color: "gold",
                      fontWeight: "bold",
                      fontSize: 22,
                      cursor: "pointer",
                      border: "2px solid gold",
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
                      Total registrados: <strong style={{ color: "gold" }}>{metricasUsuariosAdmin.total}</strong>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      Verificados: <strong style={{ color: "gold" }}>{metricasUsuariosAdmin.verificados}</strong>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      Pendientes: <strong style={{ color: "gold" }}>{metricasUsuariosAdmin.pendientes}</strong>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      Con pedidos: <strong style={{ color: "gold" }}>{metricasUsuariosAdmin.conPedidos}</strong>
                    </div>
                    <div>
                      Nuevos (7 días): <strong style={{ color: "gold" }}>{metricasUsuariosAdmin.nuevos7dias}</strong>
                    </div>
                  </div>
                </details>

                <details style={{ marginBottom: 14 }}>
                  <summary
                    style={{
                      color: "gold",
                      fontWeight: "bold",
                      fontSize: 22,
                      cursor: "pointer",
                      border: "2px solid gold",
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
                      💶 Ventas hoy: <strong style={{ color: "gold" }}>{metricasAdmin.ventasHoy.toFixed(2)} €</strong>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      📅 Ventas semana: <strong style={{ color: "gold" }}>{metricasAdmin.ventasSemana.toFixed(2)} €</strong>
                    </div>
                    <div>
                      📦 Pedidos totales: <strong style={{ color: "gold" }}>{pedidos.length}</strong>
                    </div>
                  </div>
                </details>

                <details style={{ marginBottom: 14 }}>
                  <summary
                    style={{
                      color: "gold",
                      fontWeight: "bold",
                      fontSize: 22,
                      cursor: "pointer",
                      border: "2px solid gold",
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
                      🛒 Pendientes: <strong style={{ color: "gold" }}>{pedidosPendientes.length}</strong>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      🚚 Enviados: <strong style={{ color: "gold" }}>{pedidosEnviados.length}</strong>
                    </div>
                    <div>
                      ✅ Entregados: <strong style={{ color: "gold" }}>{pedidosEntregados.length}</strong>
                    </div>
                  </div>
                </details>

                <details>
                  <summary
                    style={{
                      color: "gold",
                      fontWeight: "bold",
                      fontSize: 22,
                      cursor: "pointer",
                      border: "2px solid gold",
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
                          Items en carrito: <strong style={{ color: "gold" }}>{metricasAdmin.carritoItemsPendientes}</strong>
                        </div>
                        <div>
                          Importe estimado: <strong style={{ color: "gold" }}>{metricasAdmin.carritoImportePendiente.toFixed(2)} €</strong>
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
                    background: "linear-gradient(135deg, #2b2560 0%, #3a2e8a 100%)",
                    border: "2px solid gold",
                    color: "gold",
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

      {/* Modal Confirmación */}
      <ModalConfirmacion
        abierto={modalAbierto}
        mensaje="¿Vaciar el carrito?"
        onConfirmar={confirmarVaciarCarrito}
        onCancelar={() => setModalAbierto(false)}
      />

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
          zIndex: 10000
        }}>
          <div style={{
            background: "#2b2560",
            border: "3px solid gold",
            borderRadius: 30,
            padding: 30,
            width: "90%",
            maxWidth: 500,
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h2 style={{ color: "gold", marginBottom: 20 }}>📝 FINALIZAR COMPRA</h2>

            {numeroPedidoPreview && (
              <div style={{
                background: "gold",
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
              placeholder="Dirección *"
              value={datosCliente.direccion}
              onChange={(e) => setDatosCliente({ ...datosCliente, direccion: e.target.value })}
              style={inputStyle}
            />

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
              background: "#1b1745",
              padding: 15,
              borderRadius: 10,
              marginBottom: 15,
              border: "1px solid gold"
            }}>
              <p style={{ marginTop: 0, marginBottom: 10 }}><strong>Cupón</strong></p>

              <div style={{ display: "flex", gap: 8, marginBottom: cuponAplicado ? 10 : 0 }}>
                <input
                  type="text"
                  placeholder="Ej: MAIKA10 o ENVIOGRATIS"
                  value={cuponInput}
                  onChange={(e) => setCuponInput(e.target.value)}
                  style={{ ...inputStyle, marginBottom: 0 }}
                />
                <button
                  onClick={aplicarCupon}
                  style={{
                    minWidth: 110,
                    borderRadius: 10,
                    border: "none",
                    background: "gold",
                    color: "#1b1745",
                    fontWeight: "bold",
                    cursor: "pointer",
                    padding: "0 12px"
                  }}
                >
                  Aplicar
                </button>
              </div>

              {cuponAplicado && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "gold", fontWeight: "bold", fontSize: 13 }}>
                    ✅ Cupón activo: {cuponAplicado.codigo}
                  </span>
                  <button
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

            <div style={{
              background: "#1b1745",
              padding: 15,
              borderRadius: 10,
              marginBottom: 15,
              border: "1px solid gold"
            }}>
              <p style={{ marginTop: 0, marginBottom: 10 }}><strong>Método de pago</strong></p>

              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as "bizum" | "tarjeta")}
                style={{ ...inputStyle, marginBottom: 12 }}
              >
                <option value="bizum">📱 Bizum</option>
                <option value="tarjeta">💳 Tarjeta</option>
              </select>

              {metodoPago === "bizum" ? (
                <div style={{ display: "flex", gap: 8, marginBottom: 0 }}>
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      border: "2px solid gold",
                      background: "#1b1745",
                      color: "gold",
                      fontSize: 16,
                      fontWeight: "bold",
                      minWidth: 74,
                      textAlign: "center"
                    }}
                  >
                    +34
                  </div>
                  <input
                    type="tel"
                    placeholder="Móvil (9 dígitos)"
                    value={datosPago.bizumTelefono}
                    onChange={(e) =>
                      setDatosPago({
                        ...datosPago,
                        bizumTelefono: e.target.value.replace(/\D/g, "")
                      })
                    }
                    inputMode="numeric"
                    maxLength={9}
                    style={{ ...inputStyle, marginBottom: 0 }}
                  />
                </div>
              ) : (
                <>
                  <p style={{ margin: "0 0 8px", color: "gold", fontWeight: "bold" }}>Datos de la tarjeta</p>

                  <input
                    type="text"
                    placeholder="Número de tarjeta"
                    value={datosPago.tarjetaNumero}
                    onChange={(e) => setDatosPago({ ...datosPago, tarjetaNumero: e.target.value })}
                    name="cc-number"
                    autoComplete="cc-number"
                    inputMode="numeric"
                    style={inputStyle}
                  />

                  <input
                    type="text"
                    placeholder="Titular"
                    value={datosPago.tarjetaTitular}
                    onChange={(e) => setDatosPago({ ...datosPago, tarjetaTitular: e.target.value })}
                    name="cc-name"
                    autoComplete="cc-name"
                    style={inputStyle}
                  />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", color: "white", fontSize: 13, marginBottom: 6 }}>
                        Fecha de caducidad
                      </label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        value={datosPago.tarjetaCaducidad}
                        onChange={(e) => setDatosPago({ ...datosPago, tarjetaCaducidad: e.target.value })}
                        name="cc-exp"
                        autoComplete="cc-exp"
                        inputMode="numeric"
                        maxLength={5}
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", color: "white", fontSize: 13, marginBottom: 6 }}>
                        CVC
                      </label>
                      <input
                        type="text"
                        placeholder="CVC"
                        value={datosPago.tarjetaCVV}
                        onChange={(e) => setDatosPago({ ...datosPago, tarjetaCVV: e.target.value })}
                        name="cc-csc"
                        autoComplete="cc-csc"
                        inputMode="numeric"
                        maxLength={4}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{
              background: "#1b1745",
              padding: 15,
              borderRadius: 10,
              margin: "20px 0"
            }}>
              <p><strong>Resumen:</strong></p>
              <p>Subtotal: {total.toFixed(2)} €</p>
              <p>Envío: {envioPreview.toFixed(2)} €</p>
              {descuentoCupon > 0 && <p>Descuento: -{descuentoCupon.toFixed(2)} €</p>}
              <p style={{ fontSize: 18, color: "gold" }}>TOTAL: {totalFinalConCupon.toFixed(2)} €</p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setFormPedidoAbierto(false)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 25,
                  border: "2px solid gold",
                  background: "transparent",
                  color: "gold",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  void enviarPedidoWhatsApp();
                }}
                disabled={procesandoPago}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 25,
                  border: "none",
                  background: procesandoPago ? "#8a8a8a" : "#25D366",
                  color: "white",
                  fontWeight: "bold",
                  cursor: procesandoPago ? "not-allowed" : "pointer",
                  opacity: procesandoPago ? 0.85 : 1
                }}
              >
                {procesandoPago ? "Procesando pago..." : "💳 Pagar y enviar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PedidoExitoModal
        abierto={pedidoRealizado}
        numeroPedido={ultimoPedidoNumero}
        onClose={() => {
          setPedidoRealizado(false);
          setPagina("inicio");
        }}
      />

      {!esAppNativa && pagina !== "tienda" && pagina !== "carrito" && (
        <VisitasCounter visitas={visitas} />
      )}

      {pagina === "inicio" && <FooterLegal />}

      <ModalUsuarios
        abierto={modalUsuariosAbierto}
        usuarios={listaUsuarios}
        onClose={() => setModalUsuariosAbierto(false)}
        mostrarNotificacion={mostrarNotificacion}
        onEditUsuario={abrirEditorUsuario}
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
