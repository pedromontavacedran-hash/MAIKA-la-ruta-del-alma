import assert from "node:assert/strict";
import { app, BrowserWindow } from "electron";

const base = "http://127.0.0.1:5173";
const inicial = "Los perros pequeños podrían evocar compañía y cercanía. ¿Dónde estaban esos perros? ¿Te acercabas a ellos?";
const adicional = "Que fueran muchos perros añade una dimensión de compañía compartida. Su relación contigo puede aportar nuevos matices.";
const profunda = "La presencia de muchos perros pequeños amplía el sentido de compañía compartida y su relación con tu tranquilidad.";
const aspectos = ["Cómo se relacionaban contigo esos muchos perros", "Qué vínculos te sugiere su presencia conjunta"];
const requests = [];
let window;

async function evaluate(fn, ...args) {
  return window.webContents.executeJavaScript(`(${fn.toString()})(...${JSON.stringify(args)})`, true);
}

async function waitFor(fn, timeout = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evaluate(fn)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timeout: ${fn.toString()}`);
}

async function clickText(text) {
  await evaluate((value) => {
    const button = [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === value);
    if (!button || button.disabled) throw new Error(`Botón no disponible: ${value}`);
    button.click();
  }, text);
}

async function fill(selector, value) {
  await evaluate((query, text) => {
    const input = document.querySelector(query);
    if (!input) throw new Error(`Campo no encontrado: ${query}`);
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, selector, value);
}

try {
  await app.whenReady();
  console.log("Iniciando navegador aislado de prueba");
  window = new BrowserWindow({ show: false, width: 1200, height: 900, webPreferences: { backgroundThrottling: false, nodeIntegration: false, contextIsolation: true, partition: `sueno-test-${Date.now()}` } });
  const debuggerApi = window.webContents.debugger;
  debuggerApi.attach("1.3");
  debuggerApi.on("message", async (_event, method, params) => {
    if (method !== "Fetch.requestPaused") return;
    const { requestId, request } = params;
    const url = new URL(request.url);
    const route = url.pathname.replace(/^\/api/, "");
    if (route === "/__sueno_continuidad__") {
      await debuggerApi.sendCommand("Fetch.fulfillRequest", {
        requestId, responseCode: 200,
        responseHeaders: [{ name: "Content-Type", value: "text/html" }],
        body: Buffer.from(`<html><head><meta charset="utf-8"/><style>body{margin:0;background:#100c18}</style></head><body><div id="root"></div><script type="module">import RefreshRuntime from '/@react-refresh'; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true; const React=await import('/node_modules/.vite/deps/react.js'); const {createRoot}=await import('/node_modules/.vite/deps/react-dom_client.js'); const {default:Sueno}=await import('/src/Sueno.tsx'); createRoot(document.getElementById('root')).render(React.createElement(Sueno));</script></body></html>`).toString("base64")
      });
      return;
    }
    let response = request.method === "OPTIONS" ? {} : undefined;
    if (route.startsWith("/sueno/") && request.method !== "OPTIONS") {
      const body = JSON.parse(request.postData || "{}");
      requests.push({ route, body });
      if (route === "/sueno/interpretar") response = { ok: true, mensaje: inicial };
      if (route === "/sueno/profundizar") response = { ok: true, mensaje: adicional };
      if (route === "/sueno/aspectos") response = { ok: true, aspectos };
      if (route === "/sueno/premium/simular-cobro") response = { ok: true, desbloqueoToken: "test-only-token", modo: "simulado" };
      if (route === "/sueno/seguimiento") response = { ok: true, mensaje: profunda };
      if (route === "/sueno/chat") response = { ok: true, mensaje: "La compañía puede vincularse a tus relaciones actuales." };
    }
    if (response || url.port === "3001" || !["localhost", "127.0.0.1"].includes(url.hostname)) {
      await debuggerApi.sendCommand("Fetch.fulfillRequest", {
        requestId,
        responseCode: response ? 200 : 403,
        responseHeaders: [{ name: "Content-Type", value: "application/json" }, { name: "Access-Control-Allow-Origin", value: base }, { name: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" }, { name: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" }],
        body: Buffer.from(JSON.stringify(response || { error: "Blocked in isolated test" })).toString("base64")
      });
    } else {
      await debuggerApi.sendCommand("Fetch.continueRequest", { requestId });
    }
  });
  await debuggerApi.sendCommand("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
  void window.loadURL(`${base}/__sueno_continuidad__`);
  await waitFor(() => Boolean(document.querySelector('textarea[placeholder="Describe tu sueño..."]')));
  console.log("Pantalla de sueños cargada");
  await evaluate(() => document.querySelector('.maika-sueno-row-voz input[type="checkbox"]').click());
  await fill('textarea[placeholder="Describe tu sueño..."]', "perros pequeños");
  await clickText("Interpretar sueño ✨");
  await fill('textarea[placeholder="Si lo deseas, puedes añadir más detalles..."]', "Tranquilidad");
  await clickText("Continuar ✨");
  await waitFor(() => Boolean(document.querySelector('textarea[placeholder="Pregunta algo a Maika sobre este sueño..."]')));
  assert.equal(await evaluate(() => document.body.textContent.includes("Has utilizado tu pregunta adicional")), false);
  await fill('textarea[placeholder="Pregunta algo a Maika sobre este sueño..."]', "muchos");
  await clickText("Enviar ✨");
  await waitFor(() => [...document.querySelectorAll("button")].some((el) => el.textContent.trim() === "Desbloquear lectura profunda ✨"));
  await fill('textarea[placeholder="Describe tu sueño..."]', "edición posterior que no pertenece a la lectura");
  await new Promise((resolve) => setTimeout(resolve, 600));
  const before = await evaluate(() => {
    const panel = document.querySelector(".maika-sueno-profundizar").parentElement;
    return { height: panel.clientHeight, scrollTop: panel.scrollTop, pageY: window.scrollY };
  });
  await clickText("Desbloquear lectura profunda ✨");
  await waitFor(() => document.body.textContent.includes("Aspectos que aún podemos explorar"));
  await waitFor(() => document.body.textContent.includes("Cómo se relacionaban contigo esos muchos perros"));
  const after = await evaluate((initialText, followupText) => {
    const panel = document.querySelector(".maika-sueno-profundizar")?.parentElement;
    const section = document.querySelector(".maika-sueno-entrada-profunda");
    const rect = section?.getBoundingClientRect();
    const panelRect = panel?.getBoundingClientRect();
    return {
      panelExists: Boolean(panel),
      height: panel?.clientHeight,
      scrollTop: panel?.scrollTop,
      pageY: window.scrollY,
      sameConversation: Boolean(panel?.textContent.includes(followupText)),
      initialRepeated: Boolean(section?.textContent.includes(initialText)),
      oldQuestion: Boolean(section?.textContent.includes("¿Dónde estaban esos perros?")),
      sectionVisible: Boolean(rect && panelRect && rect.top >= panelRect.top - 2 && rect.top < panelRect.bottom)
    };
  }, inicial, adicional);
  assert.ok(after.panelExists && after.sameConversation, "Se conserva la conversación");
  assert.equal(after.height, before.height, "El panel conserva su altura y scroll interno");
  assert.ok(after.scrollTop >= before.scrollTop, "No retrocede al inicio del panel");
  assert.equal(after.pageY, before.pageY, "No desplaza la página");
  assert.ok(after.sectionVisible, "La preparación queda visible dentro del panel");
  assert.equal(after.initialRepeated, false);
  assert.equal(after.oldQuestion, false);
  await clickText(aspectos[0]);
  await clickText("Ya envié el Bizum — abrir mi lectura profunda ✨");
  await waitFor(() => document.body.textContent.includes("La presencia de muchos perros pequeños amplía el sentido"));
  for (const route of ["/sueno/aspectos", "/sueno/seguimiento"]) {
    const request = requests.find((item) => item.route === route);
    assert.ok(request, `${route} enviado`);
    assert.equal(request.body.texto, "perros pequeños");
    assert.equal(request.body.interpretacionBasica, inicial);
    assert.equal(request.body.emocion, "Tranquilidad");
    assert.deepEqual(request.body.historialAdicional, [{ rol: "user", texto: "muchos" }, { rol: "ai", texto: adicional }]);
  }
  assert.equal(requests.find((item) => item.route === "/sueno/seguimiento").body.enfasis, aspectos[0]);
  console.log("PASS: sueño nuevo -> pregunta adicional -> preparación contextual -> lectura profunda; scroll interno estable, sin repetición ni preguntas antiguas; contexto completo confirmado. IA y cobro simulados, sin llamadas reales.");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  window?.destroy();
  app.exit(process.exitCode || 0);
}
