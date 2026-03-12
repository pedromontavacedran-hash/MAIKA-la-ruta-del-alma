import { useState, useEffect, useMemo } from "react";
import Tienda from "./Tienda";
import "./App.css";
import Carrito from "./Carrito";
import Notificacion from "./Notificacion";
import ModalConfirmacion from "./ModalConfirmacion";
import "./Notificacion.css";
import emailjs from '@emailjs/browser'; 
import { Capacitor } from "@capacitor/core";

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  imagen: string;
  categoria: "velas" | "inciensos" | "figuras";
  descripcion: string;
}

export interface ItemCarrito extends Producto {
  cantidad: number;
}

// Cliente / Usuario
export interface Cliente {
  nombreApellidos: string;
  email: string;
  telefono?: string;
  direccion?: string;
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

interface AuthForm {
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

interface ModalUsuariosProps {
  abierto: boolean;
  usuarios: Usuario[];
  onClose: () => void;
  mostrarNotificacion: (mensaje: string, tipo?: "normal" | "exito" | "error") => void;
  onEditUsuario?: (usuario: Usuario) => void;
}

interface EditUsuarioForm {
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

// ========== CONFIGURACIÓN EMAILJS ==========
const EMAILJS_CONFIG = {
  PUBLIC_KEY: "Z-4fOHeB2ph9ZNZIH", // ✅ Esta ES la Public Key (empieza con Z-)
  SERVICE_ID: "service_m0olcbz",
  TEMPLATE_ID: "template_k1m7v65"
};

// Interfaz para Pedido
interface Pedido {
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

type CuponTipo = "porcentaje" | "envio_gratis";

interface CuponAplicado {
  codigo: string;
  tipo: CuponTipo;
  valor: number;
}

interface DemoBackup {
  cart: ItemCarrito[];
  pedidos: Pedido[];
  listaUsuarios: Usuario[];
  usuario: Usuario | null;
  datosCliente: Cliente;
  visitas: number;
  velas: Producto[];
  inciensos: Producto[];
  figuras: Producto[];
}

interface ConsentimientoCookies {
  necesarias: true;
  preferencias: boolean;
  analiticas: boolean;
  marketing: boolean;
  fechaActualizacion: string;
  version: number;
}

interface PerfilCompraRapida {
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

const CUPONES_DISPONIBLES: Record<string, { tipo: CuponTipo; valor: number }> = {
  MAIKA10: { tipo: "porcentaje", valor: 10 },
  ENVIOGRATIS: { tipo: "envio_gratis", valor: 0 }
};

const DEMO_BACKUP_KEY = "maikaDemoBackupV1";
const DEMO_ACTIVO_KEY = "maikaModoDemoActivo";
const DEMO_CATALOGO_KEY = "maikaDemoCatalogoV1";
const COOKIE_CONSENT_KEY = "maikaCookieConsentV1";
const COOKIE_CONSENT_VERSION = 1;
const QUICK_CHECKOUT_KEY = "maikaQuickCheckoutV1";

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
  const [pagina, setPagina] = useState<"inicio" | "tienda" | "carrito" | "seguimiento" | "cuenta" | "admin">("inicio");
  const [cart, setCart] = useState<ItemCarrito[]>([]);
  const [notificacion, setNotificacion] = useState<{ mensaje: string; tipo: "normal" | "exito" | "error" } | null>(null);
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
  const [modoDemoActivo, setModoDemoActivo] = useState(false);
  const [mostrarConfigCookies, setMostrarConfigCookies] = useState(false);
  const [consentimientoCookies, setConsentimientoCookies] = useState<ConsentimientoCookies>({
    necesarias: true,
    preferencias: false,
    analiticas: false,
    marketing: false,
    fechaActualizacion: "",
    version: COOKIE_CONSENT_VERSION
  });
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

    const velasGuardadas = JSON.parse(localStorage.getItem("velas") || "[]") as Producto[];
    const inciensosGuardados = JSON.parse(localStorage.getItem("inciensos") || "[]") as Producto[];
    const figurasGuardadas = JSON.parse(localStorage.getItem("figuras") || "[]") as Producto[];
    const catalogoProductos = [...velasGuardadas, ...inciensosGuardados, ...figurasGuardadas];
    const alertasStockBajo = catalogoProductos
      .filter((producto) => Number(producto.stock) <= 2)
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
  }, [pedidos, cart]);

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

  // ========== COMPONENTE MODAL DE USUARIOS ==========
  const ModalUsuarios = ({ abierto, usuarios, onClose, mostrarNotificacion, onEditUsuario }: ModalUsuariosProps) => {
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState<"todos" | "verificados" | "pendientes">("todos");
    const [usuariosState, setUsuariosState] = useState<Usuario[]>(usuarios);
    // Actualizar cuando cambien los usuarios props
    useEffect(() => {
      setUsuariosState(usuarios);
    }, [usuarios]);

    if (!abierto) return null;

    const usuariosFiltrados = usuariosState
      .filter((u: Usuario) =>
        u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
        (u.telefono || "").includes(busqueda)
      )
      .filter((u: Usuario) => {
        if (filtroEstado === "verificados") return !!u.verificado;
        if (filtroEstado === "pendientes") return !u.verificado;
        return true;
      });

    const handleEliminar = (usuario: Usuario) => {
      if (window.confirm(`¿Seguro que quieres eliminar a ${usuario.nombre}?`)) {
        const nuevos = usuariosState.filter((u: Usuario) => u.id !== usuario.id);
        localStorage.setItem("usuarios", JSON.stringify(nuevos));
        setUsuariosState(nuevos);
        mostrarNotificacion(`✅ Usuario ${usuario.nombre} eliminado`, "exito");
      }
    };

    const handleVerificar = (usuario: Usuario) => {
      const nuevos = usuariosState.map((u: Usuario) =>
        u.id === usuario.id ? { ...u, verificado: !u.verificado } : u
      );
      localStorage.setItem("usuarios", JSON.stringify(nuevos));
      setUsuariosState(nuevos);
      mostrarNotificacion(`✅ Usuario ${usuario.verificado ? "desverificado" : "verificado"}`, "exito");
    };

    const exportarCSV = () => {
      const csv = [
        ["Nombre", "Email", "Teléfono", "Dirección", "Verificado", "Pedidos"],
        ...usuariosState.map((u: Usuario) => [
          u.nombre,
          u.email,
          u.telefono || "",
          u.direccion || "",
          u.verificado ? "Sí" : "No",
          u.pedidos?.length || 0
        ])
      ].map(row => row.join(",")).join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `usuarios_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
    };

    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        backdropFilter: "blur(5px)"
      }}>
        <div style={{
          background: "#2b2560",
          border: "3px solid gold",
          borderRadius: 34,
          padding: 40,
          width: "98%",
          maxWidth: 1500,
          maxHeight: "95vh",
          overflowY: "auto",
          boxShadow: "0 0 50px rgba(255,215,0,0.3)"
        }}>

          {/* HEADER */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 25,
            borderBottom: "2px solid gold",
            paddingBottom: 15
          }}>
            <div>
              <h2 style={{ color: "gold", margin: 0, fontSize: 36 }}>
                👥 GESTIÓN DE USUARIOS
              </h2>
              <p style={{ color: "white", margin: "8px 0 0", opacity: 0.9, fontSize: 18 }}>
                Total: {usuariosState.length} usuarios | Verificados: {usuariosState.filter((u: Usuario) => u.verificado).length} | Pendientes: {usuariosState.filter((u: Usuario) => !u.verificado).length}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "2px solid gold",
                color: "gold",
                width: 56,
                height: 56,
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "gold"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              ✕
            </button>
          </div>

          {/* FILTROS Y ACCIONES */}
          <div style={{
            display: "flex",
            gap: 15,
            marginBottom: 25,
            flexWrap: "wrap",
            alignItems: "center"
          }}>
            <div style={{ flex: 1, minWidth: 250 }}>
              <input
                type="text"
                placeholder="🔍 Buscar por nombre, email o teléfono..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  width: "100%",
                  padding: "16px 18px",
                  borderRadius: 14,
                  border: "2px solid gold",
                  background: "#1b1745",
                  color: "white",
                  fontSize: 19,
                  outline: "none"
                }}
              />
            </div>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as "todos" | "verificados" | "pendientes")}
              style={{
                padding: "16px 22px",
                borderRadius: 14,
                border: "2px solid gold",
                background: "#1b1745",
                color: "gold",
                cursor: "pointer",
                fontSize: 18,
                minWidth: 200
              }}
            >
              <option value="todos">📋 Todos</option>
              <option value="verificados">✅ Verificados</option>
              <option value="pendientes">⏳ Pendientes</option>
            </select>

            <button
              className="btn-azul-categoria"
              onClick={exportarCSV}
              style={{
                padding: "16px 24px",
                borderRadius: 14,
                border: "2px solid #4caf50",
                background: "transparent",
                color: "#4caf50",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                gap: 10
              }}
            >
              📥 Exportar CSV
            </button>

            <button
              className="btn-azul-categoria"
              onClick={() => {
                const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
                setUsuariosState(usuarios);
                mostrarNotificacion("🔄 Lista actualizada", "exito");
              }}
              style={{
                padding: "16px 24px",
                borderRadius: 14,
                border: "2px solid gold",
                background: "transparent",
                color: "gold",
                cursor: "pointer",
                fontSize: 18,
                fontWeight: "bold"
              }}
            >
              🔄 Actualizar
            </button>
          </div>

          {/* TABLA DE USUARIOS */}
          {usuariosFiltrados.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: 60,
              background: "#1b1745",
              borderRadius: 20,
              border: "2px dashed gold"
            }}>
              <span style={{ fontSize: 48 }}>👥</span>
              <p style={{ color: "white", fontSize: 18, marginTop: 10 }}>
                No hay usuarios que coincidan con la búsqueda
              </p>
            </div>
          ) : (
            <div style={{
              background: "#1b1745",
              borderRadius: 20,
              border: "2px solid gold",
              overflow: "hidden"
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{
                    background: "linear-gradient(135deg, #2b2560 0%, #3a2e8a 100%)",
                    borderBottom: "2px solid gold"
                  }}>
                    <th style={{ padding: "18px", textAlign: "left", color: "gold", fontSize: 18 }}>#</th>
                    <th style={{ padding: "18px", textAlign: "left", color: "gold", fontSize: 18 }}>Usuario</th>
                    <th style={{ padding: "18px", textAlign: "left", color: "gold", fontSize: 18 }}>Contacto</th>
                    <th style={{ padding: "18px", textAlign: "left", color: "gold", fontSize: 18 }}>Dirección</th>
                    <th style={{ padding: "18px", textAlign: "left", color: "gold", fontSize: 18 }}>Estado</th>
                    <th style={{ padding: "18px", textAlign: "left", color: "gold", fontSize: 18 }}>Pedidos</th>
                    <th style={{ padding: "18px", textAlign: "left", color: "gold", fontSize: 18 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((usuario: Usuario, index: number) => (
                    <tr
                      key={usuario.id || index}
                      style={{
                        borderBottom: "1px solid rgba(255,215,0,0.2)",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,215,0,0.1)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "18px", color: "gold", fontSize: 18 }}>{index + 1}</td>

                      <td style={{ padding: "18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 52,
                            height: 52,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, gold, #ffd700)",
                            color: "#1b1745",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            fontSize: 22
                          }}>
                            {usuario.nombre?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>{usuario.nombre}</div>
                            <div style={{ color: "gold", fontSize: 13 }}>ID: {usuario.id}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "18px" }}>
                        <div style={{ color: "white", fontSize: 17 }}>
                          <div>📧 {usuario.email}</div>
                          <div style={{ fontSize: 16, opacity: 0.9, marginTop: 4 }}>
                            📞 {usuario.telefono || "No especificado"}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "18px" }}>
                        <div style={{ color: "white", fontSize: 16 }}>
                          {usuario.direccion || "—"}
                        </div>
                      </td>

                      <td style={{ padding: "18px" }}>
                        <span style={{
                          background: usuario.verificado ? "rgba(46,204,113,0.2)" : "rgba(255,68,68,0.2)",
                          color: usuario.verificado ? "#2ecc71" : "#ff4444",
                          padding: "8px 14px",
                          borderRadius: 20,
                          fontSize: 15,
                          fontWeight: "bold",
                          display: "inline-block"
                        }}>
                          {usuario.verificado ? "✅ Verificado" : "⏳ Pendiente"}
                        </span>
                      </td>

                      <td style={{ padding: "18px" }}>
                        <span style={{
                          background: "rgba(255,215,0,0.1)",
                          padding: "8px 14px",
                          borderRadius: 20,
                          color: "gold",
                          fontWeight: "bold",
                          fontSize: 15
                        }}>
                          {usuario.pedidos?.length || 0} pedidos
                        </span>
                      </td>

                      <td style={{ padding: "18px" }}>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerificar(usuario);
                            }}
                            style={{
                              background: "transparent",
                              border: `1px solid ${usuario.verificado ? "#ff4444" : "#2ecc71"}`,
                              color: usuario.verificado ? "#ff4444" : "#2ecc71",
                              padding: "8px 12px",
                              borderRadius: 10,
                              cursor: "pointer",
                              fontSize: 14,
                              fontWeight: "bold"
                            }}
                            title={usuario.verificado ? "Desverificar" : "Verificar"}
                          >
                            {usuario.verificado ? "❌" : "✅"}
                          </button>

              <button
  onClick={(e) => {
    e.stopPropagation();
    onEditUsuario?.(usuario);
  }}
  style={{
    background: "transparent",
    border: "1px solid gold",
    color: "gold",
    padding: "8px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 14
  }}
  title="Editar"
>
  ✏️
</button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEliminar(usuario);
                            }}
                            style={{
                              background: "transparent",
                              border: "1px solid #ff4444",
                              color: "#ff4444",
                              padding: "8px 12px",
                              borderRadius: 10,
                              cursor: "pointer",
                              fontSize: 14
                            }}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PIE CON ESTADÍSTICAS */}
          <div style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "white",
            background: "#1b1745",
            padding: "18px 22px",
            borderRadius: 15,
            border: "1px solid gold",
            fontSize: 18
          }}>
            <div>📊 Mostrando {usuariosFiltrados.length} de {usuariosState.length} usuarios</div>
            <div style={{ display: "flex", gap: 20 }}>
              <span>✅ {usuariosState.filter((u: Usuario) => u.verificado).length} verificados</span>
              <span>⏳ {usuariosState.filter((u: Usuario) => !u.verificado).length} pendientes</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ========== PRODUCTOS ==========
  const [velas, setVelas] = useState<Producto[]>([
    { id: 1, nombre: "Vela Blanca", precio: 12.5, stock: 5, imagen: "/vela-blanca.jpg", categoria: "velas", descripcion: "Purificación y paz" },
    { id: 2, nombre: "Vela Roja", precio: 14.9, stock: 5, imagen: "/vela-roja.jpg", categoria: "velas", descripcion: "Pasión y energía" },
    { id: 3, nombre: "Vela Verde", precio: 13.5, stock: 5, imagen: "/vela-verde.jpg", categoria: "velas", descripcion: "Esperanza y salud" },
    { id: 4, nombre: "Vela Azul", precio: 15.0, stock: 5, imagen: "/vela-azul.jpg", categoria: "velas", descripcion: "Tranquilidad y armonía" },
    { id: 5, nombre: "Vela Negra", precio: 16.5, stock: 5, imagen: "/vela-negra.jpg", categoria: "velas", descripcion: "Protección" },
    { id: 6, nombre: "Vela Rosa", precio: 13.9, stock: 5, imagen: "/vela-rosa.jpg", categoria: "velas", descripcion: "Amor y amistad" },
    { id: 7, nombre: "Vela Dorada", precio: 18.0, stock: 5, imagen: "/vela-dorada.jpg", categoria: "velas", descripcion: "Éxito y prosperidad" },
    { id: 8, nombre: "Vela Plateada", precio: 17.5, stock: 5, imagen: "/vela-plateada.jpg", categoria: "velas", descripcion: "Intuición" },
    { id: 9, nombre: "Vela Lavanda", precio: 12.9, stock: 5, imagen: "/vela-lavanda.jpg", categoria: "velas", descripcion: "Relajación" },
    { id: 10, nombre: "Vela Canela", precio: 13.2, stock: 5, imagen: "/vela-canela.jpg", categoria: "velas", descripcion: "Abundancia" },
  ]);

  const [inciensos, setInciensos] = useState<Producto[]>([
    { id: 101, nombre: "Incienso Sándalo", precio: 6.5, stock: 5, imagen: "/incienso-sandalo.jpg", categoria: "inciensos", descripcion: "Meditación" },
    { id: 102, nombre: "Incienso Lavanda", precio: 5.9, stock: 5, imagen: "/incienso-lavanda.jpg", categoria: "inciensos", descripcion: "Calma" },
    { id: 103, nombre: "Incienso Ruda", precio: 7.2, stock: 5, imagen: "/incienso-ruda.jpg", categoria: "inciensos", descripcion: "Protección" },
    { id: 104, nombre: "Incienso Jazmín", precio: 6.8, stock: 5, imagen: "/incienso-jazmin.jpg", categoria: "inciensos", descripcion: "Amor" },
    { id: 105, nombre: "Incienso Palo Santo", precio: 8.5, stock: 5, imagen: "/incienso-palosanto.jpg", categoria: "inciensos", descripcion: "Limpieza" },
    { id: 106, nombre: "Incienso Mirra", precio: 7.9, stock: 5, imagen: "/incienso-mirra.jpg", categoria: "inciensos", descripcion: "Espiritualidad" },
    { id: 107, nombre: "Incienso Canela", precio: 6.4, stock: 5, imagen: "/incienso-canela.jpg", categoria: "inciensos", descripcion: "Éxito" },
    { id: 108, nombre: "Incienso Rosa", precio: 6.1, stock: 5, imagen: "/incienso-rosa.jpg", categoria: "inciensos", descripcion: "Armonía" },
  ]);

  const [figuras, setFiguras] = useState<Producto[]>([
    { id: 201, nombre: "Buda Dorado", precio: 35, stock: 3, imagen: "/buda-dorado.jpg", categoria: "figuras", descripcion: "Iluminación" },
    { id: 202, nombre: "Buda Meditación", precio: 42, stock: 3, imagen: "/buda-meditacion.jpg", categoria: "figuras", descripcion: "Paz interior" },
    { id: 203, nombre: "Figura Protección", precio: 28, stock: 3, imagen: "/figura-proteccion.jpg", categoria: "figuras", descripcion: "Escudo energético" },
    { id: 204, nombre: "Buda Prosperidad", precio: 39, stock: 3, imagen: "/buda-prosperidad.jpg", categoria: "figuras", descripcion: "Abundancia" },
    { id: 205, nombre: "Buda Blanco", precio: 33, stock: 3, imagen: "/buda-blanco.jpg", categoria: "figuras", descripcion: "Pureza" },
    { id: 206, nombre: "Figura Ángel", precio: 24, stock: 3, imagen: "/figura-angel.jpg", categoria: "figuras", descripcion: "Protección divina" },
    { id: 207, nombre: "Ganesh", precio: 48, stock: 3, imagen: "/ganesh.jpg", categoria: "figuras", descripcion: "Sabiduría" },
  ]);

  const precioCatalogoPorId = useMemo(() => {
    const catalogo = [...velas, ...inciensos, ...figuras];
    return new Map<number, number>(
      catalogo.map((producto) => [producto.id, precioSeguro(producto.precio)])
    );
  }, [velas, inciensos, figuras]);

  const precioCatalogoPorNombre = useMemo(() => {
    const catalogo = [...velas, ...inciensos, ...figuras];
    return new Map<string, number>(
      catalogo.map((producto) => [producto.nombre.trim().toLowerCase(), precioSeguro(producto.precio)])
    );
  }, [velas, inciensos, figuras]);

  const precioItemCarrito = (item: Pick<ItemCarrito, "id" | "precio" | "nombre">): number => {
    const precioDirecto = precioSeguro(item.precio);
    if (precioDirecto > 0) return precioDirecto;

    const idNormalizado = idSeguro(item.id);
    if (idNormalizado !== null) {
      const precioPorId = precioCatalogoPorId.get(idNormalizado);
      if (typeof precioPorId === "number" && precioPorId > 0) return precioPorId;
    }

    const nombreNormalizado = String(item.nombre || "").trim().toLowerCase();
    const precioPorNombre = precioCatalogoPorNombre.get(nombreNormalizado);
    if (typeof precioPorNombre === "number" && precioPorNombre > 0) return precioPorNombre;

    return 0;
  };

  const normalizarItemCarrito = (item: ItemCarrito): ItemCarrito => {
    const idNormalizado = idSeguro(item.id) ?? item.id;
    const precioNormalizado = precioItemCarrito({ id: idNormalizado, precio: item.precio, nombre: item.nombre });
    const precioFinal =
      precioNormalizado > 0
        ? precioNormalizado
        : precioCatalogoPorNombre.get(String(item.nombre || "").trim().toLowerCase()) ?? 0;

    return {
      ...item,
      id: idNormalizado as number,
      precio: precioFinal,
      cantidad: Number.isFinite(Number(item.cantidad)) ? Number(item.cantidad) : 0
    };
  };

  // Cargar datos guardados
  useEffect(() => {
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
    if (!consentimientoCargado) {
      setMostrarAvisoCookies(true);
    }

    const demoActivo = localStorage.getItem(DEMO_ACTIVO_KEY) === "true";
    setModoDemoActivo(demoActivo);

    const catalogoDemoGuardado = localStorage.getItem(DEMO_CATALOGO_KEY);
    if (demoActivo && catalogoDemoGuardado) {
      try {
        const catalogoDemo = JSON.parse(catalogoDemoGuardado) as {
          velas: Producto[];
          inciensos: Producto[];
          figuras: Producto[];
        };

        if (Array.isArray(catalogoDemo.velas)) setVelas(catalogoDemo.velas);
        if (Array.isArray(catalogoDemo.inciensos)) setInciensos(catalogoDemo.inciensos);
        if (Array.isArray(catalogoDemo.figuras)) setFiguras(catalogoDemo.figuras);
      } catch {
        localStorage.removeItem(DEMO_CATALOGO_KEY);
      }
    }
  }, []);

  useEffect(() => {
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

  const mostrarNotificacion = (mensaje: string, tipo: "normal" | "exito" | "error" = "normal") => {
    setNotificacion({ mensaje, tipo });
  };

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

  const activarModoDemo = () => {
    if (modoDemoActivo) {
      mostrarNotificacion("El modo demo ya está activo", "normal");
      return;
    }

    const backup: DemoBackup = {
      cart,
      pedidos,
      listaUsuarios,
      usuario,
      datosCliente,
      visitas,
      velas,
      inciensos,
      figuras
    };

    localStorage.setItem(DEMO_BACKUP_KEY, JSON.stringify(backup));

    const velasDemo = velas.map((producto) =>
      producto.id === 1
        ? { ...producto, stock: 3 }
        : producto.id === 2
          ? { ...producto, stock: 1 }
          : producto
    );

    const inciensosDemo = inciensos.map((producto) =>
      producto.id === 101 ? { ...producto, stock: 2 } : producto
    );

    const figurasDemo = figuras.map((producto) =>
      producto.id === 201 ? { ...producto, stock: 3 } : producto
    );

    const crearItem = (producto: Producto, cantidad: number): ItemCarrito => ({
      ...producto,
      cantidad
    });

    const usuarioDemo: Usuario = {
      id: "demo-user",
      nombre: "Cliente Demo",
      email: "demo@maika.es",
      telefono: "600000000",
      direccion: "Calle Demo 1",
      cp: "28001",
      poblacion: "Madrid",
      provincia: "Madrid",
      pais: "España",
      verificado: true,
      pedidos: []
    };

    const usuariosDemo: Usuario[] = [
      usuarioDemo,
      {
        id: "demo-2",
        nombre: "Cliente Prueba",
        email: "prueba@maika.es",
        telefono: "611111111",
        direccion: "Av. Prueba 2",
        verificado: true,
        pedidos: []
      }
    ];

    const clienteDemo: Cliente = {
      nombreApellidos: "Cliente Demo",
      email: "demo@maika.es",
      telefono: "600000000",
      direccion: "Calle Demo 1",
      cp: "28001",
      poblacion: "Madrid",
      provincia: "Madrid",
      pais: "España",
      notas: "Pedido de demostración"
    };

    const ahora = new Date();
    const fecha = ahora.toLocaleString();

    const pedidoPendiente: Pedido = {
      numero: `MKDEMO-${ahora.getDate()}01`,
      fecha,
      cliente: clienteDemo,
      items: [crearItem(velasDemo[0], 1)],
      subtotal: precioSeguro(velasDemo[0].precio),
      envio: 4.9,
      total: precioSeguro(velasDemo[0].precio) + 4.9,
      estado: "pendiente",
      cupon: "MAIKA10",
      descuento: 1
    };

    const pedidoEnviado: Pedido = {
      numero: `MKDEMO-${ahora.getDate()}02`,
      fecha,
      cliente: clienteDemo,
      items: [crearItem(inciensosDemo[0], 2)],
      subtotal: precioSeguro(inciensosDemo[0].precio) * 2,
      envio: 4.9,
      total: precioSeguro(inciensosDemo[0].precio) * 2 + 4.9,
      estado: "enviado"
    };

    const pedidoEntregado: Pedido = {
      numero: `MKDEMO-${ahora.getDate()}03`,
      fecha,
      cliente: clienteDemo,
      items: [crearItem(figurasDemo[0], 1)],
      subtotal: precioSeguro(figurasDemo[0].precio),
      envio: 0,
      total: precioSeguro(figurasDemo[0].precio),
      estado: "entregado",
      cupon: "ENVIOGRATIS",
      descuento: 4.9
    };

    const pedidosDemo = [pedidoPendiente, pedidoEnviado, pedidoEntregado];
    const carritoDemo = [crearItem(velasDemo[1], 1), crearItem(inciensosDemo[0], 1)];

    setVelas(velasDemo);
    setInciensos(inciensosDemo);
    setFiguras(figurasDemo);
    setPedidos(pedidosDemo);
    setCart(carritoDemo);
    setListaUsuarios(usuariosDemo);
    setUsuario(usuarioDemo);
    setDatosCliente(clienteDemo);
    setVisitas(999);
    setPagina("inicio");

    localStorage.setItem("pedidosMaika", JSON.stringify(pedidosDemo));
    localStorage.setItem("carritoMaika", JSON.stringify(carritoDemo));
    localStorage.setItem("usuarios", JSON.stringify(usuariosDemo));
    localStorage.setItem("usuarioActual", JSON.stringify(usuarioDemo));
    localStorage.setItem("clienteMaika", JSON.stringify(clienteDemo));
    localStorage.setItem("visitasMaika", "999");
    localStorage.setItem(
      DEMO_CATALOGO_KEY,
      JSON.stringify({ velas: velasDemo, inciensos: inciensosDemo, figuras: figurasDemo })
    );
    localStorage.setItem(DEMO_ACTIVO_KEY, "true");

    setModoDemoActivo(true);
    mostrarNotificacion("🧪 Modo demo activado", "exito");
  };

  const desactivarModoDemo = () => {
    const backupRaw = localStorage.getItem(DEMO_BACKUP_KEY);
    if (!backupRaw) {
      localStorage.removeItem(DEMO_ACTIVO_KEY);
      localStorage.removeItem(DEMO_CATALOGO_KEY);
      setModoDemoActivo(false);
      mostrarNotificacion("No había copia para restaurar", "error");
      return;
    }

    try {
      const backup = JSON.parse(backupRaw) as DemoBackup;

      setCart(backup.cart || []);
      setPedidos(backup.pedidos || []);
      setListaUsuarios(backup.listaUsuarios || []);
      setUsuario(backup.usuario || null);
      setDatosCliente(backup.datosCliente || {
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
      setVisitas(typeof backup.visitas === "number" ? backup.visitas : 0);
      setVelas(backup.velas || []);
      setInciensos(backup.inciensos || []);
      setFiguras(backup.figuras || []);

      localStorage.setItem("carritoMaika", JSON.stringify(backup.cart || []));
      localStorage.setItem("pedidosMaika", JSON.stringify(backup.pedidos || []));
      localStorage.setItem("usuarios", JSON.stringify(backup.listaUsuarios || []));
      localStorage.setItem("clienteMaika", JSON.stringify(backup.datosCliente || {}));
      localStorage.setItem("visitasMaika", String(typeof backup.visitas === "number" ? backup.visitas : 0));

      if (backup.usuario) {
        localStorage.setItem("usuarioActual", JSON.stringify(backup.usuario));
      } else {
        localStorage.removeItem("usuarioActual");
      }

      localStorage.removeItem(DEMO_BACKUP_KEY);
      localStorage.removeItem(DEMO_ACTIVO_KEY);
      localStorage.removeItem(DEMO_CATALOGO_KEY);

      setModoDemoActivo(false);
      mostrarNotificacion("✅ Modo demo quitado y datos restaurados", "exito");
    } catch {
      mostrarNotificacion("❌ No se pudo restaurar el modo demo", "error");
    }
  };

  const agregarAlCarrito = (producto: Producto) => {
    if (producto.stock <= 0) {
      mostrarNotificacion(`❌ ${producto.nombre} agotado`, "error");
      return;
    }

    const precioNormalizado = (() => {
      const directo = precioSeguro(producto.precio);
      if (directo > 0) return directo;
      return precioCatalogoPorId.get(producto.id) ?? 0;
    })();

    setCart((prev) => {
      const existe = prev.find((p) => idSeguro(p.id) === producto.id);
      if (existe) {
        return prev.map((p) =>
          idSeguro(p.id) === producto.id
            ? {
                ...p,
                precio: precioNormalizado > 0 ? precioNormalizado : precioItemCarrito(p),
                cantidad: p.cantidad + 1
              }
            : p
        );
      }
      return [...prev, normalizarItemCarrito({ ...producto, precio: precioNormalizado, cantidad: 1 })];
    });

    if (producto.id < 100) {
      setVelas(prev => prev.map(v =>
        v.id === producto.id ? { ...v, stock: v.stock - 1 } : v
      ));
    } else if (producto.id < 200) {
      setInciensos(prev => prev.map(i =>
        i.id === producto.id ? { ...i, stock: i.stock - 1 } : i
      ));
    } else {
      setFiguras(prev => prev.map(f =>
        f.id === producto.id ? { ...f, stock: f.stock - 1 } : f
      ));
    }

    mostrarNotificacion(`✅ ${producto.nombre} añadido`, "exito");
  };

  const cambiarCantidad = (id: number, incremento: number) => {
    setCart(prev => {
      const item = prev.find(p => idSeguro(p.id) === id);
      if (!item) return prev;

      if (incremento < 0) {
        if (id < 100) {
          setVelas(v => v.map(p => p.id === id ? { ...p, stock: p.stock + 1 } : p));
        } else if (id < 200) {
          setInciensos(v => v.map(p => p.id === id ? { ...p, stock: p.stock + 1 } : p));
        } else {
          setFiguras(v => v.map(p => p.id === id ? { ...p, stock: p.stock + 1 } : p));
        }
      }

      return prev
        .map(p =>
          idSeguro(p.id) === id
            ? { ...p, precio: precioItemCarrito(p), cantidad: Math.max(0, p.cantidad + incremento) }
            : p
        )
        .filter(p => p.cantidad > 0);
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
        return "Caducidad no válida (MM/AA)";
      }
      if (!/^\d{3,4}$/.test(datosPagoActual.tarjetaCVV.trim())) {
        return "CVV no válido";
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

  return (
    <div
      className="app-shell"
      style={{
        backgroundImage: "linear-gradient(rgba(10, 7, 25, 0.62), rgba(10, 7, 25, 0.62)), url('/fondo%20estrellado.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        padding: 20,
        color: "gold",
        position: "relative"
      }}
    >
      <style>{pulseAnimationStyle}</style>

      {/* HEADER */}
      <div className="app-topbar" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 30,
        borderBottom: "2px solid gold",
        paddingBottom: 15
      }}>
        <div className="app-nav-buttons" style={{ display: "flex", gap: 20 }}>
          <button
            onClick={() => setPagina("inicio")}
            style={{
              background: pagina === "inicio" ? "rgba(255, 215, 0, 0.18)" : "transparent",
              color: "gold",
              border: "2px solid gold",
              padding: "12px 30px",
              borderRadius: 25,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 22
            }}
          >
            🏠 Inicio
          </button>
          <button
            onClick={() => setPagina("seguimiento")}
            style={{
              background: pagina === "seguimiento" ? "gold" : "transparent",
              color: pagina === "seguimiento" ? "#1b1745" : "gold",
              border: "2px solid gold",
              padding: "12px 30px",
              borderRadius: 25,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 18
            }}
          >
            🔍 Seguimiento
          </button>
          <button
            onClick={() => setPagina("cuenta")}
            style={{
              background: pagina === "cuenta" ? "gold" : "transparent",
              color: pagina === "cuenta" ? "#1b1745" : "gold",
              border: "2px solid gold",
              padding: "12px 30px",
              borderRadius: 25,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 18
            }}
          >
            👤 Mi Cuenta
          </button>
          {!esAppNativa && (
            <button
              onClick={() => setPagina("admin")}
              style={{
                background: pagina === "admin" ? "gold" : "transparent",
                color: pagina === "admin" ? "#1b1745" : "gold",
                border: "2px solid gold",
                padding: "12px 30px",
                borderRadius: 25,
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: 18
              }}
            >
              ⚙️ Admin
            </button>
          )}
        </div>

        <button
          onClick={() => setPagina("carrito")}
          style={{
            background: "transparent",
            color: "gold",
            border: "2px solid gold",
            padding: "12px 30px",
            borderRadius: 25,
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            gap: 10,
            whiteSpace: "nowrap"
          }}
        >
          🛒 <span>{totalItemsCarrito}</span>
          <span>artículos</span>
        </button>
      </div>

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
        <div style={{ textAlign: "center" }}>
          <h1 className="hero-title" style={{ fontSize: 54, marginBottom: 40, color: "gold", opacity: 0.95, textTransform: "uppercase", letterSpacing: "2px", whiteSpace: "nowrap" }}>
            MAIKA&nbsp;&nbsp;LA RUTA DEL ALMA
          </h1>

          {/* BOTÓN TIENDA CON IMAGEN */}
          <div style={{ textAlign: "center", marginBottom: 68 }}>
            <div className="imagen-inicio-hover" style={{
              width: "50%",
              maxWidth: "300px",
              margin: "0 auto",
              borderRadius: 15,
              overflow: "hidden",
              border: "1px solid rgba(212,175,55,0.4)",
              boxShadow: "none"
            }}>
              <img
                src="/tienda.jpg"
                alt="Tienda"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block"
                }}
                onError={(e) => {
                  const fallbackActual = e.currentTarget.getAttribute("data-fallback");
                  if (!fallbackActual) {
                    e.currentTarget.setAttribute("data-fallback", "1");
                    e.currentTarget.src = "tienda.jpg";
                    return;
                  }
                  if (fallbackActual === "1") {
                    e.currentTarget.setAttribute("data-fallback", "2");
                    e.currentTarget.src = "/copia.png";
                    return;
                  }
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>

            <button
              className="boton-tienda-hover"
              onClick={() => setPagina("tienda")}
              style={{
                marginTop: "30px",
                background: "transparent",
                color: "#f7d046",
                border: "2px solid gold",
                padding: "16px 72px",
                minWidth: 290,
                borderRadius: 30,
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: 18,
                letterSpacing: "1.5px",
                boxShadow: "0 0 20px gold"
              }}
            >
              🛍️ TIENDA
            </button>
          </div>

          {/* Servicios */}
          <h2 style={{ fontSize: 28, marginBottom: 24 }}>🌟 SERVICIOS</h2>
          <div style={{ display: "flex", justifyContent: "center", gap: 15, flexWrap: "wrap", marginBottom: 64 }}>
            {/* Tarot */}
            <div className="card" style={{ width: 220, padding: "14px", display: "flex", flexDirection: "column", minHeight: 305 }}>
              <h3 style={{ color: "gold", margin: "5px 0", fontSize: 16, textAlign: "center" }}>🔮 Tarot Evolutivo</h3>
              <img
                src="/tarot%20evolutivo.jpg"
                alt="Tarot Evolutivo"
                style={{ width: "100%", height: 115, objectFit: "cover", borderRadius: 10, border: "1px solid gold", marginBottom: 8, display: "block" }}
              />
              <p style={{ color: "white", margin: "2px 0", fontSize: 13, textAlign: "center" }}>Sesión 60 min</p>
              <p style={{ color: "gold", fontSize: 18, fontWeight: "bold", margin: "5px 0", textAlign: "center" }}>45€</p>
              <button className="btn-reservar-inicio" onClick={() => window.open("https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20reservar%20Tarot", "_blank")} style={{ border: "none", padding: "9px 12px", borderRadius: 20, cursor: "pointer", width: "100%", fontWeight: "bold", fontSize: 13, marginTop: "auto" }}>Reservar</button>
            </div>

            {/* Limpieza */}
            <div className="card" style={{ width: 220, padding: "14px", display: "flex", flexDirection: "column", minHeight: 305 }}>
              <h3 style={{ color: "gold", margin: "5px 0", fontSize: 16, textAlign: "center" }}>✨ Limpieza Energética</h3>
              <img
                src="/limpieza%20energetica.jpg"
                alt="Limpieza Energética"
                style={{ width: "100%", height: 115, objectFit: "cover", borderRadius: 10, border: "1px solid gold", marginBottom: 8, display: "block" }}
              />
              <p style={{ color: "white", margin: "2px 0", fontSize: 13, textAlign: "center" }}>Sesión 45 min</p>
              <p style={{ color: "gold", fontSize: 18, fontWeight: "bold", margin: "5px 0", textAlign: "center" }}>35€</p>
              <button className="btn-reservar-inicio" onClick={() => window.open("https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20reservar%20Limpieza", "_blank")} style={{ border: "none", padding: "9px 12px", borderRadius: 20, cursor: "pointer", width: "100%", fontWeight: "bold", fontSize: 13, marginTop: "auto" }}>Reservar</button>
            </div>

            {/* Ritual */}
            <div className="card" style={{ width: 220, padding: "14px", display: "flex", flexDirection: "column", minHeight: 305 }}>
              <h3 style={{ color: "gold", margin: "5px 0", fontSize: 16, textAlign: "center" }}>🕯️ Ritual Personalizado</h3>
              <img
                src="/ritual%20personalizado.jpg"
                alt="Ritual Personalizado"
                style={{ width: "100%", height: 115, objectFit: "cover", borderRadius: 10, border: "1px solid gold", marginBottom: 8, display: "block" }}
              />
              <p style={{ color: "white", margin: "2px 0", fontSize: 13, textAlign: "center" }}>Sesión 60 min</p>
              <p style={{ color: "gold", fontSize: 18, fontWeight: "bold", margin: "5px 0", textAlign: "center" }}>50€</p>
              <button className="btn-reservar-inicio" onClick={() => window.open("https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20consultar%20Ritual", "_blank")} style={{ border: "none", padding: "9px 12px", borderRadius: 20, cursor: "pointer", width: "100%", fontWeight: "bold", fontSize: 13, marginTop: "auto" }}>Reservar</button>
            </div>
          </div>

          {/* Testimonios */}
          <h2 style={{ fontSize: 32, marginBottom: 20 }}>💬 TESTIMONIOS</h2>
          <div style={{ maxWidth: 600, margin: "0 auto 40px" }}>
            <p className="card testimonio-card" style={{ marginBottom: 10 }}>
              "Sentí claridad y paz después de la primera consulta. ¡Recomendadísima!"
            </p>
            <p className="card testimonio-card">
              "Me ayudó a entender lo que estaba viviendo. Gracias Maika"
            </p>
          </div>

          {/* TU CARRITO */}
          {cart.length > 0 && (
            <div style={{ marginTop: 40 }}>
              <h2>🛒 TU CARRITO</h2>
              <p>{cart.length} artículos · {total.toFixed(2)} €</p>
              <p>Envío: {envioPreview.toFixed(2)} €</p>
              <p style={{ fontSize: 20 }}>Total: {totalPreview.toFixed(2)} €</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={vaciarCarrito} style={{ background: "transparent", color: "gold", border: "2px solid gold", padding: "12px 30px", borderRadius: 30, cursor: "pointer", fontWeight: "bold", fontSize: 16 }}>🗑️ Cancelar</button>
                <button onClick={() => { precargarDatosClienteDesdeUsuario(usuario); setNumeroPedidoPreview(generarNumeroPedido()); setFormPedidoAbierto(true); }} style={{ background: "gold", color: "#1b1745", border: "none", padding: "12px 30px", borderRadius: 30, cursor: "pointer", fontWeight: "bold", fontSize: 16 }}>🛍️ FINALIZAR COMPRA</button>
                {perfilCompraRapida && (
                  <button
                    onClick={comprarEnUnClick}
                    style={{
                      background: "#25D366",
                      color: "white",
                      border: "none",
                      padding: "12px 30px",
                      borderRadius: 30,
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: 16
                    }}
                  >
                    ⚡ COMPRAR EN 1 CLIC
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MI CUENTA */}
      {pagina === "cuenta" && (
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", color: "gold", marginBottom: 30 }}>
            👤 Mi Cuenta
          </h2>

          {!usuario ? (
            <>
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                <button
                  onClick={() => {
                    setModoRegistro("login");
                    setFormAuth({ ...formAuth, pasoVerificacion: 1 });
                    setReenvioDisponibleEn(0);
                  }}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: modoRegistro === "login" ? "gold" : "transparent",
                    color: modoRegistro === "login" ? "#1b1745" : "gold",
                    border: "2px solid gold",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => {
                    setModoRegistro("register");
                    setFormAuth({ ...formAuth, pasoVerificacion: 1 });
                    setReenvioDisponibleEn(0);
                  }}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: modoRegistro === "register" ? "gold" : "transparent",
                    color: modoRegistro === "register" ? "#1b1745" : "gold",
                    border: "2px solid gold",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  Registrarse
                </button>
              </div>

              <div style={{
                background: "#2b2560",
                padding: 30,
                borderRadius: 20,
                border: "2px solid gold"
              }}>
                {modoRegistro === "register" && formAuth.pasoVerificacion === 1 && (
                  <>
                    <h3 style={{ color: "gold", textAlign: "center", marginBottom: 20 }}>Paso 1: Datos personales</h3>

                    <input
                      type="text"
                      placeholder="Nombre completo *"
                      value={formAuth.nombre}
                      onChange={(e) => setFormAuth({ ...formAuth, nombre: e.target.value })}
                      style={inputStyle}
                    />

                    <input
                      type="tel"
                      placeholder="Teléfono *"
                      value={formAuth.telefono}
                      onChange={(e) =>
                        setFormAuth({
                          ...formAuth,
                          telefono: e.target.value.replace(/\D/g, "").slice(0, 9)
                        })
                      }
                      inputMode="numeric"
                      maxLength={9}
                      style={inputStyle}
                    />

                    <input
                      type="email"
                      placeholder="Email *"
                      value={formAuth.email}
                      onChange={(e) => setFormAuth({ ...formAuth, email: e.target.value })}
                      style={inputStyle}
                    />

                    <input
                      type="email"
                      placeholder="Confirmar Email *"
                      value={formAuth.confirmEmail}
                      onChange={(e) => setFormAuth({ ...formAuth, confirmEmail: e.target.value })}
                      style={inputStyle}
                    />

                    <input
                      type="password"
                      placeholder="Contraseña *"
                      value={formAuth.password}
                      onChange={(e) => setFormAuth({ ...formAuth, password: e.target.value })}
                      style={inputStyle}
                    />

                    <input
                      type="password"
                      placeholder="Confirmar Contraseña *"
                      value={formAuth.confirmPassword}
                      onChange={(e) => setFormAuth({ ...formAuth, confirmPassword: e.target.value })}
                      style={inputStyle}
                    />

                    <input
                      type="text"
                      placeholder="Calle *"
                      value={formAuth.calle}
                      onChange={(e) => setFormAuth({ ...formAuth, calle: e.target.value })}
                      style={inputStyle}
                    />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      <input
                        type="text"
                        placeholder="Número *"
                        value={formAuth.numero}
                        onChange={(e) => setFormAuth({ ...formAuth, numero: e.target.value })}
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        placeholder="Bloque (opcional)"
                        value={formAuth.bloque}
                        onChange={(e) => setFormAuth({ ...formAuth, bloque: e.target.value })}
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        placeholder="Escalera (opcional)"
                        value={formAuth.escalera}
                        onChange={(e) => setFormAuth({ ...formAuth, escalera: e.target.value })}
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <input
                        type="text"
                        placeholder="Piso (opcional)"
                        value={formAuth.piso}
                        onChange={(e) => setFormAuth({ ...formAuth, piso: e.target.value })}
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        placeholder="Puerta (opcional)"
                        value={formAuth.puerta}
                        onChange={(e) => setFormAuth({ ...formAuth, puerta: e.target.value })}
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <input
                        type="text"
                        placeholder="C.P. *"
                        value={formAuth.cp}
                        onChange={(e) =>
                          setFormAuth({
                            ...formAuth,
                            cp: e.target.value.replace(/\D/g, "").slice(0, 5)
                          })
                        }
                        inputMode="numeric"
                        maxLength={5}
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        placeholder="Provincia *"
                        value={formAuth.provincia}
                        onChange={(e) => setFormAuth({ ...formAuth, provincia: e.target.value })}
                        readOnly={provinciaPaisBloqueadosRegistro}
                        title={provinciaPaisBloqueadosRegistro ? "Autocompletado por C.P." : ""}
                        style={{ ...inputStyle, opacity: provinciaPaisBloqueadosRegistro ? 0.85 : 1 }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <input
                        type="text"
                        placeholder="Población *"
                        value={formAuth.poblacion}
                        onChange={(e) => setFormAuth({ ...formAuth, poblacion: e.target.value })}
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        placeholder="País *"
                        value={formAuth.pais}
                        onChange={(e) => setFormAuth({ ...formAuth, pais: e.target.value })}
                        readOnly={provinciaPaisBloqueadosRegistro}
                        title={provinciaPaisBloqueadosRegistro ? "Autocompletado por C.P." : ""}
                        style={{ ...inputStyle, opacity: provinciaPaisBloqueadosRegistro ? 0.85 : 1 }}
                      />
                    </div>

                    <p style={{ color: "white", fontSize: 13, marginTop: -2, marginBottom: 8, opacity: 0.85 }}>
                      Dirección de facturación obligatoria para completar el registro
                    </p>

                    <input
                      type="text"
                      placeholder="Dirección completa (autogenerada)"
                      value={`${formAuth.calle}${formAuth.numero ? `, Nº ${formAuth.numero}` : ""}${formAuth.bloque ? `, Bloque ${formAuth.bloque}` : ""}${formAuth.escalera ? `, Esc. ${formAuth.escalera}` : ""}${formAuth.piso ? `, Piso ${formAuth.piso}` : ""}${formAuth.puerta ? `, Puerta ${formAuth.puerta}` : ""}`}
                      readOnly
                      style={inputStyle}
                    />

                    <button
                      onClick={async () => {
                        console.log("=== INICIO DE REGISTRO ===");
                        
                        if (formAuth.telefono && !/^\d{9}$/.test(formAuth.telefono)) {
                          mostrarNotificacion("❌ El teléfono debe tener 9 números", "error");
                          return;
                        }

                        if (!formAuth.nombre || !formAuth.telefono || !formAuth.email || !formAuth.password || !formAuth.confirmEmail || !formAuth.confirmPassword || !formAuth.calle || !formAuth.numero || !formAuth.cp || !formAuth.provincia || !formAuth.poblacion || !formAuth.pais) {
                          mostrarNotificacion("❌ Completa todos los campos obligatorios", "error");
                          return;
                        }

                        if (formAuth.password !== formAuth.confirmPassword) {
                          mostrarNotificacion("❌ Las contraseñas no coinciden", "error");
                          return;
                        }

                        if (formAuth.email !== formAuth.confirmEmail) {
                          mostrarNotificacion("❌ Los emails no coinciden", "error");
                          return;
                        }

                        const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
                        const existe = usuarios.find((u: Usuario) => u.email === formAuth.email);
                        if (existe) {
                          mostrarNotificacion("❌ Este email ya está registrado", "error");
                          return;
                        }

                        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
                        console.log("📧 Código generado:", codigo);
                        
                        mostrarNotificacion("📧 Enviando código...", "normal");

                        try {
                          const enviado = await enviarCodigoEmail(formAuth.email, formAuth.nombre, codigo);
                          
                          if (enviado) {
                            setFormAuth({ ...formAuth, codigoVerificacion: codigo, pasoVerificacion: 2 });
                            setReenvioDisponibleEn(60);
                            mostrarNotificacion(`✅ Código enviado a ${formAuth.email}`, "exito");
                          } else {
                            mostrarNotificacion("❌ Error al enviar el código. Revisa la consola (F12)", "error");
                          }
                        } catch (error) {
                          console.error("Error en registro:", error);
                          mostrarNotificacion("❌ Error al enviar el código", "error");
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: 12,
                        background: "gold",
                        color: "#1b1745",
                        border: "none",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: 16,
                        marginTop: 20
                      }}
                    >
                      Enviar código de verificación
                    </button>
                  </>
                )}

                {modoRegistro === "register" && formAuth.pasoVerificacion === 2 && (
                  <>
                    <h3 style={{ color: "gold", textAlign: "center", marginBottom: 20 }}>Paso 2: Verificar Email</h3>
                    <p style={{ color: "white", textAlign: "center", marginBottom: 20 }}>
                      Hemos enviado un código a {formAuth.email}
                    </p>
                    <p style={{ color: "white", textAlign: "center", fontSize: 13, marginTop: -8, marginBottom: 16, opacity: 0.85 }}>
                      El mensaje suele llegar en menos de 1 minuto. Revisa también spam/correo no deseado.
                    </p>

                    <input
                      type="text"
                      placeholder="Código de 6 dígitos"
                      value={formAuth.codigoIngresado || ""}
                      onChange={(e) => setFormAuth({ ...formAuth, codigoIngresado: e.target.value })}
                      style={inputStyle}
                    />

                    <button
                      onClick={async () => {
                        if (formAuth.codigoIngresado === formAuth.codigoVerificacion) {
                          const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
                          const direccionCompleta = `${formAuth.calle.trim()}, Nº ${formAuth.numero.trim()}${formAuth.bloque.trim() ? `, Bloque ${formAuth.bloque.trim()}` : ""}${formAuth.escalera.trim() ? `, Esc. ${formAuth.escalera.trim()}` : ""}${formAuth.piso.trim() ? `, Piso ${formAuth.piso.trim()}` : ""}${formAuth.puerta.trim() ? `, Puerta ${formAuth.puerta.trim()}` : ""}`;
                          const nuevoUsuario = {
                            id: Date.now(),
                            nombre: formAuth.nombre,
                            email: formAuth.email,
                            telefono: formAuth.telefono,
                            calle: formAuth.calle,
                            bloque: formAuth.bloque,
                            escalera: formAuth.escalera,
                            piso: formAuth.piso,
                            puerta: formAuth.puerta,
                            numero: formAuth.numero,
                            direccion: direccionCompleta,
                            cp: formAuth.cp,
                            provincia: formAuth.provincia,
                            poblacion: formAuth.poblacion,
                            pais: formAuth.pais,
                            password: formAuth.password,
                            verificado: true,
                            pedidos: []
                          };

                          usuarios.push(nuevoUsuario);
                          localStorage.setItem("usuarios", JSON.stringify(usuarios));
                          setUsuario(nuevoUsuario);
                          localStorage.setItem("usuarioActual", JSON.stringify(nuevoUsuario));
                          precargarDatosClienteDesdeUsuario(nuevoUsuario);
                          mostrarNotificacion(`✅ Registro exitoso ${nuevoUsuario.nombre}`, "exito");
                          setFormAuth({
                            nombre: "", email: "", password: "", telefono: "",
                            confirmEmail: "", calle: "", bloque: "", escalera: "", piso: "", puerta: "", numero: "", cp: "", provincia: "", poblacion: "", pais: "España", confirmPassword: "",
                            codigoVerificacion: "", codigoIngresado: "", pasoVerificacion: 1
                          });
                          setReenvioDisponibleEn(0);
                        } else {
                          mostrarNotificacion("❌ Código incorrecto", "error");
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: 12,
                        background: "gold",
                        color: "#1b1745",
                        border: "none",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: 16,
                        marginTop: 10
                      }}
                    >
                      Verificar y completar registro
                    </button>

                    <button
                      onClick={async () => {
                        if (reenvioDisponibleEn > 0) return;

                        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
                        mostrarNotificacion("📧 Reenviando código...", "normal");

                        const enviado = await enviarCodigoEmail(formAuth.email, formAuth.nombre, codigo);
                        if (enviado) {
                          setFormAuth((prev) => ({ ...prev, codigoVerificacion: codigo }));
                          setReenvioDisponibleEn(60);
                          mostrarNotificacion(`✅ Nuevo código enviado a ${formAuth.email}`, "exito");
                        } else {
                          mostrarNotificacion("❌ No se pudo reenviar el código", "error");
                        }
                      }}
                      disabled={reenvioDisponibleEn > 0}
                      style={{
                        width: "100%",
                        padding: 12,
                        background: reenvioDisponibleEn > 0 ? "#666" : "#1b1745",
                        color: "gold",
                        border: "2px solid gold",
                        borderRadius: 10,
                        cursor: reenvioDisponibleEn > 0 ? "not-allowed" : "pointer",
                        fontWeight: "bold",
                        fontSize: 15,
                        marginTop: 10,
                        opacity: reenvioDisponibleEn > 0 ? 0.85 : 1
                      }}
                    >
                      {reenvioDisponibleEn > 0 ? `Reenviar código en ${reenvioDisponibleEn}s` : "Reenviar código"}
                    </button>

                    <button
                      onClick={() => {
                        setFormAuth({ ...formAuth, pasoVerificacion: 1 });
                        setReenvioDisponibleEn(0);
                      }}
                      style={{
                        width: "100%",
                        padding: 12,
                        background: "transparent",
                        color: "gold",
                        border: "2px solid gold",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: 16,
                        marginTop: 10
                      }}
                    >
                      ← Volver
                    </button>
                  </>
                )}

                {modoRegistro === "login" && (
                  <>
                    <input
                      type="email"
                      placeholder="Email"
                      value={formAuth.email}
                      onChange={(e) => setFormAuth({ ...formAuth, email: e.target.value })}
                      style={inputStyle}
                    />

                    <input
                      type="password"
                      placeholder="Contraseña"
                      value={formAuth.password}
                      onChange={(e) => setFormAuth({ ...formAuth, password: e.target.value })}
                      style={inputStyle}
                    />

                    <button
                      onClick={() => {
                        const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
                        const encontrado = usuarios.find((u: Usuario) => u.email === formAuth.email && u.password === formAuth.password);
                        if (encontrado) {
                          setUsuario(encontrado);
                          localStorage.setItem("usuarioActual", JSON.stringify(encontrado));
                          precargarDatosClienteDesdeUsuario(encontrado);
                          mostrarNotificacion(`✅ Bienvenido ${encontrado.nombre}`, "exito");
                          setFormAuth({
                            nombre: "", email: "", password: "", telefono: "",
                            confirmEmail: "", calle: "", bloque: "", escalera: "", piso: "", puerta: "", numero: "", cp: "", provincia: "", poblacion: "", pais: "España", confirmPassword: "",
                            codigoVerificacion: "", codigoIngresado: "", pasoVerificacion: 1
                          });
                        } else {
                          mostrarNotificacion("❌ Email o contraseña incorrectos", "error");
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: 12,
                        background: "gold",
                        color: "#1b1745",
                        border: "none",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: 16,
                        marginTop: 10
                      }}
                    >
                      Iniciar Sesión
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div>
              <div style={{
                background: "#2b2560",
                padding: 20,
                borderRadius: 20,
                border: "2px solid gold",
                marginBottom: 20
              }}>
                <h3 style={{ color: "gold", marginBottom: 15 }}>Bienvenido, {usuario.nombre}</h3>
                <p style={{ color: "white" }}>📧 {usuario.email}</p>
                <p style={{ color: "white" }}>📞 {usuario.telefono}</p>
                {usuario.direccion && <p style={{ color: "white" }}>📍 {usuario.direccion}</p>}
                {(usuario.cp || usuario.poblacion || usuario.provincia || usuario.pais) && (
                  <p style={{ color: "white" }}>
                    🗺️ {usuario.cp || ""} {usuario.poblacion || ""}
                    {usuario.provincia ? `, ${usuario.provincia}` : ""}
                    {usuario.pais ? `, ${usuario.pais}` : ""}
                  </p>
                )}

                <button
                  onClick={() => {
                    setUsuario(null);
                    localStorage.removeItem("usuarioActual");
                    mostrarNotificacion("👋 Sesión cerrada", "normal");
                  }}
                  style={{
                    background: "transparent",
                    color: "#ff4444",
                    border: "2px solid #ff4444",
                    padding: "8px 20px",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontWeight: "bold",
                    marginTop: 10
                  }}
                >
                  Cerrar Sesión
                </button>
              </div>

              <h3 style={{ color: "gold", marginBottom: 15 }}>📦 Mis Pedidos</h3>

              {pedidos.filter(p => p.cliente?.email === usuario.email).length === 0 ? (
                <p style={{ color: "white", textAlign: "center", padding: 20, background: "#2b2560", borderRadius: 20 }}>
                  No tienes pedidos aún
                </p>
              ) : (
                pedidos
                  .filter(p => p.cliente?.email === usuario.email)
                  .map((p, _i) => (
                    <div
                      key={p.numero}
                      style={{
                        background: "#2b2560",
                        padding: 15,
                        borderRadius: 15,
                        border: "1px solid gold",
                        marginBottom: 10
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong style={{ color: "gold" }}>{p.numero}</strong>
                        <span style={{ color: "white", fontSize: 12 }}>{p.fecha}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                        <span style={{ color: "white" }}>Total: {p.total.toFixed(2)} €</span>
                        <span style={{
                          color: p.estado === "pendiente" ? "#22d3ee" :
                            p.estado === "enviado" ? "#e67e22" : "#2ecc71",
                          fontWeight: "bold"
                        }}>
                          {p.estado === "pendiente" ? "🛒 Pendiente" :
                            p.estado === "enviado" ? "🚚 Enviado" : "✅ Entregado"}
                        </span>
                      </div>

                      <div style={{ marginTop: 12 }}>
                        {(() => {
                          const pasos = [
                            { estado: "pendiente", label: "Pendiente", icono: "🛒" },
                            { estado: "enviado", label: "Enviado", icono: "🚚" },
                            { estado: "entregado", label: "Entregado", icono: "✅" }
                          ] as const;

                          const indiceActual =
                            p.estado === "pendiente" ? 0 :
                            p.estado === "enviado" ? 1 : 2;

                          return (
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                              {pasos.map((paso, index) => {
                                const activo = index <= indiceActual;
                                return (
                                  <div key={`${p.numero}-${paso.estado}`} style={{ flex: 1, textAlign: "center" }}>
                                    <div
                                      style={{
                                        height: 6,
                                        borderRadius: 6,
                                        marginBottom: 6,
                                        background: activo ? "gold" : "rgba(255,255,255,0.2)"
                                      }}
                                    />
                                    <div style={{ fontSize: 12, color: activo ? "gold" : "rgba(255,255,255,0.7)" }}>
                                      {paso.icono} {paso.label}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      )}

      {/* TIENDA */}
      {pagina === "tienda" && (
        <Tienda
          velas={velas}
          inciensos={inciensos}
          figuras={figuras}
          agregarAlCarrito={agregarAlCarrito}
          volver={() => setPagina("inicio")}
        />
      )}

      {/* ADMIN */}
      {pagina === "admin" && (
        <div style={{ maxWidth: 1100, margin: "0 auto", width: "98%" }}>
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
                  className="btn-admin-limpio btn-admin-demo-granate"
                  onClick={activarModoDemo}
                  style={{
                    background: "#7b2d3a",
                    color: "white",
                    border: "none",
                    padding: "18px",
                    borderRadius: 14,
                    cursor: modoDemoActivo ? "not-allowed" : "pointer",
                    width: "100%",
                    fontWeight: "bold",
                    fontSize: 22,
                    opacity: modoDemoActivo ? 0.85 : 1
                  }}
                  disabled={modoDemoActivo}
                >
                  🧪 ACTIVAR MODO DEMO
                </button>

                <button
                  className="btn-admin-limpio"
                  onClick={desactivarModoDemo}
                  style={{
                    background: modoDemoActivo ? "#ff9800" : "transparent",
                    color: modoDemoActivo ? "#1b1745" : "#ff9800",
                    border: "1px solid #ff9800",
                    padding: "16px",
                    borderRadius: 14,
                    cursor: "pointer",
                    width: "100%",
                    fontWeight: "bold",
                    fontSize: 20
                  }}
                >
                  ♻️ VOLVER A DATOS REALES
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

                <details open style={{ marginBottom: 14 }}>
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
                    <div style={{ color: "gold", fontWeight: "bold", marginBottom: 6 }}>
                      ⚠️ Alertas de stock bajo
                    </div>
                    {metricasAdmin.alertasStockBajo.length === 0 ? (
                      <div style={{ opacity: 0.85, marginBottom: 12 }}>Sin alertas de stock bajo</div>
                    ) : (
                      <div style={{ marginBottom: 12 }}>
                        {metricasAdmin.alertasStockBajo.map((producto) => (
                          <div key={`stock-${producto.id}`} style={{ marginBottom: 6 }}>
                            {producto.nombre} ({producto.categoria}) · Stock: <strong style={{ color: "gold" }}>{producto.stock}</strong>
                          </div>
                        ))}
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
      {pagina === "carrito" && (
        <>
          <Carrito
            cart={cart}
            total={total}
            obtenerPrecioItem={precioItemCarrito}
            cambiarCantidad={cambiarCantidad}
            volver={volverATienda}
            finalizar={() => {
              precargarDatosClienteDesdeUsuario(usuario);
              setNumeroPedidoPreview(generarNumeroPedido());
              setFormPedidoAbierto(true);
            }}
            vaciar={vaciarCarrito}
          />

          {perfilCompraRapida && cart.length > 0 && (
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button
                onClick={comprarEnUnClick}
                style={{
                  background: "#25D366",
                  color: "white",
                  border: "none",
                  padding: "12px 30px",
                  borderRadius: 25,
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: 16
                }}
              >
                ⚡ Comprar en 1 clic
              </button>
            </div>
          )}
        </>
      )}

      {/* SEGUIMIENTO DE PEDIDOS */}
      {pagina === "seguimiento" && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center" }}>🔍 SEGUIMIENTO DE PEDIDOS</h2>

          <div style={{ display: "flex", gap: 10, marginBottom: 30 }}>
            <input
              type="text"
              placeholder="Ej: MK240215-42"
              value={numeroSeguimiento}
              onChange={(e) => setNumeroSeguimiento(e.target.value.toUpperCase())}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 10,
                border: "2px solid gold",
                background: "#1b1745",
                color: "white",
                fontSize: 16
              }}
            />
            <button
              onClick={buscarPedido}
              style={{
                background: "gold",
                color: "#1b1745",
                border: "none",
                padding: "12px 20px",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Buscar
            </button>
          </div>

          {pedidoBuscado && (
            <div style={{
              background: "#2b2560",
              border: "2px solid gold",
              borderRadius: 20,
              padding: 20
            }}>
              <h3 style={{ color: "gold", marginBottom: 15 }}>📦 {pedidoBuscado.numero}</h3>

              <div style={{ marginBottom: 15 }}>
                <p><strong>Fecha:</strong> {pedidoBuscado.fecha}</p>
                <p><strong>Cliente:</strong> {pedidoBuscado.cliente.nombreApellidos}</p>
                <p><strong>Total:</strong> {pedidoBuscado.total.toFixed(2)} €</p>
              </div>

              <div style={{
                background: "#1b1745",
                padding: 15,
                borderRadius: 10,
                marginBottom: 15
              }}>
                <p><strong>ESTADO:</strong></p>
                <div style={{
                  display: "inline-block",
                  padding: "8px 20px",
                  borderRadius: 30,
                  background: pedidoBuscado.estado === "pendiente" ? "rgba(34,211,238,0.2)" :
                    pedidoBuscado.estado === "enviado" ? "rgba(230,126,34,0.2)" :
                      "rgba(46,204,113,0.2)",
                  color: pedidoBuscado.estado === "pendiente" ? "#22d3ee" :
                    pedidoBuscado.estado === "enviado" ? "#e67e22" :
                      "#2ecc71",
                  fontWeight: "bold"
                }}>
                  {pedidoBuscado.estado === "pendiente" ? "🛒 PENDIENTE" :
                    pedidoBuscado.estado === "enviado" ? "🚚 ENVIADO" :
                      "✅ ENTREGADO"}
                </div>
              </div>

              <div>
                <p><strong>📍 Dirección de envío:</strong></p>
                <p>{pedidoBuscado.cliente.direccion}</p>
                <p>{pedidoBuscado.cliente.cp} {pedidoBuscado.cliente.poblacion}</p>
                <p>{pedidoBuscado.cliente.provincia}</p>
              </div>

              <button
                onClick={() => window.open(`https://wa.me/34673175547?text=Hola%20Maika%2C%20consulta%20sobre%20pedido%20${pedidoBuscado.numero}`, "_blank")}
                style={{
                  marginTop: 20,
                  background: "#25D366",
                  color: "white",
                  border: "none",
                  padding: "10px",
                  borderRadius: 10,
                  cursor: "pointer",
                  width: "100%",
                  fontWeight: "bold"
                }}
              >
                📱 Contactar por WhatsApp
              </button>
            </div>
          )}

          {/* Panel de Admin para ver pedidos */}
          {accesoAdmin && (
            <div style={{ marginTop: 50 }}>
              <h3 style={{ textAlign: "center" }}>📋 GESTIÓN DE PEDIDOS</h3>

              <input
                placeholder="Buscar pedido..."
                value={busquedaPedido}
                onChange={(e) => setBusquedaPedido(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 10,
                  border: "2px solid gold",
                  background: "#1b1745",
                  color: "white",
                  marginBottom: 20
                }}
              />

              {renderCajaPedidos("PENDIENTES", pedidosPendientesOrdenados, "#22d3ee", "🛒", pendientesAbierto, setPendientesAbierto, true)}
              {renderCajaPedidos("ENVIADOS", pedidosEnviadosOrdenados, "#e67e22", "🚚", enviadosAbierto, setEnviadosAbierto, false)}
              {renderCajaPedidos("ENTREGADOS", pedidosEntregadosOrdenados, "#2ecc71", "✅", entregadosAbierto, setEntregadosAbierto, false)}
            </div>
          )}
        </div>
      )}

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

      {/* Modal de éxito */}
      {pedidoRealizado && (
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
            padding: 40,
            textAlign: "center",
            maxWidth: 400
          }}>
            <h2 style={{ color: "gold", marginBottom: 20 }}>✅ PEDIDO REALIZADO</h2>
            <p style={{ color: "white", marginBottom: 20 }}>
              Tu pedido <strong>{ultimoPedidoNumero}</strong> ha sido enviado por WhatsApp
            </p>
            <p style={{ color: "white", marginBottom: 30 }}>
              Te contactaremos en breve para confirmar
            </p>
            <button
              onClick={() => {
                setPedidoRealizado(false);
                setPagina("inicio");
              }}
              style={{
                padding: "12px 30px",
                borderRadius: 25,
                border: "none",
                background: "gold",
                color: "#1b1745",
                fontWeight: "bold",
                cursor: "pointer"
              }}
             >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {!esAppNativa && pagina !== "tienda" && pagina !== "carrito" && (
      <>
      {/* Contador de visitas */}
      <div style={{ position: "fixed", bottom: 30, left: 30, zIndex: 1000 }}>
        <div style={{
          background: "linear-gradient(135deg, #2b2560 0%, #3a2e8a 100%)",
          border: "2px solid gold",
          borderRadius: 30,
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "gold"
        }}>
          <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
              <path d="M3.5 18c0-2.8 2.3-5 5.5-5s5.5 2.2 5.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
              <path d="M14.5 18c.2-1.9 1.9-3.4 4-3.4 2.2 0 4 1.7 4 3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </span>
          <span>{visitas} visitas</span>
        </div>
      </div>
      </>
      )}

      {pagina === "inicio" && (
        <footer
          style={{
            position: "fixed",
            bottom: 10,
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            color: "white",
            opacity: 0.95,
            fontSize: 13,
            zIndex: 9000,
            width: "max-content",
            maxWidth: "95%"
          }}
        >
          <a href="/politica-cookies.html" target="_blank" rel="noreferrer" style={{ color: "gold", margin: "0 8px" }}>
            Política de Cookies
          </a>
          ·
          <a href="/politica-privacidad.html" target="_blank" rel="noreferrer" style={{ color: "gold", margin: "0 8px" }}>
            Política de Privacidad
          </a>
          ·
          <a href="/terminos-condiciones.html" target="_blank" rel="noreferrer" style={{ color: "gold", margin: "0 8px" }}>
            Términos y Condiciones
          </a>
        </footer>
      )}
      
      {/* Modal de usuarios */}
      <ModalUsuarios
        abierto={modalUsuariosAbierto}
        usuarios={listaUsuarios}
        onClose={() => setModalUsuariosAbierto(false)}
        mostrarNotificacion={mostrarNotificacion}
        onEditUsuario={abrirEditorUsuario}
      />

      {/* Modal de edición de usuario */}
      {modalEditarUsuarioAbierto && editUsuarioForm && (
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
          zIndex: 11000
        }}>
          <div style={{
            background: "#2b2560",
            border: "3px solid gold",
            borderRadius: 20,
            padding: 36,
            width: "98%",
            maxWidth: 920,
            maxHeight: "96vh",
            overflowY: "auto"
          }}>
            <h3 style={{ color: "gold", marginBottom: 28, fontSize: 34 }}>✏️ Editar usuario</h3>

            <input
              type="text"
              placeholder="Nombre"
              value={editUsuarioForm.nombre}
              onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, nombre: e.target.value })}
              style={editModalInputStyle}
            />

            <input
              type="email"
              placeholder="Email"
              value={editUsuarioForm.email}
              onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, email: e.target.value })}
              style={editModalInputStyle}
            />

            <input
              type="tel"
              placeholder="Teléfono"
              value={editUsuarioForm.telefono}
              onChange={(e) =>
                setEditUsuarioForm({
                  ...editUsuarioForm,
                  telefono: e.target.value.replace(/\D/g, "").slice(0, 9)
                })
              }
              inputMode="numeric"
              maxLength={9}
              style={editModalInputStyle}
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={editUsuarioForm.password}
              onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, password: e.target.value })}
              style={editModalInputStyle}
            />

            <input
              type="text"
              placeholder="Calle"
              value={editUsuarioForm.calle}
              onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, calle: e.target.value })}
              style={editModalInputStyle}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input
                type="text"
                placeholder="Número"
                value={editUsuarioForm.numero}
                onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, numero: e.target.value })}
                style={editModalInputStyle}
              />
              <input
                type="text"
                placeholder="Bloque"
                value={editUsuarioForm.bloque}
                onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, bloque: e.target.value })}
                style={editModalInputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input
                type="text"
                placeholder="Escalera"
                value={editUsuarioForm.escalera}
                onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, escalera: e.target.value })}
                style={editModalInputStyle}
              />
              <input
                type="text"
                placeholder="Piso"
                value={editUsuarioForm.piso}
                onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, piso: e.target.value })}
                style={editModalInputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input
                type="text"
                placeholder="Puerta"
                value={editUsuarioForm.puerta}
                onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, puerta: e.target.value })}
                style={editModalInputStyle}
              />
              <input
                type="text"
                placeholder="C.P."
                value={editUsuarioForm.cp}
                onChange={(e) =>
                  setEditUsuarioForm({
                    ...editUsuarioForm,
                    cp: e.target.value.replace(/\D/g, "").slice(0, 5)
                  })
                }
                inputMode="numeric"
                maxLength={5}
                style={editModalInputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input
                type="text"
                placeholder="Provincia"
                value={editUsuarioForm.provincia}
                onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, provincia: e.target.value })}
                style={editModalInputStyle}
              />
              <input
                type="text"
                placeholder="Población"
                value={editUsuarioForm.poblacion}
                onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, poblacion: e.target.value })}
                style={editModalInputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              <input
                type="text"
                placeholder="País"
                value={editUsuarioForm.pais}
                onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, pais: e.target.value })}
                style={editModalInputStyle}
              />
            </div>

            <input
              type="text"
              placeholder="Dirección completa (autogenerada)"
              value={`${editUsuarioForm.calle}${editUsuarioForm.numero ? `, Nº ${editUsuarioForm.numero}` : ""}${editUsuarioForm.bloque ? `, Bloque ${editUsuarioForm.bloque}` : ""}${editUsuarioForm.escalera ? `, Esc. ${editUsuarioForm.escalera}` : ""}${editUsuarioForm.piso ? `, Piso ${editUsuarioForm.piso}` : ""}${editUsuarioForm.puerta ? `, Puerta ${editUsuarioForm.puerta}` : ""}`}
              readOnly
              style={editModalInputStyle}
            />

            <label style={{ display: "flex", alignItems: "center", gap: 12, color: "white", marginBottom: 24, fontSize: 19 }}>
              <input
                type="checkbox"
                checked={editUsuarioForm.verificado}
                onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, verificado: e.target.checked })}
              />
              Usuario verificado
            </label>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                className="btn-azul-categoria"
                onClick={() => {
                  setModalEditarUsuarioAbierto(false);
                  setEditUsuarioForm(null);
                }}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #2b2560 0%, #3a2e8a 100%)",
                  color: "gold",
                  border: "2px solid gold",
                  borderRadius: 12,
                  padding: "16px 18px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: 19
                }}
              >
                Cancelar
              </button>
              <button
                className="btn-azul-categoria"
                onClick={guardarEdicionUsuario}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #2b2560 0%, #3a2e8a 100%)",
                  color: "gold",
                  border: "2px solid gold",
                  borderRadius: 12,
                  padding: "16px 18px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: 19
                }}
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 12,
  marginBottom: 10,
  borderRadius: 10,
  border: "2px solid gold",
  background: "#1b1745",
  color: "white",
  fontSize: 16,
  outline: "none"
};

const editModalInputStyle = {
  ...inputStyle,
  padding: 20,
  marginBottom: 16,
  fontSize: 20
};