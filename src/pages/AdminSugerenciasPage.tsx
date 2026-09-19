import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import type { Sugerencia } from "../types";
import AdminPageNav from "../components/admin/AdminPageNav";
import ModalConfirmacion from "../ModalConfirmacion";
import { THEME } from "../config";
import { isAdminAuthorized } from "../utils/adminAuth";
import { eliminarSugerenciaApi, fetchAdminSugerenciasApi, marcarSugerenciaEstadoApi } from "../services/apiSugerencias";
import { notificarError, notificarExito } from "../utils/ui/notificaciones";

function fechaLegible(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

export default function AdminSugerenciasPage() {
  const { accesoAdmin, setPagina, mostrarNotificacion } = useApp();
  const [sugerencias, setSugerencias] = useState<Sugerencia[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | "pendiente" | "revisada">("pendiente");
  const [idParaEliminar, setIdParaEliminar] = useState<string | null>(null);
  const [idEnAccion, setIdEnAccion] = useState<string | null>(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const lista = await fetchAdminSugerenciasApi();
      setSugerencias(lista);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      notificarError(mostrarNotificacion, `❌ ${m}`);
      setSugerencias([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  const volverDesdeAdmin = () => {
    setPagina(isAdminAuthorized() ? "admin" : "inicio");
  };

  if (!accesoAdmin) {
    return <Navigate to="/" replace />;
  }

  const lista = (sugerencias ?? []).filter((s) => (filtro === "todas" ? true : s.estado === filtro));
  const pendientes = (sugerencias ?? []).filter((s) => s.estado === "pendiente").length;

  const alternarEstado = async (s: Sugerencia) => {
    setIdEnAccion(s.id);
    try {
      const nuevoEstado = s.estado === "pendiente" ? "revisada" : "pendiente";
      const actualizada = await marcarSugerenciaEstadoApi(s.id, nuevoEstado);
      setSugerencias((prev) => (prev ?? []).map((x) => (x.id === s.id ? actualizada : x)));
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      notificarError(mostrarNotificacion, `❌ ${m}`);
    } finally {
      setIdEnAccion(null);
    }
  };

  const confirmarEliminar = async () => {
    if (!idParaEliminar) return;
    const id = idParaEliminar;
    setIdParaEliminar(null);
    setIdEnAccion(id);
    try {
      await eliminarSugerenciaApi(id);
      setSugerencias((prev) => (prev ?? []).filter((x) => x.id !== id));
      notificarExito(mostrarNotificacion, "🗑️ Sugerencia eliminada");
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      notificarError(mostrarNotificacion, `❌ ${m}`);
    } finally {
      setIdEnAccion(null);
    }
  };

  return (
    <div className="admin-container" style={{ maxWidth: 780, margin: "0 auto", padding: "0 16px" }}>
      <AdminPageNav onVolver={volverDesdeAdmin} />
      <h2 style={{ textAlign: "center", color: THEME.goldMain, marginBottom: 8 }}>💡 SUGERENCIAS Y MEJORAS</h2>
      <p style={{ textAlign: "center", color: "rgba(255,255,255,0.85)", marginBottom: 20, fontSize: 14 }}>
        {pendientes > 0 ? `${pendientes} pendiente${pendientes === 1 ? "" : "s"} de revisar` : "No hay sugerencias pendientes"}
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {(["pendiente", "revisada", "todas"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              border: `2px solid ${THEME.goldMain}`,
              background: filtro === f ? THEME.goldMain : "transparent",
              color: filtro === f ? "#1b1745" : THEME.goldMain,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 13,
              textTransform: "capitalize"
            }}
          >
            {f === "todas" ? "Todas" : f === "pendiente" ? "Pendientes" : "Revisadas"}
          </button>
        ))}
      </div>

      {cargando ? (
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.7)" }}>Cargando…</p>
      ) : lista.length === 0 ? (
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.7)" }}>No hay sugerencias en este filtro.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 30 }}>
          {lista.map((s) => (
            <div
              key={s.id}
              style={{
                background: THEME.bg,
                border: `2px solid ${s.estado === "pendiente" ? THEME.goldMain : "rgba(212,175,55,0.35)"}`,
                borderRadius: 14,
                padding: 16,
                opacity: idEnAccion === s.id ? 0.6 : 1
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: 12,
                      background: "rgba(212,175,55,0.18)",
                      color: THEME.goldMain,
                      fontSize: 12,
                      fontWeight: "bold"
                    }}
                  >
                    {s.tipo}
                  </span>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: 12,
                      background: s.estado === "pendiente" ? "rgba(255,180,0,0.18)" : "rgba(76,175,80,0.18)",
                      color: s.estado === "pendiente" ? "#ffb300" : "#4caf50",
                      fontSize: 12,
                      fontWeight: "bold"
                    }}
                  >
                    {s.estado === "pendiente" ? "Pendiente" : "Revisada"}
                  </span>
                </div>
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{fechaLegible(s.fecha)}</span>
              </div>

              <p style={{ color: "white", fontSize: 14.5, lineHeight: 1.55, margin: "0 0 12px", whiteSpace: "pre-wrap" }}>
                {s.mensaje}
              </p>

              {(s.usuarioId || s.nombre || s.email) && (
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12.5, margin: "0 0 12px" }}>
                  {s.usuarioId ? `👤 Cuenta: ${s.usuarioId}` : s.nombre ? `👤 ${s.nombre}` : null}
                  {(s.usuarioId || s.nombre) && s.email ? " · " : null}
                  {s.email ? `✉️ ${s.email}` : null}
                </p>
              )}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  disabled={idEnAccion === s.id}
                  onClick={() => void alternarEstado(s)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: `1px solid ${THEME.goldMain}`,
                    background: "rgba(212,175,55,0.12)",
                    color: THEME.goldMain,
                    cursor: idEnAccion === s.id ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    fontSize: 12
                  }}
                >
                  {s.estado === "pendiente" ? "✓ Marcar revisada" : "↺ Marcar pendiente"}
                </button>
                <button
                  type="button"
                  disabled={idEnAccion === s.id}
                  onClick={() => setIdParaEliminar(s.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,68,68,0.6)",
                    background: "rgba(255,68,68,0.1)",
                    color: "#ff8080",
                    cursor: idEnAccion === s.id ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    fontSize: 12
                  }}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalConfirmacion
        abierto={idParaEliminar !== null}
        mensaje="¿Eliminar esta sugerencia? No se puede deshacer."
        onConfirmar={() => void confirmarEliminar()}
        onCancelar={() => setIdParaEliminar(null)}
        textoConfirmar="Eliminar"
      />
    </div>
  );
}
