import { useState, useEffect } from "react";
import type { Usuario } from "../App";
import ModalConfirmacion from "../ModalConfirmacion";
import BotonCerrar from "./BotonCerrar";
import { THEME } from "../config";

function normalizarTelefono(t: string): string {
  const s = (t || "").replace(/\D/g, "").trim();
  if (s.startsWith("0034") && s.length > 4) return s.slice(4);
  if (s.startsWith("34") && s.length > 9) return s.slice(2);
  return s;
}

interface ModalUsuariosProps {
  abierto: boolean;
  usuarios: Usuario[];
  onClose: () => void;
  mostrarNotificacion: (mensaje: string, tipo?: "normal" | "exito" | "error") => void;
  onEditUsuario?: (usuario: Usuario) => void;
  onUpdateUsuario?: (nuevosUsuarios: Usuario[]) => void;
  onDeleteUsuario?: (id: number | string) => void;
  onRefreshUsuarios?: () => void;
}

export default function ModalUsuarios({
  abierto,
  usuarios,
  onClose,
  mostrarNotificacion,
  onEditUsuario,
  onUpdateUsuario,
  onDeleteUsuario,
  onRefreshUsuarios
}: ModalUsuariosProps) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "verificados" | "pendientes">("todos");
  const [usuariosState, setUsuariosState] = useState<Usuario[]>(usuarios);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);

  useEffect(() => {
    setUsuariosState(usuarios);
  }, [usuarios]);

  if (!abierto) return null;

  const busquedaNorm = busqueda.trim().toLowerCase();
  const busquedaDigitos = busqueda.replace(/\D/g, "");
  const usuariosFiltrados = usuariosState
    .filter((u: Usuario) => {
      if (!busqueda.trim()) return true;
      return (
        u.nombre?.toLowerCase().includes(busquedaNorm) ||
        u.email?.toLowerCase().includes(busquedaNorm) ||
        (busquedaDigitos.length > 0 && (u.telefono || "").replace(/\D/g, "").includes(busquedaDigitos))
      );
    })
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
        if (usuarioLogueado.id === usuario.id || (usuario.telefono && usuarioLogueado.telefono && normalizarTelefono(usuarioLogueado.telefono) === normalizarTelefono(usuario.telefono))) {
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
      if (usuarioLogueado.id === usuario.id || (usuario.telefono && usuarioLogueado.telefono && normalizarTelefono(usuarioLogueado.telefono) === normalizarTelefono(usuario.telefono))) {
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
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 0,
        zIndex: 10000,
        backdropFilter: "blur(5px)"
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-usuarios-contenido" style={{
        background: "transparent",
        padding: 40,
        width: "98%",
        maxWidth: 1500,
        maxHeight: "95vh",
        overflowY: "auto",
        position: "relative"
      }} onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div style={{
          marginBottom: 25,
          borderBottom: `2px solid ${THEME.goldMain}`,
          paddingBottom: 15
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <h2 style={{ color: THEME.goldMain, margin: 0, fontSize: 36 }}>
              👥 GESTIÓN DE USUARIOS
            </h2>
            <BotonCerrar onClick={onClose} ariaLabel="Cerrar" title="Cerrar" style={{ marginRight: 4 }} />
          </div>
          <p style={{ color: "white", margin: "8px 0 0", opacity: 0.9, fontSize: 18 }}>
            Total: {usuariosState.length} usuarios | Verificados: {usuariosState.filter((u: Usuario) => u.verificado).length} | Pendientes: {usuariosState.filter((u: Usuario) => !u.verificado).length}
          </p>
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
              placeholder="🔍 Buscar por teléfono"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: "100%",
                padding: "16px 18px",
                borderRadius: 14,
                border: `2px solid ${THEME.goldMain}`,
                background: THEME.bg,
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
              border: `2px solid ${THEME.goldMain}`,
              background: THEME.bg,
              color: THEME.goldMain,
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
              if (onRefreshUsuarios) {
                onRefreshUsuarios();
              } else {
                const usuariosLocal = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
                setUsuariosState(usuariosLocal);
                onUpdateUsuario?.(usuariosLocal);
              }
              mostrarNotificacion("🔄 Lista actualizada", "exito");
            }}
            style={{
              padding: "16px 24px",
              borderRadius: 14,
              border: `2px solid ${THEME.goldMain}`,
              background: "transparent",
              color: THEME.goldMain,
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
            background: THEME.bg,
            borderRadius: 20,
            border: `2px dashed ${THEME.goldMain}`
          }}>
            <span style={{ fontSize: 48 }}>👥</span>
            <p style={{ color: "white", fontSize: 18, marginTop: 10 }}>
              No hay usuarios que coincidan con la búsqueda
            </p>
          </div>
        ) : (
          <div style={{
            background: THEME.bg,
            borderRadius: 20,
            border: `2px solid ${THEME.goldMain}`,
            overflow: "hidden"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: 40 }} />
                <col style={{ width: 160 }} />
                <col style={{ width: 200 }} />
                <col />
                <col style={{ width: 320 }} />
              </colgroup>
              <thead>
                <tr style={{
                  background: THEME.bg,
                  borderBottom: `2px solid ${THEME.goldMain}`,
                  verticalAlign: "middle"
                }}>
                  <th style={{ padding: "12px 12px", textAlign: "left", color: THEME.goldMain, fontSize: 14, verticalAlign: "top" }}>#</th>
                  <th style={{ padding: "12px 12px", textAlign: "left", color: THEME.goldMain, fontSize: 14, verticalAlign: "top" }}>Usuario</th>
                  <th style={{ padding: "12px 12px 12px 28px", textAlign: "left", color: THEME.goldMain, fontSize: 14, verticalAlign: "top" }}>Contacto</th>
                  <th style={{ padding: "12px 12px 12px 56px", textAlign: "left", color: THEME.goldMain, fontSize: 14, verticalAlign: "top" }}>Dirección</th>
                  {/* Acciones: centrado con pelín a la derecha (paddingLeft 72px) — no tocar */}
                  <th style={{ padding: "12px 12px 12px 72px", textAlign: "center", color: THEME.goldMain, fontSize: 14, minWidth: 320, position: "sticky", right: 0, background: THEME.bg, boxShadow: "-4px 0 8px rgba(0,0,0,0.3)", verticalAlign: "middle" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((usuario: Usuario, index: number) => (
                  <tr
                    key={usuario.id || index}
                    style={{
                      borderBottom: "1px solid rgba(212,175,55,0.2)",
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(212,175,55,0.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "12px 12px", color: THEME.goldMain, fontSize: 14, verticalAlign: "top", textAlign: "left" }}>{index + 1}</td>

                    <td style={{ padding: "12px 12px", verticalAlign: "top", textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          minWidth: 36,
                          flexShrink: 0,
                          borderRadius: "50%",
                          background: THEME.goldGradient,
                          color: THEME.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold",
                          fontSize: 15
                        }}>
                          {usuario.nombre?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0, flex: 1, lineHeight: 1.5, fontSize: 14 }}>
                          <div style={{ color: "white", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", height: 21 }}>{usuario.nombre}</div>
                          <div style={{ color: THEME.goldMain, fontSize: 12, height: 18 }}>
                            ID: {String(usuario.id).slice(-6)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "12px 12px 12px 28px", verticalAlign: "top", textAlign: "left" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "22px 1fr", gap: "0 6px", alignItems: "start", color: "white", lineHeight: 1.5 }}>
                        <span style={{ gridColumn: 1, textAlign: "center", fontSize: 14, height: 21, display: "flex", alignItems: "center", justifyContent: "center" }}>📧</span>
                        <span style={{ gridColumn: 2, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220, height: 21 }} title={usuario.email}>{usuario.email}</span>
                        <span style={{ gridColumn: 1, textAlign: "center", fontSize: 12, opacity: 0.9, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>📞</span>
                        <span style={{ gridColumn: 2, fontSize: 12, opacity: 0.9, height: 18 }}>{usuario.telefono || "—"}</span>
                      </div>
                    </td>

                    <td style={{ padding: "12px 12px 12px 56px", verticalAlign: "top", textAlign: "left" }}>
                      <div style={{ color: "white", fontSize: 14, lineHeight: 1.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0, height: 21 }} title={usuario.direccion || ""}>
                        {usuario.direccion || "—"}
                      </div>
                    </td>

                    <td style={{ padding: "12px 12px", minWidth: 320, position: "sticky", right: 0, background: THEME.bg, boxShadow: "-4px 0 8px rgba(0,0,0,0.2)", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "nowrap", justifyContent: "flex-end", alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerificar(usuario);
                          }}
                          title={usuario.verificado ? "Clic para desverificar" : "Clic para verificar"}
                          style={{
                            background: "transparent",
                            border: usuario.verificado ? "1px solid #2ecc71" : `1px solid ${THEME.goldMain}`,
                            color: usuario.verificado ? "#2ecc71" : THEME.goldMain,
                            padding: "8px 12px",
                            borderRadius: 10,
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: "pointer"
                          }}
                        >
                          {usuario.verificado ? "✅" : "⏳"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditUsuario?.(usuario);
                          }}
                          style={{
                            background: "transparent",
                            border: `1px solid ${THEME.goldMain}`,
                            color: THEME.goldMain,
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

        {/* PIE CON ESTADÍSTICAS (se actualiza al hacer clic en ✅/⏳) */}
        <div style={{
          marginTop: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          color: "white",
          background: THEME.bg,
          padding: "18px 22px",
          borderRadius: 15,
          border: `1px solid ${THEME.goldMain}`,
          fontSize: 18,
          lineHeight: 1.4
        }}>
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>📊 Mostrando {usuariosFiltrados.length} de {usuariosState.length} usuarios</div>
          <div style={{ display: "flex", gap: 24, alignItems: "center", flexShrink: 0 }}>
            <span>✅ Verificados: <strong>{usuariosState.filter((u: Usuario) => u.verificado).length}</strong></span>
            <span>⏳ Pendientes: <strong>{usuariosState.filter((u: Usuario) => !u.verificado).length}</strong></span>
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

