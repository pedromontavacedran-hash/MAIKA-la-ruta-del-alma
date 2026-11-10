import { useEffect, useState, type CSSProperties } from "react";
import { THEME } from "../../config";
import type { EnlaceConfig } from "../../config/enlaces";
import { guardarEnlacesAdminApi, leerEnlacesConfig } from "../../services/apiEnlaces";

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 6,
  border: `2px solid ${THEME.goldMain}`,
  background: THEME.bg,
  color: "white",
  fontSize: 13,
  boxSizing: "border-box"
};

const labelStyle: CSSProperties = {
  display: "block",
  color: "rgba(255,255,255,0.9)",
  fontSize: 12,
  marginBottom: 2
};

function nuevoEnlace(): EnlaceConfig {
  return { id: `enlace-${Date.now().toString(36)}`, etiqueta: "", url: "", icono: "", activa: true };
}

/**
 * Editor de los enlaces de la página pública `/enlaces` (la del QR de las
 * tarjetas). Se guarda en el backend (`enlaces.json`): el cambio se ve al
 * instante en la web, sin redesplegar.
 */
export default function AdminEnlacesPanel({
  mostrarNotificacion
}: {
  mostrarNotificacion: (m: string, t: "normal" | "exito" | "error") => void;
}) {
  const [enlaces, setEnlaces] = useState<EnlaceConfig[] | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vivo = true;
    void leerEnlacesConfig().then((lista) => {
      if (vivo) setEnlaces(lista);
    });
    return () => {
      vivo = false;
    };
  }, []);

  const actualizar = (idx: number, patch: Partial<EnlaceConfig>) => {
    setEnlaces((prev) => {
      if (!prev) return prev;
      const next = prev.slice();
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const mover = (idx: number, dir: -1 | 1) => {
    setEnlaces((prev) => {
      if (!prev) return prev;
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const guardar = async () => {
    if (!enlaces || guardando) return;
    setGuardando(true);
    try {
      const r = await guardarEnlacesAdminApi(enlaces);
      if (r.ok !== true) {
        mostrarNotificacion(`No se pudieron guardar los enlaces (HTTP ${r.status})`, "error");
        return;
      }
      setEnlaces(r.enlaces);
      mostrarNotificacion("Enlaces guardados. Ya se ven en /enlaces.", "exito");
    } finally {
      setGuardando(false);
    }
  };

  if (!enlaces) return null;

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 10,
        border: `2px solid ${THEME.goldMain}`,
        background: "rgba(198,168,90,0.08)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>
          🔗 Enlaces de /enlaces (QR de tarjetas)
        </span>
        <a
          href="/enlaces"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: THEME.goldMain, fontSize: 12, textDecoration: "none" }}
        >
          Abrir /enlaces ↗
        </a>
      </div>
      <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, margin: "8px 0 10px" }}>
        El orden de la lista es el orden de los botones. URL interna: <code style={{ color: THEME.goldMain }}>/tienda</code>.
        Externa: <code style={{ color: THEME.goldMain }}>https://…</code>. Desmarca «Visible» para ocultar sin borrar.
      </p>

      <div style={{ display: "grid", gap: 10 }}>
        {enlaces.map((e, idx) => (
          <div
            key={e.id || idx}
            style={{
              padding: 10,
              borderRadius: 8,
              border: "1px solid rgba(201,162,74,0.4)",
              background: "rgba(0,0,0,0.25)",
              opacity: e.activa ? 1 : 0.55
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ color: THEME.goldMain, fontSize: 12, fontWeight: 700, minWidth: 52 }}>
                #{idx + 1}
              </span>
              <label style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.85)", fontSize: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={e.activa}
                  onChange={(ev) => actualizar(idx, { activa: ev.target.checked })}
                />
                Visible
              </label>
              <span style={{ flex: 1 }} />
              <button type="button" className="btn-admin-limpio admin-btn" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => mover(idx, -1)} disabled={idx === 0}>
                ↑
              </button>
              <button type="button" className="btn-admin-limpio admin-btn" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => mover(idx, 1)} disabled={idx === enlaces.length - 1}>
                ↓
              </button>
              <button
                type="button"
                className="btn-admin-limpio admin-btn"
                style={{ padding: "4px 8px", fontSize: 12, background: "rgba(200,80,80,0.3)", color: "#ff9999", border: "1px solid #cc6666" }}
                onClick={() => setEnlaces((prev) => (prev ? prev.filter((_, i) => i !== idx) : prev))}
              >
                Eliminar
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
              <div>
                <label style={labelStyle}>Icono (opcional)</label>
                <input
                  type="text"
                  value={e.icono}
                  maxLength={16}
                  onChange={(ev) => actualizar(idx, { icono: ev.target.value })}
                  placeholder="🛍️"
                  style={{ ...inputStyle, maxWidth: 90 }}
                />
              </div>
              <div>
                <label style={labelStyle}>Texto del botón</label>
                <input
                  type="text"
                  value={e.etiqueta}
                  maxLength={80}
                  onChange={(ev) => actualizar(idx, { etiqueta: ev.target.value })}
                  placeholder="Ej: Tienda online"
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>URL</label>
                <input
                  type="text"
                  value={e.url}
                  maxLength={300}
                  onChange={(ev) => actualizar(idx, { url: ev.target.value })}
                  placeholder="/tienda  o  https://…"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn-admin-limpio admin-btn admin-btn--blue"
          onClick={() => setEnlaces((prev) => (prev ? [...prev, nuevoEnlace()] : prev))}
        >
          ＋ Añadir enlace
        </button>
        <button
          type="button"
          className="btn-admin-limpio admin-btn admin-btn--green"
          onClick={() => void guardar()}
          disabled={guardando}
          style={{ opacity: guardando ? 0.6 : 1 }}
        >
          {guardando ? "Guardando…" : "Guardar enlaces"}
        </button>
      </div>
    </div>
  );
}
