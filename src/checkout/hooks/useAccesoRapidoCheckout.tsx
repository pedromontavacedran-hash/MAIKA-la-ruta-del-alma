import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AuthForm, Cliente, Pagina, Usuario } from "../../types";
import type { MaikaUsuarioLS } from "../../utils/maikaUsuarios";
import { normalizarTelefonoES9 } from "../../utils/telefono";
import {
  formatearCuentaAtrasMmSs,
  guardarBloqueoEmailAccesoRapido,
  guardarBloqueoSeguridadAccesoRapido,
  leerBloqueoEmailAccesoRapidoActivo,
  limpiarBloqueoEmailAccesoRapido,
  msRestantesBloqueoEmailAccesoRapido,
  msRestantesBloqueoSeguridadAccesoRapido
} from "../../utils/accesoRapidoBloqueos";
import { evaluarPasswordBasica } from "../../utils/accesoRapidoUtils";
import {
  ejecutarEnvioCodigoAccesoRapidoPaso1,
  ejecutarReenvioCodigoAccesoRapido,
  ejecutarVerificacionCodigoAccesoRapido
} from "../../utils/accesoRapidoActions";
import { validarCodigoUltimoPedido } from "../../utils/accesoRapidoVerificacion";
import { crearFormAuthRegistroDesdeAcceso } from "../../utils/authForms";
import {
  limpiarActivacionIdentidadVerificada,
  marcarActivacionIdentidadVerificada
} from "../../utils/activacionIdentidadSession";
import { resetAccesoRapidoCheckoutState } from "../../utils/accesoRapidoState";
import { tieneEmailRealMaika } from "../../utils/emailTecnicoMaika";
import { loginServidorDesdeAccesoRapido } from "../utils/accesoRapidoLogin";
import RequisitosPasswordAccesoRapido from "../components/RequisitosPasswordAccesoRapido";
import {
  LoginApiError,
  obtenerEstadoUsuarioPorTelefonoApi,
  solicitarRecuperacionPasswordApi
} from "../../services/apiAuth";
import { notificarError, notificarExito } from "../../utils/ui/notificaciones";

export type AccesoRapidoEmailUiState = {
  intentosRestantes: number;
  bloqueado: boolean;
  ayudaInline: string | null;
};

export type UseAccesoRapidoCheckoutDeps = {
  datosCliente: Cliente;
  mostrarNotificacion: (m: string, t: "normal" | "exito" | "error") => void;
  iniciarSesionConToken: (token: string, opts?: { mostrarBienvenida?: boolean }) => Promise<Usuario | null>;
  setPagina: (p: Pagina) => void;
  setFormPedidoAbierto: (v: boolean) => void;
  setPasoFinalizarCompra: (v: "datos" | "confirmarDireccion" | "pago") => void;
  pasoFinalizarCompraActual: "datos" | "confirmarDireccion" | "pago";
  setAvisoTelefonoCheckout: (v: { encontrado: boolean; texto: string } | null) => void;
  setModoRegistro: React.Dispatch<React.SetStateAction<"login" | "register">>;
  setTelefonoForzadoRegistroDesdeAcceso: (v: string) => void;
  setModoForzadoRegistroDesdeAcceso: (v: "" | "registro" | "activar") => void;
  setConfirmacionIdentidadActivacion: (v: boolean) => void;
  setFormAuth: React.Dispatch<React.SetStateAction<AuthForm>>;
  findMaikaUsuarioPorTel9: (tel9: string) => MaikaUsuarioLS | null;
  telefonoTieneActividadSinEmail: (tel9: string) => boolean;
  obtenerCodigoUltimoPedidoPorTel9: (tel9: string) => string;
  emailRegistradoUnificadoParaTel9: (tel9: string) => string;
  proyectarUsuariosDesdeMaika: (u: MaikaUsuarioLS[]) => Usuario[];
  leerMaikaUsuarios: () => MaikaUsuarioLS[];
  guardarMaikaUsuarios: (u: MaikaUsuarioLS[]) => void;
  loadCuentaPage: () => Promise<unknown>;
  /** Permite hidratar lista de direcciones al autenticarse desde acceso rápido. */
  onAuthAccesoRapido?: (usuarioAuth: Usuario) => void;
  /** Antes de reabrir el modal de pedido tras login/contraseña; false = no abrir (p. ej. sin stock). */
  antesDeAbrirModalPedido?: () => Promise<boolean>;
};

const ACCESO_RAPIDO_MAX_INTENTOS_EMAIL = 3;
export const ACCESO_RAPIDO_MSG_EMAIL_NO_COINCIDE = "El correo no coincide con este teléfono.";
const ACCESO_RAPIDO_CODIGO_EXPIRA_MIN = 10;

export function useAccesoRapidoCheckout(d: UseAccesoRapidoCheckoutDeps) {
  const {
    datosCliente,
    mostrarNotificacion,
    iniciarSesionConToken,
    setPagina,
    setFormPedidoAbierto,
    setPasoFinalizarCompra,
    pasoFinalizarCompraActual,
    setAvisoTelefonoCheckout,
    setModoRegistro,
    setTelefonoForzadoRegistroDesdeAcceso,
    setModoForzadoRegistroDesdeAcceso,
    setConfirmacionIdentidadActivacion,
    setFormAuth,
    findMaikaUsuarioPorTel9,
    telefonoTieneActividadSinEmail,
    obtenerCodigoUltimoPedidoPorTel9,
    emailRegistradoUnificadoParaTel9,
    proyectarUsuariosDesdeMaika,
    leerMaikaUsuarios,
    guardarMaikaUsuarios,
    loadCuentaPage,
    onAuthAccesoRapido,
    antesDeAbrirModalPedido
  } = d;

  const [accesoRapidoCheckoutAbierto, setAccesoRapidoCheckoutAbierto] = useState(false);
  const [accesoRapidoPaso, setAccesoRapidoPaso] = useState<1 | 2 | 3 | 4>(1);
  const [accesoRapidoTelefono, setAccesoRapidoTelefono] = useState("");
  const [accesoRapidoEmail, setAccesoRapidoEmail] = useState("");
  const [accesoRapidoEmailRegistrado, setAccesoRapidoEmailRegistrado] = useState("");
  const [accesoRapidoCodigoEnviado, setAccesoRapidoCodigoEnviado] = useState("");
  const [accesoRapidoCodigoIngresado, setAccesoRapidoCodigoIngresado] = useState("");
  const [accesoRapidoCodigoUltimoPedido, setAccesoRapidoCodigoUltimoPedido] = useState("");
  const [accesoRapidoIntentosSeguridad, setAccesoRapidoIntentosSeguridad] = useState(0);
  const [accesoRapidoEstadoVerificacionSeguridad, setAccesoRapidoEstadoVerificacionSeguridad] = useState<
    "idle" | "ok" | "error"
  >("idle");
  const [accesoRapidoReenvioEn, setAccesoRapidoReenvioEn] = useState(0);
  const [accesoRapidoCuentaSinEmail, setAccesoRapidoCuentaSinEmail] = useState(false);
  const [accesoRapidoCuentaSinPassword, setAccesoRapidoCuentaSinPassword] = useState(false);
  const [accesoRapidoCuentaConActividadSinEmail, setAccesoRapidoCuentaConActividadSinEmail] =
    useState(false);
  const [accesoRapidoLoginPassword, setAccesoRapidoLoginPassword] = useState("");
  const [accesoRapidoCodigoExpiraEnMs, setAccesoRapidoCodigoExpiraEnMs] = useState<number | null>(null);
  const [accesoRapidoIntentosCodigo, setAccesoRapidoIntentosCodigo] = useState(0);
  const [accesoRapidoCodigoBloqueado, setAccesoRapidoCodigoBloqueado] = useState(false);
  const [accesoRapidoEmailVerificado, setAccesoRapidoEmailVerificado] = useState("");
  const [accesoRapidoPasswordNueva, setAccesoRapidoPasswordNueva] = useState("");
  const [accesoRapidoPasswordConfirmar, setAccesoRapidoPasswordConfirmar] = useState("");
  const [accesoRapidoMostrarPasswordNueva, setAccesoRapidoMostrarPasswordNueva] = useState(false);
  const [accesoRapidoMostrarPasswordConfirmar, setAccesoRapidoMostrarPasswordConfirmar] = useState(false);
  const [accesoRapidoEmailUi, setAccesoRapidoEmailUi] = useState<AccesoRapidoEmailUiState>(() => ({
    intentosRestantes: ACCESO_RAPIDO_MAX_INTENTOS_EMAIL,
    bloqueado: false,
    ayudaInline: null
  }));
  const [enviando, setEnviando] = useState(false);
  const [errorCodigo, setErrorCodigo] = useState(false);
  const [tickAccesoRapido, setTickAccesoRapido] = useState(0);
  const [tickBloqueoEmailAccesoRapido, setTickBloqueoEmailAccesoRapido] = useState(0);
  const [accesoRapidoSeguridadUiBloqueado, setAccesoRapidoSeguridadUiBloqueado] = useState(false);
  const [tickBloqueoSeguridadAccesoRapido, setTickBloqueoSeguridadAccesoRapido] = useState(0);
  const [textoCuentaAtrasBloqueoSeguridadUi, setTextoCuentaAtrasBloqueoSeguridadUi] = useState("00:00");
  const pasoCheckoutPrevioAccesoRef = useRef<"datos" | "confirmarDireccion" | "pago">("datos");
  const confirmacionEstadoTelefonoSeqRef = useRef(0);

  const accesoRapidoPasswordEstado = evaluarPasswordBasica((accesoRapidoPasswordNueva || "").trim());
  const accesoRapidoPassValida = accesoRapidoPasswordEstado.valida;
  const accesoRapidoPasswordsCoinciden =
    (accesoRapidoPasswordNueva || "").trim().length > 0 &&
    (accesoRapidoPasswordConfirmar || "").trim().length > 0 &&
    (accesoRapidoPasswordNueva || "").trim() === (accesoRapidoPasswordConfirmar || "").trim();
  const accesoRapidoPuedeGuardarPassword = accesoRapidoPassValida && accesoRapidoPasswordsCoinciden;

  const resetAccesoRapidoCheckout = useCallback(
    () => {
      confirmacionEstadoTelefonoSeqRef.current += 1;
      resetAccesoRapidoCheckoutState({
        setAccesoRapidoPaso,
        setAccesoRapidoCodigoEnviado,
        setAccesoRapidoCodigoIngresado,
        setAccesoRapidoCodigoUltimoPedido,
        setAccesoRapidoIntentosSeguridad,
        setAccesoRapidoEstadoVerificacionSeguridad,
        setAccesoRapidoSeguridadUiBloqueado,
        setAccesoRapidoCodigoExpiraEnMs,
        setAccesoRapidoIntentosCodigo,
        setAccesoRapidoCodigoBloqueado,
        setAccesoRapidoReenvioEn,
        setAccesoRapidoEmailVerificado,
        setAccesoRapidoPasswordNueva,
        setAccesoRapidoPasswordConfirmar,
        setAccesoRapidoMostrarPasswordNueva,
        setAccesoRapidoMostrarPasswordConfirmar,
        setErrorCodigo
      });
    },
    []
  );

  const abrirRegistroForzadoDesdeAcceso = useCallback(
    (modo: string) => {
      resetAccesoRapidoCheckout();
      setAccesoRapidoCheckoutAbierto(false);
      setAvisoTelefonoCheckout(null);
      setFormPedidoAbierto(false);
      setPasoFinalizarCompra("datos");
      setModoRegistro("register");
      setTelefonoForzadoRegistroDesdeAcceso(accesoRapidoTelefono);
      setModoForzadoRegistroDesdeAcceso(modo === "activar" ? "activar" : "registro");
      setConfirmacionIdentidadActivacion(modo === "activar");
      if (modo !== "activar") limpiarActivacionIdentidadVerificada();
      setFormAuth(crearFormAuthRegistroDesdeAcceso(accesoRapidoTelefono));
      try {
        const tel9 = normalizarTelefonoES9(accesoRapidoTelefono || "");
        const maika =
          leerMaikaUsuarios().find((u) => normalizarTelefonoES9(String(u.telefono || "")) === tel9) || null;
        const nombreCompleto = `${String(maika?.nombre || "").trim()} ${String(maika?.apellidos || "").trim()}`.trim();
        if (nombreCompleto) {
          setFormAuth((prev) => ({ ...prev, nombre: nombreCompleto }));
        }
      } catch {
        /* ignore */
      }
      setPagina("cuenta");
    },
    [
      resetAccesoRapidoCheckout,
      accesoRapidoTelefono,
      setAvisoTelefonoCheckout,
      setFormPedidoAbierto,
      setPasoFinalizarCompra,
      setModoRegistro,
      setTelefonoForzadoRegistroDesdeAcceso,
      setModoForzadoRegistroDesdeAcceso,
      setConfirmacionIdentidadActivacion,
      setFormAuth,
      setPagina,
      leerMaikaUsuarios
    ]
  );

  const verificarIdentidadAccesoRapido = useCallback(() => {
    const tel9 = normalizarTelefonoES9(accesoRapidoTelefono || "");
    const bloqueoActivo = msRestantesBloqueoSeguridadAccesoRapido(tel9) > 0;
    if (bloqueoActivo) {
      setAccesoRapidoEstadoVerificacionSeguridad("error");
      return;
    }
    const esperado = obtenerCodigoUltimoPedidoPorTel9(tel9);
    const recibido = accesoRapidoCodigoUltimoPedido || "";
    if (!validarCodigoUltimoPedido(esperado, recibido)) {
      const proximo = accesoRapidoIntentosSeguridad + 1;
      setAccesoRapidoIntentosSeguridad(proximo);
      setAccesoRapidoEstadoVerificacionSeguridad("error");
      if (proximo >= 3) {
        guardarBloqueoSeguridadAccesoRapido(tel9);
        setAccesoRapidoSeguridadUiBloqueado(true);
      }
      return;
    }
    setAccesoRapidoIntentosSeguridad(0);
    setAccesoRapidoEstadoVerificacionSeguridad("ok");
    marcarActivacionIdentidadVerificada(accesoRapidoTelefono || "", recibido);
    window.setTimeout(() => {
      abrirRegistroForzadoDesdeAcceso("activar");
    }, 250);
  }, [
    accesoRapidoTelefono,
    accesoRapidoCodigoUltimoPedido,
    accesoRapidoIntentosSeguridad,
    obtenerCodigoUltimoPedidoPorTel9,
    abrirRegistroForzadoDesdeAcceso
  ]);

  const entrarAccesoRapido = useCallback(() => {
    const tel9 = normalizarTelefonoES9(accesoRapidoTelefono || "");
    const passInput = String(accesoRapidoLoginPassword || "").trim();
    if (!passInput) {
      notificarError(mostrarNotificacion, "❌ Introduce la contraseña");
      return;
    }
    if (!tel9) {
      notificarError(mostrarNotificacion, "❌ Introduce un teléfono válido");
      return;
    }
    void (async () => {
      await loadCuentaPage();
      let usuarioLogin: Usuario | null = null;
      try {
        const auth = await loginServidorDesdeAccesoRapido(tel9, passInput);
        usuarioLogin = await iniciarSesionConToken(auth.token);
      } catch (e) {
        if (e instanceof LoginApiError && e.status === 401) {
          notificarError(
            mostrarNotificacion,
            "❌ Contraseña no válida. Pulsa “¿Olvidaste tu contraseña?” y te enviaremos un enlace seguro para crear una nueva."
          );
          return;
        }
        if (e instanceof LoginApiError && e.status === 404) {
          notificarError(
            mostrarNotificacion,
            "❌ No encontramos esta cuenta en el servidor. Abre Mi cuenta para registrar o sincronizar antes de pagar."
          );
          return;
        }
        const msg = e instanceof Error ? e.message : String(e);
        notificarError(mostrarNotificacion, `❌ ${msg}`);
        return;
      }
      if (!usuarioLogin) {
        notificarError(mostrarNotificacion, "❌ Sesión iniciada, pero no pudimos cargar tus datos. Pulsa Reintentar cuando vuelva la conexión.");
        return;
      }
      onAuthAccesoRapido?.(usuarioLogin);
      if (antesDeAbrirModalPedido) {
        const puede = await antesDeAbrirModalPedido();
        if (!puede) {
          resetAccesoRapidoCheckout();
          setAccesoRapidoCheckoutAbierto(false);
          setAvisoTelefonoCheckout(null);
          return;
        }
      }
      resetAccesoRapidoCheckout();
      setAccesoRapidoCheckoutAbierto(false);
      setAvisoTelefonoCheckout(null);
      setFormPedidoAbierto(true);
      setPasoFinalizarCompra(pasoCheckoutPrevioAccesoRef.current || "datos");
      notificarExito(mostrarNotificacion, "✅ Sesión iniciada. Continúa con tu pedido.");
    })();
  }, [
    accesoRapidoTelefono,
    accesoRapidoLoginPassword,
    resetAccesoRapidoCheckout,
    findMaikaUsuarioPorTel9,
    loadCuentaPage,
    iniciarSesionConToken,
    onAuthAccesoRapido,
    setAvisoTelefonoCheckout,
    setFormPedidoAbierto,
    setPasoFinalizarCompra,
    mostrarNotificacion,
    antesDeAbrirModalPedido
  ]);

  const abrirAccesoRapidoCheckout = useCallback(() => {
    void loadCuentaPage();
    const tel9 = normalizarTelefonoES9(datosCliente.telefono || "");
    pasoCheckoutPrevioAccesoRef.current = pasoFinalizarCompraActual;
    setAccesoRapidoTelefono(tel9);
    const maikaU = findMaikaUsuarioPorTel9(tel9);
    const emailGuardado = (maikaU?.email || "").trim().toLowerCase();
    const emailReal = tieneEmailRealMaika(emailGuardado) ? emailGuardado : "";
    const hasPasswordDato =
      typeof maikaU?.hasPassword === "boolean"
        ? maikaU.hasPassword
        : !!String((maikaU as MaikaUsuarioLS & { password?: string } | null)?.password || "").trim();
    const sinEmail = !emailReal;
    const sinPassword = !!emailReal && !hasPasswordDato;
    const actividadSinEmail = sinEmail && telefonoTieneActividadSinEmail(tel9);
    setAccesoRapidoCuentaSinEmail(sinEmail);
    setAccesoRapidoCuentaSinPassword(sinPassword);
    setAccesoRapidoCuentaConActividadSinEmail(actividadSinEmail);
    const msBloqueoSeg = msRestantesBloqueoSeguridadAccesoRapido(tel9);
    setAccesoRapidoSeguridadUiBloqueado(msBloqueoSeg > 0);
    if (emailReal) {
      setAccesoRapidoEmailRegistrado(emailReal.trim().toLowerCase());
      setAccesoRapidoEmail("");
    } else {
      setAccesoRapidoEmailRegistrado("");
      setAccesoRapidoEmail("");
    }
    setModoForzadoRegistroDesdeAcceso("");
    setAccesoRapidoCodigoEnviado("");
    setAccesoRapidoCodigoIngresado("");
    setAccesoRapidoCodigoUltimoPedido("");
    setAccesoRapidoReenvioEn(0);
    setAccesoRapidoCodigoExpiraEnMs(null);
    setAccesoRapidoIntentosCodigo(0);
    setAccesoRapidoCodigoBloqueado(false);
    setAccesoRapidoEmailVerificado("");
    setAccesoRapidoPasswordNueva("");
    setAccesoRapidoPasswordConfirmar("");
    setAccesoRapidoLoginPassword("");
    if (leerBloqueoEmailAccesoRapidoActivo(tel9)) {
      setAccesoRapidoEmailUi({ intentosRestantes: 0, bloqueado: true, ayudaInline: null });
    } else {
      setAccesoRapidoEmailUi({
        intentosRestantes: ACCESO_RAPIDO_MAX_INTENTOS_EMAIL,
        bloqueado: false,
        ayudaInline: null
      });
    }
    setAccesoRapidoPaso(1);
    setAccesoRapidoCheckoutAbierto(true);
    const confirmacionSeq = ++confirmacionEstadoTelefonoSeqRef.current;
    void obtenerEstadoUsuarioPorTelefonoApi(tel9)
      .then((estado) => {
        if (confirmacionEstadoTelefonoSeqRef.current !== confirmacionSeq) return;
        if (!estado.existe) return;

        const usuariosMaika = leerMaikaUsuarios();
        let actualizado = false;
        const usuariosActualizados = usuariosMaika.map((u) => {
          if (normalizarTelefonoES9(u.telefono || "") !== tel9) return u;
          const siguiente = {
            ...u,
            hasPassword: !!estado.hasPassword
          };
          actualizado =
            actualizado ||
            siguiente.hasPassword !== u.hasPassword;
          return siguiente;
        });

        if (actualizado) guardarMaikaUsuarios(usuariosActualizados);

        const sinEmailBackend = !estado.hasEmail;
        const sinPasswordBackend = estado.hasEmail && !estado.hasPassword;
        setAccesoRapidoCuentaSinEmail(sinEmailBackend);
        setAccesoRapidoCuentaSinPassword(sinPasswordBackend);
        setAccesoRapidoCuentaConActividadSinEmail(
          sinEmailBackend && telefonoTieneActividadSinEmail(tel9)
        );
        // Conserva un email que ya conocía este navegador, pero nunca recibe uno nuevo desde esta consulta pública.
        setAccesoRapidoEmailRegistrado(emailReal);
      })
      .catch(() => {
        /* Confirmación silenciosa: si falla, se mantiene la predicción local. */
      });
  }, [
    datosCliente.telefono,
    loadCuentaPage,
    findMaikaUsuarioPorTel9,
    telefonoTieneActividadSinEmail,
    leerMaikaUsuarios,
    guardarMaikaUsuarios,
    setModoForzadoRegistroDesdeAcceso,
    pasoFinalizarCompraActual
  ]);

  const enviarCodigoAccesoRapidoPaso1 = useCallback(
    async (emailForzado?: string) => {
      await ejecutarEnvioCodigoAccesoRapidoPaso1({
        enviando,
        emailUiBloqueado: accesoRapidoEmailUi.bloqueado,
        telefonoAcceso: accesoRapidoTelefono,
        emailRegistradoAcceso: accesoRapidoEmailRegistrado,
        emailIntroducidoRaw: typeof emailForzado === "string" ? emailForzado : accesoRapidoEmail,
        mensajeEmailNoCoincide: ACCESO_RAPIDO_MSG_EMAIL_NO_COINCIDE,
        emailRegistradoPorTelefono: emailRegistradoUnificadoParaTel9,
        proyectarUsuariosDesdeMaika,
        leerMaikaUsuarios,
        guardarBloqueoEmail: guardarBloqueoEmailAccesoRapido,
        limpiarBloqueoEmail: limpiarBloqueoEmailAccesoRapido,
        codigoExpiraMin: ACCESO_RAPIDO_CODIGO_EXPIRA_MIN,
        notificar: mostrarNotificacion,
        setEnviando,
        setErrorCodigo,
        setEmailUi: (updater) => setAccesoRapidoEmailUi(updater),
        setCodigoEnviado: setAccesoRapidoCodigoEnviado,
        setCodigoExpiraEnMs: setAccesoRapidoCodigoExpiraEnMs,
        setIntentosCodigo: setAccesoRapidoIntentosCodigo,
        setCodigoBloqueado: setAccesoRapidoCodigoBloqueado,
        setReenvioEn: setAccesoRapidoReenvioEn,
        setCodigoIngresado: setAccesoRapidoCodigoIngresado,
        setPaso: setAccesoRapidoPaso,
        setAvisoTelefonoCheckoutNull: () => setAvisoTelefonoCheckout(null)
      });
    },
    [
      enviando,
      accesoRapidoEmailUi.bloqueado,
      accesoRapidoTelefono,
      accesoRapidoEmailRegistrado,
      accesoRapidoEmail,
      emailRegistradoUnificadoParaTel9,
      proyectarUsuariosDesdeMaika,
      leerMaikaUsuarios,
      mostrarNotificacion,
      setAvisoTelefonoCheckout
    ]
  );

  const verificarCodigoAccesoRapido = useCallback(() => {
    void ejecutarVerificacionCodigoAccesoRapido({
      codigoIngresado: accesoRapidoCodigoIngresado,
      telefonoAcceso: accesoRapidoTelefono,
      emailRegistradoPorTelefono: emailRegistradoUnificadoParaTel9,
      proyectarUsuariosDesdeMaika,
      leerMaikaUsuarios,
      notificar: mostrarNotificacion,
      setCodigoBloqueado: setAccesoRapidoCodigoBloqueado,
      setCodigoEnviado: setAccesoRapidoCodigoEnviado,
      setCodigoIngresado: setAccesoRapidoCodigoIngresado,
      setErrorCodigo,
      setEmailVerificado: setAccesoRapidoEmailVerificado,
      setCodigoExpiraEnMs: setAccesoRapidoCodigoExpiraEnMs,
      setEnviando,
      setReenvioEn: setAccesoRapidoReenvioEn,
      setPasswordNueva: setAccesoRapidoPasswordNueva,
      setPasswordConfirmar: setAccesoRapidoPasswordConfirmar,
      setMostrarPasswordNueva: setAccesoRapidoMostrarPasswordNueva,
      setMostrarPasswordConfirmar: setAccesoRapidoMostrarPasswordConfirmar,
      setPaso: setAccesoRapidoPaso
    });
  }, [
    accesoRapidoCodigoIngresado,
    accesoRapidoTelefono,
    emailRegistradoUnificadoParaTel9,
    proyectarUsuariosDesdeMaika,
    leerMaikaUsuarios,
    mostrarNotificacion
  ]);

  const reenviarCodigoAccesoRapido = useCallback(async () => {
    await ejecutarReenvioCodigoAccesoRapido({
      enviando,
      telefonoAcceso: accesoRapidoTelefono,
      emailRegistradoAcceso: accesoRapidoEmailRegistrado,
      emailRegistradoPorTelefono: emailRegistradoUnificadoParaTel9,
      proyectarUsuariosDesdeMaika,
      leerMaikaUsuarios,
      notificar: mostrarNotificacion,
      codigoExpiraMin: ACCESO_RAPIDO_CODIGO_EXPIRA_MIN,
      setEnviando,
      setErrorCodigo,
      setCodigoEnviado: setAccesoRapidoCodigoEnviado,
      setCodigoExpiraEnMs: setAccesoRapidoCodigoExpiraEnMs,
      setIntentosCodigo: setAccesoRapidoIntentosCodigo,
      setCodigoBloqueado: setAccesoRapidoCodigoBloqueado,
      setReenvioEn: setAccesoRapidoReenvioEn
    });
  }, [
    enviando,
    accesoRapidoTelefono,
    emailRegistradoUnificadoParaTel9,
    proyectarUsuariosDesdeMaika,
    leerMaikaUsuarios,
    accesoRapidoEmailRegistrado,
    mostrarNotificacion
  ]);

  const guardarPasswordAccesoRapido = useCallback(() => {
    const tel9 = normalizarTelefonoES9(accesoRapidoTelefono || "");
    if (!/^[67]\d{8}$/.test(tel9)) {
      notificarError(mostrarNotificacion, "❌ Teléfono no válido");
      return;
    }
    const usuariosMaika = leerMaikaUsuarios();
    const idx = usuariosMaika.findIndex((u) => normalizarTelefonoES9(u.telefono || "") === tel9);
    if (idx === -1) {
      notificarError(mostrarNotificacion, "❌ Cuenta no encontrada");
      return;
    }

    void (async () => {
      await loadCuentaPage();
      const emailFinal = (accesoRapidoEmailVerificado || usuariosMaika[idx].email || "").trim().toLowerCase();
      try {
        await solicitarRecuperacionPasswordApi(emailFinal, tel9);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        notificarError(mostrarNotificacion, `❌ ${msg}`);
        return;
      }
      if (emailFinal && !usuariosMaika[idx].email) {
        usuariosMaika[idx] = { ...usuariosMaika[idx], email: emailFinal };
        guardarMaikaUsuarios(usuariosMaika);
      }
      setAccesoRapidoCodigoEnviado("");
      setAccesoRapidoCodigoIngresado("");
      setAccesoRapidoCodigoExpiraEnMs(null);
      setAccesoRapidoIntentosCodigo(0);
      setAccesoRapidoCodigoBloqueado(false);
      setAccesoRapidoReenvioEn(0);
      setAccesoRapidoEmailVerificado("");
      setAccesoRapidoPasswordNueva("");
      setAccesoRapidoPasswordConfirmar("");
      setAccesoRapidoCheckoutAbierto(false);
      setAvisoTelefonoCheckout(null);
      notificarExito(mostrarNotificacion, "✅ Te hemos enviado un enlace seguro para crear tu contraseña. Revisa tu correo.");
    })();
  }, [
    accesoRapidoTelefono,
    accesoRapidoEmailVerificado,
    leerMaikaUsuarios,
    guardarMaikaUsuarios,
    loadCuentaPage,
    setAvisoTelefonoCheckout,
    mostrarNotificacion
  ]);

  const renderRequisitosPassword = useCallback((password: string) => {
    return <RequisitosPasswordAccesoRapido password={password} />;
  }, []);

  useEffect(() => {
    if (accesoRapidoReenvioEn <= 0) return;
    const id = window.setInterval(() => {
      setAccesoRapidoReenvioEn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [accesoRapidoReenvioEn]);

  useEffect(() => {
    if (!accesoRapidoCheckoutAbierto) return;
    if (accesoRapidoPaso !== 2) return;
    if (!accesoRapidoCodigoExpiraEnMs) return;
    const id = window.setInterval(() => setTickAccesoRapido((p) => p + 1), 1000);
    return () => window.clearInterval(id);
  }, [accesoRapidoCheckoutAbierto, accesoRapidoPaso, accesoRapidoCodigoExpiraEnMs]);

  const accesoRapidoCodigoExpiradoAhora = useMemo(() => {
    if (!accesoRapidoCodigoExpiraEnMs) return false;
    return Date.now() > accesoRapidoCodigoExpiraEnMs;
  }, [accesoRapidoCodigoExpiraEnMs, tickAccesoRapido]);

  useEffect(() => {
    if (!accesoRapidoCheckoutAbierto || !accesoRapidoEmailUi.bloqueado) return;
    const tel9 = normalizarTelefonoES9(accesoRapidoTelefono || "");
    const id = window.setInterval(() => {
      setTickBloqueoEmailAccesoRapido((x) => x + 1);
      const ms = msRestantesBloqueoEmailAccesoRapido(tel9);
      if (ms <= 0) {
        setAccesoRapidoEmailUi({
          intentosRestantes: ACCESO_RAPIDO_MAX_INTENTOS_EMAIL,
          bloqueado: false,
          ayudaInline: null
        });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [accesoRapidoCheckoutAbierto, accesoRapidoEmailUi.bloqueado, accesoRapidoTelefono]);

  const textoCuentaAtrasBloqueoEmail = useMemo(() => {
    if (!accesoRapidoEmailUi.bloqueado || !accesoRapidoCheckoutAbierto) return "00:00";
    const tel9 = normalizarTelefonoES9(accesoRapidoTelefono || "");
    const ms = msRestantesBloqueoEmailAccesoRapido(tel9);
    return formatearCuentaAtrasMmSs(ms);
  }, [accesoRapidoEmailUi.bloqueado, accesoRapidoCheckoutAbierto, accesoRapidoTelefono, tickBloqueoEmailAccesoRapido]);

  useEffect(() => {
    if (!accesoRapidoCheckoutAbierto || accesoRapidoPaso !== 4 || !accesoRapidoSeguridadUiBloqueado) return;
    const tel9 = normalizarTelefonoES9(accesoRapidoTelefono || "");
    setTextoCuentaAtrasBloqueoSeguridadUi(formatearCuentaAtrasMmSs(msRestantesBloqueoSeguridadAccesoRapido(tel9)));
    const id = window.setInterval(() => {
      setTickBloqueoSeguridadAccesoRapido((x) => x + 1);
      const ms = msRestantesBloqueoSeguridadAccesoRapido(tel9);
      setTextoCuentaAtrasBloqueoSeguridadUi(formatearCuentaAtrasMmSs(ms));
      if (ms <= 0) {
        setAccesoRapidoSeguridadUiBloqueado(false);
        setAccesoRapidoIntentosSeguridad(0);
        setAccesoRapidoEstadoVerificacionSeguridad("idle");
        setAccesoRapidoCodigoUltimoPedido("");
        setTextoCuentaAtrasBloqueoSeguridadUi("00:00");
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [accesoRapidoCheckoutAbierto, accesoRapidoPaso, accesoRapidoSeguridadUiBloqueado, accesoRapidoTelefono]);

  const msBloqueoSeguridadAccesoRapido = useMemo(() => {
    if (!accesoRapidoSeguridadUiBloqueado || !accesoRapidoCheckoutAbierto || accesoRapidoPaso !== 4) return 0;
    const tel9 = normalizarTelefonoES9(accesoRapidoTelefono || "");
    return msRestantesBloqueoSeguridadAccesoRapido(tel9);
  }, [
    accesoRapidoSeguridadUiBloqueado,
    accesoRapidoCheckoutAbierto,
    accesoRapidoPaso,
    accesoRapidoTelefono,
    tickBloqueoSeguridadAccesoRapido
  ]);

  return {
    ACCESO_RAPIDO_MSG_EMAIL_NO_COINCIDE,
    accesoRapidoCheckoutAbierto,
    setAccesoRapidoCheckoutAbierto,
    accesoRapidoPaso,
    setAccesoRapidoPaso,
    accesoRapidoTelefono,
    accesoRapidoEmail,
    setAccesoRapidoEmail,
    accesoRapidoEmailRegistrado,
    accesoRapidoCodigoEnviado,
    accesoRapidoCodigoIngresado,
    setAccesoRapidoCodigoIngresado,
    accesoRapidoCodigoUltimoPedido,
    setAccesoRapidoCodigoUltimoPedido,
    accesoRapidoIntentosSeguridad,
    accesoRapidoEstadoVerificacionSeguridad,
    setAccesoRapidoEstadoVerificacionSeguridad,
    accesoRapidoReenvioEn,
    accesoRapidoCuentaSinEmail,
    accesoRapidoCuentaSinPassword,
    accesoRapidoCuentaConActividadSinEmail,
    accesoRapidoLoginPassword,
    setAccesoRapidoLoginPassword,
    accesoRapidoCodigoExpiraEnMs,
    accesoRapidoIntentosCodigo,
    accesoRapidoCodigoBloqueado,
    accesoRapidoEmailVerificado,
    accesoRapidoPasswordNueva,
    setAccesoRapidoPasswordNueva,
    accesoRapidoPasswordConfirmar,
    setAccesoRapidoPasswordConfirmar,
    accesoRapidoMostrarPasswordNueva,
    setAccesoRapidoMostrarPasswordNueva,
    accesoRapidoMostrarPasswordConfirmar,
    setAccesoRapidoMostrarPasswordConfirmar,
    accesoRapidoEmailUi,
    setAccesoRapidoEmailUi,
    enviando,
    errorCodigo,
    setErrorCodigo,
    accesoRapidoCodigoExpiradoAhora,
    textoCuentaAtrasBloqueoEmail,
    textoCuentaAtrasBloqueoSeguridadUi,
    msBloqueoSeguridadAccesoRapido,
    accesoRapidoPuedeGuardarPassword,
    accesoRapidoPasswordsCoinciden,
    resetAccesoRapidoCheckout,
    abrirAccesoRapidoCheckout,
    abrirRegistroForzadoDesdeAcceso,
    verificarIdentidadAccesoRapido,
    entrarAccesoRapido,
    enviarCodigoAccesoRapidoPaso1,
    verificarCodigoAccesoRapido,
    reenviarCodigoAccesoRapido,
    guardarPasswordAccesoRapido,
    renderRequisitosPassword
  };
}

export type UseAccesoRapidoCheckoutReturn = ReturnType<typeof useAccesoRapidoCheckout>;
