import type { Dispatch, SetStateAction } from "react";
import AdminPageNav from "../../components/admin/AdminPageNav";
import { THEME, CUPONES_MAIKA_KEY } from "../../config";
import { inputStyle } from "../../styles/inputStyle";
import type { Pagina } from "../../types";
import { getAdminSessionRemainingMs } from "../../utils/adminAuth";
import { notificarError, notificarExito } from "../../utils/ui/notificaciones";

export type CuponAdminEntrada = { tipo: "porcentaje" | "envio_gratis"; valor: number };

export type EditarCuponesAdminPanelProps = {
  cuponesAdmin: Record<string, CuponAdminEntrada>;
  setCuponesAdmin: Dispatch<SetStateAction<Record<string, CuponAdminEntrada>>>;
  setPagina: (p: Pagina) => void;
  mostrarNotificacion: (m: string, t: "normal" | "exito" | "error") => void;
};

export function EditarCuponesAdminPanel({
  cuponesAdmin,
  setCuponesAdmin,
  setPagina,
  mostrarNotificacion
}: EditarCuponesAdminPanelProps) {
  const cuponesEntradas = Object.entries(cuponesAdmin);

  return (
    <div className="cupones-promocionales-page admin-container">
      <AdminPageNav
        onVolver={() => {
          if (getAdminSessionRemainingMs() > 0) {
            setPagina("admin");
          }
        }}
      />
      <h2 style={{ color: THEME.goldMain, marginBottom: 20 }}>🎟️ Códigos promocionales</h2>
      <p style={{ color: "white", marginBottom: 20, opacity: 0.9 }}>
        Los códigos que guardes aquí serán los únicos válidos en Finalizar compra. Puedes cambiarlos cuando quieras.
      </p>
      <div style={{ background: THEME.bg, border: `2px solid ${THEME.goldMain}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
        {cuponesEntradas.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.7)" }}>No hay códigos. Añade uno abajo.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cuponesEntradas.map(([codigo, data]) => (
              <div key={codigo} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ color: THEME.goldMain, fontWeight: "bold", minWidth: 100 }}>{codigo}</span>
                <span style={{ color: "white", opacity: 0.9 }}>
                  {data.tipo === "porcentaje" ? `${data.valor}% descuento` : "Envío gratis"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...cuponesAdmin };
                    delete next[codigo];
                    setCuponesAdmin(next);
                  }}
                  style={{
                    background: "transparent",
                    color: "#ff4444",
                    border: "1px solid #ff4444",
                    borderRadius: 8,
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontSize: 13
                  }}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ background: THEME.bg, border: `2px solid ${THEME.goldMain}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <p style={{ color: THEME.goldMain, fontWeight: "bold", marginBottom: 12 }}>Añadir código</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 400 }}>
          <input
            type="text"
            placeholder="Código (ej. VERANO20)"
            id="nuevo-cupon-codigo"
            style={inputStyle}
          />
          <select id="nuevo-cupon-tipo" style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="porcentaje">Porcentaje de descuento</option>
            <option value="envio_gratis">Envío gratis</option>
          </select>
          <input
            type="number"
            placeholder="Valor (% si es porcentaje, 0 si envío gratis)"
            id="nuevo-cupon-valor"
            min={0}
            max={100}
            defaultValue={10}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => {
              const codigoInput = (document.getElementById("nuevo-cupon-codigo") as HTMLInputElement)?.value
                ?.trim()
                .toUpperCase()
                .replace(/\s+/g, "");
              const tipo = (document.getElementById("nuevo-cupon-tipo") as HTMLSelectElement)?.value as
                | "porcentaje"
                | "envio_gratis";
              const valorInput = (document.getElementById("nuevo-cupon-valor") as HTMLInputElement)?.value;
              const valor = tipo === "envio_gratis" ? 0 : Math.min(100, Math.max(0, parseFloat(valorInput) || 0));
              if (!codigoInput) {
                notificarError(mostrarNotificacion, "Escribe un código");
                return;
              }
              setCuponesAdmin((prev) => ({ ...prev, [codigoInput]: { tipo, valor } }));
              (document.getElementById("nuevo-cupon-codigo") as HTMLInputElement).value = "";
              (document.getElementById("nuevo-cupon-valor") as HTMLInputElement).value = "10";
            }}
            style={{
              background: THEME.goldMain,
              color: "#1b1745",
              border: "none",
              padding: 12,
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Añadir código
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(CUPONES_MAIKA_KEY, JSON.stringify(cuponesAdmin));
            if (getAdminSessionRemainingMs() > 0) {
              setPagina("admin");
            }
            notificarExito(mostrarNotificacion, "Códigos promocionales guardados");
          }}
          style={{
            background: "#4caf50",
            color: "white",
            border: "none",
            padding: "14px 24px",
            borderRadius: 14,
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 18
          }}
        >
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
