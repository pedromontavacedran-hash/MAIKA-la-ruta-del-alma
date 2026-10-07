import type { Usuario } from "../types";
import type { MaikaUsuarioLS } from "./maikaUsuarios";
import { tieneEmailRealMaika } from "./emailTecnicoMaika";
import { normalizarTelefonoES9 } from "./telefono";
import {
  solicitarCodigoAccesoRapidoApi,
  verificarCodigoAccesoRapidoApi
} from "../services/apiAuth";

type Notificar = (mensaje: string, tipo: "normal" | "exito" | "error") => void;

export async function ejecutarVerificacionCodigoAccesoRapido(params: {
  codigoIngresado: string;
  telefonoAcceso: string;
  emailRegistradoPorTelefono: (tel9: string) => string;
  proyectarUsuariosDesdeMaika: (usuarios: MaikaUsuarioLS[]) => Usuario[];
  leerMaikaUsuarios: () => MaikaUsuarioLS[];
  notificar: Notificar;
  setCodigoBloqueado: (v: boolean) => void;
  setCodigoEnviado: (v: string) => void;
  setCodigoIngresado: (v: string) => void;
  setErrorCodigo: (v: boolean) => void;
  setEmailVerificado: (v: string) => void;
  setCodigoExpiraEnMs: (v: number | null) => void;
  setEnviando: (v: boolean) => void;
  setReenvioEn: (v: number) => void;
  setPasswordNueva: (v: string) => void;
  setPasswordConfirmar: (v: string) => void;
  setMostrarPasswordNueva: (v: boolean) => void;
  setMostrarPasswordConfirmar: (v: boolean) => void;
  setPaso: (v: 3) => void;
}) {
  const {
    codigoIngresado, telefonoAcceso, emailRegistradoPorTelefono, proyectarUsuariosDesdeMaika, leerMaikaUsuarios,
    notificar, setCodigoBloqueado, setCodigoEnviado, setCodigoIngresado, setErrorCodigo,
    setEmailVerificado, setCodigoExpiraEnMs, setEnviando, setReenvioEn, setPasswordNueva, setPasswordConfirmar,
    setMostrarPasswordNueva, setMostrarPasswordConfirmar, setPaso
  } = params;

  const tel9 = normalizarTelefonoES9(telefonoAcceso || "");
  try {
    await verificarCodigoAccesoRapidoApi(tel9, codigoIngresado || "");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const restantes = (e as { restantes?: number })?.restantes;
    setErrorCodigo(true);
    if (msg === "codigo_caducado") {
      setCodigoBloqueado(true);
      setCodigoEnviado("");
      setCodigoIngresado("");
      setCodigoExpiraEnMs(null);
      notificar("❌ Código expirado, solicita uno nuevo", "error");
    } else if (msg === "demasiados_intentos") {
      setCodigoBloqueado(true);
      notificar("❌ Demasiados intentos. Reenvía el código.", "error");
    } else if (typeof restantes === "number" && restantes > 0) {
      notificar(`❌ Código incorrecto. Te quedan ${restantes} intentos.`, "error");
    } else {
      notificar("❌ Código incorrecto", "error");
    }
    return;
  }
  setErrorCodigo(false);
  const emailCuentaFijaRaw = emailRegistradoPorTelefono(tel9);
  const emailCuentaFija = tieneEmailRealMaika(emailCuentaFijaRaw) ? emailCuentaFijaRaw : "";
  if (!emailCuentaFija) {
    notificar("❌ Este número debe completar registro antes de usar acceso rápido", "error");
    return;
  }
  const usuariosLS = proyectarUsuariosDesdeMaika(leerMaikaUsuarios());
  const idx = usuariosLS.findIndex((u) => normalizarTelefonoES9(u.telefono || "") === tel9);
  if (idx === -1) { notificar("❌ Cuenta no encontrada", "error"); return; }
  const emailVerificadoRaw = (usuariosLS[idx].email || "").trim().toLowerCase();
  const emailVerificado = tieneEmailRealMaika(emailVerificadoRaw) ? emailVerificadoRaw : "";
  if (!emailVerificado) {
    notificar("❌ Esta cuenta no tiene email asociado. Completa registro.", "error");
    return;
  }
  setEmailVerificado(emailVerificado);
  setCodigoEnviado("");
  setCodigoIngresado("");
  setCodigoExpiraEnMs(null);
  setCodigoBloqueado(false);
  setEnviando(false);
  setReenvioEn(0);
  setPasswordNueva("");
  setPasswordConfirmar("");
  setMostrarPasswordNueva(false);
  setMostrarPasswordConfirmar(false);
  setPaso(3);
  notificar("✅ Código válido. Ahora define tu nueva contraseña.", "exito");
}

export async function ejecutarReenvioCodigoAccesoRapido(params: {
  enviando: boolean;
  telefonoAcceso: string;
  emailRegistradoAcceso: string;
  emailRegistradoPorTelefono: (tel9: string) => string;
  proyectarUsuariosDesdeMaika: (usuarios: MaikaUsuarioLS[]) => Usuario[];
  leerMaikaUsuarios: () => MaikaUsuarioLS[];
  notificar: Notificar;
  codigoExpiraMin: number;
  setEnviando: (v: boolean) => void;
  setErrorCodigo: (v: boolean) => void;
  setCodigoEnviado: (v: string) => void;
  setCodigoExpiraEnMs: (v: number | null) => void;
  setIntentosCodigo: (v: number) => void;
  setCodigoBloqueado: (v: boolean) => void;
  setReenvioEn: (v: number) => void;
}) {
  const {
    enviando, telefonoAcceso, emailRegistradoAcceso, emailRegistradoPorTelefono, proyectarUsuariosDesdeMaika, leerMaikaUsuarios,
    notificar, codigoExpiraMin, setEnviando, setErrorCodigo, setCodigoEnviado, setCodigoExpiraEnMs,
    setIntentosCodigo, setCodigoBloqueado, setReenvioEn
  } = params;
  if (enviando) return;
  setEnviando(true);
  setErrorCodigo(false);
  try {
    const tel9 = normalizarTelefonoES9(telefonoAcceso || "");
    if (!/^[67]\d{8}$/.test(tel9)) { notificar("❌ Teléfono no válido", "error"); return; }
    const emailCuentaFijaRaw = emailRegistradoPorTelefono(tel9);
    const emailCuentaFija = tieneEmailRealMaika(emailCuentaFijaRaw) ? emailCuentaFijaRaw : "";
    if (!emailCuentaFija) {
      notificar("❌ Este número no permite reenvío por acceso rápido", "error");
      return;
    }
    const usuariosLS = proyectarUsuariosDesdeMaika(leerMaikaUsuarios());
    const idx = usuariosLS.findIndex((u) => normalizarTelefonoES9(u.telefono || "") === tel9);
    if (idx === -1) { notificar("❌ No existe cuenta con ese teléfono", "error"); return; }
    if (!emailRegistradoAcceso) {
      notificar("❌ Este número no tiene email asociado para reenviar código", "error");
      return;
    }
    const r = await solicitarCodigoAccesoRapidoApi(tel9, emailRegistradoAcceso);
    setCodigoEnviado("1");
    setCodigoExpiraEnMs(Date.now() + codigoExpiraMin * 60_000);
    setIntentosCodigo(0);
    setCodigoBloqueado(false);
    setReenvioEn(90);
    notificar(
      r.emailEnviado
        ? "✅ Código reenviado a tu email registrado"
        : "⚠️ No se pudo enviar el email ahora; inténtalo de nuevo en unos segundos.",
      r.emailEnviado ? "exito" : "error"
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    notificar(`❌ ${msg}`, "error");
  } finally {
    setEnviando(false);
  }
}

export async function ejecutarEnvioCodigoAccesoRapidoPaso1(params: {
  enviando: boolean;
  emailUiBloqueado: boolean;
  telefonoAcceso: string;
  emailRegistradoAcceso: string;
  emailIntroducidoRaw: string;
  mensajeEmailNoCoincide: string;
  emailRegistradoPorTelefono: (tel9: string) => string;
  proyectarUsuariosDesdeMaika: (usuarios: MaikaUsuarioLS[]) => Usuario[];
  leerMaikaUsuarios: () => MaikaUsuarioLS[];
  guardarBloqueoEmail: (tel9: string) => void;
  limpiarBloqueoEmail: (tel9: string) => void;
  codigoExpiraMin: number;
  notificar: Notificar;
  setEnviando: (v: boolean) => void;
  setErrorCodigo: (v: boolean) => void;
  setEmailUi: (updater: (prev: { intentosRestantes: number; bloqueado: boolean; ayudaInline: string | null }) => { intentosRestantes: number; bloqueado: boolean; ayudaInline: string | null }) => void;
  setCodigoEnviado: (v: string) => void;
  setCodigoExpiraEnMs: (v: number | null) => void;
  setIntentosCodigo: (v: number) => void;
  setCodigoBloqueado: (v: boolean) => void;
  setReenvioEn: (v: number) => void;
  setCodigoIngresado: (v: string) => void;
  setPaso: (v: 2) => void;
  setAvisoTelefonoCheckoutNull: () => void;
}) {
  const {
    enviando, emailUiBloqueado, telefonoAcceso, emailRegistradoAcceso, emailIntroducidoRaw, mensajeEmailNoCoincide,
    emailRegistradoPorTelefono, proyectarUsuariosDesdeMaika, leerMaikaUsuarios,
    guardarBloqueoEmail, limpiarBloqueoEmail, codigoExpiraMin, notificar, setEnviando, setErrorCodigo, setEmailUi,
    setCodigoEnviado, setCodigoExpiraEnMs, setIntentosCodigo, setCodigoBloqueado, setReenvioEn, setCodigoIngresado,
    setPaso, setAvisoTelefonoCheckoutNull
  } = params;
  if (enviando || emailUiBloqueado) return;
  setEnviando(true);
  setErrorCodigo(false);
  try {
    const tel9 = normalizarTelefonoES9(telefonoAcceso || "");
    if (!/^[67]\d{8}$/.test(tel9)) { notificar("❌ Teléfono no válido", "error"); return; }
    const emailCuentaFijaRaw = emailRegistradoPorTelefono(tel9);
    const emailCuentaFija = tieneEmailRealMaika(emailCuentaFijaRaw) ? emailCuentaFijaRaw : "";
    if (!emailCuentaFija) {
      notificar("❌ Este número debe completar registro antes de usar acceso rápido", "error");
      return;
    }
    const emailIntroducido = String(emailIntroducidoRaw || "").trim().toLowerCase();
    const usuariosAcceso = proyectarUsuariosDesdeMaika(leerMaikaUsuarios());
    const idx = usuariosAcceso.findIndex((u) => normalizarTelefonoES9(u.telefono || "") === tel9);
    if (idx === -1) { notificar("❌ No existe cuenta con ese teléfono", "error"); return; }

    const aplicarFalloEmail = () => {
      setEmailUi((s) => {
        const intentosRestantes = Math.max(0, s.intentosRestantes - 1);
        if (intentosRestantes <= 0) {
          guardarBloqueoEmail(tel9);
          return { intentosRestantes: 0, bloqueado: true, ayudaInline: null };
        }
        return { ...s, intentosRestantes, ayudaInline: mensajeEmailNoCoincide };
      });
    };

    let emailEnvio: string;
    if (emailRegistradoAcceso) {
      if (!emailIntroducido) {
        setEmailUi((s) => ({ ...s, ayudaInline: "Introduce tu correo para confirmar." }));
        return;
      }
      if (emailIntroducido !== emailRegistradoAcceso) {
        aplicarFalloEmail();
        return;
      }
      emailEnvio = emailRegistradoAcceso;
    } else {
      notificar("❌ Este número debe completar registro antes de usar acceso rápido", "error");
      return;
    }

    const r = await solicitarCodigoAccesoRapidoApi(tel9, emailEnvio);
    setEmailUi((s) => ({ ...s, ayudaInline: null }));
    limpiarBloqueoEmail(tel9);
    setCodigoEnviado("1");
    setCodigoExpiraEnMs(Date.now() + codigoExpiraMin * 60_000);
    setIntentosCodigo(0);
    setCodigoBloqueado(false);
    setReenvioEn(90);
    setCodigoIngresado("");
    setPaso(2);
    setAvisoTelefonoCheckoutNull();
    notificar(
      r.emailEnviado
        ? "✅ Te hemos enviado un código a tu correo. Introdúcelo en el siguiente paso."
        : "⚠️ No se pudo enviar el email ahora; usa «Reenviar código» en unos segundos.",
      r.emailEnviado ? "exito" : "error"
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    notificar(`❌ ${msg}`, "error");
  } finally {
    setEnviando(false);
  }
}
