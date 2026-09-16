import { Router } from "express";
import {
  readCategorias,
  writeCategorias,
  readSubcategorias,
  writeSubcategorias,
  readProductos
} from "../lib/storage.js";
import { usuariosAccessMiddleware } from "../lib/auth.js";
import { crearCarpetaCategoria, crearCarpetaSubcategoria, guardarImagenSiEsDataUrl } from "../lib/imagenesTienda.js";

export const categoriasRouter = Router();

function slugificar(nombre) {
  return String(nombre || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** Catálogo de categorías: público, sin auth (lo necesita cualquier visitante de la tienda). */
categoriasRouter.get("/categorias", async (_req, res) => {
  try {
    const list = await readCategorias();
    res.json(list);
  } catch {
    res.status(500).json({ error: "No se pudieron leer las categorías" });
  }
});

categoriasRouter.get("/subcategorias", async (_req, res) => {
  try {
    const list = await readSubcategorias();
    res.json(list);
  } catch {
    res.status(500).json({ error: "No se pudieron leer las subcategorías" });
  }
});

categoriasRouter.post("/admin/categorias", usuariosAccessMiddleware, async (req, res) => {
  const nombre = String(req.body?.nombre ?? "").trim();
  if (!nombre) {
    res.status(400).json({ error: "Nombre requerido" });
    return;
  }
  const nombreNorm = nombre.toLowerCase();
  const list = await readCategorias();
  if (list.some((c) => c.nombre.toLowerCase() === nombreNorm)) {
    res.status(409).json({ error: "Ya existe una categoría con ese nombre" });
    return;
  }
  let id = slugificar(nombreNorm) || `cat-${Date.now()}`;
  if (list.some((c) => c.id === id)) id = `${id}-${Date.now()}`;
  await crearCarpetaCategoria(id);
  const imagen = await guardarImagenSiEsDataUrl(req.body?.imagen, id, null, "portada");
  const nueva = { id, nombre: nombreNorm, ...(imagen ? { imagen } : {}) };
  const siguiente = [...list, nueva];
  await writeCategorias(siguiente);
  res.status(201).json(nueva);
});

categoriasRouter.put("/admin/categorias/:id", usuariosAccessMiddleware, async (req, res) => {
  const id = String(req.params.id);
  const nombre = String(req.body?.nombre ?? "").trim();
  if (!nombre) {
    res.status(400).json({ error: "Nombre requerido" });
    return;
  }
  const list = await readCategorias();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) {
    res.status(404).json({ error: "No encontrada" });
    return;
  }
  const nombreNorm = nombre.toLowerCase();
  if (list.some((c) => c.id !== id && c.nombre.toLowerCase() === nombreNorm)) {
    res.status(409).json({ error: "Ya existe una categoría con ese nombre" });
    return;
  }
  const actual = list[idx];
  let imagen = actual.imagen;
  if (req.body?.imagen !== undefined) {
    const entrada = String(req.body.imagen || "").trim();
    imagen = entrada ? await guardarImagenSiEsDataUrl(entrada, id, null, "portada") : undefined;
  }
  const siguiente = list.map((c, i) => {
    if (i !== idx) return c;
    const base = { id: c.id, nombre: nombreNorm };
    return imagen ? { ...base, imagen } : base;
  });
  await writeCategorias(siguiente);
  res.json(siguiente[idx]);
});

categoriasRouter.delete("/admin/categorias/:id", usuariosAccessMiddleware, async (req, res) => {
  const id = String(req.params.id);
  const list = await readCategorias();
  if (!list.some((c) => c.id === id)) {
    res.status(404).json({ error: "No encontrada" });
    return;
  }
  await writeCategorias(list.filter((c) => c.id !== id));
  res.json({ ok: true });
});

categoriasRouter.post("/admin/subcategorias", usuariosAccessMiddleware, async (req, res) => {
  const categoriaId = String(req.body?.categoriaId ?? "").trim();
  const nombre = String(req.body?.nombre ?? "").trim();
  if (!categoriaId || !nombre) {
    res.status(400).json({ error: "categoriaId y nombre requeridos" });
    return;
  }
  const list = await readSubcategorias();
  const nombreNorm = nombre.toLowerCase();
  if (list.some((s) => s.categoriaId === categoriaId && s.nombre.toLowerCase() === nombreNorm)) {
    res.status(409).json({ error: "Ya existe una subcategoría con ese nombre en esta categoría" });
    return;
  }
  let id = slugificar(nombre) || `sub-${Date.now()}`;
  if (list.some((s) => s.id === id)) id = `${id}-${Date.now()}`;
  const padreRaw = String(req.body?.padreSubcategoriaId ?? "").trim();
  const padre = padreRaw ? list.find((s) => s.id === padreRaw && s.categoriaId === categoriaId) : null;
  if (padreRaw && (!padre || padre.padreSubcategoriaId)) {
    res.status(400).json({ error: "La carpeta padre no es válida" });
    return;
  }
  const nueva = { id, categoriaId, nombre };
  if (padre) nueva.padreSubcategoriaId = padre.id;
  const siguiente = [...list, nueva];
  await writeSubcategorias(siguiente);
  await crearCarpetaSubcategoria(categoriaId, id);
  res.status(201).json(nueva);
});

categoriasRouter.put("/admin/subcategorias/:id", usuariosAccessMiddleware, async (req, res) => {
  const id = String(req.params.id);
  const nombre = String(req.body?.nombre ?? "").trim();
  const padreRaw = String(req.body?.padreSubcategoriaId ?? "").trim();
  if (!nombre) {
    res.status(400).json({ error: "Nombre requerido" });
    return;
  }
  const list = await readSubcategorias();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) {
    res.status(404).json({ error: "No encontrada" });
    return;
  }
  const actual = list[idx];
  const padre = padreRaw ? list.find((s) => s.id === padreRaw && s.categoriaId === actual.categoriaId) : null;
  if (padreRaw && (!padre || padre.id === id || padre.padreSubcategoriaId || list.some((s) => s.padreSubcategoriaId === id))) {
    res.status(400).json({ error: "La carpeta padre no es válida" });
    return;
  }
  const actualizada = { ...actual, nombre };
  if (padre) {
    actualizada.padreSubcategoriaId = padre.id;
  } else {
    delete actualizada.padreSubcategoriaId;
  }
  const siguiente = list.map((s) => (s.id === id ? actualizada : s));
  await writeSubcategorias(siguiente);
  res.json(actualizada);
});

categoriasRouter.delete("/admin/subcategorias/:id", usuariosAccessMiddleware, async (req, res) => {
  const id = String(req.params.id);
  const list = await readSubcategorias();
  if (!list.some((s) => s.id === id)) {
    res.status(404).json({ error: "No encontrada" });
    return;
  }
  if (list.some((s) => s.padreSubcategoriaId === id)) {
    res.status(409).json({ error: "La subcategoría contiene subcarpetas" });
    return;
  }
  const enUso = (await readProductos()).some((p) => p.subcategoriaId === id);
  if (enUso) {
    res.status(409).json({ error: "Hay productos usando esta subcategoría" });
    return;
  }
  await writeSubcategorias(list.filter((s) => s.id !== id));
  res.json({ ok: true });
});
