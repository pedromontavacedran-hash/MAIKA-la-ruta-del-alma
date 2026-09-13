import { Router } from "express";
import { readCarritos, writeCarritos, readProductos } from "../lib/storage.js";
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
  const productos = await readProductos();
  const porId = new Map(productos.map((p) => [Number(p.id), p]));
  const itemsSanos = [];
  for (const it of items) {
    const id = Number(it?.id);
    const cantidad = Math.floor(Number(it?.cantidad) || 0);
    if (!Number.isFinite(id) || id <= 0 || cantidad <= 0) continue;
    const prod = porId.get(id);
    if (!prod) continue;
    const stock = Math.max(0, Number(prod.stock) || 0);
    itemsSanos.push({
      ...it,
      id,
      cantidad: Math.min(cantidad, stock)
    });
  }
  const carritos = await readCarritos();
  const payload = {
    usuarioId,
    items: itemsSanos,
    updatedAt: new Date().toISOString()
  };
  const idx = carritos.findIndex((c) => String(c?.usuarioId) === String(usuarioId));
  if (idx >= 0) carritos[idx] = payload;
  else carritos.push(payload);
  await writeCarritos(carritos);
  res.json(payload);
});
