import { CHECKOUT_CONFIG } from "@/config/checkoutConfig";
import { useApp } from "../context/AppContext";
import BotonCerrar from "../components/BotonCerrar";
import { THEME } from "../config";
import { textoDireccionVistaAdmin } from "../utils/pedidos/direccionPedidoVista";
import { useEffect, useMemo, useState } from "react";

const BUSQUEDA_PEDIDO_SESSION_KEY = "maika_admin_busqueda_pedido";
const PENDIENTES_ABIERTO_SESSION_KEY = "maika_admin_pendientes_abierto";
const ENVIADOS_ABIERTO_SESSION_KEY = "maika_admin_enviados_abierto";
const ENTREGADOS_ABIERTO_SESSION_KEY = "maika_admin_entregados_abierto";

function normalizarTelefonoES9(telefono: string): string {
  const soloDigitos = String(telefono || "").replace(/\D/g, "").trim();
  if (soloDigitos.startsWith("0034") && soloDigitos.length > 4) return soloDigitos.slice(4);
  if (soloDigitos.startsWith("34") && soloDigitos.length > 9) return soloDigitos.slice(2);
  return soloDigitos;
}

export default function SeguimientoPage() {
  const {
    numeroSeguimiento,
    setNumeroSeguimiento,
    buscarPedido,
    pedidoBuscado,
    accesoAdmin,
    busquedaPedido,
    setBusquedaPedido,
    renderCajaPedidos,
    pendientesAbierto,
    setPendientesAbierto,
    enviadosAbierto,
    setEnviadosAbierto,
    entregadosAbierto,
    setEntregadosAbierto,
    pedidosPendientesOrdenados,
    pedidosEnviadosOrdenados,
    pedidosEntregadosOrdenados,
    setPedidoFacturaAbierto,
    setPagina
  } = useApp();
  const [busquedaPedidoInput, setBusquedaPedidoInput] = useState(busquedaPedido);

  useEffect(() => {
    if (!accesoAdmin) return;
    const busquedaGuardada = sessionStorage.getItem(BUSQUEDA_PEDIDO_SESSION_KEY);
    if (typeof busquedaGuardada === "string") {
      setBusquedaPedidoInput(busquedaGuardada);
      setBusquedaPedido(busquedaGuardada);
    }
    const pendientesGuardado = sessionStorage.getItem(PENDIENTES_ABIERTO_SESSION_KEY);
    const enviadosGuardado = sessionStorage.getItem(ENVIADOS_ABIERTO_SESSION_KEY);
    const entregadosGuardado = sessionStorage.getItem(ENTREGADOS_ABIERTO_SESSION_KEY);
    if (pendientesGuardado === "0" || pendientesGuardado === "1") setPendientesAbierto(pendientesGuardado === "1");
    if (enviadosGuardado === "0" || enviadosGuardado === "1") setEnviadosAbierto(enviadosGuardado === "1");
    if (entregadosGuardado === "0" || entregadosGuardado === "1") setEntregadosAbierto(entregadosGuardado === "1");
  }, [accesoAdmin, setBusquedaPedido, setPendientesAbierto, setEnviadosAbierto, setEntregadosAbierto]);

  useEffect(() => {
    if (!accesoAdmin) return;
    const id = window.setTimeout(() => {
      setBusquedaPedido(busquedaPedidoInput);
      sessionStorage.setItem(BUSQUEDA_PEDIDO_SESSION_KEY, busquedaPedidoInput);
    }, 180);
    return () => window.clearTimeout(id);
  }, [accesoAdmin, busquedaPedidoInput, setBusquedaPedido]);

  useEffect(() => {
    if (!accesoAdmin) return;
    sessionStorage.setItem(PENDIENTES_ABIERTO_SESSION_KEY, pendientesAbierto ? "1" : "0");
  }, [accesoAdmin, pendientesAbierto]);

  useEffect(() => {
    if (!accesoAdmin) return;
    sessionStorage.setItem(ENVIADOS_ABIERTO_SESSION_KEY, enviadosAbierto ? "1" : "0");
  }, [accesoAdmin, enviadosAbierto]);

  useEffect(() => {
    if (!accesoAdmin) return;
    sessionStorage.setItem(ENTREGADOS_ABIERTO_SESSION_KEY, entregadosAbierto ? "1" : "0");
  }, [accesoAdmin, entregadosAbierto]);

  const resumenBusquedaAdmin = useMemo(() => {
    const q = busquedaPedido.trim().toLowerCase();
    const qTel = normalizarTelefonoES9(busquedaPedido);
    const filtroTelefonoExacto = /^[67]\d{8}$/.test(qTel);
    if (!q) {
      return { activo: false, pendientes: 0, enviados: 0, entregados: 0, total: 0 };
    }
    const coincide = (p: { numero: string; cliente?: { nombreApellidos?: string; telefono?: string } }) =>
      filtroTelefonoExacto
        ? normalizarTelefonoES9(p.cliente?.telefono || "") === qTel
        : (
          String(p.numero || "").toLowerCase().includes(q) ||
          String(p.cliente?.nombreApellidos || "").toLowerCase().includes(q) ||
          String(p.cliente?.telefono || "").toLowerCase().includes(q)
        );
    const pendientes = pedidosPendientesOrdenados.filter(coincide).length;
    const enviados = pedidosEnviadosOrdenados.filter(coincide).length;
    const entregados = pedidosEntregadosOrdenados.filter(coincide).length;
    return {
      activo: true,
      pendientes,
      enviados,
      entregados,
      total: pendientes + enviados + entregados
    };
  }, [busquedaPedido, pedidosPendientesOrdenados, pedidosEnviadosOrdenados, pedidosEntregadosOrdenados]);

  const tituloPendientes = resumenBusquedaAdmin.activo
    ? `PENDIENTES (${resumenBusquedaAdmin.pendientes})`
    : `PENDIENTES (${pedidosPendientesOrdenados.length})`;
  const tituloEnviados = resumenBusquedaAdmin.activo
    ? `ENVIADOS (${resumenBusquedaAdmin.enviados})`
    : `ENVIADOS (${pedidosEnviadosOrdenados.length})`;
  const tituloEntregados = resumenBusquedaAdmin.activo
    ? `ENTREGADOS (${resumenBusquedaAdmin.entregados})`
    : `ENTREGADOS (${pedidosEntregadosOrdenados.length})`;
  return (
    <div className="maika-anchor maika-page maika-page-content maika-page-content--narrow" style={{ maxWidth: 600 }}>
      <div className="maika-page-header">
        <h2 className="maika-page-title" style={{ margin: 0 }}>
          🔍 SEGUIMIENTO DE PEDIDOS
        </h2>
        <BotonCerrar
          onClick={() => setPagina("inicio")}
          ariaLabel="Cerrar seguimiento"
          title="Cerrar"
        />
      </div>
      <div className="maika-page-subheader" aria-hidden />
      <div className="maika-page-body">
        <div style={{ width: "100%" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 30 }}>
            <input
              type="text"
              placeholder="Ej: MK240215-42"
              value={numeroSeguimiento}
              onChange={(e) => setNumeroSeguimiento(e.target.value.toUpperCase())}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 10,
                border: `2px solid ${THEME.goldMain}`,
                background: THEME.bg,
                color: "white",
                fontSize: 16
              }}
            />
            <button
              onClick={buscarPedido}
              style={{
                background: THEME.goldMain,
                color: "#1b1745",
                border: "none",
                padding: "12px 20px",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Buscar
            </button>
          </div>

          {pedidoBuscado && pedidoBuscado.cliente && (
            <div style={{
              background: THEME.bg,
              border: `2px solid ${THEME.goldMain}`,
              borderRadius: 20,
              padding: 20
            }}>
              <h3 style={{ color: THEME.goldMain, marginBottom: 15 }}>📦 {pedidoBuscado.numero}</h3>

              <div style={{ marginBottom: 15 }}>
                <p><strong>Fecha:</strong> {pedidoBuscado.fecha}</p>
                <p><strong>Cliente:</strong> {pedidoBuscado.cliente.nombreApellidos}</p>
                <p><strong>Total:</strong> {pedidoBuscado.total?.toFixed(2)} €</p>
              </div>

              <div style={{
                background: THEME.bg,
                padding: 15,
                borderRadius: 10,
                marginBottom: 15
              }}>
                <p><strong>ESTADO:</strong></p>
                <div style={{
                  display: "inline-block",
                  padding: "8px 20px",
                  borderRadius: 30,
                  background: pedidoBuscado.estado === "pendiente" ? "rgba(34,211,238,0.2)" :
                    pedidoBuscado.estado === "enviado" ? "rgba(230,126,34,0.2)" :
                      "rgba(46,204,113,0.2)",
                  color: pedidoBuscado.estado === "pendiente" ? "#22d3ee" :
                    pedidoBuscado.estado === "enviado" ? "#e67e22" :
                      "#2ecc71",
                  fontWeight: "bold"
                }}>
                  {pedidoBuscado.estado === "pendiente" ? "🛒 PENDIENTE" :
                    pedidoBuscado.estado === "enviado" ? "🚚 ENVIADO" : "✅ ENTREGADO"}
                </div>
              </div>

              <div>
                <p><strong>📍 Dirección de envío:</strong></p>
                <p style={{ lineHeight: 1.45 }}>{textoDireccionVistaAdmin(pedidoBuscado) || "—"}</p>
              </div>

              <button
                onClick={() => setPedidoFacturaAbierto(pedidoBuscado)}
                style={{
                  marginTop: 12,
                  background: "rgba(212,175,55,0.2)",
                  color: THEME.goldMain,
                  border: `2px solid ${THEME.goldMain}`,
                  padding: "10px",
                  borderRadius: 10,
                  cursor: "pointer",
                  width: "100%",
                  fontWeight: "bold"
                }}
              >
                📄 Ver factura / pedido completo
              </button>
              <button
                onClick={() =>
                  window.open(
                    `https://wa.me/${CHECKOUT_CONFIG.whatsappNumber}?text=Hola%20Maika%2C%20consulta%20sobre%20pedido%20${pedidoBuscado.numero}`,
                    "_blank"
                  )
                }
                style={{
                  marginTop: 10,
                  background: "#25D366",
                  color: "white",
                  border: "none",
                  padding: "10px",
                  borderRadius: 10,
                  cursor: "pointer",
                  width: "100%",
                  fontWeight: "bold"
                }}
              >
                📱 Contactar por WhatsApp
              </button>
            </div>
          )}
        </div>

        {accesoAdmin && (
          <div style={{ marginTop: 24 }}>
          <h3 style={{ textAlign: "center" }}>📋 GESTIÓN DE PEDIDOS</h3>

          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <input
              placeholder="Buscar pedido, cliente o teléfono..."
              value={busquedaPedidoInput}
              onChange={(e) => setBusquedaPedidoInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setBusquedaPedidoInput("");
                  setBusquedaPedido("");
                }
              }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 10,
                border: `2px solid ${THEME.goldMain}`,
                background: THEME.bg,
                color: "white"
              }}
            />
            <button
              type="button"
              onClick={() => {
                setBusquedaPedidoInput("");
                setBusquedaPedido("");
              }}
              disabled={!busquedaPedidoInput.trim()}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${THEME.goldMain}`,
                background: busquedaPedidoInput.trim() ? "rgba(201, 162, 74, 0.2)" : "rgba(201, 162, 74, 0.08)",
                color: THEME.goldMain,
                cursor: busquedaPedidoInput.trim() ? "pointer" : "not-allowed",
                fontWeight: "bold",
                opacity: busquedaPedidoInput.trim() ? 1 : 0.6
              }}
            >
              Limpiar
            </button>
          </div>
          {resumenBusquedaAdmin.activo && (
            <div
              style={{
                marginTop: -10,
                marginBottom: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 10px",
                borderRadius: 999,
                border: `1px solid ${THEME.goldMain}`,
                color: THEME.goldMain,
                fontSize: 12
              }}
            >
              Filtro activo: {busquedaPedido.trim()}
              <button
                type="button"
                onClick={() => {
                  setBusquedaPedidoInput("");
                  setBusquedaPedido("");
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: THEME.goldMain,
                  cursor: "pointer",
                  fontWeight: "bold",
                  padding: 0,
                  lineHeight: 1
                }}
              >
                x
              </button>
            </div>
          )}
          {resumenBusquedaAdmin.activo && (
            <div
              style={{
                marginTop: -8,
                marginBottom: 16,
                padding: "8px 10px",
                borderRadius: 8,
                border: `1px solid ${THEME.goldMain}`,
                background: "rgba(201, 162, 74, 0.12)",
                color: "white",
                fontSize: 13
              }}
            >
              Resultados: <strong style={{ color: THEME.goldMain }}>{resumenBusquedaAdmin.total}</strong> |
              Pendientes: <strong style={{ color: "#22d3ee" }}> {resumenBusquedaAdmin.pendientes}</strong> |
              Enviados: <strong style={{ color: "#e67e22" }}> {resumenBusquedaAdmin.enviados}</strong> |
              Entregados: <strong style={{ color: "#2ecc71" }}> {resumenBusquedaAdmin.entregados}</strong>
            </div>
          )}

          {(!resumenBusquedaAdmin.activo || resumenBusquedaAdmin.pendientes > 0) && (
            <div key={`pendientes-${pedidosPendientesOrdenados.length}`}>
              {renderCajaPedidos(tituloPendientes, pedidosPendientesOrdenados, "#22d3ee", "🛒", pendientesAbierto, setPendientesAbierto, true)}
            </div>
          )}
          {(!resumenBusquedaAdmin.activo || resumenBusquedaAdmin.enviados > 0) && (
            <div key={`enviados-${pedidosEnviadosOrdenados.length}`}>
              {renderCajaPedidos(tituloEnviados, pedidosEnviadosOrdenados, "#e67e22", "🚚", enviadosAbierto, setEnviadosAbierto, false)}
            </div>
          )}
          {(!resumenBusquedaAdmin.activo || resumenBusquedaAdmin.entregados > 0) && (
            <div key={`entregados-${pedidosEntregadosOrdenados.length}`}>
              {renderCajaPedidos(tituloEntregados, pedidosEntregadosOrdenados, "#2ecc71", "✅", entregadosAbierto, setEntregadosAbierto, false)}
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
