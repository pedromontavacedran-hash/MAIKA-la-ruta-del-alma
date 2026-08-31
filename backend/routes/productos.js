import { Router } from "express";
import { CATEGORIAS_PRODUCTO } from "../lib/env.js";
import {
  readProductos,
  writeProductos,
  productoPublicoTienda,
  categoriaProductoValida
} from "../lib/storage.js";
import { usuariosAccessMiddleware } from "../lib/auth.js";
import { guardarImagenSiEsDataUrl } from "../lib/imagenesTienda.js";

export const productosRouter = Router();

/** Catálogo tienda: solo productos activos (sin auth). */
productosRouter.get("/productos", async (_req, res) => {
  try {
    const list = await readProductos();
    const activos = list.filter((p) => p.activo !== false).map(productoPublicoTienda);
    res.json(activos);
  } catch (e) {
    res.status(500).json({ error: "No se pudo leer el catálogo" });
  }
});

/** Admin: todos los productos (incl. inactivos). Misma regla que GET /usuarios. */
productosRouter.get("/admin/productos", usuariosAccessMiddleware, async (_req, res) => {
  const list = await readProductos();
  res.json(list);
});

productosRouter.post("/admin/productos", usuariosAccessMiddleware, async (req, res) => {
  const body = req.body ?? {};
  const nombre = String(body.nombre ?? "").trim();
  if (!nombre) {
    res.status(400).json({ error: "Nombre requerido" });
    return;
  }
  const cat = String(body.categoria ?? "").trim();
  if (!categoriaProductoValida(cat)) {
    res.status(400).json({ error: `Categoría inválida (vacía o demasiado larga)` });
    return;
  }
  const precio = Number(body.precio);
  if (!Number.isFinite(precio)) {
    res.status(400).json({ error: "Precio inválido" });
    return;
  }
  const list = await readProductos();
  let id = Number(body.id);
  const maxId = list.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0);
  if (!Number.isInteger(id) || id <= 0 || list.some((p) => Number(p.id) === id)) {
    id = maxId + 1;
  }
  const stockN = Math.max(0, Math.floor(Number(body.stock) || 0));
  const subcategoriaId = String(body.subcategoriaId ?? "").trim();
  let imagen = String(body.imagen ?? "").trim();
  imagen = await guardarImagenSiEsDataUrl(imagen, cat, subcategoriaId, `${nombre}-${id}`);
  if (!imagen) imagen = `/${cat}-${id}.jpg`;
  const nuevo = {
    id,
    categoria: cat,
    nombre,
    precio,
    stock: stockN,
    imagen,
    descripcion: String(body.descripcion ?? "").trim(),
    activo: body.activo === false ? false : true
  };
  const coste = Number(body.precioCosteIvaIncluido);
  if (Number.isFinite(coste) && coste >= 0) nuevo.precioCosteIvaIncluido = coste;
  const dto = Number(body.descuentoPorcentaje);
  if (Number.isFinite(dto) && dto > 0) nuevo.descuentoPorcentaje = Math.min(100, Math.max(0, dto));
  const intencion = String(body.intencion ?? "").trim();
  if (intencion) nuevo.intencion = intencion;
  const pqs = String(body.paraQueSirve ?? "").trim();
  if (pqs) nuevo.paraQueSirve = pqs;
  const cu = String(body.comoUsar ?? "").trim();
  if (cu) nuevo.comoUsar = cu;
  const nt = Number(body.nombreTamano);
  if (Number.isFinite(nt)) nuevo.nombreTamano = nt;
  const nc = String(body.nombreColor ?? "").trim();
  if (nc) nuevo.nombreColor = nc;
  const ne = String(body.nombreEstilo ?? "").trim();
  if (ne === "normal" || ne === "italic" || ne === "bold") nuevo.nombreEstilo = ne;
  if (subcategoriaId) nuevo.subcategoriaId = subcategoriaId;
  const generoJoya = String(body.generoJoya ?? "").trim();
  if (["hombre", "mujer", "unisex"].includes(generoJoya)) nuevo.generoJoya = generoJoya;
  const acabadoJoya = String(body.acabadoJoya ?? "").trim();
  if (["oro", "acero"].includes(acabadoJoya)) nuevo.acabadoJoya = acabadoJoya;
  list.push(nuevo);
  await writeProductos(list);
  res.status(201).json(nuevo);
});

productosRouter.put("/admin/productos/:id", usuariosAccessMiddleware, async (req, res) => {
  const rawId = Number(req.params.id);
  if (!Number.isInteger(rawId) || rawId <= 0) {
    res.status(400).json({ error: "Id inválido" });
    return;
  }
  const list = await readProductos();
  const idx = list.findIndex((p) => Number(p?.id) === rawId);
  if (idx === -1) {
    res.status(404).json({ error: "No encontrado" });
    return;
  }
  const body = req.body ?? {};
  const prev = list[idx];
  const cat =
    body.categoria !== undefined && body.categoria !== null
      ? String(body.categoria).trim()
      : prev.categoria;
  if (!categoriaProductoValida(cat)) {
    res.status(400).json({ error: `Categoría inválida (vacía o demasiado larga)` });
    return;
  }
  const nombre =
    body.nombre !== undefined && body.nombre !== null
      ? String(body.nombre).trim()
      : prev.nombre;
  if (!nombre) {
    res.status(400).json({ error: "Nombre inválido" });
    return;
  }
  const precio = body.precio !== undefined ? Number(body.precio) : prev.precio;
  if (!Number.isFinite(precio)) {
    res.status(400).json({ error: "Precio inválido" });
    return;
  }
  const stock =
    body.stock !== undefined ? Math.max(0, Math.floor(Number(body.stock) || 0)) : prev.stock;
  const subcategoriaIdParaImagen =
    body.subcategoriaId !== undefined && body.subcategoriaId !== null
      ? String(body.subcategoriaId).trim()
      : prev.subcategoriaId || "";
  const imagenBruta =
    body.imagen !== undefined && body.imagen !== null
      ? String(body.imagen).trim()
      : prev.imagen;
  const imagen = await guardarImagenSiEsDataUrl(imagenBruta, cat, subcategoriaIdParaImagen, `${nombre}-${rawId}`);
  const descripcion =
    body.descripcion !== undefined && body.descripcion !== null
      ? String(body.descripcion).trim()
      : prev.descripcion;
  let activo = prev.activo !== false;
  if (body.activo === false) activo = false;
  if (body.activo === true) activo = true;
  const merged = {
    ...prev,
    id: rawId,
    categoria: cat,
    nombre,
    precio,
    stock,
    imagen,
    descripcion,
    activo
  };
  if (body.precioCosteIvaIncluido !== undefined && body.precioCosteIvaIncluido !== null) {
    const c = Number(body.precioCosteIvaIncluido);
    if (Number.isFinite(c) && c >= 0) merged.precioCosteIvaIncluido = c;
  }
  if (body.descuentoPorcentaje === null || body.descuentoPorcentaje === "") {
    delete merged.descuentoPorcentaje;
  } else if (body.descuentoPorcentaje !== undefined) {
    const d = Number(body.descuentoPorcentaje);
    if (Number.isFinite(d) && d > 0) merged.descuentoPorcentaje = Math.min(100, Math.max(0, d));
    else delete merged.descuentoPorcentaje;
  }
  if (body.intencion !== undefined) {
    if (body.intencion === null || body.intencion === "") delete merged.intencion;
    else {
      const s = String(body.intencion).trim();
      if (s) merged.intencion = s;
      else delete merged.intencion;
    }
  }
  if (body.paraQueSirve !== undefined) {
    if (body.paraQueSirve === null || body.paraQueSirve === "") delete merged.paraQueSirve;
    else {
      const s = String(body.paraQueSirve).trim();
      if (s) merged.paraQueSirve = s;
      else delete merged.paraQueSirve;
    }
  }
  if (body.comoUsar !== undefined) {
    if (body.comoUsar === null || body.comoUsar === "") delete merged.comoUsar;
    else {
      const s = String(body.comoUsar).trim();
      if (s) merged.comoUsar = s;
      else delete merged.comoUsar;
    }
  }
  if (body.nombreTamano !== undefined) {
    const n = Number(body.nombreTamano);
    if (Number.isFinite(n)) merged.nombreTamano = n;
  }
  if (body.nombreColor !== undefined) {
    const s = String(body.nombreColor ?? "").trim();
    if (s) merged.nombreColor = s;
    else delete merged.nombreColor;
  }
  if (body.nombreEstilo !== undefined) {
    const ne = String(body.nombreEstilo ?? "").trim();
    if (ne === "normal" || ne === "italic" || ne === "bold") merged.nombreEstilo = ne;
    else delete merged.nombreEstilo;
  }
  if (body.subcategoriaId !== undefined) {
    const s = String(body.subcategoriaId ?? "").trim();
    if (s) merged.subcategoriaId = s;
    else delete merged.subcategoriaId;
  }
  if (body.generoJoya !== undefined) {
    const s = String(body.generoJoya ?? "").trim();
    if (["hombre", "mujer", "unisex"].includes(s)) merged.generoJoya = s;
    else delete merged.generoJoya;
  }
  if (body.acabadoJoya !== undefined) {
    const s = String(body.acabadoJoya ?? "").trim();
    if (["oro", "acero"].includes(s)) merged.acabadoJoya = s;
    else delete merged.acabadoJoya;
  }
  list[idx] = merged;
  await writeProductos(list);
  res.json(merged);
});

/** Baja lógica: activo = false (no se elimina el registro). */
productosRouter.delete("/admin/productos/:id", usuariosAccessMiddleware, async (req, res) => {
  const rawId = Number(req.params.id);
  if (!Number.isInteger(rawId) || rawId <= 0) {
    res.status(400).json({ error: "Id inválido" });
    return;
  }
  const list = await readProductos();
  const idx = list.findIndex((p) => Number(p?.id) === rawId);
  if (idx === -1) {
    res.status(404).json({ error: "No encontrado" });
    return;
  }
  list[idx] = { ...list[idx], activo: false };
  await writeProductos(list);
  res.json({ ok: true, producto: list[idx] });
});
