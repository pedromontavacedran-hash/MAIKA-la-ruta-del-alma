import { promises as fs } from "node:fs";
import path from "node:path";
import {
  dataDir,
  pedidosFile,
  idempotenciaPedidosFile,
  idempotenciaPerfilFile,
  carritosFile,
  usuariosFile,
  productosFile,
  categoriasFile,
  subcategoriasFile,
  CATEGORIAS_PRODUCTO,
  IDEMPOTENCIA_TTL_MS,
  IDEMPOTENCIA_PRUNE_INTERVAL_MS,
  IDEMPOTENCIA_MAX_KEYS,
  IDEMPOTENCIA_INFLIGHT_TTL_MS
} from "./env.js";
import { esEmailVerificable, normalizarTelefono } from "./validacion.js";
import { crearCarpetaCategoria, crearCarpetaSubcategoria } from "./imagenesTienda.js";

const CATEGORIAS_DEFAULT = [
  { id: "velas", nombre: "velas" },
  { id: "inciensos", nombre: "inciensos" },
  { id: "figuras", nombre: "figuras" },
  { id: "kits", nombre: "kits" },
  { id: "joyas", nombre: "joyería del alma" }
];

const SUBCATEGORIAS_DEFAULT = [
  { id: "collares", categoriaId: "joyas", nombre: "Collares" },
  { id: "colgantes-amuletos", categoriaId: "joyas", nombre: "Colgantes y Amuletos" },
  { id: "pulseras", categoriaId: "joyas", nombre: "Pulseras" },
  { id: "anillos", categoriaId: "joyas", nombre: "Anillos" },
  { id: "pendientes", categoriaId: "joyas", nombre: "Pendientes" }
];

export async function ensureStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(pedidosFile);
  } catch {
    await fs.writeFile(pedidosFile, "[]", "utf8");
  }
  try {
    await fs.access(idempotenciaPedidosFile);
  } catch {
    await fs.writeFile(idempotenciaPedidosFile, "{}", "utf8");
  }
  try {
    await fs.access(idempotenciaPerfilFile);
  } catch {
    await fs.writeFile(idempotenciaPerfilFile, "{}", "utf8");
  }
  try {
    await fs.access(carritosFile);
  } catch {
    await fs.writeFile(carritosFile, "[]", "utf8");
  }
  try {
    await fs.access(usuariosFile);
  } catch {
    await fs.writeFile(usuariosFile, "[]", "utf8");
  }
  try {
    await fs.access(productosFile);
  } catch {
    await fs.writeFile(productosFile, "[]", "utf8");
  }
  try {
    await fs.access(categoriasFile);
  } catch {
    await fs.writeFile(categoriasFile, JSON.stringify(CATEGORIAS_DEFAULT, null, 2), "utf8");
    // Solo la primera vez (archivo recién creado): carpetas en public/tienda/ para las categorías base.
    for (const c of CATEGORIAS_DEFAULT) await crearCarpetaCategoria(c.id);
  }
  try {
    await fs.access(subcategoriasFile);
  } catch {
    await fs.writeFile(subcategoriasFile, JSON.stringify(SUBCATEGORIAS_DEFAULT, null, 2), "utf8");
    for (const s of SUBCATEGORIAS_DEFAULT) await crearCarpetaSubcategoria(s.categoriaId, s.id);
  }
}

export async function readPedidos() {
  await ensureStorage();
  try {
    const raw = await fs.readFile(pedidosFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writePedidos(pedidos) {
  await ensureStorage();
  await fs.writeFile(pedidosFile, JSON.stringify(pedidos, null, 2), "utf8");
}

async function writeJsonFileAtomic(file, data) {
  const tmpFile = `${file}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmpFile, file);
}

function pruneIdempotenciaStore(store) {
  const now = Date.now();
  let changed = false;
  let removedCount = 0;
  const safe = store && typeof store === "object" && !Array.isArray(store) ? store : {};
  for (const key of Object.keys(safe)) {
    const entry = safe[key];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      delete safe[key];
      changed = true;
      removedCount += 1;
      continue;
    }
    if (!Number.isFinite(Number(entry.createdAt))) {
      if (!Object.prototype.hasOwnProperty.call(entry, "response") && Object.prototype.hasOwnProperty.call(entry, "usuarioId")) {
        safe[key] = { usuarioId: String(entry.usuarioId || ""), response: entry, createdAt: now };
        changed = true;
        continue;
      }
      entry.createdAt = now;
      changed = true;
      continue;
    }
    if (now - Number(entry.createdAt) > IDEMPOTENCIA_TTL_MS) {
      delete safe[key];
      changed = true;
      removedCount += 1;
    }
  }

  const keys = Object.keys(safe);
  if (keys.length > IDEMPOTENCIA_MAX_KEYS) {
    const keysOrdenadas = keys.sort((a, b) => Number(safe[a]?.createdAt || 0) - Number(safe[b]?.createdAt || 0));
    const sobrantes = keysOrdenadas.slice(0, keys.length - IDEMPOTENCIA_MAX_KEYS);
    for (const key of sobrantes) {
      delete safe[key];
      changed = true;
      removedCount += 1;
    }
  }

  return { store: safe, changed, removedCount };
}

const _idempotenciaLastPruneByFile = new Map();
const _fileLocksByFile = new Map();
const _idempotenciaFlightsByKey = new Map();

function shouldPruneIdempotencia(file, force) {
  if (force) return true;
  const now = Date.now();
  const lastPrune = Number(_idempotenciaLastPruneByFile.get(file) || 0);
  if (now - lastPrune <= IDEMPOTENCIA_PRUNE_INTERVAL_MS) return false;
  _idempotenciaLastPruneByFile.set(file, now);
  return true;
}

function logIdempotenciaPruned(file, removedCount) {
  if (removedCount <= 0 || process.env.MAIKA_QUIET === "1") return;
   
  console.log("[idempotencia] pruned:", path.basename(file), removedCount);
}

function logIdempotenciaInflightHit(file) {
  if (process.env.MAIKA_QUIET === "1") return;
   
  console.log("[idempotencia] inflight hit:", path.basename(file));
}

export function responseIdempotencia(cached) {
  return cached && typeof cached === "object" && "response" in cached ? cached.response : cached;
}

export function usuarioIdIdempotencia(cached) {
  if (!cached || typeof cached !== "object") return "";
  return String(cached.usuarioId || (cached.response && cached.response.usuarioId) || "");
}

export function idempotencyConflictBody() {
  return {
    error: "IDEMPOTENCY_CONFLICT",
    message: "Idempotency-Key en uso por otro usuario"
  };
}

function withFileLock(file, fn) {
  const previous = _fileLocksByFile.get(file) || Promise.resolve();
  const run = previous.catch(() => {}).then(fn);
  _fileLocksByFile.set(file, run.catch(() => {}));
  return run;
}

export function withIdempotenciaKeyFlight(file, idemKey, usuarioId, fn) {
  if (!idemKey) return fn();
  const flightKey = `${file}:${idemKey}`;
  const current = _idempotenciaFlightsByKey.get(flightKey);
  if (current) {
    if (Date.now() - Number(current.createdAt || 0) > IDEMPOTENCIA_INFLIGHT_TTL_MS) {
      _idempotenciaFlightsByKey.delete(flightKey);
    } else if (String(current.usuarioId || "") !== String(usuarioId || "")) {
      return Promise.resolve({
        status: 409,
        body: idempotencyConflictBody()
      });
    } else {
      logIdempotenciaInflightHit(file);
      return current.promise;
    }
  }
  const promise = Promise.resolve().then(fn).finally(() => {
    const latest = _idempotenciaFlightsByKey.get(flightKey);
    if (latest?.promise === promise) _idempotenciaFlightsByKey.delete(flightKey);
  });
  _idempotenciaFlightsByKey.set(flightKey, { usuarioId, promise, createdAt: Date.now() });
  return promise;
}

async function readIdempotenciaMapUnsafe(file) {
  await ensureStorage();
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    if (!shouldPruneIdempotencia(file, false)) {
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    }
    const { store, changed, removedCount } = pruneIdempotenciaStore(parsed);
    logIdempotenciaPruned(file, removedCount);
    if (changed) await writeJsonFileAtomic(file, store);
    return store;
  } catch {
    return {};
  }
}

async function writeIdempotenciaMapUnsafe(file, map) {
  await ensureStorage();
  const { store, removedCount } = pruneIdempotenciaStore(map);
  _idempotenciaLastPruneByFile.set(file, Date.now());
  logIdempotenciaPruned(file, removedCount);
  await writeJsonFileAtomic(file, store);
}

async function readIdempotenciaMap(file) {
  return withFileLock(file, () => readIdempotenciaMapUnsafe(file));
}

async function updateIdempotenciaMap(file, update) {
  return withFileLock(file, async () => {
    const store = await readIdempotenciaMapUnsafe(file);
    const nextStore = (await update(store)) || store;
    await writeIdempotenciaMapUnsafe(file, nextStore);
    return nextStore;
  });
}

export async function readIdempotenciaPedidos() {
  return readIdempotenciaMap(idempotenciaPedidosFile);
}

export async function updateIdempotenciaPedidos(update) {
  return updateIdempotenciaMap(idempotenciaPedidosFile, update);
}

export async function readIdempotenciaPerfil() {
  return readIdempotenciaMap(idempotenciaPerfilFile);
}

export async function updateIdempotenciaPerfil(update) {
  return updateIdempotenciaMap(idempotenciaPerfilFile, update);
}

export async function readCarritos() {
  await ensureStorage();
  try {
    const raw = await fs.readFile(carritosFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeCarritos(carritos) {
  await ensureStorage();
  await fs.writeFile(carritosFile, JSON.stringify(carritos, null, 2), "utf8");
}

function sanearUsuario(user) {
  const email = String(user?.email || "").trim().toLowerCase();
  const verificado = esEmailVerificable(email) && !!user?.verificado;
  const tokenVersionRaw = Number(user?.tokenVersion);
  const tokenVersion = Number.isFinite(tokenVersionRaw) && tokenVersionRaw >= 0
    ? Math.floor(tokenVersionRaw)
    : 0;
  return {
    ...user,
    email,
    verificado,
    tokenVersion
  };
}

function usuarioRequiereMigracionSanear(u) {
  const s = sanearUsuario(u);
  return s.email !== u.email || s.verificado !== u.verificado || s.tokenVersion !== u.tokenVersion;
}

/** [UNICIDAD PATCH] True si hay otro usuario (id distinto) con el mismo teléfono normalizado. */
export function otroUsuarioTieneTelefono(usuarios, telNorm, excludeId) {
  if (!telNorm) return false;
  const ex = String(excludeId ?? "").trim();
  return usuarios.some(
    (u) => String(u?.id ?? "").trim() !== ex && normalizarTelefono(String(u?.telefono || "")) === telNorm
  );
}

/** [UNICIDAD PATCH] True si hay otro usuario (id distinto) con el mismo email normalizado. */
export function otroUsuarioTieneEmail(usuarios, emailNorm, excludeId) {
  if (!emailNorm) return false;
  const ex = String(excludeId ?? "").trim();
  const e = String(emailNorm).trim().toLowerCase();
  return usuarios.some(
    (u) => String(u?.id ?? "").trim() !== ex && String(u?.email || "").trim().toLowerCase() === e
  );
}

/** Respuesta pública (sin password) para listados y PATCH. */
export function usuarioPublicoPerfil(u) {
  if (!u) {
    return {
      id: "",
      email: "",
      telefono: "",
      nombre: "",
      dni: "",
      direccion: "",
      calle: "",
      numero: "",
      bloque: "",
      escalera: "",
      piso: "",
      puerta: "",
      cp: "",
      poblacion: "",
      provincia: "",
      pais: "",
      direccionPredeterminadaId: "",
      direcciones: [],
      verificado: false,
      mustChangePassword: false,
      hasPassword: false,
      bloqueado: false,
      bloqueadoMotivo: "",
      bloqueadoEn: ""
    };
  }
  return {
    id: u.id,
    email: u.email || "",
    telefono: u.telefono || "",
    nombre: u.nombre || "",
    dni: String(u.dni || "").trim(),
    direccion: String(u.direccion || "").trim(),
    calle: String(u.calle || "").trim(),
    numero: String(u.numero || "").trim(),
    bloque: String(u.bloque || "").trim(),
    escalera: String(u.escalera || "").trim(),
    piso: String(u.piso || "").trim(),
    puerta: String(u.puerta || "").trim(),
    cp: String(u.cp || "").trim(),
    poblacion: String(u.poblacion || "").trim(),
    provincia: String(u.provincia || "").trim(),
    pais: String(u.pais || "").trim(),
    direccionPredeterminadaId: String(u.direccionPredeterminadaId || "").trim(),
    direcciones: Array.isArray(u.direcciones) ? u.direcciones : [],
    verificado: !!u.verificado,
    mustChangePassword: !!u.mustChangePassword,
    hasPassword: !!String(u.password || "").trim(),
    bloqueado: !!u.bloqueado,
    bloqueadoMotivo: String(u.bloqueadoMotivo || ""),
    bloqueadoEn: u.bloqueadoEn || ""
  };
}

export async function readProductos() {
  await ensureStorage();
  try {
    const raw = await fs.readFile(productosFile, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p) => p != null && typeof p === "object")
      .map((p) => ({
        ...p,
        id: Number(p.id),
        precio: Number(p.precio),
        stock: Math.max(0, Math.floor(Number(p.stock) || 0)),
        activo: p.activo !== false
      }));
  } catch {
    return [];
  }
}

export async function writeProductos(productos) {
  await ensureStorage();
  const list = Array.isArray(productos) ? productos : [];
  await fs.writeFile(productosFile, JSON.stringify(list, null, 2), "utf8");
}

/**
 * Igual que `updateUsuarios`: lectura + mutación + escritura de `productos.json` en una única
 * sección crítica. Usar para enriquecimiento/revisión, donde dos admins podrían pisarse cambios.
 */
export async function updateProductos(fn) {
  return withFileLock(productosFile, async () => {
    const productos = await readProductos();
    const result = await fn(productos);
    await writeProductos(Array.isArray(result) ? result : productos);
    return result;
  });
}

export async function readCategorias() {
  await ensureStorage();
  try {
    const raw = await fs.readFile(categoriasFile, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...CATEGORIAS_DEFAULT];
    const list = parsed
      .filter((c) => c != null && typeof c === "object" && c.id && c.nombre)
      .map((c) => {
        const imagen = typeof c.imagen === "string" && c.imagen.trim() ? c.imagen.trim() : undefined;
        return imagen ? { id: String(c.id), nombre: String(c.nombre), imagen } : { id: String(c.id), nombre: String(c.nombre) };
      });
    return list.length > 0 ? list : [...CATEGORIAS_DEFAULT];
  } catch {
    return [...CATEGORIAS_DEFAULT];
  }
}

export async function writeCategorias(categorias) {
  await ensureStorage();
  const list = Array.isArray(categorias) ? categorias : [];
  await fs.writeFile(categoriasFile, JSON.stringify(list, null, 2), "utf8");
}

export async function readSubcategorias() {
  await ensureStorage();
  try {
    const raw = await fs.readFile(subcategoriasFile, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...SUBCATEGORIAS_DEFAULT];
    return parsed
      .filter((s) => s != null && typeof s === "object" && s.id && s.categoriaId && s.nombre)
      .map((s) => ({
        id: String(s.id),
        categoriaId: String(s.categoriaId),
        nombre: String(s.nombre),
        ...(s.padreSubcategoriaId ? { padreSubcategoriaId: String(s.padreSubcategoriaId) } : {})
      }));
  } catch {
    return [...SUBCATEGORIAS_DEFAULT];
  }
}

export async function writeSubcategorias(subcategorias) {
  await ensureStorage();
  const list = Array.isArray(subcategorias) ? subcategorias : [];
  await fs.writeFile(subcategoriasFile, JSON.stringify(list, null, 2), "utf8");
}

/**
 * `CATEGORIAS_PRODUCTO` son las categorías base con estado propio en el frontend.
 * Cualquier otra categoría no vacía y de longitud razonable es válida: la crea el admin
 * desde "Añadir categoría" (autenticado, se confía en el slug que genera el frontend).
 */
export function categoriaProductoValida(c) {
  const s = String(c || "").trim();
  if (CATEGORIAS_PRODUCTO.includes(s)) return true;
  return s.length > 0 && s.length <= 60;
}

/**
 * Respuesta pública: sin `activo` (solo se listan activos), sin coste, sin `enriquecimiento`
 * (candidatos importados sin revisar: solo administración) y sin metadatos de trazabilidad
 * (`urlOrigen`, `fuentesInformacion`, `estadoVerificacion`): la fuente se mantiene interna.
 * Los campos planos aprobados (marca, aroma, peso…) sí se exponen porque solo se escriben
 * tras aceptación/manual.
 */
export function productoPublicoTienda(p) {
  const {
    activo: _a,
    precioCosteIvaIncluido: _c,
    enriquecimiento: _e,
    urlOrigen: _u,
    fuentesInformacion: _f,
    estadoVerificacion: _v,
    fechaUltimaComprobacion: _fc,
    ...rest
  } = p;
  return rest;
}

function extraerLineasStockPedido(pedido) {
  const items = Array.isArray(pedido?.items) ? pedido.items : [];
  const lineas = [];
  for (const it of items) {
    const rawId = it?.id != null ? it.id : it?.idProducto;
    const id = Number(rawId);
    const qty = Math.floor(Number(it?.cantidad) || 0);
    if (!Number.isFinite(id) || id <= 0 || qty <= 0) continue;
    lineas.push({ id, qty });
  }
  return lineas;
}

/**
 * Descuenta stock en productos.json antes de guardar el pedido.
 * Lectura + comprobación + escritura van dentro de `withFileLock(productosFile, ...)`: serializa las
 * confirmaciones de pedido de cualquier cliente sobre este archivo, para que cada una vea siempre el
 * stock ya actualizado por la anterior antes de decidir (evita sobreventa con compras simultáneas).
 * @returns {{ ok: true, rollbackJson: string | null } | { ok: false, code: string, message: string, rollbackJson: null }}
 */
export async function aplicarDescuentoStockPedido(pedido) {
  const lineas = extraerLineasStockPedido(pedido);
  if (lineas.length === 0) {
    if (Array.isArray(pedido?.items) && pedido.items.length > 0) {
      return {
        ok: false,
        code: "ITEMS_INVALIDOS",
        message: "Los ítems del pedido no tienen id/cantidad válidos",
        rollbackJson: null
      };
    }
    return { ok: true, rollbackJson: null };
  }
  return withFileLock(productosFile, async () => {
    const productos = await readProductos();
    const rollbackJson = JSON.stringify(productos);
    const byId = new Map(productos.map((p) => [Number(p.id), { ...p }]));
    for (const { id, qty } of lineas) {
      const p = byId.get(id);
      if (!p) {
        return {
          ok: false,
          code: "PRODUCTO_NO_ENCONTRADO",
          message: `Producto ${id} no encontrado en catálogo`,
          rollbackJson: null
        };
      }
      const cur = Math.max(0, Math.floor(Number(p.stock) || 0));
      if (cur < qty) {
        return {
          ok: false,
          code: "STOCK_INSUFICIENTE",
          message: `Stock insuficiente para «${String(p.nombre || "producto")}» (disponible ${cur}, pedido ${qty})`,
          rollbackJson: null
        };
      }
      p.stock = cur - qty;
    }
    const nuevos = productos.map((row) => {
      const id = Number(row.id);
      const m = byId.get(id);
      return m ? { ...m } : row;
    });
    await writeProductos(nuevos);
    return { ok: true, rollbackJson };
  });
}

export async function restaurarProductosDesdeSnapshotJson(rollbackJson) {
  if (rollbackJson == null || String(rollbackJson).trim() === "") return;
  try {
    const arr = JSON.parse(rollbackJson);
    if (Array.isArray(arr)) await writeProductos(arr);
  } catch {
    /* noop */
  }
}

/** Cache en memoria del listado (invalidada al escribir). Evita leer disco en cada login. */
let _usuariosMem = null;
let _usuariosMemValid = false;

export function invalidateUsuariosCache() {
  _usuariosMemValid = false;
}

export async function readUsuarios() {
  if (_usuariosMemValid && Array.isArray(_usuariosMem)) {
    return _usuariosMem;
  }
  await ensureStorage();
  try {
    const raw = await fs.readFile(usuariosFile, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      _usuariosMem = [];
      _usuariosMemValid = true;
      return [];
    }
    const filas = parsed.filter(
      (u) => u != null && typeof u === "object" && !Array.isArray(u)
    );
    const saneados = filas.map(sanearUsuario);
    // Migración solo si hace falta (evita JSON.stringify de arrays enteros en cada lectura).
    if (filas.some(usuarioRequiereMigracionSanear)) {
      await fs.writeFile(usuariosFile, JSON.stringify(saneados, null, 2), "utf8");
    }
    _usuariosMem = saneados;
    _usuariosMemValid = true;
    return saneados;
  } catch {
    _usuariosMem = [];
    _usuariosMemValid = true;
    return [];
  }
}

export async function writeUsuarios(usuarios) {
  await ensureStorage();
  const saneados = (Array.isArray(usuarios) ? usuarios : []).map(sanearUsuario);
  await fs.writeFile(usuariosFile, JSON.stringify(saneados, null, 2), "utf8");
  _usuariosMem = saneados;
  _usuariosMemValid = true;
}

/**
 * Lee, deja mutar (`fn` recibe el array y lo modifica in place o devuelve uno nuevo) y persiste
 * `usuarios.json` como una única sección crítica: sin esto, dos peticiones concurrentes (dos altas,
 * una activación de cuenta técnica a la vez que un cambio de teléfono, etc.) pueden leer el mismo
 * estado, pasar ambas la comprobación de unicidad y pisarse la escritura (lost update).
 * Usar siempre que se lea `usuarios.json` para después escribirlo; para lecturas puras basta `readUsuarios`.
 */
export async function updateUsuarios(fn) {
  return withFileLock(usuariosFile, async () => {
    const usuarios = await readUsuarios();
    const result = await fn(usuarios);
    await writeUsuarios(Array.isArray(result) ? result : usuarios);
    return result;
  });
}
