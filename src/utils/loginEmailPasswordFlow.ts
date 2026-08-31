import { loginApi, LoginApiError } from "../services/apiAuth";
import { tieneEmailRealMaika } from "./emailTecnicoMaika";
import { esErrorDeConexion } from "./esErrorDeConexion";

export function emailValidoLoginCuenta(s: string): boolean {
  const t = (s || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) && tieneEmailRealMaika(t);
}

export type LoginEmailPasswordFlowResult =
  | { kind: "ok"; token: string }
  | { kind: "error"; message: string };

/**
 * Login real por API. `maika_usuarios` no autentica: solo puede servir como caché visual en capas superiores.
 */
export async function loginEmailPasswordFlow(emailRaw: string, password: string): Promise<LoginEmailPasswordFlowResult> {
  const emailNorm = (emailRaw || "").trim().toLowerCase();
  const passInput = String(password || "").trim();
  if (!emailNorm || !passInput) {
    return { kind: "error", message: "Introduce correo y contraseña" };
  }
  if (!emailValidoLoginCuenta(emailNorm)) {
    return { kind: "error", message: "Introduce un correo electrónico válido" };
  }

  let sinServidorApi = false;
  let mensajeRed: string | null = null;
  /** El servidor respondió 401/403: no mezclar con fallos de red ni mensajes de “API”. */
  let credencialesRechazadasPorApi = false;

  try {
    const auth = await loginApi(emailNorm, passInput);
    return { kind: "ok", token: auth.token };
  } catch (err) {
    if (err instanceof LoginApiError) {
      if (err.status === 401 || err.status === 403) credencialesRechazadasPorApi = true;
    } else if (esErrorDeConexion(err)) {
      sinServidorApi = true;
      mensajeRed = err instanceof Error ? err.message : null;
    } else {
      const e = err instanceof Error ? err : new Error(String(err));
      const falloRed =
        e instanceof TypeError || /failed to fetch|networkerror|load failed|aborted|timeout/i.test(e.message);
      if (falloRed) sinServidorApi = true;
    }
  }

  if (sinServidorApi) {
    return {
      kind: "error",
      message:
        (mensajeRed && mensajeRed.trim()) ||
        "No hay conexión con el servidor. No se puede iniciar sesión hasta recuperar la conexión."
    };
  }
  if (credencialesRechazadasPorApi) {
    return { kind: "error", message: "Correo o contraseña incorrectos." };
  }
  return {
    kind: "error",
    message: "No se pudo iniciar sesión en el servidor. Inténtalo más tarde o revisa correo y contraseña."
  };
}
