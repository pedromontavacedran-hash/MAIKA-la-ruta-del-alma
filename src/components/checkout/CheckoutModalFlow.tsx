import { useEffect, useLayoutEffect, useRef, useState, type MutableRefObject, type RefObject } from "react";
import ModalBase from "../ModalBase";
import type { Cliente, CuponAplicado, DireccionUsuario, Usuario } from "../../types";
import CheckoutConfirmarDireccionPaso from "./CheckoutConfirmarDireccionPaso";
import CheckoutPagoPaso from "./CheckoutPagoPaso";
import CheckoutDatosPasoContenido from "./CheckoutDatosPasoContenido";
import CheckoutResumenCuponAcciones from "./CheckoutResumenCuponAcciones";
import CheckoutPasosIndicador from "./CheckoutPasosIndicador";
import { DATOS_PAGO_VACIOS, type DatosPago } from "../../utils/pago";
import { checkoutInputStyle } from "../../styles/inputStyle";

type Props = {
  visible: boolean;
  pasoFinalizarCompra: "datos" | "confirmarDireccion" | "pago";
  bgColor: string;
  goldColor: string;
  compraRapidaCheckoutDisponible: boolean;
  onComprarEnUnClick: () => void;
  datosCliente: Cliente;
  modoDireccionCheckout: boolean;
  modoNuevaDireccionCheckout: boolean;
  modoEdicionUnaDireccionCheckout: boolean;
  setModoEdicionUnaDireccionCheckout: (v: boolean) => void;
  usuario: Usuario | null;
  recordarDatosInvitado: boolean;
  numeroPedidoPreview: string;
  direccionesCheckout: DireccionUsuario[];
  direccionCheckoutSeleccionadaId: string;
  direccionPredeterminadaCheckoutId: string;
  direccionCheckoutSeleccionada: DireccionUsuario | null;
  direccionesMax: number;
  telefonoCheckoutLimpio: string;
  telefonoCheckoutEsValido: boolean;
  telefonoCheckoutPrefijoInvalido: boolean;
  telefonoCheckoutValidPulse: boolean;
  buscandoCalleCheckout: boolean;
  calleCheckoutResetSignal: number;
  inputCalleCheckoutRef: RefObject<HTMLInputElement | null>;
  inputTelefonoCheckoutRef: RefObject<HTMLInputElement | null>;
  textareaNotasCheckoutRef: RefObject<HTMLTextAreaElement | null>;
  metodoPago: "bizum" | "tarjeta";
  datosPago: DatosPago;
  total: number;
  envioPreview: number;
  cuponAplicado: CuponAplicado | null;
  totalAPagarResumen: number;
  procesandoPago: boolean;
  mensajeErrorCheckoutPago: string | null;
  checkoutHayRechazoServidor: boolean;
  onVolverDesdePago: () => void;
  guardandoDireccionCheckout: boolean;
  guardandoDireccionHistorialEnCuenta: boolean;
  accesoRapidoCheckoutAbierto: boolean;
  mostrarInputCuponCheckout: boolean;
  cuponError: string | null;
  cuponInput: string;
  botonIrAlPagoRef: RefObject<HTMLButtonElement | null>;
  irAlPagoPointerIdRef: MutableRefObject<number | null>;
  irAlPagoEjecutarRef: MutableRefObject<() => void>;
  checkoutIrAlPagoGesturaActiva: boolean;
  onCheckoutIrAlPagoGesturaInicio: () => void;
  onCheckoutIrAlPagoGesturaFin: () => void;
  normalizarTelefonoBizum: (telefono: string) => string;
  onCerrar: () => void;
  onSetPasoFinalizarCompra: (paso: "datos" | "confirmarDireccion" | "pago") => void;
  onSetDatosPago: (v: DatosPago | ((prev: DatosPago) => DatosPago)) => void;
  onSetMetodoPago: (m: "bizum" | "tarjeta") => void;
  onEnviarPedidoWhatsApp: () => void | Promise<void>;
  onSetRecordarDatosInvitado: (v: boolean) => void;
  onSetDireccionCheckoutSeleccionadaId: (id: string) => void;
  onSetDireccionCheckoutActiva: (d: DireccionUsuario | null) => void;
  onSetModoNuevaDireccionCheckout: (v: boolean) => void;
  onSetDireccionPredeterminadaCheckoutId: (id: string) => void;
  onSetUsarDireccionPrincipalCheckout: (v: boolean) => void;
  onSetDatosCliente: (value: Cliente | ((prev: Cliente) => Cliente)) => void;
  onAplicarDireccionEnCheckout: (d: DireccionUsuario) => void;
  onElegirDireccionParaEnvioPedido: (d: DireccionUsuario) => void;
  onMostrarNotificacion: (m: string, t: "normal" | "exito" | "error") => void;
  onUsarDireccionCheckout: (id: string) => void;
  onSetDireccionCheckoutAEliminarId: (id: string) => void;
  onSetBuscandoCalleCheckout: (v: boolean) => void;
  onToggleMostrarInputCupon: (v: boolean) => void;
  onSetCuponInput: (v: string) => void;
  onSetCuponErrorNull: () => void;
  onAplicarCupon: () => void;
  onQuitarCupon: () => void;
  onGuardarDireccionCheckout: () => void | Promise<void>;
  onGuardarDireccionHistorialEnCuenta: () => void | Promise<void>;
  /** Invitado: abre login (p. ej. acceso rápido) sin cerrar el checkout. */
  onAbrirLogin?: () => void;
};

export default function CheckoutModalFlow(props: Props) {
  const p = props;

  /** UI cuenta «Dirección de envío»: selección vs formulario (no altera hooks de checkout). */
  const [modoDireccionUi, setModoDireccionUi] = useState<"seleccion" | "formulario">("seleccion");

  useEffect(() => {
    if (!p.modoDireccionCheckout) setModoDireccionUi("seleccion");
  }, [p.modoDireccionCheckout]);

  const prevNuevaDireccionCheckoutRef = useRef(p.modoNuevaDireccionCheckout);
  useEffect(() => {
    if (!p.modoDireccionCheckout) {
      prevNuevaDireccionCheckoutRef.current = p.modoNuevaDireccionCheckout;
      return;
    }
    const was = prevNuevaDireccionCheckoutRef.current;
    const now = p.modoNuevaDireccionCheckout;
    if (was === true && now === false) {
      setModoDireccionUi("seleccion");
    }
    prevNuevaDireccionCheckoutRef.current = now;
  }, [p.modoNuevaDireccionCheckout, p.modoDireccionCheckout]);

  const prevGuardandoDireccionRef = useRef(p.guardandoDireccionCheckout);
  useEffect(() => {
    if (modoDireccionUi === "formulario" && p.modoDireccionCheckout) {
      prevGuardandoDireccionRef.current = p.guardandoDireccionCheckout;
    }
  }, [modoDireccionUi, p.modoDireccionCheckout]);

  useEffect(() => {
    if (!p.modoDireccionCheckout || modoDireccionUi !== "formulario") {
      return;
    }
    const was = prevGuardandoDireccionRef.current;
    const now = p.guardandoDireccionCheckout;
    if (was === true && now === false) {
      setModoDireccionUi("seleccion");
    }
    prevGuardandoDireccionRef.current = now;
  }, [p.guardandoDireccionCheckout, p.modoDireccionCheckout, modoDireccionUi]);

  const editarDireccionCuentaConSeleccion =
    p.modoDireccionCheckout &&
    !p.modoNuevaDireccionCheckout &&
    Boolean(p.direccionCheckoutSeleccionadaId) &&
    p.direccionCheckoutSeleccionadaId !== "__nueva__" &&
    p.direccionesCheckout.some((d) => d.id === p.direccionCheckoutSeleccionadaId);

  const handleCancelarFormularioDireccionCuenta = () => {
    setModoDireccionUi("seleccion");
    if (p.modoNuevaDireccionCheckout) {
      p.onSetModoNuevaDireccionCheckout(false);
      if (p.direccionesCheckout.length === 0) return;
      const pred = (p.direccionPredeterminadaCheckoutId || "").trim();
      const idPreferido =
        pred && p.direccionesCheckout.some((d) => d.id === pred) ? pred : p.direccionesCheckout[0].id;
      const dir = p.direccionesCheckout.find((d) => d.id === idPreferido) || p.direccionesCheckout[0];
      p.onSetDireccionCheckoutSeleccionadaId(dir.id);
      p.onAplicarDireccionEnCheckout(dir);
      if (p.direccionesCheckout.length === 1) {
        p.setModoEdicionUnaDireccionCheckout(true);
      }
    } else if (editarDireccionCuentaConSeleccion) {
      const id = p.direccionCheckoutSeleccionadaId;
      const dir = p.direccionesCheckout.find((d) => d.id === id);
      if (dir) p.onElegirDireccionParaEnvioPedido(dir);
    }
  };

  useLayoutEffect(() => {
    if (p.pasoFinalizarCompra !== "pago") return;
    const t = p.normalizarTelefonoBizum(p.datosCliente.telefono || "");
    if (!/^[67]\d{8}$/.test(t)) return;
    p.onSetDatosPago((prev) => {
      const base = prev ?? DATOS_PAGO_VACIOS;
      if ((base.bizumTelefono || "").replace(/\D/g, "").length >= 9) return base;
      return { ...base, bizumTelefono: t };
    });
  }, [p.pasoFinalizarCompra, p.datosCliente.telefono, p.normalizarTelefonoBizum, p.onSetDatosPago]);

  return (
    <ModalBase
      abierto={p.visible}
      onClose={p.onCerrar}
      maxWidth="520px"
      classNameOverlay="modal-overlay--checkout"
      classNameCard="checkout-modal-card"
      styleCard={{ width: "90%" }}
    >
      {p.pasoFinalizarCompra === "confirmarDireccion" ? (
        <>
          <CheckoutPasosIndicador pasoActivo={1} goldColor={p.goldColor} />
        <CheckoutConfirmarDireccionPaso
          datosCliente={p.datosCliente}
          goldColor={p.goldColor}
          normalizarTelefonoBizum={p.normalizarTelefonoBizum}
          onVolver={() => p.onSetPasoFinalizarCompra("datos")}
          onContinuarPago={() => {
            p.onSetMetodoPago("bizum");
            p.onSetPasoFinalizarCompra("pago");
            p.onSetDatosPago((prev) => ({
              ...(prev ?? DATOS_PAGO_VACIOS),
              bizumTelefono: p.normalizarTelefonoBizum(p.datosCliente.telefono || "")
            }));
          }}
        />
        </>
      ) : p.pasoFinalizarCompra === "pago" ? (
        <>
          <CheckoutPasosIndicador pasoActivo={2} goldColor={p.goldColor} />
        <CheckoutPagoPaso
          datosPago={p.datosPago}
          inputStyle={checkoutInputStyle}
          total={p.total}
          envioPreview={p.envioPreview}
          cuponAplicado={p.cuponAplicado}
          totalAPagar={p.totalAPagarResumen}
          procesandoPago={p.procesandoPago}
          mensajeErrorCheckout={p.mensajeErrorCheckoutPago}
          bloquearFinalizarPorRechazoServidor={p.checkoutHayRechazoServidor}
          onDatosPagoChange={p.onSetDatosPago}
          onVolver={p.onVolverDesdePago}
          onPagar={() => { void p.onEnviarPedidoWhatsApp(); }}
        />
        </>
      ) : (
        <>
          <CheckoutDatosPasoContenido
            modoDireccionCheckout={p.modoDireccionCheckout}
            modoDireccionUi={modoDireccionUi}
            setModoDireccionUi={setModoDireccionUi}
            modoNuevaDireccionCheckout={p.modoNuevaDireccionCheckout}
            modoEdicionUnaDireccionCheckout={p.modoEdicionUnaDireccionCheckout}
            setModoEdicionUnaDireccionCheckout={p.setModoEdicionUnaDireccionCheckout}
            usuario={p.usuario}
            datosCliente={p.datosCliente}
            recordarDatosInvitado={p.recordarDatosInvitado}
            direccionesCheckout={p.direccionesCheckout}
            direccionCheckoutSeleccionadaId={p.direccionCheckoutSeleccionadaId}
            direccionPredeterminadaCheckoutId={p.direccionPredeterminadaCheckoutId}
            direccionCheckoutSeleccionada={p.direccionCheckoutSeleccionada}
            direccionesMax={p.direccionesMax}
            inputStyle={checkoutInputStyle}
            goldColor={p.goldColor}
            telefonoCheckoutLimpio={p.telefonoCheckoutLimpio}
            telefonoCheckoutEsValido={p.telefonoCheckoutEsValido}
            telefonoCheckoutPrefijoInvalido={p.telefonoCheckoutPrefijoInvalido}
            telefonoCheckoutValidPulse={p.telefonoCheckoutValidPulse}
            buscandoCalleCheckout={p.buscandoCalleCheckout}
            pasoFinalizarCompra={p.pasoFinalizarCompra}
            calleCheckoutResetSignal={p.calleCheckoutResetSignal}
            inputCalleCheckoutRef={p.inputCalleCheckoutRef}
            inputTelefonoCheckoutRef={p.inputTelefonoCheckoutRef}
            textareaNotasCheckoutRef={p.textareaNotasCheckoutRef}
            setRecordarDatosInvitado={p.onSetRecordarDatosInvitado}
            setDireccionCheckoutSeleccionadaId={p.onSetDireccionCheckoutSeleccionadaId}
            setDireccionCheckoutActiva={p.onSetDireccionCheckoutActiva}
            setModoNuevaDireccionCheckout={p.onSetModoNuevaDireccionCheckout}
            setDireccionPredeterminadaCheckoutId={p.onSetDireccionPredeterminadaCheckoutId}
            setUsarDireccionPrincipalCheckout={p.onSetUsarDireccionPrincipalCheckout}
            setDatosCliente={p.onSetDatosCliente}
            aplicarDireccionEnCheckout={p.onAplicarDireccionEnCheckout}
            elegirDireccionParaEnvioPedido={p.onElegirDireccionParaEnvioPedido}
            mostrarNotificacion={p.onMostrarNotificacion}
            usarDireccionCheckout={p.onUsarDireccionCheckout}
            setDireccionCheckoutAEliminarId={p.onSetDireccionCheckoutAEliminarId}
            setBuscandoCalleCheckout={p.onSetBuscandoCalleCheckout}
            guardandoDireccionCheckout={p.guardandoDireccionCheckout}
            guardandoDireccionHistorialEnCuenta={p.guardandoDireccionHistorialEnCuenta}
            onGuardarDireccionCheckout={() => {
              void p.onGuardarDireccionCheckout();
            }}
            onGuardarDireccionHistorialEnCuenta={() => {
              void p.onGuardarDireccionHistorialEnCuenta();
            }}
            onCancelarFormularioDireccionCuenta={handleCancelarFormularioDireccionCuenta}
          />
          <div className="checkout-modal-footer-block" style={{ marginTop: 16 }}>
            {!p.modoDireccionCheckout && p.compraRapidaCheckoutDisponible ? (
              <div
                style={{
                  marginBottom: 14,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(37, 211, 102, 0.35)",
                  background: "rgba(37, 211, 102, 0.07)"
                }}
              >
                <div style={{ fontSize: 13, color: "rgba(245, 230, 200, 0.95)", marginBottom: 8, fontWeight: 600 }}>
                  ¿Ya compraste antes aquí?
                </div>
                <button
                  type="button"
                  className="checkout-boton-finalizar checkout-boton-finalizar--whatsapp"
                  onClick={p.onComprarEnUnClick}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "none",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer"
                  }}
                >
                  comprar en 1 clic
                </button>
                <p style={{ margin: "8px 0 0", fontSize: 11, lineHeight: 1.45, color: "rgba(255,255,255,0.65)", textAlign: "center" }}>
                  Cargamos tus datos guardados; solo revisas y sigues hacia WhatsApp.
                </p>
              </div>
            ) : null}
            <CheckoutResumenCuponAcciones
              modoDireccionCheckout={p.modoDireccionCheckout}
              modoNuevaDireccionCheckout={p.modoNuevaDireccionCheckout}
              mostrarGuardarDireccionEnFooter={!p.modoDireccionCheckout}
              guardandoDireccionCheckout={p.guardandoDireccionCheckout}
              accesoRapidoCheckoutAbierto={p.accesoRapidoCheckoutAbierto}
              checkoutIrAlPagoGesturaActiva={p.checkoutIrAlPagoGesturaActiva}
              onCheckoutIrAlPagoGesturaInicio={p.onCheckoutIrAlPagoGesturaInicio}
              onCheckoutIrAlPagoGesturaFin={p.onCheckoutIrAlPagoGesturaFin}
              inputStyle={checkoutInputStyle}
              goldColor={p.goldColor}
              numeroPedidoPreview={p.numeroPedidoPreview}
              total={p.total}
              envioPreview={p.envioPreview}
              cuponAplicado={p.cuponAplicado}
              totalAPagarResumen={p.totalAPagarResumen}
              mostrarInputCuponCheckout={p.mostrarInputCuponCheckout}
              cuponError={p.cuponError}
              cuponInput={p.cuponInput}
              botonIrAlPagoRef={p.botonIrAlPagoRef}
              irAlPagoPointerIdRef={p.irAlPagoPointerIdRef}
              irAlPagoEjecutarRef={p.irAlPagoEjecutarRef}
              onToggleMostrarInputCupon={p.onToggleMostrarInputCupon}
              onCuponInputChange={p.onSetCuponInput}
              onLimpiarCuponError={p.onSetCuponErrorNull}
              onAplicarCupon={p.onAplicarCupon}
              onQuitarCupon={p.onQuitarCupon}
              onGuardarDireccion={() => { void p.onGuardarDireccionCheckout(); }}
            />
          </div>
        </>
      )}
    </ModalBase>
  );
}
