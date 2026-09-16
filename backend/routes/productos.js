import { Router } from "express";
import { CATEGORIAS_PRODUCTO } from "../lib/env.js";
import {
  readProductos,
  writeProductos,
  updateProductos,
  productoPublicoTienda,
  categoriaProductoValida
} from "../lib/storage.js";
import { usuariosAccessMiddleware } from "../lib/auth.js";
import { guardarImagenSiEsDataUrl } from "../lib/imagenesTienda.js";
import {
  PRODUCT_ENRICHMENT_FIELDS,
  findDuplicateProduct,
  importProductData,
  mergeProductEnrichments
} from "../lib/productImporter.js";

export const productosRouter = Router();

const ENRICHMENT_PUBLIC_FIELD = {
  nombre: "nombre",
  marca: "marca",
  referencia: "referencia",
  sku: "sku",
  ean: "ean",
  peso: "peso",
  cantidad: "cantidadContenido",
  formato: "formato",
  aroma: "aroma",
  origen: "origen",
  fabricante: "fabricante",
  tipoProducto: "tipoProducto",
  ingredientes: "ingredientes",
  dimensiones: "dimensiones",
  duracionAproximada: "duracionAproximada",
  descripcionProveedor: "descripcionProveedor",
  caracteristicas: "caracteristicas",
  modoUsoProveedor: "modoUsoProveedor",
  advertencias: "advertencias",
  imagenes: "imagenes",
  codigoHsTaric: "codigoHsTaric"
};

const ENRICHMENT_ARRAY_FIELDS = new Set(["caracteristicas", "imagenes"]);

function httpError(status, message) {
  return Object.assign(new Error(message), { httpStatus: status });
}

function normalizarCampoPlano(campo, value) {
  if (ENRICHMENT_ARRAY_FIELDS.has(campo)) {
    const arr = (Array.isArray(value) ? value : [value]).map((v) => String(v ?? "").trim()).filter(Boolean);
    return arr.length ? arr : null;
  }
  const s = String(value ?? "").trim();
  return s || null;
}

function mismoValorEnriquecido(a, b) {
  const norm = (x) => (Array.isArray(x) ? x : [x]).map((v) => String(v ?? "").trim().toLowerCase()).sort().join("|");
  return norm(a) === norm(b);
}

/**
 * Vuelca a los campos planos del producto los metadatos del bloque `enriquecimiento`
 * (fuentes, fecha, estado, URL de origen). Los valores de datos solo se copian al aceptar.
 */
function sincronizarCamposEnriquecimiento(producto) {
  const enr = producto.enriquecimiento;
  if (!enr || typeof enr !== "object") return producto;
  producto.fuentesInformacion = Array.isArray(enr.sources) ? enr.sources : [];
  producto.fechaUltimaComprobacion = enr.checkedAt ?? null;
  producto.estadoVerificacion = enr.status ?? "pending";
  const ultimaFuente = producto.fuentesInformacion.at(-1)?.url;
  if (ultimaFuente) producto.urlOrigen = ultimaFuente;
  else if (enr.input?.url) producto.urlOrigen = enr.input.url;
  return producto;
}

/** Estado global tras una revisión: conflicto/error → needs_review; encontrados pendientes → imported; todo revisado con ≥1 aceptado → verified. */
function recomputarEstadoEnriquecimiento(enr) {
  const fields = Object.values(enr?.fields ?? {});
  if (enr?.fetchError || fields.some((f) => f?.status === "conflict")) return "needs_review";
  if (fields.some((f) => f?.status === "found")) return "imported";
  if (fields.some((f) => f?.status === "accepted")) return "verified";
  return "needs_review";
}

function parseProductoIdParam(param) {
  const rawId = Number(param);
  if (!Number.isInteger(rawId) || rawId <= 0) throw httpError(400, "Id inválido");
  return rawId;
}

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
  const duplicate = findDuplicateProduct(list, {
    nombre,
    marca: body.marca,
    referencia: body.referencia,
    sku: body.sku,
    ean: body.ean,
    peso: body.peso,
    urlOrigen: body.urlOrigen
  });
  if (duplicate) {
    res.status(409).json({
      error: `Ya existe un producto equivalente (${duplicate.matchedBy})`,
      existingProductId: duplicate.product.id,
      matchedBy: duplicate.matchedBy
    });
    return;
  }
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
  for (const campo of PRODUCT_ENRICHMENT_FIELDS) {
    const plano = ENRICHMENT_PUBLIC_FIELD[campo];
    if (body[plano] === undefined || body[plano] === null) continue;
    const v = normalizarCampoPlano(campo, body[plano]);
    if (v != null) nuevo[plano] = v;
  }
  const urlOrigen = String(body.urlOrigen ?? "").trim();
  if (urlOrigen) nuevo.urlOrigen = urlOrigen;
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
  for (const campo of PRODUCT_ENRICHMENT_FIELDS) {
    const plano = ENRICHMENT_PUBLIC_FIELD[campo];
    if (body[plano] === undefined) continue;
    const v = normalizarCampoPlano(campo, body[plano]);
    if (v == null) delete merged[plano];
    else merged[plano] = v;
  }
  if (body.urlOrigen !== undefined) {
    const s = String(body.urlOrigen ?? "").trim();
    if (s) merged.urlOrigen = s;
    else delete merged.urlOrigen;
  }
  const identidadTocada = ["ean", "referencia", "sku", "urlOrigen", "marca", "nombre", "peso"].some(
    (k) => body[k] !== undefined
  );
  if (identidadTocada) {
    const duplicado = findDuplicateProduct(list, merged, rawId);
    if (duplicado) {
      res.status(409).json({
        error: `La identidad coincide con el producto ${duplicado.product.id} (${duplicado.matchedBy})`,
        existingProductId: duplicado.product.id,
        matchedBy: duplicado.matchedBy
      });
      return;
    }
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

/**
 * Admin: lanza el importador con la URL/EAN indicados (o los ya guardados en el producto)
 * y fusiona los candidatos con lo ya revisado. La consulta HTTP se hace fuera del lock.
 * Solo se permite enriquecer productos de la categoría Inciensos.
 */
productosRouter.post("/admin/productos/:id/enriquecer", usuariosAccessMiddleware, async (req, res) => {
  try {
    const rawId = parseProductoIdParam(req.params.id);
    const list = await readProductos();
    const actual = list.find((p) => Number(p.id) === rawId);
    if (!actual) throw httpError(404, "No encontrado");
    if (actual.categoria !== "inciensos") {
      throw httpError(400, "El enriquecimiento automático solo está disponible para productos de la categoría Inciensos");
    }
    const body = req.body ?? {};
    const resultado = await importProductData({
      nombre: body.nombre ?? actual.nombre,
      marca: body.marca ?? actual.marca,
      ean: body.ean ?? actual.ean,
      url: body.url ?? actual.urlOrigen,
      sourceType: body.sourceType
    });
    const actualizado = await updateProductos((productos) => {
      const idx = productos.findIndex((p) => Number(p.id) === rawId);
      if (idx === -1) throw httpError(404, "No encontrado");
      const fusion = mergeProductEnrichments(productos[idx].enriquecimiento, resultado);
      fusion.status = recomputarEstadoEnriquecimiento(fusion);
      productos[idx].enriquecimiento = fusion;
      sincronizarCamposEnriquecimiento(productos[idx]);
      return productos[idx];
    });
    res.json(actualizado);
  } catch (e) {
    if (e?.httpStatus) {
      res.status(e.httpStatus).json({ error: e.message });
      return;
    }
    res.status(500).json({ error: "No se pudo enriquecer el producto" });
  }
});

/**
 * Admin: revisión humana de un campo importado.
 * `accept` (con sourceUrl/value si hay conflicto), `correct` (valor manual) o `reject`.
 * Aceptar/corregir copia el valor al campo plano del producto, que es lo único que se expone en tienda.
 * Solo se permite en productos de la categoría Inciensos.
 */
productosRouter.patch("/admin/productos/:id/enriquecimiento/:campo", usuariosAccessMiddleware, async (req, res) => {
  try {
    const rawId = parseProductoIdParam(req.params.id);
    const campo = String(req.params.campo ?? "");
    if (!PRODUCT_ENRICHMENT_FIELDS.includes(campo)) throw httpError(400, "Campo de enriquecimiento desconocido");
    const action = String(req.body?.action ?? "");
    if (!["accept", "reject", "correct"].includes(action)) {
      throw httpError(400, "Acción inválida (accept | reject | correct)");
    }
    const plano = ENRICHMENT_PUBLIC_FIELD[campo];
    const actualizado = await updateProductos((productos) => {
      const idx = productos.findIndex((p) => Number(p.id) === rawId);
      if (idx === -1) throw httpError(404, "No encontrado");
      const producto = productos[idx];
      if (producto.categoria !== "inciensos") {
        throw httpError(400, "El enriquecimiento automático solo está disponible para productos de la categoría Inciensos");
      }
      const enr = producto.enriquecimiento;
      if (!enr || typeof enr !== "object" || !enr.fields) {
        throw httpError(400, "El producto no tiene datos importados; ejecuta primero el enriquecimiento");
      }
      const datum = enr.fields[campo];
      if (!datum) throw httpError(400, "Campo sin dato importado");
      if (datum.status === "not_found" && action !== "correct") {
        throw httpError(400, "Ese campo no tiene candidato importado");
      }
      if (action === "reject") {
        const eraAceptado = datum.status === "accepted";
        datum.status = "rejected";
        datum.hasContradiction = false;
        if (eraAceptado && producto[plano] !== undefined) delete producto[plano];
      } else if (action === "accept") {
        if (datum.status === "conflict") {
          const alternativas = Array.isArray(datum.alternatives) ? datum.alternatives : [];
          const wantedUrl = String(req.body?.sourceUrl ?? "").trim();
          const wanted = wantedUrl
            ? alternativas.find((a) => a?.source === wantedUrl)
            : alternativas.find((a) => mismoValorEnriquecido(a?.value, req.body?.value));
          if (!wanted) throw httpError(400, "Indica sourceUrl o value de la alternativa a aceptar");
          datum.value = wanted.value;
          datum.source = wanted.source;
          datum.sourceType = wanted.sourceType;
          datum.confidence = wanted.confidence;
        }
        datum.status = "accepted";
        datum.hasContradiction = false;
        delete datum.alternatives;
        producto[plano] = datum.value;
      } else {
        const v = normalizarCampoPlano(campo, req.body?.value);
        if (v == null) throw httpError(400, "Valor corregido vacío");
        datum.value = v;
        datum.source = null;
        datum.sourceType = "other";
        datum.confidence = "high";
        datum.status = "accepted";
        datum.correctedByAdmin = true;
        datum.hasContradiction = false;
        delete datum.alternatives;
        producto[plano] = v;
      }
      enr.status = recomputarEstadoEnriquecimiento(enr);
      sincronizarCamposEnriquecimiento(producto);
      return producto;
    });
    res.json(actualizado);
  } catch (e) {
    if (e?.httpStatus) {
      res.status(e.httpStatus).json({ error: e.message });
      return;
    }
    res.status(500).json({ error: "No se pudo actualizar el dato" });
  }
});
