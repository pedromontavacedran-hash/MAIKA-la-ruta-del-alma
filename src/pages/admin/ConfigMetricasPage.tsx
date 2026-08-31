import { useState } from "react";
import AdminPageNav from "../../components/admin/AdminPageNav";
import { THEME } from "../../config";
import { checkoutInputStyle, checkoutPrimaryButtonStyleNoShadow } from "../../styles/inputStyle";
import type { Pagina } from "../../types";

type Props = {
  setPagina: (p: Pagina) => void;
  umbralStockBajo: number;
  setUmbralStockBajo: (v: number) => void;
  umbralKey: string;
  mostrarNotificacion: (m: string, t: "normal" | "exito" | "error") => void;
  notaPedidoEnvio: string;
  setNotaPedidoEnvio: (v: string) => void;
  notaKey: string;
  notaDefault: string;
};

export default function ConfigMetricasPage({
  setPagina,
  umbralStockBajo,
  setUmbralStockBajo,
  umbralKey,
  mostrarNotificacion,
  notaPedidoEnvio,
  setNotaPedidoEnvio,
  notaKey,
  notaDefault
}: Props) {
  const [umbralDraft, setUmbralDraft] = useState<number>(umbralStockBajo);
  const [notaDraft, setNotaDraft] = useState<string>(notaPedidoEnvio);
  const hayCambiosPendientes = umbralDraft !== umbralStockBajo || notaDraft !== notaPedidoEnvio;

  const guardar = () => {
    if (!hayCambiosPendientes) return;
    setUmbralStockBajo(umbralDraft);
    setNotaPedidoEnvio(notaDraft);
    localStorage.setItem(umbralKey, String(umbralDraft));
    localStorage.setItem(notaKey, notaDraft);
    mostrarNotificacion("Configuración guardada", "exito");
    setPagina("admin");
  };

  return (
    <div className="admin-layout admin-metricas-config-page">
      <AdminPageNav onVolver={() => setPagina("admin")} varianteVolver="gold" />

      <section
        className="admin-card"
        style={{
          color: "white",
          background: THEME.bg,
          borderColor: "rgba(212, 175, 55, 0.35)"
        }}
      >
        <div className="admin-metricas-config-title">⚙ Configuración de métricas</div>

        <div className="admin-metricas-config-section">
          <div className="admin-metricas-config-section-title">📦 Stock</div>
          <p className="admin-metricas-config-help">
            Se marcará como bajo cuando el stock sea igual o inferior a este valor.
          </p>
          <select
            value={umbralDraft}
            onChange={(e) => setUmbralDraft(parseInt(e.target.value, 10))}
            style={{ ...checkoutInputStyle, marginBottom: 0, maxWidth: 280 }}
          >
            {[2, 3, 5, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n} unidades
              </option>
            ))}
          </select>
        </div>

        <div className="admin-metricas-config-section">
          <div className="admin-metricas-config-section-title">🧾 Pedidos</div>
          <p className="admin-metricas-config-help">
            Este mensaje se incluirá en el pedido y en el correo al cliente.
          </p>
          <textarea
            value={notaDraft}
            onChange={(e) => setNotaDraft(e.target.value)}
            placeholder={notaDefault}
            rows={4}
            style={{ ...checkoutInputStyle, resize: "vertical", minHeight: 110 }}
          />
        </div>

        <div className="admin-metricas-config-footer checkout-modal-footer-block">
          <button
            type="button"
            onClick={() => setPagina("admin")}
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid rgba(212, 175, 55, 0.35)",
              background: "transparent",
              color: "rgba(255, 255, 255, 0.7)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={hayCambiosPendientes ? "checkout-boton-finalizar" : undefined}
            onClick={guardar}
            disabled={!hayCambiosPendientes}
            style={{
              padding: "14px 16px",
              borderRadius: 10,
              fontWeight: 600,
              cursor: hayCambiosPendientes ? "pointer" : "not-allowed",
              ...(hayCambiosPendientes
                ? checkoutPrimaryButtonStyleNoShadow
                : {
                    background: "#8a8a8a",
                    color: "rgba(255,255,255,0.85)",
                    border: "none",
                    boxShadow: "none"
                  })
            }}
          >
            Guardar cambios
          </button>
        </div>
      </section>
    </div>
  );
}
