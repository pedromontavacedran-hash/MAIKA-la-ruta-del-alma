import { useState, useEffect, type ReactNode } from "react";
import type { Usuario } from "../App";
import ModalConfirmacion from "../ModalConfirmacion";
import AdminPageNav from "./admin/AdminPageNav";
import { THEME } from "../config";
import { eliminarUsuarioBackendApi, getJwtTokenParaOperacionesUsuarios } from "../services/apiAuth";
import { lineaCompletaDesdeDatosEnvio } from "../utils/pedidos/direccionPedidoVista";
import { notificarExito } from "../utils/ui/notificaciones";

interface ModalUsuariosProps {
  abierto: boolean;
  usuarios: Usuario[];
  onClose: () => void;
  /** Prepara y muestra el formulario embebido debajo. */
  onAbrirFormularioAltaAdmin?: () => void;
  panelAltaUsuario?: ReactNode;
  mostrarNotificacion: (mensaje: string, tipo?: "normal" | "exito" | "error") => void;
  onEditUsuario?: (usuario: Usuario) => void;
  /** Si se pasa, la fila y el botón 🔎 abren la ficha detalle. */
  onVerDetalle?: (usuario: Usuario) => void;
  onUpdateUsuario?: (nuevosUsuarios: Usuario[]) => void;
  onDeleteUsuario?: (id: number | string) => void;
  onRefreshUsuarios?: () => void;
}

function direccionPrincipalMostrar(u: Usuario): string {
  return lineaCompletaDesdeDatosEnvio({
    calle: u.calle,
    numero: u.numero,
    bloque: u.bloque,
    escalera: u.escalera,
    piso: u.piso,
    puerta: u.puerta,
    cp: u.cp,
    poblacion: u.poblacion,
    ciudad: (u as { ciudad?: string }).ciudad,
    provincia: u.provincia,
    pais: u.pais,
    direccion: u.direccion
  });
}

export default function ModalUsuarios({
  abierto,
  usuarios,
  onClose,
  onAbrirFormularioAltaAdmin,
  panelAltaUsuario,
  mostrarNotificacion,
    onEditUsuario,
  onVerDetalle,
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

  const jwtUsuariosOps =
    typeof localStorage !== "undefined" && !!getJwtTokenParaOperacionesUsuarios();

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

  const handleEliminarConfirmado = async () => {
    if (!usuarioAEliminar) return;

    const usuario = usuarioAEliminar;
    const token = getJwtTokenParaOperacionesUsuarios();
    if (token) {
      try {
        const r = await eliminarUsuarioBackendApi(token, usuario.id);
        if (r.ok === false) {
          if (r.status === 401) {
            mostrarNotificacion(
              "❌ Sesión caducada o sin permiso. Inicia sesión (cuenta con API) y vuelve a borrar para eliminar también en el servidor.",
              "error"
            );
            return;
          }
          mostrarNotificacion(
            `⚠️ El servidor respondió ${r.status}. Se elimina en este dispositivo; revisa el backend si hace falta.`,
            "normal"
          );
        }
      } catch {
        mostrarNotificacion(
          "⚠️ No hubo respuesta del servidor. Se elimina solo en local.",
          "normal"
        );
      }
    }

    const nuevos = usuariosState.filter((u: Usuario) => u.id !== usuario.id);
    setUsuariosState(nuevos);

    if (onDeleteUsuario) {
      onDeleteUsuario(usuario.id);
    }
    
    notificarExito(mostrarNotificacion, `✅ Usuario ${usuario.nombre} eliminado`);
    setUsuarioAEliminar(null);
  };

  const handleEliminar = (usuario: Usuario) => {
    setUsuarioAEliminar(usuario);
  };

  const handleVerificar = (usuario: Usuario) => {
    const nuevos = usuariosState.map((u: Usuario) =>
      u.id === usuario.id ? { ...u, verificado: !u.verificado } : u
    );
    setUsuariosState(nuevos);

    if (onUpdateUsuario) {
      onUpdateUsuario(nuevos);
    }

    notificarExito(mostrarNotificacion, `✅ Usuario ${!usuario.verificado ? "verificado" : "desverificado"} correctamente`);
  };

  const exportarCSV = () => {
    const csv = [
      ["Nombre", "Email", "Teléfono", "Dirección", "Verificado", "Pedidos"],
      ...usuariosState.map((u: Usuario) => [
        u.nombre,
        u.email,
        u.telefono || "",
        direccionPrincipalMostrar(u) || "",
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
    <>
    <div className="admin-container gestion-usuarios-vista">
      <AdminPageNav onVolver={onClose} etiqueta="← Volver al panel admin" />

        <header
          style={{
            marginBottom: 18,
            borderBottom: `1px solid color-mix(in srgb, ${THEME.goldMain} 22%, transparent)`,
            paddingBottom: 10
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 4
            }}
          >
            <h1 style={{ color: THEME.goldMain, margin: 0, fontSize: "clamp(1.5rem, 4vw, 2.25rem)" }}>
              👥 Gestión de usuarios
            </h1>
            {onAbrirFormularioAltaAdmin && !panelAltaUsuario ? (
              <button
                type="button"
                className="btn-admin-limpio admin-btn admin-btn--ghost admin-btn--inline admin-btn-small"
                onClick={() => onAbrirFormularioAltaAdmin()}
              >
                + Nuevo usuario
              </button>
            ) : null}
          </div>
          <p style={{ color: "white", margin: "8px 0 0", opacity: 0.9, fontSize: 18 }}>
            Total: {usuariosState.length} usuarios | Verificados: {usuariosState.filter((u: Usuario) => u.verificado).length} | Pendientes: {usuariosState.filter((u: Usuario) => !u.verificado).length}
          </p>
          <p style={{ color: "rgba(255,255,255,0.72)", margin: "10px 0 0", fontSize: 13, lineHeight: 1.4 }}>
            {jwtUsuariosOps
              ? "Usuarios sincronizados (API + local)"
              : "Listado en este navegador; con sesión API se combina con el servidor al actualizar"}
          </p>
          <details
            className="gestion-usuarios-info-details"
            style={{ marginTop: 4, color: "rgba(255,255,255,0.78)", fontSize: 13, lineHeight: 1.45 }}
          >
            <summary
              style={{
                cursor: "pointer",
                color: `color-mix(in srgb, ${THEME.goldMain} 72%, transparent)`,
                fontWeight: 500,
                fontSize: 12,
                letterSpacing: "0.02em",
                userSelect: "none",
                listStyle: "none"
              }}
            >
              ℹ️ Información
            </summary>
            <div style={{ marginTop: 10, paddingLeft: 10, borderLeft: `2px solid rgba(212,175,55,0.3)` }}>
              {jwtUsuariosOps ? (
                <p style={{ margin: "0 0 10px", color: "rgba(255,255,255,0.82)" }}>
                  Listado del servidor (API) combinado con usuarios que solo existen en este dispositivo (sin duplicar por email o móvil).
                </p>
              ) : null}
              <p style={{ margin: 0, color: "rgba(255,220,180,0.92)" }}>
                Si limpias <strong>datos del sitio</strong> en el navegador, se borra la copia local en este equipo. Con el backend en marcha, la app{" "}
                <strong>reintenta varias veces</strong> descargar usuarios del servidor al cargar, y de nuevo al <strong>volver la conexión</strong> o{" "}
                <strong>cambiar a esta pestaña</strong>. Cada vez que pulsas <strong>Actualizar</strong> y la API responde, la copia local se{" "}
                <strong>iguala</strong> a la lista fusionada (servidor + este navegador).
              </p>
            </div>
          </details>
        </header>

        {onAbrirFormularioAltaAdmin && panelAltaUsuario ? (
          <div
            style={{
              marginBottom: 24,
              maxHeight: "min(78vh, 920px)",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch"
            }}
          >
            {panelAltaUsuario}
          </div>
        ) : null}

        {/* FILTROS Y ACCIONES */}
        <div style={{
          display: "flex",
          gap: 15,
          marginTop: 6,
          marginBottom: 25,
          flexWrap: "wrap",
          alignItems: "center"
        }}>
          <div style={{ flex: 1, minWidth: 250 }}>
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, email o teléfono"
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
              console.log("ModalUsuarios Actualizar: click → onRefreshUsuarios");
              if (onRefreshUsuarios) {
                onRefreshUsuarios();
              } else {
                setUsuariosState(usuarios);
                onUpdateUsuario?.(usuarios);
              }
              notificarExito(mostrarNotificacion, "🔄 Lista actualizada");
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
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
              <colgroup>
                <col style={{ width: 40 }} />
                <col style={{ width: 220 }} />
                <col style={{ width: 280 }} />
                <col style={{ width: 360 }} />
                <col style={{ width: 220 }} />
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
                  <th style={{ padding: "12px 12px 12px 24px", textAlign: "center", color: THEME.goldMain, fontSize: 13, minWidth: 220, position: "sticky", right: 0, background: THEME.bg, boxShadow: "-4px 0 8px rgba(0,0,0,0.3)", verticalAlign: "middle" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((usuario: Usuario, index: number) => (
                  (() => {
                    const direccionUi = direccionPrincipalMostrar(usuario) || "—";
                    return (
                  <tr
                    key={usuario.id || index}
                    style={{
                      borderBottom: "1px solid rgba(212,175,55,0.2)",
                      transition: "background 0.2s",
                      cursor: (onVerDetalle || onEditUsuario) ? "pointer" : "default"
                    }}
                    onClick={() => {
                      if (onVerDetalle) onVerDetalle(usuario);
                      else onEditUsuario?.(usuario);
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(212,175,55,0.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "12px 12px", color: THEME.goldMain, fontSize: 14, verticalAlign: "top", textAlign: "left" }}>{index + 1}</td>

                    <td style={{ padding: "12px 12px", verticalAlign: "top", textAlign: "left" }}>
                      <div style={{ minWidth: 0, flex: 1, lineHeight: 1.35, fontSize: 12 }}>
                        <div style={{ color: "white", fontWeight: "bold", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", height: 16 }}>
                          {usuario.nombre}
                        </div>
                        <div style={{ color: THEME.goldMain, fontSize: 11, height: 16, marginTop: 2 }}>
                          ID: {String(usuario.id).slice(-6)}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "12px 12px 12px 28px", verticalAlign: "top", textAlign: "left" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, color: "white", lineHeight: 1.45 }}>
                        <span style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={usuario.email}>
                          {usuario.email || "—"}
                        </span>
                        <span style={{ fontSize: 12, opacity: 0.9 }}>
                          {usuario.telefono || "—"}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: "12px 12px 12px 56px", verticalAlign: "top", textAlign: "left" }}>
                      <div style={{ color: "white", fontSize: 12, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }} title={direccionUi}>
                        {direccionUi}
                      </div>
                    </td>

                    <td style={{ padding: "10px 8px", minWidth: 220, position: "sticky", right: 0, background: THEME.bg, boxShadow: "-4px 0 8px rgba(0,0,0,0.2)", verticalAlign: "middle" }}>
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
                            padding: "5px 8px",
                            borderRadius: 10,
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: "pointer"
                          }}
                        >
                          {usuario.verificado ? "✅" : "⏳"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onVerDetalle) onVerDetalle(usuario);
                            else onEditUsuario?.(usuario);
                          }}
                          style={{
                            background: "transparent",
                            border: `1px solid ${THEME.goldMain}`,
                            color: THEME.goldMain,
                            padding: "5px 8px",
                            borderRadius: 10,
                            cursor: "pointer",
                            fontSize: 12
                          }}
                          title={onVerDetalle ? "Ver ficha (detalle cliente)" : "Editar"}
                        >
                          🔎
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
                            padding: "5px 8px",
                            borderRadius: 10,
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
                    );
                  })()
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

      <ModalConfirmacion
        abierto={usuarioAEliminar !== null}
        mensaje={`¿Seguro que quieres eliminar a ${usuarioAEliminar?.nombre}? Esta acción no se puede deshacer.`}
        onConfirmar={handleEliminarConfirmado}
        onCancelar={() => setUsuarioAEliminar(null)}
        textoConfirmar="Eliminar usuario"
      />
    </>
  );
}

