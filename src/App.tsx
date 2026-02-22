import { useState, useEffect } from "react";
import Tienda from "./Tienda";
import Carrito from "./Carrito";
import Notificacion from "./Notificacion";
import ModalConfirmacion from "./ModalConfirmacion";
import "./Notificacion.css";

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
}

export interface ItemCarrito extends Producto {
  cantidad: number;
}

export default function App() {
  const [pagina, setPagina] = useState<"inicio" | "tienda" | "carrito">("inicio");
  const [cart, setCart] = useState<ItemCarrito[]>([]);
  const [notificacion, setNotificacion] = useState<{ mensaje: string; tipo: "normal" | "exito" | "error" } | null>(null);
  const [mostrarAvisoCookies, setMostrarAvisoCookies] = useState(false);
  const [visitas, setVisitas] = useState(0);
  const [recientes, setRecientes] = useState<Producto[]>([]);
  const [mostrarVisitantes, setMostrarVisitantes] = useState(false);
  const [visitantes, setVisitantes] = useState<string[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mostrarAdmin, setMostrarAdmin] = useState(false);
  const [claveAdmin, setClaveAdmin] = useState("");
  const [accesoAdmin, setAccesoAdmin] = useState(false);

  // ========== TODOS LOS PRODUCTOS CON STOCK = 3 ==========
  const [velas, setVelas] = useState<Producto[]>([
  { id: 1, nombre: "Vela Blanca", precio: 12.5, stock: 1 },
    { id: 2, nombre: "Vela Roja", precio: 14.9, stock: 2 },
    { id: 3, nombre: "Vela Verde", precio: 13.5, stock: 3 },
    { id: 4, nombre: "Vela Azul", precio: 15.0, stock: 4 },
    { id: 5, nombre: "Vela Negra", precio: 16.5, stock: 5 },
    { id: 6, nombre: "Vela Rosa", precio: 13.9, stock: 6 },
    { id: 7, nombre: "Vela Dorada", precio: 18.0, stock: 7 },
    { id: 8, nombre: "Vela Plateada", precio: 17.5, stock: 8 },
    { id: 9, nombre: "Vela Lavanda", precio: 12.9, stock: 9 },
    { id: 10, nombre: "Vela Canela", precio: 13.2, stock: 10 },
     { id: 11, nombre: "Vela Blanca", precio: 12.5, stock: 11 },
    { id: 12, nombre: "Vela Roja", precio: 14.9, stock: 12 },
    { id: 13, nombre: "Vela Verde", precio: 13.5, stock: 13 },
    { id: 14, nombre: "Vela Azul", precio: 15.0, stock:14 },
    { id: 15, nombre: "Vela Negra", precio: 16.5, stock: 15 },
    { id: 16, nombre: "Vela Rosa", precio: 13.9, stock: 16 },
    { id: 17, nombre: "Vela Dorada", precio: 18.0, stock:17 },
    { id: 18, nombre: "Vela Plateada", precio: 17.5, stock:18 },
    { id: 19, nombre: "Vela Lavanda", precio: 12.9, stock:19 },
    { id: 20, nombre: "Vela Canela", precio: 13.2, stock:20 },
     { id: 21, nombre: "Vela Blanca", precio: 12.5, stock: 21 },
    { id: 22, nombre: "Vela Roja", precio: 14.9, stock: 22 },
    { id: 23, nombre: "Vela Verde", precio: 13.5, stock: 23 },
    { id: 24, nombre: "Vela Azul", precio: 15.0, stock:24 },
    { id: 25, nombre: "Vela Negra", precio: 16.5, stock: 25 },
    { id: 26, nombre: "Vela Rosa", precio: 13.9, stock: 26 },
    { id: 27, nombre: "Vela Dorada", precio: 18.0, stock:27 },
    { id: 28, nombre: "Vela Plateada", precio: 17.5, stock:28 },
    { id: 29, nombre: "Vela Lavanda", precio: 12.9, stock:29 },
    { id: 30, nombre: "Vela Canela", precio: 13.2, stock:30 },
  ]);

  const [inciensos, setInciensos] = useState<Producto[]>([
    { id: 101, nombre: "Incienso Sándalo", precio: 6.5, stock: 3 },
    { id: 102, nombre: "Incienso Lavanda", precio: 5.9, stock: 3 },
    { id: 103, nombre: "Incienso Ruda", precio: 7.2, stock: 3 },
    { id: 104, nombre: "Incienso Jazmín", precio: 6.8, stock: 3 },
    { id: 105, nombre: "Incienso Palo Santo", precio: 8.5, stock: 3 },
    { id: 106, nombre: "Incienso Mirra", precio: 7.9, stock: 3 },
    { id: 107, nombre: "Incienso Canela", precio: 6.4, stock: 3 },
    { id: 108, nombre: "Incienso Rosa", precio: 6.1, stock: 3 },
    { id: 109, nombre: "Incienso Lavanda Premium", precio: 9.5, stock: 3 },
    { id: 110, nombre: "Incienso Protección", precio: 7.7, stock: 3 },
  ]);

  const [figuras, setFiguras] = useState<Producto[]>([
    { id: 201, nombre: "Buda Dorado", precio: 35, stock: 3 },
    { id: 202, nombre: "Buda Meditación", precio: 42, stock: 3 },
    { id: 203, nombre: "Figura Protección", precio: 28, stock: 3 },
    { id: 204, nombre: "Buda Prosperidad", precio: 39, stock: 3 },
    { id: 205, nombre: "Buda Blanco", precio: 33, stock: 3 },
    { id: 206, nombre: "Figura Ángel", precio: 24, stock: 3 },
    { id: 207, nombre: "Ganesh", precio: 48, stock: 3 },
    { id: 208, nombre: "Figura Energía", precio: 29, stock: 3 },
    { id: 209, nombre: "Buda Negro", precio: 37, stock: 3 },
    { id: 210, nombre: "Figura Paz", precio: 26, stock: 3 },
  ]);

  // Cargar datos guardados al iniciar
  useEffect(() => {
    const carritoGuardado = localStorage.getItem("carritoMaika");
    if (carritoGuardado) {
      setCart(JSON.parse(carritoGuardado));
    }

    const visitasGuardadas = localStorage.getItem("visitasMaika");
    const nuevasVisitas = visitasGuardadas ? parseInt(visitasGuardadas) + 1 : 1;
    setVisitas(nuevasVisitas);
    localStorage.setItem("visitasMaika", nuevasVisitas.toString());

    const visitantesGuardados = localStorage.getItem("visitantesMaika");
    if (visitantesGuardados) {
      setVisitantes(JSON.parse(visitantesGuardados));
    }

    const fecha = new Date();
    const nuevaVisita = `${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}`;
    const nuevasVisitasLista = [nuevaVisita, ...(visitantesGuardados ? JSON.parse(visitantesGuardados) : [])].slice(0, 10);
    setVisitantes(nuevasVisitasLista);
    localStorage.setItem("visitantesMaika", JSON.stringify(nuevasVisitasLista));

    const recientesGuardados = localStorage.getItem("recientesMaika");
    if (recientesGuardados) {
      setRecientes(JSON.parse(recientesGuardados));
    }

    const avisoVisto = localStorage.getItem("avisoCookiesVisto");
    if (!avisoVisto) {
      setMostrarAvisoCookies(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("carritoMaika", JSON.stringify(cart));
  }, [cart]);

  const total = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  const mostrarNotificacion = (mensaje: string, tipo: "normal" | "exito" | "error" = "normal") => {
    setNotificacion({ mensaje, tipo });
  };

  const agregarAlCarrito = (producto: Producto) => {
   if (producto.stock <= 0) {
  mostrarNotificacion(`No hay más stock de ${producto.nombre}`, "error");
  return;
}

    setCart((prev) => {
      const existe = prev.find((p) => p.id === producto.id);
      if (existe) {
        return prev.map((p) =>
          p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });

    // Actualizar stock
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
    
    const nuevosRecientes = [producto, ...recientes.filter(p => p.id !== producto.id)].slice(0, 5);
    setRecientes(nuevosRecientes);
    localStorage.setItem("recientesMaika", JSON.stringify(nuevosRecientes));
    
    mostrarNotificacion(`${producto.nombre} añadido al carrito`, "normal");
  };

  const cambiarCantidad = (id: number, incremento: number) => {
  setCart(prev => {
    const item = prev.find(p => p.id === id);
    if (!item) return prev;

    // 🔴 DEVOLVER STOCK SI RESTAS
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
        p.id === id
          ? { ...p, cantidad: Math.max(0, p.cantidad + incremento) }
          : p
      )
      .filter(p => p.cantidad > 0);
  });
};

  const vaciarCarrito = () => {
    if (cart.length === 0) {
      mostrarNotificacion("El carrito ya está vacío", "error");
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
  const enviarPedidoWhatsApp = () => {
    if (cart.length === 0) {
      mostrarNotificacion("El carrito está vacío", "error");
      return;
    }

    let mensaje = "Hola Maika, quiero realizar el siguiente pedido:\n\n";
    cart.forEach((item) => {
      mensaje += `• ${item.nombre} x${item.cantidad} - ${(item.precio * item.cantidad).toFixed(2)} €\n`;
    });
    mensaje += `\nTotal: ${total.toFixed(2)} €`;

    const url = `https://wa.me/34673175547?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
    
    setCart([]);
    setPagina("inicio");
    mostrarNotificacion("¡Pedido enviado! El carrito se ha vaciado", "exito");
  };

  const aceptarCookies = () => {
    setMostrarAvisoCookies(false);
    localStorage.setItem("avisoCookiesVisto", "true");
  };

  return (
    <div style={{ background: "#1b1745", minHeight: "100vh", padding: 40, color: "gold", position: "relative" }}>

      {mostrarAvisoCookies && (
        <div style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          right: 20,
          background: "#2b2560",
          border: "2px solid gold",
          borderRadius: 15,
          padding: "20px 25px",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 15
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            <span style={{ fontSize: "2rem" }}>🍪</span>
            <p style={{ color: "white", margin: 0 }}>
              Usamos cookies para mejorar tu experiencia.
            </p>
          </div>
          <button onClick={aceptarCookies} style={{ background: "gold", color: "#1b1745", border: "none", padding: "10px 30px", borderRadius: 30, cursor: "pointer", fontWeight: "bold" }}>
            Aceptar
          </button>
        </div>
      )}

      <div style={{ position: "fixed", bottom: 30, left: 30, zIndex: 1000 }}>
        <div onClick={() => setMostrarVisitantes(!mostrarVisitantes)} style={{
          background: "linear-gradient(135deg, #2b2560 0%, #3a2e8a 100%)",
          border: "3px solid gold",
          borderRadius: 50,
          padding: "15px 30px",
          boxShadow: "0 0 40px rgba(255, 215, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          gap: 15,
          cursor: "pointer"
        }}>
          <span style={{ fontSize: "2rem" }}>🔥</span>
          <div>
            <div style={{ color: "gold", fontSize: "1rem" }}>ÚLTIMAS VISITAS</div>
            <div style={{ color: "white", fontSize: "1.5rem", fontWeight: "bold" }}>
              {visitas} <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>almas</span>
            </div>
          </div>
        </div>

        {mostrarVisitantes && (
          <div style={{
            position: "absolute",
            bottom: 100,
            left: 0,
            background: "#2b2560",
            border: "3px solid gold",
            borderRadius: 30,
            padding: "20px",
            width: 300,
            zIndex: 1001
          }}>
            <h3 style={{ color: "gold", marginBottom: 10 }}>👥 Últimas visitas</h3>
            {visitantes.map((v, i) => (
              <div key={i} style={{ padding: "5px", color: "white", borderBottom: "1px solid rgba(255,215,0,0.2)" }}>
                🕯️ {v}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PANEL ADMIN CON CONTRASEÑA */}
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
            width: 280,
            boxShadow: "0 0 30px gold",
            zIndex: 2001
          }}>
            {!accesoAdmin ? (
              <>
                <h3 style={{ color: "gold", marginBottom: 15, textAlign: "center" }}>
                  🔐 ACCESO RESTRINGIDO
                </h3>
                <input
                  type="password"
                  placeholder="Introduce la clave"
                  value={claveAdmin}
                  onChange={(e) => setClaveAdmin(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 15,
                    border: "2px solid gold",
                    background: "#1b1745",
                    color: "gold",
                    marginBottom: 10,
                    outline: "none"
                  }}
                />
                <button
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
                    background: "gold",
                    color: "#1b1745",
                    border: "none",
                    padding: "10px",
                    borderRadius: 15,
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
                <h3 style={{ color: "gold", marginBottom: 15, textAlign: "center" }}>
                  🔧 PANEL MAIKA
                </h3>
                
                <div style={{ marginBottom: 15 }}>
                  <p style={{ color: "gold", marginBottom: 5 }}>🕯️ Velas</p>
                  <button
                    onClick={() => setVelas(prev => prev.map(v => ({ ...v, stock: v.stock + 5 })))}
                    style={{
                      background: "#4caf50",
                      color: "white",
                      border: "none",
                      padding: "8px",
                      borderRadius: 15,
                      cursor: "pointer",
                      width: "100%",
                      marginBottom: 5,
                      fontWeight: "bold"
                    }}
                  >
                    +5 a todas
                  </button>
                  <button
                    onClick={() => setVelas(prev => prev.map(v => ({ ...v, stock: 3 })))}
                    style={{
                      background: "#ffaa00",
                      color: "#1b1745",
                      border: "none",
                      padding: "8px",
                      borderRadius: 15,
                      cursor: "pointer",
                      width: "100%",
                      fontWeight: "bold"
                    }}
                  >
                    Reset a 3
                  </button>
                </div>

                <div style={{ marginBottom: 15 }}>
                  <p style={{ color: "gold", marginBottom: 5 }}>🌿 Inciensos</p>
                  <button
                    onClick={() => setInciensos(prev => prev.map(i => ({ ...i, stock: i.stock + 5 })))}
                    style={{
                      background: "#4caf50",
                      color: "white",
                      border: "none",
                      padding: "8px",
                      borderRadius: 15,
                      cursor: "pointer",
                      width: "100%",
                      marginBottom: 5,
                      fontWeight: "bold"
                    }}
                  >
                    +5 a todas
                  </button>
                  <button
                    onClick={() => setInciensos(prev => prev.map(i => ({ ...i, stock: 3 })))}
                    style={{
                      background: "#ffaa00",
                      color: "#1b1745",
                      border: "none",
                      padding: "8px",
                      borderRadius: 15,
                      cursor: "pointer",
                      width: "100%",
                      fontWeight: "bold"
                    }}
                  >
                    Reset a 3
                  </button>
                </div>

                <div style={{ marginBottom: 15 }}>
                  <p style={{ color: "gold", marginBottom: 5 }}>🪷 Figuras</p>
                  <button
                    onClick={() => setFiguras(prev => prev.map(f => ({ ...f, stock: f.stock + 5 })))}
                    style={{
                      background: "#4caf50",
                      color: "white",
                      border: "none",
                      padding: "8px",
                      borderRadius: 15,
                      cursor: "pointer",
                      width: "100%",
                      marginBottom: 5,
                      fontWeight: "bold"
                    }}
                  >
                    +5 a todas
                  </button>
                  <button
                    onClick={() => setFiguras(prev => prev.map(f => ({ ...f, stock: 3 })))}
                    style={{
                      background: "#ffaa00",
                      color: "#1b1745",
                      border: "none",
                      padding: "8px",
                      borderRadius: 15,
                      cursor: "pointer",
                      width: "100%",
                      fontWeight: "bold"
                    }}
                  >
                    Reset a 3
                  </button>
                </div>

                <button
                  onClick={() => {
                    setVelas(prev => prev.map(v => ({ ...v, stock: v.stock + 10 })));
                    setInciensos(prev => prev.map(i => ({ ...i, stock: i.stock + 10 })));
                    setFiguras(prev => prev.map(f => ({ ...f, stock: f.stock + 10 })));
                    mostrarNotificacion("✨ Stock aumentado +10 en todos los productos", "exito");
                  }}
                  style={{
                    background: "gold",
                    color: "#1b1745",
                    border: "none",
                    padding: "10px",
                    borderRadius: 20,
                    cursor: "pointer",
                    width: "100%",
                    fontWeight: "bold",
                    marginTop: 10
                  }}
                >
                  ✨ +10 A TODO
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
                    borderRadius: 15,
                    cursor: "pointer",
                    width: "100%",
                    marginTop: 10
                  }}
                >
                  Cerrar sesión
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {notificacion && (
        <div className="notificacion-container">
          <Notificacion mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion(null)} />
        </div>
      )}

      {pagina !== "carrito" && (
        <div onClick={() => setPagina("carrito")} style={{
          position: "fixed",
          top: 20,
          right: 20,
          border: "2px solid gold",
          borderRadius: 30,
          padding: "12px 25px",
          background: "#1b1745",
          cursor: "pointer",
          fontWeight: "bold",
          zIndex: 1000
        }}>
          🛒 {cart.reduce((sum, i) => sum + i.cantidad, 0)} productos - {total.toFixed(2)} €
        </div>
      )}

      {pagina === "inicio" && (
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 40 }}>MAIKA LA RUTA DEL ALMA</h1>
          <p>Guía espiritual para reencontrarte contigo</p>

          {/* BOTÓN CON IMAGEN */}
          <div 
            onClick={() => setPagina("tienda")}
            style={{
              position: "relative",
              width: "50%",
              maxWidth: "400px",
              marginTop: 30,
              marginLeft: "auto",
              marginRight: "auto",
              borderRadius: 30,
              overflow: "hidden",
              cursor: "pointer",
              border: "3px solid gold",
              boxShadow: "0 0 30px rgba(255,215,0,0.5)",
              transition: "transform 0.3s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <img 
              src="/tienda.jpg" 
              alt="Tienda espiritual"
              style={{
                width: "100%",
                height: "auto",
                display: "block"
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                console.log("Imagen no encontrada");
              }}
            />
            <div style={{
              position: "absolute",
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "gold",
              color: "#1b1745",
              border: "2px solid #1b1745",
              padding: "12px 30px",
              borderRadius: 40,
              fontWeight: "bold",
              fontSize: 18,
              boxShadow: "0 0 20px gold",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.3s",
              whiteSpace: "nowrap"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#ffd700";
              e.currentTarget.style.transform = "translateX(-50%) scale(1.05)";
              e.currentTarget.style.boxShadow = "0 0 30px gold";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "gold";
              e.currentTarget.style.transform = "translateX(-50%) scale(1)";
              e.currentTarget.style.boxShadow = "0 0 20px gold";
            }}>
              ENTRAR A LA TIENDA
            </div>
          </div>

          <div style={{ marginTop: 80 }}>
            <h2>Sobre Maika</h2>
            <p style={{ maxWidth: 600, margin: "auto" }}>
              Te acompaño en procesos personales desde la intuición y la sensibilidad.
            </p>
          </div>

          <div style={{ marginTop: 80 }}>
            <h2>Servicios</h2>
            <div style={{ display: "flex", justifyContent: "center", gap: 25, flexWrap: "wrap", marginTop: 30 }}>
              <div style={{ background: "#2b2560", borderRadius: 20, padding: "25px 20px", width: "240px", border: "2px solid gold" }}>
                <h3 style={{ color: "gold" }}>🔮 Tarot Evolutivo</h3>
                <p style={{ color: "white" }}>Sesión de 60 minutos.</p>
                <button onClick={() => window.open("https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20reservar%20Tarot", "_blank")} style={{ background: "gold", border: "none", padding: "10px", borderRadius: 25, cursor: "pointer", width: "100%" }}>
                  Reservar
                </button>
              </div>
              <div style={{ background: "#2b2560", borderRadius: 20, padding: "25px 20px", width: "240px", border: "2px solid gold" }}>
                <h3 style={{ color: "gold" }}>✨ Limpieza Energética</h3>
                <p style={{ color: "white" }}>Sesión de 45 minutos.</p>
                <button onClick={() => window.open("https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20reservar%20Limpieza", "_blank")} style={{ background: "gold", border: "none", padding: "10px", borderRadius: 25, cursor: "pointer", width: "100%" }}>
                  Reservar
                </button>
              </div>
              <div style={{ background: "#2b2560", borderRadius: 20, padding: "25px 20px", width: "240px", border: "2px solid gold" }}>
                <h3 style={{ color: "gold" }}>🕯️ Ritual Personalizado</h3>
                <p style={{ color: "white" }}>Diseñado para ti.</p>
                <button onClick={() => window.open("https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20consultar%20Ritual", "_blank")} style={{ background: "gold", border: "none", padding: "10px", borderRadius: 25, cursor: "pointer", width: "100%" }}>
                  Consultar
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 80 }}>
            <h2>Testimonios</h2>
            <p>"Sentí claridad y paz después de la primera consulta."</p>
            <p>"Me ayudó a entender lo que estaba viviendo."</p>
          </div>

          <div style={{ marginTop: 80 }}>
            <h2>Pedidos Artículos Carrito</h2>
            <p style={{ fontSize: 18 }}>
              {cart.length} artículos • {cart.reduce((sum, i) => sum + i.cantidad, 0)} productos
            </p>
            <p style={{ fontSize: 18 }}>Total: <strong>{total.toFixed(2)} €</strong></p>
            
            <button onClick={enviarPedidoWhatsApp} style={{ marginTop: 20, background: "gold", color: "#1b1745", border: "none", padding: "12px 30px", borderRadius: 30, cursor: "pointer", fontWeight: "bold", marginRight: 10 }}>
              🛒 Realizar Compra por WhatsApp
            </button>

            {cart.length > 0 && (
              <button onClick={vaciarCarrito} style={{ marginTop: 20, background: "gold", color: "#1b1745", border: "none", padding: "12px 30px", borderRadius: 30, cursor: "pointer", fontWeight: "bold", boxShadow: "0 0 15px rgba(255, 215, 0, 0.5)" }}>
                🗑️ Vaciar carrito
              </button>
            )}
          </div>

          <div style={{ marginTop: 80, marginBottom: 40 }}>
            <h2>Contacto</h2>
            <a href="https://wa.me/34673175547" target="_blank" style={{ display: "inline-block", background: "gold", color: "#1b1745", padding: "12px 30px", borderRadius: 30, textDecoration: "none", fontWeight: "bold" }}>
              📱 Iniciar por WhatsApp
            </a>
          </div>
        </div>
      )}

      {pagina === "tienda" && (
        <Tienda 
          velas={velas}
          inciensos={inciensos}
          figuras={figuras}
          agregarAlCarrito={agregarAlCarrito} 
          volver={() => setPagina("inicio")} 
        />
      )}

      {pagina === "carrito" && (
        <Carrito 
          cart={cart} 
          total={total} 
          cambiarCantidad={cambiarCantidad} 
          volver={() => setPagina("tienda")} 
        />
      )}

      <ModalConfirmacion
        abierto={modalAbierto}
        mensaje="Vas a vaciar tu carrito. ¿Estás segura?"
        onConfirmar={confirmarVaciarCarrito}
        onCancelar={() => setModalAbierto(false)}
      />

    </div>
  );
}