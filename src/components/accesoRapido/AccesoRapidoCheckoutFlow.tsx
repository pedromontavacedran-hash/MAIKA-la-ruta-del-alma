import type { CSSProperties } from "react";
import AccesoRapidoModal from "../modals/AccesoRapidoModal";
import AccesoRapidoInicioPaso from "./AccesoRapidoInicioPaso";
import AccesoRapidoVerificacionPaso from "./AccesoRapidoVerificacionPaso";
import AccesoRapidoCodigoPaso from "./AccesoRapidoCodigoPaso";
import AccesoRapidoPasswordPaso from "./AccesoRapidoPasswordPaso";

type Props = {
  visible: boolean;
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
  onClose: () => void;
  onLoginPasswordChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onResetAyudaInline: () => void;
  onContinuarInvitado: () => void;
  onActivarORegistro: () => void;
  onEntrar: () => void;
  onOlvidePassword: () => void;
  onEnviarCodigo: () => void;
  codigoUltimoPedido: string;
  msBloqueoSeguridad: number;
  estadoVerificacion: "idle" | "ok" | "error";
  intentosSeguridad: number;
  textoCuentaAtrasBloqueoSeguridad: string;
  onCodigoUltimoPedidoChange: (value: string) => void;
  onVerificarIdentidad: () => void;
  codigoIngresado: string;
  codigoBloqueado: boolean;
  codigoExpirado: boolean;
  reenvioEn: number;
  onCodigoIngresadoChange: (value: string) => void;
  onVerificarCodigo: () => void;
  onReenviarCodigo: () => void;
  onVolverPaso1: () => void;
  passwordNueva: string;
  passwordConfirmar: string;
  mostrarPasswordNueva: boolean;
  mostrarPasswordConfirmar: boolean;
  puedeGuardarPassword: boolean;
  passwordsCoinciden: boolean;
  requisitosPasswordNode: React.ReactNode;
  onPasswordNuevaChange: (value: string) => void;
  onPasswordConfirmarChange: (value: string) => void;
  onTogglePasswordNueva: () => void;
  onTogglePasswordConfirmar: () => void;
  onGuardarPassword: () => void;
  onVolverCodigoDesdePassword: () => void;
};

export default function AccesoRapidoCheckoutFlow(props: Props) {
  const {
    visible, paso, goldColor, bgColor, inputStyle, enviando, telefono, cuentaSinEmail, cuentaConActividadSinEmail,
    cuentaSinPassword, emailRegistrado, loginPassword, email, emailUi, textoCuentaAtrasBloqueoEmail,
    mensajeEmailNoCoincide, enmascararEmail, onClose, onLoginPasswordChange, onEmailChange, onResetAyudaInline,
    onContinuarInvitado, onActivarORegistro, onEntrar, onOlvidePassword, onEnviarCodigo, codigoUltimoPedido,
    msBloqueoSeguridad, estadoVerificacion, intentosSeguridad, textoCuentaAtrasBloqueoSeguridad,
    onCodigoUltimoPedidoChange, onVerificarIdentidad, codigoIngresado, codigoBloqueado, codigoExpirado, reenvioEn,
    onCodigoIngresadoChange, onVerificarCodigo, onReenviarCodigo, onVolverPaso1, passwordNueva, passwordConfirmar,
    mostrarPasswordNueva, mostrarPasswordConfirmar, puedeGuardarPassword, passwordsCoinciden, requisitosPasswordNode,
    onPasswordNuevaChange, onPasswordConfirmarChange, onTogglePasswordNueva, onTogglePasswordConfirmar,
    onGuardarPassword, onVolverCodigoDesdePassword
  } = props;

  return (
    <AccesoRapidoModal
      visible={visible}
      onClose={onClose}
      bgColor={bgColor}
      goldColor={goldColor}
      subtitulo={
        paso === 1
          ? "Confirma tu email para validar tu identidad"
          : paso === 2
            ? "Introduce el código que te hemos enviado por email"
            : paso === 4
              ? "Verifica tu identidad antes de activar la cuenta"
              : "Crea tu contraseña desde un enlace seguro"
      }
    >
      {paso === 1 ? (
        <AccesoRapidoInicioPaso
          telefono={telefono}
          cuentaSinEmail={cuentaSinEmail}
          cuentaConActividadSinEmail={cuentaConActividadSinEmail}
          cuentaSinPassword={cuentaSinPassword}
          emailRegistrado={emailRegistrado}
          loginPassword={loginPassword}
          email={email}
          emailUi={emailUi}
          enviando={enviando}
          textoCuentaAtrasBloqueoEmail={textoCuentaAtrasBloqueoEmail}
          mensajeEmailNoCoincide={mensajeEmailNoCoincide}
          inputStyle={inputStyle}
          goldColor={goldColor}
          enmascararEmail={enmascararEmail}
          onLoginPasswordChange={onLoginPasswordChange}
          onEmailChange={onEmailChange}
          onResetAyudaInline={onResetAyudaInline}
          onContinuarInvitado={onContinuarInvitado}
          onActivarORegistro={onActivarORegistro}
          onEntrar={onEntrar}
          onOlvidePassword={onOlvidePassword}
          onEnviarCodigo={onEnviarCodigo}
        />
      ) : paso === 4 ? (
        <>
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.45, margin: "0 0 10px" }}>
            Introduce el código de tu último pedido para verificar tu identidad.
          </p>
          <AccesoRapidoVerificacionPaso
            codigo={codigoUltimoPedido}
            bloqueado={msBloqueoSeguridad > 0}
            estadoVerificacion={estadoVerificacion}
            intentosRestantes={Math.max(0, 3 - intentosSeguridad)}
            intentosUsados={intentosSeguridad}
            textoCuentaAtrasBloqueo={textoCuentaAtrasBloqueoSeguridad}
            inputStyle={inputStyle}
            goldColor={goldColor}
            onCodigoChange={onCodigoUltimoPedidoChange}
            onVerificar={onVerificarIdentidad}
          />
        </>
      ) : paso === 2 ? (
        <AccesoRapidoCodigoPaso
          codigoIngresado={codigoIngresado}
          enviando={enviando}
          codigoBloqueado={codigoBloqueado}
          codigoExpirado={codigoExpirado}
          reenvioEn={reenvioEn}
          inputStyle={inputStyle}
          goldColor={goldColor}
          onCodigoChange={onCodigoIngresadoChange}
          onVerificarCodigo={onVerificarCodigo}
          onReenviarCodigo={onReenviarCodigo}
          onVolver={onVolverPaso1}
        />
      ) : (
        <AccesoRapidoPasswordPaso
          passwordNueva={passwordNueva}
          passwordConfirmar={passwordConfirmar}
          mostrarPasswordNueva={mostrarPasswordNueva}
          mostrarPasswordConfirmar={mostrarPasswordConfirmar}
          puedeGuardarPassword={puedeGuardarPassword}
          passwordsCoinciden={passwordsCoinciden}
          inputStyle={inputStyle}
          goldColor={goldColor}
          requisitosPasswordNode={requisitosPasswordNode}
          onPasswordNuevaChange={onPasswordNuevaChange}
          onPasswordConfirmarChange={onPasswordConfirmarChange}
          onTogglePasswordNueva={onTogglePasswordNueva}
          onTogglePasswordConfirmar={onTogglePasswordConfirmar}
          onGuardarPassword={onGuardarPassword}
          onVolverCodigo={onVolverCodigoDesdePassword}
        />
      )}
    </AccesoRapidoModal>
  );
}
