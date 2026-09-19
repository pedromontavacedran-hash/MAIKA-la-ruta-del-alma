import { Router } from "express";
import crypto from "node:crypto";
import { readSugerencias, writeSugerencias } from "../lib/storage.js";
import { authMiddleware, usuariosAccessMiddleware } from "../lib/auth.js";
import { sugerenciaLimiter } from "../lib/rateLimits.js";

export const sugerenciasRouter = Router();

const TIPOS_VALIDOS = new Set([
  "Web / diseño",
  "Tienda / productos",
  "Funcionalidad",
  "Experiencia de usuario",
  "Contenido",
  "Error o problema",
  "Otra sugerencia"
]);
const ESTADOS_VALIDOS = new Set(["pendiente", "revisada"]);
const MENSAJE_MAX = 2000;

/** Quita etiquetas HTML y caracteres de control; el mensaje se guarda y se muestra como texto plano en el admin. */
function sanearTexto(valor, max) {
  const sinEtiquetas = String(valor ?? "").replace(/<[^>]*>/g, "");
  let limpio = "";
  for (const ch of sinEtiquetas) {
    const code = ch.codePointAt(0);
    const esControl = code < 32 && code !== 9 && code !== 10 && code !== 13;
    if (!esControl && code !== 127) limpio += ch;
  }
  return limpio.trim().slice(0, max);
}

/** Buzón del menú "Sugerencias y mejoras": solo usuarios autenticados; la cuenta sale del JWT, nunca del body. */
sugerenciasRouter.post("/sugerencias", authMiddleware, sugerenciaLimiter, async (req, res) => {
  const tipo = String(req.body?.tipo ?? "").trim();
  if (!TIPOS_VALIDOS.has(tipo)) {
    res.status(400).json({ error: "Selecciona un tipo de sugerencia válido" });
    return;
  }
  const mensaje = sanearTexto(req.body?.mensaje, MENSAJE_MAX);
  if (!mensaje) {
    res.status(400).json({ error: "Escribe un mensaje para tu sugerencia" });
    return;
  }

  const sugerencia = {
    id: crypto.randomUUID(),
    fecha: new Date().toISOString(),
    tipo,
    mensaje,
    usuarioId: String(req.user?.id ?? "").trim(),
    estado: "pendiente"
  };

  try {
    const lista = await readSugerencias();
    lista.push(sugerencia);
    await writeSugerencias(lista);
    res.status(201).json({ ok: true, id: sugerencia.id });
  } catch {
    res.status(500).json({ error: "No se pudo guardar la sugerencia. Inténtalo de nuevo." });
  }
});

/** Listado completo: solo admin (nunca hay endpoint público de lectura). */
sugerenciasRouter.get("/admin/sugerencias", usuariosAccessMiddleware, async (_req, res) => {
  try {
    const lista = await readSugerencias();
    res.json([...lista].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))));
  } catch {
    res.status(500).json({ error: "No se pudieron leer las sugerencias" });
  }
});

sugerenciasRouter.patch("/admin/sugerencias/:id", usuariosAccessMiddleware, async (req, res) => {
  const id = String(req.params.id);
  const estado = String(req.body?.estado ?? "");
  if (!ESTADOS_VALIDOS.has(estado)) {
    res.status(400).json({ error: "Estado no válido" });
    return;
  }
  const lista = await readSugerencias();
  const idx = lista.findIndex((s) => s.id === id);
  if (idx === -1) {
    res.status(404).json({ error: "No encontrada" });
    return;
  }
  lista[idx] = { ...lista[idx], estado };
  await writeSugerencias(lista);
  res.json(lista[idx]);
});

sugerenciasRouter.delete("/admin/sugerencias/:id", usuariosAccessMiddleware, async (req, res) => {
  const id = String(req.params.id);
  const lista = await readSugerencias();
  if (!lista.some((s) => s.id === id)) {
    res.status(404).json({ error: "No encontrada" });
    return;
  }
  await writeSugerencias(lista.filter((s) => s.id !== id));
  res.json({ ok: true });
});
