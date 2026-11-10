import { useState, useRef, type CSSProperties } from "react";
import type { AuthForm } from "../../types";
import { THEME } from "../../config";
import { notificarError, notificarExito } from "../../utils/ui/notificaciones";
import { codigoVerificacionSoloDigitos, tieneEmailVerificable } from "../../utils/cuentaPageHelpers";
import { esActivacionIdentidadVerificadaEnSession } from "../../utils/activacionIdentidadSession";
import { solicitarCodigoRegistroApi, verificarCodigoRegistroApi } from "../../services/apiAuth";

export interface RegistroVerificarCuentaViewProps {
  formAuth: AuthForm;
  setFormAuth: (fn: (prev: AuthForm) => AuthForm) => void;
  activacionForzadaDesdeAcceso: boolean;
  confirmacionIdentidadActivacion: boolean;
  telefonoForzadoRegistroDesdeAcceso: string;
  reenvioDisponibleEn: number;
  setReenvioDisponibleEn: (v: number) => void;
  mostrarNotificacion: (mensaje: string, tipo: "normal" | "exito" | "error") => void;
  /** Declaración hecha en el paso 1; el backend la vuelve a exigir al reenviar el código. */
  declaraMayorEdad: boolean;
  /** El código se valida en backend; este callback recibe el token de verificación emitido. */
  onCompletarRegistro: (verificacionToken: string) => Promise<void>;
  onVolver: () => void;
  cuentaRegistroDensoInput: CSSProperties;
  cuentaCtaPrincipalStyle: CSSProperties;
  cuentaBotonAuth: CSSProperties;
}

/** Registro paso 2: verificar cuenta con código de 6 dígitos (validación en servidor). */
export default function RegistroVerificarCuentaView(p: RegistroVerificarCuentaViewProps) {
  const [verificarRegistroCargando, setVerificarRegistroCargando] = useState(false);
  const [reenviandoCodigoRegistro, setReenviandoCodigoRegistro] = useState(false);
  const botonVerificarRegistroCodigoRef = useRef<HTMLButtonElement>(null);

  const emailRegistro = (p.formAuth.email || p.formAuth.confirmEmail || "").trim().toLowerCase();

  return (
    <>
      <h3 style={{ color: THEME.goldMain, textAlign: "center", marginBottom: 8, fontSize: 15 }}>
        {p.activacionForzadaDesdeAcceso ? "Paso 2: Activar cuenta" : "Paso 2: Verificar cuenta"}
      </h3>
      <p style={{ color: "white", textAlign: "center", marginBottom: 8, fontSize: 13 }}>{emailRegistro ? `Hemos enviado un código a ${emailRegistro}` : "Introduce el código que te hemos mostrado"}</p>
      <p style={{ color: "white", textAlign: "center", fontSize: 12, marginTop: -4, marginBottom: 10, opacity: 0.85 }}>{emailRegistro ? "El mensaje suele llegar en menos de 1 minuto. Revisa también spam." : "Si no lo anotaste, vuelve atrás y pon un email para recibir el código."}</p>
      <input
        type="text"
        placeholder="Código de 6 dígitos"
        value={p.formAuth.codigoIngresado || ""}
        onChange={(e) => p.setFormAuth((prev) => ({ ...prev, codigoIngresado: e.target.value }))}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          if (!verificarRegistroCargando) botonVerificarRegistroCodigoRef.current?.click();
        }}
        style={p.cuentaRegistroDensoInput}
      />
      <button
        ref={botonVerificarRegistroCodigoRef}
        type="button"
        disabled={verificarRegistroCargando}
        aria-busy={verificarRegistroCargando}
        onClick={async () => {
          const ingresado = codigoVerificacionSoloDigitos(p.formAuth.codigoIngresado || "");
          if (ingresado.length < 6) {
            notificarError(p.mostrarNotificacion, "❌ Escribe el código de 6 dígitos");
            return;
          }
          if (!tieneEmailVerificable(emailRegistro)) {
            notificarError(
              p.mostrarNotificacion,
              "❌ No hay email válido. Vuelve al paso anterior y pulsa «Enviar código»."
            );
            return;
          }
          if (
            p.activacionForzadaDesdeAcceso &&
            !p.confirmacionIdentidadActivacion &&
            !esActivacionIdentidadVerificadaEnSession(p.telefonoForzadoRegistroDesdeAcceso)
          ) {
            notificarError(
              p.mostrarNotificacion,
              "❌ Debes verificar tu identidad desde el acceso rápido del checkout (código del último pedido) antes de activar la cuenta."
            );
            return;
          }
          setVerificarRegistroCargando(true);
          try {
            const r = await verificarCodigoRegistroApi(emailRegistro, ingresado);
            await p.onCompletarRegistro(r.verificacionToken);
          } catch (e) {
            const err = e as Error & { restantes?: number };
            const msg = err?.message || "codigo_invalido";
            const mapa: Record<string, string> = {
              codigo_invalido: "Código incorrecto",
              codigo_caducado: "El código ha caducado. Pide uno nuevo.",
              demasiados_intentos: "Demasiados intentos. Pide un código nuevo."
            };
            const restantes = typeof err?.restantes === "number" && err.restantes > 0
              ? ` (te quedan ${err.restantes} intentos)`
              : "";
            notificarError(p.mostrarNotificacion, `❌ ${mapa[msg] ?? msg}${restantes}`);
          } finally {
            setVerificarRegistroCargando(false);
          }
        }}
        className="checkout-boton-finalizar"
        style={{
          ...p.cuentaCtaPrincipalStyle,
          marginTop: 10,
          opacity: verificarRegistroCargando ? 0.85 : 1,
          cursor: verificarRegistroCargando ? "wait" : "pointer"
        }}
      >
        {verificarRegistroCargando
          ? "Procesando…"
          : p.activacionForzadaDesdeAcceso
            ? "Verificar y activar cuenta"
            : "Verificar y completar registro"}
      </button>
      <button
        onClick={async () => {
          if (p.reenvioDisponibleEn > 0 || reenviandoCodigoRegistro) return;
          if (!tieneEmailVerificable(emailRegistro)) {
            notificarError(p.mostrarNotificacion, "❌ Debes indicar un email válido para reenviar el código");
            return;
          }
          setReenviandoCodigoRegistro(true);
          try {
            await solicitarCodigoRegistroApi(emailRegistro, p.declaraMayorEdad);
            p.setFormAuth((prev) => ({
              ...prev,
              codigoIngresado: "",
              pasoVerificacion: 2
            }));
            p.setReenvioDisponibleEn(60);
            notificarExito(p.mostrarNotificacion, `✅ Nuevo código enviado a ${emailRegistro}`);
          } catch (e) {
            const msg = e instanceof Error ? e.message : "No se pudo reenviar el código";
            notificarError(p.mostrarNotificacion, `❌ ${msg}`);
          } finally {
            setReenviandoCodigoRegistro(false);
          }
        }}
        disabled={p.reenvioDisponibleEn > 0 || reenviandoCodigoRegistro}
        className="cuenta-maika-btn-sec"
        style={{
          ...p.cuentaBotonAuth,
          background: p.reenvioDisponibleEn > 0 ? "#666" : "rgba(255,255,255,0.04)",
          color: THEME.goldMain,
          border: "1px solid rgba(212, 175, 55, 0.45)",
          cursor: p.reenvioDisponibleEn > 0 || reenviandoCodigoRegistro ? "wait" : "pointer",
          fontSize: 14,
          marginTop: 10,
          opacity: p.reenvioDisponibleEn > 0 || reenviandoCodigoRegistro ? 0.85 : 1
        }}
      >
        {reenviandoCodigoRegistro
          ? "Reenviando…"
          : p.reenvioDisponibleEn > 0
            ? `Reenviar código en ${p.reenvioDisponibleEn}s`
            : "Reenviar código"}
      </button>
      <button type="button" onClick={p.onVolver} className="cuenta-maika-btn-sec" style={{ ...p.cuentaBotonAuth, background: "transparent", color: THEME.goldMain, border: "1px solid rgba(212, 175, 55, 0.45)", marginTop: 10 }}>← Volver</button>
    </>
  );
}
