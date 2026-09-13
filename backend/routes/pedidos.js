import { Router } from "express";
import { idempotenciaPedidosFile } from "../lib/env.js";
import {
  readPedidos,
  writePedidos,
  aplicarDescuentoStockPedido,
  restaurarProductosDesdeSnapshotJson,
  withIdempotenciaKeyFlight,
  readIdempotenciaPedidos,
  updateIdempotenciaPedidos,
  responseIdempotencia,
  usuarioIdIdempotencia,
  idempotencyConflictBody
} from "../lib/storage.js";
import { authMiddleware, authMiddlewareCheckoutOk, usuariosAccessMiddleware } from "../lib/auth.js";

export const pedidosRouter = Router();

pedidosRouter.get("/pedidos", authMiddleware, async (req, res) => {
  const userId = `user_${String(req.user?.id ?? "").trim()}`;
  if (!String(req.user?.id ?? "").trim()) {
    res.status(401).json({ error: "Token inválido" });
    return;
  }
  const pedidos = await readPedidos();
  const propios = pedidos.filter((p) => String(p?.usuarioId || "") === userId);
  res.json(propios);
});

pedidosRouter.post("/pedidos", authMiddlewareCheckoutOk, async (req, res) => {
  const pedido = req.body;
  if (!pedido || typeof pedido !== "object") {
    res.status(400).json({ error: "Pedido inválido" });
    return;
  }
  if (!Array.isArray(pedido.items) || pedido.items.length === 0) {
    res.status(400).json({ error: "Pedido sin ítems" });
    return;
  }
  const userId = `user_${String(req.user?.id ?? "").trim()}`;
  if (!String(req.user?.id ?? "").trim()) {
    res.status(401).json({ error: "Token inválido" });
    return;
  }
  const rawKey = req.get("Idempotency-Key");
  const idemKey =
    rawKey != null && String(rawKey).trim() !== "" ? String(rawKey).trim().slice(0, 255) : "";

  const outcome = await withIdempotenciaKeyFlight(idempotenciaPedidosFile, idemKey, userId, async () => {
    if (idemKey) {
      const idemStore = await readIdempotenciaPedidos();
      const cached = idemStore[idemKey];
      if (cached != null && typeof cached === "object") {
        if (usuarioIdIdempotencia(cached) !== userId) {
          return { status: 409, body: idempotencyConflictBody() };
        }
        return { status: 200, body: responseIdempotencia(cached) };
      }
    }

    let rollbackStockJson = null;
    let pedidoSeguro;
    try {
      const stockOut = await aplicarDescuentoStockPedido(pedido);
      if (!stockOut.ok) {
        const http =
          stockOut.code === "STOCK_INSUFICIENTE"
            ? 409
            : stockOut.code === "PRODUCTO_NO_ENCONTRADO"
              ? 400
              : 400;
        return { status: http, body: { error: stockOut.message, code: stockOut.code } };
      }
      rollbackStockJson = stockOut.rollbackJson;

      const pedidos = await readPedidos();
      pedidoSeguro = { ...pedido, usuarioId: userId };
      pedidos.unshift(pedidoSeguro);
      await writePedidos(pedidos);
    } catch (e) {
      await restaurarProductosDesdeSnapshotJson(rollbackStockJson);
       
      console.error("[pedidos] POST error tras stock/pedidos", e);
      return { status: 500, body: { error: "No se pudo registrar el pedido" } };
    }

    if (idemKey) {
      try {
        await updateIdempotenciaPedidos((idemStore) => {
          idemStore[idemKey] = { usuarioId: userId, response: pedidoSeguro, createdAt: Date.now() };
          return idemStore;
        });
      } catch (e) {
         
        console.error("[pedidos] idempotencia no guardada (pedido ya persistido)", e);
      }
    }

    return { status: 201, body: pedidoSeguro };
  });

  res.status(outcome.status).json(outcome.body);
});

/** Solo admin: cambia el estado de fulfillment de CUALQUIER pedido (gestión de envíos en el panel). */
pedidosRouter.patch("/pedidos/:numero/estado", usuariosAccessMiddleware, async (req, res) => {
  const { numero } = req.params;
  const { estado } = req.body ?? {};
  if (!estado || !["pendiente", "enviado", "entregado"].includes(estado)) {
    res.status(400).json({ error: "Estado inválido" });
    return;
  }
  const pedidos = await readPedidos();
  const idx = pedidos.findIndex((p) => String(p?.numero) === String(numero));
  if (idx === -1) {
    res.status(404).json({ error: "Pedido no encontrado" });
    return;
  }
  pedidos[idx] = { ...pedidos[idx], estado };
  await writePedidos(pedidos);
  res.json(pedidos[idx]);
});
