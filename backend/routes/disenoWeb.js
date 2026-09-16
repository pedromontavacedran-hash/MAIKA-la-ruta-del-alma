import { Router } from "express";
import { requireAdmin } from "../lib/auth.js";
import { leerDisenoWeb, guardarDisenoWeb } from "../lib/disenoWeb.js";

export const disenoWebRouter = Router();

/**
 * Público: diseño activo de la web (visual + extras) — lo aplican todos los visitantes.
 * La sección `admin` (presets/baseline) no se expone al público.
 */
disenoWebRouter.get("/diseno-web", async (_req, res) => {
  const payload = await leerDisenoWeb();
  const publico =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? { ...payload, admin: undefined }
      : payload;
  res.json({ ok: true, payload: publico });
});

/** Solo admin: diseño completo incluida la biblioteca de presets/baseline. */
disenoWebRouter.get("/admin/diseno-web", requireAdmin, async (_req, res) => {
  const payload = await leerDisenoWeb();
  res.json({ ok: true, payload });
});

/** Solo admin: publica el diseño actual para todos los visitantes. */
disenoWebRouter.put("/admin/diseno-web", requireAdmin, async (req, res) => {
  const r = await guardarDisenoWeb(req.body?.payload);
  if (!r.ok) {
    res.status(r.status).json({ error: r.error });
    return;
  }
  res.json({ ok: true });
});
