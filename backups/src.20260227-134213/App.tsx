import { useState, useEffect, useMemo } from "react";
import Tienda from "./Tienda";
import "./App.css";
import Carrito from "./Carrito";
import Notificacion from "./Notificacion";
import ModalConfirmacion from "./ModalConfirmacion";
import "./Notificacion.css";
import emailjs from '@emailjs/browser'; 

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

export default function App() {
  const [pagina, setPagina] = useState<"inicio" | "tienda" | "carrito" | "seguimiento" | "cuenta">("inicio");
  const [cart, setCart] = useState<ItemCarrito[]>([]);
  const [notificacion, setNotificacion] = useState<{ mensaje: string; tipo: "normal" | "exito" | "error" } | null>(null);
  const [mostrarAvisoCookies, setMostrarAvisoCookies] = useState(false);
  const [visitas, setVisitas] = useState(0);
  const [mostrarAdmin, setMostrarAdmin] = useState(false);
  const [claveAdmin, setClaveAdmin] = useState("");
  const [accesoAdmin, setAccesoAdmin] = useState(false);

  // Estado para seguimiento de pedidos
  const [numeroSeguimiento, setNumeroSeguimiento] = useState("");
  const [pedidoBuscado, setPedidoBuscado] = useState<Pedido | null>(null);

  const [formPedidoAbierto, setFormPedidoAbierto] = useState(false);
  const [pedidoRealizado, setPedidoRealizado] = useState(false);
  const [numeroPedidoPreview, setNumeroPedidoPreview] = useState<string | null>(null);
  const [ultimoPedidoNumero, setUltimoPedidoNumero] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [busquedaPedido, setBusquedaPedido] = useState("");
  const [pedidoAbierto, setPedidoAbierto] = useState<number | null>(null);

  // Estados para las cajas desplegables
  const [pendientesAbierto, setPendientesAbierto] = useState(true);
  const [enviadosAbierto, setEnviadosAbierto] = useState(false);
  const [entregadosAbierto, setEntregadosAbierto] = useState(false);

  // Estado para modal de vaciar carrito
  const [modalAbierto, setModalAbierto] = useState(false);

  // ========== NUEVOS ESTADOS PARA MODAL DE USUARIOS ==========
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

  // Estados para autenticación
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

  // ========== FILTRAR PEDIDOS POR ESTADO ==========
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
          borderRadius: 30,
          padding: 30,
          width: "95%",
          maxWidth: 1200,
          maxHeight: "90vh",
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
              <h2 style={{ color: "gold", margin: 0, fontSize: 28 }}>
                👥 GESTIÓN DE USUARIOS
              </h2>
              <p style={{ color: "white", margin: "5px 0 0", opacity: 0.8 }}>
                Total: {usuariosState.length} usuarios | Verificados: {usuariosState.filter((u: Usuario) => u.verificado).length} | Pendientes: {usuariosState.filter((u: Usuario) => !u.verificado).length}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "2px solid gold",
                color: "gold",
                width: 45,
                height: 45,
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: 22,
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
                  padding: "12px 15px",
                  borderRadius: 12,
                  border: "2px solid gold",
                  background: "#1b1745",
                  color: "white",
                  fontSize: 15,
                  outline: "none"
                }}
              />
            </div>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as "todos" | "verificados" | "pendientes")}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                border: "2px solid gold",
                background: "#1b1745",
                color: "gold",
                cursor: "pointer",
                fontSize: 15,
                minWidth: 150
              }}
            >
              <option value="todos">📋 Todos</option>
              <option value="verificados">✅ Verificados</option>
              <option value="pendientes">⏳ Pendientes</option>
            </select>

            <button
              onClick={exportarCSV}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                border: "2px solid #4caf50",
                background: "transparent",
                color: "#4caf50",
                cursor: "pointer",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              📥 Exportar CSV
            </button>

            <button
              onClick={() => {
                const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
                setUsuariosState(usuarios);
                mostrarNotificacion("🔄 Lista actualizada", "exito");
              }}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                border: "2px solid gold",
                background: "transparent",
                color: "gold",
                cursor: "pointer"
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
                    <th style={{ padding: "15px", textAlign: "left", color: "gold" }}>#</th>
                    <th style={{ padding: "15px", textAlign: "left", color: "gold" }}>Usuario</th>
                    <th style={{ padding: "15px", textAlign: "left", color: "gold" }}>Contacto</th>
                    <th style={{ padding: "15px", textAlign: "left", color: "gold" }}>Dirección</th>
                    <th style={{ padding: "15px", textAlign: "left", color: "gold" }}>Estado</th>
                    <th style={{ padding: "15px", textAlign: "left", color: "gold" }}>Pedidos</th>
                    <th style={{ padding: "15px", textAlign: "left", color: "gold" }}>Acciones</th>
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
                      <td style={{ padding: "15px", color: "gold" }}>{index + 1}</td>

                      <td style={{ padding: "15px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, gold, #ffd700)",
                            color: "#1b1745",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            fontSize: 18
                          }}>
                            {usuario.nombre?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ color: "white", fontWeight: "bold" }}>{usuario.nombre}</div>
                            <div style={{ color: "gold", fontSize: 11 }}>ID: {usuario.id}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "15px" }}>
                        <div style={{ color: "white" }}>
                          <div>📧 {usuario.email}</div>
                          <div style={{ fontSize: 14, opacity: 0.8, marginTop: 3 }}>
                            📞 {usuario.telefono || "No especificado"}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "15px" }}>
                        <div style={{ color: "white", fontSize: 14 }}>
                          {usuario.direccion || "—"}
                        </div>
                      </td>

                      <td style={{ padding: "15px" }}>
                        <span style={{
                          background: usuario.verificado ? "rgba(46,204,113,0.2)" : "rgba(255,68,68,0.2)",
                          color: usuario.verificado ? "#2ecc71" : "#ff4444",
                          padding: "6px 12px",
                          borderRadius: 20,
                          fontSize: 13,
                          fontWeight: "bold",
                          display: "inline-block"
                        }}>
                          {usuario.verificado ? "✅ Verificado" : "⏳ Pendiente"}
                        </span>
                      </td>

                      <td style={{ padding: "15px" }}>
                        <span style={{
                          background: "rgba(255,215,0,0.1)",
                          padding: "6px 12px",
                          borderRadius: 20,
                          color: "gold",
                          fontWeight: "bold"
                        }}>
                          {usuario.pedidos?.length || 0} pedidos
                        </span>
                      </td>

                      <td style={{ padding: "15px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerificar(usuario);
                            }}
                            style={{
                              background: "transparent",
                              border: `1px solid ${usuario.verificado ? "#ff4444" : "#2ecc71"}`,
                              color: usuario.verificado ? "#ff4444" : "#2ecc71",
                              padding: "6px 10px",
                              borderRadius: 8,
                              cursor: "pointer",
                              fontSize: 12,
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
    padding: "6px 10px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 12
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
                              padding: "6px 10px",
                              borderRadius: 8,
                              cursor: "pointer",
                              fontSize: 12
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
            padding: "15px 20px",
            borderRadius: 15,
            border: "1px solid gold"
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

    const visitasGuardadas = localStorage.getItem("visitasMaika");
    const nuevasVisitas = visitasGuardadas ? parseInt(visitasGuardadas) + 1 : 1;
    setVisitas(nuevasVisitas);
    localStorage.setItem("visitasMaika", nuevasVisitas.toString());

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

    const avisoVisto = localStorage.getItem("avisoCookiesVisto");
    const clienteGuardado = localStorage.getItem("clienteMaika");
    if (clienteGuardado) {
      setDatosCliente(JSON.parse(clienteGuardado) as Cliente);
    }
    if (!avisoVisto) {
      setMostrarAvisoCookies(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("carritoMaika", JSON.stringify(cart));
  }, [cart]);

  const total = cart.reduce((sum, item) => {
    const cantidad = Number.isFinite(Number(item.cantidad)) ? Number(item.cantidad) : 0;
    return sum + precioItemCarrito(item) * cantidad;
  }, 0);
  const envioPreview = calcularEnvio(datosCliente.provincia, total);
  const totalPreview = total + envioPreview;

  const mostrarNotificacion = (mensaje: string, tipo: "normal" | "exito" | "error" = "normal") => {
    setNotificacion({ mensaje, tipo });
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
      const item = prev.find(p => p.id === id);
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

  const validarPago = (): string | null => {
    if (metodoPago === "bizum") {
      const telefonoSinPrefijo = normalizarTelefonoBizum(datosPago.bizumTelefono);

      if (!/^[67]\d{8}$/.test(telefonoSinPrefijo)) {
        return "Introduce un móvil de España válido (9 dígitos)";
      }
      return null;
    }

    const numero = datosPago.tarjetaNumero.replace(/\s+/g, "");
    if (!/^\d{13,19}$/.test(numero)) {
      return "Número de tarjeta no válido";
    }
    if (!datosPago.tarjetaTitular.trim()) {
      return "Introduce el titular de la tarjeta";
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(datosPago.tarjetaCaducidad.trim())) {
      return "Caducidad no válida (MM/AA)";
    }
    if (!/^\d{3,4}$/.test(datosPago.tarjetaCVV.trim())) {
      return "CVV no válido";
    }
    return null;
  };

  const generarReferenciaPago = () => {
    const time = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 900 + 100);
    return `PAY-${time}-${random}`;
  };

  const enviarPedidoWhatsApp = async () => {
    if (
      !datosCliente.nombreApellidos?.trim() ||
      !datosCliente.email?.trim() ||
      !datosCliente.direccion?.trim() ||
      !datosCliente.cp?.trim() ||
      !datosCliente.poblacion?.trim() ||
      !datosCliente.provincia?.trim() ||
      !datosCliente.pais?.trim()
    ) {
      mostrarNotificacion("Completa todos los datos", "error");
      return;
    }
    if (cart.length === 0) {
      mostrarNotificacion("Carrito vacío", "error");
      return;
    }

    const errorPago = validarPago();
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
      const envio = calcularEnvio(datosCliente.provincia, total);
      const totalFinal = total + envio;
      const metodoPagoTexto = metodoPago === "bizum" ? "Bizum" : "Tarjeta";

      let mensaje = `🛍️ *NUEVO PEDIDO MAIKA* 🛍️\n\n`;
      mensaje += `📦 *Nº Pedido:* ${numeroPedido}\n`;
      mensaje += `💳 *Pago:* ${metodoPagoTexto}\n`;
      mensaje += `🧾 *Referencia pago:* ${referenciaPago}\n`;
      if (metodoPago === "bizum") {
        const bizumNormalizado = normalizarTelefonoBizum(datosPago.bizumTelefono);
        mensaje += `📱 *Bizum:* +34 ${bizumNormalizado}\n`;
      }
      mensaje += `👤 *Cliente:* ${datosCliente.nombreApellidos}\n`;
      mensaje += `📧 *Email:* ${datosCliente.email}\n`;
      mensaje += `📞 *Teléfono:* ${datosCliente.telefono}\n`;
      mensaje += `📍 *Dirección:* ${datosCliente.direccion}, ${datosCliente.cp} ${datosCliente.poblacion}, ${datosCliente.provincia}, ${datosCliente.pais}\n\n`;
      mensaje += `📋 *PRODUCTOS:*\n`;

      cart.forEach(item => {
        const precioUnitario = precioItemCarrito(item);
        mensaje += `   • ${item.nombre} x${item.cantidad} = ${(precioUnitario * item.cantidad).toFixed(2)}€\n`;
      });

      mensaje += `\n💰 *Subtotal:* ${total.toFixed(2)}€`;
      mensaje += `\n🚚 *Envío:* ${envio.toFixed(2)}€`;
      mensaje += `\n💶 *TOTAL:* ${totalFinal.toFixed(2)}€`;

      const url = `https://wa.me/34673175547?text=${encodeURIComponent(mensaje)}`;
      window.open(url, "_blank");

      const pedidoNuevo: Pedido = {
        numero: numeroPedido,
        fecha: new Date().toLocaleString(),
        cliente: { ...datosCliente },
        items: cart,
        subtotal: total,
        envio,
        total: totalFinal,
        estado: "pendiente",
        pago: {
          metodo: metodoPago,
          estado: "pagado",
          referencia: referenciaPago
        }
      };

      const pedidosActuales = JSON.parse(localStorage.getItem("pedidosMaika") || "[]") as Pedido[];
      const nuevosPedidos = [pedidoNuevo, ...pedidosActuales];
      localStorage.setItem("pedidosMaika", JSON.stringify(nuevosPedidos));
      setPedidos(nuevosPedidos as Pedido[]);

      setCart([]);
      setFormPedidoAbierto(false);
      setPedidoRealizado(true);
      setPagina("inicio");

      localStorage.setItem("clienteMaika", JSON.stringify(datosCliente));

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

      mostrarNotificacion(`✅ Pago recibido y pedido ${numeroPedido} enviado`, "exito");
    } finally {
      setProcesandoPago(false);
    }
  };

  const aceptarCookies = () => {
    setMostrarAvisoCookies(false);
    localStorage.setItem("avisoCookiesVisto", "true");
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

  const repararPedidosAtascados = () => {
    const pedidosProblematicos = ["MK2671", "MK2668", "MK2665", "MK2663", "MK2661"];

    const nuevosPedidos = pedidos.map(p => {
      if (pedidosProblematicos.includes(p.numero) && p.estado !== "entregado") {
        return { ...p, estado: "entregado" };
      }
      return p;
    });

    setPedidos(nuevosPedidos as Pedido[]);
    localStorage.setItem("pedidosMaika", JSON.stringify(nuevosPedidos));
    mostrarNotificacion(`✅ 5 pedidos reparados`, "exito");
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
            direccion: editUsuarioForm.direccion.trim(),
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
    <div style={{ background: "#1b1745", minHeight: "100vh", padding: 20, color: "gold", position: "relative" }}>
      <style>{pulseAnimationStyle}</style>

      {/* HEADER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 30,
        borderBottom: "2px solid gold",
        paddingBottom: 15
      }}>
        <div style={{ display: "flex", gap: 20 }}>
          <button
            onClick={() => setPagina("inicio")}
            style={{
              background: pagina === "inicio" ? "gold" : "transparent",
              color: pagina === "inicio" ? "#1b1745" : "gold",
              border: "2px solid gold",
              padding: "8px 20px",
              borderRadius: 25,
              cursor: "pointer",
              fontWeight: "bold"
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
              padding: "8px 20px",
              borderRadius: 25,
              cursor: "pointer",
              fontWeight: "bold"
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
              padding: "8px 20px",
              borderRadius: 25,
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            👤 Mi Cuenta
          </button>
        </div>

        <div
          onClick={() => setPagina("carrito")}
          style={{
            background: "#2b2560",
            border: "2px solid gold",
            borderRadius: 30,
            padding: "10px 25px",
            cursor: "pointer",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 10
          }}
        >
          🛒 <span>{cart.reduce((sum, i) => sum + i.cantidad, 0)}</span>
          <span style={{ color: "gold" }}>{total.toFixed(2)} €</span>
        </div>
      </div>

      {/* Aviso cookies */}
      {mostrarAvisoCookies && (
        <div style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          right: 20,
          border: "2px solid gold",
          borderRadius: 15,
          padding: "15px",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#1b1745"
        }}>
          <span>🍪 Usamos cookies para mejorar tu experiencia</span>
          <button onClick={aceptarCookies} style={{ background: "gold", color: "#1b1745", border: "none", padding: "8px 20px", borderRadius: 20, cursor: "pointer" }}>
            Aceptar
          </button>
        </div>
      )}

      {/* Panel Admin */}
      <div style={{ position: "fixed", bottom: 30, right: 30, zIndex: 2000 }}>
        <button
          onClick={() => setMostrarAdmin(!mostrarAdmin)}
          style={{
            background: "#2b2560",
            border: "2px solid gold",
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            fontSize: "24px",
            cursor: "pointer",
            color: "gold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px gold"
          }}
        >
          ⚙️
        </button>

        {mostrarAdmin && (
          <div style={{
            position: "absolute",
            bottom: 60,
            right: 0,
            background: "#2b2560",
            border: "3px solid gold",
            borderRadius: 20,
            padding: 20,
            width: 250,
            zIndex: 2001
          }}>
            {!accesoAdmin ? (
              <>
                <h3 style={{ color: "gold", textAlign: "center" }}>🔐 ADMIN</h3>
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
                        setMostrarAdmin(false);
                      } else {
                        mostrarNotificacion("❌ Clave incorrecta", "error");
                      }
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 10,
                    border: "2px solid gold",
                    background: "#1b1745",
                    color: "gold",
                    marginBottom: 10
                  }}
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (claveAdmin === "maika2026") {
                      setAccesoAdmin(true);
                      setClaveAdmin("");
                      mostrarNotificacion("✅ Acceso concedido", "exito");
                      setMostrarAdmin(false);
                    } else {
                      mostrarNotificacion("❌ Clave incorrecta", "error");
                    }
                  }}
                  style={{
                    background: "gold",
                    color: "#1b1745",
                    border: "none",
                    padding: "8px",
                    borderRadius: 10,
                    cursor: "pointer",
                    width: "100%",
                    fontWeight: "bold"
                  }}
                >
                  Acceder
                </button>
              </>
            ) : (
              <>
                <h3 style={{ color: "gold", textAlign: "center" }}>🔧 PANEL</h3>

                <button
                  onClick={repararPedidosAtascados}
                  style={{
                    background: "#ff4444",
                    color: "white",
                    border: "none",
                    padding: "10px",
                    borderRadius: 10,
                    cursor: "pointer",
                    width: "100%",
                    fontWeight: "bold",
                    marginBottom: 10
                  }}
                >
                  🛠️ REPARAR 5 PEDIDOS
                </button>

                <button
                  onClick={cargarUsuarios}
                  style={{
                    background: "#4caf50",
                    color: "white",
                    border: "none",
                    padding: "10px",
                    borderRadius: 10,
                    cursor: "pointer",
                    width: "100%",
                    fontWeight: "bold",
                    marginBottom: 10
                  }}
                >
                  📋 GESTIÓN DE USUARIOS
                </button>
                    <button
                  onClick={() => {
                    setAccesoAdmin(false);
                    setMostrarAdmin(false);
                  }}
                  style={{
                    background: "transparent",
                    border: "1px solid gold",
                    color: "gold",
                    padding: "5px",
                    borderRadius: 10,
                    cursor: "pointer",
                    width: "100%"
                  }}
                >
                  Cerrar sesión
                </button>
              </>
            )}
          </div>
        )}
      </div>

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
          <h1 style={{ fontSize: 72, marginBottom: 10 }}>✨ MAIKA ✨</h1>
          <p style={{ fontSize: 24, marginBottom: 40, color: "gold", opacity: 0.9 }}>
            La ruta del alma
          </p>

          {/* BOTÓN TIENDA CON IMAGEN */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{
              width: "50%",
              maxWidth: "300px",
              margin: "0 auto",
              borderRadius: 15,
              overflow: "hidden",
              border: "2px solid gold",
              boxShadow: "0 0 15px gold"
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
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>

            <button
              onClick={() => setPagina("tienda")}
              style={{
                marginTop: "20px",
                background: "gold",
                color: "#1b1745",
                border: "2px solid #1b1745",
                padding: "12px 40px",
                borderRadius: 30,
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: 16,
                boxShadow: "0 0 15px gold"
              }}
            >
              🛍️ TIENDA
            </button>
          </div>

          {/* Servicios */}
          <h2 style={{ fontSize: 28, marginBottom: 20 }}>🌟 SERVICIOS</h2>
          <div style={{ display: "flex", justifyContent: "center", gap: 15, flexWrap: "wrap", marginBottom: 30 }}>
            {/* Tarot */}
            <div style={{ background: "#2b2560", borderRadius: 15, padding: "14px", width: 220, border: "1px solid gold", display: "flex", flexDirection: "column", minHeight: 305 }}>
              <h3 style={{ color: "gold", margin: "5px 0", fontSize: 16, textAlign: "center" }}>🔮 Tarot Evolutivo</h3>
              <img
                src="/tarot%20evolutivo.jpg"
                alt="Tarot Evolutivo"
                style={{ width: "100%", height: 115, objectFit: "cover", borderRadius: 10, border: "1px solid gold", marginBottom: 8, display: "block" }}
              />
              <p style={{ color: "white", margin: "2px 0", fontSize: 13, textAlign: "center" }}>Sesión 60 min</p>
              <p style={{ color: "gold", fontSize: 18, fontWeight: "bold", margin: "5px 0", textAlign: "center" }}>45€</p>
              <button onClick={() => window.open("https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20reservar%20Tarot", "_blank")} style={{ background: "gold", border: "none", padding: "9px 12px", borderRadius: 20, cursor: "pointer", width: "100%", fontWeight: "bold", fontSize: 13, marginTop: "auto" }}>Reservar</button>
            </div>

            {/* Limpieza */}
            <div style={{ background: "#2b2560", borderRadius: 15, padding: "14px", width: 220, border: "1px solid gold", display: "flex", flexDirection: "column", minHeight: 305 }}>
              <h3 style={{ color: "gold", margin: "5px 0", fontSize: 16, textAlign: "center" }}>✨ Limpieza Energética</h3>
              <img
                src="/limpieza%20energetica.jpg"
                alt="Limpieza Energética"
                style={{ width: "100%", height: 115, objectFit: "cover", borderRadius: 10, border: "1px solid gold", marginBottom: 8, display: "block" }}
              />
              <p style={{ color: "white", margin: "2px 0", fontSize: 13, textAlign: "center" }}>Sesión 45 min</p>
              <p style={{ color: "gold", fontSize: 18, fontWeight: "bold", margin: "5px 0", textAlign: "center" }}>35€</p>
              <button onClick={() => window.open("https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20reservar%20Limpieza", "_blank")} style={{ background: "gold", border: "none", padding: "9px 12px", borderRadius: 20, cursor: "pointer", width: "100%", fontWeight: "bold", fontSize: 13, marginTop: "auto" }}>Reservar</button>
            </div>

            {/* Ritual */}
            <div style={{ background: "#2b2560", borderRadius: 15, padding: "14px", width: 220, border: "1px solid gold", display: "flex", flexDirection: "column", minHeight: 305 }}>
              <h3 style={{ color: "gold", margin: "5px 0", fontSize: 16, textAlign: "center" }}>🕯️ Ritual Personalizado</h3>
              <img
                src="/ritual%20personalizado.jpg"
                alt="Ritual Personalizado"
                style={{ width: "100%", height: 115, objectFit: "cover", borderRadius: 10, border: "1px solid gold", marginBottom: 8, display: "block" }}
              />
              <p style={{ color: "white", margin: "2px 0", fontSize: 13, textAlign: "center" }}>Sesión 60 min</p>
              <p style={{ color: "gold", fontSize: 18, fontWeight: "bold", margin: "5px 0", textAlign: "center" }}>50€</p>
              <button onClick={() => window.open("https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20consultar%20Ritual", "_blank")} style={{ background: "gold", border: "none", padding: "9px 12px", borderRadius: 20, cursor: "pointer", width: "100%", fontWeight: "bold", fontSize: 13, marginTop: "auto" }}>Reservar</button>
            </div>
          </div>

          {/* Testimonios */}
          <h2 style={{ fontSize: 32, marginBottom: 20 }}>💬 TESTIMONIOS</h2>
          <div style={{ maxWidth: 600, margin: "0 auto 40px" }}>
            <p style={{ background: "#2b2560", padding: 20, borderRadius: 20, marginBottom: 10 }}>
              "Sentí claridad y paz después de la primera consulta. ¡Recomendadísima!"
            </p>
            <p style={{ background: "#2b2560", padding: 20, borderRadius: 20 }}>
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
                      onChange={(e) => setFormAuth({ ...formAuth, telefono: e.target.value })}
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
                        placeholder="Bloque *"
                        value={formAuth.bloque}
                        onChange={(e) => setFormAuth({ ...formAuth, bloque: e.target.value })}
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        placeholder="Escalera *"
                        value={formAuth.escalera}
                        onChange={(e) => setFormAuth({ ...formAuth, escalera: e.target.value })}
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
                      value={`${formAuth.calle}${formAuth.numero ? `, Nº ${formAuth.numero}` : ""}${formAuth.bloque ? `, Bloque ${formAuth.bloque}` : ""}${formAuth.escalera ? `, Esc. ${formAuth.escalera}` : ""}`}
                      readOnly
                      style={inputStyle}
                    />

                    <button
                      onClick={async () => {
                        console.log("=== INICIO DE REGISTRO ===");
                        
                        if (!formAuth.nombre || !formAuth.telefono || !formAuth.email || !formAuth.password || !formAuth.confirmEmail || !formAuth.confirmPassword || !formAuth.calle || !formAuth.numero || !formAuth.bloque || !formAuth.escalera || !formAuth.cp || !formAuth.provincia || !formAuth.poblacion || !formAuth.pais) {
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
                          const direccionCompleta = `${formAuth.calle.trim()}, Nº ${formAuth.numero.trim()}, Bloque ${formAuth.bloque.trim()}, Esc. ${formAuth.escalera.trim()}`;
                          const nuevoUsuario = {
                            id: Date.now(),
                            nombre: formAuth.nombre,
                            email: formAuth.email,
                            telefono: formAuth.telefono,
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
                            confirmEmail: "", calle: "", bloque: "", escalera: "", numero: "", cp: "", provincia: "", poblacion: "", pais: "España", confirmPassword: "",
                            codigoVerificacion: "", codigoIngresado: "", pasoVerificacion: 1
                          });
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
                      onClick={() => setFormAuth({ ...formAuth, pasoVerificacion: 1 })}
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
                            confirmEmail: "", calle: "", bloque: "", escalera: "", numero: "", cp: "", provincia: "", poblacion: "", pais: "España", confirmPassword: "",
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

      {/* CARRITO */}
      {pagina === "carrito" && (
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
              <p style={{ fontSize: 18, color: "gold" }}>TOTAL: {totalPreview.toFixed(2)} €</p>
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
                onClick={enviarPedidoWhatsApp}
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

      {/* Contador de visitas */}
      <div style={{ position: "fixed", bottom: 30, left: 30, zIndex: 1000 }}>
        <div style={{
          background: "#2b2560",
          border: "2px solid gold",
          borderRadius: 30,
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10
        }}>
          <span>👥</span>
          <span>{visitas} visitas</span>
        </div>
      </div>
      
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
            padding: 25,
            width: "90%",
            maxWidth: 520
          }}>
            <h3 style={{ color: "gold", marginBottom: 20 }}>✏️ Editar usuario</h3>

            <input
              type="text"
              placeholder="Nombre"
              value={editUsuarioForm.nombre}
              onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, nombre: e.target.value })}
              style={inputStyle}
            />

            <input
              type="email"
              placeholder="Email"
              value={editUsuarioForm.email}
              onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, email: e.target.value })}
              style={inputStyle}
            />

            <input
              type="tel"
              placeholder="Teléfono"
              value={editUsuarioForm.telefono}
              onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, telefono: e.target.value })}
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="Dirección"
              value={editUsuarioForm.direccion}
              onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, direccion: e.target.value })}
              style={inputStyle}
            />

            <label style={{ display: "flex", alignItems: "center", gap: 8, color: "white", marginBottom: 20 }}>
              <input
                type="checkbox"
                checked={editUsuarioForm.verificado}
                onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, verificado: e.target.checked })}
              />
              Usuario verificado
            </label>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  setModalEditarUsuarioAbierto(false);
                  setEditUsuarioForm(null);
                }}
                style={{
                  flex: 1,
                  background: "transparent",
                  color: "gold",
                  border: "2px solid gold",
                  borderRadius: 12,
                  padding: 10,
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicionUsuario}
                style={{
                  flex: 1,
                  background: "gold",
                  color: "#1b1745",
                  border: "none",
                  borderRadius: 12,
                  padding: 10,
                  cursor: "pointer",
                  fontWeight: "bold"
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