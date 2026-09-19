import { afterAll, beforeAll, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import request from "supertest";
import { app, ensureStorage } from "../app.js";
import { ADMIN_PANEL_PASSWORD } from "../lib/env.js";
import { readSugerencias, readUsuarios, writeSugerencias, writeUsuarios } from "../lib/storage.js";

const USER_ID = `sugerencias-test-${Date.now()}`;
const USER_EMAIL = `${USER_ID}@maika.test`;
const SUGERENCIA_MENSAJE = "Añadir un filtro por aroma en la tienda";

let sessionCookie = "";
let sugerenciasIniciales = [];

async function leerGuardadaPorId(id) {
  const lista = await readSugerencias();
  return lista.find((s) => s.id === id);
}

describe.sequential("Sugerencias y mejoras API", () => {
  beforeAll(async () => {
    await ensureStorage();
    sugerenciasIniciales = await readSugerencias();
    const usuarios = await readUsuarios();
    if (!usuarios.some((u) => String(u?.id) === USER_ID)) {
      usuarios.push({ id: USER_ID, email: USER_EMAIL, tokenVersion: 0, verificado: true });
      await writeUsuarios(usuarios);
    }
    sessionCookie = `maika_session=${jwt.sign(
      { id: USER_ID, email: USER_EMAIL, tokenVersion: 0 },
      process.env.JWT_SECRET
    )}`;
  });

  afterAll(async () => {
    const usuarios = await readUsuarios();
    await writeUsuarios(usuarios.filter((u) => String(u?.id) !== USER_ID));
    await writeSugerencias(sugerenciasIniciales);
  });

  it("rechaza una petición directa sin autenticación", async () => {
    const res = await request(app).post("/sugerencias").send({
      tipo: "Web / diseño",
      mensaje: SUGERENCIA_MENSAJE
    });
    expect(res.status).toBe(401);
  });

  it("rechaza una sesión limitada de checkout aunque exista la cuenta", async () => {
    const checkoutCookie = `maika_session=${jwt.sign(
      { id: USER_ID, email: USER_EMAIL, tokenVersion: 0, scope: "checkout" },
      process.env.JWT_SECRET
    )}`;
    const res = await request(app)
      .post("/sugerencias")
      .set("Cookie", checkoutCookie)
      .send({ tipo: "Web / diseño", mensaje: SUGERENCIA_MENSAJE });
    expect(res.status).toBe(403);
  });

  it("guarda la sugerencia con la identidad del JWT e ignora identidad arbitraria del body", async () => {
    const res = await request(app)
      .post("/sugerencias")
      .set("Cookie", sessionCookie)
      .send({
        tipo: "Tienda / productos",
        mensaje: SUGERENCIA_MENSAJE,
        userId: "usuario-falso",
        email: "falso@example.com",
        telefono: "600000000"
      });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    const guardada = await leerGuardadaPorId(res.body.id);
    expect(guardada).toMatchObject({
      tipo: "Tienda / productos",
      mensaje: SUGERENCIA_MENSAJE,
      usuarioId: USER_ID,
      estado: "pendiente"
    });
    expect(guardada.userId).toBeUndefined();
    expect(guardada.email).toBeUndefined();
    expect(guardada.telefono).toBeUndefined();
  });

  it("rechaza sugerencias vacías o sin tipo válido con sesión", async () => {
    const agent = request.agent(app);
    agent.set("Cookie", sessionCookie);

    const vacia = await agent.post("/sugerencias").send({ tipo: "Web / diseño", mensaje: "   " });
    expect(vacia.status).toBe(400);

    const tipoInvalido = await agent.post("/sugerencias").send({ tipo: "Otro", mensaje: "Texto válido" });
    expect(tipoInvalido.status).toBe(400);
  });

  it("expone el usuarioId en administración sin endpoint público de lectura", async () => {
    const creada = await request(app)
      .post("/sugerencias")
      .set("Cookie", sessionCookie)
      .send({ tipo: "Web / diseño", mensaje: "Mejorar el buscador" });
    expect(creada.status).toBe(201);

    const lecturaPublica = await request(app).get("/sugerencias");
    expect(lecturaPublica.status).toBe(404);

    const admin = request.agent(app);
    const login = await admin.post("/auth/admin-panel-token").send({ password: ADMIN_PANEL_PASSWORD });
    expect(login.status).toBe(200);
    const lista = await admin.get("/admin/sugerencias");
    expect(lista.status).toBe(200);
    const guardada = lista.body.find((s) => s.id === creada.body.id);
    expect(guardada?.usuarioId).toBe(USER_ID);
  });
});
