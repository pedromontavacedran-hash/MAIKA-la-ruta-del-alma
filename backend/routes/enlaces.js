import { Router } from "express";
import { usuariosAccessMiddleware } from "../lib/auth.js";
import { leerEnlaces, guardarEnlaces } from "../lib/enlaces.js";

export const enlacesRouter = Router();

/**
 * Público: configuración de la página `/enlaces` (la del QR de las tarjetas).
 * Devuelve todos los enlaces con su flag `activa`; la página solo pinta los activos.
 */
enlacesRouter.get("/enlaces-config", async (_req, res) => {
  const enlaces = await leerEnlaces();
  res.json({ ok: true, enlaces });
});

/** Solo admin: guarda la lista completa (orden = orden de los botones en `/enlaces`). */
enlacesRouter.put("/admin/enlaces", usuariosAccessMiddleware, async (req, res) => {
  const enlaces = await guardarEnlaces(req.body?.enlaces);
  res.json({ ok: true, enlaces });
});
