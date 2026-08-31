import { Router } from "express";
import { readCarritos, writeCarritos } from "../lib/storage.js";
import { authMiddlewareCheckoutOk } from "../lib/auth.js";

export const carritoRouter = Router();

carritoRouter.get("/carrito/:usuarioId", authMiddlewareCheckoutOk, async (req, res) => {
  const userIdToken = String(req.user?.id ?? "").trim();
  if (!userIdToken) {
    res.status(401).json({ error: "Token inválido" });
    return;
  }
  const usuarioId = `user_${userIdToken}`;
  const carritos = await readCarritos();
  const found = carritos.find((c) => String(c?.usuarioId) === String(usuarioId));
  if (!found) {
    res.json({ usuarioId, items: [], updatedAt: null });
    return;
  }
  const items = Array.isArray(found.items) ? found.items : [];
  res.json({ usuarioId, items, updatedAt: found.updatedAt ?? null });
});

carritoRouter.put("/carrito/:usuarioId", authMiddlewareCheckoutOk, async (req, res) => {
  const userIdToken = String(req.user?.id ?? "").trim();
  const usuarioId = `user_${userIdToken}`;
  const { items } = req.body ?? {};
  if (!userIdToken || !Array.isArray(items)) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const carritos = await readCarritos();
  const payload = {
    usuarioId,
    items,
    updatedAt: new Date().toISOString()
  };
  const idx = carritos.findIndex((c) => String(c?.usuarioId) === String(usuarioId));
  if (idx >= 0) carritos[idx] = payload;
  else carritos.push(payload);
  await writeCarritos(carritos);
  res.json(payload);
});
