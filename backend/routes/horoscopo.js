import { Router } from "express";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { horoscopoUsoDiarioFile } from "../lib/env.js";
import { authMiddleware } from "../lib/auth.js";
import { suenoInterpretarLimiter } from "../lib/rateLimits.js";
import { fechaHoyEspana, msHastaMedianocheEspana } from "../lib/fechaEspana.js";

export const horoscopoRouter = Router();

const SIGNOS_VALIDOS = new Set([
  "aries", "tauro", "geminis", "cancer", "leo", "virgo",
  "libra", "escorpio", "sagitario", "capricornio", "acuario", "piscis"
]);

/**
 * El horóscopo es una experiencia diaria: 1 lectura por día natural en hora de España
 * (Europe/Madrid), reiniciándose a las 00:00 — no es un cooldown rodante de 24 h.
 * La fuente de verdad es el servidor (`horoscopo_uso_diario.json`, clave `usr:<id>`):
 * borrar localStorage, cambiar de navegador o reiniciar no permite repetir la lectura.
 * La fecha la calcula `lib/fechaEspana.js`, compartida con el límite diario de sueños.
 */

const usoDiario = new Map();
let usoLoaded = false;

function ensureUsoLoaded() {
  if (usoLoaded) return;
  usoLoaded = true;
  try {
    if (existsSync(horoscopoUsoDiarioFile)) {
      const obj = JSON.parse(readFileSync(horoscopoUsoDiarioFile, "utf8"));
      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        for (const [k, v] of Object.entries(obj)) {
          if (k && v && typeof v === "object" && typeof v.fecha === "string") {
            usoDiario.set(k, { fecha: v.fecha, signo: typeof v.signo === "string" ? v.signo : "" });
          }
        }
      }
    }
  } catch {
    /* ignorar */
  }
}

function persistUsoSync() {
  try {
    writeFileSync(horoscopoUsoDiarioFile, JSON.stringify(Object.fromEntries(usoDiario)), "utf8");
  } catch (e) {
    if (process.env.MAIKA_QUIET !== "1") {
       
      console.error("[maika-backend] horoscopo uso persist", e);
    }
  }
}

horoscopoRouter.get("/horoscopo/estado", authMiddleware, suenoInterpretarLimiter, (req, res) => {
  ensureUsoLoaded();
  const hoy = fechaHoyEspana();
  const uso = usoDiario.get(`usr:${req.user.id}`);
  const yaUsado = !!uso && uso.fecha === hoy;
  res.json({
    ok: true,
    yaUsado,
    fechaHoy: hoy,
    signo: yaUsado ? uso.signo : null,
    restanteMs: yaUsado ? msHastaMedianocheEspana() : 0
  });
});

horoscopoRouter.post("/horoscopo/uso", authMiddleware, suenoInterpretarLimiter, (req, res) => {
  const signo = String(req.body?.signo ?? "").trim();
  if (!SIGNOS_VALIDOS.has(signo)) {
    res.status(400).json({ ok: false, error: "signo_invalido" });
    return;
  }
  ensureUsoLoaded();
  const hoy = fechaHoyEspana();
  const clave = `usr:${req.user.id}`;
  const uso = usoDiario.get(clave);
  if (uso && uso.fecha === hoy) {
    res.status(409).json({ ok: false, error: "limite_diario", signo: uso.signo });
    return;
  }
  usoDiario.set(clave, { fecha: hoy, signo });
  persistUsoSync();
  res.json({ ok: true });
});
