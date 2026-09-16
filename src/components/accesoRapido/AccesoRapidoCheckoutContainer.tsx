import type { CSSProperties } from "react";
import AccesoRapidoCheckoutFlow from "./AccesoRapidoCheckoutFlow";
import { normalizarCodigoUltimoPedidoInput } from "../../utils/accesoRapidoVerificacion";
import { solicitarRecuperacionPasswordApi } from "../../services/apiAuth";
import { notificarError, notificarExito } from "../../utils/ui/notificaciones";

type Props = {
  abierto: boolean;
  paso: 1 | 2 | 3 | 4;
  goldColor: string;
  bgColor: string;
  inputStyle: CSSProperties;
  enviando: boolean;
  telefono: string;
  cuentaSinEmail: boolean;
  cuentaConActividadSinEmail: boolean;
  cuentaSinPassword: boolean;
  emailRegistrado: string;
  loginPassword: string;
  email: string;
  emailUi: { intentosRestantes: number; bloqueado: boolean; ayudaInline: string | null };
  textoCuentaAtrasBloqueoEmail: string;
  mensajeEmailNoCoincide: string;
  enmascararEmail: (email: string) => string;
  resetAccesoRapidoCheckout: () => void;
  setAccesoRapidoCheckoutAbierto: (v: boolean) => void;
  setAccesoRapidoLoginPassword: (v: string) => void;
  setAccesoRapidoEmail: (v: string) => void;
  setAccesoRapidoEmailUi: (updater: (prev: { intentosRestantes: number; bloqueado: boolean; ayudaInline: string | null }) => { intentosRestantes: number; bloqueado: boolean; ayudaInline: string | null }) => void;
  setAvisoTelefonoCheckout: (v: { encontrado: boolean; texto: string } | null) => void;
  setAccesoRapidoCodigoUltimoPedido: (v: string) => void;
  setAccesoRapidoPaso: (v: 1 | 2 | 3 | 4) => void;
  abrirRegistroForzadoDesdeAcceso: (modo: string) => void;
  entrarAccesoRapido: () => void;
  mostrarNotificacion: (m: string, t: "normal" | "exito" | "error") => void;
  enviarCodigoAccesoRapidoPaso1: (emailForzado?: string) => void | Promise<void>;
  codigoUltimoPedido: string;
  msBloqueoSeguridad: number;
  estadoVerificacion: "idle" | "ok" | "error";
  intentosSeguridad: number;
  textoCuentaAtrasBloqueoSeguridad: string;
  setAccesoRapidoEstadoVerificacionSeguridad: (v: "idle" | "ok" | "error") => void;
  verificarIdentidadAccesoRapido: () => void;
  codigoIngresado: string;
  codigoBloqueado: boolean;
  codigoExpirado: boolean;
  reenvioEn: number;
  errorCodigo: boolean;
  setErrorCodigo: (v: boolean) => void;
  setAccesoRapidoCodigoIngresado: (v: string) => void;
  verificarCodigoAccesoRapido: () => void;
  reenviarCodigoAccesoRapido: () => void | Promise<void>;
  passwordNueva: string;
  passwordConfirmar: string;
  mostrarPasswordNueva: boolean;
  mostrarPasswordConfirmar: boolean;
  puedeGuardarPassword: boolean;
  passwordsCoinciden: boolean;
  requisitosPasswordNode: React.ReactNode;
  setPasswordNueva: (v: string) => void;
  setPasswordConfirmar: (v: string) => void;
  setMostrarPasswordNueva: (updater: (v: boolean) => boolean) => void;
  setMostrarPasswordConfirmar: (updater: (v: boolean) => boolean) => void;
  guardarPasswordAccesoRapido: () => void | Promise<void>;
};

export default function AccesoRapidoCheckoutContainer(props: Props) {
  const {
    abierto, paso, goldColor, bgColor, inputStyle, enviando, telefono, cuentaSinEmail, cuentaConActividadSinEmail,
    cuentaSinPassword, emailRegistrado, loginPassword, email, emailUi, textoCuentaAtrasBloqueoEmail,
    mensajeEmailNoCoincide, enmascararEmail, resetAccesoRapidoCheckout, setAccesoRapidoCheckoutAbierto,
    setAccesoRapidoLoginPassword, setAccesoRapidoEmail, setAccesoRapidoEmailUi, setAvisoTelefonoCheckout,
    setAccesoRapidoCodigoUltimoPedido, setAccesoRapidoPaso, abrirRegistroForzadoDesdeAcceso, entrarAccesoRapido,
    mostrarNotificacion, enviarCodigoAccesoRapidoPaso1, codigoUltimoPedido, msBloqueoSeguridad,
    estadoVerificacion, intentosSeguridad, textoCuentaAtrasBloqueoSeguridad, setAccesoRapidoEstadoVerificacionSeguridad,
    verificarIdentidadAccesoRapido, codigoIngresado, codigoBloqueado, codigoExpirado, reenvioEn, errorCodigo,
    setErrorCodigo, setAccesoRapidoCodigoIngresado, verificarCodigoAccesoRapido, reenviarCodigoAccesoRapido,
    passwordNueva, passwordConfirmar, mostrarPasswordNueva, mostrarPasswordConfirmar, puedeGuardarPassword,
    passwordsCoinciden, requisitosPasswordNode, setPasswordNueva, setPasswordConfirmar, setMostrarPasswordNueva,
    setMostrarPasswordConfirmar, guardarPasswordAccesoRapido
  } = props;

  if (!abierto) return null;

  return (
    <AccesoRapidoCheckoutFlow
      visible={abierto}
      paso={paso}
      goldColor={goldColor}
      bgColor={bgColor}
      inputStyle={inputStyle}
      enviando={enviando}
      telefono={telefono}
      cuentaSinEmail={cuentaSinEmail}
      cuentaConActividadSinEmail={cuentaConActividadSinEmail}
      cuentaSinPassword={cuentaSinPassword}
      emailRegistrado={emailRegistrado}
      loginPassword={loginPassword}
      email={email}
      emailUi={emailUi}
      textoCuentaAtrasBloqueoEmail={textoCuentaAtrasBloqueoEmail}
      mensajeEmailNoCoincide={mensajeEmailNoCoincide}
      enmascararEmail={enmascararEmail}
      onClose={() => { resetAccesoRapidoCheckout(); setAccesoRapidoCheckoutAbierto(false); }}
      onLoginPasswordChange={setAccesoRapidoLoginPassword}
      onEmailChange={setAccesoRapidoEmail}
      onResetAyudaInline={() => setAccesoRapidoEmailUi((s) => ({ ...s, ayudaInline: null }))}
      onContinuarInvitado={() => { resetAccesoRapidoCheckout(); setAccesoRapidoCheckoutAbierto(false); setAvisoTelefonoCheckout(null); }}
      onActivarORegistro={() => {
        if (cuentaConActividadSinEmail) {
          setAccesoRapidoCodigoUltimoPedido("");
          setAccesoRapidoPaso(4);
          return;
        }
        abrirRegistroForzadoDesdeAcceso("registro");
      }}
      onEntrar={entrarAccesoRapido}
      onOlvidePassword={() => {
        const emailObjetivo = String(emailRegistrado || "").trim().toLowerCase();
        void (async () => {
          try {
            await solicitarRecuperacionPasswordApi(emailObjetivo, telefono);
            notificarExito(mostrarNotificacion, "✅ Te hemos enviado un enlace seguro para crear tu contraseña.");
          } catch {
            notificarError(mostrarNotificacion, "❌ No se pudo enviar el enlace seguro. Inténtalo más tarde.");
          }
        })();
      }}
      onEnviarCodigo={() => { void enviarCodigoAccesoRapidoPaso1(); }}
      codigoUltimoPedido={codigoUltimoPedido}
      msBloqueoSeguridad={msBloqueoSeguridad}
      estadoVerificacion={estadoVerificacion}
      intentosSeguridad={intentosSeguridad}
      textoCuentaAtrasBloqueoSeguridad={textoCuentaAtrasBloqueoSeguridad}
      onCodigoUltimoPedidoChange={(value) => {
        setAccesoRapidoCodigoUltimoPedido(normalizarCodigoUltimoPedidoInput(value));
        if (estadoVerificacion !== "idle") setAccesoRapidoEstadoVerificacionSeguridad("idle");
      }}
      onVerificarIdentidad={verificarIdentidadAccesoRapido}
      codigoIngresado={codigoIngresado}
      codigoBloqueado={codigoBloqueado}
      codigoExpirado={codigoExpirado}
      reenvioEn={reenvioEn}
      onCodigoIngresadoChange={(value) => {
        if (errorCodigo) setErrorCodigo(false);
        setAccesoRapidoCodigoIngresado(value.replace(/\D/g, "").slice(0, 6));
      }}
      onVerificarCodigo={verificarCodigoAccesoRapido}
      onReenviarCodigo={() => { void reenviarCodigoAccesoRapido(); }}
      onVolverPaso1={() => setAccesoRapidoPaso(1)}
      passwordNueva={passwordNueva}
      passwordConfirmar={passwordConfirmar}
      mostrarPasswordNueva={mostrarPasswordNueva}
      mostrarPasswordConfirmar={mostrarPasswordConfirmar}
      puedeGuardarPassword={puedeGuardarPassword}
      passwordsCoinciden={passwordsCoinciden}
      requisitosPasswordNode={requisitosPasswordNode}
      onPasswordNuevaChange={setPasswordNueva}
      onPasswordConfirmarChange={setPasswordConfirmar}
      onTogglePasswordNueva={() => setMostrarPasswordNueva((v) => !v)}
      onTogglePasswordConfirmar={() => setMostrarPasswordConfirmar((v) => !v)}
      onGuardarPassword={() => { void guardarPasswordAccesoRapido(); }}
      onVolverCodigoDesdePassword={() => {
        setPasswordNueva("");
        setPasswordConfirmar("");
        setMostrarPasswordNueva(() => false);
        setMostrarPasswordConfirmar(() => false);
        setAccesoRapidoPaso(2);
      }}
    />
  );
}
