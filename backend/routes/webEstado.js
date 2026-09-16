import { Router } from "express";
import { usuariosAccessMiddleware } from "../lib/auth.js";
import { leerWebEstado, guardarWebEstado } from "../lib/webEstado.js";

export const webEstadoRouter = Router();

/** Público: el frontend lo consulta al cargar para mostrar la tienda o la página de cerrado. */
webEstadoRouter.get("/estado-web", async (_req, res) => {
  const estado = await leerWebEstado();
  res.json({ ok: true, ...estado });
});

/** Solo admin: interruptor abierta/cerrada + mensaje opcional para la página de cerrado. */
webEstadoRouter.put("/admin/estado-web", usuariosAccessMiddleware, async (req, res) => {
  const estado = await guardarWebEstado({
    cerrada: req.body?.cerrada === true,
    mensaje: req.body?.mensaje
  });
  res.json({ ok: true, ...estado });
});
