import { Router } from "express";
import { requireAdmin } from "../lib/auth.js";
import { readProductos } from "../lib/storage.js";
import { extraerPrecioDeUrl } from "../lib/precioCompetencia.js";
import { leerPreciosOrigen, guardarPrecioOrigen } from "../lib/preciosOrigenCache.js";

export const preciosCompetenciaRouter = Router();

const CONCURRENCIA = 4;

function aItemRespuesta(p, cache) {
  const c = cache[String(p.id)];
  return {
    id: p.id,
    categoria: p.categoria ?? null,
    nombre: p.nombre ?? "",
    imagen: p.imagen ?? null,
    marca: p.marca ?? null,
    precioMio: typeof p.precio === "number" ? p.precio : Number(p.precio) || null,
    urlOrigen: p.urlOrigen.trim(),
    precioOrigen: c?.ok ? c.precio : null,
    precioRegularOrigen: c?.ok ? c.precioRegular : null,
    comprobadoEn: c?.comprobadoEn ?? null,
    ok: c ? c.ok : null,
    error: c && !c.ok ? c.error : null
  };
}

async function comprobarYGuardar(p) {
  const url = p.urlOrigen.trim();
  const r = await extraerPrecioDeUrl(url);
  const entrada = {
    precio: r.ok ? r.precio : null,
    precioRegular: r.ok ? r.precioRegular : null,
    comprobadoEn: new Date().toISOString(),
    url,
    ok: r.ok,
    error: r.ok ? null : r.error
  };
  await guardarPrecioOrigen(p.id, entrada);
  return entrada;
}

/**
 * Solo admin: lista productos con `urlOrigen` + su último precio de fabricante cacheado.
 * Rápido: no descarga webs (solo lee la cache). Para actualizar: POST /admin/precios-competencia.
 */
preciosCompetenciaRouter.get("/admin/precios-competencia", requireAdmin, async (_req, res) => {
  const list = await readProductos();
  const cache = await leerPreciosOrigen();
  const items = list
    .filter((p) => typeof p.urlOrigen === "string" && p.urlOrigen.trim() !== "")
    .map((p) => aItemRespuesta(p, cache));
  res.json({ ok: true, items });
});

/**
 * Solo admin: re-descarga el precio del fabricante de los productos con urlOrigen.
 * `?pendientes=1` → solo los que nunca se comprobaron o cuya URL cambió (abre rápido el inventario).
 * Sin parámetro → todos.
 */
preciosCompetenciaRouter.post("/admin/precios-competencia", requireAdmin, async (req, res) => {
  const list = await readProductos();
  const conOrigen = list.filter((p) => typeof p.urlOrigen === "string" && p.urlOrigen.trim() !== "");

  let objetivos = conOrigen;
  if (req.query.pendientes === "1") {
    const cache = await leerPreciosOrigen();
    objetivos = conOrigen.filter((p) => {
      const c = cache[String(p.id)];
      return !c || !c.comprobadoEn || c.url !== p.urlOrigen.trim();
    });
  }

  let idx = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCIA, objetivos.length) }, async () => {
    while (idx < objetivos.length) {
      const p = objetivos[idx++];
      await comprobarYGuardar(p).catch(() => {});
    }
  });
  await Promise.all(workers);

  const cache = await leerPreciosOrigen();
  res.json({ ok: true, items: conOrigen.map((p) => aItemRespuesta(p, cache)) });
});

/** Solo admin: re-descarga el precio del fabricante de UN producto. */
preciosCompetenciaRouter.post("/admin/productos/:id/precio-origen", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const list = await readProductos();
  const p = list.find((x) => Number(x.id) === id);
  if (!p) {
    res.status(404).json({ error: "Producto no encontrado" });
    return;
  }
  if (typeof p.urlOrigen !== "string" || p.urlOrigen.trim() === "") {
    res.status(400).json({ error: "El producto no tiene enlace de origen" });
    return;
  }
  await comprobarYGuardar(p);
  const cache = await leerPreciosOrigen();
  res.json({ ok: true, item: aItemRespuesta(p, cache) });
});
