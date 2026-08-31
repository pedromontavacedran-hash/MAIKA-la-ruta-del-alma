import { Router } from "express";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { PREMIUM_JWT_SECRET, premiumSeguimientoOkFile, premiumJtiLegacyUsedFile } from "../lib/env.js";
import { suenoInterpretarLimiter, suenoImagenLimiter } from "../lib/rateLimits.js";

export const suenoRouter = Router();

const SUFIJO_PROMPT_IMAGEN_SUENO =
  " Cinematic composition, spiritual boutique mood MAIKA: deep shadows with warm gold accents, painterly, elegant, PG-13, no gore, no body horror, no text or logos.";

/**
 * Imagen del interpretador de sueños (DALL·E 3). Opcional: sin `OPENAI_API_KEY` el cliente usa placeholder.
 * El prompt final se acota y se añade un sufijo de seguridad en servidor.
 */
suenoRouter.post("/sueno/imagen", suenoImagenLimiter, async (req, res) => {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    res.json({ ok: false, url: null, reason: "no_key" });
    return;
  }
  const raw = String(req.body?.prompt ?? "").trim();
  if (!raw || raw.length > 2_500) {
    res.status(400).json({ ok: false, error: "prompt_invalido" });
    return;
  }
  const prompt = `${raw.slice(0, 1_800)}${SUFIJO_PROMPT_IMAGEN_SUENO}`;
  try {
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard"
      })
    });
    if (!r.ok) {
      const errText = await r.text();
      // eslint-disable-next-line no-console
      console.error("[sueno/imagen] OpenAI", r.status, errText.slice(0, 400));
      res.status(502).json({ ok: false, error: "openai" });
      return;
    }
    const data = await r.json();
    const url = data?.data?.[0]?.url;
    if (!url || typeof url !== "string") {
      res.status(502).json({ ok: false, error: "sin_url" });
      return;
    }
    res.json({ ok: true, url });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[sueno/imagen]", e);
    res.status(502).json({ ok: false, error: "red" });
  }
});

const SUENO_INTERPRETAR_SYSTEM = `Eres un psicólogo clínico con formación en trabajo con sueños (enfoque humanista y jungiano suave, sin esoterismo barato).
El usuario escribe su sueño en español. Respondes SOLO a lo que cuenta: personas, lugares, acciones, sensaciones y giros concretos del relato.

Reglas:
- Cita o alude a elementos reales del sueño (no inventes escenas que no aparecen).
- No des "significados de diccionario" tipo "soñar con X significa Y" para un solo símbolo aislado.
- No predigas el futuro ni hagas augurios. Habla de procesos emocionales, conflictos, deseos o miedos plausibles en lenguaje cotidiano.
- Usa formulaciones tentativas cuando interpretes ("podría resonar con…", "a veces esto se relaciona con…"), sin presentar una única verdad sobre la persona.
- Tono cálido, contenido y claro: escucha más que moraliza. Tres o cuatro párrafos cortos separados por una línea en blanco.
- Escribe en texto plano: sin markdown, sin viñetas con asteriscos, sin títulos con almohadillas.
- Si el relato es muy breve o confuso, dilo con amabilidad y pide un poco más de detalle en una frase, sin sermón.
- Si hubiera riesgo grave (autolesión, violencia inminente), en una frase breve recomienda acudir a emergencias o profesionales; en caso contrario no lo menciones.`;

const SUENO_SEGUIMIENTO_SYSTEM = `Eres un psicólogo clínico con formación en trabajo con sueños (enfoque humanista y jungiano suave).
El usuario ya ha recibido una interpretación inicial. Ahora quieres una lectura más profunda: vínculos entre imágenes del sueño, capas emocionales, posibles tensiones internas y recursos, siempre anclado al relato concreto.

Reglas:
- No repitas literalmente la interpretación inicial; amplía matices y conexiones nuevas.
- Cita o alude a elementos del sueño; no inventes escenas.
- No predicciones ni augurios. Lenguaje tentativo donde interpretes.
- Cinco o seis párrafos cortos, separados por línea en blanco; tono cálido y contenido.
- Texto plano: sin markdown, sin viñetas con asteriscos, sin almohadillas.
- Riesgo grave: una frase breve a emergencias/profesionales solo si aplica; si no, no lo menciones.`;

const SUENO_CHAT_SYSTEM = `Eres un intérprete de sueños con sensibilidad humana y mirada profunda (MAIKA).
No repitas lo ya dicho ni vuelvas sobre los mismos símbolos con la misma frase. Continúa la conversación como si acompañaras a la persona en un proceso personal.
Habla de forma cercana, natural y fluida. El tono debe ser íntimo, calmado y con un matiz espiritual suave, sin exageraciones ni teatralidad.
Evita frases genéricas o demasiado “perfectas”, tono clínico, manual o ensayo. No expliques teorías: conecta con lo que la persona siente o podría estar viviendo.
Responde en 3–5 líneas como máximo, texto plano (sin markdown, sin almohadillas, sin listas con asteriscos). Sin párrafos largos tipo blog; sin “en conclusión” ni cierres académicos.
En silencio, ordena tu respuesta: un eco breve al sueño o a lo que dijo → una conexión emocional o vital tentativa → si aporta valor, una sola pregunta breve que invite a mirar hacia dentro. No fuerces la interpretación: sugiere, no afirmes.
No predicciones ni augurios. Si hubiera riesgo grave, una frase breve a emergencias o profesionales; si no, no lo menciones.
El usuario te envía el hilo bajo el encabezado «Conversación:»; respóndele en continuidad con ese hilo.`;

/**
 * @param {string} raw
 * @returns {{ ok: true, mensaje: string } | { ok: false, error: string }}
 */
function normalizarMensajeOpenAI(raw) {
  if (!raw || typeof raw !== "string") {
    return { ok: false, error: "sin_contenido" };
  }
  let mensaje = raw
    .replace(/\r\n/g, "\n")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
  if (mensaje.length > 5_500) {
    mensaje = `${mensaje.slice(0, 5_497)}...`;
  }
  if (!mensaje) {
    return { ok: false, error: "vacio" };
  }
  return { ok: true, mensaje };
}

/**
 * Texto del sueño (interpretar/seguimiento/chat, no la imagen): DeepSeek si hay `DEEPSEEK_API_KEY`,
 * si no cae a OpenAI. Misma forma de API (chat completions), solo cambian URL, modelo y clave.
 * @returns {{ apiKey: string, baseUrl: string, model: string, provider: "deepseek" | "openai" } | null}
 */
function resolveSuenoTextProvider() {
  const deepseekKey = String(process.env.DEEPSEEK_API_KEY || "").trim();
  if (deepseekKey) {
    return {
      apiKey: deepseekKey,
      baseUrl: "https://api.deepseek.com/chat/completions",
      model: "deepseek-chat",
      provider: "deepseek"
    };
  }
  const openaiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (openaiKey) {
    return {
      apiKey: openaiKey,
      baseUrl: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4o-mini",
      provider: "openai"
    };
  }
  return null;
}

/**
 * @param {{ apiKey: string, baseUrl: string, model: string, provider: string }} textProvider
 * @param {Array<{ role: string, content: string }>} messages
 * @param {string} logLabel
 * @param {{ temperature?: number, max_tokens?: number }} [opts]
 * @returns {Promise<{ ok: true, mensaje: string } | { ok: false, error: string }>}
 */
async function fetchOpenAiSuenoChat(textProvider, messages, logLabel, opts = {}) {
  const temperature = typeof opts.temperature === "number" ? opts.temperature : 0.62;
  const max_tokens = typeof opts.max_tokens === "number" ? opts.max_tokens : 720;
  const r = await fetch(textProvider.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${textProvider.apiKey}`
    },
    body: JSON.stringify({
      model: textProvider.model,
      temperature,
      max_tokens,
      messages
    })
  });
  if (!r.ok) {
    const errText = await r.text();
    // eslint-disable-next-line no-console
    console.error(`[${logLabel}] ${textProvider.provider}`, r.status, errText.slice(0, 400));
    return { ok: false, error: textProvider.provider };
  }
  const data = await r.json();
  const raw = data?.choices?.[0]?.message?.content;
  return normalizarMensajeOpenAI(raw);
}

/**
 * @param {{ apiKey: string, baseUrl: string, model: string, provider: string }} textProvider
 * @param {string} texto
 * @returns {Promise<{ ok: true, mensaje: string } | { ok: false, error: string }>}
 */
async function interpretarSuenoOpenAI(textProvider, texto) {
  return fetchOpenAiSuenoChat(
    textProvider,
    [
      { role: "system", content: SUENO_INTERPRETAR_SYSTEM },
      {
        role: "user",
        content: `Relato del sueño (tal como lo escribí):\n\n${texto.slice(0, 12_000)}`
      }
    ],
    "sueno/interpretar",
    { temperature: 0.62, max_tokens: 720 }
  );
}

/**
 * @param {{ apiKey: string, baseUrl: string, model: string, provider: string }} textProvider
 * @param {string} texto
 * @param {string} interpretacionBasica
 */
async function interpretarSuenoSeguimientoOpenAI(textProvider, texto, interpretacionBasica) {
  const base = `Relato del sueño:\n\n${texto.slice(0, 8000)}`;
  const extra = interpretacionBasica.trim()
    ? `\n\nInterpretación inicial que el usuario ya ha leído (contexto; no la repitas ni resumas otra vez):\n\n${interpretacionBasica.trim().slice(0, 6000)}`
    : "";
  return fetchOpenAiSuenoChat(
    textProvider,
    [
      { role: "system", content: SUENO_SEGUIMIENTO_SYSTEM },
      {
        role: "user",
        content: `${base}${extra}\n\nOfrece ahora una lectura más profunda y personalizada, con nuevos ángulos respecto a la primera interpretación.`
      }
    ],
    "sueno/seguimiento",
    { temperature: 0.68, max_tokens: 960 }
  );
}

/**
 * Texto de interpretación del sueño (chat). Requiere DEEPSEEK_API_KEY u OPENAI_API_KEY (ver
 * `resolveSuenoTextProvider`); si no hay ninguna, el cliente puede usar fallback local.
 * Prueba rápida en navegador: GET /sueno/interpretar?texto=cachorros (misma lógica que POST).
 */
suenoRouter.get("/sueno/interpretar", suenoInterpretarLimiter, async (req, res) => {
  const textProvider = resolveSuenoTextProvider();
  if (!textProvider) {
    res.status(503).json({ ok: false, reason: "no_key" });
    return;
  }
  const texto = String(req.query?.texto ?? "").trim();
  if (!texto || texto.length > 12_000) {
    res.status(400).json({
      ok: false,
      error: "texto_invalido",
      hint: "Añade ?texto=tu relato, por ejemplo: /sueno/interpretar?texto=cachorros"
    });
    return;
  }
  try {
    const out = await interpretarSuenoOpenAI(textProvider, texto);
    if (!out.ok) {
      res.status(502).json(out);
      return;
    }
    res.json(out);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[sueno/interpretar GET]", e);
    res.status(502).json({ ok: false, error: "red" });
  }
});

suenoRouter.post("/sueno/interpretar", suenoInterpretarLimiter, async (req, res) => {
  const textProvider = resolveSuenoTextProvider();
  if (!textProvider) {
    res.status(503).json({ ok: false, reason: "no_key" });
    return;
  }
  const texto = String(req.body?.texto ?? "").trim();
  if (!texto || texto.length > 12_000) {
    res.status(400).json({ ok: false, error: "texto_invalido" });
    return;
  }
  try {
    const out = await interpretarSuenoOpenAI(textProvider, texto);
    if (!out.ok) {
      res.status(502).json(out);
      return;
    }
    res.json(out);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[sueno/interpretar]", e);
    res.status(502).json({ ok: false, error: "red" });
  }
});

/** Gate de lectura profunda: el front pide token aquí (checkout real sustituirá el “simulado”). */
const PREMIUM_SKIP_GATE = process.env.MAIKA_PREMIUM_SKIP_GATE === "1";
/** `jti` con lectura profunda ya generada con éxito (mismo JWT sirve para el chat hasta que caduque). */
const premiumSeguimientoOkJtis = new Set();
const MAX_PREMIUM_JTI_PERSIST = 4000;
let premiumSeguimientoJtisLoaded = false;

function loadPremiumSeguimientoOkSync() {
  premiumSeguimientoOkJtis.clear();
  try {
    if (existsSync(premiumSeguimientoOkFile)) {
      const arr = JSON.parse(readFileSync(premiumSeguimientoOkFile, "utf8"));
      if (Array.isArray(arr)) {
        for (const id of arr) {
          if (typeof id === "string" && id.length > 0) premiumSeguimientoOkJtis.add(id);
        }
      }
    }
  } catch {
    /* ignorar */
  }
  try {
    if (existsSync(premiumJtiLegacyUsedFile)) {
      const arr = JSON.parse(readFileSync(premiumJtiLegacyUsedFile, "utf8"));
      if (Array.isArray(arr)) {
        for (const id of arr) {
          if (typeof id === "string" && id.length > 0) premiumSeguimientoOkJtis.add(id);
        }
      }
    }
  } catch {
    /* ignorar */
  }
}

function persistPremiumSeguimientoOkSync() {
  try {
    const arr = [...premiumSeguimientoOkJtis].slice(-MAX_PREMIUM_JTI_PERSIST);
    writeFileSync(premiumSeguimientoOkFile, JSON.stringify(arr), "utf8");
  } catch (e) {
    if (process.env.MAIKA_QUIET !== "1") {
      // eslint-disable-next-line no-console
      console.error("[maika-backend] premium seguimiento jti persist", e);
    }
  }
}

function ensurePremiumSeguimientoJtisLoaded() {
  if (premiumSeguimientoJtisLoaded) return;
  loadPremiumSeguimientoOkSync();
  premiumSeguimientoJtisLoaded = true;
}

function crearTokenPremiumDesbloqueo() {
  ensurePremiumSeguimientoJtisLoaded();
  const jti = crypto.randomUUID();
  return jwt.sign({ typ: "sueno-premium", jti }, PREMIUM_JWT_SECRET, { expiresIn: "25m" });
}

/**
 * Para POST /sueno/seguimiento: JWT válido y aún sin lectura profunda registrada para ese `jti`
 * (no consume el token si la IA falla).
 * @returns {{ jti: string } | { error: "missing"|"invalid"|"ya_seguimiento" }}
 */
function verificarTokenPremiumParaSeguimiento(tokenStr) {
  ensurePremiumSeguimientoJtisLoaded();
  if (!tokenStr) return { error: "missing" };
  try {
    const payload = jwt.verify(tokenStr, PREMIUM_JWT_SECRET);
    if (payload.typ !== "sueno-premium" || typeof payload.jti !== "string") return { error: "invalid" };
    if (premiumSeguimientoOkJtis.has(payload.jti)) return { error: "ya_seguimiento" };
    return { jti: payload.jti };
  } catch {
    return { error: "invalid" };
  }
}

function marcarSeguimientoProfundoOk(jti) {
  premiumSeguimientoOkJtis.add(jti);
  persistPremiumSeguimientoOkSync();
}

/**
 * @param {unknown[]} historial
 * @returns {string}
 */
function construirMensajeUsuarioChatCompacto(historial) {
  const ultimos = Array.isArray(historial) ? historial.slice(-6) : [];
  const lineas = ultimos
    .map((m) => {
      const t = String(m?.texto ?? "").trim().slice(0, 1200);
      if (!t) return null;
      return `${m?.rol === "user" ? "Usuario" : "IA"}: ${t}`;
    })
    .filter(Boolean);
  const contexto = lineas.join("\n");
  return `Conversación:\n${contexto}`;
}

/**
 * @param {unknown[]} historial
 * @returns {Array<{ role: string, content: string }>}
 */
function historialSuenoPremiumToMessagesCompacto(historial) {
  const userContent = construirMensajeUsuarioChatCompacto(historial);
  return [
    { role: "system", content: SUENO_CHAT_SYSTEM },
    { role: "user", content: userContent }
  ];
}

function bearerTokenDesdeReq(req) {
  const auth = String(req.headers.authorization || "");
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : "";
}

/** Misma verificación de JWT premium que /sueno/seguimiento; exige lectura profunda ya hecha para este `jti`. */
function requirePremiumDesbloqueoParaChat(req, res, next) {
  if (PREMIUM_SKIP_GATE) {
    req.premiumChatSkip = true;
    next();
    return;
  }
  const token = bearerTokenDesdeReq(req);
  if (!token) {
    res.status(402).json({
      ok: false,
      reason: "premium_required",
      mensaje: "Necesitas el acceso de lectura profunda. Desbloquea desde la pantalla premium y vuelve a intentar."
    });
    return;
  }
  ensurePremiumSeguimientoJtisLoaded();
  let payload;
  try {
    payload = jwt.verify(token, PREMIUM_JWT_SECRET);
  } catch {
    res.status(402).json({
      ok: false,
      reason: "premium_token_invalid",
      mensaje: "Tu sesión ha caducado o el acceso no es válido. Vuelve a desbloquear la lectura profunda."
    });
    return;
  }
  if (payload.typ !== "sueno-premium" || typeof payload.jti !== "string") {
    res.status(402).json({
      ok: false,
      reason: "premium_token_invalid",
      mensaje: "Tu sesión ha caducado o el acceso no es válido. Vuelve a desbloquear la lectura profunda."
    });
    return;
  }
  if (!premiumSeguimientoOkJtis.has(payload.jti)) {
    res.status(402).json({
      ok: false,
      reason: "premium_seguimiento_pendiente",
      mensaje: "Primero obtén la lectura profunda; después podrás seguir la conversación con el mismo acceso."
    });
    return;
  }
  req.premiumJti = payload.jti;
  next();
}

/** Sin límite, este endpoint podía usarse para acuñar tokens de desbloqueo premium sin fin (cada uno habilita /sueno/seguimiento y /sueno/chat, con coste real de OpenAI). */
suenoRouter.post("/sueno/premium/simular-cobro", suenoInterpretarLimiter, (_req, res) => {
  const desbloqueoToken = crearTokenPremiumDesbloqueo();
  res.json({ ok: true, desbloqueoToken, modo: "simulado" });
});

suenoRouter.get("/sueno/premium/estado", (_req, res) => {
  res.json({
    ok: true,
    lecturaProfundaRequiereToken: !PREMIUM_SKIP_GATE
  });
});

/** Lectura profunda tras la interpretación inicial. Body: { texto, interpretacionBasica?, desbloqueoToken } */
suenoRouter.post("/sueno/seguimiento", async (req, res) => {
  const textProvider = resolveSuenoTextProvider();
  if (!textProvider) {
    res.status(503).json({ ok: false, reason: "no_key" });
    return;
  }
  let premiumJti = null;
  if (!PREMIUM_SKIP_GATE) {
    const token = String(req.body?.desbloqueoToken ?? "").trim();
    const vr = verificarTokenPremiumParaSeguimiento(token);
    if (vr.error === "missing") {
      res.status(402).json({
        ok: false,
        reason: "premium_required",
        mensaje:
          "Accede primero a la lectura profunda desde el botón de desbloqueo (después irá enlazado a tu pago)."
      });
      return;
    }
    if (vr.error === "invalid") {
      res.status(402).json({
        ok: false,
        reason: "premium_token_invalid",
        mensaje:
          "Tu sesión ha caducado o el acceso no es válido. Vuelve a desbloquear la lectura profunda desde esta pantalla."
      });
      return;
    }
    if (vr.error === "ya_seguimiento") {
      res.status(402).json({
        ok: false,
        reason: "premium_seguimiento_ya_usado",
        mensaje: "Ya obtuviste la lectura profunda con este acceso. Usa el chat de abajo o solicita un nuevo desbloqueo."
      });
      return;
    }
    premiumJti = vr.jti;
  }
  const texto = String(req.body?.texto ?? "").trim();
  const interpretacionBasica = String(req.body?.interpretacionBasica ?? "").trim();
  if (!texto || texto.length > 12_000) {
    res.status(400).json({ ok: false, error: "texto_invalido" });
    return;
  }
  if (interpretacionBasica.length > 8_000) {
    res.status(400).json({ ok: false, error: "interpretacion_invalida" });
    return;
  }
  try {
    const out = await interpretarSuenoSeguimientoOpenAI(textProvider, texto, interpretacionBasica);
    if (!out.ok) {
      res.status(502).json(out);
      return;
    }
    if (premiumJti) {
      marcarSeguimientoProfundoOk(premiumJti);
    }
    res.json(out);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[sueno/seguimiento]", e);
    res.status(502).json({ ok: false, error: "red" });
  }
});

/**
 * Conversación guiada tras la lectura profunda.
 * Header: `Authorization: Bearer <desbloqueoToken>` (mismo JWT que /sueno/seguimiento).
 * Body: { historial: { rol, texto }[] }
 */
suenoRouter.post("/sueno/chat", requirePremiumDesbloqueoParaChat, async (req, res) => {
  const textProvider = resolveSuenoTextProvider();
  if (!textProvider) {
    res.status(503).json({ ok: false, reason: "no_key" });
    return;
  }
  const historial = req.body?.historial;
  if (!Array.isArray(historial) || historial.length < 2) {
    res.status(400).json({ ok: false, error: "historial_invalido" });
    return;
  }
  const last = historial[historial.length - 1];
  if (last?.rol !== "user") {
    res.status(400).json({ ok: false, error: "ultimo_turno_usuario" });
    return;
  }
  const messages = historialSuenoPremiumToMessagesCompacto(historial);
  if (messages.length !== 2 || !String(messages[1]?.content ?? "").trim()) {
    res.status(400).json({ ok: false, error: "historial_incompleto" });
    return;
  }
  try {
    const out = await fetchOpenAiSuenoChat(textProvider, messages, "sueno/chat", {
      temperature: 0.76,
      max_tokens: 220
    });
    if (!out.ok) {
      res.status(502).json(out);
      return;
    }
    res.json({ ok: true, mensaje: out.mensaje });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[sueno/chat]", e);
    res.status(502).json({ ok: false, error: "red" });
  }
});
