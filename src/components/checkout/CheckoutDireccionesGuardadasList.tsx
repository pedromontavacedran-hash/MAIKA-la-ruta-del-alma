import { useState } from "react";
import type { DireccionUsuario, Usuario } from "../../types";
import { lineasTextoSeleccionDireccion } from "../../utils/direccion";
import {
  direccionCheckoutEsSoloCamposPerfilSinLibreta,
  direccionCheckoutEsSoloHistorialPedidos,
  partirDireccionesCheckoutPorOrigen
} from "../../utils/direccionCheckoutOrigen";

type Props = {
  usuario?: Usuario | null;
  modoDireccionCheckout: boolean;
  /** Si false, no se pinta (antes solo cuenta; ahora también al elegir dirección en el pedido). */
  listaVisible: boolean;
  direccionesCheckout: DireccionUsuario[];
  direccionCheckoutSeleccionadaId: string;
  /** Solo informativo: no fuerza la selección del pedido. */
  direccionPredeterminadaCheckoutId: string;
  goldColor: string;
  onUsarDireccion: (id: string) => void;
  onSeleccionarDireccion: (direccion: DireccionUsuario) => void;
  onEliminarDireccion: (id: string) => void;
  /** En finalizar compra conviene ocultar eliminar para no romper el flujo por error. */
  mostrarEliminar?: boolean;
  /** Lista Mi cuenta: filas más bajas, historial más discreto, botones Usar/Eliminar con jerarquía clara. */
  uiCompactaCuenta?: boolean;
};

function ordenarDireccionesParaLista(
  dirs: DireccionUsuario[],
  direccionCheckoutSeleccionadaId: string,
  predId: string
): DireccionUsuario[] {
  return [...dirs].sort((a, b) => {
    if (a.id === direccionCheckoutSeleccionadaId) return -1;
    if (b.id === direccionCheckoutSeleccionadaId) return 1;
    if (predId && a.id === predId) return -1;
    if (predId && b.id === predId) return 1;
    return 0;
  });
}

export default function CheckoutDireccionesGuardadasList({
  usuario = null,
  modoDireccionCheckout,
  listaVisible,
  direccionesCheckout,
  direccionCheckoutSeleccionadaId,
  direccionPredeterminadaCheckoutId,
  goldColor,
  onUsarDireccion,
  onSeleccionarDireccion,
  onEliminarDireccion,
  mostrarEliminar,
  uiCompactaCuenta = false
}: Props) {
  const predId = (direccionPredeterminadaCheckoutId || "").trim();
  const compact = uiCompactaCuenta === true;
  const puedeEliminar = mostrarEliminar !== false && modoDireccionCheckout;
  const seleccionPedidoPorClicEnFila = !modoDireccionCheckout;
  const [historialListaDesplegada, setHistorialListaDesplegada] = useState(false);

  const { guardadasYPerfil, soloHistorial } = partirDireccionesCheckoutPorOrigen(usuario, direccionesCheckout);
  const agruparCuentaVsHistorial = Boolean(usuario) && soloHistorial.length > 0 && modoDireccionCheckout;

  if (!listaVisible || direccionesCheckout.length === 0) return null;

  const renderFila = (d: DireccionUsuario) => {
    const esSeleccionada = d.id === direccionCheckoutSeleccionadaId;
    const { linea1, linea2 } = lineasTextoSeleccionDireccion(d);
    const borde = esSeleccionada ? `2px solid ${goldColor}` : "1px solid #444";
    const activarFila = () => {
      if (modoDireccionCheckout) return;
      onSeleccionarDireccion(d);
    };
    const esHistorial = usuario ? direccionCheckoutEsSoloHistorialPedidos(usuario, d) : false;
    const esSoloPerfilSinLibreta = usuario ? direccionCheckoutEsSoloCamposPerfilSinLibreta(usuario, d) : false;

    return (
      <div
        key={`checkout-dir-row-${d.id}`}
        role={seleccionPedidoPorClicEnFila ? "button" : undefined}
        tabIndex={seleccionPedidoPorClicEnFila ? 0 : undefined}
        onClick={seleccionPedidoPorClicEnFila ? activarFila : undefined}
        onKeyDown={
          seleccionPedidoPorClicEnFila
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  activarFila();
                }
              }
            : undefined
        }
        style={{
          display: "grid",
          gridTemplateColumns: puedeEliminar ? "1fr auto auto" : modoDireccionCheckout ? "1fr auto" : "1fr",
          gap: compact ? 6 : 8,
          alignItems: "start",
          border: borde,
          borderRadius: compact ? 8 : 10,
          padding: compact ? "6px 8px" : "10px",
          background: esSeleccionada ? "rgba(201,162,74,0.12)" : "rgba(0,0,0,0.18)",
          cursor: seleccionPedidoPorClicEnFila ? "pointer" : "default",
          marginBottom: 0
        }}
      >
        <div
          style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: compact ? 11 : 12,
            lineHeight: 1.35,
            minWidth: 0
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: compact ? 4 : 6 }}>
            <span style={{ fontWeight: compact ? 700 : 600, color: compact ? "rgba(255,255,255,0.96)" : undefined }}>
              {linea1 || "—"}
            </span>
            {esHistorial ? (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  color: "rgba(255,200,120,0.95)",
                  border: "1px solid rgba(255,200,120,0.45)",
                  borderRadius: 6,
                  padding: "2px 6px"
                }}
              >
                PEDIDO ANTERIOR
              </span>
            ) : null}
            {esSoloPerfilSinLibreta ? (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  color: "rgba(200,220,255,0.95)",
                  border: "1px solid rgba(180,200,255,0.4)",
                  borderRadius: 6,
                  padding: "2px 6px"
                }}
              >
                PERFIL
              </span>
            ) : null}
          </div>
          {linea2 ? (
            <div
              style={{
                marginTop: compact ? 2 : 4,
                fontSize: compact ? 10 : 11,
                color: compact ? "rgba(200,195,220,0.52)" : "rgba(255,255,255,0.72)"
              }}
            >
              {linea2}
            </div>
          ) : null}
          {esHistorial && !compact ? (
            <div style={{ marginTop: 6, fontSize: 10, color: "rgba(255,210,160,0.78)", lineHeight: 1.35 }}>
              No está en tu libreta de Mi cuenta; solo puedes usarla para este envío o guardarla después.
            </div>
          ) : null}
          {esSeleccionada && seleccionPedidoPorClicEnFila ? (
            <div style={{ marginTop: 8, fontSize: 12, color: goldColor, fontWeight: 600 }}>Dirección seleccionada</div>
          ) : null}
        </div>
        {modoDireccionCheckout ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUsarDireccion(d.id);
            }}
            onMouseEnter={
              compact
                ? (e) => {
                    const el = e.currentTarget;
                    el.style.boxShadow = "0 0 14px rgba(201, 162, 74, 0.4), 0 1px 0 rgba(0,0,0,0.2)";
                  }
                : undefined
            }
            onMouseLeave={
              compact
                ? (e) => {
                    e.currentTarget.style.boxShadow = "0 1px 0 rgba(0,0,0,0.2)";
                  }
                : undefined
            }
            style={
              compact
                ? {
                    border: "none",
                    background: "rgba(201,162,74,0.42)",
                    color: "#1b1636",
                    borderRadius: 8,
                    padding: "5px 10px",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 800,
                    boxShadow: "0 1px 0 rgba(0,0,0,0.2)",
                    transition: "box-shadow 0.15s ease"
                  }
                : {
                    border: `1px solid ${goldColor}`,
                    background: "transparent",
                    color: goldColor,
                    borderRadius: 8,
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 800
                  }
            }
          >
            Usar
          </button>
        ) : null}
        {puedeEliminar ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEliminarDireccion(d.id);
            }}
            disabled={direccionesCheckout.length <= 1}
            onMouseEnter={
              compact && direccionesCheckout.length > 1
                ? (e) => {
                    const el = e.currentTarget;
                    el.style.color = "rgba(255, 150, 150, 0.9)";
                    el.style.borderColor = "rgba(255, 140, 140, 0.4)";
                    el.style.background = "rgba(255, 70, 70, 0.07)";
                  }
                : undefined
            }
            onMouseLeave={
              compact
                ? (e) => {
                    const el = e.currentTarget;
                    el.style.color = "rgba(200, 175, 175, 0.72)";
                    el.style.borderColor = "rgba(255,255,255,0.22)";
                    el.style.background = "transparent";
                  }
                : undefined
            }
            style={
              compact
                ? {
                    border: "1px solid rgba(255,255,255,0.22)",
                    background: "transparent",
                    color: "rgba(200, 175, 175, 0.72)",
                    borderRadius: 8,
                    padding: "5px 9px",
                    cursor: direccionesCheckout.length <= 1 ? "not-allowed" : "pointer",
                    opacity: direccionesCheckout.length <= 1 ? 0.4 : 1,
                    fontSize: 10,
                    fontWeight: 600,
                    transition: "color 0.15s ease, border-color 0.15s ease, background 0.15s ease"
                  }
                : {
                    border: "1px solid #ff6666",
                    background: "transparent",
                    color: "#ff6666",
                    borderRadius: 8,
                    padding: "4px 8px",
                    cursor: direccionesCheckout.length <= 1 ? "not-allowed" : "pointer",
                    opacity: direccionesCheckout.length <= 1 ? 0.55 : 1,
                    fontSize: 11,
                    fontWeight: 800
                  }
            }
          >
            Eliminar
          </button>
        ) : null}
      </div>
    );
  };

  if (!agruparCuentaVsHistorial) {
    return (
      <div style={{ marginTop: compact ? 6 : 8, display: "grid", gap: compact ? 6 : 8 }}>
        {ordenarDireccionesParaLista(direccionesCheckout, direccionCheckoutSeleccionadaId, predId).map((d) =>
          renderFila(d)
        )}
      </div>
    );
  }

  const gOrd = ordenarDireccionesParaLista(guardadasYPerfil, direccionCheckoutSeleccionadaId, predId);
  const hOrd = ordenarDireccionesParaLista(soloHistorial, direccionCheckoutSeleccionadaId, predId);
  const soloSugeridasSinCuenta = guardadasYPerfil.length === 0 && soloHistorial.length > 0;

  return (
    <div style={{ marginTop: compact ? 6 : 8, display: "grid", gap: compact ? 6 : 10 }}>
      {!soloSugeridasSinCuenta ? (
        compact ? (
          <div
            style={{
              marginTop: 4,
              paddingTop: 14,
              borderTop: "1px solid rgba(255,255,255,0.07)"
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "rgba(200,255,200,0.48)",
                letterSpacing: "0.06em",
                marginBottom: 2
              }}
            >
              EN TU CUENTA
            </div>
            <div style={{ display: "grid", gap: 6, marginTop: 8 }}>{gOrd.map((d) => renderFila(d))}</div>
          </div>
        ) : (
          <>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "rgba(200,255,200,0.7)",
                letterSpacing: "0.06em"
              }}
            >
              EN TU CUENTA
            </div>
            <div style={{ display: "grid", gap: 8 }}>{gOrd.map((d) => renderFila(d))}</div>
          </>
        )
      ) : (
        <p
          style={{
            margin: 0,
            fontSize: compact ? 11 : 12,
            color: compact ? "rgba(255,255,255,0.52)" : "rgba(255,255,255,0.65)",
            lineHeight: 1.45
          }}
        >
          {compact
            ? "Direcciones sugeridas desde pedidos anteriores."
            : "Aún no tienes direcciones en la libreta de Mi cuenta; aquí aparecen direcciones detectadas en pedidos anteriores. Puedes usarlas para este envío y luego guardarlas en tu cuenta."}
        </p>
      )}

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: compact ? 2 : 4 }} />
      {soloSugeridasSinCuenta ? (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,200,140,0.72)", letterSpacing: "0.05em" }}>
            SUGERIDAS (NO EN MI CUENTA)
          </div>
          <div style={{ display: "grid", gap: 8 }}>{hOrd.map((d) => renderFila(d))}</div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setHistorialListaDesplegada((v) => !v)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: compact ? "7px 9px" : "10px 12px",
              borderRadius: compact ? 8 : 10,
              border: compact ? "1px solid rgba(255,200,120,0.22)" : "1px solid rgba(255,200,120,0.35)",
              background: compact ? "rgba(255,200,120,0.04)" : "rgba(255,200,120,0.06)",
              color: compact ? "rgba(230,215,180,0.72)" : "rgba(255,230,200,0.92)",
              cursor: "pointer",
              fontSize: compact ? 11 : 12,
              fontWeight: compact ? 600 : 700
            }}
          >
            {historialListaDesplegada ? "▲" : "▼"}{" "}
            {compact
              ? `Direcciones anteriores (${soloHistorial.length})`
              : `Direcciones usadas en pedidos anteriores (${soloHistorial.length})`}
          </button>
          {historialListaDesplegada ? (
            <>
              {!compact ? (
                <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,200,140,0.72)", letterSpacing: "0.05em" }}>
                  SUGERIDAS (NO EN MI CUENTA)
                </div>
              ) : null}
              <div style={{ display: "grid", gap: compact ? 6 : 8 }}>{hOrd.map((d) => renderFila(d))}</div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
