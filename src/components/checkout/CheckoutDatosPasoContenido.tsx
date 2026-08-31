import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { checkoutPrimaryButtonStyle } from "../../styles/inputStyle";
import type { Cliente, DireccionUsuario, Usuario } from "../../types";
import { formatearTelefonoESVisual, normalizarTelefonoES9 } from "../../utils/telefono";
import { repartirNombreApellidos } from "../../utils/appIdentity";
import { hayDatosUbicacionPorCp, textoLineaUbicacionCpCompleta } from "../../utils/direccionUtils";
import UbicacionCpPanel from "../UbicacionCpPanel";
import CalleInputConSugerencias, { CalleInputAyudaSugerencias } from "../CalleInputConSugerencias";
import CheckoutDireccionesPanel from "./CheckoutDireccionesPanel";

type Props = {
  modoDireccionCheckout: boolean;
  modoDireccionUi: "seleccion" | "formulario";
  setModoDireccionUi: (v: "seleccion" | "formulario") => void;
  modoNuevaDireccionCheckout: boolean;
  modoEdicionUnaDireccionCheckout: boolean;
  setModoEdicionUnaDireccionCheckout: (v: boolean) => void;
  usuario: Usuario | null;
  datosCliente: Cliente;
  recordarDatosInvitado: boolean;
  direccionesCheckout: DireccionUsuario[];
  direccionCheckoutSeleccionadaId: string;
  direccionPredeterminadaCheckoutId: string;
  direccionCheckoutSeleccionada: DireccionUsuario | null;
  direccionesMax: number;
  inputStyle: CSSProperties;
  goldColor: string;
  telefonoCheckoutLimpio: string;
  telefonoCheckoutEsValido: boolean;
  telefonoCheckoutPrefijoInvalido: boolean;
  telefonoCheckoutValidPulse: boolean;
  buscandoCalleCheckout: boolean;
  pasoFinalizarCompra: "datos" | "confirmarDireccion" | "pago";
  calleCheckoutResetSignal: number;
  inputCalleCheckoutRef: RefObject<HTMLInputElement | null>;
  inputTelefonoCheckoutRef: RefObject<HTMLInputElement | null>;
  textareaNotasCheckoutRef: RefObject<HTMLTextAreaElement | null>;
  setRecordarDatosInvitado: (v: boolean) => void;
  setDireccionCheckoutSeleccionadaId: (id: string) => void;
  setDireccionCheckoutActiva: (d: DireccionUsuario | null) => void;
  setModoNuevaDireccionCheckout: (v: boolean) => void;
  setDireccionPredeterminadaCheckoutId: (id: string) => void;
  setUsarDireccionPrincipalCheckout: (v: boolean) => void;
  setDatosCliente: (value: Cliente | ((prev: Cliente) => Cliente)) => void;
  aplicarDireccionEnCheckout: (d: DireccionUsuario) => void;
  elegirDireccionParaEnvioPedido: (d: DireccionUsuario) => void;
  mostrarNotificacion: (mensaje: string, tipo: "normal" | "exito" | "error") => void;
  usarDireccionCheckout: (id: string) => void;
  setDireccionCheckoutAEliminarId: (id: string) => void;
  setBuscandoCalleCheckout: (v: boolean) => void;
  guardandoDireccionCheckout: boolean;
  guardandoDireccionHistorialEnCuenta: boolean;
  onGuardarDireccionCheckout: () => void;
  onGuardarDireccionHistorialEnCuenta: () => void;
  onCancelarFormularioDireccionCuenta: () => void;
};

const CHECKOUT_USER_DATA_KEY = "checkout_user_data";

function normalizarTelefonoCheckoutStorage(telefono: unknown): string {
  const limpio = String(telefono ?? "").replace(/[^\d+]/g, "");
  if (!limpio) return "";
  if (limpio.startsWith("+")) return `+${limpio.slice(1).replace(/\+/g, "")}`;
  return limpio.replace(/\+/g, "");
}

function sanitizarClienteCheckoutStorage(cliente: Partial<Cliente>): Partial<Cliente> {
  const nombre = String(cliente.nombre ?? "").trim();
  const apellidos = String(cliente.apellidos ?? "").trim();
  const nombreApellidos = String(cliente.nombreApellidos ?? "").trim() || `${nombre} ${apellidos}`.trim();
  return {
    nombre,
    apellidos,
    nombreApellidos,
    email: String(cliente.email ?? "").trim(),
    dni: String(cliente.dni ?? "").trim(),
    telefono: normalizarTelefonoCheckoutStorage(cliente.telefono),
    direccion: String(cliente.direccion ?? "").trim(),
    calle: String(cliente.calle ?? "").trim(),
    numero: String(cliente.numero ?? "").trim(),
    bloque: String(cliente.bloque ?? "").trim(),
    escalera: String(cliente.escalera ?? "").trim(),
    piso: String(cliente.piso ?? "").trim(),
    puerta: String(cliente.puerta ?? "").trim(),
    ciudad: String(cliente.ciudad ?? "").trim(),
    cp: String(cliente.cp ?? "").trim(),
    poblacion: String(cliente.poblacion ?? "").trim(),
    provincia: String(cliente.provincia ?? "").trim(),
    pais: String(cliente.pais ?? "").trim(),
    notas: String(cliente.notas ?? "").trim()
  };
}

function clienteCheckoutTieneDatos(cliente: Partial<Cliente> | null): cliente is Partial<Cliente> {
  if (!cliente) return false;
  return [
    cliente.nombre,
    cliente.apellidos,
    cliente.nombreApellidos,
    cliente.telefono,
    cliente.calle,
    cliente.numero,
    cliente.cp,
    cliente.poblacion,
    cliente.provincia,
    cliente.notas
  ].some((v) => String(v ?? "").trim().length > 0);
}

export default function CheckoutDatosPasoContenido(props: Props) {
  const {
    modoDireccionCheckout,
    modoDireccionUi,
    setModoDireccionUi,
    modoNuevaDireccionCheckout,
    modoEdicionUnaDireccionCheckout,
    setModoEdicionUnaDireccionCheckout,
    usuario,
    datosCliente,
    recordarDatosInvitado,
    direccionesCheckout, direccionCheckoutSeleccionadaId, direccionPredeterminadaCheckoutId,
    direccionesMax, inputStyle, goldColor, telefonoCheckoutLimpio, telefonoCheckoutEsValido, telefonoCheckoutPrefijoInvalido,
    telefonoCheckoutValidPulse, buscandoCalleCheckout, pasoFinalizarCompra,
    calleCheckoutResetSignal, inputCalleCheckoutRef, inputTelefonoCheckoutRef, textareaNotasCheckoutRef,
    setRecordarDatosInvitado, setDireccionCheckoutSeleccionadaId, setDireccionCheckoutActiva, setModoNuevaDireccionCheckout,
    setDireccionPredeterminadaCheckoutId, setUsarDireccionPrincipalCheckout,     setDatosCliente, aplicarDireccionEnCheckout, elegirDireccionParaEnvioPedido,
    mostrarNotificacion,
    usarDireccionCheckout,
    setDireccionCheckoutAEliminarId,
    setBuscandoCalleCheckout,
    guardandoDireccionCheckout,
    guardandoDireccionHistorialEnCuenta,
    onGuardarDireccionCheckout,
    onGuardarDireccionHistorialEnCuenta,
    onCancelarFormularioDireccionCuenta
  } = props;
  /** Sesión iniciada en finalizar compra: contacto sigue en estado (no se borra); solo se oculta la UI. */
  const ocultarContactoCheckout = Boolean(usuario) && !modoDireccionCheckout;
  const nombreCompletoCheckout =
    `${(datosCliente.nombre || "").trim()} ${(datosCliente.apellidos || "").trim()}`.trim() ||
    (datosCliente.nombreApellidos || "").trim();

  /** En /cuenta?modo=direccion antes solo se mostraba el formulario al pulsar «Nueva», así no se podían editar piso/puerta de una guardada. */
  const editarDireccionSeleccionadaModoCuenta =
    modoDireccionCheckout &&
    !modoNuevaDireccionCheckout &&
    Boolean(direccionCheckoutSeleccionadaId) &&
    direccionCheckoutSeleccionadaId !== "__nueva__" &&
    direccionesCheckout.some((d) => d.id === direccionCheckoutSeleccionadaId);
  const mostrarFormularioUbicacionCalle =
    modoDireccionCheckout
      ? modoDireccionUi === "formulario" && (modoNuevaDireccionCheckout || editarDireccionSeleccionadaModoCuenta)
      : modoNuevaDireccionCheckout ||
        modoEdicionUnaDireccionCheckout ||
        !usuario ||
        direccionesCheckout.length === 0;

  const mostrarNotasEntregaPedido = !modoDireccionCheckout;
  const datosGuardadosCargadosRef = useRef(false);
  const usuarioEditoDatosCheckoutRef = useRef(false);
  const [datosGuardadosCheckout, setDatosGuardadosCheckout] = useState<Partial<Cliente> | null>(null);
  const [mostrarAvisoDatosGuardados, setMostrarAvisoDatosGuardados] = useState(false);

  const setDatosClienteControlado = (value: Cliente | ((prev: Cliente) => Cliente)) => {
    usuarioEditoDatosCheckoutRef.current = true;
    setMostrarAvisoDatosGuardados(false);
    setDatosCliente(value);
  };

  useEffect(() => {
    if (datosGuardadosCargadosRef.current) return;
    datosGuardadosCargadosRef.current = true;
    if (usuario || modoDireccionCheckout) return;
    try {
      const raw = localStorage.getItem(CHECKOUT_USER_DATA_KEY);
      const parsed = raw ? (JSON.parse(raw) as Partial<Cliente>) : null;
      const saneado = parsed ? sanitizarClienteCheckoutStorage(parsed) : null;
      if (clienteCheckoutTieneDatos(saneado)) {
        setDatosGuardadosCheckout(saneado);
        setMostrarAvisoDatosGuardados(true);
      }
    } catch {
      localStorage.removeItem(CHECKOUT_USER_DATA_KEY);
    }
  }, [modoDireccionCheckout, usuario]);

  useEffect(() => {
    if (usuario || modoDireccionCheckout) return;
    if (!recordarDatosInvitado) {
      localStorage.removeItem(CHECKOUT_USER_DATA_KEY);
      return;
    }
    const saneado = sanitizarClienteCheckoutStorage(datosCliente);
    if (!clienteCheckoutTieneDatos(saneado)) return;
    localStorage.setItem(CHECKOUT_USER_DATA_KEY, JSON.stringify(saneado));
  }, [datosCliente, modoDireccionCheckout, recordarDatosInvitado, usuario]);

  const lineaUbicacionCheckout = textoLineaUbicacionCpCompleta(
    datosCliente.poblacion || "",
    datosCliente.provincia || "",
    datosCliente.pais || ""
  );
  /** Texto automático por CP: encima de calle/número, sin recuadro (solo 📍 población, provincia, país; el CP va en el input). */
  const mostrarTextoUbicacionSobreDireccion =
    mostrarFormularioUbicacionCalle &&
    hayDatosUbicacionPorCp(datosCliente.cp || "", datosCliente.poblacion || "", datosCliente.provincia || "") &&
    !!lineaUbicacionCheckout;

  return (
    <div style={{ width: "100%", overflow: "visible" }}>
      <div
        role="form"
        aria-label="Datos del pedido"
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          const target = e.target as HTMLElement;
          if (target instanceof HTMLTextAreaElement) return;
          e.preventDefault();
          const form = e.currentTarget as HTMLDivElement;
          const focusables = Array.from(form.querySelectorAll<HTMLElement>("input, select, textarea, button")).filter((el) => {
            if (el.hasAttribute("disabled")) return false;
            if (el.getAttribute("tabindex") === "-1") return false;
            if (el.getAttribute("aria-hidden") === "true") return false;
            return true;
          });
          const idx = focusables.indexOf(target);
          if (idx >= 0 && idx < focusables.length - 1) focusables[idx + 1].focus();
        }}
        style={{ display: "contents" }}
      >
        <input type="text" name="maika-honeypot-user" autoComplete="off" tabIndex={-1} readOnly aria-hidden style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", border: 0 }} />
        <input type="password" name="maika-honeypot-pass" autoComplete="new-password" tabIndex={-1} readOnly aria-hidden style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", border: 0 }} />

        {modoDireccionCheckout ? (
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ color: "rgba(245,230,200,0.95)", marginTop: 0, marginBottom: 4, fontSize: 20, fontWeight: 600, letterSpacing: "0.02em" }}>
              Dirección de envío
            </h2>
          </div>
        ) : (
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ color: "rgba(245,230,200,0.95)", marginTop: 0, marginBottom: 4, fontSize: 20, fontWeight: 600, letterSpacing: "0.02em" }}>
              Datos de envío
            </h2>
            <p
              style={{
                margin: 0,
                marginBottom: 8,
                fontSize: 13,
                lineHeight: 1.45,
                color: "rgba(245, 230, 200, 0.88)",
                opacity: 0.6
              }}
            >
              Solo te pedimos lo necesario para enviarte el pedido
            </p>
          </div>
        )}
        {!modoDireccionCheckout && !usuario && mostrarAvisoDatosGuardados && datosGuardadosCheckout ? (
          <div
            style={{
              margin: "0 0 12px",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(212,175,55,0.32)",
              background: "rgba(212,175,55,0.08)",
              color: "rgba(245,230,200,0.94)",
              fontSize: 12,
              lineHeight: 1.45
            }}
          >
            <strong style={{ display: "block", marginBottom: 4, color: goldColor }}>Datos encontrados</strong>
            <div>Este dispositivo tiene datos guardados. Por privacidad, puedes usarlos o editarlos.</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  setRecordarDatosInvitado(true);
                  setDatosClienteControlado((prev) => ({
                    ...prev,
                    ...datosGuardadosCheckout
                  }));
                }}
                style={{
                  flex: "1 1 130px",
                  padding: "8px 10px",
                  borderRadius: 9,
                  border: "none",
                  background: "linear-gradient(135deg, #d4af37, #f1d27a)",
                  color: "#1b1745",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Usar estos datos
              </button>
              <button
                type="button"
                onClick={() => {
                  usuarioEditoDatosCheckoutRef.current = true;
                  setMostrarAvisoDatosGuardados(false);
                }}
                style={{
                  flex: "1 1 90px",
                  padding: "8px 10px",
                  borderRadius: 9,
                  border: "1px solid rgba(212,175,55,0.35)",
                  background: "transparent",
                  color: "rgba(245,230,200,0.9)",
                  fontWeight: 650,
                  cursor: "pointer"
                }}
              >
                Editar
              </button>
            </div>
          </div>
        ) : null}
        {ocultarContactoCheckout && nombreCompletoCheckout ? (
          <div
            style={{
              margin: "0 0 12px",
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(212,175,55,0.28)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(245,230,200,0.94)",
              fontSize: 13,
              lineHeight: 1.35
            }}
          >
            👤 <strong style={{ color: goldColor }}>{nombreCompletoCheckout}</strong>
          </div>
        ) : null}

        <CheckoutDireccionesPanel
          usuario={usuario}
          modoDireccionCheckout={modoDireccionCheckout}
          modoDireccionUi={modoDireccionUi}
          setModoDireccionUi={setModoDireccionUi}
          modoNuevaDireccionCheckout={modoNuevaDireccionCheckout}
          modoEdicionUnaDireccionCheckout={modoEdicionUnaDireccionCheckout}
          setModoEdicionUnaDireccionCheckout={setModoEdicionUnaDireccionCheckout}
          direccionesCheckout={direccionesCheckout}
          direccionCheckoutSeleccionadaId={direccionCheckoutSeleccionadaId}
          direccionPredeterminadaCheckoutId={direccionPredeterminadaCheckoutId}
          direccionesMax={direccionesMax}
          inputStyle={inputStyle}
          goldColor={goldColor}
          setDireccionCheckoutSeleccionadaId={setDireccionCheckoutSeleccionadaId}
          setDireccionCheckoutActiva={setDireccionCheckoutActiva}
          setModoNuevaDireccionCheckout={setModoNuevaDireccionCheckout}
          setDireccionPredeterminadaCheckoutId={setDireccionPredeterminadaCheckoutId}
          setUsarDireccionPrincipalCheckout={setUsarDireccionPrincipalCheckout}
          setDatosCliente={(updater) => setDatosClienteControlado(updater)}
          aplicarDireccionEnCheckout={aplicarDireccionEnCheckout}
          elegirDireccionParaEnvioPedido={elegirDireccionParaEnvioPedido}
          mostrarNotificacion={mostrarNotificacion}
          usarDireccionCheckout={usarDireccionCheckout}
          setDireccionCheckoutAEliminarId={setDireccionCheckoutAEliminarId}
          onGuardarDireccionHistorialEnCuenta={onGuardarDireccionHistorialEnCuenta}
          guardandoDireccionHistorialEnCuenta={guardandoDireccionHistorialEnCuenta}
        />

        {!ocultarContactoCheckout && (
          <>
            <input
              type="text"
              name="maika-checkout-nombre-completo"
              placeholder="Nombre y apellidos *"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              value={datosCliente.nombreApellidos ?? `${(datosCliente.nombre || "").trim()} ${(datosCliente.apellidos || "").trim()}`.trim()}
              disabled={modoDireccionCheckout}
              onChange={(e) => {
                const completo = e.target.value;
                const repartido = repartirNombreApellidos(completo, "");
                setDatosClienteControlado({
                  ...datosCliente,
                  nombre: repartido.nombre,
                  apellidos: repartido.apellidos,
                  nombreApellidos: completo
                });
              }}
              onBlur={() => {
                const completo = String(datosCliente.nombreApellidos || "").trim();
                const repartido = repartirNombreApellidos(completo, "");
                setDatosClienteControlado({
                  ...datosCliente,
                  nombre: repartido.nombre,
                  apellidos: repartido.apellidos,
                  nombreApellidos: completo
                });
              }}
              style={{ ...inputStyle }}
            />

            <div className="checkout-contact-grid">
              <div>
                <input ref={inputTelefonoCheckoutRef} type="text" name="maika-checkout-telefono" placeholder="Teléfono *" autoComplete="off" data-lpignore="true" data-1p-ignore="true" value={formatearTelefonoESVisual(datosCliente.telefono || "")} disabled={modoDireccionCheckout || !!usuario} onChange={(e) => setDatosClienteControlado({ ...datosCliente, telefono: normalizarTelefonoES9(e.target.value).slice(0, 9) })} style={{ ...inputStyle, marginBottom: 0, touchAction: "manipulation", opacity: (modoDireccionCheckout || !!usuario) ? 0.86 : 1, cursor: (modoDireccionCheckout || !!usuario) ? "not-allowed" : "text" }} inputMode="numeric" />
                {!modoDireccionCheckout && !usuario && telefonoCheckoutLimpio.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 12, userSelect: "none", WebkitUserSelect: "none", color: telefonoCheckoutEsValido ? "rgba(126, 205, 143, 0.95)" : telefonoCheckoutPrefijoInvalido ? "rgba(201,162,74,0.9)" : "rgba(255,255,255,0.62)", transition: "all 0.2s ease", transform: telefonoCheckoutValidPulse ? "scale(1.02)" : "scale(1)", textShadow: telefonoCheckoutEsValido ? "0 0 6px rgba(126,205,143,0.22)" : "none" }}>
                    {telefonoCheckoutEsValido ? "Teléfono correcto" : telefonoCheckoutPrefijoInvalido ? "Debe empezar por 6 o 7" : `${telefonoCheckoutLimpio.length} / 9 dígitos`}
                  </div>
                )}
                {!!usuario && (
                  <div style={{ marginTop: 6, fontSize: 11, color: "rgba(201,162,74,0.9)" }}>
                    Teléfono bloqueado para clientes. Solo editable por administrador.
                  </div>
                )}
              </div>
              <div>
                <input type="email" name="maika-checkout-email-principal" placeholder="Email (opcional)" autoComplete="off" data-lpignore="true" data-1p-ignore="true" value={datosCliente.email || ""} disabled={modoDireccionCheckout || !!usuario} onChange={(e) => setDatosClienteControlado({ ...datosCliente, email: e.target.value.trim() })} style={{ ...inputStyle, marginBottom: 0, opacity: (modoDireccionCheckout || !!usuario) ? 0.86 : 1, cursor: (modoDireccionCheckout || !!usuario) ? "not-allowed" : "text" }} />
                {!!usuario && (
                  <div style={{ marginTop: 6, fontSize: 11, color: "rgba(201,162,74,0.9)" }}>
                    Email bloqueado para clientes. Solo editable por administrador.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {mostrarFormularioUbicacionCalle && (
          <>
            <UbicacionCpPanel
              namePrefix="maika-checkout"
              layoutUbicacion="cpSolo"
              cp={datosCliente.cp || ""}
              onCpChange={(next) => setDatosClienteControlado((prev) => ({ ...prev, cp: next, ...(next.length < 5 ? { poblacion: "", provincia: "", pais: "" } : {}) }))}
              onCpKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                e.stopPropagation();
                inputCalleCheckoutRef.current?.focus();
              }}
              poblacion={datosCliente.poblacion || ""}
              provincia={datosCliente.provincia || ""}
              pais={datosCliente.pais || ""}
              inputStyle={inputStyle}
            />
            {mostrarTextoUbicacionSobreDireccion && (
              <div
                style={{
                  marginTop: 2,
                  marginBottom: 6,
                  padding: 0,
                  border: "none",
                  background: "transparent",
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "rgba(255, 255, 255, 0.7)"
                }}
              >
                <div translate="no" className="notranslate" lang="es" style={{ fontWeight: 400 }}>
                  {lineaUbicacionCheckout}
                </div>
              </div>
            )}
          <div style={{ marginTop: 2, marginBottom: 8 }}>
            <div className="checkout-direccion-grid" style={{ display: "grid" }}>
              <CalleInputConSugerencias
                name="maika-checkout-calle"
                placeholder="Dirección *"
                value={datosCliente.calle || ""}
                onValueChange={(v) => setDatosClienteControlado((prev) => ({ ...prev, calle: v }))}
                onMergeCampos={(patch) => setDatosClienteControlado((prev) => ({ ...prev, ...patch }))}
                cp={datosCliente.cp || ""}
                poblacion={datosCliente.poblacion || ""}
                inputStyle={inputStyle}
                forwardedRef={inputCalleCheckoutRef}
                attachGooglePlaces={
                  pasoFinalizarCompra === "datos" &&
                  (!modoDireccionCheckout || mostrarFormularioUbicacionCalle || modoEdicionUnaDireccionCheckout)
                }
                resetSignal={calleCheckoutResetSignal}
                onBuscandoPhoton={setBuscandoCalleCheckout}
              />
              <input type="text" name="maika-checkout-numero" placeholder="Num. *" className="checkout-mini-placeholder checkout-direccion-campo-mini" autoComplete="off" data-lpignore="true" data-1p-ignore="true" value={datosCliente.numero || ""} onChange={(e) => setDatosClienteControlado({ ...datosCliente, numero: e.target.value.toUpperCase() })} style={{ ...inputStyle, fontSize: 13, padding: "6px 8px", lineHeight: 1.25, marginBottom: 0, minWidth: 0, textAlign: "center" }} />
              <>
                <input type="text" name="maika-checkout-piso" placeholder="Piso" className="checkout-mini-placeholder checkout-direccion-campo-mini" autoComplete="off" data-lpignore="true" data-1p-ignore="true" value={datosCliente.piso || ""} onChange={(e) => setDatosClienteControlado({ ...datosCliente, piso: e.target.value.toUpperCase() })} style={{ ...inputStyle, fontSize: 13, padding: "6px 8px", lineHeight: 1.25, marginBottom: 0, minWidth: 0, textAlign: "center" }} />
                <input
                  type="text"
                  name="maika-checkout-puerta"
                  placeholder="Puert."
                  className="checkout-mini-placeholder checkout-direccion-campo-mini"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  value={datosCliente.puerta || ""}
                  onChange={(e) => setDatosClienteControlado({ ...datosCliente, puerta: e.target.value.toUpperCase() })}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    e.stopPropagation();
                    textareaNotasCheckoutRef.current?.focus();
                  }}
                  style={{ ...inputStyle, fontSize: 13, padding: "6px 8px", lineHeight: 1.25, marginBottom: 0, minWidth: 0, textAlign: "center" }}
                />
              </>
            </div>
            <CalleInputAyudaSugerencias buscando={buscandoCalleCheckout} />
          </div>
            {modoDireccionCheckout && mostrarFormularioUbicacionCalle ? (
              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={onCancelarFormularioDireccionCuenta}
                  style={{
                    flex: "1 1 120px",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.35)",
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.88)",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onGuardarDireccionCheckout}
                  disabled={guardandoDireccionCheckout}
                  style={{
                    flex: "2 1 180px",
                    padding: "12px 14px",
                    borderRadius: 10,
                    cursor: guardandoDireccionCheckout ? "not-allowed" : "pointer",
                    opacity: guardandoDireccionCheckout ? 0.85 : 1,
                    ...(guardandoDireccionCheckout
                      ? { background: "#8a8a8a", color: "rgba(255,255,255,0.85)", border: "none", boxShadow: "none" }
                      : checkoutPrimaryButtonStyle)
                  }}
                >
                  {guardandoDireccionCheckout ? "guardando…" : "Guardar dirección"}
                </button>
              </div>
            ) : null}
          </>
        )}
        {mostrarNotasEntregaPedido && (
          <textarea
            ref={textareaNotasCheckoutRef}
            name="maika-checkout-notas"
            placeholder="Indicaciones para la entrega (opcional)"
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
            value={datosCliente.notas}
            onChange={(e) => setDatosClienteControlado({ ...datosCliente, notas: e.target.value.toUpperCase() })}
            style={{ ...inputStyle, minHeight: 60, resize: "vertical", marginTop: mostrarFormularioUbicacionCalle ? -4 : 6, marginBottom: 0 }}
          />
        )}
        {!modoDireccionCheckout && !usuario ? (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
              color: "rgba(245,230,200,0.82)",
              fontSize: 12,
              lineHeight: 1.35,
              cursor: "pointer",
              userSelect: "none"
            }}
          >
            <input
              type="checkbox"
              checked={recordarDatosInvitado}
              onChange={(e) => setRecordarDatosInvitado(e.target.checked)}
              style={{ accentColor: goldColor }}
            />
            Guardar datos para próximos pedidos
          </label>
        ) : null}

      </div>
    </div>
  );
}
