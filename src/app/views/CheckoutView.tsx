import type { MutableRefObject, RefObject } from "react";
import type { Cliente, CuponAplicado, DireccionUsuario, Pagina, Pedido, Usuario } from "../../types";
import type { DatosPago } from "../../utils/pago";
import type { MaikaPedidoLS } from "../../utils/maikaPedidos";
import GlobalConfirmaciones from "../../components/modals/GlobalConfirmaciones";
import PedidoModal from "../../components/modals/PedidoModal";
import CheckoutModalFlow from "../../components/checkout/CheckoutModalFlow";
import AccesoRapidoCheckoutContainer from "../../components/accesoRapido/AccesoRapidoCheckoutContainer";
import CheckoutPostModals from "../../components/checkout/CheckoutPostModals";
import PreCheckoutCarritoAvisoModal from "../../components/checkout/PreCheckoutCarritoAvisoModal";
import LoginModal from "../../components/modals/LoginModal";

export type CheckoutViewProps = {
  themeBg: string;
  themeGold: string;
  inputStyle: React.CSSProperties;
  modalAbierto: boolean;
  confirmacionBizumOtroNumeroAbierto: boolean;
  datosPago: DatosPago;
  datosCliente: Cliente;
  normalizarTelefonoBizum: (telefono: string) => string;
  confirmarVaciarCarrito: () => void;
  setModalAbierto: (v: boolean) => void;
  setConfirmacionBizumOtroNumeroAbierto: (v: boolean) => void;
  enviarPedidoWhatsApp: () => void | Promise<void>;
  bizumConfirmadoRef: MutableRefObject<boolean>;
  pedidoFacturaAbierto: Pedido | null;
  setPedidoFacturaAbierto: (v: Pedido | null) => void;
  notaPedidoEnvio: string;
  formPedidoAbierto: boolean;
  pasoFinalizarCompra: "datos" | "confirmarDireccion" | "pago";
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
  total: number;
  envioPreview: number;
  cuponAplicado: CuponAplicado | null;
  totalAPagarResumen: number;
  procesandoPago: boolean;
  /** Error de negocio o red en el paso de pago (p. ej. stock); se limpia al reintentar o al cerrar. */
  mensajeErrorCheckoutPago: string | null;
  setMensajeErrorCheckoutPago: (v: string | null) => void;
  /** Rechazo 4xx del POST pedido (p. ej. stock); alinea botón de pago con el del carrito. */
  checkoutHayRechazoServidor: boolean;
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
  cerrarCheckoutSinGuardar: () => void;
  setPasoFinalizarCompra: (paso: "datos" | "confirmarDireccion" | "pago") => void;
  setDatosPago: (v: DatosPago | ((prev: DatosPago) => DatosPago)) => void;
  setMetodoPago: (m: "bizum" | "tarjeta") => void;
  setRecordarDatosInvitado: (v: boolean) => void;
  setDireccionCheckoutSeleccionadaId: (id: string) => void;
  setDireccionCheckoutActiva: (d: DireccionUsuario | null) => void;
  setModoNuevaDireccionCheckout: (v: boolean) => void;
  setDireccionPredeterminadaCheckoutId: (id: string) => void;
  setUsarDireccionPrincipalCheckout: (v: boolean) => void;
  setDatosCliente: (value: Cliente | ((prev: Cliente) => Cliente)) => void;
  aplicarDireccionEnCheckout: (d: DireccionUsuario) => void;
  elegirDireccionParaEnvioPedido: (d: DireccionUsuario) => void;
  mostrarNotificacion: (m: string, t: "normal" | "exito" | "error") => void;
  usarDireccionCheckout: (id: string) => void;
  setDireccionCheckoutAEliminarId: (id: string) => void;
  setBuscandoCalleCheckout: (v: boolean) => void;
  setMostrarInputCuponCheckout: (v: boolean) => void;
  setCuponInput: (v: string) => void;
  setCuponError: (v: string | null) => void;
  aplicarCupon: () => void;
  quitarCupon: () => void;
  guardarDireccionCheckout: () => void | Promise<void>;
  guardarDireccionHistorialEnCuenta: () => void | Promise<void>;
  accesoRapidoPaso: 1 | 2 | 3 | 4;
  enviando: boolean;
  accesoRapidoTelefono: string;
  accesoRapidoCuentaSinEmail: boolean;
  accesoRapidoCuentaConActividadSinEmail: boolean;
  accesoRapidoCuentaSinPassword: boolean;
  accesoRapidoEmailRegistrado: string;
  accesoRapidoLoginPassword: string;
  accesoRapidoEmail: string;
  accesoRapidoEmailUi: { intentosRestantes: number; bloqueado: boolean; ayudaInline: string | null };
  textoCuentaAtrasBloqueoEmail: string;
  mensajeEmailNoCoincide: string;
  enmascararEmail: (email: string) => string;
  resetAccesoRapidoCheckout: () => void;
  setAccesoRapidoCheckoutAbierto: (v: boolean) => void;
  setAccesoRapidoLoginPassword: (v: string) => void;
  setAccesoRapidoEmail: (v: string) => void;
  setAccesoRapidoEmailUi: (updater: (prev: { intentosRestantes: number; bloqueado: boolean; ayudaInline: string | null }) => { intentosRestantes: number; bloqueado: boolean; ayudaInline: string | null }) => void;
  setAvisoTelefonoCheckout: (v: { encontrado: boolean; texto: string; origen?: "local" } | null) => void;
  setAccesoRapidoCodigoUltimoPedido: (v: string) => void;
  setAccesoRapidoPaso: (v: 1 | 2 | 3 | 4) => void;
  abrirRegistroForzadoDesdeAcceso: (modo: string) => void;
  entrarAccesoRapido: () => void;
  setPagina: (p: Pagina) => void;
  /** Aviso modal antes de abrir checkout (stock / catálogo / carrito vacío). */
  preCheckoutCarritoAviso: {
    titulo: string;
    mensaje: string;
    detalle: string;
    textoBoton: string;
    irTiendaAlConfirmar: boolean;
    textoBotonSecundario?: string;
  } | null;
  cerrarPreCheckoutCarritoAviso: () => void;
  cerrarPreCheckoutCarritoAvisoSinNavegar: () => void;
  enviarCodigoAccesoRapidoPaso1: (emailForzado?: string) => void | Promise<void>;
  accesoRapidoCodigoUltimoPedido: string;
  msBloqueoSeguridadAccesoRapido: number;
  accesoRapidoEstadoVerificacionSeguridad: "idle" | "ok" | "error";
  accesoRapidoIntentosSeguridad: number;
  textoCuentaAtrasBloqueoSeguridadUi: string;
  setAccesoRapidoEstadoVerificacionSeguridad: (v: "idle" | "ok" | "error") => void;
  verificarIdentidadAccesoRapido: () => void;
  accesoRapidoCodigoIngresado: string;
  accesoRapidoCodigoBloqueado: boolean;
  accesoRapidoCodigoExpiradoAhora: boolean;
  accesoRapidoReenvioEn: number;
  errorCodigo: boolean;
  setErrorCodigo: (v: boolean) => void;
  setAccesoRapidoCodigoIngresado: (v: string) => void;
  verificarCodigoAccesoRapido: () => void;
  reenviarCodigoAccesoRapido: () => void | Promise<void>;
  accesoRapidoPasswordNueva: string;
  accesoRapidoPasswordConfirmar: string;
  accesoRapidoMostrarPasswordNueva: boolean;
  accesoRapidoMostrarPasswordConfirmar: boolean;
  accesoRapidoPuedeGuardarPassword: boolean;
  accesoRapidoPasswordsCoinciden: boolean;
  renderRequisitosPassword: (v: string) => React.ReactNode;
  setAccesoRapidoPasswordNueva: (v: string) => void;
  setAccesoRapidoPasswordConfirmar: (v: string) => void;
  setAccesoRapidoMostrarPasswordNueva: (updater: (v: boolean) => boolean) => void;
  setAccesoRapidoMostrarPasswordConfirmar: (updater: (v: boolean) => boolean) => void;
  guardarPasswordAccesoRapido: () => void | Promise<void>;
  direccionCheckoutAEliminarId: string | null;
  modalRepeatPedidoAbierto: boolean;
  pedidoRepeatSeleccionado: MaikaPedidoLS | null;
  pedidoRealizado: boolean;
  ultimoPedidoNumero: string;
  urlWhatsAppPendiente: string | null;
  avisoTelefonoCheckout: { encontrado: boolean; texto: string; origen?: "local" } | null;
  eliminarDireccionCheckout: (id: string) => void;
  setDireccionCheckoutAEliminarIdNull: (id: string | null) => void;
  setModalRepeatPedidoAbierto: (v: boolean) => void;
  repetirPedido: (pedido: MaikaPedidoLS, modo: "replace" | "add") => void;
  setUrlWhatsAppPendiente: (v: string | null) => void;
  setPedidoRealizado: (v: boolean) => void;
  abrirAccesoRapidoCheckout: () => void;
  abrirLoginDesdeCheckout: () => void;
  loginModalAbierto: boolean;
  setLoginModalAbierto: (v: boolean) => void;
  onLoginModalSuccess: (u: Usuario) => void;
  iniciarSesionConToken: (token: string, opts?: { mostrarBienvenida?: boolean }) => Promise<Usuario | null>;
  enviarCodigoEmail: (email: string, nombre: string, codigo: string) => Promise<boolean>;
  comprarEnUnClick: () => Promise<void>;
  /** Perfil de compra rápida válido y carrito con artículos. */
  compraRapidaCheckoutDisponible: boolean;
};

/** Modales y flujos visuales de checkout (carrito → datos → pago → WhatsApp). La orquestación vive en App. */
export default function CheckoutView(p: CheckoutViewProps) {
  return (
    <>
      <GlobalConfirmaciones
        modalAbierto={p.modalAbierto}
        confirmacionBizumOtroNumeroAbierto={p.confirmacionBizumOtroNumeroAbierto}
        datosPagoBizumTelefono={p.datosPago.bizumTelefono}
        datosCliente={p.datosCliente}
        normalizarTelefonoBizum={p.normalizarTelefonoBizum}
        confirmarVaciarCarrito={p.confirmarVaciarCarrito}
        setModalAbierto={p.setModalAbierto}
        setConfirmacionBizumOtroNumeroAbierto={p.setConfirmacionBizumOtroNumeroAbierto}
        enviarPedidoWhatsApp={p.enviarPedidoWhatsApp}
        bizumConfirmadoRef={p.bizumConfirmadoRef}
      />
      <PedidoModal pedido={p.pedidoFacturaAbierto} onClose={() => p.setPedidoFacturaAbierto(null)} bgColor={p.themeBg} goldColor={p.themeGold} notaPedidoEnvio={p.notaPedidoEnvio} />
      <CheckoutModalFlow
        visible={p.formPedidoAbierto}
        pasoFinalizarCompra={p.pasoFinalizarCompra}
        bgColor={p.themeBg}
        goldColor={p.themeGold}
        compraRapidaCheckoutDisponible={p.compraRapidaCheckoutDisponible}
        onComprarEnUnClick={() => { void p.comprarEnUnClick(); }}
        datosCliente={p.datosCliente}
        modoDireccionCheckout={p.modoDireccionCheckout}
        modoNuevaDireccionCheckout={p.modoNuevaDireccionCheckout}
        modoEdicionUnaDireccionCheckout={p.modoEdicionUnaDireccionCheckout}
        setModoEdicionUnaDireccionCheckout={p.setModoEdicionUnaDireccionCheckout}
        usuario={p.usuario}
        recordarDatosInvitado={p.recordarDatosInvitado}
        numeroPedidoPreview={p.numeroPedidoPreview}
        direccionesCheckout={p.direccionesCheckout}
        direccionCheckoutSeleccionadaId={p.direccionCheckoutSeleccionadaId}
        direccionPredeterminadaCheckoutId={p.direccionPredeterminadaCheckoutId}
        direccionCheckoutSeleccionada={p.direccionCheckoutSeleccionada}
        direccionesMax={p.direccionesMax}
        telefonoCheckoutLimpio={p.telefonoCheckoutLimpio}
        telefonoCheckoutEsValido={p.telefonoCheckoutEsValido}
        telefonoCheckoutPrefijoInvalido={p.telefonoCheckoutPrefijoInvalido}
        telefonoCheckoutValidPulse={p.telefonoCheckoutValidPulse}
        buscandoCalleCheckout={p.buscandoCalleCheckout}
        calleCheckoutResetSignal={p.calleCheckoutResetSignal}
        inputCalleCheckoutRef={p.inputCalleCheckoutRef}
        inputTelefonoCheckoutRef={p.inputTelefonoCheckoutRef}
        textareaNotasCheckoutRef={p.textareaNotasCheckoutRef}
        metodoPago={p.metodoPago}
        datosPago={p.datosPago}
        total={p.total}
        envioPreview={p.envioPreview}
        cuponAplicado={p.cuponAplicado}
        totalAPagarResumen={p.totalAPagarResumen}
        procesandoPago={p.procesandoPago}
        mensajeErrorCheckoutPago={p.mensajeErrorCheckoutPago}
        checkoutHayRechazoServidor={p.checkoutHayRechazoServidor}
        onCerrar={() => {
          /** No llamar `setMensajeErrorCheckoutPago(null)` aquí: resetea el flag de rechazo antes de `cerrarCheckoutSinGuardar` y rompe el vaciado + redirección a tienda. */
          p.cerrarCheckoutSinGuardar();
        }}
        onVolverDesdePago={() => {
          if (p.checkoutHayRechazoServidor) {
            p.cerrarCheckoutSinGuardar();
            return;
          }
          p.setMensajeErrorCheckoutPago(null);
          p.setPasoFinalizarCompra("confirmarDireccion");
        }}
        guardandoDireccionCheckout={p.guardandoDireccionCheckout}
        guardandoDireccionHistorialEnCuenta={p.guardandoDireccionHistorialEnCuenta}
        accesoRapidoCheckoutAbierto={p.accesoRapidoCheckoutAbierto}
        mostrarInputCuponCheckout={p.mostrarInputCuponCheckout}
        cuponError={p.cuponError}
        cuponInput={p.cuponInput}
        botonIrAlPagoRef={p.botonIrAlPagoRef}
        irAlPagoPointerIdRef={p.irAlPagoPointerIdRef}
        irAlPagoEjecutarRef={p.irAlPagoEjecutarRef}
        checkoutIrAlPagoGesturaActiva={p.checkoutIrAlPagoGesturaActiva}
        onCheckoutIrAlPagoGesturaInicio={p.onCheckoutIrAlPagoGesturaInicio}
        onCheckoutIrAlPagoGesturaFin={p.onCheckoutIrAlPagoGesturaFin}
        normalizarTelefonoBizum={p.normalizarTelefonoBizum}
        onSetPasoFinalizarCompra={p.setPasoFinalizarCompra}
        onSetDatosPago={p.setDatosPago}
        onSetMetodoPago={p.setMetodoPago}
        onEnviarPedidoWhatsApp={p.enviarPedidoWhatsApp}
        onSetRecordarDatosInvitado={p.setRecordarDatosInvitado}
        onSetDireccionCheckoutSeleccionadaId={p.setDireccionCheckoutSeleccionadaId}
        onSetDireccionCheckoutActiva={p.setDireccionCheckoutActiva}
        onSetModoNuevaDireccionCheckout={p.setModoNuevaDireccionCheckout}
        onSetDireccionPredeterminadaCheckoutId={p.setDireccionPredeterminadaCheckoutId}
        onSetUsarDireccionPrincipalCheckout={p.setUsarDireccionPrincipalCheckout}
        onSetDatosCliente={p.setDatosCliente}
        onAplicarDireccionEnCheckout={p.aplicarDireccionEnCheckout}
        onElegirDireccionParaEnvioPedido={p.elegirDireccionParaEnvioPedido}
        onMostrarNotificacion={p.mostrarNotificacion}
        onUsarDireccionCheckout={p.usarDireccionCheckout}
        onSetDireccionCheckoutAEliminarId={p.setDireccionCheckoutAEliminarId}
        onSetBuscandoCalleCheckout={p.setBuscandoCalleCheckout}
        onToggleMostrarInputCupon={p.setMostrarInputCuponCheckout}
        onSetCuponInput={p.setCuponInput}
        onSetCuponErrorNull={() => p.setCuponError(null)}
        onAplicarCupon={p.aplicarCupon}
        onQuitarCupon={p.quitarCupon}
        onGuardarDireccionCheckout={p.guardarDireccionCheckout}
        onGuardarDireccionHistorialEnCuenta={p.guardarDireccionHistorialEnCuenta}
        onAbrirLogin={p.abrirLoginDesdeCheckout}
      />
      {p.loginModalAbierto ? (
        <LoginModal
          onClose={() => p.setLoginModalAbierto(false)}
          bgColor={p.themeBg}
          goldColor={p.themeGold}
          inputStyle={p.inputStyle}
          mostrarNotificacion={p.mostrarNotificacion}
          onLoginSuccess={p.onLoginModalSuccess}
          iniciarSesionConToken={p.iniciarSesionConToken}
          enviarCodigoEmail={p.enviarCodigoEmail}
        />
      ) : null}
      <AccesoRapidoCheckoutContainer
        abierto={p.accesoRapidoCheckoutAbierto}
        paso={p.accesoRapidoPaso}
        goldColor={p.themeGold}
        bgColor={p.themeBg}
        inputStyle={p.inputStyle}
        enviando={p.enviando}
        telefono={p.accesoRapidoTelefono}
        cuentaSinEmail={p.accesoRapidoCuentaSinEmail}
        cuentaConActividadSinEmail={p.accesoRapidoCuentaConActividadSinEmail}
        cuentaSinPassword={p.accesoRapidoCuentaSinPassword}
        emailRegistrado={p.accesoRapidoEmailRegistrado}
        loginPassword={p.accesoRapidoLoginPassword}
        email={p.accesoRapidoEmail}
        emailUi={p.accesoRapidoEmailUi}
        textoCuentaAtrasBloqueoEmail={p.textoCuentaAtrasBloqueoEmail}
        mensajeEmailNoCoincide={p.mensajeEmailNoCoincide}
        enmascararEmail={p.enmascararEmail}
        resetAccesoRapidoCheckout={p.resetAccesoRapidoCheckout}
        setAccesoRapidoCheckoutAbierto={p.setAccesoRapidoCheckoutAbierto}
        setAccesoRapidoLoginPassword={p.setAccesoRapidoLoginPassword}
        setAccesoRapidoEmail={p.setAccesoRapidoEmail}
        setAccesoRapidoEmailUi={p.setAccesoRapidoEmailUi}
        setAvisoTelefonoCheckout={p.setAvisoTelefonoCheckout}
        setAccesoRapidoCodigoUltimoPedido={p.setAccesoRapidoCodigoUltimoPedido}
        setAccesoRapidoPaso={p.setAccesoRapidoPaso}
        abrirRegistroForzadoDesdeAcceso={p.abrirRegistroForzadoDesdeAcceso}
        entrarAccesoRapido={p.entrarAccesoRapido}
        mostrarNotificacion={p.mostrarNotificacion}
        enviarCodigoAccesoRapidoPaso1={p.enviarCodigoAccesoRapidoPaso1}
        codigoUltimoPedido={p.accesoRapidoCodigoUltimoPedido}
        msBloqueoSeguridad={p.msBloqueoSeguridadAccesoRapido}
        estadoVerificacion={p.accesoRapidoEstadoVerificacionSeguridad}
        intentosSeguridad={p.accesoRapidoIntentosSeguridad}
        textoCuentaAtrasBloqueoSeguridad={p.textoCuentaAtrasBloqueoSeguridadUi}
        setAccesoRapidoEstadoVerificacionSeguridad={p.setAccesoRapidoEstadoVerificacionSeguridad}
        verificarIdentidadAccesoRapido={p.verificarIdentidadAccesoRapido}
        codigoIngresado={p.accesoRapidoCodigoIngresado}
        codigoBloqueado={p.accesoRapidoCodigoBloqueado}
        codigoExpirado={p.accesoRapidoCodigoExpiradoAhora}
        reenvioEn={p.accesoRapidoReenvioEn}
        errorCodigo={p.errorCodigo}
        setErrorCodigo={p.setErrorCodigo}
        setAccesoRapidoCodigoIngresado={p.setAccesoRapidoCodigoIngresado}
        verificarCodigoAccesoRapido={p.verificarCodigoAccesoRapido}
        reenviarCodigoAccesoRapido={p.reenviarCodigoAccesoRapido}
        passwordNueva={p.accesoRapidoPasswordNueva}
        passwordConfirmar={p.accesoRapidoPasswordConfirmar}
        mostrarPasswordNueva={p.accesoRapidoMostrarPasswordNueva}
        mostrarPasswordConfirmar={p.accesoRapidoMostrarPasswordConfirmar}
        puedeGuardarPassword={p.accesoRapidoPuedeGuardarPassword}
        passwordsCoinciden={p.accesoRapidoPasswordsCoinciden}
        requisitosPasswordNode={p.renderRequisitosPassword(p.accesoRapidoPasswordNueva)}
        setPasswordNueva={p.setAccesoRapidoPasswordNueva}
        setPasswordConfirmar={p.setAccesoRapidoPasswordConfirmar}
        setMostrarPasswordNueva={p.setAccesoRapidoMostrarPasswordNueva}
        setMostrarPasswordConfirmar={p.setAccesoRapidoMostrarPasswordConfirmar}
        guardarPasswordAccesoRapido={p.guardarPasswordAccesoRapido}
      />
      <PreCheckoutCarritoAvisoModal
        abierto={p.preCheckoutCarritoAviso != null}
        titulo={p.preCheckoutCarritoAviso?.titulo ?? ""}
        mensaje={p.preCheckoutCarritoAviso?.mensaje ?? ""}
        detalle={p.preCheckoutCarritoAviso?.detalle ?? ""}
        textoBoton={p.preCheckoutCarritoAviso?.textoBoton ?? "Entendido"}
        textoBotonSecundario={p.preCheckoutCarritoAviso?.textoBotonSecundario}
        bgColor={p.themeBg}
        goldColor={p.themeGold}
        onConfirmar={p.cerrarPreCheckoutCarritoAviso}
        onCerrarSoloModal={p.cerrarPreCheckoutCarritoAvisoSinNavegar}
      />
      <CheckoutPostModals
        direccionCheckoutAEliminarId={p.direccionCheckoutAEliminarId}
        modalRepeatPedidoAbierto={p.modalRepeatPedidoAbierto}
        pedidoRepeatSeleccionado={p.pedidoRepeatSeleccionado}
        pedidoRealizado={p.pedidoRealizado}
        ultimoPedidoNumero={p.ultimoPedidoNumero}
        urlWhatsAppPendiente={p.urlWhatsAppPendiente}
        formPedidoAbierto={p.formPedidoAbierto}
        pasoFinalizarCompra={p.pasoFinalizarCompra}
        avisoTelefonoCheckout={p.avisoTelefonoCheckout}
        bgColor={p.themeBg}
        goldColor={p.themeGold}
        onEliminarDireccionConfirmar={p.eliminarDireccionCheckout}
        onSetDireccionCheckoutAEliminarId={p.setDireccionCheckoutAEliminarIdNull}
        onSetModalRepeatPedidoAbierto={p.setModalRepeatPedidoAbierto}
        onRepetirPedido={p.repetirPedido}
        onSetUrlWhatsAppPendiente={p.setUrlWhatsAppPendiente}
        onSetPedidoRealizado={p.setPedidoRealizado}
        onSetPagina={p.setPagina}
        onSetAvisoTelefonoCheckout={p.setAvisoTelefonoCheckout}
        onAbrirAccesoRapidoCheckout={p.abrirAccesoRapidoCheckout}
      />
    </>
  );
}
