import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import request from "supertest";

const backendDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repoRoot = path.dirname(backendDir);

/**
 * Las experiencias /sueno/* y /horoscopo/* exigen sesión de cliente (`maika_session`, cookie httpOnly
 * con JWT verificado contra `usuarios.json`). En tests se crean dos usuarios de prueba y se firman
 * sus sesiones con el `JWT_SECRET` fijado en `setup-backend-env.js`.
 */
let sessionCookieA = "";
let sessionCookieB = "";

async function asegurarSesiones() {
  if (sessionCookieA) return;
  const { readUsuarios, writeUsuarios } = await import("../lib/storage.js");
  const usuarios = await readUsuarios();
  const nuevos = [...usuarios];
  for (const [id, email] of [["sueno-test-a", "a@test.local"], ["sueno-test-b", "b@test.local"]]) {
    if (!nuevos.some((u) => String(u?.id) === id)) {
      nuevos.push({ id, email, tokenVersion: 0, verificado: true });
    }
  }
  await writeUsuarios(nuevos);
  sessionCookieA = `maika_session=${jwt.sign(
    { id: "sueno-test-a", email: "a@test.local", tokenVersion: 0 },
    process.env.JWT_SECRET
  )}`;
  sessionCookieB = `maika_session=${jwt.sign(
    { id: "sueno-test-b", email: "b@test.local", tokenVersion: 0 },
    process.env.JWT_SECRET
  )}`;
}

/** `request` con la cookie de sesión aplicada (por defecto el usuario A). */
function rq(app, cookie = sessionCookieA) {
  const agent = request.agent(app);
  agent.set("Cookie", cookie);
  return agent;
}

describe.sequential("Endpoints de desarrollo quedan deshabilitados en producción", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.resetModules();
  });

  it("POST /sueno/premium/simular-cobro -> 404 en producción (no se puede desbloquear premium gratis)", async () => {
    process.env.NODE_ENV = "production";
    vi.resetModules();
    const { app } = await import("../app.js");
    await asegurarSesiones();
    const res = await rq(app).post("/sueno/premium/simular-cobro");
    expect(res.status).toBe(404);
  });

  it("POST /sueno/premium/simular-cobro sigue funcionando fuera de producción", async () => {
    process.env.NODE_ENV = "test";
    vi.resetModules();
    const { app } = await import("../app.js");
    await asegurarSesiones();
    const res = await rq(app).post("/sueno/premium/simular-cobro");
    expect(res.status).toBe(200);
    expect(res.body.modo).toBe("simulado");
    expect(typeof res.body.desbloqueoToken).toBe("string");
  });
});

describe.sequential("Pregunta adicional: contexto útil sin instrucciones comerciales", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("envía el detalle del usuario y pide una respuesta completa con matices pendientes, sin venta", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-sueno-provider-key");
    const mensaje = "La compañía de los perros podría relacionarse con cómo vivías ese encuentro.";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: mensaje } }] })
    });
    vi.stubGlobal("fetch", fetchMock);
    const { app } = await import("../app.js");
    await asegurarSesiones();
    const res = await rq(app).post("/sueno/profundizar").send({
      sueno: "Estaba rodeada de perros en un jardín.",
      emocion: "Tranquilidad",
      interpretacionInicial: "La compañía podría sugerir vínculos afectivos.",
      historial: [],
      pregunta: "Eran muchos perros y se acercaban a mí. ¿Qué añade ese detalle?"
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, mensaje });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    const instrucciones = payload.messages[0].content;
    expect(instrucciones).toContain("Responde de manera completa, útil y coherente");
    expect(instrucciones).toContain("No reduzcas artificialmente la calidad");
    expect(instrucciones).toContain("Al finalizar, menciona de forma natural");
    expect(instrucciones).toContain("No menciones pagos, precios, límites ni productos");
    expect(instrucciones).toContain("La transición comercial corresponde exclusivamente a la interfaz");
    expect(payload.messages[1].content).toContain("Estaba rodeada de perros en un jardín.");
    expect(payload.messages[1].content).toContain("Tranquilidad");
    expect(payload.messages[1].content).toContain("Eran muchos perros y se acercaban a mí.");
    expect(payload.max_tokens).toBeGreaterThanOrEqual(600);
  });
});

describe.sequential("Continuidad del sueño desde la consulta gratuita hasta premium", () => {
  let fetchMock;
  const providerResponse = (content) => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content } }] })
  });
  const historialPremium = [
    { rol: "ai", texto: "Podemos continuar explorando este encuentro." },
    { rol: "user", texto: "Quiero seguir mirando cómo me sentía." }
  ];

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("MAIKA_PREMIUM_SKIP_GATE", "0");
    vi.stubEnv("DEEPSEEK_API_KEY", "test-sueno-provider-key");
    vi.stubEnv("OPENAI_API_KEY", " ");
    vi.stubEnv("SMTP_HOST", " ");
    vi.stubEnv("SMTP_USER", " ");
    vi.stubEnv("SMTP_PASS", " ");
    fetchMock = vi.fn().mockResolvedValue(providerResponse("Respuesta premium de prueba."));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("conserva sueño, interpretación, emoción y ambos turnos gratuitos en aspectos, seguimiento y chat largo", async () => {
    const inicial = "La compañía podría sugerir vínculos afectivos. ¿Cuántos perros había?";
    const respuestaGratis = "Que fueran muchos podría añadir una sensación de compañía intensa, sin perder la ternura de su tamaño.";
    const aspectos = ["La ternura de los perros pequeños y la intensidad de estar rodeada de muchos"];
    fetchMock
      .mockResolvedValueOnce(providerResponse(inicial))
      .mockResolvedValueOnce(providerResponse(respuestaGratis))
      .mockResolvedValueOnce(providerResponse(JSON.stringify(aspectos)));
    const { app } = await import("../app.js");
    await asegurarSesiones();
    const texto = "Estaba rodeada de perros pequeños en un jardín.";
    const emocion = "Tranquilidad y sorpresa";
    const pregunta = "Eran muchos y se acercaban a mí. ¿Qué añade ese detalle?";
    const interpretacion = await rq(app).post("/sueno/interpretar").send({ texto });
    expect(interpretacion.status).toBe(200);
    const gratis = await rq(app).post("/sueno/profundizar").send({
      sueno: texto, emocion, interpretacionInicial: interpretacion.body.mensaje, pregunta
    });
    expect(gratis.status).toBe(200);
    const contextoSueno = {
      texto, emocion, interpretacionBasica: interpretacion.body.mensaje,
      historialAdicional: [{ rol: "user", texto: pregunta }, { rol: "ai", texto: gratis.body.mensaje }]
    };
    const sugerencias = await rq(app).post("/sueno/aspectos").send(contextoSueno);
    expect(sugerencias.status).toBe(200);
    expect(sugerencias.body).toEqual({ ok: true, aspectos });
    const desbloqueo = await rq(app).post("/sueno/premium/simular-cobro");
    expect(desbloqueo.status).toBe(200);
    expect(desbloqueo.body.modo).toBe("simulado");
    const token = desbloqueo.body.desbloqueoToken;
    const pendiente = await rq(app).post("/sueno/chat").auth(token, { type: "bearer" }).send({
      contextoSueno, historial: historialPremium
    });
    expect(pendiente.status).toBe(402);
    expect(pendiente.body.reason).toBe("premium_seguimiento_pendiente");
    const seguimiento = await rq(app).post("/sueno/seguimiento").send({
      ...contextoSueno, desbloqueoToken: token, enfasis: aspectos[0]
    });
    expect(seguimiento.status).toBe(200);
    const historial = [
      { rol: "user", texto: "TURNO_PREMIUM_ANTIGUO_DESCARTADO" },
      { rol: "ai", texto: "RESPUESTA_PREMIUM_ANTIGUA_DESCARTADA" },
      ...historialPremium, ...historialPremium, ...historialPremium
    ];
    const chat = await rq(app).post("/sueno/chat").auth(token, { type: "bearer" }).send({ contextoSueno, historial });
    expect(chat.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(5);
    for (const index of [2, 3, 4]) {
      const [url, options] = fetchMock.mock.calls[index];
      expect(url).toBe("https://api.deepseek.com/chat/completions");
      const payload = JSON.parse(options.body);
      expect(payload.model).toBe("deepseek-chat");
      expect(payload.messages[1].content).toContain("perros pequeños");
      expect(payload.messages[1].content).toContain("muchos");
      expect(payload.messages[1].content).toContain(inicial);
      expect(payload.messages[1].content).toContain(pregunta);
      expect(payload.messages[1].content).toContain(respuestaGratis);
      expect(payload.messages[1].content).toContain(emocion);
    }
    const aspectosSystem = JSON.parse(fetchMock.mock.calls[2][1].body).messages[0].content;
    expect(aspectosSystem).toContain("SOLO un array JSON");
    expect(aspectosSystem).toContain("No recicles las preguntas iniciales");
    const seguimientoPayload = JSON.parse(fetchMock.mock.calls[3][1].body);
    expect(seguimientoPayload.messages[1].content).toContain("aspecto de toda la conversación");
    expect(seguimientoPayload.messages[1].content).toContain(aspectos[0]);
    expect(seguimientoPayload.messages[0].content).toContain("detalles y correcciones más recientes");
    const chatContent = JSON.parse(fetchMock.mock.calls[4][1].body).messages[1].content;
    expect(chatContent).toContain("Conversación:");
    expect(chatContent).not.toContain("PREMIUM_ANTIGUO");
    expect(chatContent).not.toContain("PREMIUM_ANTIGUA");
    const repetido = await rq(app).post("/sueno/seguimiento").send({ ...contextoSueno, desbloqueoToken: token });
    expect(repetido.status).toBe(402);
    expect(repetido.body.reason).toBe("premium_seguimiento_ya_usado");
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("no recorta el final del contexto válido en sus límites", async () => {
    const contextoSueno = {
      texto: "perros pequeños al final".padStart(12_000, "s"),
      interpretacionBasica: "lectura al final".padStart(8_000, "i"),
      emocion: "e".repeat(300),
      historialAdicional: [
        { rol: "user", texto: "muchos".padStart(500, "u") },
        { rol: "ai", texto: "respuesta gratis al final".padStart(5_500, "a") }
      ]
    };
    const { app } = await import("../app.js");
    await asegurarSesiones();
    fetchMock.mockResolvedValueOnce(providerResponse("[]"));
    expect((await rq(app).post("/sueno/aspectos").send(contextoSueno)).status).toBe(200);
    const desbloqueo = await rq(app).post("/sueno/premium/simular-cobro");
    const token = desbloqueo.body.desbloqueoToken;
    expect((await rq(app).post("/sueno/seguimiento").send({ ...contextoSueno, desbloqueoToken: token })).status).toBe(200);
    expect((await rq(app).post("/sueno/chat").auth(token, { type: "bearer" }).send({ contextoSueno, historial: historialPremium })).status).toBe(200);
    for (const [, options] of fetchMock.mock.calls) {
      const content = JSON.parse(options.body).messages[1].content;
      for (const texto of [contextoSueno.texto, contextoSueno.interpretacionBasica, contextoSueno.emocion, ...contextoSueno.historialAdicional.map((m) => m.texto)]) {
        expect(content).toContain(texto);
      }
    }
  });

  it("mantiene compatibles los contextos omitidos y permite aspectos vacíos", async () => {
    const { app } = await import("../app.js");
    await asegurarSesiones();
    fetchMock.mockResolvedValueOnce(providerResponse("[]"));
    const aspectos = await rq(app).post("/sueno/aspectos").send({ texto: "Soñé con perros pequeños." });
    expect(aspectos.body).toEqual({ ok: true, aspectos: [] });
    const desbloqueo = await rq(app).post("/sueno/premium/simular-cobro");
    const token = desbloqueo.body.desbloqueoToken;
    const seguimiento = await rq(app).post("/sueno/seguimiento").send({ texto: "Soñé con perros pequeños.", desbloqueoToken: token });
    expect(seguimiento.status).toBe(200);
    const chat = await rq(app).post("/sueno/chat").auth(token, { type: "bearer" }).send({ historial: historialPremium });
    expect(chat.status).toBe(200);
    const payload = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(payload.messages[1].content).toMatch(/^Conversación:/);
  });

  it.each([
    ["texto no string", { texto: 42 }],
    ["texto vacío", { texto: " " }],
    ["texto demasiado largo", { texto: "s".repeat(12_001) }],
    ["interpretación no string", { interpretacionBasica: {} }],
    ["interpretación nula", { interpretacionBasica: null }],
    ["interpretación demasiado larga", { interpretacionBasica: "i".repeat(8_001) }],
    ["emoción no string", { emocion: false }],
    ["emoción demasiado larga", { emocion: "e".repeat(301) }],
    ["historial no array", { historialAdicional: "user" }],
    ["historial nulo", { historialAdicional: null }],
    ["más de dos turnos", { historialAdicional: Array(3).fill({ rol: "user", texto: "muchos" }) }],
    ["turno nulo", { historialAdicional: [null] }],
    ["rol no permitido", { historialAdicional: [{ rol: "system", texto: "instrucciones" }] }],
    ["rol assistant no permitido", { historialAdicional: [{ rol: "assistant", texto: "respuesta" }] }],
    ["texto de turno no string", { historialAdicional: [{ rol: "user", texto: 42 }] }],
    ["texto de turno vacío", { historialAdicional: [{ rol: "ai", texto: " " }] }],
    ["pregunta demasiado larga", { historialAdicional: [{ rol: "user", texto: "u".repeat(501) }] }],
    ["respuesta demasiado larga", { historialAdicional: [{ rol: "ai", texto: "a".repeat(5_501) }] }]
  ])("rechaza %s antes de llamar al proveedor y sin consumir el token", async (_nombre, invalido) => {
    const { app } = await import("../app.js");
    await asegurarSesiones();
    const contextoSueno = { texto: "Soñé con perros pequeños.", ...invalido };
    const desbloqueo = await rq(app).post("/sueno/premium/simular-cobro");
    const token = desbloqueo.body.desbloqueoToken;
    const aspectos = await rq(app).post("/sueno/aspectos").send(contextoSueno);
    expect(aspectos.status).toBe(400);
    const seguimiento = await rq(app).post("/sueno/seguimiento").send({ ...contextoSueno, desbloqueoToken: token });
    expect(seguimiento.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    const valido = await rq(app).post("/sueno/seguimiento").send({ texto: "Soñé con perros pequeños.", desbloqueoToken: token });
    expect(valido.status).toBe(200);
    const chat = await rq(app).post("/sueno/chat").auth(token, { type: "bearer" }).send({ contextoSueno, historial: historialPremium });
    expect(chat.status).toBe(400);
    expect(chat.body).toEqual({ ok: false, error: "contexto_invalido" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([[null], [[]], ["sueño"]])("rechaza contextoSueno no objeto: %j", async (contextoSueno) => {
    const { app } = await import("../app.js");
    await asegurarSesiones();
    const desbloqueo = await rq(app).post("/sueno/premium/simular-cobro");
    const token = desbloqueo.body.desbloqueoToken;
    expect((await rq(app).post("/sueno/seguimiento").send({ texto: "Sueño", desbloqueoToken: token })).status).toBe(200);
    const chat = await rq(app).post("/sueno/chat").auth(token, { type: "bearer" }).send({ contextoSueno, historial: historialPremium });
    expect(chat.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    "no es JSON", "```json\n[]\n```", "{}", "null", '[""]', '["  "]', "[42]",
    JSON.stringify(Array(5).fill("Aspecto")), JSON.stringify(["a".repeat(181)])
  ])("rechaza aspectos malformados del proveedor: %s", async (content) => {
    fetchMock.mockResolvedValueOnce(providerResponse(content));
    const { app } = await import("../app.js");
    await asegurarSesiones();
    const res = await rq(app).post("/sueno/aspectos").send({ texto: "Soñé con perros pequeños." });
    expect(res.status).toBe(502);
    expect(res.body).toEqual({ ok: false, error: "aspectos_no_disponibles" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("admite cuatro aspectos de 180 caracteres y usa OpenAI si DeepSeek no está configurado", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", " ");
    vi.stubEnv("OPENAI_API_KEY", "test-openai-provider-key");
    const aspectos = Array.from({ length: 4 }, (_, i) => `${i}${"a".repeat(179)}`);
    fetchMock.mockResolvedValueOnce(providerResponse(JSON.stringify(aspectos)));
    const { app } = await import("../app.js");
    await asegurarSesiones();
    const res = await rq(app).post("/sueno/aspectos").send({ texto: "Sueño" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, aspectos });
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.openai.com/v1/chat/completions");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).model).toBe("gpt-4o-mini");
  });

  it("falla genéricamente sin reintentos ni exponer errores del proveedor", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 401, text: async () => "PRIVATE_PROVIDER_ERROR" })
      .mockRejectedValueOnce(new Error("PRIVATE_PROVIDER_ERROR"));
    const { app } = await import("../app.js");
    await asegurarSesiones();
    for (let i = 0; i < 2; i += 1) {
      const res = await rq(app).post("/sueno/aspectos").send({ texto: "Sueño" });
      expect(res.status).toBe(502);
      expect(res.body).toEqual({ ok: false, error: "aspectos_no_disponibles" });
    }
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.stubEnv("DEEPSEEK_API_KEY", " ");
    const sinProveedor = await rq(app).post("/sueno/aspectos").send({ texto: "Sueño" });
    expect(sinProveedor.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe.sequential("Límite de una interpretación gratuita por día natural (Europe/Madrid)", () => {
  let fetchMock;
  const providerResponse = (content) => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content } }] })
  });

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DEEPSEEK_API_KEY", "test-sueno-provider-key");
    vi.stubEnv("OPENAI_API_KEY", " ");
    vi.stubEnv("SUENO_GRATUITO_COOLDOWN_MS", "60000");
    fetchMock = vi.fn().mockResolvedValue(providerResponse("Interpretación de prueba."));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("bloquea la segunda interpretación del mismo usuario y libera a otro usuario", async () => {
    const { app } = await import("../app.js");
    await asegurarSesiones();
    const primera = await rq(app).post("/sueno/interpretar").send({ texto: "Soñé con perros pequeños." });
    expect(primera.status).toBe(200);
    // Misma cuenta: el límite sigue aunque se "borre" cualquier storage local (la sesión es la misma).
    const segunda = await rq(app).post("/sueno/interpretar").send({ texto: "Otro sueño distinto." });
    expect(segunda.status).toBe(429);
    expect(segunda.body.error).toBe("limite_diario");
    expect(segunda.body.restanteMs).toBeGreaterThan(0);
    const estado = await rq(app).get("/sueno/estado");
    expect(estado.status).toBe(200);
    expect(estado.body.restanteMs).toBeGreaterThan(0);
    // Otro usuario tiene su propio contador.
    const otroUsuario = await rq(app, sessionCookieB).post("/sueno/interpretar").send({ texto: "Soñé con el mar." });
    expect(otroUsuario.status).toBe(200);
    // La pregunta adicional gratuita del mismo flujo no queda bloqueada por el límite.
    const gratis = await rq(app).post("/sueno/profundizar").send({
      sueno: "Soñé con perros pequeños.",
      pregunta: "Eran muchos, ¿qué añade ese detalle?"
    });
    expect(gratis.status).toBe(200);
    // 3 llamadas al proveedor: interpretar A, interpretar B y la pregunta gratuita (la 2.ª de A no llegó).
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("el uso se libera al cambiar de día natural Europe/Madrid (registro de ayer no bloquea hoy)", async () => {
    // Si el último uso fue ayer (fecha Madrid), hoy debe poder interpretarse de nuevo.
    const { suenoUsoGratuitoFile } = await import("../lib/env.js");
    const ayerMadrid = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(
      new Date(Date.now() - 26 * 3600 * 1000)
    );
    const hoyMadrid = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
    expect(ayerMadrid).not.toBe(hoyMadrid);
    writeFileSync(
      suenoUsoGratuitoFile,
      JSON.stringify({ "usr:sueno-test-a": { fecha: ayerMadrid } }),
      "utf8"
    );
    const { app } = await import("../app.js");
    await asegurarSesiones();
    const estado = await rq(app).get("/sueno/estado");
    expect(estado.status).toBe(200);
    expect(estado.body.yaUsado).toBe(false);
    expect(estado.body.restanteMs).toBe(0);
    const res = await rq(app).post("/sueno/interpretar").send({ texto: "Soñé con un río tranquilo." });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rechaza sin sesión las rutas de sueños y horóscopo (401)", async () => {
    const { app } = await import("../app.js");
    await asegurarSesiones();
    for (const [metodo, ruta] of [
      ["post", "/sueno/interpretar"],
      ["post", "/sueno/profundizar"],
      ["post", "/sueno/aspectos"],
      ["post", "/sueno/seguimiento"],
      ["post", "/sueno/chat"],
      ["get", "/sueno/estado"],
      ["get", "/horoscopo/estado"],
      ["post", "/horoscopo/uso"]
    ]) {
      const res = await request(app)[metodo](ruta).send({});
      expect(res.status, ruta).toBe(401);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("Datos sensibles excluidos del empaquetado (Git + instalador Electron)", () => {
  it(".gitignore excluye backend/data/*.json salvo el catálogo (productos.json)", () => {
    const gitignore = readFileSync(path.join(repoRoot, ".gitignore"), "utf8");
    expect(gitignore).toMatch(/backend\/data\/\*\.json/);
    expect(gitignore).toMatch(/!backend\/data\/productos\.json/);
  });

  it("electron-builder.yml excluye backend/data/*.json del instalador salvo productos.json", () => {
    const cfg = readFileSync(path.join(repoRoot, "electron-builder.yml"), "utf8");
    expect(cfg).toMatch(/!backend\/data\/\*\.json/);
    expect(cfg).toMatch(/backend\/data\/productos\.json/);
  });
});
