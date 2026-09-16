import { useEffect, useState } from "react";
import { THEME } from "../../config";
import { guardarEstadoWebApi, leerEstadoWeb, type WebEstado } from "../../services/apiWebEstado";

/**
 * Interruptor web abierta/cerrada (panel admin). Cuando está cerrada, los visitantes ven
 * la página «Estamos cerrados»; el admin sigue entrando por /admin con su clave.
 */
export default function AdminWebEstadoToggle({
  mostrarNotificacion
}: {
  mostrarNotificacion: (m: string, t: "normal" | "exito" | "error") => void;
}) {
  const [estado, setEstado] = useState<WebEstado | null>(null);
  const [mensajeEdit, setMensajeEdit] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    void leerEstadoWeb().then((e) => {
      setEstado(e);
      setMensajeEdit(e.mensaje);
    });
  }, []);

  const guardar = async (cerrada: boolean) => {
    if (guardando) return;
    setGuardando(true);
    try {
      const r = await guardarEstadoWebApi({ cerrada, mensaje: mensajeEdit.trim() });
      if (r.ok !== true) {
        mostrarNotificacion(`No se pudo cambiar el estado (HTTP ${r.status})`, "error");
        return;
      }
      setEstado({ cerrada, mensaje: mensajeEdit.trim() });
      mostrarNotificacion(
        cerrada
          ? "Web CERRADA: los visitantes verán «Estamos cerrados». Tú sigues entrando por /admin."
          : "Web ABIERTA: la tienda vuelve a ser visible para todo el mundo.",
        "exito"
      );
    } finally {
      setGuardando(false);
    }
  };

  if (!estado) return null;

  const cerrada = estado.cerrada;
  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 10,
        border: `2px solid ${cerrada ? "#c0392b" : "#27ae60"}`,
        background: cerrada ? "rgba(192,57,43,0.15)" : "rgba(39,174,96,0.12)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>
          {cerrada ? "🔴 Web CERRADA al público" : "🟢 Web ABIERTA"}
        </span>
        <button
          type="button"
          disabled={guardando}
          onClick={() => guardar(!cerrada)}
          className="btn-admin-limpio admin-btn"
          style={{
            background: cerrada ? "#27ae60" : "#c0392b",
            color: "white",
            border: "none",
            opacity: guardando ? 0.6 : 1
          }}
        >
          {guardando ? "Guardando…" : cerrada ? "Abrir web" : "Cerrar web"}
        </button>
      </div>
      <input
        type="text"
        value={mensajeEdit}
        onChange={(e) => setMensajeEdit(e.target.value)}
        onBlur={() => {
          if (mensajeEdit.trim() !== (estado.mensaje || "") && estado) {
            void guardarEstadoWebApi({ cerrada, mensaje: mensajeEdit.trim() }).then((r) => {
              if (r.ok) setEstado({ cerrada, mensaje: mensajeEdit.trim() });
            });
          }
        }}
        placeholder="Mensaje opcional para la página de cerrado…"
        maxLength={300}
        style={{
          width: "100%",
          marginTop: 10,
          padding: "8px 10px",
          borderRadius: 8,
          border: `1px solid ${THEME.goldMain}`,
          background: THEME.bg,
          color: "white",
          fontSize: 13,
          boxSizing: "border-box"
        }}
      />
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, margin: "8px 0 0" }}>
        Al cerrar, los visitantes ven solo la página de cerrado. Para reabrir entra en /admin con tu clave.
      </p>
    </div>
  );
}
