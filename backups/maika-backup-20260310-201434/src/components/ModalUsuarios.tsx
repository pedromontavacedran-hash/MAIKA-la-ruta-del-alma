import { useState, useEffect } from "react";
import type { Usuario } from "../App";
import ModalConfirmacion from "../ModalConfirmacion";

interface ModalUsuariosProps {
  abierto: boolean;
  usuarios: Usuario[];
  onClose: () => void;
  mostrarNotificacion: (mensaje: string, tipo?: "normal" | "exito" | "error") => void;
  onEditUsuario?: (usuario: Usuario) => void;
  onUpdateUsuario?: (nuevosUsuarios: Usuario[]) => void;
  onDeleteUsuario?: (id: number | string) => void;
}

export default function ModalUsuarios({
  abierto,
  usuarios,
  onClose,
  mostrarNotificacion,
  onEditUsuario,
  onUpdateUsuario,
  onDeleteUsuario
}: ModalUsuariosProps) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "verificados" | "pendientes">("todos");
  const [usuariosState, setUsuariosState] = useState<Usuario[]>(usuarios);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);

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

  const handleEliminarConfirmado = () => {
    if (!usuarioAEliminar) return;
    
    const usuario = usuarioAEliminar;
    const nuevos = usuariosState.filter((u: Usuario) => u.id !== usuario.id);
    localStorage.setItem("usuarios", JSON.stringify(nuevos));
    setUsuariosState(nuevos);

    if (onDeleteUsuario) {
      onDeleteUsuario(usuario.id);
    } else {
      // Fallback en caso de que no se pase la prop onDeleteUsuario
      const usuarioActual = localStorage.getItem("usuarioActual");
      if (usuarioActual) {
        const usuarioLogueado = JSON.parse(usuarioActual) as Usuario;
        if (usuarioLogueado.id === usuario.id || usuarioLogueado.email.toLowerCase() === usuario.email.toLowerCase()) {
          localStorage.removeItem("usuarioActual");
          window.location.reload();
        }
      }
    }
    
    mostrarNotificacion(`✅ Usuario ${usuario.nombre} eliminado`, "exito");
    setUsuarioAEliminar(null);
  };

  const handleEliminar = (usuario: Usuario) => {
    setUsuarioAEliminar(usuario);
  };

  const handleVerificar = (usuario: Usuario) => {
    const nuevos = usuariosState.map((u: Usuario) =>
      u.id === usuario.id ? { ...u, verificado: !u.verificado } : u
    );
    localStorage.setItem("usuarios", JSON.stringify(nuevos));
    setUsuariosState(nuevos);

    if (onUpdateUsuario) {
      onUpdateUsuario(nuevos);
    }

    // Actualizamos el usuario logueado en App si es el mismo
    const usuarioActual = localStorage.getItem("usuarioActual");
    if (usuarioActual) {
      const usuarioLogueado = JSON.parse(usuarioActual) as Usuario;
      if (usuarioLogueado.id === usuario.id || usuarioLogueado.email.toLowerCase() === usuario.email.toLowerCase()) {
        const usuarioActualizado = nuevos.find(u => u.id === usuario.id);
        if (usuarioActualizado) {
          localStorage.setItem("usuarioActual", JSON.stringify(usuarioActualizado));
        }
      }
    }
    
    mostrarNotificacion(`✅ Usuario ${!usuario.verificado ? "verificado" : "desverificado"} correctamente`, "exito");
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
              const usuariosLocal = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
              setUsuariosState(usuariosLocal);
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
      
      {/* MODAL DE CONFIRMACIÓN DE ELIMINAR */}
      <ModalConfirmacion
        abierto={usuarioAEliminar !== null}
        mensaje={`¿Seguro que quieres eliminar a ${usuarioAEliminar?.nombre}? Esta acción no se puede deshacer.`}
        onConfirmar={handleEliminarConfirmado}
        onCancelar={() => setUsuarioAEliminar(null)}
        textoConfirmar="Eliminar usuario"
      />
    </div>
  );
}

