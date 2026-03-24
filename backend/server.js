import express from "express";
import cors from "cors";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const app = express();
const PORT = Number(process.env.PORT || 3001);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");
const pedidosFile = path.join(dataDir, "pedidos.json");
const carritosFile = path.join(dataDir, "carritos.json");
const usuariosFile = path.join(dataDir, "usuarios.json");
const JWT_SECRET = process.env.JWT_SECRET || "maika_secret";
const EMAIL_VALIDO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEBUG_OPEN_USERS = process.env.DEBUG_OPEN_USERS === "1";

app.use(cors());
app.use(express.json());

async function ensureStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(pedidosFile);
  } catch {
    await fs.writeFile(pedidosFile, "[]", "utf8");
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
}

async function readPedidos() {
  await ensureStorage();
  try {
    const raw = await fs.readFile(pedidosFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writePedidos(pedidos) {
  await ensureStorage();
  await fs.writeFile(pedidosFile, JSON.stringify(pedidos, null, 2), "utf8");
}

async function readCarritos() {
  await ensureStorage();
  try {
    const raw = await fs.readFile(carritosFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function esEmailVerificable(email) {
  return EMAIL_VALIDO_REGEX.test(String(email || "").trim().toLowerCase());
}

function sanearUsuario(user) {
  const email = String(user?.email || "").trim().toLowerCase();
  const verificado = esEmailVerificable(email) && !!user?.verificado;
  return {
    ...user,
    email,
    verificado
  };
}

function normalizarTelefono(telefono) {
  const soloDigitos = String(telefono || "").replace(/\D/g, "").trim();
  if (soloDigitos.startsWith("0034") && soloDigitos.length > 4) return soloDigitos.slice(4);
  if (soloDigitos.startsWith("34") && soloDigitos.length > 9) return soloDigitos.slice(2);
  return soloDigitos;
}

async function writeCarritos(carritos) {
  await ensureStorage();
  await fs.writeFile(carritosFile, JSON.stringify(carritos, null, 2), "utf8");
}

async function readUsuarios() {
  await ensureStorage();
  try {
    const raw = await fs.readFile(usuariosFile, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const saneados = parsed.map(sanearUsuario);
    // Auto-migración silenciosa en backend para datos antiguos inconsistentes.
    if (JSON.stringify(saneados) !== JSON.stringify(parsed)) {
      await fs.writeFile(usuariosFile, JSON.stringify(saneados, null, 2), "utf8");
    }
    return saneados;
  } catch {
    return [];
  }
}

async function writeUsuarios(usuarios) {
  await ensureStorage();
  const saneados = (Array.isArray(usuarios) ? usuarios : []).map(sanearUsuario);
  await fs.writeFile(usuariosFile, JSON.stringify(saneados, null, 2), "utf8");
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) {
    res.status(401).json({ error: "No token" });
    return;
  }
  const token = String(auth).split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "No token" });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}

const usuariosAccessMiddleware = DEBUG_OPEN_USERS
  ? (_req, _res, next) => next()
  : authMiddleware;

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/auth/register", async (req, res) => {
  const { email, password, telefono, nombre } = req.body ?? {};
  const emailNorm = String(email || "").trim().toLowerCase();
  if (!emailNorm || !password) {
    res.status(400).json({ error: "Datos incompletos" });
    return;
  }
  const usuarios = await readUsuarios();
  if (usuarios.find((u) => String(u?.email || "").trim().toLowerCase() === emailNorm)) {
    res.status(400).json({ error: "Usuario ya existe" });
    return;
  }
  const hash = await bcrypt.hash(String(password), 8);
  const nuevo = {
    id: Date.now(),
    email: emailNorm,
    telefono: String(telefono || "").trim(),
    nombre: String(nombre || "").trim(),
    password: hash,
    verificado: true
  };
  usuarios.push(nuevo);
  await writeUsuarios(usuarios);
  res.json({
    ok: true,
    user: { id: nuevo.id, email: nuevo.email, telefono: nuevo.telefono, nombre: nuevo.nombre }
  });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  const emailNorm = String(email || "").trim().toLowerCase();
  const usuarios = await readUsuarios();
  const user = usuarios.find((u) => String(u?.email || "").trim().toLowerCase() === emailNorm);
  if (!user) {
    res.status(404).json({ error: "No encontrado" });
    return;
  }
  const valid = await bcrypt.compare(String(password || ""), String(user.password || ""));
  if (!valid) {
    res.status(401).json({ error: "Password incorrecto" });
    return;
  }
  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      telefono: user.telefono || "",
      nombre: user.nombre || ""
    }
  });
});

app.patch("/auth/password", async (req, res) => {
  const { email, telefono, password } = req.body ?? {};
  const emailNorm = String(email || "").trim().toLowerCase();
  const telNorm = normalizarTelefono(telefono || "");
  const passRaw = String(password || "");
  if (!passRaw) {
    res.status(400).json({ error: "Password requerida" });
    return;
  }
  if (!emailNorm && !telNorm) {
    res.status(400).json({ error: "Email o teléfono requerido" });
    return;
  }

  const usuarios = await readUsuarios();
  const idx = usuarios.findIndex((u) => {
    const emailU = String(u?.email || "").trim().toLowerCase();
    const telU = normalizarTelefono(u?.telefono || "");
    if (emailNorm && emailU === emailNorm) return true;
    if (telNorm && telU === telNorm) return true;
    return false;
  });
  if (idx === -1) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  const hash = await bcrypt.hash(passRaw, 8);
  usuarios[idx] = {
    ...usuarios[idx],
    password: hash
  };
  await writeUsuarios(usuarios);
  res.json({ ok: true });
});

app.get("/me", authMiddleware, async (req, res) => {
  const user = req.user ?? {};
  const usuarios = await readUsuarios();
  const full = usuarios.find((u) => String(u?.id) === String(user.id));
  res.json({
    id: user.id,
    email: user.email,
    telefono: full?.telefono || "",
    nombre: full?.nombre || ""
  });
});

app.get("/usuarios", usuariosAccessMiddleware, async (_req, res) => {
  const usuarios = await readUsuarios();
  const sanitizados = usuarios.map((u) => ({
    id: u?.id,
    email: u?.email || "",
    telefono: u?.telefono || "",
    nombre: u?.nombre || ""
  }));
  res.json(sanitizados);
});

app.get("/pedidos", authMiddleware, async (req, res) => {
  const userId = `user_${String(req.user?.id ?? "").trim()}`;
  if (!String(req.user?.id ?? "").trim()) {
    res.status(401).json({ error: "Token inválido" });
    return;
  }
  const pedidos = await readPedidos();
  const propios = pedidos.filter((p) => String(p?.usuarioId || "") === userId);
  res.json(propios);
});

app.post("/pedidos", authMiddleware, async (req, res) => {
  const pedido = req.body;
  if (!pedido || typeof pedido !== "object") {
    res.status(400).json({ error: "Pedido inválido" });
    return;
  }
  const userId = `user_${String(req.user?.id ?? "").trim()}`;
  if (!String(req.user?.id ?? "").trim()) {
    res.status(401).json({ error: "Token inválido" });
    return;
  }
  const pedidos = await readPedidos();
  const pedidoSeguro = { ...pedido, usuarioId: userId };
  pedidos.unshift(pedidoSeguro);
  await writePedidos(pedidos);
  res.status(201).json(pedidoSeguro);
});

app.patch("/pedidos/:numero/estado", authMiddleware, async (req, res) => {
  const { numero } = req.params;
  const { estado } = req.body ?? {};
  const userId = `user_${String(req.user?.id ?? "").trim()}`;
  if (!String(req.user?.id ?? "").trim()) {
    res.status(401).json({ error: "Token inválido" });
    return;
  }
  if (!estado || !["pendiente", "enviado", "entregado"].includes(estado)) {
    res.status(400).json({ error: "Estado inválido" });
    return;
  }
  const pedidos = await readPedidos();
  const idx = pedidos.findIndex((p) =>
    String(p?.numero) === String(numero) && String(p?.usuarioId || "") === userId
  );
  if (idx === -1) {
    res.status(404).json({ error: "Pedido no encontrado" });
    return;
  }
  pedidos[idx] = { ...pedidos[idx], estado };
  await writePedidos(pedidos);
  res.json(pedidos[idx]);
});

app.get("/carrito/:usuarioId", authMiddleware, async (req, res) => {
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

app.put("/carrito/:usuarioId", authMiddleware, async (req, res) => {
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

ensureStorage().then(() => {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API running on http://localhost:${PORT}`);
  });
});
