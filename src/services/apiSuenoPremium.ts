import { getApiBaseUrl } from "../config/apiBaseUrl";
import type { SuenoChatMensaje } from "../pages/SuenoPremiumPage";

export type ContextoLecturaProfunda = {
  texto: string;
  interpretacionBasica: string;
  emocion: string;
  historialAdicional: SuenoChatMensaje[];
};

type OkToken = { ok: true; token: string };
type ErrMsg = { ok: false; mensaje: string };

export type SeguimientoResultado = { ok: true; mensaje: string } | { ok: false; mensaje: string };

export async function solicitarSimularCobroRemoto(signal: AbortSignal): Promise<OkToken | ErrMsg> {
  const base = getApiBaseUrl();
  const urls = import.meta.env.DEV
    ? [`${base}/sueno/premium/simular-cobro`, "/api/sueno/premium/simular-cobro"]
    : [`${base}/sueno/premium/simular-cobro`];

  let ultimo = "No pudimos conectar con el servidor.";

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        signal
      });
      if (signal.aborted) {
        return { ok: false, mensaje: "Petición cancelada o tiempo de espera agotado." };
      }
      const data: { ok?: boolean; desbloqueoToken?: string } = await res.json().catch(() => ({}));
      if (res.ok && data.ok && typeof data.desbloqueoToken === "string" && data.desbloqueoToken.trim()) {
        return { ok: true, token: data.desbloqueoToken.trim() };
      }
      ultimo = `No se pudo iniciar el desbloqueo (HTTP ${res.status}).`;
    } catch {
      if (signal.aborted) {
        return { ok: false, mensaje: "Petición cancelada o tiempo de espera agotado." };
      }
      ultimo = "Sin conexión al servidor. Comprueba que el backend esté en marcha.";
    }
  }

  return { ok: false, mensaje: ultimo };
}

export async function seguimientoSuenoRemoto(
  contexto: ContextoLecturaProfunda,
  desbloqueoToken: string,
  signal: AbortSignal,
  enfasis?: string
): Promise<SeguimientoResultado> {
  const body = JSON.stringify({
    ...contexto,
    desbloqueoToken,
    enfasis: enfasis?.trim() || undefined
  });
  const base = getApiBaseUrl();
  const urls = import.meta.env.DEV
    ? [`${base}/sueno/seguimiento`, "/api/sueno/seguimiento"]
    : [`${base}/sueno/seguimiento`];

  let ultimo = "No pudimos conectar con el servidor.";

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal
      });
      if (signal.aborted) {
        return { ok: false, mensaje: "Petición cancelada o tiempo de espera agotado." };
      }
      const data: { ok?: boolean; mensaje?: string; reason?: string; error?: string } = await res
        .json()
        .catch(() => ({}));

      if (res.ok && data.ok && typeof data.mensaje === "string" && data.mensaje.trim()) {
        return { ok: true, mensaje: data.mensaje.trim() };
      }

      if (res.status === 402) {
        const r = data.reason;
        const m =
          typeof data.mensaje === "string" && data.mensaje.trim() ? data.mensaje.trim() : "";
        if (r === "premium_required") {
          return {
            ok: false,
            mensaje: m || "Primero desbloquea la lectura profunda desde el botón de esta pantalla."
          };
        }
        if (r === "premium_token_invalid") {
          return {
            ok: false,
            mensaje:
              m ||
              "Tu sesión ha caducado o el acceso no es válido. Vuelve a desbloquear la lectura profunda."
          };
        }
        if (r === "premium_seguimiento_ya_usado") {
          return {
            ok: false,
            mensaje: m || "Ya usaste la lectura profunda con este acceso. Desbloquea de nuevo si necesitas otra."
          };
        }
        return { ok: false, mensaje: m || "Acceso no disponible en este momento." };
      }

      if (res.status === 503 && data.reason === "no_key") {
        return {
          ok: false,
          mensaje:
            "La lectura profunda no está activa: el servidor necesita OPENAI_API_KEY. Configúrala y reinicia el backend."
        };
      }
      if (res.status === 400) {
        ultimo = "Los datos enviados no son válidos. Vuelve desde la pantalla de sueños e inténtalo de nuevo.";
      } else if (res.status >= 500 || data.error === "openai" || data.error === "sin_contenido") {
        ultimo = "El servicio de IA devolvió un error. Espera unos segundos y prueba otra vez.";
      } else {
        ultimo = `No se pudo completar la lectura (HTTP ${res.status}).`;
      }
    } catch {
      if (signal.aborted) {
        return { ok: false, mensaje: "Petición cancelada o tiempo de espera agotado." };
      }
      ultimo = "Sin conexión al servidor. Comprueba que el backend esté en marcha.";
    }
  }

  return { ok: false, mensaje: ultimo };
}

export async function solicitarAspectosRemoto(
  contexto: ContextoLecturaProfunda,
  signal: AbortSignal
): Promise<string[]> {
  const base = getApiBaseUrl();
  const urls = import.meta.env.DEV
    ? [`${base}/sueno/aspectos`, "/api/sueno/aspectos"]
    : [`${base}/sueno/aspectos`];
  for (const url of urls) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contexto),
      signal
    });
    if (res.status === 404 && url !== urls[urls.length - 1]) continue;
    const data = await res.json();
    if (!res.ok || data.ok !== true || !Array.isArray(data.aspectos) ||
        data.aspectos.length > 4 || data.aspectos.some((s: unknown) => typeof s !== "string" || !s.trim() || s.length > 180)) {
      throw new Error("No se pudieron preparar los aspectos");
    }
    return data.aspectos;
  }
  throw new Error("No se pudieron preparar los aspectos");
}

export async function suenoChatRemoto(
  historial: SuenoChatMensaje[],
  contextoSueno: ContextoLecturaProfunda,
  desbloqueoToken: string,
  signal: AbortSignal
): Promise<{ ok: true; mensaje: string } | { ok: false; mensaje: string }> {
  const body = JSON.stringify({ historial, contextoSueno });
  const base = getApiBaseUrl();
  const urls = import.meta.env.DEV
    ? [`${base}/sueno/chat`, "/api/sueno/chat"]
    : [`${base}/sueno/chat`];

  let ultimo = "No pudimos conectar con el servidor.";

  for (const url of urls) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (desbloqueoToken.trim()) {
        headers.Authorization = `Bearer ${desbloqueoToken.trim()}`;
      }
      const res = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal
      });
      if (signal.aborted) {
        return { ok: false, mensaje: "Petición cancelada o tiempo de espera agotado." };
      }
      const data: { ok?: boolean; mensaje?: string; reason?: string; error?: string } = await res
        .json()
        .catch(() => ({}));

      if (res.ok && data.ok && typeof data.mensaje === "string" && data.mensaje.trim()) {
        return { ok: true, mensaje: data.mensaje.trim() };
      }

      if (res.status === 402) {
        const m = typeof data.mensaje === "string" && data.mensaje.trim() ? data.mensaje.trim() : "";
        const r = data.reason;
        if (r === "premium_required") {
          return {
            ok: false,
            mensaje: m || "Necesitas desbloquear la lectura profunda para seguir conversando."
          };
        }
        if (r === "premium_token_invalid") {
          return {
            ok: false,
            mensaje:
              m ||
              "Tu sesión ha caducado, vuelve a desbloquear la lectura profunda para continuar el chat."
          };
        }
        if (r === "premium_seguimiento_pendiente") {
          return {
            ok: false,
            mensaje: m || "Primero completa la lectura profunda; después podrás usar el chat con el mismo acceso."
          };
        }
        return {
          ok: false,
          mensaje: m || "No pudimos validar el acceso al chat. Vuelve a intentar o desbloquea de nuevo."
        };
      }
      if (res.status === 503 && data.reason === "no_key") {
        return {
          ok: false,
          mensaje: "La conversación no está disponible: falta configurar la IA en el servidor."
        };
      }
      if (res.status >= 500 || data.error === "openai" || data.error === "sin_contenido") {
        ultimo = "La IA no respondió bien. Prueba otra vez en unos segundos.";
      } else {
        ultimo = `Error al continuar la conversación (HTTP ${res.status}).`;
      }
    } catch {
      if (signal.aborted) {
        return { ok: false, mensaje: "Petición cancelada o tiempo de espera agotado." };
      }
      ultimo = "Sin conexión al servidor.";
    }
  }

  return { ok: false, mensaje: ultimo };
}
