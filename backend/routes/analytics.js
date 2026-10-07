import { Router } from "express";
import { analyticsLimiter } from "../lib/rateLimits.js";
import { usuariosAccessMiddleware } from "../lib/auth.js";
import {
  DISPOSITIVOS_ANALITICA,
  PROCEDENCIAS_ANALITICA,
  SECCIONES_ANALITICA,
  registrarSalida,
  registrarVista,
  resetearAnalitica,
  resumenAnalitica
} from "../lib/analytics.js";

export const analyticsRouter = Router();

/**
 * Vista de sección desde el SPA. Solo acepta valores de las listas cerradas de
 * `lib/analytics.js`: cualquier campo extra del body se ignora por diseño.
 * Responde 204 siempre que el payload sea válido (no hay nada que devolver).
 */
analyticsRouter.post("/analytics/vista", analyticsLimiter, (req, res) => {
  const seccion = String(req.body?.seccion ?? "");
  if (!SECCIONES_ANALITICA.has(seccion)) {
    res.status(400).json({ ok: false, error: "seccion_invalida" });
    return;
  }
  const procedencia = String(req.body?.procedencia ?? "");
  const dispositivo = String(req.body?.dispositivo ?? "");
  registrarVista({
    seccion,
    entrada: req.body?.entrada === true,
    procedencia: PROCEDENCIAS_ANALITICA.has(procedencia) ? procedencia : "otro",
    dispositivo: DISPOSITIVOS_ANALITICA.has(dispositivo) ? dispositivo : "otro",
    primeraVez: req.body?.primeraVez === true,
    /* Slug editorial opcional (`/articulos/:slug`): lib/analytics solo lo suma si
       está en la lista cerrada; uno desconocido se ignora sin invalidar la vista. */
    articulo: String(req.body?.articulo ?? "")
  });
  res.status(204).end();
});

/** Cierre/ocultado: última sección + duración aproximada (sendBeacon del cliente). */
analyticsRouter.post("/analytics/salida", analyticsLimiter, (req, res) => {
  const seccion = String(req.body?.seccion ?? "");
  if (!SECCIONES_ANALITICA.has(seccion)) {
    res.status(400).json({ ok: false, error: "seccion_invalida" });
    return;
  }
  registrarSalida({ seccion, duracionMs: req.body?.duracionMs });
  res.status(204).end();
});

/** Panel de administración: agregado de los últimos N días (30 por defecto, 90 máx). */
analyticsRouter.get("/admin/analytics", usuariosAccessMiddleware, (req, res) => {
  const dias = Number(req.query?.dias);
  res.json(resumenAnalitica(Number.isFinite(dias) ? dias : 30));
});

/** Vaciar toda la estadística: solo admin; el front pide confirmación antes de llamar aquí. */
analyticsRouter.delete("/admin/analytics", usuariosAccessMiddleware, (_req, res) => {
  resetearAnalitica();
  res.json({ ok: true });
});
