import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import type { Cliente, DireccionUsuario, Usuario } from "../../types";
import { lineasResumenEnviaremosA, lineasTextoSeleccionDireccion } from "../../utils/direccion";
import {
  direccionCheckoutEsSoloCamposPerfilSinLibreta,
  direccionCheckoutEsSoloHistorialPedidos,
  partirDireccionesCheckoutPorOrigen
} from "../../utils/direccionCheckoutOrigen";
import CheckoutDireccionesGuardadasList from "./CheckoutDireccionesGuardadasList";

type Props = {
  usuario: Usuario | null;
  modoDireccionCheckout: boolean;
  modoDireccionUi: "seleccion" | "formulario";
  setModoDireccionUi: (v: "seleccion" | "formulario") => void;
  modoNuevaDireccionCheckout: boolean;
  modoEdicionUnaDireccionCheckout: boolean;
  setModoEdicionUnaDireccionCheckout: (v: boolean) => void;
  direccionesCheckout: DireccionUsuario[];
  direccionCheckoutSeleccionadaId: string;
  direccionPredeterminadaCheckoutId: string;
  direccionesMax: number;
  inputStyle: CSSProperties;
  goldColor: string;
  setDireccionCheckoutSeleccionadaId: (id: string) => void;
  setDireccionCheckoutActiva: (d: DireccionUsuario | null) => void;
  setModoNuevaDireccionCheckout: (v: boolean) => void;
  setDireccionPredeterminadaCheckoutId: (id: string) => void;
  setUsarDireccionPrincipalCheckout: (v: boolean) => void;
  setDatosCliente: (updater: (prev: Cliente) => Cliente) => void;
  aplicarDireccionEnCheckout: (d: DireccionUsuario) => void;
  elegirDireccionParaEnvioPedido: (d: DireccionUsuario) => void;
  mostrarNotificacion: (mensaje: string, tipo: "normal" | "exito" | "error") => void;
  usarDireccionCheckout: (id: string) => void;
  setDireccionCheckoutAEliminarId: (id: string) => void;
  onGuardarDireccionHistorialEnCuenta: () => void;
  guardandoDireccionHistorialEnCuenta: boolean;
};

export default function CheckoutDireccionesPanel({
  usuario,
  modoDireccionCheckout,
  modoDireccionUi,
  setModoDireccionUi,
  modoNuevaDireccionCheckout,
  modoEdicionUnaDireccionCheckout,
  setModoEdicionUnaDireccionCheckout,
  direccionesCheckout,
  direccionCheckoutSeleccionadaId,
  direccionPredeterminadaCheckoutId,
  direccionesMax,
  inputStyle,
  goldColor,
  setDireccionCheckoutSeleccionadaId,
  setDireccionCheckoutActiva,
  setModoNuevaDireccionCheckout,
  setDireccionPredeterminadaCheckoutId,
  setUsarDireccionPrincipalCheckout,
  setDatosCliente,
  aplicarDireccionEnCheckout,
  elegirDireccionParaEnvioPedido,
  mostrarNotificacion,
  usarDireccionCheckout,
  setDireccionCheckoutAEliminarId,
  onGuardarDireccionHistorialEnCuenta,
  guardandoDireccionHistorialEnCuenta
}: Props) {
  const [selectorPedidoAbierto, setSelectorPedidoAbierto] = useState(false);
  const [historialPedidosCheckoutDesplegado, setHistorialPedidosCheckoutDesplegado] = useState(false);
  const selectorWrapRef = useRef<HTMLDivElement>(null);
  const selectorId = useId();

  const direccionSeleccionada =
    direccionCheckoutSeleccionadaId &&
    direccionCheckoutSeleccionadaId !== "__nueva__"
      ? direccionesCheckout.find((d) => d.id === direccionCheckoutSeleccionadaId)
      : null;
  const direccionActivaPedido =
    direccionSeleccionada || (direccionesCheckout.length > 0 ? direccionesCheckout[0] : null);

  const envioLineas = direccionSeleccionada ? lineasResumenEnviaremosA(direccionSeleccionada) : null;

  useEffect(() => {
    if (!selectorPedidoAbierto) return;
    const onDown = (e: MouseEvent) => {
      const el = selectorWrapRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) setSelectorPedidoAbierto(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [selectorPedidoAbierto]);

  useEffect(() => {
    if (!selectorPedidoAbierto) setHistorialPedidosCheckoutDesplegado(false);
  }, [selectorPedidoAbierto]);

  if (!usuario) return null;

  const { guardadasYPerfil, soloHistorial } = partirDireccionesCheckoutPorOrigen(usuario, direccionesCheckout);
  const hayHistorialSoloPedidos = soloHistorial.length > 0;

  const checkoutVariasDirecciones = !modoDireccionCheckout && direccionesCheckout.length > 1;
  const mostrarSelectorCompactoPedido = checkoutVariasDirecciones && !modoNuevaDireccionCheckout;
  const uiSeleccionCuenta = modoDireccionCheckout && modoDireccionUi === "seleccion";

  const dirSeleccionadaEnvio =
    direccionCheckoutSeleccionadaId && direccionCheckoutSeleccionadaId !== "__nueva__"
      ? direccionesCheckout.find((x) => x.id === direccionCheckoutSeleccionadaId)
      : null;
  const mostrarCtaGuardarHistorialEnCuenta =
    !modoDireccionCheckout &&
    Boolean(dirSeleccionadaEnvio && direccionCheckoutEsSoloHistorialPedidos(usuario, dirSeleccionadaEnvio));

  const mostrarAvisoHistorialSoloEnCuenta =
    modoDireccionCheckout &&
    uiSeleccionCuenta &&
    Boolean(
      direccionSeleccionada && direccionCheckoutEsSoloHistorialPedidos(usuario, direccionSeleccionada)
    );

  /** Con 1 dirección en pedido: resumen compacto. Con 2+ en pedido: selector compacto (no lista de tarjetas). */
  const mostrarResumenAutomatico =
    Boolean(direccionSeleccionada && envioLineas && (envioLineas.lineaCalle || envioLineas.lineaCpLoc)) &&
    !modoNuevaDireccionCheckout &&
    !modoEdicionUnaDireccionCheckout &&
    !checkoutVariasDirecciones &&
    uiSeleccionCuenta;

  /** Solo flujo cuenta: lista de tarjetas con Usar / Eliminar. En pedido con 2+ → selector, no lista. */
  const listaVisible = modoDireccionCheckout && !modoNuevaDireccionCheckout && uiSeleccionCuenta;

  const mostrarFilaSelect =
    !mostrarResumenAutomatico && !modoEdicionUnaDireccionCheckout && modoDireccionCheckout && uiSeleccionCuenta;

  const abrirNuevaDireccion = () => {
    if (modoDireccionCheckout && direccionesCheckout.length >= direccionesMax) {
      mostrarNotificacion("Máximo 3 direcciones", "normal");
      return;
    }
    setModoEdicionUnaDireccionCheckout(false);
    setModoNuevaDireccionCheckout(true);
    setDireccionCheckoutActiva(null);
    setDireccionPredeterminadaCheckoutId("");
    setUsarDireccionPrincipalCheckout(true);
    if (!modoDireccionCheckout) setDireccionCheckoutSeleccionadaId("__nueva__");
    setDatosCliente((prev) => ({
      ...prev,
      direccion: "",
      calle: "",
      numero: "",
      bloque: "",
      escalera: "",
      piso: "",
      puerta: "",
      cp: "",
      poblacion: "",
      ciudad: "",
      provincia: "",
      pais: prev.pais || "ESPAÑA"
    }));
    setSelectorPedidoAbierto(false);
    if (modoDireccionCheckout) setModoDireccionUi("formulario");
  };

  const volverDesdeNuevaDireccionCheckout = () => {
    if (modoDireccionCheckout) setModoDireccionUi("seleccion");
    setModoNuevaDireccionCheckout(false);
    if (direccionesCheckout.length === 0) {
      return;
    }
    const pred = (direccionPredeterminadaCheckoutId || "").trim();
    const idPreferido =
      pred && direccionesCheckout.some((d) => d.id === pred) ? pred : direccionesCheckout[0].id;
    const dir = direccionesCheckout.find((d) => d.id === idPreferido) || direccionesCheckout[0];
    setDireccionCheckoutSeleccionadaId(dir.id);
    aplicarDireccionEnCheckout(dir);
    if (direccionesCheckout.length === 1) {
      setModoEdicionUnaDireccionCheckout(true);
    }
  };

  const elegirDireccionDesdeSelector = (d: DireccionUsuario) => {
    elegirDireccionParaEnvioPedido(d);
    setSelectorPedidoAbierto(false);
  };

  const renderOpcionSelector = (d: DireccionUsuario) => {
    const activa = d.id === direccionCheckoutSeleccionadaId;
    const esSoloHistorialPedidos = direccionCheckoutEsSoloHistorialPedidos(usuario, d);
    const soloPerfilSinLibreta = direccionCheckoutEsSoloCamposPerfilSinLibreta(usuario, d);
    const { linea1, linea2 } = lineasTextoSeleccionDireccion(d);
    return (
      <button
        key={d.id}
        type="button"
        role="option"
        aria-selected={activa}
        onClick={() => elegirDireccionDesdeSelector(d)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "6px 8px",
          marginBottom: 1,
          borderRadius: 7,
          border: activa ? `1px solid ${goldColor}` : "1px solid transparent",
          background: activa ? "rgba(201,162,74,0.16)" : "transparent",
          color: "rgba(255,255,255,0.92)",
          cursor: "pointer",
          lineHeight: 1.3,
          display: "flex",
          gap: 6,
          alignItems: "flex-start"
        }}
      >
        <span style={{ width: 12, flexShrink: 0, color: goldColor, fontWeight: 800, fontSize: 11 }} aria-hidden>
          {activa ? "✓" : ""}
        </span>
        <span style={{ flex: 1, minWidth: 0, wordBreak: "break-word" }}>
          <span style={{ display: "block", fontWeight: activa ? 700 : 600, fontSize: 12, color: "rgba(255,255,255,0.95)" }}>
            {linea1 || "—"}
          </span>
          {linea2 ? (
            <span
              style={{
                display: "block",
                marginTop: 2,
                fontSize: 10,
                fontWeight: 500,
                color: "rgba(190, 185, 230, 0.82)"
              }}
            >
              {linea2}
            </span>
          ) : null}
          {esSoloHistorialPedidos ? (
            <span
              style={{
                display: "block",
                marginTop: 3,
                fontSize: 9,
                fontWeight: 600,
                color: "rgba(245,200,120,0.72)",
                letterSpacing: "0.02em"
              }}
            >
              Pedido anterior · no está en Mi cuenta
            </span>
          ) : null}
          {soloPerfilSinLibreta ? (
            <span
              style={{
                display: "block",
                marginTop: esSoloHistorialPedidos ? 2 : 3,
                fontSize: 9,
                fontWeight: 600,
                color: "rgba(200,220,255,0.68)",
                letterSpacing: "0.02em"
              }}
            >
              Solo en tu ficha de perfil
            </span>
          ) : null}
        </span>
      </button>
    );
  };

  const lineasActivaPedido = direccionActivaPedido ? lineasTextoSeleccionDireccion(direccionActivaPedido) : { linea1: "", linea2: "" };

  return (
    <div style={{ marginBottom: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 10, padding: 8 }}>
      {mostrarSelectorCompactoPedido ? (
        <div style={{ marginBottom: 8 }}>
          <div style={{ color: goldColor, fontWeight: "bold", fontSize: 13, marginBottom: 3 }}>Dirección de envío</div>
          {hayHistorialSoloPedidos ? (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.68)", lineHeight: 1.35 }}>
              {guardadasYPerfil.length} guardada{guardadasYPerfil.length !== 1 ? "s" : ""} · {soloHistorial.length} usada
              {soloHistorial.length !== 1 ? "s" : ""} anteriormente
            </div>
          ) : (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.62)" }}>
              {direccionesCheckout.length} dirección{direccionesCheckout.length !== 1 ? "es" : ""} disponible
              {direccionesCheckout.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      ) : (
        <p style={{ margin: "0 0 8px", color: goldColor, fontWeight: "bold", fontSize: 13 }}>
          {hayHistorialSoloPedidos
            ? `Direcciones guardadas (${guardadasYPerfil.length}/${direccionesMax})`
            : `Direcciones guardadas (${direccionesCheckout.length}/${direccionesMax})`}
        </p>
      )}

      {mostrarSelectorCompactoPedido && direccionActivaPedido ? (
        <div ref={selectorWrapRef} style={{ position: "relative", marginBottom: 10 }}>
          <button
            type="button"
            id={selectorId}
            aria-haspopup="listbox"
            aria-expanded={selectorPedidoAbierto}
            onClick={() => setSelectorPedidoAbierto((o) => !o)}
            style={{
              width: "100%",
              textAlign: "left",
              display: "flex",
              alignItems: "stretch",
              gap: 8,
              padding: "10px 12px",
              borderRadius: 12,
              border: `2px solid ${goldColor}`,
              background: "rgba(201,162,74,0.14)",
              boxShadow: "0 0 0 1px rgba(246,211,101,0.12), 0 4px 20px rgba(0,0,0,0.25)",
              cursor: "pointer",
              color: "rgba(255,255,255,0.95)"
            }}
          >
            <span style={{ fontSize: 15, lineHeight: 1, opacity: 0.9, flexShrink: 0 }} aria-hidden>
              ✓
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: "block",
                  fontWeight: 700,
                  fontSize: 13,
                  lineHeight: 1.3,
                  letterSpacing: "0.015em",
                  color: "rgba(255,255,255,0.96)"
                }}
              >
                {lineasActivaPedido.linea1 || "—"}
              </span>
              {lineasActivaPedido.linea2 ? (
                <span
                  style={{
                    display: "block",
                    marginTop: 3,
                    fontSize: 11,
                    fontWeight: 500,
                    color: "rgba(190, 185, 230, 0.88)",
                    lineHeight: 1.35
                  }}
                >
                  {lineasActivaPedido.linea2}
                </span>
              ) : null}
              <span style={{ display: "block", marginTop: 4, fontSize: 10, color: "rgba(245,230,200,0.62)", fontWeight: 600 }}>
                Cambiar
              </span>
            </span>
            <span
              style={{
                flexShrink: 0,
                alignSelf: "center",
                fontSize: 11,
                color: goldColor,
                fontWeight: 800,
                letterSpacing: "0.06em"
              }}
              aria-hidden
            >
              {selectorPedidoAbierto ? "▲" : "▼"}
            </span>
          </button>

          {selectorPedidoAbierto ? (
            <div
              role="listbox"
              aria-labelledby={selectorId}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "calc(100% + 6px)",
                zIndex: 50,
                borderRadius: 12,
                border: "1px solid rgba(212,175,55,0.45)",
                background: "rgba(22,18,48,0.98)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
                maxHeight: 260,
                overflowY: "auto",
                padding: 4
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(245,230,200,0.55)", padding: "4px 6px 2px", letterSpacing: "0.04em" }}>
                Elegir dirección
              </div>
              {guardadasYPerfil.length > 0 ? (
                <>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(200,255,200,0.5)", padding: "2px 6px 1px", letterSpacing: "0.06em" }}>
                    EN TU CUENTA
                  </div>
                  {guardadasYPerfil.map((d) => renderOpcionSelector(d))}
                </>
              ) : null}
              {hayHistorialSoloPedidos ? (
                <>
                  {guardadasYPerfil.length > 0 ? (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", margin: "8px 0 4px" }} />
                  ) : (
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: "rgba(255,220,160,0.5)",
                        padding: "4px 6px 2px",
                        letterSpacing: "0.05em"
                      }}
                    >
                      SUGERIDAS (NO EN MI CUENTA)
                    </div>
                  )}
                  {guardadasYPerfil.length > 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setHistorialPedidosCheckoutDesplegado((v) => !v)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "6px 8px",
                          marginBottom: 2,
                          borderRadius: 7,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.04)",
                          color: "rgba(245,230,200,0.88)",
                          cursor: "pointer",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.02em"
                        }}
                      >
                        {historialPedidosCheckoutDesplegado ? "▲" : "▼"} Direcciones usadas en pedidos anteriores (
                        {soloHistorial.length})
                      </button>
                      {historialPedidosCheckoutDesplegado ? (
                        <>
                          <div
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: "rgba(255,220,160,0.5)",
                              padding: "2px 6px 4px",
                              letterSpacing: "0.05em"
                            }}
                          >
                            SUGERIDAS (NO EN MI CUENTA)
                          </div>
                          {soloHistorial.map((d) => renderOpcionSelector(d))}
                        </>
                      ) : null}
                    </>
                  ) : (
                    soloHistorial.map((d) => renderOpcionSelector(d))
                  )}
                </>
              ) : null}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", margin: "4px 0 2px" }} />
              <button
                type="button"
                onClick={() => {
                  abrirNuevaDireccion();
                }}
                disabled={direccionesCheckout.length >= direccionesMax}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "7px 8px",
                  borderRadius: 7,
                  border: "none",
                  background: "transparent",
                  color: goldColor,
                  cursor: direccionesCheckout.length >= direccionesMax ? "not-allowed" : "pointer",
                  opacity: direccionesCheckout.length >= direccionesMax ? 0.55 : 1,
                  fontWeight: 700,
                  fontSize: 12
                }}
              >
                + Añadir nueva dirección
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {mostrarCtaGuardarHistorialEnCuenta ? (
        <div
          style={{
            marginBottom: 10,
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid rgba(212, 175, 55, 0.28)",
            background: "rgba(110, 70, 160, 0.14)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            justifyContent: "space-between"
          }}
        >
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.82)", lineHeight: 1.35, flex: "1 1 200px" }}>
            Esta dirección no está guardada en tu cuenta
          </span>
          <button
            type="button"
            disabled={guardandoDireccionHistorialEnCuenta}
            onClick={onGuardarDireccionHistorialEnCuenta}
            style={{
              flexShrink: 0,
              padding: 0,
              border: "none",
              background: "transparent",
              color: goldColor,
              cursor: guardandoDireccionHistorialEnCuenta ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 12,
              textDecoration: "underline",
              textUnderlineOffset: 3,
              opacity: guardandoDireccionHistorialEnCuenta ? 0.65 : 1
            }}
          >
            {guardandoDireccionHistorialEnCuenta ? "Guardando…" : "Guardar en mi cuenta"}
          </button>
        </div>
      ) : null}

      {mostrarResumenAutomatico && envioLineas && (
        <div
          style={{
            marginBottom: 10,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(212,175,55,0.35)",
            background: "rgba(201,162,74,0.08)",
            color: "rgba(245,230,200,0.95)",
            fontSize: 13,
            lineHeight: 1.45
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 8, color: goldColor }}>Enviaremos a</div>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              justifyContent: "space-between"
            }}
          >
            <div style={{ flex: 1, minWidth: 0, color: "rgba(255,255,255,0.92)" }}>
              {envioLineas.lineaCalle ? (
                <div style={{ fontWeight: 700, lineHeight: 1.35, color: "rgba(255,255,255,0.96)" }}>{envioLineas.lineaCalle}</div>
              ) : null}
              {envioLineas.lineaCpLoc ? (
                <div
                  style={{
                    marginTop: 5,
                    fontSize: 11,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.52)",
                    letterSpacing: "0.02em"
                  }}
                >
                  {envioLineas.lineaCpLoc}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                if (!modoDireccionCheckout && direccionesCheckout.length === 1) {
                  setModoEdicionUnaDireccionCheckout(true);
                }
                if (modoDireccionCheckout) {
                  setModoDireccionUi("formulario");
                }
              }}
              style={{
                flexShrink: 0,
                alignSelf: "flex-start",
                padding: "6px 10px",
                borderRadius: 8,
                border: `1px solid ${goldColor}`,
                background: "transparent",
                color: goldColor,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 12
              }}
            >
              Cambiar dirección
            </button>
          </div>
        </div>
      )}
      {mostrarResumenAutomatico && envioLineas && mostrarAvisoHistorialSoloEnCuenta ? (
        <div
          style={{
            marginTop: -4,
            marginBottom: 10,
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid rgba(212, 175, 55, 0.28)",
            background: "rgba(110, 70, 160, 0.14)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            justifyContent: "space-between"
          }}
        >
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.82)", lineHeight: 1.35, flex: "1 1 200px" }}>
            Esta dirección no está guardada en tu cuenta
          </span>
          <button
            type="button"
            disabled={guardandoDireccionHistorialEnCuenta}
            onClick={onGuardarDireccionHistorialEnCuenta}
            style={{
              flexShrink: 0,
              padding: 0,
              border: "none",
              background: "transparent",
              color: goldColor,
              cursor: guardandoDireccionHistorialEnCuenta ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 12,
              textDecoration: "underline",
              textUnderlineOffset: 3,
              opacity: guardandoDireccionHistorialEnCuenta ? 0.65 : 1
            }}
          >
            {guardandoDireccionHistorialEnCuenta ? "Guardando…" : "Guardar en mi cuenta"}
          </button>
        </div>
      ) : null}
      {modoEdicionUnaDireccionCheckout && !modoDireccionCheckout && direccionesCheckout.length === 1 && (
        <div
          style={{
            marginBottom: 10,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(212,175,55,0.35)",
            background: "rgba(201,162,74,0.08)",
            color: "rgba(245,230,200,0.95)"
          }}
        >
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: goldColor }}>
            Editar dirección de envío
          </p>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.78)", lineHeight: 1.45 }}>
            Modifica CP, calle y número en el formulario de abajo.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <button type="button" onClick={abrirNuevaDireccion} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${goldColor}`, background: "transparent", color: goldColor, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
              + añadir nueva dirección
            </button>
            <button
              type="button"
              onClick={() => setModoEdicionUnaDireccionCheckout(false)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.85)",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 12
              }}
            >
              volver
            </button>
          </div>
        </div>
      )}
      {modoNuevaDireccionCheckout && !modoDireccionCheckout && (
        <div
          style={{
            marginBottom: 10,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(212,175,55,0.35)",
            background: "rgba(201,162,74,0.08)",
            color: "rgba(245,230,200,0.95)"
          }}
        >
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: goldColor }}>
            Nueva dirección de envío
          </p>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.78)", lineHeight: 1.45 }}>
            Rellena CP, calle y número en el formulario de abajo (mismo formulario, datos vacíos).
          </p>
          <button
            type="button"
            onClick={volverDesdeNuevaDireccionCheckout}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.35)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.85)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 12
            }}
          >
            volver
          </button>
        </div>
      )}
      {mostrarFilaSelect && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
          <select
            value={direccionCheckoutSeleccionadaId}
            onChange={(e) => {
              const id = e.target.value;
              setDireccionCheckoutSeleccionadaId(id);
              if (id === "__nueva__") {
                setDireccionCheckoutActiva(null);
                setModoNuevaDireccionCheckout(true);
                setDireccionPredeterminadaCheckoutId("");
                setUsarDireccionPrincipalCheckout(true);
                setDatosCliente((prev) => ({
                  ...prev,
                  direccion: "",
                  calle: "",
                  numero: "",
                  bloque: "",
                  escalera: "",
                  piso: "",
                  puerta: "",
                  cp: "",
                  poblacion: "",
                  ciudad: "",
                  provincia: "",
                  pais: prev.pais || "ESPAÑA"
                }));
                return;
              }
              const dir = direccionesCheckout.find((d) => d.id === id);
              if (dir) elegirDireccionParaEnvioPedido(dir);
            }}
            style={{ ...inputStyle, marginBottom: 0 }}
          >
            {((!modoDireccionCheckout && (direccionesCheckout.length === 0 || modoNuevaDireccionCheckout)) ||
              (modoDireccionCheckout && direccionesCheckout.length === 0)) && (
              <option value="__nueva__">nueva dirección</option>
            )}
            {hayHistorialSoloPedidos ? (
              <>
                <optgroup label="En tu cuenta">
                  {guardadasYPerfil.map((d) => {
                    const { linea1, linea2 } = lineasTextoSeleccionDireccion(d);
                    const textoOpcion = [linea1, linea2].filter(Boolean).join("\n");
                    return (
                      <option key={d.id} value={d.id}>
                        {textoOpcion || "—"}
                      </option>
                    );
                  })}
                </optgroup>
                <optgroup label="Sugeridas (pedidos anteriores)">
                  {soloHistorial.map((d) => {
                    const { linea1, linea2 } = lineasTextoSeleccionDireccion(d);
                    const textoOpcion = [linea1, linea2].filter(Boolean).join("\n");
                    return (
                      <option key={d.id} value={d.id}>
                        {textoOpcion || "—"}
                      </option>
                    );
                  })}
                </optgroup>
              </>
            ) : (
              direccionesCheckout.map((d) => {
                const { linea1, linea2 } = lineasTextoSeleccionDireccion(d);
                const textoOpcion = [linea1, linea2].filter(Boolean).join("\n");
                return (
                  <option key={d.id} value={d.id}>
                    {textoOpcion || "—"}
                  </option>
                );
              })
            )}
          </select>
          <button
            type="button"
            disabled={modoDireccionCheckout && direccionesCheckout.length >= direccionesMax}
            onClick={abrirNuevaDireccion}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${goldColor}`,
              background: "transparent",
              color: goldColor,
              cursor: modoDireccionCheckout && direccionesCheckout.length >= direccionesMax ? "not-allowed" : "pointer",
              opacity: modoDireccionCheckout && direccionesCheckout.length >= direccionesMax ? 0.65 : 1,
              fontWeight: "bold"
            }}
          >
            Nueva
          </button>
        </div>
      )}
      {direccionesCheckout.length > 0 &&
        !checkoutVariasDirecciones &&
        !modoEdicionUnaDireccionCheckout &&
        !(modoNuevaDireccionCheckout && !modoDireccionCheckout) &&
        !modoDireccionCheckout && (
          <div style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.72)" }}>
            Dirección actual:{" "}
            <span style={{ color: goldColor, fontWeight: 700 }}>
              {direccionesCheckout.find((d) => d.id === (direccionPredeterminadaCheckoutId || "").trim())?.alias || "Primera direccion"}
            </span>
          </div>
        )}
      <CheckoutDireccionesGuardadasList
        usuario={usuario}
        modoDireccionCheckout={modoDireccionCheckout}
        listaVisible={listaVisible}
        uiCompactaCuenta={uiSeleccionCuenta}
        mostrarEliminar={modoDireccionCheckout}
        direccionesCheckout={direccionesCheckout}
        direccionCheckoutSeleccionadaId={direccionCheckoutSeleccionadaId}
        direccionPredeterminadaCheckoutId={direccionPredeterminadaCheckoutId}
        goldColor={goldColor}
        onUsarDireccion={(id) => {
          usarDireccionCheckout(id);
        }}
        onSeleccionarDireccion={(d) => {
          elegirDireccionParaEnvioPedido(d);
        }}
        onEliminarDireccion={(id) => setDireccionCheckoutAEliminarId(id)}
      />
      {uiSeleccionCuenta ? (
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={abrirNuevaDireccion}
            disabled={direccionesCheckout.length >= direccionesMax}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid rgba(212, 175, 55, 0.55)",
              background: "rgba(201, 162, 74, 0.1)",
              color: goldColor,
              cursor: direccionesCheckout.length >= direccionesMax ? "not-allowed" : "pointer",
              opacity: direccionesCheckout.length >= direccionesMax ? 0.55 : 1,
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: "0.02em",
              transition: "box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease, transform 0.15s ease",
              boxShadow: "0 0 0 1px rgba(246, 211, 101, 0.08)"
            }}
            onMouseEnter={(e) => {
              if (direccionesCheckout.length >= direccionesMax) return;
              const el = e.currentTarget;
              el.style.borderColor = "rgba(212, 175, 55, 0.85)";
              el.style.background = "rgba(201, 162, 74, 0.2)";
              el.style.boxShadow = "0 0 22px rgba(201, 162, 74, 0.35), 0 0 0 1px rgba(246, 211, 101, 0.12)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = "rgba(212, 175, 55, 0.55)";
              el.style.background = "rgba(201, 162, 74, 0.1)";
              el.style.boxShadow = "0 0 0 1px rgba(246, 211, 101, 0.08)";
            }}
          >
            Añadir nueva dirección
          </button>
        </div>
      ) : null}
      {modoDireccionCheckout && direccionesCheckout.length >= direccionesMax && (
        <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.55)" }}>Máximo {direccionesMax} direcciones.</p>
      )}
      {modoDireccionCheckout && direccionesCheckout.length <= 1 && uiSeleccionCuenta ? (
        <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Necesitas al menos una dirección.</p>
      ) : null}
    </div>
  );
}
