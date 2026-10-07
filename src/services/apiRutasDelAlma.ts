import { getApiBaseUrl } from "../config/apiBaseUrl";

export type MensajeChatRutas = { role: "user" | "assistant"; content: string };

export type RespuestaChatRutas =
  | { ok: true; mensaje: string; fuentes: string }
  | { ok: false; mensaje: string };

export const ERROR_CHAT_RUTAS =
  "No he podido responder en este momento. Puedes intentarlo de nuevo.";

/** POST /rutas-del-alma/chat — conversación del asistente de conocimiento de Rutas del Alma. */
export async function enviarChatRutasDelAlma(
  mensajes: MensajeChatRutas[],
  signal?: AbortSignal
): Promise<RespuestaChatRutas> {
  const base = getApiBaseUrl();
  const urls = import.meta.env.DEV
    ? ["/api/rutas-del-alma/chat", `${base}/rutas-del-alma/chat`]
    : [`${base}/rutas-del-alma/chat`];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mensajes }),
        signal
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || typeof data?.mensaje !== "string") {
        if (res.status === 404 && url !== urls[urls.length - 1]) continue;
        return { ok: false, mensaje: ERROR_CHAT_RUTAS };
      }
      return {
        ok: true,
        mensaje: data.mensaje,
        fuentes: typeof data.fuentes === "string" ? data.fuentes : ""
      };
    } catch {
      /* probar la siguiente URL */
    }
  }
  return { ok: false, mensaje: ERROR_CHAT_RUTAS };
}
