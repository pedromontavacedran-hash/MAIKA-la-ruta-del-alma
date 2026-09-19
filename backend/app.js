import { BACKEND_DIR } from "./lib/env.js";
import path from "node:path";
import { existsSync } from "node:fs";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { corsOriginConfig } from "./lib/origins.js";
import { authRouter } from "./routes/auth.js";
import { usuariosRouter } from "./routes/usuarios.js";
import { pedidosRouter } from "./routes/pedidos.js";
import { carritoRouter } from "./routes/carrito.js";
import { productosRouter } from "./routes/productos.js";
import { categoriasRouter } from "./routes/categorias.js";
import { suenoRouter } from "./routes/sueno.js";
import { horoscopoRouter } from "./routes/horoscopo.js";
import { webEstadoRouter } from "./routes/webEstado.js";
import { disenoWebRouter } from "./routes/disenoWeb.js";
import { preciosCompetenciaRouter } from "./routes/preciosCompetencia.js";
import { sugerenciasRouter } from "./routes/sugerencias.js";

const app = express();

app.use(helmet());
app.use(cors({
  origin: corsOriginConfig(),
  credentials: true
}));
/** 10mb: las imágenes de producto/categoría se suben como data URL base64 en el JSON. */
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use(authRouter);
app.use(usuariosRouter);
app.use(pedidosRouter);
app.use(carritoRouter);
app.use(productosRouter);
app.use(categoriasRouter);
app.use(suenoRouter);
app.use(horoscopoRouter);
app.use(webEstadoRouter);
app.use(disenoWebRouter);
app.use(preciosCompetenciaRouter);
app.use(sugerenciasRouter);

const serveMaikaDist = process.env.MAIKA_SERVE_DIST === "1";
if (serveMaikaDist) {
  const distDir = path.join(BACKEND_DIR, "..", "dist");
  if (existsSync(path.join(distDir, "index.html"))) {
    app.use(express.static(distDir));
    app.use((req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        next();
        return;
      }
      const p = req.path;
      if (
        p === "/health" ||
        p.startsWith("/auth/") ||
        p === "/me" ||
        p.startsWith("/usuarios") ||
        p.startsWith("/pedidos") ||
        p.startsWith("/carrito") ||
        p.startsWith("/productos") ||
        p.startsWith("/admin/") ||
        p.startsWith("/sueno/") ||
        p.startsWith("/horoscopo/")
      ) {
        next();
        return;
      }
      res.sendFile(path.join(distDir, "index.html"));
    });
  }
}

export { ensureStorage } from "./lib/storage.js";
export { verificarSmtpAlArrancar } from "./lib/email.js";
export { app };
