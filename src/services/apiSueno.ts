import { getApiBaseUrl } from "../config/apiBaseUrl";
import type { SuenoChatMensaje } from "../pages/SuenoPremiumPage";

export type InterpretarSuenoResultado =
  | { ok: true; mensaje: string }
  | { ok: false; mensaje: string; limite24h?: boolean; restanteMs?: number };

export type ProfundizarResultado = { ok: true; mensaje: string } | { ok: false; mensaje: string };

export const PROFUNDIZAR_ERROR_GENERICO = "No he podido responder en este momento. Puedes intentarlo de nuevo.";

/**
 * Estado del límite "1 sueño gratis cada 24 h". La cookie `maika_sueno` (httpOnly, firmada) viaja
 * con `credentials: "include"`; el backend además anota la IP, así que ni borrar storage ni recargar
 * reinicia el contador.
 */
export async function consultarEstadoSueno(
  signal?: AbortSignal
): Promise<{ restanteMs: number; cooldownMs: number }> {
  const vacio = { restanteMs: 0, cooldownMs: 0 };
  const base = getApiBaseUrl();
  const urls = import.meta.env.DEV
    ? [`${base}/sueno/estado`, "/api/sueno/estado"]
    : [`${base}/sueno/estado`];
  for (const url of urls) {
    try {
      const res = await fetch(url, { credentials: "include", signal });
      if (res.status === 404 && url !== urls[urls.length - 1]) continue;
      const data = await res.json().catch(() => ({}));
      const restante = Number(data?.restanteMs);
      const cooldown = Number(data?.cooldownMs);
      return {
        restanteMs: Number.isFinite(restante) && restante > 0 ? restante : 0,
        cooldownMs: Number.isFinite(cooldown) && cooldown > 0 ? cooldown : 0
      };
    } catch {
      /* probar la siguiente URL */
    }
  }
  return vacio;
}

/** Solo IA vía backend (OpenAI). Sin fallback de texto fijo. */
export async function interpretarSuenoRemoto(
  texto: string,
  signal: AbortSignal
): Promise<InterpretarSuenoResultado> {
  const body = JSON.stringify({ texto });
  /** En dev, primero el backend directo (CORS permitido) evita depender solo del proxy de Vite. */
  const base = getApiBaseUrl();
  const urls = import.meta.env.DEV
    ? [`${base}/sueno/interpretar`, "/api/sueno/interpretar"]
    : [`${base}/sueno/interpretar`];

  let ultimoError = "No pudimos conectar con el servidor de interpretación.";

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body,
        signal
      });
      if (signal.aborted) {
        return {
          ok: false,
          mensaje:
            "La petición se canceló o superó el tiempo de espera. Comprueba la conexión y vuelve a intentarlo."
        };
      }
      const data: { ok?: boolean; mensaje?: string; reason?: string; error?: string; restanteMs?: number } = await res
        .json()
        .catch(() => ({}));

      if (res.ok && data.ok && typeof data.mensaje === "string" && data.mensaje.trim()) {
        return { ok: true, mensaje: data.mensaje.trim() };
      }

      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          mensaje: "Tu sesión ha caducado. Inicia sesión de nuevo desde «Mi cuenta» para continuar."
        };
      }

      if (res.status === 429) {
        if (data.error === "limite_24h" || data.error === "limite_diario") {
          return {
            ok: false,
            limite24h: true,
            restanteMs: Number(data.restanteMs) || 0,
            mensaje: "Ya has utilizado tu interpretación gratuita de hoy."
          };
        }
        return {
          ok: false,
          mensaje: data.error || "Has alcanzado el límite de interpretaciones seguidas. Espera unos minutos y vuelve a intentarlo."
        };
      }
      if (res.status === 503 && data.reason === "no_key") {
        return {
          ok: false,
          mensaje:
            "La interpretación por IA no está activa: el servidor necesita la variable de entorno OPENAI_API_KEY. Configúrala, reinicia el backend y prueba de nuevo."
        };
      }
      if (res.status === 400) {
        return {
          ok: false,
          mensaje: "El texto no es válido para la IA (demasiado largo o vacío). Revisa el relato e inténtalo otra vez."
        };
      }
      if (res.status === 404) {
        ultimoError =
          "404: el backend no reconoce POST /sueno/interpretar (código desactualizado o proceso equivocado). Para el servidor en `backend/`, vuelve a iniciarlo con la versión actual del repo y comprueba que escuche en el puerto 3001.";
      } else if (res.status >= 500 || data.error === "openai" || data.error === "sin_contenido") {
        ultimoError =
          "El servicio de IA devolvió un error. Espera unos segundos y pulsa interpretar otra vez.";
      } else {
        ultimoError = `No se pudo interpretar (código HTTP ${res.status}). Comprueba que el backend esté en marcha en ${base}.`;
      }

      if (import.meta.env.DEV) {
         
        console.warn("[Sueno] interpretar remoto", url, res.status, data);
      }
    } catch (e) {
      if (signal.aborted) {
        return {
          ok: false,
          mensaje:
            "La petición se canceló o superó el tiempo de espera. Comprueba la conexión y vuelve a intentarlo."
        };
      }
      ultimoError =
        "Sin conexión al servidor (¿está el backend en el puerto 3001 y la URL de la API bien configurada?).";
      if (import.meta.env.DEV) {
         
        console.warn("[Sueno] interpretar fetch", url, e);
      }
    }
  }

  return { ok: false, mensaje: ultimoError };
}

/**
 * "Profundizar con Maika": conversación gratuita sobre el sueño ya interpretado, vía POST /sueno/profundizar
 * (sin gate premium, a diferencia de /sueno/seguimiento y /sueno/chat que usa `LecturaProfunda`).
 */
export async function profundizarSuenoRemoto(
  suenoTexto: string,
  emocion: string,
  interpretacionInicial: string,
  historial: SuenoChatMensaje[],
  pregunta: string,
  signal: AbortSignal
): Promise<ProfundizarResultado> {
  const body = JSON.stringify({
    sueno: suenoTexto,
    emocion: emocion.trim() || undefined,
    interpretacionInicial: interpretacionInicial.trim() || undefined,
    historial,
    pregunta
  });
  const base = getApiBaseUrl();
  const urls = import.meta.env.DEV
    ? [`${base}/sueno/profundizar`, "/api/sueno/profundizar"]
    : [`${base}/sueno/profundizar`];

  const ultimo = PROFUNDIZAR_ERROR_GENERICO;

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body,
        signal
      });
      if (signal.aborted) {
        return { ok: false, mensaje: PROFUNDIZAR_ERROR_GENERICO };
      }
      const data: { ok?: boolean; mensaje?: string; reason?: string; error?: string } = await res
        .json()
        .catch(() => ({}));

      if (res.ok && data.ok && typeof data.mensaje === "string" && data.mensaje.trim()) {
        return { ok: true, mensaje: data.mensaje.trim() };
      }
      if (res.status === 503 && data.reason === "no_key") {
        return {
          ok: false,
          mensaje: "La conversación no está disponible: falta configurar la IA en el servidor."
        };
      }

      if (import.meta.env.DEV) {
         
        console.warn("[Sueno] profundizar remoto", url, res.status, data);
      }
    } catch (e) {
      if (signal.aborted) {
        return { ok: false, mensaje: PROFUNDIZAR_ERROR_GENERICO };
      }
      if (import.meta.env.DEV) {
         
        console.warn("[Sueno] profundizar fetch", url, e);
      }
    }
  }

  return { ok: false, mensaje: ultimo };
}
